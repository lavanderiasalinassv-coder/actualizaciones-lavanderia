import { computed, reactive, ref } from 'vue'
import { getApiBaseUrl } from '@/composables/useApiConfig'

export interface TurnoCaja {
  id: string
  abierto: boolean
  usuario: string
  numeroCaja: number
  apertura: number
  saldoCierre: number | null
  horaInicio: string | null
  notas: string
  cerradoAt: string | null
}

export interface TurnoAntiguoVerificacion {
  tieneTurnoAntiguoAbierto: boolean
  mensaje: string
  fechaInicio?: string
  horaInicio?: string
}

export interface AbrirTurnoInput {
  usuario: string
  apertura: number
  notas?: string
  fecha?: string
  usuarioRol?: string
}

const turno = reactive<TurnoCaja>({
  id: '', abierto: false, usuario: '', numeroCaja: 0, apertura: 0,
  saldoCierre: null, horaInicio: null, notas: '', cerradoAt: null
})
const cargando = ref(false)
const error = ref<string | null>(null)
let cargaEnCurso: Promise<TurnoCaja | null> | null = null
let operacionTurnoEnCurso = false

const api = async (ruta: string, opciones: RequestInit = {}) => {
  const respuesta = await fetch(`${getApiBaseUrl()}${ruta}`, {
    headers: { 'Content-Type': 'application/json' }, ...opciones
  })
  const datos = await respuesta.json().catch(() => null)
  if (!respuesta.ok) throw new Error(datos?.error ?? 'No se pudo comunicar con el servidor.')
  return datos as TurnoCaja
}

const apiVerificacion = async (ruta: string, opciones: RequestInit = {}) => {
  const respuesta = await fetch(`${getApiBaseUrl()}${ruta}`, {
    headers: { 'Content-Type': 'application/json' }, ...opciones
  })
  const datos = await respuesta.json().catch(() => null)
  if (!respuesta.ok) throw new Error(datos?.error ?? 'No se pudo comunicar con el servidor.')
  return datos as TurnoAntiguoVerificacion
}

const aplicarTurno = (datos: TurnoCaja) => Object.assign(turno, datos)

const cargarTurno = async (): Promise<TurnoCaja | null> => {
  if (cargaEnCurso) return cargaEnCurso

  cargando.value = true
  error.value = null
  cargaEnCurso = api('/turno').then((datos) => {
    aplicarTurno(datos)
    return datos
  }).catch((err) => {
    error.value = err instanceof Error ? err.message : 'No se pudo cargar el turno.'
    return null
  }).finally(() => {
    cargando.value = false
    cargaEnCurso = null
  })
  return cargaEnCurso
}

void cargarTurno()

export function useTurno() {
  const abrirTurno = async (datos: AbrirTurnoInput) => {
    if (operacionTurnoEnCurso) return turno
    if (turno.abierto) return turno
    operacionTurnoEnCurso = true
    try {
      aplicarTurno(await api('/turno/abrir', { method: 'POST', body: JSON.stringify(datos) }))
      return turno
    } finally {
      operacionTurnoEnCurso = false
    }
  }

  const cerrarTurno = async (saldoCierre = 0, fecha?: string, usuarioRol?: string) => {
    if (operacionTurnoEnCurso || !turno.abierto) return turno
    operacionTurnoEnCurso = true
    try {
      aplicarTurno(await api('/turno/cerrar', { method: 'POST', body: JSON.stringify({ saldoCierre, fecha, usuarioRol }) }))
      return turno
    } finally {
      operacionTurnoEnCurso = false
    }
  }

  const actualizarNotasTurno = async (notas: string) => {
    aplicarTurno(await api('/turno/notas', { method: 'PUT', body: JSON.stringify({ notas }) }))
    return turno
  }

  const resetTurno = async () => {
    aplicarTurno(await api('/turno/reset', { method: 'POST' }))
    return turno
  }

  const verificarTurnosAntiguosAbiertos = async () => {
    try {
      return await apiVerificacion('/turno/verificar-antiguos')
    } catch (error) {
      console.error('Error al verificar turnos antiguos:', error)
      return { tieneTurnoAntiguoAbierto: false, mensaje: '' }
    }
  }

  return {
    turno,
    turnoAbierto: computed(() => turno.abierto),
    cargando,
    error,
    cargarTurno,
    abrirTurno,
    cerrarTurno,
    actualizarNotasTurno,
    resetTurno,
    verificarTurnosAntiguosAbiertos
  }
}
