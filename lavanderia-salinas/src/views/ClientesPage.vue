<template>
  <AppShell>
    <div class="page-content">
      <div class="header-row">
        <div>
          <h1>Clientes</h1>
        </div>
        <ion-button class="btn-primario" @click="abrirFormulario()">
          <ion-icon :icon="personAddOutline" slot="start" />
          Agregar cliente
        </ion-button>
      </div>

      <div class="stats-row">
        <button type="button" class="stat-card stat-total" :class="{ active: vistaClientes === 'todos' }" @click="setVistaClientes('todos')">
          <span class="stat-icon"><ion-icon :icon="peopleOutline" /></span>
          <span class="stat-label">Total</span>
          <strong>{{ estadisticas.totalClientes }}</strong>
        </button>
        <button type="button" class="stat-card stat-recurrentes" :class="{ active: vistaClientes === 'recurrentes' }" @click="setVistaClientes('recurrentes')">
          <span class="stat-icon"><ion-icon :icon="heartOutline" /></span>
          <span class="stat-label">Recurrentes</span>
          <strong>{{ estadisticas.clientesRecurrentes }}</strong>
        </button>
        <button type="button" class="stat-card stat-top" :class="{ active: vistaClientes === 'top' }" @click="setVistaClientes('top')">
          <span class="stat-icon"><ion-icon :icon="trophyOutline" /></span>
          <span class="stat-label">Top</span>
          <strong>{{totalClientesTop }}</strong>
        </button>
      </div>

      <div class="search-bar">
        <ion-icon :icon="searchOutline" />
        <input v-model="busqueda" type="text" placeholder="Buscar cliente..." />
      </div>

      <div v-if="cargandoClientes" class="loading-state">
        <div class="spinner"></div>
        <p>Cargando clientes...</p>
      </div>

      <div v-else-if="clientesFiltrados.length" class="clientes-paginado">
        <div class="clientes-grid clientes-grid-fija">
          <div
            v-for="(cliente, indice) in clientesPagina"
            :key="cliente.id"
            class="cliente-card"
            :class="[`acento-${indice % 4}`, claseMedalla(indice)]"
          >
            <span v-if="claseMedalla(indice)" class="medalla-badge">
              {{ emojiMedalla(indice) }}
            </span>

            <div class="cliente-header">
              <div class="cliente-avatar">
                <ion-icon :icon="personCircleOutline" />
              </div>
              <div class="cliente-info-head">
                <h3>{{ cliente.nombre }}</h3>
                <span v-if="cliente.esRecurrente" class="badge-recurrente">💚 Recurrente</span>
              </div>
            </div>

            <div class="cliente-detalles">
              <div class="detalle-fila">
                <ion-icon :icon="callOutline" />
                <span>{{ cliente.celular }}</span>
              </div>
              <div class="detalle-fila">
                <ion-icon :icon="mailOutline" />
                <span>{{ cliente.correo || 'Sin correo' }}</span>
              </div>
              <div class="detalle-fila detalle-ordenes">
                <ion-icon :icon="receiptOutline" />
                <span><strong>{{ cliente.totalOrdenes }}</strong> {{ cliente.totalOrdenes === 1 ? 'orden' : 'órdenes' }}</span>
              </div>
            </div>

            <div class="cliente-acciones">
              <ion-button fill="clear" class="btn-icon" @click="editarCliente(cliente)">
                <ion-icon :icon="createOutline" />
              </ion-button>
              <ion-button fill="clear" class="btn-icon danger" @click="confirmarEliminar(cliente)">
                <ion-icon :icon="trashOutline" />
              </ion-button>
            </div>
          </div>
        </div>

        <div class="paginador">
          <button
            type="button"
            class="paginador-btn"
            :disabled="paginaActual === 1"
            @click="paginaAnterior"
          >
            <ion-icon :icon="chevronBackOutline" />
          </button>

          <span class="paginador-info">
            Página {{ paginaActual }} de {{ totalPaginas }}
            <small>({{ clientesFiltrados.length }} cliente{{ clientesFiltrados.length === 1 ? '' : 's' }})</small>
          </span>

          <button
            type="button"
            class="paginador-btn"
            :disabled="paginaActual === totalPaginas"
            @click="paginaSiguiente"
          >
            <ion-icon :icon="chevronForwardOutline" />
          </button>
        </div>
      </div>

      <div v-else class="empty-state">
        <ion-icon :icon="peopleOutline" />
        <h3>No hay clientes registrados</h3>
        <p>Agrega el primer cliente desde aquí o guárdalo desde un pedido.</p>
      </div>
    </div>

    <ion-modal class="modal-clientes" :is-open="mostrarFormulario" @didDismiss="cerrarFormulario">
      <div class="modal-content">
        <div class="modal-header">
          <div>
            <p class="eyebrow">{{ modoEdicion ? 'Editar cliente' : 'Nuevo cliente' }}</p>
            <h2>{{ modoEdicion ? 'Actualizar perfil' : 'Registrar cliente' }}</h2>
          </div>
          <button class="modal-close" @click="cerrarFormulario">
            <ion-icon :icon="closeOutline" />
          </button>
        </div>

        <div class="form-grid">
          <label>
            <span>Nombre completo *</span>
            <input v-model="form.nombre" type="text" placeholder="Ej. Juan Pérez" />
          </label>

          <label>
            <span>Celular / Teléfono *</span>
            <div class="telefono-row">
              <input v-model="form.codigoPais" class="input-codigo" type="text" inputmode="numeric" maxlength="4" placeholder="503" aria-label="Código de país sin signo más" />
              <input v-model="form.celular" type="tel" inputmode="numeric" placeholder="Ej. 70000000" />
            </div>
          </label>

          <label>
            <span>Correo (opcional)</span>
            <input v-model="form.correo" type="email" placeholder="cliente@ejemplo.com" />
          </label>
        </div>

        <div class="modal-actions">
          <ion-button class="btn-fantasma" @click="cerrarFormulario">Cancelar</ion-button>
          <ion-button class="btn-primario" @click="guardarCliente">{{ modoEdicion ? 'Guardar cambios' : 'Agregar cliente' }}</ion-button>
        </div>
      </div>
    </ion-modal>
  </AppShell>
