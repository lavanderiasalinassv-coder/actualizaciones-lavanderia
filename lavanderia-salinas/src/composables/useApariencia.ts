import { computed, reactive, watch } from 'vue'
import { getApiBaseUrl } from '@/composables/useApiConfig'

export interface AparienciaConfig {
  appShellColor: string
  appShellHeaderColor: string
  appShellImagen: string
  loginColor: string
  loginImagen: string
  orbColorUno: string
  orbColorDos: string
}

const STORAGE_KEY = 'lavanderia-salinas-apariencia'

export const aparienciaPredeterminada: AparienciaConfig = {
  appShellColor: '#eef4f8',
  appShellHeaderColor: '#081a30',
  appShellImagen: '',
  loginColor: '#0a1f38',
  loginImagen: '',
  orbColorUno: '#a9d8ee',
  orbColorDos: '#123a66'
}

const apariencia = reactive<AparienciaConfig>({ ...aparienciaPredeterminada })
let inicializada = false
let cargandoServidor = false

const cargarApariencia = async (forzar = false) => {
  if (inicializada && !forzar || typeof window === 'undefined') return
  inicializada = true

  try {
    const guardada = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<AparienciaConfig>
    Object.assign(apariencia, {
      ...aparienciaPredeterminada,
      ...guardada
    })
  } catch {
    Object.assign(apariencia, aparienciaPredeterminada)
  }

  cargandoServidor = true
  try {
    const respuesta = await fetch(`${getApiBaseUrl()}/apariencia`)
    if (!respuesta.ok) return

    const remota = await respuesta.json() as Partial<AparienciaConfig>
    Object.assign(apariencia, {
      ...aparienciaPredeterminada,
      ...remota
    })
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(apariencia))
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
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(valor))
    }
  },
  { deep: true }
)

export function useApariencia() {
  const estiloAppShell = computed(() => ({
    '--app-shell-color': apariencia.appShellColor,
    '--app-shell-header-color': apariencia.appShellHeaderColor,
    '--app-shell-imagen': apariencia.appShellImagen ? `url("${apariencia.appShellImagen}")` : 'none'
  }))

  const estiloLogin = computed(() => ({
    '--login-color': apariencia.loginColor,
    '--login-imagen': 'none',
    '--orb-color-uno': apariencia.orbColorUno,
    '--orb-color-dos': apariencia.orbColorDos
  }))

  const actualizarApariencia = (cambios: Partial<AparienciaConfig>) => {
    Object.assign(apariencia, cambios)
  }

  const guardarApariencia = async (cambios: Partial<AparienciaConfig> = apariencia) => {
    const configuracion = { ...apariencia, ...cambios }

    const respuesta = await fetch(`${getApiBaseUrl()}/apariencia`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(configuracion)
    })

    if (!respuesta.ok) {
      throw new Error('No se pudo guardar la apariencia en el servidor.')
    }

    Object.assign(apariencia, configuracion)
  }

  const restablecerApariencia = () => {
    Object.assign(apariencia, aparienciaPredeterminada)
  }

  const restablecerCampo = (campo: keyof AparienciaConfig) => {
    apariencia[campo] = aparienciaPredeterminada[campo]
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
