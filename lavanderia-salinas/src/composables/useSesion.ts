import { computed, ref } from 'vue'
import { getApiBaseUrl } from '@/composables/useApiConfig'

export interface UsuarioSesion {
  id?: string
  nombre: string
  correo?: string
  rol: string
  creadoEn?: string
  created_at?: string
  imagenPerfil?: string | null
  cambiosImagenPerfil?: number
}

function cargarUsuario(): UsuarioSesion | null {
  try {
    const raw = localStorage.getItem('usuario')
    return raw ? (JSON.parse(raw) as UsuarioSesion) : null
  } catch {
    return null
  }
}

const usuarioActual = ref<UsuarioSesion | null>(cargarUsuario())

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'usuario') usuarioActual.value = cargarUsuario()
  })
}

export function useSesion() {
  const recargarSesion = () => {
    usuarioActual.value = cargarUsuario()
  }

  const rol = computed(() => (usuarioActual.value?.rol ?? localStorage.getItem('rol') ?? '').toLowerCase())

  const esAdministrador = computed(() => rol.value === 'administrador' || rol.value === 'admin')
  const esOperador = computed(() => rol.value === 'operador')

  const cerrarRegistroSesion = (motivo = 'salida') => {
    const sessionId = localStorage.getItem('personal_session_id')
    if (!sessionId) return
    localStorage.removeItem('personal_session_id')
    void fetch(getApiBaseUrl() + '/registros-personal/sesiones/' + encodeURIComponent(sessionId) + '/desconexion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ motivo }),
      keepalive: true
    }).catch(() => {})
  }

  const registrarIngreso = async (usuario: Pick<UsuarioSesion, 'id' | 'nombre' | 'rol'>) => {
    if (!usuario.id || usuario.id === 'dev-mode' || usuario.nombre === 'Desarrollador') return
    const anterior = localStorage.getItem('personal_session_id')
    if (anterior) cerrarRegistroSesion('reemplazada')
    try {
      const respuesta = await fetch(getApiBaseUrl() + '/registros-personal/sesiones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId: usuario.id, nombre: usuario.nombre, rol: usuario.rol }),
        signal: AbortSignal.timeout(5000)
      })
      if (!respuesta.ok) return
      const datos = await respuesta.json()
      if (typeof datos.sessionId === 'string') localStorage.setItem('personal_session_id', datos.sessionId)
    } catch {
      // El acceso sigue funcionando si el registro de auditoría no está disponible.
    }
  }

  const cerrarSesion = (motivo = 'salida') => {
    cerrarRegistroSesion(motivo)
    const llavesSesion = ['usuario', 'rol', 'codigo', 'sesion_id', 'auth_token', 'token']
    llavesSesion.forEach((llave) => localStorage.removeItem(llave))
    usuarioActual.value = null
  }

  const validarSesion = async () => {
    const token = localStorage.getItem('auth_token')
    if (!token) return false

    try {
      const respuesta = await fetch(`${getApiBaseUrl()}/auth/validar`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!respuesta.ok) {
        cerrarSesion()
        return false
      }
      const datos = await respuesta.json()
      localStorage.setItem('usuario', JSON.stringify(datos.usuario))
      usuarioActual.value = datos.usuario
      return true
    } catch {
      cerrarSesion()
      return false
    }
  }

  return {
    usuarioActual,
    rol,
    esAdministrador,
    esOperador,
    recargarSesion,
    cerrarSesion,
    registrarIngreso,
    validarSesion,
  }
}