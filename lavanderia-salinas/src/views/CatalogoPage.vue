<template>
  <AppShell>
    <div class="catalogo-page force-light">
      <div class="catalogo-header">
        <h1>Catálogo</h1>
      </div>

      <div class="tabs-row">
        <button class="tab-chip" :class="{ active: !categoriaActivaId && tabActivo === 'todo' }" @click="mostrarCategorias">
          Todo
          <span v-if="items.length" class="badge">{{ items.length }}</span>
        </button>
        <button class="tab-chip" :class="{ active: !categoriaActivaId && tabActivo === 'servicios' }" @click="seleccionarServicios">
          <ion-icon :icon="cubeOutline" /> Servicios
          <span v-if="servicios.length" class="badge">{{ servicios.length }}</span>
        </button>
      </div>

      <div class="acciones-row">
        <button v-if="categoriaActivaId" class="btn-retroceder-categoria" type="button" @click="mostrarCategorias">
          <ion-icon :icon="arrowBackOutline" /> Categorías
        </button>
        <button class="btn-nuevo" @click="abrirModalNuevo">
          <ion-icon :icon="addOutline" /> {{ categoriaActivaId ? 'Nuevo servicio' : 'Nuevo' }}
        </button>
        <button class="btn-nueva-categoria" type="button" @click="abrirModalNuevaCategoria">
          <ion-icon :icon="pricetagOutline" /> Nueva categoría
        </button>
        <div class="acciones-derecha">
          <span v-if="itemsFiltrados.length" class="conteo-texto">
            {{ itemsFiltrados.length }} {{ tabActivo === 'articulos' ? 'artículo(s)' : 'servicio(s)' }}
          </span>
          <button
            class="btn-fantasma-chip"
            :disabled="generandoPdf"
            :aria-busy="generandoPdf"
            @click="compartirCatalogo"
          >
            <ion-icon :icon="generandoPdf ? refreshOutline : downloadOutline" :class="{ girando: generandoPdf }" />
            {{ generandoPdf ? 'Generando...' : 'Descargar' }}
          </button>
        </div>
      </div>

      <!-- ══════════════ Buscador ══════════════ -->
      <div v-if="items.length && (tabActivo === 'servicios' || categoriaActivaId)" class="search-bar">
        <ion-icon :icon="searchOutline" />
        <input
          v-model="busqueda"
          type="text"
          :placeholder="tabActivo === 'articulos' ? 'Buscar artículo...' : 'Buscar servicio...'"
        />
      </div>

      <!-- ══════════════ Banner configuración ══════════════ -->
      <div v-if="servicios.length === 0 && (tabActivo === 'servicios' || categoriaActivaId)" class="banner-configura">
        <div class="banner-icon"><ion-icon :icon="sparklesOutline" /></div>
        <div>
          <p class="banner-titulo">Configura tus Servicios</p>
          <p class="banner-texto">
            Antes de crear órdenes, necesitas configurar los servicios que ofrece tu negocio.
          </p>
        </div>
      </div>

      <!-- ══════════════ Estado vacío ══════════════ -->
      <div v-if="!categoriaActivaId && categorias.length === 0" class="estado-vacio-box">
        <div class="estado-vacio-icon-wrap">
          <ion-icon :icon="cubeOutline" class="estado-vacio-icon" />
        </div>
        <p class="estado-vacio-titulo">
          {{ tabActivo === 'articulos' ? 'No hay artículos' : 'No hay servicios' }}
        </p>
        <p class="estado-vacio-texto">
          Crea tu primer {{ tabActivo === 'articulos' ? 'artículo' : 'servicio' }} para comenzar
        </p>
        <button class="btn-primario-grande" @click="abrirModalNuevo">
          <ion-icon :icon="addOutline" />
          Crear Mi Primer {{ tabActivo === 'articulos' ? 'Artículo' : 'Servicio' }}
        </button>
      </div>

      <!-- ══════════════ Tarjetas informativas (solo si no hay nada aún) ══════════════ -->
      <div v-if="!categoriaActivaId && items.length === 0" class="info-cards-row">
        <div class="info-card">
          <div class="info-card-icon icon-navy"><ion-icon :icon="cubeOutline" /></div>
          <p class="info-card-titulo">Normal</p>
          <p class="info-card-texto">Crea tus servicios con nombre y precio</p>
        </div>
        <div class="info-card">
          <div class="info-card-icon icon-verde"><ion-icon :icon="pricetagOutline" /></div>
          <p class="info-card-titulo">PROMO</p>
          <p class="info-card-texto">
            Opcionalmente agrega promociones (PROMO) o cargos extras (EXTRA)
          </p>
        </div>
        <div class="info-card">
          <div class="info-card-icon icon-morado"><ion-icon :icon="pricetagOutline" /></div>
          <p class="info-card-titulo">EXTRA</p>
          <p class="info-card-texto">Los servicios estarán disponibles al crear nuevas órdenes</p>
        </div>
      </div>

      <div v-if="!categoriaActivaId && items.length === 0" class="tips-box">
        <p class="tips-titulo"><ion-icon :icon="sparklesOutline" /> Consejos para empezar</p>
        <ol class="tips-lista">
          <li>Crea categorías para organizar tus servicios (Lavado, Planchado, Tintorería)</li>
          <li>Configura los precios según tu lista de servicios actual</li>
          <li>Puedes editar o agregar más servicios en cualquier momento</li>
        </ol>
      </div>

      <!-- ══════════════ Listado agrupado por categoría ══════════════ -->
      <div v-if="tabActivo === 'todo' && !categoriaActivaId && categorias.length" class="categorias-cards">
        <article
          v-for="categoria in categoriasOrdenadas"
          :key="categoria.id"
          class="categoria-card"
          role="button"
          tabindex="0"
          @click="abrirCategoria(categoria.id)"
          @keydown.enter="abrirCategoria(categoria.id)"
        >
          <span class="categoria-card-acento" :style="{ background: categoria.color }"></span>
          <span class="categoria-card-icono" :style="{ color: categoria.color, background: `${categoria.color}20` }"><ion-icon :icon="pricetagOutline" /></span>
          <span class="categoria-card-nombre">{{ categoria.nombre }}</span>
          <span class="categoria-card-conteo">{{ contarItemsCategoria(categoria.id) }} {{ contarItemsCategoria(categoria.id) === 1 ? 'elemento' : 'elementos' }}</span>
          <button class="categoria-card-editar" type="button" title="Editar categoría" :aria-label="`Editar categoría ${categoria.nombre}`" @click.stop="abrirModalCategoria(categoria)">
            <ion-icon :icon="createOutline" />
          </button>
          <ion-icon :icon="chevronForwardOutline" class="categoria-card-flecha" />
        </article>
        <button class="categoria-card categoria-card-nueva" type="button" @click="abrirModalNuevaCategoria">
          <span class="categoria-card-icono"><ion-icon :icon="addOutline" /></span>
          <span class="categoria-card-nombre">Nueva categoría</span>
          <span class="categoria-card-conteo">Organiza tu catálogo</span>
        </button>
      </div>

      <div v-if="(tabActivo === 'servicios' || categoriaActivaId) && itemsFiltrados.length === 0" class="estado-vacio-box">
        <div class="estado-vacio-icon-wrap"><ion-icon :icon="cubeOutline" class="estado-vacio-icon" /></div>
        <p class="estado-vacio-titulo">Esta categoría está vacía</p>
        <p class="estado-vacio-texto">Agrega un servicio para comenzar</p>
        <button class="btn-primario-grande" @click="abrirModalNuevo"><ion-icon :icon="addOutline" /> Nuevo servicio</button>
      </div>

      <div v-if="(tabActivo === 'servicios' || categoriaActivaId) && itemsFiltrados.length" class="listado-categorias">
        <div v-for="grupo in gruposFiltrados" :key="grupo.categoriaId ?? 'sin-categoria'" class="grupo-categoria">
          <div class="grupo-header">
            <span class="grupo-dot" :style="{ background: grupo.color }"></span>
            <h3>{{ grupo.nombre }}</h3>
            <span class="badge">{{ grupo.items.length }}</span>
          </div>
          <div class="tarjetas-grid">
            <div v-for="item in grupo.items" :key="item.id" class="tarjeta-servicio" :style="{ borderLeftColor: grupo.color }">
              <div class="tarjeta-top">
                <div class="tarjeta-icono">
                  <ion-icon :icon="item.tipo === 'articulo' ? pricetagOutline : shirtOutline" />
                </div>
                <span class="tarjeta-nombre">{{ item.nombre }}</span>
                <button class="editar-btn" @click="editarItem(item)">
                  <ion-icon :icon="createOutline" />
                </button>
              </div>
              <p class="tarjeta-precio">${{ item.precio.toFixed(2) }}</p>
              <p class="tarjeta-unidad">{{ etiquetaUnidad(item.unidad) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════════════ MODAL: EDITAR CATEGORÍA ══════════════ -->
    <ion-modal :is-open="mostrarModalCategoria" class="modal-categoria" @didDismiss="cerrarModalCategoria">
      <div class="modal-categoria-contenido force-light">
        <div class="modal-servicio-header">
          <div class="modal-servicio-header-left">
            <div class="modal-servicio-icon"><span class="grupo-dot grande" :style="{ background: categoriaEditando?.color }"></span></div>
            <div>
              <p class="modal-servicio-titulo">Editar categoría</p>
              <p class="modal-servicio-subtitulo">Actualiza el nombre o el color</p>
            </div>
          </div>
          <button class="modal-cerrar" @click="cerrarModalCategoria"><ion-icon :icon="closeOutline" /></button>
        </div>
        <div class="modal-categoria-body">
          <label class="campo-label" for="categoria-nombre">Nombre</label>
          <input
            id="categoria-nombre"
            v-model="formularioCategoria.nombre"
            class="input-texto"
            type="text"
            autocomplete="off"
            spellcheck="false"
            autofocus
          />
          <label class="campo-label" for="categoria-color">Color</label>
          <div class="color-editor">
            <input id="categoria-color" v-model="formularioCategoria.color" type="color" />
            <span>{{ formularioCategoria.color }}</span>
          </div>
        </div>
        <div class="modal-servicio-footer modal-categoria-footer">
          <button class="btn-eliminar-modal" :disabled="guardandoCategoria" @click="eliminarCategoriaDesdeModal">
            <ion-icon :icon="trashOutline" /> Eliminar categoría
          </button>
          <div class="modal-footer-acciones">
            <ion-button class="btn-fantasma" @click="cerrarModalCategoria">Cancelar</ion-button>
            <ion-button class="btn-primario-modal" :disabled="!formularioCategoria.nombre.trim() || guardandoCategoria" @click="guardarCategoria">
              <ion-icon :icon="saveOutline" slot="start" /> Guardar
            </ion-button>
          </div>
        </div>
      </div>
    </ion-modal>

    <!-- ══════════════ MODAL: CREAR CATEGORÍA ══════════════ -->
    <ion-modal :is-open="mostrarModalNuevaCategoria" class="modal-categoria" @didDismiss="cerrarModalNuevaCategoria">
      <div class="modal-categoria-contenido force-light">
        <div class="modal-servicio-header">
          <div class="modal-servicio-header-left">
            <div class="modal-servicio-icon"><ion-icon :icon="pricetagOutline" /></div>
            <div>
              <p class="modal-servicio-titulo">Nueva categoría</p>
              <p class="modal-servicio-subtitulo">Organiza tus servicios y artículos</p>
            </div>
          </div>
          <button class="modal-cerrar" type="button" @click="cerrarModalNuevaCategoria">
            <ion-icon :icon="closeOutline" />
          </button>
        </div>
        <div class="modal-categoria-body">
          <label class="campo-label" for="nueva-categoria-nombre">Nombre</label>
          <input
            id="nueva-categoria-nombre"
            v-model="nombreCategoriaNueva"
            class="input-texto"
            type="text"
            placeholder="Ej: Lavado, Planchado o Tintorería"
            @keyup.enter="guardarNuevaCategoria"
          />
        </div>
        <div class="modal-servicio-footer modal-categoria-footer">
          <span></span>
          <div class="modal-footer-acciones">
            <ion-button class="btn-fantasma" @click="cerrarModalNuevaCategoria">Cancelar</ion-button>
            <ion-button class="btn-primario-modal" :disabled="!nombreCategoriaNueva.trim() || guardandoCategoria" @click="guardarNuevaCategoria">
              <ion-icon :icon="saveOutline" slot="start" /> Crear categoría
            </ion-button>
          </div>
        </div>
      </div>
    </ion-modal>

    <!-- ══════════════ MODAL: CREAR / EDITAR SERVICIO ══════════════ -->
    <ion-modal :is-open="mostrarModal" class="modal-servicio" @didDismiss="cerrarModal">
      <div class="modal-servicio-contenido force-light">
        <div class="modal-servicio-header">
          <div class="modal-servicio-header-left">
            <div class="modal-servicio-icon"><ion-icon :icon="cubeOutline" /></div>
            <div>
              <p class="modal-servicio-titulo">
                {{ itemEditando ? 'Editar' : 'Crear' }} {{ formulario.tipo === 'articulo' ? 'Artículo' : 'Servicio' }}
              </p>
              <p class="modal-servicio-subtitulo">
                {{ itemEditando ? 'Actualiza los datos del producto' : 'Agrega un nuevo producto al catálogo' }}
              </p>
            </div>
          </div>
          <button class="modal-cerrar" @click="cerrarModal">
            <ion-icon :icon="closeOutline" />
          </button>
        </div>

        <div class="modal-servicio-body">
          <label class="campo-label">Nombre del {{ formulario.tipo === 'articulo' ? 'Artículo' : 'Servicio' }} *</label>
          <input v-model="formulario.nombre" class="input-texto" type="text" placeholder="Ej: Lavado Rápido" />

          <label class="campo-label">Categoría *</label>
          <div v-if="categorias.length === 0" class="categoria-vacia">
            <ion-icon :icon="cubeOutline" class="categoria-vacia-icon" />
            <p>No hay categorías disponibles</p>
            <button class="btn-primario" @click="mostrarNuevaCategoria = true">
              <ion-icon :icon="addOutline" /> Crear Primera Categoría
            </button>
          </div>
          <div v-else class="categorias-chips">
            <button
              v-for="cat in categoriasOrdenadas"
              :key="cat.id"
              class="chip-categoria"
              :class="{ active: formulario.categoriaId === cat.id }"
              :style="formulario.categoriaId === cat.id ? { background: cat.color, borderColor: cat.color } : {}"
              @click="formulario.categoriaId = cat.id"
            >
              {{ cat.nombre }}
            </button>
            <button class="chip-categoria chip-nueva" @click="mostrarNuevaCategoria = true">
              <ion-icon :icon="addOutline" /> Nueva
            </button>
          </div>

          <div v-if="mostrarNuevaCategoria" class="nueva-categoria-row">
            <input
              v-model="nombreNuevaCategoria"
              class="input-texto"
              type="text"
              placeholder="Nombre de la categoría"
              @keyup.enter="confirmarNuevaCategoria"
            />
            <button class="btn-primario" @click="confirmarNuevaCategoria">Agregar</button>
          </div>

          <label class="campo-label">Precio *</label>
          <div class="precio-row">
            <div class="precio-input">
              <span>$</span>
              <input v-model.number="formulario.precio" type="number" min="0" step="0.01" />
            </div>
            <span class="precio-unidad-tag">{{ etiquetaUnidadCorta(formulario.unidad) }}</span>
          </div>

          <label class="campo-label">Tipo de {{ formulario.tipo === 'articulo' ? 'Artículo' : 'Servicio' }} *</label>
          <div class="unidad-tabs">
            <button
              v-for="u in unidades"
              :key="u.valor"
              class="unidad-tab"
              :class="{ active: formulario.unidad === u.valor }"
              @click="formulario.unidad = u.valor"
            >
              {{ u.etiqueta }}
            </button>
          </div>
          <template v-if="formulario.tipo === 'servicio'">
            <label class="campo-label">Clasificación para prendas *</label>
            <div class="unidad-tabs">
              <button
                v-for="clasificacion in clasificacionesPrendas"
                :key="clasificacion.valor"
                class="unidad-tab"
                :class="{ active: formulario.clasificacionPrendas === clasificacion.valor }"
                @click="formulario.clasificacionPrendas = clasificacion.valor"
              >
                {{ clasificacion.etiqueta }}
              </button>
            </div>
          </template>
          <label class="campo-label">Ícono / Imagen personalizada</label>
          <div class="imagen-personalizada-box">
            <div class="imagen-preview">
              <img v-if="formulario.imagenUrl" :src="formulario.imagenUrl" alt="Vista previa" />
              <ion-icon v-else :icon="obtenerIconoPorNombre(formulario.nombre || 'otro')" />
            </div>
            <div class="imagen-acciones">
              <label class="btn-subir-imagen">
                <ion-icon :icon="imageOutline" /> Subir imagen
                <input type="file" accept="image/*" @change="subirImagen" hidden />
              </label>
              <button v-if="formulario.imagenUrl" class="btn-quitar-imagen" @click="formulario.imagenUrl = null">
                <ion-icon :icon="closeOutline" /> Usar ícono automático
              </button>
            </div>
          </div>
          <div v-if="formulario.tipo === 'servicio'" class="insumos-box">
            <div class="variantes-header">
              <span><ion-icon :icon="cubeOutline" /> Insumos del servicio</span>
              <span class="mini-badge">{{ formulario.insumos.length }}</span>
            </div>
            <p class="variantes-hint">
              Cada vez que se use este servicio en una orden, estos insumos se descontarán del inventario.
            </p>

            <div v-if="productosInventario.length === 0" class="insumos-vacio">
              No tienes insumos registrados. Crea productos en Inventario antes de asociarlos al servicio.
            </div>

            <template v-else>
              <div class="insumo-form-row">
                <select v-model="insumoSeleccionadoId" class="input-texto">
                  <option value="" disabled>Selecciona un insumo</option>
                  <option v-for="producto in productosInventario" :key="producto.id" :value="producto.id">
                    {{ producto.nombre }} - {{ producto.cantidad }} {{ etiquetaUnidadInventario(producto.unidadMedida) }} disponibles
                  </option>
                </select>

                <select v-model="insumoUnidadConsumo" class="input-texto" :disabled="!insumoSeleccionadoId">
                  <option v-for="unidad in unidadesConsumoDisponibles" :key="unidad.valor" :value="unidad.valor">
                   {{ unidad.etiqueta }}
                  </option>
                </select>

                <input
                  v-model.number="insumoCantidad"
                  class="input-texto input-cantidad-insumo"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Cantidad por orden"
                />

                <button class="btn-nuevo-tipo" @click="agregarInsumo">
                  <ion-icon :icon="saveOutline" /> Guardar
                </button>
              </div>

              <div v-if="formulario.insumos.length" class="variante-lista">
                <div v-for="insumo in formulario.insumos" :key="insumo.id" class="variante-item">
                  <span>{{ insumo.nombreProducto }}</span>
                  <span>x{{ insumo.cantidad.toFixed(2) }} {{ etiquetaUnidadInventario(insumo.unidadConsumo || insumo.unidadMedida) }} por orden (stock en {{ etiquetaUnidadInventario(insumo.unidadMedida) }})</span>
                  <button class="variante-quitar" @click="quitarInsumo(insumo.id)">
                    <ion-icon :icon="closeOutline" />
                  </button>
                </div>
              </div>
            </template>
          </div>

          <label class="campo-label">Descripción (opcional)</label>
          <textarea
            v-model="formulario.descripcion"
            class="modal-textarea"
            placeholder="Click para agregar una descripción..."
          ></textarea>
        </div>

        <div class="modal-servicio-footer">
          <button v-if="itemEditando" class="btn-eliminar-modal" :disabled="guardando || peticionCatalogoEnCurso" @click="eliminarItemDesdeModal">
            <ion-icon :icon="trashOutline" /> Eliminar
          </button>
          <ion-button class="btn-fantasma" @click="cerrarModal">Cancelar</ion-button>
          <ion-button class="btn-primario-modal" :disabled="!formularioValido" @click="guardarItem">
            <ion-icon :icon="saveOutline" slot="start" />
            {{ itemEditando ? 'Guardar Cambios' : `Crear ${formulario.tipo === 'articulo' ? 'Artículo' : 'Servicio'}` }}
          </ion-button>
        </div>
      </div>
    </ion-modal>
  </AppShell>
</template>

<script setup lang="ts">
import AppShell from '@/components/AppShell.vue'
import { IonButton, IonIcon, IonModal, IonToggle } from '@ionic/vue'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import {
  useCatalogo,
  type CategoriaCatalogo,
  type ItemCatalogo,
  type TipoCatalogo,
  type UnidadServicio,
  type ClasificacionPrendas,
  type VarianteConPrecio,
  type EtiquetaPrenda,
  type InsumoCatalogo
} from '@/composables/Usecatalogo'
import { useInventario } from '@/composables/useInventario'
import {
  cubeOutline,
  pricetagOutline,
  addOutline,
  swapHorizontalOutline,
  documentTextOutline,
  flashOutline,
  refreshOutline,
  helpCircleOutline,
  shareSocialOutline,
  searchOutline,
  sparklesOutline,
  shirtOutline,
  createOutline,
  closeOutline,
  saveOutline,
  imageOutline
  ,trashOutline,
  downloadOutline,
  arrowBackOutline,
  chevronForwardOutline
} from 'ionicons/icons'

import { obtenerIconoPorNombre } from '@/composables/iconosPrendas'
import { jsPDF } from 'jspdf'
import { useApariencia } from '@/composables/useApariencia'
import logoCatalogo from '@/assets/logo.png'
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

const {
  categorias,
  items,
  servicios,
  articulos,
  cargando,
  error,
  cargarCatalogo,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
  crearItem,
  actualizarItem,
  eliminarItem
} = useCatalogo()
const { productos: productosInventario, cargarInventario } = useInventario()
const { apariencia } = useApariencia()

const generandoPdf = ref(false)
const peticionCatalogoEnCurso = ref(false)

onMounted(() => {
  cargarCatalogo().catch(() => {
    // el error ya queda expuesto en `error.value` para mostrarlo en el template
  })
  cargarInventario().catch(() => {})
})

const refrescarCatalogo = async () => {
  if (cargando.value) return

  try {
    await cargarCatalogo(true)
  } catch (err) {
    window.alert(err instanceof Error ? err.message : 'No se pudo refrescar el catálogo.')
  }
}

/* ───────────────── Subida de imagen ───────────────── */
const subirImagen = (e: Event) => {
  const input = e.target as HTMLInputElement
  const archivo = input.files?.[0]
  if (!archivo) return

  const lector = new FileReader()
  lector.onload = () => {
    formulario.imagenUrl = lector.result as string // se guarda como base64
  }
  lector.readAsDataURL(archivo)
}

/* ───────────────── Tabs y búsqueda ───────────────── */
const tabActivo = ref<'todo' | 'servicios' | 'articulos'>('todo')
const busqueda = ref('')
const categoriaActivaId = ref<string | null>(null)

const mostrarCategorias = () => {
  tabActivo.value = 'todo'
  categoriaActivaId.value = null
  busqueda.value = ''
}

const seleccionarServicios = () => {
  categoriaActivaId.value = null
  busqueda.value = ''
  tabActivo.value = 'servicios'
}

const abrirCategoria = (id: string) => {
  categoriaActivaId.value = id
  tabActivo.value = 'todo'
  busqueda.value = ''
}

const contarItemsCategoria = (id: string) => items.value.filter((item) => item.categoriaId === id).length

const itemsPorTab = computed(() => {
  if (tabActivo.value === 'servicios') return servicios.value
  if (tabActivo.value === 'articulos') return articulos.value
  return items.value
})

const itemsFiltrados = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  const itemsDeCategoria = categoriaActivaId.value
    ? itemsPorTab.value.filter((item) => item.categoriaId === categoriaActivaId.value)
    : itemsPorTab.value
  if (!q) return itemsDeCategoria
  return itemsDeCategoria.filter((i) => i.nombre.toLowerCase().includes(q))
})

