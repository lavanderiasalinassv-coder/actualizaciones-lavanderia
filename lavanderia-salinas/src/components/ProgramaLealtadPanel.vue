<template>
  <section class="lealtad-panel">
    <header class="lealtad-encabezado">
      <div>
        <p class="lealtad-etiqueta">Lavandería Salinas</p>
        <h2>Programa de lealtad</h2>
      </div>
      <div class="lealtad-contador">
        <strong>{{ configuracion?.tarjetasActivas ?? '—' }}</strong>
        <span>tarjetas activas</span>
      </div>
    </header>

    <div class="lealtad-contenido">
      <div class="lealtad-qr-marco">
        <div v-if="qrDataUrl" class="lealtad-qr-cupon">
          <span class="lealtad-qr-sello">LAVANDERÍA SALINAS · AHUACHAPÁN</span>
          <div class="lealtad-qr-visual">
            <img :src="qrDataUrl" alt="Código QR para inscribirse al programa de lealtad" />
            <span class="lealtad-qr-escaneo" aria-hidden="true"></span>
          </div>
          <strong>PROGRAMA DE LEALTAD</strong>
        </div>
        <div v-else class="lealtad-qr-cargando" role="status">
          <template v-if="cargando">
            <ion-spinner name="crescent" />
            <span>Preparando el código QR...</span>
          </template>
          <span v-else>QR no disponible</span>
        </div>
      </div>
      <div class="lealtad-instrucciones">
        <label class="lealtad-label" for="premio-lealtad">Premio al completar {{ visitasMetaBorrador }} visitas</label>
        <div class="lealtad-premio-editor">
          <input
            id="premio-lealtad"
            v-model="premioBorrador"
            maxlength="255"
            type="text"
            placeholder="Ej. Un servicio gratis"
            :disabled="guardandoPremio"
          />
          <select v-model="tipoDescuentoBorrador" :disabled="guardandoPremio" aria-label="Tipo de descuento">
            <option value="porcentaje">Porcentaje</option>
            <option value="dinero">Monto en dólares</option>
          </select>
          <input v-model.number="valorDescuentoBorrador" type="number" min="0.01" :max="tipoDescuentoBorrador === 'porcentaje' ? 100 : undefined" :step="tipoDescuentoBorrador === 'porcentaje' ? 1 : 0.01" aria-label="Valor del descuento" :disabled="guardandoPremio" />
          <button type="button" :disabled="guardandoPremio || !premioBorrador.trim() || !(valorDescuentoBorrador > 0) || !Number.isInteger(visitasMetaBorrador) || visitasMetaBorrador < 1 || visitasMetaBorrador > 100" @click="guardarPremio">
            {{ guardandoPremio ? 'Guardando...' : 'Guardar configuración' }}
          </button>
        </div>
        <label class="lealtad-label" for="meta-visitas-lealtad">Visitas necesarias para el premio</label>
        <input id="meta-visitas-lealtad" v-model.number="visitasMetaBorrador" class="lealtad-meta-input" type="number" min="1" max="100" step="1" :disabled="guardandoPremio" />
<div class="lealtad-acciones">
          <a
            v-if="qrDataUrl"
            class="lealtad-boton-principal"
            :href="qrDataUrl"
            download="programa-lealtad-lavanderia-salinas.png"
          >Descargar QR PNG</a>
          <button type="button" class="lealtad-boton-secundario" :disabled="cargando" @click="cargarDatos">
            {{ cargando ? 'Actualizando...' : 'Actualizar' }}
          </button>
        </div>
<p v-if="error" class="lealtad-error" role="alert">{{ error }}</p>
      </div>
    </div>
    <section class="lealtad-suscritos" aria-labelledby="suscritos-titulo">
      <header class="suscritos-encabezado">
        <div>
          <h3 id="suscritos-titulo">Clientes suscritos</h3>
