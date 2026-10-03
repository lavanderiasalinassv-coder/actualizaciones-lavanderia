const PREFIJO_CUPON_INTERNO = 'LAVANDERIA_SALINAS:COUPON:'

export const crearPayloadCupon = (promocionId: string): string =>
  `${PREFIJO_CUPON_INTERNO}${promocionId}`

export const obtenerIdPromocionDelCupon = (payload: string): string | null => {
  if (!payload.startsWith(PREFIJO_CUPON_INTERNO)) return null

  const promocionId = payload.slice(PREFIJO_CUPON_INTERNO.length).trim()
  return promocionId || null
}