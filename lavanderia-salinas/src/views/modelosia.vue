<template>
  <AppShell>
    <div class="ia-page">

      <!-- =========================================================
           FONDO DECORATIVO DE IA
      ========================================================== -->
      <div class="ambient ambient-one"></div>
      <div class="ambient ambient-two"></div>
      <div class="grid-background"></div>

      <!-- =========================================================
           HEADER
      ========================================================== -->
      <header class="page-header">

        <button
          class="volver-btn"
          type="button"
          title="Volver a configuración"
          @click="volver"
        >
          <ion-icon :icon="arrowBackOutline" />
        </button>

        <div class="header-content">

          <div class="header-title-row">

            <div class="ai-symbol">
              <div class="ai-symbol-glow"></div>
              <ion-icon :icon="hardwareChipOutline" />
            </div>

            <div>
              <div class="eyebrow">
                <span class="status-dot"></span>
                INTELIGENCIA ARTIFICIAL
              </div>

              <h2>Modelos de IA</h2>

              <p>
                Configura el cerebro que impulsa la inteligencia de Burbujita.
              </p>
            </div>

          </div>

          <div class="system-status">
            <span class="system-status-dot"></span>

            <div>
              <strong>Sistema preparado</strong>
              <small>Orquestación activa</small>
            </div>
          </div>

        </div>

      </header>


      <!-- =========================================================
           PANEL PRINCIPAL
      ========================================================== -->
      <form class="config-card" @submit.prevent="guardar">

        <!-- Brillo superior -->
        <div class="card-glow"></div>

        <!-- =======================================================
             ENCABEZADO
        ======================================================== -->
        <div class="card-heading">

          <div class="heading-info">

            <div class="icon-badge">
              <ion-icon :icon="hardwareChipOutline" />
            </div>

            <div>
              <div class="section-kicker">
                CONFIGURACIÓN DEL CEREBRO
              </div>

              <h3>Arquitectura de modelos</h3>

              <p>
                Burbujita utilizará los modelos en orden de prioridad.
                Si uno falla, el siguiente toma el control automáticamente, si ambos fallan 
                es muy probable que el modelo fue desactualizado y debe actualizarse a los nuevos
                puedes consultarlos en google y busca los mas recientes con terminación lite los de gemini.
              </p>
            </div>

          </div>

          <div class="live-pill">
            <span></span>
            EN TIEMPO REAL
          </div>

        </div>


        <!-- =======================================================
             FLUJO DE IA
        ======================================================== -->
        <div class="ai-flow">

          <div class="flow-line"></div>

          <!-- PRINCIPAL -->
          <div class="flow-step">

            <div class="flow-number primary-number">
              01
            </div>

            <div class="flow-icon primary-icon">
              <ion-icon :icon="sparklesOutline" />
            </div>

            <div class="flow-info">
              <strong>Gemini Principal</strong>
              <span>Motor principal de inteligencia</span>
            </div>

            <div class="flow-badge primary-badge">
              PRINCIPAL
            </div>

          </div>


          <!-- FLECHA -->
          <div class="flow-arrow">
            <ion-icon :icon="arrowForwardOutline" />
          </div>


          <!-- RESPALDO -->
          <div class="flow-step">

            <div class="flow-number secondary-number">
              02
            </div>

            <div class="flow-icon secondary-icon">
              <ion-icon :icon="layersOutline" />
            </div>

            <div class="flow-info">
              <strong>Gemini Respaldo</strong>
              <span>Continúa si el principal falla</span>
            </div>

            <div class="flow-badge secondary-badge">
              RESPALDO
            </div>

          </div>


          <!-- FLECHA -->
          <div class="flow-arrow">
            <ion-icon :icon="arrowForwardOutline" />
          </div>


          <!-- GROQ -->
          <div class="flow-step">

            <div class="flow-number warning-number">
              03
            </div>

            <div class="flow-icon warning-icon">
              <ion-icon :icon="flashOutline" />
            </div>

            <div class="flow-info">
              <strong>Groq</strong>
              <span>Última línea de respaldo</span>
            </div>

            <div class="flow-badge warning-badge">
              FINAL
            </div>

          </div>

        </div>


        <!-- =======================================================
             SEPARADOR
        ======================================================== -->
        <div class="section-divider">
          <span>MODELOS CONFIGURADOS</span>
        </div>


        <!-- =======================================================
             CAMPOS
        ======================================================== -->
        <div class="fields-grid">


          <!-- GEMINI PRINCIPAL -->
          <div class="model-card model-primary">

            <div class="model-card-top">

              <div class="model-brand">

                <div class="model-icon">
                  <ion-icon :icon="sparklesOutline" />
                </div>

                <div>
                  <span class="model-provider">GOOGLE</span>
                  <strong>Gemini</strong>
                </div>

              </div>

              <span class="tag tag-primary">
                Principal
              </span>

            </div>

            <div class="model-description">
              Modelo utilizado como primera opción para procesar las
              solicitudes de Burbujita.
            </div>

            <label class="modern-input">

              <span>Identificador del modelo</span>

              <div class="input-wrapper">

                <ion-icon :icon="codeSlashOutline" />

                <input
                  v-model.trim="formulario.geminiModel"
                  list="sugerencias-gemini"
                  required
                  autocomplete="off"
                  placeholder="gemini-3.6-flash"
                />

                <span class="input-status"></span>

              </div>

            </label>

            <div class="model-footer">
              <ion-icon :icon="checkmarkCircleOutline" />
              Se utilizará primero
            </div>

          </div>


          <!-- GEMINI RESPALDO -->
          <div class="model-card model-secondary">

            <div class="model-card-top">

              <div class="model-brand">

                <div class="model-icon">
                  <ion-icon :icon="layersOutline" />
                </div>

                <div>
                  <span class="model-provider">GOOGLE</span>
                  <strong>Gemini</strong>
                </div>

              </div>

              <span class="tag tag-secondary">
                Respaldo 1
              </span>

            </div>

            <div class="model-description">
              Segundo modelo utilizado automáticamente cuando el
              principal no puede responder.
            </div>

            <label class="modern-input">

              <span>Identificador del modelo</span>

              <div class="input-wrapper">

                <ion-icon :icon="codeSlashOutline" />

                <input
                  v-model.trim="formulario.geminiFallbackModel"
                  list="sugerencias-gemini"
                  required
                  autocomplete="off"
                  placeholder="gemini-3.5-flash"
                />

                <span class="input-status"></span>

              </div>

            </label>

            <div class="model-footer">
              <ion-icon :icon="shieldCheckmarkOutline" />
              Protección automática
            </div>

          </div>


          <!-- GROQ -->
          <div class="model-card model-warning">

            <div class="model-card-top">

              <div class="model-brand">

                <div class="model-icon">
                  <ion-icon :icon="flashOutline" />
                </div>

                <div>
                  <span class="model-provider">GROQ</span>
                  <strong>Modelo alternativo</strong>
                </div>

              </div>

              <span class="tag tag-warning">
                Respaldo final
              </span>

            </div>

            <div class="model-description">
              Último recurso del sistema para mantener disponible la
              inteligencia artificial ante cualquier inconveniente.
            </div>

            <label class="modern-input">

              <span>Identificador del modelo</span>

              <div class="input-wrapper">

                <ion-icon :icon="codeSlashOutline" />

                <input
                  v-model.trim="formulario.groqModel"
                  list="sugerencias-groq"
                  required
                  autocomplete="off"
                  placeholder="llama-3.3-70b-versatile"
                />

                <span class="input-status"></span>

              </div>

            </label>

            <div class="model-footer">
              <ion-icon :icon="shieldCheckmarkOutline" />
              Última línea de seguridad
            </div>

          </div>

        </div>


        <!-- =======================================================
             DATAlISTS
        ======================================================== -->
        <datalist id="sugerencias-gemini">
          <option value="gemini-3.6-flash" />
          <option value="gemini-3.5-flash" />
          <option value="gemini-3.5-flash-lite" />
          <option value="gemini-3.5-pro" />
        </datalist>

        <datalist id="sugerencias-groq">
          <option value="llama-3.3-70b-versatile" />
          <option value="llama-3.1-8b-instant" />
          <option value="openai/gpt-oss-120b" />
          <option value="openai/gpt-oss-20b" />
        </datalist>


        <!-- =======================================================
             ESTADO
        ======================================================== -->
        <transition name="fade">

          <div
            v-if="mensaje"
            class="banner-mensaje"
            :class="{ 'banner-error': error }"
            role="status"
          >

            <div class="message-icon">
              <ion-icon
                :icon="
                  error
                    ? alertCircleOutline
                    : checkmarkCircleOutline
                "
              />
            </div>

            <div>
              <strong>
                {{ error ? 'No se pudo completar la operación' : 'Configuración actualizada' }}
              </strong>

              <span>{{ mensaje }}</span>
            </div>

          </div>

        </transition>


        <!-- =======================================================
             FOOTER DE LA TARJETA
        ======================================================== -->
        <div class="card-footer">

          <div class="save-info">

            <div class="save-info-icon">
              <ion-icon :icon="cloudDoneOutline" />
            </div>

            <div>
              <strong>Configuración sincronizada</strong>

              <span>
                Los cambios se guardan en
                <b>modelos-ia.json</b>
                y se aplican en tiempo real.
              </span>
            </div>

          </div>


          <div class="acciones">

            <button
              class="btn-secundario"
              type="button"
              :disabled="procesando"
              @click="restablecerPredeterminados"
            >
              <ion-icon :icon="refreshOutline" />
              <span>Restablecer</span>
            </button>

            <button
              class="btn-primario"
              type="submit"
              :disabled="procesando"
            >
              <span class="save-button-icon">
                <ion-icon :icon="saveOutline" />
              </span>

              <span>
                {{ procesando ? 'Guardando...' : 'Guardar cambios' }}
              </span>

              <ion-icon
                v-if="!procesando"
                class="button-arrow"
                :icon="arrowForwardOutline"
              />
            </button>

          </div>

        </div>

      </form>

    </div>
  </AppShell>
