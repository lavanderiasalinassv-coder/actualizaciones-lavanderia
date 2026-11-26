import { ref } from 'vue'
import { toastController } from '@ionic/vue'
import { useTurno } from './useTurno'

// Estado a nivel de módulo: se comparte entre todas las
// llamadas a useModalesCaja(), sin importar el componente.
const mostrarModalGasto = ref(false)
const mostrarModalCierres = ref(false)

export function useModalesCaja() {
  const { cargarTurno, error: errorTurno } = useTurno()

  const abrirModalGasto = async () => {
    const turnoActual = await cargarTurno()
    if (!turnoActual?.abierto) {
      const toast = await toastController.create({
        message: errorTurno.value
          ? 'No se pudo verificar el estado de la caja. Intenta de nuevo.'
          : 'Necesitas una caja abierta para registrar un gasto.',
        duration: 4500,
        position: 'top',
        color: errorTurno.value ? 'danger' : 'warning'
      })
      await toast.present()
      return
    }
    mostrarModalGasto.value = true
  }

  const abrirModalCierres = () => {
    mostrarModalCierres.value = true
  }

  return {
    mostrarModalGasto,
    mostrarModalCierres,
    abrirModalGasto,
    abrirModalCierres,
  }
}