<template>
  <aside class="pedido-panel force-light">
    <template v-if="!ultimaOrdenCreada">
    <div class="pedido-header">
      <h2><ion-icon :icon="cartOutline" /> Nuevo Pedido</h2>
      <span v-if="cantidadTotal" class="header-badge">{{ cantidadTotal }} artículo{{ cantidadTotal === 1 ? '' : 's' }}</span>
      <ion-icon :icon="helpCircleOutline" class="help-icon" />
    </div>

    <div class="pedido-scroll">
      <div class="seccion-cliente">
        <button class="seccion-toggle" @click="clienteExpandido = !clienteExpandido">
          <span><ion-icon :icon="personOutline" /> Cliente</span>
          <ion-icon :icon="chevronUpOutline" :class="{ rotada: !clienteExpandido }" />
        </button>

        <div v-show="clienteExpandido" class="seccion-cuerpo">
          <!-- Teléfono PRIMERO -->
          <div class="telefono-row">
            <select v-model="pedido.codigoPais" id="pedido-codigo-pais" name="codigoPais" class="select-codigo">
              <option value="+503">sv +503</option>
              <option value="+502">gt +502</option>
              <option value="+504">hn +504</option>
            </select>
            <input
              v-model="pedido.telefono"
              id="pedido-telefono"
              name="telefono"
              class="input-texto"
              :class="{ 'input-error': pedido.telefono && !telefonoValido }"
              type="tel"
              inputmode="numeric"
              placeholder="Teléfono (WhatsApp) *"
            />
          </div>
          <p v-if="pedido.telefono && !telefonoValido" class="error-texto">
            Ingresa un número válido — se usará para enviar la orden por WhatsApp
          </p>

          <!-- Cliente encontrado - Status recurrente -->
          <div v-if="clienteEncontrado" class="cliente-encontrado-block">
            <div class="cliente-encontrado-header">
              <div class="cliente-encontrado-info">
                <span v-if="clienteEncontrado.esRecurrente" class="badge-recurrente">
                  <ion-icon :icon="starOutline" />
                  Recurrente ({{ clienteEncontrado.totalOrdenes }} órdenes)
                </span>
              </div>
            </div>
            <p class="cliente-encontrado-nota">
              Cliente registrado 
            </p>
          </div>

          <!-- Nombre del cliente - readonly si ya existe -->
          <input
            v-model="pedido.nombreCliente"
            id="pedido-nombre-cliente"
            name="nombreCliente"
            class="input-texto"
            :class="{ 'input-nombre-readonly': clienteEncontrado }"
            :readonly="!!clienteEncontrado"
            type="text"
            placeholder="Nombre del cliente *"
          />

          <button class="btn-descuento" @click="mostrarDescuento = !mostrarDescuento">
            <ion-icon :icon="pricetagOutline" /> Aplicar descuento manual
          </button>
          <div v-if="mostrarDescuento" class="input-descuento-row">
            <input
              v-model.number="pedido.descuentoManual"
              id="pedido-descuento"
              name="descuento"
              class="input-texto input-descuento"
              type="number"
              :min="0"
              :max="pedido.descuentoManualTipo === 'porcentaje' ? 100 : undefined"
              :placeholder="pedido.descuentoManualTipo === 'porcentaje' ? '% de descuento' : 'Monto fijo'"
            />
            <select v-model="pedido.descuentoManualTipo" class="input-texto input-descuento-tipo">
              <option value="porcentaje">%</option>
              <option value="dinero">$</option>
            </select>
          </div>

          <!-- Promociones disponibles -->
          <div v-if="promocionesAplicables.length > 0" class="promociones-section">
            <div class="promociones-header">
              <span><ion-icon :icon="starOutline" /> Promociones Vigentes</span>
            </div>
            <div class="promociones-chips">
              <button
                v-for="promo in promocionesAplicables"
                :key="promo.id"
                class="chip-promocion"
                :class="{ activa: promoSeleccionada?.id === promo.id }"
                @click="seleccionarPromocion(promo)"
                :title="promo.descripcion"
              >
                <div class="chip-promo-contenido">
                  <strong>{{ promo.nombre }}</strong>
                  <span class="chip-promo-valor">{{ promo.valor }}%</span>
                </div>
              </button>
            </div>
            <button
              v-if="promoSeleccionada"
              class="btn-limpiar-promo"
              @click="limpiarPromocion"
            >
              <ion-icon :icon="closeOutline" /> Quitar promoción
            </button>
          </div>

          <input
            v-model="pedido.correo"
            id="pedido-correo"
            name="correo"
            class="input-texto"
            type="email"
            placeholder="Correo (opcional)"
          />

          <div v-if="!clienteEncontrado" class="toggle-row">
            <span><ion-icon :icon="bookmarkOutline" /> Guardar cliente</span>
            <ion-toggle v-model="pedido.guardarDirectorio" class="toggle-personalizado" />
          </div>
        </div>
      </div>

      <!-- Envío y entrega -->
      <div class="toggle-row">
        <span><ion-icon :icon="carOutline" /> Envío a domicilio</span>
        <ion-toggle v-model="pedido.envioDomicilio" class="toggle-personalizado" />
      </div>

      <div class="toggle-row">
        <span><ion-icon :icon="calendarOutline" /> Fecha estimada de entrega</span>
        <ion-toggle v-model="pedido.fechaEntregaActiva" class="toggle-personalizado" />
      </div>

      <div v-if="pedido.fechaEntregaActiva" class="fecha-hora-block">
        <div class="fecha-row">
          <span v-if="!editandoFecha"><ion-icon :icon="calendarOutline" /> {{ fechaEntregaTexto }}</span>
          <input
            v-else
            v-model="pedido.fechaEntrega"
            id="pedido-fecha-entrega"
            name="fechaEntrega"
            class="input-fecha"
            type="date"
            :min="fechaMinima"
            @change="editandoFecha = false"
            @blur="editandoFecha = false"
          />
          <button class="link-cambiar" @click="abrirSelectorFecha">
            {{ editandoFecha ? 'Listo' : 'Cambiar' }}
          </button>
        </div>
        <div class="hora-row">
          <input
            v-model="pedido.horaEntrega"
            id="pedido-hora-entrega"
            name="horaEntrega"
            class="input-texto"
            type="time"
          />
          <ion-icon :icon="timeOutline" />
        </div>
      </div>

      <!-- Estado de pago -->
      <div class="botones-fila">
        <button
          class="btn-estado"
          :class="{ 'activo-ambar': pedido.estadoPago === 'porCobrar' }"
          @click="pedido.estadoPago = 'porCobrar'"
        >
          Por cobrar
        </button>
        <button
          class="btn-estado"
          :class="{ 'activo-navy': pedido.estadoPago === 'anticipo' }"
          @click="pedido.estadoPago = 'anticipo'"
        >
          Anticipo
        </button>
        <button
          class="btn-estado"
          :class="{ 'activo-verde': pedido.estadoPago === 'pagado' }"
          @click="pedido.estadoPago = 'pagado'"
        >
          Pagado
        </button>
      </div>

      <!-- Método de pago -->
      <div v-if="pedido.estadoPago === 'pagado' || pedido.estadoPago === 'anticipo'">
        <div class="botones-fila">
          <button
            class="btn-metodo"
            :class="{ 'activo-verde': pedido.metodoPago === 'efectivo' }"
            @click="pedido.metodoPago = 'efectivo'"
          >
            <ion-icon :icon="cashOutline" />
            Efectivo
          </button>
          <button
            class="btn-metodo"
            :class="{ 'activo-navy': pedido.metodoPago === 'tarjeta' }"
            @click="pedido.metodoPago = 'tarjeta'"
          >
            <ion-icon :icon="cardOutline" />
            Tarjeta
          </button>
          <button
            class="btn-metodo"
            :class="{ 'activo-navy': pedido.metodoPago === 'transferencia' }"
            @click="pedido.metodoPago = 'transferencia'"
          >
            <ion-icon :icon="swapHorizontalOutline" />
            Transferencia
          </button>
        </div>

        <div v-if="pedido.metodoPago === 'efectivo'" class="montos-rapidos">
          <button
            v-for="monto in montosRapidos"
            :key="monto"
            class="chip-monto"
            :class="{ active: pedido.montoRecibido === monto }"
            @click="pedido.montoRecibido = monto"
          >
            ${{ monto.toFixed(2) }}
          </button>
          <span class="cambio-texto">
            Cambio: <strong>${{ cambio.toFixed(2) }}</strong>
          </span>
        </div>
      </div>

      <!-- Fotos de la orden -->
      <div class="detalle-fotos">
        <div class="detalle-fotos-header">
          <strong>Fotos opcionales</strong>
        </div>
        <label class="btn-subir-fotos">
          <ion-icon :icon="imageOutline" /> Agregar fotos
          <input type="file" accept="image/*" multiple @change="manejarFotosPedido" hidden />
        </label>
        <div v-if="pedido.fotos?.length" class="fotos-preview">
          <div v-for="(foto, index) in pedido.fotos ?? []" :key="`${foto}-${index}`" class="foto-preview-item">
            <img :src="foto" alt="Foto de la orden" />
            <button type="button" class="btn-quitar-foto" @click="quitarFoto(index)">×</button>
          </div>
        </div>
      </div>

      <!-- Carrito -->
      <div class="carrito-area">
        <div v-if="pedido.items.length === 0" class="carrito-vacio">
          <ion-icon :icon="cartOutline" class="carrito-vacio-icon" />
          <p>Agrega servicios para comenzar</p>
        </div>
        <div v-else class="carrito-lista">
          <div v-for="item in pedido.items" :key="item.id" class="carrito-item">
            <div class="carrito-item-top">
              <div class="carrito-item-info">
                <strong>{{ item.nombre }}</strong>
                <span>${{ item.precio.toFixed(2) }} / {{ etiquetaUnidad(item.unidad) }}</span>
              </div>
              <div class="carrito-item-cantidad">
                <button class="btn-cantidad" @click="decrementar(item.id)">−</button>
                <span>{{ item.cantidad }}</span>
                <button class="btn-cantidad" @click="incrementar(item.id)">+</button>
              </div>
              <span class="carrito-item-subtotal">${{ (item.precio * item.cantidad).toFixed(2) }}</span>
            </div>
            <button class="btn-quitar-item" @click="quitarItem(item.id)">
              <ion-icon :icon="trashOutline" /> Quitar
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="pedido-footer">
      <div class="total-row">
        <span>Total</span>
        <span class="total-monto">${{ total.toFixed(2) }}</span>
      </div>
      <p v-if="pedido.items.length && !pedido.nombreCliente.trim()" class="error-texto error-footer">
        El nombre del cliente es requerido
      </p>
      <p v-else-if="pedido.items.length && !telefonoValido" class="error-texto error-footer">
        El teléfono es requerido para enviar la orden por WhatsApp
      </p>
      <p v-else-if="!turnoAbierto" class="error-texto error-footer">
        Debes abrir un turno antes de crear una orden.
      </p>

      <div class="footer-botones">
        <ion-button class="btn-cancelar-orden" @click="cancelarPedido">
          Cancelar
        </ion-button>
        <ion-button class="btn-crear-orden" :disabled="!puedeCrearOrden" @click="crearOrdenConCliente">
          Crear Orden
        </ion-button>
      </div>
    </div>

    <ion-modal :is-open="mostrarAdvertenciaStock" class="modal-stock" @didDismiss="cerrarAdvertenciaStock">
      <div class="modal-stock-contenido force-light">
        <div class="modal-stock-header">
          <div class="modal-stock-icono">!</div>
          <div>
            <p class="modal-stock-titulo">No hay suficientes insumos</p>
            <p class="modal-stock-subtitulo">
              No hay suficientes insumos para completar esta orden. Revisa los faltantes antes de continuar.
            </p>
          </div>
        </div>

        <div class="modal-stock-lista">
          <article v-for="insumo in faltantesStockModal" :key="insumo.productoId" class="modal-stock-item">
            <div>
              <strong>{{ insumo.nombreProducto }}</strong>
              <span>
                Requiere {{ insumo.requerido.toFixed(2) }} {{ etiquetaUnidadInventario(insumo.unidadMedida) }}
                y hay {{ insumo.disponible.toFixed(2) }}
              </span>
            </div>
            <p class="modal-stock-faltante">
              Faltan {{ insumo.faltante.toFixed(2) }} {{ etiquetaUnidadInventario(insumo.unidadMedida) }}
            </p>
          </article>
        </div>

        <div class="modal-stock-pregunta">
          ¿Quieres continuar con la orden?
        </div>

        <div class="modal-stock-botones">
          <button type="button" class="btn-stock-secundario" @click="cancelarOrdenSinStock">
            No, cancelar
          </button>
          <button type="button" class="btn-stock-principal" @click="continuarOrdenSinStock">
            Sí, continuar
          </button>
        </div>
      </div>
    </ion-modal>
    </template>

    <template v-else>
      <div class="pedido-exito">
        <div class="exito-icono">
          <ion-icon :icon="checkmarkCircleOutline" />
        </div>

        <p class="exito-titulo">Orden creada exitosamente</p>

        <p class="exito-numero">
          Numero de orden:
          <span class="exito-numero-valor">{{ ultimaOrdenCreada.numero }}</span>
        </p>

        <div v-if="ultimaOrdenCreada.fechaEntregaActiva && ultimaOrdenCreada.fechaEntregaTexto" class="exito-fecha-badge">
          <ion-icon :icon="calendarOutline" />
          Fecha estimada de entrega: {{ fechaEntregaCorta }}
        </div>

        <!--div class="exito-anaquel">
          <span class="anaquel-label">
            <ion-icon :icon="fileTrayStackedOutline" />
            Guardar en anaquel
          </span>
          <div class="anaquel-chips">
            <button
              v-for="n in anaquelesDisponibles"
              :key="n"
              type="button"
              class="chip-anaquel"
              :class="{ activo: anaquelSeleccionado === n }"
              @click="anaquelSeleccionado = n"
            >
              {{ n }}
            </button>
          </div>
          <button
            type="button"
            class="btn-guardar-anaquel"
            :disabled="anaquelSeleccionado === null"
            @click="guardarAnaquel"
          >
            Guardar
          </button>
          <button
            v-if="anaquelSeleccionado !== null"
            type="button"
            class="btn-limpiar-anaquel"
            @click="anaquelSeleccionado = null"
          >
            <ion-icon :icon="closeOutline" />
          </button>
        </div>-->

        <div class="exito-acciones">
          <button class="btn-secundario" @click="imprimirPdfOrden">
            <ion-icon :icon="printOutline" />
            Imprimir Ticket
          </button>
          <button class="btn-secundario verde" @click="enviarWhatsApp">
            <ion-icon :icon="logoWhatsapp" />
            Enviar por WhatsApp
          </button>
          <button
            v-if="ultimaOrdenCreada.correo"
            class="btn-secundario azul"
            @click="enviarEmail"
          >
            <ion-icon :icon="mailOutline" />
            Enviar por Email
          </button>
          <button class="btn-principal-exito" @click="nuevaOrden">
            <ion-icon :icon="refreshOutline" />
            Nueva Orden
          </button>
        </div>
      </div>
    </template>
  </aside>
