import { computed, ref } from 'vue'

export type VozSali = {
  id: string
  nombre: string
  descripcion: string
}

export const VOCES_SALI: VozSali[] = [
  { id: 'es-CO-SalomeNeural', nombre: 'Salome', descripcion: 'Colombia, femenina y cálida' },
  { id: 'es-MX-DaliaNeural', nombre: 'Dalia', descripcion: 'México, femenina y clara' },
  { id: 'es-MX-BeatrizNeural', nombre: 'Beatriz', descripcion: 'México, femenina y natural' },
  { id: 'es-MX-CandelaNeural', nombre: 'Candela', descripcion: 'México, femenina y amable' },
  { id: 'es-MX-LarissaNeural', nombre: 'Larissa', descripcion: 'México, femenina y suave' },
  { id: 'es-MX-RenataNeural', nombre: 'Renata', descripcion: 'México, femenina y expresiva' },
  { id: 'es-ES-ElviraNeural', nombre: 'Elvira', descripcion: 'España, femenina y expresiva' },
  { id: 'es-ES-XimenaNeural', nombre: 'Ximena', descripcion: 'España, femenina y cercana' },
  { id: 'es-AR-ElenaNeural', nombre: 'Elena', descripcion: 'Argentina, femenina y suave' },
  { id: 'es-CL-CatalinaNeural', nombre: 'Catalina', descripcion: 'Chile, femenina y clara' },
  { id: 'es-PE-CamilaNeural', nombre: 'Camila', descripcion: 'Perú, femenina y cálida' },
  { id: 'es-VE-PaolaNeural', nombre: 'Paola', descripcion: 'Venezuela, femenina y amable' },
  { id: 'es-US-PalomaNeural', nombre: 'Paloma', descripcion: 'Estados Unidos, femenina y cercana' },
]

const STORAGE_KEY = 'sali-ai-config'
const VOZ_DEFAULT = VOCES_SALI[0].id
const vozSeleccionada = ref(VOZ_DEFAULT)
let inicializado = false

const inicializar = () => {
  if (inicializado || typeof window === 'undefined') return
  inicializado = true
  try {
    const guardada = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}') as { voz?: string }
    if (VocesValidas.has(guardada.voz ?? '')) vozSeleccionada.value = guardada.voz as string
  } catch {
    vozSeleccionada.value = VOZ_DEFAULT
  }
}

const VocesValidas = new Set(VOCES_SALI.map((voz) => voz.id))

const guardarVoz = (voz: string) => {
  inicializar()
  if (!VocesValidas.has(voz)) return
  vozSeleccionada.value = voz
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ voz }))
}

export const useSaliAiConfig = () => {
  inicializar()
  const vozActual = computed(() => VOCES_SALI.find((voz) => voz.id === vozSeleccionada.value) ?? VOCES_SALI[0])
  return { vozSeleccionada, vozActual, guardarVoz, voces: VOCES_SALI }
}
