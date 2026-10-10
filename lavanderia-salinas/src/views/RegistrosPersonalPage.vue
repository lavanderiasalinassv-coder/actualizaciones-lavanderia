<template>
  <AppShell>
    <main class="registros-personal-page force-light">
      <header class="page-heading">
        <div>
          <p class="eyebrow">Equipo</p>
          <h2>Registros de personal</h2>
          <p class="page-description">Ingresos, desconexiones y actividad en órdenes.</p>
        </div>
        <button class="refresh-button" type="button" :disabled="cargando" @click="cargarRegistros">
          <ion-icon :icon="refreshOutline" /> {{ cargando ? 'Actualizando…' : 'Actualizar' }}
        </button>
      </header>

      <section class="resumen-grid" aria-label="Resumen de actividad">
        <article class="resumen-card"><span>Sesiones activas</span><strong>{{ sesionesActivas }}</strong><small>Sin desconexión registrada</small></article>
        <article class="resumen-card"><span>Ingresos</span><strong>{{ sesiones.conteos.ingreso }}</strong><small>Ingresos registrados</small></article>
        <article class="resumen-card"><span>Órdenes eliminadas</span><strong>{{ ordenes.total }}</strong><small>El historial conserva los datos originales</small></article>
        <article class="resumen-card"><span>Personal registrado</span><strong>{{ sesiones.total }}</strong><small>Ingresos y desconexiones</small></article>
      </section>

      <section class="columnas-historial">
        <article class="historial-card">
          <header class="columna-heading"><div><h3>Ingresos y salidas</h3><p>Duración de cada sesión, incluyendo las que siguen activas.</p></div></header>
          <div class="filtros-registros">
            <label>Desde<input v-model="sesiones.desde" type="date" /></label><label>Hasta<input v-model="sesiones.hasta" type="date" /></label>
            <label>Usuario<select v-model="sesiones.usuario"><option value="todos">Todos</option><option v-for="n in usuariosSesion" :key="n" :value="n">{{ n }}</option></select></label>
            <label>Actividad<select v-model="sesiones.tipo"><option value="todos">Todas</option><option value="ingreso">Ingreso</option><option value="desconexion">Desconexión</option></select></label>
          </div>
          <p v-if="sesiones.error" class="error-message">{{ sesiones.error }}</p><div v-if="sesiones.cargando && !sesiones.registros.length" class="estado-vacio">Cargando…</div><div v-else-if="!sesiones.total" class="estado-vacio">No hay sesiones con estos filtros.</div>
          <div v-else class="tabla-scroll tabla-sesiones-scroll"><table class="tabla-sesiones"><thead><tr><th>Evento</th><th>Usuario</th><th>Duración</th><th>Fecha y hora</th></tr></thead><tbody><tr v-for="r in sesiones.registros" :key="r.id"><td><span class="actividad-chip" :class="'tipo-' + r.tipo"><ion-icon :icon="iconoActividad(r.tipo)" />{{ etiquetaActividad(r.tipo) }}</span></td><td><strong>{{ r.usuarioNombre }}</strong><small v-if="r.usuarioRol">{{ r.usuarioRol }}</small></td><td class="fecha-celda">{{ duracionSesion(r) }}</td><td class="fecha-celda">{{ formatearFecha(r.fecha) }}</td></tr></tbody></table></div>
          <footer v-if="sesiones.total" class="tabla-footer"><span>{{ rango(sesiones) }} de {{ sesiones.total }}</span><nav class="paginacion-registros"><button :disabled="sesiones.pagina===1" @click="sesiones.pagina--">Anterior</button><span>{{ sesiones.pagina }} / {{ sesiones.totalPaginas }}</span><button :disabled="sesiones.pagina===sesiones.totalPaginas" @click="sesiones.pagina++">Siguiente</button></nav></footer>
        </article>
        <article class="historial-card">
          <header class="columna-heading"><div><h3>Órdenes eliminadas</h3><p>Se conserva una copia de la información al momento de eliminarlas.</p></div></header>
          <div class="filtros-registros">
            <label>Desde<input v-model="ordenes.desde" type="date" /></label><label>Hasta<input v-model="ordenes.hasta" type="date" /></label>
            <label>Usuario<select v-model="ordenes.usuario"><option value="todos">Todos</option><option v-for="n in usuariosOrdenes" :key="n" :value="n">{{ n }}</option></select></label>
            <label>Actividad<select v-model="ordenes.tipo"><option value="todos">Todas</option><option value="orden_eliminada">Eliminada</option></select></label>
          </div>
          <p v-if="ordenes.error" class="error-message">{{ ordenes.error }}</p><div v-if="ordenes.cargando && !ordenes.registros.length" class="estado-vacio">Cargando…</div><div v-else-if="!ordenes.total" class="estado-vacio">No hay movimientos con estos filtros.</div>
          <div v-else class="tabla-scroll"><table><thead><tr><th>Orden eliminada</th><th>Eliminada por</th><th>Fecha y hora</th></tr></thead><tbody><tr v-for="r in ordenes.registros" :key="r.numeroOrden" class="orden-resumen-row" @click="abrirHistorialOrden(r.numeroOrden || '')"><td><button class="orden-link" type="button" @click.stop="abrirHistorialOrden(r.numeroOrden || '')">#{{ r.numeroOrden }}<small>Ver datos guardados</small></button></td><td>{{ r.ultimoUsuario || '—' }}</td><td class="fecha-celda">{{ formatearFecha(r.fecha) }}</td></tr></tbody></table></div>
          <footer v-if="ordenes.total" class="tabla-footer"><span>{{ rango(ordenes) }} de {{ ordenes.total }}</span><nav class="paginacion-registros"><button :disabled="ordenes.pagina===1" @click="ordenes.pagina--">Anterior</button><span>{{ ordenes.pagina }} / {{ ordenes.totalPaginas }}</span><button :disabled="ordenes.pagina===ordenes.totalPaginas" @click="ordenes.pagina++">Siguiente</button></nav></footer>
        </article>
      </section>
      <div v-if="ordenSeleccionada" class="modal-backdrop" @click.self="cerrarHistorialOrden" @keydown.esc="cerrarHistorialOrden">
        <section class="historial-modal" role="dialog" aria-modal="true" :aria-label="'Historial de orden #' + ordenSeleccionada">
          <header class="modal-heading"><div><p class="eyebrow">Historial completo</p><h3>Orden #{{ ordenSeleccionada }}</h3></div><button class="modal-close" type="button" aria-label="Cerrar" @click="cerrarHistorialOrden">×</button></header>
          <p v-if="errorHistorialOrden" class="error-message">{{ errorHistorialOrden }}</p><div v-else-if="cargandoHistorialOrden" class="estado-vacio">Cargando historial…</div><div v-else-if="!historialOrden.length" class="estado-vacio">No hay movimientos para esta orden.</div>
          <div v-else class="modal-timeline"><article v-for="r in historialOrden" :key="r.id" class="historial-evento"><span class="actividad-chip tipo-orden_eliminada"><ion-icon :icon="trashOutline" />Eliminada</span><div class="evento-detalle"><strong>{{ r.usuarioNombre }}</strong><p>{{ r.detalle }}</p><time>{{ formatearFecha(r.fecha) }}</time><pre v-if="r.ordenEliminada" class="orden-original">{{ formatoOrden(r.ordenEliminada) }}</pre></div></article></div>
        </section>
      </div>
    </main>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, onUnmounted, reactive, ref, watch } from 'vue'