</template>


<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { IonIcon } from '@ionic/vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import { API_LOCAL_URL } from '@/composables/useApiConfig'

import {
  arrowBackOutline,
  arrowForwardOutline,
  hardwareChipOutline,
  refreshOutline,
  saveOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  sparklesOutline,
  layersOutline,
  flashOutline,
  codeSlashOutline,
  shieldCheckmarkOutline,
  cloudDoneOutline
} from 'ionicons/icons'


/* ================================================================
   TIPOS
================================================================ */

type ConfiguracionModelos = {
  groqModel: string
  geminiModel: string
  geminiFallbackModel: string
}


/* ================================================================
   ESTADO
================================================================ */

const router = useRouter()

const formulario = reactive<ConfiguracionModelos>({
  groqModel: '',
  geminiModel: '',
  geminiFallbackModel: ''
})

const mensaje = ref('')
const error = ref(false)
const procesando = ref(false)


/* ================================================================
   CARGAR CONFIGURACIÓN
================================================================ */

const cargar = async () => {
  try {
    const respuesta = await fetch(
      `${API_LOCAL_URL}/configuracion-modelos`
    )

    if (!respuesta.ok) {
      throw new Error('No se pudo cargar la configuración.')
    }

    Object.assign(
      formulario,
      await respuesta.json()
    )

  } catch (e) {

    error.value = true

    mensaje.value =
      e instanceof Error
        ? e.message
        : 'No se pudo cargar la configuración.'
  }
}


