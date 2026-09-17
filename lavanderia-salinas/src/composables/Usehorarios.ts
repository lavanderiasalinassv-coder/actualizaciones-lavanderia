import { computed, ref, watch } from 'vue'
import { getEquipo, type UsuarioEquipo } from '@/composables/useEquipo'
import type { UsuarioSesion } from '@/composables/useSesion'
import {
  combinarFechaHoraCentroamerica,
  fechaHoyCentroamerica,
  formatearFechaCentroamerica
} from '@/composables/useFechas'


export interface Empleado {
  id: string 
  nombre: string
  correo: string
  rol: string
  pagoPorHora: number
}

export interface RegistroJornada {
  id: string
  empleadoId: string
  fecha: string // YYYY-MM-DD
  horaEntrada: string | null // ISO
  horaSalida: string | null // ISO
  pagado: boolean
  horasAjustadas?: number
  salidaAutomatica?: boolean
  segmentos?: Array<{
    inicio: string
    fin: string | null
  }>
}

export interface TurnoProgramado {
  id: string
  empleadoId: string
  fecha: string // YYYY-MM-DD
  horaInicio: string // HH:mm
  horaFin: string // HH:mm
  nota?: string
  libre?: boolean
  horaAlmuerzoInicio?: string | null
  horaAlmuerzoFin?: string | null
  /** Si está activo, el empleado puede marcar entrada antes y salida después del horario sin restricción ni cierre automático */
  horasExtra?: boolean
}

export type PeriodoPago = 'semanal' | 'quincenal'

export interface PagoRealizado {
  id: string
  empleadoId: string
  fecha: string // ISO del momento en que se pagó
  monto: number
  horas: number
  registrosIds: string[]
}

export interface EstadoPuntualidad {
  tarde: boolean
  minutos: number
}

export interface EstadoSalida {
  temprano: boolean
  minutos: number
}

export interface VentanaEntrada {
  puedeActivar: boolean
  motivo: string
}

export interface DiaSemana {
  fecha: string
  turno: TurnoProgramado | null
}

export interface NotificacionHorario {
  id: string
  destinatario: 'administrador' | 'usuario'
  empleadoId: string
  empleadoNombre: string
  tipo: 'entrada_tarde' | 'salida' | 'pausa' | 'reanudacion'
  fecha: string
  hora: string
  mensaje: string
  minutos?: number
  leida: boolean
  creadaAt: string
}

const cerrarSegmentosVencidos = () => {
  const hoy = fechaHoy()
  let huboCambios = false

  registros.value.forEach((registro) => {
    const segmentos = registro.segmentos ?? []
    const abierto = segmentos.find((s) => !s.fin)
    if (!abierto) return

    const turnoDelDia = turnos.value.find(
      (t) => t.empleadoId === registro.empleadoId && t.fecha === registro.fecha
    )

    const finTurno = turnoDelDia && !turnoDelDia.libre
      ? new Date(`${registro.fecha}T${turnoDelDia.horaFin}:00`)
      : null
    const ahora = new Date()
    if (registro.fecha === hoy && finTurno && ahora < finTurno) return

    const cierre = finTurno && !Number.isNaN(finTurno.getTime())
      ? finTurno.toISOString()
      : abierto.inicio // sin turno de referencia: no inventar horas

    abierto.fin = new Date(cierre).toISOString()
    registro.horaSalida = registro.horaSalida ?? abierto.fin
    registro.salidaAutomatica = true
    huboCambios = true
  })

  return huboCambios
}

/* ═══════════════════════════ Persistencia (API) ═══════════════════════════ */

import { getApiBaseUrl } from '@/composables/useApiConfig'