</div>
        <button type="button" :disabled="cargandoTarjetas" @click="cargarTarjetas">
          {{ cargandoTarjetas ? 'Actualizando...' : 'Actualizar lista' }}
        </button>
      </header>
      <input v-model="busquedaTarjetas" class="suscritos-busqueda" type="search" placeholder="Buscar por nombre o teléfono" aria-label="Buscar clientes suscritos" />
      <p v-if="errorTarjetas" class="suscritos-error" role="alert">{{ errorTarjetas }}</p>
      <p v-else-if="cargandoTarjetas && !tarjetas.length" class="suscritos-vacio" role="status">Cargando clientes suscritos...</p>
      <p v-else-if="!tarjetasFiltradas.length" class="suscritos-vacio">{{ tarjetas.length ? 'No hay clientes que coincidan con la búsqueda.' : 'Todavía no hay clientes suscritos.' }}</p>
      <div v-else class="suscritos-lista">
        <article v-for="tarjeta in tarjetasFiltradas" :key="tarjeta.tarjetaId" class="suscrito-card">
          <div class="suscrito-identidad">
            <strong>{{ tarjeta.nombre }}</strong>
            <span>{{ tarjeta.telefono }}</span>
            <span v-if="tarjeta.premioDisponible" class="suscrito-premio">Premio disponible: {{ tarjeta.premio }}</span>
          </div>
          <div class="suscrito-progreso" :aria-label="tarjeta.sellos + ' de ' + tarjeta.meta + ' visitas'">
            <strong>{{ Math.min(tarjeta.sellos, tarjeta.meta) }}<small>/{{ tarjeta.meta }}</small></strong>
            <div class="suscrito-barra"><span :style="{ width: (Math.min(tarjeta.sellos / tarjeta.meta, 1) * 100) + '%' }"></span></div>
          </div>
          <div class="suscrito-controles" :aria-label="'Ajustar visitas de ' + tarjeta.nombre">
            <button type="button" :disabled="tarjeta.sellos <= 0 || tarjetaAjustando === tarjeta.tarjetaId" :aria-label="'Quitar una visita a ' + tarjeta.nombre" @click="ajustarVisitas(tarjeta, -1)">−</button>
            <button type="button" :disabled="tarjeta.sellos >= tarjeta.meta || tarjetaAjustando === tarjeta.tarjetaId" :aria-label="'Sumar una visita a ' + tarjeta.nombre" @click="ajustarVisitas(tarjeta, 1)">+</button>
            <button type="button" class="suscrito-quitar" :disabled="tarjetaQuitando === tarjeta.tarjetaId || tarjetaAjustando === tarjeta.tarjetaId" :aria-label="'Quitar a ' + tarjeta.nombre + ' del programa de lealtad'" @click="quitarTarjeta(tarjeta)">{{ tarjetaQuitando === tarjeta.tarjetaId ? '…' : '×' }}</button>
          </div>
        </article>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { IonSpinner, toastController } from '@ionic/vue'
import QRCode from 'qrcode'
import imagenCupon from '@/assets/cupon.png'
import {
  actualizarPremioLealtad,
  ajustarVisitasLealtad,
  removerTarjetaLealtad,
  obtenerTarjetasLealtad,
  obtenerConfiguracionLealtad,
  urlRegistroLealtad,
  type ConfiguracionLealtad
} from '@/composables/useLealtad'

const configuracion = ref<ConfiguracionLealtad | null>(null)
const tarjetas = ref<{ tarjetaId: string; nombre: string; telefono: string; sellos: number; meta: number; premioDisponible: boolean; premio: string }[]>([])
const busquedaTarjetas = ref('')
const cargandoTarjetas = ref(false)
const tarjetaAjustando = ref('')
const tarjetaQuitando = ref('')
const errorTarjetas = ref('')
const tarjetasFiltradas = computed(() => {
  const consulta = busquedaTarjetas.value.trim().toLocaleLowerCase()
  if (!consulta) return tarjetas.value
  return tarjetas.value.filter((tarjeta) =>
    (tarjeta.nombre + ' ' + tarjeta.telefono).toLocaleLowerCase().includes(consulta)
  )
})

const cargarTarjetas = async () => {
  cargandoTarjetas.value = true
  errorTarjetas.value = ''
  try {
    tarjetas.value = await obtenerTarjetasLealtad()
  } catch (err) {
    errorTarjetas.value = err instanceof Error ? err.message : 'No se pudo cargar la lista de clientes.'
  } finally {
    cargandoTarjetas.value = false
  }
}