/* ================================================================
   RESTABLECER PREDETERMINADOS
================================================================ */

const restablecerPredeterminados = async () => {

  procesando.value = true
  mensaje.value = ''
  error.value = false

  try {

    const respuesta = await fetch(
      `${API_LOCAL_URL}/configuracion-modelos/defaults`
    )

    const resultado = await respuesta.json()

    if (!respuesta.ok) {
      throw new Error(resultado.message)
    }

    Object.assign(
      formulario,
      resultado
    )

    mensaje.value =
      'Modelos predeterminados cargados. Guarda para aplicarlos.'

  } catch (e) {

    error.value = true

    mensaje.value =
      e instanceof Error
        ? e.message
        : 'No se pudieron cargar los modelos predeterminados.'

  } finally {

    procesando.value = false
  }
}


/* ================================================================
   GUARDAR
================================================================ */

const guardar = async () => {

  procesando.value = true
  mensaje.value = ''
  error.value = false

  try {

    const respuesta = await fetch(
      `${API_LOCAL_URL}/configuracion-modelos`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formulario)
      }
    )

    const resultado = await respuesta.json()

    if (!respuesta.ok) {
      throw new Error(resultado.message)
    }

    Object.assign(
      formulario,
      resultado
    )

    mensaje.value =
      'Modelos guardados. Burbujita ya los está usando.'

  } catch (e) {

    error.value = true

    mensaje.value =
      e instanceof Error
        ? e.message
        : 'No se pudo guardar la configuración.'

  } finally {

    procesando.value = false
  }
}