</template>

<script setup lang="ts">
import AppShell from '@/components/AppShell.vue'
import {
  IonButton,
  IonIcon,
  IonModal,
  toastController
} from '@ionic/vue'
import { computed, onMounted, ref, watch } from 'vue'
import {
  personAddOutline,
  personCircleOutline,
  callOutline,
  mailOutline,
  heartOutline,
  createOutline,
  trashOutline,
  closeOutline,
  peopleOutline,
  searchOutline,
  chevronBackOutline,
  chevronForwardOutline,
  receiptOutline,
  trophyOutline
} from 'ionicons/icons'
import {
  agregarCliente,
  editarCliente as editarClienteAPI,
  eliminarCliente,
  obtenerClientesConEstado,
  obtenerEstadísticasClientes,
  recargarClientes,
  type Cliente,
  type ClienteConEstado
} from '@/composables/useClientes'

const clientes = ref<ClienteConEstado[]>([])
const cargandoClientes = ref(true)
const mostrarFormulario = ref(false)
const modoEdicion = ref(false)
const clienteEditandoId = ref<string | null>(null)
const busqueda = ref('')
const estadisticas = ref({ totalClientes: 0, clientesRecurrentes: 0, clientesNuevos: 0, totalOrdenes: 0 })
const vistaClientes = ref<'todos' | 'recurrentes' | 'top'>('todos')

const form = ref({
  nombre: '',
  celular: '',
  correo: '',
  codigoPais: '503'
})

