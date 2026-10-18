<template>
  <AppShell>
    <div class="page-content">
      <div class="header-row">
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

      <div v-if="vistaClientes !== 'top'" class="search-bar">
        <ion-icon :icon="searchOutline" />
        <input v-model="busqueda" type="text" placeholder="Buscar cliente..." />
      </div>

      <div v-if="cargandoClientes" class="loading-state">
        <div class="spinner"></div>
        <p>Cargando clientes...</p>
      </div>

      <div v-else-if="clientesFiltrados.length" class="clientes-paginado">
        <section v-if="vistaClientes === 'top'" class="top-escenario" aria-labelledby="titulo-top-clientes">
          <div class="top-confeti" aria-hidden="true">
            <span
              v-for="pieza in confetiPodio"
              :key="pieza.left"
              class="top-confeti-pieza"
              :style="{
                left: pieza.left,
                '--confeti-retardo': pieza.delay,
                '--confeti-duracion': pieza.duration,
                '--confeti-deriva': pieza.drift,
                '--confeti-rotacion': pieza.rotation,
                '--confeti-color': pieza.color
              }"
            />
          </div>
          <header class="top-escenario-header">
            <div class="top-escenario-icon"><ion-icon :icon="trophyOutline" /></div>
            <div>
              <p>Reconocimiento a la fidelidad</p>
              <h2 id="titulo-top-clientes">Clientes destacados</h2>
              <span>El podio de quienes más órdenes han realizado</span>
            </div>
          </header>

          <div class="top-podio">
            <article
              v-for="item in clientesPodioOrdenados"
              :key="item.cliente.id"
              class="top-podio-item"
              :class="`puesto-${item.puesto}`"
            >
              <span class="top-podio-medalla" aria-hidden="true">
                {{ item.puesto === 1 ? '🥇' : item.puesto === 2 ? '🥈' : '🥉' }}
              </span>
              <div class="top-podio-avatar"><ion-icon :icon="personCircleOutline" /></div>
              <h3>{{ item.cliente.nombre }}</h3>
              <span class="top-podio-rango">
                {{ item.puesto === 1 ? 'Primer lugar' : item.puesto === 2 ? 'Segundo lugar' : 'Tercer lugar' }}
              </span>
              <strong>{{ item.cliente.totalOrdenes }} órdenes</strong>
              <span class="top-cliente-desde">Cliente desde {{ formatearFechaCliente(item.cliente.fechaRegistro) }}</span>
              <div class="top-podio-base" aria-hidden="true">{{ item.puesto }}</div>
            </article>
          </div>
        </section>

        <h2 v-if="vistaClientes === 'top' && clientesTarjetasPagina.length" class="top-resto-titulo">
          Otros clientes destacados
        </h2>

        <div class="clientes-grid clientes-grid-fija">
          <div
            v-for="(cliente, indice) in clientesTarjetasPagina"
            :key="cliente.id"
            class="cliente-card"
            :class="[`acento-${indice % 4}`, vistaClientes === 'top' ? 'cliente-card-top' : claseMedalla(indice)]"
          >
            <span v-if="vistaClientes !== 'top' && claseMedalla(indice)" class="medalla-badge">
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

            <div v-if="vistaClientes !== 'top'" class="cliente-contacto">
              <div class="detalle-fila">
                <ion-icon :icon="callOutline" />
                <span>{{ cliente.celular }}</span>
              </div>
              <div class="detalle-fila">
                <ion-icon :icon="mailOutline" />
                <span>{{ cliente.correo || 'Sin correo' }}</span>
              </div>
            </div>

            <div class="cliente-resumen">
              <div class="cliente-ordenes-resumen">
                <span class="resumen-label">ÓRDENES</span>
                <strong>{{ cliente.totalOrdenes }}</strong>
              </div>
              <div class="cliente-desde-resumen">
                <span class="resumen-label">CLIENTE DESDE</span>
                <strong>{{ formatearFechaCliente(cliente.fechaRegistro) }}</strong>
              </div>
            </div>

            <div v-if="vistaClientes !== 'top'" class="cliente-acciones">
              <ion-button
                fill="clear"
                class="btn-icon"
                :aria-label="`Ajustar órdenes de ${cliente.nombre}`"
                title="Ajustar contador de órdenes"
                @click="abrirAjusteOrdenes(cliente)"
              >
                <ion-icon :icon="receiptOutline" />
              </ion-button>
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
        <h3>{{ vistaClientes === 'top' ? 'Aún no hay clientes destacados' : 'No hay clientes registrados' }}</h3>
        <p>
          {{ vistaClientes === 'top'
            ? 'Los clientes aparecerán aquí al superar las 50 órdenes.'
            : 'Agrega el primer cliente desde aquí o guárdalo desde un pedido.' }}
        </p>
      </div>
    </div>

    <ion-modal
      class="modal-clientes"
      :is-open="mostrarFormulario"
      @didDismiss="cerrarFormulario"
    >
      <div class="modal-content">
        <div class="modal-header">
          <div>
            <p class="eyebrow">{{ modoEdicion ? 'Editar cliente' : 'Nuevo cliente' }}</p>
            <h2>{{ modoEdicion ? 'Actualizar perfil' : 'Registrar cliente' }}</h2>
            <p class="modal-descripcion">
              {{ modoEdicion ? 'Actualiza la información de contacto del cliente.' : 'Completa los datos para agregar un cliente a tu lista.' }}
            </p>
          </div>
          <button type="button" class="modal-close" aria-label="Cerrar formulario" @click="cerrarFormulario">
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

    <ion-modal
      class="modal-clientes modal-contador-ordenes"
      :is-open="Boolean(clienteContadorSeleccionado)"
      @didDismiss="cerrarAjusteOrdenes"
    >
      <div class="modal-content">
        <div class="modal-header">
          <div>
            <p class="eyebrow">Contador de órdenes</p>
            <h2>{{ clienteContadorSeleccionado?.nombre }}</h2>
          </div>
          <button type="button" class="modal-close" aria-label="Cerrar" @click="cerrarAjusteOrdenes">
            <ion-icon :icon="closeOutline" />
          </button>
        </div>

        <label class="contador-label" for="contador-ordenes-cliente">Total de órdenes</label>
        <input
          id="contador-ordenes-cliente"
          v-model.number="totalOrdenesBorrador"
          type="number"
          min="0"
          max="2147483647"
          step="1"
          inputmode="numeric"
        />

        <div class="contador-ajustes-rapidos">
          <button type="button" @click="sumarOrdenes(1)">+1 orden</button>
          <button type="button" @click="sumarOrdenes(5)">+5 órdenes</button>
          <button type="button" class="contador-reiniciar" @click="reiniciarOrdenes">Reiniciar a 0</button>
        </div>

        <div class="modal-actions">
          <ion-button class="btn-fantasma" :disabled="guardandoContador" @click="cerrarAjusteOrdenes">Cancelar</ion-button>
          <ion-button class="btn-primario" :disabled="guardandoContador" @click="guardarAjusteOrdenes">
            {{ guardandoContador ? 'Guardando...' : 'Guardar contador' }}
          </ion-button>
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
  actualizarTotalOrdenesCliente,
  obtenerClientesConEstado,
  obtenerEstadísticasClientes,
  recargarClientes,
  type Cliente,
  type ClienteConEstado
} from '@/composables/useClientes'
import { formatearFechaCentroamerica } from '@/composables/useFechas'

