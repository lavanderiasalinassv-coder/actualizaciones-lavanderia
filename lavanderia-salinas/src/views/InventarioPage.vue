<template>
  <AppShell>
    <div class="page-content">
      <div v-if="cargando" class="inventario-loading" aria-live="polite">
        <ion-spinner name="crescent" />
        <span>Actualizando inventario...</span>
      </div>

      <div class="header-row">
        <div>
          <h1>Inventario de insumos</h1>
        </div>

        <ion-button class="btn-primario" @click="abrirFormulario()">
          <ion-icon :icon="addOutline" slot="start" />
          Agregar insumo
        </ion-button>
        <ion-button class="btn-refill" @click="abrirRefill()">
          <ion-icon :icon="refreshOutline" slot="start" />
          Refill
        </ion-button>
        <ion-button class="btn-refill" @click="refrescarInventario()">
          <ion-icon :icon="refreshOutline" slot="start" />
          Actualizar
        </ion-button>
      </div>

      <div class="stats-row">
        <div class="stat-card stat-navy">
          <span class="stat-label">Productos</span>
          <strong>{{ inventarioTotal }}</strong>
        </div>
        <div class="stat-card stat-green">
          <span class="stat-label">Valor inventario</span>
          <strong>{{ formatoMoneda(valorInventario) }}</strong>
        </div>
        <div class="stat-card stat-amber">
          <span class="stat-label">Bajo stock</span>
          <strong>{{ productosBajoStock }}</strong>
        </div>
      </div>

      <div class="toolbar-row">
        <div class="search-bar">
          <ion-icon :icon="searchOutline" />
          <input v-model="busqueda" type="text" placeholder="Buscar insumo..." />
        </div>

        <div class="chips-row">
          <button class="chip" :class="{ active: filtroCategoria === 'todas' }" @click="filtroCategoria = 'todas'">
            Todas
          </button>
          <button
            v-for="categoria in categorias"
            :key="categoria"
            class="chip"
            :class="{ active: filtroCategoria === categoria }"
            @click="filtroCategoria = categoria"
          >
            {{ categoria }}
          </button>
        </div>
      </div>

      <div v-if="productosFiltrados.length" class="grid-productos">
        <article v-for="producto in productosFiltrados" :key="producto.id" class="producto-card">
          <div class="producto-media">
            <img v-if="producto.imagenUrl" :src="producto.imagenUrl" :alt="producto.nombre" />
            <div v-else class="producto-placeholder">
              <ion-icon :icon="cubeOutline" />
            </div>
            <span class="stock-badge" :class="estadoStock(producto)">{{ etiquetaStock(producto) }}</span>
          </div>

          <div class="producto-body">
            <div class="producto-head">
              <div>
                <h3>{{ producto.nombre }}</h3>
                <p>{{ producto.categoria }}</p>
              </div>
              <button class="icon-btn" @click="abrirFormulario(producto)">
                <ion-icon :icon="createOutline" />
              </button>
            </div>

            <div class="producto-data">
              <div>
                <span class="dato-label">Cant. dispo.</span>
                <strong>{{ formatearCantidad(producto.cantidad) }} {{ etiquetaUnidadCorta(producto.unidadMedida) }}</strong>
              </div>
              <div>
                <span class="dato-label">Costo u.</span>
                <strong>{{ formatoMoneda(producto.costo) }}</strong>
              </div>
              <div>
                <span class="dato-label">Valor total</span>
                <strong>{{ formatoMoneda(producto.cantidad * producto.costo) }}</strong>
              </div>
            </div>

            <p v-if="producto.descripcion" class="producto-descripcion">
              {{ producto.descripcion }}
            </p>

            <div class="producto-footer">
              <span class="meta-texto">Actualizado {{ formatoFecha(producto.actualizadoEn) }}</span>
              <ion-button fill="clear" class="btn-icon danger" @click="confirmarEliminar(producto)">
                <ion-icon :icon="trashOutline" />
              </ion-button>
            </div>
          </div>
        </article>
      </div>

      <div v-else class="empty-state">
        <ion-icon :icon="cubeOutline" />
        <h3>No hay insumos registrados</h3>
        <p>Agrega el primer producto para empezar a controlar el inventario real de la lavanderia.</p>
        <ion-button class="btn-primario" @click="abrirFormulario()">
          <ion-icon :icon="addOutline" slot="start" />
          Agregar insumo
        </ion-button>
      </div>
    </div>

    <ion-modal :is-open="mostrarFormulario" class="modal-inventario" @didDismiss="cerrarFormulario">
      <div class="modal-content">
        <div class="modal-header">
          <div>
            <p class="eyebrow">{{ modoEdicion ? 'Editar insumo' : 'Nuevo insumo' }}</p>
            <h2>{{ modoEdicion ? 'Actualizar inventario' : 'Registrar inventario' }}</h2>
          </div>
          <button class="modal-close" @click="cerrarFormulario">
            <ion-icon :icon="closeOutline" />
          </button>
        </div>

        <div class="modal-scroll">
          <div class="preview-box">
            <div class="preview-image">
              <img v-if="form.imagenUrl" :src="form.imagenUrl" :alt="form.nombre || 'Producto'" />
              <ion-icon v-else :icon="cubeOutline" />
            </div>
            <div class="preview-copy">
              <strong>{{ form.nombre || 'Vista previa del producto' }}</strong>
              <span>{{ form.categoria || 'Categoria pendiente' }}</span>
            </div>
          </div>

          <div class="form-grid">
          <label>
            <span>Nombre del producto *</span>
            <input v-model="form.nombre" type="text" placeholder="Ej. Detergente liquido" />
          </label>

          <label>
            <span>Categoria *</span>
            <input v-model="form.categoria" type="text" placeholder="Ej. Limpieza" list="lista-categorias" />
            <datalist id="lista-categorias">
              <option v-for="categoria in categorias" :key="categoria" :value="categoria" />
            </datalist>
          </label>

          <label >
            <span>Unidad de medida *</span>
            <select v-model="form.unidadMedida" style="background-color: white;">
              <option v-for="unidad in unidadesMedida" :key="unidad.valor" :value="unidad.valor">
                {{ unidad.label }}
              </option>
            </select>
          </label>

          <div class="two-col">
            <label>
              <span>Cantidad disponible *</span>
              <input v-model.number="form.cantidad" type="number" min="0" step="1" />
            </label>

            <label>
              <span>Costo unitario *</span>
              <input v-model.number="form.costo" type="number" min="0" step="0.01" />
            </label>
          </div>

          <label>
            <span>Descripcion (opcional)</span>
            <textarea v-model="form.descripcion" rows="3" placeholder="Ej. Envase de uso diario" />
          </label>

          <label>
            <span>Imagen del producto</span>
            <div class="upload-box">
              <p>Si no agregas imagen, se mostrara un icono de caja.</p>
              <input ref="imagenInputRef" type="file" accept="image/*" hidden @change="subirImagen" />
              <button class="btn-subir-imagen" type="button" @click="abrirSelectorImagen">
                <ion-icon :icon="imageOutline" />
                Subir imagen
              </button>
              <button v-if="form.imagenUrl" class="btn-link" type="button" @click="form.imagenUrl = null">
                Quitar imagen
              </button>
            </div>
          </label>
          </div>
        </div>

        <div class="modal-actions">
          <ion-button class="btn-fantasma" @click="cerrarFormulario">Cancelar</ion-button>
          <ion-button class="btn-primario" :disabled="!formularioValido" @click="guardarProducto">
            {{ modoEdicion ? 'Guardar cambios' : 'Crear insumo' }}
          </ion-button>
        </div>
      </div>
    </ion-modal>

    <ion-modal :is-open="mostrarModalRefill" class="modal-inventario" @didDismiss="cerrarRefill">
      <div class="modal-content">
        <div class="modal-header">
          <div>
            <p class="eyebrow">Reposición de inventario</p>
            <h2>Refill</h2>
          </div>
          <button class="modal-close" @click="cerrarRefill">
            <ion-icon :icon="closeOutline" />
          </button>
        </div>

        <div class="modal-scroll">
          <div class="search-bar refill-search">
            <ion-icon :icon="searchOutline" />
            <input v-model="busquedaRefill" type="text" placeholder="Buscar insumo para reponer..." />
          </div>

          <div v-if="productosRefillFiltrados.length" class="refill-lista">
            <article v-for="producto in productosRefillFiltrados" :key="producto.id" class="refill-card">
              <div class="refill-info">
                <strong>{{ producto.nombre }}</strong>
                <span>{{ producto.categoria }} · {{ formatearCantidad(producto.cantidad) }} {{ etiquetaUnidadCorta(producto.unidadMedida) }} disponibles</span>
              </div>

              <div class="refill-actions">
                <div class="refill-input-wrap">
                  <span>+ {{ etiquetaUnidadCorta(producto.unidadMedida) }}</span>
                  <input
                    v-model.number="cantidadesRefill[producto.id]"
                    type="number"
                    min="0"
                    step="0.01"
                    :placeholder="`0 ${etiquetaUnidadCorta(producto.unidadMedida)}`"
                  />
                </div>
                <button class="btn-refill-add" :disabled="!cantidadRefillValida(producto.id)" @click="sumarRefill(producto.id)">
                  Sumar
                </button>
              </div>
            </article>
          </div>

          <div v-else class="empty-state refill-empty">
            <ion-icon :icon="searchOutline" />
            <h3>No hay coincidencias</h3>
            <p>Prueba con otro nombre o limpia la busqueda.</p>
          </div>
        </div>
      </div>
    </ion-modal>
  </AppShell>