const compararTexto = (a: string, b: string) => a.localeCompare(b, 'es', { sensitivity: 'base' })

const categoriasOrdenadas = computed(() =>
  [...categorias.value].sort((a, b) => compararTexto(a.nombre, b.nombre))
)

const gruposFiltrados = computed(() => {
  const mapa = new Map<
    string,
    { categoriaId: string | null; nombre: string; color: string; items: ItemCatalogo[] }
  >()

  for (const item of itemsFiltrados.value) {
    const cat = categorias.value.find((c) => c.id === item.categoriaId)
    const clave = item.categoriaId ?? 'sin-categoria'

    if (!mapa.has(clave)) {
      mapa.set(clave, {
        categoriaId: item.categoriaId,
        nombre: cat?.nombre ?? 'Sin categoría',
        color: cat?.color ?? '#9fb4c9',
        items: []
      })
    }

    mapa.get(clave)!.items.push(item)
  }

  return Array.from(mapa.values())
    .map((grupo) => ({
      ...grupo,
      items: [...grupo.items].sort((a, b) => compararTexto(a.nombre, b.nombre))
    }))
    .sort((a, b) => compararTexto(a.nombre, b.nombre))
})

const colorPdf = (color: string, fallback: [number, number, number]): [number, number, number] => {
  const hex = color.replace('#', '').trim()
  if (!/^[0-9a-f]{6}$/i.test(hex)) return fallback
  return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)]
}

