import { computed, ref } from 'vue'
import { getApiBaseUrl } from '@/composables/useApiConfig'

export interface Cliente {
  id: string
  nombre: string
  celular: string
  correo: string
  totalOrdenes: number
  fechaRegistro: string
  ultimaOrden?: string
}

export interface ClienteConEstado extends Cliente {
  esRecurrente: boolean
}

const clientes = ref<Cliente[]>([])
const cargando = ref(false)
const error = ref<string | null>(null)

const normalizarTelefono = (telefono: string) => {
  if (typeof telefono !== 'string') return ''
  return telefono.replace(/\D/g, '')
}

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

const cargarClientes = async () => {
  cargando.value = true
  error.value = null
  try {
    clientes.value = await api<Cliente[]>('/clientes')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudieron cargar los clientes.'
  } finally {
    cargando.value = false
  }
}

// Exportar cargarClientes para poder forzar una recarga real (fetch a la API) desde cualquier vista
export const recargarClientes = cargarClientes

// Cargar clientes al inicializar
void cargarClientes()

export function useClientes() {
  const clientesConEstado = computed(() =>
    clientes.value.map((cliente) => ({
      ...cliente,
      esRecurrente: cliente.totalOrdenes > 5
    }))
  )

  const obtenerClientePorId = (id: string): ClienteConEstado | null => {
    const cliente = clientes.value.find((c) => c.id === id)
    if (!cliente) return null
    return {
      ...cliente,
      esRecurrente: cliente.totalOrdenes > 5
    }
  }

  const buscarClientePorTelefono = async (telefono: string): Promise<ClienteConEstado | null> => {
    const normalizado = normalizarTelefono(telefono)
    if (!normalizado) return null

    try {
      const cliente = await api<Cliente>(`/clientes/telefono/${normalizado}`)
      return {
        ...cliente,
        esRecurrente: cliente.totalOrdenes > 5
      }
    } catch (err) {
      return null
    }
  }

  const agregarCliente = async (data: {
    nombre: string
    celular: string
    correo: string
  }): Promise<Cliente> => {
    const nombre = data.nombre.trim()
    const celular = normalizarTelefono(data.celular)
    const correo = data.correo.trim().toLowerCase()

    if (!nombre || !celular) {
      throw new Error('Nombre y celular son obligatorios.')
    }

    if (celular.length < 7) {
      throw new Error('El celular debe tener al menos 7 dígitos.')
    }

    const nuevoCliente = await api<Cliente>('/clientes', {
      method: 'POST',
      body: JSON.stringify({ nombre, celular, correo })
    })

    clientes.value.unshift(nuevoCliente)
    return nuevoCliente
  }

  const editarCliente = async (id: string, cambios: Partial<Cliente>): Promise<Cliente> => {
    const actualizado = await api<Cliente>(`/clientes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(cambios)
    })

    const indice = clientes.value.findIndex((c) => c.id === id)
    if (indice !== -1) clientes.value[indice] = actualizado

    return actualizado
  }

  const eliminarCliente = async (id: string): Promise<void> => {
    await api(`/clientes/${id}`, { method: 'DELETE' })
    clientes.value = clientes.value.filter((c) => c.id !== id)
  }

  const registrarOrdenCliente = async (celular: string): Promise<Cliente | null> => {
    const normalizado = normalizarTelefono(celular)
    if (!normalizado) return null

    try {
      const cliente = await api<Cliente>('/clientes/registrar-orden', {
        method: 'POST',
        body: JSON.stringify({ telefono: normalizado })
      })

      const indice = clientes.value.findIndex((c) => c.id === cliente.id)
      if (indice !== -1) clientes.value[indice] = cliente
      else clientes.value.unshift(cliente)

      return cliente
    } catch (err) {
      return null
    }
  }

  const buscarClientes = async (termino: string): Promise<ClienteConEstado[]> => {
    try {
      const resultados = await api<Cliente[]>(`/clientes/buscar?termino=${encodeURIComponent(termino)}`)
      return resultados.map((cliente) => ({
        ...cliente,
        esRecurrente: cliente.totalOrdenes > 5
      }))
    } catch (err) {
      return []
    }
  }

  const obtenerEstadisticasClientes = async () => {
    try {
      return await api<{ totalClientes: number; clientesRecurrentes: number; clientesNuevos: number; totalOrdenes: number }>('/clientes/estadisticas')
    } catch (err) {
      return {
        totalClientes: 0,
        clientesRecurrentes: 0,
        clientesNuevos: 0,
        totalOrdenes: 0
      }
    }
  }

  return {
    clientes,
    clientesConEstado,
    cargando,
    error,
    cargarClientes,
    obtenerClientePorId,
    buscarClientePorTelefono,
    agregarCliente,
    editarCliente,
    eliminarCliente,
    registrarOrdenCliente,
    buscarClientes,
    obtenerEstadisticasClientes
  }
}

// Exportar funciones compatibles para uso directo (migración gradual)
export const obtenerClientes = () => clientes.value

export const obtenerClientesConEstado = () => {
  return clientes.value.map((cliente) => ({
    ...cliente,
    esRecurrente: cliente.totalOrdenes > 5
  }))
}

// Exportar funciones individuales para compatibilidad con importaciones existentes
export const registrarOrdenCliente = async (celular: string): Promise<Cliente | null> => {
  const normalizado = normalizarTelefono(celular)
  if (!normalizado) return null

  try {
    const cliente = await api<Cliente>('/clientes/registrar-orden', {
      method: 'POST',
      body: JSON.stringify({ telefono: normalizado })
    })

    const indice = clientes.value.findIndex((c) => c.id === cliente.id)
    if (indice !== -1) clientes.value[indice] = cliente
    else clientes.value.unshift(cliente)

    return cliente
  } catch (err) {
    return null
  }
}

export const agregarCliente = async (data: {
  nombre: string
  celular: string
  correo: string
}): Promise<Cliente> => {
  const nombre = data.nombre.trim()
  const celular = normalizarTelefono(data.celular)
  const correo = data.correo.trim().toLowerCase()

  if (!nombre || !celular) {
    throw new Error('Nombre y celular son obligatorios.')
  }

  if (celular.length < 7) {
    throw new Error('El celular debe tener al menos 7 dígitos.')
  }

  const nuevoCliente = await api<Cliente>('/clientes', {
    method: 'POST',
    body: JSON.stringify({ nombre, celular, correo })
  })

  clientes.value.unshift(nuevoCliente)
  return nuevoCliente
}

export const editarCliente = async (id: string, cambios: Partial<Cliente>): Promise<Cliente> => {
  const actualizado = await api<Cliente>(`/clientes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(cambios)
  })

  const indice = clientes.value.findIndex((c) => c.id === id)
  if (indice !== -1) clientes.value[indice] = actualizado

  return actualizado
}

