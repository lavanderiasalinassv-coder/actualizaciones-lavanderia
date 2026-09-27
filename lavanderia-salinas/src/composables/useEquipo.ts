import { API_LOCAL_URL, getApiBaseUrl } from '@/composables/useApiConfig'

export type RolEquipo = 'administrador' | 'recepcionista' | 'cajero' | 'operador'

export interface UsuarioEquipo {
  id: string
  nombre: string
  correo: string
  codigo: string
  rol: RolEquipo
  activo: boolean
  creadoEn?: string
  created_at?: string
  imagenPerfil?: string | null
  cambiosImagenPerfil?: number
  requiere2FA?: boolean
  usuarioId?: string
  errorEnvio?: string
}

const apiUrl = () => `${getApiBaseUrl()}/equipo`

class ApiError extends Error {}

const manejarRespuesta = async <T,>(res: Response): Promise<T> => {
  if (res.status === 204) {
    return undefined as T
  }

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    throw new ApiError(data?.error ?? 'Ocurrió un error al comunicarse con el servidor.')
  }

  return data as T
}

export const getEquipo = async (): Promise<UsuarioEquipo[]> => {
  const res = await fetch(apiUrl())
  return manejarRespuesta<UsuarioEquipo[]>(res)
}

export const autenticarUsuarioEquipo = async (codigo: string): Promise<UsuarioEquipo | null> => {
  const destinoActual = getApiBaseUrl()
  const electron = typeof window !== 'undefined' && (
    navigator.userAgent.includes('Electron') || Boolean((window as any).electronAPI)
  )
  const autenticarEn = async (destino: string) => {
    const res = await fetch(`${destino}/equipo/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo })
    })

    if (res.status === 401) return null
    return manejarRespuesta<UsuarioEquipo>(res)
  }

  let usuario: UsuarioEquipo | null
  try {
    usuario = await autenticarEn(destinoActual)
  } catch (error) {
    if (!electron || destinoActual === API_LOCAL_URL) throw error
    return autenticarEn(API_LOCAL_URL)
  }

  if (usuario?.errorEnvio && electron && destinoActual !== API_LOCAL_URL) {
    return autenticarEn(API_LOCAL_URL)
  }
  return usuario
}

export const agregarUsuarioEquipo = async (data: Partial<UsuarioEquipo>): Promise<UsuarioEquipo> => {
  const res = await fetch(apiUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })

  return manejarRespuesta<UsuarioEquipo>(res)
}

export const editarUsuarioEquipo = async (
  id: string,
  cambios: Partial<UsuarioEquipo>
): Promise<UsuarioEquipo> => {
  const res = await fetch(`${apiUrl()}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cambios)
  })

  return manejarRespuesta<UsuarioEquipo>(res)
}

export const eliminarUsuarioEquipo = async (id: string): Promise<void> => {
  const res = await fetch(`${apiUrl()}/${id}`, { method: 'DELETE' })
  await manejarRespuesta<void>(res)
}