</template>

<script setup lang="ts">
import { IonButton, IonIcon, IonToggle } from '@ionic/vue'
import { computed, nextTick, ref, watch } from 'vue'
import { usePedido } from '@/composables/Usepedido'
import { buscarClientePorTelefono, agregarCliente, type ClienteConEstado } from '@/composables/useClientes'
import { usePromociones, type Promocion } from '@/composables/usePromociones'
import {
  pricetagOutline,
  chevronUpOutline,
  cartOutline,
  helpCircleOutline,
  personOutline,
  bookmarkOutline,
  carOutline,
  calendarOutline,
  timeOutline,
  cashOutline,
  cardOutline,
  swapHorizontalOutline,
  trashOutline,
  checkmarkCircleOutline,
  printOutline,
  logoWhatsapp,
  imageOutline,
  fileTrayStackedOutline,
  closeOutline,
  refreshOutline,
  checkmarkOutline,
  starOutline,
  mailOutline
} from 'ionicons/icons'

const {
  pedido,
  subtotal,
  total,
  cambio,
  cantidadTotal,
  telefonoValido,
  turnoAbierto,
  ultimaOrdenCreada,
  fechaEntregaTexto,
  fechaMinima,
  puedeCrearOrden,
  incrementar,
  decrementar,
  quitarItem,
  crearOrden,
  limpiarUltimaOrdenCreada,
  asignarAnaquel
} = usePedido()