const ajustarVisitas = async (tarjeta: (typeof tarjetas.value)[number], cambio: 1 | -1) => {
  if (tarjetaAjustando.value) return
  tarjetaAjustando.value = tarjeta.tarjetaId
  errorTarjetas.value = ''
  try {
    const actualizada = await ajustarVisitasLealtad(tarjeta.tarjetaId, cambio)
    const indice = tarjetas.value.findIndex((item) => item.tarjetaId === tarjeta.tarjetaId)
    if (indice >= 0) tarjetas.value[indice] = { ...tarjetas.value[indice], ...actualizada }
  } catch (err) {
    errorTarjetas.value = err instanceof Error ? err.message : 'No se pudo ajustar la visita.'
  } finally {
    tarjetaAjustando.value = ''
  }
}

const quitarTarjeta = async (tarjeta: (typeof tarjetas.value)[number]) => {
  if (tarjetaQuitando.value || tarjetaAjustando.value || !window.confirm(`¿Quitar a ${tarjeta.nombre} del programa de lealtad? Se conservarán su registro de cliente y el historial de visitas.`)) return
  tarjetaQuitando.value = tarjeta.tarjetaId
  errorTarjetas.value = ''
  try {
    await removerTarjetaLealtad(tarjeta.tarjetaId)
    tarjetas.value = tarjetas.value.filter((item) => item.tarjetaId !== tarjeta.tarjetaId)
    if (configuracion.value) configuracion.value.tarjetasActivas = Math.max(0, configuracion.value.tarjetasActivas - 1)
  } catch (err) {
    errorTarjetas.value = err instanceof Error ? err.message : 'No se pudo quitar la tarjeta del programa.'
  } finally {
    tarjetaQuitando.value = ''
  }
}
const premioBorrador = ref('')
const tipoDescuentoBorrador = ref<'porcentaje' | 'dinero'>('porcentaje')
const valorDescuentoBorrador = ref(10)
const visitasMetaBorrador = ref(10)
const qrDataUrl = ref('')
const urlRegistro = ref('')
const cargando = ref(false)
const guardandoPremio = ref(false)
const error = ref('')

const cargarDatos = async () => {
  cargando.value = true
  error.value = ''
  try {
    const datos = await obtenerConfiguracionLealtad()
    configuracion.value = datos
    premioBorrador.value = datos.premio
    tipoDescuentoBorrador.value = datos.tipoDescuento
    valorDescuentoBorrador.value = datos.valorDescuento
    visitasMetaBorrador.value = datos.visitasMeta
    const url = urlRegistroLealtad()
    urlRegistro.value = url
    qrDataUrl.value = url ? await generarQrLealtad(url) : ''
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo cargar el programa de lealtad.'
  } finally {
    cargando.value = false
  }
}

