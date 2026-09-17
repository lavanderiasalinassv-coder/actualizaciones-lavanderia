<template>
  <AppShell>
    <div class="horarios-page">
      <!-- ───────────── Encabezado con el usuario real de la sesión ───────────── -->
      <div class="config-card">
        <div class="config-card-header">
          <div>
            <span class="config-card-label">Personalización del sistema</span>
            <p class="config-card-hint">Ajusta la identidad visual de cada pantalla.</p>
          </div>
          <span class="badge-rol" :class="{ admin: esAdministrador }">
            <ion-icon :icon="esAdministrador ? settingsOutline : personOutline" />
            {{ esAdministrador ? 'Administrador' : 'Personal' }}
          </span>
        </div>
        <div v-if="usuarioActual" class="usuario-actual">
          <span class="empleado-avatar">{{ inicial(usuarioActual.nombre) }}</span>
          <div>
            <p class="usuario-nombre">{{ usuarioActual.nombre }}</p>
            <small>Sesión iniciada</small>
          </div>
        </div>
      </div>

      <div v-if="esAdministrador" class="config-card apariencia-card">
        <div class="card-header-row">
          <div>
            <span class="card-title">🎨 Apariencia del sistema</span>
            <p class="apariencia-subtitulo">Colores, imágenes y ambiente visual de Lavandería Salinas.</p>
          </div>
        </div>

        <div class="apariencia-grid">
          <div class="apariencia-seccion">
            <strong class="apariencia-titulo">🧺 AppShell</strong>
            <p class="apariencia-descripcion">La navegación principal y el fondo de la aplicación.</p>
            <label class="apariencia-campo">
              <span>Color de página</span>
              <span class="apariencia-control">
                <input v-model="borrador.appShellColor" type="color" />
                <button type="button" @click="restablecerCampo('appShellColor')">↺ Predeterminado</button>
              </span>
            </label>
            <label class="apariencia-campo">
              <span>Color del header</span>
              <span class="apariencia-control">
                <input v-model="borrador.appShellHeaderColor" type="color" />
                <button type="button" @click="restablecerCampo('appShellHeaderColor')">↺ Predeterminado</button>
              </span>
            </label>
            <label class="apariencia-campo">
              <span>Imagen de AppShell</span>
              <span class="apariencia-control-apilado">
                <input v-model="borrador.appShellImagen" type="url" placeholder="URL de imagen" />
                <button type="button" @click="restablecerCampo('appShellImagen')">↺ Predeterminado</button>
              </span>
            </label>
            <button type="button" class="btn-restablecer" @click="restablecerAppShell">Restablecer AppShell</button>
            <label class="btn-subir-apariencia" :class="{ cargando: subiendoImagen === 'appShellImagen' }">
              {{ subiendoImagen === 'appShellImagen' ? 'Subiendo...' : 'Seleccionar imagen' }}
              <input type="file" accept="image/*" hidden :disabled="Boolean(subiendoImagen)" @change="subirImagen($event, 'appShellImagen')" />
            </label>
          </div>

          <div class="apariencia-seccion">
            <strong class="apariencia-titulo">🔐 Login</strong>
            <p class="apariencia-descripcion">La pantalla que reciben los usuarios al iniciar sesión.</p>
            <label class="apariencia-campo">
              <span>Color de fondo</span>
              <span class="apariencia-control">
                <input v-model="borrador.loginColor" type="color" />
                <button type="button" @click="restablecerCampo('loginColor')">↺ Predeterminado</button>
              </span>
            </label>
            <label class="apariencia-campo">
              <span>Imagen de Login</span>
              <span class="apariencia-control-apilado">
                <input v-model="borrador.loginImagen" type="url" placeholder="URL de imagen" />
                <button type="button" @click="restablecerCampo('loginImagen')">↺ Predeterminado</button>
              </span>
            </label>
            <button type="button" class="btn-restablecer" @click="restablecerLogin">Restablecer Login</button>
            <div class="login-preview" :style="previewLoginStyle">
              <span class="preview-orb preview-orb-uno" :style="{ background: borrador.orbColorUno }"></span>
              <span class="preview-orb preview-orb-dos" :style="{ background: borrador.orbColorDos }"></span>
              <div class="preview-brand">
                <span class="preview-logo">
                  <img :src="borrador.loginImagen || logoPredeterminado" alt="Vista previa del logo" />
                </span>
                <strong>Lavandería Salinas</strong>
                <small>Control de acceso</small>
              </div>
              <div class="preview-card">
                <span class="preview-avatar">◉</span>
                <strong>Ingrese PIN de acceso</strong>
                <div class="preview-dots"><i v-for="n in 6" :key="n"></i></div>
                <div class="preview-keypad">
                  <span v-for="n in 9" :key="n">{{ n }}</span>
                  <span>⌫</span><span>0</span><span>✦</span>
                </div>
              </div>
            </div>
            <label class="btn-subir-apariencia" :class="{ cargando: subiendoImagen === 'loginImagen' }">
              {{ subiendoImagen === 'loginImagen' ? 'Subiendo...' : 'Seleccionar imagen' }}
              <input type="file" accept="image/*" hidden :disabled="Boolean(subiendoImagen)" @change="subirImagen($event, 'loginImagen')" />
            </label>
          </div>

          <div class="apariencia-seccion">
            <strong class="apariencia-titulo">✨ Orbes del Login</strong>
            <p class="apariencia-descripcion">Detalles de color para el ambiente del acceso.</p>
            <label class="apariencia-campo">
              <span>Orbe superior</span>
              <span class="apariencia-control">
                <input v-model="borrador.orbColorUno" type="color" />
                <button type="button" @click="restablecerCampo('orbColorUno')">↺ Predeterminado</button>
              </span>
            </label>
            <label class="apariencia-campo">
              <span>Orbe inferior</span>
              <span class="apariencia-control">
                <input v-model="borrador.orbColorDos" type="color" />
                <button type="button" @click="restablecerCampo('orbColorDos')">↺ Predeterminado</button>
              </span>
            </label>
            <button type="button" class="btn-restablecer" @click="restablecerOrbes">Restablecer Orbes</button>
          </div>
        </div>
      </div>
      <div class="acciones-apariencia">
        <span v-if="mensaje" class="mensaje-apariencia" :class="{ error: esError }">{{ mensaje }}</span>
        <ion-button class="btn-guardar-apariencia" :disabled="guardando" @click="guardarCambios">
          <ion-icon slot="start" :icon="saveOutline" />
          {{ guardando ? 'Guardando...' : 'Guardar cambios' }}
        </ion-button>
      </div>

    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { IonIcon, onIonViewWillEnter } from '@ionic/vue'
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import AppShell from '@/components/AppShell.vue'
import logoPredeterminado from '@/assets/logo.png'
import { useSesion } from '@/composables/useSesion'
import { aparienciaPredeterminada, type AparienciaConfig, useApariencia } from '@/composables/useApariencia'
import { getApiBaseUrl } from '@/composables/useApiConfig'
import {
  addOutline,
  alertCircleOutline,
  calendarClearOutline,
  cashOutline,
  checkmarkCircleOutline,
  closeOutline,
  logInOutline,
  logOutOutline,
  peopleOutline,
  personOutline,
  refreshOutline,
  saveOutline,
  settingsOutline,
  timeOutline,
} from 'ionicons/icons'