const clienteExpandido = ref(true)
const mostrarDescuento = ref(false)
const editandoFecha = ref(false)
const montosRapidos = [5, 10, 20, 50]
const mostrarAdvertenciaStock = ref(false)
const faltantesStockModal = ref<
  Array<{
    productoId: string
    nombreProducto: string
    unidadMedida: string
    requerido: number
    disponible: number
    faltante: number
  }>
>([])

const anaquelSeleccionado = ref<number | null>(null)
const anaquelesDisponibles = Array.from({ length: 12 }, (_, i) => i + 1)

// Promociones
const { obtenerPromocionesAplicables, calcularDescuentoPromocion } = usePromociones()
const promoSeleccionada = ref<Promocion | null>(null)
const promocionesAplicables = computed(() => {
  return obtenerPromocionesAplicables(
    !!clienteEncontrado.value,
    clienteEncontrado.value?.esRecurrente ?? false,
    clienteEncontrado.value?.totalOrdenes ?? 0
  )
})

const abrirSelectorFecha = () => {
  editandoFecha.value = !editandoFecha.value
}

const MAX_FOTOS_PEDIDO = 6

const manejarFotosPedido = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input?.files?.length) return

  const archivos = Array.from(input.files).slice(0, MAX_FOTOS_PEDIDO - (pedido.fotos?.length ?? 0))
  const nuevasFotos = await Promise.all(
    archivos.map(
      (archivo) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = () => reject(reader.error)
          reader.readAsDataURL(archivo)
        })
    )
  )

  pedido.fotos = [...(pedido.fotos ?? []), ...nuevasFotos]
  input.value = ''
}

