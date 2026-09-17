<template>
  <AppShell>
    <main class="entrenamiento-page">

      <div class="ambient ambient-one"></div>
      <div class="ambient ambient-two"></div>
      <div class="neural-grid"></div>

      <header class="encabezado">

        <button
          class="volver"
          type="button"
          @click="router.replace('/tabs/configuracion')"
        >
          <ion-icon :icon="arrowBackOutline" />
          <span>Configuración</span>
        </button>

        <div class="hero">

          <div class="hero-icon">
            <div class="hero-glow"></div>
            <ion-icon :icon="sparklesOutline" />
          </div>

          <div class="hero-info">

            <div class="eyebrow">
              <span class="pulse"></span>
              CENTRO DE INTELIGENCIA
            </div>

            <h1>Entrenamiento de Burbujita</h1>

            <p>
              Alimenta su memoria con información que podrá consultar
              para responder de forma más inteligente.
            </p>

          </div>

          <div class="knowledge-status">
            <div class="status-orb">
              <span></span>
            </div>

            <div>
              <strong>Memoria activa</strong>
              <small>{{ conocimientos.length }} conocimientos</small>
            </div>
          </div>

        </div>
      </header>

      <section v-if="cargando" class="estado estado-loading">
        <div class="loader-orb">
          <ion-icon :icon="sparklesOutline" />
        </div>
        <strong>Verificando acceso</strong>
        <span>Preparando el centro de entrenamiento...</span>
      </section>

      <section v-else-if="!permitido" class="estado error">
        <div class="estado-icon">
          <ion-icon :icon="alertCircleOutline" />
        </div>

        <div>
          <strong>Acceso restringido</strong>
          <span>
            Esta sección está disponible para administradores y desarrolladores.
          </span>
        </div>
      </section>

      <template v-else>

        <section class="training-layout">

          <section class="panel formulario-panel">

            <div class="panel-header">

              <div class="panel-title">

                <div class="panel-icon">
                  <ion-icon :icon="hardwareChipOutline" />
                </div>

                <div>
                  <span class="panel-kicker">NUEVO CONOCIMIENTO</span>
                  <h2>Enseñarle algo nuevo</h2>
                  <p>
                    Crea una nueva pieza de conocimiento para la memoria de Burbujita.
                  </p>
                </div>

              </div>

              <div class="ai-badge">
                <span></span>
                IA
              </div>

            </div>

            <ol class="pasos-indicador" aria-hidden="true">

              <li
                v-for="(paso, i) in pasos"
                :key="paso.clave"
                :class="{
                  activo: i === pasoActual,
                  hecho: i < pasoActual
                }"
              >
                <span class="numero">
                  {{ i < pasoActual ? '✓' : i + 1 }}
                </span>

                <span class="etiqueta">
                  {{ paso.titulo }}
                </span>
              </li>

            </ol>

            <div class="progress-line">
              <span :style="{ width: `${((pasoActual + 1) / pasos.length) * 100}%` }"></span>
            </div>

            <div class="paso-encabezado-movil">
              <span class="paso-contador">
                PASO {{ pasoActual + 1 }} / {{ pasos.length }}
              </span>

              <h3 class="paso-titulo-movil">
                {{ pasos[pasoActual].titulo }}
              </h3>
            </div>

            <form @submit.prevent="manejarEnvio">

              <div
                class="pasos-viewport"
                @touchstart="onTouchStart"
                @touchmove="onTouchMove"
                @touchend="onTouchEnd"
              >

                <div
                  class="pasos-track"
                  :class="{ 'sin-transicion': arrastrando }"
                  :style="estiloTrack"
                >

                  <fieldset class="paso-slide">

                    <legend class="legend-desktop">
                      <span>01</span>
                      Identidad del conocimiento
                    </legend>

                    <div class="campo">

                      <label>Título</label>

                      <div class="input-shell">

                        <ion-icon :icon="bookmarkOutline" />

                        <input
                          v-model="formulario.titulo"
                          required
                          maxlength="180"
                          placeholder="Ej.: Política para prendas delicadas"
                        />

                      </div>

                      <small>
                        Dale un nombre claro para que Burbujita pueda identificarlo.
                      </small>

                    </div>

                    <div class="campo">

                      <label>Categoría</label>

                      <div class="input-shell">

                        <ion-icon :icon="pricetagOutline" />

                        <input
                          v-model="formulario.categoria"
                          maxlength="80"
                          placeholder="Ej.: políticas, uso de la app, servicios"
                        />

                      </div>

                      <small>
                        Ayuda a organizar y encontrar este conocimiento.
                      </small>

                    </div>

                  </fieldset>


                  <fieldset class="paso-slide">

                    <legend class="legend-desktop">
                      <span>02</span>
                      Palabras clave
                    </legend>

                    <div class="campo campo-grande">

                      <label>Palabras clave</label>

                      <div class="input-shell">

                        <ion-icon :icon="keyOutline" />

                        <input
                          v-model="formulario.palabrasClave"
                          maxlength="500"
                          placeholder="delicado, seda, cuidado"
                        />

                      </div>

                      <small>
                        Separa las palabras con comas para ayudar a Burbujita
                        a relacionar este conocimiento con las consultas.
                      </small>

                    </div>

                    <div class="keyword-preview">

                      <div class="keyword-preview-icon">
                        <ion-icon :icon="sparklesOutline" />
                      </div>

                      <div>
                        <strong>Asociaciones inteligentes</strong>
                        <span>
                          Estas palabras ayudan a encontrar información relacionada.
                        </span>
                      </div>

                    </div>

                  </fieldset>


                  <fieldset class="paso-slide">

                    <legend class="legend-desktop">
                      <span>03</span>
                      Información
                    </legend>

                    <div class="campo campo-contenido">

                      <label>Información que debe conocer</label>

                      <div class="textarea-shell">

                        <ion-icon :icon="documentTextOutline" />

                        <textarea
                          v-model="formulario.contenido"
                          required
                          maxlength="10000"
                          placeholder="Escribe aquí la información, procedimiento, política o conocimiento que quieres enseñarle a Burbujita..."
                        ></textarea>

                      </div>

                      <div class="textarea-footer">
                        <small>
                          Escribe la información completa y con el contexto necesario.
                        </small>

                        <span>
                          {{ formulario.contenido.length.toLocaleString() }} / 10,000
                        </span>
                      </div>

                    </div>

                  </fieldset>


                  <fieldset class="paso-slide">

                    <legend class="legend-desktop">
                      <span>04</span>
                      Revisión
                    </legend>

                    <div class="revision-card">

                      <div class="revision-top">

                        <div class="revision-icon">
                          <ion-icon :icon="sparklesOutline" />
                        </div>

                        <div>
                          <span>VISTA PREVIA</span>
                          <strong>Así recordará Burbujita este conocimiento</strong>
                        </div>

                      </div>

                      <div class="revision-content">

                        <div class="revision-title">
                          <span>Título</span>
                          <strong>
                            {{ formulario.titulo || 'Sin título' }}
                          </strong>
                        </div>

                        <div
                          v-if="formulario.categoria"
                          class="revision-category"
                        >
                          <span>Categoría</span>
                          <strong>{{ formulario.categoria }}</strong>
                        </div>

                        <div
                          v-if="formulario.palabrasClave"
                          class="revision-keywords"
                        >
                          <span>Palabras clave</span>
                          <div>
                            {{ formulario.palabrasClave }}
                          </div>
                        </div>

                        <div class="revision-text">
                          <span>Contenido</span>
                          <p>
                            {{
                              recorte(formulario.contenido, 280)
                              || 'Sin contenido aún'
                            }}
                          </p>
                        </div>

                      </div>

                    </div>

                    <label class="activo activo-card">

                      <input
                        v-model="formulario.activo"
                        type="checkbox"
                      />

                      <span class="check-custom">
                        <ion-icon :icon="checkmarkOutline" />
                      </span>

                      <span>
                        <strong>Activar este conocimiento</strong>
                        <small>
                          Burbujita podrá utilizarlo inmediatamente al responder.
                        </small>
                      </span>

                    </label>

                    <label
                      v-if="esDesarrolladorPrincipal"
                      class="activo activo-card"
                    >

                      <input
                        v-model="formulario.exclusivoDesarrollador"
                        type="checkbox"
                      />

                      <span class="check-custom">
                        <ion-icon :icon="checkmarkOutline" />
                      </span>

                      <span>
                        <strong>Exclusivo del desarrollador</strong>
                        <small>
                          Ocultar este conocimiento de los administradores. Solo tú podrás verlo y editarlo.
                        </small>
                      </span>

                    </label>

                  </fieldset>

                </div>
              </div>


              <div class="puntos-movil" aria-hidden="true">

                <span
                  v-for="(paso, i) in pasos"
                  :key="paso.clave"
                  :class="{ activo: i === pasoActual }"
                  @click="irAPaso(i)"
                ></span>

              </div>


              <transition name="message">

                <div
                  v-if="mensaje"
                  :class="{ 'mensaje-error': esError }"
                  class="mensaje"
                >

                  <ion-icon
                    :icon="
                      esError
                        ? alertCircleOutline
                        : checkmarkCircleOutline
                    "
                  />

                  <span>{{ mensaje }}</span>

                </div>

              </transition>


              <div class="nav-pasos-movil">

                <button
                  v-if="pasoActual > 0"
                  class="secundario"
                  type="button"
                  @click="pasoActual--"
                >
                  <ion-icon :icon="arrowBackOutline" />
                  Atrás
                </button>

                <span
                  v-else
                  class="secundario espaciador"
                ></span>

                <button
                  v-if="pasoActual < pasos.length - 1"
                  class="primario"
                  type="button"
                  @click="avanzarPaso"
                >
                  Siguiente
                  <ion-icon :icon="arrowForwardOutline" />
                </button>

                <button
                  v-else
                  class="primario"
                  type="submit"
                  :disabled="guardando"
                >
                  <ion-icon :icon="saveOutline" />
                  {{ guardando ? 'Guardando…' : 'Guardar aprendizaje' }}
                </button>

              </div>


              <div class="acciones-desktop">

                <button
                  class="secundario"
                  type="button"
                  @click="limpiar"
                >
                  Cancelar
                </button>

                <button
                  class="primario guardar-btn"
                  type="submit"
                  :disabled="guardando"
                >
                  <span class="guardar-icon">
                    <ion-icon :icon="saveOutline" />
                  </span>

                  <span>
                    {{ guardando ? 'Guardando…' : 'Guardar aprendizaje' }}
                  </span>

                  <ion-icon
                    v-if="!guardando"
                    :icon="arrowForwardOutline"
                  />
                </button>

              </div>

            </form>

          </section>


          <section class="panel lista-panel">

            <div class="lista-header">

              <div>

                <span class="panel-kicker">
                  MEMORIA DE BURBUJITA
                </span>

                <h2>Conocimiento guardado</h2>

                <p>
                  Todo lo que Burbujita ha aprendido desde este centro.
                </p>

              </div>

              <div class="knowledge-counter">
                <strong>{{ conocimientos.length }}</strong>
                <span>memorias</span>
              </div>

            </div>


            <div
              v-if="!conocimientos.length"
              class="vacio"
            >
              <div class="empty-orb">
                <ion-icon :icon="sparklesOutline" />
              </div>

              <strong>La memoria está esperando</strong>

              <span>
                Aún no has agregado información.
                Crea el primer conocimiento para Burbujita.
              </span>
            </div>


            <div
              v-else
              class="tarjetas-grid"
            >

              <article
                v-for="item in conocimientos"
                :key="item.id"
                class="tarjeta"
                :class="{ inactivo: !item.activo }"
              >

                <div class="tarjeta-glow"></div>

                <div class="tarjeta-encabezado">

                  <span class="badge-categoria">
                    <ion-icon :icon="pricetagOutline" />
                    {{ item.categoria || 'general' }}
                  </span>

                  <span
                    v-if="!item.activo"
                    class="badge-inactivo"
                  >
                    Inactivo
                  </span>

                  <span
                    v-else
                    class="badge-activo"
                  >
                    <span></span>
                    Activo
                  </span>

                </div>


                <div class="memory-symbol">
                  <ion-icon :icon="hardwareChipOutline" />
                </div>


                <h3 class="tarjeta-titulo">
                  {{ item.titulo }}
                </h3>


                <p
                  class="tarjeta-contenido"
                  :class="{ expandido: expandidos.has(item.id) }"
                >
                  {{ item.contenido }}
                </p>


                <button
                  v-if="esLargo(item.contenido)"
                  class="ver-mas"
                  type="button"
                  @click="alternarExpandido(item.id)"
                >
                  {{ expandidos.has(item.id) ? 'Ver menos' : 'Leer conocimiento' }}

                  <ion-icon
                    :icon="arrowForwardOutline"
                    :class="{ rotated: expandidos.has(item.id) }"
                  />
                </button>


                <div
                  v-if="item.palabrasClave"
                  class="tarjeta-keywords"
                >
                  <ion-icon :icon="keyOutline" />
                  <span>{{ item.palabrasClave }}</span>
                </div>


                <div class="item-acciones">

                  <button
                    type="button"
                    @click="editar(item)"
                  >
                    <ion-icon :icon="createOutline" />
                    Editar
                  </button>

                  <button
                    class="eliminar"
                    type="button"
                    @click="eliminar(item)"
                  >
                    <ion-icon :icon="trashOutline" />
                    Eliminar
                  </button>

                </div>

              </article>

            </div>

          </section>

        </section>

      </template>
    </main>


    <teleport to="body">

      <div
        v-if="modalAbierto"
        class="modal-fondo"
        @click.self="cerrarModal"
      >

        <div
          class="modal-caja"
          role="dialog"
          aria-modal="true"
          aria-label="Editar aprendizaje"
        >

          <div class="modal-top-glow"></div>

          <div class="modal-encabezado">

            <div class="modal-title">

              <div class="modal-icon">
                <ion-icon :icon="hardwareChipOutline" />
              </div>

              <div>
                <span>MEMORIA DE BURBUJITA</span>
                <h2>Editar aprendizaje</h2>
              </div>

            </div>

            <button
              class="modal-cerrar"
              type="button"
              @click="cerrarModal"
              aria-label="Cerrar"
            >
              ✕
            </button>

          </div>


          <form
            class="modal-form"
            @submit.prevent="guardarEdicion"
          >

            <div class="modal-campo">

              <label>Título</label>

              <div class="input-shell">

                <ion-icon :icon="bookmarkOutline" />

                <input
                  v-model="formularioEdicion.titulo"
                  required
                  maxlength="180"
                  placeholder="Ej.: Política para prendas delicadas"
                />

              </div>

            </div>


            <div class="modal-row">

              <div class="modal-campo">

                <label>Categoría</label>

                <div class="input-shell">

                  <ion-icon :icon="pricetagOutline" />

                  <input
                    v-model="formularioEdicion.categoria"
                    maxlength="80"
                    placeholder="Categoría"
                  />

                </div>

              </div>

              <div class="modal-campo">

                <label>Palabras clave</label>

                <div class="input-shell">

                  <ion-icon :icon="keyOutline" />

                  <input
                    v-model="formularioEdicion.palabrasClave"
                    maxlength="500"
                    placeholder="palabra, palabra"
                  />

                </div>

              </div>

            </div>


            <div class="modal-campo">

              <label>Información que debe conocer</label>

              <div class="textarea-shell">

                <ion-icon :icon="documentTextOutline" />

                <textarea
                  v-model="formularioEdicion.contenido"
                  required
                  maxlength="10000"
                  placeholder="Escribe la información..."
                ></textarea>

              </div>

            </div>


            <label class="activo activo-card">

              <input
                v-model="formularioEdicion.activo"
                type="checkbox"
              />

              <span class="check-custom">
                <ion-icon :icon="checkmarkOutline" />
              </span>

              <span>
                <strong>Usar este aprendizaje</strong>
                <small>
                  Permitir que Burbujita lo utilice en sus respuestas.
                </small>
              </span>

            </label>

            <label
              v-if="esDesarrolladorPrincipal"
              class="activo activo-card"
            >

              <input
                v-model="formularioEdicion.exclusivoDesarrollador"
                type="checkbox"
              />

              <span class="check-custom">
                <ion-icon :icon="checkmarkOutline" />
              </span>

              <span>
                <strong>Exclusivo del desarrollador</strong>
                <small>
                  Ocultar este conocimiento de los administradores. Solo tú podrás verlo y editarlo.
                </small>
              </span>

            </label>

            <label
              v-if="esDesarrolladorPrincipal"
              class="activo activo-card"
            >

              <input
                v-model="formulario.exclusivoDesarrollador"
                type="checkbox"
              />

              <span class="check-custom">
                <ion-icon :icon="checkmarkOutline" />
              </span>

              <span>
                <strong>Exclusivo del desarrollador</strong>
                <small>
                  Ocultar este conocimiento de los administradores. Solo tú podrás verlo y editarlo.
                </small>
              </span>

            </label>


            <transition name="message">

              <div
                v-if="mensajeEdicion"
                :class="{ 'mensaje-error': edicionEsError }"
                class="mensaje"
              >
                <ion-icon
                  :icon="
                    edicionEsError
                      ? alertCircleOutline
                      : checkmarkCircleOutline
                  "
                />

                <span>{{ mensajeEdicion }}</span>
              </div>

            </transition>


            <div class="modal-acciones">

              <button
                class="secundario"
                type="button"
                @click="cerrarModal"
              >
                Cancelar
              </button>

              <button
                class="primario guardar-btn"
                type="submit"
                :disabled="edicionGuardando"
              >
                <ion-icon :icon="saveOutline" />
                {{ edicionGuardando ? 'Guardando…' : 'Actualizar' }}
              </button>

            </div>

          </form>

        </div>

      </div>

      <!-- Modal de confirmación de eliminación -->
      <div
        v-if="modalEliminarAbierto"
        class="modal-fondo"
        @click.self="cerrarModalEliminar"
      >
        <div
          class="modal-caja modal-pequeno"
          role="dialog"
          aria-modal="true"
          aria-label="Confirmar eliminación"
        >
          <div class="modal-top-glow"></div>

          <div class="modal-encabezado">
            <div class="modal-title">
              <div class="modal-icon modal-icon-peligro">
                <ion-icon :icon="alertCircleOutline" />
              </div>
              <div>
                <span>CONFIRMACIÓN</span>
                <h2>Eliminar aprendizaje</h2>
              </div>
            </div>
            <button
              class="modal-cerrar"
              type="button"
              @click="cerrarModalEliminar"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>

          <div class="modal-contenido-confirmacion">
            <p>
              ¿Estás seguro de que deseas eliminar este aprendizaje de Burbujita?
              Esta acción no se puede deshacer.
            </p>
            <div v-if="itemAEliminar" class="item-confirmacion">
              <strong>{{ itemAEliminar.titulo }}</strong>
              <span>{{ itemAEliminar.categoria || 'Sin categoría' }}</span>
            </div>
          </div>

          <transition name="message">
            <div
              v-if="mensajeEliminar"
              :class="{ 'mensaje-error': eliminarEsError }"
              class="mensaje"
            >
              <ion-icon
                :icon="eliminarEsError ? alertCircleOutline : checkmarkCircleOutline"
              />
              <span>{{ mensajeEliminar }}</span>
            </div>
          </transition>

          <div class="modal-acciones">
            <button
              class="secundario"
              type="button"
              @click="cerrarModalEliminar"
              :disabled="eliminando"
            >
              Cancelar
            </button>
            <button
              class="peligro"
              type="button"
              @click="confirmarEliminacion"
              :disabled="eliminando"
            >
              <ion-icon :icon="trashOutline" />
              {{ eliminando ? 'Eliminando…' : 'Eliminar' }}
            </button>
          </div>
        </div>
      </div>

    </teleport>
  </AppShell>