/* ───────────── Sesión real (viene del login por PIN) ───────────── */
const { usuarioActual, esAdministrador } = useSesion()
const { apariencia, cargarApariencia, guardarApariencia: guardarAparienciaServidor } = useApariencia()
const borrador = reactive<AparienciaConfig>({ ...aparienciaPredeterminada })
const subiendoImagen = ref<'appShellImagen' | 'loginImagen' | null>(null)
const guardando = ref(false)
const mensaje = ref('')
const esError = ref(false)

const previewLoginStyle = computed(() => ({
  backgroundColor: borrador.loginColor,
  backgroundImage: 'none'
}))

onIonViewWillEnter(async () => {
  await cargarApariencia(true)
  Object.assign(borrador, apariencia)
})

const restablecerAppShell = () => {
  borrador.appShellColor = aparienciaPredeterminada.appShellColor
  borrador.appShellHeaderColor = aparienciaPredeterminada.appShellHeaderColor
  borrador.appShellImagen = aparienciaPredeterminada.appShellImagen
}

const restablecerLogin = () => {
  borrador.loginColor = aparienciaPredeterminada.loginColor
  borrador.loginImagen = aparienciaPredeterminada.loginImagen
}

const restablecerOrbes = () => {
  borrador.orbColorUno = aparienciaPredeterminada.orbColorUno
  borrador.orbColorDos = aparienciaPredeterminada.orbColorDos
}

