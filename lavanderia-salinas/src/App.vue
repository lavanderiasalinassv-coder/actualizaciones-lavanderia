<template>
  <ion-app :style="estilosAppConPanel">
    <ion-router-outlet />
    <SaliAssistant v-if="rutaProtegida" />
    <WhatsappPanel
      v-if="rutaProtegida"
      :abierto="mostrarPanelWhatsapp"
      :url-inicial="urlWhatsappInicial"
      @cerrar="cerrarWhatsapp"
      @modo-cambio="panelWhatsappLateral = $event"
      @lado-cambio="panelLado = $event"
    />
    <FacebookPannel
      v-if="rutaProtegida"
      :abierto="mostrarPanelFacebook"
      @cerrar="cerrarFacebook"
      @modo-cambio="panelFacebookLateral = $event"
      @lado-cambio="panelLado = $event"
    />

    <ion-modal
      :is-open="mostrarModalInactividad"
      class="modal-inactividad"
      :backdrop-dismiss="false"
      @didDismiss="mantenerSesionActiva"
    >
      <div class="inactividad-contenido">
        <div class="inactividad-glow" aria-hidden="true"></div>

        <div class="inactividad-icono">
          <ion-icon :icon="timeOutline" />
        </div>

        <h2 class="inactividad-titulo">¿Sigues ahí?</h2>
        <p class="inactividad-subtitulo">
          Tu sesión en <strong>Lavandería Salinas</strong> está a punto de cerrarse por inactividad.
        </p>

        <div class="inactividad-contador-wrap">
          <svg class="inactividad-anillo" viewBox="0 0 120 120">
            <circle class="inactividad-anillo-fondo" cx="60" cy="60" r="52" />
            <circle
              class="inactividad-anillo-progreso"
              cx="60"
              cy="60"
              r="52"
              :style="{
                strokeDasharray: circunferencia,
                strokeDashoffset: circunferenciaOffset
              }"
            />
          </svg>
          <div class="inactividad-contador-numero">{{ tiempoFormateado }}</div>
        </div>

        <p class="inactividad-ayuda">
          Se cerrará tu sesión automáticamente al llegar a cero.
        </p>

        <div class="inactividad-botones">
          <button class="inactividad-btn-primario" @click="mantenerSesionActiva">
            <ion-icon :icon="checkmarkCircleOutline" />
            Seguir conectado
          </button>
          <button class="inactividad-btn-secundario" @click="cerrarSesionAhora">
            Cerrar sesión ahora
          </button>
        </div>
      </div>
    </ion-modal>
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet, IonModal, IonIcon } from '@ionic/vue'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { timeOutline, checkmarkCircleOutline } from 'ionicons/icons'
import { useSesion } from '@/composables/useSesion'
import SaliAssistant from '@/components/SaliAssistant.vue'
import WhatsappPanel from '@/components/WhatsappPanel.vue'
import FacebookPannel from '@/components/FacebookPannel.vue'
import { usePanelRedes } from '@/composables/usePanelRedes'

const route = useRoute()
const router = useRouter()
const { cerrarSesion, validarSesion } = useSesion()
const {
  mostrarPanelWhatsapp,
  mostrarPanelFacebook,
  urlWhatsappInicial,
  panelWhatsappLateral,
  panelFacebookLateral,
  panelLado,
  panelLateralAbierto,
  ladoPanelActivo,
  cerrarWhatsapp,
  cerrarFacebook,
  abrirWhatsapp
} = usePanelRedes()

const abrirWhatsappConMensaje = (evento: Event) => {
  const detalle = (evento as CustomEvent<{ phone?: string; message?: string }>).detail
  const phone = String(detalle?.phone || '').replace(/\D/g, '')
  const message = String(detalle?.message || '')
  const url = `https://web.whatsapp.com/send${phone ? `?phone=${phone}&text=${encodeURIComponent(message)}` : `?text=${encodeURIComponent(message)}`}`
  abrirWhatsapp(url)
}

onMounted(() => window.addEventListener('whatsapp-compose', abrirWhatsappConMensaje))
onUnmounted(() => window.removeEventListener('whatsapp-compose', abrirWhatsappConMensaje))

