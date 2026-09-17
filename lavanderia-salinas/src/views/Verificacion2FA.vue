<template>
  <ion-page class="force-light" :style="estiloLogin">
    <ion-content class="keypad-container" :scroll-y="false" :style="estiloLogin">
      <div v-if="cargando" class="loading-overlay">
        <div class="escena-lavado">
          <svg class="lavadora-animada" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <rect x="14" y="8" width="72" height="84" rx="14" fill="#0d2b4e" stroke="#a9d8ee" stroke-width="2"/>
            <line x1="14" y1="26" x2="86" y2="26" stroke="#a9d8ee" stroke-width="1.5" opacity="0.6"/>
            <circle cx="74" cy="17" r="2" fill="#a9d8ee"/>
            <circle cx="66" cy="17" r="2" fill="#a9d8ee"/>
            <circle class="drum-ring" cx="50" cy="58" r="26" fill="#cfe9f5" stroke="#a9d8ee" stroke-width="3"/>
            <clipPath id="drumClip">
              <circle cx="50" cy="58" r="21" />
            </clipPath>
            <g clip-path="url(#drumClip)">
              <rect class="agua agua-1" x="20" y="58" width="60" height="30" fill="#123a66"/>
              <rect class="agua agua-2" x="20" y="62" width="60" height="26" fill="#a9d8ee" opacity="0.75"/>
            </g>
          </svg>
          <div class="sombra-suelo"></div>
        </div>
        <p>Verificando código…</p>
      </div>

      <div class="desktop-layout">
        <section class="keypad-side">
          <div class="login-card">
            <div class="logo-container mobile-logo-wrap">
              <img :src="logoActual" alt="Lavandería Salinas" class="logo mobile-logo" :class="{ 'logo-cargando': logoCargando }" @load="terminarCargaLogo" @error="usarLogoLocal" />
              <span v-if="logoCargando" class="logo-cargando-indicador" aria-label="Cargando logo"></span>
            </div>
            <div v-if="logoConexionError" class="logo-conexion-error">
              <ion-icon :icon="warningOutline" />
              <span>Revisa tu conexión a internet</span>
            </div>

            <div class="user-avatar-container">
              <div class="avatar-shell">
                <ion-icon :icon="shieldCheckmarkOutline" class="user-avatar" />
              </div>
              <span class="user-avatar-text">Verificación en dos pasos</span>
            </div>

            <div class="info-correo">
              <p>Hemos enviado un código de 4 dígitos a:</p>
              <p class="correo-destino">{{ correoUsuario }}</p>
            </div>

            <div class="pad-relativo">
              <div class="display-shell">
                <div v-if="codigo.length > 0" class="display-container">
                  <div class="display" :class="{ empty: codigo.length === 0 }">
                    <span
                      v-for="(char, index) in codigo"
                      :key="index"
                      class="dot"
                      :class="{ filled: !!char }"
                    ></span>
                  </div>
                </div>
              </div>

              <ion-grid class="keypad-grid">
                <ion-row v-for="fila in teclas" :key="fila.join('-')">
                  <ion-col v-for="n in fila" :key="n" size="4" class="key-col">
                    <ion-button class="key" fill="clear" :disabled="cargando" @click="presionar(n)">
                      {{ n }}
                    </ion-button>
                  </ion-col>
                </ion-row>
                <ion-row>
                  <ion-col size="4" class="key-col">
                  </ion-col>

                  <ion-col size="4" class="key-col">
                    <ion-button class="key" fill="clear" :disabled="cargando" @click="presionar('0')">
                      0
                    </ion-button>
                  </ion-col>

                  <ion-col size="4" class="key-col">
                    <ion-button class="borrar-btn" fill="clear" :disabled="cargando" @click="borrar">
                      <span class="delete-symbol">⌫</span>
                    </ion-button>
                  </ion-col>
                </ion-row>
              </ion-grid>
            </div>

            <div class="botones-extra">
              <button
                class="btn-cancelar"
                :disabled="cargando"
                @click="cancelar"
              >
                Cancelar
              </button>
              <button
                class="btn-reenviar"
                :disabled="cargando || tiempoReenvio > 0"
                @click="reenviarCodigo"
              >
                {{ tiempoReenvio > 0 ? `Reenviar en ${tiempoReenvio}s` : 'Reenviar código' }}
              </button>
            </div>
          </div>
        </section>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  toastController
} from '@ionic/vue'
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import logo from '@/assets/logo.png'
import { shieldCheckmarkOutline, warningOutline } from 'ionicons/icons'
import { getApiBaseUrl } from '@/composables/useApiConfig'
import { useApariencia } from '@/composables/useApariencia'
import { guardarUsuarioConfiable } from '@/composables/use2FAConfiable'