</template>

<script setup lang="ts">
import AppShell from '@/components/AppShell.vue'
import { IonButton, IonIcon, IonModal, IonSpinner, toastController } from '@ionic/vue'
import { computed, onMounted, reactive, ref } from 'vue'
import {
  addOutline,
  closeOutline,
  createOutline,
  cubeOutline,
  imageOutline,
  refreshOutline,
  searchOutline,
  trashOutline
} from 'ionicons/icons'
import { useInventario, type ProductoInventario, type UnidadMedida } from '@/composables/useInventario'

const {
  productos,
  categorias,
  totalUnidades,
  valorInventario,
  productosBajoStock,
  cargando,
  error,
  cargarInventario,
  crearProducto,
  actualizarProducto,
  eliminarProducto
} = useInventario()

onMounted(() => {
  cargarInventario(true).catch(() => {
    // el error ya queda expuesto en `error.value` para mostrarlo en el template
  })
})

const busqueda = ref('')
const filtroCategoria = ref<'todas' | string>('todas')
const mostrarFormulario = ref(false)
const mostrarModalRefill = ref(false)
const modoEdicion = ref(false)
const productoEditandoId = ref<string | null>(null)
const imagenInputRef = ref<HTMLInputElement | null>(null)
const busquedaRefill = ref('')
const cantidadesRefill = reactive<Record<string, number>>({})
const guardando = ref(false)
const errorGuardado = ref<string | null>(null)

