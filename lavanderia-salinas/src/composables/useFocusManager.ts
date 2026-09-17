import { onMounted, onUnmounted } from 'vue'

/**
 * Composable para gestionar problemas de focus y teclado en Ionic
 * Ayuda a prevenir que los inputs pierdan la capacidad de recibir eventos de teclado
 * después de navegar entre vistas
 */
export function useFocusManager() {
  let cleanupFocusHandler: (() => void) | null = null

  const restoreFocus = () => {
    // Restaurar el focus en el elemento activo
    const activeElement = document.activeElement as HTMLElement
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
      activeElement.blur()
      setTimeout(() => activeElement.focus(), 0)
    }
  }

  const cleanupKeyboardListeners = () => {
    // Limpiar cualquier listener de teclado que pueda estar bloqueando inputs
    document.removeEventListener('keydown', preventDefaultHandler)
  }

  const preventDefaultHandler = (e: KeyboardEvent) => {
    // No prevenir eventos en inputs/textareas
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      e.stopPropagation()
    }
  }

  onMounted(() => {
    // Agregar listener para restaurar focus al cambiar de vista
    cleanupFocusHandler = () => {
      restoreFocus()
      cleanupKeyboardListeners()
    }

    // Escuchar cambios de ruta para restaurar focus
    window.addEventListener('focusin', restoreFocus, true)
    window.addEventListener('focusout', restoreFocus, true)
  })

  onUnmounted(() => {
    window.removeEventListener('focusin', restoreFocus, true)
    window.removeEventListener('focusout', restoreFocus, true)
    cleanupKeyboardListeners()
    if (cleanupFocusHandler) {
      cleanupFocusHandler()
    }
  })

  return {
    restoreFocus,
    cleanupKeyboardListeners
  }
}