const quitarFoto = (index: number) => {
  if (!pedido.fotos) return
  pedido.fotos.splice(index, 1)
}

const formatearFechaCorta = (valor: string) =>
  new Date(valor).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

/** Recorta "Viernes, 14 de agosto" -> "vie, 14 ago 2026" para el badge compacto. */
const fechaEntregaCorta = computed(() => {
  if (!ultimaOrdenCreada.value?.fechaEntregaTexto) return ''
  return ultimaOrdenCreada.value.fechaEntregaTexto
})

const cancelarPedido = () => {
  pedido.nombreCliente = ''
  pedido.codigoPais = '+503'
  pedido.telefono = ''
  pedido.correo = ''
  pedido.descuento = 0
  pedido.descuentoManual = 0
  pedido.descuentoPromocion = 0
  pedido.envioDomicilio = false
  pedido.fechaEntregaActiva = true
  pedido.fechaEntrega = ''
  pedido.horaEntrega = ''
  pedido.estadoPago = 'porCobrar'
  pedido.metodoPago = 'efectivo'
  pedido.montoRecibido = 0
  pedido.guardarDirectorio = false
  pedido.fotos = []
  pedido.items.splice(0, pedido.items.length)
  mostrarDescuento.value = false
  clienteExpandido.value = true
  clienteEncontrado.value = null // Limpiar cliente detectado
  promoSeleccionada.value = null // Limpiar promoción seleccionada
}

// Búsqueda de cliente por teléfono
const clienteEncontrado = ref<ClienteConEstado | null>(null)

const buscarCliente = async (telefono: string) => {
  if (!telefono || telefono.length < 7) {
    clienteEncontrado.value = null
    // Si se borra el teléfono, limpiar también el nombre
    pedido.nombreCliente = ''
    pedido.correo = ''
    return
  }
  clienteEncontrado.value = await buscarClientePorTelefono(telefono)

  // Si se encontró un cliente, autocompletar nombre
  if (clienteEncontrado.value) {
    pedido.nombreCliente = clienteEncontrado.value.nombre
    pedido.correo = clienteEncontrado.value.correo || ''

    // Si es recurrente, activar automáticamente el toggle
    if (clienteEncontrado.value.esRecurrente) {
      pedido.guardarDirectorio = true
    }
  }
}

watch(() => pedido.telefono, (nuevoTelefono) => {
  buscarCliente(nuevoTelefono)
})

// Guardar cliente cuando se marca la opción
const guardarClienteEnDirectorio = async () => {
  if (!pedido.guardarDirectorio) return
  
  const nombre = pedido.nombreCliente?.trim()
  const telefono = pedido.telefono?.trim()
  const correo = pedido.correo?.trim()

  if (!nombre || !telefono) {
    return false // Retorna false si no se puede guardar
  }

  try {
    // Verificar si el cliente ya existe
    if (clienteEncontrado.value) {
      return true // Ya existe, no hace nada pero retorna true
    }

    // Agregar nuevo cliente
    agregarCliente({
      nombre,
      celular: telefono,
      correo: correo || ''
    })
    return true
  } catch (error: any) {
    console.error('Error al guardar cliente:', error)
    return false
  }
}

const crearOrdenConCliente = async () => {
  // Si el toggle está activado, intentar guardar cliente primero
  if (pedido.guardarDirectorio) {
    const guardado = await guardarClienteEnDirectorio()
    if (!guardado) {
      alert('No se pudo guardar el cliente. Verifica que hayas ingresado nombre y teléfono.')
      return
    }
  }

  const resultado = await crearOrden()

  if (resultado?.error) {
    alert(`No se pudo crear la orden: ${resultado.error}`)
    return
  }

  if (resultado && 'faltantes' in resultado && resultado.faltantes.length > 0) {
    faltantesStockModal.value = resultado.faltantes
    mostrarAdvertenciaStock.value = true
    return
  }
}

const cerrarAdvertenciaStock = async () => {
  mostrarAdvertenciaStock.value = false
  await nextTick()
}

const continuarOrdenSinStock = async () => {
  await cerrarAdvertenciaStock()

  if (pedido.guardarDirectorio) {
    const guardado = await guardarClienteEnDirectorio()
    if (!guardado) {
      alert('No se pudo guardar el cliente. Verifica que hayas ingresado nombre y teléfono.')
      return
    }
  }

  const resultado = await crearOrden({ forzarSinStock: true })

  if (resultado?.error) {
    alert(`No se pudo crear la orden: ${resultado.error}`)
  }
}

const cancelarOrdenSinStock = async () => {
  await cerrarAdvertenciaStock()
  cancelarPedido()
}

watch(() => pedido.guardarDirectorio, (guardar) => {
  // El watcher ahora solo marca que se debe guardar, sin ejecutar inmediatamente
  // La lógica de guardado ocurre cuando se crea la orden
})

const escaparHtml = (valor: string) =>
  valor
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

const construirMensajeWhatsApp = () => {
  if (!ultimaOrdenCreada.value) return ''

  const orden = ultimaOrdenCreada.value
  const servicios = orden.items.length
    ? orden.items.map((item) => `${item.cantidad}x ${item.nombre}  $${(item.precio * item.cantidad).toFixed(2)}`).join('\n')
    : 'Sin servicios registrados'
  return [
    '🧺 *LAVANDERÍA SALINAS* 🧺',
    '🎟️ *TICKET DE ORDEN*',
    '----------',
    '📋 DATOS DE LA ORDEN',
    `ORDEN  : ${orden.numero}`,
    `FECHA  : ${formatearFechaCorta(orden.createdAt)}`,
    `CLIENTE: ${orden.nombreCliente}`,
    `PRENDAS: ${Number(orden.cantidadPrendas || 0)}`,
    '----------',
    '🧼 *SERVICIOS*',
    servicios,
    orden.detallesPrendas ? `DETALLES: ${orden.detallesPrendas}` : '',
    '----------',
    '💰 *RESUMEN DE PAGO*',
    `TOTAL: $${orden.total.toFixed(2)}`,
    `PAGO: ${orden.estadoPago === 'pagado' ? 'Pagado' : orden.estadoPago === 'anticipo' ? 'Anticipo' : 'Por cobrar'}`,
    '----------',
    '📌 Te notificaremos cuando esté listo para recoger.'
  ].filter(Boolean).join('\n')
}

