/*import { computed, ref } from 'vue'
import type { ItemCatalogo, UnidadServicio } from '@/composables/Usecatalogo'

export interface ItemCarrito {
  itemId: string
  nombre: string
  precio: number
  unidad: UnidadServicio
  cantidad: number
  nota: string
}

const itemsCarrito = ref<ItemCarrito[]>([])

export function useCarrito() {
  const cantidadTotal = computed(() =>
    itemsCarrito.value.reduce((acc, i) => acc + i.cantidad, 0)
  )

  const totalCarrito = computed(() =>
    itemsCarrito.value.reduce((acc, i) => acc + i.precio * i.cantidad, 0)
  )

  const agregarItem = (item: ItemCatalogo) => {
    const existente = itemsCarrito.value.find((i) => i.itemId === item.id)
    if (existente) {
      existente.cantidad++
      return
    }
    itemsCarrito.value.push({
      itemId: item.id,
      nombre: item.nombre,
      precio: item.precio,
      unidad: item.unidad,
      cantidad: 1,
      nota: ''
    })
  }

  const incrementar = (itemId: string) => {
    const linea = itemsCarrito.value.find((i) => i.itemId === itemId)
    if (linea) linea.cantidad++
  }

  const decrementar = (itemId: string) => {
    const linea = itemsCarrito.value.find((i) => i.itemId === itemId)
    if (!linea) return
    linea.cantidad--
    if (linea.cantidad <= 0) {
      itemsCarrito.value = itemsCarrito.value.filter((i) => i.itemId !== itemId)
    }
  }

  const quitarItem = (itemId: string) => {
    itemsCarrito.value = itemsCarrito.value.filter((i) => i.itemId !== itemId)
  }

  const actualizarNota = (itemId: string, nota: string) => {
    const linea = itemsCarrito.value.find((i) => i.itemId === itemId)
    if (linea) linea.nota = nota
  }

  const limpiarCarrito = () => {
    itemsCarrito.value = []
  }

  const cantidadEnCarrito = (itemId: string) =>
    itemsCarrito.value.find((i) => i.itemId === itemId)?.cantidad ?? 0

  return {
    itemsCarrito,
    cantidadTotal,
    totalCarrito,
    agregarItem,
    incrementar,
    decrementar,
    quitarItem,
    actualizarNota,
    limpiarCarrito,
    cantidadEnCarrito
  }
}*/
