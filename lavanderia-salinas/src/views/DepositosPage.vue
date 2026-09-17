<template>
  <AppShell>
    <div class="depositos-page">
      <header class="depositos-header">
        <div>
          <h1>Depósitos</h1>
        </div>
        <div v-if="!esCajero" class="resumen-total">
          <span>Disponible para depósito</span>
          <strong>${{ netoDisponible.toFixed(2) }}</strong>
        </div>
      </header>

      <section v-if="!esCajero" class="resumen-financiero">
        <article class="dato-card dato-ingresos">
          <span>💰 Cierres anteriores pendientes</span>
          <strong>${{ totalRecaudadoCierres.toFixed(2) }}</strong>
          <small>{{ cierresPendientesDeposito.length }} cierre{{ cierresPendientesDeposito.length === 1 ? '' : 's' }} sin depositar</small>
        </article>
        <article class="dato-card dato-gastos">
          <span>🏦 Depósitos realizados ahora</span>
          <strong>${{ totalDepositosTurno.toFixed(2) }}</strong>
          <small>{{ depositosTurno.length }} movimiento{{ depositosTurno.length === 1 ? '' : 's' }}</small>
        </article>
        <article class="dato-card dato-neto">
          <span>📈 Neto disponible</span>
          <strong>${{ netoDisponible.toFixed(2) }}</strong>
          <small>Total recaudado menos depósitos y nómina</small>
        </article>
        <article class="dato-card dato-nomina">
          <span>👥 Nómina pendiente</span>
          <strong>${{ totalNominaPendiente.toFixed(2) }}</strong>
          <small>{{ empleadosConPago.length }} empleado{{ empleadosConPago.length === 1 ? '' : 's' }} por pagar</small>
        </article>
      </section>

      <div v-if="!esCajero && !turno.abierto" class="aviso-turno">
        <span class="aviso-icono">🔒</span>
        <div>
          <strong>Necesitas un turno abierto</strong>
          <span>Abre la caja antes de registrar un depósito.</span>
        </div>
      </div>

      <section class="deposito-layout" :class="{ 'solo-formulario': esCajero }">
        <form v-if="!editandoId" class="formulario-deposito" @submit.prevent="guardarDeposito">
          <div class="formulario-titulo">
            <span class="titulo-icono">🏦</span>
            <div>
              <h2>{{ editandoId ? 'Editar depósito' : 'Nuevo depósito' }}</h2>
            </div>
          </div>

          <label class="campo-label" for="monto-deposito">Monto</label>
          <div class="monto-input">
            <span>$</span>
            <input id="monto-deposito" v-model.number="monto" type="number" min="0.01" step="0.01" placeholder="0.00" :disabled="!turno.abierto" />
          </div>

          <label class="campo-label" for="notas-deposito">Concepto o referencia</label>
          <textarea style="background-color: white;" id="notas-deposito" v-model="concepto" rows="4" placeholder="Ej: depósito a cuenta BAC" :disabled="!turno.abierto"></textarea>

          <label class="comprobante-label" for="comprobante-deposito">📷 Comprobante fotográfico</label>
          <input id="comprobante-deposito" type="file" accept="image/*" :disabled="!turno.abierto || subiendoComprobante" @change="subirComprobante" />
          <a v-if="comprobanteUrl" class="comprobante-link" :href="comprobanteUrl" target="_blank" rel="noreferrer">🔎 Ver comprobante cargado</a>

          <button class="guardar-btn" type="submit" :disabled="!turno.abierto || !puedeGuardar">
            <span>{{ editandoId ? '💾' : '💸' }}</span>
            {{ editandoId ? 'Actualizar depósito' : 'Guardar depósito' }}
          </button>
          <button v-if="editandoId" type="button" class="cancelar-btn" @click="cancelarEdicion">Cancelar edición</button>
          <p v-if="mensaje" class="mensaje" :class="{ error: esError }">{{ mensaje }}</p>
        </form>

        <section v-if="!esCajero" class="historial-depositos">
          <div class="historial-titulo">
            <div>
              <h2>Movimientos del turno</h2>
              <p>{{ depositosTurno.length }} depósito{{ depositosTurno.length === 1 ? '' : 's' }} registrado{{ depositosTurno.length === 1 ? '' : 's' }}</p>
            </div>
            <span class="historial-icono">📋</span>
          </div>

          <div v-if="depositosTurno.length" class="lista-depositos">
            <article v-for="deposito in depositosTurno" :key="deposito.id" class="deposito-item">
              <span class="deposito-item-icono">💧</span>
              <div class="deposito-info">
                <strong>{{ deposito.concepto }}</strong>
                <small>{{ formatearFecha(deposito.creadoAt) }}</small>
                <a v-if="deposito.comprobanteUrl" :href="deposito.comprobanteUrl" target="_blank" rel="noreferrer" class="comprobante-link">📷 Ver comprobante</a>
              </div>
              <strong class="deposito-monto">${{ deposito.monto.toFixed(2) }}</strong>
              <div class="deposito-acciones">
                <button type="button" title="Editar depósito" @click="editar(deposito)">✏️</button>
                <button type="button" title="Eliminar depósito" @click="eliminar(deposito.id)">🗑️</button>
              </div>
            </article>
          </div>
          <div v-else class="estado-vacio">
            <span>🫧</span>
            <strong>Aún no hay depósitos</strong>
            <small>Los registros de este turno aparecerán aquí.</small>
          </div>
        </section>
      </section>

      <ion-modal v-if="!esCajero" :is-open="mostrarModalEdicion" class="deposito-edicion-modal" @didDismiss="cancelarEdicion">
        <form class="formulario-deposito deposito-edicion-contenido" @submit.prevent="guardarDeposito">
          <div class="formulario-titulo">
            <span class="titulo-icono">✏️</span>
            <div>
              <h2>Editar depósito</h2>
              <p>Actualiza el monto, concepto o comprobante.</p>
            </div>
          </div>

          <label class="campo-label" for="monto-deposito-edicion">Monto</label>
          <div class="monto-input">
            <span>$</span>
            <input id="monto-deposito-edicion" v-model.number="monto" type="number" min="0.01" step="0.01" required />
          </div>

          <label class="campo-label" for="notas-deposito-edicion">Concepto o referencia</label>
          <textarea id="notas-deposito-edicion" v-model="concepto" rows="4" required></textarea>

          <label class="comprobante-label" for="comprobante-deposito-edicion">📷 Comprobante fotográfico</label>
          <input id="comprobante-deposito-edicion" type="file" accept="image/*" :disabled="subiendoComprobante" @change="subirComprobante" />
          <a v-if="comprobanteUrl" class="comprobante-link" :href="comprobanteUrl" target="_blank" rel="noreferrer">🔎 Ver comprobante</a>

          <div class="modal-botones-deposito">
            <button type="button" class="cancelar-btn" @click="cancelarEdicion">Cancelar</button>
            <button class="guardar-btn" type="submit" :disabled="!puedeGuardar">💾 Guardar cambios</button>
          </div>
        </form>
      </ion-modal>

      <section v-if="!esCajero" class="nomina-card">
        <div class="historial-titulo">
          <div>
            <h2>Pagos pendientes al personal</h2>
            <p>Jornadas que todavía no han sido marcadas como pagadas.</p>
          </div>
          <span class="historial-icono">💵</span>
        </div>
        <div v-if="empleadosConPago.length" class="nomina-lista">
          <article v-for="empleado in empleadosConPago" :key="empleado.id" class="nomina-item">
            <div class="empleado-avatar">{{ empleado.nombre.charAt(0).toUpperCase() }}</div>
            <div class="deposito-info">
              <strong>{{ empleado.nombre }}</strong>
              <small>{{ empleado.horas.toFixed(2) }} horas pendientes</small>
            </div>
            <strong class="deposito-monto">${{ empleado.monto.toFixed(2) }}</strong>
            <button type="button" class="pagar-btn" @click="marcarPago(empleado.id)">✅ Pagar</button>
          </article>
        </div>
        <div v-else class="nomina-vacia">🎉 No hay pagos pendientes por registrar.</div>
      </section>

      <ion-modal v-if="!esCajero" :is-open="mostrarRevision" class="revision-modal" @didDismiss="cerrarRevision">
        <div class="revision-contenido">
          <div class="revision-icono">🏦</div>
          <p class="eyebrow">Corte diario</p>
          <h2>¿Qué pasó con el efectivo?</h2>
          <p class="revision-resumen">De los cierres anteriores hay <strong>${{ montoRevision.toFixed(2) }}</strong> disponibles para depósito.</p>

          <div class="revision-opciones">
            <button type="button" :class="{ activo: revisionResultado === 'depositado' }" @click="revisionResultado = 'depositado'">✅ Sí, ya fue depositado</button>
            <button type="button" :class="{ activo: revisionResultado === 'diferente' }" @click="revisionResultado = 'diferente'">✏️ La cantidad fue diferente</button>
            <button type="button" :class="{ activo: revisionResultado === 'pendiente' }" @click="revisionResultado = 'pendiente'">🕒 Todavía no</button>
          </div>

          <div v-if="revisionResultado === 'diferente'" class="revision-diferencia">
            <label for="monto-real">Monto depositado realmente</label>
            <input id="monto-real" v-model.number="montoDepositadoReal" type="number" min="0" step="0.01" />
            <label for="motivo-diferencia">¿Por qué fue diferente?</label>
            <textarea id="motivo-diferencia" v-model="motivoDiferencia" rows="3" placeholder="Ej: se dejó efectivo para cambio"></textarea>
          </div>

          <div class="revision-acciones">
            <button type="button" class="revision-secundario" @click="cerrarRevision">Revisar después</button>
            <button type="button" class="revision-primario" :disabled="!puedeConfirmarRevision" @click="confirmarRevision">Guardar revisión</button>
          </div>
        </div>
      </ion-modal>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { IonModal, onIonViewWillEnter } from '@ionic/vue'
