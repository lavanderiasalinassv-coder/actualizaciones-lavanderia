import { computed, ref } from 'vue'

export interface ProductoInventario {
  id: string
  nombre: string
  categoria: string
  unidadMedida: UnidadMedida
  cantidad: number
  costo: number
  descripcion: string
  imagenUrl: string | null
  creadoEn: string
  actualizadoEn: string
}

export type UnidadMedida =
  | 'pieza'
  | 'litro'
  | 'mililitro'
  | 'kilogramo'
  | 'libra'
  | 'gramo'
  | 'paquete'
  | 'caja'
  | 'galon'
  | 'otro'

export interface ConsumoInventario {
  productoId: string
  cantidad: number
  unidadConsumo?: UnidadMedida | string
}

export interface ConsumoInventarioDetalle extends ConsumoInventario {
  nombreProducto: string
}

import { getApiBaseUrl } from '@/composables/useApiConfig'

export type ProductoInventarioInput = Omit <
  ProductoInventario,
  'id' | 'creadoEn' | 'actualizadoEn'
>

const api = async <T>(ruta: string, opciones: RequestInit = {}): Promise<T> => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 segundos timeout

  try {
    const respuesta = await fetch(`${getApiBaseUrl()}${ruta}`, {
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      ...opciones
    })

    clearTimeout(timeoutId)

    if (!respuesta.ok) {
      let mensaje = `Error ${respuesta.status}`
      try {
        const cuerpo = await respuesta.json()
        if (cuerpo?.error) mensaje = cuerpo.error
      } catch {
        // sin body JSON, se usa el mensaje genérico
      }
      throw new Error(mensaje)
    }

    if (respuesta.status === 204) return undefined as T
    return respuesta.json() as Promise<T>
  } catch (err) {
    clearTimeout(timeoutId)
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('La solicitud tardó demasiado tiempo. Intenta nuevamente.')
    }
    throw err
  }
}

/* ═══════════════════════ Estado global ═══════════════════════ */

const productos = ref<ProductoInventario[]>([])
const cargando = ref(false)
const error = ref<string | null>(null)
let yaCargado = false