/* ================================================================
   VOLVER
================================================================ */

const volver = () => {
  void router.replace('/tabs/configuracion')
}


/* ================================================================
   INICIO
================================================================ */

onMounted(cargar)
</script>


<style scoped>

/* ================================================================
   VARIABLES VISUALES
================================================================ */

.ia-page {
  --navy: #071a2d;
  --navy-2: #0c2945;
  --blue: #1768a8;
  --cyan: #16a7a0;
  --cyan-light: #4ddbd0;
  --green: #18a979;
  --gold: #d99118;
  --text: #102a43;
  --muted: #6b8095;
  --border: rgba(11, 42, 67, 0.09);

  position: relative;
  display: grid;
  gap: 24px;
  min-height: 100%;
  padding: 10px 4px 110px;
  color: var(--text);
  overflow: hidden;
}


/* ================================================================
   FONDO
================================================================ */

.grid-background {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.45;

  background-image:
    linear-gradient(
      rgba(22, 139, 131, 0.035) 1px,
      transparent 1px
    ),
    linear-gradient(
      90deg,
      rgba(22, 139, 131, 0.035) 1px,
      transparent 1px
    );

  background-size: 36px 36px;

  mask-image: linear-gradient(
    to bottom,
    black,
    transparent 75%
  );
}


.ambient {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(70px);
  opacity: 0.13;
}


.ambient-one {
  width: 280px;
  height: 280px;
  top: -140px;
  right: 5%;
  background: #18b9ad;
}


.ambient-two {
  width: 240px;
  height: 240px;
  bottom: 10%;
  left: -120px;
  background: #2875c7;
}


/* ================================================================
   HEADER
================================================================ */

.page-header {
  position: relative;
  z-index: 2;

  display: flex;
  align-items: center;
  gap: 16px;

  padding: 8px 4px;
}


.volver-btn {
  display: flex;
  align-items: center;
  justify-content: center;

  width: 44px;
  height: 44px;

  flex-shrink: 0;

  border: 1px solid rgba(10, 31, 56, 0.1);
  border-radius: 14px;

  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(12px);

  color: var(--navy-2);
  font-size: 20px;

  cursor: pointer;

  box-shadow:
    0 5px 18px rgba(10, 31, 56, 0.07);

  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease,
    background 0.25s ease;
}


.volver-btn:hover {
  transform: translateX(-3px);

  background: #ffffff;

  box-shadow:
    0 8px 24px rgba(10, 31, 56, 0.12);
}


.header-content {
  width: 100%;

  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 20px;
}


.header-title-row {
  display: flex;
  align-items: center;
  gap: 15px;
}


.ai-symbol {
  position: relative;

  display: flex;
  align-items: center;
  justify-content: center;

  width: 54px;
  height: 54px;

  border-radius: 17px;

  background:
    linear-gradient(
      145deg,
      #0e4269,
      #126c78
    );

  color: white;
  font-size: 27px;

  box-shadow:
    0 10px 28px rgba(18, 108, 120, 0.25);
}


.ai-symbol-glow {
  position: absolute;
  inset: -4px;

  border-radius: 20px;

  background: linear-gradient(
    135deg,
    rgba(22, 167, 160, 0.4),
    transparent
  );

  filter: blur(10px);
  z-index: -1;
}


.eyebrow {
  display: flex;
  align-items: center;
  gap: 7px;

  margin-bottom: 3px;

  color: var(--cyan);

  font-size: 0.69rem;
  font-weight: 900;

  letter-spacing: 0.12em;
}


.status-dot {
  width: 6px;
  height: 6px;

  border-radius: 50%;

  background: var(--cyan);

  box-shadow:
    0 0 0 4px rgba(22, 167, 160, 0.1),
    0 0 12px rgba(22, 167, 160, 0.5);
}


h2 {
  margin: 0 0 4px;

  color: var(--navy);

  font-size: 1.65rem;
  font-weight: 850;
  letter-spacing: -0.035em;
}


