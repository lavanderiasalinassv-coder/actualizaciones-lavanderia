import { computed, ref, watch } from 'vue'
import { getEquipo, type UsuarioEquipo } from '@/composables/useEquipo'
import { useSesion } from '@/composables/useSesion'
import { getApiBaseUrl } from '@/composables/useApiConfig'

export type PrioridadTarea = 'baja' | 'media' | 'alta'

export interface TareaAsignada {
  id: string
  titulo: string
  descripcion: string
  emoji: string
  prioridad: PrioridadTarea
  asignadaAId: string
  asignadaANombre: string
  creadaPorId: string | null
  creadaPorNombre: string
  creadaEn: string
  completada: boolean
  completadaEn: string | null
  completadaPorId: string | null
  completadaPorNombre: string | null
}

export interface CrearTareaInput {
  titulo: string
  descripcion?: string
  emoji?: string
  prioridad?: PrioridadTarea
  asignadaAId?: string
}

interface UsuarioActual {
  id: string
  nombre: string
  rol: string
  correo?: string
}

const apiUrl = () => `${getApiBaseUrl()}/tareas`
const EMOJI_POR_DEFECTO = '🧼'
const usuariosEquipo = ref<UsuarioEquipo[]>([])
let equipoCargado = false

const cargarEquipo = () => {
  if (equipoCargado) return
  equipoCargado = true
  getEquipo()
    .then((usuarios) => {
      usuariosEquipo.value = usuarios
    })
    .catch(() => {
      usuariosEquipo.value = []
    })
}

const normalizarTexto = (valor: unknown) => {
  if (typeof valor !== 'string') return ''
  return valor.trim()
}

const obtenerUsuarioEquipo = (usuarioId: string): UsuarioEquipo | null => {
  if (!usuarioId) return null
  return usuariosEquipo.value.find((usuario) => usuario.id === usuarioId && usuario.activo !== false) ?? null
}

/* ───────────────── Helpers de red ───────────────── */

const construirQuery = (params: Record<string, string | undefined>) => {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([clave, valor]) => {
    if (valor) query.set(clave, valor)
  })
  const texto = query.toString()
  return texto ? `?${texto}` : ''
}

const manejarRespuesta = async (respuesta: Response) => {
  if (respuesta.status === 204) return null

  let cuerpo: any = null
  try {
    cuerpo = await respuesta.json()
  } catch {
    cuerpo = null
  }

  if (!respuesta.ok) {
    throw new Error(cuerpo?.error || 'Ocurrió un error al comunicarse con el servidor.')
  }

  return cuerpo
}

const payloadUsuario = (usuario: UsuarioActual | null) => ({
  usuarioId: usuario?.id || undefined,
  usuarioNombre: usuario?.nombre || undefined,
  usuarioRol: usuario?.rol || undefined
})

/* ───────────────── Estado compartido ───────────────── */

const tareas = ref<TareaAsignada[]>([])
const cargando = ref(false)
const error = ref<string | null>(null)
let watcherSesionInstalado = false
let solicitudTareasActual = 0

const obtenerEtiquetaPrioridad = (prioridad: PrioridadTarea) => {
  switch (prioridad) {
    case 'alta':
      return 'Alta'
    case 'baja':
      return 'Baja'
    default:
      return 'Media'
  }
}