const agruparServiciosParaPdf = () => {
  const mapa = new Map<string, { nombre: string; color: string; items: ItemCatalogo[] }>()

  for (const item of servicios.value) {
    const categoria = categorias.value.find((cat) => cat.id === item.categoriaId)
    const clave = item.categoriaId ?? 'sin-categoria'
    if (!mapa.has(clave)) {
      mapa.set(clave, {
        nombre: categoria?.nombre ?? 'Sin categoría',
        color: categoria?.color ?? '#9fb4c9',
        items: []
      })
    }
    mapa.get(clave)!.items.push(item)
  }

  return Array.from(mapa.values())
    .map((grupo) => ({
      ...grupo,
      items: [...grupo.items].sort((a, b) => compararTexto(a.nombre, b.nombre))
    }))
    .sort((a, b) => compararTexto(a.nombre, b.nombre))
}

const compartirCatalogo = async () => {
  if (generandoPdf.value || servicios.value.length === 0) return
  generandoPdf.value = true
  await new Promise<void>((resolve) => window.setTimeout(resolve, 80))

  try {
    const pdf = new jsPDF({ unit: 'mm', format: 'letter' })
    const ancho = pdf.internal.pageSize.getWidth()
    const alto = pdf.internal.pageSize.getHeight()
    const colorEncabezado = colorPdf(apariencia.appShellHeaderColor, [8, 26, 48])
    const colorFondo = colorPdf(apariencia.appShellColor, [238, 244, 248])
    const grupos = agruparServiciosParaPdf()
    const margen = 16
    const anchoTarjeta = (ancho - margen * 2 - 8) / 2
    let y = 16

    const dibujarMarcaAgua = () => {
      pdf.setDrawColor(218, 231, 241)
      pdf.setFillColor(246, 250, 253)
      pdf.setLineWidth(1.1)
      pdf.line(30, 145, 48, 132)
      pdf.line(48, 132, 58, 143)
      pdf.line(58, 143, 70, 132)
      pdf.line(70, 132, 88, 145)
      pdf.line(88, 145, 78, 158)
      pdf.line(78, 158, 73, 154)
      pdf.line(73, 154, 73, 190)
      pdf.line(73, 190, 45, 190)
      pdf.line(45, 190, 45, 154)
      pdf.line(45, 154, 40, 158)
      pdf.line(40, 158, 30, 145)
      pdf.line(58, 143, 58, 151)
      pdf.line(103, 142, 132, 142)
      pdf.line(106, 142, 107, 169)
      pdf.line(107, 169, 98, 195)
      pdf.line(98, 195, 111, 195)
      pdf.line(111, 195, 118, 174)
      pdf.line(118, 174, 125, 195)
      pdf.line(125, 195, 138, 195)
      pdf.line(138, 195, 129, 169)
      pdf.line(129, 169, 130, 142)
      pdf.line(118, 143, 118, 174)
      pdf.roundedRect(151, 137, 38, 49, 3, 3, 'S')
      pdf.circle(170, 164, 13, 'S')
      pdf.circle(170, 164, 8, 'S')
      pdf.circle(158, 144, 1.5, 'F')
      pdf.circle(164, 144, 1.5, 'F')
      pdf.line(178, 144, 184, 144)
    }

    const prepararPagina = (primeraPagina = false) => {
      if (!primeraPagina) pdf.addPage()
      pdf.setFillColor(...colorFondo)
      pdf.rect(0, 0, ancho, alto, 'F')
      dibujarMarcaAgua()
      pdf.setFillColor(...colorEncabezado)
      pdf.rect(0, 0, ancho, 40, 'F')
      pdf.addImage(logoCatalogo, 'PNG', ancho - margen - 25, 7, 25, 25)
      pdf.setTextColor(255, 255, 255)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(24)
      pdf.text('Nuestros servicios', margen, 19)
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(10)
      pdf.text('Lavandería Salinas', margen, 28)
      y = 52
    }

    const piePagina = () => {
      pdf.setDrawColor(210, 222, 231)
      pdf.line(margen, alto - 13, ancho - margen, alto - 13)
      pdf.setTextColor(93, 116, 137)
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8)
      pdf.text('Lavandería Salinas', margen, alto - 7)
      pdf.text(`Página ${pdf.getNumberOfPages()}`, ancho - margen, alto - 7, { align: 'right' })
    }

    const dibujarGrupo = (grupo: { nombre: string; color: string; items: ItemCatalogo[] }, inicio: number) => {
      const colorCategoria = colorPdf(grupo.color, colorEncabezado)
      pdf.setFillColor(...colorCategoria)
      pdf.roundedRect(margen, y, ancho - margen * 2, 10, 2, 2, 'F')
      pdf.setTextColor(255, 255, 255)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(12)
      pdf.text(inicio > 0 ? `${grupo.nombre} (continuación)` : grupo.nombre, margen + 5, y + 6.5)
      y += 15

      const filasDisponibles = Math.max(1, Math.floor((alto - 20 - y) / 24))
      const itemsPorPagina = filasDisponibles * 2
      const lote = grupo.items.slice(inicio, inicio + itemsPorPagina)
      lote.forEach((item, indice) => {
        const columna = indice % 2
        const fila = Math.floor(indice / 2)
        const x = margen + columna * (anchoTarjeta + 8)
        const yItem = y + fila * 24
        pdf.setFillColor(255, 255, 255)
        pdf.setDrawColor(221, 231, 238)
        pdf.roundedRect(x, yItem, anchoTarjeta, 19, 2, 2, 'FD')
        pdf.setFillColor(...colorCategoria)
        pdf.roundedRect(x, yItem, 3, 19, 1, 1, 'F')
        pdf.setTextColor(25, 48, 69)
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(10)
        pdf.text(item.nombre, x + 8, yItem + 8, { maxWidth: anchoTarjeta - 42 })
        pdf.setTextColor(...colorCategoria)
        pdf.setFontSize(13)
        pdf.text(`$${item.precio.toFixed(2)}`, x + anchoTarjeta - 6, yItem + 9, { align: 'right' })
        pdf.setTextColor(99, 119, 136)
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(8)
        pdf.text(etiquetaUnidad(item.unidad), x + 8, yItem + 14)
      })
      return { siguiente: inicio + lote.length, filas: Math.ceil(lote.length / 2) }
    }

    prepararPagina(true)
    for (const grupo of grupos) {
      let inicio = 0
      while (inicio < grupo.items.length) {
        if (y > alto - 44) {
          piePagina()
          prepararPagina()
        }
        const resultado = dibujarGrupo(grupo, inicio)
        inicio = resultado.siguiente
        y += resultado.filas * 24 + 8
        if (inicio < grupo.items.length) {
          piePagina()
          prepararPagina()
        }
      }
    }
    piePagina()

    const nombreArchivo = 'Catalogo-Lavanderia-Salinas.pdf'

    if (Capacitor.isNativePlatform()) {
      // Android / iOS empaquetados con Capacitor: no existe descarga de navegador,
      // así que guardamos el archivo y abrimos la hoja de compartir nativa.
      const base64Data = pdf.output('datauristring').split(',')[1]

      const guardado = await Filesystem.writeFile({
        path: nombreArchivo,
        data: base64Data,
        directory: Directory.Cache
      })

      await Share.share({
        title: 'Nuestros servicios',
        text: 'Catálogo de servicios de Lavandería Salinas',
        url: guardado.uri,
        dialogTitle: 'Compartir catálogo'
      })
    } else {
      // Navegador web normal (desktop)
      const blob = pdf.output('blob')
      const archivo = new File([blob], nombreArchivo, { type: 'application/pdf' })

      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [archivo] }))) {
        await navigator.share({
          title: 'Nuestros servicios',
          text: 'Catálogo de servicios de Lavandería Salinas',
          files: [archivo]
        })
      } else {
        pdf.save(nombreArchivo)
      }
    }
  } catch (error) {
    const nombreError = (error as { name?: string })?.name
    const mensajeError = (error as { message?: string })?.message
    if (nombreError !== 'AbortError' && mensajeError !== 'Share canceled') {
      console.error('No se pudo generar el catálogo PDF:', error)
      window.alert('No se pudo generar el PDF de servicios.')
    }
  } finally {
    generandoPdf.value = false
  }
}

