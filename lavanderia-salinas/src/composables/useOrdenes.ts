import { computed, ref } from 'vue'
import { getApiBaseUrl } from '@/composables/useApiConfig'
import { useTurno } from '@/composables/useTurno'

export type OrdenEstado = 'pendiente' | 'en_proceso' | 'listo' | 'entregado' | 'cerrada' | 'cancelada' | 'Cerrada-Cancelada'
export type EstadoPago = 'porCobrar' | 'anticipo' | 'pagado'
export type MetodoPago = 'efectivo' | 'tarjeta' | 'transferencia'

export interface OrdenItem {
  id: string
  nombre: string
  precio: number
  unidad: string
  cantidad: number
  nota: string
}

export interface CrearOrdenInput {
  turnoId?: string
  nombreCliente: string
  descuento: number
  descuentoManual?: number
  descuentoPromocion?: number
  codigoPais: string
  telefono: string
  correo: string
  cantidadPrendas?: number
  detallesPrendas?: string
  guardarDirectorio: boolean
  envioDomicilio: boolean
  direccionEntrega: string
  fechaEntregaActiva: boolean
  fechaEntrega: string
  horaEntrega: string
  estadoPago: EstadoPago
  metodoPago: MetodoPago
  montoRecibido: number
  tarjetaMonto?: number
  tarjetaReferencia?: string
  transferenciaMonto?: number
  transferenciaComprobante?: string
  items: OrdenItem[]
  fotos: string[]
  usuario?: string
}

export interface UsuarioAuditoria {
  id: string | null
  nombre: string
  rol: string | null
}

export interface OrdenMovimiento {
  id: string
  texto: string
  fecha: string
  usuarioId: string | null
  usuarioNombre: string
}

export interface OrdenCargoExtra {
  id: string
  descripcion: string
  monto: number
  fecha: string
}

export interface OrdenAnticipo {
  id: string
  monto: number
  fecha: string
  turnoId: string
  cierreHuerfano?: boolean
}

export interface Orden {
  id: string
  numero: string
  secuencia: number
  estado: OrdenEstado
  turnoId: string
  nombreCliente: string
  codigoPais: string
  telefono: string
  correo: string
  guardarDirectorio: boolean
  envioDomicilio: boolean
  direccionEntrega: string
  fechaEntregaActiva: boolean
  fechaEntrega: string | null
  horaEntrega: string | null
  estadoPago: EstadoPago
  metodoPago: MetodoPago
  montoRecibido: number
  descuento: number
  descuentoManual?: number
  descuentoPromocion?: number
  subtotal: number
  total: number
  cambio: number
  cantidadPrendas: number
  detallesPrendas: string
  notaInterna: string
  motivoCancelacion: string | null
  tarjetaMonto?: number
  tarjetaReferencia?: string
  transferenciaMonto?: number
  transferenciaComprobante?: string
  fotos: string[]
  items: OrdenItem[]
  cargosExtra: OrdenCargoExtra[]
  anticipos: OrdenAnticipo[]
  entregadoAt?: string | null
  createdAt: string
  updatedAt: string
  movimientos: OrdenMovimiento[]
  turnoHuerfano?: boolean
}

const ordenes = ref<Orden[]>([])

const formatearNumero = (numero: number) => `#${String(numero).padStart(5, '0')}`

const cargando = ref(false)
const error = ref<string | null>(null)
let cargaEnCurso: Promise<void> | null = null
const generarId = () => Math.random().toString(36).slice(2, 10)
const ahoraISO = () => new Date().toISOString()
const calcularSubtotal = (items: OrdenItem[]) => items.reduce((total, item) => total + item.precio * item.cantidad, 0)

// Estados que no deben contar como venta real (se cancelaron o se anularon).
const ESTADOS_EXCLUIDOS_DE_VENTA: OrdenEstado[] = ['cancelada', 'Cerrada-Cancelada']