const clientes = ref<ClienteConEstado[]>([])
const cargandoClientes = ref(true)
const mostrarFormulario = ref(false)
const modoEdicion = ref(false)
const clienteEditandoId = ref<string | null>(null)
const busqueda = ref('')
const estadisticas = ref({ totalClientes: 0, clientesRecurrentes: 0, clientesNuevos: 0, totalOrdenes: 0 })
const vistaClientes = ref<'todos' | 'recurrentes' | 'top'>('todos')
const clienteContadorSeleccionado = ref<ClienteConEstado | null>(null)
const totalOrdenesBorrador = ref(0)
const guardandoContador = ref(false)
const coloresConfeti = ['#e7b83f', '#f0784b', '#4fb3e0', '#7aa86b', '#c77bd1'] as const
const confetiPodio = Array.from({ length: 28 }, (_, indice) => ({
  left: `${(indice * 37 + 11) % 100}%`,
  delay: `${-((indice * 13) % 70) / 10}s`,
  duration: `${6 + (indice % 5) * 0.8}s`,
  drift: `${(indice % 2 === 0 ? 1 : -1) * (18 + (indice % 4) * 8)}px`,
  rotation: `${(indice % 2 === 0 ? 1 : -1) * (180 + (indice % 5) * 90)}deg`,
  color: coloresConfeti[indice % coloresConfeti.length]
}))
const formatearFechaCliente = (fecha: string | null) =>
  formatearFechaCentroamerica(fecha, { day: '2-digit', month: 'short', year: 'numeric' })

