<template>
  <Teleport to="body">
    <aside v-if="abierto" class="navegador-panel" :class="{ 'navegador-panel-centrado': !lateral, 'navegador-panel-izquierda': lateral && lado === 'izquierda', 'navegador-panel-oculto': oculto, 'navegador-panel-minimizado': minimizado }" :aria-hidden="oculto || minimizado" aria-label="Navegador web">
      <header class="navegador-panel-header">
        <div class="navegador-panel-title">
          <ion-icon :icon="globeOutline" />
          <div>
            <strong>Navegador</strong>
          </div>
        </div>
        <div class="navegador-panel-actions">
          <button type="button" title="Colocar a la izquierda" aria-label="Colocar navegador a la izquierda" :class="{ activa: lateral && lado === 'izquierda' }" @click="colocarLateral('izquierda')"><span class="panel-placement-icon panel-placement-left" aria-hidden="true"><i></i></span></button>
          <button type="button" title="Colocar a la derecha" aria-label="Colocar navegador a la derecha" :class="{ activa: lateral && lado === 'derecha' }" @click="colocarLateral('derecha')"><span class="panel-placement-icon panel-placement-right" aria-hidden="true"><i></i></span></button>
          <button type="button" :title="lateral ? 'Maximizar navegador a pantalla completa' : 'Restaurar navegador al lateral'" :aria-label="lateral ? 'Maximizar navegador a pantalla completa' : 'Restaurar navegador al lateral'" @click="alternarModo"><ion-icon :icon="lateral ? expandOutline : contractOutline" /></button>
          <button type="button" title="Recargar página" aria-label="Recargar página" @click="recargarWebview"><ion-icon :icon="refreshOutline" /></button>
          <button type="button" title="Minimizar navegador" aria-label="Minimizar navegador" @click="$emit('minimizar')"><ion-icon :icon="removeOutline" /></button>
          <button class="navegador-panel-close" type="button" aria-label="Cerrar navegador" title="Cerrar navegador" @click="$emit('cerrar')"><ion-icon :icon="closeOutline" /></button>
        </div>
      </header>

      <nav v-if="esElectron" class="navegador-tabs" aria-label="Pestañas del navegador">
        <div class="navegador-tabs-lista">
          <div
            v-for="pestana in pestanas"
            :key="pestana.id"
            class="navegador-tab"
            :class="{ activa: pestana.id === pestanaActivaId }"
          >
            <button
              type="button"
              class="navegador-tab-activar"
              :title="pestana.titulo"
              @click="pestanaActivaId = pestana.id"
            >
              <span>{{ pestana.titulo }}</span>
            </button>
            <button
              v-if="pestanas.length > 1"
              type="button"
              class="navegador-tab-cerrar"
              :aria-label="`Cerrar ${pestana.titulo}`"
              title="Cerrar pestaña"
              @click="cerrarPestana(pestana.id)"
            >
              <ion-icon :icon="closeOutline" />
            </button>
          </div>
        </div>
        <button type="button" class="navegador-tab-nueva" title="Nueva pestaña" aria-label="Nueva pestaña" @click="nuevaPestana">
          <ion-icon :icon="addOutline" />
        </button>
      </nav>

      <div ref="bodyRef" class="navegador-panel-body">
        <template v-if="esElectron">
          <webview
            v-for="pestana in pestanas"
            :key="pestana.id"
            :ref="(elemento: Element | null) => guardarWebviewRef(pestana.id, elemento)"
            v-show="pestana.id === pestanaActivaId"
            class="navegador-webview"
            :src="pestana.urlInicial"
            partition="persist:lavanderia-navegador"
            useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
            allowpopups
            @dom-ready="onWebviewListo(pestana.id)"
            @did-navigate="registrarNavegacion(pestana.id, $event)"
            @did-navigate-in-page="registrarNavegacion(pestana.id, $event)"
            @page-title-updated="actualizarTituloPestana(pestana.id, $event)"
          ></webview>
        </template>
        <div v-else class="navegador-browser-fallback">
          <ion-icon :icon="globeOutline" />
          <strong>El navegador se abrirá en una pestaña nueva</strong>
          <button type="button" @click="abrirEnNavegador">Abrir navegador</button>
        </div>
      </div>
    </aside>
  </Teleport>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { addOutline, closeOutline, contractOutline, expandOutline, globeOutline, refreshOutline, removeOutline } from 'ionicons/icons'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

interface PestanaNavegador {
  id: number
  urlInicial: string
  url: string
  titulo: string
}

