<template>
  <AppShell>
    <div class="page-content">
      <div class="header-row">
        <h1>Promociones y Ofertas</h1>
        <ion-button class="btn-primario" @click="abrirFormulario" v-if="!mostrarFormulario && vistaPromociones === 'promociones'">
          <ion-icon :icon="addCircleOutline" slot="start" />
          Nueva Promoción
        </ion-button>
      </div>

      <div v-if="!mostrarFormulario" class="promo-tabs" role="tablist" aria-label="Administrar promociones">
        <button
          type="button"
          role="tab"
          :aria-selected="vistaPromociones === 'promociones'"
          :class="{ activo: vistaPromociones === 'promociones' }"
          @click="vistaPromociones = 'promociones'"
        >Promociones</button>
        <button
          type="button"
          role="tab"
          :aria-selected="vistaPromociones === 'cupones'"
          :class="{ activo: vistaPromociones === 'cupones' }"
          @click="vistaPromociones = 'cupones'"
        >Cupones</button>
      </div>

      <div v-if="mostrarFormulario" class="formulario-promo" :class="{ 'formulario-cupon': formulario.generarQr }">
        <div class="form-header">
          <h2>{{ editandoId ? 'Editar' : 'Nueva' }} {{ formulario.generarQr ? 'cupón QR' : 'promoción' }}</h2>
          <button class="btn-cerrar" @click="cerrarFormulario">×</button>
        </div>

        <div class="form-group toggle-vigor toggle-qr">
          <label>
            <input v-model="formulario.generarQr" type="checkbox" />
            <span>{{ formulario.generarQr ? 'Crear como cupón QR' : 'Generar cupón QR para esta promoción' }}</span>
          </label>
        </div>

        <div class="form-group">
          <label>{{ formulario.generarQr ? 'Nombre del cupón *' : 'Nombre de la promoción *' }}</label>
          <input v-model="formulario.nombre" type="text" placeholder="Ej: Descuento para cliente nuevo" class="input-form" />
        </div>

        <div class="form-group">
          <label>{{ formulario.generarQr ? 'Descripción del cupón (opcional)' : 'Descripción (opcional)' }}</label>
          <textarea v-model="formulario.descripcion" placeholder="Detalles adicionales..." class="input-form"></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>{{ formulario.generarQr ? 'Tipo de beneficio *' : 'Tipo de Descuento *' }}</label>
            <select v-model="formulario.tipoDescuento" class="input-form">
              <option value="porcentaje">Porcentaje (%)</option>
              <option value="dinero">Vale de descuento ($)</option>
            </select>
          </div>

          <div class="form-group">
            <label>{{ formulario.generarQr ? 'Valor del beneficio *' : 'Valor del Descuento *' }}</label>
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

        <div v-if="formulario.generarQr" class="form-group">
          <label>Límite de canjes por cliente (opcional)</label>
          <input
            :value="formulario.maxUsosPorCliente ?? ''"
            type="number"
            min="1"
            step="1"
            placeholder="Sin límite"
            class="input-form"
            @input="actualizarMaxUsosPorCliente"
          />
          <small>Si lo dejas vacío, el cupón no tendrá límite de usos.</small>
        </div>

        <div class="form-acciones">
          <button class="btn-cancelar" @click="cerrarFormulario">Cancelar</button>
          <button class="btn-guardar" @click="guardarPromocion" :disabled="!formularioValido || guardando" :aria-busy="guardando">
            <ion-spinner v-if="guardando" name="crescent" />
            {{ guardando ? 'Guardando...' : `${editandoId ? 'Actualizar' : 'Crear'} ${formulario.generarQr ? 'Cupón QR' : 'Promoción'}` }}
          </button>
        </div>
      </div>

      <!-- Lista de promociones -->
      <div v-if="!mostrarFormulario" class="lista-promos">
        <section v-if="vistaPromociones === 'cupones'" class="cupones-promo">
          <div class="cupones-cabecera">
            <div>
              <h2>Cupones</h2>
            </div>
            <span class="cupones-contador">{{ promocionesCupon.length }} cupones QR</span>
          </div>
          <div v-if="cargando && promociones.length === 0" class="promociones-cargando" role="status" aria-live="polite">
            <ion-spinner name="crescent" />
            <span>Cargando cupones...</span>
          </div>
          <div v-else-if="promocionesCupon.length === 0" class="vacio cupones-vacio">
            <ion-icon :icon="newspaperOutline" class="icono-vacio" />
            <p>No hay cupones QR creados.</p>
          </div>
          <div v-else class="cupones-lista">
            <div
              v-for="promo in promocionesCupon"
              :id="`cupon-${promo.id}`"
              :key="promo.id"
              class="cupon-card-anchor"
            >
              <CuponQrCard :promocion="promo" />
            </div>
          </div>
        </section>

        <template v-else>
        <div v-if="cargando && promociones.length === 0" class="promociones-cargando" role="status" aria-live="polite">
          <ion-spinner name="crescent" />
          <span>Cargando promociones...</span>
        </div>

        <div v-else-if="error && promociones.length === 0" class="promociones-error" role="alert">
          <p>No se pudieron cargar las promociones: {{ error }}</p>
          <button class="btn-crear-primera" type="button" :disabled="cargando" @click="cargarPromociones">
            Reintentar
          </button>
        </div>

        <div v-else-if="promociones.length === 0" class="vacio">
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
            <button
              :class="{ activo: filtroVigencia === 'cupones' }"
              @click="filtroVigencia = 'cupones'"
            >
              Cupones ({{ promocionesConQr.length }})
            </button>
          </div>

          <div class="promo-cards">
            <div
              v-for="promo in promocionesFiltradas"
              :key="promo.id"
              class="promo-card"
              :class="{
                'promo-inactiva': !promocionEstaVigente(promo),
                'promo-expirada': promocionExpirada(promo),
                'promo-con-qr': promo.generarQr,
                'promo-verde-magenta': promocionEsVerdeMagenta(promo),
                'promo-dorada': promocionEsDorada(promo)
              }"
            >
              <div class="promo-header">
                <div class="promo-titulo">
                  <span class="promo-ticket-label">{{ promo.generarQr ? 'Cupón de descuento' : 'Promoción especial' }}</span>
                  <h3>{{ promo.nombre }}</h3>
                  <span v-if="promocionExpirada(promo)" class="badge-expirada">No vigente · Promoción expirada</span>
                  <span v-else-if="promocionEstaVigente(promo)" class="badge-vigente">✦ Vigente</span>
                  <span v-else class="badge-inactiva">No vigente</span>
                  <span v-if="promo.generarQr" class="badge-qr">Cupón de descuento</span>
                </div>
                <div class="promo-acciones">
                  <button
                    v-if="promo.generarQr"
                    type="button"
                    class="btn-compartir"
                    :aria-label="`Ir a compartir el cupón ${promo.nombre}`"
                    title="Ir a compartir cupón"
                    @click="irACompartirCupon(promo.id)"
                  >
                    <ion-icon :icon="shareSocialOutline" />
                  </button>
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
                <div class="detalle-item detalle-descuento">
                  <span class="label">Descuento:</span>
                  <span class="chip-descuento">{{ formatearValorPromocion(promo) }}</span>
                </div>

                <div class="detalle-item">
                  <span class="label">Aplica a:</span>
                  <span class="valor">
                    {{ promo.generarQr
                      ? 'Con QR'
                      : promo.tipoClienteAplica === 'todos'
                        ? 'Todos'
                        : promo.tipoClienteAplica === 'registrados'
                          ? 'Clientes Registrados'
                          : `Recurrentes${promo.minOrdenes ? ` (${promo.minOrdenes}+ órdenes)` : ''}` }}
                  </span>
                </div>

                <div v-if="promo.generarQr" class="detalle-item">
                  <span class="label">Límite por cliente:</span>
                  <span class="valor">{{ formatearLimiteUsos(promo.maxUsosPorCliente) }}</span>
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
        </template>
      </div>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { IonIcon, IonButton, IonSpinner, toastController } from '@ionic/vue'