export const eliminarCliente = async (id: string): Promise<void> => {
  await api(`/clientes/${id}`, { method: 'DELETE' })
  clientes.value = clientes.value.filter((c) => c.id !== id)
}

export const buscarClientePorTelefono = async (telefono: string): Promise<ClienteConEstado | null> => {
  const normalizado = normalizarTelefono(telefono)
  if (!normalizado) return null

  try {
    const cliente = await api<Cliente>(`/clientes/telefono/${normalizado}`)
    return {
      ...cliente,
      esRecurrente: cliente.totalOrdenes > 5
    }
  } catch (err) {
    return null
  }
}

export const buscarClientes = async (termino: string): Promise<ClienteConEstado[]> => {
  try {
    const resultados = await api<Cliente[]>(`/clientes/buscar?termino=${encodeURIComponent(termino)}`)
    return resultados.map((cliente) => ({
      ...cliente,
      esRecurrente: cliente.totalOrdenes > 5
    }))
  } catch (err) {
    return []
  }
}

export const obtenerClientePorId = (id: string): ClienteConEstado | null => {
  const cliente = clientes.value.find((c) => c.id === id)
  if (!cliente) return null
  return {
    ...cliente,
    esRecurrente: cliente.totalOrdenes > 5
  }
}

export const obtenerEstadisticasClientes = async () => {
  try {
    return await api<{ totalClientes: number; clientesRecurrentes: number; clientesNuevos: number; totalOrdenes: number }>('/clientes/estadisticas')
  } catch (err) {
    return {
      totalClientes: 0,
      clientesRecurrentes: 0,
      clientesNuevos: 0,
      totalOrdenes: 0
    }
  }
}

// Exportación alternativa con minúscula para compatibilidad
export const obtenerEstadísticasClientes = async () => {
  return await obtenerEstadisticasClientes()
}