/* ───────────────── Etiquetas de unidad ───────────────── */
const unidades: { valor: UnidadServicio; etiqueta: string }[] = [
  { valor: 'kilo', etiqueta: 'Kilo' },
  { valor: 'libra', etiqueta: 'Libra' },
  { valor: 'pieza', etiqueta: 'Pieza' },
  { valor: 'm2', etiqueta: 'Por m²' },
  { valor: 'galon', etiqueta: 'Galón' },
  { valor: 'mililitro', etiqueta: 'mL' },
  { valor: 'otro', etiqueta: 'Otro' }
]

const clasificacionesPrendas: { valor: ClasificacionPrendas; etiqueta: string }[] = [
  { valor: 'por_prenda', etiqueta: 'Servicio por prenda' },
  { valor: 'extra', etiqueta: 'Servicio extra' }
]

const etiquetaUnidad = (u: UnidadServicio) => {
  const map: Record<UnidadServicio, string> = {
    kilo: 'por kilo',
    libra: 'por libra',
    pieza: 'por pieza',
    m2: 'por m²',
    galon: 'por galón',
    mililitro: 'por mL',
    otro: 'por unidad'
  }
  return map[u]
}

const etiquetaUnidadCorta = (u: UnidadServicio) => {
  const map: Record<UnidadServicio, string> = {
    kilo: 'x kg',
    libra: 'x lb',
    pieza: 'x pza',
    m2: 'x m²',
    galon: 'x gal',
    mililitro: 'x mL',
    otro: 'x u.'
  }
  return map[u]
}