const restablecerCampo = (campo: keyof AparienciaConfig) => {
  borrador[campo] = aparienciaPredeterminada[campo]
}

const guardarCambios = async () => {
  guardando.value = true
  mensaje.value = ''
  try {
    await guardarAparienciaServidor(borrador)
    mensaje.value = 'Cambios guardados correctamente.'
    esError.value = false
  } catch (error) {
    mensaje.value = error instanceof Error ? error.message : 'No se pudieron guardar los cambios.'
    esError.value = true
  } finally {
    guardando.value = false
  }
}

const subirImagen = async (event: Event, campo: 'appShellImagen' | 'loginImagen') => {
  const input = event.target as HTMLInputElement
  const archivo = input.files?.[0]
  input.value = ''
  if (!archivo) return

  subiendoImagen.value = campo
  try {
    const formulario = new FormData()
    formulario.append('imagen', archivo)
    formulario.append('campo', campo)
    const respuesta = await fetch(`${getApiBaseUrl()}/apariencia/imagen`, {
      method: 'POST',
      body: formulario
    })
    const datos = await respuesta.json().catch(() => null)
    if (!respuesta.ok || typeof datos?.url !== 'string') {
      throw new Error(datos?.error ?? 'No se pudo subir la imagen.')
    }
    borrador[campo] = datos.url
  } catch (error) {
    window.alert(error instanceof Error ? error.message : 'No se pudo subir la imagen.')
  } finally {
    subiendoImagen.value = null
  }
}


/* ───────────── Reloj para calcular ventanas de marcaje y auto-cierre ───────────── */
const ahora = ref(new Date())
let relojId: any = null
onMounted(() => {
  relojId = setInterval(() => (ahora.value = new Date()), 1000)
})
onUnmounted(() => {
  if (relojId) clearInterval(relojId)
})


/* ───────────── Utilidades ───────────── */
const inicial = (nombre: string) => nombre.trim().charAt(0).toUpperCase()
</script>

<style scoped>
.horarios-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
  color-scheme: light;
}

