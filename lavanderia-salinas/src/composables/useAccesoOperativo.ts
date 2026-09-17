import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useSesion } from './useSesion'
import { useHorarios } from './Usehorarios'
import { combinarFechaHoraCentroamerica } from './useFechas'

export function useAccesoOperativo() {
  const { usuarioActual, esAdministrador, rol } = useSesion()
  const { encontrarEmpleadoPara, entradaMarcada, turnoDeHoyDe, verificarAutoSalida } = useHorarios()

  const ahora = ref(new Date())
  let relojId: any = null
  onMounted(() => {
    relojId = setInterval(() => {
      ahora.value = new Date()
      if (empleadoActivo.value) verificarAutoSalida(empleadoActivo.value.id, ahora.value)
    }, 1000)
  })
  onUnmounted(() => { if (relojId) clearInterval(relojId) })

  const empleadoActivo = computed(() => encontrarEmpleadoPara(usuarioActual.value))
  const turnoDeHoy = computed(() =>
    empleadoActivo.value ? turnoDeHoyDe(empleadoActivo.value.id).value : null
  )

  const accesoOperativoBloqueado = computed(() => {
    if (esAdministrador.value) return false
    if (!['cajero', 'recepcionista', 'operador'].includes(rol.value)) return false
    const turnoProgramado = turnoDeHoy.value
    if (!turnoProgramado || turnoProgramado.libre) return false
    const finDelTurno = combinarFechaHoraCentroamerica(turnoProgramado.fecha, turnoProgramado.horaFin)
    return ahora.value.getTime() >= finDelTurno.getTime() + 1 * 60 * 1000
  })

  const asistenciaActiva = computed(() =>
    empleadoActivo.value ? entradaMarcada(empleadoActivo.value.id) : false
  )

  const funcionesBloqueadas = computed(() =>
    esAdministrador.value
      ? false
      : (accesoOperativoBloqueado.value || (!!empleadoActivo.value && !asistenciaActiva.value))
  )

  return { empleadoActivo, asistenciaActiva, accesoOperativoBloqueado, funcionesBloqueadas }
}