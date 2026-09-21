<template>
  <button
    v-if="!lateral"
    class="asistente-sali"
    :class="{ 'modo-voz-activo': conversacionPorVoz, hablando: reproduciendoVoz, escuchando }"
    type="button"
    :disabled="asistenteBloqueado"
    :title="asistenteBloqueado ? 'Activa tu asistencia para usar Burbujita' : (reproduciendoVoz ? 'Interrumpir a Burbujita' : 'Abrir chat de Burbujita')"
    :aria-label="asistenteBloqueado ? 'Burbujita está deshabilitada hasta activar tu asistencia' : (reproduciendoVoz ? 'Interrumpir a Burbujita' : (conversacionPorVoz ? 'Detener escucha de Burbujita' : 'Activar Burbujita por voz'))"
    @click="manejarBotonBurbujita"
  >
    <span class="sali-logo sali-logo-mini" aria-hidden="true">
      <span class="sali-logo-tambor"></span><span class="sali-logo-sonrisa"></span>
      <span class="burbuja-boton burbuja-boton-izq"></span>
      <span class="burbuja-boton burbuja-boton-der"></span>
    </span>
  </button>
  <div v-if="abierto" class="sali-capa" :class="{ lateral, izquierda: ladoLateral === 'izquierda' }" :style="estiloViewportChat">
    <button v-if="!lateral" class="sali-respaldo" type="button" aria-label="Cerrar ayuda" @click="cerrar"></button>
    <section class="sali-ventana" role="dialog" :aria-modal="lateral ? undefined : 'true'" aria-label="Asistente Burbujita">
    <div class="sali-contenido">
      <div class="sali-fondo-decor" aria-hidden="true">
        <!-- Burbujas que nacen abajo y suben hasta el tope -->
        <span
          v-for="b in burbujasSubiendo"
          :key="'sube-' + b.id"
          class="fb-dinamica"
          :style="{
            left: b.left + '%',
            width: b.size + 'px',
            height: b.size + 'px',
            animationDuration: b.duration + 's',
          }"
          @animationend="burbujaLlegoArriba(b.id)"
        ></span>

        <!-- Burbujas acumuladas pegadas al tope; cuando llegan al límite, explotan -->
        <div class="burbujas-tope" :class="{ explota: explotando }">
          <span
            v-for="a in burbujasAcumuladas"
            :key="'acum-' + a.id"
            class="fb-acumulada"
            :style="{ left: a.left + '%', width: a.size + 'px', height: a.size + 'px' }"
          ></span>
        </div>

        <span class="fondo-espuma espuma-izq"></span>
        <span class="fondo-espuma espuma-der"></span>
      </div>

      <div class="sali-header">
        <div class="sali-header-left">
          <div class="sali-header-icono" aria-label="Burbujita, asistente de lavandería">
            <span class="sali-logo" aria-hidden="true">
              <span class="sali-logo-burbuja b-uno"></span>
              <span class="sali-logo-burbuja b-dos"></span>
              <span class="sali-logo-panel"><i></i><b></b></span>
              <span class="sali-logo-tambor"></span>
              <span class="sali-logo-ojo ojo-a"></span><span class="sali-logo-ojo ojo-b"></span>
              <span class="sali-logo-sonrisa"></span>
            </span>
          </div>
          <div>
            <p class="sali-titulo">Hola soy Burbujita</p>
            <p class="sali-subtitulo">Tu guia dentro de la app</p>
          </div>
        </div>
        <div class="sali-acciones-header">
          <button
            class="sali-accion-header"
            :class="{ activa: lateral && ladoLateral === 'izquierda' }"
            type="button"
            title="Colocar chat a la izquierda"
            aria-label="Colocar chat a la izquierda"
            @click="colocarEnLateral('izquierda')"
          >
            <ion-icon :icon="arrowBackOutline" />
          </button>
          <button
            class="sali-accion-header"
            :class="{ activa: lateral && ladoLateral === 'derecha' }"
            type="button"
            title="Colocar chat a la derecha"
            aria-label="Colocar chat a la derecha"
            @click="colocarEnLateral('derecha')"
          >
            <ion-icon :icon="arrowForwardOutline" />
          </button>
          <button
            class="sali-accion-header"
            type="button"
            :title="lateral ? 'Restaurar chat al centro' : 'Colocar chat al lateral'"
            :aria-label="lateral ? 'Restaurar chat al centro' : 'Colocar chat al lateral'"
            @click="alternarLateral"
          >
            <ion-icon :icon="lateral ? contractOutline : expandOutline" />
          </button>
          <button class="sali-cerrar" type="button" aria-label="Cerrar ayuda" @click="cerrar">
            <ion-icon :icon="closeOutline" />
          </button>
        </div>
      </div>

      <div class="sali-aviso">Burbujita solo responde consultas; no realiza cambios en tus datos.</div>
      <div ref="contenedorMensajes" class="sali-mensajes" aria-live="polite">
        <div v-if="mensajes.length === 0" class="sali-bienvenida">
          ¡Hola! Soy Burbujita, tu asistente en Lavandería Salinas. ¿En qué te ayudo?
        </div>
        <div
          v-for="(mensaje, indice) in mensajes"
          :key="indice"
          class="sali-mensaje"
          :class="mensaje.rol"
        >
          <div v-html="renderizarMensaje(mensaje)"></div>
          <button
            v-if="mensaje.rol === 'assistant' && sintesisDisponible"
            class="sali-btn-leer"
            :class="{ activo: indice === mensajeVozActivo }"
            type="button"
            :title="indice === mensajeVozActivo ? 'Detener lectura' : 'Escuchar respuesta'"
            :aria-label="indice === mensajeVozActivo ? 'Detener lectura' : 'Escuchar respuesta'"
            @click="hablarTexto(mensaje.texto, indice)"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
              <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/>
              <path d="M16.5 8.5a5 5 0 010 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              <path d="M19 6a8.5 8.5 0 010 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" opacity="0.55"/>
            </svg>
          </button>
        </div>
        <div v-if="enviando" class="sali-cargando" aria-live="polite">
          <div class="lavadora-cargando" aria-hidden="true">
            <span class="lavadora-burbuja burbuja-uno"></span>
            <span class="lavadora-burbuja burbuja-dos"></span>
            <div class="lavadora-panel">
              <span class="lavadora-luz"></span>
              <span class="lavadora-ranura"></span>
            </div>
            <div class="lavadora-tambor"><span class="lavadora-agua">◔</span></div>
            <span class="lavadora-ojo ojo-uno"></span>
            <span class="lavadora-ojo ojo-dos"></span>
            <span class="lavadora-sonrisa"></span>
          </div>
          <div>
            <strong>{{ fraseCarga }}</strong>
            <span>Un momento, estoy revisando la información.</span>
          </div>
        </div>
        <div v-if="cargandoModeloVoz" class="sali-cargando sali-cargando-voz" aria-live="polite">
          <div class="lavadora-cargando" aria-hidden="true">
            <span class="lavadora-burbuja burbuja-uno"></span>
            <span class="lavadora-burbuja burbuja-dos"></span>
            <div class="lavadora-panel">
              <span class="lavadora-luz"></span>
              <span class="lavadora-ranura"></span>
            </div>
            <div class="lavadora-tambor"><span class="lavadora-agua">◔</span></div>
            <span class="lavadora-ojo ojo-uno"></span>
            <span class="lavadora-ojo ojo-dos"></span>
            <span class="lavadora-sonrisa"></span>
          </div>
          <div>
            <strong>Preparando el micrófono por primera vez...</strong>
            <span>Estoy descargando el reconocimiento de voz, solo pasa una vez.</span>
          </div>
        </div>
        <div v-else-if="transcribiendo" class="sali-cargando sali-cargando-voz" aria-live="polite">
          <div class="lavadora-cargando" aria-hidden="true">
            <span class="lavadora-burbuja burbuja-uno"></span>
            <span class="lavadora-burbuja burbuja-dos"></span>
            <div class="lavadora-panel">
              <span class="lavadora-luz"></span>
              <span class="lavadora-ranura"></span>
            </div>
            <div class="lavadora-tambor"><span class="lavadora-agua">◔</span></div>
            <span class="lavadora-ojo ojo-uno"></span>
            <span class="lavadora-ojo ojo-dos"></span>
            <span class="lavadora-sonrisa"></span>
          </div>
          <div>
            <strong>Transcribiendo tu audio...</strong>
            <span>Un momento, ya casi está listo.</span>
          </div>
        </div>
      </div>
      <form class="sali-form" @submit.prevent="enviar(false)">
        <textarea
          ref="entradaTexto"
          v-model="pregunta"
          class="sali-input"
          :disabled="enviando"
          maxlength="2000"
          placeholder="Pregunta lo que quieras"
          @keydown.enter.exact.prevent="enviar(false)"
        ></textarea>
        <button
          v-if="microfonoDisponible"
          class="sali-mic"
          :class="{ activo: escuchando || reproduciendoVoz }"
          type="button"
          :disabled="transcribiendo || cargandoModeloVoz"
          :title="reproduciendoVoz ? 'Interrumpir respuesta y hablar' : (conversacionPorVoz ? 'Finalizar conversación por voz' : 'Hablar')"
          :aria-label="reproduciendoVoz ? 'Interrumpir respuesta y hablar' : (conversacionPorVoz ? 'Finalizar conversación por voz' : 'Hablar con el micrófono')"
          @click="controlarMicrofono"
        >
          <ion-icon :icon="reproduciendoVoz ? pauseOutline : (escuchando ? micOffOutline : micOutline)" />
        </button>
        <button class="sali-enviar" type="submit" :disabled="enviando || !pregunta.trim()" aria-label="Enviar pregunta">
          <ion-icon :icon="sendOutline" />
        </button>
      </form>
    </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { 
  arrowBackOutline, arrowForwardOutline, closeOutline, contractOutline, expandOutline, micOffOutline, micOutline, pauseOutline,
  sendOutline
} from 'ionicons/icons'
import MarkdownIt from 'markdown-it'
import DOMPurify from 'dompurify'
import { useSesion } from '@/composables/useSesion'
import { useAccesoOperativo } from '@/composables/useAccesoOperativo'
import { getApiBaseUrl } from '@/composables/useApiConfig'
import { useSaliAiConfig } from '@/composables/useSaliAiConfig'
import { obtenerTranscriptor, decodificarAudioParaWhisper } from '@/composables/useTranscripcionLocal'

