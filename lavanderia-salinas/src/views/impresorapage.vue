<template>
  <AppShell>
    <main class="printer-page">
      <header class="printer-header">
        <div>
          <h1>Impresora Bluetooth</h1>
        </div>
      </header>

      <section class="printer-card">
        <div class="status-icon" aria-hidden="true">🖨️</div>
        <div class="printer-info">
          <h2>{{ impresora?.name || 'No hay impresora predeterminada' }}</h2>
          <p v-if="impresora">Esta selección se guarda solo en este navegador y dispositivo.</p>
          <p v-else>Al no seleccionar una impresora, se abrirá el diálogo normal de impresión.</p>
        </div>
        <span class="status" :class="{ connected: estado === 'lista' }">{{ textoEstado }}</span>
      </section>

      <label class="paper-width">
        Ancho del papel
        <select v-model.number="anchoPapel" :disabled="!impresora">
          <option :value="58">58 mm</option>
          <option :value="80">80 mm</option>
        </select>
      </label>

      <div v-if="!bluetoothCompatible" class="notice">
        Este navegador no admite Web Bluetooth. En iPhone/Safari se seguirá usando el diálogo de impresión del sistema.
        Para configurar BLE, abre la app en Chrome sobre Android mediante HTTPS.
      </div>
      <p v-if="mensaje" class="feedback" :class="{ error: error }" role="status">{{ mensaje }}</p>

      <div class="actions">
        <button class="primary" type="button" :disabled="ocupado || !bluetoothCompatible" @click="seleccionarImpresora">
          {{ ocupado ? 'Conectando…' : impresora ? 'Cambiar impresora' : 'Buscar impresoras' }}
        </button>
        <button v-if="impresora" class="secondary" type="button" :disabled="ocupado || !bluetoothCompatible" @click="imprimirPrueba">
          Imprimir prueba
        </button>
        <button v-if="impresora" class="secondary" type="button" :disabled="ocupado" @click="quitarImpresora">
          Quitar predeterminada
        </button>
      </div>
    </main>
  </AppShell>
</template>

<script setup lang="ts">
defineOptions({ name: 'ImpresoraPage' })

import { computed, onMounted, ref, watch } from 'vue'
import AppShell from '@/components/AppShell.vue'
import {
  bluetoothDisponible,
  cargarImpresoraBluetooth,
  impresoraBluetoothAutorizada,
  imprimirHtmlEnImpresoraBluetooth,
  seleccionarImpresoraBluetooth,
  quitarImpresoraBluetooth,
  actualizarAnchoPapelBluetooth,
} from '@/composables/useBluetoothPrinter'
import type {
  ImpresoraBluetooth,
} from '@/composables/useBluetoothPrinter'

const bluetoothCompatible = bluetoothDisponible()
const impresora = ref<ImpresoraBluetooth | null>(null)
const anchoPapel = ref<58 | 80>(58)
const estado = ref<'inicial' | 'lista' | 'no-autorizada'>('inicial')
const ocupado = ref(false)
const mensaje = ref('')
const error = ref(false)
const textoEstado = computed(() => {
  if (!bluetoothCompatible) return 'No disponible en este navegador'
  if (!impresora.value) return 'Sin configurar'
  if (estado.value === 'no-autorizada') return 'Vuelve a seleccionar'
  return 'Predeterminada en este dispositivo'
})

const cargar = async () => {
  try {
    impresora.value = cargarImpresoraBluetooth()
    if (!impresora.value) return
    anchoPapel.value = impresora.value.paperWidth
    if (!bluetoothCompatible) return
    estado.value = await impresoraBluetoothAutorizada(impresora.value.deviceId)
      ? 'lista'
      : 'no-autorizada'
  } catch (e) {
    error.value = true
    mensaje.value = e instanceof Error ? e.message : 'No se pudo cargar la impresora guardada.'
  }
}

