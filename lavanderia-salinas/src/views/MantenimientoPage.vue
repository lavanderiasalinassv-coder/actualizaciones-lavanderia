<template>
  <AppShell>
    <div class="mantenimiento-page">
      <header class="mantenimiento-header">
        <button type="button" class="volver" aria-label="Volver a configuración" @click="volver">
          <ion-icon :icon="arrowBackOutline" />
        </button>
        <div>
          <p class="eyebrow">Administración</p>
          <h2>Mantenimiento</h2>
          <p>Elimina datos operativos que ya no necesitas conservar.</p>
        </div>
      </header>

      <section class="advertencia" aria-label="Advertencia de mantenimiento">
        <ion-icon :icon="warningOutline" />
        <div>
          <strong>Acción permanente</strong>
          <p>La limpieza no se puede deshacer. Usuarios, configuración, catálogo e inventario no se modifican.</p>
        </div>
      </section>

      <section class="grupos" aria-label="Datos para limpiar">
        <label v-for="grupo in grupos" :key="grupo.id" class="grupo" :class="{ seleccionado: seleccionados.includes(grupo.id) }">
          <input v-model="seleccionados" type="checkbox" :value="grupo.id" />
          <span class="grupo-icono"><ion-icon :icon="grupo.icono" /></span>
          <span class="grupo-contenido">
            <strong>{{ grupo.nombre }}</strong>
            <small>{{ grupo.descripcion }}</small>
          </span>
          <ion-icon :icon="checkmarkCircleOutline" class="grupo-check" />
        </label>
      </section>

      <section class="acciones">
        <p class="seleccion-resumen">{{ seleccionados.length }} grupo{{ seleccionados.length === 1 ? '' : 's' }} seleccionado{{ seleccionados.length === 1 ? '' : 's' }}</p>
        <button type="button" class="limpiar" :disabled="cargando || !seleccionados.length" @click="abrirConfirmacion">
          <ion-icon :icon="trashBinOutline" />
          {{ cargando ? 'Limpiando...' : 'Limpiar datos seleccionados' }}
        </button>
      </section>

      <p v-if="mensaje" class="mensaje" :class="{ error: error }">{{ mensaje }}</p>

      <ion-modal class="modal-confirmacion-limpieza" :is-open="mostrarModalConfirmacion" @didDismiss="cerrarConfirmacion">
        <div class="confirmacion-modal force-light" style="background-color: white;">
          <div class="confirmacion-icono"><ion-icon :icon="warningOutline" /></div>
          <h3>Confirmar limpieza</h3>
          <p>Esta acción eliminará permanentemente los datos seleccionados. Escribe <strong>LIMPIAR</strong> para continuar.</p>
          <input
            v-model="textoConfirmacion"
            class="confirmacion-input"
            type="text"
            autocomplete="off"
            placeholder="Escribe LIMPIAR"
            @keyup.enter="confirmarLimpieza"
          />
          <div class="confirmacion-acciones">
            <button type="button" class="cancelar-confirmacion" @click="cerrarConfirmacion">Cancelar</button>
            <button type="button" class="aceptar-confirmacion" :disabled="textoConfirmacion !== 'LIMPIAR'" @click="confirmarLimpieza">
              Confirmar limpieza
            </button>
          </div>
        </div>
      </ion-modal>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { IonIcon, IonModal } from '@ionic/vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import { getApiBaseUrl } from '@/composables/useApiConfig'
import { useSesion } from '@/composables/useSesion'
import {
  arrowBackOutline,
  calendarOutline,
  cashOutline,
  checkmarkCircleOutline,
  fileTrayFullOutline,
  notificationsOutline,
  peopleOutline,
  receiptOutline,
  trashBinOutline,
  warningOutline,
  walletOutline
} from 'ionicons/icons'

type GrupoId = 'ordenes' | 'caja' | 'cierres' | 'depositos' | 'horarios' | 'notificaciones' | 'tareas' | 'clientes' | 'seguridad'

