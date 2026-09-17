import { computed, ref } from 'vue'
import { getApiBaseUrl } from './useApiConfig'
import { useSesion } from './useSesion'

export interface ProblemaReportado {
  id: string
  usuario: string
  usuarioId?: string
  tema: string
  detalles: string
  estado: 'pendiente' | 'en_proceso' | 'resuelto'
  fechaCreacion: string
  fechaResolucion?: string
}

export interface NotificacionUsuario {
  id: string
  titulo: string
  mensaje: string
  tipo: 'info' | 'success' | 'warning' | 'error'
  fecha: string
  leida: boolean
  autorNombre?: string
}

interface NotificacionApi {
  id: string
  tipo: 'aviso' | 'problema'
  autorNombre: string
  titulo: string
  mensaje: string
  tema?: string
  detalles?: string
  estado?: ProblemaReportado['estado']
  leida: boolean
  fecha: string
  fechaResolucion?: string
}

const problemasReportados = ref<ProblemaReportado[]>([])
const notificacionesUsuario = ref<NotificacionUsuario[]>([])
const cargando = ref(false)

export function useNotificaciones() {
  const { usuarioActual } = useSesion()
  const esModoDesarrollador = computed(() => {
    const rol = usuarioActual.value?.rol?.toLowerCase()
    return usuarioActual.value?.nombre === 'Desarrollador' || rol === 'developer' || rol === 'desarrollador'
  })

  const problemasPendientes = computed(() => problemasReportados.value.filter(p => p.estado === 'pendiente'))
  const problemasEnProceso = computed(() => problemasReportados.value.filter(p => p.estado === 'en_proceso'))
  const problemasResueltos = computed(() => problemasReportados.value.filter(p => p.estado === 'resuelto'))
  const notificacionesNoLeidas = computed(() => notificacionesUsuario.value.filter(n => !n.leida))
  const totalNotificacionesNoLeidas = computed(() => notificacionesNoLeidas.value.length)

  const headers = () => ({
    'Content-Type': 'application/json',
    'x-user-id': usuarioActual.value?.id ?? '',
    'x-user-name': usuarioActual.value?.nombre ?? '',
    'x-user-role': usuarioActual.value?.rol ?? ''
  })

  const solicitar = async (ruta: string, init: RequestInit = {}) => {
    const respuesta = await fetch(`${getApiBaseUrl()}${ruta}`, {
      ...init,
      headers: { ...headers(), ...(init.headers ?? {}) }
    })
    if (!respuesta.ok) {
      const datos = await respuesta.json().catch(() => ({}))
      throw new Error(datos.error || 'No se pudo completar la operación.')
    }
    return respuesta.status === 204 ? null : respuesta.json()
  }

  const cargarProblemas = async () => {
    try {
      const ruta = esModoDesarrollador.value
        ? '/notificaciones/problemas'
        : '/notificaciones/problemas/mios'
      const problemas = await solicitar(ruta) as NotificacionApi[]
      problemasReportados.value = problemas.map(problema => ({
        id: problema.id,
        usuario: problema.autorNombre,
        tema: problema.tema || problema.titulo,
        detalles: problema.detalles || problema.mensaje,
        estado: problema.estado || 'pendiente',
        fechaCreacion: problema.fecha,
        fechaResolucion: problema.fechaResolucion
      }))
    } catch (error) {
      console.error('No se pudieron cargar los problemas:', error)
    }
  }

  const cargarNotificaciones = async () => {
    if (!usuarioActual.value?.id) return
    if (esModoDesarrollador.value) {
      notificacionesUsuario.value = []
      await cargarProblemas()
      return
    }
    cargando.value = true
    try {
      const avisos = await solicitar('/notificaciones') as NotificacionApi[]
      notificacionesUsuario.value = avisos.map(aviso => ({
        id: aviso.id,
        titulo: aviso.titulo,
        mensaje: aviso.mensaje,
        tipo: 'info',
        fecha: aviso.fecha,
        leida: aviso.leida,
        autorNombre: aviso.autorNombre
      }))
      await cargarProblemas()
    } catch (error) {
      console.error('No se pudieron cargar las notificaciones:', error)
    } finally {
      cargando.value = false
    }
  }

  const reportarProblema = async (tema: string, detalles: string) => {
    if (esModoDesarrollador.value) throw new Error('El desarrollador no puede reportar problemas.')
    const problema = await solicitar('/notificaciones/problemas', {
      method: 'POST',
      body: JSON.stringify({ tema, detalles })
    })
    await cargarProblemas()
    return problema
  }

  const enviarAviso = (titulo: string, mensaje: string, destinatarioRol = 'todos') =>
    solicitar('/notificaciones/avisos', {
      method: 'POST',
      body: JSON.stringify({ titulo, mensaje, destinatarioRol })
    })

  const editarAviso = async (avisoId: string, titulo: string, mensaje: string, destinatarioRol = 'todos') => {
    const avisoEditado = await solicitar(`/notificaciones/avisos/${avisoId}`, {
      method: 'PATCH',
      body: JSON.stringify({ titulo, mensaje, destinatarioRol })
    })
    // Actualizar el aviso en la lista local
    const index = notificacionesUsuario.value.findIndex(n => n.id === avisoId)
    if (index !== -1) {
      notificacionesUsuario.value[index] = {
        ...notificacionesUsuario.value[index],
        titulo,
        mensaje,
        autorNombre: avisoEditado.autorNombre
      }
    }
    return avisoEditado
  }

  const limpiarNotificaciones = async () => {
    const esAdministrador = usuarioActual.value?.rol?.toLowerCase() === 'admin' || usuarioActual.value?.rol?.toLowerCase() === 'administrador'
    if (!esModoDesarrollador.value && !esAdministrador) throw new Error('Solo el desarrollador o administrador puede limpiar las notificaciones.')
    await solicitar('/notificaciones', { method: 'DELETE' })
    problemasReportados.value = []
    notificacionesUsuario.value = []
  }

  const cambiarEstadoProblema = async (problemaId: string, nuevoEstado: 'en_proceso' | 'resuelto') => {
    await solicitar(`/notificaciones/problemas/${problemaId}`, {
      method: 'PATCH',
      body: JSON.stringify({ estado: nuevoEstado })
    })
    await cargarProblemas()
  }

  const eliminarProblema = async (problemaId: string) => {
    if (esModoDesarrollador.value) throw new Error('El desarrollador no puede eliminar reportes.')
    await solicitar(`/notificaciones/problemas/${problemaId}`, { method: 'DELETE' })
    problemasReportados.value = problemasReportados.value.filter(problema => problema.id !== problemaId)
  }

  const marcarNotificacionLeida = async (notificacionId: string) => {
    await solicitar(`/notificaciones/${notificacionId}/leida`, { method: 'PATCH' })
    const notificacion = notificacionesUsuario.value.find(n => n.id === notificacionId)
    if (notificacion) notificacion.leida = true
  }

  const marcarTodasNotificacionesLeidas = async () => {
    await Promise.all(notificacionesNoLeidas.value.map(n => marcarNotificacionLeida(n.id)))
  }

  const eliminarNotificacion = async (notificacionId: string) => {
    await solicitar(`/notificaciones/${notificacionId}`, { method: 'DELETE' })
    notificacionesUsuario.value = notificacionesUsuario.value.filter(n => n.id !== notificacionId)
  }

  return {
    problemasReportados,
    problemasPendientes,
    problemasEnProceso,
    problemasResueltos,
    notificacionesUsuario,
    notificacionesNoLeidas,
    totalNotificacionesNoLeidas,
    esModoDesarrollador,
    cargando,
    cargarNotificaciones,
    cargarProblemas,
    reportarProblema,
    enviarAviso,
    editarAviso,
    limpiarNotificaciones,
    cambiarEstadoProblema,
    eliminarProblema,
    marcarNotificacionLeida,
    marcarTodasNotificacionesLeidas,
    eliminarNotificacion
  }
}
