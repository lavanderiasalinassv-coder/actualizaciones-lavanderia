import { jsPDF } from 'jspdf'
import type { Orden } from '@/composables/useOrdenes'
import logoTicket from '@/assets/logo.jpg'

export { logoTicket }

const textoSeguro = (valor: unknown) => String(valor ?? '').replace(/[\u0000-\u001f]/g, ' ').trim()
const monto = (valor: unknown) => `$${(Number(valor) || 0).toFixed(2)}`
const fechaLegible = (valor: string | null | undefined) => {
  if (!valor) return 'Sin fecha'
  const [anio, mes, dia] = valor.slice(0, 10).split('-').map(Number)
  if (!anio || !mes || !dia) return valor
  return new Intl.DateTimeFormat('es-SV', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(anio, mes - 1, dia)))
}
const obtenerLogoBase64 = async () => {
  try {
    const response = await fetch(logoTicket)
    const blob = await response.blob()
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(blob)
    })
  } catch {
    return ''
  }
}

export const descargarPdfOrden = (orden: Orden) => {
  descargarPdfOrdenConPlantilla(orden)
}

const descargarPdfOrdenConPlantilla = (orden: Orden) => {
  const pdf = new jsPDF({ unit: 'mm', format: 'letter' })
  const margen = 16
  const ancho = pdf.internal.pageSize.getWidth()
  const alto = pdf.internal.pageSize.getHeight()
  const total = Number(orden.total) || 0
  const subtotal = Number(orden.subtotal) || (orden.items || []).reduce((s, item) => s + Number(item.precio || 0) * Number(item.cantidad || 0), 0)
  const recibido = Number(orden.montoRecibido) || 0
  let y = 18
  const encabezado = () => {
    pdf.setFillColor(255, 255, 255); pdf.rect(0, 0, ancho, alto, 'F')
    pdf.addImage(logoTicket, 'JPEG', margen, 10, 28, 28)
    pdf.setTextColor(10, 31, 56); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(22); pdf.text('Lavandería Salinas', margen + 34, 21)
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10); pdf.setTextColor(111, 131, 153); pdf.text('Tu orden', margen + 34, 28)
    pdf.setTextColor(10, 31, 56); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(12); pdf.text(`Orden ${textoSeguro(orden.numero) || 'Sin número'}`, ancho - margen, 20, { align: 'right' })
    pdf.setDrawColor(10, 31, 56); pdf.setLineWidth(.6); pdf.line(margen, 42, ancho - margen, 42); pdf.setTextColor(20, 39, 61); y = 53
  }
  const siguientePagina = () => { pdf.addPage(); encabezado() }
  encabezado()
  pdf.setFillColor(243, 251, 250); pdf.setDrawColor(205, 235, 230); pdf.roundedRect(margen, y, ancho - margen * 2, 58, 3, 3, 'FD')
  pdf.setTextColor(18, 58, 102); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(13); pdf.text(`Orden ${textoSeguro(orden.numero) || 'Sin número'}`, margen + 6, y + 8)
  const campo = (label: string, value: string, x: number, yy: number) => { pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.text(`${label}:`, x, yy); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10); pdf.text(pdf.splitTextToSize(value || '-', 76), x, yy + 5) }
  const fechaCreacion = orden.createdAt ? fechaLegible(orden.createdAt) : '-'
  const estadoOrden = ({ pendiente: 'Pendiente', en_proceso: 'En proceso', listo: 'Listo', entregado: 'Entregado', cerrada: 'Cerrada', cancelada: 'Cancelada', 'Cerrada-Cancelada': 'Cerrada y cancelada' } as Record<string, string>)[orden.estado] || textoSeguro(orden.estado)
  const estadoPago = ({ porCobrar: 'Por cobrar', anticipo: 'Anticipo', pagado: 'Pagado' } as Record<string, string>)[orden.estadoPago] || textoSeguro(orden.estadoPago)
  const metodoPago = ({ efectivo: 'Efectivo', tarjeta: 'Tarjeta', transferencia: 'Transferencia' } as Record<string, string>)[orden.metodoPago] || textoSeguro(orden.metodoPago)
  campo('Cliente', textoSeguro(orden.nombreCliente), margen + 6, y + 15); campo('Fecha de creación', fechaCreacion, margen + 6, y + 27); campo('Estado de orden', estadoOrden, margen + 6, y + 39); campo('Pago', `${estadoPago} · ${metodoPago}`, margen + 6, y + 51)
  campo('Teléfono', textoSeguro(`${orden.codigoPais || ''} ${orden.telefono || ''}`), margen + 86, y + 15); campo('Correo', textoSeguro(orden.correo), margen + 86, y + 27); campo('Entrega', [orden.fechaEntrega ? fechaLegible(orden.fechaEntrega) : '', orden.horaEntrega].filter(Boolean).join(' a las ') || 'Sin fecha', margen + 86, y + 39); campo('Prendas recibidas', String(Number(orden.cantidadPrendas) || 0), margen + 86, y + 51)
  y += 68
  if (orden.detallesPrendas) { pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.text('Detalles de prendas:', margen, y); const lines = pdf.splitTextToSize(textoSeguro(orden.detallesPrendas), ancho - margen * 2 - 36); pdf.setFontSize(10); pdf.text(lines, margen + 36, y); y += Math.max(7, lines.length * 4.5) + 3 }
  pdf.setTextColor(18, 58, 102); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(14); pdf.text('Servicios', margen, y); y += 8
  const tabla = () => { pdf.setFillColor(10, 31, 56); pdf.rect(margen, y, ancho - margen * 2, 9, 'F'); pdf.setTextColor(255, 255, 255); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.text('SERVICIO', margen + 3, y + 5.8); pdf.text('CANT.', ancho - 67, y + 5.8, { align: 'right' }); pdf.text('PRECIO', ancho - 42, y + 5.8, { align: 'right' }); pdf.text('SUBTOTAL', ancho - margen - 3, y + 5.8, { align: 'right' }); y += 13 }
  tabla()
  for (const item of orden.items || []) {
    const qty = Number(item.cantidad) || 0; const price = Number(item.precio) || 0; const name = pdf.splitTextToSize(textoSeguro(item.nombre) || 'Servicio', 92); const rowHeight = Math.max(7, name.length * 4.5)
    if (y + rowHeight > alto - 62) { siguientePagina(); tabla() }
    pdf.setTextColor(20, 39, 61); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10); pdf.text(name, margen + 3, y); pdf.text(String(qty), ancho - 67, y, { align: 'right' }); pdf.text(monto(price), ancho - 42, y, { align: 'right' }); pdf.text(monto(qty * price), ancho - margen - 3, y, { align: 'right' }); y += rowHeight
  }
  y += 4; if (y > alto - 62) siguientePagina()
  const cajaX = ancho - 82; pdf.setFillColor(248, 251, 254); pdf.setDrawColor(201, 217, 232); pdf.roundedRect(cajaX, y, 66, 42, 2, 2, 'FD'); y += 7
  const totalLinea = (label: string, value: number, bold = false) => { pdf.setTextColor(10, 31, 56); pdf.setFont('helvetica', bold ? 'bold' : 'normal'); pdf.setFontSize(bold ? 12 : 9); pdf.text(label, cajaX + 4, y); pdf.text(monto(value), cajaX + 62, y, { align: 'right' }); y += bold ? 8 : 6 }
  totalLinea('Subtotal', subtotal); totalLinea('Descuento', -Math.max(0, subtotal - total)); totalLinea('Total', total, true); totalLinea('Monto recibido', recibido); totalLinea('Saldo pendiente', Math.max(0, total - recibido))
  pdf.setTextColor(111, 131, 153); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.text('Gracias por su preferencia.', margen, alto - 15); pdf.setDrawColor(216, 228, 238); pdf.line(margen, alto - 11, ancho - margen, alto - 11); pdf.text('Este documento es válido como comprobante de pago emitido por Lavandería Salinas.', margen, alto - 6)
  pdf.addPage(); pdf.setFillColor(255, 249, 230); pdf.setDrawColor(255, 215, 0); pdf.roundedRect(margen, 16, ancho - margen * 2, alto - 32, 3, 3, 'FD'); pdf.addImage(logoTicket, 'JPEG', margen + 8, 24, 20, 20); pdf.setTextColor(184, 134, 11); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(16); pdf.text('CONDICIONES DEL SERVICIO', margen + 34, 36)
  const politicas = ['Para retirar las prendas, es indispensable presentar este recibo como único comprobante válido.', 'Las prendas deberán ser retiradas en un máximo de 1 día; de no hacerlo, se aplicará un cargo adicional de $0.50 por cada día de retraso.', 'El plazo para realizar cualquier reclamación sobre el servicio es de 2 días hábiles después de la entrega.', 'La lavandería no se responsabiliza por pérdidas o daños causados por eventos fortuitos o fuerza mayor, como robos, incendios o desastres naturales, siendo este riesgo asumido por el cliente.', 'Las prendas no retiradas en un plazo de 30 días serán consideradas abandonadas, liberando a la lavandería de toda responsabilidad sobre ellas.', 'Si dichas prendas no son reclamadas en un plazo adicional de 10 días (40 días en total desde su disponibilidad), la lavandería se reserva el derecho de donarlas a refugios u organizaciones benéficas sin posibilidad de reclamos futuros.', 'En caso de dudas, comuníquese con nosotros: lavanderiasalinassv@gmail.com o 2497 6699 por WhatsApp.']
  y = 57; pdf.setTextColor(51, 51, 51); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10)
  for (const politica of politicas) { const lines = pdf.splitTextToSize(politica, ancho - margen * 2 - 16); pdf.text(lines, margen + 8, y); y += lines.length * 4.6 + 8 }
  pdf.setDrawColor(230, 237, 243); pdf.line(margen + 8, alto - 30, ancho - margen - 8, alto - 30); pdf.setTextColor(111, 131, 153); pdf.setFontSize(8); pdf.text('Este documento es válido como comprobante de pago emitido por Lavandería Salinas.', ancho / 2, alto - 22, { align: 'center' }); pdf.text('Gracias por confiar en nuestros servicios.', ancho / 2, alto - 16, { align: 'center' })
  const numeroSeguro = textoSeguro(orden.numero).replace(/[^a-z0-9_-]/gi, '') || textoSeguro(orden.id)
  pdf.save(`Factura-Lavandería-Salinas-${numeroSeguro || 'orden'}.pdf`)
  return
}