export function useInventario() {
  /* ---- Carga inicial ---- */
  const cargarInventario = async (forzar = false) => {
    if (yaCargado && !forzar) return
    
    // Prevenir múltiples cargas simultáneas
    if (cargando.value) return
    
    cargando.value = true
    error.value = null
    try {
      productos.value = await api<ProductoInventario[]>('/inventario')
      yaCargado = true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar el inventario.'
      throw err
    } finally {
      cargando.value = false
    }
  }

  /* ---- Derivados ---- */
  const categorias = computed(() =>
    Array.from(new Set(productos.value.map((producto) => producto.categoria).filter(Boolean))).sort()
  )

  const totalUnidades = computed(() =>
    productos.value.reduce((total, producto) => total + producto.cantidad, 0)
  )

  const valorInventario = computed(() =>
    productos.value.reduce((total, producto) => total + producto.cantidad * producto.costo, 0)
  )

  const productosBajoStock = computed(() =>
    productos.value.filter((producto) => producto.cantidad <= 5).length
  )

  const productosConImagen = computed(() =>
    productos.value.filter((producto) => Boolean(producto.imagenUrl)).length
  )

  /* ---- CRUD ---- */
  const crearProducto = async (datos: ProductoInventarioInput) => {
    const nuevo = await api<ProductoInventario>('/inventario', {
      method: 'POST',
      body: JSON.stringify(datos)
    })
    productos.value.unshift(nuevo)
    return nuevo
  }

  const actualizarProducto = async (id: string, datos: Partial<ProductoInventarioInput>) => {
    const actualizado = await api<ProductoInventario>(`/inventario/${id}`, {
      method: 'PUT',
      body: JSON.stringify(datos)
    })
    const indice = productos.value.findIndex((item) => item.id === id)
    if (indice !== -1) productos.value[indice] = actualizado
    return actualizado
  }

  const eliminarProducto = async (id: string) => {
    await api<void>(`/inventario/${id}`, { method: 'DELETE' })
    productos.value = productos.value.filter((producto) => producto.id !== id)
  }

  const obtenerProductoPorId = (id: string) =>
    productos.value.find((producto) => producto.id === id) ?? null

  /* ---- Consumos (descuento / reversión) ---- */
  const descontarInventario = async (
    consumos: ConsumoInventario[],
    opciones?: { permitirNegativo?: boolean }
  ) => {
    const consumosValidos = consumos.filter(
      (c) => c.productoId && Number.isFinite(Number(c.cantidad)) && Number(c.cantidad) > 0
    )
    if (consumosValidos.length === 0) return []

    await api<ConsumoInventario[]>('/inventario/consumos', {
      method: 'POST',
      body: JSON.stringify({ consumos: consumosValidos, permitirNegativo: opciones?.permitirNegativo })
    })

    // Refrescamos el estado local con lo que realmente quedó en el servidor
    await cargarInventario(true)
    return consumosValidos
  }

  const revertirInventario = async (consumos: ConsumoInventario[]) => {
    const consumosValidos = consumos.filter(
      (c) => c.productoId && Number.isFinite(Number(c.cantidad)) && Number(c.cantidad) > 0
    )
    if (consumosValidos.length === 0) return []

    await api<ConsumoInventario[]>('/inventario/consumos/revertir', {
      method: 'POST',
      body: JSON.stringify({ consumos: consumosValidos })
    })

    await cargarInventario(true)
    return consumosValidos
  }

  /* ---- Helpers que solo calculan consumos (sin tocar el servidor) ---- */
  const registrarConsumosDesdeCatalogo = async (
    itemsOrden: Array<{ id: string; cantidad: number }>,
    catalogo: Array<{ id: string; insumos: ConsumoInventarioDetalle[] }>,
    opciones?: { permitirNegativo?: boolean }
  ) => {
    const consumos: ConsumoInventario[] = []

    for (const itemOrden of itemsOrden) {
      const servicio = catalogo.find((item) => item.id === itemOrden.id)
      if (!servicio?.insumos?.length) continue

      for (const insumo of servicio.insumos) {
        consumos.push({
          productoId: insumo.productoId,
          cantidad: insumo.cantidad * itemOrden.cantidad
        })
      }
    }

    return descontarInventario(consumos, opciones)
  }

  const descontarConsumosDesdeOrden = async (
    itemsOrden: Array<{ cantidad: number; insumos?: ConsumoInventario[] }>,
    opciones?: { permitirNegativo?: boolean }
  ) => {
    const consumos: ConsumoInventario[] = []

    for (const itemOrden of itemsOrden) {
      if (!itemOrden.insumos?.length) continue

      for (const insumo of itemOrden.insumos) {
        consumos.push({
          productoId: insumo.productoId,
          cantidad: insumo.cantidad * itemOrden.cantidad
        })
      }
    }

    return descontarInventario(consumos, opciones)
  }

  const revertirConsumosDesdeOrden = async (
    itemsOrden: Array<{ id: string; cantidad: number; insumos?: ConsumoInventario[] }>,
    catalogo?: Array<{ id: string; insumos: ConsumoInventarioDetalle[] }>
  ) => {
    const consumos: ConsumoInventario[] = []

    for (const itemOrden of itemsOrden) {
      const insumos = itemOrden.insumos?.length
        ? itemOrden.insumos
        : catalogo?.find((item) => item.id === itemOrden.id)?.insumos ?? []

      for (const insumo of insumos) {
        consumos.push({
          productoId: insumo.productoId,
          cantidad: insumo.cantidad * itemOrden.cantidad
        })
      }
    }

    return revertirInventario(consumos)
  }

  return {
    // estado
    productos,
    categorias,
    totalUnidades,
    valorInventario,
    productosBajoStock,
    productosConImagen,
    cargando,
    error,
    // acciones
    cargarInventario,
    crearProducto,
    actualizarProducto,
    eliminarProducto,
    obtenerProductoPorId,
    descontarInventario,
    revertirInventario,
    registrarConsumosDesdeCatalogo,
    descontarConsumosDesdeOrden,
    revertirConsumosDesdeOrden
  }
}