<template>
  <AppShell>
    <div class="respaldo-page">
      <header class="page-header">
        <button class="volver-btn" type="button" title="Volver a configuración" @click="volver">
          <ion-icon :icon="arrowBackOutline" />
        </button>
        <div class="header-mark"><ion-icon :icon="cloudDownloadOutline" /></div>
        <div>
          <p class="eyebrow">Seguridad de datos</p>
          <h2>Respaldo</h2>
          <p>Exporta las tablas seleccionadas en un archivo SQL.</p>
        </div>
      </header>

      <section class="respaldo-card">
        <div v-if="!esElectron" class="estado error">
          Los respaldos de tablas solo están disponibles en la aplicación de escritorio.
        </div>
        <template v-else>
        <div class="card-heading">
          <div>
            <h3>Tablas de la base de datos</h3>
            <p v-if="directorio" class="destino"><span class="destino-dot"></span>Destino: <strong>{{ directorio }}</strong></p>
          </div>
          <span class="card-icon"><ion-icon :icon="cloudDownloadOutline" /></span>
        </div>

        <div v-if="cargando" class="estado">Cargando tablas...</div>
        <div v-else-if="tablas.length === 0" class="estado error">No se encontraron tablas disponibles.</div>
        <template v-else>
          <div class="seleccion-row">
            <label class="check-item check-todas">
              <input v-model="todasSeleccionadas" type="checkbox" />
              <span>Seleccionar todas</span>
            </label>
            <span class="contador">{{ seleccionadas.length }} de {{ tablas.length }}</span>
          </div>
          <div class="tablas-lista">
            <label v-for="tabla in tablas" :key="tabla" class="check-item">
              <input v-model="seleccionadas" type="checkbox" :value="tabla" />
              <span class="table-name"><span class="table-symbol">DB</span>{{ nombreVisibleTabla(tabla) }}</span>
            </label>
          </div>
        </template>

        <p v-if="mensaje" class="mensaje" :class="{ error: hayError }" role="status">{{ mensaje }}</p>
        <div class="acciones">
          <button class="btn-secundario" type="button" :disabled="cargando" @click="volver">Cancelar</button>
          <button v-if="ultimoRespaldo" class="btn-secundario" type="button" @click="abrirCarpeta">
            <ion-icon :icon="folderOpenOutline" /> Abrir carpeta
          </button>
          <button class="btn-primario" type="button" :disabled="cargando || seleccionadas.length === 0" @click="crearRespaldo">
            <ion-icon :icon="downloadOutline" />
            {{ generando ? 'Exportando...' : 'Crear respaldo' }}
          </button>
        </div>
        </template>
      </section>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { IonIcon } from '@ionic/vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import { API_LOCAL_URL } from '@/composables/useApiConfig'
import { arrowBackOutline, cloudDownloadOutline, downloadOutline, folderOpenOutline } from 'ionicons/icons'

const router = useRouter()
const esElectron = typeof window !== 'undefined' && typeof (window as Window & {
  electronAPI?: { detectarNavegadores?: () => unknown }
}).electronAPI?.detectarNavegadores === 'function'
const tablas = ref<string[]>([])
const seleccionadas = ref<string[]>([])
const directorio = ref('')
const mensaje = ref('')
const hayError = ref(false)
const cargando = ref(true)
const generando = ref(false)
const ultimoRespaldo = ref(false)

const nombresTablas: Record<string, string> = {
  usuarios: 'Usuarios',
  empleados: 'Empleados',
  clientes: 'Clientes',
  ordenes: 'Órdenes',
  orden_movimientos: 'Movimientos de órdenes',
  productos: 'Productos',
  catalogo: 'Catálogo',
  inventario: 'Inventario',
  tareas: 'Tareas',
  promociones: 'Promociones',
  horarios: 'Horarios',
  turnos: 'Turnos',
  movimientos_caja: 'Movimientos de caja',
  cierres_caja: 'Cierres de caja'
}

const nombreVisibleTabla = (tabla: string) => nombresTablas[tabla] ?? tabla
  .split('_').map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1)).join(' ')

const todasSeleccionadas = computed({
  get: () => tablas.value.length > 0 && seleccionadas.value.length === tablas.value.length,
  set: (seleccionar: boolean) => { seleccionadas.value = seleccionar ? [...tablas.value] : [] }
})

const cargarTablas = async () => {
  if (!esElectron) {
    cargando.value = false
    return
  }

  try {
    const respuesta = await fetch(`${API_LOCAL_URL}/backups/tables`)
    const resultado = await respuesta.json()
    if (!respuesta.ok) throw new Error(resultado.message)
    tablas.value = resultado.tablas
    directorio.value = resultado.directorio
  } catch (e) {
    hayError.value = true
    mensaje.value = e instanceof Error ? e.message : 'No se pudieron cargar las tablas.'
  } finally { cargando.value = false }
}

const crearRespaldo = async () => {
  if (!esElectron) return

  generando.value = true
  mensaje.value = ''
  hayError.value = false
  try {
    const respuesta = await fetch(`${API_LOCAL_URL}/backups`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tablas: seleccionadas.value })
    })
    const resultado = await respuesta.json()
    if (!respuesta.ok) throw new Error(resultado.message)
    mensaje.value = `Respaldo creado: ${resultado.nombre}`
    ultimoRespaldo.value = true
  } catch (e) {
    hayError.value = true
    mensaje.value = e instanceof Error ? e.message : 'No se pudo crear el respaldo.'
  } finally { generando.value = false }
}