const imprimirPdfOrden = () => {
  if (!ultimaOrdenCreada.value || typeof window === 'undefined') return

  const orden = ultimaOrdenCreada.value
  const fecha = formatearFechaCorta(orden.createdAt)
  const ventana = window.open('', '_blank', 'width=900,height=1200')
  if (!ventana) return

  const itemsHtml = orden.items
    .map(
      (item) => `
        <tr>
          <td>${escaparHtml(item.nombre)}</td>
          <td style="text-align:right">${item.cantidad}</td>
          <td style="text-align:right">$${item.precio.toFixed(2)}</td>
          <td style="text-align:right">$${(item.precio * item.cantidad).toFixed(2)}</td>
        </tr>
      `
    )
    .join('')

  ventana.document.write(`
    <html>
      <head>
        <title>${escaparHtml(orden.numero)} - Lavandería Salinas</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 28px; color: #0a1f38; }
          .sheet { max-width: 760px; margin: 0 auto; border: 1px solid #e5edf3; border-radius: 18px; padding: 24px; }
          .header { display: flex; align-items: center; gap: 14px; margin-bottom: 18px; }
          .logo { width: 56px; height: 56px; object-fit: contain; }
          h1 { margin: 0; font-size: 1.5rem; }
          .muted { color: #6f8399; margin: 4px 0 0; }
          .hero { background: #f3fbfa; border: 1px solid #cdebe6; border-radius: 16px; padding: 18px; margin: 18px 0; }
          .hero strong { color: #123a66; }
          table { width: 100%; border-collapse: collapse; margin-top: 18px; }
          th, td { padding: 10px 8px; border-bottom: 1px solid #e6edf3; font-size: 0.95rem; }
          th { text-align: left; color: #5c7289; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.05em; }
          .total { display: flex; justify-content: space-between; margin-top: 18px; font-size: 1.1rem; font-weight: 800; }
          .footer { margin-top: 18px; color: #6f8399; font-size: 0.88rem; }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="header">
              <div>
              <h1>Lavandería Salinas</h1>
              <p class="muted">Tu orden</p>
            </div>
          </div>
          <div class="hero">
            <div><strong>Pedido ${escaparHtml(orden.numero)} creado</strong></div>
            <p>¡Hola ${escaparHtml(orden.nombreCliente)}!</p>
            <p>Tu pedido del ${fecha} ha sido creado exitosamente.</p>
            <p>Prendas recibidas: <strong>${Number(orden.cantidadPrendas || 0)}</strong></p>
            ${orden.detallesPrendas ? `<p>Detalles: ${escaparHtml(orden.detallesPrendas)}</p>` : ''}
            <p><strong>Total:</strong> $${orden.total.toFixed(2)}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Servicio</th>
                <th>Cant.</th>
                <th>Precio</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="total">
            <span>Total</span>
            <span>$${orden.total.toFixed(2)}</span>
          </div>
          <div class="footer">
            Te notificaremos cuando esté listo para recoger.
          </div>
        </div>
        <script>
          window.onload = function () {
            window.print();
            setTimeout(function () { window.close(); }, 250);
          }
        <\/script>
      </body>
    </html>
  `)
  ventana.document.close()
}

const enviarWhatsApp = () => {
  if (!ultimaOrdenCreada.value || typeof window === 'undefined') return

  const orden = ultimaOrdenCreada.value
  const mensaje = construirMensajeWhatsApp()
  if (!mensaje) return
  const numero = `${orden.codigoPais}${orden.telefono}`.replace(/\D/g, '')

  const url = numero
    ? `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`
    : `https://wa.me/?text=${encodeURIComponent(mensaje)}`

  window.open(url, '_blank', 'noopener,noreferrer')
}

const enviarEmail = () => {
  if (!ultimaOrdenCreada.value || typeof window === 'undefined') return
  const orden = ultimaOrdenCreada.value
  if (!orden.correo) return
  imprimirPdfOrden()

  const asunto = `Pedido ${orden.numero} - Lavandería Salinas`
  const cuerpo = construirMensajeWhatsApp()
  const mailtoUrl = `mailto:${encodeURIComponent(orden.correo)}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`
  window.location.href = mailtoUrl
}

const guardarAnaquel = () => {
  if (anaquelSeleccionado.value === null) return
  asignarAnaquel(anaquelSeleccionado.value)
}

const nuevaOrden = () => {
  anaquelSeleccionado.value = null
  limpiarUltimaOrdenCreada()
}

// Promociones
const seleccionarPromocion = (promo: Promocion) => {
  if (promoSeleccionada.value?.id === promo.id) {
    promoSeleccionada.value = null
    pedido.descuentoPromocion = 0
    pedido.descuentoPromocionTipo = 'porcentaje'
  } else {
    promoSeleccionada.value = promo
    pedido.descuentoPromocionTipo = promo.tipoDescuento
    pedido.descuentoPromocion = promo.valor
  }
}

const limpiarPromocion = () => {
  promoSeleccionada.value = null
  pedido.descuentoPromocion = 0
  pedido.descuentoPromocionTipo = 'porcentaje'
}

const etiquetaUnidad = (u: string) => {
  const map: Record<string, string> = {
    kilo: 'kilo',
    libra: 'lb',
    pieza: 'pieza',
    m2: 'm²',
    otro: 'unidad'
  }
  return map[u] ?? 'unidad'
}