type Mensaje = { rol: 'user' | 'assistant', texto: string }

const { usuarioActual, rol, esAdministrador } = useSesion()
const { funcionesBloqueadas } = useAccesoOperativo()
const asistenteBloqueado = computed(() => !esAdministrador.value && funcionesBloqueadas.value)
const { vozSeleccionada } = useSaliAiConfig()
const route = useRoute()
const abierto = ref(false)
const lateral = ref(false)
const ladoLateral = ref<'izquierda' | 'derecha'>('derecha')
const pregunta = ref('')
const enviando = ref(false)
const mensajes = ref<Mensaje[]>([])
const contenedorMensajes = ref<HTMLElement | null>(null)
const entradaTexto = ref<HTMLTextAreaElement | null>(null)
const altoViewportChat = ref(0)
const desplazamientoViewportChat = ref(0)
const estiloViewportChat = computed(() => ({
  '--sali-alto-visible': `${altoViewportChat.value || window.innerHeight}px`,
  '--sali-desplazamiento-superior': `${desplazamientoViewportChat.value}px`,
}))
const nombreUsuario = computed(() => usuarioActual.value?.nombre || 'Usuario')
const nombresVistas: Record<string, string> = {
  '/tabs/home': 'Vender',
  '/tabs/principal': 'Principal',
  '/tabs/ordenes': 'Órdenes',
  '/tabs/calendario': 'Calendario de entregas',
  '/tabs/clientes': 'Clientes',
  '/tabs/reportes': 'Caja y Reportes',
  '/tabs/configuracion': 'Configuración',
  '/tabs/equipo': 'Equipo',
  '/tabs/inventario': 'Inventario',
  '/tabs/productos': 'Catálogo',
  '/tabs/promociones': 'Promociones',
  '/tabs/horarios': 'Horarios',
  '/tabs/tareas': 'Tareas',
  '/tabs/depositos': 'Depósitos',
  '/tabs/facturas': 'Facturas',
}
const vistaActual = computed(() => ({
  ruta: route.path,
  nombre: nombresVistas[route.path] || 'una sección de la aplicación',
}))
const frasesCarga = [
  'Buscando entre las prendas...',
  'Dando una vuelta a la información...',
  'Enjuagando los datos para darte una respuesta clara...',
  'Consultando el estado del negocio...',
  'Organizando los detalles de la lavandería...',
  'Buscando la mejor respuesta para ti...',
  'Sacando los datos del tambor...',
  'Doblando la información importante...',
  'Verificando cada detalle...',
  'Casi listo, sigo revisando...',
]
const fraseCarga = ref(frasesCarga[0])
let temporizadorFraseCarga: ReturnType<typeof setInterval> | null = null

// Efecto breve de tres burbujas al abrir el asistente. Se genera con Web Audio
// para no depender de un archivo externo y solo se ejecuta tras un toque del usuario.
let contextoSonidoBurbujas: AudioContext | null = null
const reproducirBurbujas = () => {
  if (typeof window === 'undefined') return

  try {
    contextoSonidoBurbujas ??= new AudioContext()
    const contexto = contextoSonidoBurbujas
    void contexto.resume()

    const inicio = contexto.currentTime
    ;[0, 0.13, 0.26].forEach((retraso, indice) => {
      const oscilador = contexto.createOscillator()
      const volumen = contexto.createGain()
      const momento = inicio + retraso
      const duracion = 0.1

      oscilador.type = 'sine'
      oscilador.frequency.setValueAtTime(580 + indice * 65, momento)
      oscilador.frequency.exponentialRampToValueAtTime(165 + indice * 20, momento + duracion)
      volumen.gain.setValueAtTime(0.0001, momento)
      volumen.gain.exponentialRampToValueAtTime(0.1, momento + 0.012)
      volumen.gain.exponentialRampToValueAtTime(0.0001, momento + duracion)

      oscilador.connect(volumen)
      volumen.connect(contexto.destination)
      oscilador.start(momento)
      oscilador.stop(momento + duracion)
    })
  } catch {
    // Algunos entornos no permiten Web Audio; abrir el chat sigue funcionando.
  }
}

// --- Síntesis de Voz (Text-to-Speech) neuronal vía backend (Edge TTS) ---
const sintesisDisponible = ref(false)
const reproduciendoVoz = ref(false)
const mensajeVozActivo = ref<number | null>(null)
const reproductorAudio = ref<HTMLAudioElement | null>(null)
let solicitudVoz = 0
let cancelarAudioActivo: (() => void) | null = null
let temporizadorReinicioEscucha: ReturnType<typeof setTimeout> | null = null

const reanudarTrasRespuesta = () => {
  if (temporizadorReinicioEscucha) clearTimeout(temporizadorReinicioEscucha)
  // Evita que el micrófono capture el final de la voz de Burbujita.
  temporizadorReinicioEscucha = setTimeout(() => {
    temporizadorReinicioEscucha = null
    reanudarConversacionPorVoz()
  }, 650)
}

// Permanece activa desde el primer toque del micrófono hasta que el usuario lo toca otra vez.
const conversacionPorVoz = ref(false)

const obtenerVozFemeninaEspanol = (): SpeechSynthesisVoice | null => {
  if (!('speechSynthesis' in window)) return null
  const voces = window.speechSynthesis.getVoices()
  const vocesEspanol = voces.filter((v) => v.lang.startsWith('es'))

  // Palabras clave asociadas habitualmente a voces femeninas en navegadores / SO
  const palabrasClaveMujer = ['female', 'femenina', 'sabina', 'monica', 'paulina', 'helena', 'victoria', 'zira', 'lucia', 'maria', 'mia']
  
  const vozFemenina = vocesEspanol.find((v) => 
    palabrasClaveMujer.some((nombre) => v.name.toLowerCase().includes(nombre))
  )

  // Retorna la voz femenina si existe, de lo contrario cae en la primera voz en español
  return vozFemenina || vocesEspanol[0] || null
}

