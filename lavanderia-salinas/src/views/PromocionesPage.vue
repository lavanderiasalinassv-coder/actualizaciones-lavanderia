<template>
  <AppShell>
    <div class="page-content">
      <div class="header-row">
        <h1>Promociones y Ofertas</h1>
        <ion-button class="btn-primario" @click="abrirFormulario" v-if="!mostrarFormulario">
          <ion-icon :icon="addCircleOutline" slot="start" />
          Nueva Promoción
        </ion-button>
      </div>

      <div v-if="mostrarFormulario" class="formulario-promo">
        <div class="form-header">
          <h2>{{ editandoId ? 'Editar' : 'Nueva' }} Promoción</h2>
          <button class="btn-cerrar" @click="cerrarFormulario">×</button>
        </div>

        <div class="form-group">
          <label>Nombre de la promoción *</label>
          <input v-model="formulario.nombre" type="text" placeholder="Ej: Descuento para cliente nuevo" class="input-form" />
        </div>

        <div class="form-group">
          <label>Descripción (opcional)</label>
          <textarea v-model="formulario.descripcion" placeholder="Detalles adicionales..." class="input-form"></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Tipo de Descuento *</label>
            <select v-model="formulario.tipoDescuento" class="input-form">
              <option value="porcentaje">Porcentaje (%)</option>
              <option value="dinero">Vale de descuento ($)</option>
            </select>
          </div>

          <div class="form-group">
            <label>Valor del Descuento *</label>
            <input
              v-model.number="formulario.valor"
              type="number"
              placeholder="Ej: 10"
              :min="0"
              :max="formulario.tipoDescuento === 'porcentaje' ? 100 : undefined"
              class="input-form"
            />
            <small>{{ formulario.tipoDescuento === 'porcentaje' ? '(0-100)%' : 'Monto fijo en dinero' }}</small>
          </div>
        </div>

        <div class="form-group">
          <label>¿A quién le aplica? *</label>
          <select v-model="formulario.tipoClienteAplica" class="input-form">
            <option value="todos">Todos (con o sin registro)</option>
            <option value="registrados">Solo clientes registrados</option>
            <option value="recurrentes">Solo clientes recurrentes</option>
          </select>
        </div>

        <div v-if="formulario.tipoClienteAplica === 'recurrentes'" class="form-group">
          <label>Mínimo de órdenes para aplicar (opcional)</label>
          <input v-model.number="formulario.minOrdenes" type="number" placeholder="Ej: 5" min="1" class="input-form" />
          <small>Si no completa, aplica a todos los recurrentes</small>
        </div>

        <div class="form-group">
          <label>¿Aplica todos los días o días específicos?</label>
          <div class="dias-selector">
            <label v-for="dia in diasSemana" :key="dia" class="checkbox-dia">
              <input
                type="checkbox"
                :value="dia"
                :checked="formulario.diasEspecificos.includes(dia)"
                @change="(e) => toggleDia(dia, (e.target as HTMLInputElement).checked)"
              />
              <span>{{ capitalizarDia(dia) }}</span>
            </label>
          </div>
          <small v-if="formulario.diasEspecificos.length === 0" class="hint-dias">
            Si no selecciona días, la oferta aplica todos los días (dentro del rango de fechas)
          </small>
          <small v-else class="hint-dias">
            Esta oferta solo aplica: {{ diasSeleccionadosTexto }}
          </small>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Fecha de Inicio *</label>
            <input v-model="formulario.fechaInicio" type="date" class="input-form" />
          </div>
          <div class="form-group">
            <label>Fecha de Fin *</label>
            <input v-model="formulario.fechaFin" type="date" class="input-form" />
          </div>
        </div>

        <div class="form-group toggle-vigor">
          <label>
            <input v-model="formulario.vigente" type="checkbox" />
            <span>Promoción Vigente (Activa)</span>
          </label>
        </div>

        <div class="form-acciones">
          <button class="btn-cancelar" @click="cerrarFormulario">Cancelar</button>
          <button class="btn-guardar" @click="guardarPromocion" :disabled="!formularioValido">
            {{ editandoId ? 'Actualizar' : 'Crear' }} Promoción
          </button>
        </div>
      </div>

      <!-- Lista de promociones -->
      <div v-if="!mostrarFormulario" class="lista-promos">
        <div v-if="promociones.length === 0" class="vacio">
          <ion-icon :icon="newspaperOutline" class="icono-vacio" />
          <p>No hay promociones creadas aún.</p>
          <button class="btn-crear-primera" @click="abrirFormulario">
            Crear Primera Promoción
          </button>
        </div>

        <div v-else>
          <div class="filtros-estado">
            <button
              :class="{ activo: filtroVigencia === 'todas' }"
              @click="filtroVigencia = 'todas'"
            >
              Todas ({{ promociones.length }})
            </button>
            <button
              :class="{ activo: filtroVigencia === 'vigentes' }"
              @click="filtroVigencia = 'vigentes'"
            >
              Vigentes ({{ promocionesVigentes.length }})
            </button>
            <button
              :class="{ activo: filtroVigencia === 'inactivas' }"
              @click="filtroVigencia = 'inactivas'"
            >
              Inactivas ({{ promocionesInactivas.length }})
            </button>
          </div>

          <div class="promo-cards">
            <div
              v-for="promo in promocionesFiltradas"
              :key="promo.id"
              class="promo-card"
              :class="{ 'promo-inactiva': !promo.vigente }"
            >
              <div class="promo-header">
                <div class="promo-titulo">
                  <h3>{{ promo.nombre }}</h3>
                  <span v-if="promo.vigente" class="badge-vigente">Vigente</span>
                  <span v-else class="badge-inactiva">Inactiva</span>
                </div>
                <div class="promo-acciones">
                  <button class="btn-editar" @click="editarPromocion(promo)">
                    <ion-icon :icon="pencilOutline" />
                  </button>
                  <button class="btn-eliminar" @click="confirmarEliminarPromocion(promo.id)">
                    <ion-icon :icon="trashOutline" />
                  </button>
                </div>
              </div>

              <p v-if="promo.descripcion" class="promo-desc">{{ promo.descripcion }}</p>

              <div class="promo-detalles">
                <div class="detalle-item">
                  <span class="label">Descuento:</span>
                  <strong style="color: goldenrod;">{{ formatearValorPromocion(promo) }}</strong>
                </div>

                <div class="detalle-item">
                  <span class="label">Aplica a:</span>
                  <span class="valor">
                    {{
                      promo.tipoClienteAplica === 'todos'
                        ? 'Todos'
                        : promo.tipoClienteAplica === 'registrados'
                          ? 'Clientes Registrados'
                          : `Recurrentes${promo.minOrdenes ? ` (${promo.minOrdenes}+ órdenes)` : ''}`
                    }}
                  </span>
                </div>

                <div class="detalle-item">
                  <span class="label">Vigencia:</span>
                  <span class="valor">{{ formatearFecha(promo.fechaInicio) }} - {{ formatearFecha(promo.fechaFin) }}</span>
                </div>

                <div v-if="promo.diasEspecificos.length > 0" class="detalle-item">
                  <span class="label">Días Aplicables:</span>
                  <div class="dias-muestra">
                    <span
                      v-for="dia in promo.diasEspecificos"
                      :key="dia"
                      class="badge-dia"
                    >
                      {{ capitalizarDia(dia).substring(0, 3) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { IonIcon, IonButton, toastController } from '@ionic/vue'
import {
  addCircleOutline,
  newspaperOutline,
  pencilOutline,
  trashOutline
} from 'ionicons/icons'
import AppShell from '@/components/AppShell.vue'
import { usePromociones, type Promocion, type TipoDescuento, type TipoClienteAplica, type DiaSemana } from '@/composables/usePromociones'

const { promociones, cargarPromociones, crearPromocion, actualizarPromocion, eliminarPromocion } = usePromociones()

const mostrarFormulario = ref(false)
const editandoId = ref<string | null>(null)
const filtroVigencia = ref<'todas' | 'vigentes' | 'inactivas'>('todas')
const guardando = ref(false)

const diasSemana: DiaSemana[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']

const formulario = ref({
  nombre: '',
  descripcion: '',
  tipoDescuento: 'porcentaje' as TipoDescuento,
  valor: 0,
  tipoClienteAplica: 'todos' as TipoClienteAplica,
  minOrdenes: undefined as number | undefined,
  vigente: true,
  fechaInicio: new Date().toISOString().split('T')[0],
  fechaFin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  diasEspecificos: [] as DiaSemana[]
})

const mostrarToast = async (mensaje: string, color: 'success' | 'danger' | 'warning' = 'success') => {
  const toast = await toastController.create({
    message: mensaje,
    duration: 2000,
    color
  })
  await toast.present()
}

const formularioValido = computed(() => {
  return (
    formulario.value.nombre.trim() &&
    formulario.value.valor > 0 &&
    formulario.value.fechaInicio &&
    formulario.value.fechaFin &&
    formulario.value.fechaInicio <= formulario.value.fechaFin
  )
})

const formatearValorPromocion = (promo: Promocion) =>
  promo.tipoDescuento === 'porcentaje'
    ? `${Number(promo.valor).toFixed(2)}%`
    : `$${Number(promo.valor).toFixed(2)}`

const promocionesVigentes = computed(() => {
  const hoy = new Date().toISOString().split('T')[0]
  return promociones.value.filter(
    (p) => p.vigente && p.fechaInicio <= hoy && p.fechaFin >= hoy
  )
})

const promocionesInactivas = computed(() => {
  const hoy = new Date().toISOString().split('T')[0]
  return promociones.value.filter(
    (p) => !p.vigente || p.fechaInicio > hoy || p.fechaFin < hoy
  )
})

const promocionesFiltradas = computed(() => {
  if (filtroVigencia.value === 'vigentes') return promocionesVigentes.value
  if (filtroVigencia.value === 'inactivas') return promocionesInactivas.value
  return promociones.value
})

const abrirFormulario = () => {
  editandoId.value = null
  formulario.value = {
    nombre: '',
    descripcion: '',
    tipoDescuento: 'porcentaje',
    valor: 0,
    tipoClienteAplica: 'todos',
    minOrdenes: undefined,
    vigente: true,
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaFin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    diasEspecificos: []
  }
  mostrarFormulario.value = true
}

const editarPromocion = (promo: Promocion) => {
  editandoId.value = promo.id
  formulario.value = {
    nombre: promo.nombre,
    descripcion: promo.descripcion,
    tipoDescuento: promo.tipoDescuento,
    valor: promo.valor,
    tipoClienteAplica: promo.tipoClienteAplica,
    minOrdenes: promo.minOrdenes,
    vigente: promo.vigente,
    fechaInicio: promo.fechaInicio,
    fechaFin: promo.fechaFin,
    diasEspecificos: [...promo.diasEspecificos]
  }
  mostrarFormulario.value = true
}

const cerrarFormulario = () => {
  mostrarFormulario.value = false
  editandoId.value = null
}

const guardarPromocion = async () => {
  if (!formularioValido.value || guardando.value) return

  guardando.value = true

  try {
    if (editandoId.value) {
      await actualizarPromocion(editandoId.value, formulario.value)
      await mostrarToast('Promoción actualizada correctamente', 'success')
    } else {
      await crearPromocion(formulario.value)
      await mostrarToast('Promoción creada correctamente', 'success')
    }

    cerrarFormulario()
  } catch (error: any) {
    await mostrarToast(error.message || 'No se pudo guardar la promoción', 'danger')
  } finally {
    guardando.value = false
  }
}

const confirmarEliminarPromocion = async (id: string) => {
  if (!confirm('¿Estás seguro de que quieres eliminar esta promoción?')) return

  try {
    await eliminarPromocion(id)
    await mostrarToast('Promoción eliminada', 'success')
  } catch (error: any) {
    await mostrarToast(error.message || 'No se pudo eliminar la promoción', 'danger')
  }
}

const formatearFecha = (fecha: string) => {
  return new Date(fecha).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  })
}

const capitalizarDia = (dia: DiaSemana): string => {
  const map: Record<DiaSemana, string> = {
    lunes: 'Lunes',
    martes: 'Martes',
    miercoles: 'Miércoles',
    jueves: 'Jueves',
    viernes: 'Viernes',
    sabado: 'Sábado',
    domingo: 'Domingo'
  }
  return map[dia]
}

const toggleDia = (dia: DiaSemana, seleccionado: boolean) => {
  if (seleccionado) {
    if (!formulario.value.diasEspecificos.includes(dia)) {
      formulario.value.diasEspecificos.push(dia)
    }
  } else {
    const index = formulario.value.diasEspecificos.indexOf(dia)
    if (index > -1) {
      formulario.value.diasEspecificos.splice(index, 1)
    }
  }
}

const diasSeleccionadosTexto = computed(() => {
  if (formulario.value.diasEspecificos.length === 0) return ''
  return formulario.value.diasEspecificos.map(capitalizarDia).join(', ')
})
</script>

<style scoped>
.page-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: calc(100% + 220px);
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
}

