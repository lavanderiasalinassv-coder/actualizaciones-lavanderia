<template>
  <AppShell>
    <main class="facturas-page force-light">
      <header class="page-header">
        <div>
          <h1>Facturas</h1>
        </div>
        <button class="download-button" type="button" :disabled="!factura || generandoPdf" @click="descargarPdf">
          <ion-icon :icon="downloadOutline" />
          {{ generandoPdf ? 'Generando...' : 'Descargar PDF' }}
        </button>
      </header>

      <section class="order-picker">
        <label for="orden-factura">Orden para facturar</label>
        <div class="search-control search-results-wrapper">
          <ion-icon :icon="searchOutline" />
          <input id="buscar-factura" v-model="busquedaFactura" type="search" aria-label="Buscar facturas" placeholder="Buscar por nombre, número de orden o teléfono" />
          <button v-if="busquedaFactura || ordenSeleccionadaId" type="button" class="clear-search" title="Limpiar búsqueda y factura" aria-label="Limpiar búsqueda y factura" @click="restablecerFactura">
            <ion-icon :icon="refreshOutline" />
          </button>
          <div v-if="busquedaFactura" class="search-results">
            <button v-for="orden in ordenesFiltradas" :key="orden.id" type="button" class="search-result" @click="seleccionarOrdenFactura(orden.id)">
              <strong>{{ orden.nombreCliente }}</strong>
              <span>Orden {{ orden.numero }} · {{ orden.telefono || 'Sin teléfono' }}</span>
            </button>
            <p v-if="!ordenesFiltradas.length" class="no-results">No se encontraron facturas</p>
          </div>
        </div>
      </section>

      <section v-if="factura" class="editor-grid">
        <form class="editor-panel" @submit.prevent="descargarPdf">
          <div class="panel-heading">
            <div>
              <h2>📋 Datos de la factura</h2>
            </div>
          </div>

          <div class="form-grid">
            <label class="field"><span>Número de factura</span><input v-model="factura.numero" required /></label>
            <label class="field"><span>🗓️ Fecha de creación</span><input v-model="factura.fechaCreacion" type="date" required /></label>
            <label class="field full"><span>👤 Cliente</span><input v-model="factura.nombreCliente" required /></label>
            <label class="field"><span>📱Teléfono</span><input v-model="factura.telefono" /></label>
            <label class="field"><span>✉️ Correo</span><input v-model="factura.correo" type="email" /></label>
            <label class="field"><span>🎢Estado de orden</span>
              <select v-model="factura.estado"><option value="pendiente">Pendiente</option><option value="en_proceso">En proceso</option><option value="listo">Listo</option><option value="entregado">Entregado</option><option value="cancelada">Cancelada</option></select>
            </label>
            <label class="field"><span>💵 Estado de pago</span>
              <select v-model="factura.estadoPago"><option value="porCobrar">Por cobrar</option><option value="anticipo">Anticipo</option><option value="pagado">Pagado</option></select>
            </label>
            <label class="field"><span>🧦 Prendas recibidas</span><input v-model.number="factura.cantidadPrendas" type="number" min="0" step="1" /></label>
            <label class="field"><span>Entrega</span><input v-model="factura.fechaEntrega" type="date" /></label>
            <label class="field"><span>Hora entrega</span><input v-model="factura.horaEntrega" type="time" /></label>
            <label class="field"><span>🟡 Descuento (%)</span><input v-model.number="factura.descuento" type="number" min="0" max="100" step="0.01" /></label>
            <label class="field"><span>💸 Descuento fijo ($)</span><input v-model.number="factura.descuentoFijo" type="number" min="0" step="0.01" /></label>
            <label class="field"><span>Descuento aplicado ($)</span><input :value="descuentoMonto.toFixed(2)" type="text" readonly /></label>
            <label class="field"><span>Monto recibido ($)</span><input v-model.number="factura.montoRecibido" type="number" min="0" step="0.01" /></label>
            <label class="field full"><span>Detalles de prendas</span><textarea v-model="factura.detallesPrendas" rows="3"></textarea></label>
          </div>

          <div class="items-heading"><h3>Servicios facturados</h3><button type="button" class="add-item" @click="agregarItem"><ion-icon :icon="addOutline" /> Agregar servicio</button></div>
          <div class="items-list">
            <article v-for="(item, index) in factura.items" :key="item.uid" class="item-row">
              <input class="item-nombre" v-model="item.nombre" aria-label="Nombre del servicio" placeholder="Servicio" />
              <input class="item-cantidad" v-model.number="item.cantidad" aria-label="Cantidad" type="number" min="0" step="1" placeholder="Cant." />
              <input class="item-precio" v-model.number="item.precio" aria-label="Precio" type="number" min="0" step="0.01" placeholder="Precio" />
              <strong class="item-subtotal">${{ subtotalItem(item).toFixed(2) }}</strong>
              <button class="icon-button danger item-borrar" type="button" title="Quitar servicio" @click="quitarItem(index)"><ion-icon :icon="trashOutline" /></button>
            </article>
          </div>

          <div class="totals">
            <span>Subtotal <strong>${{ subtotal.toFixed(2) }}</strong></span>
            <span>Descuento total <strong>-${{ descuentoMonto.toFixed(2) }}</strong></span>
            <span class="total-line">Total <strong>${{ total.toFixed(2) }}</strong></span>
            <span>Saldo pendiente <strong>${{ saldoPendiente.toFixed(2) }}</strong></span>
          </div>
        </form>

        <aside class="preview-panel">
          <div class="preview-sheet">
            <div class="preview-brand"><img src="../assets/logopdf.jpg" width="100px"><span>FACTURA</span></div>
            <div class="preview-number"><span>Factura</span><strong>{{ factura.numero || 'Sin número' }}</strong></div>
            <div class="preview-info"><span>Cliente</span><strong>{{ factura.nombreCliente || 'Sin cliente' }}</strong><small>{{ factura.telefono || 'Sin teléfono' }}</small></div>
            <div class="preview-info"><span>Prendas recibidas</span><strong>{{ factura.cantidadPrendas || 0 }}</strong></div>
            <div class="preview-info"><span>Entrega</span><strong>{{ factura.fechaEntrega || 'Sin fecha' }}{{ factura.horaEntrega ? ` a las ${factura.horaEntrega}` : '' }}</strong></div>
            <div class="preview-items"><div v-for="item in factura.items" :key="item.uid"><span>{{ item.cantidad }} x {{ item.nombre || 'Servicio' }}</span><strong>${{ subtotalItem(item).toFixed(2) }}</strong></div></div>
            <div class="preview-total"><span>Total</span><strong>${{ total.toFixed(2) }}</strong></div>
          </div>
          <p>Vista previa. Los cambios se aplican únicamente al PDF que descargues.</p>
        </aside>
      </section>

      <section v-else class="empty-state"><ion-icon :icon="receiptOutline" /><h2>Elige una orden para preparar la factura</h2></section>
    </main>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { IonIcon } from '@ionic/vue'