.page-header p {
  margin: 0;

  color: var(--muted);

  font-size: 0.88rem;
}


.system-status {
  display: flex;
  align-items: center;
  gap: 10px;

  padding: 9px 14px;

  border: 1px solid rgba(24, 169, 121, 0.16);
  border-radius: 12px;

  background: rgba(255, 255, 255, 0.72);

  box-shadow:
    0 5px 20px rgba(10, 31, 56, 0.04);
}


.system-status-dot {
  width: 9px;
  height: 9px;

  border-radius: 50%;

  background: #19b77d;

  box-shadow:
    0 0 0 5px rgba(25, 183, 125, 0.1),
    0 0 14px rgba(25, 183, 125, 0.4);
}


.system-status strong,
.system-status small {
  display: block;
}


.system-status strong {
  color: var(--navy);

  font-size: 0.76rem;
  font-weight: 800;
}


.system-status small {
  margin-top: 2px;

  color: #7890a4;

  font-size: 0.66rem;
}


/* ================================================================
   TARJETA PRINCIPAL
================================================================ */

.config-card {
  position: relative;
  z-index: 2;

  display: grid;

  width: min(100%, 980px);

  box-sizing: border-box;

  gap: 25px;

  margin-inline: auto;

  padding: 30px;

  border: 1px solid rgba(10, 31, 56, 0.08);
  border-radius: 26px;

  background:
    linear-gradient(
      145deg,
      rgba(255,255,255,0.98),
      rgba(250,253,254,0.96)
    );

  box-shadow:
    0 22px 55px rgba(10, 31, 56, 0.08),
    0 3px 12px rgba(10, 31, 56, 0.03);

  overflow: hidden;
}


.card-glow {
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
      #3185bd,
      var(--cyan),
      transparent
    );

  opacity: 0.7;
}


/* ================================================================
   ENCABEZADO DE TARJETA
================================================================ */

.card-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 20px;
}


.heading-info {
  display: flex;
  align-items: center;
  gap: 15px;
}


.icon-badge {
  display: flex;
  align-items: center;
  justify-content: center;

  width: 50px;
  height: 50px;

  flex-shrink: 0;

  border: 1px solid rgba(22, 167, 160, 0.14);
  border-radius: 15px;

  background:
    linear-gradient(
      145deg,
      rgba(22, 167, 160, 0.12),
      rgba(49, 133, 189, 0.07)
    );

  color: var(--cyan);

  font-size: 24px;
}


.section-kicker {
  margin-bottom: 4px;

  color: #8a9cad;

  font-size: 0.63rem;
  font-weight: 900;

  letter-spacing: 0.12em;
}


.heading-info h3 {
  margin: 0 0 4px;

  color: var(--navy);

  font-size: 1.18rem;
  font-weight: 800;
}


.heading-info p {
  max-width: 590px;

  margin: 0;

  color: var(--muted);

  font-size: 0.79rem;
  line-height: 1.5;
}


.live-pill {
  display: flex;
  align-items: center;
  gap: 7px;

  padding: 7px 11px;

  flex-shrink: 0;

  border: 1px solid rgba(22, 167, 160, 0.14);
  border-radius: 999px;

  background: rgba(22, 167, 160, 0.055);

  color: var(--cyan);

  font-size: 0.59rem;
  font-weight: 900;
  letter-spacing: 0.07em;
}


.live-pill span {
  width: 6px;
  height: 6px;

  border-radius: 50%;

  background: var(--cyan);

  box-shadow:
    0 0 10px rgba(22, 167, 160, 0.7);
}


/* ================================================================
   FLUJO DE MODELOS
================================================================ */

.ai-flow {
  position: relative;

  display: flex;
  align-items: center;

  padding: 17px;

  border: 1px solid rgba(10, 31, 56, 0.065);
  border-radius: 17px;

  background:
    linear-gradient(
      110deg,
      #f7fbfc,
      #fbfcfe
    );
}


.flow-line {
  position: absolute;

  left: 10%;
  right: 10%;
  top: 50%;

  height: 1px;

  background:
    linear-gradient(
      90deg,
      rgba(22, 167, 160, 0.3),
      rgba(49, 133, 189, 0.25),
      rgba(217, 145, 24, 0.3)
    );

  z-index: 0;
}


