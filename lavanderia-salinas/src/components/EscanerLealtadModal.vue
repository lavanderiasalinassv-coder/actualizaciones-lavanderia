<template>
  <ion-modal :is-open="isOpen" class="modal-lealtad" @didDismiss="emit('close')">
    <section class="lealtad-escaner">
      <header>
        <span class="lealtad-marca">LAVANDERÍA SALINAS</span>
        <h2>Cliente leal</h2>
        <p>Escanea el QR personal del cliente para marcar su visita de la orden entregada.</p>
      </header>

      <div v-if="!resultado" class="lealtad-camara">
        <video ref="video" playsinline muted aria-label="Cámara para escanear la tarjeta de lealtad" />
        <p v-if="cargando" role="status">Activando cámara...</p>
        <p v-else-if="error" class="lealtad-error" role="alert">{{ error }}</p>
        <p v-else class="lealtad-ayuda">Coloca el código QR dentro del área de la cámara.</p>
      </div>

      <div v-else class="lealtad-resultado" role="status">
        <strong>
          {{ resultado.premioCanjeado ? '¡Premio canjeado!' : canjePendiente ? 'Premio disponible' : resultado.premioDisponible ? '¡Décima visita registrada!' : '¡Visita registrada!' }}
        </strong>
        <span>{{ resultado.nombre }} · {{ resultado.sellos }} de {{ resultado.meta }} visitas</span>
        <span v-if="resultado.premioDisponible" class="lealtad-premio">
          Premio disponible: {{ resultado.premio }}
        </span>
        <span v-if="resultado.premioCanjeado" class="lealtad-premio">
          Se reinició la tarjeta para comenzar un nuevo ciclo.
        </span>
        <span v-if="error" class="lealtad-error" role="alert">{{ error }}</span>
      </div>

      <footer>
        <button v-if="error && !resultado" type="button" class="lealtad-reintentar" :disabled="cargando" @click="iniciarCamara">
          {{ cargando ? 'Activando...' : 'Reintentar cámara' }}
        </button>
        <button v-if="!resultado" type="button" class="lealtad-omitir" @click="emit('close')">
          Omitir punto
        </button>
        <button
          v-if="resultado?.premioDisponible && !resultado.premioCanjeado"
          type="button"
          class="lealtad-listo"
          :disabled="canjeando"
          @click="confirmarCanje"
        >{{ canjeando ? 'Registrando canje...' : 'Confirmar canje del premio' }}</button>
        <button v-else-if="resultado" type="button" class="lealtad-listo" @click="emit('close')">Listo</button>
      </footer>
    </section>
  </ion-modal>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { IonModal } from '@ionic/vue'
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser'
import {
  canjearPremioLealtad,
  obtenerTarjetaLealtad,
  registrarVisitaLealtad,
  type TarjetaLealtad
} from '@/composables/useLealtad'

const props = defineProps<{
  isOpen: boolean
  ordenId: string
}>()
const emit = defineEmits<{
  close: []
  marcada: [tarjeta: TarjetaLealtad]
}>()

const video = ref<HTMLVideoElement | null>(null)
const cargando = ref(false)
const canjeando = ref(false)
const error = ref('')
const resultado = ref<TarjetaLealtad | null>(null)
const canjePendiente = ref(false)
let controles: IScannerControls | null = null
let procesando = false

const detenerCamara = () => {
  controles?.stop()
  controles = null
}

const procesarQr = async (texto: string) => {
  if (procesando) return
  procesando = true
  detenerCamara()
  const token = texto.trim()
  if (!/^[a-f0-9]{64}$/i.test(token)) {
    error.value = 'Este QR no parece ser una tarjeta de lealtad válida.'
    procesando = false
    return
  }

  try {
    resultado.value = {
      ...await registrarVisitaLealtad(token, props.ordenId),
      token
    }
    emit('marcada', resultado.value)
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : 'No se pudo registrar la visita.'
    if (mensaje === 'La tarjeta ya tiene un premio pendiente de canje.') {
      try {
        resultado.value = await obtenerTarjetaLealtad(token)
        canjePendiente.value = true
      } catch (errorTarjeta) {
        error.value = errorTarjeta instanceof Error ? errorTarjeta.message : mensaje
        procesando = false
      }
    } else {
      error.value = mensaje
      procesando = false
    }
  }
}

const confirmarCanje = async () => {
  if (!resultado.value?.token || canjeando.value) return
  canjeando.value = true
  error.value = ''
  try {
    resultado.value = await canjearPremioLealtad(resultado.value.token, props.ordenId)
    emit('marcada', resultado.value)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo registrar el canje del premio.'
  } finally {
    canjeando.value = false
  }
}

const iniciarCamara = async () => {
  detenerCamara()
  error.value = ''
  cargando.value = true
  procesando = false
  await nextTick()
  if (!video.value || !props.isOpen) {
    cargando.value = false
    return
  }
  try {
    const nuevoControl = await new BrowserMultiFormatReader().decodeFromVideoDevice(
      undefined,
      video.value,
      (lectura) => {
        if (lectura && props.isOpen) void procesarQr(lectura.getText())
      }
    )
    if (!props.isOpen) nuevoControl.stop()
    else controles = nuevoControl
  } catch (err) {
    error.value = err instanceof Error
      ? `No se pudo abrir la cámara: ${err.message}`
      : 'No se pudo abrir la cámara en este dispositivo.'
  } finally {
    cargando.value = false
  }
}

watch(() => props.isOpen, (abierto) => {
  resultado.value = null
  canjePendiente.value = false
  error.value = ''
  procesando = false
  if (abierto) void iniciarCamara()
  else detenerCamara()
}, { immediate: true })

onBeforeUnmount(detenerCamara)
</script>

<style scoped>
.modal-lealtad { --width: min(94vw, 520px); --height: auto; --border-radius: 22px; }
.lealtad-escaner { display: grid; gap: 18px; max-height: 90vh; overflow-y: auto; padding: 24px; background: #fff; color: #0a1f38; }
header { text-align: center; }
.lealtad-marca { color: #168b83; font-size: .68rem; font-weight: 900; letter-spacing: .12em; }
h2 { margin: 8px 0; color: #123a66; }
header p, .lealtad-ayuda { margin: 0; color: #61778e; line-height: 1.5; }
.lealtad-camara { display: grid; gap: 10px; }
video { display: block; width: 100%; max-height: 52vh; min-height: 220px; border-radius: 16px; background: #0a1f38; object-fit: cover; }
.lealtad-camara p { text-align: center; }
.lealtad-error { color: #b42318 !important; font-weight: 700; }
.lealtad-resultado { display: grid; justify-items: center; gap: 8px; padding: 20px; border-radius: 16px; background: #eff8fa; color: #123a66; text-align: center; }
.lealtad-resultado strong { font-size: 1.2rem; }
.lealtad-premio { margin-top: 6px; padding: 8px 12px; border-radius: 10px; background: #fff3cc; color: #775500; font-weight: 800; }
footer { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; }
footer button { min-height: 44px; padding: 0 16px; border-radius: 10px; font: inherit; font-weight: 800; cursor: pointer; }
.lealtad-reintentar { border: 1px solid #cbd9e4; background: #fff; color: #123a66; }
.lealtad-omitir { border: 1px solid #cbd9e4; background: #fff; color: #566c81; }
.lealtad-listo { border: 0; background: #123a66; color: #fff; }
</style>