const abrirCarpeta = async () => {
  const api = (window as Window & { electronAPI?: { abrirCarpetaRespaldo: () => Promise<void> } }).electronAPI
  if (!api) return

  try {
    await api.abrirCarpetaRespaldo()
  } catch (e) {
    hayError.value = true
    mensaje.value = e instanceof Error ? e.message : 'No se pudo abrir la carpeta.'
  }
}

const volver = () => void router.replace('/tabs/configuracion')
onMounted(cargarTablas)
</script>

<style scoped>
.respaldo-page { --ink: #102a43; --muted: #6d829c; --teal: #168b83; display: grid; gap: 26px; min-height: 100%; padding: 8px 0 96px; color: var(--ink); }
.page-header { display: flex; align-items: center; gap: 14px; padding: 8px 2px 2px; }
.volver-btn { display: grid; place-items: center; width: 40px; height: 40px; border: 1px solid rgba(10,31,56,.12); border-radius: 11px; background: rgba(255,255,255,.82); color: #123a66; font-size: 20px; cursor: pointer; transition: transform .2s ease, background .2s ease; }
.volver-btn:hover { transform: translateX(-3px); background: #fff; }
.header-mark { display: grid; place-items: center; width: 58px; height: 58px; border-radius: 18px; background: linear-gradient(145deg, #168b83, #123a66); color: #fff; font-size: 29px; box-shadow: 0 12px 24px rgba(18,58,102,.18); }
.eyebrow { margin: 0 0 5px; color: var(--teal); font-size: .72rem; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; }
h2, h3, p { margin-top: 0; } h2 { margin-bottom: 6px; color: var(--ink); font-size: 1.75rem; font-weight: 900; } .page-header p:last-child, .card-heading p { margin-bottom: 0; color: var(--muted); }
.respaldo-card { display: grid; width: min(100%, 780px); box-sizing: border-box; gap: 22px; margin-inline: auto; padding: 26px; border: 1px solid rgba(10,31,56,.09); border-radius: 20px; background: rgba(255,255,255,.94); box-shadow: 0 16px 34px rgba(10,31,56,.09); }
.card-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; } h3 { margin-bottom: 7px; color: var(--ink); font-size: 1.16rem; font-weight: 900; } .card-icon { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 13px; background: #e7f5f3; color: var(--teal); font-size: 24px; }
.destino { display: flex; align-items: center; gap: 7px; font-size: .8rem; } .destino strong { max-width: 510px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 700; } .destino-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--teal); box-shadow: 0 0 0 4px #e7f5f3; }
.seleccion-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 12px; border: 1px solid rgba(22,139,131,.15); border-radius: 12px; background: #f4fbfa; } .contador { color: var(--teal); font-size: .8rem; font-weight: 900; }
.tablas-lista { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px 12px; max-height: 360px; padding-right: 4px; overflow-y: auto; } .check-item { display: flex; align-items: center; gap: 10px; min-width: 0; padding: 11px 12px; border: 1px solid transparent; border-radius: 11px; color: #405a73; font-size: .9rem; cursor: pointer; transition: border-color .18s ease, background .18s ease, transform .18s ease; } .check-item:hover { transform: translateY(-1px); border-color: rgba(22,139,131,.2); background: #f7fbfb; } .check-item input { width: 17px; height: 17px; margin: 0; accent-color: var(--teal); flex-shrink: 0; } .check-item span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .check-todas { padding-left: 0; color: #123a66; font-weight: 900; } .table-name { display: flex; align-items: center; gap: 9px; } .table-symbol { display: inline-grid; place-items: center; width: 25px; height: 21px; border-radius: 5px; background: #eaf3f8; color: #35627f; font-size: .58rem; font-weight: 900; letter-spacing: .03em; }
.estado, .mensaje { margin: 0; color: var(--muted); font-weight: 700; } .error { color: #c0392b; }
.acciones { display: flex; justify-content: flex-end; gap: 10px; flex-wrap: wrap; padding-top: 4px; border-top: 1px solid rgba(10,31,56,.08); } .acciones button { display: inline-flex; align-items: center; gap: 8px; padding: 11px 16px; border-radius: 10px; border: 1px solid transparent; font-weight: 900; cursor: pointer; transition: transform .18s ease, box-shadow .18s ease; } .acciones button:hover:not(:disabled) { transform: translateY(-2px); } button:disabled { opacity: .6; cursor: wait; } .btn-secundario { border-color: rgba(18,58,102,.18) !important; background: #fff; color: #123a66; } .btn-primario { background: #123a66; color: #fff; box-shadow: 0 8px 16px rgba(18,58,102,.18); }
@media (max-width: 560px) { .respaldo-page { padding-top: 2px; } .header-mark { width: 50px; height: 50px; font-size: 24px; } .respaldo-card { padding: 18px; } .tablas-lista { grid-template-columns: 1fr; } .destino strong { max-width: 180px; } .acciones button { flex: 1; justify-content: center; } }
</style>