.flow-step {
  position: relative;
  z-index: 1;

  display: flex;
  align-items: center;

  min-width: 0;
  flex: 1;

  gap: 9px;

  padding: 9px;

  border: 1px solid rgba(255,255,255,0.9);
  border-radius: 12px;

  background: rgba(255,255,255,0.94);

  box-shadow:
    0 5px 14px rgba(10,31,56,0.04);
}


.flow-number {
  font-size: 0.55rem;
  font-weight: 900;
  opacity: 0.55;
}


.flow-icon {
  display: flex;
  align-items: center;
  justify-content: center;

  width: 30px;
  height: 30px;

  border-radius: 9px;

  flex-shrink: 0;

  font-size: 15px;
}


.primary-icon {
  background: rgba(22,167,160,0.11);
  color: #138d88;
}


.secondary-icon {
  background: rgba(23,104,168,0.1);
  color: #1768a8;
}


.warning-icon {
  background: rgba(217,145,24,0.11);
  color: #b9780c;
}


.primary-number {
  color: #168f88;
}


.secondary-number {
  color: #1768a8;
}


.warning-number {
  color: #b9780c;
}


.flow-info {
  min-width: 0;
  flex: 1;
}


.flow-info strong,
.flow-info span {
  display: block;

  overflow: hidden;

  white-space: nowrap;
  text-overflow: ellipsis;
}


.flow-info strong {
  color: var(--navy);

  font-size: 0.69rem;
  font-weight: 800;
}


.flow-info span {
  margin-top: 2px;

  color: #8192a2;

  font-size: 0.57rem;
}


.flow-badge {
  padding: 3px 6px;

  border-radius: 5px;

  font-size: 0.5rem;
  font-weight: 900;

  letter-spacing: 0.04em;
}


.primary-badge {
  background: rgba(22,167,160,0.1);
  color: #148e88;
}


.secondary-badge {
  background: rgba(23,104,168,0.09);
  color: #1768a8;
}


.warning-badge {
  background: rgba(217,145,24,0.1);
  color: #ae740e;
}


.flow-arrow {
  position: relative;
  z-index: 2;

  display: flex;
  align-items: center;
  justify-content: center;

  width: 30px;

  flex-shrink: 0;

  color: #9db0c0;
  font-size: 15px;
}


/* ================================================================
   SEPARADOR
================================================================ */

.section-divider {
  display: flex;
  align-items: center;
  gap: 13px;

  color: #8a9bab;

  font-size: 0.61rem;
  font-weight: 900;
  letter-spacing: 0.12em;
}


.section-divider::before,
.section-divider::after {
  content: '';

  height: 1px;

  flex: 1;

  background:
    linear-gradient(
      90deg,
      transparent,
      rgba(10,31,56,0.08)
    );
}


.section-divider::after {
  background:
    linear-gradient(
      90deg,
      rgba(10,31,56,0.08),
      transparent
    );
}


/* ================================================================
   MODELOS
================================================================ */

.fields-grid {
  display: grid;

  grid-template-columns: 1fr 1fr;

  gap: 17px;
}


.model-card {
  position: relative;

  padding: 20px;

  border: 1px solid var(--border);
  border-radius: 18px;

  background: #ffffff;

  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease,
    border-color 0.25s ease;

  overflow: hidden;
}


.model-card:hover {
  transform: translateY(-2px);

  box-shadow:
    0 13px 30px rgba(10,31,56,0.07);
}


.model-card::before {
  content: '';

  position: absolute;

  top: 0;
  left: 0;

  width: 100%;
  height: 3px;
}


.model-primary::before {
  background: linear-gradient(
    90deg,
    #16a7a0,
    #43cfc6
  );
}


.model-secondary::before {
  background: linear-gradient(
    90deg,
    #1768a8,
    #4e9ed0
  );
}


.model-warning {
  grid-column: 1 / -1;
}


.model-warning::before {
  background: linear-gradient(
    90deg,
    #d99118,
    #efb94d
  );
}


.model-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 12px;
}


.model-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}


.model-icon {
  display: flex;
  align-items: center;
  justify-content: center;

  width: 40px;
  height: 40px;

  border-radius: 12px;

  font-size: 19px;
}


.model-primary .model-icon {
  background: rgba(22,167,160,0.1);
  color: #13928b;
}


