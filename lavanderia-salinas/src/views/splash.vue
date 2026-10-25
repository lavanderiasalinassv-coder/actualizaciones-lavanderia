<template>
  <ion-page>
    <ion-content class="splash-content" :fullscreen="true">
      <div class="orbe orbe-uno" aria-hidden="true"></div>
      <div class="orbe orbe-dos" aria-hidden="true"></div>
      <div class="cielo-burbujas" aria-hidden="true">
        <span v-for="n in 12" :key="`burbuja-${n}`" class="burbuja" :class="`burbuja-${n}`"></span>
        <i v-for="n in 8" :key="`destello-${n}`" class="destello" :class="`destello-${n}`"></i>
      </div>

      <div class="splash-wrap">
        <div class="splash-logo-escena">
          <div class="splash-logo-resplandor" aria-hidden="true"></div>
          <div class="splash-logo-contenedor">
            <img
              :src="logoActual"
              alt="Lavandería Salinas"
              class="splash-logo"
              @error="logoFallido = true"
            />
          </div>
          <span class="splash-logo-destello" aria-hidden="true"></span>
        </div>

        <p class="subtitulo">
          {{ listo ? 'Todo listo, entrando…' : 'Preparando tu espacio de trabajo' }}
        </p>

        <div class="estado-lista">
          <div class="estado-fila">
            <span class="estado-icono" :class="claseEstado(estadoServidor)">
              <span v-if="estadoServidor === 'cargando'" class="mini-spinner"></span>
              <span v-else>{{ estadoServidor === 'listo' ? '✓' : '!' }}</span>
            </span>
            <span class="estado-texto">
              <strong>Servidor</strong>
              <small>{{ textoEstado(estadoServidor, 'Conectando con el servidor') }}</small>
            </span>
            <span class="estado-punto" :class="claseEstado(estadoServidor)"></span>
          </div>
          <div class="estado-fila">
            <span class="estado-icono" :class="claseEstado(estadoBaseDatos)">
              <span v-if="estadoBaseDatos === 'cargando'" class="mini-spinner"></span>
              <span v-else>{{ estadoBaseDatos === 'listo' ? '✓' : '!' }}</span>
            </span>
            <span class="estado-texto">
              <strong>Base de datos</strong>
              <small>{{ textoEstado(estadoBaseDatos, 'Verificando conexión segura') }}</small>
            </span>
            <span class="estado-punto" :class="claseEstado(estadoBaseDatos)"></span>
          </div>
        </div>

        <div class="progreso" aria-hidden="true"><span :class="{ completo: listo }"></span></div>

        <p class="mensaje" :class="{ error: errorConexion }">
          {{ errorConexion || (listo ? 'Conexión lista. Abriendo acceso…' : 'Un momento, estamos iniciando') }}
        </p>

        <div v-if="errorConexion" class="acciones-error">
          <button class="boton-reintentar" type="button" :disabled="revisando" @click="comprobarConexion">
            {{ revisando ? 'Comprobando…' : 'Reintentar conexión' }}
          </button>
          <button class="boton-dev" type="button" @click="toggleDev">
            {{ mostrarDev ? 'Cancelar' : 'Desarrollador' }}
          </button>
        </div>

        <transition name="fade-dev">
          <div v-if="mostrarDev" class="panel-dev">
            <label class="panel-dev-label">Código de desarrollador</label>
            <input
              ref="inputDev"
              v-model="codigoDev"
              type="password"
              inputmode="numeric"
              maxlength="10"
              placeholder="****"
              @keydown.enter="verificarCodigoDev"
            />
            <button class="boton-dev-confirmar" type="button" :disabled="!codigoDev" @click="verificarCodigoDev">
              Ingresar y configurar
            </button>
            <p v-if="errorDev" class="error-dev">{{ errorDev }}</p>
            <p class="ayuda-dev">Te llevará al login para configurar el servidor/base de datos.</p>
          </div>
        </transition>
      </div>

      <p v-if="versionAplicacion" class="splash-version">Versión {{ versionAplicacion }}</p>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { IonPage, IonContent } from '@ionic/vue'
import { useRouter } from 'vue-router'
import { getApiBaseUrl } from '@/composables/useApiConfig'
import logoPredeterminado from '@/assets/logo.png'
import logoNavidad from '@/assets/logo-navidad.png'
import { useApariencia } from '@/composables/useApariencia'
import { useDiciembre } from '@/composables/useDiciembre'

type Estado = 'cargando' | 'listo' | 'error'

// 🔴 Cambia este código por el que quieras usar como acceso de desarrollador.
const CODIGO_DESARROLLADOR = '592647'