</template>


<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  arrowBackOutline,
  arrowForwardOutline,
  sparklesOutline,
  hardwareChipOutline,
  bookmarkOutline,
  pricetagOutline,
  keyOutline,
  documentTextOutline,
  checkmarkOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  saveOutline,
  createOutline,
  trashOutline
} from 'ionicons/icons'
import AppShell from '@/components/AppShell.vue'
import { useSesion } from '@/composables/useSesion'
import { getApiBaseUrl } from '@/composables/useApiConfig'

type Conocimiento = {
  id: string
  titulo: string
  contenido: string
  categoria: string
  palabrasClave: string
  activo: boolean
  creadoPor?: string
  usuarioId?: string
  exclusivoDesarrollador?: boolean
}

const router = useRouter()
const { usuarioActual } = useSesion()

const cargando = ref(true)
const permitido = ref(false)
const guardando = ref(false)
const editandoId = ref('')
const conocimientos = ref<Conocimiento[]>([])
const mensaje = ref('')
const esError = ref(false)
const expandidos = ref(new Set<string>())

const formulario = reactive({
  titulo: '',
  contenido: '',
  categoria: '',
  palabrasClave: '',
  activo: true,
  exclusivoDesarrollador: false
})

const modalAbierto = ref(false)
const edicionGuardando = ref(false)
const mensajeEdicion = ref('')
const edicionEsError = ref(false)

