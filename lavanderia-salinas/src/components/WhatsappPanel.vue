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
          <button type="button" title="Colocar a la izquierda" aria-label="Colocar WhatsApp a la izquierda" :class="{ activa: lateral && lado === 'izquierda' }" @click="colocarLateral('izquierda')"><span class="panel-placement-icon panel-placement-left" aria-hidden="true"><i></i></span></button>
          <button type="button" title="Colocar a la derecha" aria-label="Colocar WhatsApp a la derecha" :class="{ activa: lateral && lado === 'derecha' }" @click="colocarLateral('derecha')"><span class="panel-placement-icon panel-placement-right" aria-hidden="true"><i></i></span></button>
          <button type="button" :title="lateral ? 'Maximizar WhatsApp a pantalla completa' : 'Restaurar WhatsApp al lateral'" :aria-label="lateral ? 'Maximizar WhatsApp a pantalla completa' : 'Restaurar WhatsApp al lateral'" @click="alternarModo"><ion-icon :icon="lateral ? expandOutline : contractOutline" /></button>
          <button type="button" title="Recargar WhatsApp" aria-label="Recargar WhatsApp" @click="recargarWebview"><ion-icon :icon="refreshOutline" /></button>
          <button class="whatsapp-panel-close" type="button" aria-label="Cerrar WhatsApp" title="Cerrar WhatsApp" @click="$emit('cerrar')"><ion-icon :icon="closeOutline" /></button>
        </div>
      </header>

      <div v-if="estadoAdjunto" class="whatsapp-adjunto-estado" role="status" aria-live="polite">
        {{ estadoAdjunto }}
      </div>

      <div ref="bodyRef" class="whatsapp-panel-body">
        <webview
          ref="webviewRef"
          class="whatsapp-webview"
          :src="urlWhatsappInicialSegura"
          partition="persist:lavanderia-whatsapp"
          useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
          @dom-ready="onWebviewListo"
        ></webview>
      </div>
    </aside>
  </Teleport>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { closeOutline, contractOutline, expandOutline, logoWhatsapp, refreshOutline } from 'ionicons/icons'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps<{
  abierto: boolean
  urlInicial?: string
  solicitudCarga?: number
  imagenPendiente?: string
  pdfPendiente?: { data: string; name: string } | null
  textoAdjunto?: string
  solicitudAdjunto?: number
}>()
const URL_WHATSAPP = 'https://web.whatsapp.com'
const normalizarUrlWhatsapp = (url?: string) => {
  if (!url) return URL_WHATSAPP
  const destino = new URL(url)
  if (destino.origin !== URL_WHATSAPP) {
    throw new Error('El panel solo puede cargar WhatsApp Web.')
  }
  return destino.href
}
const urlWhatsappInicialSegura = computed(() => {
  try {
    return normalizarUrlWhatsapp(props.urlInicial)
  } catch (error) {
    console.error('No se pudo validar la URL inicial de WhatsApp:', error)
    return URL_WHATSAPP
  }
})
const emit = defineEmits<{
  cerrar: []
  'modo-cambio': [lateral: boolean]
  'lado-cambio': [lado: 'izquierda' | 'derecha']
  'adjunto-resuelto': []
}>()
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
let ultimaSolicitudCargaAplicada = props.solicitudCarga ?? 0
let ultimaSolicitudAdjuntoAplicada = props.solicitudAdjunto ?? 0
let cargaWhatsappEnCurso: Promise<void> | null = null
let mensajeWhatsappPrecargado = false
const estadoAdjunto = ref('')

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