const router = useRouter()
const { apariencia } = useApariencia()
const esDiciembre = useDiciembre()
const logoFallido = ref(false)
const logoActual = computed(() => esDiciembre.value
  ? logoNavidad
  : (logoFallido.value ? logoPredeterminado : (apariencia.loginImagen || logoPredeterminado)))
const estadoServidor = ref<Estado>('cargando')
const estadoBaseDatos = ref<Estado>('cargando')
const versionAplicacion = ref('')
const errorConexion = ref('')
const revisando = ref(false)
const listo = ref(false)
let navegando = false

// Modo desarrollador
const mostrarDev = ref(false)
const codigoDev = ref('')
const errorDev = ref('')
const inputDev = ref<HTMLInputElement | null>(null)

const reproducirSonidoEntrada = async () => {
  if (typeof window.AudioContext === 'undefined') return

  let audio: AudioContext | undefined
  try {
    audio = new window.AudioContext()
    await audio.resume()
    if (audio.state !== 'running') {
      await audio.close()
      return
    }

    const inicio = audio.currentTime + 0.025
    ;[523, 659, 784, 1046].forEach((frecuencia, indice) => {
      const tono = audio!.createOscillator()
      const volumen = audio!.createGain()
      const momento = inicio + indice * 0.12
      const duracion = 0.42

      tono.type = 'sine'
      tono.frequency.setValueAtTime(frecuencia, momento)
      volumen.gain.setValueAtTime(0.0001, momento)
      volumen.gain.exponentialRampToValueAtTime(0.035, momento + 0.025)
      volumen.gain.exponentialRampToValueAtTime(0.0001, momento + duracion)

      tono.connect(volumen)
      volumen.connect(audio!.destination)
      tono.start(momento)
      tono.stop(momento + duracion)
    })

    window.setTimeout(() => {
      void audio?.close().catch(error => console.warn('No se pudo cerrar el audio del splash:', error))
    }, 1000)
  } catch (error) {
    console.warn('No se pudo reproducir el sonido de entrada:', error)
    await audio?.close().catch(closeError => console.warn('No se pudo cerrar el audio del splash:', closeError))
  }
}

const cargarVersionAplicacion = async () => {
  const electronAPI = (window as Window & {
    electronAPI?: { obtenerVersionAplicacion?: () => Promise<string> }
  }).electronAPI

  if (!electronAPI?.obtenerVersionAplicacion) return

  try {
    versionAplicacion.value = await electronAPI.obtenerVersionAplicacion()
  } catch (error) {
    console.error('No se pudo obtener la versión de la aplicación:', error)
  }
}

const claseEstado = (estado: Estado) => `estado-${estado}`
const textoEstado = (estado: Estado, cargando: string) => {
  if (estado === 'cargando') return cargando
  return estado === 'listo' ? 'Conectado correctamente' : 'Sin conexión'
}

const toggleDev = () => {
  mostrarDev.value = !mostrarDev.value
  errorDev.value = ''
  codigoDev.value = ''
  if (mostrarDev.value) {
    nextTick(() => inputDev.value?.focus())
  }
}

const verificarCodigoDev = () => {
  if (!codigoDev.value) return
  if (codigoDev.value === CODIGO_DESARROLLADOR) {
    navegando = true
    router.replace('/login')
    return
  }
  errorDev.value = 'Código incorrecto.'
  codigoDev.value = ''
  nextTick(() => inputDev.value?.focus())
}

const comprobarConexion = async () => {
  if (revisando.value || navegando) return
  revisando.value = true
  listo.value = false
  errorConexion.value = ''
  mostrarDev.value = false
  estadoServidor.value = 'cargando'
  estadoBaseDatos.value = 'cargando'
  const inicio = Date.now()
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 10000)

  try {
    const response = await fetch(`${getApiBaseUrl()}/health`, { signal: controller.signal })
    estadoServidor.value = 'listo'
    let resultado: { ok?: boolean; database?: boolean; message?: string } = {}
    try {
      resultado = await response.json()
    } catch {
      resultado = {}
    }

    if (!response.ok || resultado.database !== true || resultado.ok !== true) {
      estadoBaseDatos.value = 'error'
      throw new Error(resultado.message || 'El servidor responde, pero la base de datos no está disponible. Revisa su configuración y disponibilidad.')
    }

    estadoBaseDatos.value = 'listo'
    await new Promise(resolve => window.setTimeout(resolve, Math.max(0, 4000 - (Date.now() - inicio))))
    listo.value = true
    navegando = true
    await router.replace('/login')
  } catch (error) {
    if (estadoServidor.value === 'cargando') estadoServidor.value = 'error'
    if (estadoBaseDatos.value === 'cargando') estadoBaseDatos.value = 'error'
    if (error instanceof Error && error.name === 'AbortError') {
      errorConexion.value = 'El servidor no respondió en 10 segundos. Comprueba que esté iniciado y que la dirección de la API sea correcta.'
    } else if (estadoServidor.value === 'error') {
      errorConexion.value = `No se pudo contactar el servidor en ${getApiBaseUrl()}. Comprueba que esté encendido, que la URL sea correcta y que haya conexión de red.`
    } else {
      errorConexion.value = error instanceof Error
        ? error.message
        : 'No fue posible completar la verificación. Comprueba la conexión e inténtalo de nuevo.'
    }
  } finally {
    window.clearTimeout(timeout)
    revisando.value = false
  }
}