const props = defineProps<{ abierto: boolean; minimizado?: boolean; oculto?: boolean }>()
const emit = defineEmits<{ cerrar: []; minimizar: []; 'modo-cambio': [lateral: boolean]; 'lado-cambio': [lado: 'izquierda' | 'derecha'] }>()
const lateral = ref(true)

const lado = ref<'izquierda' | 'derecha'>('derecha')
const pestanas = ref<PestanaNavegador[]>([
  { id: 1, urlInicial: 'https://www.google.com', url: 'https://www.google.com', titulo: 'Google' }
])
const pestanaActivaId = ref(1)
const webviewRefs = new Map<number, any>()
const webviewsListos = new Set<number>()
let siguienteIdPestana = 2
const webviewActivo = computed(() => webviewRefs.get(pestanaActivaId.value))

watch(() => props.abierto, (abierto) => {
  if (abierto) {
    lado.value = 'derecha'
    lateral.value = true
  }
}, { immediate: true })

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

const nuevaPestana = () => {
  const id = siguienteIdPestana++
  pestanas.value.push({
    id,
    urlInicial: 'https://www.google.com',
    url: 'https://www.google.com',
    titulo: 'Nueva pestaña'
  })
  pestanaActivaId.value = id
}

const guardarWebviewRef = (id: number, elemento: Element | null) => {
  if (elemento) {
    webviewRefs.set(id, elemento)
    return
  }
  webviewRefs.delete(id)
  webviewsListos.delete(id)
}

const cerrarPestana = (id: number) => {
  if (pestanas.value.length <= 1) return
  const indice = pestanas.value.findIndex((pestana) => pestana.id === id)
  if (indice < 0) return

  const eraActiva = pestanaActivaId.value === id
  pestanas.value.splice(indice, 1)
  webviewRefs.delete(id)
  webviewsListos.delete(id)
  if (eraActiva) {
    pestanaActivaId.value = pestanas.value[Math.min(indice, pestanas.value.length - 1)].id
  }
}

const esElectron = typeof window !== 'undefined' && Boolean((window as Window & { electronAPI?: unknown }).electronAPI)

// CSS que se inyecta DENTRO de la página de Facebook (no del panel).
// En vez de ocultar el scroll, lo dejamos visible pero delgado y discreto,
// así los usuarios sin rueda de mouse (o con trackpad) tienen algo de qué
// agarrarse para bajar/subir el feed o el chat.
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

// Simula, dentro de la página de Messenger, el mismo "empujón" que recibe
// cuando cambia el tamaño real de la ventana del sistema operativo.
// Esto es lo que le falta al webview cuando el que cambia es el CSS del contenedor.
const forzarReajuste = (id = pestanaActivaId.value) => {
  const wv = webviewRefs.get(id)
  if (!wv || !webviewsListos.has(id)) return

  try {
    wv.executeJavaScript(`
      window.dispatchEvent(new Event('resize'));
      window.dispatchEvent(new Event('orientationchange'));
    `).catch(() => {})
  } catch {
    // La página aún no está lista del todo.
  }
}

const onWebviewListo = (id: number) => {
  const wv = webviewRefs.get(id)
  if (!wv) return
  webviewsListos.add(id)
  try {
    wv.insertCSS(CSS_ESTILO_SCROLL)
  } catch {
    // noop
  }
  forzarReajuste(id)
  // Un segundo empujón tras el primer pintado, por si la página
  // todavía no había terminado de montar su layout inicial.
  setTimeout(() => forzarReajuste(id), 400)
}

const registrarNavegacion = (id: number, evento: Event) => {
  const url = (evento as CustomEvent<{ url?: string }>).detail?.url
  if (!url) return

  const pestana = pestanas.value.find((entrada) => entrada.id === id)
  if (!pestana) return
  pestana.url = url
  try {
    pestana.titulo = new URL(url).hostname
  } catch {
    pestana.titulo = url
  }
}

const actualizarTituloPestana = (id: number, evento: Event) => {
  const titulo = (evento as CustomEvent<{ title?: string }>).detail?.title?.trim()
  const pestana = pestanas.value.find((entrada) => entrada.id === id)
  if (pestana && titulo) pestana.titulo = titulo
}

