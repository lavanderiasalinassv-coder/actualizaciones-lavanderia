<template>
  <AppShell>
    <main class="guia-page">
      <header class="guia-hero">
        <div class="guia-hero-icon" aria-hidden="true">
          <ion-icon :icon="bookOutline" />
        </div>
        <div class="guia-hero-copy">
          <p class="guia-eyebrow">CENTRO DE AYUDA</p>
          <h1>{{ articuloSeleccionado?.titulo || 'Guía de la aplicación' }}</h1>
          <p>{{ articuloSeleccionado?.descripcion || 'Encuentra instrucciones y tutoriales para conocer las herramientas de Lavandería Salinas.' }}</p>
        </div>
        <button v-if="esDesarrollador" class="guia-accion-principal" type="button" @click="abrirEditor()">
          <ion-icon :icon="addOutline" />
          Agregar artículo
        </button>
      </header>

      <div class="guia-vistas">
        <section v-show="articuloSeleccionado" class="guia-detalle">
          <template v-if="articuloSeleccionado">
            <div class="guia-detalle-acciones">
              <button class="guia-boton-secundario" type="button" @click="articuloSeleccionado = null">
                <ion-icon :icon="arrowBackOutline" />
                Volver al índice
              </button>
              <div v-if="esDesarrollador" class="guia-admin-acciones">
                <button class="guia-boton-secundario" type="button" @click="abrirEditor(articuloSeleccionado)">
                  <ion-icon :icon="createOutline" />
                  Editar
                </button>
                <button class="guia-boton-peligro" type="button" :disabled="eliminandoId === articuloSeleccionado.id" @click="eliminarArticulo(articuloSeleccionado)">
                  <ion-icon :icon="trashOutline" />
                  {{ eliminandoId === articuloSeleccionado.id ? 'Eliminando...' : 'Eliminar' }}
                </button>
              </div>
            </div>

            <article ref="articuloContenidoRef" class="guia-articulo">
              <p class="guia-eyebrow">ARTÍCULO DE AYUDA</p>
              <h2>{{ articuloSeleccionado.titulo }}</h2>
              <p class="guia-articulo-descripcion">{{ articuloSeleccionado.descripcion }}</p>
              <img
                v-if="urlImagenSegura(articuloSeleccionado.imagenUrl)"
                class="guia-articulo-imagen"
                :src="urlImagenSegura(articuloSeleccionado.imagenUrl) || undefined"
                :alt="`Imagen del artículo ${articuloSeleccionado.titulo}`"
                loading="lazy"
                referrerpolicy="no-referrer"
              />
              <div class="guia-articulo-contenido" v-html="contenidoSeguro(articuloSeleccionado.contenido)"></div>

              <section v-if="articuloSeleccionado.videoUrl" class="guia-video">
                <h3><ion-icon :icon="playCircleOutline" /> Tutorial en video</h3>
                <div v-if="urlVideoIncrustado(articuloSeleccionado.videoUrl)" class="guia-video-marco" :class="{ drive: esUrlDrive(articuloSeleccionado.videoUrl) }">
                  <iframe
                    :src="urlVideoIncrustado(articuloSeleccionado.videoUrl) || undefined"
                    :title="`Video: ${articuloSeleccionado.titulo}`"
                    loading="lazy"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowfullscreen
                    referrerpolicy="strict-origin-when-cross-origin"
                  />
                </div>
                <video
                  v-else-if="urlVideoDirecto(articuloSeleccionado.videoUrl)"
                  class="guia-video-directo"
                  :src="urlVideoDirecto(articuloSeleccionado.videoUrl) || undefined"
                  controls
                  playsinline
                  preload="metadata"
                />
                <a v-else class="guia-enlace-video" :href="articuloSeleccionado.videoUrl" target="_blank" rel="noopener noreferrer">
                  <ion-icon :icon="openOutline" />
                  Abrir video en una pestaña nueva
                </a>
              </section>
            </article>
          </template>
        </section>

        <section v-show="!articuloSeleccionado" class="guia-indice">
          <section class="guia-busqueda" aria-label="Buscar en la guía">
            <ion-icon :icon="searchOutline" aria-hidden="true" />
            <input
              v-model="busqueda"
              type="search"
              placeholder="Buscar un tema o cómo hacer algo..."
              aria-label="Buscar artículos de la guía"
            />
            <button v-if="busqueda" type="button" aria-label="Limpiar búsqueda" @click="busqueda = ''">
              <ion-icon :icon="closeOutline" />
            </button>
          </section>

          <section class="guia-lista-seccion">
            <div class="guia-seccion-cabecera">
              <div>
                <h2>Índice de temas</h2>
                <p>{{ articulosFiltrados.length }} artículo{{ articulosFiltrados.length === 1 ? '' : 's' }} disponible{{ articulosFiltrados.length === 1 ? '' : 's' }}</p>
              </div>
            </div>

            <div v-if="cargando" class="guia-estado" role="status">
              <ion-spinner name="crescent" />
              <span>Cargando artículos...</span>
            </div>
            <div v-else-if="errorCarga" class="guia-estado guia-error" role="alert">
              <ion-icon :icon="alertCircleOutline" />
              <span>{{ errorCarga }}</span>
              <button class="guia-boton-secundario" type="button" @click="cargarArticulos">Reintentar</button>
            </div>
            <div v-else-if="articulosFiltrados.length" class="guia-lista">
              <article v-for="articulo in articulosFiltrados" :key="articulo.id" class="guia-lista-articulo">
                <button class="guia-lista-abrir" type="button" @click="abrirArticulo(articulo)">
                  <span class="guia-articulo-icono"><ion-icon :icon="documentTextOutline" /></span>
                  <span class="guia-articulo-resumen">
                    <strong>{{ articulo.titulo }}</strong>
                    <span>{{ articulo.descripcion }}</span>
                  </span>
                  <span v-if="articulo.videoUrl" class="guia-tiene-video" title="Incluye video" aria-label="Incluye video">
                    <ion-icon :icon="videocamOutline" />
                  </span>
                  <ion-icon class="guia-flecha" :icon="chevronForwardOutline" />
                </button>
                <div v-if="esDesarrollador" class="guia-lista-admin">
                  <button type="button" @click="abrirEditor(articulo)"><ion-icon :icon="createOutline" /> Editar</button>
                  <button type="button" class="eliminar" :disabled="eliminandoId === articulo.id" @click="eliminarArticulo(articulo)">
                    <ion-icon :icon="trashOutline" /> Eliminar
                  </button>
                </div>
              </article>
            </div>
            <div v-else class="guia-vacio">
              <ion-icon :icon="busqueda ? searchOutline : bookOutline" aria-hidden="true" />
              <strong>{{ busqueda ? 'No encontramos artículos' : 'La guía se está preparando' }}</strong>
              <p>{{ busqueda ? 'Prueba con otras palabras.' : 'Pronto encontrarás aquí artículos y tutoriales de la aplicación.' }}</p>
            </div>
          </section>
        </section>
      </div>

      <ion-modal :is-open="mostrarEditor" class="guia-editor-modal" @didPresent="inicializarEditor" @didDismiss="cerrarEditor">
        <form class="guia-editor" @submit.prevent="guardarArticulo">
          <header class="guia-editor-cabecera">
            <div>
              <p class="guia-eyebrow">ADMINISTRACIÓN DE GUÍA</p>
              <h2>{{ articuloEditandoId ? 'Editar artículo' : 'Agregar artículo' }}</h2>
            </div>
            <button class="guia-cerrar" type="button" aria-label="Cerrar" @click="cerrarEditor">
              <ion-icon :icon="closeOutline" />
            </button>
          </header>
          <label class="guia-campo">
            <span>Título</span>
            <input v-model="formulario.titulo" maxlength="180" required placeholder="Ej. Cómo registrar una orden" />
          </label>
          <label class="guia-campo">
            <span>Descripción para el índice</span>
            <textarea v-model="formulario.descripcion" rows="2" maxlength="500" required placeholder="Resumen corto que aparecerá en la lista de temas" />
          </label>
          <div class="guia-campo">
            <span>Información del artículo</span>
            <div class="guia-editor-toolbar" role="toolbar" aria-label="Formato de texto">
              <button class="guia-toolbar-etiquetado" type="button" title="Insertar una plantilla visual para el artículo" @mousedown.prevent @click="insertarPlantilla">✦ Plantilla</button>
              <span class="guia-toolbar-separador" aria-hidden="true"></span>
              <button class="guia-toolbar-etiquetado" type="button" title="Crear una lista con viñetas" @mousedown.prevent @click="aplicarFormato('insertUnorderedList')">• Viñetas</button>
              <button class="guia-toolbar-etiquetado" type="button" title="Crear una lista numerada" @mousedown.prevent @click="aplicarFormato('insertOrderedList')">1. Numerada</button>
              <button class="guia-toolbar-etiquetado" type="button" title="Aplicar un subtítulo" @mousedown.prevent @click="aplicarFormato('formatBlock', 'h3')"># Subtítulo</button>
              <span class="guia-toolbar-separador" aria-hidden="true"></span>
              <button type="button" title="Negrita" aria-label="Negrita" @mousedown.prevent @click="aplicarFormato('bold')"><strong>B</strong></button>
              <button type="button" title="Cursiva" aria-label="Cursiva" @mousedown.prevent @click="aplicarFormato('italic')"><em>I</em></button>
              <button type="button" title="Subrayado" aria-label="Subrayar texto" @mousedown.prevent @click="aplicarFormato('underline')"><u>U</u></button>
              <span class="guia-toolbar-separador" aria-hidden="true"></span>
              <div class="guia-color-control">
                <button type="button" title="Color del texto" aria-label="Elegir color del texto" @mousedown.prevent @click="mostrarColores = !mostrarColores">
                  <span class="guia-color-icono">A</span>
                  <span class="guia-color-subrayado"></span>
                </button>
                <div v-if="mostrarColores" class="guia-color-opciones">
                  <button
                    v-for="color in coloresTexto"
                    :key="color.valor"
                    type="button"
                    :title="color.nombre"
                    :aria-label="`Color ${color.nombre}`"
                    :style="{ '--color-muestra': color.valor }"
                    @mousedown.prevent
                    @click="aplicarFormato('foreColor', color.valor); mostrarColores = false"
                  />
                </div>
              </div>
              <span class="guia-toolbar-separador" aria-hidden="true"></span>
              <div class="guia-emoji-control">
                <button type="button" title="Insertar emoji" aria-label="Insertar emoji" @mousedown.prevent @click="mostrarEmojis = !mostrarEmojis">😊</button>
                <div v-if="mostrarEmojis" class="guia-emoji-opciones">
                  <button v-for="emoji in emojis" :key="emoji" type="button" :aria-label="`Insertar ${emoji}`" @mousedown.prevent @click="insertarTexto(emoji); mostrarEmojis = false">{{ emoji }}</button>
                </div>
              </div>
              <span class="guia-toolbar-separador" aria-hidden="true"></span>
              <button type="button" title="Alinear a la izquierda" aria-label="Alinear a la izquierda" @mousedown.prevent @click="aplicarFormato('justifyLeft')">☰</button>
              <button type="button" title="Centrar" aria-label="Centrar texto" @mousedown.prevent @click="aplicarFormato('justifyCenter')">≡</button>
              <button type="button" title="Alinear a la derecha" aria-label="Alinear a la derecha" @mousedown.prevent @click="aplicarFormato('justifyRight')">☷</button>
              <span class="guia-toolbar-separador" aria-hidden="true"></span>
              <button type="button" title="Insertar tabla" aria-label="Insertar tabla de 3 por 3" @mousedown.prevent @click="insertarTabla">▦</button>
              <button type="button" title="Agregar fila" aria-label="Agregar fila a la tabla" @mousedown.prevent @click="agregarFilaTabla">+ Fila</button>
              <button type="button" title="Agregar columna" aria-label="Agregar columna a la tabla" @mousedown.prevent @click="agregarColumnaTabla">+ Columna</button>
            </div>
            <div
              ref="contenidoEditor"
              class="guia-editor-texto"
              contenteditable="true"
              role="textbox"
              aria-label="Información del artículo"
              aria-multiline="true"
              data-placeholder="Escribe aquí las instrucciones y detalles del tema"
              @input="actualizarContenido"
            ></div>
            <small>Selecciona texto y usa la barra para aplicar formato. Las tablas empiezan con 3 filas y 3 columnas.</small>
            <small>Usa Plantilla para insertar bloques visuales editables, o Viñetas y Numerada para organizar pasos y listas.</small>
            <small v-if="mensajeFormato" class="guia-mensaje-formato" role="status">{{ mensajeFormato }}</small>
          </div>
          <label class="guia-campo">
            <span>URL de imagen (opcional)</span>
            <input v-model="formulario.imagenUrl" type="url" maxlength="2048" placeholder="https://ejemplo.com/imagen.jpg" />
            <small>Agrega un enlace directo a una imagen pública. La vista previa aparecerá en el artículo.</small>
            <img
              v-if="urlImagenSegura(formulario.imagenUrl)"
              class="guia-editor-imagen-preview"
              :src="urlImagenSegura(formulario.imagenUrl) || undefined"
              alt="Vista previa de la imagen del artículo"
              loading="lazy"
              referrerpolicy="no-referrer"
            />
          </label>
          <label class="guia-campo">
            <span>Enlace del video (opcional)</span>
            <input v-model="formulario.videoUrl" type="url" maxlength="2048" placeholder="YouTube, Google Drive o enlace a video .mp4" />
            <small>Se admiten enlaces de YouTube, Drive, Vimeo y archivos de video directos.</small>
          </label>
          <p v-if="mensajeEditor" class="guia-mensaje" :class="{ error: errorEditor }" role="alert">{{ mensajeEditor }}</p>
          <footer class="guia-editor-pie">
            <button class="guia-boton-secundario" type="button" :disabled="guardando" @click="cerrarEditor">Cancelar</button>
            <button class="guia-accion-principal" type="submit" :disabled="guardando">
              {{ guardando ? 'Guardando...' : articuloEditandoId ? 'Guardar cambios' : 'Guardar artículo' }}
            </button>
          </footer>
        </form>
      </ion-modal>
    </main>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { IonIcon, IonModal, IonSpinner } from '@ionic/vue'