import { IonIcon, onIonViewWillEnter } from '@ionic/vue'
import { addCircleOutline, createOutline, logInOutline, logOutOutline, refreshOutline, trashOutline } from 'ionicons/icons'
import AppShell from '@/components/AppShell.vue'
import { getApiBaseUrl } from '@/composables/useApiConfig'
type TipoRegistro = 'ingreso' | 'desconexion' | 'orden_creada' | 'orden_modificada' | 'orden_eliminada'
interface RegistroPersonal { id:string; sessionId?:string; usuarioId:string; usuarioNombre:string; usuarioRol?:string; tipo:TipoRegistro; fecha:string; detalle:string; numeroOrden?:string; ordenEliminada?:Record<string, unknown>|string|null; cantidadMovimientos?:number; ultimoUsuario?:string; duracionSegundos?:number|null; sesionActiva?:number|boolean }
const crearGrupo = () => reactive({ registros:[] as RegistroPersonal[], pagina:1, totalPaginas:1, total:0, conteos:{ingreso:0,orden_creada:0,orden_modificada:0,orden_eliminada:0}, cargando:false, error:'', desde:'', hasta:'', usuario:'todos', tipo:'todos' })
const sesiones=crearGrupo(); const ordenes=crearGrupo(); const cargando=computed(()=>sesiones.cargando||ordenes.cargando); const ordenSeleccionada=ref(''); const historialOrden=ref<RegistroPersonal[]>([]); const cargandoHistorialOrden=ref(false); const errorHistorialOrden=ref(''); const usuariosSesion=ref<string[]>([]); const usuariosOrdenes=ref<string[]>([]); const sesionesActivas=ref(0); const ahora=ref(Date.now()); let solicitudSesiones=0; let solicitudOrdenes=0
const cargarGrupo=async(grupo:'sesiones'|'ordenes', estado:ReturnType<typeof crearGrupo>)=>{const n=grupo==='sesiones'?++solicitudSesiones:++solicitudOrdenes; estado.cargando=true; estado.error=''; try{const params=new URLSearchParams({grupo,pagina:String(estado.pagina),desde:estado.desde,hasta:estado.hasta,usuario:estado.usuario,tipo:estado.tipo});const res=await fetch(getApiBaseUrl()+'/registros-personal?'+params,{signal:AbortSignal.timeout(60000)});const data=await res.json().catch(()=>null);if(!res.ok)throw new Error(data?.error||'No se pudieron cargar los registros.');if((grupo==='sesiones'?solicitudSesiones:solicitudOrdenes)===n){estado.registros=Array.isArray(data?.registros)?data.registros:[];estado.total=Number(data?.total)||0;estado.pagina=Number(data?.pagina)||1;estado.totalPaginas=Math.max(1,Number(data?.totalPaginas)||1);estado.conteos=data?.conteos||estado.conteos;if(grupo==='sesiones'){usuariosSesion.value=data?.usuarios||[];sesionesActivas.value=Number(data?.sesionesActivas)||0}else usuariosOrdenes.value=data?.usuarios||[]}}catch(e){if((grupo==='sesiones'?solicitudSesiones:solicitudOrdenes)===n)estado.error=e instanceof Error?e.message:'No se pudieron cargar los registros.'}finally{if((grupo==='sesiones'?solicitudSesiones:solicitudOrdenes)===n)estado.cargando=false}}
const abrirHistorialOrden=async(numero:string)=>{if(!numero)return;ordenSeleccionada.value=numero;historialOrden.value=[];errorHistorialOrden.value='';cargandoHistorialOrden.value=true;try{const params=new URLSearchParams({grupo:'ordenes',numeroOrden:numero});const res=await fetch(getApiBaseUrl()+'/registros-personal?'+params,{signal:AbortSignal.timeout(60000)});const data=await res.json().catch(()=>null);if(!res.ok)throw new Error(data?.error||'No se pudo cargar el historial de la orden.');if(ordenSeleccionada.value===numero)historialOrden.value=Array.isArray(data?.registros)?data.registros:[]}catch(e){if(ordenSeleccionada.value===numero)errorHistorialOrden.value=e instanceof Error?e.message:'No se pudo cargar el historial de la orden.'}finally{if(ordenSeleccionada.value===numero)cargandoHistorialOrden.value=false}}
const cerrarHistorialOrden=()=>{ordenSeleccionada.value='';historialOrden.value=[]}
const formatoOrden=(valor:RegistroPersonal['ordenEliminada'])=>{if(!valor)return '';try{return JSON.stringify(typeof valor==='string'?JSON.parse(valor):valor,null,2)}catch{return String(valor)}}
const cargarSesiones=()=>void cargarGrupo('sesiones',sesiones); const cargarOrdenes=()=>void cargarGrupo('ordenes',ordenes); const cargarRegistros=()=>{cargarSesiones();cargarOrdenes()}; onIonViewWillEnter(cargarRegistros)
watch(()=>[sesiones.desde,sesiones.hasta,sesiones.usuario,sesiones.tipo],()=>{if(sesiones.pagina!==1)sesiones.pagina=1;else cargarSesiones()});watch(()=>[ordenes.desde,ordenes.hasta,ordenes.usuario,ordenes.tipo],()=>{if(ordenes.pagina!==1)ordenes.pagina=1;else cargarOrdenes()});watch(()=>sesiones.pagina,cargarSesiones);watch(()=>ordenes.pagina,cargarOrdenes)
const timer=setInterval(()=>{ahora.value=Date.now()},1000);onUnmounted(()=>clearInterval(timer)); const rango=(g:ReturnType<typeof crearGrupo>)=>g.total?((g.pagina-1)*50+1)+'–'+Math.min(g.pagina*50,g.total):'0'
const duracionSesion=(r:RegistroPersonal)=>{let segundos=Number(r.duracionSegundos)||0;if(r.tipo==='ingreso'&&Boolean(r.sesionActiva))segundos=Math.max(0,Math.floor((ahora.value-new Date(r.fecha).getTime())/1000));const h=Math.floor(segundos/3600),m=Math.floor((segundos%3600)/60),s=segundos%60;return h+' h '+String(m).padStart(2,'0')+' min '+String(s).padStart(2,'0')+' s'}
const iconoActividad=(tipo:TipoRegistro)=>({ingreso:logInOutline,desconexion:logOutOutline,orden_creada:addCircleOutline,orden_modificada:createOutline,orden_eliminada:trashOutline})[tipo];const etiquetaActividad=(tipo:TipoRegistro)=>({ingreso:'Ingreso',desconexion:'Desconexión',orden_creada:'Orden creada',orden_modificada:'Orden modificada',orden_eliminada:'Orden eliminada'})[tipo]
const formatearFecha=(valor:string)=>{const fecha=new Date(valor);return Number.isNaN(fecha.getTime())?'—':new Intl.DateTimeFormat('es-SV',{timeZone:'America/El_Salvador',dateStyle:'medium',timeStyle:'short'}).format(fecha)}
</script>

