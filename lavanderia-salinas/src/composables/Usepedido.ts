import { computed, reactive, ref, watchEffect } from 'vue'
import { useOrdenes } from '@/composables/useOrdenes'
import { useTurno } from '@/composables/useTurno'
import { registrarOrdenCliente } from '@/composables/useClientes'
import { useInventario } from '@/composables/useInventario'
import { enviarCorreoHTML } from '@/composables/useCorreo'
import type { ClasificacionPrendas, ItemCatalogo, UnidadServicio } from '@/composables/Usecatalogo'
import type { ConsumoInventario, UnidadMedida } from '@/composables/useInventario'
import { formatearFechaCentroamerica } from '@/composables/useFechas'

export interface ItemPedido {
  id: string
  nombre: string
  precio: number
  unidad: UnidadServicio
  clasificacionPrendas: ClasificacionPrendas
  cantidad: number
  nota: string
  insumos: ConsumoInventario[]
}

export interface OrdenCreada {
  numero: string
  nombreCliente: string
  createdAt: string
  total: number
  subtotal: number
  descuento: number
  descuentoManual: number
  descuentoPromocion: number
  items: ItemPedido[]
  telefono: string
  codigoPais: string
  correo: string
  fechaEntregaActiva: boolean
  fechaEntregaTexto: string
  anaquel: number | null
  fotos: string[]
  estado: string
  estadoPago: string
  montoRecibido: number
  cantidadPrendas?: number
  detallesPrendas?: string
}

export interface FacturaOrdenCorreo {
  numero: string
  nombreCliente: string
  createdAt: string
  total: number
  subtotal: number
  descuento: number
  items: Array<{ nombre: string; precio: number; cantidad: number; clasificacionPrendas?: ClasificacionPrendas }>
  correo: string
  fechaEntregaActiva: boolean
  fechaEntregaTexto: string
  cantidadPrendas?: number
  detallesPrendas?: string
  deliveredAt?: string
  estado: string
  estadoPago: string
  montoRecibido: number
  esFacturaFinal?: boolean
}

export interface FaltanteInsumoPedido {
  productoId: string
  nombreProducto: string
  unidadMedida: string
  requerido: number
  disponible: number
  faltante: number
}

export interface ResultadoCrearOrden {
  orden: Awaited<ReturnType<ReturnType<typeof useOrdenes>['crearOrden']>> | null
  faltantes: FaltanteInsumoPedido[]
  error?: string
}

const fechaHoyISO = () => {
  const hoy = new Date()
  const offset = hoy.getTimezoneOffset()
  const local = new Date(hoy.getTime() - offset * 60 * 1000)
  return local.toISOString().split('T')[0]
}

const horaEntregaPorDefecto = () => {
  const ahora = new Date()
  ahora.setHours(ahora.getHours() + 1)
  const horas = String(ahora.getHours()).padStart(2, '0')
  const minutos = String(ahora.getMinutes()).padStart(2, '0')
  return `${horas}:${minutos}`
}


const CLAVE_CONTADOR = 'lavanderia_contador_ordenes'

const generarNumeroOrden = () => {
  const actual = Number(localStorage.getItem(CLAVE_CONTADOR) ?? '0') + 1
  localStorage.setItem(CLAVE_CONTADOR, String(actual))
  return `#${String(actual).padStart(5, '0')}`
}

const escaparHtml = (texto: string) =>
  texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const formatearFechaCorta = (valor: string) =>
  formatearFechaCentroamerica(valor, {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })

const formatearFechaHora = (valor: string) =>
  formatearFechaCentroamerica(valor, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

const textoEstado = (estado: string) => {
  const estados: Record<string, string> = {
    pendiente: 'Pendiente',
    en_proceso: 'En proceso',
    listo: 'Listo',
    entregado: 'Entregado'
  }
  return estados[estado] || estado
}

const textoEstadoPago = (estado: string) => {
  const estados: Record<string, string> = {
    porCobrar: 'Por cobrar',
    pagado: 'Pagado',
    anticipo: 'Anticipo'
  }
  return estados[estado] || estado
}

export const generarHtmlFacturaOrden = (orden: FacturaOrdenCorreo) => {
  const fecha = formatearFechaCorta(orden.createdAt)
  const fechaEntregaReal = orden.deliveredAt ? formatearFechaHora(orden.deliveredAt) : ''
  const subtotal = Math.max(0, Number(orden.subtotal) || 0)
  const descuento = Math.min(subtotal, Math.max(0, Number(orden.descuento) || 0))
  const montoRecibido = Math.max(0, Number(orden.montoRecibido) || 0)
  const total = Math.max(0, Number(orden.total) || 0)
  const saldoPendiente = orden.estado === 'cancelada'
    ? -Math.abs(orden.total - montoRecibido)
    : Math.max(0, orden.total - montoRecibido)
  const estadoPagoColor = orden.estadoPago === 'pagado'
    ? '#15803d'
    : orden.estadoPago === 'anticipo'
      ? '#2563eb'
      : '#d97706'
  
  const prendasRecibidas = Number(orden.cantidadPrendas || 0)

  const itemsHtml = orden.items
    .map(
      (item) => `
        <tr>
          <td style="padding:12px 9px;border-bottom:1px solid #e6edf3;font-size:1.08rem;">${escaparHtml(item.nombre)}</td>
          <td style="padding:12px 9px;border-bottom:1px solid #e6edf3;font-size:1.08rem;text-align:center;">${item.cantidad}</td>
          <td style="padding:12px 9px;border-bottom:1px solid #e6edf3;font-size:1.08rem;text-align:center;">$${item.precio.toFixed(2)}</td>
          <td style="padding:12px 9px;border-bottom:1px solid #e6edf3;font-size:1.08rem;text-align:center;">$${(item.precio * item.cantidad).toFixed(2)}</td>
        </tr>
      `
    )
    .join('')

  const celdasInfo = [
    { label: 'Estado de pago', valor: `<strong style="color:${estadoPagoColor};">${textoEstadoPago(orden.estadoPago)}</strong>` },
    { label: 'Monto recibido', valor: `$${montoRecibido.toFixed(2)}` },
    { label: 'Prendas recibidas', valor: `${prendasRecibidas} prendas` },
    { label: 'Entrega', valor: orden.fechaEntregaActiva ? escaparHtml(orden.fechaEntregaTexto) : 'Sin fecha' },
    ...(fechaEntregaReal ? [{ label: 'Entregada el', valor: `<strong>${escaparHtml(fechaEntregaReal)}</strong>` }] : [])
  ]

  const filasInfo: string[] = []
  for (let i = 0; i < celdasInfo.length; i += 2) {
    const izquierda = celdasInfo[i]
    const derecha = celdasInfo[i + 1]
    filasInfo.push(`
      <tr>
        <td style="padding:0 12px 14px 0;font-size:1.08rem;vertical-align:top;width:50%;">
          <span style="display:block;color:#6f8399;font-size:0.9rem;text-transform:uppercase;letter-spacing:0.05em;">${izquierda.label}</span>
          ${izquierda.valor}
        </td>
        <td style="padding:0 0 14px 12px;font-size:1.08rem;vertical-align:top;width:50%;">
          ${derecha ? `<span style="display:block;color:#6f8399;font-size:0.9rem;text-transform:uppercase;letter-spacing:0.05em;">${derecha.label}</span>${derecha.valor}` : ''}
        </td>
      </tr>
    `)
  }

  return `
    <html>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; color: #0a1f38;">
        <div style="height:5mm;background:#123a66;"></div>
        <div style="position:relative;min-height:279mm;padding-bottom:68mm;box-sizing:border-box;">
          <div style="max-width:980px;margin:0 auto;border:1px solid #e5edf3;border-radius:10px;padding:24px 28px;">
            <table role="presentation" style="width:100%;margin-bottom:20px;border-collapse:collapse;">
              <tr>
                <td style="width:126px;vertical-align:middle;">
                  <img src="cid:logo-factura" alt="Logo de Lavandería Salinas" width="112" height="112" style="width:112px;height:112px;object-fit:contain;display:block;" />
                </td>
                <td style="vertical-align:middle;padding-left:18px;">
                  <h1 style="margin:0;font-size:2.4rem;">Lavandería Salinas</h1>
                  <p style="margin:4px 0 0;font-size:1.05rem;color:#6f8399;">Tu orden</p>
                </td>
              </tr>
            </table>

            <div style="background:#f3fbfa;border:1px solid #cdebe6;border-radius:10px;padding:19px 22px;margin:18px 0;font-size:1.18rem;">
              <div><strong style="color:#123a66;">Orden ${escaparHtml(orden.numero)}</strong></div>
              <p style="margin:8px 0 0;">Cliente: ${escaparHtml(orden.nombreCliente)}</p>
              <p style="margin:8px 0 0;">Fecha de creación: ${fecha}</p>
              <p style="margin:8px 0 0;">Prendas recibidas: <strong>${prendasRecibidas}</strong></p>
              ${orden.detallesPrendas ? `<p style="margin:8px 0 0;">Detalles: ${escaparHtml(orden.detallesPrendas)}</p>` : ''}
              <p style="margin:8px 0 0;"><strong>Saldo pendiente:</strong> $${saldoPendiente.toFixed(2)}</p>
            </div>

            <table role="presentation" style="width:100%;margin:16px 0;border-collapse:collapse;">
              ${filasInfo.join('')}
            </table>

            <div style="margin-top:20px;">
              <h3 style="margin:0 0 12px;font-size:1.35rem;color:#123a66;">Servicios</h3>
              <table role="presentation" style="width:100%;border-collapse:collapse;margin-top:10px;">
                <thead>
                  <tr>
                    <th style="text-align:left;color:#5c7289;font-size:0.9rem;text-transform:uppercase;letter-spacing:0.05em;padding:12px 9px;border-bottom:1px solid #e6edf3;">Servicio</th>
                    <th style="text-align:center;color:#5c7289;font-size:0.9rem;text-transform:uppercase;letter-spacing:0.05em;padding:12px 9px;border-bottom:1px solid #e6edf3;">Cant.</th>
                    <th style="text-align:center;color:#5c7289;font-size:0.9rem;text-transform:uppercase;letter-spacing:0.05em;padding:12px 9px;border-bottom:1px solid #e6edf3;">Precio</th>
                    <th style="text-align:center;color:#5c7289;font-size:0.9rem;text-transform:uppercase;letter-spacing:0.05em;padding:12px 9px;border-bottom:1px solid #e6edf3;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>${itemsHtml}</tbody>
              </table>
            </div>

            <table role="presentation" style="width:330px;margin:22px 0 0 auto;padding:12px 16px;border:1px solid #c9d9e8;border-radius:8px;background:#f8fbfe;border-collapse:collapse;">
              <tr><td style="padding:7px 0;font-size:1rem;">Subtotal</td><td style="padding:7px 0;font-size:1rem;text-align:right;">$${subtotal.toFixed(2)}</td></tr>
              <tr><td style="padding:7px 0;font-size:1rem;">Descuentos</td><td style="padding:7px 0;font-size:1rem;text-align:right;">-$${descuento.toFixed(2)}</td></tr>
              ${orden.esFacturaFinal ? '' : `<tr><td style="padding:7px 0;font-size:1rem;">Anticipo</td><td style="padding:7px 0;font-size:1rem;text-align:right;">-$${montoRecibido.toFixed(2)}</td></tr>`}
              <tr>
                <td style="padding-top:12px;border-top:1px solid #9ab6ce;color:#123a66;font-size:1.3rem;font-weight:800;">${orden.esFacturaFinal ? 'Total pagado' : 'Total'}</td>
                <td style="padding-top:12px;border-top:1px solid #9ab6ce;color:#123a66;font-size:1.3rem;font-weight:800;text-align:right;">$${total.toFixed(2)}</td>
              </tr>
            </table>

            <div style="margin-top:18px;color:#6f8399;font-size:1.08rem;">Gracias por su preferencia.</div>
          </div>

          <div style="width:100%;margin-top:18px;border-top:1px solid #d8e4ee;background:#ffffff;">
            <p style="margin:0;padding:14px 28px 12px;color:#4a627e;font-size:0.98rem;line-height:1.5;">Contrato de servicio: para retirar las prendas, es indispensable presentar este recibo como único comprobante válido. Las prendas deberán ser retiradas en un máximo de 1 día; de no hacerlo, se aplicará un cargo adicional de $0.50 por cada día de retraso. El plazo para realizar cualquier reclamación sobre el servicio es de 2 días hábiles después de la entrega. Las prendas no retiradas en un plazo de 30 días serán consideradas abandonadas. En caso de dudas, comuníquese con nosotros a <a style="color:#168276;font-weight:700;text-decoration:underline;" href="mailto:lavanderiasalinassv@gmail.com">lavanderiasalinassv@gmail.com</a> o al <a style="color:#168276;font-weight:700;text-decoration:underline;" href="https://wa.me/50324976699">2497 6699 por WhatsApp</a>. Este documento es válido como comprobante de pago emitido por Lavandería Salinas.</p>
            <div style="height:5mm;background:#123a66;"></div>
          </div>
        </div>
      </body>
    </html>
  `
}

export const enviarFacturaOrdenPorCorreo = (orden: FacturaOrdenCorreo) =>
  enviarCorreoHTML(
    orden.correo,
    generarHtmlFacturaOrden(orden),
    `Tu orden ${orden.numero} - Lavandería Salinas`,
    orden.nombreCliente
  )

const pedido = reactive({
  nombreCliente: '',
  descuento: 0,
  descuentoManual: 0,
  descuentoManualTipo: 'porcentaje' as 'porcentaje' | 'dinero',
  descuentoPromocion: 0,
  descuentoPromocionTipo: 'porcentaje' as 'porcentaje' | 'dinero',
  codigoPais: '+503',
  telefono: '',
  correo: '',
  guardarDirectorio: false,
  envioDomicilio: false,
  direccionEntrega: '',
  fechaEntregaActiva: true,
  fechaEntrega: fechaHoyISO(),
  horaEntrega: horaEntregaPorDefecto(),
  estadoPago: 'porCobrar' as 'porCobrar' | 'anticipo' | 'pagado',
  metodoPago: 'efectivo' as 'efectivo' | 'tarjeta' | 'transferencia',
  montoRecibido: 0,
  tarjetaMonto: 0,
  tarjetaReferencia: '',
  transferenciaMonto: 0,
  transferenciaComprobante: '',
  cantidadPrendas: 0,
  detallesPrendas: '',
  items: [] as ItemPedido[],
  fotos: [] as string[]
})

const ultimaOrdenCreada = ref<OrdenCreada | null>(null)
const creandoOrden = ref(false)
const errorCrearOrden = ref<string | null>(null)

export function usePedido() {
  const { turno } = useTurno()
  const { productos, cargarInventario } = useInventario()

  /* ───────────────── Derivados ───────────────── */

  const descuentoManualMonto = computed(() => {
    const valor = Number(pedido.descuentoManual || 0)
    if (pedido.descuentoManualTipo === 'dinero') {
      return Math.min(Math.max(0, valor), subtotal.value)
    }
    return Math.max(0, subtotal.value * valor / 100)
  })

  const descuentoPromocionMonto = computed(() => {
    const valor = Number(pedido.descuentoPromocion || 0)
    if (pedido.descuentoPromocionTipo === 'dinero') {
      return Math.min(Math.max(0, valor), subtotal.value)
    }
    return Math.max(0, subtotal.value * valor / 100)
  })

  const descuentoTotal = computed(() =>
    Math.max(0, descuentoManualMonto.value + descuentoPromocionMonto.value)
  )

  const subtotal = computed(() =>
    pedido.items.reduce((acc, item) => acc + item.precio * item.cantidad, 0)
  )

  const total = computed(() => Math.max(0, subtotal.value - descuentoTotal.value))

  watchEffect(() => {
    pedido.descuento = descuentoTotal.value
  })

  const cambio = computed(() => Math.max(0, pedido.montoRecibido - total.value))

  const cantidadTotal = computed(() => pedido.items.reduce((acc, i) => acc + i.cantidad, 0))

  const cantidadPrendasServicios = computed(() =>
    pedido.items.reduce(
      // Cuenta como "por prenda" todo lo que NO sea explícitamente "extra".
      // Esto evita que un valor faltante/indefinido de clasificacionPrendas
      // (por ejemplo si el backend no lo está devolviendo o guardando bien)
      // haga que la suma dé 0 en lugar de contar el servicio como por prenda,
      // que es su valor por defecto tanto en el formulario como en el tipo.
      (total, item) => total + (item.clasificacionPrendas !== 'extra' ? item.cantidad : 0),
      0
    )
  )

  const convertirConsumoAUnidadStock = (cantidad: number, unidadConsumo: string | undefined, unidadStock: UnidadMedida) => {
    const unidad = unidadConsumo || unidadStock
    if (unidad === unidadStock) return cantidad

    const equivalenciasLiquidas: Record<string, number> = { mililitro: 1, litro: 1000, galon: 3785.411784 }
    if (equivalenciasLiquidas[unidad] && equivalenciasLiquidas[unidadStock]) {
      return cantidad * equivalenciasLiquidas[unidad] / equivalenciasLiquidas[unidadStock]
    }

    const equivalenciasSolidas: Record<string, number> = { gramo: 1, kilogramo: 1000, libra: 453.59237 }
    if (equivalenciasSolidas[unidad] && equivalenciasSolidas[unidadStock]) {
      return cantidad * equivalenciasSolidas[unidad] / equivalenciasSolidas[unidadStock]
    }

    return cantidad
  }

  watchEffect(() => {
    pedido.cantidadPrendas = cantidadPrendasServicios.value
  })

  /** El teléfono se usa para enviar la orden por WhatsApp, así que es obligatorio. */
  const telefonoValido = computed(() => /^\d{7,12}$/.test(pedido.telefono.trim()))

  const formatearHoraEntrega = (hora: string) => {
    const [h, m] = hora.split(':').map(Number)
    if (!Number.isFinite(h) || !Number.isFinite(m)) return ''
    const referencia = new Date()
    referencia.setHours(h, m, 0, 0)
    return referencia.toLocaleTimeString('es-ES', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const fechaEntregaTexto = computed(() => {
    if (!pedido.fechaEntrega) return 'Sin fecha'
    // Evita desfases de zona horaria al parsear 'YYYY-MM-DD'
    const [anio, mes, dia] = pedido.fechaEntrega.split('-').map(Number)
    const fecha = new Date(anio, mes - 1, dia)
    const texto = fecha.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    })
    const textoCapitalizado = texto.charAt(0).toUpperCase() + texto.slice(1)
    const horaTexto = pedido.horaEntrega ? formatearHoraEntrega(pedido.horaEntrega) : ''
    return horaTexto ? `${textoCapitalizado}, ${horaTexto}` : textoCapitalizado
  })

  const fechaMinima = fechaHoyISO()
  const turnoAbierto = computed(() => turno.abierto)

  const puedeCrearOrden = computed(
    () =>
      pedido.nombreCliente.trim().length > 0 &&
      telefonoValido.value &&
      pedido.items.length > 0 &&
      (!pedido.envioDomicilio || pedido.direccionEntrega.trim().length > 0) &&
      (!pedido.fechaEntregaActiva || pedido.horaEntrega.trim().length > 0) && // nueva línea
      turnoAbierto.value
  )

  const faltantesStock = computed<FaltanteInsumoPedido[]>(() => {
    const requeridos = new Map<string, number>()

    for (const item of pedido.items) {
      if (!item.insumos?.length) continue

      for (const insumo of item.insumos) {
        if (!insumo.productoId) continue

        const cantidad = Number(insumo.cantidad)
        if (!Number.isFinite(cantidad) || cantidad <= 0) continue

        const producto = productos.value.find((item) => item.id === insumo.productoId)
        const cantidadStock = convertirConsumoAUnidadStock(
          cantidad,
          insumo.unidadConsumo,
          producto?.unidadMedida ?? 'pieza'
        )
        requeridos.set(
          insumo.productoId,
          (requeridos.get(insumo.productoId) ?? 0) + cantidadStock * item.cantidad
        )
      }
    }

    return Array.from(requeridos.entries())
      .map(([productoId, requerido]) => {
        const producto = productos.value.find((item) => item.id === productoId)
        const disponible = Number(producto?.cantidad ?? 0)

        return {
          productoId,
          nombreProducto: producto?.nombre ?? 'Insumo eliminado',
          unidadMedida: producto?.unidadMedida ?? 'pieza',
          requerido: Number(requerido.toFixed(2)),
          disponible: Number(disponible.toFixed(2)),
          faltante: Number(Math.max(0, requerido - disponible).toFixed(2))
        }
      })
      .filter((insumo) => insumo.faltante > 0)
      .sort((a, b) => b.faltante - a.faltante)
  })

  const hayFaltantesStock = computed(() => faltantesStock.value.length > 0)

  const agregarItem = (servicio: ItemCatalogo) => {
    const existente = pedido.items.find((i) => i.id === servicio.id)
    if (existente) {
      existente.cantidad++
      return
    }
    pedido.items.push({
      id: servicio.id,
      nombre: servicio.nombre,
      precio: servicio.precio,
      unidad: servicio.unidad,
      clasificacionPrendas: servicio.clasificacionPrendas ?? 'por_prenda',
      cantidad: 1,
      nota: '',
      insumos: servicio.insumos.map((insumo) => ({
        productoId: insumo.productoId,
        cantidad: insumo.cantidad,
        unidadConsumo: insumo.unidadConsumo
      }))
    })
  }

  const incrementar = (id: string) => {
    const item = pedido.items.find((i) => i.id === id)
    if (item) item.cantidad++
  }

  const decrementar = (id: string) => {
    const item = pedido.items.find((i) => i.id === id)
    if (!item) return
    item.cantidad--
    if (item.cantidad <= 0) quitarItem(id)
  }

  const quitarItem = (id: string) => {
    const idx = pedido.items.findIndex((i) => i.id === id)
    if (idx !== -1) pedido.items.splice(idx, 1)
  }

  const actualizarNota = (id: string, nota: string) => {
    const item = pedido.items.find((i) => i.id === id)
    if (item) item.nota = nota
  }

  const cantidadEnCarrito = (id: string) =>
    pedido.items.find((i) => i.id === id)?.cantidad ?? 0

  /* ───────────────── Ciclo de vida del pedido ───────────────── */

  const reiniciarPedido = () => {
    pedido.nombreCliente = ''
    pedido.descuento = 0
    pedido.descuentoManual = 0
    pedido.descuentoManualTipo = 'porcentaje'
    pedido.descuentoPromocion = 0
    pedido.descuentoPromocionTipo = 'porcentaje'
    pedido.telefono = ''
    pedido.correo = ''
    pedido.guardarDirectorio = true
    pedido.envioDomicilio = false
    pedido.direccionEntrega = ''
    pedido.fechaEntrega = fechaHoyISO()
    pedido.horaEntrega = horaEntregaPorDefecto(),
    pedido.estadoPago = 'porCobrar'
    pedido.metodoPago = 'efectivo'
    pedido.montoRecibido = 0
    pedido.tarjetaMonto = 0
    pedido.tarjetaReferencia = ''
    pedido.transferenciaMonto = 0
    pedido.transferenciaComprobante = ''
    pedido.cantidadPrendas = 0
    pedido.detallesPrendas = ''
    pedido.items = []
    pedido.fotos = []
  }

  const { crearOrden: crearOrdenPersistente } = useOrdenes()

  const crearOrden = async (opciones?: { forzarSinStock?: boolean; turnoId?: string }): Promise<ResultadoCrearOrden | undefined> => {
    if (!puedeCrearOrden.value) return

    // Refresca inventario antes de validar faltantes para evitar falsos
    // positivos cuando la vista no tiene el stock más reciente en memoria.
    try {
      await cargarInventario(true)
    } catch (error) {
      console.warn('No se pudo refrescar inventario antes de crear la orden:', error)
    }

    if (!opciones?.forzarSinStock && hayFaltantesStock.value) {
      return { orden: null, faltantes: faltantesStock.value }
    }

    creandoOrden.value = true
    errorCrearOrden.value = null

    try {
      // El fetch a la API es asíncrono: hay que esperar la respuesta antes
      // de leer ordenPersistente.numero / .total / etc.
      const ordenPersistente = await crearOrdenPersistente(
        {
          nombreCliente: pedido.nombreCliente,
          descuento: Number(descuentoTotal.value || 0),
          descuentoManual: Number(descuentoManualMonto.value || 0),
          descuentoPromocion: Number(descuentoPromocionMonto.value || 0),
          codigoPais: `+${pedido.codigoPais.replace(/\D/g, '')}`,
          telefono: pedido.telefono,
          correo: pedido.correo,
          guardarDirectorio: pedido.guardarDirectorio,
          envioDomicilio: pedido.envioDomicilio,
          direccionEntrega: pedido.direccionEntrega,
          fechaEntregaActiva: pedido.fechaEntregaActiva,
          fechaEntrega: pedido.fechaEntrega,
          horaEntrega: pedido.horaEntrega,
          estadoPago: pedido.estadoPago,
          metodoPago: pedido.metodoPago,
          montoRecibido: pedido.montoRecibido,
          tarjetaMonto: pedido.metodoPago === 'tarjeta' ? Number(pedido.tarjetaMonto || 0) : undefined,
          tarjetaReferencia: pedido.metodoPago === 'tarjeta' ? pedido.tarjetaReferencia || undefined : undefined,
          transferenciaMonto: pedido.metodoPago === 'transferencia' ? Number(pedido.transferenciaMonto || 0) : undefined,
          transferenciaComprobante: pedido.metodoPago === 'transferencia' ? pedido.transferenciaComprobante || undefined : undefined,
          cantidadPrendas: Number(pedido.cantidadPrendas || 0),
          detallesPrendas: pedido.detallesPrendas || '',
          items: pedido.items.map((i) => ({ 
            ...i, 
            insumos: i.insumos || [] 
          })),
          fotos: pedido.fotos,
          turnoId: opciones?.turnoId
        }
      )

      const numeroCompletoCliente = `${pedido.codigoPais}${pedido.telefono}`.replace(/\D/g, '')
      const clienteActualizado = await registrarOrdenCliente(numeroCompletoCliente)
      if (!clienteActualizado) {
        console.warn('No se pudo incrementar el contador de órdenes del cliente:', numeroCompletoCliente)
      }
      ultimaOrdenCreada.value = {
        numero: ordenPersistente.numero,
        nombreCliente: ordenPersistente.nombreCliente,
        createdAt: ordenPersistente.createdAt,
        total: ordenPersistente.total,
        subtotal: ordenPersistente.subtotal,
        descuento: ordenPersistente.descuento,
        descuentoManual: ordenPersistente.descuentoManual ?? 0,
        descuentoPromocion: ordenPersistente.descuentoPromocion ?? 0,
        items: ordenPersistente.items.map((i) => ({ ...i })) as ItemPedido[],
        telefono: ordenPersistente.telefono,
        codigoPais: ordenPersistente.codigoPais,
        correo: ordenPersistente.correo,
        fechaEntregaActiva: ordenPersistente.fechaEntregaActiva,
        fechaEntregaTexto: ordenPersistente.fechaEntregaActiva ? fechaEntregaTexto.value : '',
        anaquel: null,
        fotos: ordenPersistente.fotos,
        estado: ordenPersistente.estado,
        estadoPago: ordenPersistente.estadoPago,
        montoRecibido: ordenPersistente.montoRecibido,
        cantidadPrendas: ordenPersistente.cantidadPrendas,
        detallesPrendas: ordenPersistente.detallesPrendas
      }

      reiniciarPedido()


      return { orden: ordenPersistente, faltantes: [] as FaltanteInsumoPedido[] }
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'No se pudo crear la orden.'
      errorCrearOrden.value = mensaje
      console.error('Error al crear la orden:', error)
      return { orden: null, faltantes: [], error: mensaje }
    } finally {
      creandoOrden.value = false
    }
  }

  const limpiarUltimaOrdenCreada = () => {
    ultimaOrdenCreada.value = null
  }

  // Nota: "anaquel" nunca se persiste en el backend — solo vive en
  // ultimaOrdenCreada (estado local en memoria), igual que en la versión
  // original con localStorage, porque OrdenCreada no tiene id de orden.
  const asignarAnaquel = (numero: number | null) => {
    if (ultimaOrdenCreada.value) {
      ultimaOrdenCreada.value.anaquel = numero
    }
  }

  return {
    pedido,
    subtotal,
    total,
    cambio,
    descuentoTotal,
    cantidadTotal,
    cantidadPrendasServicios,
    telefonoValido,
    turnoAbierto,
    ultimaOrdenCreada,
    fechaEntregaTexto,
    fechaMinima,
    puedeCrearOrden,
    agregarItem,
    incrementar,
    decrementar,
    quitarItem,
    actualizarNota,
    cantidadEnCarrito,
    reiniciarPedido,
    crearOrden,
    creandoOrden,
    errorCrearOrden,
    faltantesStock,
    hayFaltantesStock,
    limpiarUltimaOrdenCreada,
    asignarAnaquel
  }
}