/* ───────────────── Modal crear/editar ───────────────── */
const mostrarModal = ref(false)
const itemEditando = ref<ItemCatalogo | null>(null)
const mostrarNuevaCategoria = ref(false)
const nombreNuevaCategoria = ref('')
const guardando = ref(false)
const errorGuardado = ref<string | null>(null)
const mostrarModalCategoria = ref(false)
const categoriaEditando = ref<CategoriaCatalogo | null>(null)
const formularioCategoria = reactive({ nombre: '', color: '#123a66' })
const guardandoCategoria = ref(false)
const mostrarModalNuevaCategoria = ref(false)
const nombreCategoriaNueva = ref('')

const formularioVacio = (tipo: TipoCatalogo) => ({
  tipo,
  nombre: '',
  categoriaId: null as string | null,
  precio: 0,
  unidad: 'pieza' as UnidadServicio,
  clasificacionPrendas: 'por_prenda' as ClasificacionPrendas,
  variantesActivas: false,
  variantesPrecio: [] as VarianteConPrecio[],
  etiquetas: [] as EtiquetaPrenda[],
  insumos: [] as InsumoCatalogo[],
  descripcion: '',
  imagenUrl: null as string | null
})

const formulario = reactive(formularioVacio('servicio'))

const abrirModalNuevo = () => {
  const tipo: TipoCatalogo = tabActivo.value === 'articulos' ? 'articulo' : 'servicio'
  Object.assign(formulario, {
    ...formularioVacio(tipo),
    categoriaId: categoriaActivaId.value
  })
  itemEditando.value = null
  mostrarNuevaCategoria.value = false
  nombreNuevaCategoria.value = ''
  insumoSeleccionadoId.value = ''
  insumoCantidad.value = 1
  errorGuardado.value = null
  mostrarModal.value = true
}

const editarItem = (item: ItemCatalogo) => {
  Object.assign(formulario, {
    tipo: item.tipo,
    nombre: item.nombre,
    categoriaId: item.categoriaId,
    precio: item.precio,
    unidad: item.unidad,
    clasificacionPrendas: item.clasificacionPrendas ?? 'por_prenda',
    variantesActivas: item.variantesActivas,
    variantesPrecio: Array.isArray(item.variantesPrecio) ? [...item.variantesPrecio] : [],
    etiquetas: Array.isArray(item.etiquetas) ? [...item.etiquetas] : [],
    insumos: Array.isArray(item.insumos) ? item.insumos.map((insumo) => ({ ...insumo })) : [],
    descripcion: item.descripcion,
    imagenUrl: item.imagenUrl
  })
  insumoSeleccionadoId.value = ''
  insumoCantidad.value = 1
  errorGuardado.value = null
  itemEditando.value = item
  mostrarModal.value = true
}

const abrirModalCategoria = (categoria: CategoriaCatalogo) => {
  categoriaEditando.value = categoria
  formularioCategoria.nombre = categoria.nombre
  formularioCategoria.color = categoria.color
  mostrarModalCategoria.value = true
}

const abrirModalNuevaCategoria = () => {
  nombreCategoriaNueva.value = ''
  mostrarModalNuevaCategoria.value = true
}

const cerrarModalNuevaCategoria = () => {
  mostrarModalNuevaCategoria.value = false
  nombreCategoriaNueva.value = ''
}

const guardarNuevaCategoria = async () => {
  if (!nombreCategoriaNueva.value.trim() || guardandoCategoria.value) return

  guardandoCategoria.value = true
  try {
    await crearCategoria(nombreCategoriaNueva.value)
    cerrarModalNuevaCategoria()
  } catch (err) {
    window.alert(err instanceof Error ? err.message : 'No se pudo crear la categoría.')
  } finally {
    guardandoCategoria.value = false
  }
}

const cerrarModalCategoria = () => {
  mostrarModalCategoria.value = false
  categoriaEditando.value = null
}

const guardarCategoria = async () => {
  if (!categoriaEditando.value || !formularioCategoria.nombre.trim() || guardandoCategoria.value) return

  guardandoCategoria.value = true
  try {
    await actualizarCategoria(categoriaEditando.value.id, {
      nombre: formularioCategoria.nombre,
      color: formularioCategoria.color
    })
    cerrarModalCategoria()
  } catch (err) {
    window.alert(err instanceof Error ? err.message : 'No se pudo guardar la categoría.')
  } finally {
    guardandoCategoria.value = false
  }
}

const eliminarCategoriaDesdeModal = async () => {
  if (!categoriaEditando.value || guardandoCategoria.value) return
  const confirmado = window.confirm(
    `¿Eliminar la categoría "${categoriaEditando.value.nombre}"? Los items quedarán sin categoría.`
  )
  if (!confirmado) return

  guardandoCategoria.value = true
  try {
    await eliminarCategoria(categoriaEditando.value.id)
    cerrarModalCategoria()
  } catch (err) {
    window.alert(err instanceof Error ? err.message : 'No se pudo eliminar la categoría.')
  } finally {
    guardandoCategoria.value = false
  }
}

const eliminarItemDesdeModal = async () => {
  if (!itemEditando.value || peticionCatalogoEnCurso.value) return
  const confirmado = window.confirm(`¿Eliminar el item "${itemEditando.value.nombre}"? Esta acción no se puede deshacer.`)
  if (!confirmado) return

  peticionCatalogoEnCurso.value = true
  try {
    await eliminarItem(itemEditando.value.id)
    cerrarModal()
  } catch (err) {
    window.alert(err instanceof Error ? err.message : 'No se pudo eliminar el item.')
  } finally {
    peticionCatalogoEnCurso.value = false
  }
}

const cerrarModal = () => {
  mostrarModal.value = false
}

const confirmarNuevaCategoria = async () => {
  try {
    const cat = await crearCategoria(nombreNuevaCategoria.value)
    if (cat) {
      formulario.categoriaId = cat.id
      nombreNuevaCategoria.value = ''
      mostrarNuevaCategoria.value = false
    }
  } catch (err) {
    errorGuardado.value = err instanceof Error ? err.message : 'No se pudo crear la categoría.'
  }
}

const formularioValido = computed(
  () => formulario.nombre.trim().length > 0 && !!formulario.categoriaId && formulario.precio >= 0
)