const modalEliminarAbierto = ref(false)
const itemAEliminar = ref<Conocimiento | null>(null)
const eliminando = ref(false)
const mensajeEliminar = ref('')
const eliminarEsError = ref(false)

const formularioEdicion = reactive({
  titulo: '',
  contenido: '',
  categoria: '',
  palabrasClave: '',
  activo: true,
  exclusivoDesarrollador: false
})

const pasos = [
  { clave: 'titulo', titulo: 'Título' },
  { clave: 'palabras', titulo: 'Palabras clave' },
  { clave: 'contenido', titulo: 'Contenido' },
  { clave: 'revision', titulo: 'Revisión' }
]

const pasoActual = ref(0)

const esDesarrolladorPrincipal = computed(() => {
  const nombre = usuarioActual.value?.nombre?.toLowerCase() || ''
  const rol = usuarioActual.value?.rol?.toLowerCase() || ''
  return nombre === 'desarrollador' || rol === 'developer' || rol === 'desarrollador'
})

const avanzarPaso = () => {
  if (
    pasoActual.value === 0 &&
    !formulario.titulo.trim()
  ) {
    mensaje.value = 'Escribe un título antes de continuar.'
    esError.value = true
    return
  }

  if (
    pasoActual.value === 2 &&
    !formulario.contenido.trim()
  ) {
    mensaje.value = 'Escribe el contenido antes de continuar.'
    esError.value = true
    return
  }

  mensaje.value = ''
  esError.value = false

  if (pasoActual.value < pasos.length - 1) {
    pasoActual.value++
  }
}

const irAPaso = (i: number) => {
  if (i <= pasoActual.value) {
    pasoActual.value = i
  }
}

const arrastrando = ref(false)
const desplazamientoArrastre = ref(0)

let inicioX = 0

const onTouchStart = (e: TouchEvent) => {
  inicioX = e.touches[0].clientX
  arrastrando.value = true
  desplazamientoArrastre.value = 0
}

const onTouchMove = (e: TouchEvent) => {
  if (!arrastrando.value) return

  let delta = e.touches[0].clientX - inicioX

  if (
    (pasoActual.value === 0 && delta > 0) ||
    (pasoActual.value === pasos.length - 1 && delta < 0)
  ) {
    delta *= 0.35
  }

  desplazamientoArrastre.value = delta
}