const esc = (valor: unknown) => textoSeguro(valor).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

export interface OrdenImprimible {
  numero: string
  nombreCliente: string
  items: Array<{ nombre: string; cantidad: number; precio: number }>
  subtotal: number
  total: number
  montoRecibido: number
  estado: string
  estadoPago: string
  createdAt?: string
  codigoPais?: string
  telefono?: string
  correo?: string
  cantidadPrendas?: number
  detallesPrendas?: string
  fechaEntrega?: string | null
  horaEntrega?: string | null
  fechaEntregaActiva?: boolean
  fechaEntregaTexto?: string
}

const escaparEtiqueta = (valor: unknown) => esc(valor).replace(/\n/g, '<br/>')
const imprimirHtml = (ventana: Window, titulo: string, contenido: string, css: string) => {
  ventana.document.open()
  ventana.document.write(`<!doctype html><html><head><meta charset="UTF-8"><title>${esc(titulo)}</title><style>${css}</style></head><body>${contenido}<script>function _imprimir(){window.focus();window.print()}window.onload=()=>requestAnimationFrame(()=>setTimeout(_imprimir,200));window.onafterprint=()=>window.close();setTimeout(()=>{if(!window.closed)window.close()},60000);<\/script></body></html>`)
  ventana.document.close()
}

