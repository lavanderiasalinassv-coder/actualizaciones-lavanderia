const STORAGE_KEY = 'impresora_bluetooth_predeterminada'
const COMPATIBLE_SERVICES = [
  '0000ffe0-0000-1000-8000-00805f9b34fb',
  '0000ae30-0000-1000-8000-00805f9b34fb',
  '000018f0-0000-1000-8000-00805f9b34fb',
  '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
]

interface BluetoothCharacteristic {
  uuid: string
  properties: { write: boolean; writeWithoutResponse: boolean }
  writeValue?: (value: Uint8Array) => Promise<void>
  writeValueWithResponse?: (value: Uint8Array) => Promise<void>
  writeValueWithoutResponse?: (value: Uint8Array) => Promise<void>
}

interface BluetoothService {
  uuid: string
  getCharacteristics(): Promise<BluetoothCharacteristic[]>
  getCharacteristic(uuid: string): Promise<BluetoothCharacteristic>
}

interface BluetoothServer {
  getPrimaryServices(): Promise<BluetoothService[]>
  getPrimaryService(uuid: string): Promise<BluetoothService>
}

interface BluetoothDevice {
  id: string
  name?: string
  gatt?: {
    connected: boolean
    connect(): Promise<BluetoothServer>
    disconnect(): void
  }
}

interface BluetoothApi {
  requestDevice(options: {
    acceptAllDevices: boolean
    optionalServices: string[]
  }): Promise<BluetoothDevice>
  getDevices(): Promise<BluetoothDevice[]>
}

interface ImpresoraBluetooth {
  deviceId: string
  name: string
  serviceUuid: string
  characteristicUuid: string
  paperWidth: 58 | 80
}

const obtenerApiBluetooth = () =>
  typeof navigator === 'undefined'
    ? undefined
    : (navigator as Navigator & { bluetooth?: BluetoothApi }).bluetooth

export const bluetoothDisponible = () =>
  Boolean(obtenerApiBluetooth()?.requestDevice && obtenerApiBluetooth()?.getDevices)

export const cargarImpresoraBluetooth = (): ImpresoraBluetooth | null => {
  if (typeof localStorage === 'undefined') return null
  const contenido = localStorage.getItem(STORAGE_KEY)
  if (!contenido) return null
  const valor: unknown = JSON.parse(contenido)
  if (
    !valor ||
    typeof valor !== 'object' ||
    !('deviceId' in valor) ||
    !('serviceUuid' in valor) ||
    !('characteristicUuid' in valor) ||
    !('name' in valor) ||
    !('paperWidth' in valor)
  ) {
    throw new Error('La configuración de la impresora guardada no es válida. Vuelve a seleccionarla.')
  }
  const impresora = valor as ImpresoraBluetooth
  if (
    typeof impresora.deviceId !== 'string' ||
    typeof impresora.serviceUuid !== 'string' ||
    typeof impresora.characteristicUuid !== 'string' ||
    typeof impresora.name !== 'string' ||
    (impresora.paperWidth !== 58 && impresora.paperWidth !== 80)
  ) {
    throw new Error('La configuración de la impresora guardada no es válida. Vuelve a seleccionarla.')
  }
  return impresora
}

export const tieneImpresoraBluetoothPredeterminada = () =>
  typeof localStorage !== 'undefined' && Boolean(localStorage.getItem(STORAGE_KEY))

export const impresoraBluetoothAutorizada = async (deviceId: string) => {
  const bluetooth = obtenerApiBluetooth()
  if (!bluetooth) return false
  const dispositivos = await bluetooth.getDevices()
  return dispositivos.some((device) => device.id === deviceId)
}

const encontrarCaracteristicaDeEscritura = async (
  server: BluetoothServer,
): Promise<{ service: BluetoothService; characteristic: BluetoothCharacteristic }> => {
  for (const service of await server.getPrimaryServices()) {
    if (!COMPATIBLE_SERVICES.includes(service.uuid.toLowerCase())) continue
    const characteristic = (await service.getCharacteristics()).find(
      ({ properties }) => properties.write || properties.writeWithoutResponse,
    )
    if (characteristic) return { service, characteristic }
  }
  throw new Error(
    'La impresora no expone un servicio BLE de escritura compatible (FFE0, 18F0 o Nordic UART).',
  )
}

export const seleccionarImpresoraBluetooth = async (
  paperWidth: 58 | 80,
): Promise<ImpresoraBluetooth> => {
  const bluetooth = obtenerApiBluetooth()
  if (!bluetooth) {
    throw new Error('Web Bluetooth no está disponible. Usa Chrome sobre Android para configurar una impresora BLE.')
  }

  const device = await bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: COMPATIBLE_SERVICES,
  })
  if (!device.gatt) throw new Error('No se pudo abrir la conexión BLE de la impresora.')

  let connected = false
  try {
    const server = await device.gatt.connect()
    connected = true
    const { service, characteristic } = await encontrarCaracteristicaDeEscritura(server)
    const impresora: ImpresoraBluetooth = {
      deviceId: device.id,
      name: device.name || 'Impresora Bluetooth',
      serviceUuid: service.uuid,
      characteristicUuid: characteristic.uuid,
      paperWidth,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(impresora))
    return impresora
  } finally {
    if (connected) device.gatt.disconnect()
  }
}