const onTouchEnd = () => {
  const umbral = 55

  if (
    desplazamientoArrastre.value < -umbral &&
    pasoActual.value < pasos.length - 1
  ) {
    if (
      pasoActual.value === 0 &&
      !formulario.titulo.trim()
    ) {
      mensaje.value = 'Escribe un título antes de continuar.'
      esError.value = true
    } else if (
      pasoActual.value === 2 &&
      !formulario.contenido.trim()
    ) {
      mensaje.value = 'Escribe el contenido antes de continuar.'
      esError.value = true
    } else {
      mensaje.value = ''
      esError.value = false
      pasoActual.value++
    }
  } else if (
    desplazamientoArrastre.value > umbral &&
    pasoActual.value > 0
  ) {
    pasoActual.value--
  }

  arrastrando.value = false
  desplazamientoArrastre.value = 0
}

const estiloTrack = computed(() => ({
  transform: `translateX(calc(${-pasoActual.value * 100}% + ${desplazamientoArrastre.value}px))`
}))

const recorte = (
  texto: string,
  limite: number
) =>
  texto && texto.length > limite
    ? texto.slice(0, limite).trimEnd() + '…'
    : texto

const esLargo = (texto: string) =>
  Boolean(texto && texto.length > 180)

const alternarExpandido = (id: string) => {
  if (expandidos.value.has(id)) {
    expandidos.value.delete(id)
  } else {
    expandidos.value.add(id)
  }

  expandidos.value = new Set(expandidos.value)
}

const usuarioId = () =>
  usuarioActual.value?.id || ''

const headers = () => ({
  'Content-Type': 'application/json',
  'x-user-id': usuarioActual.value?.id ?? '',
  'x-user-name': usuarioActual.value?.nombre ?? '',
  'x-user-role': usuarioActual.value?.rol ?? ''
})

const api = () =>
  `${getApiBaseUrl()}/sali/conocimiento`

const limpiar = () => {
  Object.assign(formulario, {
    titulo: '',
    contenido: '',
    categoria: '',
    palabrasClave: '',
    activo: true,
    exclusivoDesarrollador: false
  })

  mensaje.value = ''
  esError.value = false
  pasoActual.value = 0
}

const cargar = async () => {
  const respuesta = await fetch(
    `${api()}?usuarioId=${encodeURIComponent(usuarioId())}`,
    {
      headers: headers()
    }
  )

  if (!respuesta.ok) {
    throw new Error(
      (await respuesta.json())?.error ||
      'No se pudo cargar el conocimiento.'
    )
  }

  // El backend ya hace el filtrado adecuado:
  // - Desarrollador: ve TODOS los conocimientos
  // - Administradores: solo ven sus propios conocimientos
  conocimientos.value = await respuesta.json()
}

const manejarEnvio = async () => {
  await guardarNuevo()
}

const guardarNuevo = async () => {
  if (
    !formulario.titulo.trim() ||
    !formulario.contenido.trim()
  ) {
    mensaje.value =
      'Completa título y contenido antes de guardar.'

    esError.value = true
    return
  }

  guardando.value = true
  mensaje.value = ''
  esError.value = false

  try {
    // Si es desarrollador y marca exclusivo, asignar a 'dev-mode'
    // Si no, asignar al usuario actual
    const usuarioIdFinal = esDesarrolladorPrincipal.value && formulario.exclusivoDesarrollador
      ? 'dev-mode'
      : usuarioId()

    const respuesta = await fetch(
      api(),
      {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          ...formulario,
          usuarioId: usuarioIdFinal,
          creadoPor: usuarioActual.value?.nombre || 'Usuario'
        })
      }
    )

    if (!respuesta.ok) {
      throw new Error(
        (await respuesta.json())?.error ||
        'No se pudo guardar.'
      )
    }

    Object.assign(formulario, {
      titulo: '',
      contenido: '',
      categoria: '',
      palabrasClave: '',
      activo: true,
      exclusivoDesarrollador: false
    })

    pasoActual.value = 0

    mensaje.value =
      'Información guardada. Burbujita ya podrá consultarla.'

    esError.value = false

    await cargar()

  } catch (error) {

    mensaje.value =
      error instanceof Error
        ? error.message
        : 'No se pudo guardar.'

    esError.value = true

  } finally {
    guardando.value = false
  }
}

const editar = (item: Conocimiento) => {
  editandoId.value = item.id

  Object.assign(
    formularioEdicion,
    {
      ...item,
      exclusivoDesarrollador: item.usuarioId === 'dev-mode' // Si es del desarrollador, marcar como exclusivo
    }
  )

  mensajeEdicion.value = ''
  edicionEsError.value = false
  modalAbierto.value = true
}

const cerrarModal = () => {
  modalAbierto.value = false
  editandoId.value = ''
  mensajeEdicion.value = ''
  edicionEsError.value = false
}

const guardarEdicion = async () => {
  if (
    !formularioEdicion.titulo.trim() ||
    !formularioEdicion.contenido.trim()
  ) {
    mensajeEdicion.value =
      'Completa título y contenido antes de guardar.'

    edicionEsError.value = true
    return
  }

  edicionGuardando.value = true
  mensajeEdicion.value = ''
  edicionEsError.value = false

  try {
    // Si es desarrollador y marca exclusivo, asignar a 'dev-mode'
    // Si no, asignar al usuario actual
    const usuarioIdFinal = esDesarrolladorPrincipal.value && formularioEdicion.exclusivoDesarrollador
      ? 'dev-mode'
      : usuarioId()

    const respuesta = await fetch(
      `${api()}/${editandoId.value}`,
      {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify({
          ...formularioEdicion,
          usuarioId: usuarioIdFinal
        })
      }
    )

    if (!respuesta.ok) {
      throw new Error(
        (await respuesta.json())?.error ||
        'No se pudo guardar.'
      )
    }

    cerrarModal()

    await cargar()

  } catch (error) {

    mensajeEdicion.value =
      error instanceof Error
        ? error.message
        : 'No se pudo guardar.'

    edicionEsError.value = true

  } finally {
    edicionGuardando.value = false
  }
}

const eliminar = (item: Conocimiento) => {
  itemAEliminar.value = item
  modalEliminarAbierto.value = true
  mensajeEliminar.value = ''
  eliminarEsError.value = false
}

const cerrarModalEliminar = () => {
  modalEliminarAbierto.value = false
  itemAEliminar.value = null
  mensajeEliminar.value = ''
  eliminarEsError.value = false
}

const confirmarEliminacion = async () => {
  if (!itemAEliminar.value) return

  eliminando.value = true
  mensajeEliminar.value = ''
  eliminarEsError.value = false

  try {
    const respuesta = await fetch(
      `${api()}/${itemAEliminar.value.id}`,
      {
        method: 'DELETE',
        headers: headers(),
        body: JSON.stringify({
          usuarioId: usuarioId()
        })
      }
    )

    if (!respuesta.ok) {
      throw new Error(
        (await respuesta.json())?.error ||
        'No se pudo eliminar.'
      )
    }

    cerrarModalEliminar()
    await cargar()

  } catch (error) {

    mensajeEliminar.value =
      error instanceof Error
        ? error.message
        : 'No se pudo eliminar.'

    eliminarEsError.value = true

  } finally {
    eliminando.value = false
  }
}

onMounted(async () => {

  try {

    const respuesta = await fetch(
      `${getApiBaseUrl()}/sali/acceso?usuarioId=${encodeURIComponent(usuarioId())}`,
      {
        headers: headers()
      }
    )

    const resultado = await respuesta.json()
    
    // Permitir acceso tanto a desarrolladores como a administradores
    permitido.value = Boolean(resultado.permitido) || Boolean(resultado.esAdministrador)

    if (permitido.value) {
      await cargar()
    }

  } finally {
    cargando.value = false
  }
})
</script>


<style scoped>

.entrenamiento-page {
  --navy: #071a2d;
  --navy-soft: #123a5a;
  --blue: #2676c9;
  --cyan: #19b7ad;
  --cyan-light: #5de4d9;
  --green: #19aa78;
  --red: #c43838;
  --gold: #d89b26;
  --text: #122d45;
  --muted: #718499;
  --line: rgba(8, 35, 57, 0.08);

  position: relative;

  max-width: 1180px;

  margin: 0 auto;

  padding: 18px 22px 110px;

  display: grid;

  gap: 22px;

  color: var(--text);

  overflow: hidden;
}