const form = ref({
  nombre: '',
  celular: '',
  correo: '',
  codigoPais: '503'
})

const cargarClientes = async () => {
  cargandoClientes.value = true
  try {
    // Ejecutar ambas llamadas en paralelo para mejorar velocidad
    await Promise.all([
      recargarClientes(),
      obtenerEstadísticasClientes().then(stats => estadisticas.value = stats)
    ])
    clientes.value = obtenerClientesConEstado()
  } finally {
    cargandoClientes.value = false
  }
}

const clientesFiltrados = computed(() => {
  let base = [...clientes.value]
  if (vistaClientes.value === 'recurrentes') {
    base = base
      .filter((cliente) => cliente.esRecurrente)
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }))
  } else if (vistaClientes.value === 'top') {
    base = base
      .filter((cliente) => cliente.totalOrdenes > 50)
      .sort((a, b) =>
        b.totalOrdenes - a.totalOrdenes ||
        a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
      )
  } else {
    base.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }))
  }

  if (vistaClientes.value === 'top') return base.slice(0, 6)

  const q = busqueda.value.trim().toLowerCase()
  const filtrados = q
    ? base.filter((cliente) =>
        cliente.nombre.toLowerCase().includes(q) ||
        cliente.celular.toLowerCase().includes(q) ||
        (cliente.correo ?? '').toLowerCase().includes(q)
      )
    : base

  return filtrados
})

const setVistaClientes = (vista: 'todos' | 'recurrentes' | 'top') => {
  vistaClientes.value = vista
  busqueda.value = ''
}

/* Paginación de 5 columnas por 8 filas */
const CLIENTES_POR_PAGINA = 40
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

const clientesPodioOrdenados = computed(() => {
  const destacados = clientesFiltrados.value.slice(0, 3)
  return [
    { cliente: destacados[1], puesto: 2 },
    { cliente: destacados[0], puesto: 1 },
    { cliente: destacados[2], puesto: 3 }
  ].filter((item): item is { cliente: ClienteConEstado; puesto: number } => Boolean(item.cliente))
})

const clientesTarjetasPagina = computed(() =>
  vistaClientes.value === 'top' ? clientesPagina.value.slice(3) : clientesPagina.value
)

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

const abrirAjusteOrdenes = (cliente: ClienteConEstado) => {
  clienteContadorSeleccionado.value = cliente
  totalOrdenesBorrador.value = cliente.totalOrdenes
}

const cerrarAjusteOrdenes = () => {
  if (guardandoContador.value) return
  clienteContadorSeleccionado.value = null
}

const sumarOrdenes = (cantidad: number) => {
  totalOrdenesBorrador.value = Math.min(
    2147483647,
    Math.max(0, Math.floor(Number(totalOrdenesBorrador.value) || 0) + cantidad)
  )
}

const reiniciarOrdenes = () => {
  totalOrdenesBorrador.value = 0
}

const totalClientesTop = computed(() =>
  clientes.value.filter((cliente) => cliente.totalOrdenes > 50).length
)

const mostrarToast = async (mensaje: string, color: 'success' | 'danger' = 'success') => {
  const toast = await toastController.create({
    message: mensaje,
    duration: 2000,
    color
  })
  await toast.present()
}

const guardarAjusteOrdenes = async () => {
  const cliente = clienteContadorSeleccionado.value
  const total = totalOrdenesBorrador.value
  if (!cliente) return

  if (!Number.isSafeInteger(total) || total < 0 || total > 2147483647) {
    await mostrarToast('Ingresa un número entero entre 0 y 2147483647.', 'danger')
    return
  }

  guardandoContador.value = true
  try {
    await actualizarTotalOrdenesCliente(cliente.id, total)
    await cargarClientes()
    clienteContadorSeleccionado.value = null
    await mostrarToast(`Contador actualizado: ${total} ${total === 1 ? 'orden' : 'órdenes'}.`)
  } catch (error: unknown) {
    await mostrarToast(error instanceof Error ? error.message : 'No se pudo actualizar el contador.', 'danger')
  } finally {
    guardandoContador.value = false
  }
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
      await editarClienteAPI(clienteEditandoId.value, payload)
      await mostrarToast('Cliente actualizado correctamente', 'success')
    } else {
      await agregarCliente(payload)
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
  gap: 11px;
}

