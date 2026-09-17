import { computed, ref } from 'vue'
import { useOrdenes, type Orden, type OrdenEstado, type EstadoPago } from '@/composables/useOrdenes'
import { useTurno } from '@/composables/useTurno'
import { inicioFechaCentroamericaUTC, ZONA_HORARIA_NEGOCIO } from '@/composables/useFechas'

export type RangoReporte = 7 | 14 | 30

const COLOR_ESTADO: Record<OrdenEstado, string> = {
  pendiente: '#d97706',
  en_proceso: '#4fb3e0',
  listo: '#16a34a',
  entregado: '#16a34a',
  cerrada: '#6b7280',
  cancelada: '#dc2626',
  'Cerrada-Cancelada': '#7f1d1d'
}

const COLOR_PAGO: Record<EstadoPago, string> = {
  porCobrar: '#f0c419',
  anticipo: '#123a66',
  pagado: '#16a34a'
}

const inicioDe = (dias: number, desplazamiento = 0) => {
  const hoy = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_HORARIA_NEGOCIO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date())
  const fecha = inicioFechaCentroamericaUTC(hoy)
  fecha.setUTCDate(fecha.getUTCDate() - (dias - 1) - (desplazamiento * dias))
  return fecha
}

const calcularCobradoEnTurno = (orden: Orden, turnoId: string) => {
  const anticiposTotales = orden.anticipos.reduce(
    (acc, anticipo) => acc + Number(anticipo.monto || 0),
    0
  )

  const anticiposDelTurno = orden.anticipos
    .filter((anticipo) => anticipo.turnoId === turnoId)
    .reduce((acc, anticipo) => acc + Number(anticipo.monto || 0), 0)

  if (anticiposDelTurno > 0) {
    return Number(anticiposDelTurno.toFixed(2))
  }

  if (
    orden.estadoPago === 'pagado' &&
    orden.turnoId === turnoId
  ) {
    const saldo = Math.max(
      0,
      Number(orden.total) - anticiposTotales
    )

    return Number(saldo.toFixed(2))
  }

  if (
    orden.estadoPago === 'pagado' &&
    orden.turnoId === turnoId &&
    orden.anticipos.length === 0 &&
    orden.estado !== 'entregado'
  ) {
    return Number(orden.montoRecibido.toFixed(2))
  }

  return 0
}

const tieneCobroEnTurno = (orden: Orden, turnoId: string) =>
  calcularCobradoEnTurno(orden, turnoId) > 0

const esVentaDelTurno = (orden: Orden, turnoId: string) =>
  orden.estado !== 'cancelada' &&
  orden.estado !== 'Cerrada-Cancelada' &&
  tieneCobroEnTurno(orden, turnoId)

