import { computed, ref } from 'vue'
import { getApiBaseUrl } from '@/composables/useApiConfig'
import { useCajaMovimientos, type MovimientoCaja } from '@/composables/useCajaMovimientos'
import { useOrdenes, type Orden } from '@/composables/useOrdenes'
import { useTurno } from '@/composables/useTurno'
import { combinarFechaHoraCentroamerica } from '@/composables/useFechas'

export interface CierreTurnoOrdenResumen {
  id: string
  numero: string
  nombreCliente: string
  total: number
  montoRecibido: number
  cobradoEnTurno: number
  esReferencia: boolean
  estado: Orden['estado']
  estadoPago: Orden['estadoPago']
  createdAt: string
  updatedAt: string
  movimientos: {
    id: string
    texto: string
    fecha: string
    usuarioId: string | null
    usuarioNombre: string
  }[]
  anticipos: {
    id: string
    monto: number
    fecha: string
    turnoId: string
  }[]
}

export interface CierreTurnoMovimientoResumen {
  id: string
  tipo: MovimientoCaja['tipo']
  monto: number
  concepto: string
  creadoAt: string
}

export interface CierreTurnoResumen {
  id: string
  turnoId: string
  numeroCaja: number
  usuario: string
  apertura: number
  saldoCierre: number
  horaInicio: string | null
  cerradoAt: string
  notas: string
  totales: {
    cobrado: number
    depositos: number
    cancelaciones: number
    gastos: number
    recaudado: number
    gananciaNeta: number
    saldoEsperado: number
    diferencia: number
    ventas?: number
  }
  conteos: {
    ordenes: number
    canceladas: number
    gastos: number
    depositos: number
    cierres: number
  }
  ordenes: CierreTurnoOrdenResumen[]
  movimientos: CierreTurnoMovimientoResumen[]
  deposito?: {
    estado: 'pendiente' | 'depositado' | 'diferente'
    monto: number | null
    motivo: string | null
    revisadoAt: string | null
  }
}

const historialCierres = ref<CierreTurnoResumen[]>([])
let cierreEnCurso = false