.ambient {
  position: absolute;

  border-radius: 50%;

  pointer-events: none;

  filter: blur(80px);

  opacity: .12;
}

.ambient-one {
  width: 320px;
  height: 320px;

  top: -170px;
  right: 5%;

  background: #16bcb2;
}

.ambient-two {
  width: 260px;
  height: 260px;

  bottom: 5%;
  left: -140px;

  background: #2879ca;
}

.neural-grid {
  position: absolute;

  inset: 0;

  pointer-events: none;

  opacity: .45;

  background-image:
    linear-gradient(
      rgba(25,183,173,.035) 1px,
      transparent 1px
    ),
    linear-gradient(
      90deg,
      rgba(25,183,173,.035) 1px,
      transparent 1px
    );

  background-size: 38px 38px;

  mask-image: linear-gradient(
    to bottom,
    black,
    transparent 75%
  );
}

.encabezado {
  position: relative;

  z-index: 2;

  display: grid;

  gap: 14px;
}

.volver {
  justify-self: start;

  display: inline-flex;

  align-items: center;

  gap: 7px;

  border: 0;

  padding: 5px 0;

  background: transparent;

  color: #4d6880;

  font-size: .72rem;

  font-weight: 800;

  cursor: pointer;

  transition: color .2s ease, transform .2s ease;
}

.volver:hover {
  color: var(--cyan);

  transform: translateX(-3px);
}

.hero {
  display: flex;

  align-items: center;

  gap: 16px;
}

.hero-icon {
  position: relative;

  display: flex;

  align-items: center;
  justify-content: center;

  width: 62px;
  height: 62px;

  flex-shrink: 0;

  border-radius: 19px;

  background:
    linear-gradient(
      145deg,
      #0d4267,
      #117c82
    );

  color: white;

  font-size: 29px;

  box-shadow:
    0 14px 35px rgba(13, 66, 103, .2);
}

.hero-glow {
  position: absolute;

  inset: -7px;

  border-radius: 25px;

  background:
    linear-gradient(
      135deg,
      rgba(25,183,173,.4),
      transparent
    );

  filter: blur(12px);

  z-index: -1;
}

.hero-info {
  flex: 1;
}

.eyebrow {
  display: flex;

  align-items: center;

  gap: 7px;

  margin-bottom: 3px;

  color: var(--cyan);

  font-size: .63rem;

  font-weight: 900;

  letter-spacing: .13em;
}

.pulse {
  width: 6px;
  height: 6px;

  border-radius: 50%;

  background: var(--cyan);

  box-shadow:
    0 0 0 4px rgba(25,183,173,.09),
    0 0 13px rgba(25,183,173,.6);
}

.encabezado h1 {
  margin: 0 0 4px;

  color: var(--navy);

  font-size: 1.75rem;

  line-height: 1.15;

  font-weight: 900;

  letter-spacing: -.045em;
}

.encabezado > div > div > p,
.hero-info > p {
  margin: 0;

  color: var(--muted);

  font-size: .82rem;

  line-height: 1.5;
}

.knowledge-status {
  display: flex;

  align-items: center;

  gap: 9px;

  padding: 9px 13px;

  border: 1px solid rgba(25,170,120,.13);

  border-radius: 13px;

  background: rgba(255,255,255,.78);

  box-shadow:
    0 6px 20px rgba(8,35,57,.05);
}

.status-orb {
  display: flex;

  align-items: center;
  justify-content: center;

  width: 29px;
  height: 29px;

  border-radius: 10px;

  background: rgba(25,170,120,.09);
}

.status-orb span {
  width: 7px;
  height: 7px;

  border-radius: 50%;

  background: var(--green);

  box-shadow:
    0 0 11px rgba(25,170,120,.55);
}

.knowledge-status strong,
.knowledge-status small {
  display: block;
}

.knowledge-status strong {
  color: var(--navy);

  font-size: .66rem;

  font-weight: 850;
}

.knowledge-status small {
  margin-top: 2px;

  color: #8294a4;

  font-size: .57rem;
}

.training-layout {
  position: relative;

  z-index: 2;

  display: grid;

  grid-template-columns: minmax(0, 1.15fr) minmax(320px, .85fr);

  align-items: start;

  gap: 20px;
}

.panel,
.estado {
  border: 1px solid rgba(8,35,57,.08);

  border-radius: 23px;

  background:
    linear-gradient(
      145deg,
      rgba(255,255,255,.98),
      rgba(249,252,253,.96)
    );

  box-shadow:
    0 20px 50px rgba(8,35,57,.07),
    0 3px 10px rgba(8,35,57,.025);
}

.formulario-panel {
  position: relative;

  padding: 25px;

  overflow: hidden;
}

.formulario-panel::before {
  content: '';

  position: absolute;

  top: 0;
  left: 9%;

  width: 82%;
  height: 2px;

  background:
    linear-gradient(
      90deg,
      transparent,
      var(--cyan),
      #4d9bd0,
      var(--cyan),
      transparent
    );

  opacity: .75;
}

.panel-header {
  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 15px;
}

.panel-title {
  display: flex;

  align-items: center;

  gap: 13px;
}

.panel-icon {
  display: flex;

  align-items: center;
  justify-content: center;

  width: 45px;
  height: 45px;

  flex-shrink: 0;

  border-radius: 14px;

  background:
    linear-gradient(
      145deg,
      rgba(25,183,173,.12),
      rgba(38,118,201,.07)
    );

  color: var(--cyan);

  font-size: 21px;
}

.panel-kicker {
  display: block;

  margin-bottom: 3px;

  color: #8a9baa;

  font-size: .55rem;

  font-weight: 900;

  letter-spacing: .13em;
}

.panel-title h2,
.lista-header h2 {
  margin: 0;

  color: var(--navy);

  font-size: 1.08rem;

  font-weight: 850;

  letter-spacing: -.02em;
}

.panel-title p,
.lista-header p {
  margin: 4px 0 0;

  color: var(--muted);

  font-size: .67rem;

  line-height: 1.45;
}

.ai-badge {
  display: flex;

  align-items: center;

  gap: 6px;

  padding: 5px 8px;

  border: 1px solid rgba(25,183,173,.13);

  border-radius: 7px;

  background: rgba(25,183,173,.055);

  color: var(--cyan);

  font-size: .53rem;

  font-weight: 900;

  letter-spacing: .08em;
}

.ai-badge span {
  width: 5px;
  height: 5px;

  border-radius: 50%;

  background: var(--cyan);

  box-shadow:
    0 0 9px rgba(25,183,173,.7);
}

.pasos-indicador {
  display: flex;

  list-style: none;

  margin: 24px 0 0;

  padding: 0;

  gap: 5px;
}

.pasos-indicador li {
  display: flex;

  align-items: center;

  gap: 6px;

  flex: 1;

  color: #9aaab9;

  font-size: .58rem;

  font-weight: 850;
}

.pasos-indicador .numero {
  display: flex;

  align-items: center;
  justify-content: center;

  width: 24px;
  height: 24px;

  flex-shrink: 0;

  border-radius: 50%;

  background: #edf2f6;

  color: #6e8397;

  font-size: .58rem;

  transition: all .25s ease;
}

.pasos-indicador li.activo {
  color: var(--navy);
}

.pasos-indicador li.activo .numero {
  background:
    linear-gradient(
      145deg,
      #123e61,
      #137d82
    );

  color: white;

  box-shadow:
    0 5px 12px rgba(19,125,130,.2);
}

.pasos-indicador li.hecho {
  color: #19906d;
}

.pasos-indicador li.hecho .numero {
  background: #e1f7ee;

  color: #15936e;
}

.progress-line {
  display: none;

  height: 2px;

  margin-top: 9px;

  border-radius: 5px;

  background: #edf2f5;

  overflow: hidden;
}

