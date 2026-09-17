<template>
  <AppShell>
    <div class="reportes-page force-light">
      <section class="turno-panel">
        <div class="turno-panel-left">
          <div class="turno-panel-icon">
            <ion-icon :icon="cardOutline" />
          </div>
          <div>
            <p class="turno-panel-label">{{ turno.abierto ? 'Caja abierta' : 'Caja cerrada' }}</p>
            <h2>{{ turno.abierto ? `Caja #${turno.numeroCaja}` : 'Inicia un turno' }}</h2>
            <p v-if="turno.abierto" class="turno-panel-meta">
              <ion-icon :icon="timeOutline" />
              {{ tiempoTranscurrido }}
              <span>·</span>
              {{ usuario.nombre }}
            </p>
          </div>
        </div>

        <div class="turno-panel-actions">
          <ion-button v-if="!turno.abierto" class="btn-primario" @click="abrirModalTurno">
            Iniciar turno
          </ion-button>
          <template v-else-if="!esCajero">
            <ion-button class="btn-fantasma" @click="verDetalleTurno">
              <ion-icon :icon="eyeOutline" slot="start" /> Ver detalle
            </ion-button>
            <ion-button class="btn-advertencia" @click="terminarTurno">
              Terminar turno
            </ion-button>
          </template>
          <p v-else class="turno-panel-restriccion">Modo cajero: solo apertura de turno</p>
        </div>
      </section>

      <!-- ───────── Encabezado + rango ───────── -->
      <div v-if="!esCajero || esAdministrador" class="header-row">
        <h1>Reportes</h1>
        <button
          type="button"
          class="toggle-resumen-reportes"
          :title="resumenReportesExpandido ? 'Ocultar resumen y gráficas' : 'Mostrar resumen y gráficas'"
          :aria-label="resumenReportesExpandido ? 'Ocultar resumen y gráficas' : 'Mostrar resumen y gráficas'"
          @click="resumenReportesExpandido = !resumenReportesExpandido"
        >
          <ion-icon :icon="resumenReportesExpandido ? chevronUpOutline : chevronDownOutline" />
        </button>
      </div>

      <!-- ───────── Totales del turno ───────── -->
      <section v-if="(!esCajero || esAdministrador) && resumenReportesExpandido" class="kpi-grid">
        <button type="button" class="kpi-card kpi-card-interactivo" :class="{ activo: filtroKpi === 'efectivo' }" :disabled="ventasHoy - totalGastosTurnoActual <= 0" @click="seleccionarFiltroKpi('efectivo')">
          <p class="label">Efectivo en Caja</p>
          <strong class="kpi-monto">${{ (ventasHoy - totalGastosTurnoActual).toFixed(2) }}</strong>
          <span class="kpi-meta">{{ ordenesHoy.length }} órdenes de la caja abierta</span>
        </button>

        <button type="button" class="kpi-card kpi-card-interactivo" :class="{ activo: filtroKpi === 'cobrado' }" :disabled="cobradoHoy <= 0" @click="seleccionarFiltroKpi('cobrado')">
          <p class="label">Cobrado del turno</p>
          <strong class="kpi-monto verde">${{ cobradoHoy.toFixed(2) }}</strong>
          <span class="kpi-meta">No incluye los gastos</span>
        </button>

         <button type="button" class="kpi-card kpi-card-interactivo" :class="{ activo: filtroKpi === 'ventas' }" :disabled="ventaDelDiaTurnoActual <= 0" @click="seleccionarFiltroKpi('ventas')">
          <p class="label">Venta del Día</p>
          <strong class="kpi-monto gris">${{ventaDelDiaTurnoActual.toFixed(2)}}</strong>
          <span class="kpi-meta">Suma de ordenes creadas en el turno actual</span>
        </button>

        <button type="button" class="kpi-card kpi-card-interactivo" :class="{ activo: filtroKpi === 'anticipo' }" :disabled="anticiposHoy <= 0" @click="seleccionarFiltroKpi('anticipo')">
          <p class="label">Anticipos del turno</p>
          <strong class="kpi-monto azul">${{ anticiposHoy.toFixed(2) }}</strong>
          <span class="kpi-meta">Anticipos de órdenes con saldo pendiente</span>
        </button>

        <button type="button" class="kpi-card kpi-card-interactivo" :class="{ activo: filtroKpi === 'pendiente' }" :disabled="pendienteCobroTotal <= 0" @click="seleccionarFiltroKpi('pendiente')">
          <p class="label">Pendiente de cobrar</p>
          <strong class="kpi-monto ambar">${{ pendienteCobroTotal.toFixed(2) }}</strong>
          <span class="kpi-meta">{{ ordenesPendientesCobro.length }} órdenes</span>
        </button>

        <div class="kpi-card">
          <p class="label">Cancelaciones</p>
          <strong class="kpi-monto rojo">${{ canceladasTotalPerdido.toFixed(2) }}</strong>
          <span class="kpi-meta">{{ ordenesCanceladas.length }} órdenes canceladas</span>
        </div>

        <button type="button" class="kpi-card kpi-card-interactivo" :class="{ activo: filtroKpi === 'gastos' }" :disabled="totalGastosTurnoActual <= 0" @click="seleccionarFiltroGastos">
          <p class="label">Gastos</p>
          <strong class="kpi-monto rojo">${{ totalGastosTurnoActual.toFixed(2) }}</strong>
          <span class="kpi-meta">{{ gastosTurnoActual.length }} movimientos de este turno</span>
        </button>
      </section>

      <!-- ───────── Gráficas ───────── -->
      <section v-if="(!esCajero || esAdministrador) && resumenReportesExpandido" class="graficas-grid">
        <div class="grafica-card">
          <div class="grafica-header">
            <div class="grafica-titulo">
              <button type="button" class="rango-flecha" title="Rango anterior" aria-label="Ver rango anterior" @click="irRangoAnterior">
                <ion-icon :icon="chevronBackOutline" />
              </button>
              <strong>{{ desplazamientoRango ? 'Ventas del rango anterior' : 'Ventas de los últimos' }} {{ rango }} días</strong>
              <button type="button" class="rango-flecha" title="Rango siguiente" aria-label="Ver rango siguiente" :disabled="desplazamientoRango === 0" @click="irRangoSiguiente">
                <ion-icon :icon="chevronForwardOutline" />
              </button>
            </div>
            <span class="grafica-total">${{ ventasRangoTotal.toFixed(2) }}</span>
          </div>
          <div class="barras-chart">
            <div v-for="dia in ventasPorDia" :key="dia.label" class="barra-col">
              <div class="barra-wrap">
                <div
                  class="barra"
                  :style="{ height: `${Math.max(4, (dia.total / maxVentaDiaria) * 100)}%` }"
                  :title="`$${dia.total.toFixed(2)}`"
                >
                  <span class="barra-valor">${{ dia.total.toFixed(2) }}</span>
                </div>
              </div>
              <span class="barra-label">{{ dia.label }}</span>
            </div>
          </div>
        </div>

        <div class="grafica-card">
          <div class="grafica-header">
            <strong>Distribución de órdenes</strong>
            <span class="grafica-total">{{ totalEstadosGrafico }} en el rango</span>
          </div>
          <div class="donut-contenedor">
            <div class="donut" :style="{ background: gradienteEstados }">
              <div class="donut-centro">
                <strong>{{ totalEstadosGrafico }}</strong>
                <span>Ordenes</span>
              </div>
            </div>
            <div class="donut-leyenda">
              <div v-for="d in distribucionEstados" :key="d.estado" class="leyenda-item">
                <span class="leyenda-dot" :style="{ background: d.color }"></span>
                <span class="leyenda-label">{{ d.label }}</span>
                <span class="leyenda-valor">{{ d.cantidad }} ({{ d.porcentaje }}%)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ───────── Historial (órdenes / cierres) + Movimientos de caja ───────── -->
      <div v-if="!esCajero || esAdministrador" class="reportes-dos-columnas">
        <!-- Columna izquierda: historial con scroll interno -->
        <section ref="historialCardRef" class="historial-card">
          <div class="historial-header">
            <div class="historial-header-top">
              <strong>{{ vistaHistorial === 'ordenes' ? 'Historial de órdenes' : 'Reportes por fecha' }}</strong>
              <div class="vista-toggle">
                <button
                  type="button"
                  class="vista-toggle-btn"
                  :class="{ active: vistaHistorial === 'ordenes' }"
                  @click="vistaHistorial = 'ordenes'"
                >
                  Órdenes Activas
                </button>
                <button
                  type="button"
                  class="vista-toggle-btn"
                  :class="{ active: vistaHistorial === 'reportes' }"
                  @click="vistaHistorial = 'reportes'"
                >
                  Historico
                </button>
              </div>
            </div>

            <div v-if="vistaHistorial === 'reportes' || vistaHistorial === 'ordenes'" class="search-bar">
              <input
                v-model="busqueda"
                type="text"
                :placeholder="vistaHistorial === 'ordenes'
                  ? 'Buscar por nombre, teléfono o número de orden...'
                  : 'Buscar por cliente, orden o teléfono...'"
              />
            </div>

            <div v-if="vistaHistorial === 'reportes'" class="filtro-fechas">
              <label>
                <span>Filtrar fechas por</span>
                <select v-model="criterioFechaReporte">
                  <option value="creacion">Creación de la orden</option>
                  <option value="pago">Pago realizado</option>
                  <option value="anticipo">Anticipo realizado</option>
                  <option value="entrega">Entrega realizada</option>
                </select>
              </label>
              <label>
                <span>{{ etiquetaFechaReporte }} desde</span>
                <input v-model="fechaDesde" type="date" />
              </label>
              <label>
                <span>{{ etiquetaFechaReporte }} hasta</span>
                <input v-model="fechaHasta" type="date" />
              </label>
            </div>

            <p v-if="vistaHistorial === 'reportes' && criterioFechaReporte !== 'creacion'" class="filtro-ayuda">
              {{ ayudaFechaReporte }}
            </p>

            <div v-if="vistaHistorial === 'reportes'" class="chip-row">
              <button
                v-for="f in filtrosHistorial"
                :key="f.value"
                class="filtro-chip"
                :class="{ active: filtroEstadoReportes === f.value }"
                @click="filtroEstadoReportes = f.value"
              >
                {{ f.label }}
              </button>
            </div>

            <div v-if="vistaHistorial === 'ordenes'" class="chip-row filtros-pago-historial">
              <button
                v-if="filtroKpi || filtroPagoHistorial !== 'todos'"
                type="button"
                class="filtro-chip filtro-restaurar"
                @click="restaurarFiltrosOrdenes"
              >
                Restaurar
              </button>
              <button
                v-for="filtro in filtrosPagoHistorial"
                :key="filtro.value"
                type="button"
                class="filtro-chip"
                :class="[`filtro-pago-${filtro.value}`, { active: filtroPagoHistorial === filtro.value }]"
                @click="filtroPagoHistorial = filtro.value"
              >
                {{ filtro.label }}
              </button>
            </div>
          </div>

          <!-- Vista: Órdenes -->
          <div v-if="vistaHistorial === 'ordenes'" class="historial-scroll">
            <div class="historial-tabla">
              <div class="historial-fila historial-fila-head">
                <span>Orden</span>
                <span>Cliente</span>
                <span>Fecha</span>
                <span>Estado</span>
                <span>Pago</span>
                <span class="alinear-derecha">Valores</span>
              </div>

              <button
                v-for="orden in ordenesHistorialFiltradas"
                :key="orden.id"
                class="historial-fila historial-fila-body"
                :class="{ 'requiere-atencion': tieneAnticiposHuerfanos(orden) || orden.turnoHuerfano }"
                @click="verOrden(orden.id)"
              >
                <strong>
                  {{ orden.numero }}
                  <span v-if="tieneAnticiposHuerfanos(orden) || orden.turnoHuerfano" class="alerta-orden">!</span>
                </strong>
                <span>{{ orden.nombreCliente }}</span>
                <span>{{ formatearFechaCorta(fechaVisibleReporte(orden)) }}</span>
                <span class="pill" :class="`estado-${orden.estado}`">{{ textoEstado(orden.estado) }}</span>
                <span
                  class="pill"
                  :class="(orden.estado === 'cancelada' || orden.estado === 'Cerrada-Cancelada') ? 'pago-vacio' : `pago-${orden.estadoPago}`"
                >
                  {{ (orden.estado === 'cancelada' || orden.estado === 'Cerrada-Cancelada') ? '' : textoEstadoPago(orden.estadoPago) }}
                </span>
                <div class="detalle-pago-historial">
                  <template v-if="orden.estadoPago === 'anticipo'">
                    <span class="valor-pago-linea pago-anticipo"><small>Anticipo</small><strong>${{ montoRecibidoOrden(orden).toFixed(2) }}</strong></span>
                    <span class="valor-pago-linea pago-anticipo"><small>Restante</small><strong>${{ saldoPendienteOrden(orden).toFixed(2) }}</strong></span>
                    <span class="valor-pago-linea pago-anticipo"><small>Total</small><strong>${{ Number(orden.total || 0).toFixed(2) }}</strong></span>
                  </template>
                  <template v-else-if="orden.estadoPago === 'pagado'">
                    <strong class="valor-pago-historial pago-pagado">${{ Number(orden.total || 0).toFixed(2) }}</strong>
                  </template>
                  <template v-else>
                    <strong class="valor-pago-historial pago-porCobrar">${{ Number(orden.total || 0).toFixed(2) }}</strong>
                  </template>
                </div>
              </button>

              <div v-if="ordenesHistorialFiltradas.length === 0" class="historial-vacio">
                No hay órdenes con este filtro de pago.
              </div>
            </div>
          </div>

          <!-- Vista: Reportes por fecha -->
          <div v-else class="historial-scroll">
            <div class="reporte-resumen-grid">
              <div class="reporte-resumen-card entregados">
                <span>Total entregados</span>
                <strong>${{ totalEntregadosReporte.toFixed(2) }}</strong>
              </div>
              <div class="reporte-resumen-card cobrados">
                <span>Total cobrados</span>
                <strong>${{ totalCobradosReporte.toFixed(2) }}</strong>
              </div>
            </div>

            <div class="historial-tabla">
              <div class="historial-fila historial-fila-head">
                <span>Orden</span>
                <span>Cliente</span>
                <span>Fecha</span>
                <span>Estado</span>
                <span>Pago</span>
                <span class="alinear-derecha">Total</span>
              </div>

              <button
                v-for="orden in ordenesReporteFiltradas"
                :key="orden.id"
                class="historial-fila historial-fila-body"
                :class="{ 'requiere-atencion': tieneAnticiposHuerfanos(orden) || orden.turnoHuerfano }"
                @click="verOrden(orden.id)"
              >
                <strong>
                  {{ orden.numero }}
                  <span v-if="tieneAnticiposHuerfanos(orden) || orden.turnoHuerfano" class="alerta-orden">!</span>
                </strong>
                <span>{{ orden.nombreCliente }}</span>
                <span>{{ formatearFechaCorta(orden.createdAt) }}</span>
                <span class="pill" :class="`estado-${orden.estado}`">{{ textoEstado(orden.estado) }}</span>
                <span
                  class="pill"
                  :class="(orden.estado === 'cancelada' || orden.estado === 'Cerrada-Cancelada') ? 'pago-vacio' : `pago-${orden.estadoPago}`"
                >
                  {{ (orden.estado === 'cancelada' || orden.estado === 'Cerrada-Cancelada') ? '' : textoEstadoPago(orden.estadoPago) }}
                </span>
                <strong class="alinear-derecha">${{ orden.total.toFixed(2) }}</strong>
              </button>

              <div v-if="ordenesReporteFiltradas.length === 0" class="historial-vacio">
                No hay órdenes en las fechas seleccionadas.
              </div>
            </div>
          </div>
        </section>

        <!-- Columna derecha: movimientos de caja -->
        <section ref="movimientosCardRef" class="movimientos-card">
          <div class="movimientos-header">
            <strong>Movimientos de caja</strong>
            <span class="grafica-total">{{ gastosTurnoActual.length }} gastos · ${{ totalGastosTurnoActual.toFixed(2) }}</span>
          </div>

          <div class="movimientos-scroll">
            <article v-for="mov in movimientosTurnoActual" :key="mov.id" class="movimiento-item">
              <div class="movimiento-indicador" :class="`tipo-${mov.tipo}`"></div>
              <div class="movimiento-info">
                <div class="movimiento-titulo-row">
                  <strong>{{ etiquetaMovimiento(mov.tipo) }}</strong>
                  <span v-if="mov.tipo === 'gasto' && extraerTipoGasto(mov.concepto).tipo" class="movimiento-tipo-gasto">
                    {{ extraerTipoGasto(mov.concepto).tipo }}
                  </span>
                </div>
                <p>{{ mov.tipo === 'gasto' ? extraerTipoGasto(mov.concepto).motivo : mov.concepto }}</p>
                <small>{{ formatearFechaHora(mov.creadoAt) }} · Caja #{{ mov.numeroCaja || '—' }}</small>
                <small v-if="mov.tipo === 'gasto'" class="movimiento-usuario">
                  Reportado por: {{ mov.usuario || 'Usuario no disponible' }}
                </small>
                <a v-if="mov.comprobanteUrl" :href="mov.comprobanteUrl" target="_blank" rel="noreferrer" class="comprobante-link">Ver foto</a>
              </div>
              <div class="movimiento-acciones">
                <strong class="alinear-derecha">${{ mov.monto.toFixed(2) }}</strong>
                <button 
                  v-if="mov.tipo === 'gasto' && esAdministrador" 
                  class="btn-eliminar-gasto" 
                  @click="eliminarGastoConfirmado(mov.id)"
                  title="Eliminar gasto"
                >
                  <ion-icon :icon="trashOutline" />
                </button>
              </div>
            </article>

            <div v-if="movimientosTurnoActual.length === 0" class="historial-vacio">
              Todavía no hay movimientos de caja registrados en este turno.
            </div>
          </div>
        </section>
      </div>
    </div>

    <OrdenesPage
      v-if="ordenSeleccionadaReporteId"
      :solo-detalle-id="ordenSeleccionadaReporteId"
      :mostrar-restaurar-cerrada="true"
      @cerrado="cerrarModalOrden"
    />

    <ion-modal :is-open="mostrarModalRestaurarOrden" class="modal-confirmacion" @didDismiss="cerrarModalRestaurarOrden">
      <div class="modal-contenido">
        <div class="modal-header">
          <div class="modal-header-icon">↩️</div>
          <div>
            <p class="modal-titulo">Restaurar orden cerrada</p>
            <p class="modal-subtitulo">
              La orden se devolverá a estado pendiente y se eliminará del cierre de caja.
            </p>
          </div>
        </div>

        <p style="margin: 1rem 0; color: #666; font-size: 0.9rem;">
          ⚠️ Esta acción es auditable. Se registrará en los movimientos de caja que esta orden fue restaurada.
        </p>

        <div class="modal-botones">
          <button class="btn-outline" @click="cerrarModalRestaurarOrden">Cancelar</button>
          <button class="btn-principal" :disabled="restaurandoOrden" @click="confirmarRestaurarOrden">
            {{ restaurandoOrden ? 'Restaurando...' : 'Restaurar orden' }}
          </button>
        </div>
      </div>
    </ion-modal>

    <ion-modal v-if="!esCajero || esAdministrador" :is-open="mostrarModalDetalle" class="modal-turno" @didDismiss="mostrarModalDetalle = false">
      <div class="modal-contenido">
        <div class="modal-header">
          <div class="modal-header-left">
            <div class="modal-header-icon">
              <ion-icon :icon="cardOutline" />
            </div>
            <div>
              <p class="modal-titulo">Caja #{{ turno.numeroCaja }}</p>
              <p class="modal-subtitulo">Detalles de la caja aperturada</p>
            </div>
          </div>
          <button class="modal-cerrar" @click="mostrarModalDetalle = false">
            <ion-icon :icon="closeOutline" />
          </button>
        </div>

        <div class="detalle-seccion">
          <p class="detalle-label">Información de la Caja</p>
          <div class="detalle-item">
            <span class="detalle-clave">Número de Caja:</span>
            <span class="detalle-valor">#{{ turno.numeroCaja }}</span>
          </div>
          <div class="detalle-item">
            <span class="detalle-clave">Usuario:</span>
            <span class="detalle-valor">{{ turno.usuario }}</span>
          </div>
          <div class="detalle-item">
            <span class="detalle-clave">Monto Inicial:</span>
            <span class="detalle-valor">${{ turno.apertura.toFixed(2) }}</span>
          </div>
        </div>

        <div class="detalle-seccion">
          <p class="detalle-label">Fecha y Hora</p>
          <div class="detalle-item">
            <span class="detalle-clave">Abierta:</span>
            <span class="detalle-valor">{{ formatearFechaHora(turno.horaInicio) }}</span>
          </div>
          <div class="detalle-item" v-if="turno.cerradoAt">
            <span class="detalle-clave">Cerrada:</span>
            <span class="detalle-valor">{{ formatearFechaHora(turno.cerradoAt) }}</span>
          </div>
          <div class="detalle-item" v-if="turno.saldoCierre !== null">
            <span class="detalle-clave">Monto dejado en caja:</span>
            <span class="detalle-valor">${{ turno.saldoCierre.toFixed(2) }}</span>
          </div>
        </div>

        <div v-if="turno.notas" class="detalle-seccion">
          <p class="detalle-label">Notas</p>
          <p class="detalle-notas">{{ turno.notas }}</p>
        </div>

        <div class="modal-botones">
          <ion-button class="btn-primario" @click="mostrarModalDetalle = false">Cerrar</ion-button>
        </div>
      </div>
    </ion-modal>

    <ion-modal :is-open="mostrarModalTurno" class="modal-turno" @didDismiss="mostrarModalTurno = false">
      <div class="modal-contenido">
        <div class="modal-header">
          <div class="modal-header-left">
            <div class="modal-header-icon">
              <ion-icon :icon="cardOutline" />
            </div>
            <div>
              <p class="modal-titulo">Iniciar turno</p>
              <p class="modal-subtitulo">Cuenta el efectivo en caja y ábrelo</p>
            </div>
          </div>
          <button class="modal-cerrar" @click="mostrarModalTurno = false">
            <ion-icon :icon="closeOutline" />
          </button>
        </div>

        <label class="modal-label">Monto inicial en caja</label>
        <div class="modal-input-monto">
          <span>$</span>
          <input v-model.number="efectivoCajaInicial" type="number" min="0" step="0.01" />
        </div>
        <p v-if="turno.saldoCierre !== null" class="hint-texto">
          El turno anterior dejó ${{ turno.saldoCierre.toFixed(2) }} en caja. Puedes corregir el monto si es necesario.
        </p>
        <p v-else class="hint-texto">Escribe el efectivo que tienes físicamente en la caja al iniciar el turno.</p>

        <template v-if="esAdministrador">
          <label class="modal-label">Fecha de inicio del turno</label>
          <input v-model="fechaAperturaTurno" type="date" class="modal-input-fecha" />
        </template>

        <label class="modal-label">Notas (opcional)</label>
        <textarea
          v-model="notasTurno"
          class="modal-textarea"
          placeholder="Ej: cambio entregado por turno anterior"
        ></textarea>

        <div class="modal-botones">
          <ion-button class="btn-fantasma" @click="mostrarModalTurno = false">Cancelar</ion-button>
          <ion-button class="btn-primario" :disabled="iniciandoTurno" @click="iniciarTurno">
            {{ iniciandoTurno ? 'Iniciando...' : 'Iniciar turno' }}
          </ion-button>
        </div>
      </div>
    </ion-modal>

    <ion-modal v-if="!esCajero || esAdministrador" :is-open="mostrarModalCierreTurno" class="modal-turno" @didDismiss="mostrarModalCierreTurno = false">
      <div class="modal-contenido">
        <div class="modal-header">
          <div class="modal-header-left">
            <div class="modal-header-icon">
              <ion-icon :icon="cardOutline" />
            </div>
            <div>
              <p class="modal-titulo">Cerrar turno</p>
              <p class="modal-subtitulo">Guarda el monto que queda en caja</p>
            </div>
          </div>
          <button class="modal-cerrar" @click="mostrarModalCierreTurno = false">
            <ion-icon :icon="closeOutline" />
          </button>
        </div>

        <label class="modal-label">Monto que se deja en caja</label>
        <div class="modal-input-monto">
          <span>$</span>
          <input v-model.number="montoCierreTurno" type="number" min="0" step="0.01" />
        </div>
        <p class="hint-texto">Este valor quedará guardado para que lo conozca el siguiente turno.</p>

        <template v-if="esAdministrador">
          <label class="modal-label">Fecha de cierre del turno</label>
          <input v-model="fechaCierreTurno" type="date" class="modal-input-fecha" />
        </template>

        <div class="modal-botones">
          <ion-button class="btn-fantasma" @click="mostrarModalCierreTurno = false">Cancelar</ion-button>
          <ion-button class="btn-advertencia" :disabled="cerrandoTurno" @click="confirmarCierreTurno">
            {{ cerrandoTurno ? 'Cerrando...' : 'Cerrar turno' }}
          </ion-button>
        </div>
      </div>
    </ion-modal>

    <ion-modal v-if="!esCajero || esAdministrador" :is-open="mostrarModalHistorialCierre" class="modal-turno" @didDismiss="cerrarModalHistorialCierre">
      <div class="modal-contenido" v-if="cierreSeleccionado">
        <div class="modal-header">
          <div class="modal-header-left">
            <div class="modal-header-icon">
              <ion-icon :icon="cardOutline" />
            </div>
            <div>
              <p class="modal-titulo">Cierre de caja #{{ cierreSeleccionado.numeroCaja }}</p>
              <p class="modal-subtitulo">{{ formatearFechaHora(cierreSeleccionado.cerradoAt) }}</p>
            </div>
          </div>
          <button class="modal-cerrar" @click="cerrarModalHistorialCierre">
            <ion-icon :icon="closeOutline" />
          </button>
        </div>

        <div class="detalle-seccion">
          <p class="detalle-label">Resumen general</p>
          <div class="detalle-item">
            <span class="detalle-clave">Caja:</span>
            <span class="detalle-valor">#{{ cierreSeleccionado.numeroCaja }} ({{ cierreSeleccionado.turnoId }})</span>
          </div>
          <div class="detalle-item">
            <span class="detalle-clave">Usuario:</span>
            <span class="detalle-valor">{{ cierreSeleccionado.usuario }}</span>
          </div>
          <div class="detalle-item">
            <span class="detalle-clave">Apertura:</span>
            <span class="detalle-valor">${{ cierreSeleccionado.apertura.toFixed(2) }}</span>
          </div>
          <div class="detalle-item">
            <span class="detalle-clave">Saldo final:</span>
            <span class="detalle-valor">${{ cierreSeleccionado.saldoCierre.toFixed(2) }}</span>
          </div>
          <div class="detalle-item">
            <span class="detalle-clave">Saldo esperado:</span>
            <span class="detalle-valor">${{ cierreSeleccionado.totales.saldoEsperado.toFixed(2) }}</span>
          </div>
          <div class="detalle-item">
            <span class="detalle-clave">Diferencia:</span>
            <span class="detalle-valor">${{ cierreSeleccionado.totales.diferencia.toFixed(2) }}</span>
          </div>
        </div>

        <div class="detalle-seccion">
          <p class="detalle-label">Totales del turno</p>
          <div class="resumen-cierre-grid">
            <div class="resumen-cierre-card">
              <span>Cobrado</span>
              <strong>${{ cierreSeleccionado.totales.cobrado.toFixed(2) }}</strong>
            </div>
            <div class="resumen-cierre-card">
              <span>Depósitos</span>
              <strong>${{ cierreSeleccionado.totales.depositos.toFixed(2) }}</strong>
            </div>
            <div class="resumen-cierre-card">
              <span>Cancelaciones</span>
              <strong>${{ cierreSeleccionado.totales.cancelaciones.toFixed(2) }}</strong>
            </div>
            <div class="resumen-cierre-card">
              <span>Gastos</span>
              <strong>${{ cierreSeleccionado.totales.gastos.toFixed(2) }}</strong>
            </div>
            <div class="resumen-cierre-card resumen-cierre-destacado">
              <span>Total recaudado</span>
              <strong>${{ cierreSeleccionado.totales.recaudado.toFixed(2) }}</strong>
            </div>
          </div>
        </div>

        <div class="detalle-seccion">
          <p class="detalle-label">Órdenes del turno</p>
          <div class="cierre-lista-mini">
            <div v-for="orden in cierreSeleccionado.ordenes" :key="orden.id" class="cierre-mini-item">
              <strong>{{ orden.numero }}</strong>
              <span>{{ orden.nombreCliente }}</span>
              <span>{{ textoEstado(orden.estado) }}<template v-if="orden.estado !== 'cancelada' && orden.estado !== 'Cerrada-Cancelada'"> · {{ textoEstadoPago(orden.estadoPago) }}</template></span>
              <span>${{ orden.total.toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <div class="detalle-seccion">
          <p class="detalle-label">Movimientos del turno</p>
          <div class="cierre-lista-mini">
            <div v-for="mov in cierreSeleccionado.movimientos.filter((movimiento) => movimiento.tipo !== 'deposito')" :key="mov.id" class="cierre-mini-item">
              <strong>{{ etiquetaMovimiento(mov.tipo) }}</strong>
              <span>
                <span v-if="mov.tipo === 'gasto' && extraerTipoGasto(mov.concepto).tipo" class="movimiento-tipo-gasto movimiento-tipo-gasto-mini">
                  {{ extraerTipoGasto(mov.concepto).tipo }}
                </span>
                {{ mov.tipo === 'gasto' ? extraerTipoGasto(mov.concepto).motivo : mov.concepto }}
              </span>
              <span>{{ formatearFechaHora(mov.creadoAt) }}</span>
              <span class="cierre-movimiento-importe">
                ${{ mov.monto.toFixed(2) }}
                <button
                  v-if="mov.tipo === 'gasto' && esAdministrador"
                  type="button"
                  class="btn-eliminar-gasto btn-eliminar-gasto-cierre"
                  title="Eliminar gasto"
                  @click="eliminarGastoConfirmado(mov.id)"
                >
                  <ion-icon :icon="trashOutline" />
                </button>
              </span>
            </div>
          </div>
        </div>

        <div v-if="cierreSeleccionado.notas" class="detalle-seccion">
          <p class="detalle-label">Notas</p>
          <p class="detalle-notas">{{ cierreSeleccionado.notas }}</p>
        </div>

        <div class="modal-botones">
          <ion-button class="btn-fantasma" @click="cerrarModalHistorialCierre">Cerrar</ion-button>
          <ion-button class="btn-primario" @click="exportarCierrePdf">Exportar PDF</ion-button>
        </div>
      </div>
    </ion-modal>
  </AppShell>
</template>

<script setup lang="ts">
import AppShell from '@/components/AppShell.vue'
import OrdenesPage from '@/views/OrdenesPage.vue'
import { IonButton, IonIcon, IonModal } from '@ionic/vue'
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { searchOutline, cardOutline, timeOutline, eyeOutline, closeOutline, chevronBackOutline, chevronForwardOutline, chevronUpOutline, chevronDownOutline, trashOutline } from 'ionicons/icons'
import { useReportes } from '@/composables/useReportes'
import { useOrdenes } from '@/composables/useOrdenes'
import type { Orden, OrdenEstado, EstadoPago } from '@/composables/useOrdenes'
import { useTurno } from '@/composables/useTurno'
import { useCajaMovimientos } from '@/composables/useCajaMovimientos'
import { useHistorialCierres } from '@/composables/useHistorialCierres'
import {
  fechaHoyCentroamerica,
  finFechaCentroamericaUTC,
  formatearFechaCentroamerica,
  inicioFechaCentroamericaUTC
} from '@/composables/useFechas'

const { turno, abrirTurno, cargarTurno } = useTurno()
const { ordenes, cargarOrdenes, ordenesDelTurnoActual, ventaDelDiaTurnoActual, cantidadOrdenesTurnoActual, restaurarOrden } = useOrdenes()
const {
  movimientos,
  eliminarGasto
} = useCajaMovimientos()

const {
  rango,
  desplazamientoRango,
  irRangoAnterior,
  irRangoSiguiente,
  busqueda,
  ventasHoy,
  ordenesHoy,
  cobradoHoy,
  anticiposHoy,
  ordenesPendientesCobro,
  pendienteCobroTotal,
  ordenesCanceladas,
  canceladasTotalPerdido,
  ventasRangoTotal,
  ventasPorDia,
  maxVentaDiaria,
  distribucionEstados,
  gradienteEstados,
  totalEstadosGrafico,
  historial
} = useReportes()
const { historialCierres, obtenerCierrePorId, registrarCierreTurno, cargarHistorial } = useHistorialCierres()

interface Usuario {
  id?: string
  nombre: string
  correo?: string
  rol?: string
}

const usuario = ref<Usuario>({ nombre: 'Usuario' })
const esCajero = computed(() => {
  const rol = (usuario.value.rol ?? '').toLowerCase()
  return rol === 'cajero' || rol === 'caja'
})
const esAdministrador = computed(() => {
  const rol = (usuario.value.rol ?? '').toLowerCase()
  return rol === 'administrador' || rol === 'admin'
})

onMounted(() => {
  void cargarOrdenes()
  void cargarTurno()

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

const mostrarModalTurno = ref(false)
const mostrarModalDetalle = ref(false)
const mostrarModalCierreTurno = ref(false)
const mostrarModalHistorialCierre = ref(false)
const ordenSeleccionadaReporteId = ref('')
const mostrarModalRestaurarOrden = ref(false)
const ordenRestaurandoId = ref('')
const restaurandoOrden = ref(false)
const efectivoCajaInicial = ref(0)
const notasTurno = ref('')
const montoCierreTurno = ref(0)
const cierreSeleccionadoId = ref('')
const fechaAperturaTurno = ref(fechaHoyCentroamerica())
const fechaCierreTurno = ref(fechaHoyCentroamerica())

// Alterna entre ver el historial de órdenes o el historial de cierres de caja.
// El buscador (busqueda) se comparte entre ambas vistas.
const vistaHistorial = ref<'ordenes' | 'reportes'>('ordenes')
const resumenReportesExpandido = ref(true)

const fechaLocalISO = (fecha: Date) => {
  const year = fecha.getFullYear()
  const month = String(fecha.getMonth() + 1).padStart(2, '0')
  const day = String(fecha.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const fechaHoy = fechaHoyCentroamerica()
const fechaDesde = ref(fechaHoy)
const fechaHasta = ref(fechaHoy)
const criterioFechaReporte = ref<'creacion' | 'pago' | 'anticipo' | 'entrega'>('creacion')
const filtroEstadoReportes = ref<'todos' | OrdenEstado | 'cerradas'>('todos')
const filtroPagoHistorial = ref<'todos' | 'anticipo' | 'porCobrar' | 'pagado'>('todos')
const filtroKpi = ref<'efectivo' | 'cobrado' | 'ventas' | 'anticipo' | 'pendiente' | 'gastos' | null>(null)
const historialCardRef = ref<HTMLElement | null>(null)
const movimientosCardRef = ref<HTMLElement | null>(null)

const seleccionarFiltroKpi = async (filtro: 'efectivo' | 'cobrado' | 'ventas' | 'anticipo' | 'pendiente') => {
  filtroKpi.value = filtroKpi.value === filtro ? null : filtro
  vistaHistorial.value = 'ordenes'
  filtroPagoHistorial.value = 'todos'
  await nextTick()
  historialCardRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const seleccionarFiltroGastos = async () => {
  filtroKpi.value = filtroKpi.value === 'gastos' ? null : 'gastos'
  await nextTick()
  movimientosCardRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const restaurarFiltrosOrdenes = () => {
  filtroKpi.value = null
  filtroPagoHistorial.value = 'todos'
}

const prioridadEstado: Record<string, number> = {
  pendiente: 0,
  en_proceso: 1,
  listo: 2,
  entregado: 3,
  cancelada: 4,
  'Cerrada-Cancelada': 4,
  cerrada: 5
}

const compararOrdenesPorEstado = (a: Orden, b: Orden) => {
  const prioridadA = prioridadEstado[a.estado] ?? 99
  const prioridadB = prioridadEstado[b.estado] ?? 99
  if (prioridadA !== prioridadB) return prioridadA - prioridadB
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
}

const filtrosPagoHistorial: { label: string; value: 'todos' | 'anticipo' | 'porCobrar' | 'pagado' }[] = [
  { label: 'Todas', value: 'todos' },
  { label: 'Anticipo', value: 'anticipo' },
  { label: 'Por cobrar', value: 'porCobrar' },
  { label: 'Pagadas', value: 'pagado' }
]

const etiquetaFechaReporte = computed(() => ({
  creacion: 'Creación',
  pago: 'Pago',
  anticipo: 'Anticipo',
  entrega: 'Entrega'
}[criterioFechaReporte.value]))

const ayudaFechaReporte = computed(() => ({
  creacion: '',
  pago: 'Se muestran únicamente las órdenes pagadas dentro del rango seleccionado.',
  anticipo: 'Se muestran órdenes que recibieron al menos un anticipo dentro del rango seleccionado.',
  entrega: 'Se muestran órdenes entregadas dentro del rango seleccionado.'
}[criterioFechaReporte.value] || ''))

const movimientosDePago = (orden: Orden) =>
  orden.movimientos
    .filter((movimiento) => /^Pago actualizado a pagado(?:\s|$)/i.test(movimiento.texto.trim()))
    .map((movimiento) => movimiento.fecha)

const fechasDelReporte = (orden: Orden) => {
  if (criterioFechaReporte.value === 'pago') {
    return movimientosDePago(orden).length > 0 ? movimientosDePago(orden) : [orden.createdAt]
  }
  if (criterioFechaReporte.value === 'anticipo') {
    return orden.estadoPago === 'anticipo'
      ? orden.anticipos.map((anticipo) => anticipo.fecha)
      : []
  }
  if (criterioFechaReporte.value === 'entrega') return orden.entregadoAt ? [orden.entregadoAt] : []
  return [orden.createdAt]
}

const fechaVisibleReporte = (orden: Orden) =>
  fechasDelReporte(orden).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] || orden.createdAt

const extraerTipoGasto = (concepto: string) => {
  if (!concepto) return { tipo: '', motivo: '' }
  const match = concepto.match(/^Tipo:\s*(.*?)\s*-\s*(.*)$/s)
  if (match) return { tipo: match[1], motivo: match[2] }
  return { tipo: '', motivo: concepto }
}

const turnoActualId = computed(() => (turno.abierto ? turno.id : ''))

const gastosTurnoActual = computed(() =>
  turnoActualId.value ? movimientos.value.filter((movimiento) => movimiento.turnoId === turnoActualId.value && movimiento.tipo === 'gasto') : []
)

const totalGastosTurnoActual = computed(() => gastosTurnoActual.value.reduce((acc, movimiento) => acc + movimiento.monto, 0))

const movimientosTurnoActual = computed(() =>
  turnoActualId.value
    ? [...movimientos.value]
        .filter((movimiento) => movimiento.turnoId === turnoActualId.value && movimiento.tipo !== 'deposito')
        .sort((a, b) => new Date(b.creadoAt).getTime() - new Date(a.creadoAt).getTime())
    : []
)

const ordenesHistorialActual = computed(() =>
  ordenes.value.filter(
    (orden) => orden.estado !== 'cerrada' && orden.estado !== 'Cerrada-Cancelada'
  )
)

const ordenesDelFiltroKpi = computed(() => {
  if (!filtroKpi.value || filtroKpi.value === 'gastos') return ordenesHistorialActual.value

  const ordenesFuente = filtroKpi.value === 'efectivo' || filtroKpi.value === 'cobrado'
    ? ordenesHoy.value
    : filtroKpi.value === 'ventas'
      ? ordenesDelTurnoActual.value
      : filtroKpi.value === 'anticipo'
        ? ordenes.value.filter((orden) =>
            orden.estado !== 'cancelada' &&
            orden.estado !== 'Cerrada-Cancelada' &&
            Number(orden.montoRecibido || 0) > 0 &&
            Number(orden.montoRecibido || 0) < Number(orden.total || 0) &&
            Boolean(turno.id) &&
            orden.anticipos.some((anticipo) => anticipo.turnoId === turno.id)
          )
        : ordenesPendientesCobro.value
  const ids = new Set(ordenesFuente.map((orden) => orden.id))
  return ordenesHistorialActual.value.filter((orden) => ids.has(orden.id))
})

const ordenesHistorialFiltradas = computed(() =>
  (filtroPagoHistorial.value === 'todos'
    ? ordenesDelFiltroKpi.value
    : ordenesDelFiltroKpi.value.filter((orden) => orden.estadoPago === filtroPagoHistorial.value)
  ).sort(compararOrdenesPorEstado)
)

const ordenesReporteFiltradas = computed(() => {
  if (!fechaDesde.value || !fechaHasta.value || fechaDesde.value > fechaHasta.value) return []

  const desde = inicioFechaCentroamericaUTC(fechaDesde.value).getTime()
  const hasta = finFechaCentroamericaUTC(fechaHasta.value).getTime()
  const consulta = busqueda.value.trim().toLowerCase()
  const consultaNumerica = consulta.replace(/\D/g, '')

  return ordenes.value
    .filter((orden) => {
      const fechas = fechasDelReporte(orden).map((fecha) => new Date(fecha).getTime())
      const coincideFecha = fechas.some((fecha) => fecha >= desde && fecha <= hasta)
      let coincideEstado = filtroEstadoReportes.value === 'todos'
        ? true
        : filtroEstadoReportes.value === 'cerradas'
          ? orden.estado === 'cerrada' || orden.estado === 'Cerrada-Cancelada'
          : orden.estado === filtroEstadoReportes.value
      if (criterioFechaReporte.value === 'pago') coincideEstado = orden.estadoPago === 'pagado'
      if (criterioFechaReporte.value === 'anticipo') coincideEstado = orden.estadoPago === 'anticipo'
      const telefono = orden.telefono.replace(/\D/g, '')
      const coincideBusqueda = !consulta || [orden.numero, orden.nombreCliente, orden.telefono]
        .join(' ')
        .toLowerCase()
        .includes(consulta) || (consultaNumerica.length > 0 && telefono.includes(consultaNumerica))

      return coincideFecha && coincideEstado && coincideBusqueda
    })
    .sort((a, b) => {
      const prioridadA = prioridadEstado[a.estado] ?? 99
      const prioridadB = prioridadEstado[b.estado] ?? 99
      if (prioridadA !== prioridadB) return prioridadA - prioridadB
      return new Date(fechaVisibleReporte(b)).getTime() - new Date(fechaVisibleReporte(a)).getTime()
    })
})

const totalEntregadosReporte = computed(() =>
  ordenesReporteFiltradas.value
    .filter((orden) => orden.estado === 'entregado')
    .reduce((total, orden) => total + Number(orden.total || 0), 0)
)

const totalCobradosReporte = computed(() =>
  ordenesReporteFiltradas.value
    .filter((orden) => orden.estado !== 'cancelada' && orden.estado !== 'Cerrada-Cancelada')
    .reduce((total, orden) => total + Number(orden.montoRecibido || 0), 0)
)

const saldoPendienteOrden = (orden: { total: number; montoRecibido: number }) =>
  Math.max(0, Number(orden.total) - Number(orden.montoRecibido || 0))

const montoRecibidoOrden = (orden: { montoRecibido: number }) => Number(orden.montoRecibido || 0)

const tieneAnticiposHuerfanos = (orden?: Pick<Orden, 'anticipos'> | null) =>
  Array.isArray(orden?.anticipos) && orden.anticipos.some((anticipo) => anticipo.cierreHuerfano === true)

// El buscador es general: en la vista de Cierres filtra por caja/usuario en vez de por cliente.
const cierresFiltrados = computed(() => {
  const consulta = busqueda.value.trim().toLowerCase()
  if (!consulta) return historialCierres.value

  return historialCierres.value.filter((cierre) =>
    [`caja ${cierre.numeroCaja}`, cierre.turnoId, cierre.usuario, cierre.notas]
      .join(' ')
      .toLowerCase()
      .includes(consulta)
  )
})

const cierreSeleccionado = computed(() =>
  cierreSeleccionadoId.value ? obtenerCierrePorId(cierreSeleccionadoId.value) : null
)

const formatearFechaHora = (fecha: string | null) => {
  if (!fecha) return 'No disponible'
  const fechaFormato = formatearFechaCentroamerica(fecha, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  const horaFormato = formatearFechaCentroamerica(fecha, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
  return `${fechaFormato} a las ${horaFormato}`
}

const ahora = ref(new Date())
let relojId: ReturnType<typeof setInterval> | null = null

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
  if (Number.isNaN(inicio.getTime())) return '00 h 00 min'
  const diffMs = ahora.value.getTime() - inicio.getTime()
  const totalMinutos = Math.max(0, Math.floor(diffMs / 60000))
  const dias = Math.floor(totalMinutos / (24 * 60))
  const horas = Math.floor((totalMinutos % (24 * 60)) / 60)
  const minutos = totalMinutos % 60
  const tiempo = `${String(horas).padStart(2, '0')} h ${String(minutos).padStart(2, '0')} min`

  return dias > 0 ? `${dias} día${dias === 1 ? '' : 's'}, ${tiempo}` : tiempo
})

const iniciandoTurno = ref(false)
const cerrandoTurno = ref(false)

const abrirModalTurno = () => {
  efectivoCajaInicial.value = turno.saldoCierre ?? 0
  notasTurno.value = ''
  fechaAperturaTurno.value = fechaHoyCentroamerica()
  mostrarModalTurno.value = true
}

const iniciarTurno = async () => {
  if (iniciandoTurno.value) return
  iniciandoTurno.value = true

  try {
    await abrirTurno({
      usuario: usuario.value.nombre || 'Caja',
      apertura: efectivoCajaInicial.value || 0,
      notas: notasTurno.value,
      usuarioRol: usuario.value.rol,
      ...(esAdministrador.value ? { fecha: fechaAperturaTurno.value } : {})
    })
    mostrarModalTurno.value = false
  } catch (error: any) {
    window.alert(error.message || 'No se pudo abrir el turno de caja.')
  } finally {
    iniciandoTurno.value = false
  }
}

const terminarTurno = () => {
  if (esCajero.value || cerrandoTurno.value) return
  montoCierreTurno.value = turno.saldoCierre ?? turno.apertura
  fechaCierreTurno.value = fechaHoyCentroamerica()
  mostrarModalCierreTurno.value = true
}

const confirmarCierreTurno = async () => {
  if (cerrandoTurno.value) return
  cerrandoTurno.value = true

  try {
    const creado = await registrarCierreTurno(
      montoCierreTurno.value,
      notasTurno.value,
      esAdministrador.value ? fechaCierreTurno.value : undefined,
      usuario.value.rol
    )
    if (!creado) return
  } catch (error) {
    window.alert(error instanceof Error ? error.message : 'No se pudo guardar el cierre de caja.')
    return
  } finally {
    cerrandoTurno.value = false
  }

  mostrarModalCierreTurno.value = false
}

const verDetalleTurno = () => {
  mostrarModalDetalle.value = true
}

const abrirDetalleCierre = (id: string) => {
  cierreSeleccionadoId.value = id
  mostrarModalHistorialCierre.value = true
}

const cerrarModalHistorialCierre = () => {
  mostrarModalHistorialCierre.value = false
  cierreSeleccionadoId.value = ''
}

const eliminarGastoConfirmado = async (id: string) => {
  const confirmacion = window.confirm('¿Estás seguro de que deseas eliminar este gasto? Esta acción no se puede deshacer.')
  if (!confirmacion) return

  try {
    await eliminarGasto(id)
    await cargarHistorial()
  } catch (error) {
    window.alert(error instanceof Error ? error.message : 'No se pudo eliminar el gasto.')
  }
}

const exportarCierrePdf = () => {
  const cierre = cierreSeleccionado.value
  if (!cierre || typeof window === 'undefined') return

  const ventana = window.open('', '_blank', 'width=980,height=1240')
  if (!ventana) return

  const filaOrdenes = cierre.ordenes
    .map(
      (orden) => `
        <tr>
          <td>${orden.numero}</td>
          <td>${orden.nombreCliente}</td>
          <td>${textoEstado(orden.estado)}</td>
          <td>${orden.estado === 'cancelada' || orden.estado === 'Cerrada-Cancelada' ? '' : textoEstadoPago(orden.estadoPago)}</td>
          <td>$${orden.total.toFixed(2)}</td>
        </tr>
      `
    )
    .join('')

  const filaMovimientos = cierre.movimientos.filter((movimiento) => movimiento.tipo !== 'deposito')
    .map(
      (movimiento) => `
        <tr>
          <td>${etiquetaMovimiento(movimiento.tipo)}</td>
          <td>${movimiento.concepto}</td>
          <td>${formatearFechaHora(movimiento.creadoAt)}</td>
          <td>$${movimiento.monto.toFixed(2)}</td>
        </tr>
      `
    )
    .join('')

  ventana.document.write(`
    <html>
      <head>
        <title>Cierre caja #${cierre.numeroCaja} (${cierre.turnoId}) - Lavandería Salinas</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 28px; color: #0a1f38; background: #f5f9fc; }
          .sheet { max-width: 920px; margin: 0 auto; background: #ffffff; border: 1px solid #dbe7f0; border-radius: 20px; padding: 24px; }
          .hero { background: linear-gradient(135deg, #123a66, #0d2b4e); color: #fff; border-radius: 16px; padding: 18px; margin-bottom: 18px; }
          .hero h1 { margin: 0 0 6px; }
          .hero p { margin: 0; opacity: 0.9; }
          .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin: 18px 0; }
          .card { border: 1px solid #dbe7f0; border-radius: 14px; padding: 14px; background: #fbfdfe; }
          .card strong { display: block; margin-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { padding: 10px 8px; border-bottom: 1px solid #e6edf3; text-align: left; font-size: 0.92rem; }
          th { color: #58738f; text-transform: uppercase; font-size: 0.76rem; letter-spacing: 0.04em; }
          .section { margin-top: 18px; }
          .section h2 { margin: 0 0 10px; font-size: 1rem; }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="hero">
            <h1>Cierre de caja #${cierre.numeroCaja}</h1>
            <p>${cierre.usuario} · ${formatearFechaHora(cierre.cerradoAt)}</p>
          </div>

          <div class="grid">
            <div class="card"><strong>Apertura</strong>$${cierre.apertura.toFixed(2)}</div>
            <div class="card"><strong>Saldo final</strong>$${cierre.saldoCierre.toFixed(2)}</div>
            <div class="card"><strong>Cobrado</strong>$${cierre.totales.cobrado.toFixed(2)}</div>
            <div class="card"><strong>Depósitos</strong>$${cierre.totales.depositos.toFixed(2)}</div>
            <div class="card"><strong>Cancelaciones</strong>$${cierre.totales.cancelaciones.toFixed(2)}</div>
            <div class="card"><strong>Gastos</strong>$${cierre.totales.gastos.toFixed(2)}</div>
            <div class="card"><strong>Total recaudado</strong>$${cierre.totales.recaudado.toFixed(2)}</div>
            <div class="card"><strong>Diferencia</strong>$${cierre.totales.diferencia.toFixed(2)}</div>
          </div>

          <div class="section">
            <h2>Órdenes del turno</h2>
            <table>
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Cliente</th>
                  <th>Estado</th>
                  <th>Pago</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>${filaOrdenes}</tbody>
            </table>
          </div>

          <div class="section">
            <h2>Movimientos del turno</h2>
            <table>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Concepto</th>
                  <th>Fecha</th>
                  <th>Monto</th>
                </tr>
              </thead>
              <tbody>${filaMovimientos}</tbody>
            </table>
          </div>
        </div>
      </body>
    </html>
  `)
  ventana.onload = () => {
    ventana.print()
    setTimeout(() => ventana.close(), 250)
  }
  ventana.document.close()
}

const filtrosHistorial: { label: string; value: 'todos' | OrdenEstado | 'cerradas' }[] = [
  { label: 'Todas', value: 'todos' },
  { label: 'Pendiente', value: 'pendiente' },
  { label: 'En proceso', value: 'en_proceso' },
  { label: 'Listo', value: 'listo' },
  { label: 'Entregado', value: 'entregado' },
  { label: 'Canceladas', value: 'cancelada' },
  { label: 'Cerradas', value: 'cerradas' }
]

const textoEstado = (estado: OrdenEstado) => {
  const map: Record<OrdenEstado, string> = {
    pendiente: 'Pendiente',
    en_proceso: 'En proceso',
    listo: 'Listo',
    entregado: 'Entregado',
    cerrada: 'Cerrada',
    cancelada: 'Cancelada',
    'Cerrada-Cancelada': 'Cerrada-Cancelada'
  }
  return map[estado]
}

const textoEstadoPago = (estado: EstadoPago) => {
  const map: Record<EstadoPago, string> = {
    porCobrar: 'Por cobrar',
    anticipo: 'Anticipo',
    pagado: 'Pagado'
  }
  return map[estado]
}

const formatearFechaCorta = (valor: string) =>
  formatearFechaCentroamerica(valor, { day: '2-digit', month: 'short', year: 'numeric' })

const etiquetaMovimiento = (tipo: 'gasto' | 'deposito' | 'cierre') => {
  const map = {
    gasto: 'Gasto',
    deposito: 'Depósito',
    cierre: 'Cierre'
  } as const
  return map[tipo]
}

const verOrden = (id: string) => {
  ordenSeleccionadaReporteId.value = id
}

const cerrarModalOrden = () => {
  ordenSeleccionadaReporteId.value = ''
}

const abrirModalRestaurarOrden = (id: string) => {
  ordenRestaurandoId.value = id
  mostrarModalRestaurarOrden.value = true
}

const cerrarModalRestaurarOrden = () => {
  mostrarModalRestaurarOrden.value = false
  ordenRestaurandoId.value = ''
}

const confirmarRestaurarOrden = async () => {
  if (!ordenRestaurandoId.value || restaurandoOrden.value) return

  restaurandoOrden.value = true
  try {
    const ordenRestaurada = await restaurarOrden(ordenRestaurandoId.value)
    if (!ordenRestaurada) {
      window.alert('No se pudo restaurar la orden. Intenta nuevamente.')
      return
    }

    window.alert('Orden restaurada exitosamente a estado pendiente.')
    cerrarModalRestaurarOrden()
    void cargarOrdenes()
  } catch (error) {
    window.alert(error instanceof Error ? error.message : 'No se pudo restaurar la orden.')
  } finally {
    restaurandoOrden.value = false
  }
}
</script>

<style scoped>
.force-light {
  --ion-background-color: #ffffff;
  --ion-text-color: #0a1f38;
  color-scheme: light;
}

.reportes-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 100%;
}


.reportes-dos-columnas {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 20px;
  align-items: start;
}

@media (max-width: 900px) {
  .reportes-dos-columnas {
    grid-template-columns: 1fr;
  }
}

.turno-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(18, 58, 102, 0.08), rgba(18, 58, 102, 0.02));
  border: 1px solid rgba(18, 58, 102, 0.12);
  box-shadow: 0 10px 24px rgba(10, 31, 56, 0.06);
}

.turno-panel-left {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.turno-panel-icon {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: #123a66;
  color: #ffffff;
  font-size: 24px;
  flex: 0 0 auto;
}

.turno-panel-label {
  margin: 0 0 4px;
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #4f6d8d;
}

.turno-panel h2 {
  margin: 0;
  color: #0a1f38;
  font-size: clamp(1.2rem, 2vw, 1.55rem);
  font-weight: 900;
}

.turno-panel-meta {
  margin: 6px 0 0;
  color: #58738f;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.92rem;
  font-weight: 600;
  flex-wrap: wrap;
}

.turno-panel-meta ion-icon {
  font-size: 18px;
}

.turno-panel-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.turno-panel-restriccion {
  margin: 0;
  font-size: 0.84rem;
  font-weight: 700;
  color: #4a627e;
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
}

.header-row h1 {
  margin: 0;
  font-size: clamp(1.8rem, 2.5vw, 2.6rem);
  color: #0a1f38;
  font-weight: 900;
}

.toggle-resumen-reportes {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  margin-left: auto;
  border: 1px solid rgba(18, 58, 102, 0.16);
  border-radius: 10px;
  background: #ffffff;
  color: #123a66;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease;
}

.toggle-resumen-reportes:hover {
  background: #eef5fa;
  transform: translateY(-1px);
}

.chip-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filtro-chip {
  padding: 8px 16px;
  border-radius: 999px;
  border: 1px solid rgba(10, 31, 56, 0.1);
  background: #ffffff;
  color: #123a66;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.85rem;
}

.filtro-chip.active {
  background: #123a66;
  border-color: #123a66;
  color: #ffffff;
}

.filtros-pago-historial {
  padding-top: 2px;
}

.filtros-pago-historial .filtro-chip.active.filtro-pago-anticipo,
.filtros-pago-historial .filtro-chip.active.filtro-pago-porCobrar {
  background: #d97706;
  border-color: #d97706;
}

.filtros-pago-historial .filtro-chip.active.filtro-pago-anticipo {
  background: #2b8da0;
  border-color: #2b8da0;
}

.filtros-pago-historial .filtro-chip.active.filtro-pago-pagado {
  background: #15803d;
  border-color: #15803d;
}

/* ── KPIs ── */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 14px;
}

.kpi-card {
  border: 1px solid rgba(10, 31, 56, 0.08);
  border-radius: 16px;
  padding: 16px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.kpi-card-interactivo {
  width: 100%;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
}

.kpi-card-interactivo:hover,
.kpi-card-interactivo.activo {
  border-color: rgba(22, 139, 131, 0.45);
  box-shadow: 0 8px 18px rgba(18, 58, 102, 0.1);
  transform: translateY(-1px);
}

.kpi-card-interactivo:disabled {
  cursor: default;
  opacity: 0.62;
  box-shadow: none;
  transform: none;
}

.label {
  margin: 0;
  color: #9aaaba;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.7rem;
  font-weight: 800;
}

.kpi-monto {
  font-size: 1.4rem;
  color: #123a66;
}

.kpi-monto.verde {
  color: #16a34a;
}

.kpi-monto.gris {
  color: #535b56;
}

.kpi-monto.azul {
  color: #123a66;
}

.kpi-monto.ambar {
  color: #a5791f;
}

.kpi-monto.rojo {
  color: #dc2626;
}

.kpi-meta {
  color: #7c8fa6;
  font-size: 0.78rem;
}

.modal-input-fecha {
  width: 100%;
  min-height: 48px;
  box-sizing: border-box;
  padding: 11px 14px;
  border: 1.5px solid #c9dce9;
  border-radius: 13px;
  background: #ffffff;
  color: #0a1f38;
  color-scheme: light;
  font: inherit;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  outline: none;
  cursor: pointer;
  box-shadow: 0 5px 14px rgba(10, 31, 56, 0.05);
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.modal-input-fecha:hover {
  border-color: #7dbbd8;
  background: #fbfdff;
}

.modal-input-fecha:focus {
  border-color: #168b83;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(22, 139, 131, 0.14), 0 8px 18px rgba(10, 31, 56, 0.08);
}

.modal-input-fecha::-webkit-calendar-picker-indicator {
  padding: 5px;
  border-radius: 8px;
  cursor: pointer;
  filter: invert(23%) sepia(24%) saturate(1333%) hue-rotate(164deg) brightness(86%);
}

@media (max-width: 520px) {
  .modal-input-fecha {
    min-height: 50px;
    font-size: 0.95rem;
  }
}

/* ── Gráficas ── */
.graficas-grid {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 14px;
  align-items: stretch;
}

@media (max-width: 900px) {
  .graficas-grid {
    grid-template-columns: 1fr;
  }
}

.grafica-card {
  border: 1px solid rgba(10, 31, 56, 0.08);
  border-radius: 18px;
  padding: 16px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.grafica-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #edf1f4;
}

.grafica-header strong {
  color: #0a1f38;
  font-size: 0.92rem;
}

.grafica-titulo {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.rango-flecha {
  display: grid;
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  place-items: center;
  border: 1px solid #dbe5ed;
  border-radius: 5px;
  background: #fff;
  color: #123a66;
  cursor: pointer;
}

.rango-flecha:hover:not(:disabled),
.rango-flecha:focus-visible:not(:disabled) {
  background: #eef8f6;
  outline: 0;
}

.rango-flecha:disabled {
  color: #b8c5cf;
  cursor: not-allowed;
}

.grafica-total {
  margin-left: 14px;
  padding: 6px 10px;
  border-radius: 7px;
  background: #edf8f0;
  color: #16a34a;
  font-weight: 800;
  font-size: 0.85rem;
  white-space: nowrap;
}

.barras-chart {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 190px;
  padding: 26px 4px 0;
  border-bottom: 1px solid #dbe5ed;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0,
    transparent 38px,
    rgba(18, 58, 102, .055) 39px,
    transparent 40px
  );
  box-sizing: border-box;
}

.barra-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  height: 100%;
}

.barra-wrap {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.barra {
  position: relative;
  width: min(100%, 46px);
  background: linear-gradient(180deg, #66c2b8 0%, #168b83 48%, #123a66 100%);
  border: 1px solid rgba(18, 58, 102, .18);
  border-radius: 7px 7px 2px 2px;
  min-height: 4px;
  box-shadow: 0 5px 10px rgba(18, 58, 102, .16);
  transition: height 0.2s ease, filter 0.2s ease;
}

.barra:hover {
  filter: brightness(1.08);
}

.barra-valor {
  position: absolute;
  bottom: calc(100% + 7px);
  left: 50%;
  color: #123a66;
  font-size: 0.64rem;
  font-weight: 800;
  transform: translateX(-50%);
  white-space: nowrap;
}

.barra-label {
  padding-top: 4px;
  font-size: 0.64rem;
  color: #9aaaba;
  text-align: center;
}

.donut-contenedor {
  display: flex;
  align-items: center;
  gap: 16px;
}

.donut {
  width: 108px;
  height: 108px;
  border-radius: 50%;
  flex-shrink: 0;
  display: grid;
  place-items: center;
}

.donut-centro {
  width: 66px;
  height: 66px;
  border-radius: 50%;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.donut-centro strong {
  font-size: 1.1rem;
  color: #0a1f38;
}

.donut-centro span {
  font-size: 0.66rem;
  color: #9aaaba;
}

.donut-leyenda {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.leyenda-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: #4a627e;
}

.leyenda-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
}

.leyenda-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.leyenda-valor {
  color: #9aaaba;
  font-weight: 700;
  flex-shrink: 0;
}

/* ── Historial (tarjeta con scroll interno) ── */
.historial-card,
.movimientos-card {
  scroll-margin-top: 20px;
  border: 1px solid rgba(10, 31, 56, 0.08);
  border-radius: 18px;
  padding: 16px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}

.historial-header {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.historial-header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.historial-header-top strong {
  color: #0a1f38;
  font-size: 0.98rem;
}

.vista-toggle {
  display: inline-flex;
  padding: 3px;
  border-radius: 12px;
  background: rgba(18, 58, 102, 0.06);
  gap: 2px;
}

.vista-toggle-btn {
  border: none;
  background: transparent;
  padding: 6px 14px;
  border-radius: 9px;
  font-weight: 800;
  font-size: 0.8rem;
  color: #4a627e;
  cursor: pointer;
}

.vista-toggle-btn.active {
  background: #123a66;
  color: #ffffff;
}

.filtro-fechas {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.filtro-fechas label {
  display: flex;
  flex-direction: column;
  gap: 5px;
  color: #5c7289;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.filtro-fechas input,
.filtro-fechas select {
  width: 100%;
  border: 1px solid rgba(10, 31, 56, 0.12);
  border-radius: 10px;
  padding: 9px 10px;
  color: #0a1f38;
  background: #ffffff;
  font: inherit;
  text-transform: none;
  letter-spacing: normal;
}

.filtro-ayuda {
  margin: 8px 0 0;
  color: #5c7289;
  font-size: 0.76rem;
}

.reporte-resumen-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}

.reporte-resumen-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(10, 31, 56, 0.1);
  background: #ffffff;
}

.reporte-resumen-card span {
  color: #5c7289;
  font-size: 0.78rem;
  font-weight: 800;
}

.reporte-resumen-card strong {
  font-size: 1.12rem;
}

.reporte-resumen-card.entregados strong {
  color: #15803d;
}

.reporte-resumen-card.cobrados strong {
  color: #2563eb;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(10, 31, 56, 0.1);
  border-radius: 12px;
  padding: 8px 12px;
  color: #4a627e;
}

.search-bar input {
  border: none;
  outline: none;
  flex: 1;
  background: transparent;
  color: #0a1f38;
  font-size: 0.88rem;
}

/* Contenedor con scroll interno: la tarjeta no crece indefinidamente con el historial */
.historial-scroll,
.movimientos-scroll {
  max-height: 520px;
  overflow-y: auto;
  padding-right: 4px;
}

.historial-tabla {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.historial-fila {
  display: grid;
  grid-template-columns: 90px 1.4fr 110px 120px 110px minmax(145px, 0.9fr);
  gap: 10px;
  align-items: center;
  padding: 10px 8px;
  border-radius: 10px;
  font-size: 0.85rem;
  color: #4a627e;
}

.historial-fila-head {
  position: sticky;
  top: 0;
  background: #ffffff;
  z-index: 1;
  color: #9aaaba;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 800;
}

.historial-fila-body {
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  border-bottom: 1px solid rgba(10, 31, 56, 0.05);
  width: 100%;
}

.historial-fila-body:hover {
  background: rgba(102, 194, 184, 0.06);
}

.historial-fila-body.requiere-atencion {
  background: rgba(239, 68, 68, 0.08);
}

.historial-fila-body.requiere-atencion:hover {
  background: rgba(239, 68, 68, 0.15);
}

.historial-fila-body strong {
  color: #0a1f38;
  display: flex;
  align-items: center;
  gap: 6px;
}

.alerta-orden {
  color: #dc2626;
  font-weight: 700;
  font-size: 1.1em;
  line-height: 1;
}

.alinear-derecha {
  text-align: right;
}

.pill {
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 0.7rem;
  font-weight: 800;
  width: fit-content;
}

.estado-pendiente {
  background: rgba(240, 196, 25, 0.16);
  color: #a5791f;
}

.estado-en_proceso {
  background: rgba(59, 130, 246, 0.14);
  color: #1d4ed8;
}

.estado-listo {
  background: rgba(22, 163, 74, 0.12);
  color: #15803d;
}

.estado-entregado {
  background: rgba(124, 201, 215, 0.16);
  color: #2b8da0;
}

.estado-cerrada {
  background: rgba(107, 114, 128, 0.14);
  color: #4b5563;
}

.estado-cancelada {
  background: rgba(220, 38, 38, 0.12);
  color: #dc2626;
}

.pago-porCobrar {
  background: rgba(217, 119, 6, 0.14);
  color: #c2410c;
}

.pago-anticipo {
  background: rgba(43, 141, 160, 0.14);
  color: #2b8da0;
}

.pago-pagado {
  background: rgba(22, 163, 74, 0.12);
  color: #15803d;
}

.pago-vacio {
  padding: 0;
  min-height: 0;
  background: transparent;
  color: transparent;
}

.detalle-pago-historial {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  min-width: 0;
}

.detalle-pago-historial small {
  color: #5c7289;
  font-size: 0.7rem;
  white-space: nowrap;
}

.valor-pago-historial {
  padding: 0;
  background: transparent;
  font-size: 0.78rem;
  white-space: nowrap;
}

.valor-pago-linea {
  display: flex;
  align-items: baseline;
  justify-content: flex-end;
  gap: 5px;
  background: transparent;
  white-space: nowrap;
}

.valor-pago-linea small {
  color: inherit;
  font-size: 0.68rem;
}

.valor-pago-linea strong {
  font-size: 0.78rem;
}

.historial-fila-body .valor-pago-linea.pago-anticipo,
.historial-fila-body .valor-pago-linea.pago-anticipo strong,
.historial-fila-body .valor-pago-linea.pago-anticipo small {
  color: #2b8da0;
}

.historial-fila-body strong.valor-pago-historial.pago-porCobrar {
  color: #c2410c;
}

.historial-fila-body strong.valor-pago-historial.pago-pagado {
  color: #15803d;
}

.historial-vacio {
  text-align: center;
  color: #9fb4c9;
  padding: 24px;
}

/* ── Cierres ── */
.cierres-lista {
  display: grid;
  gap: 10px;
}

.cierre-item {
  display: grid;
  gap: 8px;
  text-align: left;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid rgba(18, 58, 102, 0.10);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(245, 249, 252, 0.96));
  box-shadow: 0 10px 20px rgba(10, 31, 56, 0.05);
  cursor: pointer;
  width: 100%;
}

.cierre-item-top,
.cierre-item-meta,
.cierre-item-stats {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.cierre-item-top {
  justify-content: space-between;
}

.cierre-item-top strong {
  color: #0a1f38;
}

.cierre-item-top span {
  font-weight: 900;
  color: #123a66;
}

.cierre-item-meta,
.cierre-item-stats {
  color: #58738f;
  font-size: 0.86rem;
}

.cierre-item-stats span {
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(18, 58, 102, 0.06);
}

.resumen-cierre-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
}

.resumen-cierre-card {
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(18, 58, 102, 0.10);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(245, 249, 252, 0.96));
  box-shadow: 0 8px 18px rgba(10, 31, 56, 0.04);
}

.resumen-cierre-card span {
  display: block;
  color: #7c8fa6;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}

.resumen-cierre-card strong {
  color: #0a1f38;
  font-size: 1rem;
}

.cierre-lista-mini {
  display: grid;
  gap: 8px;
}

.cierre-mini-item {
  display: grid;
  grid-template-columns: 80px minmax(0, 1fr) auto auto;
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(18, 58, 102, 0.08);
  background: linear-gradient(180deg, rgba(245, 249, 252, 0.98), rgba(235, 243, 250, 0.94));
}

.cierre-mini-item strong {
  color: #0a1f38;
}

.cierre-mini-item span {
  color: #58738f;
  font-size: 0.85rem;
}

/* ── Movimientos de caja ── */
.movimientos-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.movimientos-header strong {
  color: #0a1f38;
  font-size: 0.98rem;
}

.movimientos-lista,
.movimientos-scroll {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.movimiento-item {
  display: grid;
  grid-template-columns: 10px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 12px 10px;
  border-radius: 14px;
  border: 1px solid rgba(10, 31, 56, 0.06);
  color: #f31518;
  background: #fbfdff;
}

.movimiento-acciones {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-eliminar-gasto {
  border: none;
  background: rgba(220, 38, 38, 0.1);
  color: #dc2626;
  padding: 6px 8px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.btn-eliminar-gasto:hover {
  background: rgba(220, 38, 38, 0.2);
  transform: scale(1.05);
}

.btn-eliminar-gasto ion-icon {
  font-size: 16px;
}

.movimiento-indicador {
  width: 10px;
  height: 10px;
  border-radius: 999px;
}

.tipo-gasto {
  background: #dc2626;
}

.tipo-deposito {
  background: #16a34a;
}

.tipo-cierre {
  background: #d97706;
}

.movimiento-info {
  min-width: 0;
}

.movimiento-info strong {
  display: block;
  color: #0a1f38;
  font-size: 0.9rem;
}

.movimiento-info p {
  margin: 2px 0 3px;
  color: #4f6d8d;
  font-size: 0.84rem;
}

.movimiento-info small {
  color: #9aaaba;
}

.movimiento-info .movimiento-usuario {
  display: block;
  margin-top: 4px;
  color: #168b83;
  font-weight: 800;
}

/* ── Modales ── */
.modal-turno {
  --width: min(92vw, 460px);
  --height: auto;
  --border-radius: 22px;
  --backdrop-opacity: 0.42;
}

.modal-confirmacion {
  --width: min(92vw, 460px);
  --height: auto;
  --max-height: 90vh;
  --border-radius: 22px;
  --backdrop-opacity: 0.42;
}

.modal-contenido {
  background: linear-gradient(180deg, #ffffff 0%, #f7fafc 100%);
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.modal-turno .modal-contenido {
  max-height: 88vh;
  overflow: auto;
}

.modal-confirmacion .modal-contenido {
  max-height: 90vh;
  overflow: auto;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.modal-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-header-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, rgba(18, 58, 102, 0.12), rgba(22, 163, 74, 0.1));
  color: #123a66;
  font-size: 22px;
}

.modal-titulo {
  margin: 0;
  font-size: 1.08rem;
  font-weight: 900;
  color: #0a1f38;
}

.modal-subtitulo {
  margin: 3px 0 0;
  color: #6d829c;
  font-size: 0.88rem;
}

.modal-cerrar {
  border: none;
  background: transparent;
  color: #9fb4c9;
  cursor: pointer;
  font-size: 22px;
}

.modal-label {
  font-size: 0.78rem;
  font-weight: 900;
  color: #4a627e;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.modal-input-monto {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1.5px solid rgba(18, 58, 102, 0.18);
  border-radius: 14px;
  padding: 10px 14px;
  background: #ffffff;
  color: #0a1f38;
  font-weight: 800;
}

.modal-input-monto input {
  border: none;
  outline: none;
  flex: 1;
  font: inherit;
  font-weight: 800;
  background: transparent;
}

.hint-texto {
  margin: -4px 0 0;
  font-size: 0.8rem;
  color: #7c8fa6;
}

.detalle-seccion {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detalle-label {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 900;
  color: #9aaaba;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.detalle-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.detalle-clave {
  color: #58738f;
  font-size: 0.88rem;
}

.detalle-valor {
  color: #0a1f38;
  font-weight: 800;
  font-size: 0.9rem;
}

.detalle-notas {
  margin: 0;
  color: #4a627e;
  font-size: 0.88rem;
  white-space: pre-wrap;
}

.modal-textarea {
  border: 1.5px solid rgba(18, 58, 102, 0.18);
  border-radius: 14px;
  padding: 10px 14px;
  background: #ffffff;
  color: #0a1f38;
  font: inherit;
  min-height: 72px;
  resize: vertical;
}

.modal-botones {
  display: flex;
  gap: 10px;
  margin-top: 6px;
}

.modal-botones ion-button {
  flex: 1;
}

.modal-botones .btn-outline,
.modal-botones .btn-principal {
  flex: 1;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.modal-botones .btn-outline {
  background: transparent;
  color: #6d829c;
  border: 1px solid #dce4eb;
}

.modal-botones .btn-outline:hover {
  background: #f0f4f8;
  border-color: #c1cdd7;
}

.modal-botones .btn-principal {
  background: #16a34a;
  color: #ffffff;
}

.modal-botones .btn-principal:hover:not(:disabled) {
  background: #15803d;
}

.modal-botones .btn-principal:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.modal-confirmacion .modal-header-icon {
  font-size: 28px;
}

.btn-fantasma {
  --background: transparent;
  --color: #123a66;
  --border-width: 1px;
  --border-style: solid;
  --border-color: rgba(18, 58, 102, 0.22);
  --border-radius: 14px;
  font-weight: 800;
}

.btn-primario {
  --background: #123a66;
  --background-hover: #0d2b4e;
  --color: #ffffff;
  --border-radius: 14px;
  font-weight: 800;
}

.btn-advertencia {
  --background: #d97706;
  --background-hover: #c46a04;
  --color: #ffffff;
  --border-radius: 14px;
  font-weight: 800;
}

.turno-panel-actions ion-button {
  min-width: 116px;
  --padding-start: 14px;
  --padding-end: 14px;
  --padding-top: 10px;
  --padding-bottom: 10px;
  font-size: 0.92rem;
}

@media (max-width: 700px) {
  .turno-panel-actions ion-button {
    min-width: 0;
    width: auto;
    --padding-start: 12px;
    --padding-end: 12px;
    --padding-top: 8px;
    --padding-bottom: 8px;
    font-size: 0.84rem;
  }

  .turno-panel-actions {
    gap: 8px;
  }

  .kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .historial-fila {
    grid-template-columns: 68px minmax(0, 1fr) minmax(66px, auto) minmax(74px, auto);
    gap: 6px;
    padding: 9px 6px;
    min-width: 0;
  }
  .historial-fila span:nth-child(3),
  .historial-fila span:nth-child(5) {
    display: none;
  }
  .historial-scroll,
  .movimientos-scroll {
    max-height: 420px;
  }

  .detalle-pago-historial {
    min-width: 0;
    align-items: flex-end;
  }

  .valor-pago-linea {
    gap: 3px;
  }

  .valor-pago-linea small,
  .valor-pago-linea strong,
  .valor-pago-historial {
    font-size: 0.66rem;
  }
}
.movimiento-titulo-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.movimiento-tipo-gasto {
  display: inline-block;
  padding: 2px 9px;
  border-radius: 999px;
  background: rgba(220, 38, 38, 0.12);
  color: #dc2626;
  font-weight: 900;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.movimiento-tipo-gasto-mini {
  margin-right: 6px;
  vertical-align: middle;
}
</style>