const form = reactive({
  nombre: '',
  categoria: '',
  unidadMedida: 'pieza' as UnidadMedida,
  cantidad: 0,
  costo: 0,
  descripcion: '',
  imagenUrl: null as string | null
})

const unidadesMedida: Array<{ valor: UnidadMedida; label: string; corta: string }> = [
  { valor: 'pieza', label: 'Pieza', corta: 'pz' },
  { valor: 'litro', label: 'Litro', corta: 'L' },
  { valor: 'mililitro', label: 'Mililitro', corta: 'mL' },
  { valor: 'kilogramo', label: 'Kilogramo', corta: 'kg' },
  { valor: 'libra', label: 'Libra', corta: 'lb' },
  { valor: 'gramo', label: 'Gramo', corta: 'g' },
  { valor: 'paquete', label: 'Paquete', corta: 'paq' },
  { valor: 'caja', label: 'Caja', corta: 'caja' },
  { valor: 'galon', label: 'Galón', corta: 'gal' },
  { valor: 'otro', label: 'Otro', corta: 'u' }
]

const inventarioTotal = computed(() => productos.value.length)

const productosFiltrados = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  return productos.value.filter((producto) => {
    const coincideCategoria =
      filtroCategoria.value === 'todas' || producto.categoria === filtroCategoria.value
    const coincideBusqueda =
      !q ||
      producto.nombre.toLowerCase().includes(q) ||
      producto.categoria.toLowerCase().includes(q) ||
      producto.descripcion.toLowerCase().includes(q)
    return coincideCategoria && coincideBusqueda
  })
})

const productosRefillFiltrados = computed(() => {
  const q = busquedaRefill.value.trim().toLowerCase()
  return productos.value.filter((producto) => {
    if (!q) return true
    return (
      producto.nombre.toLowerCase().includes(q) ||
      producto.categoria.toLowerCase().includes(q) ||
      etiquetaUnidadCorta(producto.unidadMedida).toLowerCase().includes(q)
    )
  })
})

