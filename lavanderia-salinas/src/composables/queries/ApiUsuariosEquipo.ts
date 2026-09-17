/**
 * API ENDPOINTS - USUARIOS DE EQUIPO
 * Endpoints para gestión completa de usuarios (CRUD)
 * Roles: administrador, recepcionista, cajero, operador
 * 
 * Restricciones:
 * - Código: 6 dígitos, no puede iniciar con 0 (excepto administrador)
 * - Código debe ser único
 * - Correo debe ser único y válido
 */

// =============================================================================
// TIPOS
// =============================================================================

export interface UsuarioEquipoAPI {
  id: string
  nombre: string
  correo: string
  codigo: string
  rol: 'administrador' | 'recepcionista' | 'cajero' | 'operador'
  activo: boolean
  fecha_creacion: string
  fecha_actualizacion?: string
}

export interface CrearUsuarioPayload {
  nombre: string
  correo: string
  codigo: string
  rol: 'administrador' | 'recepcionista' | 'cajero' | 'operador'
}

export interface ActualizarUsuarioPayload {
  nombre?: string
  correo?: string
  codigo?: string
  rol?: 'administrador' | 'recepcionista' | 'cajero' | 'operador'
  activo?: boolean
}

export interface RespuestaAPI<T = any> {
  success: boolean
  data?: T
  message?: string
  errors?: Record<string, string>
}

// =============================================================================
// CONFIGURACIÓN
// =============================================================================

import { getApiBaseUrl } from '@/composables/useApiConfig'

const ENDPOINT_USUARIOS = '/usuarios-equipo'

// =============================================================================
// FUNCIONES AUXILIARES
// =============================================================================

const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token')
}

const getHeaders = () => {
  const token = getAuthToken()
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  }
}

const handleError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message
  }
  return error.message || 'Error desconocido'
}

// =============================================================================
// 1. OBTENER TODOS LOS USUARIOS
// =============================================================================

export const obtenerUsuariosEquipo = async (): Promise<RespuestaAPI<UsuarioEquipoAPI[]>> => {
  try {
    const response = await fetch(`${getApiBaseUrl()}${ENDPOINT_USUARIOS}`, {
      method: 'GET',
      headers: getHeaders()
    })

    if (!response.ok) {
      throw new Error(`Error ${response.status}`)
    }

    const data = await response.json()
    return {
      success: true,
      data: data.usuarios || []
    }
  } catch (error) {
    return {
      success: false,
      message: handleError(error)
    }
  }
}

// =============================================================================
// 2. OBTENER USUARIO POR ID
// =============================================================================

export const obtenerUsuarioPorId = async (id: string): Promise<RespuestaAPI<UsuarioEquipoAPI>> => {
  try {
    const response = await fetch(`${getApiBaseUrl()}${ENDPOINT_USUARIOS}/${id}`, {
      method: 'GET',
      headers: getHeaders()
    })

    if (!response.ok) {
      throw new Error(`Error ${response.status}`)
    }

    const data = await response.json()
    return {
      success: true,
      data: data.usuario
    }
  } catch (error) {
    return {
      success: false,
      message: handleError(error)
    }
  }
}

// =============================================================================
// 3. OBTENER USUARIO POR CÓDIGO (LOGIN)
// =============================================================================

export const obtenerUsuarioPorCodigo = async (codigo: string): Promise<RespuestaAPI<UsuarioEquipoAPI>> => {
  try {
    const response = await fetch(`${getApiBaseUrl()}${ENDPOINT_USUARIOS}/codigo/${codigo}`, {
      method: 'GET',
      headers: getHeaders()
    })

    if (!response.ok) {
      throw new Error(`Error ${response.status}`)
    }

    const data = await response.json()
    return {
      success: true,
      data: data.usuario
    }
  } catch (error) {
    return {
      success: false,
      message: handleError(error)
    }
  }
}

// =============================================================================
// 4. CREAR NUEVO USUARIO
// =============================================================================