export const imprimirTicketOrden = async (orden: OrdenImprimible) => {
  if (typeof window === 'undefined') return
  const ventana = window.open('', '_blank', 'width=400,height=650')
  if (!ventana) return window.alert('El navegador bloqueó la ventana de impresión. Permite las ventanas emergentes e inténtalo de nuevo.')
  ventana.document.write('<!doctype html><html><body>Preparando ticket…</body></html>')
  const logoBase64 = await obtenerLogoBase64()
  const servicios = (orden.items || []).map((item) => `<tr><td class="cantidad">${Number(item.cantidad) || 0}</td><td>${escaparEtiqueta(item.nombre)}</td><td class="precio">${monto(item.precio)}</td><td class="precio">${monto(Number(item.precio) * Number(item.cantidad))}</td></tr>`).join('')
  const descuento = Math.min(Math.max(0, Number(orden.subtotal) || 0), Math.max(0, Number(orden.subtotal) - Number(orden.total)))
  const saldo = Math.max(0, Number(orden.total) - Number(orden.montoRecibido))
  const estadoPago = ({ porCobrar: 'Por cobrar', anticipo: 'Anticipo', pagado: 'Pagado' } as Record<string, string>)[orden.estadoPago] || textoSeguro(orden.estadoPago)
  const telefono = `${orden.codigoPais || ''}${orden.telefono || ''}`.trim()
  const logo = logoBase64 ? `<div class="logo-wrap"><img src="${logoBase64}" alt="Logo" class="logo"></div>` : ''
  const fecha = orden.createdAt ? new Date(orden.createdAt).toLocaleString('es-SV') : ''
  const entrega = orden.fechaEntregaTexto || [orden.fechaEntrega, orden.horaEntrega].filter(Boolean).join(' ')
  const politicas = [
    'Para retirar las prendas, es indispensable presentar este recibo como único comprobante válido.',
    'Las prendas deberán ser retiradas en un máximo de 1 día; de no hacerlo, se aplicará un cargo adicional de $0.50 por cada día de retraso.',
    'Los reclamos sobre el servicio deben realizarse dentro de los 2 días hábiles posteriores a la entrega.',
    'La lavandería no se responsabiliza por pérdidas o daños causados por eventos fortuitos o fuerza mayor, como robos, incendios o desastres naturales; este riesgo es asumido por el cliente.',
    'Las prendas no retiradas en un plazo de 30 días serán consideradas abandonadas, liberando a la lavandería de toda responsabilidad sobre ellas.',
    'Si dichas prendas no son reclamadas en un plazo adicional de 10 días (40 días en total desde su disponibilidad), la lavandería se reserva el derecho de donarlas a refugios u organizaciones benéficas sin posibilidad de reclamos futuros.',
  ]
  const politicaHtml = `<section class="politica"><h2>Condiciones del servicio</h2><ol>${politicas.map((politica) => `<li>${esc(politica)}</li>`).join('')}</ol><p class="contacto">Dudas: lavanderiasalinassv@gmail.com · WhatsApp 2497 6699</p></section>`
  const contenido = `<div class="contenedor-ticket"><header>${logo}<div class="nombre-local">Lavandería Salinas</div><div class="num-orden">ORDEN DE SERVICIO ${esc(orden.numero)}</div></header><hr><div><b>Cliente:</b> ${esc(orden.nombreCliente)}${fecha ? `<br><b>Fecha:</b> ${esc(fecha)}` : ''}<br><b>Cant. prendas:</b> ${Number(orden.cantidadPrendas) || 0}${telefono ? `<br><b>Teléfono:</b> ${esc(telefono)}` : ''}${orden.correo ? `<br><b>Correo:</b> ${esc(orden.correo)}` : ''}${entrega ? `<br><b>Entrega:</b> ${esc(entrega)}` : ''}${orden.detallesPrendas ? `<br><b>Detalles:</b> ${escaparEtiqueta(orden.detallesPrendas)}` : ''}</div><hr><table><thead><tr><th class="cantidad">Cant</th><th>Servicio</th><th class="precio">P.U.</th><th class="precio">Total</th></tr></thead><tbody>${servicios || '<tr><td colspan="4">Sin servicios registrados</td></tr>'}</tbody></table><hr><p>Estado: ${esc(orden.estado)}<span>${esc(estadoPago)}</span></p><p>Subtotal:<span>${monto(orden.subtotal)}</span></p>${descuento ? `<p>Descuento:<span>-${monto(descuento)}</span></p>` : ''}<p class="resaltado">TOTAL:<span>${monto(orden.total)}</span></p><p>Pago recibido:<span>${monto(orden.montoRecibido)}</span></p><p class="resaltado">Saldo pendiente:<span>${monto(saldo)}</span></p><hr><footer>¡Gracias por su preferencia!<br>Presente este ticket al retirar sus prendas.</footer>${politicaHtml}</div>`
  imprimirHtml(ventana, `Ticket ${orden.numero} - Lavandería Salinas`, contenido, `*{box-sizing:border-box}@page{size:80mm auto;margin:0}html,body{margin:0;padding:0}body{width:80mm;padding:6mm 4mm 4mm;font:12px/1.4 'Courier New',Courier,monospace;color:#000}.header,header,footer{text-align:center}.logo-wrap{margin-bottom:6px}.logo{display:inline-block;width:100px;max-width:100%;height:auto}.nombre-local{font-size:14px;font-weight:bold;text-transform:uppercase;letter-spacing:.5px}.num-orden{font-weight:bold;margin-top:3px}hr{border:0;border-top:1px dashed #000;margin:6px 0}table{width:100%;border-collapse:collapse;table-layout:fixed}th{font-size:10px;text-transform:uppercase;padding-bottom:4px;border-bottom:1px dashed #000}td{padding:5px 0;font-size:11px;vertical-align:top;overflow-wrap:anywhere}.cantidad{width:12%;text-align:center}.precio{width:20%;text-align:right}p{margin:3px 0;font-size:11px}p span{float:right}.resaltado{font-size:12px;font-weight:bold}footer{font-size:11px;margin-top:8px}.politica{margin-top:9px;padding-top:7px;border-top:1px dashed #000;font-size:8.5px;line-height:1.3}.politica h2{margin:0 0 5px;text-align:center;text-transform:uppercase;font-size:9px;letter-spacing:.3px}.politica ol{margin:0;padding-left:14px}.politica li{margin:0 0 4px}.politica .contacto{margin:6px 0 0;text-align:center;font-size:8px;overflow-wrap:anywhere}`)
}