import { computed, ref } from 'vue'
import AppShell from '@/components/AppShell.vue'
import { useCajaMovimientos, type MovimientoCaja } from '@/composables/useCajaMovimientos'
import { useTurno } from '@/composables/useTurno'
import { useHistorialCierres } from '@/composables/useHistorialCierres'
import { useHorarios } from '@/composables/Usehorarios'
import { getApiBaseUrl } from '@/composables/useApiConfig'
import { useSesion } from '@/composables/useSesion'

const { turno } = useTurno()
const { rol } = useSesion()
const { depositos, registrarDeposito, editarDeposito, eliminarDeposito } = useCajaMovimientos()
const { historialCierres: cierres, cargarHistorial } = useHistorialCierres()
const { empleados, refrescarPersonal, horasPendientesDe, montoPendienteDe, marcarComoPagado } = useHorarios()
const esCajero = computed(() => ['cajero', 'caja'].includes((rol.value || '').toLowerCase()))
const monto = ref<number | null>(null)
const concepto = ref('')
const mensaje = ref('')
const esError = ref(false)
const editandoId = ref<string | null>(null)
const mostrarModalEdicion = ref(false)
const cierresDelDepositoEditado = ref<string[]>([])
const comprobanteUrl = ref('')
const subiendoComprobante = ref(false)
const mostrarRevision = ref(false)
const revisionResultado = ref<'depositado' | 'diferente' | 'pendiente'>('depositado')
const montoDepositadoReal = ref<number | null>(null)
const motivoDiferencia = ref('')
const fechaRevision = () => new Date().toISOString().slice(0, 10)

