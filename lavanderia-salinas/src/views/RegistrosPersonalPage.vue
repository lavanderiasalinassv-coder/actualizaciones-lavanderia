<template>
  <AppShell>
    <main class="registros-personal-page force-light">
      <header class="page-heading">
        <div class="page-heading-title">
          <button class="volver-ajustes" type="button" title="Volver a ajustes" aria-label="Volver a ajustes" @click="volverAjustes">
            <ion-icon :icon="arrowBackOutline" />
          </button>
          <div>
            <p class="eyebrow">Equipo</p>
            <h2>Registros de personal</h2>
            <p class="page-description">Ingresos, desconexiones y actividad en órdenes.</p>
          </div>
        </div>
        <button class="refresh-button" type="button" :disabled="cargando" @click="cargarRegistros">
          <ion-icon :icon="refreshOutline" /> {{ cargando ? 'Actualizando…' : 'Actualizar' }}
        </button>
      </header>

      <section class="resumen-grid" aria-label="Resumen de actividad">
        <article class="resumen-card"><span>Sesiones activas</span><strong>{{ sesionesActivas }}</strong><small>Sin desconexión registrada</small></article>
        <article class="resumen-card"><span>Sesiones iniciadas</span><strong>{{ sesiones.conteos.ingreso }}</strong><small>Conexiones registradas</small></article>
        <article class="resumen-card"><span>Órdenes eliminadas</span><strong>{{ ordenes.total }}</strong><small>El historial conserva los datos originales</small></article>
        <article class="resumen-card"><span>Sesiones registradas</span><strong>{{ sesiones.total }}</strong><small>Activas y terminadas</small></article>
      </section>

      <section class="columnas-historial">
        <article class="historial-card">
          <header class="columna-heading"><div><h3>Ingresos y salidas</h3><p>Duración de cada sesión, incluyendo las que siguen activas.</p></div></header>
          <div class="filtros-registros">
            <label>Desde<input v-model="sesiones.desde" type="date" /></label><label>Hasta<input v-model="sesiones.hasta" type="date" /></label>
            <label>Usuario<select v-model="sesiones.usuario"><option value="todos">Todos</option><option v-for="n in usuariosSesion" :key="n" :value="n">{{ n }}</option></select></label>
            <label>Estado<select v-model="sesiones.tipo"><option value="todos">Todas</option><option value="ingreso">En línea</option><option value="desconexion">Sesión terminada</option></select></label>
          </div>
          <p v-if="sesiones.error" class="error-message">{{ sesiones.error }}</p><div v-if="sesiones.cargando && !sesiones.registros.length" class="estado-vacio">Cargando…</div><div v-else-if="!sesiones.total" class="estado-vacio">No hay sesiones con estos filtros.</div>
          <div v-else class="sesiones-lista">
            <article v-for="r in sesiones.registros" :key="r.sessionId || r.id" class="sesion-card" :class="{ 'sesion-activa': Boolean(r.sesionActiva) }">
              <div class="sesion-card-principal">
                <div class="sesion-identidad">
                  <span class="sesion-avatar">
                    <img v-if="r.imagenPerfil" :src="r.imagenPerfil" :alt="`Foto de ${r.usuarioNombre}`" />
                    <ion-icon v-else :icon="personCircleOutline" />
                  </span>
                  <div class="sesion-usuario">
                    <strong>{{ r.usuarioNombre }}</strong>
                    <small v-if="r.usuarioRol">{{ r.usuarioRol }}</small>
                  </div>
                </div>
                <span class="sesion-estado" :class="{ activa: Boolean(r.sesionActiva) }">
                  <span class="sesion-estado-punto" />
                  {{ r.sesionActiva ? 'En línea' : 'Sesión terminada' }}
                </span>
              </div>
              <div class="sesion-card-detalles">
                <div class="sesion-hora">
                  <span>INICIO DE SESIÓN</span>
                  <strong>{{ formatearFecha(r.fecha) }}</strong>
                </div>
                <div v-if="!r.sesionActiva" class="sesion-hora">
                  <span>DESCONEXIÓN</span>
                  <strong>{{ formatearFecha(r.fechaDesconexion || '') }}</strong>
                </div>
                <div class="sesion-duracion" :class="{ cronometro: Boolean(r.sesionActiva) }">
                  <ion-icon :icon="r.sesionActiva ? logInOutline : logOutOutline" />
                  <div>
                    <span>{{ r.sesionActiva ? 'TIEMPO CONECTADO' : 'DURACIÓN DE SESIÓN' }}</span>
                    <strong>{{ duracionSesion(r) }}</strong>
                  </div>
                </div>
              </div>
              <p v-if="!r.sesionActiva && r.detalle" class="sesion-cierre">{{ r.detalle }}</p>
            </article>
          </div>
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
          <div v-else class="modal-timeline"><article v-for="r in historialOrden" :key="r.id" class="historial-evento"><span class="actividad-chip tipo-orden_eliminada"><ion-icon :icon="trashOutline" />Eliminada</span><div class="evento-detalle"><strong>{{ r.usuarioNombre }}</strong><p>{{ r.detalle }}</p><time>{{ formatearFecha(r.fecha) }}</time><p v-if="errorHistorialCajas && valorOrden(r.ordenEliminada, 'turno_id')" class="error-message">No se pudo consultar el número de caja: {{ errorHistorialCajas }}</p><section v-if="r.ordenEliminada" class="orden-original"><header class="orden-original-heading"><div><span>ORDEN ELIMINADA</span><h4>{{ valorOrden(r.ordenEliminada, 'nombre_cliente') || 'Datos originales de la orden' }}</h4><p v-if="valorOrden(r.ordenEliminada, 'secuencia')">Orden #{{ valorOrden(r.ordenEliminada, 'secuencia') }}</p></div><span v-if="valorOrden(r.ordenEliminada, 'estado')" class="orden-estado-chip">{{ formatearDatoOrden('estado', valorOrden(r.ordenEliminada, 'estado')) }}</span></header><div class="orden-original-secciones"><section v-for="grupo in seccionesOrden(r.ordenEliminada)" :key="grupo.titulo" class="orden-original-grupo"><h5>{{ grupo.titulo }}</h5><dl><div v-for="campo in grupo.campos" :key="campo.clave" class="orden-original-campo"><dt>{{ campo.etiqueta }}</dt><dd>{{ campo.valor }}</dd></div></dl></section></div></section></div></article></div>
        </section>
      </div>
    </main>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, onUnmounted, reactive, ref, watch } from 'vue'