// Reemplaza cualquier tabla en formato Markdown por una frase genérica: en modo voz
// nunca se leen datos tabulares (montos, gastos, listados), solo se avisa que la
// información ya está disponible para leer en el chat.
const limpiarMarkdownParaVoz = (texto: string): string => {
  const textoSinTablas = texto.replace(/(^\|.*\|[ \t]*$\n?){2,}/gm, 'Aquí está tu información. ')
  return textoSinTablas
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[*_~#>-]/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[\p{Extended_Pictographic}\p{Regional_Indicator}\uFE0F\u200D]/gu, '')
    .replace(/\n+/g, '. ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

// Respaldo nativo del navegador, solo se usa si falla el servidor de voz
const hablarTextoNativo = (texto: string) => {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()

  const elocucion = new SpeechSynthesisUtterance(texto)
  elocucion.lang = 'es-419'
  elocucion.rate = 1.2
  elocucion.pitch = 1.1

  const vozFemenina = obtenerVozFemeninaEspanol()
  if (vozFemenina) elocucion.voice = vozFemenina

  elocucion.onstart = () => { reproduciendoVoz.value = true }
  elocucion.onend = () => {
    reproduciendoVoz.value = false
    mensajeVozActivo.value = null
    reanudarTrasRespuesta()
  }
  elocucion.onerror = () => {
    reproduciendoVoz.value = false
    mensajeVozActivo.value = null
    reanudarTrasRespuesta()
  }

  window.speechSynthesis.speak(elocucion)
}

// `alFinalizar`, si se pasa, reemplaza el comportamiento por defecto de reanudar
// la conversación por voz al terminar (se usa, por ejemplo, para cerrar el chat
// después de una despedida).
const hablarTexto = async (texto: string, indiceMensaje?: number, alFinalizar?: () => void) => {
  if (indiceMensaje !== undefined && mensajeVozActivo.value === indiceMensaje && reproduciendoVoz.value) {
    detenerVoz()
    return
  }

  detenerVoz()
  const solicitudActual = ++solicitudVoz
  const textoLimpio = limpiarMarkdownParaVoz(texto)
  if (!textoLimpio) {
    alFinalizar?.()
    return
  }

  reproduciendoVoz.value = true
  mensajeVozActivo.value = indiceMensaje ?? null
  try {
    const respuesta = await fetch(`${getApiBaseUrl()}/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto: textoLimpio, voz: vozSeleccionada.value })
    })
    if (!respuesta.ok) throw new Error('tts')

    const blob = await respuesta.blob()
    if (solicitudVoz !== solicitudActual) return
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    audio.playbackRate = 1.18
    reproductorAudio.value = audio

    const finalizarAudio = () => {
      if (solicitudVoz !== solicitudActual) return
      reproduciendoVoz.value = false
      mensajeVozActivo.value = null
      URL.revokeObjectURL(url)
      if (alFinalizar) {
        alFinalizar()
      } else {
        reanudarTrasRespuesta()
      }
    }
    audio.onended = finalizarAudio
    audio.onerror = finalizarAudio

    await audio.play()
  } catch {
    if (solicitudVoz !== solicitudActual) return
    reproduciendoVoz.value = false
    mensajeVozActivo.value = null
    if (alFinalizar) alFinalizar()
    else reanudarTrasRespuesta()
    // No se usa la voz nativa como respaldo: cada dispositivo ofrece voces
    // distintas y podría reemplazar la voz que el usuario eligió.
  }
}

const dividirRespuestaParaVoz = (texto: string): string[] => {
  const oraciones = texto.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g) ?? [texto]
  return oraciones.flatMap((oracion) => {
    const limpia = oracion.trim()
    if (limpia.length <= 220) return limpia ? [limpia] : []

    const partes: string[] = []
    let parte = ''
    limpia.split(/\s+/).forEach((palabra) => {
      if (parte && `${parte} ${palabra}`.length > 220) {
        partes.push(parte)
        parte = palabra
      } else {
        parte = `${parte}${parte ? ' ' : ''}${palabra}`
      }
    })
    if (parte) partes.push(parte)
    return partes
  })
}

// Reproduce un fragmento mientras lo revela. Esto evita mostrar una respuesta
// completa antes de que Burbujita haya terminado de decirla.
const reproducirFragmentoProgresivo = async (
  fragmento: string,
  indiceMensaje: number,
  solicitudActual: number,
): Promise<boolean> => {
  const textoVoz = limpiarMarkdownParaVoz(fragmento)
  if (!textoVoz || solicitudVoz !== solicitudActual) return false

  try {
    const respuesta = await fetch(`${getApiBaseUrl()}/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto: textoVoz, voz: vozSeleccionada.value }),
    })
    if (!respuesta.ok || solicitudVoz !== solicitudActual) return false

    const url = URL.createObjectURL(await respuesta.blob())
    const audio = new Audio(url)
    audio.playbackRate = 1.18
    reproductorAudio.value = audio

    return await new Promise<boolean>((resolver) => {
      let terminado = false
      let posicion = 0
      let temporizadorTexto: ReturnType<typeof setInterval> | null = null

      const anexar = (cantidad: number) => {
        const mensaje = mensajes.value[indiceMensaje]
        if (!mensaje || posicion >= fragmento.length) return
        mensaje.texto += fragmento.slice(posicion, posicion + cantidad)
        posicion += cantidad
        void desplazarAlFinal()
      }

      const finalizar = (completo: boolean) => {
        if (terminado) return
        terminado = true
        if (temporizadorTexto) clearInterval(temporizadorTexto)
        if (completo) anexar(fragmento.length)
        if (reproductorAudio.value === audio) reproductorAudio.value = null
        if (cancelarAudioActivo) cancelarAudioActivo = null
        URL.revokeObjectURL(url)
        resolver(completo && solicitudVoz === solicitudActual)
      }

      cancelarAudioActivo = () => finalizar(false)
      audio.onended = () => finalizar(true)
      audio.onerror = () => finalizar(false)
      audio.onplay = () => {
        // Ritmo visual cercano al habla; al terminar el audio se completa cualquier letra pendiente.
        temporizadorTexto = setInterval(() => anexar(2), 35)
      }
      void audio.play().catch(() => finalizar(false))
    })
  } catch {
    return false
  }
}

const hablarRespuestaProgresivamente = async (texto: string, indiceMensaje: number) => {
  detenerVoz()
  const solicitudActual = ++solicitudVoz
  reproduciendoVoz.value = true
  mensajeVozActivo.value = indiceMensaje

  for (const fragmento of dividirRespuestaParaVoz(texto)) {
    const pudoContinuar = await reproducirFragmentoProgresivo(fragmento, indiceMensaje, solicitudActual)
    if (!pudoContinuar) return
  }

  if (solicitudVoz === solicitudActual) {
    reproduciendoVoz.value = false
    mensajeVozActivo.value = null
    reanudarTrasRespuesta()
  }
}

const detenerVoz = () => {
  solicitudVoz += 1
  cancelarAudioActivo?.()
  reproductorAudio.value?.pause()
  reproductorAudio.value = null
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
  reproduciendoVoz.value = false
  mensajeVozActivo.value = null
}

// --- Render de mensajes con soporte de Markdown ---
const md = new MarkdownIt({
  breaks: true,
  linkify: true,
})

// Algunas respuestas de la IA traen tablas con la fila separadora (|---|---|)
// ausente, incompleta o mal formada. Si eso ocurre, el navegador no la reconoce
// como una tabla real y se pierden las líneas de columnas/filas. Esta función
// detecta bloques de líneas con "|" y, si la segunda línea no es un separador
// válido para el número de columnas detectado, la inserta o corrige.
const repararTablasMarkdown = (texto: string): string => {
  const lineas = texto.split('\n')
  const resultado: string[] = []
  let i = 0

  const contarColumnas = (fila: string) =>
    fila.split('|').map((celda) => celda.trim()).filter((celda) => celda !== '').length

  while (i < lineas.length) {
    const linea = lineas[i]
    if (linea.includes('|') && lineas[i + 1]?.includes('|')) {
      const bloque: string[] = [linea]
      let j = i + 1
      while (j < lineas.length && lineas[j].includes('|')) {
        bloque.push(lineas[j])
        j += 1
      }
      if (bloque.length >= 2) {
        const columnas = Math.max(...bloque.map(contarColumnas))
        const filaSeparador = bloque[1]
        const separadorValido =
          /^\s*\|?(\s*:?-{1,}:?\s*\|)+\s*:?-{0,}:?\s*\|?\s*$/.test(filaSeparador) &&
          contarColumnas(filaSeparador) >= columnas - 1
        if (!separadorValido && columnas > 0) {
          const nuevoSeparador = `|${Array(columnas).fill('---').join('|')}|`
          bloque.splice(1, 0, nuevoSeparador)
        }
        if (resultado.length && resultado[resultado.length - 1].trim() !== '') resultado.push('')
        resultado.push(...bloque)
        resultado.push('')
        i = j
        continue
      }
    }
    resultado.push(linea)
    i += 1
  }

  return resultado.join('\n')
}

const renderizarMensaje = (mensaje: Mensaje) => {
  if (mensaje.rol === 'assistant') {
    return DOMPurify.sanitize(md.render(repararTablasMarkdown(mensaje.texto)))
  }
  return DOMPurify.sanitize(md.utils.escapeHtml(mensaje.texto).replace(/\n/g, '<br>'))
}

const actualizarFraseCarga = () => {
  const opciones = frasesCarga.filter((frase) => frase !== fraseCarga.value)
  fraseCarga.value = opciones[Math.floor(Math.random() * opciones.length)]
}

const detenerFrasesCarga = () => {
  if (temporizadorFraseCarga) clearInterval(temporizadorFraseCarga)
  temporizadorFraseCarga = null
}

const desplazarAlFinal = async () => {
  await nextTick()
  requestAnimationFrame(() => {
    const contenedor = contenedorMensajes.value
    if (contenedor) contenedor.scrollTo({ top: contenedor.scrollHeight, behavior: 'smooth' })
  })
}

const enfocarEntrada = async () => {
  await nextTick()
  entradaTexto.value?.focus()
}

const abrir = () => {
  if (asistenteBloqueado.value) return
  reproducirBurbujas()
  abierto.value = true
  void enfocarEntrada()
}

const manejarBotonBurbujita = () => {
  abrir()
}