const insumoSeleccionadoId = ref('')
const insumoCantidad = ref(1)
const insumoUnidadConsumo = ref<string>('pieza')

const productoInsumoSeleccionado = computed(() =>
  productosInventario.value.find((item) => item.id === insumoSeleccionadoId.value) ?? null
)

const unidadesConsumoDisponibles = computed(() => {
  const unidadStock = productoInsumoSeleccionado.value?.unidadMedida
  if (unidadStock === 'galon' || unidadStock === 'litro' || unidadStock === 'mililitro') {
    return [
      { valor: 'galon', etiqueta: 'galones' },
      { valor: 'litro', etiqueta: 'litros' },
      { valor: 'mililitro', etiqueta: 'mL' }
    ]
  }
  if (unidadStock === 'kilogramo' || unidadStock === 'gramo' || unidadStock === 'libra') {
    return [
      { valor: 'kilogramo', etiqueta: 'kilogramos' },
      { valor: 'gramo', etiqueta: 'gramos' },
      { valor: 'libra', etiqueta: 'libras' }
    ]
  }
  return unidadStock ? [{ valor: unidadStock, etiqueta: etiquetaUnidadInventario(unidadStock) }] : []
})

watch(productoInsumoSeleccionado, (producto) => {
  insumoUnidadConsumo.value = producto?.unidadMedida ?? 'pieza'
})

const etiquetaUnidadInventario = (unidad: string) => {
  const map: Record<string, string> = {
    pieza: 'pz',
    litro: 'L',
    mililitro: 'mL',
    galon: 'gal',
    kilogramo: 'kg',
    libra: 'lb',
    gramo: 'g',
    paquete: 'paq',
    caja: 'caja',
    otro: 'u'
  }
  return map[unidad] ?? 'u'
}

const agregarInsumo = () => {
  const producto = productosInventario.value.find((item) => item.id === insumoSeleccionadoId.value)
  const cantidad = Number(insumoCantidad.value)

  if (!producto || !Number.isFinite(cantidad) || cantidad <= 0) return

  const existente = formulario.insumos.find((insumo) => insumo.productoId === producto.id)
  if (existente) {
    existente.cantidad = Number((existente.cantidad + cantidad).toFixed(2))
    existente.unidadConsumo = insumoUnidadConsumo.value
  } else {
    formulario.insumos.push({
      id: Math.random().toString(36).slice(2, 9),
      productoId: producto.id,
      nombreProducto: producto.nombre,
      unidadMedida: producto.unidadMedida,
      unidadConsumo: insumoUnidadConsumo.value,
      cantidad
    })
  }

  insumoSeleccionadoId.value = ''
  insumoCantidad.value = 1
}

const quitarInsumo = (id: string) => {
  formulario.insumos = formulario.insumos.filter((insumo) => insumo.id !== id)
}

const guardarItem = async () => {
  if (!formularioValido.value || guardando.value) return

  guardando.value = true
  errorGuardado.value = null
  try {
    if (itemEditando.value) {
      await actualizarItem(itemEditando.value.id, { ...formulario })
    } else {
      await crearItem({ ...formulario })
    }
    mostrarModal.value = false
  } catch (err) {
    errorGuardado.value = err instanceof Error ? err.message : 'No se pudo guardar el item.'
  } finally {
    guardando.value = false
  }
}

/* ───────────────── Variantes ───────────────── */
const nuevaVariantePrecio = reactive({ nombre: '', precio: 0 })

const agregarVariantePrecio = () => {
  const nombre = nuevaVariantePrecio.nombre.trim()
  if (!nombre || formulario.variantesPrecio.length >= 3) return
  formulario.variantesPrecio.push({
    id: Math.random().toString(36).slice(2, 9),
    nombre,
    precio: nuevaVariantePrecio.precio || 0
  })
  nuevaVariantePrecio.nombre = ''
  nuevaVariantePrecio.precio = 0
}

const quitarVariantePrecio = (id: string) => {
  formulario.variantesPrecio = formulario.variantesPrecio.filter((v) => v.id !== id)
}

const nuevaEtiqueta = ref('')

const agregarEtiqueta = () => {
  const nombre = nuevaEtiqueta.value.trim()
  if (!nombre) return
  formulario.etiquetas.push({ id: Math.random().toString(36).slice(2, 9), nombre })
  nuevaEtiqueta.value = ''
}

const quitarEtiqueta = (id: string) => {
  formulario.etiquetas = formulario.etiquetas.filter((e) => e.id !== id)
}
</script>

<style scoped>
.force-light {
  --ion-background-color: #ffffff;
  --ion-text-color: #0a1f38;
  color-scheme: light;
}

.catalogo-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: calc(100% + 220px);
  padding-bottom: 8px;
}

.catalogo-header h1 {
  margin: 0;
  color: #0a1f38;
  font-size: clamp(1.8rem, 2.5vw, 2.6rem);
  font-weight: 900;
}

/* ── Tabs ── */
.tabs-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tab-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 16px;
  border-radius: 999px;
  border: 1px solid rgba(10, 31, 56, 0.10);
  background: #ffffff;
  color: #4a627e;
  font-weight: 700;
  font-size: 0.88rem;
  cursor: pointer;
}

.tab-chip.active {
  background: #123a66;
  border-color: #123a66;
  color: #f5f9fc;
}

.badge {
  background: rgba(10, 31, 56, 0.10);
  color: #123a66;
  border-radius: 999px;
  padding: 1px 8px;
  font-size: 0.74rem;
  font-weight: 800;
}

.tab-chip.active .badge {
  background: rgba(255, 255, 255, 0.22);
  color: #ffffff;
}

/* ── Fila de acciones ── */
.acciones-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-nuevo {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  border-radius: 12px;
  border: none;
  background: #123a66;
  color: #f5f9fc;
  font-weight: 800;
  font-size: 0.88rem;
  cursor: pointer;
}

.btn-nueva-categoria {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 15px;
  border: 1px solid rgba(22, 139, 131, 0.28);
  border-radius: 12px;
  background: #eaf7f5;
  color: #126f6a;
  font-weight: 800;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
}

.btn-nueva-categoria:hover {
  transform: translateY(-1px);
  border-color: rgba(22, 139, 131, 0.5);
  background: #dff2ef;
}

.btn-secundario,
.btn-verde-outline {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 12px;
  border: 1px solid rgba(10, 31, 56, 0.14);
  background: #ffffff;
  color: #123a66;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
}

.btn-verde-outline {
  border-color: rgba(22, 163, 74, 0.30);
  color: #15803d;
}

.btn-ambar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 12px;
  border: 1px solid rgba(224, 182, 74, 0.40);
  background: rgba(224, 182, 74, 0.08);
  color: #a5791f;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
}

.acciones-derecha {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 10px;
}

.icon-btn {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid rgba(10, 31, 56, 0.10);
  background: #ffffff;
  color: #4a627e;
  display: grid;
  place-items: center;
  cursor: pointer;
}

.conteo-texto {
  font-size: 0.82rem;
  color: #6d829c;
  font-weight: 600;
}

.btn-fantasma-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid rgba(10, 31, 56, 0.12);
  background: #ffffff;
  color: #123a66;
  font-weight: 700;
  font-size: 0.82rem;
  cursor: pointer;
}

.btn-fantasma-chip:disabled {
  background: #eef4f8;
  color: #6d829c;
  cursor: wait;
  opacity: 0.85;
}

.girando {
  animation: girar-icono 0.9s linear infinite;
}

@keyframes girar-icono {
  to { transform: rotate(360deg); }
}

/* ── Buscador ── */
.search-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #ffffff;
  border: 1px solid rgba(10, 31, 56, 0.10);
  border-radius: 14px;
  padding: 11px 16px;
  color: #4a627e;
}

.search-bar input {
  border: none;
  outline: none;
  flex: 1;
  font-size: 0.92rem;
  background: transparent;
  color: #0a1f38;
}

/* ── Banner configuración ── */
.banner-configura {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 22px;
  border-radius: 16px;
  background: linear-gradient(120deg, #123a66 0%, #0d2b4e 100%);
  color: #f5f9fc;
}

.banner-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.14);
  display: grid;
  place-items: center;
  font-size: 22px;
  flex-shrink: 0;
}

.banner-titulo {
  margin: 0 0 3px;
  font-weight: 800;
  font-size: 1.02rem;
}