const refrescarInventario = async () => {
  try {
    await cargarInventario(true)
    await mostrarToast('Inventario actualizado correctamente', 'success')
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : 'No se pudo actualizar el inventario.'
    await mostrarToast(mensaje, 'danger')
  }
}

const formularioValido = computed(() => {
  return (
    form.nombre.trim().length > 0 &&
    form.categoria.trim().length > 0 &&
    Number.isFinite(form.cantidad) &&
    form.cantidad >= 0 &&
    Number.isFinite(form.costo) &&
    form.costo >= 0
  )
})

const abrirFormulario = (producto?: ProductoInventario) => {
  if (producto) {
    modoEdicion.value = true
    productoEditandoId.value = producto.id
    Object.assign(form, {
      nombre: producto.nombre,
      categoria: producto.categoria,
      unidadMedida: producto.unidadMedida,
      cantidad: producto.cantidad,
      costo: producto.costo,
      descripcion: producto.descripcion,
      imagenUrl: producto.imagenUrl
    })
  } else {
    modoEdicion.value = false
    productoEditandoId.value = null
    Object.assign(form, {
      nombre: '',
      categoria: '',
      unidadMedida: 'pieza',
      cantidad: 0,
      costo: 0,
      descripcion: '',
      imagenUrl: null
    })
  }

  errorGuardado.value = null
  mostrarFormulario.value = true
}

const cerrarFormulario = () => {
  mostrarFormulario.value = false
}

const abrirRefill = () => {
  busquedaRefill.value = ''
  mostrarModalRefill.value = true
}

const cerrarRefill = () => {
  mostrarModalRefill.value = false
}

const abrirSelectorImagen = () => {
  imagenInputRef.value?.click()
}

const subirImagen = (evento: Event) => {
  const input = evento.target as HTMLInputElement
  const archivo = input.files?.[0]
  if (!archivo) return

  const lector = new FileReader()
  lector.onload = () => {
    form.imagenUrl = lector.result as string
  }
  lector.readAsDataURL(archivo)
  input.value = ''
}

const mostrarToast = async (mensaje: string, color: 'success' | 'danger' = 'success') => {
  const toast = await toastController.create({
    message: mensaje,
    duration: 1800,
    color
  })
  await toast.present()
}

const cantidadRefillValida = (id: string) => {
  const cantidad = Number(cantidadesRefill[id] ?? 0)
  return Number.isFinite(cantidad) && cantidad > 0
}

const sumarRefill = async (id: string) => {
  const producto = productos.value.find((item) => item.id === id)
  if (!producto) return

  const cantidad = Number(cantidadesRefill[id] ?? 0)
  if (!Number.isFinite(cantidad) || cantidad <= 0) return

  try {
    await actualizarProducto(id, {
      cantidad: Number((producto.cantidad + cantidad).toFixed(6))
    })
    cantidadesRefill[id] = 0
    await mostrarToast(
      `Se agregaron ${cantidad} ${etiquetaUnidadCorta(producto.unidadMedida)} a ${producto.nombre}`,
      'success'
    )
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : 'No se pudo actualizar el stock.'
    await mostrarToast(mensaje, 'danger')
  }
}

const guardarProducto = async () => {
  if (!formularioValido.value || guardando.value) return

  guardando.value = true
  errorGuardado.value = null

  try {
    if (modoEdicion.value && productoEditandoId.value) {
      await actualizarProducto(productoEditandoId.value, {
        nombre: form.nombre.trim(),
        categoria: form.categoria.trim(),
        unidadMedida: form.unidadMedida,
        cantidad: Number(form.cantidad),
        costo: Number(form.costo),
        descripcion: form.descripcion.trim(),
        imagenUrl: form.imagenUrl
      })
      await mostrarToast('Insumo actualizado correctamente', 'success')
    } else {
      await crearProducto({
        nombre: form.nombre.trim(),
        categoria: form.categoria.trim(),
        unidadMedida: form.unidadMedida,
        cantidad: Number(form.cantidad),
        costo: Number(form.costo),
        descripcion: form.descripcion.trim(),
        imagenUrl: form.imagenUrl
      })
      await mostrarToast('Insumo creado correctamente', 'success')
    }

    cerrarFormulario()
  } catch (err) {
    errorGuardado.value = err instanceof Error ? err.message : 'No se pudo guardar el insumo.'
    await mostrarToast(errorGuardado.value, 'danger')
  } finally {
    guardando.value = false
  }
}