const cargarClientes = async () => {
  cargandoClientes.value = true
  try {
    await recargarClientes()                     // fetch real, espera a que la API responda
    clientes.value = obtenerClientesConEstado()   // ahora toma la foto ya con datos
    estadisticas.value = await obtenerEstadísticasClientes()
  } finally {
    cargandoClientes.value = false
  }
}

const clientesFiltrados = computed(() => {
  const q = busqueda.value.trim().toLowerCase()

  let base = clientes.value
  if (vistaClientes.value === 'recurrentes') {
    base = base.filter((cliente) => cliente.esRecurrente)
  } else if (vistaClientes.value === 'top') {
    base = [...base]
      .filter((cliente) => cliente.totalOrdenes > 50)
      .sort((a, b) => b.totalOrdenes - a.totalOrdenes)
  }

  if (!q) return base

  return base.filter((cliente) =>
    cliente.nombre.toLowerCase().includes(q) ||
    cliente.celular.toLowerCase().includes(q) ||
    (cliente.correo ?? '').toLowerCase().includes(q)
  )
})

const setVistaClientes = (vista: 'todos' | 'recurrentes' | 'top') => {
  vistaClientes.value = vista
  if (vista === 'todos') {
    busqueda.value = ''
  }
}

/* Paginación 3 x 3 */
const CLIENTES_POR_PAGINA = 9
const paginaActual = ref(1)

const posicionGlobal = (indiceEnPagina: number) =>
  (paginaActual.value - 1) * CLIENTES_POR_PAGINA + indiceEnPagina

const claseMedalla = (indiceEnPagina: number) => {
  if (vistaClientes.value !== 'top') return ''
  const posicion = posicionGlobal(indiceEnPagina)
  if (posicion === 0) return 'medalla-oro'
  if (posicion === 1) return 'medalla-plata'
  if (posicion === 2) return 'medalla-bronce'
  return ''
}

const emojiMedalla = (indiceEnPagina: number) => {
  const clase = claseMedalla(indiceEnPagina)
  if (clase === 'medalla-oro') return '🥇'
  if (clase === 'medalla-plata') return '🥈'
  if (clase === 'medalla-bronce') return '🥉'
  return ''
}

const totalPaginas = computed(() =>
  Math.max(1, Math.ceil(clientesFiltrados.value.length / CLIENTES_POR_PAGINA))
)

const clientesPagina = computed(() => {
  const inicio = (paginaActual.value - 1) * CLIENTES_POR_PAGINA
  return clientesFiltrados.value.slice(inicio, inicio + CLIENTES_POR_PAGINA)
})

const paginaAnterior = () => {
  if (paginaActual.value > 1) paginaActual.value -= 1
}

const paginaSiguiente = () => {
  if (paginaActual.value < totalPaginas.value) paginaActual.value += 1
}

watch([busqueda, vistaClientes], () => {
  paginaActual.value = 1
})

onMounted(() => {
  cargarClientes()
})

const abrirFormulario = () => {
  modoEdicion.value = false
  clienteEditandoId.value = null
  form.value = {
    nombre: '',
    celular: '',
    correo: '',
    codigoPais: '503'
  }
  mostrarFormulario.value = true
}

const editarCliente = (cliente: ClienteConEstado) => {
  modoEdicion.value = true
  clienteEditandoId.value = cliente.id
  form.value = {
    nombre: cliente.nombre,
    celular: cliente.celular,
    correo: cliente.correo,
    codigoPais: '503'
  }
  mostrarFormulario.value = true
}

const cerrarFormulario = () => {
  mostrarFormulario.value = false
}

const totalClientesTop = computed(() =>
  clientes.value.filter((cliente) => cliente.totalOrdenes >= 50).length
)

const mostrarToast = async (mensaje: string, color: 'success' | 'danger' = 'success') => {
  const toast = await toastController.create({
    message: mensaje,
    duration: 2000,
    color
  })
  await toast.present()
}

