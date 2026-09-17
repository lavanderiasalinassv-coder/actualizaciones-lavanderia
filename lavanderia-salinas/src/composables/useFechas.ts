export const ZONA_HORARIA_NEGOCIO = 'America/Guatemala'

const partesFecha = (fecha: Date) => {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_HORARIA_NEGOCIO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(fecha)

  const valores = Object.fromEntries(partes.map((parte) => [parte.type, parte.value]))
  return { year: Number(valores.year), month: Number(valores.month), day: Number(valores.day) }
}

export const fechaHoyCentroamerica = () => {
  const { year, month, day } = partesFecha(new Date())
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const crearFechaDesdeValor = (valor: string | null) => {
  if (!valor) return null

  const fechaSolo = valor.trim()
  const coincideFecha = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fechaSolo)
  if (coincideFecha) {
    const [, year, month, day] = coincideFecha
    return new Date(Number(year), Number(month) - 1, Number(day))
  }

  const fecha = new Date(valor)
  return Number.isNaN(fecha.getTime()) ? null : fecha
}

// Convierte una fecha/hora ISO a YYYY-MM-DD (zona horaria del negocio), útil para precargar inputs type="date".
export const fechaISOaCentroamerica = (valor: string | null) => {
  if (!valor) return fechaHoyCentroamerica()

  const fecha = crearFechaDesdeValor(valor)
  if (!fecha || Number.isNaN(fecha.getTime())) return fechaHoyCentroamerica()

  const { year, month, day } = partesFecha(fecha)
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export const inicioFechaCentroamericaUTC = (valor: string) => {
  const [year, month, day] = valor.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day, 6, 0, 0, 0))
}

export const combinarFechaHoraCentroamerica = (fecha: string, hora: string) => {
  const [year, month, day] = fecha.split('-').map(Number)
  const [hours, minutes] = hora.split(':').map(Number)
  return new Date(Date.UTC(year, month - 1, day, hours + 6, minutes, 0, 0))
}

export const finFechaCentroamericaUTC = (valor: string) => {
  const inicioDelDiaSiguiente = inicioFechaCentroamericaUTC(valor)
  inicioDelDiaSiguiente.setUTCDate(inicioDelDiaSiguiente.getUTCDate() + 1)
  return new Date(inicioDelDiaSiguiente.getTime() - 1)
}

export const formatearFechaCentroamerica = (valor: string | null, opciones: Intl.DateTimeFormatOptions = {}) => {
  if (!valor) return 'No disponible'

  const fecha = crearFechaDesdeValor(valor)
  if (!fecha || Number.isNaN(fecha.getTime())) return 'No disponible'

  return new Intl.DateTimeFormat('es-ES', { timeZone: ZONA_HORARIA_NEGOCIO, ...opciones }).format(fecha)
}