import {
  addCircleOutline,
  newspaperOutline,
  pencilOutline,
  shareSocialOutline,
  trashOutline
} from 'ionicons/icons'
import AppShell from '@/components/AppShell.vue'
import CuponQrCard from '@/components/CuponQrCard.vue'
import { usePromociones, type Promocion, type TipoDescuento, type TipoClienteAplica, type DiaSemana } from '@/composables/usePromociones'

const { promociones, cargando, error, cargarPromociones, crearPromocion, actualizarPromocion, eliminarPromocion } = usePromociones()

const mostrarFormulario = ref(false)
const editandoId = ref<string | null>(null)
const filtroVigencia = ref<'todas' | 'vigentes' | 'inactivas' | 'cupones'>('todas')
const vistaPromociones = ref<'promociones' | 'cupones'>('promociones')
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
  generarQr: false,
  maxUsosPorCliente: null as number | null,
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
  const maxUsos = formulario.value.maxUsosPorCliente
  return (
    formulario.value.nombre.trim() &&
    formulario.value.valor > 0 &&
    formulario.value.fechaInicio &&
    formulario.value.fechaFin &&
    formulario.value.fechaInicio <= formulario.value.fechaFin
    && (!formulario.value.generarQr || maxUsos === null || (Number.isInteger(maxUsos) && maxUsos >= 1))
  )
})

