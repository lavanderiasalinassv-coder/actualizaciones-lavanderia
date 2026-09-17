<template>
  <AppShell>
    <div class="tab1-content force-light">
      <OrdenGuiada />
    </div>
    <ion-modal :is-open="mostrarModalCierre" class="modal-turno" @didDismiss="cancelarCierreTurno">
      <div class="modal-contenido">
        <div class="modal-header">
          <div class="modal-header-left">
            <div class="modal-header-icon">💰</div>
            <div>
              <h3 class="modal-titulo">Cerrar turno #{{ turno.numeroCaja }}</h3>
              <p class="modal-subtitulo">Cuenta el efectivo en caja antes de continuar</p>
            </div>
          </div>
          <button class="modal-cerrar" @click="cancelarCierreTurno">✕</button>
        </div>

        <div>
          <label class="modal-label">Saldo de cierre</label>
          <div class="modal-input-monto">
            <span>$</span>
            <input v-model.number="saldoCierre" type="number" min="0" step="0.01" placeholder="0.00" />
          </div>
          <p class="hint-texto">Ingresa el monto exacto de efectivo que hay en caja</p>
        </div>

        <div class="modal-botones">
          <ion-button class="btn-fantasma" @click="cancelarCierreTurno">Cancelar</ion-button>
          <ion-button class="btn-advertencia" @click="confirmarCierreTurno">Cerrar turno</ion-button>
        </div>
      </div>
    </ion-modal>
  </AppShell>
</template>

<script setup lang="ts">
import AppShell from '@/components/AppShell.vue'
import OrdenGuiada from '@/components/OrdenGuiada.vue'
import { IonButton, IonIcon, IonModal } from '@ionic/vue'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCatalogo, type ItemCatalogo } from '@/composables/Usecatalogo'
import { useTurno } from '@/composables/useTurno'
import { useHistorialCierres } from '@/composables/useHistorialCierres'
import {
  cubeOutline,
  searchOutline,
  personOutline,
  timeOutline,
  cardOutline,
  eyeOutline,
  closeOutline,
  checkmarkOutline
} from 'ionicons/icons'

import { usePedido } from '@/composables/Usepedido'
import { obtenerIconoPorNombre } from '@/composables/iconosPrendas'

const { agregarItem, cantidadEnCarrito } = usePedido()
const { turno, abrirTurno } = useTurno()
const { registrarCierreTurno } = useHistorialCierres()
const router = useRouter()
const { categorias: categoriasCatalogo, servicios } = useCatalogo()

const irA = (r: string) => {
  router.push(r).catch(() => {})
}

interface Usuario {
  id?: string
  nombre: string
  correo?: string
  rol?: string
}

const usuario = ref<Usuario>({ nombre: 'Usuario' })

onMounted(() => {
  try {
    const usuarioGuardado = localStorage.getItem('usuario')
    if (usuarioGuardado) {
      const parsed = JSON.parse(usuarioGuardado)
      usuario.value = {
        id: parsed.id || '',
        nombre: parsed.nombre || 'Usuario',
        correo: parsed.correo || '',
        rol: parsed.rol || ''
      }
    }
  } catch (error) {
    console.error('Error al cargar usuario:', error)
    usuario.value = { nombre: 'Usuario' }
  }
})
const categorias = computed(() => ['Todos', ...categoriasCatalogo.value.map((c) => c.nombre)])
const categoriaActiva = ref('Todos')
const busqueda = ref('')

const serviciosFiltrados = computed(() => {
  const consulta = busqueda.value.trim().toLowerCase()
  let lista = servicios.value

  if (categoriaActiva.value !== 'Todos') {
    const categoria = categoriasCatalogo.value.find((c) => c.nombre === categoriaActiva.value)
    lista = lista.filter((item) => item.categoriaId === categoria?.id)
  }

  if (!consulta) return lista
  return lista.filter((item) => item.nombre.toLowerCase().includes(consulta))
})

interface GrupoServicios {
  categoriaId: string | null
  nombre: string
  color: string
  items: ItemCatalogo[]
}