const api = async (ruta: string, opciones: RequestInit = {}) => {
  const respuesta = await fetch(`${getApiBaseUrl()}${ruta}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opciones
  })
  const datos = await respuesta.json().catch(() => null)
  if (!respuesta.ok) throw new Error(datos?.error ?? 'No se pudo comunicar con el servidor.')
  return datos
}

const cargarOrdenes = async () => {
  if (cargaEnCurso) return cargaEnCurso

  cargando.value = true
  cargaEnCurso = api('/ordenes').then((datos) => {
    ordenes.value = datos as Orden[]
  }).catch((err) => {
    error.value = err instanceof Error ? err.message : 'No se pudieron cargar las órdenes.'
  }).finally(() => {
    cargando.value = false
    cargaEnCurso = null
  })
  return cargaEnCurso
}

const obtenerUsuarioAuditoria = (): UsuarioAuditoria => {
  try {
    const usuarioGuardado = localStorage.getItem('usuario')
    if (usuarioGuardado) {
      const parsed = JSON.parse(usuarioGuardado) as Partial<UsuarioAuditoria>
      const nombre = typeof parsed.nombre === 'string' ? parsed.nombre.trim() : ''
      const id = typeof parsed.id === 'string' && parsed.id.trim() ? parsed.id.trim() : null
      const rol = typeof parsed.rol === 'string' && parsed.rol.trim() ? parsed.rol.trim() : null
      return { id, nombre: nombre || 'Sistema', rol }
    }
  } catch {
    // Si la sesión guardada no es válida, el movimiento queda a nombre de Sistema.
  }

  return { id: null, nombre: 'Sistema', rol: null }
}

const payloadUsuario = () => {
  const usuario = obtenerUsuarioAuditoria()
  return {
    usuario: usuario.nombre,
    usuarioId: usuario.id ?? undefined,
    usuarioNombre: usuario.nombre,
    usuarioRol: usuario.rol ?? undefined
  }
}

const reemplazarOrden = (ordenActualizada: Orden) => {
  const indice = ordenes.value.findIndex((orden) => orden.id === ordenActualizada.id)
  if (indice >= 0) ordenes.value[indice] = ordenActualizada
  return ordenActualizada
}

export function useOrdenes() {
  void cargarOrdenes()

  const { turno } = useTurno()

  const totalOrdenes = computed(() => ordenes.value.length)

  const siguienteSecuencia = computed(() => {
    const maxActual = ordenes.value.reduce((max, orden) => Math.max(max, orden.secuencia), 0)
    return maxActual + 1
  })

  // ────────────────────────────────────────────────────────────
// Venta del día: solo órdenes creadas durante el día actual
// ────────────────────────────────────────────────────────────

/** Órdenes creadas hoy, sin importar el estado. */
const ordenesDelTurnoActual = computed(() => {
  const hoy = new Date()

  const inicioDia = new Date(
    hoy.getFullYear(),
    hoy.getMonth(),
    hoy.getDate(),
    0, 0, 0, 0
  ).getTime()

  const finDia = new Date(
    hoy.getFullYear(),
    hoy.getMonth(),
    hoy.getDate(),
    23, 59, 59, 999
  ).getTime()

  return ordenes.value.filter((orden) => {
    const creadaEn = new Date(orden.createdAt).getTime()

    return (
      !Number.isNaN(creadaEn) &&
      creadaEn >= inicioDia &&
      creadaEn <= finDia
    )
  })
})

/** Suma el total de todas las órdenes creadas hoy, sin importar estado. */
const ventaDelDiaTurnoActual = computed(() =>
  ordenesDelTurnoActual.value.reduce(
    (acc, orden) => acc + Number(orden.total || 0),
    0
  )
)

  /** Suma de lo efectivamente recibido (montoRecibido) en las órdenes del turno actual. */
  const efectivoRecibidoTurnoActual = computed(() =>
    ordenesDelTurnoActual.value.reduce((acc, orden) => acc + Number(orden.montoRecibido || 0), 0)
  )

  /** Cantidad de órdenes creadas en el turno actual. */
  const cantidadOrdenesTurnoActual = computed(() => ordenesDelTurnoActual.value.length)

  /** Desglose de venta del turno actual por método de pago. */
  const ventaPorMetodoPagoTurnoActual = computed(() => {
    const resumen: Record<MetodoPago, number> = { efectivo: 0, tarjeta: 0, transferencia: 0 }
    for (const orden of ordenesDelTurnoActual.value) {
      resumen[orden.metodoPago] = (resumen[orden.metodoPago] ?? 0) + Number(orden.montoRecibido || 0)
    }
    return resumen
  })

  // ────────────────────────────────────────────────────────────

  const crearOrden = async (datos: CrearOrdenInput) => {
    const nuevaOrden = await api('/ordenes', {
      method: 'POST',
      body: JSON.stringify({ ...datos, ...payloadUsuario() })
    }) as Orden
    ordenes.value = [nuevaOrden, ...ordenes.value.filter((orden) => orden.id !== nuevaOrden.id)]
    return nuevaOrden
  }

  const cancelarOrden = async (id: string, motivo: string) => {
    const motivoLimpio = motivo.trim()
    if (!motivoLimpio) return null

    try {
      const ordenActualizada = await api(`/ordenes/${id}/cancelar`, {
        method: 'POST',
        body: JSON.stringify({ motivo: motivoLimpio, ...payloadUsuario() })
      }) as Orden

      return reemplazarOrden(ordenActualizada)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'No se pudo cancelar la orden.'
      return null
    }
  }

  const restaurarOrden = async (id: string) => {
    try {
      const ordenActualizada = await api(`/ordenes/${id}/restaurar`, {
        method: 'POST',
        body: JSON.stringify(payloadUsuario())
      }) as Orden

      return reemplazarOrden(ordenActualizada)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'No se pudo restaurar la orden.'
      console.error('Error al restaurar orden:', err)
      return null
    }
  }

  const eliminarOrden = async (id: string) => {
    await api(`/ordenes/${id}`, {
      method: 'DELETE',
      body: JSON.stringify(payloadUsuario())
    })
    ordenes.value = ordenes.value.filter((orden) => orden.id !== id)
  }

  const agregarCargoExtra = async (id: string, descripcion: string, monto: number) => {
    const montoValido = Number.isFinite(monto) ? Math.max(0, Number(monto)) : 0
    if (montoValido <= 0) return null

    const descripcionLimpia = descripcion.trim() || 'Cargo extra'
    const ordenActualizada = await api(`/ordenes/${id}/cargos-extra`, {
      method: 'POST',
      body: JSON.stringify({ descripcion: descripcionLimpia, monto: montoValido, ...payloadUsuario() })
    }) as Orden

    return reemplazarOrden(ordenActualizada)
  }

  const agregarItemAOrden = async (
    id: string,
    itemCatalogo: { id: string; nombre: string; precio: number; unidad: string },
    cantidad = 1
  ) => {
    const ordenActualizada = await api(`/ordenes/${id}/items`, {
      method: 'POST',
      body: JSON.stringify({ ...itemCatalogo, cantidad, ...payloadUsuario() })
    }) as Orden

    return reemplazarOrden(ordenActualizada)
  }

  const eliminarItemDeOrden = async (id: string, itemId: string, razon: string) => {
    const razonLimpia = razon.trim()
    if (!razonLimpia) return null

    const ordenActualizada = await api(
      `/ordenes/${id}/items/${encodeURIComponent(itemId)}?razon=${encodeURIComponent(razonLimpia)}`,
      {
        method: 'DELETE',
        body: JSON.stringify(payloadUsuario())
      }
    ) as Orden

    return reemplazarOrden(ordenActualizada)
  }

  const eliminarCargoExtra = async (id: string, idCargo: string) => {
    const ordenActualizada = await api(`/ordenes/${id}/cargos-extra/${encodeURIComponent(idCargo)}`, {
      method: 'DELETE',
      body: JSON.stringify(payloadUsuario())
    }) as Orden

    return reemplazarOrden(ordenActualizada)
  }

  const eliminarAnticipo = async (id: string, idAnticipo: string) => {
    const ordenActualizada = await api(`/ordenes/${id}/anticipos/${encodeURIComponent(idAnticipo)}`, {
      method: 'DELETE',
      body: JSON.stringify(payloadUsuario())
    }) as Orden

    return reemplazarOrden(ordenActualizada)
  }

  const eliminarFoto = async (id: string, index: number) => {
    const ordenActualizada = await api(`/ordenes/${id}/fotos/${index}`, {
      method: 'DELETE',
      body: JSON.stringify(payloadUsuario())
    }) as Orden

    return reemplazarOrden(ordenActualizada)
  }

  const obtenerOrdenPorId = (id: string) => ordenes.value.find((orden) => orden.id === id) ?? null

  const actualizarOrden = async (
    id: string,
    cambios: Partial<Omit<Orden, 'id' | 'numero' | 'secuencia' | 'createdAt'>> & {
      fechaCreacion?: string
      fechaEntrega?: string
      horaEntrega?: string
    }
  ): Promise<Orden | null> => {
   const campos: { notaInterna?: string; fotos?: string[]; fechaCreacion?: string; fechaEntrega?: string; horaEntrega?: string; nombreCliente?: string; correo?: string; telefono?: string; cantidadPrendas?: number } = {}
    if (typeof cambios.notaInterna === 'string') campos.notaInterna = cambios.notaInterna
    if (Array.isArray(cambios.fotos)) campos.fotos = cambios.fotos
    if (typeof cambios.fechaCreacion === 'string') campos.fechaCreacion = cambios.fechaCreacion
    if (typeof cambios.fechaEntrega === 'string') campos.fechaEntrega = cambios.fechaEntrega
    if (typeof cambios.horaEntrega === 'string') campos.horaEntrega = cambios.horaEntrega
    if (typeof cambios.nombreCliente === 'string') campos.nombreCliente = cambios.nombreCliente
    if (typeof cambios.correo === 'string') campos.correo = cambios.correo
    if (typeof cambios.telefono === 'string') campos.telefono = cambios.telefono
    if (typeof cambios.cantidadPrendas === 'number' && Number.isFinite(cambios.cantidadPrendas)) campos.cantidadPrendas = cambios.cantidadPrendas
        if (Object.keys(campos).length === 0) return obtenerOrdenPorId(id)

    try {
      const ordenActualizada = await api(`/ordenes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ ...campos, ...payloadUsuario() })
      }) as Orden

      return reemplazarOrden(ordenActualizada)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'No se pudo actualizar la orden.'
      throw err
    }
  }

  const registrarMovimiento = async (id: string, texto: string) => {
    const textoLimpio = texto.trim()
    if (!textoLimpio) return null

    const ordenActualizada = await api(`/ordenes/${id}/movimientos`, {
      method: 'POST',
      body: JSON.stringify({ texto: textoLimpio, ...payloadUsuario() })
    }) as Orden

    return reemplazarOrden(ordenActualizada)
  }

  const cambiarEstado = async (
    id: string,
    estado: OrdenEstado,
    opciones: { cantidadPrendas?: number; notaInterna?: string; fechaEntregado?: string; turnoId?: string } = {}
  ) => {
    const ordenActualizada = await api(`/ordenes/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado, ...opciones, ...payloadUsuario() })
    }) as Orden

    return reemplazarOrden(ordenActualizada)
  }

  const marcarPago = async (
    id: string,
    estadoPago: EstadoPago,
    opciones: { turnoId?: string } = {}
  ) => {
    const ordenActualizada = await api(`/ordenes/${id}/pago`, {
      method: 'PATCH',
      body: JSON.stringify({ estadoPago, turnoId: opciones.turnoId, ...payloadUsuario() })
    }) as Orden

    return reemplazarOrden(ordenActualizada)
  }

  const registrarAnticipo = async (id: string, monto: number, opciones: { fecha?: string; turnoId?: string } = {}) => {
    const montoValido = Number.isFinite(monto) ? Math.max(0, Number(monto)) : 0
    if (montoValido <= 0) return null

    try {
      const respuesta = await api(`/ordenes/${id}/anticipos`, {
        method: 'POST',
        body: JSON.stringify({ monto: montoValido, fecha: opciones.fecha, turnoId: opciones.turnoId, ...payloadUsuario() })
      }) as Orden

      return reemplazarOrden(respuesta)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'No se pudo registrar el anticipo.'
      console.error('Error al registrar anticipo:', err)
      return null
    }
  }

  const aplicarDescuento = async (id: string, tipo: 'porcentaje' | 'monto', valor: number) => {
    const valorValido = Number.isFinite(valor) ? Math.max(0, Number(valor)) : 0
    if (valorValido <= 0) return null

    if (tipo === 'porcentaje' && (valorValido <= 0 || valorValido > 100)) {
      error.value = 'El porcentaje debe estar entre 1 y 100.'
      return null
    }

    try {
      const respuesta = await api(`/ordenes/${id}/descuento`, {
        method: 'POST',
        body: JSON.stringify({ tipo, valor: valorValido, ...payloadUsuario() })
      }) as Orden

      return reemplazarOrden(respuesta)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'No se pudo aplicar el descuento.'
      console.error('Error al aplicar descuento:', err)
      return null
    }
  }

  return {
    ordenes,
    totalOrdenes,
    siguienteSecuencia,
    ordenesDelTurnoActual,
    ventaDelDiaTurnoActual,
    efectivoRecibidoTurnoActual,
    cantidadOrdenesTurnoActual,
    ventaPorMetodoPagoTurnoActual,
    cargarOrdenes,
    crearOrden,
    obtenerOrdenPorId,
    actualizarOrden,
    registrarMovimiento,
    cambiarEstado,
    marcarPago,
    registrarAnticipo,
    agregarCargoExtra,
    eliminarCargoExtra,
    eliminarAnticipo,
    agregarItemAOrden,
    eliminarItemDeOrden,
    eliminarFoto,
    formatearNumero,
    cancelarOrden,
    restaurarOrden,
    eliminarOrden,
    aplicarDescuento,
    cargando,
    error,
    generarId,
    ahoraISO,
    calcularSubtotal
  }
}