onMounted(() => {
  void reproducirSonidoEntrada()
  void cargarVersionAplicacion()
  void comprobarConexion()
})
</script>

<style scoped>
.splash-content {
  --background:
    radial-gradient(circle at 8% 10%,  rgba(169, 216, 238, 0.20) 0%, transparent 28%),
    radial-gradient(circle at 90% 6%,  rgba(207, 233, 245, 0.26) 0%, transparent 26%),
    radial-gradient(circle at 50% 52%, rgba(207, 233, 245, 0.14) 0%, transparent 38%),
    radial-gradient(circle at 12% 82%, rgba(169, 216, 238, 0.20) 0%, transparent 30%),
    radial-gradient(circle at 88% 78%, rgba(18, 58, 102, 0.18) 0%, transparent 26%),
    linear-gradient(160deg, #123a66 0%, #0d2b4e 100%);
  color: #eaf4fa;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.splash-content::part(background) {
  background-size: 150% 150%;
  animation: fondoRespira 18s ease-in-out infinite alternate;
}

.cielo-burbujas { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
.burbuja {
  position: absolute;
  bottom: -70px;
  left: var(--x);
  width: var(--size);
  height: var(--size);
  border: 1px solid rgba(207, 233, 245, .24);
  border-radius: 50%;
  background: radial-gradient(circle at 32% 28%, rgba(255,255,255,.24), rgba(169,216,238,.025) 68%);
  box-shadow: inset -3px -4px 8px rgba(169,216,238,.06), 0 0 15px rgba(169,216,238,.04);
  animation: burbujaSube var(--duracion) linear var(--espera) infinite;
}
.burbuja-1 { --x: 6%; --size: 15px; --duracion: 12s; --espera: -3s; }
.burbuja-2 { --x: 17%; --size: 8px; --duracion: 10s; --espera: -8s; }
.burbuja-3 { --x: 28%; --size: 23px; --duracion: 16s; --espera: -11s; }
.burbuja-4 { --x: 39%; --size: 11px; --duracion: 13s; --espera: -5s; }
.burbuja-5 { --x: 52%; --size: 18px; --duracion: 15s; --espera: -13s; }
.burbuja-6 { --x: 64%; --size: 9px; --duracion: 11s; --espera: -2s; }
.burbuja-7 { --x: 73%; --size: 25px; --duracion: 17s; --espera: -7s; }
.burbuja-8 { --x: 84%; --size: 13px; --duracion: 12s; --espera: -10s; }
.burbuja-9 { --x: 94%; --size: 20px; --duracion: 15s; --espera: -4s; }
.burbuja-10 { --x: 11%; --size: 27px; --duracion: 19s; --espera: -16s; }
.burbuja-11 { --x: 47%; --size: 7px; --duracion: 9s; --espera: -6s; }
.burbuja-12 { --x: 89%; --size: 10px; --duracion: 14s; --espera: -12s; }
.destello { position: absolute; left: var(--x); top: var(--y); width: 3px; height: 3px; border-radius: 50%; background: #dff7ff; box-shadow: 0 0 10px 2px rgba(169,216,238,.72); opacity: 0; animation: destelloBrilla var(--duracion) ease-in-out var(--espera) infinite; }
.destello-1 { --x: 12%; --y: 23%; --duracion: 3.7s; --espera: -1s; }
.destello-2 { --x: 25%; --y: 70%; --duracion: 4.2s; --espera: -3s; }
.destello-3 { --x: 81%; --y: 18%; --duracion: 3.4s; --espera: -2s; }
.destello-4 { --x: 91%; --y: 57%; --duracion: 4.5s; --espera: -4s; }
.destello-5 { --x: 68%; --y: 82%; --duracion: 3.8s; --espera: -1.5s; }
.destello-6 { --x: 7%; --y: 48%; --duracion: 4.1s; --espera: -2.5s; }
.destello-7 { --x: 43%; --y: 15%; --duracion: 3.5s; --espera: -3.5s; }
.destello-8 { --x: 96%; --y: 33%; --duracion: 4.7s; --espera: -.5s; }

.orbe {
  position: absolute;
  border-radius: 999px;
  pointer-events: none;
  filter: blur(6px);
}
.orbe-uno { width: 240px; height: 240px; top: -100px; right: -70px; background: rgba(169, 216, 238, 0.16); }
.orbe-dos { width: 200px; height: 200px; bottom: -90px; left: -60px; background: rgba(18, 58, 102, 0.28); }

.splash-wrap {
  position: relative;
  z-index: 1;
  display: flex;
  min-height: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 32px 20px 70px;
  max-width: 420px;
  margin: 0 auto;
  text-align: center;
  animation: tarjetaFlota 6s ease-in-out infinite;
}

.splash-logo-escena {
  position: relative;
  display: grid;
  width: 100%;
  min-height: 170px;
  margin: 0 0 4px;
  place-items: center;
}

.splash-logo-resplandor {
  position: absolute;
  width: min(75vw, 360px);
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(74, 188, 229, 0.38), rgba(42, 106, 190, 0.12) 42%, transparent 70%);
  filter: blur(12px);
  animation: splash-resplandor 2.05s ease-out both;
}

.splash-logo-contenedor {
  position: relative;
  z-index: 1;
  display: grid;
  width: min(68vw, 300px);
  min-height: 150px;
  place-items: center;
  animation: splash-logo 2.05s cubic-bezier(0.2, 0.75, 0.25, 1) both;
}

.splash-logo {
  display: block;
  width: 100%;
  max-height: 30vh;
  object-fit: contain;
}

.splash-logo-destello {
  position: absolute;
  top: calc(50% + 82px);
  left: 50%;
  width: min(76vw, 330px);
  height: 1px;
  transform: translateX(-50%);
  background: linear-gradient(90deg, transparent, rgba(128, 224, 249, 0.8), transparent);
  animation: splash-destello 1.5s ease-out both;
}

@keyframes splash-logo {
  0% { opacity: 0; transform: scale(0.72); }
  48% { opacity: 1; transform: scale(1.04); }
  72% { transform: scale(1); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes splash-resplandor {
  0% { opacity: 0; transform: scale(0.45); }
  48% { opacity: 1; transform: scale(1.05); }
  100% { opacity: 0.72; transform: scale(1); }
}
@keyframes splash-destello {
  0% { opacity: 0; width: 0; }
  55% { opacity: 0.9; width: min(76vw, 330px); }
  100% { opacity: 0; width: min(76vw, 330px); }
}
@keyframes fondoRespira { from { background-position: 0% 0%; } to { background-position: 100% 100%; } }
@keyframes tarjetaFlota { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
@keyframes burbujaSube { 0% { transform: translate3d(0,0,0) scale(.72); opacity: 0; } 12% { opacity: .58; } 75% { opacity: .34; } 100% { transform: translate3d(24px,-115vh,0) scale(1.25); opacity: 0; } }
@keyframes destelloBrilla { 0%,100% { opacity: 0; transform: scale(.5); } 45%,60% { opacity: .9; transform: scale(1.45); } }

.subtitulo { margin: 6px 0 22px; color: #bcd6e8; font-size: 13px; }

.estado-lista { display: grid; width: 100%; gap: 10px; text-align: left; }

.estado-fila {
  display: flex;
  min-height: 62px;
  align-items: center;
  gap: 12px;
  padding: 11px 14px;
  border-radius: 15px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(169, 216, 238, 0.16);
  animation: filaEntra .65s cubic-bezier(.2,.75,.25,1) both;
}
.estado-fila:nth-child(2) { animation-delay: .14s; }

.estado-icono { display: grid; width: 34px; height: 34px; flex: 0 0 34px; place-items: center; border-radius: 11px; font-size: 15px; font-weight: 800; }
.estado-texto { display: grid; flex: 1; gap: 3px; }
.estado-texto strong { color: #f5f9fc; font-size: 13px; font-weight: 700; }
.estado-texto small { color: #93b2c9; font-size: 11px; }
.estado-punto { width: 7px; height: 7px; border-radius: 50%; }

.estado-cargando { color: #a9d8ee; background: rgba(169, 216, 238, 0.16); }
.estado-listo { color: #3ee08a; background: rgba(62, 224, 138, 0.15); }
.estado-error { color: #ff8a75; background: rgba(255, 138, 117, 0.15); }
.estado-punto.estado-cargando { animation: pulsar 1s infinite; background: #a9d8ee; }
.estado-punto.estado-listo { background: #3ee08a; }
.estado-punto.estado-error { background: #ff8a75; }

.mini-spinner {
  width: 15px; height: 15px;
  border: 2px solid rgba(169, 216, 238, 0.3);
  border-top-color: #a9d8ee;
  border-radius: 50%;
  animation: girar 0.75s linear infinite;
}

.progreso {
  width: 100%;
  height: 3px;
  margin-top: 22px;
  overflow: hidden;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.08);
}
.progreso span {
  display: block;
  width: 38%;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #a9d8ee, #4fb3e0);
  animation: cargar 1.3s ease-in-out infinite;
  box-shadow: 0 0 12px rgba(79,179,224,.55);
}
.progreso span.completo { width: 100%; animation: completar 0.35s ease forwards; background: linear-gradient(90deg, #3ee08a, #16a34a); }

.mensaje { min-height: 18px; margin: 12px 0 0; color: #93b2c9; font-size: 11px; }
.mensaje.error { color: #ff8a75; line-height: 1.5; }

.splash-version {
  position: fixed;
  z-index: 2;
  right: 16px;
  bottom: max(12px, env(safe-area-inset-bottom));
  left: 16px;
  margin: 0;
  color: rgba(188, 214, 232, 0.72);
  font-size: 11px;
  letter-spacing: 0.04em;
  text-align: center;
  pointer-events: none;
}

.acciones-error { display: flex; gap: 10px; margin-top: 16px; width: 100%; }

.boton-reintentar,
.boton-dev {
  flex: 1;
  padding: 11px 14px;
  border-radius: 11px;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s, border-color 0.2s;
}

.boton-reintentar {
  border: none;
  color: #ffffff;
  background: linear-gradient(135deg, #4fb3e0 0%, #123a66 100%);
  box-shadow: 0 4px 12px rgba(79, 179, 224, 0.3);
}
.boton-reintentar:hover:not(:disabled) { transform: translateY(-1px); }
.boton-reintentar:disabled { opacity: 0.65; cursor: wait; }

.boton-dev {
  background: transparent;
  border: 1px solid rgba(169, 216, 238, 0.3);
  color: #a9d8ee;
}
.boton-dev:hover { background: rgba(169, 216, 238, 0.1); border-color: #a9d8ee; }

.panel-dev {
  width: 100%;
  margin-top: 14px;
  padding: 16px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(169, 216, 238, 0.2);
  text-align: left;
}
.panel-dev-label { display: block; margin-bottom: 8px; font-size: 11px; font-weight: 700; color: #a9d8ee; letter-spacing: 0.04em; }
.panel-dev input {
  width: 100%;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid rgba(169, 216, 238, 0.25);
  background: rgba(255, 255, 255, 0.92);
  color: #0a1f38;
  font-size: 16px;
  letter-spacing: 0.3em;
  text-align: center;
  outline: none;
}
.panel-dev input:focus { border-color: #4fb3e0; box-shadow: 0 0 0 3px rgba(79, 179, 224, 0.2); }
.boton-dev-confirmar {
  width: 100%;
  margin-top: 10px;
  padding: 11px 14px;
  border: none;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  color: #ffffff;
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  cursor: pointer;
}
.boton-dev-confirmar:disabled { opacity: 0.5; cursor: not-allowed; }
.error-dev { margin: 10px 0 0; color: #ff8a75; font-size: 11px; font-weight: 600; text-align: center; }
.ayuda-dev { margin: 8px 0 0; color: #93b2c9; font-size: 10.5px; text-align: center; }

.fade-dev-enter-active, .fade-dev-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.fade-dev-enter-from, .fade-dev-leave-to { opacity: 0; transform: translateY(-4px); }

@keyframes girar { to { transform: rotate(360deg); } }
@keyframes pulsar { 50% { opacity: 0.35; transform: scale(0.75); } }
@keyframes cargar { 0% { transform: translateX(-130%); } 100% { transform: translateX(270%); } }
@keyframes completar { to { width: 100%; } }
@keyframes filaEntra { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
  }
}

@media (max-width: 520px) {
  .burbuja:nth-child(even) { display: none; }
  .splash-wrap { animation-duration: 8s; }
}

@media (prefers-reduced-motion: reduce) {
  .splash-logo-resplandor,
  .splash-logo-contenedor,
  .splash-logo-destello {
    animation-duration: 650ms;
  }
}
</style>
