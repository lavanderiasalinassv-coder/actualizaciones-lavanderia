<template>
  <Teleport to="body">
    <aside v-if="abierto" class="whatsapp-panel" :class="{ 'whatsapp-panel-centrado': !lateral, 'whatsapp-panel-izquierda': lateral && lado === 'izquierda' }" aria-label="WhatsApp Web">
      <header class="whatsapp-panel-header">
        <div class="whatsapp-panel-title">
          <ion-icon :icon="logoWhatsapp" />
          <div>
            <strong>WhatsApp</strong>
            <span>WhatsApp Web</span>
          </div>
        </div>
        <div class="whatsapp-panel-actions">
          <button type="button" title="Colocar a la izquierda" aria-label="Colocar WhatsApp a la izquierda" :class="{ activa: lateral && lado === 'izquierda' }" @click="colocarLateral('izquierda')"><ion-icon :icon="arrowBackOutline" /></button>
          <button type="button" title="Colocar a la derecha" aria-label="Colocar WhatsApp a la derecha" :class="{ activa: lateral && lado === 'derecha' }" @click="colocarLateral('derecha')"><ion-icon :icon="arrowForwardOutline" /></button>
          <button type="button" :title="lateral ? 'Abrir WhatsApp centrado' : 'Volver WhatsApp al lateral'" :aria-label="lateral ? 'Abrir WhatsApp centrado' : 'Volver WhatsApp al lateral'" @click="alternarModo"><ion-icon :icon="lateral ? expandOutline : contractOutline" /></button>
          <button type="button" title="Recargar WhatsApp" aria-label="Recargar WhatsApp" @click="recargarWebview"><ion-icon :icon="refreshOutline" /></button>
          <button class="whatsapp-panel-close" type="button" aria-label="Cerrar WhatsApp" title="Cerrar WhatsApp" @click="$emit('cerrar')"><ion-icon :icon="closeOutline" /></button>
        </div>
      </header>

      <div ref="bodyRef" class="whatsapp-panel-body">
        <webview
          v-if="esElectron"
          ref="webviewRef"
          class="whatsapp-webview"
          :src="urlInicial || 'https://web.whatsapp.com'"
          partition="persist:lavanderia-whatsapp"
          useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
          allowpopups
          @dom-ready="onWebviewListo"
        ></webview>
        <div v-else class="whatsapp-browser-fallback">
          <ion-icon :icon="logoWhatsapp" />
          <strong>WhatsApp Web se abrirá en una pestaña nueva</strong>
          <button type="button" @click="abrirEnNavegador">Abrir WhatsApp Web</button>
        </div>
      </div>
    </aside>
  </Teleport>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { arrowBackOutline, arrowForwardOutline, closeOutline, contractOutline, expandOutline, logoWhatsapp, refreshOutline } from 'ionicons/icons'
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps<{ abierto: boolean; urlInicial?: string }>()
const emit = defineEmits<{ cerrar: []; 'modo-cambio': [lateral: boolean]; 'lado-cambio': [lado: 'izquierda' | 'derecha'] }>()
const lateral = ref(true)
const lado = ref<'izquierda' | 'derecha'>('derecha') // Siempre derecha por defecto

// Resetear siempre a derecha cuando se abre el panel
watch(() => props.abierto, (abierto) => {
  if (abierto) {
    lado.value = 'derecha'
    lateral.value = true
  }
})

const colocarLateral = (nuevoLado: 'izquierda' | 'derecha') => {
  lado.value = nuevoLado
  lateral.value = true
  emit('lado-cambio', nuevoLado)
  emit('modo-cambio', true)
}

const alternarModo = () => {
  lateral.value = !lateral.value
  emit('modo-cambio', lateral.value)
}

const esElectron = typeof window !== 'undefined' && Boolean((window as Window & { electronAPI?: unknown }).electronAPI)

// CSS que se inyecta DENTRO de la página de WhatsApp Web (no del panel).
// En vez de ocultar el scroll, lo dejamos visible pero delgado y discreto,
// así los usuarios sin rueda de mouse (o con trackpad) tienen algo de qué
// agarrarse para bajar/subir la lista de chats o los mensajes.
const CSS_ESTILO_SCROLL = `
  html, body { overflow: auto !important; }
  ::-webkit-scrollbar {
    width: 12px !important;
    display: block !important;
  }
  ::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1) !important;
    border-radius: 10px !important;
  }
  ::-webkit-scrollbar-thumb {
    background: rgba(128, 128, 128, 0.6) !important;
    border-radius: 10px !important;
    border: 3px solid transparent !important;
    background-clip: content-box !important;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(128, 128, 128, 0.8) !important;
    background-clip: content-box !important;
  }
  * { scrollbar-width: thin !important; }
`

const bodyRef = ref<HTMLDivElement | null>(null)
const webviewRef = ref<any>(null)
const webviewListo = ref(false)

let resizeObserver: ResizeObserver | null = null
let frameProgramado = false

// Simula, dentro de la página de WhatsApp, el mismo "empujón" que recibe
// cuando cambia el tamaño real de la ventana del sistema operativo.
// Esto es lo que le falta al webview cuando el que cambia es el CSS del contenedor.
const forzarReajuste = () => {
  const wv = webviewRef.value
  if (!wv || !webviewListo.value) return

  try {
    wv.executeJavaScript(`
      window.dispatchEvent(new Event('resize'));
      window.dispatchEvent(new Event('orientationchange'));
    `).catch(() => {})
  } catch {
    // La página aún no está lista del todo.
  }
}