import { addOutline, downloadOutline, receiptOutline, refreshOutline, searchOutline, trashOutline } from 'ionicons/icons'
import { jsPDF } from 'jspdf'
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import AppShell from '@/components/AppShell.vue'
import { useOrdenes, type Orden, type OrdenItem } from '@/composables/useOrdenes'
import logoFactura from '@/assets/logo.jpg'

interface ItemFacturaEditable {
  uid: string
  nombre: string
  cantidad: number
  precio: number
}

interface FacturaEditable {
  numero: string
  nombreCliente: string
  telefono: string
  correo: string
  fechaCreacion: string
  fechaEntrega: string
  horaEntrega: string
  estado: string
  estadoPago: string
  cantidadPrendas: number
  detallesPrendas: string
  descuento: number
  descuentoFijo: number
  montoRecibido: number
  items: ItemFacturaEditable[]
}

const { ordenes, cargarOrdenes } = useOrdenes()
const ordenSeleccionadaId = ref('')
const busquedaFactura = ref('')
const generandoPdf = ref(false)
const facturaVacia = (): FacturaEditable => ({ numero: '', nombreCliente: '', telefono: '', correo: '', fechaCreacion: '', fechaEntrega: '', horaEntrega: '', estado: 'pendiente', estadoPago: 'porCobrar', cantidadPrendas: 0, detallesPrendas: '', descuento: 0, descuentoFijo: 0, montoRecibido: 0, items: [] })
const factura = reactive<FacturaEditable>(facturaVacia())
const ordenesOrdenadas = computed(() => [...ordenes.value].sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
const normalizarBusqueda = (valor: unknown) => String(valor ?? '').toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
const ordenesFiltradas = computed(() => {
  const busqueda = normalizarBusqueda(busquedaFactura.value).replace(/[^a-z0-9]/g, '')
  if (!busqueda) return ordenesOrdenadas.value
  return ordenesOrdenadas.value.filter((orden) => [orden.nombreCliente, orden.numero, orden.codigoPais, orden.telefono].some((valor) => normalizarBusqueda(valor).replace(/[^a-z0-9]/g, '').includes(busqueda)))
})
const ordenSeleccionada = computed(() => ordenes.value.find((orden) => orden.id === ordenSeleccionadaId.value) ?? null)
const subtotalItem = (item: ItemFacturaEditable) => Math.max(0, Number(item.cantidad) || 0) * Math.max(0, Number(item.precio) || 0)
const subtotal = computed(() => factura.items.reduce((total, item) => total + subtotalItem(item), 0))
const descuentoPorcentajeMonto = computed(() => subtotal.value * Math.min(100, Math.max(0, Number(factura.descuento) || 0)) / 100)
const descuentoFijoMonto = computed(() => Math.min(subtotal.value, Math.max(0, Number(factura.descuentoFijo) || 0)))
const descuentoMonto = computed(() => descuentoPorcentajeMonto.value + descuentoFijoMonto.value)
const total = computed(() => Math.max(0, subtotal.value - descuentoMonto.value))
const saldoPendiente = computed(() => Math.max(0, total.value - Math.max(0, Number(factura.montoRecibido) || 0)))

const fechaInput = (valor: string | null) => valor ? valor.slice(0, 10) : ''
const itemEditable = (item: OrdenItem, index: number): ItemFacturaEditable => ({ uid: `${item.id}-${index}`, nombre: item.nombre, cantidad: item.cantidad, precio: item.precio })

const cargarOrdenSeleccionada = () => {
  const orden = ordenSeleccionada.value
  if (!orden) return
  Object.assign(factura, {
    numero: orden.numero,
    nombreCliente: orden.nombreCliente,
    telefono: `${orden.codigoPais || ''} ${orden.telefono || ''}`.trim(),
    correo: orden.correo || '',
    fechaCreacion: fechaInput(orden.createdAt),
    fechaEntrega: fechaInput(orden.fechaEntrega),
    horaEntrega: orden.horaEntrega || '',
    estado: orden.estado,
    estadoPago: orden.estadoPago,
    cantidadPrendas: Number(orden.cantidadPrendas || 0),
    detallesPrendas: orden.detallesPrendas || '',
    descuento: 0,
    descuentoFijo: Number(orden.descuento || 0),
    montoRecibido: Number(orden.montoRecibido || 0),
    items: orden.items.map(itemEditable)
  })
}

watch(ordenSeleccionadaId, cargarOrdenSeleccionada)
onMounted(() => { void cargarOrdenes() })

const seleccionarOrdenFactura = (id: string) => {
  ordenSeleccionadaId.value = id
  busquedaFactura.value = ''
}

const restablecerFactura = () => {
  ordenSeleccionadaId.value = ''
  busquedaFactura.value = ''
  Object.assign(factura, facturaVacia())
}

const agregarItem = () => factura.items.push({ uid: crypto.randomUUID(), nombre: '', cantidad: 1, precio: 0 })
const quitarItem = (index: number) => factura.items.splice(index, 1)
const textoEstado = (estado: string) => ({ pendiente: 'Pendiente', en_proceso: 'En proceso', listo: 'Listo', entregado: 'Entregado', cancelada: 'Cancelada', porCobrar: 'Por cobrar', anticipo: 'Anticipo', pagado: 'Pagado' }[estado] ?? estado)

const descargarPdf = async () => {
  if (!ordenSeleccionada.value || generandoPdf.value) return
  generandoPdf.value = true
  try {
    const pdf = new jsPDF({ unit: 'mm', format: 'letter' })
    const ancho = pdf.internal.pageSize.getWidth()
    const alto = pdf.internal.pageSize.getHeight()
    const margen = 16
    let y = 18
    const nuevaPagina = () => { pdf.addPage(); y = 18; encabezado() }
    const texto = (valor: string, x: number, maxWidth: number, size = 10, estilo: 'normal' | 'bold' = 'normal') => {
      pdf.setFont('helvetica', estilo); pdf.setFontSize(size)
      const lineas = pdf.splitTextToSize(valor || '-', maxWidth)
      pdf.text(lineas, x, y)
      y += lineas.length * (size * 0.42)
    }
    const encabezado = () => {
      pdf.setFillColor(255, 255, 255); pdf.rect(0, 0, ancho, alto, 'F')
      pdf.addImage(logoFactura, 'JPEG', margen, 10, 28, 28)
      pdf.setTextColor(10, 31, 56); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(22); pdf.text('Lavandería Salinas', margen + 34, 21)
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10); pdf.setTextColor(111, 131, 153); pdf.text('Tu orden', margen + 34, 28)
      pdf.setTextColor(10, 31, 56); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(12); pdf.text(`Orden ${factura.numero || 'Sin número'}`, ancho - margen, 20, { align: 'right' })
      pdf.setDrawColor(10, 31, 56); pdf.setLineWidth(.6); pdf.line(margen, 42, ancho - margen, 42)
      pdf.setTextColor(20, 39, 61); y = 53
    }
    encabezado()
    pdf.setFillColor(243, 251, 250); pdf.setDrawColor(205, 235, 230); pdf.roundedRect(margen, y, ancho - margen * 2, 45, 3, 3, 'FD')
    pdf.setTextColor(18, 58, 102); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(13); pdf.text(`Orden ${factura.numero || 'Sin número'}`, margen + 6, y + 8)
    pdf.setTextColor(20, 39, 61); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10)
    pdf.text(`Cliente: ${factura.nombreCliente || '-'}`, margen + 6, y + 16)
    pdf.text(`Fecha de creación: ${factura.fechaCreacion || '-'}`, margen + 6, y + 23)
    pdf.text(`Prendas recibidas: ${factura.cantidadPrendas || 0}`, margen + 6, y + 30)
    pdf.text(`Estado de pago: ${textoEstado(factura.estadoPago)}`, margen + 6, y + 37)
    pdf.text(`Monto recibido: $${Math.max(0, Number(factura.montoRecibido) || 0).toFixed(2)}`, margen + 86, y + 16)
    const textoEntrega = factura.fechaEntrega ? `${factura.fechaEntrega}${factura.horaEntrega ? ` a las ${factura.horaEntrega}` : ''}` : 'Sin fecha'
    pdf.text(`Entrega: ${textoEntrega}`, margen + 86, y + 23)
    pdf.text(`Saldo pendiente: $${saldoPendiente.value.toFixed(2)}`, margen + 86, y + 30)
    if (factura.detallesPrendas.trim()) pdf.text(pdf.splitTextToSize(`Detalles: ${factura.detallesPrendas.trim()}`, 80), margen + 86, y + 37)
    y += 55
    pdf.setTextColor(18, 58, 102); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(14); pdf.text('Servicios', margen, y); y += 8
    pdf.setFillColor(10, 31, 56); pdf.rect(margen, y, ancho - margen * 2, 9, 'F'); pdf.setTextColor(255, 255, 255); pdf.setFontSize(9)
    pdf.text('SERVICIO', margen + 3, y + 5.8); pdf.text('CANT.', ancho - 67, y + 5.8, { align: 'right' }); pdf.text('PRECIO', ancho - 42, y + 5.8, { align: 'right' }); pdf.text('SUBTOTAL', ancho - margen - 3, y + 5.8, { align: 'right' }); y += 13
    pdf.setTextColor(20, 39, 61)
    for (const item of factura.items) {
      if (y > alto - 62) nuevaPagina()
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10)
      const nombre = pdf.splitTextToSize(item.nombre || 'Servicio', 92)
      pdf.text(nombre, margen + 3, y)
      pdf.text(String(Math.max(0, Number(item.cantidad) || 0)), ancho - 67, y, { align: 'right' })
      pdf.text(`$${Math.max(0, Number(item.precio) || 0).toFixed(2)}`, ancho - 42, y, { align: 'right' })
      pdf.text(`$${subtotalItem(item).toFixed(2)}`, ancho - margen - 3, y, { align: 'right' })
      y += Math.max(7, nombre.length * 4.5)
    }
    y += 4
    if (y > alto - 57) nuevaPagina()
    const cajaTotalesX = ancho - 82
    const cajaTotalesAncho = 66
    const cajaTotalesPad = 12
    pdf.setFillColor(248, 251, 254); pdf.setDrawColor(201, 217, 232); pdf.roundedRect(cajaTotalesX, y, cajaTotalesAncho, 42, 2, 2, 'FD'); y += 7
    const formatoMonto = (monto: number) => monto < 0 ? `-$${Math.abs(monto).toFixed(2)}` : `$${monto.toFixed(2)}`
    const totalLinea = (etiqueta: string, monto: number, fuerte = false) => { pdf.setTextColor(10, 31, 56); pdf.setFont('helvetica', fuerte ? 'bold' : 'normal'); pdf.setFontSize(fuerte ? 12 : 9); pdf.text(etiqueta, cajaTotalesX + cajaTotalesPad, y); pdf.text(formatoMonto(monto), cajaTotalesX + cajaTotalesAncho - cajaTotalesPad, y, { align: 'right' }); y += fuerte ? 8 : 6 }
    totalLinea('Subtotal', subtotal.value)
    totalLinea('Descuento total', -descuentoMonto.value)
    totalLinea('Total', total.value, true)
    totalLinea('Monto recibido', Math.max(0, Number(factura.montoRecibido) || 0))
    totalLinea('Saldo pendiente', saldoPendiente.value)
    pdf.setTextColor(111, 131, 153); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.text('Gracias por su preferencia.', margen, alto - 15)
    pdf.setDrawColor(216, 228, 238); pdf.line(margen, alto - 11, ancho - margen, alto - 11)
    pdf.text('Este documento es válido como comprobante de pago emitido por Lavandería Salinas.', margen, alto - 6)

    pdf.addPage()
    pdf.setFillColor(255, 249, 230); pdf.setDrawColor(255, 215, 0); pdf.roundedRect(margen, 16, ancho - margen * 2, alto - 32, 3, 3, 'FD')
    pdf.addImage(logoFactura, 'JPEG', margen + 8, 24, 20, 20)
    pdf.setTextColor(184, 134, 11); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(16); pdf.text('CONDICIONES DEL SERVICIO', margen + 34, 36)
    const politicas = [
      'Para retirar las prendas, es indispensable presentar este recibo como único comprobante válido.',
      'Las prendas deberán ser retiradas en un máximo de 1 día; de no hacerlo, se aplicará un cargo adicional de $0.50 por cada día de retraso.',
      'El plazo para realizar cualquier reclamación sobre el servicio es de 2 días hábiles después de la entrega.',
      'La lavandería no se responsabiliza por pérdidas o daños causados por eventos fortuitos o fuerza mayor, como robos, incendios o desastres naturales, siendo este riesgo asumido por el cliente.',
      'Las prendas no retiradas en un plazo de 30 días serán consideradas abandonadas, liberando a la lavandería de toda responsabilidad sobre ellas.',
      'Si dichas prendas no son reclamadas en un plazo adicional de 10 días (40 días en total desde su disponibilidad), la lavandería se reserva el derecho de donarlas a refugios u organizaciones benéficas sin posibilidad de reclamos futuros.',
      'En caso de dudas, comuníquese con nosotros: lavanderiasalinassv@gmail.com o 2497 6699 por WhatsApp.'
    ]
    y = 57; pdf.setTextColor(51, 51, 51); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10)
    for (const politica of politicas) {
      const lineas = pdf.splitTextToSize(politica, ancho - margen * 2 - 16)
      pdf.text(lineas, margen + 8, y)
      y += lineas.length * 4.6 + 8
    }
    pdf.setDrawColor(230, 237, 243); pdf.line(margen + 8, alto - 30, ancho - margen - 8, alto - 30)
    pdf.setTextColor(111, 131, 153); pdf.setFontSize(8); pdf.text('Este documento es válido como comprobante de pago emitido por Lavandería Salinas.', ancho / 2, alto - 22, { align: 'center' })
    pdf.text('Gracias por confiar en nuestros servicios.', ancho / 2, alto - 16, { align: 'center' })
    const nombreArchivo = `Factura-Lavandería-Salinas-${(factura.numero || 'orden').replace(/[^a-z0-9_-]/gi, '')}.pdf`
    if (Capacitor.isNativePlatform()) {
      const guardado = await Filesystem.writeFile({ path: nombreArchivo, data: pdf.output('datauristring').split(',')[1], directory: Directory.Cache })
      await Share.share({ title: `Factura ${factura.numero}`, text: 'Factura de Lavandería Salinas', url: guardado.uri, dialogTitle: 'Guardar o compartir factura' })
    } else {
      pdf.save(nombreArchivo)
    }
  } catch (error) {
    console.error('No se pudo generar la factura PDF:', error)
    window.alert('No se pudo generar la factura en PDF.')
  } finally {
    generandoPdf.value = false
  }
}
</script>