const enfocarEditorMensaje = async (esperarEditor: boolean) => {
  const webview = webviewRef.value
  if (!webview || !mensajeWhatsappPrecargado) return

  const resultado = esperarEditor
    ? await webview.executeJavaScript(`new Promise(resolve => {
        let intentos = 0;
        const enfocarEditor = () => {
          const editor = document.querySelector('[contenteditable="true"][data-tab="10"]') ||
            document.querySelector('[contenteditable="true"][role="textbox"]');
          if (editor) {
            editor.focus();
            const rango = document.createRange();
            rango.selectNodeContents(editor);
            rango.collapse(false);
            const seleccion = window.getSelection();
            seleccion.removeAllRanges();
            seleccion.addRange(rango);
            resolve(true);
            return;
          }
          intentos += 1;
          if (intentos >= 40) {
            resolve(false);
            return;
          }
          setTimeout(enfocarEditor, 250);
        };
        enfocarEditor();
      })`)
    : await webview.executeJavaScript(`(() => {
        const editor = document.querySelector('[contenteditable="true"][data-tab="10"]') ||
          document.querySelector('[contenteditable="true"][role="textbox"]');
        if (!editor) return false;
        editor.focus();
        const rango = document.createRange();
        rango.selectNodeContents(editor);
        rango.collapse(false);
        const seleccion = window.getSelection();
        seleccion.removeAllRanges();
        seleccion.addRange(rango);
        return true;
      })()`)

  if (!resultado && esperarEditor) {
    console.warn('No se encontró el cuadro de mensaje de WhatsApp para enfocarlo.')
  }
}