const confirmarEliminar = async (producto: ProductoInventario) => {
  const ok = window.confirm(`Deseas eliminar el insumo "${producto.nombre}"?`)
  if (!ok) return

  try {
    await eliminarProducto(producto.id)
    await mostrarToast('Insumo eliminado correctamente', 'success')
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : 'No se pudo eliminar el insumo.'
    await mostrarToast(mensaje, 'danger')
  }
}

const estadoStock = (producto: ProductoInventario) => {
  if (producto.cantidad === 0) return 'sin-stock'
  if (producto.cantidad <= 5) return 'bajo-stock'
  return 'con-stock'
}

const etiquetaStock = (producto: ProductoInventario) => {
  if (producto.cantidad === 0) return 'Sin stock'
  if (producto.cantidad <= 5) return 'Bajo stock'
  return 'Disponible'
}

const formatoMoneda = (valor: number) =>
  new Intl.NumberFormat('es-SV', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(valor)

const formatoFecha = (fecha: string) =>
  new Intl.DateTimeFormat('es-SV', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(fecha))

const etiquetaUnidadCorta = (unidad: UnidadMedida) =>
  unidadesMedida.find((item) => item.valor === unidad)?.corta ?? 'u'

const formatearCantidad = (cantidad: number) => Number(cantidad).toFixed(3)
</script>

<style scoped>
:deep(body) {
  background: #f5f9fc;
}

.page-content {
  padding: 20px 18px 28px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-height: calc(100% + 220px);
}

.inventario-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  min-height: 34px;
  color: #123a66;
  font-size: 0.82rem;
  font-weight: 800;
}

.inventario-loading ion-spinner {
  width: 20px;
  height: 20px;
  --color: #168b83;
}

.header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
}

.eyebrow {
  margin: 0 0 6px;
  color: #6d829c;
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  color: #0a1f38;
  font-size: clamp(1.8rem, 2.5vw, 2.6rem);
  font-weight: 900;
}

.subtitulo {
  margin: 8px 0 0;
  color: #4a627e;
  max-width: 680px;
  line-height: 1.45;
}

.btn-primario {
  --background: #123a66;
  --background-hover: #0d2b4e;
  --color: #f5f9fc;
  --border-radius: 12px;
  font-weight: 700;
}

.btn-refill {
  --background: #16a34a;
  --background-hover: #15803d;
  --color: #f5f9fc;
  --border-radius: 12px;
  font-weight: 700;
}

.btn-fantasma {
  --background: transparent;
  --color: #123a66;
  --border-radius: 12px;
  --border-width: 1px;
  --border-style: solid;
  --border-color: rgba(18, 58, 102, 0.25);
  font-weight: 700;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(140px, 1fr));
  gap: 12px;
}

