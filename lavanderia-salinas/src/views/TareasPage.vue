<template>
  <AppShell>
    <div class="tareas-page force-light">

      <section class="stats-grid">
        <article class="stat-card amarillo">
          <span>⏳ Pendientes</span>
          <strong>{{ tareasPendientes.length }}</strong>
        </article>
        <article class="stat-card verde">
          <span>✅ Completadas</span>
          <strong>{{ tareasCompletadas.length }}</strong>
        </article>
        <article class="stat-card azul">
          <span>📌 Visibles</span>
          <strong>{{ tareasTotal }}</strong>
        </article>
        <article class="stat-card morado">
          <span>👥 Usuarios activos</span>
          <strong>{{ usuariosActivos.length }}</strong>
        </article>
      </section>

      <section class="layout-grid">
        <div class="panel-main">
          <div class="panel-head">
            <div>
              <p class="panel-kicker">{{ esAdmin ? 'Administrador' : 'Mis tareas' }}</p>
              <h2>{{ esAdmin ? 'Todas las tareas' : 'Asignadas para ti' }}</h2>
            </div>

            <div v-if="esAdmin" class="panel-actions">
              <button class="soft-btn" @click="limpiarCompletadas">
                🧹 Limpiar completadas
              </button>
            </div>
          </div>

          <div v-if="esAdmin" class="filters-row">
            <label class="select-field">
              <span>Filtrar por usuario</span>
              <select v-model="filtroUsuario">
                <option value="todos">Todas</option>
                <option value="mias">Mis tareas</option>
                <option v-for="usuario in usuariosActivos" :key="usuario.id" :value="usuario.id">
                  {{ usuario.nombre }}
                </option>
              </select>
            </label>

            <label class="select-field">
              <span>Estado</span>
              <select v-model="filtroEstado">
                <option value="todas">Todas</option>
                <option value="pendientes">Pendientes</option>
                <option value="completadas">Completadas</option>
              </select>
            </label>
          </div>

          <div class="tareas-workspace" :class="{ 'solo-lista': !esAdmin || !modoCrear }">
            <div v-if="esAdmin && modoCrear" class="creator-card">
              <div class="creator-header">
                <div>
                  <p class="panel-kicker">🌈 Nueva tarea</p>
                </div>
              </div>

              <div class="creator-grid">
                <label class="field">
                  <span>Título</span>
                  <input v-model="formulario.titulo" type="text" placeholder="Ej: Revisar cajas del día" />
                </label>

                <label class="field field-wide">
                  <span>Descripción</span>
                  <textarea
                    v-model="formulario.descripcion"
                    rows="3"
                    placeholder="Escribe un detalle claro y breve..."
                  />
                </label>

                <label class="field">
                  <span>Prioridad</span>
                  <select v-model="formulario.prioridad">
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                  </select>
                </label>

                <label class="field">
                  <span>Asignar a</span>
                  <select v-model="formulario.asignadaAId">
                    <option v-for="usuario in usuariosActivos" :key="usuario.id" :value="usuario.id">
                      {{ usuario.nombre }} · {{ etiquetaRol(usuario.rol) }}
                    </option>
                  </select>
                </label>
              </div>

              <div class="creator-actions">
                <button class="ghost-pill" @click="resetFormulario">Limpiar</button>
                <button class="primary-pill" @click="guardarTarea">Crear tarea</button>
              </div>

              <div class="ordenes-tareas-card">
                <div class="ordenes-tareas-head">
                  <div>
                    <p class="panel-kicker">📦 Órdenes para tareas</p>
                    <h3>{{ totalOrdenesActivas }} órdenes activas</h3>
                  </div>
                  <label class="field ordenes-asignar-select">
                    <span>Asignar estas tareas a</span>
                    <select v-model="asignarOrdenesAId">
                      <option v-for="usuario in usuariosActivos" :key="usuario.id" :value="usuario.id">
                        {{ usuario.nombre }} · {{ etiquetaRol(usuario.rol) }}
                      </option>
                    </select>
                  </label>
                </div>

                <div v-if="ordenesTareaVista.length === 0" class="ordenes-vacio">
                  No hay órdenes activas para convertir en tarea.
                </div>

                <div v-else class="ordenes-check-grid">
                  <label
                    v-for="orden in ordenesTareaVista"
                    :key="orden.id"
                    class="orden-check-item"
                    :class="{ bloqueada: ordenYaAsignada(orden.numero) }"
                  >
                    <input
                      type="checkbox"
                      :checked="ordenesMarcadasIds.includes(orden.id)"
                      :disabled="ordenYaAsignada(orden.numero)"
                      @change="alternarOrdenMarcada(orden.id)"
                    />
                    <span>{{ orden.numero }}</span>
                  </label>
                </div>

                <div class="ordenes-acciones">
                  <button class="ghost-pill" @click="marcarTodasOrdenesVisibles">
                    Marcar visibles
                  </button>
                  <button class="ghost-pill" @click="limpiarOrdenesMarcadas">
                    Limpiar selección
                  </button>
                  <button class="primary-pill" :disabled="!ordenesMarcadasIds.length || guardandoOrdenes" @click="crearTareasDesdeOrdenes">
                    {{ guardandoOrdenes ? 'Creando...' : `Crear ${ordenesMarcadasIds.length} tareas` }}
                  </button>
                </div>
              </div>
            </div>

            <div class="task-list-panel">
              <div class="task-list-head">
                <p class="panel-kicker">📋 Tareas asignadas</p>
                <h3>{{ tareasFiltradas.length }} en lista</h3>
              </div>

              <div class="task-list">
                <article v-if="tareasFiltradas.length === 0" class="empty-state">
                  <span class="empty-emoji">🌿</span>
                  <h3>No hay tareas</h3>
                </article>

                <article
                  v-for="tarea in tareasFiltradas"
                  :key="tarea.id"
                  class="task-card"
                  :class="{ done: tarea.completada }"
                >
                  <div class="task-emoji">{{ tarea.emoji }}</div>

                  <div class="task-content">
                    <div class="task-topline">
                      <div>
                        <div class="task-title-row">
                          <h3>{{ tarea.titulo }}</h3>
                          <span class="priority-badge" :class="tarea.prioridad">
                            {{ etiquetaPrioridad(tarea.prioridad) }}
                          </span>
                        </div>
                        <p class="task-desc">
                          {{ tarea.descripcion || 'Sin descripción, pero con buenas vibras.' }}
                        </p>
                      </div>
                    </div>

                    <div class="task-meta">
                      <span>👤 {{ tarea.asignadaANombre }}</span>
                      <span>🧑‍💻 Creador: {{ tarea.creadaPorNombre }}</span>
                      <span>🕒 {{ formatearFecha(tarea.creadaEn) }}</span>
                    </div>

                    <div v-if="esAdmin" class="assign-row">
                      <label class="assign-select">
                        <span>Reasignar</span>
                        <select
                          :value="tarea.asignadaAId"
                          @change="onReasignar(tarea.id, $event)"
                        >
                          <option v-for="usuario in usuariosActivos" :key="usuario.id" :value="usuario.id">
                            {{ usuario.nombre }}
                          </option>
                        </select>
                      </label>
                    </div>
                  </div>

                  <div class="task-actions">
                    <button
                      class="status-btn"
                      :class="{ active: tarea.completada }"
                      @click="alternar(tarea.id)"
                    >
                      {{ tarea.completada ? '↩️ Reabrir' : '✅ Completar' }}
                    </button>
                    <button v-if="esAdmin" class="delete-btn" @click="confirmarEliminar(tarea.id)">
                      🗑️ Eliminar
                    </button>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { toastController } from '@ionic/vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import { useTareas, type PrioridadTarea } from '@/composables/useTareas'