// ---------- Control de inactividad ----------
// Tiempo total de inactividad antes de cerrar sesión: 2 minutos.
// De ese total, los primeros 110s (1:50) son "silenciosos" y los últimos
// 10s se muestran como cuenta regresiva en el modal.
const TIEMPO_SILENCIO_MS = 110 * 1000 // 1 minuto 50 segundos
const TIEMPO_AVISO_SEG = 10 // últimos 10 segundos, mostrados en el modal

const EVENTOS_ACTIVIDAD = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'] as const

const mostrarModalInactividad = ref(false)
const segundosRestantes = ref(TIEMPO_AVISO_SEG)

let timerAviso: ReturnType<typeof setTimeout> | null = null
let timerCuentaRegresiva: ReturnType<typeof setInterval> | null = null

const RUTAS_SIN_CONTROL_INACTIVIDAD = new Set(['/login', '/verificacion-2fa'])
const rutaProtegida = computed(() => !RUTAS_SIN_CONTROL_INACTIVIDAD.has(route.path))

// Estilos dinámicos para ajustar la app cuando hay paneles laterales abiertos
const estilosAppConPanel = computed(() => {
  return {}
})

const tiempoFormateado = computed(() => {
  const minutos = Math.floor(segundosRestantes.value / 60)
  const segundos = segundosRestantes.value % 60
  return `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`
})

const circunferencia = 2 * Math.PI * 52
const circunferenciaOffset = computed(() => {
  const progreso = segundosRestantes.value / TIEMPO_AVISO_SEG
  return circunferencia * (1 - progreso)
})

const detenerCuentaRegresiva = () => {
  if (timerCuentaRegresiva) {
    clearInterval(timerCuentaRegresiva)
    timerCuentaRegresiva = null
  }
}

const cerrarSesionAhora = () => {
  detenerCuentaRegresiva()
  mostrarModalInactividad.value = false
  cerrarSesion()
  router.replace('/login').catch(() => {})
}

const iniciarCuentaRegresiva = () => {
  segundosRestantes.value = TIEMPO_AVISO_SEG
  detenerCuentaRegresiva()
  timerCuentaRegresiva = setInterval(() => {
    segundosRestantes.value -= 1
    if (segundosRestantes.value <= 0) {
      cerrarSesionAhora()
    }
  }, 1000)
}

const mostrarAvisoInactividad = () => {
  console.log('[inactividad] 1:50 sin actividad -> mostrando modal de cuenta regresiva') // TEMP: quitar cuando confirmes que funciona
  if (!rutaProtegida.value) return
  mostrarModalInactividad.value = true
  iniciarCuentaRegresiva()
}

const reiniciarTimerAviso = () => {
  if (timerAviso) clearTimeout(timerAviso)
  if (!rutaProtegida.value) return
  timerAviso = setTimeout(mostrarAvisoInactividad, TIEMPO_SILENCIO_MS)
}

// El usuario tocó, hizo clic o presionó una tecla: se mantiene la sesión.
const mantenerSesionActiva = () => {
  detenerCuentaRegresiva()
  mostrarModalInactividad.value = false
  reiniciarTimerAviso()
}

const manejarActividad = () => {
  if (mostrarModalInactividad.value) {
    // Cualquier actividad mientras el modal está abierto cuenta como "sigo aquí".
    mantenerSesionActiva()
  } else {
    reiniciarTimerAviso()
  }
}

const manejarRecuperacionApp = async () => {
  if (document.visibilityState !== 'visible' && !document.hasFocus()) return

  const tieneToken = !!localStorage.getItem('auth_token')
  if (!tieneToken) return

  const sesionValida = await validarSesion()

  if (!sesionValida && route.path !== '/login' && route.path !== '/verificacion-2fa') {
    await router.replace('/login').catch(() => {})
  }
}

const manejarVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    void manejarRecuperacionApp()
  }
}

const manejarPageshow = () => {
  void manejarRecuperacionApp()
}

const manejarFocus = () => {
  void manejarRecuperacionApp()
}

watch(rutaProtegida, (esProtegida) => {
  if (esProtegida) {
    reiniciarTimerAviso()
  } else {
    if (timerAviso) clearTimeout(timerAviso)
    detenerCuentaRegresiva()
    mostrarModalInactividad.value = false
    // Cerrar paneles cuando se va a una ruta no protegida (login)
    cerrarWhatsapp()
    cerrarFacebook()
  }
})