.banner-texto {
  margin: 0;
  font-size: 0.85rem;
  color: rgba(245, 249, 252, 0.82);
}

/* ── Estado vacío ── */
.estado-vacio-box {
  border: 1.5px dashed #a9d8ee;
  border-radius: 16px;
  background: rgba(169, 216, 238, 0.06);
  padding: 40px 20px;
  text-align: center;
}

.estado-vacio-icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(169, 216, 238, 0.18);
  display: grid;
  place-items: center;
  margin: 0 auto 14px;
}

.estado-vacio-icon {
  font-size: 30px;
  color: #123a66;
}

.estado-vacio-titulo {
  margin: 0 0 4px;
  font-weight: 800;
  color: #0a1f38;
  font-size: 1.05rem;
}

.estado-vacio-texto {
  margin: 0 0 16px;
  color: #6d829c;
  font-size: 0.88rem;
}

.btn-primario-grande {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 22px;
  border-radius: 12px;
  border: none;
  background: #123a66;
  color: #f5f9fc;
  font-weight: 800;
  cursor: pointer;
}

/* ── Tarjetas informativas ── */
.info-cards-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}

.info-card {
  background: #ffffff;
  border: 1px solid rgba(10, 31, 56, 0.08);
  border-radius: 14px;
  padding: 18px;
}

.info-card-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  margin-bottom: 10px;
  font-size: 18px;
}

.icon-navy {
  background: rgba(18, 58, 102, 0.10);
  color: #123a66;
}

.icon-verde {
  background: rgba(22, 163, 74, 0.10);
  color: #16a34a;
}

.icon-morado {
  background: rgba(124, 58, 237, 0.10);
  color: #7c3aed;
}

.info-card-titulo {
  margin: 0 0 4px;
  font-weight: 800;
  color: #0a1f38;
}

.info-card-texto {
  margin: 0;
  font-size: 0.84rem;
  color: #6d829c;
}

/* ── Tips ── */
.tips-box {
  background: rgba(169, 216, 238, 0.08);
  border: 1px solid rgba(169, 216, 238, 0.30);
  border-radius: 14px;
  padding: 16px 18px;
}

.tips-titulo {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 8px;
  font-weight: 800;
  color: #123a66;
}

.tips-lista {
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #24405f;
  font-size: 0.88rem;
}

/* ── Listado por categoría ── */
.categorias-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.categoria-card {
  position: relative;
  display: grid;
  min-height: 174px;
  align-content: start;
  gap: 10px;
  padding: 22px;
  border: 1px solid rgba(10, 31, 56, 0.1);
  border-radius: 18px;
  background: #ffffff;
  color: #0a1f38;
  text-align: left;
  cursor: pointer;
  box-shadow: 0 7px 18px rgba(10, 31, 56, 0.06);
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
}

.categoria-card:hover {
  transform: translateY(-4px);
  border-color: rgba(22, 139, 131, 0.35);
  box-shadow: 0 16px 26px rgba(10, 31, 56, 0.12);
}

.categoria-card-acento {
  position: absolute;
  inset: 0 auto 0 0;
  width: 5px;
  border-radius: 18px 0 0 18px;
}

.categoria-card-icono {
  display: grid;
  place-items: center;
  width: 43px;
  height: 43px;
  border-radius: 13px;
  background: #eaf3f8;
  font-size: 22px;
}

.categoria-card-nombre {
  overflow: hidden;
  font-size: 1.05rem;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.categoria-card-conteo {
  color: #6d829c;
  font-size: .82rem;
  font-weight: 700;
}

.categoria-card-editar {
  position: absolute;
  top: 16px;
  right: 16px;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid rgba(22, 139, 131, 0.2);
  border-radius: 9px;
  background: #eff9f7;
  color: #168b83;
  cursor: pointer;
  transition: background .2s ease, color .2s ease, transform .2s ease;
}

.categoria-card-editar:hover {
  transform: translateY(-1px);
  background: #168b83;
  color: #ffffff;
}

.categoria-card-flecha {
  position: absolute;
  right: 18px;
  bottom: 20px;
  color: #9fb4c9;
  font-size: 19px;
  transition: transform .2s ease, color .2s ease;
}

.categoria-card:hover .categoria-card-flecha {
  transform: translateX(4px);
  color: #168b83;
}

.categoria-card-nueva {
  border-style: dashed;
  border-color: rgba(22, 139, 131, 0.35);
  background: #f5fbfa;
}

.categoria-card-nueva .categoria-card-icono {
  background: #dff2ef;
  color: #168b83;
}

.listado-categorias {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.categorias-gestion {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 10px 12px;
  border: 1px solid #e1ebf2;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.82);
}

.categorias-gestion-titulo {
  margin-right: 4px;
  color: #4a627e;
  font-size: 0.82rem;
  font-weight: 800;
}

.categoria-gestion-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 32px;
  padding: 3px 5px 3px 9px;
  border: 1px solid #e1ebf2;
  border-radius: 999px;
  background: #ffffff;
  color: #173653;
  font-size: 0.82rem;
  font-weight: 700;
}

.categoria-gestion-item .editar-btn {
  width: 24px;
  height: 24px;
}

.categoria-conteo {
  min-width: 20px;
  padding: 2px 6px;
  border-radius: 999px;
  background: #eef4f8;
  color: #6d829c;
  font-size: 0.72rem;
  text-align: center;
}

.grupo-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.grupo-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}

.grupo-header h3 {
  margin: 0;
  font-size: 1rem;
  color: #0a1f38;
}

.tarjetas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 14px;
}

.tarjeta-servicio {
  background: #ffffff;
  border: 1px solid rgba(10, 31, 56, 0.08);
  border-left: 9px solid #123a66;
  border-radius: 14px;
  padding: 14px;
  cursor: default;
}

.tarjeta-top {
  display: flex;
  align-items: flex-start; /* CAMBIAR: antes decía "align-items: center" */
  gap: 8px;
}

.tarjeta-icono {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: rgba(18, 58, 102, 0.08);
  color: #123a66;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.tarjeta-nombre {
  flex: 1;
  min-width: 0;            /* AGREGAR */
  font-weight: 700;
  color: #0a1f38;
  font-size: 0.92rem;
  line-height: 1.3;        /* AGREGAR */
  word-break: break-word;  /* AGREGAR */
}

.editar-btn {
  border: none;
  background: none;
  color: #9fb4c9;
  cursor: pointer;
  display: grid;
  place-items: center;
  flex-shrink: 0; /* AGREGAR */
}

.tarjeta-precio {
  margin: 12px 0 0;
  font-weight: 800;
  color: #123a66;
  font-size: 1.15rem;
}

.tarjeta-unidad {
  margin: 0;
  font-size: 0.78rem;
  color: #9fb4c9;
}

/* ══════════════ MODAL ══════════════ */
.modal-servicio {
  --width: 560px;
  --height: 92%;
  --border-radius: 20px;
}

.modal-servicio-contenido {
  background: #ffffff;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.modal-servicio-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 22px;
  background: linear-gradient(120deg, #123a66 0%, #0d2b4e 100%);
  color: #f5f9fc;
  flex-shrink: 0;
}

.modal-servicio-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-servicio-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.14);
  display: grid;
  place-items: center;
  font-size: 22px;
}

.modal-servicio-titulo {
  margin: 0;
  font-weight: 800;
  font-size: 1.05rem;
}

.modal-servicio-subtitulo {
  margin: 2px 0 0;
  font-size: 0.82rem;
  color: rgba(245, 249, 252, 0.78);
}

.modal-cerrar {
  border: none;
  background: rgba(255, 255, 255, 0.14);
  color: #f5f9fc;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  font-size: 18px;
  cursor: pointer;
  display: grid;
  place-items: center;
}

.modal-servicio-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.campo-label {
  font-size: 0.8rem;
  font-weight: 800;
  color: #4a627e;
  margin-top: 10px;
}

.input-texto {
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1.5px solid rgba(10, 31, 56, 0.14);
  font-size: 0.9rem;
  color: #0a1f38;
  outline: none;
  background: #fbfdfe;
}

.input-texto:focus {
  border-color: #a9d8ee;
  box-shadow: 0 0 0 3px rgba(169, 216, 238, 0.25);
}

.categoria-vacia {
  text-align: center;
  padding: 26px 16px;
  border-radius: 14px;
  background: rgba(169, 216, 238, 0.08);
  border: 1px dashed #a9d8ee;
  color: #6d829c;
}