import { useOrdenes } from '@/composables/useOrdenes'

const router = useRouter()
const irA = (ruta: string) => router.push(ruta).catch(() => {})

const {
  usuarioActual,
  esAdmin,
  tareasVisibles,
  tareasPendientes,
  tareasCompletadas,
  tareasTotal,
  usuariosActivos,
  cargando,
  crearTarea,
  alternarCompletada,
  reasignarTarea,
  eliminarTarea,
  limpiarCompletadas,
  etiquetaPrioridad
} = useTareas()

const { ordenes, cargarOrdenes } = useOrdenes()

const modoCrear = ref(true)
const filtroUsuario = ref('todos')
const filtroEstado = ref<'todas' | 'pendientes' | 'completadas'>('todas')
const guardando = ref(false)
const guardandoOrdenes = ref(false)
const asignarOrdenesAId = ref('')
const ordenesMarcadasIds = ref<string[]>([])

const mostrarToast = async (mensaje: string, color: 'success' | 'danger' = 'danger') => {
  const toast = await toastController.create({
    message: mensaje,
    duration: 2500,
    color,
    position: 'top'
  })
  await toast.present()
}

const formulario = ref({
  titulo: '',
  descripcion: '',
  prioridad: 'media' as PrioridadTarea,
  asignadaAId: ''
})