export function useTareas() {
  cargarEquipo()
  const { usuarioActual: sesionActual } = useSesion()
  const usuarioActual = computed<UsuarioActual | null>(() => {
    const usuario = sesionActual.value
    if (!usuario) return null

    return {
      id: usuario.id ?? '',
      nombre: usuario.nombre,
      rol: usuario.rol,
      correo: usuario.correo
    }
  })
  const esAdmin = computed(() => usuarioActual.value?.rol === 'administrador')

  const cargarTareas = async () => {
    const solicitud = ++solicitudTareasActual
    const usuarioSolicitante = usuarioActual.value
    const claveSesion = usuarioSolicitante
      ? `${usuarioSolicitante.id}|${usuarioSolicitante.correo ?? ''}|${usuarioSolicitante.rol}`
      : ''
    cargando.value = true
    error.value = null
    try {
      const query = construirQuery(payloadUsuario(usuarioSolicitante))
      const respuesta = await fetch(`${apiUrl()}${query}`)
      const datos = await manejarRespuesta(respuesta)
      const lista = Array.isArray(datos)
        ? datos
        : datos && typeof datos === 'object' && Array.isArray(datos.tareas)
          ? datos.tareas
          : []
      const sesionSigueActiva = usuarioActual.value
        ? `${usuarioActual.value.id}|${usuarioActual.value.correo ?? ''}|${usuarioActual.value.rol}` === claveSesion
        : !claveSesion
      if (solicitud === solicitudTareasActual && sesionSigueActiva) {
        tareas.value = lista as TareaAsignada[]
      }
    } catch (err) {
      if (solicitud === solicitudTareasActual) {
        error.value = err instanceof Error ? err.message : 'No se pudieron cargar las tareas.'
      }
      throw err
    } finally {
      if (solicitud === solicitudTareasActual) cargando.value = false
    }
  }

  if (!watcherSesionInstalado) {
    watcherSesionInstalado = true
    watch(
      sesionActual,
      (usuario) => {
        solicitudTareasActual += 1
        tareas.value = []
        if (!usuario) {
          return
        }
        cargarTareas().catch(() => {})
      },
      { immediate: true }
    )
  }

  const tareasVisibles = computed(() => {
    return [...tareas.value].sort((a, b) => {
      if (a.completada !== b.completada) return Number(a.completada) - Number(b.completada)
      return b.creadaEn.localeCompare(a.creadaEn)
    })
  })

  const tareasPendientes = computed(() => tareasVisibles.value.filter((tarea) => !tarea.completada))
  const tareasCompletadas = computed(() => tareasVisibles.value.filter((tarea) => tarea.completada))
  const tareasTotal = computed(() => tareasVisibles.value.length)

  const usuariosActivos = computed(() => usuariosEquipo.value.filter((usuario) => usuario.activo !== false))

  const crearTarea = async (datos: CrearTareaInput) => {
    const titulo = normalizarTexto(datos.titulo)
    if (!titulo) {
      throw new Error('La tarea necesita un título.')
    }

    const usuario = usuarioActual.value
    const esAdminActual = usuario?.rol === 'administrador'
    const asignadaAId = esAdminActual ? normalizarTexto(datos.asignadaAId) : usuario?.id

    const asignadaA = obtenerUsuarioEquipo(asignadaAId ?? '')
    if (!asignadaA) {
      throw new Error('Selecciona un usuario válido para asignar la tarea.')
    }

    const respuesta = await fetch(apiUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo,
        descripcion: normalizarTexto(datos.descripcion),
        emoji: normalizarTexto(datos.emoji) || EMOJI_POR_DEFECTO,
        prioridad: datos.prioridad ?? 'media',
        asignadaAId: asignadaA.id,
        ...payloadUsuario(usuario)
      })
    })

    const nuevaTarea = await manejarRespuesta(respuesta)
    await cargarTareas()
    return nuevaTarea
  }

  const completarTarea = async (id: string, completada = true, nota = '') => {
    const tarea = tareas.value.find((item) => item.id === id)
    const usuario = usuarioActual.value
    const puedeEditar = esAdmin.value || !usuario?.id || tarea?.asignadaAId === usuario.id

    if (!puedeEditar) {
      throw new Error('No puedes modificar esta tarea.')
    }

    const respuesta = await fetch(`${apiUrl()}/${id}/completar`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completada, nota: normalizarTexto(nota), ...payloadUsuario(usuario) })
    })

    await manejarRespuesta(respuesta)
    await cargarTareas()
  }

  const alternarCompletada = async (id: string) => {
    const tarea = tareas.value.find((item) => item.id === id)
    if (!tarea) return
    await completarTarea(id, !tarea.completada)
  }

  const reasignarTarea = async (id: string, asignadaAId: string) => {
    if (!esAdmin.value) {
      throw new Error('Solo el administrador puede reasignar tareas.')
    }

    const asignadaA = obtenerUsuarioEquipo(asignadaAId)
    if (!asignadaA) {
      throw new Error('El usuario seleccionado no existe o está inactivo.')
    }

    const respuesta = await fetch(`${apiUrl()}/${id}/reasignar`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ asignadaAId: asignadaA.id, ...payloadUsuario(usuarioActual.value) })
    })

    await manejarRespuesta(respuesta)
    await cargarTareas()
  }

  const eliminarTarea = async (id: string) => {
    if (!esAdmin.value) {
      throw new Error('Solo el administrador puede eliminar tareas.')
    }

    const query = construirQuery(payloadUsuario(usuarioActual.value))
    const respuesta = await fetch(`${apiUrl()}/${id}${query}`, { method: 'DELETE' })

    await manejarRespuesta(respuesta)
    await cargarTareas()
  }

  const limpiarCompletadas = async () => {
    if (!esAdmin.value) {
      throw new Error('Solo el administrador puede limpiar tareas completadas.')
    }

    const query = construirQuery(payloadUsuario(usuarioActual.value))
    const respuesta = await fetch(`${apiUrl()}/completadas${query}`, { method: 'DELETE' })

    await manejarRespuesta(respuesta)
    await cargarTareas()
  }

  const obtenerTareasDeUsuario = (usuarioId: string) =>
    tareas.value.filter((tarea) => tarea.asignadaAId === usuarioId)

  const etiquetaPrioridad = (prioridad: PrioridadTarea) => obtenerEtiquetaPrioridad(prioridad)

  return {
    usuarioActual,
    esAdmin,
    tareas,
    tareasVisibles,
    tareasPendientes,
    tareasCompletadas,
    tareasTotal,
    usuariosActivos,
    cargando,
    error,
    cargarTareas,
    crearTarea,
    completarTarea,
    alternarCompletada,
    reasignarTarea,
    eliminarTarea,
    limpiarCompletadas,
    obtenerTareasDeUsuario,
    etiquetaPrioridad
  }
}