.categoria-vacia-icon {
  font-size: 34px;
  color: #a9c3d8;
  margin-bottom: 8px;
}

.categoria-vacia p {
  margin: 0 0 12px;
  font-weight: 700;
  color: #4a627e;
}

.categorias-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip-categoria {
  padding: 8px 14px;
  border-radius: 999px;
  border: 1.5px solid rgba(10, 31, 56, 0.14);
  background: #ffffff;
  color: #24405f;
  font-weight: 700;
  font-size: 0.82rem;
  cursor: pointer;
}

.chip-categoria.active {
  color: #ffffff;
}

.chip-nueva {
  display: flex;
  align-items: center;
  gap: 4px;
  border-style: dashed;
  color: #123a66;
}

.nueva-categoria-row {
  display: flex;
  gap: 8px;
}

.precio-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.precio-input {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1.5px solid rgba(10, 31, 56, 0.14);
  border-radius: 12px;
  padding: 10px 14px;
  font-weight: 700;
  color: #0a1f38;
  background: #fbfdfe;
}

.precio-input input {
  border: none;
  outline: none;
  flex: 1;
  font-size: 0.95rem;
  font-weight: 700;
  background: transparent;
}

.precio-input-chico {
  flex: none;
  width: 110px;
}

.precio-unidad-tag {
  padding: 10px 14px;
  border-radius: 10px;
  background: rgba(10, 31, 56, 0.06);
  color: #4a627e;
  font-weight: 700;
  font-size: 0.85rem;
}

.unidad-tabs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.unidad-tab {
  padding: 9px 16px;
  border-radius: 10px;
  border: 1.5px solid rgba(10, 31, 56, 0.12);
  background: #ffffff;
  color: #4a627e;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
}

.unidad-tab.active {
  background: #123a66;
  border-color: #123a66;
  color: #f5f9fc;
}

.variantes-box {
  margin-top: 12px;
  border: 1px solid rgba(10, 31, 56, 0.10);
  border-radius: 14px;
  padding: 16px;
}

.insumos-box {
  margin-top: 12px;
  border: 1px solid rgba(10, 31, 56, 0.10);
  border-radius: 14px;
  padding: 16px;
  background: rgba(169, 216, 238, 0.04);
}

.variantes-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 800;
  color: #0a1f38;
}

.variantes-header span {
  display: flex;
  align-items: center;
  gap: 6px;
}

.variantes-hint {
  margin: 4px 0 12px;
  font-size: 0.8rem;
  color: #7c8fa6;
}

.variante-subseccion {
  padding: 12px 0;
  border-top: 1px solid rgba(10, 31, 56, 0.08);
}

.variante-subtitulo {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 4px;
  font-weight: 800;
  font-size: 0.85rem;
  color: #0a1f38;
}
.imagen-personalizada-box {
  display: flex;
  align-items: center;
  gap: 14px;
}

.imagen-preview {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: rgba(10, 31, 56, 0.05);
  color: #4a627e;
  display: grid;
  place-items: center;
  font-size: 26px;
  overflow: hidden;
  flex-shrink: 0;
}

.imagen-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.imagen-acciones {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.btn-subir-imagen {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1.5px dashed #a9d8ee;
  background: rgba(169, 216, 238, 0.08);
  color: #123a66;
  font-weight: 700;
  font-size: 0.82rem;
  cursor: pointer;
  width: fit-content;
}

.btn-quitar-imagen {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: none;
  color: #9fb4c9;
  font-size: 0.78rem;
  cursor: pointer;
  width: fit-content;
}
.variante-descripcion {
  margin: 0 0 10px;
  font-size: 0.78rem;
  color: #7c8fa6;
}

.insumos-vacio {
  border: 1px dashed rgba(18, 58, 102, 0.18);
  border-radius: 12px;
  padding: 12px;
  color: #6d829c;
  font-size: 0.86rem;
  background: rgba(255, 255, 255, 0.7);
}

.insumo-form-row {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) 120px auto;
  gap: 8px;
  align-items: center;
  margin-bottom: 10px;
}

.input-cantidad-insumo {
  min-width: 120px;
}

.variante-lista {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
}

.variante-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 10px;
  background: #fbfdfe;
  border: 1px solid rgba(10, 31, 56, 0.08);
  font-size: 0.85rem;
  color: #0a1f38;
}

.variante-item span:first-child {
  flex: 1;
  font-weight: 600;
}

.variante-quitar {
  border: none;
  background: none;
  color: #9fb4c9;
  cursor: pointer;
  display: grid;
  place-items: center;
}

.variante-nueva-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.variante-nueva-row .input-texto {
  flex: 1;
  min-width: 120px;
}

.btn-nuevo-tipo {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1.5px solid #8ccbea;
  background: #eaf7fd;
  color: #123a66;
  font-weight: 700;
  font-size: 0.82rem;
  cursor: pointer;
  white-space: nowrap;
}

.modal-textarea {
  width: 100%;
  min-height: 70px;
  border-radius: 12px;
  border: 1.5px solid rgba(10, 31, 56, 0.14);
  padding: 10px 12px;
  font-size: 0.88rem;
  color: #0a1f38;
  resize: none;
  font-family: inherit;
  background: #fbfdfe;
}

.modal-servicio-footer {
  display: flex;
  gap: 10px;
  padding: 16px 22px;
  border-top: 1px solid rgba(10, 31, 56, 0.08);
  flex-shrink: 0;
}

.modal-servicio-footer ion-button {
  flex: 1;
}

.modal-categoria {
  --width: 440px;
  --height: auto;
  --border-radius: 20px;
}

.modal-categoria-contenido {
  background: #ffffff;
  color: #0a1f38;
  pointer-events: auto;
}

.modal-categoria-contenido #categoria-nombre {
  pointer-events: auto;
  user-select: text;
  cursor: text;
}

.modal-categoria-body {
  display: grid;
  gap: 8px;
  padding: 20px 22px 24px;
}

.grupo-dot.grande {
  width: 22px;
  height: 22px;
  border-radius: 7px;
}

.color-editor {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #4a627e;
  font-size: 0.9rem;
  font-weight: 700;
}

.color-editor input {
  width: 48px;
  height: 38px;
  padding: 2px;
  border: 1px solid rgba(10, 31, 56, 0.14);
  border-radius: 10px;
  background: #ffffff;
  cursor: pointer;
}

.modal-categoria-footer {
  align-items: center;
  justify-content: space-between;
}

.modal-footer-acciones {
  display: flex;
  flex: 1;
  gap: 10px;
}

.modal-footer-acciones ion-button {
  flex: 1;
}

.btn-eliminar-modal {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 40px;
  padding: 8px 12px;
  border: 1px solid #efc8bf;
  border-radius: 10px;
  background: #fff7f5;
  color: #b5523c;
  font: inherit;
  font-size: 0.8rem;
  font-weight: 800;
  cursor: pointer;
}

.btn-eliminar-modal:disabled {
  opacity: 0.55;
  cursor: not-allowed;
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

.btn-primario-modal {
  --background: #123a66;
  --background-hover: #0d2b4e;
  --color: #f5f9fc;
  --border-radius: 12px;
  font-weight: 800;
}

.btn-primario-modal[disabled] {
  --background: rgba(10, 31, 56, 0.12);
  --color: #9fb4c9;
}

.btn-primario {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 10px;
  border: none;
  background: #123a66;
  color: #f5f9fc;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
}

@media (max-width: 640px) {
  .modal-servicio {
    --width: 100%;
    --height: 100%;
    --border-radius: 0;
  }
}

/* ── Categorías: 2 columnas en mobile, hasta 4 en tablet ── */
@media (max-width: 600px) {
  .categorias-cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .categoria-card {
    min-height: 140px;
    padding: 16px;
    gap: 8px;
  }

  .categoria-card-icono {
    width: 36px;
    height: 36px;
    font-size: 18px;
    border-radius: 11px;
  }

  .categoria-card-nombre {
    font-size: 0.92rem;
  }

  .categoria-card-flecha {
    right: 14px;
    bottom: 14px;
    font-size: 16px;
  }
}

@media (min-width: 601px) and (max-width: 900px) {
  .categorias-cards {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
  }

  .categoria-card {
    min-height: 150px;
    padding: 18px;
  }
}
</style>