const generarQrLealtad = async (url: string): Promise<string> => {
  const qr = QRCode.create(url, { errorCorrectionLevel: 'H' })
  const tamano = 1000
  const zonaSilenciosa = 4
  const ladoQr = 960
  const origen = (tamano - ladoQr) / 2
  const modulo = ladoQr / (qr.modules.size + zonaSilenciosa * 2)
  const lienzo = document.createElement('canvas')
  lienzo.width = tamano
  lienzo.height = tamano
  const contexto = lienzo.getContext('2d')
  if (!contexto) throw new Error('No se pudo preparar el QR.')

  contexto.fillStyle = '#ffffff'
  contexto.fillRect(0, 0, tamano, tamano)
  const tinta = contexto.createLinearGradient(40, 40, tamano - 40, tamano - 40)
  tinta.addColorStop(0, '#123a66')
  tinta.addColorStop(0.5, '#397e9f')
  tinta.addColorStop(1, '#168e83')
  const centro = (fila: number, columna: number) => ({
    x: origen + (columna + zonaSilenciosa + 0.5) * modulo,
    y: origen + (fila + zonaSilenciosa + 0.5) * modulo
  })

  for (let fila = 0; fila < qr.modules.size; fila += 1) {
    for (let columna = 0; columna < qr.modules.size; columna += 1) {
      const activo = qr.modules.data[fila * qr.modules.size + columna]
      const localizador = (fila < 7 && columna < 7) || (fila < 7 && columna >= qr.modules.size - 7) || (fila >= qr.modules.size - 7 && columna < 7)
      if (!activo || localizador) continue
      const punto = centro(fila, columna)
      contexto.beginPath()
      contexto.arc(punto.x, punto.y, modulo * 0.44, 0, Math.PI * 2)
      contexto.fillStyle = tinta
      contexto.fill()
    }
  }

  const dibujarLocalizador = (columna: number, fila: number) => {
    const x = origen + (columna + zonaSilenciosa + 3.5) * modulo
    const y = origen + (fila + zonaSilenciosa + 3.5) * modulo
    for (const [radio, color] of [[3.5, tinta], [2.45, '#ffffff'], [1.4, tinta]] as const) {
      contexto.beginPath()
      contexto.arc(x, y, modulo * radio, 0, Math.PI * 2)
      contexto.fillStyle = color
      contexto.fill()
    }
  }
  dibujarLocalizador(0, 0)
  dibujarLocalizador(qr.modules.size - 7, 0)
  dibujarLocalizador(0, qr.modules.size - 7)

  const centroQr = tamano / 2
  const anchoTarjeta = ladoQr * 0.16
  const altoTarjeta = ladoQr * 0.19
  const tarjetaX = centroQr - anchoTarjeta / 2
  const tarjetaY = centroQr - altoTarjeta / 2
  contexto.shadowColor = 'rgba(18, 58, 102, 0.3)'
  contexto.shadowBlur = 18
  contexto.shadowOffsetY = 5
  contexto.beginPath()
  contexto.roundRect(tarjetaX, tarjetaY, anchoTarjeta, altoTarjeta, 18)
  const fondoTarjeta = contexto.createLinearGradient(tarjetaX, tarjetaY, tarjetaX + anchoTarjeta, tarjetaY + altoTarjeta)
  fondoTarjeta.addColorStop(0, '#dff5fc')
  fondoTarjeta.addColorStop(1, '#a8dff0')
  contexto.fillStyle = fondoTarjeta
  contexto.fill()
  contexto.shadowColor = 'transparent'
  contexto.shadowBlur = 0
  contexto.shadowOffsetY = 0
  contexto.lineWidth = 5
  contexto.strokeStyle = '#397e9f'
  contexto.stroke()

  const imagen = await new Promise<HTMLImageElement>((resolve, reject) => {
    const logo = new Image()
    logo.onload = () => resolve(logo)
    logo.onerror = reject
    logo.src = imagenCupon
  })
  const xFuente = imagen.naturalWidth * 0.24
  const yFuente = imagen.naturalHeight * 0.17
  const anchoFuente = imagen.naturalWidth * 0.52
  const altoFuente = imagen.naturalHeight * 0.62
  const ladoLogo = ladoQr * 0.095
  const altoLogo = ladoLogo * altoFuente / anchoFuente
  contexto.drawImage(
    imagen,
    xFuente,
    yFuente,
    anchoFuente,
    altoFuente,
    centroQr - ladoLogo / 2,
    centroQr - altoLogo / 2,
    ladoLogo,
    altoLogo
  )
  return lienzo.toDataURL('image/png')
}

const guardarPremio = async () => {
  guardandoPremio.value = true
  error.value = ''
  try {
    configuracion.value = await actualizarPremioLealtad(premioBorrador.value, tipoDescuentoBorrador.value, valorDescuentoBorrador.value, visitasMetaBorrador.value)
    premioBorrador.value = configuracion.value.premio
    tipoDescuentoBorrador.value = configuracion.value.tipoDescuento
    valorDescuentoBorrador.value = configuracion.value.valorDescuento
    visitasMetaBorrador.value = configuracion.value.visitasMeta
    const toast = await toastController.create({
      message: 'Premio del programa actualizado.',
      duration: 2200,
      color: 'success'
    })
    await toast.present()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo guardar el premio.'
  } finally {
    guardandoPremio.value = false
  }
}

onMounted(() => {
  void cargarDatos()
  void cargarTarjetas()
})
</script>