.progress-line span {
  display: block;

  height: 100%;

  border-radius: inherit;

  background:
    linear-gradient(
      90deg,
      var(--cyan),
      #3c8cc3
    );

  transition: width .3s ease;
}

.formulario-panel form {
  margin-top: 22px;

  display: grid;

  gap: 10px;
}

.pasos-viewport {
  overflow: hidden;

  position: relative;
}

.pasos-track {
  display: flex;

  width: 100%;

  transition: transform .3s ease;
}

.pasos-track.sin-transicion {
  transition: none;
}

.paso-slide {
  width: 100%;

  flex-shrink: 0;

  border: 0;

  margin: 0;

  padding: 0 2px;

  display: grid;

  gap: 13px;

  align-content: start;
}

.legend-desktop {
  display: flex;

  align-items: center;

  gap: 7px;

  padding: 0;

  margin-bottom: 1px;

  color: #71879b;

  font-size: .59rem;

  font-weight: 900;

  letter-spacing: .1em;

  text-transform: uppercase;
}

.legend-desktop span {
  display: inline-flex;

  align-items: center;
  justify-content: center;

  width: 20px;
  height: 20px;

  border-radius: 6px;

  background: rgba(25,183,173,.08);

  color: var(--cyan);

  font-size: .52rem;
}

.campo {
  display: grid;

  gap: 6px;
}

.campo label,
.modal-campo label {
  color: #526a7f;

  font-size: .65rem;

  font-weight: 850;
}

.campo small {
  color: #91a0ae;

  font-size: .57rem;

  line-height: 1.4;
}

.input-shell,
.textarea-shell {
  display: flex;

  align-items: center;

  gap: 9px;

  border: 1px solid rgba(8,35,57,.11);

  border-radius: 11px;

  background: #f8fafc;

  transition:
    border-color .2s ease,
    background .2s ease,
    box-shadow .2s ease;
}

.input-shell {
  padding: 0 12px;
}

.input-shell > ion-icon,
.textarea-shell > ion-icon {
  flex-shrink: 0;

  color: #9aacba;

  font-size: 16px;
}

.input-shell:focus-within,
.textarea-shell:focus-within {
  border-color: rgba(25,183,173,.55);

  background: white;

  box-shadow:
    0 0 0 3px rgba(25,183,173,.08);
}

input:not([type="checkbox"]),
textarea {
  width: 100%;

  box-sizing: border-box;

  border: 0;

  outline: 0;

  background: transparent;

  color: var(--navy);

  font: inherit;

  font-size: .74rem;

  font-weight: 600;
}

input:not([type="checkbox"]) {
  padding: 11px 0;
}

textarea {
  min-height: 175px;

  padding: 13px 0;

  resize: vertical;

  line-height: 1.5;
}

input::placeholder,
textarea::placeholder {
  color: #a8b5c0;

  font-weight: 500;
}

.keyword-preview {
  display: flex;

  align-items: center;

  gap: 10px;

  padding: 12px;

  border: 1px dashed rgba(25,183,173,.18);

  border-radius: 12px;

  background: rgba(25,183,173,.035);
}

.keyword-preview-icon {
  display: flex;

  align-items: center;
  justify-content: center;

  width: 30px;
  height: 30px;

  flex-shrink: 0;

  border-radius: 9px;

  background: rgba(25,183,173,.09);

  color: var(--cyan);
}

.keyword-preview strong,
.keyword-preview span {
  display: block;
}

.keyword-preview strong {
  color: #35536d;

  font-size: .62rem;

  font-weight: 850;
}

.keyword-preview span {
  margin-top: 2px;

  color: #8798a7;

  font-size: .57rem;
}

.textarea-footer {
  display: flex;

  justify-content: space-between;

  gap: 10px;
}

.textarea-footer small {
  color: #91a0ae;

  font-size: .57rem;
}

.textarea-footer span {
  color: #8a9aaa;

  font-size: .55rem;

  font-weight: 800;
}

.revision-card {
  border: 1px solid rgba(25,183,173,.12);

  border-radius: 15px;

  overflow: hidden;

  background:
    linear-gradient(
      145deg,
      #f5fbfa,
      #fafcfd
    );
}

.revision-top {
  display: flex;

  align-items: center;

  gap: 10px;

  padding: 13px;

  border-bottom: 1px solid rgba(8,35,57,.06);
}

.revision-icon {
  display: flex;

  align-items: center;
  justify-content: center;

  width: 35px;
  height: 35px;

  border-radius: 10px;

  background: rgba(25,183,173,.1);

  color: var(--cyan);
}

.revision-top span,
.revision-top strong {
  display: block;
}

.revision-top span {
  margin-bottom: 2px;

  color: var(--cyan);

  font-size: .5rem;

  font-weight: 900;

  letter-spacing: .08em;
}

.revision-top strong {
  color: #24435d;

  font-size: .66rem;
}

.revision-content {
  display: grid;

  gap: 11px;

  padding: 14px;
}

.revision-content span {
  display: block;

  margin-bottom: 3px;

  color: #8b9aa8;

  font-size: .51rem;

  font-weight: 800;

  text-transform: uppercase;

  letter-spacing: .06em;
}

.revision-title strong {
  color: var(--navy);

  font-size: .84rem;
}

.revision-category strong {
  color: var(--cyan);

  font-size: .62rem;
}

.revision-keywords div {
  color: #61798e;

  font-size: .61rem;
}

.revision-text p {
  margin: 0;

  color: #647a8d;

  font-size: .65rem;

  line-height: 1.5;

  white-space: pre-line;
}

.activo {
  display: flex !important;

  align-items: center;

  gap: 9px;

  cursor: pointer;
}

.activo input {
  position: absolute;

  opacity: 0;

  pointer-events: none;
}

.activo-card {
  padding: 11px 12px;

  border: 1px solid rgba(25,170,120,.12);

  border-radius: 12px;

  background: rgba(25,170,120,.035);
}

.check-custom {
  display: flex;

  align-items: center;
  justify-content: center;

  width: 22px;
  height: 22px;

  flex-shrink: 0;

  border: 2px solid #bdccd7;

  border-radius: 6px;

  background: #f8f9fa;

  color: #a0b3c0;

  font-size: 14px;

  transition: all .2s ease;
}

.activo:hover .check-custom {
  border-color: #9eb5c4;
  background: #f0f4f7;
}

.activo input:checked + .check-custom {
  border-color: #19aa78;

  background: #19aa78;

  color: white;

  box-shadow:
    0 3px 9px rgba(25,170,120,.3);
}

.activo-card strong,
.activo-card small {
  display: block;
}

.activo-card strong {
  color: #36536b;

  font-size: .63rem;
}

.activo-card small {
  margin-top: 2px;

  color: #899aa9;

  font-size: .55rem;
}

.paso-encabezado-movil {
  display: none;
}

.puntos-movil {
  display: none;
}

.nav-pasos-movil {
  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 9px;

  margin-top: 9px;
}

.mensaje {
  display: flex;

  align-items: center;

  gap: 8px;

  padding: 10px 12px;

  border: 1px solid #bce8db;

  border-radius: 10px;

  background: #effbf7;

  color: #16745f;

  font-size: .64rem;

  font-weight: 750;
}

.mensaje ion-icon {
  font-size: 17px;

  flex-shrink: 0;
}

.mensaje-error {
  border-color: #f0c1c1;

  background: #fff6f6;

  color: #a92d2d;
}

.acciones-desktop {
  display: flex;

  justify-content: flex-end;

  gap: 9px;

  padding-top: 17px;

  border-top: 1px solid rgba(8,35,57,.06);
}

.acciones-desktop .guardar-btn {
  display: none;
}

.primario,
.secundario,
.item-acciones button {
  display: inline-flex;

  align-items: center;
  justify-content: center;

  gap: 7px;

  min-height: 39px;

  padding: 0 14px;

  border-radius: 10px;

  border: 0;

  font-size: .65rem;

  font-weight: 850;

  cursor: pointer;

  transition:
    transform .2s ease,
    box-shadow .2s ease,
    background .2s ease;
}

