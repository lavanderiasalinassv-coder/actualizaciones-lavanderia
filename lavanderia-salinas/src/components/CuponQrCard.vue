<template>
  <article class="cupon-card" :class="{
    'cupon-expirado': expirada,
    'cupon-inactivo': !promocion.vigente && !expirada,
    'cupon-verde-magenta': esCuponVerdeMagenta
  }">
    <div class="cupon-copy">
      <span class="cupon-sello">LAVANDERÍA SALINAS · AHUACHAPÁN</span>
      <span class="cupon-estado" :class="{ expirado: expirada, inactivo: !vigente && !expirada }">{{ estadoCupon }}</span>
      <h3>{{ promocion.nombre }}</h3>
      <p class="cupon-descuento">{{ textoDescuento }}</p>
      <p v-if="promocion.descripcion" class="cupon-descripcion">{{ promocion.descripcion }}</p>
      <p class="cupon-vigencia">Válido hasta {{ fechaFin }}</p>
      <p class="cupon-limite">{{ textoLimiteUsos }}</p>
    </div>

    <div class="cupon-qr-contenedor">
      <button
        v-if="imagenQr"
        type="button"
        class="cupon-qr-preview"
        :aria-label="`Ampliar QR de ${promocion.nombre}`"
        @click="abrirQrGrande"
      >
        <img :src="imagenQr" :alt="`Cupón QR para ${promocion.nombre}`" class="cupon-qr" />
      </button>
      <span v-else-if="errorQr" class="cupon-qr-error" role="status">No se pudo generar el QR</span>
      <span v-else class="cupon-qr-cargando" role="status">Preparando QR...</span>
      <a
        v-if="imagenQr"
        class="cupon-descargar"
        :href="imagenQr"
        :download="`cupon-${nombreArchivo}.png`"
        :aria-label="`Descargar cupón ${promocion.nombre}`"
      >
        Descargar QR
      </a>
    </div>

    <div class="cupon-compartir">
      <button class="compartir-whatsapp" type="button" :disabled="!vigente" @click="abrirCompartir('whatsapp')">
        <ion-icon :icon="logoWhatsapp" />
        WhatsApp
      </button>
      <button class="compartir-correo" type="button" :disabled="!imagenQr || !vigente" @click="abrirCompartir('correo')">
        <ion-icon :icon="mailOutline" />
        Correo
      </button>
    </div>

    <form v-if="canalCompartir" class="compartir-form" @submit.prevent="compartirCupon">
      <label :for="`buscar-cliente-${promocion.id}`">
        {{ canalCompartir === 'whatsapp' ? 'Buscar cliente por nombre o teléfono' : 'Buscar cliente por nombre' }}
      </label>
      <input
        :id="`buscar-cliente-${promocion.id}`"
        v-model="busquedaCliente"
        type="search"
        autocomplete="off"
        :placeholder="canalCompartir === 'whatsapp' ? 'Escribe un nombre o teléfono' : 'Escribe el nombre del cliente'"
        @input="manejarCambioBusquedaCliente"
      />
      <div v-if="busquedaCliente.trim().length >= 2 && !clienteSeleccionado" class="cliente-sugerencias" role="listbox" aria-label="Clientes encontrados">
        <button
          v-for="cliente in clientesCoincidentes"
          :key="cliente.id"
          type="button"
          class="cliente-sugerencia"
          role="option"
          @mousedown.prevent="seleccionarCliente(cliente)"
        >
          <strong>{{ cliente.nombre }}</strong>
          <span>{{ canalCompartir === 'whatsapp' ? cliente.celular || 'Sin teléfono registrado' : cliente.correo || 'Sin correo registrado' }}</span>
        </button>
        <p v-if="!clientesCargando && !clientesCoincidentes.length" class="cliente-sin-coincidencias">
          No encontramos ese nombre; puedes escribir el contacto manualmente.
        </p>
      </div>

      <label :for="`nombre-destinatario-${promocion.id}`">Nombre del cliente *</label>
      <input
        :id="`nombre-destinatario-${promocion.id}`"
        v-model="nombreDestinatario"
        type="text"
        autocomplete="name"
        placeholder="Escribe el nombre para personalizar el mensaje"
        required
      />

      <label :for="`compartir-${promocion.id}`">
        {{ canalCompartir === 'whatsapp' ? 'Número de WhatsApp *' : 'Correo del destinatario *' }}
      </label>
      <input
        :id="`compartir-${promocion.id}`"
        v-model="destinatario"
        :type="canalCompartir === 'whatsapp' ? 'tel' : 'email'"
        :placeholder="canalCompartir === 'whatsapp' ? '+503 7000 0000' : 'cliente@correo.com'"
        :autocomplete="canalCompartir === 'whatsapp' ? 'tel' : 'email'"
        @input="errorCompartir = ''"
        required
      />
      <p v-if="clientesCargando && busquedaCliente.trim().length >= 2" class="cliente-sin-coincidencias" role="status">
        Cargando clientes...
      </p>
      <p v-if="errorCompartir" class="compartir-error" role="alert">{{ errorCompartir }}</p>
      <div class="compartir-form-acciones">
        <button type="button" class="compartir-cancelar" @click="canalCompartir = null">Cancelar</button>
        <button type="submit" class="compartir-enviar" :disabled="compartiendo || (canalCompartir === 'correo' && !imagenQr)">
          <ion-icon :icon="canalCompartir === 'whatsapp' ? logoWhatsapp : sendOutline" />
          {{ compartiendo ? 'Enviando...' : 'Compartir cupón' }}
        </button>
      </div>
    </form>
  </article>

  <Teleport to="body">
    <div
      v-if="mostrarQrGrande"
      ref="modalQrRef"
      class="cupon-qr-modal"
      role="dialog"
      aria-modal="true"
      :aria-label="`QR ampliado para ${promocion.nombre}`"
      tabindex="-1"
      @click.self="cerrarQrGrande"
      @keydown.esc.prevent="cerrarQrGrande"
    >
      <div class="cupon-qr-modal-contenido">
        <button type="button" class="cupon-qr-cerrar" aria-label="Cerrar QR ampliado" @click="cerrarQrGrande">
          <ion-icon :icon="closeOutline" />
        </button>
        <img :src="imagenQr" :alt="`Código QR de ${promocion.nombre}`" class="cupon-qr-grande" />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { IonIcon, toastController } from '@ionic/vue'