import { IonIcon, onIonViewWillEnter } from '@ionic/vue'
import { useRouter } from 'vue-router'
import { addCircleOutline, arrowBackOutline, createOutline, logInOutline, logOutOutline, personCircleOutline, refreshOutline, trashOutline } from 'ionicons/icons'
import AppShell from '@/components/AppShell.vue'
import { getApiBaseUrl } from '@/composables/useApiConfig'
import { useHistorialCierres } from '@/composables/useHistorialCierres'
import { useTurno } from '@/composables/useTurno'
type TipoRegistro = 'ingreso' | 'desconexion' | 'orden_creada' | 'orden_modificada' | 'orden_eliminada'
interface RegistroPersonal { id:string; sessionId?:string; usuarioId:string; usuarioNombre:string; usuarioRol?:string; imagenPerfil?:string|null; tipo:TipoRegistro; fecha:string; fechaDesconexion?:string|null; detalle:string; numeroOrden?:string; ordenEliminada?:Record<string, unknown>|string|null; cantidadMovimientos?:number; ultimoUsuario?:string; duracionSegundos?:number|null; sesionActiva?:number|boolean }
interface CampoOrdenGuardada { clave:string; etiqueta:string; valor:string }
interface GrupoOrdenGuardada { titulo:string; campos:CampoOrdenGuardada[] }
const crearGrupo = () => reactive({ registros:[] as RegistroPersonal[], pagina:1, totalPaginas:1, total:0, conteos:{ingreso:0,orden_creada:0,orden_modificada:0,orden_eliminada:0}, cargando:false, error:'', desde:'', hasta:'', usuario:'todos', tipo:'todos' })
const sesiones=crearGrupo(); const ordenes=crearGrupo(); const cargando=computed(()=>sesiones.cargando||ordenes.cargando); const ordenSeleccionada=ref(''); const historialOrden=ref<RegistroPersonal[]>([]); const cargandoHistorialOrden=ref(false); const errorHistorialOrden=ref(''); const errorHistorialCajas=ref(''); const usuariosSesion=ref<string[]>([]); const usuariosOrdenes=ref<string[]>([]); const sesionesActivas=ref(0); const ahora=ref(Date.now()); const duracionActualizadaEn=ref(Date.now()); let solicitudSesiones=0; let solicitudOrdenes=0
const { historialCierres, cargarHistorial } = useHistorialCierres()
const { turno, cargarTurno } = useTurno()
const router = useRouter()
const volverAjustes = () => void router.replace('/tabs/configuracion')
const cargarGrupo=async(grupo:'sesiones'|'ordenes', estado:ReturnType<typeof crearGrupo>)=>{const n=grupo==='sesiones'?++solicitudSesiones:++solicitudOrdenes; estado.cargando=true; estado.error=''; try{const params=new URLSearchParams({grupo,pagina:String(estado.pagina),desde:estado.desde,hasta:estado.hasta,usuario:estado.usuario,tipo:estado.tipo});const res=await fetch(getApiBaseUrl()+'/registros-personal?'+params,{signal:AbortSignal.timeout(60000)});const data=await res.json().catch(()=>null);if(!res.ok)throw new Error(data?.error||'No se pudieron cargar los registros.');if((grupo==='sesiones'?solicitudSesiones:solicitudOrdenes)===n){estado.registros=Array.isArray(data?.registros)?data.registros:[];estado.total=Number(data?.total)||0;estado.pagina=Number(data?.pagina)||1;estado.totalPaginas=Math.max(1,Number(data?.totalPaginas)||1);estado.conteos=data?.conteos||estado.conteos;if(grupo==='sesiones'){usuariosSesion.value=data?.usuarios||[];sesionesActivas.value=Number(data?.sesionesActivas)||0}else usuariosOrdenes.value=data?.usuarios||[]}}catch(e){if((grupo==='sesiones'?solicitudSesiones:solicitudOrdenes)===n)estado.error=e instanceof Error?e.message:'No se pudieron cargar los registros.'}finally{if((grupo==='sesiones'?solicitudSesiones:solicitudOrdenes)===n)estado.cargando=false}}
const abrirHistorialOrden=async(numero:string)=>{if(!numero)return;ordenSeleccionada.value=numero;historialOrden.value=[];errorHistorialOrden.value='';cargandoHistorialOrden.value=true;try{const params=new URLSearchParams({grupo:'ordenes',numeroOrden:numero});const res=await fetch(getApiBaseUrl()+'/registros-personal?'+params,{signal:AbortSignal.timeout(60000)});const data=await res.json().catch(()=>null);if(!res.ok)throw new Error(data?.error||'No se pudo cargar el historial de la orden.');if(ordenSeleccionada.value===numero)historialOrden.value=Array.isArray(data?.registros)?data.registros:[]}catch(e){if(ordenSeleccionada.value===numero)errorHistorialOrden.value=e instanceof Error?e.message:'No se pudo cargar el historial de la orden.'}finally{if(ordenSeleccionada.value===numero)cargandoHistorialOrden.value=false}}
const cerrarHistorialOrden=()=>{ordenSeleccionada.value='';historialOrden.value=[]}
const numeroCajaTurno=(valor:unknown)=>{const turnoId=String(valor??'');if(!turnoId)return 'Sin turno asociado';const cierre=historialCierres.value.find((item)=>item.turnoId===turnoId&&item.numeroCaja>0);if(cierre)return `Caja #${cierre.numeroCaja}`;if(turno.id===turnoId&&turno.numeroCaja>0)return `Caja #${turno.numeroCaja}`;return 'Caja no disponible'}
const cargarReferenciasCaja=async()=>{errorHistorialCajas.value='';try{await Promise.all([cargarHistorial(),cargarTurno()])}catch(error){errorHistorialCajas.value=error instanceof Error?error.message:'No se pudo cargar el historial de cajas.'}}
const objetoOrden=(valor:RegistroPersonal['ordenEliminada']):Record<string,unknown>|null=>{if(!valor)return null;if(typeof valor==='object'&&!Array.isArray(valor))return valor;try{const parseado=JSON.parse(String(valor));return parseado&&typeof parseado==='object'&&!Array.isArray(parseado)?parseado:null}catch{return null}}
const valorOrden=(valor:RegistroPersonal['ordenEliminada'],clave:string)=>{const orden=objetoOrden(valor);return orden?.[clave]??null}
const etiquetasOrden:Record<string,string>={id:'Identificador',orden_id:'Identificador de orden',secuencia:'Número de orden',estado:'Estado',turno_id:'Caja',nombre_cliente:'Cliente',codigo_pais:'Código de país',telefono:'Teléfono',correo:'Correo electrónico',guardar_directorio:'Guardar en directorio',envio_domicilio:'Envío a domicilio',direccion_entrega:'Dirección de entrega',fecha_entrega_activa:'Fecha de entrega activa',mora_activa:'Mora activa',fecha_entrega:'Fecha de entrega',hora_entrega:'Hora de entrega',estado_pago:'Estado del pago',metodo_pago:'Método de pago',monto_recibido:'Monto recibido',descuento:'Descuento',descuento_manual:'Descuento manual',descuento_promocion:'Descuento de promoción',subtotal:'Subtotal',total:'Total',cambio:'Cambio',cantidad_prendas:'Cantidad de prendas',detalles_prendas:'Detalle de prendas',nota_interna:'Nota interna',motivo_cancelacion:'Motivo de cancelación',tarjeta_monto:'Pago con tarjeta',tarjeta_referencia:'Referencia de tarjeta',transferencia_monto:'Pago por transferencia',transferencia_comprobante:'Comprobante de transferencia',created_at:'Fecha de creación',updated_at:'Última actualización',entregado_at:'Fecha de entrega real',mora_dias_cobrados:'Días de mora cobrados'}
const llavesBooleanas=new Set(['guardar_directorio','envio_domicilio','fecha_entrega_activa','mora_activa'])
const llavesMonetarias=new Set(['monto_recibido','descuento','descuento_manual','descuento_promocion','subtotal','total','cambio','tarjeta_monto','transferencia_monto'])
const llavesFecha=new Set(['fecha_entrega','created_at','updated_at','entregado_at'])
const formatearDatoOrden=(clave:string,valor:unknown)=>{const llave=claveDeCampo(clave);if(valor===null||valor===undefined||valor==='')return '—';if(llave==='turno_id')return numeroCajaTurno(valor);if(llavesBooleanas.has(llave)){const verdadero=valor===true||valor===1||valor==='1'||valor==='true';return verdadero?'Sí':'No'}if(llavesMonetarias.has(llave)){const numero=Number(valor);return Number.isFinite(numero)?new Intl.NumberFormat('es-SV',{style:'currency',currency:'USD'}).format(numero):String(valor)}if(llave==='estado'||llave==='estado_pago'||llave==='metodo_pago')return String(valor).replace(/_/g,' ').replace(/\b\w/g,(letra)=>letra.toLocaleUpperCase()).trim();if(llavesFecha.has(llave)){const fecha=String(valor);if(/^\d{4}-\d{2}-\d{2}$/.test(fecha)){const [anio,mes,dia]=fecha.split('-');return `${dia}/${mes}/${anio}`}return formatearFecha(fecha)}if(Array.isArray(valor))return valor.map((item)=>typeof item==='object'?JSON.stringify(item):String(item)).join(', ');if(typeof valor==='object')return JSON.stringify(valor);return String(valor)}
const claveDeCampo=(clave:string)=>clave.replace(/[A-Z]/g,(letra)=>`_${letra.toLocaleLowerCase()}`)
const tituloCampo=(clave:string)=>etiquetasOrden[claveDeCampo(clave)]||clave.replace(/_/g,' ').replace(/\b\w/g,(letra)=>letra.toLocaleUpperCase())
const grupoDeCampo=(clave:string)=>{const llave=claveDeCampo(clave);if(llave==='turno_id')return 'Datos de la orden';if(['id','orden_id','created_at','updated_at','entregado_at'].includes(llave))return 'Datos del registro';if(['nombre_cliente','codigo_pais','telefono','correo','guardar_directorio'].includes(llave))return 'Cliente y contacto';if(['envio_domicilio','direccion_entrega','fecha_entrega_activa','mora_activa','fecha_entrega','hora_entrega','mora_dias_cobrados'].includes(llave))return 'Entrega';if(llavesMonetarias.has(llave)||['estado_pago','metodo_pago','tarjeta_referencia','transferencia_comprobante'].includes(llave))return 'Resumen de pago';if(['cantidad_prendas','detalles_prendas','nota_interna','motivo_cancelacion'].includes(llave))return 'Detalles de la orden';if(['secuencia','estado'].includes(llave))return 'Datos de la orden';return 'Otros datos'}
const seccionesOrden=(valor:RegistroPersonal['ordenEliminada']):GrupoOrdenGuardada[]=>{const orden=objetoOrden(valor);if(!orden)return [];const grupos=new Map<string,CampoOrdenGuardada[]>();for(const [clave,dato] of Object.entries(orden)){if(dato===null||dato===undefined||dato==='')continue;const titulo=grupoDeCampo(clave);const campos=grupos.get(titulo)||[];campos.push({clave,etiqueta:tituloCampo(clave),valor:formatearDatoOrden(clave,dato)});grupos.set(titulo,campos)}const ordenGrupos=['Datos de la orden','Cliente y contacto','Entrega','Resumen de pago','Detalles de la orden','Otros datos','Datos del registro'];return ordenGrupos.flatMap((titulo)=>{const campos=grupos.get(titulo);return campos?.length?[{titulo,campos}]:[]})}
const cargarSesiones=()=>void cargarGrupo('sesiones',sesiones); const cargarOrdenes=()=>void cargarGrupo('ordenes',ordenes); const cargarRegistros=()=>{cargarSesiones();cargarOrdenes()}; onIonViewWillEnter(()=>{cargarRegistros();void cargarReferenciasCaja()})
watch(()=>[sesiones.desde,sesiones.hasta,sesiones.usuario,sesiones.tipo],()=>{if(sesiones.pagina!==1)sesiones.pagina=1;else cargarSesiones()});watch(()=>[ordenes.desde,ordenes.hasta,ordenes.usuario,ordenes.tipo],()=>{if(ordenes.pagina!==1)ordenes.pagina=1;else cargarOrdenes()});watch(()=>sesiones.pagina,cargarSesiones);watch(()=>ordenes.pagina,cargarOrdenes);watch(()=>sesiones.registros,()=>{duracionActualizadaEn.value=Date.now()})
const timer=setInterval(()=>{ahora.value=Date.now()},1000);const refrescarSesionesTimer=setInterval(cargarSesiones,15000);onUnmounted(()=>{clearInterval(timer);clearInterval(refrescarSesionesTimer)}); const rango=(g:ReturnType<typeof crearGrupo>)=>g.total?((g.pagina-1)*50+1)+'–'+Math.min(g.pagina*50,g.total):'0'
const duracionSesion=(r:RegistroPersonal)=>{let segundos=Number(r.duracionSegundos)||0;if(Boolean(r.sesionActiva))segundos+=Math.max(0,Math.floor((ahora.value-duracionActualizadaEn.value)/1000));const dias=Math.floor(segundos/86400),h=Math.floor((segundos%86400)/3600),m=Math.floor((segundos%3600)/60),s=segundos%60;const partes=[];if(dias)partes.push(dias+' '+(dias===1?'día':'días'));if(h||dias)partes.push(String(h).padStart(2,'0')+' h');partes.push(String(m).padStart(2,'0')+' min');if(Boolean(r.sesionActiva))partes.push(String(s).padStart(2,'0')+' s');return partes.join(' ')}
const formatearFecha=(valor:string)=>{const fecha=new Date(valor);return Number.isNaN(fecha.getTime())?'—':new Intl.DateTimeFormat('es-SV',{timeZone:'America/El_Salvador',dateStyle:'medium',timeStyle:'short'}).format(fecha)}
</script>

