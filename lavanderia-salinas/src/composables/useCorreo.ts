import { getApiBaseUrl } from './useApiConfig'

export const enviarCorreoHTML = async (correo: string, html: string, asunto?: string, nombreCliente?: string) => {
  try {
    const respuesta = await fetch(`${getApiBaseUrl()}/correo/enviar-html`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        correo,
        html,
        asunto: asunto || 'Tu orden - Lavandería Salinas',
        nombreCliente
      })
    })

    if (!respuesta.ok) {
      const error = await respuesta.json().catch(() => ({ error: 'Error al enviar correo' }))
      throw new Error(error.detalle ? `${error.error || 'Error al enviar correo'} (${error.detalle})` : error.error || 'Error al enviar correo')
    }

    return await respuesta.json()
  } catch (error: any) {
    console.error('Error al enviar correo HTML:', error)
    throw error
  }
}

export const enviarCorreoNotificacion = async (
  correo: string,
  nombreCliente: string,
  numeroOrden: string,
  total: string,
  detalles?: string,
  asunto?: string,
  htmlFactura?: string,
  adjuntarFactura = false
) => {
  try {
    const respuesta = await fetch(`${getApiBaseUrl()}/correo/enviar-notificacion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        correo,
        nombreCliente,
        numeroOrden,
        total,
        detalles,
        asunto,
        htmlFactura,
        adjuntarFactura
      })
    })

    if (!respuesta.ok) {
      const error = await respuesta.json().catch(() => ({ error: 'Error al enviar notificación' }))
      throw new Error(error.detalle ? `${error.error || 'Error al enviar notificación'} (${error.detalle})` : error.error || 'Error al enviar notificación')
    }

    return await respuesta.json()
  } catch (error: any) {
    console.error('Error al enviar notificación:', error)
    throw error
  }
}