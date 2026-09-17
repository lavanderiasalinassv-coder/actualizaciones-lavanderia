import { ref, computed } from 'vue'
import { getApiBaseUrl } from '@/composables/useApiConfig'

export type TipoDescuento = 'porcentaje' | 'dinero'
export type TipoClienteAplica = 'todos' | 'registrados' | 'recurrentes'
export type DiaSemana = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo'

export interface Promocion {
  id: string
  nombre: string
  descripcion: string
  tipoDescuento: TipoDescuento
  valor: number
  tipoClienteAplica: TipoClienteAplica
  minOrdenes?: number
  vigente: boolean
  fechaInicio: string
  fechaFin: string
  diasEspecificos: DiaSemana[]
  createdAt: string
}

const apiUrl = () => `${getApiBaseUrl()}/promociones`

class ApiError extends Error {}

const manejarRespuesta = async <T,>(res: Response): Promise<T> => {
  if (res.status === 204) {
    return undefined as T
  }

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    throw new ApiError(data?.error ?? 'Ocurrió un error al comunicarse con el servidor.')
  }

  return data as T
}

const promociones = ref<Promocion[]>([])
const cargando = ref(false)

const cargarPromociones = async (): Promise<void> => {
  cargando.value = true
  try {
    const res = await fetch(apiUrl())
    promociones.value = await manejarRespuesta<Promocion[]>(res)
  } catch {
    promociones.value = []
  } finally {
    cargando.value = false
  }
}

cargarPromociones()

export const usePromociones = () => {
  const crearPromocion = async (datos: Omit<Promocion, 'id' | 'createdAt'>): Promise<Promocion> => {
    const res = await fetch(apiUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    })

    const nueva = await manejarRespuesta<Promocion>(res)
    promociones.value.unshift(nueva)
    return nueva
  }

  const actualizarPromocion = async (id: string, datos: Partial<Promocion>): Promise<Promocion> => {
    const res = await fetch(`${apiUrl()}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    })

    const actualizada = await manejarRespuesta<Promocion>(res)
    const index = promociones.value.findIndex((p) => p.id === id)
    if (index !== -1) {
      promociones.value[index] = actualizada
    }
    return actualizada
  }

  const eliminarPromocion = async (id: string): Promise<void> => {
    const res = await fetch(`${apiUrl()}/${id}`, { method: 'DELETE' })
    await manejarRespuesta<void>(res)
    promociones.value = promociones.value.filter((p) => p.id !== id)
  }

  const obtenerPromocionesVigentes = computed(() => {
    const hoy = new Date().toISOString().split('T')[0]
    return promociones.value.filter(
      (p) => p.vigente && p.fechaInicio <= hoy && p.fechaFin >= hoy
    )
  })

  const obtenerPromocionesAplicables = (
    esRegistrado: boolean,
    esRecurrente: boolean,
    totalOrdenes: number
  ) => {
    const hoy = new Date().toISOString().split('T')[0]
    const diaHoy = new Date().getDay()

    const diasMap: Record<number, DiaSemana> = {
      0: 'domingo',
      1: 'lunes',
      2: 'martes',
      3: 'miercoles',
      4: 'jueves',
      5: 'viernes',
      6: 'sabado'
    }

    const diaActual = diasMap[diaHoy]

    return obtenerPromocionesVigentes.value.filter((p) => {
      if (p.fechaInicio > hoy || p.fechaFin < hoy) return false

      if (p.diasEspecificos.length > 0 && !p.diasEspecificos.includes(diaActual)) {
        return false
      }

      if (p.tipoClienteAplica === 'todos') return true
      if (p.tipoClienteAplica === 'registrados' && esRegistrado) return true
      if (
        p.tipoClienteAplica === 'recurrentes' &&
        esRecurrente &&
        (!p.minOrdenes || totalOrdenes >= p.minOrdenes)
      ) {
        return true
      }
      return false
    })
  }

  const calcularDescuentoPromocion = (
    promocion: Promocion,
    subtotal: number
  ): number => {
    if (promocion.tipoDescuento === 'dinero') {
      return Math.min(Math.max(0, promocion.valor), subtotal)
    }
    return (subtotal * promocion.valor) / 100
  }

  return {
    promociones,
    cargando,
    cargarPromociones,
    crearPromocion,
    actualizarPromocion,
    eliminarPromocion,
    obtenerPromocionesVigentes,
    obtenerPromocionesAplicables,
    calcularDescuentoPromocion
  }
}