export const crearUsuarioEquipo = async (
  payload: CrearUsuarioPayload
): Promise<RespuestaAPI<UsuarioEquipoAPI>> => {
  try {
    // Validaciones locales
    if (!payload.nombre || !payload.correo || !payload.codigo || !payload.rol) {
      return {
        success: false,
        message: 'Faltan datos obligatorios'
      }
    }

    if (payload.codigo.length !== 6 || !/^\d{6}$/.test(payload.codigo)) {
      return {
        success: false,
        message: 'El código debe ser 6 dígitos numéricos'
      }
    }

    if (payload.rol !== 'administrador' && payload.codigo.startsWith('0')) {
      return {
        success: false,
        message: 'El código no puede iniciar con 0 para este rol'
      }
    }

    const response = await fetch(`${getApiBaseUrl()}${ENDPOINT_USUARIOS}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        message: data.message || `Error ${response.status}`,
        errors: data.errors
      }
    }

    return {
      success: true,
      data: data.usuario,
      message: 'Usuario creado exitosamente'
    }
  } catch (error) {
    return {
      success: false,
      message: handleError(error)
    }
  }
}

// =============================================================================
// 5. ACTUALIZAR USUARIO
// =============================================================================

export const actualizarUsuarioEquipo = async (
  id: string,
  payload: ActualizarUsuarioPayload
): Promise<RespuestaAPI<UsuarioEquipoAPI>> => {
  try {
    // Validaciones locales si se proporciona código
    if (payload.codigo) {
      if (payload.codigo.length !== 6 || !/^\d{6}$/.test(payload.codigo)) {
        return {
          success: false,
          message: 'El código debe ser 6 dígitos numéricos'
        }
      }

      const rol = payload.rol || 'cajero'
      if (rol !== 'administrador' && payload.codigo.startsWith('0')) {
        return {
          success: false,
          message: 'El código no puede iniciar con 0 para este rol'
        }
      }
    }

    const response = await fetch(`${getApiBaseUrl()}${ENDPOINT_USUARIOS}/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        message: data.message || `Error ${response.status}`,
        errors: data.errors
      }
    }

    return {
      success: true,
      data: data.usuario,
      message: 'Usuario actualizado exitosamente'
    }
  } catch (error) {
    return {
      success: false,
      message: handleError(error)
    }
  }
}

// =============================================================================
// 6. ELIMINAR USUARIO (SOFT DELETE)
// =============================================================================