const { apariencia, estiloLogin } = useApariencia()
const logoCloudinaryFallido = ref(false)
const logoCargando = ref(false)
const logoConexionError = ref(false)
const logoActual = computed(() => logoCloudinaryFallido.value ? logo : (apariencia.loginImagen || logo))
const terminarCargaLogo = () => {
  logoCargando.value = false
}
const usarLogoLocal = () => {
  if (apariencia.loginImagen && !logoCloudinaryFallido.value) {
    logoConexionError.value = true
  }
  logoCloudinaryFallido.value = true
  logoCargando.value = false
}

watch(() => apariencia.loginImagen, (imagen) => {
  logoCloudinaryFallido.value = false
  logoCargando.value = Boolean(imagen)
  logoConexionError.value = false
}, { immediate: true })

const router = useRouter()
const route = useRoute()

const codigo = ref('')
const cargando = ref(false)
const validando = ref(false)
const correoUsuario = ref('')
const usuarioId = ref('')
const tiempoReenvio = ref(0)
let intervaloReenvio: any = null

const teclas = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9']
]

onMounted(() => {
  // Obtener datos del usuario de los parámetros de ruta
  correoUsuario.value = route.query.correo as string || ''
  usuarioId.value = route.query.usuarioId as string || ''

  if (!correoUsuario.value || !usuarioId.value) {
    router.replace('/login')
    return
  }

  iniciarContadorReenvio()
})

onUnmounted(() => {
  if (intervaloReenvio) {
    clearInterval(intervaloReenvio)
    intervaloReenvio = null
  }
})

const handleKeydown = (e: KeyboardEvent) => {
  if (cargando.value) return

  const key = e.key

  if (/^[0-9]$/.test(key)) {
    presionar(key)
  } else if (key === 'Backspace') {
    borrar()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

const presionar = (n: string) => {
  if (!cargando.value && codigo.value.length < 4) {
    codigo.value += n
  }
}

const borrar = () => {
  if (!cargando.value) {
    codigo.value = codigo.value.slice(0, -1)
  }
}

watch(codigo, async (nuevo) => {
  if (nuevo.length !== 4) return
  if (validando.value) return

  validando.value = true
  cargando.value = true

  try {
    console.log('Verificando código 2FA:', {
      usuarioId: usuarioId.value,
      codigo: codigo.value
    })

    const respuesta = await fetch(`${getApiBaseUrl()}/equipo/verificar-2fa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usuarioId: usuarioId.value,
        codigo: codigo.value
      })
    })

    console.log('Respuesta del servidor:', respuesta.status)

    if (!respuesta.ok) {
      const error = await respuesta.json().catch(() => ({ error: 'Error al verificar código' }))
      console.log('Error del servidor:', error)
      throw new Error(error.error || 'Código inválido')
    }

    const usuario = await respuesta.json()
    console.log('Usuario autenticado:', usuario)

    localStorage.setItem('usuario', JSON.stringify({
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol,
      creadoEn: usuario.creadoEn ?? usuario.created_at,
      imagenPerfil: usuario.imagenPerfil,
      cambiosImagenPerfil: usuario.cambiosImagenPerfil
    }))
    localStorage.setItem('rol', usuario.rol)
    localStorage.setItem('codigo', usuario.codigo)
    await guardarUsuarioConfiable(usuario.codigo, usuario)

    const toast = await toastController.create({
      message: `¡Bienvenid@ ${usuario.nombre}!`,
      duration: 1200,
      color: 'success'
    })
    toast.present()

    setTimeout(() => {
      router.replace(usuario.rol === 'operador' ? '/tabs/ordenes' : '/tabs/principal')
    }, 1000)
  } catch (error: any) {
    console.error('Error al verificar código 2FA:', error)
    const toast = await toastController.create({
      message: error.message || 'Código inválido. Intenta nuevamente.',
      duration: 2500,
      color: 'danger'
    })
    toast.present()
  } finally {
    cargando.value = false
    validando.value = false
    codigo.value = ''
  }
})

const cancelar = () => {
  router.replace('/login')
}

const reenviarCodigo = async () => {
  try {
    const respuesta = await fetch(`${getApiBaseUrl()}/auth2fa/enviar-codigo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usuarioId: usuarioId.value,
        correo: correoUsuario.value
      })
    })

    if (!respuesta.ok) {
      const error = await respuesta.json().catch(() => ({ error: 'No se pudo reenviar el código.' }))
      throw new Error(error.error || 'No se pudo reenviar el código.')
    }

    const toast = await toastController.create({
      message: 'Nuevo código enviado a tu correo.',
      duration: 2500,
      color: 'success'
    })
    toast.present()

    iniciarContadorReenvio()
  } catch (error) {
    const toast = await toastController.create({
      message: error instanceof Error ? error.message : 'Error al reenviar código. Intenta nuevamente.',
      duration: 2500,
      color: 'danger'
    })
    toast.present()
  }
}