.eyebrow {
  margin: 0 0 6px;
  color: #6d829c;
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.header-row h1 {
  margin: 0;
  color: #0a1f38;
  font-size: clamp(1.8rem, 2.5vw, 2.6rem);
  font-weight: 900;
  flex-grow: 1;
}

.contenedor-principal {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.btn-primario {
  --background: #123a66;
  --background-hover: #0d2b4e;
  --color: #f5f9fc;
  --border-radius: 12px;
  font-weight: 700;
}

/* Formulario */
.formulario-promo {
  background: #fbfdfe;
  border: 1px solid rgba(10, 31, 56, 0.12);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
}

.form-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.form-header h2 {
  color: #0a1f38;
  margin: 0;
  font-size: 1.2rem;
}

.btn-cerrar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(10, 31, 56, 0.08);
  color: #0a1f38;
  font-size: 24px;
  cursor: pointer;
  display: grid;
  place-items: center;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.form-group label {
  color: #24405f;
  font-weight: 700;
  font-size: 0.88rem;
}

.input-form {
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid rgba(10, 31, 56, 0.14);
  font-size: 0.9rem;
  color: #0a1f38;
  background: #ffffff;
  outline: none;
}

.input-form:focus {
  border-color: #123a66;
  box-shadow: 0 0 0 3px rgba(18, 58, 102, 0.15);
}

.input-form textarea {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group small {
  color: #9fb4c9;
  font-size: 0.78rem;
}

.toggle-vigor {
  flex-direction: row;
  align-items: center;
  gap: 10px;
}

.toggle-vigor label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-weight: 600;
}

.toggle-vigor input[type='checkbox'] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.dias-selector {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 10px;
  padding: 12px;
  background: rgba(10, 31, 56, 0.03);
  border-radius: 10px;
}

.checkbox-dia {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: background 0.2s ease;
}

.checkbox-dia:hover {
  background: rgba(10, 31, 56, 0.06);
}

.checkbox-dia input[type='checkbox'] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.checkbox-dia span {
  font-size: 0.9rem;
  font-weight: 500;
  color: #24405f;
  user-select: none;
}

.hint-dias {
  display: block;
  margin-top: 8px;
  color: #7c8fa6;
  font-size: 0.78rem;
  font-style: italic;
}

.form-acciones {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid rgba(10, 31, 56, 0.08);
}

.btn-cancelar,
.btn-guardar {
  padding: 12px 24px;
  border-radius: 10px;
  border: none;
  font-weight: 800;
  cursor: pointer;
  font-size: 0.9rem;
}

.btn-cancelar {
  background: #ffffff;
  color: #123a66;
  border: 1.5px solid rgba(18, 58, 102, 0.24);
}

.btn-guardar {
  background: #123a66;
  color: #f5f9fc;
}

.btn-guardar:disabled {
  background: rgba(10, 31, 56, 0.12);
  color: #9fb4c9;
  cursor: not-allowed;
}

/* Lista de promociones */
.lista-promos {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.vacio {
  text-align: center;
  padding: 40px 20px;
  background: #fbfdfe;
  border: 2px dashed rgba(10, 31, 56, 0.12);
  border-radius: 16px;
}

.icono-vacio {
  font-size: 48px;
  color: #d0dce6;
  margin-bottom: 12px;
}

.vacio p {
  color: #7c8fa6;
  margin: 0 0 16px;
  font-size: 0.95rem;
}

.btn-crear-primera {
  padding: 12px 24px;
  border-radius: 10px;
  border: none;
  background: #123a66;
  color: #f5f9fc;
  font-weight: 800;
  cursor: pointer;
}

.filtros-estado {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.filtros-estado button {
  padding: 10px 16px;
  border-radius: 10px;
  border: 1.5px solid rgba(10, 31, 56, 0.14);
  background: #ffffff;
  color: #7c8fa6;
  font-weight: 700;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s ease;
}

.filtros-estado button.activo {
  background: #123a66;
  color: #f5f9fc;
  border-color: #123a66;
}

.promo-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.promo-card {
  background: #ffffff;
  border: 1px solid rgba(10, 31, 56, 0.10);
  border-radius: 14px;
  padding: 16px;
  transition: all 0.2s ease;
}

.promo-card:hover {
  box-shadow: 0 8px 24px rgba(10, 31, 56, 0.08);
}

.promo-card.promo-inactiva {
  opacity: 0.6;
  background: #f9fafb;
}

.promo-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.promo-titulo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.promo-titulo h3 {
  margin: 0;
  color: #0a1f38;
  font-size: 1rem;
}

.badge-vigente,
.badge-inactiva {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge-vigente {
  background: rgba(22, 163, 74, 0.15);
  color: #15803d;
}

.badge-inactiva {
  background: rgba(107, 114, 128, 0.15);
  color: #6f7891;
}

.promo-acciones {
  display: flex;
  gap: 6px;
}

.btn-editar,
.btn-eliminar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: rgba(10, 31, 56, 0.06);
  color: #123a66;
  cursor: pointer;
  display: grid;
  place-items: center;
  font-size: 16px;
  transition: all 0.2s ease;
}

.btn-eliminar {
  color: #dc2626;
}

.btn-editar:hover,
.btn-eliminar:hover {
  background: rgba(10, 31, 56, 0.12);
}

.promo-desc {
  color: #7c8fa6;
  font-size: 0.85rem;
  margin: 0 0 12px;
  line-height: 1.4;
}

.promo-detalles {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detalle-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(10, 31, 56, 0.06);
}

.detalle-item:last-child {
  border-bottom: none;
}

.detalle-item .label {
  color: #7c8fa6;
  font-size: 0.82rem;
  font-weight: 600;
}

.detalle-item .valor {
  color: #0a1f38;
  font-size: 0.88rem;
  font-weight: 700;
}

.dias-muestra {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.badge-dia {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 6px;
  background: rgba(18, 58, 102, 0.12);
  color: #123a66;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

@media (max-width: 768px) {
  .titulo-seccion h1 {
    font-size: 1.5rem;
  }

  .titulo-seccion p {
    font-size: 0.9rem;
  }

  .header-promo {
    justify-content: center;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .promo-cards {
    grid-template-columns: 1fr;
  }

  .filtros-estado {
    flex-wrap: wrap;
  }
}
</style>