/* ── Tarjeta base (reutiliza look del Home) ── */
.config-card {
  background: #ffffff;
  border: 1px solid rgba(10, 31, 56, 0.07);
  border-radius: 20px;
  padding: 20px 22px;
  box-shadow: 0 10px 26px rgba(10, 31, 56, 0.06);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.apariencia-card {
  gap: 20px;
  background: linear-gradient(145deg, #ffffff 0%, #f2fafb 100%);
  animation: aparecer 0.55s ease both;
}

.btn-restablecer-apariencia,
.btn-subir-apariencia {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  border: 1px solid rgba(18, 58, 102, 0.14);
  border-radius: 10px;
  padding: 8px 13px;
  background: #ffffff;
  color: #123a66;
  font-size: 0.78rem;
  font-weight: 800;
  cursor: pointer;
  transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
}

.btn-restablecer-apariencia:hover,
.btn-subir-apariencia:hover {
  transform: translateY(-1px);
  border-color: rgba(22, 139, 131, 0.4);
  background: #f4fbfa;
  box-shadow: 0 6px 14px rgba(10, 31, 56, 0.08);
}

.apariencia-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.apariencia-seccion {
  display: grid;
  align-content: start;
  gap: 10px;
  padding: 16px;
  border: 1px solid rgba(10, 31, 56, 0.08);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.78);
  animation: aparecer 0.55s ease both;
  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}

.apariencia-seccion:hover {
  transform: translateY(-3px);
  border-color: rgba(22, 139, 131, 0.28);
  box-shadow: 0 10px 22px rgba(10, 31, 56, 0.08);
}

.apariencia-seccion:nth-child(2) { animation-delay: 0.08s; }
.apariencia-seccion:nth-child(3) { animation-delay: 0.16s; }
.apariencia-seccion:nth-child(1) { border-top: 3px solid #168b83; }
.apariencia-seccion:nth-child(2) { border-top: 3px solid #4169a1; }
.apariencia-seccion:nth-child(3) { border-top: 3px solid #d97706; }

@keyframes aparecer {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.apariencia-seccion > strong {
  color: #0a1f38;
}

.apariencia-titulo {
  display: flex;
  align-items: center;
  gap: 7px;
  padding-bottom: 1px;
  color: #123a66;
  font-size: 1rem;
}

.apariencia-descripcion {
  margin: -5px 0 3px;
  color: #7b8fa4;
  font-size: 0.74rem;
  line-height: 1.35;
}

.apariencia-campo {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 9px 10px;
  border: 1px solid rgba(10, 31, 56, 0.06);
  border-radius: 11px;
  background: rgba(255, 255, 255, 0.78);
  color: #4a627e;
  font-size: 0.8rem;
  font-weight: 700;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.apariencia-campo:focus-within {
  border-color: rgba(22, 139, 131, 0.34);
  box-shadow: 0 0 0 3px rgba(22, 139, 131, 0.08);
}

.apariencia-campo input[type='url'] {
  grid-column: 1 / -1;
  width: 100%;
  border: 1px solid rgba(10, 31, 56, 0.14);
  border-radius: 9px;
  padding: 8px 10px;
  outline: none;
  color: #0a1f38;
  background: #ffffff;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.apariencia-campo input[type='url']:focus {
  border-color: #168b83;
  box-shadow: 0 0 0 3px rgba(22, 139, 131, 0.12);
}

.apariencia-control,
.apariencia-control-apilado {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.apariencia-control-apilado {
  grid-column: 1 / -1;
  width: 100%;
  flex-wrap: wrap;
}

.apariencia-control-apilado input[type='url'] {
  flex: 1;
  min-width: 180px;
}

.apariencia-control button,
.apariencia-control-apilado button {
  border: 1px solid rgba(18, 58, 102, 0.12);
  border-radius: 8px;
  padding: 6px 8px;
  background: #f7fafc;
  color: #41627f;
  font-size: 0.68rem;
  font-weight: 800;
  white-space: nowrap;
  cursor: pointer;
  transition: color 0.18s ease, background 0.18s ease, border-color 0.18s ease;
}

.apariencia-control button:hover,
.apariencia-control-apilado button:hover {
  border-color: rgba(22, 139, 131, 0.3);
  background: #eaf7f5;
  color: #08766f;
}

.apariencia-campo input[type='color'] {
  width: 46px;
  height: 34px;
  padding: 2px;
  border: 1px solid rgba(10, 31, 56, 0.14);
  border-radius: 9px;
  background: #ffffff;
  cursor: pointer;
}

.btn-subir-apariencia {
  justify-self: start;
}

.btn-restablecer {
  justify-self: start;
  border: 1px solid rgba(18, 58, 102, 0.13);
  border-radius: 9px;
  padding: 7px 10px;
  background: #f8fbfd;
  color: #41627f;
  font-size: 0.72rem;
  font-weight: 800;
  cursor: pointer;
  transition: color 0.18s ease;
}

.btn-restablecer:hover {
  border-color: rgba(22, 139, 131, 0.3);
  background: #eaf7f5;
  color: #08766f;
}

.btn-subir-apariencia.cargando {
  opacity: 0.6;
  cursor: wait;
}

.login-preview {
  position: relative;
  display: grid;
  grid-template-columns: 0.8fr 1.2fr;
  align-items: center;
  gap: 10px;
  min-height: 226px;
  overflow: hidden;
  padding: 16px;
  border-radius: 12px;
  background-position: center;
  background-size: cover;
  color: #ffffff;
  isolation: isolate;
}

.login-preview::before {
  position: absolute;
  inset: 0;
  z-index: -1;
  background: rgba(8, 26, 48, 0.35);
  content: '';
}

.preview-orb { position: absolute; border-radius: 50%; filter: blur(1px); opacity: 0.5; }
.preview-orb-uno { top: -34px; left: -28px; width: 106px; height: 106px; }
.preview-orb-dos { right: -34px; bottom: -42px; width: 132px; height: 132px; }
.preview-brand { position: relative; z-index: 1; display: grid; justify-items: center; gap: 4px; text-align: center; }
.preview-logo { display: grid; place-items: center; width: 54px; height: 54px; margin-bottom: 5px; border: 2px solid rgba(255, 255, 255, 0.6); border-radius: 16px; background: rgba(255, 255, 255, 0.18); font-size: 28px; }
.preview-logo img { width: 100%; height: 100%; border-radius: 12px; object-fit: cover; }
.preview-brand strong { font-size: 0.78rem; font-weight: 900; }
.preview-brand small { font-size: 0.62rem; opacity: 0.8; }
.preview-card { position: relative; z-index: 1; display: grid; justify-items: center; gap: 7px; padding: 13px 11px; border: 1px solid rgba(255, 255, 255, 0.4); border-radius: 12px; ; color: #fbfbfb; box-shadow: 0 10px 22px rgba(0, 0, 0, 0.16); }
.preview-avatar { color: #168b83; font-size: 23px; }
.preview-card strong { font-size: 0.61rem; }
.preview-dots { display: flex; gap: 4px; padding: 5px 8px; border-radius: 6px; background: #eef4f8; }
.preview-dots i { width: 5px; height: 5px; border-radius: 50%; background: #168b83; }
.preview-keypad { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; width: 100%; }
.preview-keypad span { display: grid; place-items: center; min-height: 18px; border-radius: 4px; background: #f1f6f8; color: #123a66; font-size: 0.62rem; font-weight: 800; }

.acciones-apariencia {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  padding: 4px 2px 2px;
  border-top: 1px solid rgba(10, 31, 56, 0.08);
}

.mensaje-apariencia { color: #08766f; font-size: 0.82rem; font-weight: 700; }
.mensaje-apariencia.error { color: #b74444; }
.btn-guardar-apariencia {
  --background: #123a66;
  --background-hover: #0d2b4e;
  --border-radius: 11px;
  --padding-start: 18px;
  --padding-end: 18px;
  --padding-top: 10px;
  --padding-bottom: 10px;
  font-weight: 800;
  box-shadow: 0 8px 16px rgba(18, 58, 102, 0.18);
}

@media (prefers-reduced-motion: reduce) {
  .apariencia-card,
  .apariencia-seccion { animation: none; }
}

.config-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(10, 31, 56, 0.07);
}

.config-card-label {
  font-size: 0.78rem;
  font-weight: 800;
  color: #6d829c;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.config-card-hint {
  margin: 0;
  font-size: 0.76rem;
  color: #9fb4c9;
}

.apariencia-subtitulo {
  margin: 5px 0 0;
  color: #7890a7;
  font-size: 0.8rem;
  line-height: 1.4;
}

.config-add-btn {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: none;
  background: rgba(18, 58, 102, 0.08);
  color: #123a66;
  display: grid;
  place-items: center;
  cursor: pointer;
}

/* ── Badge de rol + usuario actual ── */
.badge-rol {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(159, 180, 201, 0.2);
  color: #4a627e;
  font-weight: 800;
  font-size: 0.76rem;
}

.badge-rol ion-icon {
  font-size: 14px;
}

.badge-rol.admin {
  background: rgba(18, 58, 102, 0.12);
  color: #123a66;
}

.usuario-actual {
  display: flex;
  align-items: center;
  gap: 10px;
}

.usuario-nombre {
  margin: 0;
  font-weight: 800;
  color: #0a1f38;
  font-size: 0.95rem;
}

.usuario-actual small {
  color: #6d829c;
  font-size: 0.78rem;
}

/* ── Toggle de periodo de pago ── */
.rol-toggle {
  display: flex;
  background: #f5f9fc;
  border-radius: 999px;
  padding: 4px;
  gap: 4px;
}

.rol-toggle button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 999px;
  border: none;
  background: transparent;
  color: #4a627e;
  font-weight: 700;
  font-size: 0.82rem;
  cursor: pointer;
}

.rol-toggle button.active {
  background: #123a66;
  color: #f5f9fc;
}

.rol-toggle.chico button {
  padding: 6px 12px;
  font-size: 0.76rem;
}

/* ── Grid de dos columnas ── */
.home-grid-row {
  display: grid;
  grid-template-columns: 1.05fr 1fr;
  gap: 18px;
  align-items: start;
}

.accesos-card,
.tareas-card {
  background: #ffffff;
  border: 1px solid rgba(10, 31, 56, 0.08);
  border-radius: 18px;
  padding: 18px;
  box-shadow: 0 4px 12px rgba(10, 31, 56, 0.05);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 4px 2px 16px;
  border-bottom: 1px solid rgba(10, 31, 56, 0.08);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 800;
  color: #0a1f38;
  font-size: 1.08rem;
}

.card-title ion-icon {
  color: #123a66;
  font-size: 18px;
}

/* ── Estados vacíos ── */
.estado-vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 4px;
  padding: 26px 10px;
  color: #6d829c;
}

.estado-vacio-icon {
  font-size: 32px;
  color: #a9c3d8;
  margin-bottom: 4px;
}

.estado-vacio-titulo {
  margin: 0;
  font-weight: 800;
  color: #0a1f38;
}

.estado-vacio-texto {
  margin: 0;
  font-size: 0.86rem;
  max-width: 360px;
}

.estado-vacio-mini {
  color: #9fb4c9;
  font-size: 0.85rem;
  text-align: center;
  padding: 12px 0;
}

/* ── Lista de empleados (config de pago) ── */
.lista-empleados {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.empleado-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #f5f9fc;
}

.empleado-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.empleado-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #123a66;
  color: #f5f9fc;
  display: grid;
  place-items: center;
  font-weight: 800;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.empleado-avatar.chico {
  width: 28px;
  height: 28px;
  font-size: 0.75rem;
}

.empleado-texto {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.empleado-nombre {
  font-weight: 700;
  color: #0a1f38;
  font-size: 0.92rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empleado-rol-chip {
  align-self: flex-start;
  font-size: 0.7rem;
  font-weight: 800;
  color: #4a627e;
  background: rgba(74, 98, 126, 0.1);
  padding: 2px 8px;
  border-radius: 999px;
}

.empleado-pago {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #ffffff;
  border: 1px solid rgba(10, 31, 56, 0.1);
  border-radius: 10px;
  padding: 4px 8px;
  font-weight: 700;
  color: #0a1f38;
  flex-shrink: 0;
}

.empleado-pago input {
  width: 56px;
  border: none;
  outline: none;
  font-weight: 700;
  color: #0a1f38;
  background: transparent;
}

.empleado-pago-sufijo {
  color: #6d829c;
  font-size: 0.78rem;
}

.empleado-borrar {
  border: none;
  background: none;
  color: #9fb4c9;
  cursor: pointer;
  font-size: 16px;
  flex-shrink: 0;
}

/* ── Formulario de turno ── */
.form-turno {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-turno-fila {
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-turno-guion {
  color: #6d829c;
  font-size: 0.8rem;
}

.input-select {
  width: 100%;
  border: 1px solid rgba(10, 31, 56, 0.14);
  background: #f5f9fc;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #0a1f38;
  outline: none;
}

.checkbox-horas-extra {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #4a627e;
  padding: 4px 2px;
  cursor: pointer;
}

.checkbox-horas-extra input {
  width: 16px;
  height: 16px;
  accent-color: #123a66;
}

.btn-programar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: none;
  border-radius: 12px;
  padding: 11px;
  background: #123a66;
  color: #f5f9fc;
  font-weight: 800;
  font-size: 0.9rem;
  cursor: pointer;
}

.btn-programar:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.subtitulo-lista {
  margin: 4px 0 0;
  font-size: 0.78rem;
  font-weight: 800;
  color: #6d829c;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.lista-turnos {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 180px;
  overflow-y: auto;
}

.turno-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 10px;
  background: #f5f9fc;
}

.turno-info {
  flex: 1;
  display: grid;
  gap: 1px;
}

.turno-empleado {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  color: #0a1f38;
  font-size: 0.88rem;
}

.turno-info small {
  color: #6d829c;
  font-size: 0.78rem;
}

.chip-horas-extra {
  font-size: 0.68rem;
  font-weight: 800;
  color: #b45309;
  background: rgba(217, 119, 6, 0.15);
  padding: 2px 8px;
  border-radius: 999px;
  white-space: nowrap;
}

.chip-horas-extra.chico {
  font-size: 0.62rem;
  padding: 1px 6px;
}

/* ── Registro de hoy ── */
.lista-registro-hoy {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.registro-hoy-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #f5f9fc;
  flex-wrap: wrap;
}

.registro-hoy-nombre {
  flex: 1;
  font-weight: 700;
  color: #0a1f38;
  font-size: 0.88rem;
}

.registro-hoy-hora {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.82rem;
  color: #4a627e;
  font-weight: 600;
}

.registro-hoy-hora ion-icon {
  font-size: 14px;
}

.badge-puntualidad {
  font-size: 0.72rem;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 999px;
}

.badge-puntualidad.tarde {
  background: rgba(220, 38, 38, 0.12);
  color: #b91c1c;
}

.badge-estado {
  font-size: 0.72rem;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(159, 180, 201, 0.25);
  color: #6d829c;
}

.badge-estado.activo {
  background: rgba(217, 119, 6, 0.15);
  color: #b45309;
}

.badge-estado.completo {
  background: rgba(18, 58, 102, 0.12);
  color: #123a66;
}

/* ── Pago por empleado ── */
.lista-pagos {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pago-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  background: #f5f9fc;
  flex-wrap: wrap;
}

.pago-info {
  flex: 1;
  min-width: 160px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.pago-nombre {
  margin: 0;
  font-weight: 700;
  color: #0a1f38;
  font-size: 0.9rem;
}

.pago-info small {
  color: #6d829c;
  font-size: 0.78rem;
}

.pago-monto {
  text-align: right;
  min-width: 100px;
}

.pago-monto-cifra {
  display: block;
  font-weight: 800;
  color: #0a1f38;
  font-size: 1.05rem;
}

.pago-monto small {
  color: #9fb4c9;
  font-size: 0.72rem;
}

.btn-pagar {
  border: none;
  border-radius: 10px;
  padding: 9px 14px;
  background: #123a66;
  color: #f5f9fc;
  font-weight: 700;
  font-size: 0.82rem;
  cursor: pointer;
}

.btn-pagar:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* ── Resumen del turno de hoy (personal) ── */
.turno-hoy-resumen {
  font-size: 0.86rem;
  color: #4a627e;
  background: #f5f9fc;
  border-radius: 10px;
  padding: 8px 12px;
}

.turno-hoy-resumen strong {
  color: #123a66;
}

.turno-hoy-resumen.sin-turno {
  color: #9fb4c9;
}

/* ── Toggles de entrada / salida ── */
.toggle-fila {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-radius: 12px;
  background: #f5f9fc;
  gap: 10px;
}

.toggle-texto {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.toggle-texto span {
  font-weight: 700;
  color: #0a1f38;
  font-size: 0.92rem;
}

.toggle-texto small {
  color: #6d829c;
  font-size: 0.78rem;
}

.toggle-texto small.ventana-motivo {
  color: #b45309;
}

.switch {
  position: relative;
  width: 50px;
  height: 28px;
  flex-shrink: 0;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.switch-riel {
  position: absolute;
  inset: 0;
  background: #d6e2ec;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.switch-riel::before {
  content: '';
  position: absolute;
  width: 22px;
  height: 22px;
  left: 3px;
  top: 3px;
  background: #ffffff;
  border-radius: 50%;
  transition: transform 0.2s ease;
  box-shadow: 0 1px 3px rgba(10, 31, 56, 0.25);
}

.switch input:checked + .switch-riel {
  background: #123a66;
}

.switch input:checked + .switch-riel::before {
  transform: translateX(22px);
}

.switch input:disabled + .switch-riel {
  opacity: 0.45;
  cursor: not-allowed;
}

/* ── Estado de puntualidad (personal) ── */
.puntualidad-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
  padding: 10px;
  border-radius: 10px;
  background: rgba(18, 58, 102, 0.1);
  color: #123a66;
  font-weight: 800;
  font-size: 0.88rem;
}

.puntualidad-badge ion-icon {
  font-size: 16px;
}

.puntualidad-badge.tarde {
  background: rgba(220, 38, 38, 0.12);
  color: #b91c1c;
}

/* ── Calendario semanal (personal) ── */
.calendario-semana {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dia-chip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #f5f9fc;
  flex-wrap: wrap;
}

.dia-chip.hoy {
  background: rgba(18, 58, 102, 0.1);
  border: 1px solid rgba(18, 58, 102, 0.25);
}

.dia-chip.libre {
  opacity: 0.7;
}

.dia-chip-encabezado {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 90px;
}

.dia-chip-nombre {
  font-weight: 700;
  color: #0a1f38;
  font-size: 0.86rem;
  text-transform: capitalize;
}

.dia-chip-fecha {
  color: #9fb4c9;
  font-size: 0.72rem;
}

.dia-chip-horario {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  color: #123a66;
  font-size: 0.86rem;
}

.dia-chip-libre {
  color: #9fb4c9;
  font-size: 0.82rem;
  font-weight: 600;
}

/* ── Responsive ── */
@media (max-width: 900px) {
  .home-grid-row {
    grid-template-columns: 1fr;
  }

  .apariencia-grid {
    grid-template-columns: 1fr;
  }

  .config-card {
    padding: 18px;
  }

  .apariencia-control-apilado input[type='url'] {
    min-width: 0;
  }

  .acciones-apariencia {
    align-items: stretch;
    flex-direction: column;
  }

  .btn-guardar-apariencia {
    width: 100%;
    margin: 0;
  }
}

@media (max-width: 480px) {
  .config-card-header,
  .card-header-row {
    align-items: flex-start;
    gap: 10px;
  }

  .apariencia-seccion {
    padding: 14px;
  }

  .apariencia-campo {
    grid-template-columns: 1fr;
    align-items: start;
  }

  .apariencia-control,
  .apariencia-control-apilado {
    width: 100%;
  }

  .apariencia-control {
    justify-content: space-between;
  }

  .apariencia-control-apilado {
    align-items: stretch;
    flex-direction: column;
  }

  .apariencia-control-apilado button {
    align-self: flex-start;
  }

  .login-preview {
    grid-template-columns: 1fr;
    min-height: 340px;
  }
}
</style>