.primario {
  background:
    linear-gradient(
      135deg,
      #103d60,
      #117982
    );

  color: white;

  box-shadow:
    0 7px 18px rgba(16,61,96,.18);
}

.primario:hover:not(:disabled) {
  transform: translateY(-2px);

  box-shadow:
    0 10px 24px rgba(16,61,96,.25);
}

.secundario,
.item-acciones button {
  background: #edf3f7;

  color: #38546c;
}

.secundario:hover,
.item-acciones button:hover {
  background: #e5edf2;

  transform: translateY(-1px);
}

.guardar-btn {
  padding-right: 9px;
}

.guardar-icon {
  display: flex;

  align-items: center;
  justify-content: center;

  width: 22px;
  height: 22px;

  border-radius: 7px;

  background: rgba(255,255,255,.12);
}

.primario:disabled {
  opacity: .55;

  cursor: default;
}

.lista-panel {
  padding: 23px;

  display: grid;

  gap: 17px;
}

.lista-header {
  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 15px;
}

.knowledge-counter {
  display: flex;

  align-items: center;

  gap: 7px;

  padding: 7px 10px;

  border: 1px solid rgba(25,183,173,.13);

  border-radius: 10px;

  background: rgba(25,183,173,.04);
}

.knowledge-counter strong {
  color: var(--cyan);

  font-size: .85rem;

  font-weight: 900;
}

.knowledge-counter span {
  color: #8293a3;

  font-size: .55rem;

  font-weight: 750;
}

.tarjetas-grid {
  display: grid;

  grid-template-columns: 1fr;

  gap: 12px;

  max-height: 700px;

  overflow-y: auto;

  padding-right: 3px;
}

.tarjetas-grid::-webkit-scrollbar {
  width: 4px;
}

.tarjetas-grid::-webkit-scrollbar-thumb {
  border-radius: 5px;

  background: #ccd8df;
}

.tarjeta {
  position: relative;

  display: grid;

  gap: 8px;

  align-content: start;

  padding: 16px;

  border: 1px solid rgba(8,35,57,.08);

  border-radius: 15px;

  background: white;

  overflow: visible;

  transition:
    transform .22s ease,
    box-shadow .22s ease,
    border-color .22s ease;
}

.tarjeta:hover {
  transform: translateY(-2px);

  border-color: rgba(25,183,173,.17);

  box-shadow:
    0 12px 28px rgba(8,35,57,.07);
}

.tarjeta-glow {
  position: absolute;

  top: 0;
  left: 0;

  width: 100%;
  height: 2px;

  background:
    linear-gradient(
      90deg,
      var(--cyan),
      #69d9d0,
      transparent
    );

  opacity: .5;
}

.tarjeta.inactivo {
  opacity: .62;
}

.tarjeta-encabezado {
  display: flex;

  align-items: center;

  gap: 6px;

  flex-wrap: wrap;
}

.badge-categoria,
.badge-inactivo,
.badge-activo {
  display: inline-flex;

  align-items: center;

  gap: 4px;

  padding: 4px 7px;

  border-radius: 7px;

  font-size: .51rem;

  font-weight: 850;
}

.badge-categoria {
  background: rgba(25,183,173,.08);

  color: #158e87;
}

.badge-inactivo {
  background: #f0f3f5;

  color: #71808c;
}

.badge-activo {
  margin-left: auto;

  color: #17906b;
}

.badge-activo span {
  width: 5px;
  height: 5px;

  border-radius: 50%;

  background: var(--green);

  box-shadow:
    0 0 7px rgba(25,170,120,.55);
}

.memory-symbol {
  display: flex;

  align-items: center;
  justify-content: center;

  width: 29px;
  height: 29px;

  margin-top: 4px;

  border-radius: 9px;

  background: #f0f8f7;

  color: #25a59d;

  font-size: 15px;
}

.tarjeta-titulo {
  margin: 0;

  color: var(--navy);

  font-size: .82rem;

  line-height: 1.35;

  font-weight: 850;
}

.tarjeta-contenido {
  margin: 0;

  color: #687d90;

  font-size: .64rem;

  line-height: 1.55;

  white-space: pre-line;

  display: -webkit-box;

  -webkit-line-clamp: 3;

  -webkit-box-orient: vertical;

  overflow: hidden;
}

.tarjeta-contenido.expandido {
  -webkit-line-clamp: unset;

  overflow: visible;
}

.ver-mas {
  display: inline-flex;

  align-items: center;

  gap: 4px;

  justify-self: start;

  padding: 0;

  border: 0;

  background: transparent;

  color: #218d9b;

  font-size: .59rem;

  font-weight: 850;

  cursor: pointer;
}

.ver-mas ion-icon {
  transition: transform .2s ease;
}

.ver-mas ion-icon.rotated {
  transform: rotate(90deg);
}

.tarjeta-keywords {
  display: flex;

  align-items: flex-start;

  gap: 6px;

  padding-top: 7px;

  border-top: 1px solid rgba(8,35,57,.055);

  color: #8999a7;

  font-size: .54rem;

  line-height: 1.4;
}

.tarjeta-keywords ion-icon {
  flex-shrink: 0;

  color: #9aabb9;

  font-size: 13px;
}

.item-acciones {
  display: grid;

  grid-template-columns: 1fr 1fr;

  gap: 7px;

  padding-top: 12px;
  margin-top: 8px;
  border-top: 1px solid rgba(8,35,57,.08);
}