const actualizarMaxUsosPorCliente = (event: Event) => {
  const valor = (event.target as HTMLInputElement).value.trim()
  formulario.value.maxUsosPorCliente = valor === '' ? null : Number(valor)
}

const formatearValorPromocion = (promo: Promocion) =>
  promo.tipoDescuento === 'porcentaje'
    ? `${Number(promo.valor).toFixed(2)}%`
    : `$${Number(promo.valor).toFixed(2)}`

const formatearLimiteUsos = (maxUsos?: number | null) =>
  typeof maxUsos === 'number' && Number.isInteger(maxUsos) && maxUsos >= 1
    ? `Máximo ${maxUsos} ${maxUsos === 1 ? 'uso' : 'usos'}`
    : 'Sin límite'

const promocionEsDorada = (promo: Promocion) =>
  (promo.tipoDescuento === 'porcentaje' && Number(promo.valor) >= 50) ||
  (promo.tipoDescuento === 'dinero' && Number(promo.valor) >= 20)

const promocionEsVerdeMagenta = (promo: Promocion) =>
  (promo.tipoDescuento === 'porcentaje' && Number(promo.valor) >= 30 && Number(promo.valor) < 50) ||
  (promo.tipoDescuento === 'dinero' && Number(promo.valor) >= 10 && Number(promo.valor) < 20)

const fechaHoy = computed(() => new Date().toISOString().split('T')[0])
const promocionExpirada = (promo: Promocion) => promo.fechaFin < fechaHoy.value
const promocionEstaVigente = (promo: Promocion) =>
  promo.vigente && promo.fechaInicio <= fechaHoy.value && promo.fechaFin >= fechaHoy.value

const promocionesVigentes = computed(() => promociones.value.filter(promocionEstaVigente))

const promocionesInactivas = computed(() => {
  return promociones.value.filter(
    (promo) => !promocionEstaVigente(promo)
  )
})

const promocionesConQr = computed(() => promociones.value.filter((promo) => promo.generarQr))

const promocionesFiltradas = computed(() => {
  if (filtroVigencia.value === 'vigentes') return promocionesVigentes.value
  if (filtroVigencia.value === 'inactivas') return promocionesInactivas.value
  if (filtroVigencia.value === 'cupones') return promocionesConQr.value
  return promociones.value
})

const promocionesCupon = computed(() => {
  return promociones.value.filter((promo) => promo.generarQr)
})