const cerrar = () => {
  // Permitir cerrar incluso cuando está enviando (para poder cerrar si tarda mucho)
  conversacionPorVoz.value = false
  cancelarEnvioVoz = true
  detenerVoz()
  detenerMicrofono()
  enviando.value = false
  abierto.value = false
  lateral.value = false
}

const actualizarEspacioLateral = () => {
  const activo = lateral.value && abierto.value
  const raiz = document.documentElement
  raiz.classList.toggle('sali-lateral-activo', activo)
  raiz.classList.toggle('sali-lateral-izquierdo', activo && ladoLateral.value === 'izquierda')
  raiz.classList.toggle('sali-lateral-derecho', activo && ladoLateral.value === 'derecha')
}

const alternarLateral = () => {
  lateral.value = !lateral.value
  abierto.value = true
  void enfocarEntrada()
}

const colocarEnLateral = (lado: 'izquierda' | 'derecha') => {
  ladoLateral.value = lado
  lateral.value = true
  abierto.value = true
  void enfocarEntrada()
}

const restaurarEnMovil = () => {
  if (window.innerWidth <= 700) lateral.value = false
}

// En Android el teclado puede cubrir los elementos fixed. visualViewport contiene
// el alto realmente visible, por lo que el chat se mantiene completo sobre él.
const actualizarViewportChat = () => {
  const viewport = window.visualViewport
  altoViewportChat.value = Math.round(viewport?.height ?? window.innerHeight)
  desplazamientoViewportChat.value = Math.round(viewport?.offsetTop ?? 0)
}

const normalizarLlamado = (texto: string) => texto
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[¿?¡!.,;:]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

// Frases con las que el usuario da por terminada la conversación. Al detectarlas,
// Burbujita se despide y cierra el chat (y detiene la conversación por voz si estaba activa).
const FRASES_DESPEDIDA = new Set([
  'gracias', 'muchas gracias', 'listo gracias', 'ok gracias', 'esta bien gracias',
  'de acuerdo gracias', 'vale gracias', 'perfecto gracias',
  'eso es todo', 'eso seria todo', 'eso era todo', 'eso es todo gracias',
  'es todo', 'es todo gracias', 'nada mas gracias', 'nada mas',
  'ya esta gracias', 'ya fue todo', 'listo eso es todo', 'eso nomas', 'eso no mas',
])

const esFraseDespedida = (texto: string) => FRASES_DESPEDIDA.has(normalizarLlamado(texto))

const FRASES_INTERRUMPIR = new Set([
  'para', 'parate', 'detente', 'deten', 'cancela', 'callate', 'silencio',
  'termina', 'deten la conversacion', 'termina la conversacion'
])

const esFraseInterrupcion = (texto: string) => FRASES_INTERRUMPIR.has(normalizarLlamado(texto))

// Whisper puede convertir silencios muy cortos o el eco del altavoz en estas
// palabras. En conversación por voz se ignoran para conservar la escucha.
const TRANSCRIPCIONES_DE_SILENCIO = new Set([
  'adios', 'adio', 'gracias por ver', 'subtitulos realizados por la comunidad de amara org'
])

const esTranscripcionDeSilencio = (texto: string) =>
  TRANSCRIPCIONES_DE_SILENCIO.has(normalizarLlamado(texto))

// `esPorVoz` determina si la consulta proviene del micrófono
const enviar = async (esPorVoz = false) => {
  const texto = pregunta.value.trim()
  if (!texto || enviando.value) return
  detenerVoz()
  detenerMicrofono()

  if (esPorVoz && esFraseInterrupcion(texto)) {
    pregunta.value = ''
    detenerVoz()
    return
  }

  // Si el usuario se está despidiendo, Burbujita responde brevemente y cierra el chat,
  // deteniendo por completo la conversación (por texto o por voz).
  if (esFraseDespedida(texto)) {
    const despedida = '¡De nada! 🫧 Que tengas un buen día.'
    mensajes.value.push({ rol: 'user', texto })
    mensajes.value.push({ rol: 'assistant', texto: despedida })
    pregunta.value = ''
    void desplazarAlFinal()

    if (esPorVoz && conversacionPorVoz.value) {
      // Se dice la despedida en voz alta y, al terminar, se cierra el chat.
      void hablarTexto(despedida, mensajes.value.length - 1, () => cerrar())
    } else {
      setTimeout(() => cerrar(), 600)
    }
    return
  }

  const historial = mensajes.value.slice(-12)
  mensajes.value.push({ rol: 'user', texto })
  pregunta.value = ''
  enviando.value = true
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 segundos timeout
    
    const respuesta = await fetch(`${getApiBaseUrl()}/ayuda-ia`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mensaje: texto,
        historial,
        usuario: { nombre: nombreUsuario.value, rol: rol.value || 'usuario' },
        vista: vistaActual.value,
      }),
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    const datos = await respuesta.json()
    if (!respuesta.ok) throw new Error(datos?.error || 'No se pudo consultar la ayuda.')
    
    const respuestaTexto = datos.respuesta
    const responderConVoz = esPorVoz && conversacionPorVoz.value
    mensajes.value.push({ rol: 'assistant', texto: respuestaTexto })
    // En voz, si la respuesta trae una tabla (por ejemplo un desglose de gastos),
    // limpiarMarkdownParaVoz la reemplaza automáticamente por un aviso genérico;
    // el contenido completo siempre queda visible y bien formateado en el chat.
    if (responderConVoz) void hablarTexto(respuestaTexto, mensajes.value.length - 1)
  } catch (error) {
    let mensajeError = 'No se pudo conectar con la ayuda.'
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        mensajeError = 'La consulta tardó demasiado. Intenta de nuevo o reformula tu pregunta.'
      } else {
        mensajeError = error.message
      }
    }
    const responderConVoz = esPorVoz && conversacionPorVoz.value
    mensajes.value.push({ rol: 'assistant', texto: mensajeError })
    if (responderConVoz) void hablarTexto(mensajeError, mensajes.value.length - 1)
  } finally {
    enviando.value = false
    if (esPorVoz && conversacionPorVoz.value) reanudarConversacionPorVoz()
    void enfocarEntrada()
  }
}

// --- Micrófono: reconocimiento nativo + respaldo local con Whisper ---
const escuchando = ref(false)
const transcribiendo = ref(false)
const cargandoModeloVoz = ref(false)
const usaSpeechRecognitionNativo = ref(false)
const microfonoDisponible = ref(false)
let reconocimiento: any = null
let grabador: MediaRecorder | null = null
let fragmentosAudio: Blob[] = []
let cancelarEnvioVoz = false
// Temporizador compartido: si Burbujita está esperando activamente una respuesta
// hablada (chat abierto o conversación por invocación ya iniciada) y no escucha
// ninguna frase dentro del límite, se cierra el chat.
let temporizadorEsperaFrase: ReturnType<typeof setTimeout> | null = null

const limpiarTemporizadorEspera = () => {
  if (temporizadorEsperaFrase) {
    clearTimeout(temporizadorEsperaFrase)
    temporizadorEsperaFrase = null
  }
}

// Detecta si la app corre dentro de Electron (escritorio) para ocultar el micrófono,
// ya que el reconocimiento de voz nativo del navegador no funciona ahí.
const esEntornoElectron = (): boolean => {
  const ua = navigator.userAgent.toLowerCase()
  return ua.includes('electron') || Boolean((window as any).electronAPI) || !!(window as any).process?.versions?.electron
}

const crearReconocimiento = () => {
  const SpeechRecognitionCtor =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  if (!SpeechRecognitionCtor) return null

  const instancia = new SpeechRecognitionCtor()
  instancia.lang = 'es-419'
  instancia.continuous = true
  instancia.interimResults = true
  instancia.maxAlternatives = 1

  let textoBase = ''
  let textoFinalAcumulado = ''
  let temporizadorPausa: ReturnType<typeof setTimeout> | null = null
  let procesandoPausa = false

  const procesarTrasPausa = () => {
    if (procesandoPausa || cancelarEnvioVoz) return
    procesandoPausa = true
    if (temporizadorPausa) clearTimeout(temporizadorPausa)
    temporizadorPausa = null
    const textoDetectado = pregunta.value.trim()
    try { instancia.stop() } catch { /* ya estaba detenido */ }
    escuchando.value = false
    if (textoDetectado) void enviar(true)
  }

  const esperarPausa = () => {
    if (temporizadorPausa) clearTimeout(temporizadorPausa)
    temporizadorPausa = setTimeout(procesarTrasPausa, 1500)
  }

  instancia.onstart = () => {
    detenerVoz()
    escuchando.value = true
    textoBase = pregunta.value.trim() ? pregunta.value.trim() + ' ' : ''
    textoFinalAcumulado = ''
    procesandoPausa = false
    limpiarTemporizadorEspera()
    if (abierto.value) {
      temporizadorEsperaFrase = setTimeout(() => {
        if (!pregunta.value.trim()) {
          try { instancia.stop() } catch { /* ya estaba detenido */ }
          escuchando.value = false
          cerrar()
        }
      }, 20000)
    }
  }

  instancia.onresult = (evento: any) => {
  limpiarTemporizadorEspera()
  let textoFinal = ''
  let textoIntermedio = ''
  for (let i = 0; i < evento.results.length; i += 1) {
    const transcripcion = evento.results[i][0].transcript
    if (evento.results[i].isFinal) textoFinal += transcripcion
    else textoIntermedio += transcripcion
  }
  pregunta.value = (textoBase + textoFinal + textoIntermedio).trim()
  if (pregunta.value) esperarPausa()
  }

  instancia.onerror = (evento: any) => {
    limpiarTemporizadorEspera()
    escuchando.value = false
    if (evento.error === 'not-allowed' || evento.error === 'permission-denied') {
      mensajes.value.push({
        rol: 'assistant',
        texto: 'No pude acceder al micrófono. Revisa los permisos de micrófono para esta app en tu navegador.',
      })
    }
  }

  instancia.onend = () => {
    limpiarTemporizadorEspera()
    escuchando.value = false
    if (procesandoPausa || cancelarEnvioVoz) return
    const textoDetectado = pregunta.value.trim()
    if (textoDetectado) esperarPausa()
    else reanudarConversacionPorVoz()
  }

  return instancia
}