.item-acciones button {
  min-height: 36px;

  font-size: .7rem;
  font-weight: 700;
  background: #e8f4fd;
  color: #156082;
  border: 1px solid #b8d9ea;
  border-radius: 8px;
  cursor: pointer;
  transition: all .2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.item-acciones button:hover {
  background: #d6ebf7;
  border-color: #a4cce0;
  transform: translateY(-1px);
}

.item-acciones button ion-icon {
  font-size: 14px;
}

.eliminar {
  background: #fff2f2 !important;
  color: #b53a3a !important;
  border-color: #ffcfcf !important;
}

.eliminar:hover {
  background: #ffe8e8 !important;
  border-color: #ffb8b8 !important;
}

.vacio {
  display: grid;

  justify-items: center;

  gap: 7px;

  padding: 45px 20px;

  text-align: center;

  border: 1px dashed rgba(25,183,173,.18);

  border-radius: 15px;

  background: rgba(25,183,173,.025);
}

.empty-orb {
  display: flex;

  align-items: center;
  justify-content: center;

  width: 54px;
  height: 54px;

  margin-bottom: 5px;

  border-radius: 17px;

  background:
    linear-gradient(
      145deg,
      rgba(25,183,173,.1),
      rgba(38,118,201,.06)
    );

  color: var(--cyan);

  font-size: 23px;
}

.vacio strong {
  color: #36546d;

  font-size: .75rem;
}

.vacio span {
  max-width: 260px;

  color: #8b9aa8;

  font-size: .61rem;

  line-height: 1.5;
}

.estado {
  position: relative;

  z-index: 2;

  display: flex;

  align-items: center;

  justify-content: center;

  gap: 13px;

  min-height: 140px;

  padding: 25px;

  text-align: center;
}

.estado strong,
.estado span {
  display: block;
}

.estado strong {
  color: var(--navy);

  font-size: .78rem;
}

.estado span {
  margin-top: 3px;

  color: var(--muted);

  font-size: .62rem;
}

.estado-loading {
  flex-direction: column;
}

.loader-orb,
.estado-icon {
  display: flex;

  align-items: center;
  justify-content: center;

  width: 42px;
  height: 42px;

  border-radius: 13px;

  background: rgba(25,183,173,.09);

  color: var(--cyan);

  font-size: 19px;
}

.loader-orb {
  animation: breathe 1.5s infinite ease-in-out;
}

.estado.error {
  border-color: rgba(196,56,56,.12);

  background: #fffafa;

  color: var(--red);
}

.estado.error .estado-icon {
  background: rgba(196,56,56,.08);

  color: var(--red);
}

.modal-fondo {
  position: fixed;

  inset: 0;

  z-index: 1000;

  display: flex;

  align-items: center;

  justify-content: center;

  padding: 18px;

  background: rgba(5,22,38,.66);

  backdrop-filter: blur(7px);
}

.modal-caja {
  position: relative;

  width: min(100%, 620px);

  max-height: 92vh;

  overflow-y: auto;

  border: 1px solid rgba(255,255,255,.12);

  border-radius: 22px;

  background: #ffffff !important;

  box-shadow:
    0 30px 80px rgba(3,18,31,.3);

  overflow-x: hidden;
  color: #1a2d3d !important;
}

.modal-top-glow {
  position: absolute;

  top: 0;
  left: 8%;

  width: 84%;
  height: 2px;

  background:
    linear-gradient(
      90deg,
      transparent,
      var(--cyan),
      #3c8cc3,
      transparent
    );
}

.modal-encabezado {
  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 15px;

  padding: 20px;

  border-bottom: 1px solid rgba(8,35,57,.07);
  background: #ffffff !important;
}

.modal-title {
  display: flex;

  align-items: center;

  gap: 11px;
}

.modal-icon {
  display: flex;

  align-items: center;
  justify-content: center;

  width: 40px;
  height: 40px;

  border-radius: 12px;

  background: rgba(25,183,173,.09);

  color: var(--cyan);

  font-size: 19px;
}

.modal-title span {
  display: block;

  color: var(--cyan) !important;

  font-size: .51rem;

  font-weight: 900;

  letter-spacing: .1em;
}

.modal-title h2 {
  margin: 2px 0 0;

  color: var(--navy) !important;

  font-size: 1rem;

  font-weight: 850;
}

.modal-cerrar {
  display: flex;

  align-items: center;
  justify-content: center;

  width: 31px;
  height: 31px;

  border: 1px solid rgba(8,35,57,.08);

  border-radius: 9px;

  background: #f7f9fa;

  color: #738798 !important;

  font-size: .78rem;

  cursor: pointer;
}

.modal-form {
  display: grid;

  gap: 13px;

  padding: 20px;
  background: #ffffff !important;
  color: #1a2d3d !important;
}

.modal-campo {
  display: grid;

  gap: 6px;
  color: #1a2d3d !important;
}

.modal-campo label {
  color: #1a2d3d !important;
  font-weight: 700;
  font-size: 0.85rem;
}

.modal-campo input,
.modal-campo textarea {
  color: #1a2d3d !important;
  background: #ffffff !important;
  border: 1px solid #d8e5ed;
}

.modal-campo input::placeholder,
.modal-campo textarea::placeholder {
  color: #6d829c !important;
}

.modal-row {
  display: grid;

  grid-template-columns: 1fr 1fr;

  gap: 10px;
}

.modal-campo textarea {
  min-height: 170px;
}

.modal-acciones {
  display: flex;

  justify-content: flex-end;

  gap: 8px;

  padding-top: 15px;

  border-top: 1px solid rgba(8,35,57,.06);
  background: #ffffff !important;
}

.modal-pequeno {
  width: min(100%, 480px);
}

.modal-icon-peligro {
  background: rgba(196, 56, 56, 0.1);
  color: #c43838;
}

.modal-contenido-confirmacion {
  padding: 20px;
  background: #ffffff !important;
  color: #1a2d3d !important;
}

.modal-contenido-confirmacion p {
  margin: 0 0 15px;
  color: #4a5a6a !important;
  font-size: 0.95rem;
  line-height: 1.5;
}

.item-confirmacion {
  padding: 12px;
  background: rgba(8, 35, 57, 0.04);
  border-radius: 8px;
  border-left: 3px solid #c43838;
}

.item-confirmacion strong {
  display: block;
  margin-bottom: 4px;
  color: #1a2d3d !important;
  font-size: 0.9rem;
}

.item-confirmacion span {
  color: #6d829c !important;
  font-size: 0.8rem;
}

.peligro {
  background: #c43838;
  color: white;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 14px;
  border: 0;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  min-height: 38px;
}

.peligro:hover:not(:disabled) {
  background: #a83232;
}

.peligro:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.message-enter-active,
.message-leave-active {
  transition:
    opacity .2s ease,
    transform .2s ease;
}

.message-enter-from,
.message-leave-to {
  opacity: 0;

  transform: translateY(-4px);
}

@keyframes breathe {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 rgba(25,183,173,0);
  }

  50% {
    transform: scale(1.05);
    box-shadow: 0 0 22px rgba(25,183,173,.18);
  }
}

@media (max-width: 950px) {
  .training-layout {
    grid-template-columns: 1fr;
  }

  .tarjetas-grid {
    grid-template-columns: repeat(2, 1fr);

    max-height: none;
  }
}

@media (max-width: 780px) {

  .entrenamiento-page {
    padding: 15px 16px 100px;
  }

  .hero {
    align-items: flex-start;
  }

  .knowledge-status {
    display: none;
  }

  .hero-icon {
    width: 50px;
    height: 50px;

    border-radius: 15px;

    font-size: 23px;
  }

  .encabezado h1 {
    font-size: 1.4rem;
  }

  .hero-info > p {
    font-size: .71rem;
  }

  .formulario-panel,
  .lista-panel {
    padding: 19px;
  }

  .pasos-indicador {
    display: flex;
  }

  .progress-line {
    display: block;
  }

  .paso-encabezado-movil {
    display: block;
  }

  .paso-contador {
    display: block;

    color: var(--cyan);

    font-size: .55rem;

    font-weight: 900;

    letter-spacing: .1em;
  }

  .paso-titulo-movil {
    margin: 3px 0 0;

    color: var(--navy);

    font-size: 1.12rem;

    font-weight: 850;
  }

  .legend-desktop {
    display: none;
  }

  .pasos-viewport {
    margin-inline: -19px;

    padding-inline: 19px;
  }

  .paso-slide {
    padding: 0 12px 0 2px;
  }

  .resumen-movil {
    display: none;
  }

  .puntos-movil {
    display: flex;

    justify-content: center;

    gap: 5px;

    margin: 14px 0 4px;
  }

  .puntos-movil span {
    width: 5px;
    height: 5px;

    border-radius: 999px;

    background: #cbd6de;

    cursor: pointer;

    transition:
      width .2s ease,
      background .2s ease;
  }

  .puntos-movil span.activo {
    width: 17px;

    background: var(--cyan);
  }

  .acciones-desktop {
    display: none;
  }

  .tarjetas-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 580px) {

  .hero-icon {
    display: none;
  }

  .encabezado h1 {
    font-size: 1.28rem;
  }

  .panel-title p {
    display: none;
  }

  .ai-badge {
    display: none;
  }

  .panel-title {
    align-items: flex-start;
  }

  .panel-icon {
    width: 40px;
    height: 40px;

    font-size: 18px;
  }

  .pasos-indicador {
    gap: 3px;
  }

  .pasos-indicador .etiqueta {
    display: none;
  }

  .pasos-indicador li {
    justify-content: center;
  }

  .modal-fondo {
    align-items: flex-end;

    padding: 0;
  }

  .modal-caja {
    width: 100%;

    max-height: 94vh;

    border-radius: 21px 21px 0 0;
  }

  .modal-row {
    grid-template-columns: 1fr;
  }

  .modal-acciones {
    display: grid;

    grid-template-columns: 1fr 1.4fr;
  }

  .modal-acciones button {
    width: 100%;
  }
}

@media (max-width: 390px) {

  .entrenamiento-page {
    padding-inline: 11px;
  }

  .formulario-panel,
  .lista-panel {
    padding: 16px;
  }

  .pasos-viewport {
    margin-inline: -16px;

    padding-inline: 16px;
  }

  .panel-title h2,
  .lista-header h2 {
    font-size: .96rem;
  }

  .knowledge-counter {
    padding: 6px 8px;
  }

  .knowledge-counter span {
    display: none;
  }
}

</style>