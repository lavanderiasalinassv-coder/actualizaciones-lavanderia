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

  const cerrarSesion = () => {
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
    validarSesion,
  }
}