.stat-card {
  --stat-accent: #315f8d;
  --stat-tint: #e4eef8;
  position: relative;
  overflow: hidden;
  min-height: 108px;
  border-radius: 14px;
  padding: 13px 15px;
  border: 1px solid color-mix(in srgb, var(--stat-accent) 25%, #ffffff);
  width: 100%;
  appearance: none;
  -webkit-appearance: none;
  box-shadow: 0 6px 16px color-mix(in srgb, var(--stat-accent) 12%, transparent), inset 0 1px 0 rgba(255, 255, 255, 0.85);
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
  grid-template-rows: auto 1fr;
  align-items: center;
  column-gap: 10px;
  row-gap: 6px;
  color: #123a66;
  cursor: pointer;
  text-align: left;
  font: inherit;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.stat-icon {
  grid-column: 1;
  grid-row: 1 / span 2;
  width: 38px;
  height: 38px;
  border: 1px solid color-mix(in srgb, var(--stat-accent) 22%, #ffffff);
  border-radius: 11px;
  background: color-mix(in srgb, var(--stat-tint) 78%, #ffffff);
  color: var(--stat-accent);
  display: grid;
  place-items: center;
  font-size: 18px;
}

.stat-label {
  grid-column: 2;
  grid-row: 1;
  align-self: end;
  color: #687f96;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.055em;
}

.stat-card strong {
  grid-column: 2;
  grid-row: 2;
  align-self: start;
  color: var(--stat-accent);
  font-size: 1.75rem;
  line-height: 1;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
}

.stat-total {
  --stat-accent: #1d5ca8;
  --stat-tint: #cfe4ff;
  background: linear-gradient(145deg, #e4f1ff 0%, #bfdcff 100%);
}

.stat-recurrentes {
  --stat-accent: #168052;
  --stat-tint: #c8f0d9;
  background: linear-gradient(145deg, #e2f9eb 0%, #c0ebd1 100%);
}

.stat-top {
  --stat-accent: #a76508;
  --stat-tint: #ffe4a8;
  background: linear-gradient(145deg, #fff5d9 0%, #ffe3a2 100%);
}

.stat-card.active {
  transform: translateY(-2px);
  border-color: var(--stat-accent);
  background: linear-gradient(145deg, color-mix(in srgb, var(--stat-tint) 82%, #ffffff) 0%, var(--stat-tint) 100%);
  box-shadow: 0 9px 22px color-mix(in srgb, var(--stat-accent) 20%, transparent), inset 0 1px 0 #ffffff;
}

.stat-card:focus-visible {
  outline: 3px solid rgba(79, 179, 224, 0.35);
  outline-offset: 2px;
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
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.top-escenario {
  position: relative;
  overflow: hidden;
  padding: 24px 24px 20px;
  border: 1px solid rgba(167, 101, 8, 0.18);
  border-radius: 24px;
  background:
    radial-gradient(ellipse at 50% 100%, rgba(255, 211, 112, 0.48), transparent 58%),
    linear-gradient(145deg, #fffdf6 0%, #fff5d9 52%, #f6e6bd 100%);
  box-shadow: 0 14px 32px rgba(139, 94, 22, 0.12), inset 0 1px 0 #ffffff;
}

.top-escenario::before,
.top-escenario::after {
  position: absolute;
  top: 32px;
  color: rgba(167, 101, 8, 0.16);
  font-size: 1.3rem;
  content: '✦';
}

.top-escenario::before {
  left: 34%;
}

.top-escenario::after {
  right: 10%;
  top: 78px;
  font-size: 0.95rem;
}

.top-confeti {
  position: absolute;
  z-index: 0;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.top-confeti-pieza {
  position: absolute;
  top: -12px;
  width: 6px;
  height: 10px;
  border-radius: 1px;
  background: var(--confeti-color);
  opacity: 0.72;
  animation: caer-confeti var(--confeti-duracion) linear var(--confeti-retardo) infinite;
}

.top-escenario-header {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 13px;
  padding-bottom: 18px;
  border-bottom: 1px solid rgba(167, 101, 8, 0.14);
  animation: entrada-encabezado-podio 500ms ease-out both;
}

.top-escenario-icon {
  display: grid;
  flex: 0 0 46px;
  width: 46px;
  height: 46px;
  place-items: center;
  border: 1px solid rgba(167, 101, 8, 0.2);
  border-radius: 15px;
  background: linear-gradient(145deg, #fff0bd, #f7d775);
  color: #9a6700;
  font-size: 23px;
  box-shadow: 0 5px 12px rgba(139, 94, 22, 0.14);
}

.top-escenario-header p,
.top-escenario-header h2,
.top-escenario-header span {
  margin: 0;
}

.top-escenario-header p {
  margin-bottom: 3px;
  color: #a16b12;
  font-size: 0.65rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.top-escenario-header h2 {
  color: #48320b;
  font-size: 1.25rem;
  font-weight: 900;
}

.top-escenario-header span {
  display: block;
  margin-top: 3px;
  color: #816b43;
  font-size: 0.78rem;
}

.top-podio {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: end;
  gap: 14px;
  max-width: 900px;
  margin: 22px auto 0;
}

.top-podio-item {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  padding: 17px 12px 0;
  border: 1px solid rgba(122, 89, 36, 0.14);
  border-radius: 20px 20px 8px 8px;
  background: rgba(255, 255, 255, 0.86);
  text-align: center;
  box-shadow: 0 8px 22px rgba(92, 65, 22, 0.1);
  animation: elevar-podio 650ms cubic-bezier(0.2, 0.75, 0.25, 1) both;
}

.top-podio-item.puesto-1 {
  animation-delay: 180ms;
}

.top-podio-item.puesto-2 {
  animation-delay: 80ms;
}

.top-podio-item.puesto-3 {
  animation-delay: 300ms;
}

.top-podio-item.puesto-1 {
  border-color: rgba(201, 147, 30, 0.4);
  background: linear-gradient(180deg, #fffdf6, #fff8e8);
  box-shadow: 0 12px 26px rgba(150, 106, 14, 0.17);
}

.top-podio-item.puesto-2 {
  margin-bottom: 0;
}

.top-podio-medalla {
  margin-bottom: 2px;
  font-size: 1.8rem;
  filter: drop-shadow(0 3px 4px rgba(82, 56, 11, 0.18));
  animation: destello-medalla 900ms 500ms cubic-bezier(0.2, 0.75, 0.25, 1) both;
}

.top-podio-item.puesto-1 .top-podio-medalla {
  animation-delay: 620ms;
}

.top-podio-item.puesto-2 .top-podio-medalla {
  animation-delay: 520ms;
}

.top-podio-item.puesto-3 .top-podio-medalla {
  animation-delay: 740ms;
}

.top-podio-avatar {
  display: grid;
  width: 54px;
  height: 54px;
  place-items: center;
  border: 3px solid #ffffff;
  border-radius: 50%;
  background: linear-gradient(145deg, #123a66, #4fb3e0);
  color: white;
  font-size: 2rem;
  box-shadow: 0 0 0 2px rgba(202, 159, 65, 0.45), 0 5px 12px rgba(10, 31, 56, 0.14);
}

.puesto-2 .top-podio-avatar {
  box-shadow: 0 0 0 2px rgba(148, 163, 184, 0.55), 0 5px 12px rgba(10, 31, 56, 0.14);
}

.puesto-3 .top-podio-avatar {
  box-shadow: 0 0 0 2px rgba(190, 119, 58, 0.5), 0 5px 12px rgba(10, 31, 56, 0.14);
}

.top-podio-item h3 {
  width: 100%;
  overflow: hidden;
  margin: 10px 0 3px;
  color: #173858;
  font-size: 0.95rem;
  font-weight: 850;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.top-podio-rango {
  color: #718198;
  font-size: 0.7rem;
  font-weight: 750;
}

.top-podio-item > strong {
  margin-top: 7px;
  color: #94620b;
  font-size: 1.05rem;
  font-variant-numeric: tabular-nums;
}

.top-cliente-desde {
  display: block;
  margin-top: 7px;
  color: #816b43;
  font-size: 0.72rem;
  font-weight: 700;
}

.top-cliente-desde-card {
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid rgba(167, 101, 8, 0.14);
}

.top-podio-base {
  display: grid;
  width: calc(100% + 24px);
  height: 42px;
  margin-top: 4px;
  place-items: center;
  border-radius: 8px 8px 0 0;
  background: linear-gradient(180deg, #d9dce1, #b9bec6);
  color: rgba(44, 54, 65, 0.65);
  font-size: 1.2rem;
  font-weight: 900;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

@keyframes entrada-encabezado-podio {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes elevar-podio {
  from {
    opacity: 0;
    transform: translateY(28px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes destello-medalla {
  0% {
    opacity: 0;
    transform: translateY(10px) scale(0.55) rotate(-14deg);
  }
  65% {
    opacity: 1;
    transform: translateY(-4px) scale(1.2) rotate(5deg);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1) rotate(0);
  }
}

@keyframes caer-confeti {
  to {
    top: calc(100% + 12px);
    transform: translateX(var(--confeti-deriva)) rotate(var(--confeti-rotacion));
  }
}

.puesto-1 .top-podio-base {
  height: 66px;
  background: linear-gradient(180deg, #f0d27b, #d2a638);
  color: rgba(92, 61, 0, 0.72);
}

.puesto-3 .top-podio-base {
  height: 32px;
  background: linear-gradient(180deg, #dda16b, #bb7540);
  color: rgba(91, 48, 19, 0.72);
}

@media (prefers-reduced-motion: reduce) {
  .top-escenario-header,
  .top-podio-item,
  .top-podio-medalla {
    animation: none;
  }

  .top-confeti {
    display: none;
  }
}

.top-resto-titulo {
  margin: 2px 0 -4px;
  color: #31516e;
  font-size: 1rem;
  font-weight: 850;
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
  --card-accent: #4fb3e0;
  --card-tint: #f1faff;
  position: relative;
  overflow: hidden;
  min-width: 0;
  background: #ffffff;
  border: 1px solid rgba(10, 31, 56, 0.09);
  border-radius: 17px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 11px;
  box-shadow: 0 5px 15px rgba(10, 31, 56, 0.055);
  transition: box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
}

.cliente-card::before {
  position: absolute;
  inset: 0 0 auto;
  height: 4px;
  background: var(--card-accent);
  content: '';
}

.cliente-card:hover {
  border-color: color-mix(in srgb, var(--card-accent) 36%, #dce5ec);
  box-shadow: 0 11px 24px rgba(10, 31, 56, 0.11);
  transform: translateY(-2px);
}

.acento-0 { --card-accent: #2583bd; --card-tint: #eaf6ff; }
.acento-1 { --card-accent: #168052; --card-tint: #eaf8ef; }
.acento-2 { --card-accent: #c57612; --card-tint: #fff5e5; }
.acento-3 { --card-accent: #7652b8; --card-tint: #f3efff; }

.medalla-badge {
  position: absolute;
  top: -10px;
  right: 14px;
  font-size: 1.6rem;
  filter: drop-shadow(0 3px 6px rgba(10, 31, 56, 0.18));
}

.medalla-oro {
  --card-accent: #c79a24;
  --card-tint: #fff8e5;
  background: linear-gradient(180deg, rgba(255, 215, 0, 0.10) 0%, rgba(255, 255, 255, 0.98) 60%);
  box-shadow: 0 6px 18px rgba(212, 175, 55, 0.22);
}

.medalla-plata {
  --card-accent: #8c98a5;
  --card-tint: #f0f3f6;
  background: linear-gradient(180deg, rgba(192, 192, 192, 0.12) 0%, rgba(255, 255, 255, 0.98) 60%);
  box-shadow: 0 6px 18px rgba(160, 160, 160, 0.20);
}

.medalla-bronce {
  --card-accent: #b9783e;
  --card-tint: #fff1e5;
  background: linear-gradient(180deg, rgba(205, 127, 50, 0.12) 0%, rgba(255, 255, 255, 0.98) 60%);
  box-shadow: 0 6px 18px rgba(205, 127, 50, 0.20);
}

.cliente-header {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 48px;
  padding-top: 3px;
}

.cliente-avatar {
  width: 42px;
  height: 42px;
  border-radius: 13px;
  background: linear-gradient(145deg, color-mix(in srgb, var(--card-accent) 88%, #123a66), var(--card-accent));
  display: grid;
  place-items: center;
  color: #ffffff;
  font-size: 1.55rem;
  flex-shrink: 0;
  box-shadow: 0 4px 10px color-mix(in srgb, var(--card-accent) 24%, transparent);
}

.cliente-info-head {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
}

.cliente-info-head h3 {
  width: 100%;
  overflow: hidden;
  margin: 0;
  color: #173858;
  font-size: 0.9rem;
  font-weight: 850;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.badge-recurrente {
  display: inline-flex;
  align-items: center;
  padding: 3px 7px;
  background: #e8f7ee;
  color: #18784a;
  border-radius: 999px;
  font-size: 0.58rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  width: fit-content;
}

.cliente-contacto {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 7px;
  min-width: 0;
  padding: 9px 0;
  border-top: 1px solid #edf1f5;
  border-bottom: 1px solid #edf1f5;
}

.detalle-fila {
  display: flex;
  align-items: center;
  gap: 7px;
  min-height: 19px;
  color: #50677f;
  font-size: 0.72rem;
  min-width: 0;
}

.detalle-fila ion-icon {
  color: var(--card-accent);
  font-size: 0.88rem;
  flex: 0 0 auto;
}

.detalle-fila span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cliente-resumen {
  display: grid;
  grid-template-columns: minmax(52px, auto) minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  min-height: 45px;
  margin-top: auto;
}

.cliente-ordenes-resumen,
.cliente-desde-resumen {
  display: grid;
  min-width: 0;
  gap: 3px;
}

.cliente-ordenes-resumen {
  justify-items: center;
  padding: 6px 8px;
  border-radius: 10px;
  background: var(--card-tint);
}

.resumen-label {
  color: #8392a3;
  font-size: 0.52rem;
  font-weight: 850;
  letter-spacing: 0.08em;
  white-space: nowrap;
}

.cliente-ordenes-resumen strong {
  color: var(--card-accent);
  font-size: 1.1rem;
  font-weight: 900;
  line-height: 1;
}

.cliente-desde-resumen strong {
  overflow: hidden;
  color: #405a73;
  font-size: 0.66rem;
  font-weight: 750;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cliente-acciones {
  display: flex;
  justify-content: flex-end;
  gap: 5px;
  padding-top: 8px;
  border-top: 1px solid #edf1f5;
}

.btn-icon {
  --color: #45627d;
  --padding-start: 6px;
  --padding-end: 6px;
  --padding-top: 5px;
  --padding-bottom: 5px;
  --border-radius: 9px;
  margin: 0;
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
  background: linear-gradient(180deg, #ffffff 0%, #f8fbfd 100%);
  padding: 26px 24px 22px;
  display: flex;
  flex-direction: column;
  gap: 20px;
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
  overflow: hidden;
  border: 1px solid rgba(18, 58, 102, 0.12);
  box-shadow: 0 24px 70px rgba(10, 31, 56, 0.24);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(18, 58, 102, 0.1);
}

.modal-header > div {
  min-width: 0;
}

.modal-header .eyebrow {
  margin-bottom: 5px;
  color: #168b83;
  font-size: 0.68rem;
  letter-spacing: 0.11em;
}

.modal-header h2 {
  color: #123a66;
  font-size: 1.4rem;
  font-weight: 900;
  line-height: 1.2;
}

.modal-descripcion {
  margin: 6px 0 0;
  color: #718198;
  font-size: 0.82rem;
  line-height: 1.45;
}

.contador-label {
  margin-bottom: -12px;
}

.contador-ajustes-rapidos {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.contador-ajustes-rapidos button {
  min-height: 36px;
  padding: 7px 11px;
  border: 1px solid rgba(18, 58, 102, 0.15);
  border-radius: 10px;
  background: #f1f7fb;
  color: #123a66;
  font: inherit;
  font-size: 0.8rem;
  font-weight: 750;
  cursor: pointer;
}

.contador-ajustes-rapidos button:hover {
  background: #e4f0f7;
}

.contador-ajustes-rapidos .contador-reiniciar {
  border-color: rgba(220, 38, 38, 0.2);
  background: #fff5f5;
  color: #b91c1c;
}

.contador-ajustes-rapidos .contador-reiniciar:hover {
  background: #feecec;
}

.modal-close {
  display: grid;
  flex: 0 0 38px;
  width: 38px;
  height: 38px;
  place-items: center;
  border: 1px solid rgba(18, 58, 102, 0.1);
  border-radius: 50%;
  background: #f2f7fa;
  color: #60788e;
  font-size: 1.3rem;
  cursor: pointer;
  transition: background 0.16s ease, color 0.16s ease, transform 0.16s ease;
}

.modal-close:hover {
  transform: rotate(90deg);
  background: #e3f0f5;
  color: #123a66;
}

.form-grid > label {
  gap: 7px;
  color: #466079;
  font-size: 0.72rem;
  letter-spacing: 0.07em;
}

.form-grid input,
.contador-label + input {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #d9e4ec;
  border-radius: 12px;
  background: #f8fbfd;
  padding: 12px 14px;
  color: #123a66;
  font-size: 0.92rem;
  transition: border-color 0.16s ease, box-shadow 0.16s ease, background 0.16s ease;
}

.form-grid input:focus,
.contador-label + input:focus {
  outline: none;
  border-color: #4fb3e0;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(79, 179, 224, 0.15);
}

.form-grid input::placeholder {
  color: #9aabba;
}

.modal-actions {
  gap: 12px;
  margin-top: 0;
  padding-top: 15px;
  border-top: 1px solid rgba(18, 58, 102, 0.09);
}

.modal-actions ion-button {
  min-height: 44px;
  margin: 0;
  font-size: 0.88rem;
}

.modal-actions .btn-primario {
  --box-shadow: 0 6px 14px rgba(18, 58, 102, 0.2);
}

.modal-actions .btn-fantasma {
  --border-color: #d8e3eb;
  --color: #4a627e;
}

.modal-contador-ordenes .modal-content {
  gap: 16px;
}

.contador-label {
  color: #466079;
  font-size: 0.72rem;
  letter-spacing: 0.07em;
}

.contador-label + input {
  margin-top: -10px;
}

.contador-ajustes-rapidos {
  padding-top: 2px;
}

.contador-ajustes-rapidos button {
  transition: background 0.16s ease, border-color 0.16s ease, transform 0.16s ease;
}

.contador-ajustes-rapidos button:hover {
  transform: translateY(-1px);
  border-color: rgba(18, 58, 102, 0.25);
}

.contador-ajustes-rapidos .contador-reiniciar:hover {
  border-color: rgba(220, 38, 38, 0.35);
}

.modal-close:focus-visible,
.contador-ajustes-rapidos button:focus-visible {
  outline: 3px solid rgba(79, 179, 224, 0.35);
  outline-offset: 2px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
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

  .top-escenario {
    padding: 17px 13px 14px;
    border-radius: 19px;
  }

  .top-escenario-header {
    gap: 10px;
    padding-bottom: 13px;
  }

  .top-escenario-icon {
    flex-basis: 40px;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    font-size: 20px;
  }

  .top-escenario-header h2 {
    font-size: 1.05rem;
  }

  .top-escenario-header span {
    font-size: 0.7rem;
  }

  .top-podio {
    grid-template-columns: minmax(0, 1fr);
    gap: 9px;
    margin-top: 13px;
  }

  .top-podio-item {
    display: grid;
    grid-template-columns: 38px minmax(0, 1fr) auto;
    grid-template-rows: auto auto auto;
    column-gap: 10px;
    padding: 10px 11px;
    border-radius: 14px;
    text-align: left;
  }

  .top-podio-item.puesto-1 {
    order: -1;
  }

  .top-podio-item.puesto-2 {
    order: 0;
  }

  .top-podio-item.puesto-3 {
    order: 1;
  }

  .top-podio-medalla {
    grid-column: 1;
    grid-row: 1;
    justify-self: center;
    margin: 0;
    font-size: 1.3rem;
  }

  .top-podio-avatar {
    grid-column: 1;
    grid-row: 2;
    width: 36px;
    height: 36px;
    font-size: 1.4rem;
  }

  .top-podio-item h3 {
    grid-column: 2;
    grid-row: 1;
    margin: 0;
    font-size: 0.84rem;
  }

  .top-podio-rango {
    grid-column: 2;
    grid-row: 2;
    font-size: 0.67rem;
  }

  .top-podio-item > strong {
    grid-column: 3;
    grid-row: 1 / span 2;
    margin: 0;
    font-size: 0.82rem;
    white-space: nowrap;
  }

  .top-podio-base {
    display: none;
  }

  .top-resto-titulo {
    font-size: 0.92rem;
  }

  .header-row {
    align-items: flex-start;
  }

  .stats-row {
    gap: 8px;
  }

  .stat-card {
    min-height: 82px;
    grid-template-columns: 28px minmax(0, 1fr);
    column-gap: 7px;
    row-gap: 5px;
    padding: 9px 7px;
    border-radius: 12px;
  }

  .stat-icon {
      width: 28px;
      height: 28px;
      border-radius: 9px;
      font-size: 14px;
  }

  .stat-label {
    font-size: 0.56rem;
    letter-spacing: 0.035em;
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

  .modal-content {
    gap: 16px;
    padding: 21px 17px 17px;
  }

  .modal-header h2 {
    font-size: 1.2rem;
  }

  .modal-actions {
    gap: 8px;
  }

  .modal-actions ion-button {
    font-size: 0.78rem;
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