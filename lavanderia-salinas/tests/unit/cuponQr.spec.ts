import { describe, expect, it } from 'vitest'
import { crearPayloadCupon, obtenerIdPromocionDelCupon } from '@/utils/cuponQr'

describe('cuponQr', () => {
  it('resuelve el ID de promoción de un QR interno', () => {
    const payload = crearPayloadCupon('promo-123')

    expect(obtenerIdPromocionDelCupon(payload)).toBe('promo-123')
  })

  it('rechaza payloads externos y referencias vacías', () => {
    expect(obtenerIdPromocionDelCupon('https://example.com')).toBeNull()
    expect(obtenerIdPromocionDelCupon(crearPayloadCupon('   '))).toBeNull()
  })
})