.model-secondary .model-icon {
  background: rgba(23,104,168,0.1);
  color: #1768a8;
}


.model-warning .model-icon {
  background: rgba(217,145,24,0.1);
  color: #b87b0c;
}


.model-provider {
  display: block;

  margin-bottom: 1px;

  color: #94a3b2;

  font-size: 0.54rem;
  font-weight: 900;

  letter-spacing: 0.1em;
}


.model-brand strong {
  display: block;

  color: var(--navy);

  font-size: 0.92rem;
  font-weight: 850;
}


.tag {
  padding: 5px 9px;

  border-radius: 7px;

  font-size: 0.56rem;
  font-weight: 900;

  text-transform: uppercase;
  letter-spacing: 0.04em;
}


.tag-primary {
  background: rgba(22,167,160,0.1);
  color: #128d86;
}


.tag-secondary {
  background: rgba(23,104,168,0.1);
  color: #1768a8;
}


.tag-warning {
  background: rgba(217,145,24,0.1);
  color: #ad730d;
}


.model-description {
  min-height: 38px;

  margin: 15px 0;

  color: #708397;

  font-size: 0.71rem;
  line-height: 1.5;
}


/* ================================================================
   INPUTS MODERNOS
================================================================ */

.modern-input {
  display: block;
}


.modern-input > span {
  display: block;

  margin-bottom: 6px;

  color: #526a80;

  font-size: 0.63rem;
  font-weight: 800;
}


.input-wrapper {
  display: flex;
  align-items: center;

  gap: 9px;

  padding: 0 12px;

  border: 1px solid rgba(10,31,56,0.11);
  border-radius: 11px;

  background: #f8fafc;

  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    box-shadow 0.2s ease;
}


.input-wrapper > ion-icon {
  flex-shrink: 0;

  color: #93a6b7;

  font-size: 16px;
}


.input-wrapper:focus-within {
  border-color: rgba(22,167,160,0.55);

  background: #ffffff;

  box-shadow:
    0 0 0 3px rgba(22,167,160,0.09);
}


input {
  width: 100%;

  min-width: 0;

  box-sizing: border-box;

  padding: 12px 0;

  border: 0;
  outline: 0;

  background: transparent;

  color: var(--navy);

  font: inherit;
  font-size: 0.79rem;
  font-weight: 650;
}


input::placeholder {
  color: #aab8c4;
}


.input-status {
  width: 7px;
  height: 7px;

  flex-shrink: 0;

  border-radius: 50%;

  background: #19ae7b;

  opacity: 0.7;
}


/* ================================================================
   FOOTER DEL MODELO
================================================================ */

.model-footer {
  display: flex;
  align-items: center;
  gap: 6px;

  margin-top: 11px;

  color: #8093a4;

  font-size: 0.61rem;
}


.model-footer ion-icon {
  color: #18a979;

  font-size: 14px;
}


/* ================================================================
   MENSAJE
================================================================ */

.banner-mensaje {
  display: flex;
  align-items: center;

  gap: 12px;

  padding: 13px 15px;

  border: 1px solid #b8e8dc;
  border-radius: 13px;

  background:
    linear-gradient(
      100deg,
      #effbf8,
      #f6fcfb
    );

  color: #116b5f;
}


.message-icon {
  display: flex;
  align-items: center;
  justify-content: center;

  width: 34px;
  height: 34px;

  flex-shrink: 0;

  border-radius: 10px;

  background: rgba(24,169,121,0.1);

  font-size: 18px;
}


.banner-mensaje strong,
.banner-mensaje span {
  display: block;
}


.banner-mensaje strong {
  margin-bottom: 2px;

  font-size: 0.71rem;
  font-weight: 850;
}


.banner-mensaje span {
  font-size: 0.67rem;
}


.banner-error {
  border-color: #f2bcbc;

  background: #fff7f7;

  color: #a52929;
}


.banner-error .message-icon {
  background: rgba(180,40,40,0.08);
}


/* ================================================================
   FOOTER
================================================================ */

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 20px;

  padding-top: 19px;

  border-top: 1px solid rgba(10,31,56,0.065);
}


.save-info {
  display: flex;
  align-items: center;
  gap: 10px;

  min-width: 0;
}