export const eliminarUsuarioEquipo = async (id: string): Promise<RespuestaAPI> => {
  try {
    const response = await fetch(`${getApiBaseUrl()}${ENDPOINT_USUARIOS}/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        message: data.message || `Error ${response.status}`
      }
    }

    return {
      success: true,
      message: 'Usuario eliminado exitosamente'
    }
  } catch (error) {
    return {
      success: false,
      message: handleError(error)
    }
  }
}

// =============================================================================
// 7. LISTAR USUARIOS POR ROL
// =============================================================================

export const obtenerUsuariosPorRol = async (
  rol: 'administrador' | 'recepcionista' | 'cajero'
): Promise<RespuestaAPI<UsuarioEquipoAPI[]>> => {
  try {
    const response = await fetch(`${getApiBaseUrl()}${ENDPOINT_USUARIOS}?rol=${rol}`, {
      method: 'GET',
      headers: getHeaders()
    })

    if (!response.ok) {
      throw new Error(`Error ${response.status}`)
    }

    const data = await response.json()
    return {
      success: true,
      data: data.usuarios || []
    }
  } catch (error) {
    return {
      success: false,
      message: handleError(error)
    }
  }
}

// =============================================================================
// 8. OBTENER ESTADÍSTICAS DEL EQUIPO
// =============================================================================

export interface EstadísticasEquipo {
  total_usuarios: number
  usuarios_activos: number
  total_administradores: number
  total_recepcionistas: number
  total_cajeros: number
}

export const obtenerEstadísticasEquipo = async (): Promise<RespuestaAPI<EstadísticasEquipo>> => {
  try {
    const response = await fetch(`${getApiBaseUrl()}${ENDPOINT_USUARIOS}/stats`, {
      method: 'GET',
      headers: getHeaders()
    })

    if (!response.ok) {
      throw new Error(`Error ${response.status}`)
    }

    const data = await response.json()
    return {
      success: true,
      data: data.stats
    }
  } catch (error) {
    return {
      success: false,
      message: handleError(error)
    }
  }
}

// =============================================================================
// 9. BUSCAR USUARIOS
// =============================================================================

export const buscarUsuarios = async (termino: string): Promise<RespuestaAPI<UsuarioEquipoAPI[]>> => {
  try {
    const response = await fetch(
      `${getApiBaseUrl()}${ENDPOINT_USUARIOS}/buscar?q=${encodeURIComponent(termino)}`,
      {
        method: 'GET',
        headers: getHeaders()
      }
    )

    if (!response.ok) {
      throw new Error(`Error ${response.status}`)
    }

    const data = await response.json()
    return {
      success: true,
      data: data.usuarios || []
    }
  } catch (error) {
    return {
      success: false,
      message: handleError(error)
    }
  }
}

// =============================================================================
// 10. VERIFICAR DISPONIBILIDAD DE CÓDIGO
// =============================================================================

export const verificarCodigoDisponible = async (
  codigo: string,
  excluirId?: string
): Promise<RespuestaAPI<{ disponible: boolean }>> => {
  try {
    const url = new URL(`${getApiBaseUrl()}${ENDPOINT_USUARIOS}/verificar-codigo`)
    url.searchParams.append('codigo', codigo)
    if (excluirId) {
      url.searchParams.append('excluir', excluirId)
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getHeaders()
    })

    if (!response.ok) {
      throw new Error(`Error ${response.status}`)
    }

    const data = await response.json()
    return {
      success: true,
      data: { disponible: data.disponible }
    }
  } catch (error) {
    return {
      success: false,
      message: handleError(error)
    }
  }
}

// =============================================================================
// 11. VERIFICAR DISPONIBILIDAD DE CORREO
// =============================================================================

export const verificarCorreoDisponible = async (
  correo: string,
  excluirId?: string
): Promise<RespuestaAPI<{ disponible: boolean }>> => {
  try {
    const url = new URL(`${getApiBaseUrl()}${ENDPOINT_USUARIOS}/verificar-correo`)
    url.searchParams.append('correo', correo)
    if (excluirId) {
      url.searchParams.append('excluir', excluirId)
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getHeaders()
    })

    if (!response.ok) {
      throw new Error(`Error ${response.status}`)
    }

    const data = await response.json()
    return {
      success: true,
      data: { disponible: data.disponible }
    }
  } catch (error) {
    return {
      success: false,
      message: handleError(error)
    }
  }
}

// =============================================================================
// HELPERS DE VALIDACIÓN
// =============================================================================

export const validarCodigo = (codigo: string, rol: string): { valido: boolean; error?: string } => {
  if (!codigo) {
    return { valido: false, error: 'El código es obligatorio' }
  }

  if (!/^\d{6}$/.test(codigo)) {
    return { valido: false, error: 'El código debe ser 6 dígitos numéricos' }
  }

  if (rol !== 'administrador' && codigo.startsWith('0')) {
    return { valido: false, error: 'El código no puede iniciar con 0 para este rol' }
  }

  return { valido: true }
}

export const validarCorreo = (correo: string): { valido: boolean; error?: string } => {
  if (!correo) {
    return { valido: false, error: 'El correo es obligatorio' }
  }

  const regex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/
  if (!regex.test(correo)) {
    return { valido: false, error: 'El correo no tiene un formato válido' }
  }

  return { valido: true }
}

export const validarNombre = (nombre: string): { valido: boolean; error?: string } => {
  if (!nombre || nombre.trim().length === 0) {
    return { valido: false, error: 'El nombre es obligatorio' }
  }

  if (nombre.trim().length < 2) {
    return { valido: false, error: 'El nombre debe tener al menos 2 caracteres' }
  }

  return { valido: true }
}
