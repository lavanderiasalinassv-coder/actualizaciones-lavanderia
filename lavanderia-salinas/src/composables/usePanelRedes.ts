import { computed, ref } from 'vue'

const mostrarPanelWhatsapp = ref(false)
const mostrarPanelFacebook = ref(false)
const mostrarPanelNavegador = ref(false)
const panelNavegadorMinimizado = ref(false)
const urlWhatsappInicial = ref('')
const solicitudCargaWhatsapp = ref(0)
const panelWhatsappLateral = ref(true)
const panelFacebookLateral = ref(true)
const panelNavegadorLateral = ref(true)
const panelLado = ref<'izquierda' | 'derecha'>('derecha')

export function usePanelRedes() {
  const cerrarTodosLosPaneles = () => {
    mostrarPanelWhatsapp.value = false
    mostrarPanelFacebook.value = false
    mostrarPanelNavegador.value = false
  }

  const abrirWhatsapp = (urlInicial = '') => {
    const yaEstabaAbierto = mostrarPanelWhatsapp.value
    cerrarTodosLosPaneles()
    panelWhatsappLateral.value = true
    panelLado.value = 'derecha' // Siempre derecha por defecto
    urlWhatsappInicial.value = urlInicial
    mostrarPanelWhatsapp.value = true
    if (yaEstabaAbierto) solicitudCargaWhatsapp.value += 1
  }

  const abrirFacebook = () => {
    cerrarTodosLosPaneles()
    panelFacebookLateral.value = true
    panelLado.value = 'derecha' // Siempre derecha por defecto
    mostrarPanelFacebook.value = true
  }

  const abrirNavegador = () => {
    if (mostrarPanelNavegador.value && panelNavegadorMinimizado.value) {
      panelNavegadorMinimizado.value = false
      return
    }

    cerrarTodosLosPaneles()
    panelNavegadorLateral.value = true
    panelLado.value = 'derecha' // Siempre derecha por defecto
    mostrarPanelNavegador.value = true
    panelNavegadorMinimizado.value = false
  }

  const minimizarNavegador = () => {
    if (mostrarPanelNavegador.value) panelNavegadorMinimizado.value = true
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
    panelNavegadorMinimizado.value = false
    panelLado.value = 'derecha' // Resetear a derecha
  }

  // Computed para determinar si algún panel está abierto en modo lateral
  const panelLateralAbierto = computed(() => {
    return (mostrarPanelWhatsapp.value && panelWhatsappLateral.value) ||
           (mostrarPanelFacebook.value && panelFacebookLateral.value) ||
           (mostrarPanelNavegador.value && !panelNavegadorMinimizado.value && panelNavegadorLateral.value)
  })

  // Computed para determinar el lado del panel abierto
  const ladoPanelActivo = computed(() => {
    if (mostrarPanelWhatsapp.value && panelWhatsappLateral.value) return panelLado.value
    if (mostrarPanelFacebook.value && panelFacebookLateral.value) return panelLado.value
    if (mostrarPanelNavegador.value && !panelNavegadorMinimizado.value && panelNavegadorLateral.value) return panelLado.value
    return null
  })

  return {
    mostrarPanelWhatsapp,
    mostrarPanelFacebook,
    mostrarPanelNavegador,
    panelNavegadorMinimizado,
    urlWhatsappInicial,
    solicitudCargaWhatsapp,
    panelWhatsappLateral,
    panelFacebookLateral,
    panelNavegadorLateral,
    panelLado,
    panelLateralAbierto,
    ladoPanelActivo,
    abrirWhatsapp,
    abrirFacebook,
    abrirNavegador,
    minimizarNavegador,
    cerrarWhatsapp,
    cerrarFacebook,
    cerrarNavegador
  }
}
