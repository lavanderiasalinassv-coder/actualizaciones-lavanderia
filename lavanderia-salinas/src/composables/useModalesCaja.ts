import { ref } from 'vue'
import { useTurno } from './useTurno'

// Estado a nivel de módulo: se comparte entre todas las
// llamadas a useModalesCaja(), sin importar el componente.
const mostrarModalGasto = ref(false)
const mostrarModalCierres = ref(false)

export function useModalesCaja() {
  const { turno } = useTurno()

  const abrirModalGasto = () => {
    if (!turno.abierto) {
      window.alert('Abre un turno antes de registrar un gasto.')
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