watch(anchoPapel, (paperWidth) => {
  if (!impresora.value) return
  try {
    actualizarAnchoPapelBluetooth(paperWidth)
    impresora.value = { ...impresora.value, paperWidth }
  } catch (e) {
    error.value = true
    mensaje.value = e instanceof Error ? e.message : 'No se pudo guardar el ancho del papel.'
  }
})

const seleccionarImpresora = async () => {
  ocupado.value = true
  error.value = false
  mensaje.value = ''
  try {
    impresora.value = await seleccionarImpresoraBluetooth(anchoPapel.value)
    estado.value = 'lista'
    mensaje.value = `“${impresora.value.name}” quedó guardada como impresora predeterminada.`
  } catch (e) {
    error.value = true
    mensaje.value = e instanceof Error ? e.message : 'No se pudo conectar con la impresora.'
  } finally {
    ocupado.value = false
  }
}

const quitarImpresora = () => {
  quitarImpresoraBluetooth()
  impresora.value = null
  estado.value = 'inicial'
  mensaje.value = 'Se quitó la impresora predeterminada. Se usará el diálogo normal de impresión.'
  error.value = false
}

const imprimirPrueba = async () => {
  ocupado.value = true
  error.value = false
  mensaje.value = ''
  try {
    const impresa = await imprimirHtmlEnImpresoraBluetooth(
      '<section><h2>LAVANDERÍA SALINAS</h2><p>Prueba de impresión</p><p>¡La impresora está lista!</p></section>',
    )
    if (!impresa) throw new Error('No se pudo acceder a la impresora BLE guardada en este navegador.')
    mensaje.value = 'La prueba se envió correctamente a la impresora.'
  } catch (e) {
    error.value = true
    mensaje.value = e instanceof Error ? e.message : 'No se pudo imprimir la prueba.'
  } finally {
    ocupado.value = false
  }
}

onMounted(cargar)
</script>

<style scoped>
.printer-page{max-width:880px;margin:0 auto;padding:clamp(20px,4vw,44px);color:#0a1f38}
.printer-header h1{margin:0;font-size:clamp(1.7rem,4vw,2.3rem)}
.printer-card{display:flex;align-items:center;gap:18px;margin:28px 0;padding:22px;border:1px solid #dce6ee;border-radius:18px;background:#fff;box-shadow:0 8px 24px #0a1f380c}
.status-icon{display:grid;place-items:center;flex:none;width:58px;height:58px;border-radius:16px;background:#edf5fa;font-size:28px}
.printer-info{flex:1;min-width:0}
.printer-info h2{margin:0 0 6px;font-size:1.05rem;overflow-wrap:anywhere}
.printer-info p{margin:0;color:#6b7c8e;font-size:.88rem;line-height:1.5}
.status{padding:7px 10px;border-radius:99px;background:#f1f5f9;color:#64748b;font-size:.75rem;font-weight:700;text-align:center}
.status.connected{background:#ecfdf3;color:#15803d}
.paper-width{display:flex;max-width:360px;flex-direction:column;gap:8px;margin:20px 0;font-weight:700}
.paper-width select{padding:12px;border:1px solid #cad7e2;border-radius:10px;background:#fff;color:#0a1f38;font:inherit}
.notice{margin:12px 0;padding:14px 16px;border-radius:12px;background:#eff6ff;color:#244b70;font-size:.88rem;line-height:1.55}
.feedback{color:#15803d;font-weight:600}
.feedback.error{color:#b42318}
.actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:24px}
.actions button{min-height:46px;padding:0 18px;border:0;border-radius:11px;font:inherit;font-weight:700;cursor:pointer}
.actions button:disabled{opacity:.55;cursor:wait}
.primary{background:#123a66;color:#fff}
.secondary{border:1px solid #d0dbe5!important;background:#fff;color:#31465b}
@media(max-width:600px){.printer-card{align-items:flex-start;flex-wrap:wrap}.status{margin-left:76px}.actions button{width:100%}}
</style>