const irACompartirCupon = async (id: string) => {
  vistaPromociones.value = 'cupones'
  await nextTick()
  document.getElementById(`cupon-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

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
    generarQr: false,
    maxUsosPorCliente: null,
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
    generarQr: promo.generarQr ?? false,
    maxUsosPorCliente: promo.maxUsosPorCliente ?? null,
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

.promo-tabs {
  display: flex;
  gap: 4px;
  width: fit-content;
  max-width: 100%;
  padding: 4px;
  border: 1px solid rgba(10, 31, 56, 0.1);
  border-radius: 10px;
  background: #f2f6f8;
}

.promo-tabs button {
  padding: 9px 16px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: #526a80;
  font-size: 0.88rem;
  font-weight: 750;
  cursor: pointer;
}

.promo-tabs button.activo {
  background: #ffffff;
  color: #123a66;
  box-shadow: 0 1px 4px rgba(10, 31, 56, 0.12);
}

.cupones-promo {
  display: grid;
  gap: 16px;
}

.cupones-cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.cupones-cabecera h2 {
  margin: 0;
  color: #0a1f38;
  font-size: 1.2rem;
}

.cupones-cabecera p {
  margin: 6px 0 0;
  color: #6d829c;
  font-size: 0.88rem;
}

.cupones-contador {
  flex: 0 0 auto;
  color: #526a80;
  font-size: 0.8rem;
  font-weight: 750;
}

.cupones-lista {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 380px), 1fr));
  gap: 14px;
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

.formulario-promo.formulario-cupon {
  border-color: #a6d1df;
  background: linear-gradient(145deg, #eef9fc 0%, #ffffff 58%, #f4fbfd 100%);
  box-shadow: inset 5px 0 0 #397e9f, 0 10px 24px rgba(18, 58, 102, 0.08);
}

.formulario-cupon .form-header h2 {
  color: #123a66;
}

.formulario-cupon .form-group small {
  color: #52768a;
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

.toggle-qr {
  padding: 12px 14px;
  border: 1px solid #b9d9e4;
  border-radius: 8px;
  background: #edf7fa;
}

.formulario-cupon .toggle-qr {
  border-color: #78b6ca;
  background: #dff2f8;
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-guardar ion-spinner {
  width: 18px;
  height: 18px;
  --color: currentColor;
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

.promociones-cargando,
.promociones-error {
  display: flex;
  min-height: 180px;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  border: 1px solid rgba(18, 58, 102, 0.12);
  border-radius: 16px;
  background: rgba(235, 244, 247, 0.82);
  color: #36566d;
  font-weight: 700;
  text-align: center;
}

.promociones-cargando ion-spinner {
  width: 28px;
  height: 28px;
  --color: #397e9f;
}

.promociones-error {
  flex-direction: column;
  color: #7f3324;
}

.promociones-error p {
  margin: 0;
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

/* --- Cards de promociones ------------------------------------------- */
/* Estructura: cromática navy para la interfaz, acento dorado reservado
   únicamente para señalar que la card es una oferta (chip + brillo). */

.promo-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 18px;
}

.promo-card {
  position: relative;
  overflow: hidden;
  padding: 18px 18px 16px 28px;
  border: 1px solid #c8dce7;
  border-radius: 8px;
  background: linear-gradient(145deg, #ffffff 0%, #f0f8fb 100%);
  box-shadow: 0 5px 16px rgba(10, 48, 76, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.promo-card::before {
  position: absolute;
  top: 12px;
  bottom: 12px;
  left: 13px;
  border-left: 2px dashed #a8c5d2;
  content: '';
}

.promo-card::after {
  position: absolute;
  inset: 0 auto 0 0;
  width: 5px;
  background: linear-gradient(180deg, #123a66, #397e9f 55%, #168e83);
  content: '';
}

.promo-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 9px 22px rgba(10, 48, 76, 0.13);
}

.promo-card.promo-inactiva {
  background: #f5f7f8;
  border-color: #d8e0e4;
  box-shadow: none;
}

.promo-card.promo-inactiva:hover {
  transform: none;
  box-shadow: none;
}

.promo-card.promo-inactiva::after {
  background: #9aaab2;
}

.promo-card.promo-expirada {
  opacity: 1;
  border-color: #e7a3a3;
  background: linear-gradient(145deg, #fff4f4, #ffffff 72%);
  box-shadow: 0 5px 16px rgba(166, 44, 44, 0.1);
}

.promo-card.promo-expirada::after {
  background: #c83d3d;
}

.promo-card.promo-expirada .promo-ticket-label,
.promo-card.promo-expirada .promo-desc,
.promo-card.promo-expirada .detalle-item .label,
.promo-card.promo-expirada .detalle-item .valor {
  color: #8f3333;
}

.promo-card.promo-verde-magenta:not(.promo-expirada) {
  border-color: #d7b2cf;
  background: linear-gradient(130deg, #eff9f2 0%, #fff 48%, #fcf0f8 100%);
}

.promo-card.promo-verde-magenta:not(.promo-expirada)::after {
  background: linear-gradient(180deg, #146b45, #a40b68 55%, #087653);
}

.promo-card.promo-dorada:not(.promo-expirada) {
  border-color: #d7bd79;
  background: linear-gradient(135deg, #fff9e9, #ffffff 60%, #fffdf6);
}

.promo-card.promo-dorada:not(.promo-expirada)::after {
  background: linear-gradient(180deg, #805000, #c3942b 55%, #754700);
}

.promo-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.promo-titulo {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.promo-titulo h3 {
  flex: 1 1 100%;
  margin: 2px 0 0;
  color: #0a1f38;
  font-size: 1.08rem;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.promo-ticket-label {
  color: #397e9f;
  font-size: 0.67rem;
  font-weight: 850;
  text-transform: uppercase;
}

.badge-vigente,
.badge-inactiva {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.badge-qr {
  display: inline-flex;
  align-items: center;
  padding: 4px 9px;
  border: 1px solid #bfdeea;
  border-radius: 999px;
  background: #029a6f;
  color: #f8f8f8;
  font-size: 0.68rem;
  font-weight: 800;
  white-space: nowrap;
}

.badge-vigente {
  background: #dff3eb;
  color: #176447;
}

.badge-inactiva {
  background: rgba(107, 114, 128, 0.15);
  color: #6f7891;
}

.badge-expirada {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border: 1px solid #efb2b2;
  border-radius: 999px;
  background: #fee2e2;
  color: #a32222;
  font-size: 0.68rem;
  font-weight: 850;
  white-space: nowrap;
}

.promo-acciones {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.btn-compartir {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 32px;
  padding: 0 9px;
  border: 1px solid rgba(18, 58, 102, 0.14);
  border-radius: 8px;
  background: #ffffff;
  color: #123a66;
  font: inherit;
  font-size: 0.75rem;
  font-weight: 800;
  white-space: nowrap;
  cursor: pointer;
}

.btn-compartir:hover {
  background: #eef8f7;
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

.detalle-descuento {
  margin: 4px 0 2px;
  padding: 12px;
  border: 1px dashed #9bbdcd;
  border-radius: 8px;
  background: #eaf6fa;
}

.detalle-descuento .label {
  color: #315b72;
  font-size: 0.73rem;
  font-weight: 850;
  text-transform: uppercase;
}

.chip-descuento {
  display: inline-block;
  padding: 7px 14px;
  border-radius: 6px;
  font-weight: 900;
  font-size: 1.08rem;
  color: #ffffff;
  background: linear-gradient(110deg, #123a66, #397e9f 68%, #168e83);
  border: 1px solid rgba(18, 58, 102, 0.2);
}

.promo-card.promo-inactiva .chip-descuento {
  background: rgba(107, 114, 128, 0.15);
  color: #6f7891;
  border-color: rgba(10, 31, 56, 0.08);
}

.promo-card.promo-expirada .chip-descuento {
  border-color: #efb2b2;
  background: #fee2e2;
  color: #a32222;
}

.promo-card.promo-verde-magenta:not(.promo-expirada) .detalle-descuento {
  border-color: #cba9c4;
  background: linear-gradient(110deg, #e4f4e9, #f9e8f3);
}

.promo-card.promo-verde-magenta:not(.promo-expirada) .chip-descuento {
  border-color: #a40b68;
  background: linear-gradient(110deg, #146b45, #a40b68 58%, #087653);
  color: #ffffff;
}

.promo-card.promo-dorada:not(.promo-expirada) .detalle-descuento {
  border-color: #d7bd79;
  background: linear-gradient(110deg, #fff6da, #fffdf6);
}

.promo-card.promo-dorada:not(.promo-expirada) .chip-descuento {
  border-color: #a87500;
  background: linear-gradient(110deg, #805000, #b78617 58%, #754700);
  color: #ffffff;
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

  .cupones-cabecera {
    align-items: flex-start;
    flex-direction: column;
  }

  .filtros-estado {
    flex-wrap: wrap;
  }
}
</style>