const gruposServiciosFiltrados = computed<GrupoServicios[]>(() => {
  const mapa = new Map<string, GrupoServicios>()

  for (const item of serviciosFiltrados.value) {
    const cat = categoriasCatalogo.value.find((c) => c.id === item.categoriaId)
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
})

const etiquetaUnidad = (u: string) => {
  const map: Record<string, string> = {
    kilo: 'por kilo',
    libra: 'por libra',
    pieza: 'por pieza',
    m2: 'por m²',
    otro: 'por unidad'
  }
  return map[u] ?? 'por unidad'
}

/* ───────────────── Turno ───────────────── */
const mostrarModalTurno = ref(false)
const mostrarModalDetalle = ref(false)
const mostrarModalCierre = ref(false)
const efectivoCajaInicial = ref(10)
const notasTurno = ref('')
const saldoCierre = ref(0)

const formatearFechaHora = (fecha: string | null) => {
  if (!fecha) return 'No disponible'
  try {
    const d = new Date(fecha)
    const fechaFormato = d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    const horaFormato = d.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
    return `${fechaFormato} a las ${horaFormato}`
  } catch {
    return fecha
  }
}

const ahora = ref(new Date())
let relojId: any = null

onMounted(() => {
  relojId = setInterval(() => {
    ahora.value = new Date()
  }, 1000)
})

onUnmounted(() => {
  if (relojId) clearInterval(relojId)
})

const tiempoTranscurrido = computed(() => {
  if (!turno.horaInicio) return '00:00'
  const inicio = new Date(turno.horaInicio)
  const diffMs = ahora.value.getTime() - inicio.getTime()
  const totalSeg = Math.max(0, Math.floor(diffMs / 1000))
  const min = Math.floor(totalSeg / 60)
  const seg = totalSeg % 60
  return `${String(min).padStart(2, '0')}:${String(seg).padStart(2, '0')}`
})

const iniciarTurno = () => {
  abrirTurno({
    usuario: 'Bryan Torres',
    apertura: efectivoCajaInicial.value || 0,
    notas: notasTurno.value
  })
  mostrarModalTurno.value = false
}

const obtenerSaludo = () => {
  const hora = ahora.value.getHours()
  if (hora < 12) {
    return '¡Buenos días!'
  } else if (hora < 18) {
    return '¡Buenas tardes!'
  } else {
    return '¡Buenas noches!'
  }
}

const terminarTurno = () => {
  mostrarModalCierre.value = true
}

const confirmarCierreTurno = async () => {
  try {
    await registrarCierreTurno(saldoCierre.value)
    mostrarModalCierre.value = false
    saldoCierre.value = 0
  } catch (error) {
    console.error('Error al cerrar turno:', error)
    alert('Hubo un error al cerrar el turno. Intenta nuevamente.')
  }
}

const cancelarCierreTurno = () => {
  mostrarModalCierre.value = false
  saldoCierre.value = 0
}

const verDetalleTurno = () => {
  mostrarModalDetalle.value = true
}
</script>

<style scoped>
.force-light {
  --ion-background-color: #ffffff;
  --ion-text-color: #0a1f38;
  color-scheme: light;
}

.tab1-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: calc(100% + 220px);
  font-size: 1rem;
  position: relative;
}

.turno-mini {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 5;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(22, 163, 74, 0.10);
  color: #166534;
  border: 1px solid rgba(22, 163, 74, 0.18);
  box-shadow: 0 8px 18px rgba(10, 31, 56, 0.06);
  font-size: 0.82rem;
  font-weight: 800;
}

.turno-mini small {
  font-weight: 700;
  opacity: 0.8;
}

.turno-mini-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #16a34a;
  box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.12);
}

.turno-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px;
  border-radius: 16px;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.turno-banner,
.modal-turno {
  display: none !important;
}

.turno-cerrado {
  background: rgba(169, 216, 238, 0.10);
  border: 1.5px dashed #a9d8ee;
}

.turno-banner-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.turno-banner-icon {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: rgba(18, 58, 102, 0.10);
  color: #123a66;
  display: grid;
  place-items: center;
  font-size: 20px;
  flex-shrink: 0;
}

.turno-titulo {
  margin: 0;
  font-weight: 800;
  color: #0a1f38;
  font-size: 1rem;
}

.turno-subtitulo {
  margin: 0;
  color: #4a627e;
  font-size: 0.9rem;
}

.turno-abierto {
  background: rgba(22, 163, 74, 0.08);
  border: 1px solid rgba(22, 163, 74, 0.25);
}

.turno-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #16a34a;
  flex-shrink: 0;
}

.turno-info {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.92rem;
  color: #1d3b2a;
}

.turno-banner-right {
  display: flex;
  gap: 8px;
}

.turno-banner-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  flex: 1;
  padding: 0 20px;
}

.bienvenida-texto {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: #1d3b2a;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.85;
}

.bienvenida-nombre,.bienvenida-saludo {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 900;
  background: linear-gradient(135deg, #454e5e 0%, #454e5e 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
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
  flex-shrink: 0;
}

.search-bar input {
  border: none;
  outline: none;
  flex: 1;
  font-size: 0.96rem;
  background: transparent;
  color: #0a1f38;
}

.filtros-row {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.filtro-chip {
  padding: 9px 18px;
  border-radius: 999px;
  border: 1px solid rgba(10, 31, 56, 0.10);
  background: #ffffff;
  color: #123a66;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
}

.filtro-chip.active {
  background: #123a66;
  border-color: #123a66;
  color: #f5f9fc;
}

/* ── Área de servicios ── */
.servicios-area {
  flex: 1;
  min-height: 200px;
}

.estado-vacio {
  text-align: center;
  color: #6d829c;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 200px;
}

.estado-vacio-icon {
  font-size: 52px;
  color: #a9c3d8;
  margin-bottom: 10px;
}

.estado-vacio-titulo {
  font-weight: 800;
  color: #0a1f38;
  margin: 0 0 4px;
  font-size: 1.15rem;
}

.estado-vacio-texto {
  margin: 0;
  font-size: 0.95rem;
}

.estado-vacio-texto a {
  color: #123a66;
  font-weight: 700;
  text-decoration: underline;
}

/* ── Servicios agrupados por categoría ── */
.servicios-por-categoria {
  display: flex;
  flex-direction: column;
  gap: 22px;
  width: 100%;
}

.grupo-servicios-header {
  display: flex;
  align-items: center;
  text-align: center;
  gap: 8px;
  margin-bottom: 10px;
}

.grupo-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}

.grupo-servicios-header h3 {
  margin: 0;
  font-size: 1.4rem;
  color: #0a1f38;
}

.servicios-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 14px;
  width: 100%;
}