export const actualizarAnchoPapelBluetooth = (paperWidth: 58 | 80) => {
  const impresora = cargarImpresoraBluetooth()
  if (impresora) localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...impresora, paperWidth }))
}

export const quitarImpresoraBluetooth = () => {
  localStorage.removeItem(STORAGE_KEY)
}

const contenidoComoTexto = (html: string) => {
  const documentTicket = new DOMParser().parseFromString(html, 'text/html')
  if (documentTicket.querySelector('img[alt="Cupón QR"]')) {
    throw new Error('La impresión BLE genérica no admite códigos QR. Desactiva el cupón QR o usa el diálogo normal de impresión.')
  }

  const bloques = new Set(['DIV', 'HEADER', 'FOOTER', 'SECTION', 'P', 'H1', 'H2', 'H3', 'LI', 'TR'])
  const nodosAlineados = new Set(['TD', 'TH'])
  const extraer = (nodo: Node): string => {
    if (nodo.nodeType === Node.TEXT_NODE) return nodo.textContent || ''
    if (!(nodo instanceof Element)) return ''
    if (nodo.tagName === 'IMG' || nodo.tagName === 'STYLE' || nodo.tagName === 'SCRIPT') return ''
    const contenido = Array.from(nodo.childNodes, extraer).join('')
    if (nodo.tagName === 'BR' || nodo.tagName === 'HR') return '\n'
    if (nodosAlineados.has(nodo.tagName)) return `${contenido.trim()}  `
    return bloques.has(nodo.tagName) ? `${contenido}\n` : contenido
  }

  return extraer(documentTicket.body)
    .replace(/[ \t]+\n/g, '\n')
    .replace(/[ \t]{2,}/g, '  ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

const envolverTexto = (texto: string, ancho: number) =>
  texto.split('\n').flatMap((linea) => {
    const palabras = linea.trim().split(/\s+/).filter(Boolean)
    if (!palabras.length) return ['']
    const resultado: string[] = []
    let actual = ''
    for (const palabra of palabras) {
      if (actual && `${actual} ${palabra}`.length > ancho) {
        resultado.push(actual)
        actual = palabra
      } else {
        actual = actual ? `${actual} ${palabra}` : palabra
      }
    }
    resultado.push(actual)
    return resultado
  })

const escribirBytes = async (
  characteristic: BluetoothCharacteristic,
  data: Uint8Array,
) => {
  for (let offset = 0; offset < data.length; offset += 20) {
    const fragmento = data.slice(offset, offset + 20)
    if (characteristic.properties.writeWithoutResponse && characteristic.writeValueWithoutResponse) {
      await characteristic.writeValueWithoutResponse(fragmento)
    } else if (characteristic.writeValueWithResponse) {
      await characteristic.writeValueWithResponse(fragmento)
    } else if (characteristic.writeValue) {
      await characteristic.writeValue(fragmento)
    } else {
      throw new Error('La característica Bluetooth no admite escritura desde este navegador.')
    }
  }
}

export const imprimirHtmlEnImpresoraBluetooth = async (html: string) => {
  const impresora = cargarImpresoraBluetooth()
  if (!impresora || !bluetoothDisponible()) return false

  const bluetooth = obtenerApiBluetooth()
  if (!bluetooth) return false
  const dispositivos = await bluetooth.getDevices()
  const device = dispositivos.find(({ id }) => id === impresora.deviceId)
  if (!device?.gatt) {
    throw new Error('No se encontró el permiso de esta impresora en el navegador. Vuelve a seleccionarla en Configuración.')
  }

  let connected = false
  try {
    const server = await device.gatt.connect()
    connected = true
    const service = await server.getPrimaryService(impresora.serviceUuid)
    const characteristic = await service.getCharacteristic(impresora.characteristicUuid)
    const width = impresora.paperWidth === 58 ? 32 : 48
    const texto = envolverTexto(contenidoComoTexto(html), width)
      .join('\n')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\x20-\x7e\n]/g, '?')
    const bytes = new Uint8Array([0x1b, 0x40, ...new TextEncoder().encode(`${texto}\n\n\n`)])
    await escribirBytes(characteristic, bytes)
    return true
  } catch (error) {
    if (error instanceof Error) throw error
    throw new Error('No se pudo enviar el ticket a la impresora Bluetooth.')
  } finally {
    if (connected) device.gatt.disconnect()
  }
}

export type { ImpresoraBluetooth }