<style scoped>
.force-light { --ion-background-color: #f4f7f9; --ion-text-color: #10263d; color: #10263d; }
.facturas-page { min-height: 100%; padding: 28px; background: #f4f7f9; }
.page-header { display: flex; justify-content: space-between; gap: 20px; align-items: flex-start; margin-bottom: 24px; }
.eyebrow { margin: 0 0 4px; color: #17756c; font-weight: 700; font-size: .78rem; text-transform: uppercase; letter-spacing: 0; }
h1, h2, h3, p { margin-top: 0; } h1 { margin-bottom: 6px; font-size: 2rem; } .page-header p:not(.eyebrow) { color: #60758a; margin-bottom: 0; }
.download-button, .add-item, .reset-button, .icon-button { border: 0; cursor: pointer; font: inherit; }
.download-button { display: inline-flex; align-items: center; gap: 8px; background: #123a66; color: #fff; padding: 11px 16px; border-radius: 6px; font-weight: 700; white-space: nowrap; }.download-button:disabled { opacity: .6; cursor: not-allowed; }
.order-picker, .editor-panel, .preview-panel { background: #fff; border: 1px solid #dbe5ed; border-radius: 8px; }
.order-picker { padding: 16px; margin-bottom: 20px; }.order-picker label, .field span { display: block; margin-bottom: 7px; font-size: .82rem; font-weight: 700; color: #40566d; }.search-control, .picker-control { display: flex; align-items: center; gap: 8px; max-width: 640px; color: #60758a; }.search-control { position: relative; margin-bottom: 10px; }.search-control input, .picker-control select { flex: 1; }.clear-search { display: grid; width: 32px; height: 32px; flex: 0 0 32px; place-items: center; border: 0; border-radius: 4px; background: #edf3f7; color: #40566d; cursor: pointer; }.clear-search:hover, .clear-search:focus-visible { background: #dce9f1; outline: 0; }.search-results { position: absolute; z-index: 10; top: calc(100% + 4px); left: 0; right: 0; overflow: hidden; border: 1px solid #c7d6e2; border-radius: 5px; background: #fff; box-shadow: 0 8px 18px rgba(25, 55, 78, .14); }.search-result { display: flex; width: 100%; flex-direction: column; align-items: flex-start; gap: 3px; padding: 10px 12px; border: 0; border-bottom: 1px solid #edf1f4; background: #fff; color: #10263d; cursor: pointer; text-align: left; font: inherit; }.search-result:last-child { border-bottom: 0; }.search-result:hover, .search-result:focus-visible { background: #eef8f6; outline: 0; }.search-result span { margin: 0; color: #60758a; font-size: .8rem; font-weight: 400; }.no-results { margin: 0; padding: 12px; color: #60758a; font-size: .86rem; }
select, input, textarea { width: 100%; box-sizing: border-box; border: 1px solid #c7d6e2; border-radius: 5px; background: #fff; color: #10263d; padding: 9px 10px; font: inherit; } textarea { resize: vertical; }
.editor-grid { display: grid; grid-template-columns: minmax(0, 1.65fr) minmax(270px, .85fr); gap: 20px; align-items: start; }.editor-panel { padding: 20px; }.panel-heading, .items-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }.panel-heading h2, .items-heading h3 { margin-bottom: 0; font-size: 1.12rem; }.reset-button { color: #123a66; background: transparent; text-decoration: underline; }.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 13px; margin: 20px 0; }.field.full { grid-column: 1 / -1; }
.items-heading { margin-top: 24px; border-top: 1px solid #e4ebf0; padding-top: 18px; }.add-item { display: inline-flex; gap: 6px; align-items: center; background: #e5f4ef; color: #11695f; padding: 8px 10px; border-radius: 5px; font-weight: 700; font-size: .86rem; }.items-list { margin-top: 12px; }.item-row { display: grid; grid-template-columns: minmax(130px, 1fr) 70px 90px 86px 34px; gap: 8px; align-items: center; padding: 8px 0; border-bottom: 1px solid #edf1f4; }.item-row strong { text-align: right; }.icon-button { height: 32px; width: 32px; border-radius: 4px; background: #fff0f0; color: #b42318; }.totals { display: grid; justify-content: end; gap: 7px; margin-top: 18px; }.totals span { min-width: 230px; display: flex; justify-content: space-between; gap: 30px; color: #52687d; }.totals .total-line { padding-top: 8px; border-top: 1px solid #cddae5; font-size: 1.1rem; color: #123a66; }
.preview-panel { position: sticky; top: 16px; padding: 18px; background: #edf3f7; }.preview-panel > p { margin: 14px 3px 0; color: #61798e; font-size: .82rem; line-height: 1.4; }.preview-sheet { padding: 18px; background: #fff; box-shadow: 0 4px 16px rgba(25, 55, 78, .12); min-height: 430px; }.preview-brand { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 3px solid #123a66; padding-bottom: 12px; color: #123a66; }.preview-brand strong { font-size: 1.18rem; }.preview-brand span { font-size: .72rem; font-weight: 800; letter-spacing: .08em; }.preview-number, .preview-info { padding: 13px 0; border-bottom: 1px solid #e5edf2; }.preview-number span, .preview-info span { display: block; color: #71869a; font-size: .72rem; text-transform: uppercase; }.preview-number strong, .preview-info strong { display: block; margin-top: 3px; }.preview-info small { color: #60758a; }.preview-items { margin: 15px 0; }.preview-items div { display: flex; justify-content: space-between; gap: 8px; padding: 6px 0; font-size: .86rem; }.preview-total { display: flex; justify-content: space-between; border-top: 2px solid #123a66; padding-top: 11px; color: #123a66; font-size: 1.1rem; }
.empty-state { min-height: 300px; display: grid; place-content: center; text-align: center; color: #60758a; }.empty-state ion-icon { margin: auto; font-size: 3rem; color: #8ba5ba; }.empty-state h2 { margin-top: 12px; font-size: 1.1rem; }
@media (max-width: 900px) {
  .facturas-page { padding: 20px; }
  .editor-grid { grid-template-columns: 1fr; }
  .preview-panel { position: static; }
  .preview-sheet { min-height: 0; }
  .page-header { flex-direction: column; }
  .download-button { width: 100%; justify-content: center; }
  .order-picker { margin-bottom: 16px; }
  .picker-control { max-width: none; }
}
@media (max-width: 560px) {
  .facturas-page { padding: 14px; }
  .editor-panel, .preview-panel, .order-picker { border-radius: 6px; }
  .editor-panel { padding: 14px; }
  .preview-panel { padding: 12px; }
  .form-grid { grid-template-columns: 1fr; gap: 10px; margin: 16px 0; }
  .field.full { grid-column: auto; }
  .items-heading { margin-top: 18px; padding-top: 14px; }
  .item-row {
    grid-template-columns: 1fr 1fr;
    grid-template-areas:
      "nombre nombre"
      "cantidad precio"
      "subtotal borrar";
    gap: 6px;
    padding: 10px 0;
  }
  .item-row .item-nombre { grid-area: nombre; }
  .item-row .item-cantidad { grid-area: cantidad; }
  .item-row .item-precio { grid-area: precio; }
  .item-row .item-subtotal { grid-area: subtotal; text-align: left; align-self: center; }
  .item-row .item-borrar { grid-area: borrar; justify-self: end; }
  .item-row input { min-width: 0; padding: 9px 8px; }
  .item-row strong { font-size: .92rem; }
  .totals { justify-content: stretch; }
  .totals span { min-width: 0; width: 100%; }
  .page-header h1 { font-size: 1.5rem; }
  .preview-brand strong { font-size: 1.02rem; }
}
</style>