import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { closeOutline, logoWhatsapp, mailOutline, sendOutline } from 'ionicons/icons'
import QRCode from 'qrcode'
import imagenCupon from '@/assets/cupon.png'
import { enviarCorreoHTML } from '@/composables/useCorreo'
import { useClientes, type ClienteConEstado } from '@/composables/useClientes'
import type { Promocion } from '@/composables/usePromociones'
import { crearPayloadCupon } from '@/utils/cuponQr'

const props = defineProps<{ promocion: Promocion }>()

const imagenQr = ref('')
const errorQr = ref(false)
const mostrarQrGrande = ref(false)
const modalQrRef = ref<HTMLDivElement | null>(null)
const canalCompartir = ref<'whatsapp' | 'correo' | null>(null)
const destinatario = ref('')
const nombreDestinatario = ref('')
const busquedaCliente = ref('')
const clienteSeleccionado = ref<ClienteConEstado | null>(null)
const errorCompartir = ref('')
const compartiendo = ref(false)
const { clientesConEstado, cargando: clientesCargando } = useClientes()
const nombreArchivo = computed(() => props.promocion.nombre
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-'))
const textoDescuento = computed(() => props.promocion.tipoDescuento === 'porcentaje'
  ? `${Number(props.promocion.valor).toFixed(2)}% de descuento`
  : `$${Number(props.promocion.valor).toFixed(2)} de descuento`)
const esCuponDorado = computed(() =>
  (props.promocion.tipoDescuento === 'porcentaje' && Number(props.promocion.valor) >= 50) ||
  (props.promocion.tipoDescuento === 'dinero' && Number(props.promocion.valor) >= 20)
)
const esCuponVerdeMagenta = computed(() =>
  (props.promocion.tipoDescuento === 'porcentaje' && Number(props.promocion.valor) >= 30 && Number(props.promocion.valor) < 50) ||
  (props.promocion.tipoDescuento === 'dinero' && Number(props.promocion.valor) >= 10 && Number(props.promocion.valor) < 20)
)
const fechaFin = computed(() => new Date(`${props.promocion.fechaFin}T00:00:00`).toLocaleDateString('es-SV', {
  day: '2-digit',
  month: 'long',
  year: 'numeric'
}))
const hoy = computed(() => new Date().toISOString().split('T')[0])
const expirada = computed(() => props.promocion.fechaFin < hoy.value)
const vigente = computed(() => props.promocion.vigente && props.promocion.fechaInicio <= hoy.value && props.promocion.fechaFin >= hoy.value)
const estadoCupon = computed(() => expirada.value
  ? 'No vigente · Promoción expirada'
  : vigente.value
    ? 'Vigente'
    : 'No vigente')
const maxUsosDefinido = computed(() =>
  typeof props.promocion.maxUsosPorCliente === 'number' &&
  Number.isInteger(props.promocion.maxUsosPorCliente) &&
  props.promocion.maxUsosPorCliente >= 1
)
const textoLimiteUsos = computed(() => {
  const maxUsos = props.promocion.maxUsosPorCliente
  return maxUsosDefinido.value
    ? `Límite por cliente: máximo ${maxUsos} ${maxUsos === 1 ? 'uso' : 'usos'}`
    : 'Límite por cliente: sin límite'
})
const restriccionesCupon = computed(() => {
  const descripcion = props.promocion.descripcion.trim()
  const restricciones = descripcion ? [`🧺 ${descripcion}`] : []
  restricciones.push(`📅 Disponible hasta ${fechaFin.value}.`)

  if (maxUsosDefinido.value) {
    restricciones.push(`🎟️ ${textoLimiteUsos.value}.`)
  }

  return restricciones
})
const clientesCoincidentes = computed(() => {
  const busqueda = busquedaCliente.value
  const consulta = busqueda
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase()
  const consultaTelefono = busqueda.replace(/\D/g, '')
  const buscarPorTelefono = canalCompartir.value === 'whatsapp' && consultaTelefono.length >= 3
  if (consulta.length < 2 && !buscarPorTelefono) return []

  return clientesConEstado.value
    .filter((cliente) => {
      const coincideNombre = consulta.length >= 2 && cliente.nombre
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase()
        .includes(consulta)
      const coincideTelefono = buscarPorTelefono && cliente.celular.replace(/\D/g, '').includes(consultaTelefono)
      return coincideNombre || coincideTelefono
    })
    .slice(0, 6)
})

const generarQr = async (promocionId: string) => {
  imagenQr.value = ''
  errorQr.value = false

  try {
    const qr = QRCode.create(crearPayloadCupon(promocionId), { errorCorrectionLevel: 'H' })
    const tamano = 480
    const tamanoQr = 400
    const origenQr = (tamano - tamanoQr) / 2
    const zonaSilenciosa = 4
    const tamanoModulo = tamanoQr / (qr.modules.size + zonaSilenciosa * 2)
    const lienzo = document.createElement('canvas')
    lienzo.width = tamano
    lienzo.height = tamano
    const contexto = lienzo.getContext('2d')
    if (!contexto) throw new Error('Canvas no disponible')

    contexto.fillStyle = '#ffffff'
    contexto.fillRect(0, 0, tamano, tamano)
    const colorBurbujas = contexto.createLinearGradient(origenQr, 0, origenQr + tamanoQr, tamano)
    if (esCuponDorado.value) {
      colorBurbujas.addColorStop(0, '#805000')
      colorBurbujas.addColorStop(0.38, '#a87500')
      colorBurbujas.addColorStop(0.72, '#936000')
      colorBurbujas.addColorStop(1, '#754700')
    } else if (esCuponVerdeMagenta.value) {
      colorBurbujas.addColorStop(0, '#146b45')
      colorBurbujas.addColorStop(0.36, '#a40b68')
      colorBurbujas.addColorStop(0.7, '#087653')
      colorBurbujas.addColorStop(1, '#820d58')
    } else {
      colorBurbujas.addColorStop(0, '#123a66')
      colorBurbujas.addColorStop(0.35, '#397e9f')
      colorBurbujas.addColorStop(0.68, '#168e83')
      colorBurbujas.addColorStop(1, '#123a66')
    }
    const colorBurbujaBorde = esCuponDorado.value ? '#a87500' : esCuponVerdeMagenta.value ? '#a40b68' : '#397e9f'
    const colorBurbujaFondo = esCuponDorado.value
      ? 'rgba(168, 117, 0, 0.12)'
      : esCuponVerdeMagenta.value
        ? 'rgba(164, 11, 104, 0.12)'
        : 'rgba(57, 126, 159, 0.12)'
    const centroXModulo = (columna: number) => origenQr + (columna + zonaSilenciosa + 0.5) * tamanoModulo
    const centroYModulo = (fila: number) => origenQr + (fila + zonaSilenciosa + 0.5) * tamanoModulo

    for (let fila = 0; fila < qr.modules.size; fila += 1) {
      for (let columna = 0; columna < qr.modules.size; columna += 1) {
        const indice = fila * qr.modules.size + columna
        const moduloActivo = qr.modules.data[indice]
        const enLocalizador =
          (fila < 7 && columna < 7) ||
          (fila < 7 && columna >= qr.modules.size - 7) ||
          (fila >= qr.modules.size - 7 && columna < 7)
        if (!moduloActivo || enLocalizador) continue

        contexto.beginPath()
        contexto.arc(centroXModulo(columna), centroYModulo(fila), tamanoModulo * 0.45, 0, Math.PI * 2)
        contexto.fillStyle = colorBurbujas
        contexto.fill()
      }
    }

    const dibujarLocalizador = (columna: number, fila: number) => {
      const centroX = origenQr + (columna + zonaSilenciosa + 3.5) * tamanoModulo
      const centroY = origenQr + (fila + zonaSilenciosa + 3.5) * tamanoModulo
      contexto.fillStyle = colorBurbujas
      contexto.beginPath()
      contexto.arc(centroX, centroY, tamanoModulo * 3.5, 0, Math.PI * 2)
      contexto.fill()
      contexto.fillStyle = '#ffffff'
      contexto.beginPath()
      contexto.arc(centroX, centroY, tamanoModulo * 2.45, 0, Math.PI * 2)
      contexto.fill()
      contexto.fillStyle = colorBurbujas
      contexto.beginPath()
      contexto.arc(centroX, centroY, tamanoModulo * 1.42, 0, Math.PI * 2)
      contexto.fill()
    }

    dibujarLocalizador(0, 0)
    dibujarLocalizador(qr.modules.size - 7, 0)
    dibujarLocalizador(0, qr.modules.size - 7)

    const dibujarBurbuja = (x: number, y: number, radio: number) => {
      contexto.beginPath()
      contexto.arc(x, y, radio, 0, Math.PI * 2)
      contexto.fillStyle = colorBurbujaFondo
      contexto.fill()
      contexto.lineWidth = 2
      contexto.strokeStyle = colorBurbujaBorde
      contexto.stroke()
      contexto.beginPath()
      contexto.arc(x - radio * 0.3, y - radio * 0.3, Math.max(1.5, radio * 0.2), 0, Math.PI * 2)
      contexto.fillStyle = 'rgba(255, 255, 255, 0.9)'
      contexto.fill()
    }

    const dibujarGrupoBurbujas = (x: number, y: number, espejo = false) => {
      const direccion = espejo ? -1 : 1
      dibujarBurbuja(x, y, 8)
      dibujarBurbuja(x + direccion * 10, y - 8, 4.5)
      dibujarBurbuja(x - direccion * 7, y + 10, 3.5)
    }

    dibujarGrupoBurbujas(24, 24)
    dibujarGrupoBurbujas(tamano - 24, tamano - 24, true)

    contexto.beginPath()
    contexto.roundRect(9, 9, tamano - 18, tamano - 18, 24)
    contexto.lineWidth = 6
    contexto.strokeStyle = colorBurbujas
    contexto.stroke()

    const logoCuponImagen = await cargarImagen(imagenCupon)
    const centro = tamano / 2
    const ladoLogo = tamanoQr * 0.175
    const logoAnchoFuente = logoCuponImagen.naturalWidth * 0.52
    const logoAltoFuente = logoCuponImagen.naturalHeight * 0.62
    const logoXFuente = logoCuponImagen.naturalWidth * 0.24
    const logoYFuente = logoCuponImagen.naturalHeight * 0.17
    const altoLogo = ladoLogo * logoAltoFuente / logoAnchoFuente
    const tarjetaAncho = tamanoQr * 0.28
    const tarjetaAlto = tamanoQr * 0.33
    const tarjetaX = centro - tarjetaAncho / 2
    const tarjetaY = centro - tarjetaAlto / 2
    contexto.shadowColor = esCuponDorado.value ? 'rgba(128, 80, 0, 0.24)' : 'rgba(18, 58, 102, 0.24)'
    contexto.shadowBlur = 14
    contexto.shadowOffsetY = 3
    contexto.beginPath()
    contexto.roundRect(tarjetaX, tarjetaY, tarjetaAncho, tarjetaAlto, 18)
    const fondoTarjeta = contexto.createLinearGradient(tarjetaX, tarjetaY, tarjetaX + tarjetaAncho, tarjetaY + tarjetaAlto)
    fondoTarjeta.addColorStop(0, esCuponDorado.value ? '#fff7df' : esCuponVerdeMagenta.value ? '#e8f7ed' : '#dff5fc')
    fondoTarjeta.addColorStop(1, esCuponDorado.value ? '#f0d58a' : esCuponVerdeMagenta.value ? '#f4dced' : '#a8dff0')
    contexto.fillStyle = fondoTarjeta
    contexto.fill()
    contexto.beginPath()
    contexto.roundRect(tarjetaX, tarjetaY, tarjetaAncho, tarjetaAlto, 18)
    contexto.shadowColor = 'transparent'
    contexto.shadowBlur = 0
    contexto.shadowOffsetY = 0
    contexto.lineWidth = 3
    contexto.strokeStyle = colorBurbujaBorde
    contexto.stroke()

    contexto.drawImage(
      logoCuponImagen,
      logoXFuente,
      logoYFuente,
      logoAnchoFuente,
      logoAltoFuente,
      centro - ladoLogo / 2,
      centro - altoLogo / 2,
      ladoLogo,
      altoLogo
    )
    imagenQr.value = lienzo.toDataURL('image/png')
  } catch {
    errorQr.value = true
  }
}

const escaparHtml = (texto: string) => texto.replace(/[&<>"']/g, (caracter) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[caracter] || caracter))

const abrirQrGrande = async () => {
  if (!imagenQr.value) return
  mostrarQrGrande.value = true
  await nextTick()
  modalQrRef.value?.focus()
}

const cerrarQrGrande = () => {
  mostrarQrGrande.value = false
}

const abrirCompartir = (canal: 'whatsapp' | 'correo') => {
  canalCompartir.value = canal
  destinatario.value = ''
  nombreDestinatario.value = ''
  busquedaCliente.value = ''
  clienteSeleccionado.value = null
  errorCompartir.value = ''
}

const seleccionarCliente = (cliente: ClienteConEstado) => {
  clienteSeleccionado.value = cliente
  busquedaCliente.value = cliente.nombre
  nombreDestinatario.value = cliente.nombre
  destinatario.value = canalCompartir.value === 'whatsapp' ? cliente.celular : cliente.correo
  errorCompartir.value = destinatario.value
    ? ''
    : canalCompartir.value === 'whatsapp'
      ? 'Este cliente no tiene teléfono registrado; escribe uno manualmente.'
      : 'Este cliente no tiene correo registrado; escribe uno manualmente.'
}

const manejarCambioBusquedaCliente = () => {
  if (!clienteSeleccionado.value || busquedaCliente.value === clienteSeleccionado.value.nombre) return
  clienteSeleccionado.value = null
  destinatario.value = ''
  nombreDestinatario.value = ''
}

const compartirCupon = async (): Promise<boolean> => {
  if (!canalCompartir.value || !destinatario.value.trim() || !nombreDestinatario.value.trim() || compartiendo.value) return false
  if (canalCompartir.value === 'whatsapp') {
    const digitos = destinatario.value.replace(/\D/g, '')
    if (digitos.length < 8 || digitos.length > 15) {
      errorCompartir.value = 'Ingresa un número con entre 8 y 15 dígitos.'
      return false
    }
  }
  if (canalCompartir.value === 'correo' && !imagenQr.value) {
    errorCompartir.value = 'Espera a que termine de generarse el QR.'
    return false
  }

  compartiendo.value = true
  errorCompartir.value = ''
  const nombre = escaparHtml(props.promocion.nombre)
  const nombreCliente = nombreDestinatario.value.trim()
  const nombreClienteSeguro = escaparHtml(nombreCliente)
  const descuento = escaparHtml(textoDescuento.value)
  const vigencia = escaparHtml(fechaFin.value)
  const descripcionPlano = props.promocion.descripcion.trim()
  const restricciones = restriccionesCupon.value

  try {
    if (canalCompartir.value === 'whatsapp') {
      const mensaje = [
        `¡Hola, ${nombreCliente}! 👋`,
        '💙 Gracias por confiar en Lavandería Salinas.',
        `🎁 Te compartimos un beneficio especial para tu próxima visita: ${props.promocion.nombre}.`,
        `✨ ${textoDescuento.value}.`,
        descripcionPlano ? `🧺 ${descripcionPlano}` : '',
        '📲 Para hacerlo válido, presenta este cupón QR en nuestra sucursal al realizar tu pedido.',
        '¡Será un gusto atenderte nuevamente! Que tengas un excelente día. 🌷',
        '',
        '📌 Restricciones del cupón:',
        ...restricciones
      ].join('\n')
      if (Capacitor.isNativePlatform()) {
        const archivo = await Filesystem.writeFile({
          path: `cupon-${nombreArchivo.value}.png`,
          data: imagenQr.value.split(',')[1],
          directory: Directory.Cache
        })
        await Share.share({
          title: `Cupón ${props.promocion.nombre}`,
          text: mensaje,
          url: archivo.uri,
          dialogTitle: 'Compartir cupón'
        })
      } else {
        window.dispatchEvent(new CustomEvent('whatsapp-compose', {
          detail: {
            phone: destinatario.value,
            message: mensaje,
            image: imagenQr.value
          }
        }))
      }
    } else {
      const descripcion = props.promocion.descripcion
        ? `<p>${escaparHtml(props.promocion.descripcion)}</p>`
        : ''
      const restriccionesHtml = restricciones
        .map((restriccion) => `<li style="margin:0 0 6px">${escaparHtml(restriccion)}</li>`)
        .join('')
      const html = `<div style="margin:0;padding:28px 12px;background:#eef4f8;font-family:Arial,sans-serif;color:#123a66"><table role="presentation" align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;border:1px solid #dce7ee;border-radius:18px;overflow:hidden;background:#ffffff"><tr><td style="padding:24px 28px;background:#123a66;color:#ffffff"><p style="margin:0 0 8px;color:#d9eaf4;font-size:12px;font-weight:bold;letter-spacing:1px">LAVANDERÍA SALINAS · AHUACHAPÁN</p><h1 style="margin:0;font-size:28px;line-height:1.2">¡Un regalo para ti! 🎁</h1></td></tr><tr><td style="padding:28px;text-align:center"><p style="margin:0 0 10px;color:#6a7e91;font-size:16px">Estimado/a <strong>${nombreClienteSeguro}</strong>:</p><p style="margin:0 0 18px;color:#526a80;font-size:15px;line-height:1.7">Agradecemos sinceramente tu confianza y preferencia en <strong>Lavandería Salinas</strong>. Como muestra de nuestro agradecimiento, te compartimos el siguiente cupón QR con un beneficio exclusivo para tu próxima visita. 💙</p><h2 style="margin:0 0 14px;color:#123a66;font-size:24px;line-height:1.25">${nombre}</h2><div style="display:inline-block;margin:0 0 12px;padding:10px 18px;border-radius:999px;background:#fff1dc;color:#a34e1c;font-size:22px;font-weight:bold">${descuento}</div>${descripcion}<p style="margin:8px 0;color:#64798c;font-size:14px">Válido hasta <strong>${vigencia}</strong></p><div style="margin:22px auto 12px;padding:12px;width:240px;max-width:80%;border:1px solid #e2e9ef;border-radius:14px;background:#fbfdff"><img src="cid:codigo-cupon" alt="Cupón QR" width="216" style="display:block;width:100%;height:auto;border:0"></div><p style="margin:12px 0 0;color:#526a80;font-size:14px;line-height:1.6">Para hacerlo válido, solo debes presentarlo en nuestra sucursal al realizar tu pedido. ¡Será un gusto atenderte nuevamente! ✨</p><p style="margin:18px 0 0;color:#24734b;font-size:18px;font-weight:bold">¡Que tengas un excelente día! 🌷</p></td></tr><tr><td style="padding:20px 28px;background:#f5faf7"><h3 style="margin:0 0 10px;color:#123a66;font-size:15px">📌 Restricciones del cupón</h3><ul style="margin:0;padding-left:20px;color:#526a80;font-size:13px;line-height:1.6">${restriccionesHtml}</ul></td></tr></table></div>`
      await enviarCorreoHTML(
        destinatario.value.trim(),
        html,
        `Cupón ${props.promocion.nombre} - Lavandería Salinas`,
        undefined,
        imagenQr.value,
        false
      )
    }

    const toast = await toastController.create({
      message: canalCompartir.value === 'whatsapp' ? 'Cupón preparado para WhatsApp' : 'Cupón enviado por correo',
      duration: 2200,
      color: 'success'
    })
    await toast.present()
    canalCompartir.value = null
    return true
  } catch (error) {
    errorCompartir.value = error instanceof Error ? error.message : 'No se pudo compartir el cupón.'
    return false
  } finally {
    compartiendo.value = false
  }
}

const compartirCuponDesdeOrden = async ({
  canal,
  nombreCliente,
  destinatario: contacto
}: {
  canal: 'whatsapp' | 'correo'
  nombreCliente: string
  destinatario: string
}): Promise<{ ok: boolean; error: string }> => {
  abrirCompartir(canal)
  nombreDestinatario.value = nombreCliente
  destinatario.value = contacto

  if (!imagenQr.value) await generarQr(props.promocion.id)
  if (!imagenQr.value) {
    errorCompartir.value = 'No se pudo generar el QR del cupón.'
    return { ok: false, error: errorCompartir.value }
  }

  const ok = await compartirCupon()
  return { ok, error: errorCompartir.value }
}

const cargarImagen = (src: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
  const imagen = new Image()
  imagen.onload = () => resolve(imagen)
  imagen.onerror = reject
  imagen.src = src
})

watch(() => props.promocion.id, generarQr, { immediate: true })

defineExpose({ compartirCuponDesdeOrden })
</script>

<style scoped>
.cupon-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 20px;
  padding: 20px;
  border: 1px solid rgba(18, 58, 102, 0.14);
  border-left: 5px solid #cf9a35;
  border-radius: 12px;
  background: linear-gradient(120deg, #fffdf8 0%, #ffffff 64%);
  box-shadow: 0 10px 26px rgba(10, 31, 56, 0.07);
}

.cupon-card.cupon-inactivo {
  border-color: #d5dee3;
  background: #f5f7f8;
}

.cupon-card.cupon-expirado {
  border-color: #e7a3a3;
  border-left-color: #c83d3d;
  background: linear-gradient(130deg, #fff5f5, #ffffff 72%);
  box-shadow: 0 6px 18px rgba(166, 44, 44, 0.1);
}

.cupon-card.cupon-verde-magenta:not(.cupon-expirado) {
  border-left-color: #a40b68;
  background: linear-gradient(125deg, #f1faf4 0%, #fff 52%, #fcf0f8 100%);
}

.cupon-copy {
  min-width: 0;
}

.cupon-sello {
  color: #6d829c;
  font-size: 0.68rem;
  font-weight: 800;
}

.cupon-estado {
  display: inline-flex;
  margin-top: 8px;
  padding: 4px 9px;
  border-radius: 999px;
  background: #dff3eb;
  color: #176447;
  font-size: 0.72rem;
  font-weight: 800;
}

.cupon-estado.inactivo {
  background: #e8edf0;
  color: #61717a;
}

.cupon-estado.expirado {
  background: #fee2e2;
  color: #b42323;
}

.cupon-copy h3 {
  margin: 8px 0;
  color: #0a1f38;
  font-size: 1.15rem;
  overflow-wrap: anywhere;
}

.cupon-descuento {
  margin: 0;
  color: #8b661b;
  font-size: 1.15rem;
  font-weight: 900;
}

.cupon-descripcion,
.cupon-vigencia,
.cupon-limite {
  margin: 8px 0 0;
  color: #667b91;
  font-size: 0.84rem;
  overflow-wrap: anywhere;
}

.cupon-qr-contenedor {
  display: grid;
  justify-items: center;
  gap: 8px;
  width: 150px;
}

.cupon-compartir {
  display: flex;
  grid-column: 1 / -1;
  justify-content: flex-end;
  gap: 8px;
}

.cupon-compartir button,
.compartir-form-acciones button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 38px;
  padding: 8px 12px;
  border: 1px solid rgba(18, 58, 102, 0.16);
  border-radius: 8px;
  background: #ffffff;
  color: #123a66;
  font-size: 0.8rem;
  font-weight: 800;
  cursor: pointer;
}

.cupon-compartir .compartir-whatsapp {
  border-color: rgba(37, 149, 91, 0.24);
  color: #197647;
}

.cupon-compartir button:disabled {
  border-color: #d4dde2;
  background: #eef1f3;
  color: #89959c;
  cursor: not-allowed;
}

.compartir-form {
  display: grid;
  grid-column: 1 / -1;
  gap: 8px;
  padding: 14px;
  border: 1px solid rgba(18, 58, 102, 0.13);
  border-radius: 8px;
  background: #f7fafb;
}

.compartir-form label {
  color: #24405f;
  font-size: 0.82rem;
  font-weight: 800;
}

.compartir-form input {
  min-width: 0;
  padding: 10px 12px;
  border: 1px solid rgba(10, 31, 56, 0.16);
  border-radius: 7px;
  background: #ffffff !important;
  color: #0a1f38 !important;
  font: inherit;
}

.cliente-sugerencias {
  display: grid;
  gap: 3px;
  max-height: 180px;
  overflow-y: auto;
  padding: 4px;
  border: 1px solid rgba(18, 58, 102, 0.14);
  border-radius: 8px;
  background: #ffffff;
}

.cliente-sugerencia {
  display: grid;
  gap: 3px;
  width: 100%;
  padding: 9px 10px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: #123a66;
  text-align: left;
  cursor: pointer;
}

.cliente-sugerencia:hover {
  background: #edf4f7;
}

.cliente-sugerencia strong {
  font-size: 0.84rem;
}

.cliente-sugerencia span,
.cliente-sin-coincidencias {
  color: #6a7e91;
  font-size: 0.77rem;
}

.cliente-sin-coincidencias {
  margin: 5px 8px;
}

.compartir-error {
  margin: 0;
  color: #a33a2b;
  font-size: 0.8rem;
}

.compartir-form-acciones {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
}

.compartir-form-acciones .compartir-enviar {
  border-color: #123a66;
  background: #123a66;
  color: #ffffff;
}

.compartir-form-acciones button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.cupon-qr {
  display: block;
  width: 140px;
  aspect-ratio: 1;
  object-fit: contain;
  border: 5px solid #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(10, 31, 56, 0.14);
}

.cupon-qr-preview {
  display: block;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
  cursor: zoom-in;
}

.cupon-qr-preview:focus-visible {
  outline: 3px solid #397e9f;
  outline-offset: 4px;
}

.cupon-qr-modal {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: grid;
  box-sizing: border-box;
  place-items: center;
  padding: 20px;
  background: rgba(5, 20, 35, 0.84);
  backdrop-filter: blur(3px);
}

.cupon-qr-modal-contenido {
  position: relative;
  display: grid;
  max-width: calc(100vw - 32px);
  max-height: calc(100dvh - 32px);
  place-items: center;
  padding: 16px;
  border: 1px solid #b9d9e4;
  border-radius: 12px;
  background: #eaf6fb;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
}

.cupon-qr-grande {
  display: block;
  width: min(80vw, 680px);
  max-height: calc(100dvh - 90px);
  aspect-ratio: 1;
  object-fit: contain;
  border-radius: 8px;
  background: #ffffff;
}

.cupon-qr-cerrar {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border: 1px solid #b9d9e4;
  border-radius: 50%;
  background: #ffffff;
  color: #123a66;
  font-size: 20px;
  cursor: pointer;
}

.cupon-qr-cerrar:hover {
  background: #dff2f8;
}

.cupon-qr-cargando,
.cupon-qr-error {
  display: grid;
  width: 140px;
  aspect-ratio: 1;
  place-items: center;
  color: #667b91;
  font-size: 0.78rem;
  text-align: center;
}

.cupon-descargar {
  color: #123a66;
  font-size: 0.78rem;
  font-weight: 800;
  text-decoration: none;
}

.cupon-descargar:hover {
  text-decoration: underline;
}

@media (max-width: 520px) {
  .cupon-card {
    grid-template-columns: minmax(0, 1fr);
    justify-items: center;
    text-align: center;
  }

  .cupon-compartir {
    justify-content: center;
  }

  .cupon-qr-contenedor {
    width: 100%;
  }
}
</style>