const generarId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`.slice(0, 36)

const redondear = (valor: number) => Number(Number(valor || 0).toFixed(2))

const normalizarCierre = (cierre: any): CierreTurnoResumen => {
  const totales = cierre?.totales ?? {}
  const ordenes = Array.isArray(cierre?.ordenes) ? cierre.ordenes : []
  const cobrado = redondear(totales.cobrado ?? totales.ventas ?? 0)
  const depositos = redondear(totales.depositos ?? 0)
  const cancelaciones = redondear(totales.cancelaciones ?? 0)
  const gastos = redondear(totales.gastos ?? 0)
  const recaudado = redondear(cobrado - cancelaciones - gastos)
  const saldoEsperado = redondear(redondear(cierre?.apertura ?? 0) + recaudado - depositos)
  const diferencia = redondear(redondear(cierre?.saldoCierre ?? 0) - saldoEsperado)

  return {
    ...cierre,
    apertura: redondear(cierre?.apertura ?? 0),
    saldoCierre: redondear(cierre?.saldoCierre ?? 0),
    totales: {
      ventas: redondear(totales.ventas ?? cobrado),
      cobrado,
      depositos,
      cancelaciones,
      gastos,
      recaudado,
      gananciaNeta: recaudado,
      saldoEsperado,
      diferencia
    },
    movimientos: Array.isArray(cierre?.movimientos)
      ? cierre.movimientos.map((movimiento: any) => ({
          ...movimiento,
          id: String(movimiento?.id ?? generarId()),
          tipo: movimiento?.tipo ?? 'cierre',
          monto: redondear(movimiento?.monto ?? 0),
          concepto: String(movimiento?.concepto ?? ''),
          creadoAt: String(movimiento?.creadoAt ?? movimiento?.fecha ?? ''),
          turnoId: String(movimiento?.turnoId ?? cierre?.turnoId ?? ''),
          numeroCaja: Number(movimiento?.numeroCaja ?? cierre?.numeroCaja ?? 0),
          usuario: String(movimiento?.usuario ?? 'Sistema')
        }))
      : [],
    ordenes: ordenes.map((orden: any) => ({
      ...orden,
      total: redondear(orden?.total ?? 0),
      montoRecibido: redondear(orden?.montoRecibido ?? 0),
      esReferencia: Boolean(orden?.esReferencia),
      cobradoEnTurno: redondear(
        orden?.cobradoEnTurno ??
          (orden?.estadoPago === 'pagado'
            ? orden?.total ?? 0
            : orden?.montoRecibido ?? 0)
      ),
      anticipos: Array.isArray(orden?.anticipos)
        ? orden.anticipos.map((anticipo: any) => ({
            id: String(anticipo?.id ?? ''),
            monto: redondear(anticipo?.monto ?? 0),
            fecha: String(anticipo?.fecha ?? ''),
            turnoId: String(anticipo?.turnoId ?? '')
          }))
        : [],
      movimientos: Array.isArray(orden?.movimientos)
        ? orden.movimientos.map((movimiento: any) => ({
            id: String(movimiento?.id ?? generarId()),
            texto: String(movimiento?.texto ?? ''),
            fecha: String(movimiento?.fecha ?? ''),
            usuarioId: movimiento?.usuarioId ?? null,
            usuarioNombre: String(movimiento?.usuarioNombre ?? 'Sistema')
          }))
        : []
    }))
  }
}

const obtenerAnticiposDelTurno = (orden: Orden, turnoId: string) =>
  orden.anticipos.filter((anticipo) => anticipo.turnoId === turnoId)

const calcularCobradoEnTurno = (orden: Orden, turnoId: string) => {
  if (orden.estado === 'cancelada') return 0

  const cobrosDelTurno = obtenerAnticiposDelTurno(orden, turnoId)
    .reduce((acc, anticipo) => acc + anticipo.monto, 0)

  if (cobrosDelTurno > 0) return redondear(cobrosDelTurno)

  // Fallback solo para cierres antiguos sin detalle de anticipos.
  // Evita duplicar cobros cuando la orden se entrega en otro turno.
  if (
    orden.estadoPago === 'pagado' &&
    orden.turnoId === turnoId &&
    orden.anticipos.length === 0 &&
    orden.estado !== 'entregado'
  ) {
    return redondear(orden.montoRecibido)
  }

  return 0
}

const tieneCobroEnTurno = (orden: Orden, turnoId: string) =>
  orden.estado !== 'cancelada' && (
    orden.anticipos.some((anticipo) => anticipo.turnoId === turnoId) ||
    (orden.estadoPago === 'pagado' &&
      orden.turnoId === turnoId &&
      orden.anticipos.length === 0 &&
      orden.estado !== 'entregado')
  )

const estadoAlCerrarTurno = (orden: Orden): Orden['estado'] =>
  orden.estado === 'entregado'
    ? 'cerrada'
    : orden.estado === 'cancelada'
      ? 'Cerrada-Cancelada'
      : orden.estado

const fueCanceladaEnTurno = (
  orden: Orden,
  turnoId: string,
  inicioTurno: Date | null,
  finTurno: Date
) => {
  if (orden.estado !== 'cancelada') return false

  const canceladaAt = new Date(orden.updatedAt)
  const canceladaValida = !Number.isNaN(canceladaAt.getTime())
  const inicioValido = inicioTurno && !Number.isNaN(inicioTurno.getTime())
  const finValido = !Number.isNaN(finTurno.getTime())

  if (canceladaValida && inicioValido && finValido) {
    return canceladaAt >= inicioTurno && canceladaAt <= finTurno
  }

  // Compatibilidad para datos antiguos sin timestamps confiables.
  return orden.turnoId === turnoId
}

const cargarHistorial = async () => {
  const respuesta = await fetch(`${getApiBaseUrl()}/cierres-caja`)
  if (!respuesta.ok) throw new Error('No se pudo cargar el historial de cierres.')
  const datos = await respuesta.json()
  historialCierres.value = Array.isArray(datos) ? datos.map(normalizarCierre) : []
}

const eliminarCierre = async (id: string) => {
  const respuesta = await fetch(`${getApiBaseUrl()}/cierres-caja/${id}`, { method: 'DELETE' })
  const resultado = await respuesta.json()
  if (!respuesta.ok) throw new Error(resultado.error || 'No se pudo eliminar el cierre.')
  historialCierres.value = historialCierres.value.filter((cierre) => cierre.id !== id)
  return resultado
}
void cargarHistorial().catch(() => {})

export function useHistorialCierres() {
  const { turno, cerrarTurno } = useTurno()
  const { ordenes, cargarOrdenes, cambiarEstado } = useOrdenes()
  const { movimientos, registrarCierre, limpiarMovimientosDelTurno } = useCajaMovimientos()

  const cierresDelTurnoActual = computed(() =>
    turno.id ? historialCierres.value.filter((cierre) => cierre.turnoId === turno.id) : []
  )

  const obtenerCierrePorId = (id: string) =>
    historialCierres.value.find((cierre) => cierre.id === id) ?? null

  const registrarCierreTurno = async (saldoCierre: number, notas?: string, fecha?: string, usuarioRol?: string) => {
    if (cierreEnCurso || !turno.abierto || !turno.id) return null
    if (historialCierres.value.some((cierre) => cierre.turnoId === turno.id)) return null
    cierreEnCurso = true

    try {
      const saldoFinal = redondear(saldoCierre)
    const cierreMovimiento = saldoFinal > 0
      ? await registrarCierre({
          monto: saldoFinal,
          concepto: `Cierre de caja #${turno.numeroCaja}`
        })
      : null

    const movimientosTurno = movimientos.value.filter((movimiento) => movimiento.turnoId === turno.id)
    const horaActualStr = new Date().toTimeString().slice(0, 5)
    const cierreTurnoAt = fecha
      ? combinarFechaHoraCentroamerica(fecha, horaActualStr)
      : new Date(cierreMovimiento?.creadoAt ?? new Date().toISOString())
    const inicioTurnoAt = turno.horaInicio ? new Date(turno.horaInicio) : null
    const gastosTurno = movimientosTurno.filter((movimiento) => movimiento.tipo === 'gasto')
    const depositosTurno = movimientosTurno.filter((movimiento) => movimiento.tipo === 'deposito')
    const cierresTurno = movimientosTurno.filter((movimiento) => movimiento.tipo === 'cierre')
    const anticiposDelTurno = ordenes.value.flatMap((orden) =>
      obtenerAnticiposDelTurno(orden, turno.id)
        .map((anticipo) => ({ orden, anticipo }))
    )
    const ordenesConCobroEnTurno = Array.from(
      new Map(anticiposDelTurno.map(({ orden }) => [orden.id, orden])).values()
    )

    const ordenesCreadasTurno = ordenes.value.filter((orden) => orden.turnoId === turno.id)

    const ordenesTurno = Array.from(
      new Map(
        [...ordenesCreadasTurno, ...ordenesConCobroEnTurno].map((orden) => [orden.id, orden])
      ).values()
    )
    const ordenesCerrablesTurno = ordenesTurno.filter((orden) => orden.estado === 'entregado')
    const ordenesReferenciaAnticipoTurno = ordenesConCobroEnTurno.filter((orden) => orden.estado !== 'entregado')
    const canceladasTurno = ordenes.value.filter((orden) =>
      fueCanceladaEnTurno(orden, turno.id, inicioTurnoAt, cierreTurnoAt)
    )
    const ordenesHistorialTurno = Array.from(
      new Map(
        [...ordenesCerrablesTurno, ...ordenesReferenciaAnticipoTurno, ...canceladasTurno]
          .map((orden) => [orden.id, orden])
      ).values()
    )

    const totalGastos = redondear(gastosTurno.reduce((acc, movimiento) => acc + movimiento.monto, 0))
    const totalDepositos = redondear(depositosTurno.reduce((acc, movimiento) => acc + movimiento.monto, 0))
    const totalCancelaciones = redondear(
      canceladasTurno.reduce((acc, orden) => acc + Math.max(0, Number(orden.total || 0)), 0)
    )
    const totalCobradoEnOrdenes = redondear(
      ordenesTurno
        .filter((orden) => tieneCobroEnTurno(orden, turno.id))
        .reduce((acc, orden) => acc + calcularCobradoEnTurno(orden, turno.id), 0)
    )
    const totalRecaudado = redondear(totalCobradoEnOrdenes - totalCancelaciones - totalGastos)

    const saldoEsperado = redondear(
      turno.apertura +
      totalRecaudado -
      totalDepositos
    )

    const snapshot: CierreTurnoResumen = {
      id: generarId(),
      turnoId: turno.id,
      numeroCaja: turno.numeroCaja,
      usuario: turno.usuario,
      apertura: redondear(turno.apertura),
      saldoCierre: saldoFinal,
      horaInicio: turno.horaInicio,
      cerradoAt: cierreTurnoAt.toISOString(),
      notas: (notas?.trim() || turno.notas || '').trim(),
      totales: {
        cobrado: totalCobradoEnOrdenes,
        depositos: totalDepositos,
        cancelaciones: totalCancelaciones,
        gastos: totalGastos,
        recaudado: totalRecaudado,
        ventas: totalCobradoEnOrdenes,
        gananciaNeta: redondear(totalRecaudado),
        saldoEsperado,
        diferencia: redondear(saldoFinal - saldoEsperado)
      },
      conteos: {
        ordenes: ordenesCerrablesTurno.length,
        canceladas: canceladasTurno.length,
        gastos: gastosTurno.length,
        depositos: depositosTurno.length,
        cierres: cierresTurno.length + (cierreMovimiento ? 1 : 0)
      },
      ordenes: ordenesHistorialTurno
        .map((orden) => ({
          id: orden.id,
          numero: orden.numero,
          nombreCliente: orden.nombreCliente,
          total: orden.total,
          montoRecibido: orden.montoRecibido,
          cobradoEnTurno: calcularCobradoEnTurno(orden, turno.id),
          esReferencia: orden.estado !== 'entregado',
          estado: estadoAlCerrarTurno(orden),
          estadoPago: orden.estadoPago,
          createdAt: orden.createdAt,
          updatedAt: orden.updatedAt,
          anticipos: obtenerAnticiposDelTurno(orden, turno.id).map((anticipo) => ({
            id: anticipo.id,
            monto: redondear(anticipo.monto),
            fecha: anticipo.fecha,
            turnoId: anticipo.turnoId
          })),
          movimientos: orden.movimientos.map((movimiento) => ({
            id: movimiento.id,
            texto: movimiento.texto,
            fecha: movimiento.fecha,
            usuarioId: movimiento.usuarioId,
            usuarioNombre: movimiento.usuarioNombre
          }))
        }))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      movimientos: movimientosTurno
        .map((movimiento) => ({
          id: movimiento.id,
          tipo: movimiento.tipo,
          monto: movimiento.monto,
          concepto: movimiento.concepto,
          creadoAt: movimiento.creadoAt
        }))
        .sort((a, b) => b.creadoAt.localeCompare(a.creadoAt))
    }

    const turnoCerradoId = turno.id
    const respuesta = await fetch(`${getApiBaseUrl()}/cierres-caja`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(snapshot)
    })
    const guardado = await respuesta.json().catch(() => null)
    if (!respuesta.ok) {
      throw new Error(guardado?.error ?? 'No se pudo guardar el historial de cierre.')
    }

    const cierreGuardado = normalizarCierre({ ...snapshot, ...(guardado ?? {}) })
    historialCierres.value = [
      cierreGuardado,
      ...historialCierres.value.filter((cierre) => cierre.id !== cierreGuardado.id && cierre.turnoId !== turnoCerradoId)
    ]

    // Las órdenes canceladas se archivan al cierre para que no se arrastren al siguiente turno.
    await Promise.all(
      canceladasTurno.map(async (orden) => {
        try {
          await cambiarEstado(orden.id, 'Cerrada-Cancelada')
        } catch {
          // Si una orden no puede archivarse, no bloquea el cierre completo.
        }
      })
    )

    await cerrarTurno(saldoFinal, fecha, usuarioRol)
    await cargarOrdenes()
    await limpiarMovimientosDelTurno(turnoCerradoId)
      return cierreGuardado
    } finally {
      cierreEnCurso = false
    }
  }

  const limpiarHistorialCierres = () => {
    historialCierres.value = []
  }

  return {
    historialCierres,
    cierresDelTurnoActual,
    obtenerCierrePorId,
    registrarCierreTurno,
    cargarHistorial,
    eliminarCierre,
    limpiarHistorialCierres
  }
}