<style scoped>
.registros-personal-page { min-height: 100%; padding: 24px clamp(16px, 3vw, 36px) 34px; color: #102a43; }
.page-heading { display:flex; justify-content:space-between; align-items:center; gap:18px; margin-bottom:22px; }
.eyebrow { margin:0 0 5px; color:#58738f; text-transform:uppercase; letter-spacing:.12em; font-size:.72rem; font-weight:800; }
h2 { margin:0; font-size:clamp(1.4rem,2vw,1.9rem); color:#123a66; }
.page-description { margin:6px 0 0; color:#60758c; }
.refresh-button,.limpiar-filtros { display:inline-flex; align-items:center; justify-content:center; gap:8px; border:1px solid rgba(18,58,102,.16); border-radius:12px; background:#fff; padding:10px 14px; color:#123a66; font-weight:700; cursor:pointer; }
.refresh-button:disabled { opacity:.65; cursor:wait; }
.resumen-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:14px; margin-bottom:18px; }
.resumen-card { display:flex; flex-direction:column; gap:5px; padding:17px 18px; border:1px solid rgba(18,58,102,.1); border-radius:16px; background:linear-gradient(145deg,#fff,#f6faff); box-shadow:0 7px 22px rgba(12,43,74,.055); }
.resumen-card span { color:#5d7288; font-size:.84rem; font-weight:700; }
.resumen-card strong { color:#123a66; font-size:1.8rem; line-height:1.1; }
.resumen-card small { color:#8292a3; }
.orden-resumen-row { cursor:pointer; }
.orden-resumen-row:hover { background:#f4f8fc; }
.orden-link { border:0; background:transparent; color:#1c5c99; font:inherit; font-weight:800; text-align:left; cursor:pointer; }
.orden-link small { display:block; margin-top:4px; color:#718398; font-size:.72rem; font-weight:600; }
.modal-backdrop { position:fixed; inset:0; z-index:10000; display:grid; place-items:center; padding:20px; background:rgba(11,29,48,.55); backdrop-filter:blur(3px); }
.historial-modal { width:min(720px,100%); max-height:min(82vh,850px); overflow:auto; border:1px solid #dce5ed; border-radius:18px; background:#fff; box-shadow:0 24px 80px rgba(5,25,45,.3); }
.modal-heading { position:sticky; top:0; z-index:1; display:flex; justify-content:space-between; align-items:center; padding:18px 22px; border-bottom:1px solid #e8eef4; background:#fff; }
.modal-heading h3 { margin:0; color:#123a66; font-size:1.35rem; }
.modal-heading .eyebrow { margin-bottom:4px; }
.modal-close { width:38px; height:38px; border:0; border-radius:50%; background:#f1f5f8; color:#34516b; font-size:1.7rem; cursor:pointer; }
.modal-timeline { display:flex; flex-direction:column; padding:6px 22px 22px; }
.historial-evento { display:grid; grid-template-columns:155px 1fr; gap:15px; padding:16px 0; border-bottom:1px solid #edf1f5; }
.evento-detalle strong { color:#294a66; font-size:.85rem; }
.evento-detalle p { margin:5px 0; color:#3c5369; font-size:.88rem; }
.evento-detalle time { color:#8797a7; font-size:.75rem; }
.columnas-historial { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1.3fr); align-items:start; gap:16px; }
.columna-heading { padding:18px 16px 4px; }
.columna-heading h3 { margin:0; color:#123a66; font-size:1.05rem; }
.columna-heading p { margin:5px 0 0; color:#70849a; font-size:.8rem; }
.historial-card { overflow:hidden; border:1px solid rgba(18,58,102,.12); border-radius:18px; background:#fff; box-shadow:0 8px 26px rgba(12,43,74,.06); }
.filtros-registros { display:flex; flex-wrap:wrap; align-items:end; gap:12px; padding:16px; border-bottom:1px solid #e8eef4; background:#f8fbfe; }
.filtros-registros label { display:flex; flex-direction:column; gap:5px; color:#587089; font-size:.75rem; font-weight:800; }
.filtros-registros input,.filtros-registros select { min-height:38px; min-width:150px; border:1px solid #d5e0ea; border-radius:9px; background:#fff; padding:7px 9px; color:#183b5b; font:inherit; }
.limpiar-filtros { min-height:38px; padding:8px 11px; font-size:.8rem; }
.tabla-scroll { overflow:auto; }
.tabla-sesiones-scroll { overflow-x:hidden; }
.tabla-sesiones { width:100%; min-width:0; table-layout:fixed; }
.tabla-sesiones th, .tabla-sesiones td { padding:10px 7px; font-size:.76rem; overflow-wrap:anywhere; }
.tabla-sesiones th:nth-child(1) { width:27%; }
.tabla-sesiones th:nth-child(2) { width:22%; }
.tabla-sesiones th:nth-child(3) { width:23%; }
.tabla-sesiones th:nth-child(4) { width:28%; }
.tabla-sesiones .actividad-chip { max-width:100%; padding:5px 6px; gap:4px; white-space:normal; line-height:1.2; }
.tabla-sesiones .fecha-celda { white-space:normal; font-variant-numeric:tabular-nums; }
table { width:100%; border-collapse:collapse; min-width:800px; }
th { padding:12px 14px; background:#f4f8fb; color:#61768b; font-size:.72rem; letter-spacing:.04em; text-align:left; text-transform:uppercase; }
td { padding:13px 14px; border-top:1px solid #edf1f5; color:#304a62; font-size:.87rem; vertical-align:middle; }
td small { display:block; margin-top:3px; color:#8392a1; text-transform:capitalize; }
.actividad-chip { display:inline-flex; align-items:center; gap:6px; padding:6px 9px; border-radius:999px; background:#f0f5fa; color:#365570; font-size:.76rem; font-weight:800; white-space:nowrap; }
.actividad-chip ion-icon { font-size:15px; }
.tipo-ingreso { background:#e9f7ef; color:#167447; }
.tipo-desconexion { background:#fff2e8; color:#a55416; }
.tipo-orden_creada { background:#eaf2ff; color:#2859a4; }
.tipo-orden_modificada { background:#f1edff; color:#6745a3; }
.detalle-celda { max-width:390px; }
.fecha-celda { white-space:nowrap; font-variant-numeric:tabular-nums; }
.estado-vacio { padding:40px 18px; color:#75889a; text-align:center; }
.error-message { margin:16px; padding:12px 14px; border-radius:10px; background:#fff1f1; color:#ad3434; }
.tabla-footer { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; padding:12px 16px; border-top:1px solid #edf1f5; color:#718398; font-size:.78rem; }
.paginacion-registros { display:flex; align-items:center; gap:10px; }
.paginacion-registros button { border:1px solid #d6e0e9; border-radius:8px; padding:7px 10px; background:#fff; color:#123a66; font:inherit; font-weight:700; cursor:pointer; }
.paginacion-registros button:disabled { opacity:.45; cursor:not-allowed; }
@media(max-width:1050px) { .columnas-historial { grid-template-columns:1fr; } }
@media(max-width:850px) { .resumen-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
@media(max-width:560px) { .registros-personal-page { padding:18px 12px 26px; } .page-heading { align-items:flex-start; } .refresh-button { padding:9px 10px; font-size:.78rem; } .resumen-grid { gap:9px; } .resumen-card { padding:13px; } .resumen-card strong { font-size:1.45rem; } .filtros-registros label { flex:1 1 calc(50% - 10px); } .filtros-registros input,.filtros-registros select { min-width:0; width:100%; } }
</style>