const api = async <T>(ruta: string, opciones: RequestInit = {}): Promise<T> => {
  const respuesta = await fetch(`${getApiBaseUrl()}${ruta}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opciones
  })

  if (!respuesta.ok) {
    let mensaje = `Error ${respuesta.status}`
    try {
      const cuerpo = await respuesta.json()
      if (cuerpo?.error) mensaje = cuerpo.error
    } catch {
      // sin body JSON, se usa el mensaje genérico
    }
    throw new Error(mensaje)
  }

  if (respuesta.status === 204) return undefined as T
  return respuesta.json() as Promise<T>
}

/** Pequeño debounce por clave: evita mandar un PUT por cada mutación individual
 *  cuando varias ocurren juntas (ej. programarTurnosSemana empuja 7 turnos seguidos). */
const temporizadores: Record<string, ReturnType<typeof setTimeout>> = {}
const conDebounce = (clave: string, fn: () => void, esperaMs = 250) => {
  if (temporizadores[clave]) clearTimeout(temporizadores[clave])
  temporizadores[clave] = setTimeout(() => {
    delete temporizadores[clave]
    fn()
  }, esperaMs)
}

const cancelarDebounce = (clave: string) => {
  if (!temporizadores[clave]) return
  clearTimeout(temporizadores[clave])
  delete temporizadores[clave]
}

function generarId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function normalizarRegistro(registro: RegistroJornada): RegistroJornada {
  if (Array.isArray(registro.segmentos)) {
    return {
      ...registro,
      segmentos: registro.segmentos
        .filter((segmento) => !!segmento?.inicio)
        .map((segmento) => ({
          inicio: segmento.inicio,
          fin: segmento.fin ?? null,
        })),
    }
  }

  const segmentos =
    registro.horaEntrada || registro.horaSalida
      ? [
          {
            inicio: registro.horaEntrada ?? registro.horaSalida ?? new Date().toISOString(),
            fin: registro.horaSalida ?? null,
          },
        ]
      : []

  return {
    ...registro,
    segmentos,
  }
}

/* ═══════════════════════════ Estado (singleton) ═══════════════════════════ */

const registros = ref<RegistroJornada[]>([])
const turnos = ref<TurnoProgramado[]>([])
const pagos = ref<PagoRealizado[]>([])
const periodoPago = ref<PeriodoPago>('semanal')
const notificaciones = ref<NotificacionHorario[]>([])
const pagoPorHoraConfig = ref<Record<string, number>>({})

const cargando = ref(false)
const error = ref<string | null>(null)
let estadoCargado = false
let watchersInstalados = false

/** Carga inicial (o forzada) del estado completo desde el servidor */
async function cargarHorarios(forzar = false) {
  if (estadoCargado && !forzar) return
  cargando.value = true
  error.value = null
  try {
    const estado = await api<{
      registros: RegistroJornada[]
      turnos: TurnoProgramado[]
      pagos: PagoRealizado[]
      notificaciones: NotificacionHorario[]
      pagoPorHora: Record<string, number>
      periodoPago: PeriodoPago
    }>('/horarios/estado')

    registros.value = estado.registros.map(normalizarRegistro)
    turnos.value = estado.turnos
    pagos.value = estado.pagos
    notificaciones.value = estado.notificaciones
    pagoPorHoraConfig.value = estado.pagoPorHora
    periodoPago.value = estado.periodoPago

    estadoCargado = true
    instalarWatchers()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Error al cargar los horarios.'
    throw err
  } finally {
    cargando.value = false
  }
}

/** Los watchers solo se instalan DESPUÉS de la carga inicial, para no pisar
 *  el estado del servidor con los arreglos vacíos con los que arrancan los refs. */
function instalarWatchers() {
  if (watchersInstalados) return
  watchersInstalados = true

  watch(
    registros,
    (v) => conDebounce('registros', () => {
      api('/horarios/registros', { method: 'PUT', body: JSON.stringify(v) }).catch((err) => {
        console.error('No se pudieron guardar los registros de jornada:', err)
      })
    }),
    { deep: true }
  )

  watch(
    turnos,
    (v) => conDebounce('turnos', () => {
      api('/horarios/turnos', { method: 'PUT', body: JSON.stringify(v) }).catch((err) => {
        console.error('No se pudieron guardar los turnos:', err)
      })
    }),
    { deep: true }
  )

  watch(
    pagos,
    (v) => conDebounce('pagos', () => {
      api('/horarios/pagos', { method: 'PUT', body: JSON.stringify(v) }).catch((err) => {
        console.error('No se pudieron guardar los pagos:', err)
      })
    }),
    { deep: true }
  )

  watch(periodoPago, (v) => {
    api('/horarios/periodo', { method: 'PUT', body: JSON.stringify({ periodo: v }) }).catch((err) => {
      console.error('No se pudo guardar el periodo de pago:', err)
    })
  })

  watch(
    notificaciones,
    (v) => conDebounce('notificaciones', () => {
      api('/horarios/notificaciones', { method: 'PUT', body: JSON.stringify(v) }).catch((err) => {
        console.error('No se pudieron guardar las notificaciones:', err)
      })
    }),
    { deep: true }
  )

  watch(
    pagoPorHoraConfig,
    (v) => conDebounce('pago-por-hora', () => {
      api('/horarios/pago-por-hora', { method: 'PUT', body: JSON.stringify(v) }).catch((err) => {
        console.error('No se pudo guardar el pago por hora:', err)
      })
    }),
    { deep: true }
  )
}

void cargarHorarios().catch(() => {})
async function leerEquipo(): Promise<UsuarioEquipo[]> {
  try {
    return await getEquipo()
  } catch {
    return []
  }
}

const equipoUsuarios = ref<UsuarioEquipo[]>([])

leerEquipo().then((datos) => {
  equipoUsuarios.value = datos
})

const fechaHoy = () => {
  return fechaHoyCentroamerica()
}
const normalizar = (t: string) => t.trim().toLowerCase()

/** Combina "YYYY-MM-DD" + "HH:mm" en un Date real de Centroamérica */
const combinarFechaHora = combinarFechaHoraCentroamerica

const MIN_MS = 60 * 1000
const GRACIA_MIN = 1

/* ═══════════════════════════ Composable ═══════════════════════════ */

export function useHorarios() {
  /** Vuelve a leer el equipo desde la API — llámalo al entrar a la vista */
  const refrescarPersonal = async () => {
    equipoUsuarios.value = await leerEquipo()
  }

  /** El personal de horarios = el equipo real activo + su pago por hora */
  const empleados = computed<Empleado[]>(() =>
    equipoUsuarios.value
      .filter((u) => u.activo !== false)
      .map((u) => ({
        id: u.id,
        nombre: u.nombre,
        correo: u.correo,
        rol: u.rol,
        pagoPorHora: pagoPorHoraConfig.value[u.id] ?? 0,
      }))
  )

  const actualizarPagoPorHora = (empleadoId: string, monto: number) => {
    pagoPorHoraConfig.value[empleadoId] = Math.max(monto, 0)
  }

  const agregarNotificacion = (notificacion: Omit<NotificacionHorario, 'id' | 'creadaAt' | 'leida'>) => {
    notificaciones.value.unshift({
      id: generarId(),
      creadaAt: new Date().toISOString(),
      leida: false,
      ...notificacion,
    })
  }

  const guardarTurnosAhora = async () => {
    cancelarDebounce('turnos')
    await api('/horarios/turnos', {
      method: 'PUT',
      body: JSON.stringify(turnos.value)
    })
  }

  const guardarRegistrosAhora = async () => {
    cancelarDebounce('registros')
    await api('/horarios/registros', {
      method: 'PUT',
      body: JSON.stringify(registros.value)
    })
  }

  /**
   * Encuentra el empleado que corresponde a la cuenta que inició sesión.
   * Compara primero por id (login local con useEquipo) y, si no hay match,
   * por correo (por si el login vino de una API distinta).
   */
  const encontrarEmpleadoPara = (usuario: UsuarioSesion | null): Empleado | null => {
    if (!usuario) return null
    const correoUsuario = usuario.correo ? normalizar(usuario.correo) : ''

    return (
      empleados.value.find((e) => {
        if (usuario.id && e.id === usuario.id) return true
        if (correoUsuario && normalizar(e.correo) === correoUsuario) return true
        return false
      }) ?? null
    )
  }

  /* ---------- Marcaje de entrada / salida (toggle) ---------- */

  const registroDeHoy = (empleadoId: string) =>
    registros.value.find((r) => r.empleadoId === empleadoId && r.fecha === fechaHoy())

  const segmentosDelRegistro = (registro: RegistroJornada | undefined) => registro?.segmentos ?? []

  const segmentoAbiertoDelRegistro = (registro: RegistroJornada | undefined) =>
    [...segmentosDelRegistro(registro)].reverse().find((segmento) => !segmento.fin) ?? null

  const entradaMarcada = (empleadoId: string) => !!segmentoAbiertoDelRegistro(registroDeHoy(empleadoId))
  const salidaMarcada = (empleadoId: string) => {
    const r = registroDeHoy(empleadoId)
    return !!r?.segmentos?.some((segmento) => !!segmento.fin) && !entradaMarcada(empleadoId)
  }

  /** Enciende el toggle de entrada: crea el tramo actual del día o reanuda uno nuevo */
  const registrarEntrada = (empleadoId: string) => {
    const empleado = empleados.value.find((e) => e.id === empleadoId)
    const turno = turnoDeHoyDe(empleadoId).value
    const existente = registroDeHoy(empleadoId)
    const ahora = new Date().toISOString()
    const esPrimerTramo = !existente
    const esReconexion = !!existente && (existente.segmentos?.length ?? 0) > 0

    if (!existente) {
      registros.value.push({
        id: generarId(),
        empleadoId,
        fecha: fechaHoy(),
        horaEntrada: ahora,
        horaSalida: null,
        pagado: false,
        segmentos: [{ inicio: ahora, fin: null }],
      })
    } else {
      existente.horaEntrada = existente.horaEntrada ?? ahora
      existente.horaSalida = null
      existente.salidaAutomatica = false
      existente.segmentos = existente.segmentos ?? []
      const ultimo = existente.segmentos[existente.segmentos.length - 1]
      if (!ultimo || ultimo.fin) {
        existente.segmentos.push({ inicio: ahora, fin: null })
      }
    }

    const registro = registroDeHoy(empleadoId)
    const puntualidad = esPrimerTramo ? estadoPuntualidad(registro, turno) : null
    if (empleado && turno && puntualidad?.tarde) {
      agregarNotificacion({
        destinatario: 'administrador',
        empleadoId,
        empleadoNombre: empleado.nombre,
        tipo: 'entrada_tarde',
        fecha: fechaHoy(),
        hora: registro?.horaEntrada ?? new Date().toISOString(),
        minutos: puntualidad.minutos,
        mensaje: `${empleado.nombre} llegó tarde ${puntualidad.minutos} min al turno de ${turno.horaInicio} - ${turno.horaFin}.`,
      })
      agregarNotificacion({
        destinatario: 'usuario',
        empleadoId,
        empleadoNombre: empleado.nombre,
        tipo: 'entrada_tarde',
        fecha: fechaHoy(),
        hora: registro?.horaEntrada ?? new Date().toISOString(),
        minutos: puntualidad.minutos,
        mensaje: `Tu llegada quedó registrada con ${puntualidad.minutos} min de retraso.`,
      })
    }

    if (empleado && turno && esReconexion) {
      agregarNotificacion({
        destinatario: 'administrador',
        empleadoId,
        empleadoNombre: empleado.nombre,
        tipo: 'reanudacion',
        fecha: fechaHoy(),
        hora: ahora,
        mensaje: `${empleado.nombre} volvió a conectarse al turno de ${turno.horaInicio} - ${turno.horaFin}.`,
      })
      agregarNotificacion({
        destinatario: 'usuario',
        empleadoId,
        empleadoNombre: empleado.nombre,
        tipo: 'reanudacion',
        fecha: fechaHoy(),
        hora: ahora,
        mensaje: 'Volviste a conectarte a tu turno.',
      })
    }
  }

  /** Apaga el toggle de entrada (solo permitido si aún no se marcó salida) */
  const cancelarEntrada = (empleadoId: string) => {
    const r = registroDeHoy(empleadoId)
    if (!r) return
    if (r.horaSalida) return
    const ultimo = [...(r.segmentos ?? [])].reverse().find((segmento) => !segmento.fin) ?? null
    if (ultimo) {
      r.segmentos = (r.segmentos ?? []).filter((segmento) => segmento !== ultimo)
    }
    if ((r.segmentos ?? []).length === 0) {
      r.horaEntrada = null
    }
  }

  /** Enciende el toggle de salida: guarda la hora actual como salida */
  const registrarSalida = (empleadoId: string, automatica = false) => {
    const empleado = empleados.value.find((e) => e.id === empleadoId)
    const r = registroDeHoy(empleadoId)
    const ultimo = segmentoAbiertoDelRegistro(r)
    if (r && ultimo) {
      const ahora = new Date().toISOString()
      const turno = turnoDeHoyDe(empleadoId).value
      const finTurno = turno ? new Date(`${turno.fecha}T${turno.horaFin}:00`).getTime() : 0
      const esPausa = !!turno && !automatica && new Date(ahora).getTime() <= finTurno + MIN_MS
      ultimo.fin = ahora
      r.horaSalida = ahora
      r.salidaAutomatica = automatica
      if (empleado) {
        agregarNotificacion({
          destinatario: 'administrador',
          empleadoId,
          empleadoNombre: empleado.nombre,
          tipo: esPausa ? 'pausa' : 'salida',
          fecha: fechaHoy(),
          hora: r.horaSalida,
          mensaje: automatica
            ? `${empleado.nombre} salió automáticamente a las ${formatearHora(r.horaSalida)}.`
            : esPausa
              ? `${empleado.nombre} se desconectó temporalmente a las ${formatearHora(r.horaSalida)}.`
              : `La salida de ${empleado.nombre} quedó registrada a las ${formatearHora(r.horaSalida)}.`,
        })
        agregarNotificacion({
          destinatario: 'usuario',
          empleadoId,
          empleadoNombre: empleado.nombre,
          tipo: esPausa ? 'pausa' : 'salida',
          fecha: fechaHoy(),
          hora: r.horaSalida,
          mensaje: automatica
            ? 'Tu salida fue registrada automáticamente por horario.'
            : esPausa
              ? 'Tu jornada quedó en pausa temporal.'
              : `Tu salida quedó registrada a las ${formatearHora(r.horaSalida)}.`,
        })
      }
    }
  }

  /** Apaga el toggle de salida (permite corregir una marca) */
  const cancelarSalida = (empleadoId: string) => {
    const r = registroDeHoy(empleadoId)
    const ultimo = [...(r?.segmentos ?? [])].reverse().find((segmento) => !!segmento.fin) ?? null
    if (r && ultimo) {
      ultimo.fin = null
      r.horaSalida = null
      r.salidaAutomatica = false
    }
  }

  /* ---------- Turnos programados (los crea el admin) ---------- */

  const programarTurno = (turno: Omit<TurnoProgramado, 'id'>) => {
    turnos.value.push({ id: generarId(), ...turno })
  }

  const programarTurnosSemana = (turnosSemana: Omit<TurnoProgramado, 'id'>[]) => {
    if (turnosSemana.length === 0) return
    const empleadoId = turnosSemana[0].empleadoId
    const fechas = new Set(turnosSemana.map((t) => t.fecha))
    turnos.value = turnos.value.filter(
      (t) => !(t.empleadoId === empleadoId && fechas.has(t.fecha))
    )
    turnos.value.push(...turnosSemana.map((turno) => ({ id: generarId(), ...turno })))
  }

  const eliminarTurno = (turnoId: string) => {
    turnos.value = turnos.value.filter((t) => t.id !== turnoId)
  }

  const eliminarTurnoGuardado = async (turnoId: string) => {
    cancelarDebounce('turnos')
    await api(`/horarios/turnos/${turnoId}`, { method: 'DELETE' })
    eliminarTurno(turnoId)
  }

  const turnosDe = (empleadoId: string) =>
    computed(() =>
      turnos.value
        .filter((t) => t.empleadoId === empleadoId && t.fecha >= fechaHoy())
        .sort((a, b) => (a.fecha + a.horaInicio).localeCompare(b.fecha + b.horaInicio))
    )

  const proximoTurnoDe = (empleadoId: string) =>
    computed(() => turnosDe(empleadoId).value[0] ?? null)

  const todosLosTurnosFuturos = computed(() =>
    turnos.value
      .filter((t) => t.fecha >= fechaHoy())
      .sort((a, b) => (a.fecha + a.horaInicio).localeCompare(b.fecha + b.horaInicio))
  )

  const turnosDeFecha = (fecha: string) =>
    computed(() =>
      turnos.value
        .filter((t) => t.fecha === fecha)
        .sort((a, b) => (a.horaInicio + a.horaFin).localeCompare(b.horaInicio + b.horaFin))
    )

  /** El turno programado para hoy de este empleado (si existe) */
  const turnoDeHoyDe = (empleadoId: string) =>
    computed(
      () => turnos.value.find((t) => t.empleadoId === empleadoId && t.fecha === fechaHoy()) ?? null
    )

  /** Los 7 días de la semana actual (lunes a domingo) con el turno de cada día, si lo hay */
  const turnosSemanaDe = (empleadoId: string) =>
    computed<DiaSemana[]>(() => {
      const hoy = new Date()
      const diaSemana = hoy.getDay() // 0 = domingo ... 6 = sábado
      const offsetALunes = diaSemana === 0 ? -6 : 1 - diaSemana
      const lunes = new Date(hoy)
      lunes.setHours(0, 0, 0, 0)
      lunes.setDate(hoy.getDate() + offsetALunes)

      const dias: DiaSemana[] = []
      for (let i = 0; i < 7; i++) {
        const d = new Date(lunes)
        d.setDate(lunes.getDate() + i)
        const fechaStr = d.toISOString().slice(0, 10)
        const turno = turnos.value.find((t) => t.empleadoId === empleadoId && t.fecha === fechaStr) ?? null
        dias.push({ fecha: fechaStr, turno })
      }
      return dias
    })

  /* ---------- Ventana de marcaje (1 min antes / auto-cierre 1 min después) ---------- */

  /**
   * Indica si el toggle de entrada puede activarse ahora mismo, según el turno programado
   * para hoy. Si el turno tiene horasExtra, no hay restricción de horario.
   */
  const ventanaEntrada = (turno: TurnoProgramado | null, ahora: Date = new Date()): VentanaEntrada => {
    if (!turno) return { puedeActivar: false, motivo: 'No tienes un turno programado para hoy.' }
    if (turno.libre) return { puedeActivar: false, motivo: 'Hoy estás libre.' }
    if (turno.horasExtra) return { puedeActivar: true, motivo: '' }

    const inicio = combinarFechaHora(turno.fecha, turno.horaInicio)
    const inicioMenosUno = new Date(inicio.getTime() - MIN_MS)
    const finMasUno = new Date(combinarFechaHora(turno.fecha, turno.horaFin).getTime() + MIN_MS)

    if (ahora < inicioMenosUno) {
      return { puedeActivar: false, motivo: `Podrás marcar entrada a partir de las ${turno.horaInicio}.` }
    }
    if (ahora > finMasUno) {
      return { puedeActivar: false, motivo: 'Tu turno de hoy ya terminó.' }
    }
    return { puedeActivar: true, motivo: '' }
  }

  /** Indica si el turno sigue vivo y todavía permite reactivar el toggle. */
  const turnoSigueVigente = (turno: TurnoProgramado | null, ahora: Date = new Date()) => {
    if (!turno) return false
    if (turno.libre) return false
    if (turno.horasExtra) return true
    const finMasUno = new Date(combinarFechaHora(turno.fecha, turno.horaFin).getTime() + MIN_MS)
    return ahora <= finMasUno
  }

  /**
   * Revisa si corresponde cerrar la salida automáticamente (1 min después del fin del turno,
   * solo si el turno no tiene horas extra habilitadas). Se debe llamar periódicamente (p. ej.
   * en el reloj de la vista) pasando la hora actual.
   */
  const verificarAutoSalida = (empleadoId: string, ahora: Date = new Date()) => {
    const turno = turnoDeHoyDe(empleadoId).value
    if (!turno || turno.horasExtra) return
    if (!entradaMarcada(empleadoId)) return

    const finMasUno = new Date(combinarFechaHora(turno.fecha, turno.horaFin).getTime() + MIN_MS)
    if (ahora > finMasUno) {
      registrarSalida(empleadoId, true)
    }
  }

  /* ---------- Puntualidad (llegada tardía / salida temprana) ---------- */

  const estadoPuntualidad = (
    registro: RegistroJornada | undefined,
    turno: TurnoProgramado | null
  ): EstadoPuntualidad | null => {
    if (!registro?.horaEntrada || !turno) return null
    if (turno.libre) return null
    const entradaReal = new Date(registro.horaEntrada)
    const horaProgramada = combinarFechaHora(turno.fecha, turno.horaInicio)
    const diffMin = Math.round((entradaReal.getTime() - horaProgramada.getTime()) / MIN_MS)
    if (diffMin > GRACIA_MIN) return { tarde: true, minutos: diffMin }
    return { tarde: false, minutos: 0 }
  }

  const estadoSalidaTemprana = (
    registro: RegistroJornada | undefined,
    turno: TurnoProgramado | null
  ): EstadoSalida | null => {
    if (!registro?.horaSalida || !turno) return null
    const salidaReal = new Date(registro.horaSalida)
    const horaProgramada = combinarFechaHora(turno.fecha, turno.horaFin)
    const diffMin = Math.round((horaProgramada.getTime() - salidaReal.getTime()) / MIN_MS)
    if (diffMin > GRACIA_MIN) return { temprano: true, minutos: diffMin }
    return { temprano: false, minutos: 0 }
  }

  /* ---------- Cálculo de horas y montos (uso administrativo) ---------- */

  const horasDeRegistro = (r: RegistroJornada, hasta: Date = new Date()) => {
    if (typeof r.horasAjustadas === 'number' && Number.isFinite(r.horasAjustadas)) {
      return Math.max(0, r.horasAjustadas)
    }

    const segmentos = r.segmentos?.length
      ? r.segmentos
      : r.horaEntrada
        ? [{ inicio: r.horaEntrada, fin: r.horaSalida }]
        : []

    return segmentos.reduce((total, segmento) => {
      const inicio = new Date(segmento.inicio)
      const turno = turnos.value.find((t) => t.empleadoId === r.empleadoId && t.fecha === r.fecha)
      const finTurno = turno && !turno.libre
        ? new Date(`${r.fecha}T${turno.horaFin}:00`)
        : null
      const finSegmento = segmento.fin ? new Date(segmento.fin) : hasta
      const fin = finTurno && !Number.isNaN(finTurno.getTime()) && finTurno < finSegmento
        ? finTurno
        : finSegmento
      const ms = fin.getTime() - inicio.getTime()
      return total + Math.max(ms / 1000 / 60 / 60, 0)
    }, 0)
  }

  const montoDeRegistro = (r: RegistroJornada, hasta: Date = new Date()) => {
    const emp = empleados.value.find((e) => e.id === r.empleadoId)
    if (!emp) return 0
    return horasDeRegistro(r, hasta) * emp.pagoPorHora
  }

  const registrosDe = (empleadoId: string) =>
    computed(() =>
      registros.value
        .filter((r) => r.empleadoId === empleadoId)
        .sort((a, b) => b.fecha.localeCompare(a.fecha))
    )

  const registrosDeHoyTodos = computed(() =>
    registros.value.filter((r) => r.fecha === fechaHoy())
  )

  const registrosPendientesDe = (empleadoId: string) =>
    registros.value.filter((r) => r.empleadoId === empleadoId && !r.pagado)

  const horasPendientesDe = (empleadoId: string) =>
    registrosPendientesDe(empleadoId).reduce((acc, r) => acc + horasDeRegistro(r), 0)

  const montoPendienteDe = (empleadoId: string) =>
    registrosPendientesDe(empleadoId).reduce((acc, r) => acc + montoDeRegistro(r), 0)

  /* ---------- Pago (semanal / quincenal, con reinicio) — solo vista administrador ---------- */

  /** Marca como pagado todo lo pendiente del empleado y reinicia el conteo */
  const marcarComoPagado = (empleadoId: string): PagoRealizado | null => {
    const pendientes = registrosPendientesDe(empleadoId)
    if (pendientes.length === 0) return null

    const ahora = new Date()
    const horas = pendientes.reduce((acc, r) => acc + horasDeRegistro(r, ahora), 0)
    const monto = pendientes.reduce((acc, r) => acc + montoDeRegistro(r, ahora), 0)

    pendientes.forEach((r) => (r.pagado = true))

    const pago: PagoRealizado = {
      id: generarId(),
      empleadoId,
      fecha: new Date().toISOString(),
      monto,
      horas,
      registrosIds: pendientes.map((r) => r.id),
    }
    pagos.value.unshift(pago)

    // Reinicia el ciclo completo del empleado para que el siguiente periodo empiece limpio.
    registros.value = registros.value.filter((r) => r.empleadoId !== empleadoId)
    turnos.value = turnos.value.filter((t) => t.empleadoId !== empleadoId)
    notificaciones.value = notificaciones.value.filter((n) => n.empleadoId !== empleadoId)

    return pago
  }

  const historialPagosDe = (empleadoId: string) =>
    computed(() => pagos.value.filter((p) => p.empleadoId === empleadoId))

  const ultimoPagoDe = (empleadoId: string) =>
    computed(() => pagos.value.find((p) => p.empleadoId === empleadoId) ?? null)

  /* ---------- Formato ---------- */

  const formatearHora = (iso: string | null) =>
    iso
      ? formatearFechaCentroamerica(iso, { hour: 'numeric', minute: '2-digit', hour12: true })
      : '--:--'

  const formatearMonto = (n: number) => `$${n.toFixed(2)}`

  const formatearHoras = (n: number) => `${n.toFixed(1)} h`

  const formatearFecha = (fecha: string) =>
    new Date(`${fecha}T00:00:00`).toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })

  const formatearDiaSemana = (fecha: string) =>
    new Date(`${fecha}T00:00:00`).toLocaleDateString('es-ES', { weekday: 'long' })

  const formatearRol = (rol: string) => {
    if (rol === 'administrador') return 'Administrador'
    if (rol === 'recepcionista') return 'Recepcionista'
    if (rol === 'cajero') return 'Cajero'
    if (rol === 'operador') return 'Operador'
    return rol
  }

  return {
    // carga / estado de red
    cargando,
    error,
    cargarHorarios,

    // personal (derivado del equipo real)
    empleados,
    refrescarPersonal,
    actualizarPagoPorHora,
    encontrarEmpleadoPara,

    // estado propio de horarios
    registros,
    turnos,
    pagos,
    periodoPago,

    // marcaje
    registroDeHoy,
    entradaMarcada,
    salidaMarcada,
    registrarEntrada,
    cancelarEntrada,
    registrarSalida,
    cancelarSalida,
    registrosDeHoyTodos,

    // ventana de marcaje / auto-cierre
    ventanaEntrada,
    turnoSigueVigente,
    verificarAutoSalida,

    // puntualidad
    estadoPuntualidad,
    estadoSalidaTemprana,

    // cálculo (uso administrativo)
    horasDeRegistro,
    montoDeRegistro,
    registrosDe,
    registrosPendientesDe,
    horasPendientesDe,
    montoPendienteDe,

    // pago (uso administrativo)
    marcarComoPagado,
    historialPagosDe,
    ultimoPagoDe,

    // turnos
    programarTurno,
    programarTurnosSemana,
    guardarTurnosAhora,
    guardarRegistrosAhora,
    eliminarTurno,
    eliminarTurnoGuardado,
    turnosDe,
    turnosDeFecha,
    proximoTurnoDe,
    todosLosTurnosFuturos,
    turnoDeHoyDe,
    turnosSemanaDe,

    // notificaciones
    notificaciones,
    agregarNotificacion,

    // formato
    formatearHora,
    formatearMonto,
    formatearHoras,
    formatearFecha,
    formatearDiaSemana,
    formatearRol,
    cerrarSegmentosVencidos,
  }
}