const depositosTurno = computed(() => depositos.value.filter((deposito) => deposito.turnoId === turno.id))
const totalDepositosTurno = computed(() => depositosTurno.value.reduce((total, deposito) => total + deposito.monto, 0))
const puedeGuardar = computed(() => Number(monto.value) > 0)
const cierresPendientesDeposito = computed(() => cierres.value.filter((cierre) =>
  (!turno.id || cierre.turnoId !== turno.id) &&
  (!cierre.deposito || cierre.deposito.estado === 'pendiente')
))
const totalRecaudadoCierres = computed(() => cierresPendientesDeposito.value.reduce((total, cierre) => total + cierre.totales.recaudado, 0))
const netoDisponible = computed(() => Math.max(0, totalRecaudadoCierres.value - totalDepositosTurno.value - totalNominaPendiente.value))
const empleadosConPago = computed(() => empleados.value
  .map((empleado) => ({
    ...empleado,
    horas: horasPendientesDe(empleado.id),
    monto: montoPendienteDe(empleado.id)
  }))
  .filter((empleado) => empleado.monto > 0))
const totalNominaPendiente = computed(() => empleadosConPago.value.reduce((total, empleado) => total + empleado.monto, 0))
const montoRevision = computed(() => netoDisponible.value)
const puedeConfirmarRevision = computed(() => revisionResultado.value !== 'diferente' || Number(montoDepositadoReal.value) >= 0)

