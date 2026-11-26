import { computed, reactive, watch } from 'vue'
import { getApiBaseUrl } from '@/composables/useApiConfig'
import { RUTAS_ACCESO_PRINCIPAL_PREDETERMINADAS, type RutaPrincipalAcceso } from '@/data/opcionesAccesoPrincipal'

export interface AparienciaConfig {
  appShellColor: string
  appShellHeaderColor: string
  appShellImagen: string
  appShellLayout: 'top' | 'sidebar-left' | 'sidebar-right'
  principalAccesosOrden: RutaPrincipalAcceso[]
  principalPanelesInvertidos: boolean
  loginColor: string
  loginImagen: string
  loginLayout: 'classic' | 'reverse'
  loginTheme: 'market' | 'nocturne' | 'linen' | 'aurora' | 'minimal'
  saliAssistantPosition: 'left' | 'right'
  orbColorUno: string
  orbColorDos: string
  fontFamily:
    | 'system'
    | 'segoe'
    | 'arial'
    | 'verdana'
    | 'tahoma'
    | 'trebuchet'
    | 'calibri'
    | 'candara'
    | 'gill-sans'
    | 'lucida-sans'
    | 'century-gothic'
    | 'georgia'
    | 'cambria'
    | 'palatino'
    | 'times'
    | 'courier'
    | 'comic-sans'
    | 'segoe-script'
    | 'segoe-print'
    | 'lucida-handwriting'
    | 'mobile-cursive'
}

const STORAGE_KEY = 'lavanderia-salinas-apariencia'
const DEVICE_PREFERENCES_KEY = 'lavanderia-salinas-preferencias-dispositivo'
const DISENOS_APPSHELL = ['top', 'sidebar-left', 'sidebar-right'] as const
const FUENTES_CSS: Record<AparienciaConfig['fontFamily'], string> = {
  system: "system-ui, -apple-system, 'Segoe UI', sans-serif",
  segoe: "'Segoe UI', Tahoma, sans-serif",
  arial: "Arial, 'Helvetica Neue', sans-serif",
  verdana: "Verdana, Geneva, sans-serif",
  tahoma: "Tahoma, 'Segoe UI', sans-serif",
  trebuchet: "'Trebuchet MS', sans-serif",
  calibri: 'Calibri, sans-serif',
  candara: 'Candara, sans-serif',
  'gill-sans': "'Gill Sans', 'Gill Sans MT', sans-serif",
  'lucida-sans': "'Lucida Sans Unicode', 'Lucida Grande', sans-serif",
  'century-gothic': "'Century Gothic', sans-serif",
  georgia: "Georgia, 'Times New Roman', serif",
  cambria: 'Cambria, Georgia, serif',
  palatino: "'Palatino Linotype', Palatino, serif",
  times: "'Times New Roman', Times, serif",
  courier: "'Courier New', monospace",
  'comic-sans': "'Comic Sans MS', 'Comic Sans', cursive",
  'segoe-script': "'Segoe Script', 'Apple Chancery', cursive",
  'segoe-print': "'Segoe Print', 'Bradley Hand', cursive",
  'lucida-handwriting': "'Lucida Handwriting', 'Brush Script MT', cursive",
  'mobile-cursive': "'Snell Roundhand', 'Segoe Script', 'Apple Chancery', cursive"
}

const colorTextoTema = (color: string) => {
  const hex = color.replace('#', '')
  if (!/^[\da-f]{6}$/i.test(hex)) return '#ffffff'
  const canales = [0, 2, 4].map(inicio => Number.parseInt(hex.slice(inicio, inicio + 2), 16))
  const luminosidad = canales[0] * 0.299 + canales[1] * 0.587 + canales[2] * 0.114
  return luminosidad > 155 ? '#17243a' : '#ffffff'
}

const normalizarTemaLogin = (
  tema: AparienciaConfig['loginTheme'] | undefined
): AparienciaConfig['loginTheme'] =>
  !tema || tema === 'minimal' ? aparienciaPredeterminada.loginTheme : tema

const normalizarDistribucionLogin = (layout: string | undefined): AparienciaConfig['loginLayout'] =>
  layout === 'reverse' ? 'reverse' : 'classic'

const normalizarPosicionSaliAssistant = (position: string | undefined): AparienciaConfig['saliAssistantPosition'] =>
  position === 'left' ? 'left' : 'right'

type PreferenciasDispositivo = Pick<AparienciaConfig, 'appShellLayout'>

export const aparienciaPredeterminada: AparienciaConfig = {
  appShellColor: '#e2ecef',
  appShellHeaderColor: '#072346',
  appShellImagen: '',
  appShellLayout: 'top',
  principalAccesosOrden: [...RUTAS_ACCESO_PRINCIPAL_PREDETERMINADAS],
  principalPanelesInvertidos: false,
  loginColor: '#0a1f38',
  loginImagen: '',
  loginLayout: 'classic',
  loginTheme: 'nocturne',
  saliAssistantPosition: 'right',
  orbColorUno: '#a9d8ee',
  orbColorDos: '#123a66',
  fontFamily: 'system'
}

const apariencia = reactive<AparienciaConfig>({ ...aparienciaPredeterminada })
let inicializada = false
let cargandoServidor = false