const iniciarGrabacionAudio = async () => {
  detenerVoz()
  try {
    const flujo = await navigator.mediaDevices.getUserMedia({ audio: true })
    fragmentosAudio = []
    // Opus/WebM es el formato que Chromium de Electron decodifica de forma
    // consistente. MP4 se deja como último respaldo para otros navegadores.
    const tipoMime = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
    ].find((tipo) => MediaRecorder.isTypeSupported(tipo))
    grabador = tipoMime
      ? new MediaRecorder(flujo, { mimeType: tipoMime })
      : new MediaRecorder(flujo)
    const esperandoRespuestaActiva = abierto.value

    // En Electron no existe SpeechRecognition para detectar el final de una
    // frase. Analizamos el volumen y detenemos la grabación al encontrar
    // silencio sostenido, en lugar de esperar los 20 segundos del temporizador.
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    let contextoDeteccion: AudioContext | null = null
    let intervaloSilencio: ReturnType<typeof setInterval> | null = null
    const limpiarDeteccionSilencio = () => {
      if (intervaloSilencio) clearInterval(intervaloSilencio)
      intervaloSilencio = null
      if (contextoDeteccion) void contextoDeteccion.close()
      contextoDeteccion = null
    }

    if (AudioCtx) {
      contextoDeteccion = new AudioCtx()
      const analizador = contextoDeteccion.createAnalyser()
      analizador.fftSize = 1024
      analizador.smoothingTimeConstant = 0.35
      const origen = contextoDeteccion.createMediaStreamSource(flujo)
      origen.connect(analizador)
      const muestrasVolumen = new Uint8Array(analizador.fftSize)
      let detectoVoz = false
      let ultimoSonido = Date.now()
      const inicioGrabacion = ultimoSonido
      void contextoDeteccion.resume()

      intervaloSilencio = setInterval(() => {
        if (!grabador || grabador.state === 'inactive') return
        analizador.getByteTimeDomainData(muestrasVolumen)
        let energia = 0
        for (const muestra of muestrasVolumen) {
          const amplitud = (muestra - 128) / 128
          energia += amplitud * amplitud
        }
        const volumen = Math.sqrt(energia / muestrasVolumen.length)
        const ahora = Date.now()

        if (volumen >= 0.018) {
          detectoVoz = true
          ultimoSonido = ahora
        } else if (detectoVoz && ahora - ultimoSonido >= 1200 && ahora - inicioGrabacion >= 700) {
          detenerGrabacionAudio()
        }
      }, 120)
    }

    grabador.ondataavailable = (evento) => {
      if (evento.data.size > 0) fragmentosAudio.push(evento.data)
    }

    grabador.onstop = async () => {
      limpiarTemporizadorEspera()
      limpiarDeteccionSilencio()
      flujo.getTracks().forEach((pista) => pista.stop())
      escuchando.value = false
      if (cancelarEnvioVoz) return
      transcribiendo.value = true
      try {
        const audioBlob = new Blob(fragmentosAudio, { type: grabador?.mimeType || tipoMime || 'audio/webm' })
        const muestras = await decodificarAudioParaWhisper(audioBlob)

        cargandoModeloVoz.value = true
        const transcriptor = await obtenerTranscriptor()
        cargandoModeloVoz.value = false

        const resultado = await transcriptor(muestras, {
          language: 'spanish',
          task: 'transcribe',
          // Evaluar varias alternativas mejora palabras cortas y nombres propios.
          num_beams: 3,
        })
        const textoTranscrito = (resultado?.text || '').trim()

        // No se envían al asistente falsos positivos producidos por el silencio
        // o por el eco de la respuesta anterior. En su lugar sigue escuchando.
        if (!textoTranscrito || esTranscripcionDeSilencio(textoTranscrito)) {
          pregunta.value = ''
          reanudarConversacionPorVoz()
          return
        }

        const textoPrevio = pregunta.value.trim()
        pregunta.value = (textoPrevio ? textoPrevio + ' ' : '') + textoTranscrito

        const textoDetectado = pregunta.value.trim()

        if (!textoDetectado) {
          pregunta.value = ''
          reanudarConversacionPorVoz()
          return
        }

        void enviar(true)
      } catch (error) {
        console.error('[Burbujita] Error al transcribir audio local:', error)
        const detalle = error instanceof Error ? error.message : ''
        const esErrorDeModelo = /fetch|network|wasm|onnx|model|session|qdq|scale/i.test(detalle)
        const esErrorDeAudio = !esErrorDeModelo && /decode|audio|media|format/i.test(detalle)
        mensajes.value.push({
          rol: 'assistant',
          texto: esErrorDeAudio
            ? 'No pude procesar el audio del micrófono. Verifica que otro programa no lo esté usando e intenta de nuevo.'
            : esErrorDeModelo
              ? 'No pude preparar el reconocimiento de voz. Verifica tu conexión la primera vez que uses el micrófono e intenta de nuevo.'
              : 'No se pudo transcribir el audio. Intenta de nuevo.',
        })
      } finally {
        cargandoModeloVoz.value = false
        transcribiendo.value = false
        void enfocarEntrada()
      }
    }

    grabador.start()
    escuchando.value = true

    limpiarTemporizadorEspera()
    temporizadorEsperaFrase = setTimeout(() => {
      detenerGrabacionAudio()
    }, esperandoRespuestaActiva ? 20000 : 6000)
  } catch (error) {
    mensajes.value.push({
      rol: 'assistant',
      texto: 'No pude acceder al micrófono. Revisa los permisos de micrófono para esta app.',
    })
  }
}

const detenerGrabacionAudio = () => {
  if (grabador && grabador.state !== 'inactive') grabador.stop()
}

const reanudarConversacionPorVoz = () => {
  if (
    !conversacionPorVoz.value || !abierto.value || enviando.value || reproduciendoVoz.value ||
    escuchando.value || transcribiendo.value || cargandoModeloVoz.value ||
    !microfonoDisponible.value
  ) return

  cancelarEnvioVoz = false
  if (usaSpeechRecognitionNativo.value) {
    if (!reconocimiento) reconocimiento = crearReconocimiento()
    if (!reconocimiento) return

    try {
      reconocimiento.start()
    } catch {
    }
    return
  }

  void iniciarGrabacionAudio()
}

const alternarMicrofono = () => {
  if (conversacionPorVoz.value) {
    conversacionPorVoz.value = false
    cancelarEnvioVoz = true
    detenerVoz()
    detenerMicrofono()
    return
  }

  conversacionPorVoz.value = true
  reanudarConversacionPorVoz()
}

const controlarMicrofono = () => {
  if (reproduciendoVoz.value) {
    detenerVoz()
    return
  }
  alternarMicrofono()
}

const detenerMicrofono = () => {
  limpiarTemporizadorEspera()
  if (usaSpeechRecognitionNativo.value) {
    if (reconocimiento && escuchando.value) reconocimiento.stop()
  } else if (escuchando.value) {
    detenerGrabacionAudio()
  }
}

interface BurbujaFlotante { id: number, left: number, size: number, duration: number }
interface BurbujaAcumulada { id: number, left: number, size: number }

const burbujasSubiendo = ref<BurbujaFlotante[]>([])
const burbujasAcumuladas = ref<BurbujaAcumulada[]>([])
const explotando = ref(false)
let contadorBurbujas = 0
let intervaloGenerador: ReturnType<typeof setInterval> | null = null

const LIMITE_ACUMULACION = 7
const MAX_BURBUJAS_ACTIVAS = 24

const generarBurbuja = () => {
  if (burbujasSubiendo.value.length >= MAX_BURBUJAS_ACTIVAS) return
  contadorBurbujas += 1
  burbujasSubiendo.value.push({
    id: contadorBurbujas,
    left: Math.random() * 90 + 4,
    size: Math.random() * 14 + 6,
    duration: Math.random() * 4 + 5,
  })
}