const etiquetaUnidadInventario = (u: string) => {
  const map: Record<string, string> = {
    pieza: 'pz',
    litro: 'L',
    mililitro: 'mL',
    kilogramo: 'kg',
    gramo: 'g',
    paquete: 'paq',
    caja: 'caja',
    otro: 'u'
  }
  return map[u] ?? 'u'
}
</script>

<style scoped>
/* Fuerza colores claros sin importar el tema del sistema/OS */
.force-light {
  --ion-background-color: #ffffff;
  --ion-text-color: #0a1f38;
  color-scheme: light;
}

.pedido-panel {
  width: 380px;
  flex-shrink: 0;
  background: #ffffff;
  border: 1px solid rgba(10, 31, 56, 0.08);
  border-radius: 18px;
  display: flex;
  flex-direction: column;
  min-width: 0;

  height: 100%;
  align-self: stretch;

  min-height: 0;
  overflow: hidden;
  box-shadow: 0 4px 22px rgba(10, 31, 56, 0.06);
}

.pedido-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 20px 20px 12px;
  flex-shrink: 0;
}

.pedido-header h2 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
  color: #0a1f38;
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-badge {
  background: #123a66;
  color: #f5f9fc;
  border-radius: 999px;
  padding: 2px 10px;
  font-size: 0.74rem;
  font-weight: 800;
}

.help-icon {
  color: #9fb4c9;
  font-size: 20px;
  margin-left: auto;
}

.pedido-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  scrollbar-width: thin;
  scrollbar-color: rgba(10, 31, 56, 0.18) transparent;
}

.pedido-scroll::-webkit-scrollbar {
  width: 6px;
}

.pedido-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.pedido-scroll::-webkit-scrollbar-thumb {
  background: rgba(10, 31, 56, 0.18);
  border-radius: 999px;
}

.pedido-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(10, 31, 56, 0.30);
}

.seccion-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: none;
  border: none;
  padding: 6px 0;
  font-weight: 800;
  color: #0a1f38;
  cursor: pointer;
}

.seccion-toggle span {
  display: flex;
  align-items: center;
  gap: 6px;
}

.seccion-toggle ion-icon.rotada {
  transform: rotate(180deg);
}

.seccion-cuerpo {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
}

.input-texto {
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(10, 31, 56, 0.14);
  font-size: 0.9rem;
  color: #0a1f38;
  outline: none;
  background: #fbfdfe;
}

.input-texto:focus {
  border-color: #a9d8ee;
  box-shadow: 0 0 0 3px rgba(169, 216, 238, 0.25);
}

.input-error {
  border-color: #dc2626 !important;
}

.input-nombre-readonly {
  background: rgba(22, 163, 74, 0.08);
  border-color: rgba(22, 163, 74, 0.3);
  color: #15803d;
  font-weight: 600;
  cursor: not-allowed;
}

.error-texto {
  margin: -4px 0 0;
  font-size: 0.76rem;
  color: #dc2626;
  font-weight: 600;
}

.error-footer {
  text-align: center;
  margin-bottom: 8px;
}

.btn-descuento {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border-radius: 12px;
  border: 1.5px dashed #e0b64a;
  background: rgba(224, 182, 74, 0.08);
  color: #a5791f;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
}

.input-descuento {
  border-color: #e0b64a;
}

/* ── Sección de Promociones ── */
.promociones-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: rgba(18, 58, 102, 0.06);
  border: 1px solid rgba(18, 58, 102, 0.16);
  border-radius: 12px;
  padding: 12px;
  margin-top: 4px;
}

.promociones-header {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #123a66;
  font-weight: 700;
  font-size: 0.85rem;
}

.promociones-chips {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.chip-promocion {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1.5px solid rgba(18, 58, 102, 0.24);
  background: #ffffff;
  color: #123a66;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s ease;
  text-align: left;
}

.chip-promocion:hover {
  border-color: #123a66;
  background: rgba(18, 58, 102, 0.08);
}

.chip-promocion.activa {
  background: #123a66;
  color: #f5f9fc;
  border-color: #123a66;
  box-shadow: 0 4px 12px rgba(18, 58, 102, 0.2);
}

.chip-promo-contenido {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 8px;
}

.chip-promo-contenido strong {
  flex: 1;
}

.chip-promo-valor {
  flex-shrink: 0;
  font-weight: 800;
  font-size: 0.88rem;
}

.btn-limpiar-promo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 8px;
  border: none;
  background: rgba(220, 38, 38, 0.12);
  color: #dc2626;
  font-weight: 700;
  font-size: 0.78rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-limpiar-promo:hover {
  background: rgba(220, 38, 38, 0.2);
}

.cliente-encontrado-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: rgba(34, 197, 94, 0.08);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 12px;
  padding: 12px;
  margin-top: 4px;
}

.cliente-encontrado-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.cliente-encontrado-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cliente-encontrado-info strong {
  color: #15803d;
  font-weight: 800;
  font-size: 0.95rem;
}

.badge-recurrente {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(34, 197, 94, 0.12);
  color: #15803d;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  width: fit-content;
}

.cliente-encontrado-nota {
  margin: 0;
  font-size: 0.76rem;
  color: #15803d;
  font-weight: 600;
}

.telefono-row {
  display: flex;
  gap: 8px;
}

.select-codigo {
  border-radius: 12px;
  border: 1px solid rgba(10, 31, 56, 0.14);
  padding: 0 10px;
  font-size: 0.88rem;
  color: #0a1f38;
  background: #fbfdfe;
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.88rem;
  color: #24405f;
  font-weight: 600;
}

.toggle-row span {
  display: flex;
  align-items: center;
  gap: 6px;
}

.toggle-personalizado {
  --track-background: rgba(10, 31, 56, 0.14);
  --track-background-checked: #123a66;
  --handle-background: #ffffff;
}

.fecha-hora-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: rgba(169, 216, 238, 0.08);
  border: 1px solid rgba(169, 216, 238, 0.30);
  border-radius: 12px;
  padding: 12px;
}

.fecha-row,
.hora-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.88rem;
  color: #0a1f38;
  font-weight: 600;
  gap: 8px;
}