const leerPreferenciasDispositivo = (): PreferenciasDispositivo => {
  const predeterminadas = {
    appShellLayout: aparienciaPredeterminada.appShellLayout
  }
  if (typeof window === 'undefined') return predeterminadas

  try {
    const guardadas = JSON.parse(window.localStorage.getItem(DEVICE_PREFERENCES_KEY) ?? '{}') as Partial<PreferenciasDispositivo>
    return {
      appShellLayout: DISENOS_APPSHELL.includes(guardadas.appShellLayout as PreferenciasDispositivo['appShellLayout'])
        ? guardadas.appShellLayout as PreferenciasDispositivo['appShellLayout']
        : predeterminadas.appShellLayout
    }
  } catch {
    return predeterminadas
  }
}

const guardarPreferenciasDispositivo = (preferencias: PreferenciasDispositivo) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(DEVICE_PREFERENCES_KEY, JSON.stringify(preferencias))
}

const guardarAparienciaLocal = (valor: AparienciaConfig) => {
  if (typeof window === 'undefined') return
  const { appShellLayout: _appShellLayout, ...compartida } = valor
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(compartida))
}

const cargarApariencia = async (forzar = false) => {
  if (inicializada && !forzar || typeof window === 'undefined') return
  inicializada = true

  try {
    const guardada = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<AparienciaConfig>
    if (guardada.loginTheme === 'market') {
      guardada.loginTheme = aparienciaPredeterminada.loginTheme
    }
    guardada.loginTheme = normalizarTemaLogin(guardada.loginTheme)
    guardada.loginLayout = normalizarDistribucionLogin(guardada.loginLayout)
    guardada.saliAssistantPosition = normalizarPosicionSaliAssistant(guardada.saliAssistantPosition)
    Object.assign(apariencia, {
      ...aparienciaPredeterminada,
      ...guardada
    })
  } catch {
    Object.assign(apariencia, aparienciaPredeterminada)
  }

  const preferenciasDispositivo = leerPreferenciasDispositivo()
  Object.assign(apariencia, preferenciasDispositivo)

  cargandoServidor = true
  try {
    const respuesta = await fetch(`${getApiBaseUrl()}/apariencia`)
    if (!respuesta.ok) return

    const remota = await respuesta.json() as Partial<AparienciaConfig>
    Object.assign(apariencia, {
      ...aparienciaPredeterminada,
      ...remota,
      loginTheme: normalizarTemaLogin(remota.loginTheme),
      loginLayout: normalizarDistribucionLogin(remota.loginLayout),
      saliAssistantPosition: normalizarPosicionSaliAssistant(remota.saliAssistantPosition),
      ...preferenciasDispositivo
    })
    guardarAparienciaLocal(apariencia)
  } catch {
    // La copia local mantiene la apariencia disponible si la API no responde.
  } finally {
    cargandoServidor = false
  }
}

void cargarApariencia()

watch(
  apariencia,
  (valor) => {
    guardarAparienciaLocal(valor)
  },
  { deep: true }
)

watch(
  () => apariencia.fontFamily,
  (fuente) => {
    if (typeof document === 'undefined') return
    document.documentElement.style.setProperty(
      '--app-font-family',
      FUENTES_CSS[fuente] ?? FUENTES_CSS.system
    )
  },
  { immediate: true }
)

export function useApariencia() {
  const estiloAppShell = computed(() => ({
    '--app-shell-color': apariencia.appShellColor,
    '--app-shell-header-color': apariencia.appShellHeaderColor,
    '--app-shell-header-text-color': colorTextoTema(apariencia.appShellHeaderColor),
    '--app-shell-imagen': apariencia.appShellImagen ? `url("${apariencia.appShellImagen}")` : 'none',
    '--app-font-family': FUENTES_CSS[apariencia.fontFamily] ?? FUENTES_CSS.system,
    '--ion-font-family': FUENTES_CSS[apariencia.fontFamily] ?? FUENTES_CSS.system
  }))

  const estiloLogin = computed(() => ({
    '--login-color': apariencia.appShellHeaderColor,
    '--login-imagen': 'none'
  }))

  const actualizarApariencia = (cambios: Partial<AparienciaConfig>) => {
    Object.assign(apariencia, cambios)
  }

  const guardarApariencia = async (cambios: Partial<AparienciaConfig> = apariencia) => {
    const configuracion = { ...apariencia, ...cambios }
    const preferenciasDispositivo = {
      appShellLayout: configuracion.appShellLayout
    }
    guardarPreferenciasDispositivo(preferenciasDispositivo)
    Object.assign(apariencia, {
      ...preferenciasDispositivo
    })
    const {
      appShellLayout: _appShellLayout,
      ...configuracionCompartida
    } = configuracion

    const respuesta = await fetch(`${getApiBaseUrl()}/apariencia`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(configuracionCompartida)
    })

    if (!respuesta.ok) {
      throw new Error('No se pudo guardar la apariencia en el servidor.')
    }

    Object.assign(apariencia, configuracion)
  }

  const restablecerApariencia = () => {
    Object.assign(apariencia, aparienciaPredeterminada)
    guardarPreferenciasDispositivo({
      appShellLayout: aparienciaPredeterminada.appShellLayout
    })
  }

  const restablecerCampo = <K extends keyof AparienciaConfig>(campo: K) => {
    apariencia[campo] = aparienciaPredeterminada[campo]
    if (campo === 'appShellLayout') {
      guardarPreferenciasDispositivo({
        appShellLayout: apariencia.appShellLayout
      })
    }
  }

  return {
    apariencia,
    estiloAppShell,
    estiloLogin,
    actualizarApariencia,
    guardarApariencia,
    cargarApariencia,
    restablecerApariencia,
    restablecerCampo
  }
}