import DOMPurify from 'dompurify'
import {
  addOutline,
  alertCircleOutline,
  arrowBackOutline,
  bookOutline,
  chevronForwardOutline,
  closeOutline,
  createOutline,
  documentTextOutline,
  openOutline,
  playCircleOutline,
  searchOutline,
  trashOutline,
  videocamOutline,
} from 'ionicons/icons'
import AppShell from '@/components/AppShell.vue'
import { getApiBaseUrl } from '@/composables/useApiConfig'
import { useSesion } from '@/composables/useSesion'
import { esUrlDrive, obtenerUrlVideoDirecto, obtenerUrlVideoIncrustado } from '@/utils/mediaAvisos'

interface GuiaArticulo {
  id: string
  titulo: string
  descripcion: string
  contenido: string
  imagenUrl: string | null
  videoUrl: string | null
}

const { usuarioActual } = useSesion()
const articulos = ref<GuiaArticulo[]>([])
const articuloSeleccionado = ref<GuiaArticulo | null>(null)
const articuloContenidoRef = ref<HTMLElement | null>(null)
const busqueda = ref('')
const cargando = ref(true)
const errorCarga = ref('')
const esDesarrollador = ref(false)
const mostrarEditor = ref(false)
const guardando = ref(false)
const eliminandoId = ref('')
const articuloEditandoId = ref('')
const contenidoEditor = ref<HTMLElement | null>(null)
const mostrarColores = ref(false)
const mostrarEmojis = ref(false)
const mensajeFormato = ref('')
const mensajeEditor = ref('')
const errorEditor = ref(false)
const formulario = reactive({ titulo: '', descripcion: '', contenido: '', imagenUrl: '', videoUrl: '' })
const normalizarBusqueda = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
const coloresTexto = [
  { nombre: 'Negro', valor: '#172b4d' },
  { nombre: 'Rojo', valor: '#c62828' },
  { nombre: 'Naranja', valor: '#ef6c00' },
  { nombre: 'Verde', valor: '#2e7d32' },
  { nombre: 'Azul', valor: '#1565c0' },
  { nombre: 'Morado', valor: '#7b1fa2' },
]
const emojis = ['😀', '😊', '👍', '✅', '⚠️', '💡', '🫧', '📌', '🎉', '❤️']
const articulosFiltrados = computed(() => {
  const terminos = normalizarBusqueda(busqueda.value).split(/\s+/).filter(Boolean)
  if (!terminos.length) return articulos.value
  return articulos.value.filter((articulo) => {
    const contenidoTexto = new DOMParser().parseFromString(articulo.contenido, 'text/html').body.textContent ?? ''
    const textoArticulo = normalizarBusqueda(`${articulo.titulo} ${articulo.descripcion} ${contenidoTexto}`)
    return terminos.every((termino) => textoArticulo.includes(termino))
  })
})
const api = () => `${getApiBaseUrl()}/guia/articulos`
const headers = () => ({
  'Content-Type': 'application/json',
  'x-user-id': usuarioActual.value?.id ?? '',
  'x-user-name': usuarioActual.value?.nombre ?? '',
  'x-user-role': usuarioActual.value?.rol ?? '',
})
const leerError = async (respuesta: Response, alternativo: string) => {
  const datos = await respuesta.json().catch(() => null)
  return typeof datos?.error === 'string' ? datos.error : alternativo
}
const cargarArticulos = async () => {
  cargando.value = true
  errorCarga.value = ''
  try {
    const respuesta = await fetch(api(), { headers: headers() })
    if (!respuesta.ok) throw new Error(await leerError(respuesta, 'No se pudieron cargar los artículos.'))
    articulos.value = await respuesta.json() as GuiaArticulo[]
  } catch (error) {
    errorCarga.value = error instanceof Error ? error.message : 'No se pudieron cargar los artículos.'
  } finally {
    cargando.value = false
  }
}
const abrirArticulo = async (articulo: GuiaArticulo) => {
  articuloSeleccionado.value = articulo
  await nextTick()
  const elementoArticulo = articuloContenidoRef.value
  const areaDesplazable = elementoArticulo?.closest<HTMLElement>('.content-area')
  if (!elementoArticulo || !areaDesplazable) return
  const posicion = elementoArticulo.getBoundingClientRect().top - areaDesplazable.getBoundingClientRect().top
  areaDesplazable.scrollTo({
    top: areaDesplazable.scrollTop + posicion,
    behavior: 'smooth',
  })
}
const urlVideoIncrustado = (url: string) => obtenerUrlVideoIncrustado(url)
const urlVideoDirecto = (url: string) => obtenerUrlVideoDirecto(url)
const urlImagenSegura = (url: string | null | undefined) => {
  if (!url) return null
  try {
    const parsedUrl = new URL(url)
    return ['http:', 'https:'].includes(parsedUrl.protocol) ? parsedUrl.href : null
  } catch {
    return null
  }
}
const contenidoSeguro = (contenido: string) => {
  const contieneFormato = /<\/?(?:a|b|br|div|em|font|h[2-4]|i|li|ol|p|s|span|strong|table|tbody|td|th|thead|tr|u|ul)\b/i.test(contenido)
  const contenidoHtml = contieneFormato
    ? contenido
    : contenido
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\r?\n/g, '<br>')
  return DOMPurify.sanitize(contenidoHtml, {
    ALLOWED_TAGS: ['a', 'b', 'br', 'div', 'em', 'font', 'h2', 'h3', 'h4', 'i', 'li', 'ol', 'p', 's', 'span', 'strong', 'table', 'tbody', 'td', 'th', 'thead', 'tr', 'u', 'ul'],
    ALLOWED_ATTR: ['align', 'color', 'colspan', 'href', 'rel', 'rowspan', 'style', 'target'],
  })
}
const actualizarContenido = () => {
  formulario.contenido = contenidoEditor.value?.innerHTML ?? ''
}
const aplicarFormato = (comando: string, valor?: string) => {
  const editor = contenidoEditor.value
  if (!editor) return
  editor.focus()
  document.execCommand('styleWithCSS', false, 'true')
  document.execCommand(comando, false, valor ?? '')
  actualizarContenido()
}
const insertarTexto = (texto: string) => {
  contenidoEditor.value?.focus()
  document.execCommand('insertText', false, texto)
  actualizarContenido()
}
const insertarHtml = (html: string) => {
  const editor = contenidoEditor.value
  if (!editor) return
  editor.focus()
  document.execCommand('insertHTML', false, html)
  actualizarContenido()
}
const insertarPlantilla = () => {
  insertarHtml(`<div style="padding:20px;border:1px solid #cfe5e8;border-radius:16px;background:linear-gradient(135deg,#f0fbfb,#f7faff)">
  <p style="margin:0 0 16px;color:#31536d;font-size:16px;line-height:1.7">Escribe aquí una introducción breve para explicar el tema y a quién está dirigida esta guía.</p>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px">
    <div style="padding:16px;border:1px solid #dce8ef;border-radius:12px;background:#fff"><h3 style="margin:0 0 8px;color:#123a66">1. Primer paso</h3><p style="margin:0;color:#526a80;line-height:1.7">Explica qué debe hacer primero la persona usuaria.</p></div>
    <div style="padding:16px;border:1px solid #dce8ef;border-radius:12px;background:#fff"><h3 style="margin:0 0 8px;color:#123a66">2. Segundo paso</h3><p style="margin:0;color:#526a80;line-height:1.7">Describe la siguiente acción y qué resultado debe verificar.</p></div>
    <div style="padding:16px;border:1px solid #dce8ef;border-radius:12px;background:#fff"><h3 style="margin:0 0 8px;color:#123a66">3. Resultado</h3><p style="margin:0;color:#526a80;line-height:1.7">Indica cómo confirmar que el procedimiento terminó correctamente.</p></div>
  </div>
  <div style="margin-top:14px;padding:13px 15px;border:1px solid #d6e8dd;border-radius:10px;background:#f2faf4;color:#456653"><strong>Consejo:</strong> agrega aquí una recomendación útil relacionada con el tema.</div>
  <div style="margin-top:10px;padding:13px 15px;border:1px solid #f1dfb8;border-radius:10px;background:#fff8e8;color:#76531d"><strong>Importante:</strong> señala aquí una precaución o condición que se deba tener en cuenta.</div>
</div><p><br></p>`)
}
const insertarTabla = () => {
  const editor = contenidoEditor.value
  if (!editor) return
  mensajeFormato.value = ''
  editor.focus()
  const tabla = '<table><tbody><tr><th>Encabezado</th><th>Encabezado</th><th>Encabezado</th></tr><tr><td><br></td><td><br></td><td><br></td></tr><tr><td><br></td><td><br></td><td><br></td></tr></tbody></table><p><br></p>'
  document.execCommand('insertHTML', false, tabla)
  const primeraCelda = editor.querySelector('table:last-of-type tbody tr:nth-child(2) td')
  if (primeraCelda) colocarCursorEn(primeraCelda)
  actualizarContenido()
}
const celdaTablaSeleccionada = () => {
  const seleccion = window.getSelection()
  const nodo = seleccion?.anchorNode
  const elemento = nodo instanceof Element ? nodo : nodo?.parentElement
  const celda = elemento?.closest('td, th') ?? null
  if (!celda || !contenidoEditor.value?.contains(celda)) return null
  return celda
}
const colocarCursorEn = (elemento: Element) => {
  const rango = document.createRange()
  const seleccion = window.getSelection()
  rango.selectNodeContents(elemento)
  rango.collapse(true)
  seleccion?.removeAllRanges()
  seleccion?.addRange(rango)
}
const agregarFilaTabla = () => {
  const celda = celdaTablaSeleccionada()
  const tabla = celda?.closest('table')
  if (!celda || !tabla) {
    mensajeFormato.value = 'Coloca el cursor dentro de una tabla para agregar una fila.'
    return
  }
  const columnas = tabla.rows[0]?.cells.length ?? 1
  const fila = tabla.insertRow(-1)
  let primeraCelda: HTMLTableCellElement | null = null
  for (let indice = 0; indice < columnas; indice++) {
    const nuevaCelda = fila.insertCell()
    nuevaCelda.innerHTML = '<br>'
    primeraCelda ??= nuevaCelda
  }
  mensajeFormato.value = ''
  if (primeraCelda) colocarCursorEn(primeraCelda)
  actualizarContenido()
}
const agregarColumnaTabla = () => {
  const celda = celdaTablaSeleccionada()
  const tabla = celda?.closest('table')
  if (!celda || !tabla) {
    mensajeFormato.value = 'Coloca el cursor dentro de una tabla para agregar una columna.'
    return
  }
  let ultimaCelda: HTMLTableCellElement | null = null
  Array.from(tabla.rows).forEach((fila) => {
    const esEncabezado = fila.rowIndex === 0 && fila.cells[0]?.tagName === 'TH'
    const nuevaCelda = fila.insertCell(-1)
    if (esEncabezado) {
      const nuevaCabecera = document.createElement('th')
      nuevaCabecera.textContent = 'Encabezado'
      fila.replaceChild(nuevaCabecera, nuevaCelda)
      ultimaCelda = nuevaCabecera
    } else {
      nuevaCelda.innerHTML = '<br>'
      ultimaCelda = nuevaCelda
    }
  })
  mensajeFormato.value = ''
  if (ultimaCelda) colocarCursorEn(ultimaCelda)
  actualizarContenido()
}
const inicializarEditor = () => {
  if (contenidoEditor.value) contenidoEditor.value.innerHTML = contenidoSeguro(formulario.contenido)
}
const abrirEditor = (articulo?: GuiaArticulo) => {
  articuloEditandoId.value = articulo?.id ?? ''
  Object.assign(formulario, {
    titulo: articulo?.titulo ?? '',
    descripcion: articulo?.descripcion ?? '',
    contenido: articulo?.contenido ?? '',
    imagenUrl: articulo?.imagenUrl ?? '',
    videoUrl: articulo?.videoUrl ?? '',
  })
  mostrarColores.value = false
  mostrarEmojis.value = false
  mensajeFormato.value = ''
  mensajeEditor.value = ''
  errorEditor.value = false
  mostrarEditor.value = true
  void nextTick(inicializarEditor)
}
const cerrarEditor = () => {
  if (guardando.value) return
  mostrarEditor.value = false
}
const guardarArticulo = async () => {
  if (!esDesarrollador.value || guardando.value) return
  guardando.value = true
  mensajeEditor.value = ''
  errorEditor.value = false
  try {
    const editando = Boolean(articuloEditandoId.value)
    const respuesta = await fetch(
      editando ? `${api()}/${encodeURIComponent(articuloEditandoId.value)}` : api(),
      {
        method: editando ? 'PUT' : 'POST',
        headers: headers(),
        body: JSON.stringify(formulario),
      },
    )
    if (!respuesta.ok) throw new Error(await leerError(respuesta, 'No se pudo guardar el artículo.'))
    const idActualizado = editando ? articuloEditandoId.value : (await respuesta.json()).id
    await cargarArticulos()
    const articuloActualizado = articulos.value.find((articulo) => articulo.id === idActualizado)
    mostrarEditor.value = false
    if (articuloActualizado) await abrirArticulo(articuloActualizado)
  } catch (error) {
    mensajeEditor.value = error instanceof Error ? error.message : 'No se pudo guardar el artículo.'
    errorEditor.value = true
  } finally {
    guardando.value = false
  }
}
const eliminarArticulo = async (articulo: GuiaArticulo) => {
  if (!esDesarrollador.value || eliminandoId.value) return
  if (!window.confirm(`¿Eliminar el artículo "${articulo.titulo}"? Esta acción no se puede deshacer.`)) return
  eliminandoId.value = articulo.id
  try {
    const respuesta = await fetch(`${api()}/${encodeURIComponent(articulo.id)}`, {
      method: 'DELETE',
      headers: headers(),
    })
    if (!respuesta.ok) throw new Error(await leerError(respuesta, 'No se pudo eliminar el artículo.'))
    if (articuloSeleccionado.value?.id === articulo.id) articuloSeleccionado.value = null
    await cargarArticulos()
  } catch (error) {
    window.alert(error instanceof Error ? error.message : 'No se pudo eliminar el artículo.')
  } finally {
    eliminandoId.value = ''
  }
}
const comprobarModoDesarrollador = async () => {
  const respuesta = await fetch(`${getApiBaseUrl()}/sali/acceso`, { headers: headers() })
  if (!respuesta.ok) throw new Error(await leerError(respuesta, 'No se pudo validar el acceso de desarrollador.'))
  const acceso = await respuesta.json()
  esDesarrollador.value = Boolean(acceso.permitido)
}