<style scoped>
.lealtad-panel { display: grid; gap: 24px; padding: 28px; border: 1px solid #dce8ee; border-radius: 22px; background: linear-gradient(145deg, #fff 0%, #f5fbfd 100%); box-shadow: 0 12px 30px rgba(18, 58, 102, .08); color: #0a1f38; }
.lealtad-encabezado { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; }
.lealtad-etiqueta { margin: 0 0 8px; color: #168b83; font-size: .73rem; font-weight: 900; letter-spacing: .12em; }
.lealtad-encabezado h2 { margin: 0; color: #123a66; font-size: clamp(1.45rem, 3vw, 2rem); }
.lealtad-contador { display: grid; min-width: 122px; justify-items: center; padding: 13px 18px; border: 1px solid #d5e8ed; border-radius: 16px; background: #eff8fa; color: #123a66; }
.lealtad-contador strong { font-size: 1.6rem; }
.lealtad-contador span { color: #61778e; font-size: .75rem; font-weight: 700; }
.lealtad-contenido { display: grid; grid-template-columns: minmax(230px, 340px) minmax(0, 1fr); align-items: center; gap: clamp(24px, 5vw, 54px); padding: clamp(18px, 4vw, 34px); border: 1px solid rgba(169,227,225,.35); border-radius: 20px; background: linear-gradient(145deg, #123a66, #0a2544); color: #fff; box-shadow: 0 12px 30px rgba(18,58,102,.18); }
.lealtad-qr-marco { display: grid; width: 100%; place-items: center; padding: 0; border: 0; background: transparent; }
.lealtad-qr-cupon { display: grid; width: 100%; justify-items: center; gap: 8px; }
.lealtad-qr-sello { color: #6d829c; font-size: .62rem; font-weight: 800; text-align: center; }
.lealtad-qr-visual { position: relative; width: min(100%, 320px); aspect-ratio: 1; overflow: hidden; border-radius: 24px; background: #fff; box-shadow: 0 14px 34px rgba(3,20,42,.24); }
.lealtad-qr-visual img { display: block; width: 100%; height: 100%; object-fit: contain; }
.lealtad-qr-escaneo { position: absolute; z-index: 2; top: 4%; left: 6%; right: 6%; height: 5%; border-radius: 20px; background: linear-gradient(180deg, transparent, rgba(22,139,131,.2) 42%, rgba(141,229,216,.34) 50%, rgba(22,139,131,.2) 58%, transparent); box-shadow: 0 0 16px rgba(22,139,131,.24); pointer-events: none; animation: lealtad-scan 2.8s ease-in-out infinite; }
.lealtad-qr-cupon strong { color: #b7f4e8; font-size: .7rem; letter-spacing: .08em; text-align: center; }
.lealtad-qr-cargando { display: grid; justify-items: center; gap: 10px; color: #123a66; }
.lealtad-instrucciones { display: grid; justify-items: start; gap: 14px; color: #fff; }
.lealtad-label { margin-top: 6px; font-size: .83rem; font-weight: 800; }
.lealtad-premio-editor { display: flex; width: 100%; gap: 8px; }
.lealtad-premio-editor input { min-width: 0; flex: 1; padding: 11px 12px; border: 1px solid #c9dde7; border-radius: 10px; background: #fff; color: #123a66; font: inherit; }
.lealtad-premio-editor select { min-width: 110px; padding: 10px; border: 1px solid #c9dde7; border-radius: 10px; background: #fff; color: #123a66; font: inherit; }
.lealtad-meta-input { width: 100%; max-width: 180px; padding: 11px 12px; border: 1px solid #c9dde7; border-radius: 10px; background: #fff !important; color: #123a66 !important; color-scheme: light; font: inherit; }
.lealtad-premio-editor button, .lealtad-boton-principal, .lealtad-boton-secundario { display: inline-flex; align-items: center; padding: 10px 14px; border: 1px solid #cbdde6; border-radius: 10px; background: #f6fbfd; color: #123a66; font: inherit; font-weight: 800; cursor: pointer; text-decoration: none; }
.lealtad-premio-editor button { background: #a9e3e1; color: #123a66; }
.lealtad-premio-editor button:disabled, .lealtad-boton-secundario:disabled { cursor: not-allowed; opacity: .6; }
.lealtad-acciones { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 6px; }
.lealtad-boton-principal { background: #123a66; color: #fff; }
.lealtad-error { margin: 0; color: #ffe3dc; font-weight: 700; }
.lealtad-suscritos { display: grid; gap: 14px; padding: clamp(18px, 3vw, 28px); border: 1px solid #dce8ee; border-radius: 20px; background: #fff; color: #0a1f38; }
.suscritos-encabezado { display: flex; align-items: center; justify-content: space-between; gap: 14px; }
.suscritos-encabezado h3 { margin: 0; color: #123a66; font-size: 1.35rem; }
.suscritos-encabezado button { min-height: 40px; padding: 0 14px; border: 1px solid #cbdde6; border-radius: 10px; background: #f6fbfd; color: #123a66; font: inherit; font-weight: 800; cursor: pointer; }
.suscritos-busqueda { width: 100%; max-width: 420px; min-height: 42px; padding: 0 12px; border: 1px solid #cbdde6 !important; border-radius: 10px; background: #fff !important; background-color: #fff !important; color: #123a66 !important; -webkit-text-fill-color: #123a66; color-scheme: light; font: inherit; }
.suscritos-busqueda::placeholder { color: #61778e !important; -webkit-text-fill-color: #61778e; opacity: 1; }
.suscritos-busqueda:focus { border-color: #168b83 !important; outline: 3px solid rgba(22,139,131,.18); outline-offset: 1px; }
.suscritos-lista { display: grid; gap: 9px; }
.suscrito-card { display: grid; grid-template-columns: minmax(150px, 1fr) minmax(100px, 160px) auto; align-items: center; gap: 18px; padding: 14px; border: 1px solid #e1eaf0; border-radius: 14px; background: #fbfdfe; }
.suscrito-identidad { display: grid; gap: 3px; }
.suscrito-identidad strong { color: #123a66; }
.suscrito-identidad span { color: #61778e; font-size: .86rem; }
.suscrito-identidad .suscrito-premio { color: #8a6200; font-weight: 750; }
.suscrito-progreso { display: grid; gap: 7px; text-align: right; color: #123a66; }
.suscrito-progreso strong { font-size: 1.15rem; }
.suscrito-progreso small { color: #71859a; font-size: .76rem; }
.suscrito-barra { height: 7px; overflow: hidden; border-radius: 99px; background: #e5eef2; }
.suscrito-barra span { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #168b83, #65c5ae); transition: width .2s ease; }
.suscrito-controles { display: flex; gap: 8px; }
.suscrito-controles button { width: 38px; height: 38px; border: 1px solid #cbdde6; border-radius: 11px; background: #fff; color: #123a66; font-size: 1.35rem; font-weight: 800; cursor: pointer; }
.suscrito-controles button:last-child { background: #e9f7f4; color: #116f63; }
.suscrito-controles button.suscrito-quitar { background: #fff1f0; color: #b42318; }
.suscrito-controles button:disabled, .suscritos-encabezado button:disabled { cursor: not-allowed; opacity: .45; }
.suscritos-vacio, .suscritos-error { margin: 0; color: #61778e; }
.suscritos-error { color: #b42318; font-weight: 750; }
@keyframes lealtad-scan { 0% { top: 4%; opacity: 0; } 15%, 85% { opacity: 1; } 100% { top: 82%; opacity: 0; } }
@media (max-width: 700px) { .lealtad-panel { padding: 18px; } .lealtad-encabezado { flex-direction: column; } .lealtad-contenido { grid-template-columns: 1fr; justify-items: center; } .lealtad-qr-marco { width: min(100%, 320px); } .lealtad-instrucciones { width: 100%; } .lealtad-premio-editor { flex-direction: column; } }
@media (max-width: 560px) { .suscritos-encabezado { align-items: flex-start; flex-direction: column; } .suscrito-card { grid-template-columns: 1fr auto; gap: 10px; } .suscrito-progreso { grid-column: 1; grid-row: 2; text-align: left; } .suscrito-controles { grid-column: 2; grid-row: 1 / span 2; } }
</style>