export const imprimirTicketPrendas = async (orden: OrdenImprimible) => {
  if (typeof window === 'undefined') return
  const ventana = window.open('', '_blank', 'width=320,height=420')
  if (!ventana) return window.alert('El navegador bloqueó la ventana de impresión. Permite las ventanas emergentes e inténtalo de nuevo.')
  ventana.document.write('<!doctype html><html><body>Preparando ticket de prendas…</body></html>')
  const logoBase64 = await obtenerLogoBase64()
  const servicios = (orden.items || []).map((item) => `${Number(item.cantidad) || 0} × ${esc(item.nombre)}`).join('<br/>') || 'Sin servicios registrados'
  const telefono = `${orden.codigoPais || ''}${orden.telefono || ''}`.trim()
  const logo = logoBase64 ? `<div class="logo-wrap"><img src="${logoBase64}" alt="Logo" class="logo"></div>` : ''
  const entrega = orden.fechaEntregaTexto || [orden.fechaEntrega, orden.horaEntrega].filter(Boolean).join(' ')
  const contenido = `<div class="etiqueta"><header>${logo}<div class="etiqueta-titulo">Lavandería Salinas</div><div class="etiqueta-orden">Orden ${esc(orden.numero)}</div></header><hr><div class="campo"><strong>Cliente:</strong> ${esc(orden.nombreCliente || 'Sin nombre')}</div>${telefono ? `<div class="campo"><strong>Teléfono:</strong> ${esc(telefono)}</div>` : ''}${orden.correo ? `<div class="campo"><strong>Correo:</strong> ${esc(orden.correo)}</div>` : ''}<hr><div class="campo"><strong>Prendas:</strong> ${Number(orden.cantidadPrendas) || 0}</div>${orden.detallesPrendas ? `<div class="campo"><strong>Detalles:</strong><br>${escaparEtiqueta(orden.detallesPrendas)}</div>` : ''}<div class="campo"><strong>Servicios:</strong><br>${servicios}</div>${entrega ? `<div class="campo"><strong>Entrega:</strong><br>${esc(entrega)}</div>` : ''}<hr></div>`
  imprimirHtml(ventana, `Etiqueta ${orden.numero}`, contenido, `*{box-sizing:border-box}@page{size:58mm auto;margin:0}html,body{margin:0;padding:0}body{width:58mm;padding:4mm 3mm;font:11px/1.4 'Courier New',Courier,monospace;color:#000}.logo-wrap{text-align:center;margin-bottom:4px}.logo{width:66px;max-width:100%;height:auto}.etiqueta-titulo{text-align:center;font-weight:bold;font-size:13px;text-transform:uppercase;margin-bottom:4px}.etiqueta-orden{text-align:center;font-weight:bold;margin-bottom:6px}hr{border:0;border-top:1px dashed #000;margin:4px 0}.campo{margin:3px 0;overflow-wrap:anywhere}.campo strong{display:block}.etiqueta-total{margin-top:6px;font-weight:bold;font-size:13px;text-align:center}`)
}