const iniciarContadorReenvio = () => {
  tiempoReenvio.value = 60
  if (intervaloReenvio) clearInterval(intervaloReenvio)

  intervaloReenvio = setInterval(() => {
    tiempoReenvio.value--
    if (tiempoReenvio.value <= 0) {
      clearInterval(intervaloReenvio)
      intervaloReenvio = null
    }
  }, 1000)
}
</script>

<style scoped>
ion-content {
  --background:
    radial-gradient(circle at 8% 10%,  rgba(18, 58, 102, 0.20) 0%, transparent 30%),
    radial-gradient(circle at 92% 8%,  rgba(169, 216, 238, 0.18) 0%, transparent 25%),
    radial-gradient(circle at 50% 50%, rgba(207, 233, 245, 0.12) 0%, transparent 40%),
    radial-gradient(circle at 15% 80%, rgba(18, 58, 102, 0.14) 0%, transparent 28%),
    radial-gradient(circle at 85% 75%, rgba(169, 216, 238, 0.12) 0%, transparent 30%),
    linear-gradient(160deg, #f5f9fc 0%, #eef4f8 45%, #e7eff5 100%);
  color: #0a1f38;
}

.loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(8, 16, 28, 0.78);
  backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 35px;
  text-align: center;
}

.loading-overlay p {
  font-size: 18px;
  font-weight: 700;
  color: #a9d8ee;
  margin: 0;
}

.escena-lavado {
  position: relative;
  width: 100px;
  height: 100px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.lavadora-animada {
  width: 92px;
  height: 92px;
  z-index: 2;
  animation: giroSuave 2.4s ease-in-out infinite;
  transform-origin: center center;
}

.drum-ring {
  animation: pulsoAro 2.4s ease-in-out infinite;
}

.agua {
  animation: chapoteo 1.6s ease-in-out infinite;
  transform-origin: center;
}
.agua-2 {
  animation-delay: -0.5s;
  animation-duration: 1.9s;
}

@keyframes giroSuave {
  0%   { transform: rotate(0deg); }
  50%  { transform: rotate(8deg); }
  100% { transform: rotate(0deg); }
}

@keyframes pulsoAro {
  0%, 100% { stroke-width: 3; }
  50%      { stroke-width: 1.5; }
}

@keyframes chapoteo {
  0%, 100% { transform: translateX(-4%) rotate(-3deg); }
  50%      { transform: translateX(4%) rotate(3deg); }
}

.sombra-suelo {
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  width: 70px;
  height: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 50%;
  z-index: 1;
  animation: sombraEscala 2.4s ease-in-out infinite;
}

@keyframes sombraEscala {
  0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.7; }
  50%      { transform: translateX(-50%) scale(0.85); opacity: 0.4; }
}

@keyframes popIn {
  from { transform: scale(0.5); opacity: 0; }
  to   { transform: scale(1); opacity: 1; }
}