.save-info-icon {
  display: flex;
  align-items: center;
  justify-content: center;

  width: 34px;
  height: 34px;

  flex-shrink: 0;

  border-radius: 10px;

  background: rgba(22,167,160,0.08);

  color: var(--cyan);

  font-size: 17px;
}


.save-info strong,
.save-info span {
  display: block;
}


.save-info strong {
  color: var(--navy);

  font-size: 0.66rem;
  font-weight: 800;
}


.save-info span {
  max-width: 410px;

  margin-top: 2px;

  color: #8293a3;

  font-size: 0.58rem;
  line-height: 1.4;
}


.save-info b {
  color: #60768a;
}


/* ================================================================
   BOTONES
================================================================ */

.acciones {
  display: flex;
  align-items: center;

  gap: 9px;

  flex-shrink: 0;
}


.acciones button {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  gap: 7px;

  min-height: 40px;

  padding: 0 14px;

  border-radius: 10px;

  font-size: 0.68rem;
  font-weight: 800;

  cursor: pointer;

  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}


.btn-secundario {
  border: 1px solid rgba(10,31,56,0.12);

  background: #ffffff;

  color: #34516b;
}


.btn-secundario:hover:not(:disabled) {
  transform: translateY(-1px);

  background: #f7fafc;

  box-shadow:
    0 5px 15px rgba(10,31,56,0.06);
}


.btn-primario {
  border: 1px solid rgba(10,31,56,0.1);

  background:
    linear-gradient(
      135deg,
      #103e62,
      #116b78
    );

  color: #ffffff;

  box-shadow:
    0 7px 18px rgba(16,62,98,0.2);
}


.btn-primario:hover:not(:disabled) {
  transform: translateY(-2px);

  box-shadow:
    0 10px 24px rgba(16,62,98,0.27);
}


.save-button-icon {
  display: flex;
  align-items: center;
  justify-content: center;

  width: 22px;
  height: 22px;

  border-radius: 7px;

  background: rgba(255,255,255,0.12);
}


.button-arrow {
  margin-left: 3px;

  font-size: 13px;

  opacity: 0.7;
}


button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}


/* ================================================================
   ANIMACIÓN
================================================================ */

.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}


.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}


/* ================================================================
   RESPONSIVE
================================================================ */

@media (max-width: 820px) {

  .header-content {
    align-items: flex-start;
  }

  .system-status {
    display: none;
  }

  .fields-grid {
    grid-template-columns: 1fr;
  }

  .model-warning {
    grid-column: auto;
  }

  .ai-flow {
    flex-direction: column;
    align-items: stretch;
    gap: 7px;
  }

  .flow-line {
    top: 10%;
    bottom: 10%;
    left: 32px;
    right: auto;

    width: 1px;
    height: auto;
  }

  .flow-arrow {
    width: auto;
    height: 14px;

    transform: rotate(90deg);
  }

}


@media (max-width: 600px) {

  .ia-page {
    padding-inline: 0;
  }

  .page-header {
    align-items: flex-start;
  }

  .header-title-row {
    align-items: flex-start;
  }

  .ai-symbol {
    width: 46px;
    height: 46px;

    border-radius: 14px;

    font-size: 22px;
  }

  h2 {
    font-size: 1.35rem;
  }

  .page-header p {
    font-size: 0.77rem;
  }

  .config-card {
    padding: 20px 17px;

    border-radius: 20px;
  }

  .card-heading {
    align-items: flex-start;
  }

  .live-pill {
    display: none;
  }

  .heading-info {
    align-items: flex-start;
  }

  .icon-badge {
    width: 43px;
    height: 43px;

    border-radius: 13px;

    font-size: 20px;
  }

  .heading-info h3 {
    font-size: 1rem;
  }

  .heading-info p {
    font-size: 0.7rem;
  }

  .flow-step {
    padding: 8px;
  }

  .flow-badge {
    display: none;
  }

  .card-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .save-info {
    align-items: flex-start;
  }

  .acciones {
    display: grid;
    grid-template-columns: 1fr 1.4fr;
  }

  .acciones button {
    width: 100%;
  }

}


@media (max-width: 400px) {

  .volver-btn {
    width: 40px;
    height: 40px;
  }

  .ai-symbol {
    display: none;
  }

  .model-card {
    padding: 16px;
  }

  .model-card-top {
    align-items: flex-start;
  }

  .tag {
    font-size: 0.5rem;
  }

}

</style>