const router = useRouter()
const { usuarioActual, esAdministrador } = useSesion()
const seleccionados = ref<GrupoId[]>([])
const cargando = ref(false)
const mensaje = ref('')
const error = ref(false)
const mostrarModalConfirmacion = ref(false)
const textoConfirmacion = ref('')

const grupos: Array<{ id: GrupoId; nombre: string; descripcion: string; icono: string }> = [
  { id: 'ordenes', nombre: 'Órdenes', descripcion: 'Órdenes y sus anticipos, cargos, fotos e historial', icono: receiptOutline },
  { id: 'caja', nombre: 'Caja', descripcion: 'Movimientos, cierres y turnos históricos', icono: walletOutline },
  { id: 'cierres', nombre: 'Cierres', descripcion: 'Cierres de caja y turnos históricos', icono: fileTrayFullOutline },
  { id: 'depositos', nombre: 'Depósitos', descripcion: 'Depósitos registrados en los movimientos de caja', icono: cashOutline },
  { id: 'horarios', nombre: 'Horarios', descripcion: 'Registros, pagos, turnos y pago por hora', icono: calendarOutline },
  { id: 'notificaciones', nombre: 'Notificaciones', descripcion: 'Vacía el historial de avisos, reportes y sus lecturas', icono: notificationsOutline },
  { id: 'tareas', nombre: 'Tareas', descripcion: 'Todas las tareas del equipo', icono: checkmarkCircleOutline },
  { id: 'clientes', nombre: 'Clientes', descripcion: 'Directorio y estadísticas de clientes', icono: peopleOutline },
  { id: 'seguridad', nombre: 'Códigos 2FA', descripcion: 'Códigos temporales de verificación', icono: warningOutline }
]

const volver = () => void router.replace('/tabs/configuracion')

const abrirConfirmacion = async () => {
  textoConfirmacion.value = ''
  mostrarModalConfirmacion.value = true
}

const cerrarConfirmacion = () => {
  mostrarModalConfirmacion.value = false
  textoConfirmacion.value = ''
}

const confirmarLimpieza = async () => {
  if (textoConfirmacion.value !== 'LIMPIAR') return
  cerrarConfirmacion()
  await limpiar()
}