watch(
  usuariosActivos,
  (usuarios) => {
    if (!formulario.value.asignadaAId && usuarios.length > 0) {
      formulario.value.asignadaAId = usuarios[0].id
    }

    if (!asignarOrdenesAId.value && usuarios.length > 0) {
      asignarOrdenesAId.value = usuarios[0].id
    }
  },
  { immediate: true }
)

onMounted(() => {
  cargarOrdenes().catch(() => {})
})

const tareasFiltradas = computed(() => {
  let lista = tareasVisibles.value

  if (esAdmin.value) {
    if (filtroUsuario.value === 'mias') {
      lista = lista.filter((tarea) => tarea.asignadaAId === usuarioActual.value?.id)
    } else if (filtroUsuario.value !== 'todos') {
      lista = lista.filter((tarea) => tarea.asignadaAId === filtroUsuario.value)
    }

    if (filtroEstado.value === 'pendientes') {
      lista = lista.filter((tarea) => !tarea.completada)
    } else if (filtroEstado.value === 'completadas') {
      lista = lista.filter((tarea) => tarea.completada)
    }
  }

  return lista
})

const resetFormulario = () => {
  formulario.value = {
    titulo: '',
    descripcion: '',
    prioridad: 'media',
    asignadaAId: usuariosActivos.value[0]?.id ?? ''
  }
}

const ORDEN_TAREA_MARCADOR = '[ORDEN:'

const extraerNumeroOrdenDesdeTarea = (descripcion: string) => {
  const inicio = descripcion.indexOf(ORDEN_TAREA_MARCADOR)
  if (inicio < 0) return null

  const segmento = descripcion.slice(inicio)
  const match = segmento.match(/\[ORDEN:([^\]]+)\]/)
  return match?.[1]?.trim() || null
}

const ordenesActivas = computed(() => {
  return [...ordenes.value]
    .filter((orden) => ['pendiente', 'en_proceso', 'listo'].includes(orden.estado))
    .sort((a, b) => b.secuencia - a.secuencia)
})

const ordenesTareaVista = computed(() => ordenesActivas.value.slice(0, 40))
const totalOrdenesActivas = computed(() => ordenesActivas.value.length)

const ordenesYaAsignadasSet = computed(() => {
  const set = new Set<string>()

  for (const tarea of tareasVisibles.value) {
    if (tarea.asignadaAId !== asignarOrdenesAId.value) continue
    const numero = extraerNumeroOrdenDesdeTarea(tarea.descripcion || '')
    if (numero) set.add(numero)
  }

  return set
})

const ordenYaAsignada = (numeroOrden: string) => ordenesYaAsignadasSet.value.has(numeroOrden)

const alternarOrdenMarcada = (ordenId: string) => {
  const indice = ordenesMarcadasIds.value.indexOf(ordenId)
  if (indice >= 0) {
    ordenesMarcadasIds.value.splice(indice, 1)
    return
  }
  ordenesMarcadasIds.value.push(ordenId)
}

const limpiarOrdenesMarcadas = () => {
  ordenesMarcadasIds.value = []
}

const marcarTodasOrdenesVisibles = () => {
  const visiblesNoAsignadas = ordenesTareaVista.value
    .filter((orden) => !ordenYaAsignada(orden.numero))
    .map((orden) => orden.id)
  ordenesMarcadasIds.value = visiblesNoAsignadas
}

