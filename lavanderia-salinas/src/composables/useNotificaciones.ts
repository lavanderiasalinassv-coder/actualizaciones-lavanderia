import { computed, ref } from 'vue'
import { toastController } from '@ionic/vue'
import { getApiBaseUrl } from './useApiConfig'
import { useSesion } from './useSesion'
import { getEquipo, type UsuarioEquipo } from './useEquipo'

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
  autorId?: string
  autorNombre?: string
  destinatarioRol?: string
  destinatarioId?: string
}

interface NotificacionApi {
  id: string
  tipo: 'aviso' | 'problema'
  autorId?: string
  autorNombre: string
  titulo: string
  mensaje: string
  tema?: string
  detalles?: string
  estado?: ProblemaReportado['estado']
  leida: boolean
  fecha: string
  fechaResolucion?: string
  destinatarioRol?: string
  destinatarioId?: string
}

const problemasReportados = ref<ProblemaReportado[]>([])
const notificacionesUsuario = ref<NotificacionUsuario[]>([])
const cargando = ref(false)
const viendoAvisosEnviados = ref(false)
const usuarioHistorialId = ref<string | null>(null)
const usuariosDestinatarios = ref<UsuarioEquipo[]>([])

export function useNotificaciones() {
  const { usuarioActual } = useSesion()
  const esModoDesarrollador = computed(() => {
    const rol = usuarioActual.value?.rol?.toLowerCase()
    return usuarioActual.value?.nombre === 'Desarrollador' || rol === 'developer' || rol === 'desarrollador'
  })

  const problemasPendientes = computed(() => problemasReportados.value.filter(p => p.estado === 'pendiente'))
  const problemasEnProceso = computed(() => problemasReportados.value.filter(p => p.estado === 'en_proceso'))
  const problemasResueltos = computed(() => problemasReportados.value.filter(p => p.estado === 'resuelto'))
  // Para el desarrollador la lista es un historial de gestión, no una bandeja
  // de entrada. Así los avisos enviados no activan el modal de "Leer después".
  const notificacionesNoLeidas = computed(() =>
    esModoDesarrollador.value ? [] : notificacionesUsuario.value.filter(n => !n.leida)
  )
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

  const cargarNotificaciones = async (forzar = false) => {
    // El sondeo automático no debe reemplazar el historial de avisos enviados
    // que el administrador está revisando, pero jamás debe bloquear a un
    // usuario distinto después de un cambio de sesión.
    const usuarioId = usuarioActual.value?.id
    if (!usuarioId) return
    if (
      viendoAvisosEnviados.value &&
      usuarioHistorialId.value === String(usuarioId) &&
      !forzar
    ) return
    viendoAvisosEnviados.value = false
    usuarioHistorialId.value = null
    if (esModoDesarrollador.value) {
      cargando.value = true
      try {
        // El desarrollador consulta exclusivamente su historial de envíos;
        // nunca la bandeja de destinatarios.
        const avisos = await solicitar('/notificaciones/enviados') as NotificacionApi[]
        notificacionesUsuario.value = avisos.map(aviso => ({
          id: aviso.id,
          titulo: aviso.titulo,
          mensaje: aviso.mensaje,
          tipo: 'info',
          fecha: aviso.fecha,
          leida: aviso.leida,
          autorId: aviso.autorId,
          autorNombre: aviso.autorNombre,
          destinatarioRol: aviso.destinatarioRol,
          destinatarioId: aviso.destinatarioId
        }))
        await cargarProblemas()
      } catch (error) {
        console.error('No se pudieron cargar las notificaciones:', error)
      } finally {
        cargando.value = false
      }
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
        autorId: aviso.autorId,
        autorNombre: aviso.autorNombre,
        destinatarioRol: aviso.destinatarioRol,
        destinatarioId: aviso.destinatarioId
      }))
      await cargarProblemas()
    } catch (error) {
      console.error('No se pudieron cargar las notificaciones:', error)
    } finally {
      cargando.value = false
    }
  }

  const cargarAvisosEnviados = async () => {
    viendoAvisosEnviados.value = true
    usuarioHistorialId.value = String(usuarioActual.value?.id ?? '')
    cargando.value = true
    try {
      const avisos = await solicitar('/notificaciones/enviados') as NotificacionApi[]
      notificacionesUsuario.value = avisos.map(aviso => ({
        id: aviso.id,
        titulo: aviso.titulo,
        mensaje: aviso.mensaje,
        tipo: 'info',
        fecha: aviso.fecha,
        leida: true,
        autorId: aviso.autorId,
        autorNombre: aviso.autorNombre,
        destinatarioRol: aviso.destinatarioRol,
        destinatarioId: aviso.destinatarioId
      }))
    } finally {
      cargando.value = false
    }
  }

  const cargarUsuariosDestinatarios = async () => {
    const usuarios = await getEquipo()
    const usuarioActualId = String(usuarioActual.value?.id ?? '')
    usuariosDestinatarios.value = usuarios.filter(
      (usuario) => usuario.activo !== false && String(usuario.id) !== usuarioActualId,
    )
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

  const enviarAviso = (titulo: string, mensaje: string, destinatarioRol = 'todos', destinatarioId?: string) =>
    solicitar('/notificaciones/avisos', {
      method: 'POST',
      body: JSON.stringify({ titulo, mensaje, destinatarioRol, destinatarioId })
    })

  const editarAviso = async (avisoId: string, titulo: string, mensaje: string, destinatarioRol = 'todos', destinatarioId?: string) => {
    const avisoEditado = await solicitar(`/notificaciones/avisos/${avisoId}`, {
      method: 'PATCH',
      body: JSON.stringify({ titulo, mensaje, destinatarioRol, destinatarioId })
    })
    // Actualizar el aviso en la lista local
    const index = notificacionesUsuario.value.findIndex(n => n.id === avisoId)
    if (index !== -1) {
      notificacionesUsuario.value[index] = {
        ...notificacionesUsuario.value[index],
        titulo,
        mensaje,
        autorId: avisoEditado.autorId,
        autorNombre: avisoEditado.autorNombre,
        destinatarioRol: avisoEditado.destinatarioRol,
        destinatarioId: avisoEditado.destinatarioId
      }
    }

    const toast = await toastController.create({
      message: 'Aviso editado correctamente.',
      duration: 2200,
      color: 'success',
      position: 'top'
    })
    await toast.present()

    return avisoEditado
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

    const toast = await toastController.create({
      message: 'Problema eliminado correctamente.',
      duration: 2200,
      color: 'success',
      position: 'top'
    })
    await toast.present()
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

    const toast = await toastController.create({
      message: 'Notificación eliminada correctamente.',
      duration: 2200,
      color: 'success',
      position: 'top'
    })
    await toast.present()
  }

  const limpiarNotificaciones = async () => {
    await solicitar('/notificaciones', { method: 'DELETE' })
    notificacionesUsuario.value = []
    problemasReportados.value = []

    const toast = await toastController.create({
      message: 'Notificaciones limpiadas correctamente.',
      duration: 2200,
      color: 'success',
      position: 'top'
    })
    await toast.present()
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
    viendoAvisosEnviados,
    usuariosDestinatarios,
    cargarNotificaciones,
    cargarAvisosEnviados,
    cargarUsuariosDestinatarios,
    cargarProblemas,
    reportarProblema,
    enviarAviso,
    editarAviso,
    cambiarEstadoProblema,
    eliminarProblema,
    marcarNotificacionLeida,
    marcarTodasNotificacionesLeidas,
    eliminarNotificacion,
    limpiarNotificaciones
  }
}