.keypad-container {
  --background:
    radial-gradient(circle at 8% 10%,  rgba(169, 216, 238, 0.20) 0%, transparent 28%),
    radial-gradient(circle at 90% 6%,  rgba(207, 233, 245, 0.26) 0%, transparent 26%),
    radial-gradient(circle at 50% 52%, rgba(207, 233, 245, 0.14) 0%, transparent 38%),
    radial-gradient(circle at 12% 82%, rgba(169, 216, 238, 0.20) 0%, transparent 30%),
    radial-gradient(circle at 88% 78%, rgba(18, 58, 102, 0.18) 0%, transparent 26%),
    linear-gradient(160deg, var(--login-color) 0%, color-mix(in srgb, var(--login-color) 82%, #123a66) 100%) !important;
  background-image: var(--login-imagen) !important;
  background-size: cover;
  background-position: center;
  background-blend-mode: soft-light;
  min-height: 100%;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 16px;
  position: relative;
  overflow: hidden;
}

.keypad-container::before,
.keypad-container::after {
  content: '';
  position: absolute;
  border-radius: 999px;
  pointer-events: none;
}

.keypad-container::before {
  width: 220px;
  height: 220px;
  background: color-mix(in srgb, var(--orb-color-uno) 20%, transparent);
  top: -90px;
  right: -60px;
  filter: blur(4px);
}

.keypad-container::after {
  width: 180px;
  height: 180px;
  background: color-mix(in srgb, var(--orb-color-dos) 32%, transparent);
  bottom: -70px;
  left: -50px;
  filter: blur(8px);
}

.desktop-layout {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 100%;
  gap: 18px;
  position: relative;
  z-index: 1;
}

.keypad-side {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.login-card {
  width: 100%;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 22px 18px 18px;
  position: relative;
}

.logo-container {
  position: relative;
  display: flex;
  justify-content: center;
  margin: 6px 0 10px;
}

.logo-cargando {
  opacity: 0.35;
}

.logo-cargando-indicador {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 28px;
  height: 28px;
  margin: -14px 0 0 -14px;
  border: 3px solid rgba(18, 58, 102, 0.2);
  border-top-color: #123a66;
  border-radius: 50%;
  animation: giroLogo 0.8s linear infinite;
}

.logo-conexion-error {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin: -14px auto 10px;
  color: #b45309;
  font-size: 0.78rem;
  font-weight: 700;
  text-align: center;
}

.logo-conexion-error ion-icon {
  flex-shrink: 0;
  font-size: 1.1rem;
}

@keyframes giroLogo {
  to { transform: rotate(360deg); }
}

.mobile-logo-wrap {
  display: flex;
  justify-content: center;
}

.mobile-logo {
  width: 120px;
  max-width: 40vw;
  margin-bottom: 20px;
}

.user-avatar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
  text-align: center;
}

.avatar-shell {
  width: 92px;
  height: 92px;
  border-radius: 28px;
  display: grid;
  place-items: center;
  background: rgba(169, 216, 238, 0.10);
  border: 1px solid rgba(169, 216, 238, 0.20);
  margin-bottom: 12px;
}

.user-avatar {
  font-size: 64px;
  color: #a9d8ee;
}

.user-avatar-text {
  font-size: 1rem;
  color: #eaf4fa;
  font-weight: 800;
}

.info-correo {
  text-align: center;
  margin-bottom: 24px;
  padding: 16px;
  background: rgba(169, 216, 238, 0.10);
  border-radius: 12px;
  border: 1px solid rgba(169, 216, 238, 0.20);
}

.info-correo p {
  margin: 4px 0;
  color: #eaf4fa;
  font-size: 0.9rem;
}

.correo-destino {
  font-weight: 700;
  color: #a9d8ee !important;
  font-size: 1rem;
}

.pad-relativo {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 320px;
  margin: 0 auto;
}

.display-shell {
  min-height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.display-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 52px;
  margin-bottom: 18px;
  z-index: 5;
}

.display {
  display: flex;
  gap: 14px;
  padding: 14px 18px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.10);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.display.empty {
  opacity: 0.82;
}

.dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: transparent;
  border: 2px solid rgba(169, 216, 238, 0.35);
}

.dot.filled {
  background: #a9d8ee;
  border-color: #5c9dc2;
  animation: popIn 0.2s ease-out;
}

.keypad-grid {
  width: 100%;
  max-width: 320px;
  margin: 0 auto;
}

.key-col {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}

.key {
  width: 68px;
  height: 68px;
  border-radius: 22px;
  font-size: 22px;
  font-weight: 800;
  color: #cfe9f5;
  background: rgba(255, 255, 255, 0.05) !important;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.30), inset 0 1px 0 rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
}

.key:active {
  background: rgba(255, 255, 255, 0.10) !important;
  transform: scale(0.97);
}

.borrar-btn {
  width: 68px;
  height: 68px;
  border-radius: 22px;
  background: rgba(148, 163, 184, 0.10);
  border: 1px solid rgba(148, 163, 184, 0.22);
  color: #c3ccd6;
  font-size: 20px;
  font-weight: 700;
}

.delete-symbol {
  line-height: 1;
}

.botones-extra {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 24px;
  width: 100%;
  max-width: 320px;
  margin-left: auto;
  margin-right: auto;
}

.btn-cancelar,
.btn-reenviar {
  width: 100%;
  padding: 14px 20px;
  font-size: 1rem;
  font-weight: 700;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancelar {
  background: transparent;
  border: 2px solid #d1dbe5;
  color: #6d829c;
}

.btn-cancelar:hover {
  background: #f5f9fc;
  border-color: #a9d8ee;
}

.btn-reenviar {
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
}

.btn-reenviar:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(22, 163, 74, 0.4);
}

.btn-reenviar:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.force-light {
  --ion-background-color: transparent;
  --ion-text-color: #ffffff;
}

@media (max-width: 991px) {
  .keypad-container {
    padding: 24px;
  }

  .desktop-layout {
    gap: 0;
    min-height: 100dvh;
    justify-content: center;
  }

  .login-card {
    max-width: 360px;
    padding: 14px 12px 14px;
  }

  .keypad-side {
    width: 100%;
    max-width: 380px;
  }

  .display-container {
    margin-bottom: 14px;
  }

  .pad-relativo {
    max-width: 300px;
  }

  .display-shell {
    min-height: 68px;
  }
}
</style>