const crearTareasDesdeOrdenes = async () => {
  if (!esAdmin.value) return

  const asignadaAId = asignarOrdenesAId.value
  if (!asignadaAId) {
    await mostrarToast('Selecciona primero un usuario para asignar las tareas.')
    return
  }

  const ordenesSeleccionadas = ordenesTareaVista.value.filter((orden) =>
    ordenesMarcadasIds.value.includes(orden.id)
  )

  if (ordenesSeleccionadas.length === 0) {
    await mostrarToast('No hay órdenes seleccionadas para crear tareas.')
    return
  }

  guardandoOrdenes.value = true
  let creadas = 0
  let omitidas = 0

  try {
    for (const orden of ordenesSeleccionadas) {
      if (ordenYaAsignada(orden.numero)) {
        omitidas += 1
        continue
      }

      await crearTarea({
        emoji: '📦',
        titulo: `Orden ${orden.numero}`,
        descripcion: `Atender orden ${orden.numero}. [ORDEN:${orden.numero}]`,
        prioridad: 'media',
        asignadaAId
      })
      creadas += 1
    }

    const mensaje = omitidas > 0
      ? `Tareas creadas: ${creadas}. Omitidas por duplicado: ${omitidas}.`
      : `Se crearon ${creadas} tareas desde órdenes.`
    await mostrarToast(mensaje, 'success')
    limpiarOrdenesMarcadas()
  } catch (error) {
    await mostrarToast(error instanceof Error ? error.message : 'No se pudieron crear tareas desde órdenes.')
  } finally {
    guardandoOrdenes.value = false
  }
}

const guardarTarea = async () => {
  guardando.value = true
  try {
    await crearTarea({
      emoji: '📋',
      titulo: formulario.value.titulo,
      descripcion: formulario.value.descripcion,
      prioridad: formulario.value.prioridad,
      asignadaAId: formulario.value.asignadaAId
    })
    resetFormulario()
    modoCrear.value = true
  } catch (error) {
    await mostrarToast(error instanceof Error ? error.message : 'No se pudo crear la tarea.')
  } finally {
    guardando.value = false
  }
}

const reassignTask = async (id: string, usuarioId: string) => {
  try {
    await reasignarTarea(id, usuarioId)
  } catch (error) {
    await mostrarToast(error instanceof Error ? error.message : 'No se pudo reasignar la tarea.')
  }
}

const onReasignar = (id: string, event: Event) => {
  const target = event.target as HTMLSelectElement | null
  if (!target) return
  reassignTask(id, target.value)
}

const alternar = async (id: string) => {
  try {
    await alternarCompletada(id)
  } catch (error) {
    await mostrarToast(error instanceof Error ? error.message : 'No se pudo actualizar la tarea.')
  }
}

const confirmarEliminar = async (id: string) => {
  const ok = window.confirm('¿Deseas eliminar esta tarea?')
  if (!ok) return

  try {
    await eliminarTarea(id)
  } catch (error) {
    await mostrarToast(error instanceof Error ? error.message : 'No se pudo eliminar la tarea.')
  }
}

const confirmarLimpiarCompletadas = async () => {
  const ok = window.confirm('¿Deseas eliminar todas las tareas completadas?')
  if (!ok) return

  try {
    await limpiarCompletadas()
  } catch (error) {
    await mostrarToast(error instanceof Error ? error.message : 'No se pudieron limpiar las tareas.')
  }
}

const formatearFecha = (iso: string) => {
  try {
    return new Date(iso).toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return 'Fecha reciente'
  }
}

const etiquetaRol = (rol: string) => {
  const mapa: Record<string, string> = {
    administrador: 'Admin',
    recepcionista: 'Recepción',
    cajero: 'Caja'
  }

  return mapa[rol] ?? rol
}

watch(asignarOrdenesAId, () => {
  limpiarOrdenesMarcadas()
})
</script>

<style scoped>
.tareas-page {
  display: grid;
  gap: 18px;
  width: 100%;
  max-width: 1240px;
  margin: 0 auto;
}

.hero-card,
.panel-main,
.side-card,
.creator-card,
.task-list-panel,
.task-card,
.stat-card,
.empty-state {
  border-radius: 22px;
  border: 1px solid rgba(10, 31, 56, 0.08);
  background: #ffffff;
  box-shadow: 0 12px 28px rgba(10, 31, 56, 0.06);
}