const recargarWebview = () => {
  if (webviewActivo.value && webviewsListos.has(pestanaActivaId.value)) {
    try {
      webviewActivo.value.reload()
    } catch (error) {
      console.error('Error al recargar webview:', error)
    }
  }
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

watch(
  () => props.abierto,
  async (abierto) => {
    if (!abierto) return
    await nextTick()
    forzarReajuste()
    if (!resizeObserver) observarTamano()
  }
)

const abrirEnNavegador = () => {
  window.open('https://www.google.com', '_blank', 'noopener,noreferrer')
}

</script>

<style scoped>
.navegador-panel {
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
  animation: navegador-panel-in 180ms ease-out;
}

.navegador-panel-oculto {
  visibility: hidden;
  pointer-events: none;
}

.navegador-panel-minimizado {
  visibility: hidden;
  pointer-events: none;
}

.navegador-panel-izquierda {
  right: auto;
  left: 0;
  border-left: none;
  border-right: 1px solid #d7dde3;
  box-shadow: 12px 0 34px rgba(12, 34, 48, 0.2);
}
.navegador-panel-centrado { z-index: 7000; inset: 0; width: 100vw; min-width: 0; max-width: none; height: 100dvh; transform: none; border: 0; border-radius: 0; box-shadow: none; }

.navegador-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  height: 68px;
  min-height: 0;
  box-sizing: border-box;
  padding: 12px 16px;
  background: #414751;
  color: #fff;
}

.navegador-panel-title {
  display: flex;
  align-items: center;
  gap: 11px;
}

.navegador-panel-title > ion-icon {
  font-size: 30px;
}

.navegador-panel-title div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.navegador-panel-title strong {
  font-size: 16px;
}

.navegador-panel-title span {
  color: rgba(255, 255, 255, 0.78);
  font-size: 12px;
}

.navegador-panel-close {
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

.navegador-panel-close:hover {
  background: rgba(255, 255, 255, 0.16);
}

.navegador-panel-actions { display: flex; align-items: center; gap: 4px; }
.navegador-panel-actions button { display: grid; place-items: center; width: 32px; height: 32px; border: 0; border-radius: 8px; background: transparent; color: inherit; cursor: pointer; font-size: 18px; }
.navegador-panel-actions button:hover, .navegador-panel-actions button.activa { background: rgba(255,255,255,.16); }
.panel-placement-icon { position: relative; display: block; box-sizing: border-box; width: 17px; height: 17px; border: 1.5px solid currentColor; border-radius: 3px; }
.panel-placement-icon::after { content: ''; position: absolute; top: 2px; bottom: 2px; width: 4px; border-radius: 1px; background: currentColor; }
.panel-placement-left::after { left: 2px; }
.panel-placement-right::after { right: 2px; }

.navegador-panel-body {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.navegador-tabs {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
  min-width: 0;
  height: 38px;
  padding: 4px 8px 0;
  background: #30353d;
  color: #ffffff;
}

.navegador-tabs-lista {
  display: flex;
  align-items: stretch;
  gap: 3px;
  flex: 1;
  min-width: 0;
  height: 100%;
  overflow-x: auto;
  scrollbar-width: none;
}

.navegador-tabs-lista::-webkit-scrollbar {
  display: none;
}

.navegador-tab {
  display: flex;
  align-items: center;
  gap: 2px;
  flex: 0 1 190px;
  min-width: 90px;
  max-width: 220px;
  height: 100%;
  padding: 0 4px 0 9px;
  border-radius: 7px 7px 0 0;
  background: #414751;
  color: rgba(255, 255, 255, 0.75);
}

.navegador-tab.activa {
  background: #f0f2f5;
  color: #263746;
}

.navegador-tab-activar {
  flex: 1;
  min-width: 0;
  height: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.navegador-tab-activar span {
  display: block;
  overflow: hidden;
  font-size: 0.75rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.navegador-tab-cerrar,
.navegador-tab-nueva {
  display: grid;
  flex: 0 0 auto;
  width: 25px;
  height: 25px;
  place-items: center;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.navegador-tab-cerrar:hover,
.navegador-tab-nueva:hover {
  background: rgba(127, 143, 160, 0.24);
}

.navegador-tab-nueva {
  font-size: 1rem;
}

.navegador-webview {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
}

.navegador-browser-fallback {
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

.navegador-browser-fallback > ion-icon {
  color: #0866ff;
  font-size: 58px;
}

.navegador-browser-fallback button {
  padding: 11px 18px;
  border: 0;
  border-radius: 10px;
  background: #0866ff;
  color: white;
  cursor: pointer;
  font-weight: 700;
}

@keyframes navegador-panel-in {
  from { opacity: 0; transform: translateX(18px); }
  to { opacity: 1; transform: translateX(0); }
}

.navegador-panel-izquierda {
  animation: navegador-panel-in-izquierda 180ms ease-out;
}

@keyframes navegador-panel-in-izquierda {
  from { opacity: 0; transform: translateX(-18px); }
  to { opacity: 1; transform: translateX(0); }
}

@media (max-width: 700px) {
  .navegador-panel {
    width: 100vw;
    min-width: 0;
    max-width: 100vw;
  }
}
</style>