export function useReportes() {
  const { ordenes } = useOrdenes()
  const { turno } = useTurno()

  const rango = ref<RangoReporte>(7)
  const desplazamientoRango = ref(0)
  const busqueda = ref('')
  const filtroEstado = ref<'todos' | OrdenEstado>('todos')

  const irRangoAnterior = () => { desplazamientoRango.value += 1 }
  const irRangoSiguiente = () => { desplazamientoRango.value = Math.max(0, desplazamientoRango.value - 1) }

const ordenesHoy = computed(() =>
  turno.abierto && turno.id
    ? ordenes.value.filter((o) => tieneCobroEnTurno(o, turno.id) && o.estado !== 'cancelada' && o.estado !== 'Cerrada-Cancelada')
    : []
)

const ventasHoy = computed(() => {
  if (!turno.abierto || !turno.id) return 0

  return ordenes.value.reduce(
    (acc, orden) =>
      acc + calcularCobradoEnTurno(orden, turno.id),
    0
  )
})

const cobradoHoy = computed(() => {
  if (!turno.abierto || !turno.id) return 0
  const ordenesAsignadas = ordenes.value.filter((o) => tieneCobroEnTurno(o, turno.id) && o.estado !== 'cancelada' && o.estado !== 'Cerrada-Cancelada')
  const idsAsignadas = new Set(ordenesAsignadas.map((orden) => orden.id))
  const cobradoEnOrdenesAsignadas = ordenesAsignadas.reduce(
    (acc, orden) => acc + calcularCobradoEnTurno(orden, turno.id),
    0,
  )
  const anticiposSinAsignar = ordenes.value.reduce((acc, orden) => {
    if (idsAsignadas.has(orden.id)) return acc
    return (
      acc +
      orden.anticipos
        .filter((anticipo) => anticipo.turnoId === turno.id)
        .reduce((sum, anticipo) => sum + anticipo.monto, 0)
    )
  }, 0)

  return cobradoEnOrdenesAsignadas + anticiposSinAsignar
})

  const anticiposHoy = computed(() => {
    if (!turno.abierto || !turno.id) return 0
    return Number(
      ordenes.value
        .filter(
          (orden) =>
            orden.estado !== 'cancelada' &&
            orden.estado !== 'Cerrada-Cancelada' &&
            Number(orden.montoRecibido || 0) > 0 &&
            Number(orden.montoRecibido || 0) < Number(orden.total || 0)
        )
        .flatMap((orden) => orden.anticipos)
        .filter((anticipo) => anticipo.turnoId === turno.id)
        .reduce((total, anticipo) => total + anticipo.monto, 0)
        .toFixed(2)
    )
  })

  // Cobros del turno actual, desglosados por origen
const detalleCobrosHoy = computed(() => {
  if (!turno.abierto || !turno.id) return []

  return ordenes.value
    .filter((o) => o.estado !== 'cancelada' && o.estado !== 'Cerrada-Cancelada' && tieneCobroEnTurno(o, turno.id))
    .map((o) => {
      const cobradoHoy = calcularCobradoEnTurno(o, turno.id)
      const anticipoPrevio = o.anticipos
        .filter((a) => a.turnoId !== turno.id)
        .reduce((acc, a) => acc + a.monto, 0)

      return {
        ordenId: o.id,
        numero: o.numero,
        total: o.total,
        cobradoHoy,
        tieneAnticipoPrevio: anticipoPrevio > 0,
        anticipoPrevio,
        esAnticipoParcial: o.estadoPago !== 'pagado' // dejó anticipo hoy pero aún debe saldo
      }
    })
})

// Separación para las tarjetas del reporte
const anticiposDejadosHoy = computed(() =>
  detalleCobrosHoy.value
    .filter((c) => c.esAnticipoParcial)
    .reduce((acc, c) => acc + c.cobradoHoy, 0)
)

const saldosLiquidadosHoy = computed(() =>
  detalleCobrosHoy.value
    .filter((c) => !c.esAnticipoParcial && c.tieneAnticipoPrevio)
    .reduce((acc, c) => acc + c.cobradoHoy, 0)
)

const ventasDeContadoHoy = computed(() =>
  detalleCobrosHoy.value
    .filter((c) => !c.esAnticipoParcial && !c.tieneAnticipoPrevio)
    .reduce((acc, c) => acc + c.cobradoHoy, 0)
)
  const ordenesEnProceso = computed(() =>
    ordenes.value.filter((o) => o.estado === 'pendiente' || o.estado === 'en_proceso')
  )

  const enProcesoTotal = computed(() => ordenesEnProceso.value.reduce((acc, o) => acc + o.total, 0))

  const ordenesPendientesCobro = computed(() =>
    ordenes.value.filter((o) => o.estado !== 'cancelada' && o.estado !== 'Cerrada-Cancelada' && o.estadoPago !== 'pagado')
  )

  const pendienteCobroTotal = computed(() =>
    ordenesPendientesCobro.value.reduce((acc, o) => acc + Math.max(0, o.total - o.montoRecibido), 0)
  )

  const ordenesCanceladas = computed(() => {
    if (!turno.abierto || !turno.id) return []

    const inicioTurno = turno.horaInicio ? new Date(turno.horaInicio) : null
    const inicioValido = inicioTurno && !Number.isNaN(inicioTurno.getTime())

    return ordenes.value.filter((orden) => {
      if (orden.estado !== 'cancelada') return false

      const canceladaAt = new Date(orden.updatedAt)
      const canceladaValida = !Number.isNaN(canceladaAt.getTime())
      if (inicioValido && canceladaValida) {
        return canceladaAt >= inicioTurno
      }

      // Fallback para datos antiguos sin timestamp confiable.
      return orden.turnoId === turno.id
    })
  })

  const canceladasTotalPerdido = computed(() => ordenesCanceladas.value.reduce((acc, o) => acc + o.total, 0))

  /* ───────────────── Rango seleccionado (7/14/30 días) ───────────────── */

  const ordenesEnRango = computed(() => {
    const desde = inicioDe(rango.value, desplazamientoRango.value)
    const hasta = new Date(desde)
    hasta.setUTCDate(hasta.getUTCDate() + rango.value)
    return ordenes.value.filter((o) => {
      const creada = new Date(o.createdAt)
      return creada >= desde && creada < hasta
    })
  })

  const ventasRangoTotal = computed(() =>
    ordenesEnRango.value.filter((o) => o.estado !== 'cancelada' && o.estado !== 'Cerrada-Cancelada').reduce((acc, o) => acc + o.total, 0)
  )

  const cobradoRangoTotal = computed(() =>
    ordenesEnRango.value.reduce((acc, o) => acc + o.montoRecibido, 0)
  )

  /** Serie diaria para la gráfica de barras: últimos N días, incluyendo días sin ventas. */
  const ventasPorDia = computed(() => {
    const dias: { fecha: Date; label: string; total: number }[] = []
    for (let i = rango.value - 1; i >= 0; i--) {
      const hoy = new Intl.DateTimeFormat('en-CA', {
        timeZone: ZONA_HORARIA_NEGOCIO,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(new Date())
      const fecha = inicioFechaCentroamericaUTC(hoy)
      fecha.setUTCDate(fecha.getUTCDate() - i - (desplazamientoRango.value * rango.value))
      dias.push({
        fecha,
        label: fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', timeZone: ZONA_HORARIA_NEGOCIO }),
        total: 0
      })
    }

    for (const orden of ordenesEnRango.value) {
      if (orden.estado === 'cancelada' || orden.estado === 'Cerrada-Cancelada') continue
      const creada = new Date(orden.createdAt)
      const dia = dias.find(
        (d) =>
          d.fecha.toLocaleDateString('en-CA', { timeZone: ZONA_HORARIA_NEGOCIO }) ===
          creada.toLocaleDateString('en-CA', { timeZone: ZONA_HORARIA_NEGOCIO })
      )
      if (dia) dia.total += orden.total
    }

    return dias
  })

  const maxVentaDiaria = computed(() => Math.max(1, ...ventasPorDia.value.map((d) => d.total)))

  /* ───────────────── Distribución por estado (donut) ───────────────── */

  const distribucionEstados = computed(() => {
    const labels: Record<OrdenEstado, string> = {
      pendiente: 'Pendiente',
      en_proceso: 'En proceso',
      listo: 'Listo',
      entregado: 'Entregado',
      cerrada: 'Cerrada',
      cancelada: 'Cancelada',
      'Cerrada-Cancelada': 'Cerrada-Cancelada'
    }
    const conteos: Record<OrdenEstado, number> = {
      pendiente: 0,
      en_proceso: 0,
      listo: 0,
      entregado: 0,
      cerrada: 0,
      cancelada: 0,
      'Cerrada-Cancelada': 0
    }
    for (const o of ordenesEnRango.value) {
      if (o.estado === 'cerrada' || o.estado === 'Cerrada-Cancelada') continue
      conteos[o.estado]++
    }

    const total = Object.values(conteos).reduce((a, b) => a + b, 0)

    return (Object.keys(conteos) as OrdenEstado[])
      .filter((estado) => estado !== 'cerrada' && estado !== 'Cerrada-Cancelada')
      .map((estado) => ({
      estado,
      label: labels[estado],
      color: COLOR_ESTADO[estado],
      cantidad: conteos[estado],
      porcentaje: total ? Math.round((conteos[estado] / total) * 100) : 0
      }))
  })

  const totalEstadosGrafico = computed(() =>
    distribucionEstados.value.reduce((total, estado) => total + estado.cantidad, 0)
  )

  /** String listo para usar en background: conic-gradient(...) */
  const gradienteEstados = computed(() => {
    let acumulado = 0
    const segmentos = distribucionEstados.value
      .filter((d) => d.cantidad > 0)
      .map((d) => {
        const total = totalEstadosGrafico.value || 1
        const inicio = (acumulado / total) * 100
        acumulado += d.cantidad
        const fin = (acumulado / total) * 100
        return `${d.color} ${inicio}% ${fin}%`
      })

    return segmentos.length ? `conic-gradient(${segmentos.join(', ')})` : 'conic-gradient(#e5edf3 0% 100%)'
  })


  const distribucionPago = computed(() => {
    const labels: Record<EstadoPago, string> = { porCobrar: 'Por cobrar', anticipo: 'Anticipo', pagado: 'Pagado' }
    const montos: Record<EstadoPago, number> = { porCobrar: 0, anticipo: 0, pagado: 0 }

    for (const o of ordenesEnRango.value) {
      if (o.estado === 'cancelada' || o.estado === 'Cerrada-Cancelada') continue
      montos[o.estadoPago] += o.total
    }

    return (Object.keys(montos) as EstadoPago[]).map((estado) => ({
      estado,
      label: labels[estado],
      color: COLOR_PAGO[estado],
      monto: montos[estado]
    }))
  })


  const historial = computed<Orden[]>(() => {
    const consulta = busqueda.value.trim().toLowerCase()

    return ordenesEnRango.value
      .filter((o) => filtroEstado.value === 'todos' || o.estado === filtroEstado.value)
      .filter((o) => {
        if (!consulta) return true
        return [o.numero, o.nombreCliente, o.telefono].join(' ').toLowerCase().includes(consulta)
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  })

  return {
    rango,
    desplazamientoRango,
    irRangoAnterior,
    irRangoSiguiente,
    busqueda,
    filtroEstado,

    ventasHoy,
    ordenesHoy,
    cobradoHoy,
    anticiposHoy,

    ordenesEnProceso,
    enProcesoTotal,

    ordenesPendientesCobro,
    pendienteCobroTotal,

    ordenesCanceladas,
    canceladasTotalPerdido,

    ventasRangoTotal,
    cobradoRangoTotal,
    ventasPorDia,
    maxVentaDiaria,

    distribucionEstados,
    gradienteEstados,
    totalEstadosGrafico,
    distribucionPago,

    historial
  }
}