const explotarBurbujas = () => {
  explotando.value = true
  setTimeout(() => {
    burbujasAcumuladas.value = []
    explotando.value = false
  }, 480)
}

const burbujaLlegoArriba = (id: number) => {
  burbujasSubiendo.value = burbujasSubiendo.value.filter((b) => b.id !== id)
  burbujasAcumuladas.value.push({
    id,
    left: Math.random() * 82 + 6,
    size: Math.random() * 9 + 8,
  })
  if (burbujasAcumuladas.value.length >= LIMITE_ACUMULACION && !explotando.value) {
    explotarBurbujas()
  }
}

watch([abierto, () => mensajes.value.length, enviando], ([estaAbierto]) => {
  if (estaAbierto) void desplazarAlFinal()
})

watch([abierto, lateral, ladoLateral], actualizarEspacioLateral)
watch(abierto, (estaAbierto) => {
  // Si se cierra el chat, se detiene por completo la conversación por voz:
  // el micrófono ya solo se activa con un clic explícito, con el chat abierto.
  if (!estaAbierto) {
    conversacionPorVoz.value = false
    cancelarEnvioVoz = true
    detenerMicrofono()
  }
})
watch(enviando, (estaEnviando) => {
  detenerFrasesCarga()
  if (!estaEnviando) return
  actualizarFraseCarga()
  temporizadorFraseCarga = setInterval(actualizarFraseCarga, 2400)
})

onMounted(() => {
  sintesisDisponible.value = true
  if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => obtenerVozFemeninaEspanol()
  }

  if (esEntornoElectron()) {
    // Electron no implementa SpeechRecognition de forma fiable, pero sí
    // proporciona getUserMedia y MediaRecorder para la transcripción local.
    usaSpeechRecognitionNativo.value = false
    microfonoDisponible.value = !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined'
    // Descarga y prepara Whisper de antemano para que el micrófono no se
    // sienta lento la primera vez que el usuario lo usa.
    void obtenerTranscriptor().catch((error) => {
      console.error('[Burbujita] No se pudo precargar Whisper en Electron:', error)
    })
  } else {
    usaSpeechRecognitionNativo.value = !!(
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    )
    microfonoDisponible.value =
      usaSpeechRecognitionNativo.value || !!navigator.mediaDevices?.getUserMedia
  }

  window.addEventListener('resize', restaurarEnMovil)
  actualizarViewportChat()
  window.visualViewport?.addEventListener('resize', actualizarViewportChat)
  window.visualViewport?.addEventListener('scroll', actualizarViewportChat)
  for (let i = 0; i < 6; i += 1) {
    setTimeout(generarBurbuja, i * 320)
  }
  intervaloGenerador = setInterval(generarBurbuja, 550)
})

onUnmounted(() => {
  conversacionPorVoz.value = false
  cancelarEnvioVoz = true
  if (temporizadorReinicioEscucha) clearTimeout(temporizadorReinicioEscucha)
  detenerVoz()
  detenerMicrofono()
  detenerFrasesCarga()
  window.removeEventListener('resize', restaurarEnMovil)
  window.visualViewport?.removeEventListener('resize', actualizarViewportChat)
  window.visualViewport?.removeEventListener('scroll', actualizarViewportChat)
  document.documentElement.classList.remove('sali-lateral-activo', 'sali-lateral-izquierdo', 'sali-lateral-derecho')
  if (intervaloGenerador) clearInterval(intervaloGenerador)
})
</script>

<style scoped>
.sali-btn-leer {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  margin-left: 6px;
  border-radius: 50%;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, .06);
  box-shadow: 0 2px 6px rgba(0, 0, 0, .08);
  color: #4a90d9;
  cursor: pointer;
  transition: transform .15s ease, box-shadow .15s ease;
}
.sali-btn-leer:hover {
  transform: scale(1.08);
}
.sali-btn-leer.activo {
  background: #4a90d9;
  color: #fff;
  animation: pulso-voz 1s infinite;
}
@keyframes pulso-voz {
  0%, 100% { box-shadow: 0 0 0 0 rgba(74, 144, 217, .4); }
  50%      { box-shadow: 0 0 0 6px rgba(74, 144, 217, 0); }
}