onMounted(() => {
  console.log('[inactividad] App.vue montado, control de inactividad activo. Ruta protegida:', rutaProtegida.value) // TEMP: quitar cuando confirmes que funciona
  EVENTOS_ACTIVIDAD.forEach((evento) => {
    window.addEventListener(evento, manejarActividad, { passive: true })
  })

  document.addEventListener('visibilitychange', manejarVisibilityChange)

  window.addEventListener('pageshow', manejarPageshow)

  window.addEventListener('focus', manejarFocus)

  reiniciarTimerAviso()
})

onUnmounted(() => {
  EVENTOS_ACTIVIDAD.forEach((evento) => {
    window.removeEventListener(evento, manejarActividad)
  })
  document.removeEventListener('visibilitychange', manejarVisibilityChange)
  window.removeEventListener('pageshow', manejarPageshow)
  window.removeEventListener('focus', manejarFocus)
  if (timerAviso) clearTimeout(timerAviso)
  detenerCuentaRegresiva()
})
</script>

<style scoped>
.modal-inactividad {
  --width: min(420px, calc(100vw - 24px));
  --height: auto;
  --border-radius: 24px;
  --backdrop-opacity: 0.55;
}

.inactividad-contenido {
  position: relative;
  overflow: hidden;
  background: linear-gradient(165deg, #123a66 0%, #0d2b4e 60%, #0a2140 100%);
  color: #eaf4fa;
  padding: 34px 28px 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 10px;
}

.inactividad-glow {
  position: absolute;
  top: -70px;
  right: -60px;
  width: 260px;
  height: 260px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(79, 179, 224, 0.35) 0%, rgba(79, 179, 224, 0) 70%);
  pointer-events: none;
}

.inactividad-icono {
  width: 58px;
  height: 58px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: rgba(169, 216, 238, 0.14);
  border: 1px solid rgba(169, 216, 238, 0.28);
  color: #a9d8ee;
  font-size: 28px;
  margin-bottom: 4px;
}

.inactividad-titulo {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 900;
  color: #f5f9fc;
  letter-spacing: -0.01em;
}

.inactividad-subtitulo {
  margin: 0;
  color: #cfe9f5;
  font-size: 0.92rem;
  line-height: 1.5;
  max-width: 300px;
}

.inactividad-subtitulo strong {
  color: #ffffff;
}

.inactividad-contador-wrap {
  position: relative;
  width: 132px;
  height: 132px;
  display: grid;
  place-items: center;
  margin: 14px 0 4px;
}

.inactividad-anillo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.inactividad-anillo-fondo {
  fill: none;
  stroke: rgba(169, 216, 238, 0.18);
  stroke-width: 8;
}

.inactividad-anillo-progreso {
  fill: none;
  stroke: #4fb3e0;
  stroke-width: 8;
  stroke-linecap: round;
  transition: stroke-dashoffset 1s linear, stroke 0.3s ease;
}

.inactividad-contador-numero {
  position: relative;
  z-index: 1;
  font-size: 2rem;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
  color: #ffffff;
  letter-spacing: -0.02em;
}

.inactividad-ayuda {
  margin: 0;
  color: #a9c4d8;
  font-size: 0.8rem;
}

.inactividad-botones {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  margin-top: 12px;
}

.inactividad-btn-primario,
.inactividad-btn-secundario {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 13px 16px;
  border-radius: 14px;
  font-weight: 800;
  font-size: 0.92rem;
  cursor: pointer;
  border: none;
  transition: transform 0.15s ease, background 0.15s ease, opacity 0.15s ease;
}

.inactividad-btn-primario {
  background: linear-gradient(135deg, #4fb3e0, #2c9b96);
  color: #ffffff;
  box-shadow: 0 10px 22px rgba(79, 179, 224, 0.32);
}

.inactividad-btn-primario:hover {
  transform: translateY(-1px);
}

.inactividad-btn-primario ion-icon {
  font-size: 18px;
}

.inactividad-btn-secundario {
  background: transparent;
  color: #cfe9f5;
  border: 1px solid rgba(169, 216, 238, 0.28);
}

.inactividad-btn-secundario:hover {
  background: rgba(169, 216, 238, 0.1);
}
</style>