<style scoped>
.registros-personal-page { min-height: 100%; padding: 24px clamp(16px, 3vw, 36px) 34px; color: #102a43; }
.page-heading { display:flex; justify-content:space-between; align-items:center; gap:18px; margin-bottom:22px; }
.page-heading-title { display:flex; align-items:center; gap:14px; min-width:0; }
.volver-ajustes { display:grid; place-items:center; width:40px; height:40px; flex:0 0 auto; border:1px solid rgba(10,31,56,.12); border-radius:11px; background:rgba(255,255,255,.82); color:#123a66; font-size:20px; cursor:pointer; transition:transform .2s ease,background .2s ease; }
.volver-ajustes:hover { transform:translateX(-3px); background:#fff; }
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
.historial-modal { width:min(900px,100%); max-height:min(82vh,850px); overflow:auto; border:1px solid #dce5ed; border-radius:18px; background:#fff; box-shadow:0 24px 80px rgba(5,25,45,.3); }
.modal-heading { position:sticky; top:0; z-index:1; display:flex; justify-content:space-between; align-items:center; padding:18px 22px; border-bottom:1px solid #e8eef4; background:#fff; }
.modal-heading h3 { margin:0; color:#123a66; font-size:1.35rem; }
.modal-heading .eyebrow { margin-bottom:4px; }
.modal-close { width:38px; height:38px; border:0; border-radius:50%; background:#f1f5f8; color:#34516b; font-size:1.7rem; cursor:pointer; }
.modal-timeline { display:flex; flex-direction:column; padding:6px 22px 22px; }
.historial-evento { display:grid; grid-template-columns:155px 1fr; gap:15px; padding:16px 0; border-bottom:1px solid #edf1f5; }
.evento-detalle strong { color:#294a66; font-size:.85rem; }
.evento-detalle p { margin:5px 0; color:#3c5369; font-size:.88rem; }
.evento-detalle time { color:#8797a7; font-size:.75rem; }
.orden-original { margin-top:14px; overflow:hidden; border:1px solid #dbe6ef; border-radius:14px; background:#f8fbfe; }
.orden-original-heading { display:flex; justify-content:space-between; align-items:center; gap:12px; padding:16px; border-bottom:1px solid #e3ebf2; background:linear-gradient(135deg,#fff,#f2f8fd); }
.orden-original-heading > div { min-width:0; }
.orden-original-heading > div > span { color:#73889b; font-size:.65rem; font-weight:850; letter-spacing:.1em; }
.orden-original-heading h4 { margin:4px 0 0; color:#123a66; font-size:1.05rem; overflow-wrap:anywhere; }
.orden-original-heading p { margin:4px 0 0; color:#698096; font-size:.78rem; }
.orden-estado-chip { flex:0 0 auto; padding:6px 10px; border:1px solid #d7e6f2; border-radius:999px; background:#edf6fc; color:#285b82; font-size:.72rem; font-weight:800; text-transform:capitalize; }
.orden-original-secciones { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; padding:12px; }
.orden-original-grupo { min-width:0; padding:12px; border:1px solid #e3ebf2; border-radius:11px; background:#fff; }
.orden-original-grupo h5 { margin:0 0 9px; color:#345a78; font-size:.76rem; font-weight:850; }
.orden-original-grupo dl { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:9px 12px; margin:0; }
.orden-original-campo { min-width:0; }
.orden-original-campo dt { color:#8595a4; font-size:.64rem; font-weight:750; }
.orden-original-campo dd { margin:3px 0 0; color:#294a66; font-size:.78rem; font-weight:700; overflow-wrap:anywhere; white-space:pre-wrap; }
.orden-original-grupo:last-child:nth-child(odd) { grid-column:1/-1; }
.columnas-historial { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1.3fr); align-items:start; gap:16px; }
.columna-heading { padding:18px 16px 4px; }
.columna-heading h3 { margin:0; color:#123a66; font-size:1.05rem; }
.columna-heading p { margin:5px 0 0; color:#70849a; font-size:.8rem; }
.historial-card { overflow:hidden; border:1px solid rgba(18,58,102,.12); border-radius:18px; background:#fff; box-shadow:0 8px 26px rgba(12,43,74,.06); }
.filtros-registros { display:flex; flex-wrap:wrap; align-items:end; gap:12px; padding:16px; border-bottom:1px solid #e8eef4; background:#f8fbfe; }
.filtros-registros label { display:flex; flex-direction:column; gap:5px; color:#587089; font-size:.75rem; font-weight:800; }
.filtros-registros input,.filtros-registros select { min-height:38px; min-width:150px; border:1px solid #d5e0ea; border-radius:9px; background:#fff; padding:7px 9px; color:#183b5b; font:inherit; }
.limpiar-filtros { min-height:38px; padding:8px 11px; font-size:.8rem; }
.sesiones-lista { display:grid; grid-template-columns:repeat(auto-fill,minmax(min(100%,270px),1fr)); gap:10px; padding:14px; }
.sesion-card { min-width:0; padding:12px; border:1px solid #e3eaf1; border-radius:13px; background:linear-gradient(145deg,#fff,#f9fbfd); box-shadow:0 4px 12px rgba(12,43,74,.04); }
.sesion-card.sesion-activa { border-color:#ccebd9; background:linear-gradient(145deg,#fff,#f5fcf7); }
.sesion-card-principal { display:flex; justify-content:space-between; align-items:center; gap:10px; }
.sesion-identidad { display:flex; align-items:center; gap:8px; min-width:0; }
.sesion-avatar { display:grid; place-items:center; width:36px; height:36px; flex:0 0 auto; overflow:hidden; border-radius:11px; background:#eaf3fa; color:#2875a9; font-size:1.35rem; }
.sesion-avatar img { width:100%; height:100%; object-fit:cover; }
.sesion-activa .sesion-avatar { background:#e3f6eb; color:#19804d; }
.sesion-usuario { display:flex; flex-direction:column; gap:4px; min-width:0; }
.sesion-usuario strong { overflow:hidden; color:#173858; font-size:.82rem; text-overflow:ellipsis; white-space:nowrap; }
.sesion-usuario small { color:#8191a2; font-size:.64rem; text-transform:capitalize; }
.sesion-estado { display:inline-flex; align-items:center; gap:5px; flex:0 0 auto; padding:5px 7px; border:1px solid #f0dfce; border-radius:999px; background:#fff7ed; color:#a45a21; font-size:.61rem; font-weight:850; white-space:nowrap; }
.sesion-estado.activa { border-color:#cdebd8; background:#eaf8ef; color:#197549; }
.sesion-estado-punto { width:6px; height:6px; border-radius:50%; background:currentColor; }
.sesion-card-detalles { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:7px; margin-top:10px; }
.sesion-hora,.sesion-duracion { display:flex; flex-direction:column; gap:4px; min-width:0; padding:8px; border-radius:9px; background:#f2f6f9; }
.sesion-hora span,.sesion-duracion span { color:#8797a7; font-size:.5rem; font-weight:850; letter-spacing:.06em; }
.sesion-hora strong { overflow:hidden; color:#435c73; font-size:.64rem; font-weight:750; text-overflow:ellipsis; white-space:nowrap; }
.sesion-duracion { grid-column:1/-1; flex-direction:row; align-items:center; gap:8px; background:#f0f5fa; color:#365f82; }
.sesion-duracion.cronometro { background:#eaf8ef; color:#197549; }
.sesion-duracion ion-icon { flex:0 0 auto; font-size:.95rem; }
.sesion-duracion div { display:flex; flex-direction:column; gap:4px; min-width:0; }
.sesion-duracion strong { color:#254761; font-size:.83rem; font-variant-numeric:tabular-nums; }
.sesion-duracion.cronometro strong { color:#167447; }
.sesion-cierre { margin:7px 0 0; color:#7b8b9b; font-size:.62rem; }
.tabla-scroll { overflow:auto; }
table { width:100%; border-collapse:collapse; min-width:800px; }
th { padding:12px 14px; background:#f4f8fb; color:#61768b; font-size:.72rem; letter-spacing:.04em; text-align:left; text-transform:uppercase; }
td { padding:13px 14px; border-top:1px solid #edf1f5; color:#304a62; font-size:.87rem; vertical-align:middle; }
td small { display:block; margin-top:3px; color:#8392a1; text-transform:capitalize; }
.actividad-chip { display:inline-flex; align-items:center; gap:6px; padding:6px 9px; border-radius:999px; background:#f0f5fa; color:#365570; font-size:.76rem; font-weight:800; white-space:nowrap; }
.actividad-chip ion-icon { font-size:15px; }
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
@media(max-width:700px) { .historial-modal { max-height:90vh; } .modal-timeline { padding:4px 14px 16px; } .historial-evento { grid-template-columns:1fr; gap:8px; } .historial-evento > .actividad-chip { width:max-content; } .orden-original-secciones { grid-template-columns:1fr; } .orden-original-grupo:last-child:nth-child(odd) { grid-column:auto; } }
@media(max-width:560px) { .registros-personal-page { padding:18px 12px 26px; } .page-heading { align-items:flex-start; } .refresh-button { padding:9px 10px; font-size:.78rem; } .resumen-grid { gap:9px; } .resumen-card { padding:13px; } .resumen-card strong { font-size:1.45rem; } .filtros-registros label { flex:1 1 calc(50% - 10px); } .filtros-registros input,.filtros-registros select { min-width:0; width:100%; } .sesiones-lista { grid-template-columns:1fr; padding:12px; } .orden-original-heading { align-items:flex-start; padding:13px; } .orden-original-grupo dl { grid-template-columns:1fr; } }
</style>