const onWebviewListo = () => {
  webviewListo.value = true
  try {
    webviewRef.value?.insertCSS(CSS_ESTILO_SCROLL)
  } catch {
    // noop
  }
  forzarReajuste()
  // Un segundo empujón tras el primer pintado, por si la página
  // todavía no había terminado de montar su layout inicial.
  setTimeout(forzarReajuste, 400)
}

// Cada vez que el CONTENEDOR cambia de tamaño (se abre/cierra el panel,
// cambian proporciones 70/30, se colapsa el sidebar, etc.) volvemos a
// avisarle a la página interna para que recalcule su layout responsivo.
const observarTamano = () => {
  if (!bodyRef.value || typeof ResizeObserver === 'undefined') return
  resizeObserver = new ResizeObserver(() => {
    if (frameProgramado) return
    frameProgramado = true
    requestAnimationFrame(() => {
      frameProgramado = false
      forzarReajuste()
    })
  })
  resizeObserver.observe(bodyRef.value)
}

onMounted(() => {
  observarTamano()
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
})

// Cuando el panel pasa de cerrado a abierto, el webview pudo haberse
// montado con tamaño 0 (Teleport + v-if). Reajustamos apenas se muestra.
watch(
  () => props.abierto,
  async (abierto) => {
    if (!abierto) return
    await nextTick()
    forzarReajuste()
    if (!resizeObserver) observarTamano()
  }
)

watch(() => props.urlInicial, (url) => {
  if (!url || !webviewListo.value) return
  try { webviewRef.value?.loadURL(url) } catch { /* noop */ }
})

const abrirEnNavegador = () => {
  window.open('https://web.whatsapp.com', '_blank', 'noopener,noreferrer')
}

const recargarWebview = () => {
  if (webviewRef.value && webviewListo.value) {
    try {
      webviewRef.value.reload()
    } catch (error) {
      console.error('Error al recargar webview:', error)
    }
  }
}
</script>

<style scoped>
.whatsapp-panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 5000;
  left: auto;
  display: flex;
  flex-direction: column;
  width: 30vw;
  min-width: 340px;
  max-width: 90vw;
  height: 100dvh;
  overflow: hidden;
  background: #f0f2f5;
  border-left: 1px solid #d7dde3;
  box-shadow: -12px 0 34px rgba(12, 34, 48, 0.2);
  animation: whatsapp-panel-in 180ms ease-out;
  margin: 0;
  padding: 0;
}

.whatsapp-panel-izquierda {
  right: auto;
  left: 0;
  border-left: none;
  border-right: 1px solid #d7dde3;
  box-shadow: 12px 0 34px rgba(12, 34, 48, 0.2);
}
.whatsapp-panel-centrado { top: 7vh; right: 50%; bottom: auto; left: 50%; width: min(860px, 92vw); height: 86vh; transform: translateX(-50%); border: 0; border-radius: 18px; box-shadow: 0 24px 70px rgba(12, 34, 48, 0.34); }

.whatsapp-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  height: 68px;
  min-height: 0;
  box-sizing: border-box;
  padding: 12px 16px;
  background: #075e54;
  color: #fff;
}

.whatsapp-panel-title {
  display: flex;
  align-items: center;
  gap: 11px;
}

.whatsapp-panel-title > ion-icon {
  font-size: 30px;
}

.whatsapp-panel-title div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.whatsapp-panel-title strong {
  font-size: 16px;
}

.whatsapp-panel-title span {
  color: rgba(255, 255, 255, 0.76);
  font-size: 12px;
}

.whatsapp-panel-close {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: #fff;
  cursor: pointer;
  font-size: 23px;
}

.whatsapp-panel-close:hover {
  background: rgba(255, 255, 255, 0.14);
}

.whatsapp-panel-actions { display: flex; align-items: center; gap: 4px; }
.whatsapp-panel-actions button { display: grid; place-items: center; width: 32px; height: 32px; border: 0; border-radius: 8px; background: transparent; color: inherit; cursor: pointer; font-size: 18px; }
.whatsapp-panel-actions button:hover, .whatsapp-panel-actions button.activa { background: rgba(255,255,255,.16); }

.whatsapp-panel-body {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.whatsapp-webview {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
}

.whatsapp-browser-fallback {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 32px;
  color: #425466;
  text-align: center;
}

.whatsapp-browser-fallback > ion-icon {
  color: #128c7e;
  font-size: 58px;
}

.whatsapp-browser-fallback button {
  padding: 11px 18px;
  border: 0;
  border-radius: 10px;
  background: #128c7e;
  color: white;
  cursor: pointer;
  font-weight: 700;
}

@keyframes whatsapp-panel-in {
  from { opacity: 0; transform: translateX(18px); }
  to { opacity: 1; transform: translateX(0); }
}

.whatsapp-panel-izquierda {
  animation: whatsapp-panel-in-izquierda 180ms ease-out;
}

@keyframes whatsapp-panel-in-izquierda {
  from { opacity: 0; transform: translateX(-18px); }
  to { opacity: 1; transform: translateX(0); }
}

@media (max-width: 700px) {
  .whatsapp-panel {
    width: 100vw;
    min-width: 0;
    max-width: 100vw;
  }
}
</style>