/* ── Tarjeta de servicio ── */
.servicio-card {
  position: relative;
  background: #ffffff;
  border-left: 9px solid #123a66;
  border: 1px solid rgba(10, 31, 56, 0.08);
  border-radius: 16px;
  padding: 22px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
  cursor: pointer;
  transition: box-shadow 0.15s ease, transform 0.15s ease, border-color 0.15s ease;
  box-shadow: 0 4px 12px rgba(10, 31, 56, 0.08);
}

.servicio-card:hover {
  /* Sombra más pronunciada al hacer hover */
  box-shadow: 0 8px 24px rgba(10, 31, 56, 0.15);
  transform: translateY(-2px);
}

.servicio-card.en-carrito {
  border-color: #16a34a;
  /* Mantiene la sombra inferior combinada con el contorno verde */
  box-shadow: 0 4px 12px rgba(10, 31, 56, 0.08), 0 0 0 2px rgba(22, 163, 74, 0.3);
}

.servicio-card-check {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #16a34a;
  color: #ffffff;
  font-size: 13px;
  display: grid;
  place-items: center;
}

.servicio-card-icono {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: rgba(10, 31, 56, 0.05);
  color: #4a627e;
  display: grid;
  place-items: center;
  font-size: 26px;
  margin-bottom: 6px;
  overflow: hidden;
}

.servicio-card-icono-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.servicio-card-nombre {
  color: #0a1f38;
  font-size: 1rem;
  font-weight: 700;
}

.servicio-card-precio {
  color: #16a34a;
  font-weight: 800;
  font-size: 1.15rem;
}

.servicio-card-unidad {
  margin-top: 4px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(10, 31, 56, 0.06);
  color: #6d829c;
  font-size: 0.8rem;
  font-weight: 600;
}

/* ── Botones ── */
.btn-primario {
  --background: #123a66;
  --background-hover: #0d2b4e;
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

.btn-advertencia {
  --background: #d97706;
  --background-hover: #b96305;
  --color: #ffffff;
  --border-radius: 12px;
  font-weight: 700;
}

/* ── Modal turno ── */
.modal-turno {
  --width: 420px;
  --height: auto;
  --border-radius: 20px;
}

.modal-contenido {
  background: #ffffff;
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.modal-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-header-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: rgba(18, 58, 102, 0.08);
  color: #123a66;
  display: grid;
  place-items: center;
  font-size: 22px;
}

.modal-titulo {
  margin: 0;
  font-weight: 800;
  color: #0a1f38;
  font-size: 1.1rem;
}

.modal-subtitulo {
  margin: 0;
  font-size: 0.88rem;
  color: #6d829c;
}

.modal-cerrar {
  border: none;
  background: none;
  color: #9fb4c9;
  font-size: 22px;
  cursor: pointer;
}

.modal-label {
  font-size: 0.8rem;
  font-weight: 800;
  color: #4a627e;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.modal-input-monto {
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1.5px solid #a9d8ee;
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 1rem;
  font-weight: 700;
  color: #0a1f38;
}

.modal-input-monto input {
  border: none;
  outline: none;
  flex: 1;
  font-size: 1.05rem;
  font-weight: 700;
}

.modal-textarea {
  width: 100%;
  min-height: 70px;
  border-radius: 12px;
  border: 1px solid rgba(10, 31, 56, 0.14);
  padding: 10px 12px;
  font-size: 0.95rem;
  color: #0a1f38;
  resize: none;
  font-family: inherit;
}

.modal-botones {
  display: flex;
  gap: 10px;
  margin-top: 6px;
}

.modal-botones ion-button {
  flex: 1;
}

.hint-texto {
  margin: 0;
  font-size: 0.8rem;
  color: #7c8fa6;
}

.detalle-seccion {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(10, 31, 56, 0.1);
}

.detalle-seccion:last-of-type {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.detalle-label {
  margin: 0 0 12px 0;
  font-weight: 800;
  color: #0a1f38;
  font-size: 0.95rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.detalle-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 0.95rem;
  color: #0a1f38;
}

.detalle-clave {
  font-weight: 600;
  color: #4a627e;
}

.detalle-valor {
  font-weight: 700;
  color: #0a1f38;
  text-align: right;
}

.detalle-notas {
  margin: 0;
  padding: 12px;
  background: rgba(10, 31, 56, 0.05);
  border-radius: 10px;
  font-size: 0.95rem;
  color: #0a1f38;
  line-height: 1.5;
}
</style>
