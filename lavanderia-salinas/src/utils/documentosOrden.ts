import { jsPDF } from 'jspdf'
import type { Orden } from '@/composables/useOrdenes'
import logoTicket from '@/assets/logo.jpg'

const textoSeguro = (valor: unknown) => String(valor ?? '').replace(/[\u0000-\u001f]/g, ' ').trim()
const monto = (valor: unknown) => `$${(Number(valor) || 0).toFixed(2)}`
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
  const pdf = new jsPDF({ unit: 'mm', format: 'letter' })
  const margen = 18
  const ancho = pdf.internal.pageSize.getWidth()
  const alto = pdf.internal.pageSize.getHeight()
  const anchoTexto = ancho - margen * 2
  let y = 22

  const agregarTexto = (texto: string, opciones: { negrita?: boolean; tamano?: number; sangria?: number } = {}) => {
    const { negrita = false, tamano = 10, sangria = 0 } = opciones
    pdf.setFont('helvetica', negrita ? 'bold' : 'normal')
    pdf.setFontSize(tamano)
    const lineas = pdf.splitTextToSize(texto, anchoTexto - sangria)
    if (y + lineas.length * (tamano * 0.45) > alto - 18) {
      pdf.addPage()
      y = 20
    }
    pdf.text(lineas, margen + sangria, y)
    y += lineas.length * (tamano * 0.45) + 2
  }

  pdf.setTextColor(18, 58, 102)
  agregarTexto('LAVANDERÍA SALINAS', { negrita: true, tamano: 18 })
  agregarTexto(`Detalle de orden ${textoSeguro(orden.numero)}`, { negrita: true, tamano: 13 })
  pdf.setDrawColor(18, 58, 102)
  pdf.line(margen, y, ancho - margen, y)
  y += 8
  pdf.setTextColor(35, 45, 58)

  agregarTexto(`Cliente: ${textoSeguro(orden.nombreCliente)}`, { negrita: true })
  agregarTexto(`Fecha de creación: ${textoSeguro(orden.createdAt)}`)
  agregarTexto(`Estado: ${textoSeguro(orden.estado)}   |   Pago: ${textoSeguro(orden.estadoPago)}`)
  agregarTexto(`Teléfono: ${textoSeguro(`${orden.codigoPais || ''} ${orden.telefono || ''}`)}`)
  agregarTexto(`Fecha de entrega: ${textoSeguro(orden.fechaEntrega || 'Sin fecha')}${orden.horaEntrega ? `, ${textoSeguro(orden.horaEntrega)}` : ''}`)
  agregarTexto(`Prendas recibidas: ${Number(orden.cantidadPrendas) || 0}`)
  if (orden.detallesPrendas) agregarTexto(`Detalles de prendas: ${textoSeguro(orden.detallesPrendas)}`)

  y += 4
  agregarTexto('SERVICIOS', { negrita: true, tamano: 12 })
  for (const item of orden.items || []) {
    agregarTexto(`${Number(item.cantidad) || 0} × ${textoSeguro(item.nombre)} — ${monto(item.precio)} c/u — ${monto(Number(item.precio) * Number(item.cantidad))}`, { sangria: 2 })
  }
  if (!orden.items?.length) agregarTexto('Sin servicios registrados', { sangria: 2 })

  y += 4
  pdf.setDrawColor(210, 220, 230)
  pdf.line(margen, y, ancho - margen, y)
  y += 7
  agregarTexto(`Subtotal: ${monto(orden.subtotal)}`)
  agregarTexto(`Descuento: ${monto(Math.max(0, Number(orden.subtotal) - Number(orden.total)))}`)
  agregarTexto(`Total: ${monto(orden.total)}`, { negrita: true, tamano: 12 })
  agregarTexto(`Monto recibido: ${monto(orden.montoRecibido)}`)
  agregarTexto(`Saldo pendiente: ${monto(Math.max(0, Number(orden.total) - Number(orden.montoRecibido)))}`)

  const numeroSeguro = textoSeguro(orden.numero).replace(/[^a-z0-9_-]/gi, '') || textoSeguro(orden.id)
  pdf.save(`Orden-${numeroSeguro}.pdf`)
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
  const contenido = `<div class="contenedor-ticket"><header>${logo}<div class="nombre-local">Lavandería Salinas</div><div class="num-orden">ORDEN DE SERVICIO ${esc(orden.numero)}</div></header><hr><div><b>Cliente:</b> ${esc(orden.nombreCliente)}${fecha ? `<br><b>Fecha:</b> ${esc(fecha)}` : ''}<br><b>Cant. prendas:</b> ${Number(orden.cantidadPrendas) || 0}${telefono ? `<br><b>Teléfono:</b> ${esc(telefono)}` : ''}${orden.correo ? `<br><b>Correo:</b> ${esc(orden.correo)}` : ''}${entrega ? `<br><b>Entrega:</b> ${esc(entrega)}` : ''}${orden.detallesPrendas ? `<br><b>Detalles:</b> ${escaparEtiqueta(orden.detallesPrendas)}` : ''}</div><hr><table><thead><tr><th class="cantidad">Cant</th><th>Servicio</th><th class="precio">P.U.</th><th class="precio">Total</th></tr></thead><tbody>${servicios || '<tr><td colspan="4">Sin servicios registrados</td></tr>'}</tbody></table><hr><p>Estado: ${esc(orden.estado)}<span>${esc(orden.estadoPago)}</span></p><p>Subtotal:<span>${monto(orden.subtotal)}</span></p>${descuento ? `<p>Descuento:<span>-${monto(descuento)}</span></p>` : ''}<p class="resaltado">TOTAL:<span>${monto(orden.total)}</span></p><p>Pago recibido:<span>${monto(orden.montoRecibido)}</span></p><p class="resaltado">Saldo pendiente:<span>${monto(saldo)}</span></p><hr><footer>¡Gracias por su preferencia!<br>Presente este ticket al retirar sus prendas.</footer>${politicaHtml}</div>`
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