const guardarCliente = async () => {
  try {
    const codigoPais = form.value.codigoPais.replace(/\D/g, '')
    const celular = form.value.celular.replace(/\D/g, '')
    const payload = {
      nombre: form.value.nombre.trim(),
      celular: celular.startsWith(codigoPais) ? celular : `${codigoPais}${celular}`,
      correo: form.value.correo.trim()
    }

    if (!payload.nombre || !payload.celular) {
      throw new Error('Nombre y celular son obligatorios.')
    }

    if (modoEdicion.value && clienteEditandoId.value) {
      editarClienteAPI(clienteEditandoId.value, payload)
      await mostrarToast('Cliente actualizado correctamente', 'success')
    } else {
      agregarCliente(payload)
      await mostrarToast('Cliente agregado correctamente', 'success')
    }

    await cargarClientes()
    cerrarFormulario()
  } catch (error: any) {
    await mostrarToast(error.message || 'No se pudo guardar el cliente', 'danger')
  }
}

const confirmarEliminar = async (cliente: ClienteConEstado) => {
  const ok = window.confirm(`¿Deseas eliminar a ${cliente.nombre}?`)
  if (!ok) return

  try {
    eliminarCliente(cliente.id)
    await cargarClientes()
    await mostrarToast('Cliente eliminado', 'success')
  } catch (error: any) {
    await mostrarToast(error.message || 'No se pudo eliminar', 'danger')
  }
}
</script>

<style scoped>
:deep(body) {
  background: #f5f9fc;
}

.page-content {
  padding: 20px 18px 28px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
}

.eyebrow {
  margin: 0 0 6px;
  color: #6d829c;
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  color: #0a1f38;
  font-size: clamp(1.8rem, 2.5vw, 2.6rem);
  font-weight: 900;
}

h2 {
  margin: 0;
  color: #0a1f38;
  font-size: 1.5rem;
  font-weight: 800;
}

h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #0a1f38;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.stat-card {
  position: relative;
  overflow: hidden;
  border-radius: 18px;
  padding: 16px 18px;
  border: 1px solid transparent;
  width: 100%;
  appearance: none;
  -webkit-appearance: none;
  box-shadow: 0 10px 20px rgba(10, 31, 56, 0.08);
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #ffffff;
  cursor: pointer;
  text-align: left;
  font: inherit;
}

.stat-icon {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.22);
  display: grid;
  place-items: center;
  font-size: 16px;
  margin-bottom: 4px;
}