const limpiar = async () => {
  if (!esAdministrador.value || cargando.value) return
  cargando.value = true
  mensaje.value = ''
  try {
    const respuesta = await fetch(`${getApiBaseUrl()}/mantenimiento/limpiar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grupos: seleccionados.value,
        usuarioRol: usuarioActual.value?.rol || localStorage.getItem('rol') || ''
      })
    })
    const datos = await respuesta.json().catch(() => ({}))
    if (!respuesta.ok) throw new Error(datos.error || 'No se pudieron limpiar las tablas.')
    mostrarMensaje(`Mantenimiento completado: ${datos.cantidadTablas} tablas limpiadas.`, false)
    seleccionados.value = []
  } catch (e) {
    mostrarMensaje(e instanceof Error ? e.message : 'No se pudieron limpiar las tablas.', true)
  } finally {
    cargando.value = false
  }
}

const mostrarMensaje = (texto: string, esError: boolean) => {
  mensaje.value = texto
  error.value = esError
}
</script>

<style scoped>
.mantenimiento-page { display: grid; gap: 22px; min-height: 100%; color: #0a1f38; }
.mantenimiento-header { display: flex; align-items: flex-start; gap: 14px; padding: 8px 2px 0; }
.volver { display: grid; place-items: center; flex: 0 0 42px; width: 42px; height: 42px; border: 1px solid rgba(10,31,56,.1); border-radius: 13px; background: #fff; color: #123a66; font-size: 21px; cursor: pointer; }
.eyebrow { margin: 0 0 6px; color: #b5523c; font-size: .76rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
h2 { margin: 0; font-size: 1.6rem; font-weight: 900; }
.mantenimiento-header p:last-child { margin: 8px 0 0; color: #6d829c; }
.advertencia { display: flex; gap: 14px; align-items: flex-start; padding: 17px 18px; border: 1px solid #f0c4b8; border-radius: 16px; background: #fff6f3; color: #7f3324; }
.advertencia > ion-icon { flex: 0 0 auto; margin-top: 2px; font-size: 24px; }
.advertencia strong { font-size: .95rem; }
.advertencia p { margin: 4px 0 0; color: #945949; font-size: .86rem; line-height: 1.4; }
.grupos { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.grupo { display: flex; align-items: center; gap: 13px; min-width: 0; padding: 17px; border: 1px solid rgba(10,31,56,.1); border-radius: 16px; background: #fff; cursor: pointer; box-shadow: 0 7px 18px rgba(10,31,56,.05); transition: border-color .2s ease, transform .2s ease, box-shadow .2s ease; }
.grupo:hover { transform: translateY(-2px); box-shadow: 0 12px 24px rgba(10,31,56,.09); }
.grupo.seleccionado { border-color: #168b83; box-shadow: 0 10px 22px rgba(22,139,131,.12); }
.grupo input { position: absolute; opacity: 0; pointer-events: none; }
.grupo-icono { display: grid; place-items: center; flex: 0 0 42px; width: 42px; height: 42px; border-radius: 12px; background: #e8f7f4; color: #168b83; font-size: 22px; }
.grupo-contenido { display: grid; gap: 4px; min-width: 0; }
.grupo-contenido strong { font-size: .95rem; }
.grupo-contenido small { color: #6d829c; font-size: .8rem; line-height: 1.35; }
.grupo-check { margin-left: auto; flex: 0 0 auto; color: #d2dbe2; font-size: 22px; }
.grupo.seleccionado .grupo-check { color: #168b83; }
.acciones { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.seleccion-resumen { margin: 0; color: #6d829c; font-size: .88rem; }
.limpiar { display: inline-flex; align-items: center; justify-content: center; gap: 9px; padding: 12px 17px; border: 0; border-radius: 12px; background: #b5523c; color: #fff; font: inherit; font-weight: 800; cursor: pointer; }
.limpiar:disabled { background: #c8d1d8; cursor: not-allowed; }
.mensaje { margin: 0; color: #08766f; font-weight: 700; }
.mensaje.error { color: #b5523c; }
.confirmacion-modal { display: grid; gap: 14px; min-width: min(100%, 420px); padding: 28px; color: #0a1f38; }
.modal-confirmacion-limpieza { --height: auto; --width: min(92vw, 480px); --max-height: 90vh; --border-radius: 18px; }
.modal-confirmacion-limpieza .confirmacion-modal { width: 100%; box-sizing: border-box; }
.confirmacion-icono { display: grid; place-items: center; width: 48px; height: 48px; border-radius: 14px; background: #fff0ec; color: #b5523c; font-size: 25px; }
.confirmacion-modal h3 { margin: 0; font-size: 1.25rem; }
.confirmacion-modal p { margin: 0; color: #6d829c; line-height: 1.45; }
.confirmacion-input { width: 100%; box-sizing: border-box; padding: 12px; border: 1px solid rgba(10,31,56,.16); border-radius: 10px; background: #fff; color: #0a1f38; font: inherit; }
.confirmacion-input:focus { border-color: #b5523c; outline: none; box-shadow: 0 0 0 3px rgba(181,82,60,.12); }
.confirmacion-acciones { display: flex; justify-content: flex-end; gap: 10px; margin-top: 5px; }
.confirmacion-acciones button { padding: 11px 15px; border-radius: 10px; font: inherit; font-weight: 800; cursor: pointer; }
.cancelar-confirmacion { border: 1px solid rgba(10,31,56,.14); background: #fff; color: #123a66; }
.aceptar-confirmacion { border: 0; background: #b5523c; color: #fff; }
.aceptar-confirmacion:disabled { opacity: .45; cursor: not-allowed; }
@media (max-width: 620px) { .grupos { grid-template-columns: 1fr; } .acciones { align-items: stretch; flex-direction: column; } .limpiar { width: 100%; } }
</style>