onIonViewWillEnter(async () => {
  await refrescarPersonal()
  await cargarHistorial()
  if (!esCajero.value && cierresPendientesDeposito.value.length) mostrarRevision.value = true
})

const formatearFecha = (valor: string) => new Date(valor).toLocaleString('es-ES', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit'
})

const guardarDeposito = async () => {
  mensaje.value = ''
  if (!turno.abierto) {
    mensaje.value = 'Abre un turno antes de registrar depósitos.'
    esError.value = true
    return
  }

  const estabaEditando = Boolean(editandoId.value)
  const datos = {
    monto: Number(monto.value),
    concepto: `${concepto.value.trim() || 'Depósito a banco'}${cierresDelDepositoEditado.value.length ? ` [CIERRES:${cierresDelDepositoEditado.value.join(',')}]` : ''}`,
    comprobanteUrl: comprobanteUrl.value || undefined
  }
  const creado = editandoId.value
    ? await editarDeposito(editandoId.value, datos)
    : await registrarDeposito(datos)

  if (!creado) {
    mensaje.value = 'Escribe un monto válido para continuar.'
    esError.value = true
    return
  }

  monto.value = null
  concepto.value = ''
  comprobanteUrl.value = ''
  editandoId.value = null
  cierresDelDepositoEditado.value = []
  mostrarModalEdicion.value = false
  mensaje.value = estabaEditando ? 'Depósito actualizado correctamente.' : 'Depósito guardado correctamente.'
  esError.value = false
}

const editar = (deposito: MovimientoCaja) => {
  if (esCajero.value) return
  editandoId.value = deposito.id
  monto.value = deposito.monto
  concepto.value = deposito.concepto
  comprobanteUrl.value = deposito.comprobanteUrl ?? ''
  cierresDelDepositoEditado.value = deposito.cierreIds ?? []
  mensaje.value = ''
  mostrarModalEdicion.value = true
}

const cancelarEdicion = () => {
  mostrarModalEdicion.value = false
  editandoId.value = null
  monto.value = null
  concepto.value = ''
  comprobanteUrl.value = ''
  cierresDelDepositoEditado.value = []
}

const eliminar = async (id: string) => {
  if (esCajero.value) return
  if (!window.confirm('¿Eliminar este depósito?')) return
  const deposito = depositos.value.find((item) => item.id === id)
  if (await eliminarDeposito(id)) {
    if (deposito?.cierreIds?.length) {
      await Promise.all(deposito.cierreIds.map((cierreId) => fetch(`${getApiBaseUrl()}/cierres-caja/${cierreId}/deposito`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'pendiente', monto: null, motivo: null })
      })))
      await cargarHistorial()
    }
    if (editandoId.value === id) cancelarEdicion()
    mensaje.value = 'Depósito eliminado correctamente.'
    esError.value = false
  }
}

const subirComprobante = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const archivo = input.files?.[0]
  input.value = ''
  if (!archivo) return

  subiendoComprobante.value = true
  try {
    const formulario = new FormData()
    formulario.append('imagen', archivo)
    const respuesta = await fetch(`${getApiBaseUrl()}/comprobantes/imagen`, {
      method: 'POST',
      body: formulario
    })
    const datos = await respuesta.json().catch(() => null)
    if (!respuesta.ok || typeof datos?.url !== 'string') {
      throw new Error(datos?.error ?? 'No se pudo subir el comprobante.')
    }
    comprobanteUrl.value = datos.url
    mensaje.value = 'Comprobante cargado. Guarda el depósito para conservarlo.'
    esError.value = false
  } catch (error) {
    mensaje.value = error instanceof Error ? error.message : 'No se pudo subir el comprobante.'
    esError.value = true
  } finally {
    subiendoComprobante.value = false
  }
}