const onWebviewListo = () => {
  webviewListo.value = true
  const urlActual = webviewRef.value?.getURL?.() || props.urlInicial || ''
  mensajeWhatsappPrecargado = new URL(urlActual).searchParams.has('text')
  try {
    webviewRef.value?.insertCSS(CSS_ESTILO_SCROLL)
  } catch {
    // noop
  }
  aplicarSolicitudCargaWhatsapp()
  void adjuntarImagenCupon()
  forzarReajuste()
  // Un segundo empujón tras el primer pintado, por si la página
  // todavía no había terminado de montar su layout inicial.
  setTimeout(forzarReajuste, 400)
  restaurarFocoWebview()
  if (mensajeWhatsappPrecargado) {
    void enfocarEditorMensaje(true).catch((error: unknown) => {
      console.error('No se pudo enfocar el cuadro de mensaje de WhatsApp:', error)
    })
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

const restaurarFocoWebview = () => {
  if (!props.abierto || !webviewListo.value || document.visibilityState !== 'visible') return
  const webview = webviewRef.value
  if (!webview) return

  webview.focus()
  const restaurarFoco = mensajeWhatsappPrecargado
    ? enfocarEditorMensaje(false)
    : webview.executeJavaScript('window.focus()')
  void restaurarFoco.catch((error: unknown) => {
    console.warn('No se pudo restaurar el foco de WhatsApp:', error)
  })
}

onMounted(() => {
  observarTamano()
  window.addEventListener('focus', restaurarFocoWebview)
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  window.removeEventListener('focus', restaurarFocoWebview)
})

// Cuando el panel pasa de cerrado a abierto, el webview pudo haberse
// montado con tamaño 0 (Teleport + v-if). Reajustamos apenas se muestra.
watch(
  () => props.abierto,
  async (abierto) => {
    if (!abierto) {
      estadoAdjunto.value = ''
      return
    }
    await nextTick()
    forzarReajuste()
    restaurarFocoWebview()
    if (!resizeObserver) observarTamano()
  }
)

const aplicarSolicitudCargaWhatsapp = () => {
  const solicitud = props.solicitudCarga ?? 0
  if (solicitud === ultimaSolicitudCargaAplicada) return
  let url: string
  try {
    url = normalizarUrlWhatsapp(props.urlInicial)
  } catch (error) {
    console.error('No se pudo validar la URL de WhatsApp:', error)
    estadoAdjunto.value = 'No se pudo abrir el chat de WhatsApp.'
    return
  }
  const webview = webviewRef.value
  if (!url || !webview || !webviewListo.value) return

  ultimaSolicitudCargaAplicada = solicitud
  mensajeWhatsappPrecargado = new URL(url).searchParams.has('text')
  try {
    cargaWhatsappEnCurso = Promise.resolve(webview.loadURL(url)).then(() => {
      cargaWhatsappEnCurso = null
      if (mensajeWhatsappPrecargado) {
        void enfocarEditorMensaje(true).catch((error: unknown) => {
          console.error('No se pudo enfocar el cuadro de mensaje de WhatsApp:', error)
        })
      }
      void adjuntarImagenCupon()
    }).catch((error) => {
      cargaWhatsappEnCurso = null
      console.warn('No se pudo volver a cargar la plantilla de WhatsApp:', error)
      estadoAdjunto.value = 'No se pudo abrir el chat de WhatsApp.'
    })
  } catch (error) {
    cargaWhatsappEnCurso = null
    console.warn('No se pudo volver a cargar la plantilla de WhatsApp:', error)
    estadoAdjunto.value = 'No se pudo abrir el chat de WhatsApp.'
  }
}

watch(() => props.solicitudCarga, aplicarSolicitudCargaWhatsapp)

const adjuntarImagenCupon = async () => {
  const solicitud = props.solicitudAdjunto ?? 0
  const dataUrl = props.imagenPendiente || ''
  const pdfPendiente = props.pdfPendiente
  if (!solicitud || solicitud === ultimaSolicitudAdjuntoAplicada || (!dataUrl && !pdfPendiente) || !webviewListo.value) return
  if (cargaWhatsappEnCurso) await cargaWhatsappEnCurso.catch(() => {})
  if (solicitud !== (props.solicitudAdjunto ?? 0) || solicitud === ultimaSolicitudAdjuntoAplicada) return

  if (pdfPendiente) {
    ultimaSolicitudAdjuntoAplicada = solicitud
    estadoAdjunto.value = 'Adjuntando el PDF de la factura al chat...'
    try {
      const apiElectron = (window as Window & {
        electronAPI?: { adjuntarPdfWhatsApp?: (webContentsId: number, data: string, nombre: string) => Promise<boolean> }
      }).electronAPI
      const webContentsId = webviewRef.value?.getWebContentsId?.()
      if (!apiElectron?.adjuntarPdfWhatsApp || !webContentsId) {
        finalizarSolicitudAdjunto('No se pudo adjuntar automáticamente el PDF. Adjunta la factura desde el botón de archivo de WhatsApp.')
        return
      }
      await apiElectron.adjuntarPdfWhatsApp(webContentsId, pdfPendiente.data, pdfPendiente.name)
      finalizarSolicitudAdjunto('Factura PDF agregada al chat. Presiona enviar en WhatsApp.')
    } catch (error) {
      console.error('No se pudo adjuntar el PDF en WhatsApp:', error)
      finalizarSolicitudAdjunto('No se pudo adjuntar automáticamente el PDF. Adjunta la factura desde el botón de archivo de WhatsApp.')
    }
    return
  }

  const coincidencia = /^data:image\/png;base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUrl)
  if (!coincidencia) {
    ultimaSolicitudAdjuntoAplicada = solicitud
    finalizarSolicitudAdjunto('La imagen del cupón no tiene un formato válido.')
    return
  }

  ultimaSolicitudAdjuntoAplicada = solicitud
  estadoAdjunto.value = 'Adjuntando el QR al chat...'

  try {
    const editorListo = await webviewRef.value.executeJavaScript(`new Promise(resolve => {
      let intentos = 0;
      const buscarEditor = () => {
        const editor = document.querySelector('[contenteditable="true"][data-tab="10"]') ||
          document.querySelector('[contenteditable="true"][role="textbox"]');
        if (editor) {
          editor.focus();
          resolve(true);
          return;
        }
        intentos += 1;
        if (intentos >= 40) {
          resolve(false);
          return;
        }
        setTimeout(buscarEditor, 250);
      };
      buscarEditor();
    })`)
    if (!editorListo) {
      finalizarSolicitudAdjunto('Abre el chat de WhatsApp y vuelve a compartir el cupón.')
      return
    }

    const apiElectron = (window as Window & {
      electronAPI?: { copiarImagenCuponWhatsApp?: (imagen: string) => Promise<boolean> }
    }).electronAPI
    if (!apiElectron?.copiarImagenCuponWhatsApp) {
      finalizarSolicitudAdjunto('No se pudo acceder al portapapeles de la app. Descarga el QR y adjúntalo manualmente.')
      return
    }

    await apiElectron.copiarImagenCuponWhatsApp(`data:image/png;base64,${coincidencia[1]}`)
    webviewRef.value.focus()
    const editorEnfocado = await webviewRef.value.executeJavaScript(`(() => {
      const editor = document.querySelector('[contenteditable="true"][data-tab="10"]') ||
        document.querySelector('[contenteditable="true"][role="textbox"]');
      if (!editor) return false;
      editor.focus();
      editor.click();
      return document.activeElement === editor;
    })()`)
    if (!editorEnfocado) {
      finalizarSolicitudAdjunto('El chat no está listo para recibir la imagen. Abre la conversación e inténtalo de nuevo.')
      return
    }
    webviewRef.value.sendInputEvent({ type: 'keyDown', keyCode: 'V', modifiers: ['control'] })
    webviewRef.value.sendInputEvent({ type: 'keyUp', keyCode: 'V', modifiers: ['control'] })
    const textoPieFoto = props.textoAdjunto?.trim() ?? ''
    if (textoPieFoto) {
      const pieFotoListo = await webviewRef.value.executeJavaScript(`new Promise(resolve => {
        const texto = ${JSON.stringify(textoPieFoto)};
        let intentos = 0;
        const buscarPieFoto = () => {
          const editor = document.querySelector('[contenteditable="true"][data-tab="10"]') ||
            document.querySelector('[contenteditable="true"][role="textbox"]');
          const botonEnviar = document.querySelector('[data-icon="send"]') ||
            document.querySelector('button[aria-label="Send"], button[aria-label="Enviar"]');
          if (editor && botonEnviar) {
            editor.focus();
            if (editor.innerText.trim() !== texto) {
              const rangoActual = document.createRange();
              rangoActual.selectNodeContents(editor);
              rangoActual.deleteContents();
              rangoActual.collapse(true);
              const seleccionActual = window.getSelection();
              seleccionActual.removeAllRanges();
              seleccionActual.addRange(rangoActual);
              document.execCommand('insertText', false, texto);
            }
            const rango = document.createRange();
            rango.selectNodeContents(editor);
            rango.collapse(false);
            const seleccion = window.getSelection();
            seleccion.removeAllRanges();
            seleccion.addRange(rango);
            resolve(true);
            return;
          }
          intentos += 1;
          if (intentos >= 40) {
            resolve(false);
            return;
          }
          setTimeout(buscarPieFoto, 250);
        };
        buscarPieFoto();
      })`)
      if (!pieFotoListo) {
        finalizarSolicitudAdjunto('QR agregado, pero no se encontró el pie de foto. Escribe el mensaje manualmente antes de enviar.')
        return
      }
      mensajeWhatsappPrecargado = true
    }
    finalizarSolicitudAdjunto('Cupón agregado, presiona enviar.')
  } catch (error) {
    console.error('No se pudo pegar el QR en WhatsApp:', error)
    finalizarSolicitudAdjunto('No se pudo pegar el QR. Descárgalo y adjúntalo manualmente al chat.')
  }
}

const finalizarSolicitudAdjunto = (mensaje: string) => {
  estadoAdjunto.value = mensaje
  emit('adjunto-resuelto')
}

watch(() => props.solicitudAdjunto, () => {
  estadoAdjunto.value = ''
  void adjuntarImagenCupon()
})

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
.whatsapp-panel-centrado { z-index: 7000; inset: 0; width: 100vw; min-width: 0; max-width: none; height: 100dvh; transform: none; border: 0; border-radius: 0; box-shadow: none; }

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
.panel-placement-icon { position: relative; display: block; box-sizing: border-box; width: 17px; height: 17px; border: 1.5px solid currentColor; border-radius: 3px; }
.panel-placement-icon::after { content: ''; position: absolute; top: 2px; bottom: 2px; width: 4px; border-radius: 1px; background: currentColor; }
.panel-placement-left::after { left: 2px; }
.panel-placement-right::after { right: 2px; }

.whatsapp-adjunto-estado {
  flex: 0 0 auto;
  padding: 8px 12px;
  background: #e4f2e8;
  color: #195c36;
  font-size: 0.8rem;
  font-weight: 700;
  text-align: center;
}

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
