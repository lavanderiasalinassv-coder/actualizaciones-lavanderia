import { computed, ref } from 'vue'

const mostrarPanelWhatsapp = ref(false)
const mostrarPanelFacebook = ref(false)
const mostrarPanelNavegador = ref(false)
const urlWhatsappInicial = ref('')
const panelWhatsappLateral = ref(true)
const panelFacebookLateral = ref(true)
const panelNavegadorLateral = ref(true)
const panelLado = ref<'izquierda' | 'derecha'>('derecha')

export function usePanelRedes() {
  const abrirWhatsapp = (urlInicial = '') => {
    mostrarPanelFacebook.value = false
    panelWhatsappLateral.value = true
    panelLado.value = 'derecha' // Siempre derecha por defecto
    urlWhatsappInicial.value = urlInicial
    mostrarPanelWhatsapp.value = true
  }

  const abrirFacebook = () => {
    mostrarPanelWhatsapp.value = false
    mostrarPanelNavegador.value = false
    panelFacebookLateral.value = true
    panelLado.value = 'derecha' // Siempre derecha por defecto
    mostrarPanelFacebook.value = true
  }

  const abrirNavegador = () => {
    mostrarPanelWhatsapp.value = false
    mostrarPanelFacebook.value = false
    panelNavegadorLateral.value = true
    panelLado.value = 'derecha' // Siempre derecha por defecto
    mostrarPanelNavegador.value = true
  }

  const cerrarWhatsapp = () => {
    mostrarPanelWhatsapp.value = false
    panelLado.value = 'derecha' // Resetear a derecha
  }

  const cerrarFacebook = () => {
    mostrarPanelFacebook.value = false
    panelLado.value = 'derecha' // Resetear a derecha
  }

  const cerrarNavegador = () => {
    mostrarPanelNavegador.value = false
    panelLado.value = 'derecha' // Resetear a derecha
  }

  // Computed para determinar si algún panel está abierto en modo lateral
  const panelLateralAbierto = computed(() => {
    return (mostrarPanelWhatsapp.value && panelWhatsappLateral.value) ||
           (mostrarPanelFacebook.value && panelFacebookLateral.value) ||
           (mostrarPanelNavegador.value && panelNavegadorLateral.value)
  })

  // Computed para determinar el lado del panel abierto
  const ladoPanelActivo = computed(() => {
    if (mostrarPanelWhatsapp.value && panelWhatsappLateral.value) return panelLado.value
    if (mostrarPanelFacebook.value && panelFacebookLateral.value) return panelLado.value
    if (mostrarPanelNavegador.value && panelNavegadorLateral.value) return panelLado.value
    return null
  })

  return {
    mostrarPanelWhatsapp,
    mostrarPanelFacebook,
    mostrarPanelNavegador,
    urlWhatsappInicial,
    panelWhatsappLateral,
    panelFacebookLateral,
    panelNavegadorLateral,
    panelLado,
    panelLateralAbierto,
    ladoPanelActivo,
    abrirWhatsapp,
    abrirFacebook,
    abrirNavegador,
    cerrarWhatsapp,
    cerrarFacebook,
    cerrarNavegador
  }
}