const marcarPago = (empleadoId: string) => {
  const pago = marcarComoPagado(empleadoId)
  if (pago) {
    mensaje.value = 'Pago de empleado marcado correctamente.'
    esError.value = false
  }
}

const cerrarRevision = () => {
  mostrarRevision.value = false
}

const confirmarRevision = async () => {
  const montoReal = revisionResultado.value === 'diferente' ? Number(montoDepositadoReal.value) : montoRevision.value
  const pendientes = cierresPendientesDeposito.value
  
  // Si el resultado es depositado o diferente, registrar el depósito
  if (revisionResultado.value === 'depositado' || revisionResultado.value === 'diferente') {
    const conceptoBase = revisionResultado.value === 'diferente' 
      ? `Depósito a banco (diferencia: ${motivoDiferencia.value.trim()})`
      : 'Depósito a banco'
    const concepto = `${conceptoBase} [CIERRES:${pendientes.map((cierre) => cierre.id).join(',')}]`
    
    const deposito = await registrarDeposito({
      monto: montoReal,
      concepto: concepto,
      comprobanteUrl: undefined
    })
    if (!deposito) {
      mensaje.value = 'No se pudo registrar el depósito. Los cierres siguen pendientes.'
      esError.value = true
      return
    }
  }
  
  for (const cierre of pendientes) {
    const respuesta = await fetch(`${getApiBaseUrl()}/cierres-caja/${cierre.id}/deposito`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        estado: revisionResultado.value,
        monto: montoReal,
        motivo: motivoDiferencia.value.trim()
      })
    })
    if (!respuesta.ok) {
      const datos = await respuesta.json().catch(() => null)
      mensaje.value = datos?.error ?? 'No se pudo actualizar el estado de un cierre.'
      esError.value = true
      return
    }
  }
  await cargarHistorial()
  mostrarRevision.value = false
}
</script>

