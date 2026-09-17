import { computed, ref } from 'vue'
import { getApiBaseUrl } from '@/composables/useApiConfig'
export type TipoCatalogo = 'servicio' | 'articulo'
export type UnidadServicio = 'kilo' | 'libra' | 'pieza' | 'm2' | 'galon' | 'mililitro' | 'otro'
export type ClasificacionPrendas = 'por_prenda' | 'extra'

export interface VarianteConPrecio {
  id: string
  nombre: string
  precio: number
}

export interface EtiquetaPrenda {
  id: string
  nombre: string
}

export interface InsumoCatalogo {
  id: string
  productoId: string
  nombreProducto: string
  unidadMedida: string
  unidadConsumo?: string
  cantidad: number
}

export interface CategoriaCatalogo {
  id: string
  nombre: string
  color: string
}

export interface ItemCatalogo {
  id: string
  tipo: TipoCatalogo
  nombre: string
  categoriaId: string | null
  precio: number
  unidad: UnidadServicio
  clasificacionPrendas: ClasificacionPrendas
  variantesActivas: boolean
  variantesPrecio: VarianteConPrecio[]
  etiquetas: EtiquetaPrenda[]
  insumos: InsumoCatalogo[]
  descripcion: string
  imagenUrl: string | null
}

export type ItemCatalogoInput = Omit<ItemCatalogo, 'id'>

const api = async <T>(ruta: string, opciones: RequestInit = {}): Promise<T> => {
  const respuesta = await fetch(`${getApiBaseUrl()}${ruta}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opciones
  })

  if (!respuesta.ok) {
    let mensaje = `Error ${respuesta.status}`
    try {
      const cuerpo = await respuesta.json()
      if (cuerpo?.error) mensaje = cuerpo.error
    } catch {
    }
    throw new Error(mensaje)
  }

  if (respuesta.status === 204) return undefined as T
  return respuesta.json() as Promise<T>
}

const categorias = ref<CategoriaCatalogo[]>([])
const items = ref<ItemCatalogo[]>([])
const cargando = ref(false)
const error = ref<string | null>(null)
let yaCargado = false

export function useCatalogo() {
  const servicios = computed(() => items.value.filter((i) => i.tipo === 'servicio'))
  const articulos = computed(() => items.value.filter((i) => i.tipo === 'articulo'))

  const cargarCatalogo = async (forzar = false) => {
    if (yaCargado && !forzar) return
    cargando.value = true
    error.value = null
    try {
      const [categoriasRes, itemsRes] = await Promise.all([
        api<CategoriaCatalogo[]>('/catalogo/categorias'),
        api<ItemCatalogo[]>('/catalogo/items')
      ])
      categorias.value = categoriasRes
      items.value = itemsRes
      yaCargado = true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar el catálogo.'
      throw err
    } finally {
      cargando.value = false
    }
  }

  const crearCategoria = async (nombre: string): Promise<CategoriaCatalogo | null> => {
    const nombreLimpio = nombre.trim()
    if (!nombreLimpio) return null

    const existente = categorias.value.find(
      (c) => c.nombre.toLowerCase() === nombreLimpio.toLowerCase()
    )
    if (existente) return existente

    const nueva = await api<CategoriaCatalogo>('/catalogo/categorias', {
      method: 'POST',
      body: JSON.stringify({ nombre: nombreLimpio })
    })
    categorias.value.push(nueva)
    return nueva
  }

  const eliminarCategoria = async (id: string) => {
    await api<void>(`/catalogo/categorias/${id}`, { method: 'DELETE' })
    categorias.value = categorias.value.filter((c) => c.id !== id)

    items.value.forEach((item) => {
      if (item.categoriaId === id) item.categoriaId = null
    })
  }

  const actualizarCategoria = async (id: string, cambios: { nombre: string; color: string }) => {
    const actualizada = await api<CategoriaCatalogo>(`/catalogo/categorias/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ nombre: cambios.nombre.trim(), color: cambios.color })
    })
    const indice = categorias.value.findIndex((categoria) => categoria.id === id)
    if (indice !== -1) categorias.value[indice] = actualizada
    return actualizada
  }

  const crearItem = async (datos: ItemCatalogoInput): Promise<ItemCatalogo> => {
    const nuevo = await api<ItemCatalogo>('/catalogo/items', {
      method: 'POST',
      body: JSON.stringify(datos)
    })
    items.value.push(nuevo)
    return nuevo
  }

  const actualizarItem = async (id: string, datos: Partial<ItemCatalogoInput>) => {
    const actualizado = await api<ItemCatalogo>(`/catalogo/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(datos)
    })
    const indice = items.value.findIndex((i) => i.id === id)
    if (indice !== -1) items.value[indice] = actualizado
    return actualizado
  }

  const eliminarItem = async (id: string) => {
    await api<void>(`/catalogo/items/${id}`, { method: 'DELETE' })
    items.value = items.value.filter((i) => i.id !== id)
  }

  const obtenerItemPorId = (id: string) => items.value.find((i) => i.id === id) ?? null

  const restaurarCatalogoBase = async () => {
    const resultado = await api<{ categorias: CategoriaCatalogo[]; items: ItemCatalogo[] }>(
      '/catalogo/restaurar',
      { method: 'POST' }
    )
    categorias.value = resultado.categorias
    items.value = resultado.items
  }

  return {
    categorias,
    items,
    servicios,
    articulos,
    cargando,
    error,
    cargarCatalogo,
    crearCategoria,
    actualizarCategoria,
    eliminarCategoria,
    crearItem,
    actualizarItem,
    eliminarItem,
    obtenerItemPorId,
    restaurarCatalogoBase
  }
}