.stat-total {
  background: linear-gradient(135deg, #123a66 0%, #4fb3e0 100%);
}

.stat-recurrentes {
  background: linear-gradient(135deg, #16a34a 0%, #4ade80 100%);
}

.stat-top {
  background: linear-gradient(135deg, #b8860b 0%, #f5cb5c 100%);
}

.stat-label {
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(255, 255, 255, 0.85);
}

.stat-card strong {
  font-size: 1.7rem;
  font-weight: 900;
}

.stat-card.active {
  transform: translateY(-1px);
  box-shadow: 0 14px 26px rgba(10, 31, 56, 0.14);
  border-color: rgba(255, 255, 255, 0.38);
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #ffffff;
  border: 1px solid rgba(10, 31, 56, 0.10);
  border-radius: 14px;
  padding: 11px 16px;
  color: #4a627e;
  box-shadow: 0 2px 10px rgba(10, 31, 56, 0.04);
}

.search-bar input {
  border: none;
  outline: none;
  flex: 1;
  font-size: 0.96rem;
  background: transparent;
  color: #0a1f38;
}

.clientes-paginado {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.clientes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.clientes-grid-fija {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.paginador {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding-top: 4px;
}

.paginador-btn {
  width: 40px;
  height: 40px;
  border: 1px solid rgba(18, 58, 102, 0.14);
  border-radius: 12px;
  background: #ffffff;
  color: #123a66;
  display: grid;
  place-items: center;
  cursor: pointer;
  font-size: 18px;
  box-shadow: 0 4px 10px rgba(10, 31, 56, 0.06);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.paginador-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 16px rgba(10, 31, 56, 0.10);
}

.paginador-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.paginador-info {
  font-size: 0.86rem;
  font-weight: 700;
  color: #4a627e;
  text-align: center;
}

.paginador-info small {
  display: block;
  font-weight: 600;
  color: #8ba0b8;
  font-size: 0.76rem;
}

.cliente-card {
  position: relative;
  background: #ffffff;
  border: 1px solid rgba(10, 31, 56, 0.08);
  border-left: 5px solid #4fb3e0;
  border-radius: 18px;
  padding: 18px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 4px 12px rgba(10, 31, 56, 0.08);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.cliente-card:hover {
  box-shadow: 0 8px 20px rgba(10, 31, 56, 0.12);
  transform: translateY(-2px);
}

.acento-0 { border-left-color: #4fb3e0; }
.acento-1 { border-left-color: #16a34a; }
.acento-2 { border-left-color: #d97706; }
.acento-3 { border-left-color: #7c3aed; }

.medalla-badge {
  position: absolute;
  top: -10px;
  right: 14px;
  font-size: 1.6rem;
  filter: drop-shadow(0 3px 6px rgba(10, 31, 56, 0.18));
}

.medalla-oro {
  border-left-color: #d4af37;
  background: linear-gradient(180deg, rgba(255, 215, 0, 0.10) 0%, rgba(255, 255, 255, 0.98) 60%);
  box-shadow: 0 6px 18px rgba(212, 175, 55, 0.22);
}

.medalla-plata {
  border-left-color: #a8a9ad;
  background: linear-gradient(180deg, rgba(192, 192, 192, 0.12) 0%, rgba(255, 255, 255, 0.98) 60%);
  box-shadow: 0 6px 18px rgba(160, 160, 160, 0.20);
}

.medalla-bronce {
  border-left-color: #cd7f32;
  background: linear-gradient(180deg, rgba(205, 127, 50, 0.12) 0%, rgba(255, 255, 255, 0.98) 60%);
  box-shadow: 0 6px 18px rgba(205, 127, 50, 0.20);
}

.cliente-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.cliente-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, #123a66 0%, #4fb3e0 100%);
  display: grid;
  place-items: center;
  color: #ffffff;
  font-size: 1.8rem;
  flex-shrink: 0;
  box-shadow: 0 6px 14px rgba(18, 58, 102, 0.25);
}

.cliente-info-head {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.badge-recurrente {
  display: inline-block;
  padding: 4px 10px;
  background: rgba(34, 197, 94, 0.14);
  color: #15803d;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  width: fit-content;
}

.cliente-detalles {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detalle-fila {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #4a627e;
  font-size: 0.9rem;
  min-width: 0;
}

.detalle-fila ion-icon {
  color: #123a66;
  font-size: 1rem;
}

.detalle-fila span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detalle-ordenes strong {
  color: #123a66;
  font-weight: 900;
}

.cliente-acciones {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
  margin-top: auto;
}

.btn-icon {
  --color: #123a66;
  --padding-start: 8px;
  --padding-end: 8px;
  --padding-top: 8px;
  --padding-bottom: 8px;
}

.btn-icon.danger {
  --color: #b91c1c;
}

.empty-state {
  background: linear-gradient(180deg, rgba(79, 179, 224, 0.06) 0%, rgba(255, 255, 255, 0.8) 100%);
  border: 1.5px dashed rgba(18, 58, 102, 0.18);
  border-radius: 20px;
  padding: 28px 18px;
  text-align: center;
  color: #4a627e;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.empty-state ion-icon {
  font-size: 3rem;
  color: #4fb3e0;
}

.empty-state h3 {
  margin: 0;
}

.empty-state p {
  margin: 0;
  font-size: 0.95rem;
}

.btn-primario {
  --background: linear-gradient(135deg, #123a66, #4fb3e0);
  --background-hover: #0d2b4e;
  --color: #f5f9fc;
  --border-radius: 12px;
  font-weight: 700;
}

.btn-fantasma {
  --background: transparent;
  --color: #123a66;
  --border-radius: 12px;
  --border-width: 1px;
  --border-style: solid;
  --border-color: rgba(18, 58, 102, 0.25);
  font-weight: 700;
}

.modal-content {
  background: #ffffff;
  padding: 20px 18px 18px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.modal-clientes {
  --height: fit-content;
  --min-height: 0;
  --max-height: 90vh;
  --width: min(92vw, 520px);
  --border-radius: 18px;
}

.modal-clientes::part(content) {
  height: fit-content;
  min-height: 0;
  max-height: 90vh;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.modal-close {
  border: none;
  background: none;
  color: #7c8fa6;
  font-size: 1.6rem;
  cursor: pointer;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 0.82rem;
  font-weight: 800;
  color: #4a627e;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

input,
select {
  border: 1.5px solid rgba(10, 31, 56, 0.12);
  background: #f8fbff;
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 0.96rem;
  color: #0a1f38;
  font-family: inherit;
}

input:focus,
select:focus {
  outline: 2px solid rgba(18, 58, 102, 0.16);
  border-color: rgba(18, 58, 102, 0.25);
}

.telefono-row {
  display: flex;
  gap: 8px;
}

.select-codigo,
.input-codigo {
  width: 100px;
  flex-shrink: 0;
}

.telefono-row input {
  flex: 1;
}

.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}

.modal-actions ion-button {
  flex: 1;
}

@media (max-width: 560px) {
  .page-content {
    padding: 16px 12px 20px;
  }

  .header-row {
    align-items: flex-start;
  }

  .stats-row {
    gap: 8px;
  }

  .stat-card {
    padding: 12px 12px 13px;
    border-radius: 14px;
  }

  .stat-icon {
    width: 26px;
    height: 26px;
    font-size: 14px;
  }

  .stat-label {
    font-size: 0.6rem;
  }

  .stat-card strong {
    font-size: 1.1rem;
  }

  .clientes-grid,
  .clientes-grid-fija {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .cliente-card {
    padding: 14px 12px;
    border-radius: 16px;
    gap: 10px;
  }

  .cliente-header {
    gap: 10px;
  }

  .cliente-avatar {
    width: 44px;
    height: 44px;
    font-size: 1.45rem;
  }

  .cliente-info-head h3 {
    font-size: 0.9rem;
  }

  .badge-recurrente {
    padding: 3px 8px;
    font-size: 0.62rem;
  }

  .detalle-fila {
    font-size: 0.76rem;
    gap: 6px;
  }

  .cliente-acciones {
    justify-content: stretch;
  }

  .cliente-acciones .btn-icon {
    flex: 1;
  }

  .paginador {
    gap: 10px;
  }

  .paginador-info {
    font-size: 0.78rem;
  }

  .medalla-badge {
    font-size: 1.3rem;
    top: -8px;
    right: 10px;
  }
}

.loading-state {
  background: linear-gradient(180deg, rgba(79, 179, 224, 0.06) 0%, rgba(255, 255, 255, 0.8) 100%);
  border: 1.5px dashed rgba(18, 58, 102, 0.18);
  border-radius: 20px;
  padding: 28px 18px;
  text-align: center;
  color: #4a627e;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
}

.loading-state p {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
}

.spinner {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 4px solid rgba(18, 58, 102, 0.12);
  border-top-color: #123a66;
  animation: girar-spinner 0.8s linear infinite;
}

@keyframes girar-spinner {
  to {
    transform: rotate(360deg);
  }
}
</style>