onMounted(async () => {
  try {
    await comprobarModoDesarrollador()
  } catch (error) {
    console.error('No se pudo validar el modo desarrollador de la Guía:', error)
  }
  await cargarArticulos()
})
</script>

<style scoped>
.guia-page { display: grid; gap: 20px; max-width: 1080px; margin: 0 auto; padding: 8px 0 32px; color: #102a43; }
.guia-vistas { display: grid; gap: 14px; min-width: 0; }
.guia-indice { display: grid; gap: 18px; min-width: 0; }
.guia-hero { display: flex; align-items: center; gap: 17px; padding: 23px; border: 1px solid #dce8ef; border-radius: 19px; background: linear-gradient(120deg, #fff 0%, #f1f9fc 100%); box-shadow: 0 10px 26px rgba(18, 58, 102, .07); }
.guia-hero-icon { display: grid; flex: 0 0 auto; width: 54px; height: 54px; place-items: center; border-radius: 16px; background: #e3f5f4; color: #087e8b; font-size: 27px; }
.guia-hero-copy { min-width: 0; flex: 1; }
.guia-eyebrow { margin: 0 0 5px; color: #13858e; font-size: .72rem; font-weight: 900; letter-spacing: .12em; }
.guia-hero h1 { margin: 0; color: #123a66; font-size: clamp(1.4rem, 3vw, 1.9rem); font-weight: 900; }
.guia-hero-copy > p:last-child { margin: 7px 0 0; color: #62788d; line-height: 1.5; }
.guia-accion-principal, .guia-boton-secundario, .guia-boton-peligro { display: inline-flex; flex: 0 0 auto; align-items: center; justify-content: center; gap: 8px; min-height: 40px; padding: 9px 13px; border-radius: 11px; font: inherit; font-size: .84rem; font-weight: 800; cursor: pointer; }
.guia-accion-principal { border: 1px solid #087e8b; background: #087e8b; color: #fff; box-shadow: 0 5px 12px rgba(8, 126, 139, .16); }
.guia-accion-principal:hover:not(:disabled) { background: #066d78; }
.guia-boton-secundario { border: 1px solid #d7e3eb; background: #fff; color: #31536d; }
.guia-boton-peligro { border: 1px solid #f0d3d1; background: #fff; color: #b33e39; }
.guia-accion-principal:disabled, .guia-boton-secundario:disabled, .guia-boton-peligro:disabled { opacity: .55; cursor: not-allowed; }
.guia-busqueda { display: flex; align-items: center; gap: 12px; min-height: 52px; padding: 0 15px; border: 1px solid #d7e3eb; border-radius: 13px; background: #fff; box-shadow: 0 5px 16px rgba(18, 58, 102, .05); color: #678097; }
.guia-busqueda > ion-icon { flex: 0 0 auto; font-size: 21px; }
.guia-busqueda input { width: 100%; min-width: 0; border: 0; outline: 0; background: transparent; color: #102a43; font: inherit; }
.guia-busqueda input::placeholder { color: #8799a9; }
.guia-busqueda button { display: grid; flex: 0 0 auto; width: 31px; height: 31px; place-items: center; border: 0; border-radius: 8px; background: #eff5f8; color: #526a80; cursor: pointer; }
.guia-lista-seccion, .guia-articulo { min-width: 0; padding: 23px; border: 1px solid #dce6ed; border-radius: 17px; background: #fff; box-shadow: 0 8px 22px rgba(16, 42, 67, .06); }
.guia-seccion-cabecera h2 { margin: 0; color: #123a66; font-size: 1.15rem; font-weight: 900; }
.guia-seccion-cabecera p { margin: 5px 0 17px; color: #718499; font-size: .84rem; }
.guia-lista { display: grid; gap: 10px; }
.guia-lista-articulo { overflow: hidden; border: 1px solid #e0e9ef; border-radius: 13px; background: #fff; transition: border-color .15s ease, box-shadow .15s ease; }
.guia-lista-articulo:hover { border-color: #b5d6dc; box-shadow: 0 5px 15px rgba(18, 58, 102, .06); }
.guia-lista-abrir { display: flex; width: 100%; align-items: center; gap: 13px; padding: 16px; border: 0; background: transparent; color: inherit; text-align: left; cursor: pointer; }
.guia-articulo-icono { display: grid; flex: 0 0 auto; width: 40px; height: 40px; place-items: center; border-radius: 12px; background: #edf6f8; color: #16808a; font-size: 20px; }
.guia-articulo-resumen { display: grid; flex: 1; gap: 5px; min-width: 0; }
.guia-articulo-resumen strong { color: #123a66; font-size: .96rem; font-weight: 850; }
.guia-articulo-resumen > span { overflow: hidden; color: #718499; font-size: .84rem; line-height: 1.45; text-overflow: ellipsis; }
.guia-tiene-video { display: grid; flex: 0 0 auto; width: 31px; height: 31px; place-items: center; border-radius: 9px; background: #fff3df; color: #9b5d18; font-size: 17px; }
.guia-flecha { flex: 0 0 auto; color: #8296a8; }
.guia-lista-admin { display: flex; justify-content: flex-end; gap: 7px; padding: 0 14px 12px; }
.guia-lista-admin button { display: inline-flex; align-items: center; gap: 5px; padding: 6px 9px; border: 1px solid #dfe8ee; border-radius: 8px; background: #fff; color: #31536d; font-size: .75rem; font-weight: 750; cursor: pointer; }
.guia-lista-admin button.eliminar { color: #b33e39; border-color: #f0d3d1; }
.guia-lista-admin button:disabled { opacity: .5; cursor: not-allowed; }
.guia-estado, .guia-vacio { display: flex; min-height: 190px; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 23px; border: 1px dashed #d5e2e9; border-radius: 14px; background: #f9fbfc; color: #718499; text-align: center; }
.guia-estado ion-icon, .guia-vacio > ion-icon { color: #83a1b1; font-size: 28px; }
.guia-error { color: #a23939; }
.guia-error ion-icon { color: #b33e39; }
.guia-vacio strong { color: #234761; font-size: .95rem; }
.guia-vacio p { max-width: 360px; margin: 0; font-size: .84rem; line-height: 1.5; }
.guia-detalle { display: grid; gap: 14px; }
.guia-detalle-acciones, .guia-admin-acciones { display: flex; align-items: center; justify-content: space-between; gap: 9px; }
.guia-admin-acciones { justify-content: flex-end; }
.guia-articulo h2 { margin: 0; color: #123a66; font-size: clamp(1.45rem, 3vw, 2rem); font-weight: 900; }
.guia-articulo-descripcion { margin: 8px 0 0; color: #61798d; font-size: 1rem; line-height: 1.55; }
.guia-articulo-imagen { display: block; width: min(100%, 820px); max-height: 520px; margin: 22px auto 0; border: 1px solid #dce8ef; border-radius: 16px; background: #f5fafb; object-fit: contain; box-shadow: 0 10px 26px rgba(18, 58, 102, .1); }
.guia-editor-imagen-preview { display: block; width: min(100%, 520px); max-height: 280px; border: 1px solid #dce8ef; border-radius: 12px; background: #f5fafb; object-fit: contain; }
.guia-articulo-contenido { margin-top: 24px; color: #304b62; font-size: .98rem; line-height: 1.8; overflow-wrap: anywhere; }
.guia-video { display: grid; gap: 13px; margin-top: 28px; padding-top: 22px; border-top: 1px solid #e3ebf0; }
.guia-video h3 { display: flex; align-items: center; gap: 9px; margin: 0; color: #123a66; font-size: 1.05rem; }
.guia-video h3 ion-icon { color: #16808a; font-size: 21px; }
.guia-video-marco { overflow: hidden; width: min(100%, 820px); aspect-ratio: 16 / 9; border-radius: 13px; background: #102a43; }
.guia-video-marco.drive { aspect-ratio: 4 / 3; }
.guia-video-marco iframe, .guia-video-directo { display: block; width: min(100%, 820px); aspect-ratio: 16 / 9; border: 0; border-radius: 13px; background: #102a43; }
.guia-video-marco iframe { width: 100%; height: 100%; }
.guia-enlace-video { display: inline-flex; width: fit-content; align-items: center; gap: 8px; color: #087e8b; font-weight: 800; }
.guia-editor-modal { --width: min(680px, calc(100vw - 28px)); --height: auto; --max-height: 92vh; --border-radius: 18px; }
.guia-editor { display: grid; gap: 16px; max-height: 90vh; overflow-y: auto; padding: 24px; background: #fff; color: #102a43; }
.guia-editor-cabecera { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; }
.guia-editor-cabecera h2 { margin: 0; color: #123a66; font-size: 1.35rem; font-weight: 900; }
.guia-cerrar { display: grid; flex: 0 0 auto; width: 36px; height: 36px; place-items: center; border: 1px solid #dce6ed; border-radius: 10px; background: #fff; color: #526a80; font-size: 19px; cursor: pointer; }
.guia-campo { display: grid; gap: 7px; color: #31536d; font-size: .84rem; font-weight: 800; }
.guia-campo input, .guia-campo textarea { width: 100%; padding: 11px 12px; border: 1px solid #d7e3eb; border-radius: 10px; outline: none; background: #fff; color: #102a43; font: inherit; font-size: .9rem; font-weight: 500; resize: vertical; }
.guia-campo input:focus, .guia-campo textarea:focus { border-color: #16808a; box-shadow: 0 0 0 3px rgba(22, 128, 138, .1); }
.guia-editor-toolbar { position: relative; display: flex; flex-wrap: wrap; align-items: center; gap: 4px; padding: 7px; border: 1px solid #d7e3eb; border-bottom: 0; border-radius: 10px 10px 0 0; background: #f6fafc; }
.guia-editor-toolbar > button, .guia-color-control > button, .guia-emoji-control > button { display: grid; width: 34px; height: 32px; place-items: center; border: 1px solid transparent; border-radius: 7px; background: transparent; color: #31536d; font: inherit; font-size: 17px; cursor: pointer; }
.guia-editor-toolbar > button:hover, .guia-color-control > button:hover, .guia-emoji-control > button:hover { border-color: #d7e3eb; background: #fff; }
.guia-editor-toolbar > .guia-toolbar-etiquetado { display: inline-flex; width: auto; align-items: center; gap: 4px; padding: 0 9px; font-size: 12px; font-weight: 800; white-space: nowrap; }
.guia-toolbar-separador { width: 1px; height: 22px; margin: 0 3px; background: #d7e3eb; }
.guia-color-control, .guia-emoji-control { position: relative; }
.guia-color-icono { font-size: 17px; font-weight: 900; }
.guia-color-subrayado { position: absolute; right: 8px; bottom: 5px; left: 8px; height: 3px; border-radius: 2px; background: linear-gradient(90deg, #c62828, #ef6c00, #2e7d32, #1565c0, #7b1fa2); }
.guia-color-opciones, .guia-emoji-opciones { position: absolute; z-index: 2; top: calc(100% + 6px); left: 0; display: grid; padding: 8px; border: 1px solid #d7e3eb; border-radius: 10px; background: #fff; box-shadow: 0 8px 22px rgba(16, 42, 67, .16); }
.guia-color-opciones { grid-template-columns: repeat(3, 30px); gap: 7px; }
.guia-color-opciones button { width: 26px; height: 26px; border: 2px solid #fff; border-radius: 50%; background: var(--color-muestra); box-shadow: 0 0 0 1px #cbd8e0; cursor: pointer; }
.guia-color-opciones button:hover { transform: scale(1.12); }
.guia-emoji-opciones { grid-template-columns: repeat(5, 34px); gap: 3px; }
.guia-emoji-opciones button { display: grid; width: 32px; height: 32px; place-items: center; border: 0; border-radius: 7px; background: transparent; font-size: 20px; cursor: pointer; }
.guia-emoji-opciones button:hover { background: #eff5f8; }
.guia-editor-texto { min-height: 210px; max-height: 42vh; overflow: auto; padding: 12px; border: 1px solid #d7e3eb; border-radius: 0 0 10px 10px; outline: none; background: #fff; color: #102a43; font-size: .92rem; font-weight: 500; line-height: 1.65; white-space: pre-wrap; overflow-wrap: anywhere; }
.guia-editor-texto:focus { border-color: #16808a; box-shadow: 0 0 0 3px rgba(22, 128, 138, .1); }
.guia-editor-texto:empty::before { color: #8799a9; content: attr(data-placeholder); pointer-events: none; }
:deep(.guia-editor-texto table), :deep(.guia-articulo-contenido table) { width: 100%; margin: 12px 0; border: 1px solid #9bc6ce; border-collapse: collapse; table-layout: auto; }
:deep(.guia-editor-texto th), :deep(.guia-editor-texto td), :deep(.guia-articulo-contenido th), :deep(.guia-articulo-contenido td) { min-width: 70px; padding: 9px 10px; border: 1px solid #9bc6ce; text-align: left; vertical-align: top; }
:deep(.guia-editor-texto th), :deep(.guia-articulo-contenido th) { background: #e4f3f4; color: #123a66; font-weight: 800; }
:deep(.guia-editor-texto td), :deep(.guia-articulo-contenido td) { background: #fff; }
:deep(.guia-editor-texto tr:nth-child(even) td), :deep(.guia-articulo-contenido tr:nth-child(even) td) { background: #f5fafb; }
:deep(.guia-editor-texto tr:hover td), :deep(.guia-articulo-contenido tr:hover td) { background: #eaf6f6; }
.guia-editor-toolbar > button[aria-label^="Agregar"] { width: auto; padding: 0 8px; font-size: 12px; font-weight: 800; }
.guia-mensaje-formato { color: #b06a16 !important; }
.guia-articulo-contenido p { margin: 0 0 12px; }
.guia-articulo-contenido ul, .guia-articulo-contenido ol { padding-left: 24px; }
.guia-campo small { color: #718499; font-size: .75rem; font-weight: 500; }
.guia-mensaje { margin: 0; color: #16734b; font-size: .86rem; }
.guia-mensaje.error { color: #b33e39; }
.guia-editor-pie { display: flex; justify-content: flex-end; gap: 9px; padding-top: 4px; }
@media (max-width: 700px) {
  .guia-page { gap: 14px; }
  .guia-hero { align-items: flex-start; flex-wrap: wrap; gap: 12px; padding: 17px; }
  .guia-hero-icon { width: 44px; height: 44px; border-radius: 13px; font-size: 22px; }
  .guia-hero-copy { flex-basis: calc(100% - 58px); }
  .guia-hero-copy > p:last-child { font-size: .87rem; }
  .guia-hero > .guia-accion-principal { width: 100%; }
  .guia-lista-seccion, .guia-articulo { padding: 17px; }
  .guia-lista-abrir { gap: 10px; padding: 13px; }
  .guia-articulo-icono { width: 35px; height: 35px; }
  .guia-tiene-video { display: none; }
  .guia-detalle-acciones { align-items: flex-start; flex-direction: column; }
  .guia-admin-acciones { width: 100%; justify-content: flex-start; }
  .guia-editor { padding: 18px; }
}
</style>