.fecha-row span {
  display: flex;
  align-items: center;
  gap: 6px;
}

.input-fecha {
  flex: 1;
  border: 1px solid rgba(10, 31, 56, 0.14);
  border-radius: 8px;
  padding: 6px 8px;
  font-size: 0.85rem;
  color: #0a1f38;
  background: #ffffff;
}

.hora-row input {
  border: none;
  background: transparent;
  font-weight: 600;
  color: #0a1f38;
  flex: 1;
}

.link-cambiar {
  border: none;
  background: none;
  color: #123a66;
  font-weight: 800;
  cursor: pointer;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.hint-texto {
  margin: 0;
  font-size: 0.76rem;
  color: #7c8fa6;
}

.botones-fila {
  display: flex;
  gap: 8px;
}

/* Botones de estado de pago y método de pago:
   icono + texto en fila horizontal, mismos colores de siempre. */
.btn-estado,
.btn-metodo {
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 11px 8px;
  border-radius: 12px;
  border: 1.5px solid rgba(10, 31, 56, 0.12);
  background: #fbfdfe;
  color: #4a627e;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease;
}

.btn-metodo ion-icon {
  font-size: 17px;
}

.activo-ambar {
  border-color: #e0b64a;
  color: #a5791f;
  background: rgba(224, 182, 74, 0.10);
}

.activo-navy {
  border-color: #123a66;
  color: #123a66;
  background: rgba(18, 58, 102, 0.08);
}

.activo-verde {
  border-color: #16a34a;
  color: #15803d;
  background: rgba(22, 163, 74, 0.10);
}

.montos-rapidos {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.footer-botones {
  display: flex;
  gap: 10px;
}

.footer-botones ion-button {
  flex: 1;
  margin: 0;
}

.btn-cancelar-orden {
  --background: #ffffff;
  --background-hover: #f5f9fc;
  --color: #4a627e;
  --border-radius: 14px;
  --border-width: 1.5px;
  --border-style: solid;
  --border-color: rgba(10, 31, 56, 0.14);
  font-weight: 800;
  height: 48px;
}

.btn-crear-orden {
  --background: #123a66;
  --background-hover: #0d2b4e;
  --color: #f5f9fc;
  --border-radius: 14px;
  font-weight: 800;
  height: 48px;
}

.btn-crear-orden[disabled] {
  --background: rgba(10, 31, 56, 0.10);
  --color: #9fb4c9;
}

.modal-stock {
  --width: min(520px, calc(100vw - 24px));
  --border-radius: 22px;
}

.modal-stock-contenido {
  background: #ffffff;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal-stock-header {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.modal-stock-icono {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: rgba(224, 182, 74, 0.18);
  color: #a5791f;
  display: grid;
  place-items: center;
  font-weight: 900;
  flex-shrink: 0;
}

.modal-stock-titulo {
  margin: 0;
  font-size: 1rem;
  font-weight: 900;
  color: #0a1f38;
}

.modal-stock-subtitulo {
  margin: 4px 0 0;
  color: #5c7289;
  line-height: 1.45;
}

.modal-stock-lista {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 220px;
  overflow-y: auto;
  padding-right: 4px;
}

.modal-stock-item {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: flex-start;
  border: 1px solid rgba(10, 31, 56, 0.08);
  border-radius: 14px;
  padding: 12px;
  background: #fbfdfe;
}

.modal-stock-item strong {
  display: block;
  color: #0a1f38;
  font-size: 0.92rem;
}

.modal-stock-item span {
  display: block;
  color: #6f8399;
  font-size: 0.82rem;
  margin-top: 4px;
  line-height: 1.35;
}

.modal-stock-faltante {
  margin: 0;
  color: #dc2626;
  font-weight: 800;
  font-size: 0.82rem;
  white-space: nowrap;
}

.modal-stock-pregunta {
  font-weight: 800;
  color: #0a1f38;
  text-align: center;
}

.modal-stock-botones {
  display: flex;
  gap: 10px;
}

.modal-stock-botones button {
  flex: 1;
}

.btn-stock-secundario,
.btn-stock-principal {
  border: none;
  border-radius: 14px;
  padding: 14px 16px;
  font-weight: 900;
  font-size: 0.94rem;
  cursor: pointer;
  min-height: 50px;
  box-shadow: 0 8px 18px rgba(10, 31, 56, 0.08);
  transition: transform 0.14s ease, box-shadow 0.14s ease, filter 0.14s ease;
}

.btn-stock-secundario:hover,
.btn-stock-principal:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 22px rgba(10, 31, 56, 0.12);
}

.btn-stock-secundario {
  background: #ffffff;
  color: #123a66;
  border: 1.5px solid rgba(18, 58, 102, 0.24);
}

.btn-stock-principal {
  background: linear-gradient(135deg, #123a66 0%, #1b548f 100%);
  color: #f5f9fc;
}

.btn-stock-principal:active,
.btn-stock-secundario:active {
  transform: translateY(0);
  box-shadow: 0 6px 14px rgba(10, 31, 56, 0.08);
}
.chip-monto {
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid rgba(10, 31, 56, 0.12);
  background: #fbfdfe;
  color: #24405f;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
}

.chip-monto.active {
  background: #16a34a;
  border-color: #16a34a;
  color: #ffffff;
}

.cambio-texto {
  margin-left: auto;
  font-size: 0.85rem;
  color: #16a34a;
  font-weight: 700;
}

/* ── Fotos de la orden ── */
.detalle-fotos {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detalle-fotos-header {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.btn-subir-fotos {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1.5px dashed rgba(10, 31, 56, 0.18);
  background: #fbfdfe;
  color: #24405f;
  font-weight: 700;
  font-size: 0.82rem;
  cursor: pointer;
}

/* Miniaturas de fotos, en fila con wrap para no saturar el panel */
.fotos-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.foto-preview-item {
  position: relative;
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(10, 31, 56, 0.12);
}

.foto-preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.btn-quitar-foto {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: none;
  background: rgba(10, 31, 56, 0.65);
  color: #ffffff;
  font-size: 11px;
  line-height: 1;
  display: grid;
  place-items: center;
  cursor: pointer;
  padding: 0;
}

/* ── Carrito ── */
.carrito-area {
  min-height: 100px;
  padding: 12px 0;
}

.carrito-vacio {
  text-align: center;
  color: #9fb4c9;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100px;
}

.carrito-vacio-icon {
  font-size: 36px;
  margin-bottom: 6px;
}

.carrito-lista {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.carrito-item {
  padding: 10px 12px;
  border-radius: 12px;
  background: #fbfdfe;
  border: 1px solid rgba(10, 31, 56, 0.08);
}

.carrito-item-top {
  display: flex;
  align-items: center;
  gap: 10px;
}

.carrito-item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.carrito-item-info strong {
  font-size: 0.88rem;
  color: #0a1f38;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.carrito-item-info span {
  font-size: 0.76rem;
  color: #9fb4c9;
}

.carrito-item-cantidad {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.btn-cantidad {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid rgba(10, 31, 56, 0.14);
  background: #ffffff;
  color: #123a66;
  font-weight: 800;
  display: grid;
  place-items: center;
  cursor: pointer;
  line-height: 1;
}

.carrito-item-cantidad span {
  min-width: 16px;
  text-align: center;
  font-weight: 700;
  color: #0a1f38;
  font-size: 0.86rem;
}

.carrito-item-subtotal {
  flex-shrink: 0;
  font-weight: 800;
  color: #123a66;
  font-size: 0.9rem;
  min-width: 50px;
  text-align: right;
}

.btn-quitar-item {
  margin-top: 6px;
  border: none;
  background: none;
  color: #dc2626;
  font-size: 0.74rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  padding: 0;
}

.pedido-footer {
  padding: 16px 20px 20px;
  border-top: 1px solid rgba(10, 31, 56, 0.08);
  flex-shrink: 0;
}

.total-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 800;
  color: #0a1f38;
  margin-bottom: 12px;
}

.total-monto {
  color: #123a66;
  font-size: 1.15rem;
}

.btn-crear-orden {
  width: 100%;
  --background: #123a66;
  --background-hover: #0d2b4e;
  --color: #f5f9fc;
  --border-radius: 14px;
  font-weight: 800;
  height: 48px;
}

.btn-crear-orden[disabled] {
  --background: rgba(10, 31, 56, 0.10);
  --color: #9fb4c9;
}

/* ── Pantalla de éxito ── */
.pedido-exito {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 20px 20px;
  gap: 14px;
  overflow-y: auto;
}

.exito-icono {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  background: rgba(22, 163, 74, 0.12);
  display: grid;
  place-items: center;
  margin-bottom: 2px;
}

.exito-icono ion-icon {
  font-size: 38px;
  color: #16a34a;
}

.exito-titulo {
  margin: 0;
  font-size: 1.12rem;
  font-weight: 800;
  color: #0a1f38;
  text-align: center;
}

.exito-numero {
  margin: 0;
  font-size: 0.9rem;
  color: #7c8fa6;
  font-weight: 600;
  text-align: center;
}

.exito-numero-valor {
  color: #16a34a;
  font-weight: 800;
}

.exito-fecha-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(18, 58, 102, 0.06);
  color: #123a66;
  border: 1px solid rgba(18, 58, 102, 0.14);
  border-radius: 999px;
  padding: 8px 16px;
  font-size: 0.8rem;
  font-weight: 700;
  text-align: center;
}

.exito-fecha-badge ion-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.exito-anaquel {
  width: 100%;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  background: #fbfdfe;
  border: 1px solid rgba(10, 31, 56, 0.10);
  border-radius: 14px;
  padding: 12px 14px;
  margin-top: 4px;
}

.anaquel-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  font-weight: 700;
  color: #24405f;
  flex-shrink: 0;
}
.btn-secundario.azul {
  border-color: rgba(18, 58, 102, 0.35);
  color: #123a66;
}
.anaquel-chips {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  flex: 1;
  min-width: 60px;
  scrollbar-width: none;
}

.anaquel-chips::-webkit-scrollbar {
  display: none;
}

.chip-anaquel {
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border-radius: 8px;
  border: 1px solid rgba(10, 31, 56, 0.14);
  background: #ffffff;
  color: #24405f;
  font-weight: 700;
  font-size: 0.8rem;
  cursor: pointer;
}

.chip-anaquel.activo {
  background: #123a66;
  border-color: #123a66;
  color: #ffffff;
}

.btn-guardar-anaquel {
  border: none;
  border-radius: 10px;
  padding: 8px 16px;
  background: #16a34a;
  color: #ffffff;
  font-weight: 800;
  font-size: 0.8rem;
  cursor: pointer;
  flex-shrink: 0;
}

.btn-guardar-anaquel[disabled] {
  background: rgba(10, 31, 56, 0.10);
  color: #9fb4c9;
  cursor: not-allowed;
}

.btn-limpiar-anaquel {
  border: none;
  background: none;
  color: #9fb4c9;
  font-size: 18px;
  cursor: pointer;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  padding: 0;
}

.exito-acciones {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: auto;
  padding-top: 18px;
}

.btn-secundario {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 13px;
  border-radius: 14px;
  border: 1.5px solid rgba(18, 58, 102, 0.30);
  background: #ffffff;
  color: #123a66;
  font-weight: 800;
  font-size: 0.92rem;
  cursor: pointer;
}

.btn-secundario.verde {
  border-color: rgba(22, 163, 74, 0.40);
  color: #15803d;
}

.btn-secundario ion-icon {
  font-size: 18px;
}

.btn-principal-exito {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  border-radius: 14px;
  border: none;
  background: #123a66;
  color: #f5f9fc;
  font-weight: 800;
  font-size: 0.94rem;
  cursor: pointer;
}

.btn-principal-exito ion-icon {
  font-size: 18px;
}

@media (max-width: 900px) {
  .pedido-panel {
    width: 100%;
    height: auto;
    max-height: 70vh;
  }
}
</style>
