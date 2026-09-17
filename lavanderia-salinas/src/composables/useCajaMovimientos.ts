import { computed, ref } from 'vue'
import { useTurno } from '@/composables/useTurno'
import { getApiBaseUrl } from '@/composables/useApiConfig'

export type TipoMovimientoCaja = 'gasto' | 'deposito' | 'cierre'

export interface MovimientoCaja {
  id: string
  tipo: TipoMovimientoCaja
  monto: number
  concepto: string
  creadoAt: string
  turnoId: string
  numeroCaja: number
  usuario: string
  comprobanteUrl?: string
  cierreIds?: string[]
}

export interface RegistrarMovimientoInput {
  monto: number
  concepto: string
  usuario?: string
  comprobanteUrl?: string
  turnoId?: string
  numeroCaja?: number
}

const movimientos = ref<MovimientoCaja[]>([])
const cargando = ref(false)
const error = ref<string | null>(null)
let cargaEnCurso: Promise<void> | null = null
const redondear = (valor: number) => Number(Number(valor || 0).toFixed(2))

export function useCajaMovimientos() {
  const { turno } = useTurno()
  const api = async (ruta: string, opciones: RequestInit = {}) => {
    const respuesta = await fetch(`${getApiBaseUrl()}${ruta}`, { headers: { 'Content-Type': 'application/json' }, ...opciones })
    const datos = await respuesta.json().catch(() => null)
    if (!respuesta.ok) throw new Error(datos?.error ?? 'No se pudo comunicar con el servidor.')
    return datos
  }
  const cargarMovimientos = async () => {
    if (cargaEnCurso) return cargaEnCurso

    cargando.value = true
    error.value = null
    cargaEnCurso = api('/movimientos-caja').then((datos) => {
      movimientos.value = datos as MovimientoCaja[]
    }).catch((err) => {
      error.value = err instanceof Error ? err.message : 'No se pudieron cargar los movimientos.'
    }).finally(() => {
      cargando.value = false
      cargaEnCurso = null
    })
    return cargaEnCurso
  }
  void cargarMovimientos()

  const gastos = computed(() => movimientos.value.filter((m) => m.tipo === 'gasto'))
  const depositos = computed(() => movimientos.value.filter((m) => m.tipo === 'deposito'))
  const cierres = computed(() => movimientos.value.filter((m) => m.tipo === 'cierre'))
  const totalGastos = computed(() => gastos.value.reduce((total, m) => total + m.monto, 0))
  const totalDepositos = computed(() => depositos.value.reduce((total, m) => total + m.monto, 0))
  const totalCierres = computed(() => cierres.value.reduce((total, m) => total + m.monto, 0))

  const registrarMovimiento = async (tipo: TipoMovimientoCaja, input: RegistrarMovimientoInput) => {
    const monto = redondear(input.monto)
    const concepto = input.concepto.trim()
    const turnoId = input.turnoId || turno.id
    const numeroCaja = input.numeroCaja ?? turno.numeroCaja
    if (!Number.isFinite(monto) || monto <= 0 || !concepto || !turnoId) return null
    const movimiento = await api('/movimientos-caja', {
      method: 'POST',
      body: JSON.stringify({ tipo, monto, concepto, turnoId, numeroCaja, usuario: input.usuario || turno.usuario, comprobanteUrl: input.comprobanteUrl })
    }) as MovimientoCaja
    movimientos.value.unshift(movimiento)
    return movimiento
  }
  const registrarGasto = (input: RegistrarMovimientoInput) => registrarMovimiento('gasto', input)
  const registrarDeposito = (input: RegistrarMovimientoInput) => registrarMovimiento('deposito', input)
  const registrarCierre = (input: RegistrarMovimientoInput) => registrarMovimiento('cierre', input)

  const editarDeposito = async (id: string, input: RegistrarMovimientoInput) => {
    const movimiento = await api(`/movimientos-caja/${id}`, { method: 'PUT', body: JSON.stringify({ monto: redondear(input.monto), concepto: input.concepto.trim(), comprobanteUrl: input.comprobanteUrl }) }) as MovimientoCaja
    const indice = movimientos.value.findIndex((item) => item.id === id)
    if (indice >= 0) movimientos.value[indice] = movimiento
    return movimiento
  }
  const eliminarDeposito = async (id: string) => {
    await api(`/movimientos-caja/${id}`, { method: 'DELETE' })
    movimientos.value = movimientos.value.filter((item) => item.id !== id)
    return true
  }

  const eliminarGasto = async (id: string) => {
    await api(`/movimientos-caja/${id}`, { method: 'DELETE' })
    movimientos.value = movimientos.value.filter((item) => item.id !== id)
    return true
  }

  return { movimientos, gastos, depositos, cierres, totalGastos, totalDepositos, totalCierres, cargando, error, cargarMovimientos, registrarGasto, registrarDeposito, registrarCierre, editarDeposito, eliminarDeposito, eliminarGasto, limpiarMovimientosDelTurno: (_id: string) => Promise.resolve(), limpiarMovimientos: () => { movimientos.value = [] } }
}
