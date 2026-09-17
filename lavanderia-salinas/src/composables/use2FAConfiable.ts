const CLAVE_2FA_CONFIABLE = 'lavanderia_2fa_confiable'
const DURACION_2FA_CONFIABLE = 30 * 60 * 1000

export interface UsuarioConfiable {
  id: string
  nombre: string
  correo?: string
  rol: string
  codigo?: string
}

interface Registro2FAConfiable {
  codigoHash: string
  verificadoEn: number
  usuario: UsuarioConfiable
}

const obtenerHash = async (valor: string) => {
  const datos = new TextEncoder().encode(valor)
  const hash = await crypto.subtle.digest('SHA-256', datos)
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export const obtenerUsuarioConfiable = async (codigoIngresado: string, usuarioIdEsperado?: string) => {
  const confianzaGuardada = localStorage.getItem(CLAVE_2FA_CONFIABLE)
  if (!confianzaGuardada) return null

  try {
    const confianza = JSON.parse(confianzaGuardada) as Registro2FAConfiable
    if (!confianza.codigoHash || !confianza.verificadoEn || !confianza.usuario?.id) {
      localStorage.removeItem(CLAVE_2FA_CONFIABLE)
      return null
    }

    if (usuarioIdEsperado && confianza.usuario.id !== usuarioIdEsperado) {
      return null
    }

    if (Date.now() - confianza.verificadoEn >= DURACION_2FA_CONFIABLE) {
      localStorage.removeItem(CLAVE_2FA_CONFIABLE)
      return null
    }

    return (await obtenerHash(codigoIngresado)) === confianza.codigoHash ? confianza.usuario : null
  } catch {
    localStorage.removeItem(CLAVE_2FA_CONFIABLE)
    return null
  }
}

export const eliminarUsuarioConfiable = () => {
  localStorage.removeItem(CLAVE_2FA_CONFIABLE)
}

export const guardarUsuarioConfiable = async (codigoAcceso: string, usuario: UsuarioConfiable) => {
  localStorage.setItem(CLAVE_2FA_CONFIABLE, JSON.stringify({
    codigoHash: await obtenerHash(codigoAcceso),
    verificadoEn: Date.now(),
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol
    }
  }))
}