.stat-card {
  background: linear-gradient(180deg, #ffffff 0%, #f2f9ff 100%);
  border: 1px solid rgba(18, 58, 102, 0.08);
  border-radius: 18px;
  padding: 16px 18px;
  box-shadow: 0 10px 20px rgba(10, 31, 56, 0.04);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-label {
  color: #6d829c;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
}

.stat-card strong {
  font-size: 1.55rem;
  font-weight: 900;
}

.stat-navy strong { color: #123a66; }
.stat-blue strong { color: #2563eb; }
.stat-green strong { color: #15803d; }
.stat-amber strong { color: #b45309; }

.toolbar-row {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #ffffff;
  border: 1px solid rgba(10, 31, 56, 0.10);
  border-radius: 14px;
  padding: 11px 16px;
  color: #4a627e;
  box-shadow: 0 2px 10px rgba(10, 31, 56, 0.04);
}

.search-bar input {
  border: none;
  outline: none;
  flex: 1;
  font-size: 0.96rem;
  background: transparent;
  color: #0a1f38;
}

.chips-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  padding: 9px 14px;
  border-radius: 999px;
  border: 1px solid rgba(10, 31, 56, 0.1);
  background: #ffffff;
  color: #4a627e;
  font-weight: 700;
  cursor: pointer;
}

.chip.active {
  background: #123a66;
  border-color: #123a66;
  color: #f5f9fc;
}

.grid-productos {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

.producto-card {
  background: #ffffff;
  border: 1px solid rgba(10, 31, 56, 0.08);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 20px rgba(10, 31, 56, 0.06);
  display: flex;
  flex-direction: column;
  min-height: 390px;
  max-height: 390px;
}

.producto-media {
  position: relative;
  height: 150px;
  background: linear-gradient(135deg, #e8f3fb 0%, #d7eaf7 100%);
}

.producto-media img,
.producto-placeholder {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.producto-placeholder {
  display: grid;
  place-items: center;
  color: #123a66;
  font-size: 2.4rem;
}

.stock-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  backdrop-filter: blur(6px);
}

.con-stock { background: rgba(34, 197, 94, 0.16); color: #166534; }
.bajo-stock { background: rgba(245, 158, 11, 0.18); color: #b45309; }
.sin-stock { background: rgba(239, 68, 68, 0.16); color: #b91c1c; }

.producto-body {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  min-height: 0;
}

.producto-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.producto-head h3 {
  margin: 0 0 3px;
  color: #0a1f38;
  font-size: 1rem;
  font-weight: 900;
}

.producto-head p {
  margin: 0;
  color: #6d829c;
  font-size: 0.84rem;
}

.icon-btn {
  border: none;
  background: rgba(18, 58, 102, 0.08);
  color: #123a66;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  cursor: pointer;
}

.producto-data {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.producto-data div {
  padding: 8px 10px;
  border-radius: 12px;
  background: #f8fbff;
  border: 1px solid rgba(10, 31, 56, 0.08);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dato-label {
  color: #6d829c;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
}

.producto-data strong {
  color: #123a66;
  font-size: 0.9rem;
  font-weight: 900;
}

.producto-descripcion {
  margin: 0;
  color: #4a627e;
  font-size: 0.84rem;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.producto-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: auto;
}

.meta-texto {
  color: #8aa0b8;
  font-size: 0.78rem;
}

.btn-icon {
  --padding-start: 8px;
  --padding-end: 8px;
  --padding-top: 8px;
  --padding-bottom: 8px;
}

.btn-icon.danger { --color: #b91c1c; }

.empty-state {
  background: rgba(255, 255, 255, 0.85);
  border: 1.5px dashed rgba(18, 58, 102, 0.18);
  border-radius: 20px;
  padding: 34px 18px;
  text-align: center;
  color: #4a627e;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.empty-state ion-icon {
  font-size: 3rem;
  color: #a9c3d8;
}

.empty-state h3 {
  margin: 0;
  color: #0a1f38;
}

.empty-state p {
  margin: 0;
  font-size: 0.95rem;
}

.modal-content {
  background: #ffffff;
  padding: 20px 18px 18px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  overflow: hidden;
}

.modal-inventario {
  --width: min(560px, calc(100vw - 24px));
  --height: min(92vh, 760px);
  --border-radius: 20px;
}

.modal-inventario::part(content) {
  height: 100%;
  display: flex;
}

.modal-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  -webkit-overflow-scrolling: touch;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.modal-header h2 {
  margin: 0;
  color: #0a1f38;
  font-size: 1.4rem;
  font-weight: 800;
}

.modal-close {
  border: none;
  background: none;
  color: #7c8fa6;
  font-size: 1.6rem;
  cursor: pointer;
}

.preview-box {
  display: flex;
  align-items: center;
  gap: 12px;
  border-radius: 16px;
  padding: 14px;
  background: linear-gradient(135deg, #f2f9ff 0%, #e8f3fb 100%);
  border: 1px solid rgba(18, 58, 102, 0.08);
}

.preview-image {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  overflow: hidden;
  background: rgba(18, 58, 102, 0.08);
  display: grid;
  place-items: center;
  color: #123a66;
  font-size: 1.8rem;
  flex-shrink: 0;
}

.preview-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-image ion-icon {
  font-size: 1.8rem;
}

.preview-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preview-copy strong {
  color: #0a1f38;
  font-size: 1rem;
}

.preview-copy span {
  color: #6d829c;
  font-size: 0.84rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 0.82rem;
  font-weight: 800;
  color: #4a627e;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

input,
textarea {
  border: 1.5px solid rgba(10, 31, 56, 0.12);
  background: #f8fbff;
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 0.96rem;
  color: #0a1f38;
  font-family: inherit;
}

input:focus,
textarea:focus {
  outline: 2px solid rgba(18, 58, 102, 0.16);
  border-color: rgba(18, 58, 102, 0.25);
}

textarea {
  resize: vertical;
  min-height: 96px;
}

.two-col {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.upload-box {
  border: 1.5px dashed #a9d8ee;
  border-radius: 14px;
  background: rgba(169, 216, 238, 0.08);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-transform: none;
}

.upload-box p {
  margin: 0;
  color: #4a627e;
  font-size: 0.86rem;
  font-weight: 600;
  text-transform: none;
  letter-spacing: normal;
}

.btn-subir-imagen {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid rgba(18, 58, 102, 0.16);
  background: #ffffff;
  color: #123a66;
  font-weight: 800;
  cursor: pointer;
  width: fit-content;
}

.btn-subir-imagen ion-icon {
  font-size: 16px;
}

.btn-link {
  border: none;
  background: none;
  color: #123a66;
  font-weight: 800;
  width: fit-content;
  cursor: pointer;
  padding: 0;
}

.modal-actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

.modal-actions ion-button {
  flex: 1;
}

.refill-search {
  margin-bottom: 4px;
}

.refill-lista {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.refill-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px;
  border-radius: 16px;
  border: 1px solid rgba(18, 58, 102, 0.08);
  background: #ffffff;
}

.refill-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.refill-info strong {
  color: #0a1f38;
  font-size: 0.96rem;
}

.refill-info span {
  color: #6d829c;
  font-size: 0.82rem;
}

.refill-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.refill-input-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(18, 58, 102, 0.12);
  border-radius: 12px;
  padding: 8px 10px;
  background: #fbfdfe;
}

.refill-input-wrap span {
  color: #6d829c;
  font-size: 0.78rem;
  font-weight: 800;
  white-space: nowrap;
}

.refill-input-wrap input {
  width: 110px;
  border: none;
  outline: none;
  background: transparent;
  color: #0a1f38;
  font-weight: 700;
}

.btn-refill-add {
  border: none;
  border-radius: 12px;
  padding: 10px 14px;
  background: #16a34a;
  color: #ffffff;
  font-weight: 800;
  cursor: pointer;
}

.btn-refill-add:disabled {
  background: rgba(10, 31, 56, 0.12);
  color: #9fb4c9;
  cursor: not-allowed;
}

.refill-empty {
  min-height: 220px;
}

@media (max-width: 860px) {
  .stats-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .page-content {
    padding: 14px 12px 20px;
    gap: 14px;
  }

  .header-row {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .header-row > div:first-child {
    width: 100%;
  }

  .header-row ion-button {
    width: 100%;
    margin: 0;
  }

  .stats-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .stat-card {
    padding: 12px 12px 13px;
    border-radius: 16px;
  }

  .stat-label {
    font-size: 0.72rem;
  }

  .stat-card strong {
    font-size: 1.18rem;
  }

  .grid-productos {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .producto-card {
    min-height: 0;
    max-height: none;
    border-radius: 16px;
  }

  .producto-media {
    height: 118px;
  }

  .producto-body {
    padding: 11px;
    gap: 8px;
  }

  .producto-head h3 {
    font-size: 0.92rem;
  }

  .producto-head p {
    font-size: 0.76rem;
  }

  .icon-btn {
    width: 34px;
    height: 34px;
    border-radius: 10px;
  }

  .stock-badge {
    top: 10px;
    left: 10px;
    padding: 5px 8px;
    font-size: 0.64rem;
  }

  .toolbar-row {
    gap: 10px;
  }

  .chips-row {
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: 4px;
    margin-right: -12px;
    padding-right: 12px;
    scrollbar-width: none;
  }

  .chips-row::-webkit-scrollbar {
    display: none;
  }

  .chip {
    flex: 0 0 auto;
    white-space: nowrap;
  }

  .producto-data {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .producto-data div {
    padding: 7px 8px;
  }

  .dato-label {
    font-size: 0.66rem;
  }

  .producto-data strong {
    font-size: 0.82rem;
  }

  .producto-descripcion {
    font-size: 0.78rem;
  }

  .producto-footer {
    gap: 6px;
  }

  .meta-texto {
    font-size: 0.7rem;
  }

  .two-col {
    grid-template-columns: 1fr;
  }

  .modal-actions {
    flex-direction: column;
  }

  .refill-card {
    flex-direction: column;
    align-items: stretch;
  }

  .refill-actions {
    justify-content: space-between;
  }

  .refill-input-wrap {
    flex: 1;
  }

  .refill-input-wrap input {
    width: 100%;
  }
}
</style>
