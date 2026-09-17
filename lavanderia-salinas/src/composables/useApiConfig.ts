import { computed, ref } from 'vue'

export const API_LOCAL_URL = 'http://localhost:3000/api'
export const API_URL_STORAGE_KEY = 'lavanderia_api_url'
export const API_ONLINE_URL_STORAGE_KEY = 'lavanderia_api_online_url'
export const API_DESTINO_STORAGE_KEY = 'lavanderia_api_destino' 
export const API_ONLINE_DEFAULT_URL = import.meta.env.VITE_API_URL || 'https://server-lavanderia.onrender.com/api'

export type ApiDestino = 'local' | 'servidor'

const destinoActual = ref<ApiDestino>('local')
const apiOnline = ref('')
let inicializado = false

const normalizarUrl = (url: string) => url.trim().replace(/\/+$/, '')

const esElectron = () => {
  if (typeof window === 'undefined') return false
  const electronWindow = window as Window & {
    electronAPI?: unknown
    process?: { versions?: { electron?: string } }
  }
  return Boolean(electronWindow.electronAPI || electronWindow.process?.versions?.electron)
}

const destinoPorDefecto = (): ApiDestino => {
  if (esElectron()) return 'local'
  return 'servidor'
}

const cargarConfiguracion = () => {
  if (inicializado || typeof window === 'undefined') return

  // 1. Cargar la URL online guardada (o fallback por defecto)
  const urlOnlineGuardada = localStorage.getItem(API_ONLINE_URL_STORAGE_KEY) || API_ONLINE_DEFAULT_URL
  apiOnline.value = normalizarUrl(urlOnlineGuardada)

  // La web siempre usa el servidor; solo Electron puede usar la API local.
  const destinoGuardado = localStorage.getItem(API_DESTINO_STORAGE_KEY) as ApiDestino | null

  if (!esElectron()) {
    destinoActual.value = 'servidor'
  } else if (destinoGuardado === 'servidor' || destinoGuardado === 'local') {
    destinoActual.value = destinoGuardado
  } else {
    destinoActual.value = destinoPorDefecto()
  }

  localStorage.setItem(API_DESTINO_STORAGE_KEY, destinoActual.value)

  inicializado = true
}

export const getApiBaseUrl = () => {
  cargarConfiguracion()

  if (!esElectron() || destinoActual.value === 'servidor') {
    return normalizarUrl(apiOnline.value || API_ONLINE_DEFAULT_URL)
  }

  return API_LOCAL_URL
}

export const guardarApiConfig = (destino: ApiDestino, urlOnline?: string) => {
  cargarConfiguracion()

  const destinoGuardado: ApiDestino = esElectron() ? destino : 'servidor'

  // Si envían una nueva URL online, se normaliza y actualiza
  if (urlOnline) {
    const urlLimpia = normalizarUrl(urlOnline)
    apiOnline.value = urlLimpia
    localStorage.setItem(API_ONLINE_URL_STORAGE_KEY, urlLimpia)
  }

  // Validar que si elige servidor, exista una URL válida
  if (destinoGuardado === 'servidor' && !apiOnline.value) {
    throw new Error('Escribe la URL de la API en línea.')
  }

  // Guardar el estado seleccionado
  destinoActual.value = destinoGuardado
  
  // Guardar en LocalStorage tanto la elección como la URL activa resultante
  localStorage.setItem(API_DESTINO_STORAGE_KEY, destinoGuardado)
  localStorage.setItem(API_URL_STORAGE_KEY, getApiBaseUrl())
}

export function useApiConfig() {
  cargarConfiguracion()

  const urlActiva = computed(() => getApiBaseUrl())
  const servidorConfigurado = computed(() => Boolean(apiOnline.value))

  // Selecciona el destino (local o servidor) y guarda la elección de inmediato
  const seleccionarDestino = (destino: ApiDestino) => {
    guardarApiConfig(destino)
  }

  // Guarda/actualiza la URL del servidor en línea y lo activa
  const guardarServidor = (url: string) => {
    guardarApiConfig('servidor', url)
  }

  return {
    destinoActual,
    apiOnline,
    urlActiva,
    servidorConfigurado,
    seleccionarDestino,
    guardarServidor,
    guardarApiConfig
  }
}
