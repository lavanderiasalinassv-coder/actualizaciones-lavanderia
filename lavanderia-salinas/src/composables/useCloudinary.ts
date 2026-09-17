import { getApiBaseUrl } from '@/composables/useApiConfig'

export const subirImagenPerfil = async (usuarioId: string, archivo: File) => {
  const datos = new FormData()
  datos.append('imagen', archivo)

  const respuesta = await fetch(`${getApiBaseUrl()}/equipo/${usuarioId}/imagen`, {
    method: 'POST',
    body: datos
  })

  const resultado = await respuesta.json().catch(() => null)
  if (!respuesta.ok) {
    throw new Error(resultado?.error || 'No se pudo subir la imagen de perfil.')
  }

  return resultado
}