.asistente-sali { position: fixed; right: 24px; bottom: calc(24px + env(safe-area-inset-bottom)); z-index: 30010; border: 1px solid rgba(255,255,255,.22); border-radius: 999px; padding: 12px 17px; background: linear-gradient(135deg, #126f9a, #1e4f8e); color: #fff; box-shadow: 0 12px 28px rgba(10, 67, 111, .32); display: flex; align-items: center; gap: 7px; font-size: .9rem; font-weight: 800; cursor: pointer; transition: transform .18s ease, background .18s ease; }
.asistente-sali ion-icon { font-size: 21px; }
.asistente-sali:hover, .asistente-sali:focus-visible { background: #0d2b4e; transform: translateY(-2px); outline: none; }
.asistente-sali:disabled { cursor: not-allowed; opacity: .5; filter: grayscale(.45); transform: none; }
.asistente-sali::before, .asistente-sali::after { content: ''; position: absolute; inset: -7px; border: 2px solid rgba(146, 241, 255, .9); border-radius: inherit; opacity: 0; pointer-events: none; }
.asistente-sali.modo-voz-activo { background: linear-gradient(135deg, #0f819f, #385bd4); box-shadow: 0 0 0 5px rgba(88, 224, 244, .18), 0 12px 30px rgba(30, 106, 199, .45); }
.asistente-sali.modo-voz-activo::before { animation: ondas-burbujita 1.7s ease-out infinite; }
.asistente-sali.modo-voz-activo::after { animation: ondas-burbujita 1.7s ease-out .62s infinite; }
.asistente-sali.hablando { background: linear-gradient(135deg, #6d48d8, #198abd); animation: brillo-burbujita .85s ease-in-out infinite alternate; }
.asistente-sali .sali-logo { z-index: 1; }
@keyframes ondas-burbujita { 0% { transform: scale(.82); opacity: .85; } 100% { transform: scale(1.65); opacity: 0; } }
@keyframes brillo-burbujita { from { filter: brightness(1); } to { filter: brightness(1.26); } }
.sali-logo { position: relative; display: inline-block; width: 34px; height: 38px; border: 2px solid #c9f5ff; border-radius: 10px 10px 12px 12px; background: linear-gradient(145deg, #8ee4f3, #318fbe); box-shadow: inset 0 2px 0 rgba(255,255,255,.48), 0 0 0 2px rgba(28, 178, 208, .18), 0 0 13px rgba(83, 220, 238, .45); }
.sali-logo::after { content: 'AI'; position: absolute; z-index: 5; right: -7px; bottom: -6px; display: grid; place-items: center; width: 15px; height: 15px; border: 2px solid #fff; border-radius: 50%; background: #1f8d9c; color: #fff; font: 800 6px/1 Arial, sans-serif; box-shadow: 0 2px 5px rgba(18, 58, 102, .25); }
.sali-logo-panel { position: absolute; top: 3px; left: 4px; right: 4px; height: 7px; border-radius: 3px; background: #e9fcff; }
.sali-logo-panel i { position: absolute; left: 3px; top: 2px; width: 3px; height: 3px; border-radius: 50%; background: #31c991; box-shadow: 0 0 4px #31c991; }.sali-logo-panel b { position: absolute; right: 3px; top: 2px; width: 10px; height: 3px; border-radius: 3px; background: #9fcbd9; }
.sali-logo-tambor { position: absolute; z-index: 1; left: 7px; top: 12px; width: 16px; height: 16px; border: 2px solid #dffcff; border-radius: 50%; background: radial-gradient(circle at 38% 35%, #b8f5ff 0 8%, #4db6d4 10% 28%, #1b557c 30% 68%, #64d3e6 70%); box-shadow: inset 0 0 0 2px #286b94; }
.sali-logo-tambor::after { content: ''; position: absolute; inset: 3px; border: 1px solid rgba(255,255,255,.55); border-left-color: transparent; border-radius: 50%; animation: sali-giro-tambor 1.8s linear infinite; }
.sali-logo-ojo { position: absolute; z-index: 2; top: 20px; width: 2px; height: 3px; border-radius: 50%; background: #103b5b; }.ojo-a { left: 13px; }.ojo-b { left: 19px; }
.sali-logo-sonrisa { position: absolute; z-index: 2; left: 14px; top: 24px; width: 7px; height: 3px; border-bottom: 1.5px solid #103b5b; border-radius: 0 0 8px 8px; }
.sali-logo-burbuja { position: absolute; z-index: 4; border-radius: 50%; background: #ddfbff; box-shadow: 0 0 4px rgba(255,255,255,.8); animation: sali-burbujas 1.8s ease-in infinite; }.b-uno { top: -5px; right: -5px; width: 6px; height: 6px; }.b-dos { top: -10px; right: 1px; width: 3px; height: 3px; animation-delay: .5s; }
.sali-logo-mini { width: 22px; height: 25px; border-width: 1.5px; border-radius: 7px; box-shadow: inset 0 1px 0 rgba(255,255,255,.42), 0 0 8px rgba(83, 220, 238, .38); }.sali-logo-mini::after { display: none; }.sali-logo-mini .sali-logo-tambor { left: 4px; top: 7px; width: 11px; height: 11px; border-width: 1.5px; }.sali-logo-mini .sali-logo-sonrisa { left: 9px; top: 15px; width: 4px; height: 2px; border-width: 1px; }

/* Burbujitas que nacen del centro del tambor del ícono flotante (botón cerrado) */
.burbuja-boton {
  position: absolute;
  left: 9.5px; /* centro horizontal del tambor mini (left:4px + width:11px / 2) */
  top: 12.5px; /* centro vertical del tambor mini (top:7px + height:11px / 2) */
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, rgba(255,255,255,.95), rgba(120, 210, 235, .55) 70%);
  box-shadow: 0 0 5px rgba(255,255,255,.75);
  opacity: 0;
  pointer-events: none;
  z-index: 6;
  transform: translate(-50%, -50%);
}
.burbuja-boton-izq { animation: sali-burbuja-boton-izq 3s ease-in infinite; }
.burbuja-boton-der { animation: sali-burbuja-boton-der 3s ease-in infinite .1s; }

@keyframes sali-burbuja-boton-izq {
  0%   { opacity: 0; transform: translate(-50%, -50%) translate(0, 0) scale(.35); }
  6%   { opacity: 1; }
  38%  { transform: translate(-50%, -50%) translate(-8px, -16px) scale(.9); opacity: .95; }
  55%  { transform: translate(-50%, -50%) translate(-12px, -23px) scale(1.5); opacity: .55; }
  63%  { transform: translate(-50%, -50%) translate(-13px, -25px) scale(2.1); opacity: 0; }
  100% { opacity: 0; transform: translate(-50%, -50%) translate(-13px, -25px) scale(2.1); }
}
@keyframes sali-burbuja-boton-der {
  0%   { opacity: 0; transform: translate(-50%, -50%) translate(0, 0) scale(.35); }
  6%   { opacity: 1; }
  38%  { transform: translate(-50%, -50%) translate(8px, -18px) scale(.9); opacity: .95; }
  55%  { transform: translate(-50%, -50%) translate(12px, -25px) scale(1.5); opacity: .55; }
  63%  { transform: translate(-50%, -50%) translate(13px, -27px) scale(2.1); opacity: 0; }
  100% { opacity: 0; transform: translate(-50%, -50%) translate(13px, -27px) scale(2.1); }
}

/* Panel del chat: contenedor relativo para poder colocar la decoración de fondo */
.sali-contenido { position: relative; overflow: hidden; height: min(650px, calc(var(--sali-alto-visible, 86vh) - 28px)); padding: 20px; display: flex; flex-direction: column; gap: 12px; background: radial-gradient(circle at 100% 0%, rgba(94, 224, 255, .35) 0%, transparent 45%), radial-gradient(circle at 0% 100%, rgba(140, 110, 255, .28) 0%, transparent 50%), linear-gradient(160deg, #dff3fb 0%, #e7effa 45%, #eef2fb 100%); }

/* Capa decorativa: burbujas y espuma, siempre detrás del contenido y sin capturar clics */
.sali-fondo-decor { position: absolute; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }

/* Burbujas dinámicas que suben desde abajo hasta cerca del tope */
.fb-dinamica {
  position: absolute;
  bottom: -20px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, rgba(255,255,255,.92), rgba(120, 210, 235, .35) 70%);
  box-shadow: 0 0 10px rgba(255,255,255,.5);
  animation-name: sali-burbuja-subir-dinamica;
  animation-timing-function: linear;
  animation-iteration-count: 1;
  animation-fill-mode: forwards;
}

@keyframes sali-burbuja-subir-dinamica {
  0%   { bottom: -20px; opacity: 0; transform: translateX(0) scale(.6); }
  10%  { opacity: .9; }
  85%  { opacity: .85; }
  100% { bottom: 94%; opacity: .85; transform: translateX(6px) scale(1); }
}

/* Montón de burbujas que se quedan pegadas al tope */
.burbujas-tope {
  position: absolute;
  top: 4px;
  left: 0;
  right: 0;
  height: 44px;
}

.fb-acumulada {
  position: absolute;
  top: 0;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, rgba(255,255,255,.95), rgba(120, 210, 235, .55) 70%);
  box-shadow: 0 0 8px rgba(255,255,255,.65);
  animation: sali-burbuja-asentar .3s ease-out;
}

@keyframes sali-burbuja-asentar {
  from { transform: scale(0); opacity: 0; }
  to   { transform: scale(1); opacity: 1; }
}

/* Cuando el montón llega al límite, todas explotan (se agrandan y desvanecen) */
.burbujas-tope.explota .fb-acumulada {
  animation: sali-burbuja-explotar .45s ease-in forwards;
}

@keyframes sali-burbuja-explotar {
  0%   { transform: scale(1); opacity: 1; }
  55%  { transform: scale(1.7); opacity: .65; }
  100% { transform: scale(2.6); opacity: 0; }
}

.fondo-espuma { position: absolute; bottom: -10px; width: 90px; height: 60px; background: radial-gradient(circle, rgba(255,255,255,.9) 0%, rgba(255,255,255,.5) 55%, transparent 75%); filter: blur(1px); opacity: .8; }
.fondo-espuma::before, .fondo-espuma::after { content: ''; position: absolute; border-radius: 50%; background: inherit; }
.espuma-izq { left: -20px; }
.espuma-izq::before { width: 40px; height: 40px; left: 30px; bottom: 20px; }
.espuma-izq::after  { width: 28px; height: 28px; left: 60px; bottom: 35px; }
.espuma-der { right: -20px; }
.espuma-der::before { width: 36px; height: 36px; right: 25px; bottom: 22px; }
.espuma-der::after  { width: 22px; height: 22px; right: 55px; bottom: 34px; }

/* El contenido real siempre por encima de la decoración de fondo */
.sali-header, .sali-mensajes, .sali-form, .sali-aviso { position: relative; z-index: 1; }

.sali-header, .sali-header-left, .sali-form { display: flex; }
.sali-header { align-items: flex-start; justify-content: space-between; padding: 2px 2px 12px; border-bottom: 1px solid rgba(31, 116, 151, .14); }
.sali-header-left { align-items: center; gap: 12px; }
.sali-header-icono { width: 48px; height: 48px; border-radius: 16px; background: linear-gradient(145deg, #dff9ff, #b6eaf6); display: grid; place-items: center; box-shadow: 0 7px 15px rgba(37, 120, 185, .18); }
.sali-titulo, .sali-subtitulo { margin: 0; }
.sali-titulo { font-weight: 900; color: #123a66; font-size: 1.15rem; letter-spacing: -.02em; }
.sali-subtitulo { font-size: .88rem; color: #6d829c; }
.sali-acciones-header { display: flex; align-items: center; gap: 2px; }
.sali-cerrar, .sali-accion-header { border: none; background: none; color: #9fb4c9; font-size: 22px; cursor: pointer; }
.sali-accion-header { width: 34px; height: 34px; border-radius: 9px; display: grid; place-items: center; color: #2563eb; }
.sali-accion-header:hover { background: #eff6ff; }
.sali-accion-header.activa { background: #dbeafe; color: #1d4ed8; }
.sali-aviso { padding: 9px 11px; border-radius: 11px; background: #dcf2ee; color: #16756c; border: 1px solid rgba(22, 117, 108, .16); font-size: .78rem; line-height: 1.35; }
.sali-mensajes { flex: 1; min-height: 200px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; padding: 8px 4px; scroll-behavior: smooth; scrollbar-width: none; -ms-overflow-style: none; }
.sali-mensajes::-webkit-scrollbar {display: none;}
.sali-bienvenida, .sali-mensaje { max-width: 88%; padding: 11px 13px; font-size: .9rem; line-height: 1.45; box-shadow: 0 3px 10px rgba(18, 58, 102, .07); }
.sali-bienvenida, .sali-mensaje.assistant { align-self: flex-start; border-radius: 15px 15px 15px 4px; background: #f2fafc; border: 1px solid rgba(70, 147, 179, .18); color: #17486d; }
.sali-bienvenida::before { content: '🫧  Burbujita está lista'; display: block; margin-bottom: 5px; color: #16756c; font-size: .73rem; font-weight: 800; text-transform: uppercase; letter-spacing: .04em; }
.sali-mensaje { border-radius: 13px; white-space: pre-wrap; }
.sali-mensaje.user { align-self: flex-end; border-bottom-right-radius: 4px; background: linear-gradient(135deg, #1e6091, #277da1); color: #fff; }
.sali-mensaje.cargando { color: #64748b; font-style: italic; }
.sali-mensaje p { margin: 0 0 6px; }
.sali-mensaje p:last-child { margin-bottom: 0; }
.sali-mensaje ul, .sali-mensaje ol { margin: 4px 0 4px 18px; padding: 0; }
.sali-mensaje strong { font-weight: 800; }
.sali-mensaje code {
  background: rgba(30, 96, 145, .1);
  padding: 1px 5px;
  border-radius: 5px;
  font-size: .85em;
}
.sali-mensaje :deep(table) {
  display: table;
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin: 8px 0;
  font-size: .84rem;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #5a9cbc;
  box-shadow: 0 2px 8px rgba(18, 58, 102, .1);
}
.sali-mensaje > div { overflow-x: auto; }
.sali-mensaje :deep(th), .sali-mensaje :deep(td) {
  padding: 7px 10px;
  text-align: left;
  border-right: 1px solid #8abbd1;
  border-bottom: 1px solid #8abbd1;
  word-break: break-word;
}
.sali-mensaje :deep(th:last-child), .sali-mensaje :deep(td:last-child) { border-right: 0; }
.sali-mensaje :deep(tbody tr:last-child td) { border-bottom: 0; }
.sali-mensaje.user :deep(table) {
  border-color: rgba(255, 255, 255, .45);
}
.sali-mensaje.user :deep(th), .sali-mensaje.user :deep(td) {
  border-color: rgba(255, 255, 255, .35);
}
.sali-mensaje.assistant :deep(th) {
  background: linear-gradient(135deg, #1e6091, #277da1);
  color: #fff;
  font-weight: 700;
}
.sali-mensaje.assistant :deep(tbody tr:nth-child(even)) {
  background: #e3f2f7;
}
.sali-mensaje.assistant :deep(tbody tr:hover) {
  background: #d3ecf4;
}
.sali-mensaje.user :deep(table) {
  background: rgba(255,255,255,.1);
}
.sali-mensaje.user :deep(th) {
  background: rgba(255,255,255,.16);
}

.sali-cargando { align-self: flex-start; display: flex; align-items: center; gap: 11px; max-width: 92%; padding: 10px 13px 10px 9px; border-radius: 16px 16px 16px 4px; background: #f2fafc; border: 1px solid rgba(70, 147, 179, .2); color: #17486d; box-shadow: 0 4px 12px rgba(18, 58, 102, .08); }
.sali-cargando strong, .sali-cargando span { display: block; }
.sali-cargando strong { font-size: .83rem; color: #176e88; }
.sali-cargando > div:last-child > span { margin-top: 2px; color: #6b879c; font-size: .72rem; }
.lavadora-cargando { position: relative; flex: 0 0 54px; width: 54px; height: 58px; border-radius: 12px 12px 15px 15px; background: linear-gradient(145deg, #a8e3f2, #4fa9cb); border: 2px solid #2f88ae; box-shadow: inset 0 2px 0 rgba(255,255,255,.45), 0 5px 10px rgba(23, 110, 136, .16); }
.lavadora-panel { position: absolute; top: 5px; left: 6px; right: 6px; height: 11px; border-radius: 5px; background: #eafaff; }
.lavadora-luz { position: absolute; left: 5px; top: 3px; width: 5px; height: 5px; border-radius: 50%; background: #35c98c; box-shadow: 0 0 5px #35c98c; }
.lavadora-ranura { position: absolute; right: 5px; top: 3px; width: 19px; height: 4px; border-radius: 3px; background: #86bed2; }
.lavadora-tambor { position: absolute; left: 10px; top: 20px; width: 30px; height: 30px; border-radius: 50%; background: #153e65; border: 3px solid #e5fbff; overflow: hidden; box-shadow: inset 0 0 0 3px #2b7397; }
.lavadora-agua { position: absolute; inset: -4px; display: grid; place-items: center; color: #8fe8f6; font-size: 35px; line-height: 1; animation: sali-giro-tambor 1.15s linear infinite; }
.lavadora-ojo { position: absolute; top: 37px; z-index: 2; width: 3px; height: 4px; border-radius: 50%; background: #153e65; }
.ojo-uno { left: 20px; }.ojo-dos { right: 20px; }
.lavadora-sonrisa { position: absolute; z-index: 2; left: 23px; top: 42px; width: 9px; height: 5px; border-bottom: 2px solid #153e65; border-radius: 0 0 10px 10px; }
.lavadora-burbuja { position: absolute; z-index: 3; border-radius: 50%; background: rgba(224, 251, 255, .9); animation: sali-burbujas 1.7s ease-in infinite; }
.burbuja-uno { width: 7px; height: 7px; right: -3px; top: 7px; }.burbuja-dos { width: 4px; height: 4px; right: 2px; top: -2px; animation-delay: .6s; }
@keyframes sali-giro-tambor { to { transform: rotate(360deg); } }
@keyframes sali-burbujas { 0% { transform: translateY(4px); opacity: 0; } 35% { opacity: 1; } 100% { transform: translateY(-14px); opacity: 0; } }
.sali-form { align-items: flex-end; gap: 8px; }
.sali-input { min-height: 48px; max-height: 100px; flex: 1; padding: 10px 12px; border: 1px solid rgba(30, 125, 161, .22); border-radius: 14px; background: #fff; color: #111827; caret-color: #111827; resize: vertical; font: inherit; box-shadow: 0 3px 10px rgba(18, 58, 102, .05); }
.sali-input:focus { outline: none; border-color: #3aa9cf; box-shadow: 0 0 0 3px rgba(58, 169, 207, .15); }
.sali-input::placeholder { color: #64748b; opacity: 1; }
.sali-enviar { width: 46px; height: 46px; border: none; border-radius: 14px; background: linear-gradient(135deg, #1f8d9c, #1e6091); color: #fff; display: grid; place-items: center; font-size: 20px; cursor: pointer; box-shadow: 0 7px 14px rgba(30, 96, 145, .22); }
.sali-enviar:disabled { opacity: .45; cursor: not-allowed; }
.sali-mic { width: 46px; height: 46px; border: none; border-radius: 14px; background: #eef6fb; color: #1e6091; display: grid; place-items: center; font-size: 20px; cursor: pointer; box-shadow: 0 3px 10px rgba(18, 58, 102, .08); transition: background .18s ease, color .18s ease; }
.sali-mic:disabled { opacity: .45; cursor: not-allowed; }
.sali-mic.activo { background: linear-gradient(135deg, #ef4444, #dc2626); color: #fff; animation: sali-mic-pulso 1.2s ease-in-out infinite; }
@keyframes sali-mic-pulso {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, .45); }
  50%      { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
}
.sali-capa { position: fixed; top: var(--sali-desplazamiento-superior, 0px); right: 0; left: 0; height: var(--sali-alto-visible, 100dvh); z-index: 30000; display: grid; place-items: center; pointer-events: none; }
.sali-respaldo { position: absolute; inset: 0; border: 0; background: rgba(10, 31, 56, .48); pointer-events: auto; cursor: default; }
.sali-ventana { position: relative; z-index: 1; width: min(460px, calc(100vw - 28px)); max-height: calc(var(--sali-alto-visible, 86vh) - 28px); border-radius: 20px; overflow: hidden; box-shadow: 0 20px 50px rgba(10, 31, 56, .28); pointer-events: auto; }
/* El router outlet no pertenece a este componente. Al reducir el contenedor
   completo, tanto la vista anidada de Ionic como el chat comparten el mismo
   borde y no queda una reserva blanca entre los dos. */
:global(html.sali-lateral-activo) { --sali-panel-ancho: min(430px, 34vw); --sali-reserva: var(--sali-panel-ancho); }
:global(html.sali-lateral-activo ion-app > ion-router-outlet) {
  position: absolute;
  inset: 0 var(--sali-reserva) 0 0;
  width: auto;
  transition: right .22s ease;
}
:global(html.sali-lateral-activo ion-router-outlet > .ion-page) {
  left: 0 !important;
  right: 0 !important;
  width: auto !important;
}
:global(html.sali-lateral-activo.sali-lateral-izquierdo ion-app > ion-router-outlet) {
  inset: 0 0 0 var(--sali-reserva);
}
.sali-capa.lateral { display: block; }
.sali-capa.lateral .sali-ventana { position: fixed; top: var(--sali-desplazamiento-superior, 0px); right: 0; bottom: auto; height: var(--sali-alto-visible, 100dvh); width: var(--sali-panel-ancho); max-width: none; max-height: none; border-radius: 0; }
.sali-capa.lateral.izquierda .sali-ventana { right: auto; left: 0; }
.sali-capa.lateral .sali-contenido { height: var(--sali-alto-visible, 100dvh); }
@media (max-width: 700px) { .asistente-sali { right: 16px; bottom: calc(82px + env(safe-area-inset-bottom)); } .sali-accion-header { display: none; } }
@media (max-width: 1000px) { :global(html.sali-lateral-activo) { --sali-panel-ancho: min(390px, 44vw); } }
</style>