.hero-card {
  padding: 18px 20px;
  background: linear-gradient(135deg, #0a1f38 0%, #123a66 55%, #1f5b8f 100%);
  color: #f5f9fc;
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: flex-end;
}

.hero-copy {
  display: grid;
  gap: 10px;
  max-width: 520px;
}

.hero-eyebrow,
.panel-kicker {
  margin: 0;
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 900;
}

.hero-card h1,
.panel-main h2,
.side-card h3,
.empty-state h3 {
  margin: 0;
}

.hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.hero-tag {
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(8px);
  font-weight: 700;
  font-size: 0.82rem;
}

.hero-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.ghost-pill,
.primary-pill,
.soft-btn,
.status-btn,
.delete-btn {
  border: none;
  border-radius: 14px;
  padding: 11px 16px;
  font-weight: 800;
  cursor: pointer;
}

.ghost-pill,
.soft-btn {
  background: #f5f9fc;
  color: #123a66;
  border: 1px solid rgba(18, 58, 102, 0.12);
}

.primary-pill {
  background: linear-gradient(135deg, #f59e0b, #f97316);
  color: #ffffff;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.stat-card {
  padding: 12px 14px;
  display: grid;
  gap: 4px;
}

.stat-card span {
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6d829c;
}

.stat-card strong {
  font-size: 1.35rem;
  color: #0a1f38;
}

.stat-card.amarillo {
  background: linear-gradient(180deg, #fff8e6, #ffffff);
}

.stat-card.verde {
  background: linear-gradient(180deg, #e9fbf0, #ffffff);
}

.stat-card.azul {
  background: linear-gradient(180deg, #eaf4ff, #ffffff);
}

.stat-card.morado {
  background: linear-gradient(180deg, #f4edff, #ffffff);
}

.layout-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  align-items: start;
}

.panel-main,
.side-card,
.creator-card {
  padding: 14px;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.panel-head p {
  margin: 8px 0 0;
  color: #6d829c;
}

.panel-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.creator-grid,
.creator-actions,
.task-meta,
.task-actions,
.assign-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.filters-row {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  padding: 10px;
  border: 1px solid rgba(18, 58, 102, 0.12);
  border-radius: 14px;
  background: linear-gradient(180deg, #f9fcff, #f2f7fb);
}

.select-field,
.field,
.assign-select {
  display: grid;
  gap: 8px;
}

.select-field,
.field {
  flex: 1;
  min-width: 220px;
}

.select-field span,
.field span,
.assign-select span {
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  color: #6d829c;
  letter-spacing: 0.05em;
}

select,
input,
textarea {
  width: 100%;
  border: 1px solid rgba(10, 31, 56, 0.12);
  border-radius: 14px;
  background: #fbfdfe;
  color: #0a1f38;
  padding: 12px 14px;
  font: inherit;
  outline: none;
}

textarea {
  resize: vertical;
}

.creator-card {
  margin-top: 16px;
  background: linear-gradient(180deg, #ffffff, #f8fbfd);
  border-color: rgba(18, 58, 102, 0.14);
  box-shadow: 0 10px 24px rgba(10, 31, 56, 0.06);
}

.tareas-workspace {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  align-items: start;
}

.tareas-workspace.solo-lista {
  grid-template-columns: 1fr;
}

.tareas-workspace .creator-card {
  margin-top: 0;
  position: sticky;
  top: 12px;
}

.task-list-panel {
  padding: 14px;
  background: linear-gradient(180deg, #ffffff, #f8fbfd);
}

.task-list-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.task-list-head h3 {
  margin: 0;
  color: #0a1f38;
}

.creator-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
  color: #0a1f38;
}

.field-wide {
  min-width: 100%;
}

.creator-actions {
  justify-content: flex-end;
  margin-top: 10px;
}

.ordenes-tareas-card {
  margin-top: 12px;
  border-radius: 18px;
  border: 1px solid rgba(18, 58, 102, 0.12);
  background: linear-gradient(180deg, #fdfefe, #f4f9fd);
  padding: 12px;
  display: grid;
  gap: 10px;
}

.ordenes-tareas-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-end;
  color: #0a1f38;
}

.ordenes-tareas-head h3 {
  margin: 0;
  color: #0a1f38;
}

.ordenes-asignar-select {
  min-width: 260px;
}

.ordenes-vacio {
  border-radius: 14px;
  border: 1px dashed rgba(109, 130, 156, 0.5);
  background: #ffffff;
  color: #6d829c;
  padding: 12px;
  text-align: center;
}

.ordenes-check-grid {
  max-height: 190px;
  overflow: auto;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  padding-right: 2px;
}

.orden-check-item {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(18, 58, 102, 0.1);
  border-radius: 12px;
  background: #ffffff;
  padding: 9px 10px;
  font-weight: 700;
  color: #123a66;
}

.orden-check-item.bloqueada {
  opacity: 0.55;
}

.orden-check-item input {
  width: 16px;
  height: 16px;
  padding: 0;
}

.ordenes-acciones {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.task-list {
  display: grid;
  gap: 12px;
}

.task-card {
  padding: 12px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 10px;
  align-items: start;
}

.task-card.done {
  background: linear-gradient(180deg, #f3fff7, #ffffff);
}

.task-emoji {
  width: 44px;
  height: 44px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(18, 58, 102, 0.08), rgba(245, 158, 11, 0.10));
  display: grid;
  place-items: center;
  font-size: 1.35rem;
}

.task-content {
  display: grid;
  gap: 12px;
}

.task-title-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.task-title-row h3 {
  font-size: 0.96rem;
  color: #0a1f38;
}

.task-desc {
  margin: 6px 0 0;
  color: #4a627e;
  line-height: 1.5;
  font-size: 0.88rem;
}

.priority-badge {
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 800;
}

.priority-badge.baja {
  background: rgba(34, 197, 94, 0.12);
  color: #0f7a3a;
}

.priority-badge.media {
  background: rgba(245, 158, 11, 0.14);
  color: #a45b00;
}

.priority-badge.alta {
  background: rgba(239, 68, 68, 0.12);
  color: #b91c1c;
}

.task-meta {
  color: #6d829c;
  font-size: 0.8rem;
}

.assign-row {
  align-items: end;
}

.assign-select {
  min-width: 240px;
}

.task-actions {
  align-items: center;
  justify-content: flex-end;
}

.status-btn {
  background: linear-gradient(135deg, #123a66, #0d2b4e);
  color: #ffffff;
}

.status-btn.active {
  background: linear-gradient(135deg, #0f7a3a, #16a34a);
}

.delete-btn {
  background: rgba(220, 38, 38, 0.12);
  color: #b91c1c;
}

.empty-state {
  padding: 34px 20px;
  text-align: center;
  display: grid;
  gap: 8px;
  color: #6d829c;
}

.empty-emoji {
  font-size: 2.2rem;
}

.panel-side {
  display: grid;
  gap: 14px;
  color:#0a1f38
}

.mini-list {
  list-style: none;
  padding: 0;
  margin: 14px 0 0;
  display: grid;
  gap: 10px;
}

.mini-list li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  background: #f5f9fc;
}

.mini-list span {
  color: #6d829c;
}

.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.98);
}

@media (max-width: 1100px) {
  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }

  .tareas-workspace {
    grid-template-columns: 1fr;
  }

  .tareas-workspace .creator-card {
    position: static;
  }
}

@media (max-width: 860px) {
  .hero-card {
    flex-direction: column;
    align-items: stretch;
  }

  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .task-card {
    grid-template-columns: 1fr;
  }

  .task-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .tareas-workspace {
    grid-template-columns: 1fr;
  }

  .filters-row {
    grid-template-columns: 1fr;
  }

  .task-actions,
  .hero-actions {
    justify-content: flex-start;
  }

  .panel-head {
    flex-direction: column;
  }

  .ordenes-tareas-head {
    flex-direction: column;
    align-items: stretch;
  }

  .ordenes-asignar-select {
    min-width: 100%;
  }

  .ordenes-check-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .stat-card {
    padding: 10px 12px;
    gap: 2px;
  }

  .stat-card span {
    font-size: 0.68rem;
  }

  .stat-card strong {
    font-size: 1.05rem;
  }

  .task-card {
    grid-template-columns: 1fr;
    padding: 10px;
    gap: 8px;
  }

  .task-emoji {
    width: 38px;
    height: 38px;
    border-radius: 14px;
    font-size: 1.15rem;
  }

  .task-content {
    gap: 8px;
  }

  .task-title-row {
    gap: 6px;
  }

  .task-title-row h3 {
    font-size: 0.84rem;
  }

  .priority-badge {
    padding: 4px 8px;
    font-size: 0.62rem;
  }

  .task-desc {
    margin-top: 4px;
    font-size: 0.76rem;
    line-height: 1.35;
  }

  .task-meta {
    font-size: 0.66rem;
  }

  .task-actions {
    width: 100%;
    justify-content: stretch;
    gap: 6px;
    flex-wrap: wrap;
  }

  .task-actions .status-btn,
  .task-actions .delete-btn {
    width: 100%;
  }

  .assign-select {
    min-width: 0;
    width: 100%;
  }

  .empty-state {
    grid-column: 1 / -1;
  }
}
</style>