<style scoped>
.depositos-page { display: grid; gap: 22px; min-height: 100%; color: #0a1f38; }
.depositos-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; padding: 8px 2px 0; }
.eyebrow { margin: 0 0 5px; color: #168b83; font-size: .74rem; font-weight: 900; letter-spacing: .1em; text-transform: uppercase; }
h1, h2, p { margin: 0; }
h1 { font-size: 1.8rem; font-weight: 900; }
.depositos-header p:last-child { margin-top: 7px; color: #6d829c; }
.resumen-total { display: grid; gap: 4px; min-width: 170px; padding: 14px 18px; border: 1px solid rgba(22,139,131,.18); border-radius: 14px; background: #eaf8f5; text-align: right; }
.resumen-total span { color: #477c78; font-size: .74rem; font-weight: 800; }
.resumen-total strong { color: #08766f; font-size: 1.35rem; }
.resumen-financiero { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.dato-card { display: grid; gap: 5px; padding: 15px; border: 1px solid rgba(10,31,56,.08); border-radius: 14px; background: #fff; box-shadow: 0 5px 15px rgba(10,31,56,.04); }
.dato-card span { color: #4a627e; font-size: .75rem; font-weight: 800; }
.dato-card strong { font-size: 1.25rem; }
.dato-card small { color: #8a9bad; font-size: .7rem; }
.dato-ingresos { border-top: 3px solid #168b83; }
.dato-ingresos strong, .dato-neto strong { color: #08766f; }
.dato-gastos { border-top: 3px solid #e3a83d; }
.dato-gastos strong { color: #9b6b12; }
.dato-neto { border-top: 3px solid #4169a1; }
.dato-nomina { border-top: 3px solid #b26b92; }
.dato-nomina strong { color: #934f76; }
.aviso-turno { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border: 1px solid #f0d9a6; border-radius: 12px; background: #fff8e8; color: #805d13; }
.aviso-icono { font-size: 1.35rem; }
.aviso-turno div { display: grid; gap: 3px; }
.aviso-turno span:last-child { color: #9a7a35; font-size: .82rem; }
.deposito-layout { display: grid; grid-template-columns: minmax(280px, .82fr) minmax(360px, 1.18fr); gap: 18px; align-items: start; }
.deposito-layout.solo-formulario { grid-template-columns: minmax(320px, 560px); justify-content: center; }
.formulario-deposito, .historial-depositos { padding: 22px; border: 1px solid rgba(10,31,56,.08); border-radius: 18px; background: #fff; box-shadow: 0 8px 20px rgba(10,31,56,.06); }
.formulario-deposito { display: grid; gap: 10px; }
.formulario-titulo, .historial-titulo { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 8px; }
.formulario-titulo { justify-content: flex-start; }
.titulo-icono, .historial-icono { display: grid; place-items: center; width: 46px; height: 46px; flex-shrink: 0; border-radius: 14px; background: #eaf8f5; font-size: 1.5rem; }
.formulario-titulo h2, .historial-titulo h2 { font-size: 1.08rem; font-weight: 900; }
.formulario-titulo p, .historial-titulo p { margin-top: 4px; color: #6d829c; font-size: .78rem; }
.campo-label { margin-top: 8px; color: #4a627e; font-size: .8rem; font-weight: 800;}
.monto-input { display: flex; align-items: center; gap: 8px; padding: 0 12px; border: 1px solid #cbd7df; border-radius: 10px; background: #fbfdfe; color: #168b83; font-size: 1.1rem; font-weight: 900; }
.monto-input input { width: 100%; padding: 13px 0; border: 0; outline: 0; background: transparent; color: #0a1f38; font: inherit; }
textarea { width: 100%; resize: vertical; padding: 11px 12px; border: 1px solid #cbd7df; border-radius: 10px; outline: 0; color: #0a1f38; font: inherit; }
textarea:focus, .monto-input:focus-within { border-color: #168b83; box-shadow: 0 0 0 3px rgba(22,139,131,.12); }
.guardar-btn { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 10px; padding: 13px; border: 0; border-radius: 10px; background: #168b83; color: #fff; font-weight: 900; cursor: pointer; }
.guardar-btn:disabled { opacity: .5; cursor: not-allowed; }
.deposito-edicion-modal { --width: min(520px, calc(100vw - 28px)); --height: auto; --border-radius: 20px; }
.deposito-edicion-contenido { width: 100%; box-sizing: border-box; background: #fff; }
.modal-botones-deposito { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; margin-top: 6px; }
.modal-botones-deposito .guardar-btn, .modal-botones-deposito .cancelar-btn { margin-top: 0; }
.mensaje { color: #08766f; font-size: .8rem; font-weight: 800; text-align: center; }
.mensaje.error { color: #b74444; }
.historial-depositos { min-height: 300px; }
.lista-depositos { display: grid; gap: 9px; }
.deposito-item { display: flex; align-items: center; gap: 11px; padding: 12px; border: 1px solid #e1ebef; border-radius: 11px; background: #fbfdfe; }
.deposito-item-icono { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 10px; background: #e2f4f6; font-size: 1rem; }
.deposito-info { display: grid; gap: 4px; min-width: 0; flex: 1; }
.deposito-info strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: .84rem; }
.deposito-info small { color: #6d829c; font-size: .72rem; }
.comprobante-label { margin-top: 8px; color: #4a627e; font-size: .8rem; font-weight: 800; }
.formulario-deposito input[type='file'] { width: 100%; padding: 9px; border: 1px dashed #b8ccd5; border-radius: 9px; background: #f8fbfc; color: #41607c; font-size: .78rem; }
.comprobante-link { color: #4169a1; font-size: .72rem; font-weight: 800; text-decoration: none; }
.comprobante-link:hover { text-decoration: underline; }
.deposito-monto { color: #08766f; font-size: .9rem; }
.deposito-acciones { display: flex; gap: 4px; }
.deposito-acciones button { display: grid; place-items: center; width: 30px; height: 30px; border: 0; border-radius: 7px; background: #eef4f8; cursor: pointer; }
.deposito-acciones button:hover { background: #dcebef; }
.estado-vacio { display: grid; place-items: center; gap: 7px; min-height: 230px; color: #6d829c; text-align: center; }
.estado-vacio span { font-size: 2.2rem; }
.estado-vacio strong { color: #4169a1; font-size: .92rem; }
.estado-vacio small { font-size: .76rem; }
.nomina-card { padding: 22px; border: 1px solid rgba(10,31,56,.08); border-radius: 18px; background: linear-gradient(145deg, #fff 0%, #fbf8fc 100%); box-shadow: 0 8px 20px rgba(10,31,56,.06); }
.nomina-lista { display: grid; gap: 9px; }
.nomina-item { display: flex; align-items: center; gap: 11px; padding: 11px 12px; border: 1px solid #eadfe7; border-radius: 11px; background: rgba(255,255,255,.8); }
.empleado-avatar { display: grid; place-items: center; width: 35px; height: 35px; flex-shrink: 0; border-radius: 50%; background: #f3e4ed; color: #934f76; font-weight: 900; }
.pagar-btn { padding: 7px 10px; border: 0; border-radius: 8px; background: #eaf8f5; color: #08766f; font-size: .75rem; font-weight: 900; cursor: pointer; }
.pagar-btn:hover { background: #d2f0eb; }
.nomina-vacia { padding: 22px; border-radius: 10px; background: #f7fbfa; color: #477c78; text-align: center; font-weight: 800; }
.revision-modal { --width: min(450px, calc(100% - 28px)); --height: auto; --border-radius: 20px; }
.revision-contenido {background-color: white; display: grid; gap: 12px; padding: 25px; color: #0a1f38; }
.revision-icono { display: grid; place-items: center; width: 58px; height: 58px; border-radius: 17px; background: #eaf8f5; font-size: 2rem; }
.revision-contenido h2 { font-size: 1.35rem; font-weight: 900; }
.revision-resumen { color: #6d829c; line-height: 1.45; }
.revision-resumen strong { color: #08766f; font-size: 1.15rem; }
.revision-opciones { display: grid; gap: 8px; margin-top: 5px; }
.revision-opciones button { padding: 11px 12px; border: 1px solid #dbe7ed; border-radius: 10px; background: #fbfdfe; color: #41607c; text-align: left; font-weight: 800; cursor: pointer; }
.revision-opciones button.activo { border-color: #168b83; background: #eaf8f5; color: #08766f; }
.revision-diferencia { display: grid; gap: 7px; padding: 12px; border-radius: 10px; background: #f7fafb; }
.revision-diferencia label { color: #4a627e; font-size: .78rem; font-weight: 800; }
.revision-diferencia input, .revision-diferencia textarea { width: 100%; padding: 9px; border: 1px solid #cbd7df; border-radius: 8px; outline: 0; font: inherit; }
.revision-acciones { display: flex; justify-content: flex-end; gap: 9px; margin-top: 5px; }
.revision-acciones button { padding: 10px 13px; border-radius: 9px; font-weight: 900; cursor: pointer; }
.revision-secundario { border: 1px solid #dbe7ed; background: #fff; color: #41607c; }
.revision-primario { border: 0; background: #168b83; color: #fff; }
.revision-primario:disabled { opacity: .5; cursor: not-allowed; }
@media (max-width: 760px) { .depositos-header { align-items: stretch; flex-direction: column; } .resumen-total { text-align: left; } .deposito-layout { grid-template-columns: 1fr; } }
@media (max-width: 760px) { .resumen-financiero { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 430px) {
  .resumen-financiero {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .dato-card {
    padding: 12px 10px;
  }

  .dato-card span {
    font-size: 0.68rem;
  }

  .dato-card strong {
    font-size: 1rem;
  }

  .dato-card small {
    font-size: 0.62rem;
  }

  .nomina-item { flex-wrap: wrap; }
  .pagar-btn { margin-left: 46px; }
  .revision-acciones { flex-direction: column-reverse; }
}
</style>
