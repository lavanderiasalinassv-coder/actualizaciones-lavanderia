<template>
  <AppShell>
    <div class="calendario-page force-light">
      <div class="header-row">
        <h1>Calendario de entregas</h1>
      </div>

      <section class="controles-superiores">
        <div class="nav-periodo">
          <button class="nav-btn" @click="irAnterior">
            <ion-icon :icon="chevronBackOutline" />
          </button>
          <strong class="titulo-periodo">{{ tituloPeriodo }}</strong>
          <button class="nav-btn" @click="irSiguiente">
            <ion-icon :icon="chevronForwardOutline" />
          </button>
          <button class="hoy-btn" @click="irHoy">Hoy</button>
        </div>

        <div class="vista-switch">
          <button
            class="vista-chip"
            :class="{ active: vista === 'mes' }"
            @click="vista = 'mes'"
          >
            Mes
          </button>
          <button
            class="vista-chip"
            :class="{ active: vista === 'semana' }"
            @click="vista = 'semana'"
          >
            Semana
          </button>
        </div>
      </section>

      <section class="chip-row leyenda">
        <div class="search-bar calendario-search">
          <ion-icon :icon="searchOutline" />
          <input
            v-model="busquedaCalendario"
            type="text"
            placeholder="Buscar por número o cliente..."
          />
        </div>

        <button
          v-for="filtro in filtrosEstadoVisibles"
          :key="filtro.value"
          class="filtro-chip"
          :class="{ active: estadoActivo === filtro.value }"
          :style="estadoActivo === filtro.value ? { background: filtro.color, borderColor: filtro.color, color: '#ffffff' } : {}"
          @click="estadoActivo = filtro.value"
        >
          <span class="dot" :style="{ background: estadoActivo === filtro.value ? '#ffffff' : filtro.color }"></span>
          {{ filtro.label }}
        </button>
      </section>

      <!-- ================= VISTA MES ================= -->
      <section v-if="vista === 'mes'" class="mes-grid-wrapper">
        <div class="mes-dias-semana">
          <span v-for="nombre in nombresDiasSemana" :key="nombre">{{ nombre }}</span>
        </div>

        <div class="mes-grid">
          <div
            v-for="celda in diasMes"
            :key="celda.clave"
            class="mes-celda"
            :class="{ 'fuera-de-mes': !celda.enMes, hoy: celda.esHoy }"
            @click="abrirModalDia(celda.clave)"
          >
            <div class="mes-celda-header">
              <span class="mes-celda-numero" :class="{ hoy: celda.esHoy }">{{ celda.numero }}</span>
            </div>

            <!-- Escritorio: pastillas con texto -->
            <div v-if="!esMobile" class="mes-celda-eventos">
              <button
                v-for="orden in (ordenesPorFecha[celda.clave] ?? []).slice(0, 3)"
                :key="orden.id"
                type="button"
                class="evento-pill"
                :class="{ vencida: ordenVencida(orden) }"
                :style="{ background: estadoColores[orden.estado].bg, color: estadoColores[orden.estado].textStrong, borderLeftColor: estadoColores[orden.estado].dot }"
                @click.stop="abrirDetalle(orden.id)"
              >
                {{ orden.nombreCliente }}
              </button>
              <span
                v-if="(ordenesPorFecha[celda.clave]?.length ?? 0) > 3"
                class="evento-mas"
                @click.stop="abrirModalDia(celda.clave)"
              >
                +{{ (ordenesPorFecha[celda.clave]?.length ?? 0) - 3 }} más
              </span>
            </div>

            <!-- Móvil: puntos de color (estilo Google Calendar) -->
            <div v-else class="mes-celda-puntos">
              <span
                v-for="orden in (ordenesPorFecha[celda.clave] ?? []).slice(0, 4)"
                :key="orden.id"
                class="punto-evento"
                :style="{ background: estadoColores[orden.estado].dot }"
                @click.stop="abrirDetalle(orden.id)"
              ></span>
              <span v-if="(ordenesPorFecha[celda.clave]?.length ?? 0) > 4" class="punto-mas">
                +{{ (ordenesPorFecha[celda.clave]?.length ?? 0) - 4 }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- ================= VISTA SEMANA (escritorio) ================= -->
      <section v-else-if="!esMobile" class="semana-grid">
        <div
          v-for="dia in diasSemana"
          :key="dia.clave"
          class="semana-columna"
          :class="{ hoy: dia.esHoy }"
        >
          <button type="button" class="semana-columna-header" @click="abrirModalDia(dia.clave)">
            <span class="semana-dia-nombre">{{ dia.nombreCorto }}</span>
            <span class="semana-dia-numero" :class="{ hoy: dia.esHoy }">{{ dia.numero }}</span>
          </button>

          <div class="semana-columna-lista">
            <button
              v-for="orden in (ordenesPorFecha[dia.clave] ?? [])"
              :key="orden.id"
              type="button"
              class="semana-evento-card"
              :class="{ vencida: ordenVencida(orden) }"
              :style="{ '--card-accent': estadoColores[orden.estado].dot, '--card-accent-bg': estadoColores[orden.estado].bg, '--card-accent-fuerte': estadoColores[orden.estado].textStrong }"
              @click.stop="abrirDetalle(orden.id)"
            >
              <div class="semana-evento-top">
                <strong>{{ orden.numero }}</strong>
                <span v-if="orden.horaEntrega" class="semana-evento-hora">{{ orden.horaEntrega }}</span>
              </div>
              <p class="semana-evento-cliente">{{ orden.nombreCliente }}</p>
              <span class="semana-evento-estado" :style="{ color: estadoColores[orden.estado].textStrong }">
                {{ textoEstado(orden.estado) }}
              </span>
            </button>

            <p v-if="(ordenesPorFecha[dia.clave]?.length ?? 0) === 0" class="semana-vacio">
              Sin entregas
            </p>
          </div>
        </div>
      </section>

      <!-- ================= VISTA SEMANA (móvil, agenda apilada) ================= -->
      <section v-else class="semana-agenda-movil">
        <div v-for="dia in diasSemana" :key="dia.clave" class="agenda-dia" :class="{ hoy: dia.esHoy }">
          <button type="button" class="agenda-dia-header" @click="abrirModalDia(dia.clave)">
            <span class="agenda-dia-nombre">{{ dia.nombreLargo }}</span>
            <span class="agenda-dia-numero" :class="{ hoy: dia.esHoy }">{{ dia.numero }}</span>
            <span class="agenda-dia-count">{{ (ordenesPorFecha[dia.clave]?.length ?? 0) }}</span>
          </button>

          <div v-if="(ordenesPorFecha[dia.clave]?.length ?? 0) > 0" class="agenda-dia-lista">
            <button
              v-for="orden in (ordenesPorFecha[dia.clave] ?? [])"
              :key="orden.id"
              type="button"
              class="agenda-evento-card"
              :style="{ '--card-accent': estadoColores[orden.estado].dot }"
              @click.stop="abrirDetalle(orden.id)"
            >
              <span class="agenda-evento-dot" :style="{ background: estadoColores[orden.estado].dot }"></span>
              <span class="agenda-evento-info">
                <strong>{{ orden.numero }} · {{ orden.nombreCliente }}</strong>
                <small>{{ textoEstado(orden.estado) }}<span v-if="orden.horaEntrega"> · {{ orden.horaEntrega }}</span></small>
              </span>
            </button>
          </div>
        </div>
      </section>

      <!-- ================= MODAL: ÓRDENES DEL DÍA ================= -->
      <ion-modal :is-open="mostrarModalDia" class="modal-dia" @didDismiss="cerrarModalDia">
        <div class="modal-dia-contenido force-light">
          <div class="modal-dia-header">
            <div>
              <p class="modal-dia-etiqueta">Órdenes a entregar</p>
              <strong>{{ tituloModalDia }}</strong>
            </div>
            <button class="cerrar-detalle" @click="cerrarModalDia">
              <ion-icon :icon="closeOutline" />
            </button>
          </div>

          <div class="modal-dia-lista">
            <button
              v-for="orden in ordenesModalDia"
              :key="orden.id"
              type="button"
              class="dia-orden-card"
              :style="{ '--card-accent': estadoColores[orden.estado].dot, '--card-accent-bg': estadoColores[orden.estado].bg, '--card-accent-fuerte': estadoColores[orden.estado].textStrong }"
              @click="abrirDetalle(orden.id)"
            >
              <div class="dia-orden-top">
                <strong>{{ orden.numero }}</strong>
                <span class="pill estado-chip" :style="{ background: '#ffffff', color: estadoColores[orden.estado].textStrong }">
                  {{ textoEstado(orden.estado) }}
                </span>
              </div>
              <p class="dia-orden-cliente">{{ orden.nombreCliente }}</p>
              <p class="dia-orden-detalle">{{ resumenServicios(orden.items) }}</p>
              <div class="dia-orden-bottom">
                <strong v-if="puedeVerMontos" :style="{ color: estadoColores[orden.estado].textStrong }">
                  {{ orden.estadoPago === 'pagado' ? '✓ Orden pagada' : `$${totalFinalOrden(orden).toFixed(2)}` }}
                </strong>
                <span v-if="orden.horaEntrega" class="dia-orden-hora">{{ orden.horaEntrega }}</span>
              </div>
            </button>

            <p v-if="ordenesModalDia.length === 0" class="hint-texto-vacio dia-vacio">
              No hay órdenes con entrega programada este día.
            </p>
          </div>
        </div>
      </ion-modal>

      <!-- ================= MODAL: DETALLE COMPLETO DE ORDEN ================= -->
      <ion-modal :is-open="detalleAbierto" class="modal-ordenes" @didDismiss="cerrarDetalle">
        <div class="modal-detalle force-light">
          <div class="modal-header">
            <div class="modal-header-left">
              <div class="modal-icon">
                <ion-icon :icon="receiptOutline" />
              </div>
              <div>
                <p class="detalle-numero">Orden {{ ordenSeleccionada?.numero ?? '' }}</p>
                <h2>Detalle de orden</h2>
                <p v-if="ordenSeleccionada?.estado === 'cerrada'" class="orden-cerrada-header">
                  {{ textoCierreOrden(ordenSeleccionada) }}
                </p>
              </div>
            </div>

            <div v-if="ordenSeleccionada && requiereIntervencion(ordenSeleccionada)" class="motivo-intervencion-header">
              <ion-icon :icon="warningOutline" />
              <span>{{ motivoIntervencion(ordenSeleccionada) }}</span>
            </div>

            <div class="modal-header-acciones">
              <button v-if="!esOperador" class="btn-icono" title="Enviar por WhatsApp" :disabled="peticionOrdenEnCurso" @click="enviarWhatsApp">
                <ion-icon :icon="logoWhatsapp" />
              </button>
              <button
                v-if="!esOperador && ordenSeleccionada?.correo"
                class="btn-icono"
                :disabled="enviandoCorreo || peticionOrdenEnCurso"
                :title="enviandoCorreo ? 'Enviando factura...' : 'Enviar factura automáticamente por correo'"
                @click="enviarEmail"
              >
                <ion-spinner v-if="enviandoCorreo" name="crescent" />
                <ion-icon v-else :icon="mailOutline" />
              </button>
              <button
                v-if="esAdministrador && !esOperador"
                class="btn-icono peligro"
                :disabled="peticionOrdenEnCurso"
                title="Eliminar orden"
                @click="confirmarEliminarOrden"
              >
                <ion-icon :icon="trashOutline" />
              </button>
              <button class="cerrar-detalle" @click="cerrarDetalle">
                <ion-icon :icon="closeOutline" />
              </button>
            </div>
          </div>

          <div v-if="ordenSeleccionada" class="modal-body">
            <div class="modal-columna acciones-columna">
              <p class="columna-titulo">Opciones de modificacion</p>

              <section v-if="ordenSeleccionada.estado !== 'cerrada'" class="estado-deslizador">
                <div class="detalle-bloque-head">
                  <div>
                    <p class="label">Estado</p>
                    <strong>Selecciona el estado de la orden</strong>
                  </div>
                </div>

                <div class="estado-cuadritos">
                  <button
                    v-for="estado in estadosCambioVisibles"
                    :key="estado.value"
                    type="button"
                    class="estado-cuadrito"
                    :class="{ actual: ordenSeleccionada.estado === estado.value }"
                    :disabled="peticionOrdenEnCurso || ordenSeleccionada.estado === estado.value || !puedeCambiarEstado(ordenSeleccionada.estado, estado.value) || turnoCerrado"
                    :title="ordenSeleccionada.estado === estado.value ? 'Estado actual' : puedeCambiarEstado(ordenSeleccionada.estado, estado.value) ? `Cambiar a ${estado.label}` : 'Avanza al siguiente estado'"
                    @click="solicitarCambioEstado(ordenSeleccionada.id, estado.value)"
                  >
                    <span class="estado-cuadrito-emoji" aria-hidden="true">{{ estado.emoji }}</span>
                    <span>{{ estado.label }}</span>
                  </button>
                </div>

                <button
                  v-if="esAdministrador && ordenSeleccionada.estado !== 'cancelada'"
                  type="button"
                  class="cancelar-orden-boton"
                  @click="abrirModalCancelarOrden"
                >
                  <ion-icon :icon="banOutline" />
                  Cancelar orden
                </button>
              </section>

              <button
                v-if="mostrarRestaurarCerrada && ordenSeleccionada.estado === 'cerrada'"
                type="button"
                class="restaurar-orden-boton"
                :disabled="restaurandoOrdenCerrada"
                @click="restaurarOrdenCerrada"
              >
                <ion-icon :icon="refreshOutline" />
                <span>{{ restaurandoOrdenCerrada ? 'Restaurando...' : 'Restaurar orden cerrada' }}</span>
              </button>

              <p v-if="ordenSeleccionada.turnoHuerfano" class="anticipo-error-badge turno-huerfano-badge">
                ⚠️ La entrega no aparece en el cierre asignado (ID: {{ ordenSeleccionada.turnoId }}).
              </p>

              <section class="detalle-bloque">
                <div class="seccion-titulo">
                  <strong>Servicios</strong>
                  <div class="seccion-titulo-acciones">
                    <span class="mini-badge">{{ ordenSeleccionada.items.length }} items</span>
                    <button v-if="ordenSeleccionada.estado !== 'cancelada'" class="link extra" :disabled="peticionOrdenEnCurso || turnoCerrado" @click="abrirModalAgregarProducto">
                      + Agregar servicio
                    </button>
                  </div>
                </div>

                <div class="servicios-lista">
                  <article v-for="item in ordenSeleccionada.items" :key="item.id" class="servicio-linea">
                    <div>
                      <strong>{{ item.nombre }}</strong>
                      <span>{{ item.cantidad }}<template v-if="puedeVerMontos"> x ${{ item.precio.toFixed(2) }}</template></span>
                    </div>
                    <div class="linea-derecha">
                      <strong v-if="puedeVerMontos">${{ (item.precio * item.cantidad).toFixed(2) }}</strong>
                      <button v-if="esAdministrador" type="button" class="btn-quitar-mini" title="Quitar producto" :disabled="peticionOrdenEnCurso || turnoCerrado" @click="abrirModalQuitarItem(item)">
                        <ion-icon :icon="banOutline" />
                      </button>
                    </div>
                  </article>
                  <p v-if="ordenSeleccionada.items.length === 0" class="hint-texto-vacio">
                    Sin productos en esta orden.
                  </p>
                </div>
              </section>

              <section class="detalle-bloque">
                <div class="seccion-titulo">
                  <strong>Cargos extra</strong>
                  <button v-if="ordenSeleccionada.estado !== 'cancelada'" class="link extra" :disabled="peticionOrdenEnCurso || turnoCerrado" @click="abrirModalCargoExtra">
                    + Agregar cargo extra
                  </button>
                </div>

                <div v-if="ordenSeleccionada.cargosExtra.length" class="servicios-lista">
                  <article v-for="cargo in ordenSeleccionada.cargosExtra" :key="cargo.id" class="servicio-linea">
                    <div>
                      <strong>{{ cargo.descripcion }}</strong>
                      <span>{{ formatearFechaHora(cargo.fecha) }}</span>
                    </div>
                    <div class="linea-derecha">
                      <strong v-if="puedeVerMontos">${{ cargo.monto.toFixed(2) }}</strong>
                      <button type="button" class="btn-quitar-mini" title="Eliminar cargo" :disabled="peticionOrdenEnCurso || turnoCerrado" @click="eliminarCargoExtraSeleccionado(cargo.id)">
                        <ion-icon :icon="trashOutline" />
                      </button>
                    </div>
                  </article>
                </div>
                <p v-else class="hint-texto-vacio">Sin cargos extra registrados.</p>
              </section>

              <section class="detalle-bloque">
                <div class="seccion-titulo">
                  <strong>Fotos</strong>
                  <label v-if="ordenSeleccionada.estado !== 'cancelada'" class="link btn-subir-foto-link">
                    + Agregar
                    <input type="file" accept="image/*" multiple hidden :disabled="peticionOrdenEnCurso || turnoCerrado" @change="manejarFotosOrden" />
                  </label>
                </div>
                <div class="fotos-grid">
                  <div v-for="(foto, index) in ordenSeleccionada.fotos" :key="foto" class="foto-item">
                    <img :src="foto" alt="Foto de la orden" />
                    <button type="button" class="btn-quitar-foto" :disabled="peticionOrdenEnCurso || turnoCerrado" @click="eliminarFotoSeleccionada(index)">×</button>
                  </div>
                  <div v-if="ordenSeleccionada.fotos.length === 0" class="foto-vacia">
                    Foto
                  </div>
                </div>
              </section>

              <section class="detalle-bloque notas">
                <div class="seccion-titulo">
                  <strong>Notas internas</strong>
                  <button class="link extra" :disabled="guardandoNota || peticionOrdenEnCurso || turnoCerrado" @click="guardarNota">
                    <ion-icon :icon="saveOutline" />
                    {{ guardandoNota ? 'Guardando...' : 'Guardar nota' }}
                  </button>
                </div>
                <textarea
                  v-model="notaBorrador"
                  class="nota-input"
                  :aria-busy="guardandoNota"
                  aria-label="Nota interna de la orden"
                  placeholder="Ej: Se embolso, falta planchar, cliente pide entrega temprano..."
                />
                <p v-if="notaGuardada" class="nota-estado nota-estado-exito" aria-live="polite">
                  Nota guardada correctamente.
                </p>
                <p v-if="errorNota" class="nota-estado nota-estado-error" role="alert">
                  {{ errorNota }}
                </p>
              </section>
            </div>

            <div class="modal-columna info-columna">
              <p class="columna-titulo">{{ esOperador ? 'Informacion de la orden' : 'Informacion de la orden y dinero' }}</p>

              <section class="detalle-bloque cliente-box">
                <div class="detalle-bloque-head">
                  <div>
                    <p class="label">Informacion del cliente</p>
                    <strong v-if="!editandoCliente">{{ ordenSeleccionada.nombreCliente }}</strong>
                  </div>
                  <span
                    class="pill estado-pill"
                    :style="{ background: estadoColores[ordenSeleccionada.estado].bg, color: estadoColores[ordenSeleccionada.estado].text }"
                  >
                    {{ textoEstado(ordenSeleccionada.estado) }}
                  </span>
                </div>

                <template v-if="editandoCliente">
                  <label class="modal-label cliente-edicion-label">Nombre</label>
                  <input v-model="clienteBorrador.nombre" class="modal-input-texto" type="text" />
                  <label class="modal-label cliente-edicion-label">Celular</label>
                  <div class="cliente-telefono-edicion">
                    <span>{{ ordenSeleccionada.codigoPais }}</span>
                    <input v-model="clienteBorrador.telefono" class="modal-input-texto" type="tel" inputmode="numeric" />
                  </div>
                  <label class="modal-label cliente-edicion-label">Correo electronico</label>
                  <input v-model="clienteBorrador.correo" class="modal-input-texto" type="email" />
                  <p v-if="errorEdicionCliente" class="nota-estado nota-estado-error">{{ errorEdicionCliente }}</p>
                  <div class="cliente-edicion-acciones">
                    <button type="button" class="btn-outline" :disabled="guardandoCliente" @click="cancelarEdicionCliente">Cancelar</button>
                    <button type="button" class="btn-principal" :disabled="guardandoCliente" @click="guardarEdicionCliente">
                      {{ guardandoCliente ? 'Guardando...' : 'Guardar cambios' }}
                    </button>
                  </div>
                </template>
                <template v-else>
                  <span>{{ ordenSeleccionada.codigoPais }} {{ ordenSeleccionada.telefono }}</span>
                  <span v-if="ordenSeleccionada.correo">{{ ordenSeleccionada.correo }}</span>
                  <button v-if="esAdministrador" type="button" class="link cliente-editar-btn" @click="iniciarEdicionCliente">
                    Editar datos del cliente
                  </button>
                </template>
                <span v-if="ordenSeleccionada.envioDomicilio && ordenSeleccionada.direccionEntrega">
                  Dirección de entrega: {{ ordenSeleccionada.direccionEntrega }}
                </span>
              </section>

              <section class="detalle-grid">
                <div v-if="puedeVerMontos" class="mini-card">
                  <p class="label">Estado de pago</p>
                  <strong>{{ textoEstadoPago(ordenSeleccionada.estadoPago) }}</strong>
                  <button
                    v-if="ordenSeleccionada.estado !== 'cancelada' && (ordenSeleccionada.estadoPago === 'porCobrar' || (esAdministrador && ordenSeleccionada.estadoPago === 'pagado'))"
                    class="link"
                    :disabled="peticionOrdenEnCurso || turnoCerrado"
                    @click="cambiarEstadoPago(ordenSeleccionada.id)"
                  >
                    {{ ordenSeleccionada.estadoPago === 'pagado' ? 'Regresar a por cobrar' : 'Marcar Pagado' }}
                  </button>
                </div>

                <div class="mini-card">
                  <p class="label">Fecha de entrega</p>
                  <input v-model="fechaEntregaBorrador" type="date" class="fecha-orden-input" :disabled="!esAdministrador" />
                  <span v-if="ordenSeleccionada.horaEntrega">Hora: {{ ordenSeleccionada.horaEntrega }}</span>
                </div>

                <div class="mini-card">
                  <p class="label">Fecha de creacion</p>
                  <input v-model="fechaCreacionBorrador" type="date" class="fecha-orden-input" :disabled="!esAdministrador" />
                  <span>Hora: {{ formatearHora(ordenSeleccionada.createdAt) }}</span>
                </div>
              </section>

              <button
                v-if="esAdministrador"
                type="button"
                class="guardar-fechas-orden"
                :disabled="guardandoFechas || peticionOrdenEnCurso || !fechaCreacionBorrador || !fechaEntregaBorrador"
                @click="guardarFechasOrden"
              >
                {{ guardandoFechas ? 'Cambiando fecha...' : 'Cambiar fecha' }}
              </button>

              <section v-if="puedeVerMontos" class="total-box">
                <span>Total a pagar</span>
                <strong>${{ totalFinalOrden(ordenSeleccionada).toFixed(2) }} USD</strong>
              </section>

              <section v-if="puedeVerMontos" class="detalle-bloque pago-box">
                <div class="seccion-titulo">
                  <strong>Pago y anticipos</strong>
                  <button v-if="ordenSeleccionada.estado !== 'cancelada'" class="link extra" :disabled="peticionOrdenEnCurso || turnoCerrado" @click="abrirModalAnticipo">
                    + Registrar anticipo
                  </button>
                </div>

                <div class="pago-resumen">
                  <div>
                    <p class="label">Recibido</p>
                    <strong>${{ ordenSeleccionada.montoRecibido.toFixed(2) }}</strong>
                  </div>
                  <div>
                    <p class="label">Estado</p>
                    <strong>{{ textoEstadoPago(ordenSeleccionada.estadoPago) }}</strong>
                  </div>
                </div>

                <div v-if="ordenSeleccionada.metodoPago === 'tarjeta' && (ordenSeleccionada.tarjetaMonto || ordenSeleccionada.tarjetaReferencia)" class="metodo-pago-detalle">
                  <div class="metodo-pago-header">
                    <ion-icon :icon="cardOutline" />
                    <strong>Pago con tarjeta</strong>
                  </div>
                  <div v-if="ordenSeleccionada.tarjetaMonto" class="pago-detalle-linea">
                    <span>Monto:</span>
                    <strong>${{ ordenSeleccionada.tarjetaMonto.toFixed(2) }}</strong>
                  </div>
                  <div v-if="ordenSeleccionada.tarjetaReferencia" class="pago-detalle-linea">
                    <span>Referencia:</span>
                    <strong>{{ ordenSeleccionada.tarjetaReferencia }}</strong>
                  </div>
                </div>

                <div v-if="ordenSeleccionada.metodoPago === 'transferencia' && (ordenSeleccionada.transferenciaMonto || ordenSeleccionada.transferenciaComprobante)" class="metodo-pago-detalle">
                  <div class="metodo-pago-header">
                    <ion-icon :icon="swapHorizontalOutline" />
                    <strong>Transferencia</strong>
                  </div>
                  <div v-if="ordenSeleccionada.transferenciaMonto" class="pago-detalle-linea">
                    <span>Monto:</span>
                    <strong>${{ ordenSeleccionada.transferenciaMonto.toFixed(2) }}</strong>
                  </div>
                  <div v-if="ordenSeleccionada.transferenciaComprobante" class="pago-detalle-linea">
                    <span>Comprobante:</span>
                    <button type="button" class="comprobante-link" @click="abrirModalComprobante(ordenSeleccionada.transferenciaComprobante)">
                      <ion-icon :icon="imageOutline" />
                      Ver comprobante
                    </button>
                  </div>
                </div>

                <div v-if="ordenSeleccionada.anticipos.length" class="servicios-lista">
                  <article v-for="anticipo in ordenSeleccionada.anticipos" :key="anticipo.id" class="servicio-linea">
                    <div>
                      <strong>Anticipo</strong>
                      <span>{{ formatearFechaHora(anticipo.fecha) }}</span>
                    </div>
                    <div class="linea-derecha">
                      <strong>${{ anticipo.monto.toFixed(2) }}</strong>
                      <button v-if="esAdministrador" type="button" class="btn-quitar-mini" title="Eliminar anticipo" :disabled="peticionOrdenEnCurso || turnoCerrado" @click="eliminarAnticipoSeleccionado(anticipo.id)">
                        <ion-icon :icon="trashOutline" />
                      </button>
                    </div>
                  </article>
                </div>
                <p v-else class="hint-texto-vacio">Sin anticipos registrados.</p>

                <button
                  v-if="ordenSeleccionada.estado !== 'cancelada' && (ordenSeleccionada.estadoPago === 'porCobrar' || (esAdministrador && ordenSeleccionada.estadoPago === 'pagado'))"
                  class="link"
                  :disabled="peticionOrdenEnCurso || turnoCerrado"
                  @click="cambiarEstadoPago(ordenSeleccionada.id)"
                >
                  {{ ordenSeleccionada.estadoPago === 'pagado' ? 'Regresar a por cobrar' : 'Marcar facturada' }}
                </button>
              </section>

              <section v-if="esAdministrador" class="detalle-bloque movimientos">
                <div class="seccion-titulo">
                  <strong>Movimientos</strong>
                </div>
                <div class="movimientos-lista">
                  <article
                    v-for="mov in ordenSeleccionada.movimientos"
                    :key="mov.id"
                    class="movimiento"
                    :class="claseMovimiento(mov.texto)"
                  >
                    <div class="movimiento-bullet" :class="claseMovimientoBullet(mov.texto)">+</div>
                    <div>
                      <strong :class="claseTextoMovimiento(mov.texto)">{{ textoMovimientoVisible(mov.texto) }}</strong>
                      <span>Usuario a cargo: {{ mov.usuarioNombre || 'Sistema' }}</span> <br>
                      <span>Fecha: {{ formatearFechaHora(mov.fecha) }}</span>
                    </div>
                  </article>
                </div>
              </section>
            </div>
          </div>
        </div>
      </ion-modal>

      <ion-modal :is-open="mostrarModalRestaurar" class="modal-confirmacion" @didDismiss="cerrarModalRestaurar">
        <div class="modal-restaurar-contenido force-light">
          <div class="modal-restaurar-icono">
            <ion-icon :icon="refreshOutline" />
          </div>
          <p class="modal-confirmacion-titulo">Restaurar orden cerrada</p>
          <p class="modal-confirmacion-subtitulo">
            La orden {{ ordenSeleccionada?.numero ?? '' }} volverá a estado pendiente para asignarla a una caja válida.
          </p>

          <div class="restaurar-resumen">
            <div class="restaurar-resumen-item restaurar-resumen-eliminar">
              <ion-icon :icon="trashOutline" />
              <div>
                <strong>Se eliminará el pago del cierre</strong>
                <span>
                  ${{ montoPagosTurnoEntrega.toFixed(2) }} del turno donde se marcó la entrega.
                </span>
              </div>
            </div>
            <div class="restaurar-resumen-item restaurar-resumen-conservar">
              <ion-icon :icon="checkmarkCircleOutline" />
              <div>
                <strong>Se conservarán los anticipos anteriores</strong>
                <span>
                  {{ anticiposOtrosTurnos.length }} anticipo{{ anticiposOtrosTurnos.length === 1 ? '' : 's' }} de otros turnos no se tocará{{ anticiposOtrosTurnos.length === 1 ? '' : 'n' }}.
                </span>
              </div>
            </div>
          </div>

          <div class="modal-confirmacion-botones">
            <button class="btn-outline" type="button" :disabled="restaurandoOrdenCerrada" @click="cerrarModalRestaurar">Cancelar</button>
            <button class="btn-principal" type="button" :disabled="restaurandoOrdenCerrada" @click="confirmarRestaurarOrden">
              <ion-spinner v-if="restaurandoOrdenCerrada" name="crescent" />
              {{ restaurandoOrdenCerrada ? 'Restaurando...' : 'Restaurar orden' }}
            </button>
          </div>
        </div>
      </ion-modal>

      <ion-modal :is-open="mostrarModalComprobante" class="modal-comprobante" @didDismiss="cerrarModalComprobante">
        <div class="modal-comprobante-contenido force-light">
          <div class="modal-comprobante-header">
            <strong>Comprobante de transferencia</strong>
            <button class="cerrar-detalle" @click="cerrarModalComprobante">
              <ion-icon :icon="closeOutline" />
            </button>
          </div>

          <div class="modal-comprobante-body">
            <img
              v-if="comprobanteEsImagen"
              :src="comprobanteActual"
              alt="Comprobante de transferencia"
              class="comprobante-imagen"
            />
            <iframe
              v-else
              :src="comprobanteActual"
              title="Comprobante de transferencia"
              class="comprobante-frame"
            />
          </div>

          <a :href="comprobanteActual" target="_blank" rel="noreferrer" class="comprobante-externo-link">
            Abrir en nueva pestaña
          </a>
        </div>
      </ion-modal>

      <ion-modal :is-open="mostrarConfirmacionEstado" class="modal-confirmacion" @didDismiss="cancelarCambioEstado">
        <div class="modal-confirmacion-contenido force-light">
          <div class="modal-confirmacion-header">
            <div class="modal-confirmacion-icon">!</div>
            <div>
              <p class="modal-confirmacion-titulo">Confirmar cambio de estado</p>
              <p class="modal-confirmacion-subtitulo">
                {{
                  ordenCambioPendiente
                    ? `Orden ${ordenCambioPendiente.numero} pasará de ${textoEstado(ordenCambioPendiente.estado)} a ${estadoObjetivoTexto}`
                    : 'Revisa el cambio antes de aplicarlo.'
                }}
              </p>
            </div>
          </div>

          <template v-if="estadoObjetivoCambio === 'entregado'">
            <div v-if="esAdministrador" class="anticipo-antiguo-toggle">
              <label class="toggle-check">
                <input type="checkbox" v-model="registrarEntregaAntigua" />
                Registrar entrega antigua
              </label>
            </div>
            <template v-if="!esAdministrador || registrarEntregaAntigua">
              <label class="modal-label">Fecha de entrega al cliente</label>
              <input v-model="fechaEntregadoModal" type="date" class="modal-input-fecha" />
            </template>
            <template v-if="esAdministrador && registrarEntregaAntigua">
              <label class="modal-label">Turno</label>
              <select v-model="turnoIdEntregaAntigua" class="modal-input-select">
                <option value="" disabled>Selecciona un turno</option>
                <option v-for="opcion in turnosParaAnticipoAntiguo" :key="opcion.id" :value="opcion.id">
                  {{ opcion.etiqueta }}
                </option>
              </select>
            </template>
          </template>

          <label v-if="esAdministrador" class="toggle-check">
            <input type="checkbox" v-model="enviarNotificacionCambioEstado" />
            Enviar notificación por correo
          </label>

          <div class="modal-confirmacion-botones">
            <button class="btn-outline" @click="cancelarCambioEstado">Cancelar</button>
            <button class="btn-principal" :disabled="peticionOrdenEnCurso || turnoCerrado" @click="confirmarCambioEstado">
              {{ peticionOrdenEnCurso ? 'Guardando...' : 'Confirmar' }}
            </button>
          </div>
        </div>
      </ion-modal>

      <ion-modal :is-open="mostrarModalCargoExtra" class="modal-confirmacion" @didDismiss="cerrarModalCargoExtra">
        <div class="modal-confirmacion-contenido force-light">
          <div class="modal-confirmacion-header">
            <div class="modal-confirmacion-icon">$</div>
            <div>
              <p class="modal-confirmacion-titulo">Agregar cargo extra</p>
              <p class="modal-confirmacion-subtitulo">
                Se sumará al total de la orden {{ ordenSeleccionada?.numero ?? '' }}.
              </p>
            </div>
          </div>

          <label class="modal-label">Descripción</label>
          <input
            v-model="descripcionCargoExtra"
            class="modal-input-texto"
            type="text"
            placeholder="Ej: Mancha difícil, planchado extra..."
          />

          <label class="modal-label">Monto</label>
          <div class="modal-input-monto">
            <span>$</span>
            <input v-model.number="montoCargoExtra" type="number" min="0" step="0.01" placeholder="0.00" />
          </div>

          <div class="modal-confirmacion-botones">
            <button class="btn-outline" @click="cerrarModalCargoExtra">Cancelar</button>
            <button class="btn-principal" :disabled="montoCargoExtra <= 0 || peticionOrdenEnCurso || turnoCerrado" @click="confirmarCargoExtra">
              {{ peticionOrdenEnCurso ? 'Guardando...' : 'Agregar' }}
            </button>
          </div>
        </div>
      </ion-modal>

      <ion-modal :is-open="mostrarModalAnticipo" class="modal-confirmacion" @didDismiss="cerrarModalAnticipo">
        <div class="modal-confirmacion-contenido force-light">
          <div class="modal-confirmacion-header">
            <div class="modal-confirmacion-icon">$</div>
            <div>
              <p class="modal-confirmacion-titulo">Registrar anticipo</p>
              <p class="modal-confirmacion-subtitulo">
                Se sumará al monto recibido de la orden {{ ordenSeleccionada?.numero ?? '' }}.
              </p>
            </div>
          </div>

          <label class="modal-label">Monto</label>
          <div class="modal-input-monto">
            <span>$</span>
            <input v-model.number="montoAnticipoModal" type="number" min="0" step="0.01" placeholder="0.00" />
          </div>

          <div v-if="esAdministrador" class="anticipo-antiguo-toggle">
            <label class="toggle-check">
              <input type="checkbox" v-model="registrarAnticipoAntiguo" />
              Registrar anticipo antiguo
            </label>
          </div>
          <template v-if="esAdministrador && registrarAnticipoAntiguo">
            <label class="modal-label">Turno</label>
            <select v-model="turnoIdAnticipoAntiguo" class="modal-input-select">
              <option value="" disabled>Selecciona un turno</option>
              <option v-for="opcion in turnosParaAnticipoAntiguo" :key="opcion.id" :value="opcion.id">
                {{ opcion.etiqueta }}
              </option>
            </select>
          </template>

          <div class="modal-confirmacion-botones">
            <button class="btn-outline" @click="cerrarModalAnticipo">Cancelar</button>
            <button class="btn-principal" :disabled="montoAnticipoModal <= 0 || peticionOrdenEnCurso || turnoCerrado" @click="confirmarAnticipoModal">
              {{ peticionOrdenEnCurso ? 'Guardando...' : 'Registrar' }}
            </button>
          </div>
        </div>
      </ion-modal>

      <ion-modal :is-open="mostrarModalAgregarProducto" class="modal-confirmacion" @didDismiss="cerrarModalAgregarProducto">
        <div class="modal-confirmacion-contenido force-light">
          <div class="modal-confirmacion-header">
            <div class="modal-confirmacion-icon">+</div>
            <div>
              <p class="modal-confirmacion-titulo">Agregar servicio</p>
              <p class="modal-confirmacion-subtitulo">
                Se sumará a la orden {{ ordenSeleccionada?.numero ?? '' }}.
              </p>
            </div>
          </div>

          <input
            v-model="busquedaProducto"
            class="modal-input-texto"
            type="text"
            placeholder="Buscar servicio..."
          />

          <div class="lista-productos-modal">
            <div
              v-for="servicio in productosFiltrados"
              :key="servicio.id"
              class="producto-modal-item"
            >
              <div>
                <strong>{{ servicio.nombre }}</strong>
                <span v-if="puedeVerMontos">${{ servicio.precio.toFixed(2) }} / {{ etiquetaUnidadProducto(servicio.unidad) }}</span>
              </div>
              <div class="producto-cantidad-control">
                <button type="button" class="cantidad-btn" :disabled="cantidadServicio(servicio.id) === 0" @click="cambiarCantidadServicio(servicio.id, -1)">-</button>
                <span>{{ cantidadServicio(servicio.id) }}</span>
                <button type="button" class="cantidad-btn" @click="cambiarCantidadServicio(servicio.id, 1)">+</button>
              </div>
            </div>
            <p v-if="productosFiltrados.length === 0" class="hint-texto-vacio">
              No se encontraron servicios.
            </p>
          </div>

          <div class="modal-confirmacion-botones">
            <button class="btn-outline" @click="cerrarModalAgregarProducto">Listo</button>
            <button class="btn-principal" :disabled="!hayServiciosSeleccionados || peticionOrdenEnCurso || turnoCerrado" @click="agregarServiciosSeleccionados">
              {{ peticionOrdenEnCurso ? 'Guardando...' : 'Agregar seleccionados' }}
            </button>
          </div>
        </div>
      </ion-modal>

      <ion-modal :is-open="mostrarModalQuitarItem" class="modal-confirmacion" @didDismiss="cerrarModalQuitarItem">
        <div class="modal-confirmacion-contenido force-light">
          <div class="modal-confirmacion-header">
            <div class="modal-confirmacion-icon">!</div>
            <div>
              <p class="modal-confirmacion-titulo">Quitar producto</p>
              <p class="modal-confirmacion-subtitulo">
                {{ itemAQuitar ? `Se quitará "${itemAQuitar.nombre}" de la orden ${ordenSeleccionada?.numero ?? ''}.` : '' }}
              </p>
            </div>
          </div>

          <label class="modal-label">Motivo (requerido)</label>
          <textarea
            v-model="razonQuitarItem"
            class="nota-input"
            placeholder="Ej: Se agregó por error, cliente lo canceló..."
          />

          <div class="modal-confirmacion-botones">
            <button class="btn-outline" @click="cerrarModalQuitarItem">Cancelar</button>
            <button class="btn-principal peligro" :disabled="!razonQuitarItem.trim() || peticionOrdenEnCurso || turnoCerrado" @click="confirmarQuitarItem">
              {{ peticionOrdenEnCurso ? 'Guardando...' : 'Quitar producto' }}
            </button>
          </div>
        </div>
      </ion-modal>

      <ion-modal :is-open="mostrarModalCancelarOrden" class="modal-confirmacion" @didDismiss="cerrarModalCancelarOrden">
        <div class="modal-confirmacion-contenido force-light">
          <div class="modal-confirmacion-header">
            <div class="modal-confirmacion-icon">!</div>
            <div>
              <p class="modal-confirmacion-titulo">Cancelar orden</p>
              <p class="modal-confirmacion-subtitulo">
                Orden {{ ordenSeleccionada?.numero ?? '' }} se marcará como cancelada.
              </p>
            </div>
          </div>

          <label class="modal-label">Motivo (requerido)</label>
          <textarea v-model="razonCancelacion" class="nota-input" placeholder="Ej: Cliente canceló, orden duplicada..." />

          <label v-if="esAdministrador" class="toggle-check">
            <input type="checkbox" v-model="enviarNotificacionCancelacion" />
            Enviar notificación por correo
          </label>

          <div class="modal-confirmacion-botones">
            <button class="btn-outline" @click="cerrarModalCancelarOrden">Volver</button>
            <button class="btn-principal peligro" :disabled="!razonCancelacion.trim() || cancelandoOrden || peticionOrdenEnCurso || turnoCerrado" @click="confirmarCancelarOrden">
              {{ cancelandoOrden || peticionOrdenEnCurso ? 'Cancelando...' : 'Cancelar orden' }}
            </button>
          </div>
        </div>
      </ion-modal>

      <ion-modal :is-open="mostrarModalRecepcion" class="modal-confirmacion" @didDismiss="cerrarModalRecepcion">
        <div class="modal-confirmacion-contenido force-light">
          <div class="modal-confirmacion-header">
            <div class="modal-confirmacion-icon">📦</div>
            <div>
              <p class="modal-confirmacion-titulo">Confirmar recepción</p>
              <p class="modal-confirmacion-subtitulo">
                Orden {{ ordenRecepcionPendiente?.numero ?? ordenSeleccionada?.numero ?? '' }}
              </p>
            </div>
          </div>

          <div class="detalle-recepcion">
            <p class="recepcion-resumen">
              Registradas en la orden: <strong>{{ ordenRecepcionPendiente?.cantidadPrendas ?? 0 }}</strong> prendas
            </p>

            <label class="modal-label">Prendas recibidas ahora</label>
            <div class="modal-input-monto">
              <span>#</span>
              <input
                v-model.number="cantidadRecibidaModal"
                type="number"
                min="1"
                placeholder="0"
              />
            </div>

            <label class="modal-label">Nota interna</label>
            <textarea
              v-model="notaRecepcionModal"
              class="nota-input"
              placeholder="Ej: faltan 2 prendas negras del lote"
            />

            <p class="recepcion-ayuda">
              Si la cantidad recibida es diferente a la registrada, la nota es obligatoria.
            </p>

            <label v-if="esAdministrador" class="toggle-check">
              <input type="checkbox" v-model="enviarNotificacionRecepcion" />
              Enviar notificación por correo
            </label>

            <div class="modal-confirmacion-botones">
              <button class="btn-outline" @click="cerrarModalRecepcion">Cancelar</button>
              <button
                class="btn-principal"
                :disabled="peticionOrdenEnCurso || turnoCerrado"
                @click="confirmarRecepcionModal"
              >
                {{ peticionOrdenEnCurso ? 'Guardando...' : 'Confirmar recepción' }}
              </button>
            </div>
          </div>
        </div>
      </ion-modal>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import AppShell from '@/components/AppShell.vue'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { IonIcon, IonModal, IonSpinner, toastController } from '@ionic/vue'
import {
  useOrdenes,
  type Orden,
  type OrdenEstado,
  type OrdenItem,
  type EstadoPago
} from '@/composables/useOrdenes'
import { fechaHoyCentroamerica, fechaISOaCentroamerica, formatearFechaCentroamerica } from '@/composables/useFechas'
import { useCatalogo } from '@/composables/Usecatalogo'
import { useHistorialCierres } from '@/composables/useHistorialCierres'
import { useTurno } from '@/composables/useTurno'
import { useSesion } from '@/composables/useSesion'
import { enviarCorreoNotificacion } from '@/composables/useCorreo'
import { enviarFacturaOrdenPorCorreo, generarHtmlFacturaOrden } from '@/composables/Usepedido'
import {
  checkmarkCircleOutline,
  closeOutline,
  logoWhatsapp,
  saveOutline,
  mailOutline,
  receiptOutline,
  warningOutline,
  searchOutline,
  cardOutline,
  swapHorizontalOutline,
  imageOutline,
  trashOutline,
  timeOutline,
  refreshOutline,
  checkmarkDoneOutline,
  bagCheckOutline,
  banOutline,
  chevronBackOutline,
  chevronForwardOutline
} from 'ionicons/icons'

const { servicios, cargarCatalogo } = useCatalogo()
const { turno } = useTurno()
const { esAdministrador, esOperador, rol } = useSesion()
const puedeVerMontos = computed(() => esAdministrador.value || rol.value === 'cajero')
const { historialCierres, cargarHistorial } = useHistorialCierres()
const mostrarRestaurarCerrada = computed(() => esAdministrador.value)

const {
  ordenes,
  obtenerOrdenPorId,
  actualizarOrden,
  cambiarEstado,
  marcarPago,
  registrarAnticipo,
  agregarCargoExtra,
  eliminarCargoExtra,
  eliminarAnticipo,
  eliminarFoto,
  agregarItemAOrden,
  eliminarItemDeOrden,
  cancelarOrden,
  restaurarOrden,
  eliminarOrden,
  registrarMovimiento
} = useOrdenes()

/* ============== Colores por estado (idéntico a la vista Órdenes) ============== */
const estadoColores: Record<OrdenEstado, { dot: string; bg: string; text: string; textStrong: string }> = {
  pendiente: { dot: '#e8a317', bg: 'rgba(232, 163, 23, 0.16)', text: '#8a5a09', textStrong: '#a5691c' },
  en_proceso: { dot: '#3b82f6', bg: 'rgba(59, 130, 246, 0.14)', text: '#1d4ed8', textStrong: '#1d4ed8' },
  listo: { dot: '#16a34a', bg: 'rgba(22, 163, 74, 0.14)', text: '#15803d', textStrong: '#15803d' },
  entregado: { dot: '#2b8da0', bg: 'rgba(43, 141, 160, 0.16)', text: '#1f6e7d', textStrong: '#1f6e7d' },
  cerrada: { dot: '#6b7280', bg: 'rgba(107, 114, 128, 0.16)', text: '#4b5563', textStrong: '#374151' },
  cancelada: { dot: '#dc2626', bg: 'rgba(220, 38, 38, 0.14)', text: '#b91c1c', textStrong: '#b91c1c' },
  'Cerrada-Cancelada': { dot: '#7f1d1d', bg: 'rgba(127, 29, 29, 0.14)', text: '#7f1d1d', textStrong: '#7f1d1d' }
}

const filtrosEstado: { label: string; value: 'todos' | OrdenEstado; color: string }[] = [
  { label: 'Todas', value: 'todos', color: '#123a66' },
  { label: 'Pendiente', value: 'pendiente', color: estadoColores.pendiente.dot },
  { label: 'En proceso', value: 'en_proceso', color: estadoColores.en_proceso.dot },
  { label: 'Listo', value: 'listo', color: estadoColores.listo.dot },
  { label: 'Entregado', value: 'entregado', color: estadoColores.entregado.dot },
  { label: 'Entregada-Cerrada', value: 'cerrada', color: estadoColores.cerrada.dot },
  { label: 'Cancelada', value: 'cancelada', color: estadoColores.cancelada.dot }
]

const filtrosEstadoVisibles = computed(() =>
  esOperador.value
    ? filtrosEstado.filter((filtro) => ['todos', 'pendiente', 'en_proceso', 'listo'].includes(filtro.value))
    : filtrosEstado
)

const estadoActivo = ref<'todos' | OrdenEstado>('todos')
const busquedaCalendario = ref('')

const fechaCalendarioOrden = (orden: Pick<Orden, 'estado' | 'fechaEntrega' | 'entregadoAt'>) => {
  if (orden.estado === 'cerrada' && orden.entregadoAt) {
    return orden.entregadoAt.slice(0, 10)
  }

  return orden.fechaEntrega ?? ''
}

/* ============== Responsive ============== */
const anchoVentana = ref(typeof window !== 'undefined' ? window.innerWidth : 1200)
const actualizarAncho = () => { anchoVentana.value = window.innerWidth }
const esMobile = computed(() => anchoVentana.value <= 760)

onMounted(() => {
  window.addEventListener('resize', actualizarAncho)
  void cargarCatalogo()
})
onUnmounted(() => {
  window.removeEventListener('resize', actualizarAncho)
})

/* ============== Navegación de calendario ============== */
const vista = ref<'mes' | 'semana'>('mes')
const fechaAncla = ref(new Date())

const nombresDiasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const nombresDiasLargos = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const nombresMeses = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const claveFecha = (fecha: Date) => {
  const y = fecha.getFullYear()
  const m = String(fecha.getMonth() + 1).padStart(2, '0')
  const d = String(fecha.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const claveHoy = computed(() => claveFecha(new Date()))

const irAnterior = () => {
  const fecha = new Date(fechaAncla.value)
  if (vista.value === 'mes') fecha.setMonth(fecha.getMonth() - 1)
  else fecha.setDate(fecha.getDate() - 7)
  fechaAncla.value = fecha
}

const irSiguiente = () => {
  const fecha = new Date(fechaAncla.value)
  if (vista.value === 'mes') fecha.setMonth(fecha.getMonth() + 1)
  else fecha.setDate(fecha.getDate() + 7)
  fechaAncla.value = fecha
}

const irHoy = () => {
  fechaAncla.value = new Date()
}

/* ============== Vista mes: cuadrícula de 42 celdas ============== */
const diasMes = computed(() => {
  const anio = fechaAncla.value.getFullYear()
  const mes = fechaAncla.value.getMonth()
  const primerDia = new Date(anio, mes, 1)
  const inicioGrid = new Date(anio, mes, 1 - primerDia.getDay())

  const celdas: { clave: string; numero: number; enMes: boolean; esHoy: boolean }[] = []
  for (let i = 0; i < 42; i++) {
    const fecha = new Date(inicioGrid)
    fecha.setDate(inicioGrid.getDate() + i)
    const clave = claveFecha(fecha)
    celdas.push({
      clave,
      numero: fecha.getDate(),
      enMes: fecha.getMonth() === mes,
      esHoy: clave === claveHoy.value
    })
  }
  return celdas
})

/* ============== Vista semana: 7 días a partir del domingo ============== */
const diasSemana = computed(() => {
  const fecha = new Date(fechaAncla.value)
  const inicio = new Date(fecha)
  inicio.setDate(fecha.getDate() - fecha.getDay())

  const dias: { clave: string; numero: number; nombreCorto: string; nombreLargo: string; esHoy: boolean }[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(inicio)
    d.setDate(inicio.getDate() + i)
    const clave = claveFecha(d)
    dias.push({
      clave,
      numero: d.getDate(),
      nombreCorto: nombresDiasSemana[d.getDay()],
      nombreLargo: nombresDiasLargos[d.getDay()],
      esHoy: clave === claveHoy.value
    })
  }
  return dias
})

const tituloPeriodo = computed(() => {
  if (vista.value === 'mes') {
    return `${nombresMeses[fechaAncla.value.getMonth()]} ${fechaAncla.value.getFullYear()}`
  }
  const dias = diasSemana.value
  const inicio = dias[0]
  const fin = dias[6]
  const [anioIni, mesIni] = inicio.clave.split('-').map(Number)
  const [anioFin, mesFin] = fin.clave.split('-').map(Number)
  if (mesIni === mesFin) {
    return `${inicio.numero} - ${fin.numero} de ${nombresMeses[mesIni - 1]} ${anioIni}`
  }
  return `${inicio.numero} de ${nombresMeses[mesIni - 1]} - ${fin.numero} de ${nombresMeses[mesFin - 1]} ${anioFin}`
})

/* ============== Agrupación de órdenes por fecha de calendario ============== */
const ordenesConEntrega = computed(() =>
  ordenes.value.filter((orden) => {
    if (orden.estado === 'cancelada' || orden.estado === 'Cerrada-Cancelada') return false

    if (orden.estado === 'cerrada') {
      return esAdministrador.value && Boolean(fechaCalendarioOrden(orden))
    }

    return Boolean(orden.fechaEntregaActiva && orden.fechaEntrega)
  })
)

const ordenesFiltradasCalendario = computed(() => {
  const ordenesVisibles = esOperador.value
    ? ordenesConEntrega.value.filter((orden) => ['pendiente', 'en_proceso', 'listo'].includes(orden.estado))
    : ordenesConEntrega.value

  const consulta = busquedaCalendario.value.trim().toLowerCase()

  return ordenesVisibles.filter((orden) => {
    const coincideEstado =
      estadoActivo.value === 'todos'
        ? true
        : estadoActivo.value === 'entregado'
          ? orden.estado === 'entregado' || (esAdministrador.value && orden.estado === 'cerrada')
          : orden.estado === estadoActivo.value

    if (!coincideEstado) return false

    if (!consulta) return true

    const texto = [
      orden.numero,
      orden.nombreCliente,
      orden.telefono,
      orden.codigoPais,
      ...orden.items.map((item) => item.nombre)
    ].join(' ').toLowerCase()

    return texto.includes(consulta)
  })
})

const ordenesPorFecha = computed(() => {
  const mapa: Record<string, Orden[]> = {}
  for (const orden of ordenesFiltradasCalendario.value) {
    const clave = fechaCalendarioOrden(orden)
    if (!clave) continue
    if (!mapa[clave]) mapa[clave] = []
    mapa[clave].push(orden)
  }
  for (const clave in mapa) {
    mapa[clave].sort((a, b) => (a.horaEntrega ?? '').localeCompare(b.horaEntrega ?? '') || a.numero.localeCompare(b.numero))
  }
  return mapa
})

/* ============== Modal: órdenes del día ============== */
const diaSeleccionado = ref('')
const mostrarModalDia = computed(() => Boolean(diaSeleccionado.value))

const abrirModalDia = (clave: string) => {
  diaSeleccionado.value = clave
}

const cerrarModalDia = () => {
  diaSeleccionado.value = ''
}

const ordenesModalDia = computed(() => (diaSeleccionado.value ? ordenesPorFecha.value[diaSeleccionado.value] ?? [] : []))

const tituloModalDia = computed(() => {
  if (!diaSeleccionado.value) return ''
  const [anio, mes, dia] = diaSeleccionado.value.split('-').map(Number)
  const fecha = new Date(anio, mes - 1, dia)
  return `${nombresDiasLargos[fecha.getDay()]} ${dia} de ${nombresMeses[mes - 1]} ${anio}`
})

/* ============== Estado del detalle de orden (idéntico a la vista Órdenes) ============== */
const ordenSeleccionadaId = ref('')
const notaBorrador = ref('')
const guardandoNota = ref(false)
const notaGuardada = ref(false)
const errorNota = ref('')
const editandoCliente = ref(false)
const guardandoCliente = ref(false)
const errorEdicionCliente = ref('')
const clienteBorrador = ref({ nombre: '', telefono: '', correo: '' })
const esElectron = computed(() => typeof (window as any).electronAPI?.detectarNavegadores === 'function')

const estadosCambio = [
  { value: 'pendiente' as const, label: 'Pendiente', emoji: '🕒' },
  { value: 'en_proceso' as const, label: 'En proceso', emoji: '⚙️' },
  { value: 'listo' as const, label: 'Listo', emoji: '✅' },
  { value: 'entregado' as const, label: 'Entregado', emoji: '📦' }
]

const estadosCambioVisibles = computed(() =>
  esOperador.value
    ? estadosCambio.filter((estado) => estado.value === 'en_proceso' || estado.value === 'listo')
    : estadosCambio
)

const estadosOrden: OrdenEstado[] = ['pendiente', 'en_proceso', 'listo', 'entregado']

const mostrarConfirmacionEstado = ref(false)
const ordenCambioPendienteId = ref('')
const estadoObjetivoCambio = ref<OrdenEstado | ''>('')
const mostrarModalRecepcion = ref(false)
const ordenRecepcionPendienteId = ref('')
const cantidadRecibidaModal = ref(0)
const notaRecepcionModal = ref('')
const mostrarModalCargoExtra = ref(false)
const descripcionCargoExtra = ref('')
const montoCargoExtra = ref(0)
const enviandoCorreo = ref(false)
const peticionOrdenEnCurso = ref(false)
const restaurandoOrdenCerrada = ref(false)
const mostrarModalComprobante = ref(false)
const mostrarModalRestaurar = ref(false)
const comprobanteActual = ref('')

const comprobanteEsImagen = computed(() => {
  const comprobante = comprobanteActual.value
  return /^data:image\//i.test(comprobante) || /\.(png|jpe?g|gif|webp|bmp|svg)(\?|#|$)/i.test(comprobante)
})

const abrirModalComprobante = (url?: string) => {
  if (!url) return
  comprobanteActual.value = url
  mostrarModalComprobante.value = true
}

const cerrarModalComprobante = () => {
  mostrarModalComprobante.value = false
  comprobanteActual.value = ''
}

const abrirModalCargoExtra = () => {
  if (ordenSeleccionada.value?.estado === 'cancelada') return
  descripcionCargoExtra.value = ''
  montoCargoExtra.value = 0
  mostrarModalCargoExtra.value = true
}

const mostrarModalAgregarProducto = ref(false)
const busquedaProducto = ref('')
const cantidadesServicios = ref<Record<string, number>>({})

const productosFiltrados = computed(() => {
  const consulta = busquedaProducto.value.trim().toLowerCase()
  if (!consulta) return servicios.value
  return servicios.value.filter((s) => s.nombre.toLowerCase().includes(consulta))
})

const abrirModalAgregarProducto = () => {
  if (ordenSeleccionada.value?.estado === 'cancelada') return
  busquedaProducto.value = ''
  cantidadesServicios.value = {}
  mostrarModalAgregarProducto.value = true
}

const cerrarModalAgregarProducto = () => {
  mostrarModalAgregarProducto.value = false
  cantidadesServicios.value = {}
}

const cantidadServicio = (id: string) => cantidadesServicios.value[id] ?? 0

const cambiarCantidadServicio = (id: string, cambio: number) => {
  const cantidad = Math.max(0, cantidadServicio(id) + cambio)
  if (cantidad === 0) delete cantidadesServicios.value[id]
  else cantidadesServicios.value[id] = cantidad
}

const hayServiciosSeleccionados = computed(() => Object.values(cantidadesServicios.value).some((cantidad) => cantidad > 0))

const agregarServiciosSeleccionados = async () => {
  if (!ordenSeleccionada.value || ordenSeleccionada.value.estado === 'cancelada' || peticionOrdenEnCurso.value) return
  peticionOrdenEnCurso.value = true

  try {
    for (const [id, cantidad] of Object.entries(cantidadesServicios.value)) {
      const servicio = servicios.value.find((item) => item.id === id)
      if (servicio && cantidad > 0) {
        await agregarItemAOrden(ordenSeleccionada.value.id, servicio, cantidad)
      }
    }
    cerrarModalAgregarProducto()
  } catch (error) {
    window.alert(error instanceof Error ? error.message : 'No se pudieron agregar los servicios.')
  } finally {
    peticionOrdenEnCurso.value = false
  }
}

const etiquetaUnidadProducto = (u: string) => {
  const map: Record<string, string> = {
    kilo: 'kilo',
    libra: 'lb',
    pieza: 'pieza',
    m2: 'm²',
    galon: 'galón',
    mililitro: 'mL',
    otro: 'unidad'
  }
  return map[u] ?? 'unidad'
}

const mostrarModalQuitarItem = ref(false)
const itemAQuitar = ref<OrdenItem | null>(null)
const razonQuitarItem = ref('')

const abrirModalQuitarItem = (item: OrdenItem) => {
  if (!esAdministrador.value || esOperador.value) return
  itemAQuitar.value = item
  razonQuitarItem.value = ''
  mostrarModalQuitarItem.value = true
}

const cerrarModalQuitarItem = () => {
  mostrarModalQuitarItem.value = false
  itemAQuitar.value = null
}

const confirmarQuitarItem = async () => {
  if (!esAdministrador.value || !ordenSeleccionada.value || !itemAQuitar.value || !razonQuitarItem.value.trim() || peticionOrdenEnCurso.value) return
  peticionOrdenEnCurso.value = true

  try {
    await eliminarItemDeOrden(ordenSeleccionada.value.id, itemAQuitar.value.id, razonQuitarItem.value)
    cerrarModalQuitarItem()
  } catch (error) {
    window.alert(error instanceof Error ? error.message : 'No se pudo quitar el producto.')
  } finally {
    peticionOrdenEnCurso.value = false
  }
}

const cerrarModalCargoExtra = () => {
  mostrarModalCargoExtra.value = false
}

const confirmarCargoExtra = async () => {
  if (!ordenSeleccionada.value || ordenSeleccionada.value.estado === 'cancelada' || montoCargoExtra.value <= 0 || peticionOrdenEnCurso.value) return
  peticionOrdenEnCurso.value = true

  try {
    await agregarCargoExtra(ordenSeleccionada.value.id, descripcionCargoExtra.value, montoCargoExtra.value)
    cerrarModalCargoExtra()
  } catch (error) {
    window.alert(error instanceof Error ? error.message : 'No se pudo agregar el cargo extra.')
  } finally {
    peticionOrdenEnCurso.value = false
  }
}

const crearFacturaCorreo = (orden: Orden) => ({
  numero: orden.numero,
  nombreCliente: orden.nombreCliente,
  createdAt: orden.createdAt,
  total: orden.total,
  subtotal: orden.subtotal,
  descuento: orden.descuento,
  items: orden.items,
  correo: orden.correo,
  fechaEntregaActiva: orden.fechaEntregaActiva,
  fechaEntregaTexto: orden.fechaEntregaActiva ? textoEntrega(orden) : '',
  cantidadPrendas: orden.cantidadPrendas,
  detallesPrendas: orden.detallesPrendas,
  estado: orden.estado,
  estadoPago: orden.estadoPago,
  montoRecibido: orden.montoRecibido
})

const enviarEmail = async () => {
  const orden = ordenSeleccionada.value
  if (!orden?.correo || enviandoCorreo.value) return

  enviandoCorreo.value = true
  try {
    await enviarFacturaOrdenPorCorreo(crearFacturaCorreo(orden))
    const toast = await toastController.create({
      message: 'Factura enviada por correo exitosamente.',
      duration: 2500,
      color: 'success'
    })
    await toast.present()
  } catch (error) {
    const toast = await toastController.create({
      message: error instanceof Error ? error.message : 'No se pudo enviar la factura por correo.',
      duration: 3000,
      color: 'danger'
    })
    await toast.present()
  } finally {
    enviandoCorreo.value = false
  }
}

const turnoCerrado = computed(() => !turno.abierto && !esAdministrador.value)

const anticiposDelTurnoEntrega = computed(() => {
  const orden = ordenSeleccionada.value
  if (!orden?.turnoId) return orden?.anticipos ?? []
  return orden.anticipos.filter((anticipo) => anticipo.turnoId === orden.turnoId)
})

const anticiposOtrosTurnos = computed(() => {
  const orden = ordenSeleccionada.value
  if (!orden?.turnoId) return orden?.anticipos ?? []
  return orden.anticipos.filter((anticipo) => anticipo.turnoId !== orden.turnoId)
})

const montoPagosTurnoEntrega = computed(() =>
  anticiposDelTurnoEntrega.value.reduce((total, anticipo) => total + Number(anticipo.monto || 0), 0)
)

const MAX_FOTOS_ORDEN = 6

const mostrarModalAnticipo = ref(false)
const montoAnticipoModal = ref(0)
const fechaEntregadoModal = ref(fechaHoyCentroamerica())
const enviarNotificacionCambioEstado = ref(true)
const registrarAnticipoAntiguo = ref(false)
const turnoIdAnticipoAntiguo = ref('')
const registrarEntregaAntigua = ref(false)
const turnoIdEntregaAntigua = ref('')
const fechaCreacionBorrador = ref('')
const fechaEntregaBorrador = ref('')
const guardandoFechas = ref(false)

const turnosParaAnticipoAntiguo = computed(() => {
  const lista: { id: string; etiqueta: string; horaInicio: string | null }[] = []
  if (turno.abierto && turno.id) {
    lista.push({
      id: turno.id,
      etiqueta: `Caja #${turno.numeroCaja} - ${formatearFechaCentroamerica(turno.horaInicio, { day: '2-digit', month: '2-digit', year: 'numeric' })} (actual)`,
      horaInicio: turno.horaInicio
    })
  }
  for (const cierre of historialCierres.value) {
    if (turno.abierto && cierre.turnoId === turno.id) continue
    lista.push({
      id: cierre.turnoId,
      etiqueta: `Caja #${cierre.numeroCaja} - ${formatearFechaCentroamerica(cierre.horaInicio, { day: '2-digit', month: '2-digit', year: 'numeric' })}`,
      horaInicio: cierre.horaInicio
    })
  }
  return lista
})

const fechaAnticipoAntiguo = computed(() => {
  const elegido = turnosParaAnticipoAntiguo.value.find((opcion) => opcion.id === turnoIdAnticipoAntiguo.value)
  return elegido?.horaInicio ? fechaISOaCentroamerica(elegido.horaInicio) : ''
})

const mostrarToastAnticipo = async (mensaje: string) => {
  const toast = await toastController.create({
    message: mensaje,
    duration: 3500,
    color: 'success',
    position: 'top'
  })
  await toast.present()
}

const textoMovimientoVisible = (texto: string) =>
  texto
    .replace(/(Caja\s+#\d+)\s*\([^)]*\)/gi, '$1')
    .replace(/\s*\(turno\s+[^)]+\)/gi, '')

const claseMovimiento = (texto: string) => {
  const textoLimpio = texto.toLowerCase()
  if (textoLimpio.includes('se elimin')) return 'movimiento-rojo'
  if (textoLimpio.includes('pagado') || textoLimpio.includes('entregado')) return 'movimiento-verde'
  return ''
}

const claseMovimientoBullet = (texto: string) => {
  return claseMovimiento(texto) || ''
}

const claseTextoMovimiento = (texto: string) => {
  const textoLimpio = texto.toLowerCase()
  if (textoLimpio.includes('se elimin')) return 'movimiento-texto-rojo'
  if (textoLimpio.includes('pagado') || textoLimpio.includes('entregado')) return 'movimiento-texto-verde'
  return ''
}

const abrirModalAnticipo = () => {
  if (esOperador.value) return
  if (ordenSeleccionada.value?.estado === 'cancelada') return
  montoAnticipoModal.value = 0
  registrarAnticipoAntiguo.value = false
  turnoIdAnticipoAntiguo.value = turno.id || ''
  if (esAdministrador.value) void cargarHistorial()
  mostrarModalAnticipo.value = true
}

const cerrarModalAnticipo = () => {
  mostrarModalAnticipo.value = false
}

const confirmarAnticipoModal = async () => {
  if (!ordenSeleccionada.value || ordenSeleccionada.value.estado === 'cancelada' || montoAnticipoModal.value <= 0 || peticionOrdenEnCurso.value) return
  const usarAnticipoAntiguo = esAdministrador.value && registrarAnticipoAntiguo.value
  if (usarAnticipoAntiguo && (!fechaAnticipoAntiguo.value || !turnoIdAnticipoAntiguo.value)) {
    void mostrarToastAnticipo('Selecciona el turno para el anticipo antiguo.')
    return
  }
  peticionOrdenEnCurso.value = true
  const orden = ordenSeleccionada.value
  const saldoPendiente = Math.max(0, orden.total - orden.montoRecibido)
  const cambio = Math.max(0, montoAnticipoModal.value - saldoPendiente)

  try {
    const resultado = await registrarAnticipo(
      orden.id,
      montoAnticipoModal.value,
      usarAnticipoAntiguo
        ? { fecha: fechaAnticipoAntiguo.value, turnoId: turnoIdAnticipoAntiguo.value }
        : { turnoId: turno.id }
    )
    if (resultado) {
      if (usarAnticipoAntiguo) await cargarHistorial()
      cerrarModalAnticipo()

      if (cambio > 0) {
        void mostrarToastAnticipo(`Cambio a entregar: $${cambio.toFixed(2)}. La orden quedó totalmente cobrada.`)
      } else if (orden.montoRecibido + montoAnticipoModal.value >= orden.total) {
        void mostrarToastAnticipo('La orden quedó totalmente cobrada.')
      } else {
        void mostrarToastAnticipo('Anticipo registrado correctamente.')
      }
    } else {
      void mostrarToastAnticipo('Error al registrar anticipo. Intenta nuevamente.')
    }
  } catch (error) {
    void mostrarToastAnticipo(error instanceof Error ? error.message : 'Error al registrar anticipo. Intenta nuevamente.')
  } finally {
    peticionOrdenEnCurso.value = false
  }
}

const eliminarCargoExtraSeleccionado = async (idCargo: string) => {
  if (!ordenSeleccionada.value || peticionOrdenEnCurso.value) return
  peticionOrdenEnCurso.value = true

  try {
    await eliminarCargoExtra(ordenSeleccionada.value.id, idCargo)
  } catch (error) {
    window.alert(error instanceof Error ? error.message : 'No se pudo eliminar el cargo extra.')
  } finally {
    peticionOrdenEnCurso.value = false
  }
}

const eliminarAnticipoSeleccionado = async (idAnticipo: string) => {
  if (!esAdministrador.value || !ordenSeleccionada.value || peticionOrdenEnCurso.value) return
  peticionOrdenEnCurso.value = true

  try {
    await eliminarAnticipo(ordenSeleccionada.value.id, idAnticipo)
  } catch (error) {
    window.alert(error instanceof Error ? error.message : 'No se pudo eliminar el anticipo.')
  } finally {
    peticionOrdenEnCurso.value = false
  }
}

const eliminarFotoSeleccionada = async (index: number) => {
  if (!ordenSeleccionada.value || peticionOrdenEnCurso.value) return
  peticionOrdenEnCurso.value = true

  try {
    await eliminarFoto(ordenSeleccionada.value.id, index)
  } catch (error) {
    window.alert(error instanceof Error ? error.message : 'No se pudo eliminar la foto.')
  } finally {
    peticionOrdenEnCurso.value = false
  }
}

const manejarFotosOrden = async (event: Event) => {
  if (peticionOrdenEnCurso.value) return
  const input = event.target as HTMLInputElement
  const id = ordenSeleccionada.value?.id
  if (!id || ordenSeleccionada.value?.estado === 'cancelada' || !input?.files?.length) return

  const fotosActuales = obtenerOrdenPorId(id)?.fotos ?? []
  const archivos = Array.from(input.files).slice(0, MAX_FOTOS_ORDEN - fotosActuales.length)

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

  if (nuevasFotos.length === 0) {
    input.value = ''
    return
  }

  peticionOrdenEnCurso.value = true
  try {
    await actualizarOrden(id, { fotos: [...fotosActuales, ...nuevasFotos] })
    input.value = ''
  } catch (error) {
    window.alert(error instanceof Error ? error.message : 'No se pudieron guardar las fotos.')
  } finally {
    peticionOrdenEnCurso.value = false
  }
}

const mostrarModalCancelarOrden = ref(false)
const razonCancelacion = ref('')
const cancelandoOrden = ref(false)
const enviarNotificacionCancelacion = ref(true)
const enviarNotificacionRecepcion = ref(true)

const abrirModalCancelarOrden = () => {
  if (esOperador.value) return
  razonCancelacion.value = ''
  enviarNotificacionCancelacion.value = true
  mostrarModalCancelarOrden.value = true
}

const cerrarModalCancelarOrden = () => {
  mostrarModalCancelarOrden.value = false
}

const confirmarCancelarOrden = async () => {
  if (!ordenSeleccionada.value || !razonCancelacion.value.trim() || cancelandoOrden.value || peticionOrdenEnCurso.value) return

  const orden = ordenSeleccionada.value
  cancelandoOrden.value = true
  peticionOrdenEnCurso.value = true

  try {
    const ordenCancelada = await cancelarOrden(orden.id, razonCancelacion.value)
    if (!ordenCancelada) {
      window.alert('No se pudo cancelar la orden. Intenta nuevamente.')
      return
    }

    if (enviarNotificacionCancelacion.value) {
      void enviarNotificacionEstado(orden, 'cancelada')
    }
    cerrarModalCancelarOrden()
  } catch (error) {
    window.alert(error instanceof Error ? error.message : 'No se pudo cancelar la orden.')
  } finally {
    cancelandoOrden.value = false
    peticionOrdenEnCurso.value = false
  }
}

const confirmarEliminarOrden = async () => {
  if (!esAdministrador.value || esOperador.value || !ordenSeleccionada.value || peticionOrdenEnCurso.value) return
  const ok = window.confirm(
    `¿Deseas eliminar definitivamente la orden ${ordenSeleccionada.value.numero}? El inventario se restaurará.`
  )
  if (!ok) return

  const idOrden = ordenSeleccionada.value.id
  cerrarDetalle()
  peticionOrdenEnCurso.value = true
  try {
    await eliminarOrden(idOrden)
  } catch (error) {
    window.alert(error instanceof Error ? error.message : 'No se pudo eliminar la orden.')
  } finally {
    peticionOrdenEnCurso.value = false
  }
}

const ordenSeleccionada = computed(() =>
  ordenSeleccionadaId.value ? obtenerOrdenPorId(ordenSeleccionadaId.value) : null
)

const iniciarEdicionCliente = () => {
  const orden = ordenSeleccionada.value
  if (!esAdministrador.value || !orden) return
  clienteBorrador.value = {
    nombre: orden.nombreCliente,
    telefono: orden.telefono,
    correo: orden.correo
  }
  errorEdicionCliente.value = ''
  editandoCliente.value = true
}

const cancelarEdicionCliente = () => {
  editandoCliente.value = false
  errorEdicionCliente.value = ''
}

const guardarEdicionCliente = async () => {
  const orden = ordenSeleccionada.value
  const nombre = clienteBorrador.value.nombre.trim()
  const telefono = clienteBorrador.value.telefono.replace(/\D/g, '')
  const correo = clienteBorrador.value.correo.trim().toLowerCase()

  if (!orden || !esAdministrador.value || guardandoCliente.value) return
  if (!nombre) {
    errorEdicionCliente.value = 'El nombre del cliente es obligatorio.'
    return
  }
  if (!/^\d{7,15}$/.test(telefono)) {
    errorEdicionCliente.value = 'El celular debe tener entre 7 y 15 dígitos.'
    return
  }
  if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    errorEdicionCliente.value = 'Ingresa un correo electrónico válido.'
    return
  }

  guardandoCliente.value = true
  errorEdicionCliente.value = ''
  try {
    await actualizarOrden(orden.id, { nombreCliente: nombre, telefono, correo })
    editandoCliente.value = false
  } catch (error) {
    errorEdicionCliente.value = error instanceof Error ? error.message : 'No se pudieron guardar los datos.'
  } finally {
    guardandoCliente.value = false
  }
}

const detalleAbierto = computed(() => Boolean(ordenSeleccionada.value))

const ordenCambioPendiente = computed(() =>
  ordenCambioPendienteId.value ? obtenerOrdenPorId(ordenCambioPendienteId.value) : null
)

const ordenRecepcionPendiente = computed(() =>
  ordenRecepcionPendienteId.value ? obtenerOrdenPorId(ordenRecepcionPendienteId.value) : null
)

const estadoObjetivoTexto = computed(() => (estadoObjetivoCambio.value ? textoEstado(estadoObjetivoCambio.value) : ''))

const abrirDetalle = (id: string) => {
  ordenSeleccionadaId.value = id
  const orden = obtenerOrdenPorId(id)
  if (orden) {
    fechaCreacionBorrador.value = orden.createdAt.slice(0, 10)
    fechaEntregaBorrador.value = orden.fechaEntrega ?? ''
  }
}

const restaurarOrdenCerrada = async () => {
  const orden = ordenSeleccionada.value
  if (!esAdministrador.value || !orden || orden.estado !== 'cerrada' || restaurandoOrdenCerrada.value) return

  mostrarModalRestaurar.value = true
}

const cerrarModalRestaurar = () => {
  if (restaurandoOrdenCerrada.value) return
  mostrarModalRestaurar.value = false
}

const confirmarRestaurarOrden = async () => {
  const orden = ordenSeleccionada.value
  if (!esAdministrador.value || !orden || orden.estado !== 'cerrada' || restaurandoOrdenCerrada.value) return

  restaurandoOrdenCerrada.value = true
  try {
    const restaurada = await restaurarOrden(orden.id)
    if (!restaurada) throw new Error('No se pudo restaurar la orden.')
    mostrarModalRestaurar.value = false
    window.alert('Orden restaurada a pendiente. El pago del turno de entrega se eliminó y los anticipos de otros turnos se conservaron.')
    cerrarDetalle()
  } catch (error) {
    window.alert(error instanceof Error ? error.message : 'No se pudo restaurar la orden.')
  } finally {
    restaurandoOrdenCerrada.value = false
  }
}

const guardarFechasOrden = async () => {
  const orden = ordenSeleccionada.value
  if (!esAdministrador.value || !orden || !fechaCreacionBorrador.value || !fechaEntregaBorrador.value || guardandoFechas.value) return

  guardandoFechas.value = true
  try {
    await actualizarOrden(orden.id, {
      fechaCreacion: fechaCreacionBorrador.value,
      fechaEntrega: fechaEntregaBorrador.value
    })
    window.alert('Fechas de la orden actualizadas correctamente.')
  } catch (error) {
    window.alert(error instanceof Error ? error.message : 'No se pudieron actualizar las fechas.')
  } finally {
    guardandoFechas.value = false
  }
}

watch(
  ordenSeleccionada,
  (orden) => {
    if (!orden) return
    fechaCreacionBorrador.value = orden.createdAt.slice(0, 10)
    fechaEntregaBorrador.value = orden.fechaEntrega ?? ''
  },
  { immediate: true }
)

watch(busquedaCalendario, (consulta) => {
  const valor = consulta.trim().toLowerCase()
  if (!valor) return

  const ordenCoincidente = ordenesConEntrega.value.find((orden) => {
    const texto = [
      orden.numero,
      orden.nombreCliente,
      orden.telefono,
      orden.codigoPais,
      ...orden.items.map((item) => item.nombre)
    ].join(' ').toLowerCase()

    return texto.includes(valor)
  })

  const claveOrden = ordenCoincidente ? fechaCalendarioOrden(ordenCoincidente) : ''
  if (claveOrden) {
    fechaAncla.value = new Date(`${claveOrden}T00:00:00`)
  }
})

const cerrarDetalle = () => {
  ordenSeleccionadaId.value = ''
  notaBorrador.value = ''
}

watch(
  ordenSeleccionada,
  (orden) => {
    notaBorrador.value = orden?.notaInterna ?? ''
  },
  { immediate: true }
)

watch(notaBorrador, () => {
  if (!guardandoNota.value) {
    notaGuardada.value = false
    errorNota.value = ''
  }
})

const requiereIntervencion = (orden?: Pick<Orden, 'estado' | 'turnoHuerfano' | 'estadoPago'> | null) => {
  if (!orden) return false
  return (orden.estado === 'cerrada' && orden.estadoPago !== 'pagado') || orden.turnoHuerfano === true
}

const motivoIntervencion = (orden?: Pick<Orden, 'estado' | 'turnoHuerfano' | 'estadoPago'> | null) => {
  if (!orden) return ''

  if (orden.estado === 'cerrada' && orden.estadoPago !== 'pagado') return 'Orden cerrada sin pago completo'
  if (orden.turnoHuerfano === true) return 'Entrega no encontrada en el cierre'

  return ''
}

const textoCierreOrden = (orden?: Pick<Orden, 'turnoId' | 'entregadoAt'> | null) => {
  if (orden?.entregadoAt) {
    const fecha = formatearFechaCentroamerica(orden.entregadoAt, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
    return `Orden cerrada el ${fecha}`
  }

  if (!orden?.turnoId) return 'Orden cerrada sin caja asignada'

  const cierre = historialCierres.value.find((item) => item.turnoId === orden.turnoId)
  if (!cierre) return 'Orden cerrada en una caja cuyo cierre no está registrado'

  const fecha = cierre.horaInicio
    ? formatearFechaCentroamerica(cierre.horaInicio, { day: '2-digit', month: '2-digit', year: 'numeric' })
    : 'fecha no disponible'

  return `Orden cerrada en Caja #${cierre.numeroCaja} del ${fecha}`
}

const textoEstado = (estado: OrdenEstado) => {
  const map: Record<OrdenEstado, string> = {
    pendiente: 'Pendiente',
    en_proceso: 'En proceso',
    listo: 'Listo',
    entregado: 'Entregado',
    cerrada: 'Entregada-Cerrada',
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

const totalFinalOrden = (orden?: Pick<Orden, 'total' | 'montoRecibido' | 'estado'> | null) =>
  Number(((orden?.estado === 'cancelada' ? -1 : 1) * Math.abs((orden?.total ?? 0) - (orden?.montoRecibido ?? 0))).toFixed(2))

const escaparHtml = (texto: string) =>
  texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const formatearFechaCorta = (valor: string) =>
  formatearFechaCentroamerica(valor, { day: '2-digit', month: 'short', year: 'numeric' })

const construirMensajeWhatsApp = () => {
  const orden = ordenSeleccionada.value
  if (!orden) return ''

  const pad = (texto: string, ancho: number) => (texto.length >= ancho ? texto.slice(0, ancho) : texto + ' '.repeat(ancho - texto.length))
  const padIzq = (texto: string, ancho: number) => (texto.length >= ancho ? texto.slice(0, ancho) : ' '.repeat(ancho - texto.length) + texto)
  const formatoMonto = (monto: number) => {
    const signo = monto < 0 ? '-' : ''
    return `${signo}$${Math.abs(monto).toFixed(2)}`
  }

  const lineaItem = (item: (typeof orden.items)[number]) => {
    const cantidad = Number(item.cantidad) || 0
    const precioUnitario = Number(item.precio) || 0
    const subtotalServicio = precioUnitario * cantidad
    return [
      `${cantidad}x ${item.nombre}`,
      `   Precio por unidad: ${formatoMonto(precioUnitario)}`,
      `   Subtotal servicio: ${formatoMonto(subtotalServicio)}`
    ].join('\n')
  }

  const lineaTotal = (etiqueta: string, monto: number) => `${pad(etiqueta, 14)}${padIzq(formatoMonto(monto), 10)}`

  const servicios = orden.items.length ? orden.items.map((item) => lineaItem(item)).join('\n') : 'Sin servicios registrados'
  const descuento = Math.max(0, orden.subtotal - orden.total)
  const entrega = orden.fechaEntrega ? textoEntrega(orden) : 'Te avisaremos cuando esté lista para recoger.'

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
    lineaTotal('Subtotal', orden.subtotal),
    lineaTotal('Descuento', -descuento),
    '----------',
    lineaTotal('TOTAL', orden.total),
    lineaTotal('Recibido', orden.montoRecibido),
    '----------',
    `PAGO   : *${textoEstadoPago(orden.estadoPago)}*`,
    `ESTADO : *${textoEstado(orden.estado)}*`,
    `Entrega: ${entrega}`,
    ...(orden.estado === 'entregado' ? [`Entregada el: *${formatearFechaHora(orden.updatedAt)}*`] : []),
    '----------',
    '📌 *POLÍTICA DEL SERVICIO*',
    '• Presenta este mensaje o tu recibo al retirar tu ropa.',
    '• Las prendas deben retirarse en máx. 1 día después de estar listas.',
    '• Reclamos dentro de los 2 días hábiles posteriores a la entrega.',
    '',
    '🙏 Gracias por confiar en *Lavandería Salinas* 💙',
    '📧 lavanderiasalinassv@gmail.com'
  ].filter(Boolean).join('\n')
}

const enviarWhatsApp = async () => {
  const orden = ordenSeleccionada.value
  if (!orden || typeof window === 'undefined') return

  const mensaje = construirMensajeWhatsApp()
  if (!mensaje) return

  const numero = `${orden.codigoPais}${orden.telefono}`.replace(/\D/g, '')

  const urlDesktop = numero
    ? `whatsapp://send?phone=${numero}&text=${encodeURIComponent(mensaje)}`
    : `whatsapp://send?text=${encodeURIComponent(mensaje)}`

  const urlWeb = numero
    ? `https://api.whatsapp.com/send?phone=${numero}&text=${encodeURIComponent(mensaje)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(mensaje)}`

  if (!esElectron.value) {
    window.open(urlWeb, '_blank', 'noopener,noreferrer')
    return
  }

  try {
    await (window as any).electronAPI.abrirWhatsAppDesktop(urlDesktop)
  } catch (error) {
    console.error('No se pudo abrir WhatsApp Desktop, se usa el enlace web como respaldo:', error)
    window.open(urlWeb, '_blank', 'noopener,noreferrer')
  }
}

const resumenServicios = (items: OrdenItem[]) => items.map((item) => item.nombre).join(', ')

const textoEntrega = (orden: Orden) => {
  if (!orden.fechaEntrega) return 'Sin fecha'
  const fecha = new Date(`${orden.fechaEntrega}T00:00:00`)
  return fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
}

const ordenVencida = (orden: Orden) => {
  if (!orden.fechaEntrega || orden.estado === 'entregado' || orden.estado === 'cancelada' || orden.estado === 'cerrada') return false
  return orden.fechaEntrega < fechaHoyCentroamerica()
}

const formatearHora = (valor: string) => formatearFechaCentroamerica(valor, { hour: '2-digit', minute: '2-digit' })

const formatearFechaHora = (valor: string) =>
  formatearFechaCentroamerica(valor, { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const puedeCambiarEstado = (estadoActual: OrdenEstado, estadoDestino: OrdenEstado) => {
  if (esOperador.value) {
    return (
      (estadoActual === 'pendiente' && estadoDestino === 'en_proceso') ||
      (estadoActual === 'en_proceso' && estadoDestino === 'listo')
    )
  }

  const indiceDestino = estadosOrden.indexOf(estadoDestino)
  if (indiceDestino === -1) return false
  if (esAdministrador.value && estadoActual === 'cancelada') return true

  const indiceActual = estadosOrden.indexOf(estadoActual)
  if (indiceActual === -1 || indiceActual === indiceDestino) return false

  return esAdministrador.value ? true : indiceDestino === indiceActual + 1
}

const solicitarCambioEstado = (idOrden: string, estadoDestino: OrdenEstado) => {
  const orden = obtenerOrdenPorId(idOrden)
  if (!orden) return

  if (!puedeCambiarEstado(orden.estado, estadoDestino)) return

  ordenCambioPendienteId.value = idOrden
  estadoObjetivoCambio.value = estadoDestino
  enviarNotificacionCambioEstado.value = true
  if (estadoDestino === 'entregado') {
    fechaEntregadoModal.value = fechaHoyCentroamerica()
    registrarEntregaAntigua.value = false
    turnoIdEntregaAntigua.value = turno.id || ''
    if (esAdministrador.value) void cargarHistorial()
  }

  if (esOperador.value && estadoDestino === 'en_proceso' && orden.estado === 'pendiente') {
    ordenRecepcionPendienteId.value = idOrden
    cantidadRecibidaModal.value = Number(orden.cantidadPrendas || 0)
    notaRecepcionModal.value = ''
    mostrarModalRecepcion.value = true
    return
  }

  mostrarConfirmacionEstado.value = true
}

const cancelarCambioEstado = () => {
  mostrarConfirmacionEstado.value = false
  ordenCambioPendienteId.value = ''
  estadoObjetivoCambio.value = ''
}

const cerrarModalRecepcion = () => {
  mostrarModalRecepcion.value = false
  ordenRecepcionPendienteId.value = ''
  cantidadRecibidaModal.value = 0
  notaRecepcionModal.value = ''
  ordenCambioPendienteId.value = ''
  estadoObjetivoCambio.value = ''
}

const confirmarRecepcionModal = async () => {
  const orden = obtenerOrdenPorId(ordenRecepcionPendienteId.value)
  if (!orden || peticionOrdenEnCurso.value) return

  const cantidadOriginal = Number(orden.cantidadPrendas || 0)
  const cantidadRecibida = Number(cantidadRecibidaModal.value || 0)
  const notaLimpia = notaRecepcionModal.value.trim()

  if (!Number.isFinite(cantidadRecibida) || cantidadRecibida <= 0) {
    window.alert('Debes ingresar cuántas prendas se recibieron.')
    return
  }

  if (cantidadRecibida !== cantidadOriginal && !notaLimpia) {
    window.alert('Si la cantidad recibida es diferente a la registrada, agrega una nota interna para dejar constancia.')
    return
  }

  peticionOrdenEnCurso.value = true

  try {
    const notaInterna = [
      `Recepción por operador: ${cantidadRecibida} de ${cantidadOriginal} prendas${cantidadRecibida !== cantidadOriginal ? ' (cantidad diferente)' : ''}`,
      notaLimpia ? `Nota del operador: ${notaLimpia}` : ''
    ].filter(Boolean).join(' | ')

    const ordenActualizada = await cambiarEstado(orden.id, 'en_proceso', {
      cantidadPrendas: cantidadRecibida,
      notaInterna
    })

    if (enviarNotificacionRecepcion.value) {
      void enviarNotificacionEstado(ordenActualizada, 'en_proceso', ordenActualizada.updatedAt)
    }
    cerrarModalRecepcion()
  } catch (error) {
    window.alert(error instanceof Error ? error.message : 'No se pudo registrar la recepción de la orden.')
  } finally {
    peticionOrdenEnCurso.value = false
  }
}

const enviarNotificacionEstado = async (orden: Orden, estado: OrdenEstado, entregadaAt?: string) => {
  if (!orden.correo || !orden.correo.trim()) return

  let asunto = ''
  let mensaje = ''

  switch (estado) {
    case 'pendiente':
      asunto = `Orden ${orden.numero} recibida - Lavandería Salinas`
      mensaje = `
        <div style="text-align:center; padding:8px 0 4px;">
          <div style="display:inline-block; width:64px; height:64px; line-height:64px; border-radius:50%; background:#fff4d6; color:#b7791f; font-size:30px;">🕒</div>
          <h1 style="margin:18px 0 8px; color:#b7791f; font-size:26px;">Orden recibida</h1>
          <p style="margin:0 auto; max-width:460px; color:#526b82; font-size:16px; line-height:1.6;">Hola ${orden.nombreCliente}, hemos recibido tu orden <strong>${orden.numero}</strong>. Te notificaremos cuando comencemos a trabajar en ella.</p>
        </div>
      `
      break
    case 'en_proceso':
      asunto = `Orden ${orden.numero} en proceso - Lavandería Salinas`
      mensaje = `
        <div style="text-align:center; padding:8px 0 4px;">
          <div style="display:inline-block; width:64px; height:64px; line-height:64px; border-radius:50%; background:#fff0df; color:#ea7a16; font-size:30px;">🧺</div>
          <h1 style="margin:18px 0 8px; color:#ea7a16; font-size:26px;">¡Estamos trabajando en tu orden!</h1>
          <p style="margin:0 auto; max-width:460px; color:#526b82; font-size:16px; line-height:1.6;">Hola ${orden.nombreCliente}, tu orden <strong>${orden.numero}</strong> está en proceso. Te avisaremos cuando esté lista para recoger.</p>
        </div>
      `
      break
    case 'listo':
      asunto = `¡Tu orden ${orden.numero} está lista! - Lavandería Salinas`
      mensaje = `
        <div style="text-align:center; padding:8px 0 4px;">
          <div style="display:inline-block; width:64px; height:64px; line-height:64px; border-radius:50%; background:#e7f7ed; color:#15803d; font-size:30px;">✅</div>
          <h1 style="margin:18px 0 8px; color:#15803d; font-size:26px;">¡Tu orden está lista!</h1>
          <p style="margin:0 auto; max-width:460px; color:#526b82; font-size:16px; line-height:1.6;">Hola ${orden.nombreCliente}, tu orden <strong>${orden.numero}</strong> ha sido completada y ya está lista para recoger.</p>
        </div>
      `
      break
    case 'entregado':
      asunto = 'Queremos conocer tu opinión - Lavandería Salinas'
      mensaje = `
        <div style="text-align:center; padding:8px 0 4px;">
          <div style="display:inline-block; width:64px; height:64px; line-height:64px; border-radius:50%; background:#e3f5fb; color:#1685a5; font-size:30px;">🤝</div>
          <h1 style="margin:18px 0 8px; color:#1685a5; font-size:26px;">¡Gracias por elegirnos!</h1>
          <p style="margin:0 auto; max-width:460px; color:#526b82; font-size:16px; line-height:1.6;">Hola ${orden.nombreCliente}, tu orden <strong>${orden.numero}</strong> ya fue entregada. Nos encantaría conocer cómo fue tu experiencia con Lavandería Salinas.</p>
          <p style="margin:12px auto 0; max-width:460px; color:#526b82; font-size:15px; line-height:1.6;">Prendas recibidas: <strong>${Number(orden.cantidadPrendas || 0)}</strong>${orden.detallesPrendas ? `<br>Detalles: ${escaparHtml(orden.detallesPrendas)}` : ''}</p>
          <a href="https://docs.google.com/forms/d/e/1FAIpQLSewoIMcvfk8VAIfbtt69r5tqoYmDT5xpsorehrrPxAASVY5cA/viewform?usp=preview" style="display:inline-block; margin:24px 0 12px; padding:14px 28px; border-radius:10px; background:#168276; color:#ffffff; font-size:16px; font-weight:bold; text-decoration:none;">Queremos conocer tu opinión</a>
          <p style="margin:8px 0 0; color:#8295a6; font-size:13px;">Tu opinión nos ayuda a seguir mejorando.</p>
        </div>
      `
      break
    case 'cancelada':
      asunto = `Orden ${orden.numero} cancelada - Lavandería Salinas`
      mensaje = `
        <div style="text-align:center; padding:8px 0 4px;">
          <div style="display:inline-block; width:64px; height:64px; line-height:64px; border-radius:50%; background:#fee8e7; color:#dc2626; font-size:30px;">❌</div>
          <h1 style="margin:18px 0 8px; color:#dc2626; font-size:26px;">Orden cancelada</h1>
          <p style="margin:0 auto; max-width:460px; color:#526b82; font-size:16px; line-height:1.6;">Hola ${orden.nombreCliente}, lamentamos informarte que tu orden <strong>${orden.numero}</strong> ha sido cancelada. Si tienes alguna duda, contáctanos.</p>
        </div>
      `
      break
    default:
      asunto = `Actualización de orden ${orden.numero} - Lavandería Salinas`
      mensaje = `Hola ${orden.nombreCliente}, el estado de tu orden ${orden.numero} ha sido actualizado a: ${estado}.`
  }

  try {
    const facturaEntregada = estado === 'entregado'
      ? generarHtmlFacturaOrden({
          ...crearFacturaCorreo(orden),
          estado: 'entregado',
          estadoPago: 'pagado',
          montoRecibido: orden.total,
          esFacturaFinal: true,
          deliveredAt: entregadaAt
        })
      : undefined

    if (estado === 'entregado' && facturaEntregada) {
      await enviarCorreoNotificacion(orden.correo, orden.nombreCliente, orden.numero, orden.total.toFixed(2), mensaje, asunto)
      await enviarCorreoNotificacion(
        orden.correo,
        orden.nombreCliente,
        orden.numero,
        orden.total.toFixed(2),
        `<p>Hola ${orden.nombreCliente},</p><p>Adjuntamos tu factura final correspondiente a la orden <strong>${orden.numero}</strong>.</p><p>Prendas recibidas: <strong>${Number(orden.cantidadPrendas || 0)}</strong>${orden.detallesPrendas ? `<br>Detalles: ${escaparHtml(orden.detallesPrendas)}` : ''}</p>`,
        'Adjuntamos tu factura final',
        facturaEntregada,
        true
      )
    } else {
      await enviarCorreoNotificacion(orden.correo, orden.nombreCliente, orden.numero, orden.total.toFixed(2), mensaje, asunto)
    }
    console.log(`Notificación enviada al cliente para estado: ${estado}`)
  } catch (error) {
    console.error('Error al enviar notificación:', error)
  }
}

const confirmarCambioEstado = async () => {
  const orden = ordenCambioPendiente.value
  const estado = estadoObjetivoCambio.value

  if (!orden || !estado || peticionOrdenEnCurso.value) return
  const usarEntregaAntigua = esAdministrador.value && registrarEntregaAntigua.value
  if (usarEntregaAntigua && !turnoIdEntregaAntigua.value) {
    window.alert('Selecciona el turno para la entrega antigua.')
    return
  }
  peticionOrdenEnCurso.value = true

  try {
    const estadoParaActualizar = usarEntregaAntigua ? 'cerrada' : estado
    const ordenActualizada = await cambiarEstado(orden.id, estadoParaActualizar, {
      ...(estado === 'entregado' ? { fechaEntregado: fechaEntregadoModal.value } : {}),
      ...(usarEntregaAntigua ? { turnoId: turnoIdEntregaAntigua.value } : {})
    })

    if (estado === 'entregado') {
      await marcarPago(orden.id, 'pagado', {
        turnoId: usarEntregaAntigua ? turnoIdEntregaAntigua.value : turno.id
      })
    }

    if (usarEntregaAntigua) await cargarHistorial()

    if (enviarNotificacionCambioEstado.value) {
      void enviarNotificacionEstado(orden, estado, estado === 'entregado' ? ordenActualizada.entregadoAt ?? ordenActualizada.updatedAt : undefined)
    }
    cancelarCambioEstado()
  } catch (error) {
    window.alert(error instanceof Error ? error.message : 'No se pudo actualizar el estado de la orden.')
  } finally {
    peticionOrdenEnCurso.value = false
  }
}

const guardarNota = async () => {
  if (esOperador.value || !ordenSeleccionada.value || guardandoNota.value || peticionOrdenEnCurso.value) return

  const notaTexto = notaBorrador.value.trim()
  if (!notaTexto) return

  guardandoNota.value = true
  peticionOrdenEnCurso.value = true
  notaGuardada.value = false
  errorNota.value = ''

  try {
    const movimientoCreado = await registrarMovimiento(ordenSeleccionada.value.id, notaTexto)
    if (!movimientoCreado) throw new Error('No se pudo registrar el movimiento.')

    notaBorrador.value = ''
    notaGuardada.value = true
  } catch (error) {
    errorNota.value = error instanceof Error ? error.message : 'No se pudo guardar la nota. Intenta nuevamente.'
  } finally {
    guardandoNota.value = false
    peticionOrdenEnCurso.value = false
  }
}

const cambiarEstadoPago = async (id: string) => {
  if (esOperador.value) return
  const orden = obtenerOrdenPorId(id)
  if (!orden || orden.estado === 'cancelada' || peticionOrdenEnCurso.value) return

  const nuevoEstado = orden.estadoPago === 'pagado' ? 'porCobrar' : 'pagado'
  if (orden.estadoPago === 'pagado' && !esAdministrador.value) return

  peticionOrdenEnCurso.value = true
  try {
    await marcarPago(id, nuevoEstado)
  } catch (error) {
    window.alert(error instanceof Error ? error.message : 'No se pudo actualizar el pago.')
  } finally {
    peticionOrdenEnCurso.value = false
  }
}
</script>

<style scoped>
.force-light {
  --ion-background-color: #ffffff;
  --ion-text-color: #0a1f38;
  --ion-item-background: #ffffff;
  --ion-card-background: #ffffff;
  --ion-toolbar-background: #ffffff;
  --ion-color-step-50: #f7fbfc;
  --ion-color-step-100: #eef4f7;
  --ion-color-step-150: #e5edf1;
  color: #0a1f38;
  color-scheme: light;
}

.force-light button,
.force-light input,
.force-light textarea,
.force-light select {
  color-scheme: light;
}

.force-light input,
.force-light textarea,
.force-light select {
  color: #0a1f38;
  background-color: #ffffff;
}

.force-light input::placeholder,
.force-light textarea::placeholder {
  color: #7b8fa5;
  opacity: 1;
}

.calendario-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: calc(100% + 220px);
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.header-row h1 {
  margin: 0;
  font-size: clamp(1.8rem, 2.5vw, 2.6rem);
  color: #0a1f38;
  font-weight: 900;
}

/* ---------- Controles superiores ---------- */
.controles-superiores {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
}

.nav-periodo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nav-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid rgba(10, 31, 56, 0.1);
  background: #ffffff;
  color: #123a66;
  display: grid;
  place-items: center;
  cursor: pointer;
  font-size: 1.05rem;
}

.nav-btn:hover {
  background: rgba(102, 194, 184, 0.12);
}

.titulo-periodo {
  min-width: 190px;
  text-align: center;
  font-size: 1.1rem;
  color: #0a1f38;
  text-transform: capitalize;
}

.hoy-btn {
  border: 1px solid rgba(18, 58, 102, 0.18);
  border-radius: 10px;
  padding: 8px 14px;
  background: #ffffff;
  color: #123a66;
  font-weight: 800;
  cursor: pointer;
}

.hoy-btn:hover {
  background: rgba(18, 58, 102, 0.06);
}

.vista-switch {
  display: flex;
  gap: 6px;
  padding: 4px;
  border-radius: 12px;
  background: rgba(10, 31, 56, 0.05);
}

.vista-chip {
  border: none;
  background: transparent;
  color: #5c7289;
  font-weight: 800;
  padding: 8px 16px;
  border-radius: 9px;
  cursor: pointer;
}

.vista-chip.active {
  background: #123a66;
  color: #ffffff;
}

.chip-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filtro-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 13px;
  border-radius: 999px;
  border: 1px solid rgba(10, 31, 56, 0.1);
  background: #ffffff;
  color: #123a66;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.85rem;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.filtro-chip.active {
  color: #ffffff;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* ---------- Vista mes ---------- */
.mes-grid-wrapper {
  border: 1px solid rgba(10, 31, 56, 0.08);
  border-radius: 16px;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 8px 20px rgba(10, 31, 56, 0.04);
}

.mes-dias-semana {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  background: rgba(18, 58, 102, 0.06);
  border-bottom: 1px solid rgba(10, 31, 56, 0.08);
}

.mes-dias-semana span {
  padding: 10px 6px;
  text-align: center;
  font-size: 0.75rem;
  font-weight: 800;
  color: #5c7289;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.mes-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  grid-auto-rows: minmax(108px, auto);
}

.mes-celda {
  border-right: 1px solid rgba(10, 31, 56, 0.06);
  border-bottom: 1px solid rgba(10, 31, 56, 0.06);
  padding: 8px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: background 0.15s ease;
  min-width: 0;
}

.mes-celda:hover {
  background: rgba(102, 194, 184, 0.06);
}

.mes-celda.hoy {
  background: rgba(18, 58, 102, 0.09);
  box-shadow: inset 0 0 0 2px rgba(18, 58, 102, 0.28);
}

.mes-celda.fuera-de-mes {
  background: rgba(10, 31, 56, 0.015);
}

.mes-celda.fuera-de-mes .mes-celda-numero {
  color: #c3ccd6;
}

.mes-celda-header {
  display: flex;
  justify-content: flex-end;
}

.mes-celda-numero {
  font-weight: 800;
  color: #4a627e;
  font-size: 0.9rem;
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border-radius: 50%;
}

.mes-celda-numero.hoy {
  background: #123a66;
  color: #ffffff;
}

.mes-celda-eventos {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.evento-pill {
  border: none;
  border-left: 3px solid;
  border-radius: 6px;
  padding: 3px 6px;
  font-size: 0.72rem;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.evento-pill.vencida {
  outline: 1px solid #dc2626;
}

.evento-mas {
  font-size: 0.7rem;
  color: #5c7289;
  font-weight: 800;
  cursor: pointer;
  padding-left: 4px;
}

.mes-celda-puntos {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.punto-evento {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  cursor: pointer;
  flex-shrink: 0;
}

.punto-mas {
  font-size: 0.62rem;
  color: #5c7289;
  font-weight: 800;
}

/* ---------- Vista semana (escritorio) ---------- */
.semana-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 10px;
}

.semana-columna {
  border: 1px solid rgba(10, 31, 56, 0.08);
  border-radius: 14px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  min-height: 420px;
  overflow: hidden;
}

.semana-columna.hoy {
  border-color: #123a66;
  box-shadow: 0 8px 20px rgba(18, 58, 102, 0.14);
}

.semana-columna-header {
  border: none;
  background: rgba(18, 58, 102, 0.05);
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  cursor: pointer;
}

.semana-dia-nombre {
  font-size: 0.7rem;
  font-weight: 800;
  color: #5c7289;
  text-transform: uppercase;
}

.semana-dia-numero {
  font-weight: 900;
  color: #0a1f38;
  font-size: 1.05rem;
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 50%;
}

.semana-dia-numero.hoy {
  background: #123a66;
  color: #ffffff;
}

.semana-columna-lista {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  overflow-y: auto;
  flex: 1;
}

.semana-evento-card {
  text-align: left;
  border: 1px solid rgba(10, 31, 56, 0.08);
  border-left: 4px solid var(--card-accent, #66c2b8);
  border-radius: 10px;
  padding: 8px 10px;
  background: var(--card-accent-bg, #ffffff);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.semana-evento-card.vencida {
  outline: 1px solid #dc2626;
}

.semana-evento-top {
  display: flex;
  justify-content: space-between;
  gap: 6px;
}

.semana-evento-top strong {
  font-size: 0.82rem;
  color: #0a1f38;
}

.semana-evento-hora {
  font-size: 0.7rem;
  color: #5c7289;
  font-weight: 700;
}

.semana-evento-cliente {
  margin: 0;
  font-size: 0.8rem;
  color: #0a1f38;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.semana-evento-estado {
  font-size: 0.7rem;
  font-weight: 800;
}

.semana-vacio {
  color: #b9c6d3;
  font-size: 0.8rem;
  text-align: center;
  margin-top: 20px;
}

/* ---------- Vista semana (móvil, agenda apilada) ---------- */
.semana-agenda-movil {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.agenda-dia {
  border: 1px solid rgba(10, 31, 56, 0.08);
  border-radius: 14px;
  background: #ffffff;
  overflow: hidden;
}

.agenda-dia.hoy {
  border-color: #123a66;
  box-shadow: 0 8px 20px rgba(18, 58, 102, 0.12);
}

.agenda-dia-header {
  width: 100%;
  border: none;
  background: rgba(18, 58, 102, 0.05);
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.agenda-dia-nombre {
  font-weight: 800;
  color: #123a66;
  font-size: 0.88rem;
  text-transform: capitalize;
}

.agenda-dia-numero {
  font-weight: 900;
  color: #0a1f38;
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  font-size: 0.85rem;
}

.agenda-dia-numero.hoy {
  background: #123a66;
  color: #ffffff;
}

.agenda-dia-count {
  margin-left: auto;
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(10, 31, 56, 0.08);
  color: #5c7289;
  font-size: 0.72rem;
  font-weight: 800;
}

.agenda-dia-lista {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 10px;
}

.agenda-evento-card {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid rgba(10, 31, 56, 0.08);
  border-radius: 10px;
  padding: 8px 10px;
  background: #fbfdfe;
  cursor: pointer;
  text-align: left;
}

.agenda-evento-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.agenda-evento-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 1px;
}

.agenda-evento-info strong {
  font-size: 0.82rem;
  color: #0a1f38;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.agenda-evento-info small {
  font-size: 0.72rem;
  color: #5c7289;
}

/* ---------- Modal de día ---------- */
.modal-dia {
  --width: min(560px, calc(100vw - 24px));
  --height: min(88vh, 760px);
  --border-radius: 22px;
}

.modal-dia-contenido {
  background: #ffffff;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 18px;
  gap: 14px;
}

.modal-dia-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}

.modal-dia-etiqueta {
  margin: 0 0 2px;
  color: #6f8399;
  font-size: 0.74rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.modal-dia-header strong {
  font-size: 1.1rem;
  color: #0a1f38;
  text-transform: capitalize;
}

.modal-dia-lista {
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
}

.dia-orden-card {
  text-align: left;
  border: 1px solid rgba(10, 31, 56, 0.08);
  border-left: 4px solid var(--card-accent, #66c2b8);
  border-radius: 12px;
  padding: 12px;
  background: var(--card-accent-bg, #ffffff);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dia-orden-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.dia-orden-top strong {
  color: #0a1f38;
  font-size: 1rem;
}

.dia-orden-cliente {
  margin: 0;
  font-weight: 700;
  color: #0a1f38;
}

.dia-orden-detalle {
  margin: 0;
  color: #6f8399;
  font-size: 0.84rem;
}

.dia-orden-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dia-orden-hora {
  color: #5c7289;
  font-size: 0.8rem;
  font-weight: 700;
}

.dia-vacio {
  text-align: center;
  padding: 30px 0;
}

.pill {
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 0.72rem;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

/* ---------- Modal detalle de orden (idéntico a la vista Órdenes) ---------- */
.modal-ordenes {
  --width: min(1120px, calc(100vw - 24px));
  --height: min(92vh, 980px);
  --border-radius: 24px;
  --backdrop-opacity: 0.32;
}

.modal-detalle {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px;
  background: linear-gradient(180deg, #ffffff 0%, #f6fbfc 100%);
  overflow: hidden;
}

.modal-header-acciones {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-shrink: 0;
}

.btn-icono {
  border: none;
  background: rgba(10, 31, 56, 0.05);
  color: #123a66;
  font-size: 1.1rem;
  cursor: pointer;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: grid;
  place-items: center;
}

.btn-icono:hover {
  background: rgba(102, 194, 184, 0.18);
  color: #16a34a;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.modal-header-left {
  display: flex;
  gap: 12px;
  align-items: center;
  min-width: 0;
}

.modal-icon {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  background: rgba(102, 194, 184, 0.14);
  color: #123a66;
  display: grid;
  place-items: center;
  font-size: 1.15rem;
  flex-shrink: 0;
}

.detalle-numero {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 900;
  color: #0a1f38;
}

.modal-header h2 {
  margin: 2px 0 0;
  font-size: 0.95rem;
  color: #5b7088;
  font-weight: 600;
}

.cerrar-detalle {
  border: none;
  background: rgba(10, 31, 56, 0.05);
  color: #5b7088;
  font-size: 1.1rem;
  cursor: pointer;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: grid;
  place-items: center;
}

.modal-body {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  overflow: auto;
  padding-right: 4px;
}

.modal-columna {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.columna-titulo {
  margin: 0;
  font-size: 0.76rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #123a66;
  background: rgba(18, 58, 102, 0.08);
  border: 1px solid rgba(18, 58, 102, 0.14);
  border-radius: 10px;
  padding: 8px 10px;
}

.detalle-bloque {
  border: 1px solid rgba(10, 31, 56, 0.08);
  border-radius: 14px;
  padding: 14px;
  background: #ffffff;
}

.detalle-bloque-head {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: flex-start;
  margin-bottom: 8px;
}

.cliente-box {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.label {
  margin: 0;
  color: #9aaaba;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: 0.72rem;
  font-weight: 800;
}

.cliente-box strong {
  font-size: 1.05rem;
  color: #0a1f38;
}

.cliente-box span {
  color: #6f8399;
  font-size: 0.88rem;
}

.cliente-edicion-label {
  margin-top: 4px;
}

.cliente-telefono-edicion {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #123a66;
  font-weight: 800;
}

.cliente-telefono-edicion .modal-input-texto {
  flex: 1;
}

.cliente-edicion-acciones {
  display: flex;
  gap: 10px;
}

.cliente-edicion-acciones button {
  flex: 1;
}

.cliente-editar-btn {
  margin-top: 6px;
}

.estado-pill {
  width: fit-content;
}

.estado-deslizador {
  border: 1px solid rgba(10, 31, 56, 0.08);
  border-radius: 18px;
  padding: 14px;
  background: linear-gradient(180deg, #ffffff 0%, #f9fcfd 100%);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.estado-cuadritos {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.estado-cuadrito {
  min-width: 0;
  min-height: 82px;
  border: 1px solid rgba(18, 58, 102, 0.14);
  border-radius: 12px;
  padding: 9px 6px;
  background: #ffffff;
  color: #123a66;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-size: 0.72rem;
  font-weight: 800;
  text-align: center;
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}

.estado-cuadrito:hover:not(:disabled) {
  transform: translateY(-2px);
  border-color: #66c2b8;
  background: rgba(102, 194, 184, 0.08);
}

.estado-cuadrito.actual,
.estado-cuadrito:disabled {
  border-color: #cbd5df;
  background: #e5e7eb;
  color: #6b7280;
  cursor: default;
  opacity: 1;
}

.estado-cuadrito-emoji {
  font-size: 1.45rem;
  line-height: 1;
  filter: grayscale(0.1);
}

.estado-cuadrito.actual .estado-cuadrito-emoji {
  filter: grayscale(1);
  opacity: 0.7;
}

.cancelar-orden-boton {
  min-height: 42px;
  border: 1px solid rgba(220, 38, 38, 0.25);
  border-radius: 10px;
  background: rgba(220, 38, 38, 0.07);
  color: #b91c1c;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  font-weight: 800;
  cursor: pointer;
}

.cancelar-orden-boton:hover {
  background: rgba(220, 38, 38, 0.14);
}

@media (max-width: 480px) {
  .estado-cuadritos {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.detalle-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.mini-card {
  border: 1px solid rgba(10, 31, 56, 0.08);
  border-radius: 14px;
  padding: 12px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mini-card strong {
  color: #0a1f38;
}

.mini-card span {
  color: #6f8399;
  font-size: 0.86rem;
}

.fecha-orden-input {
  width: 100%;
  min-height: 40px;
  box-sizing: border-box;
  border: 1px solid #cbdde9;
  border-radius: 10px;
  padding: 8px 10px;
  background: #f8fbfd;
  color: #0a1f38;
  color-scheme: light;
  font: inherit;
  font-weight: 700;
  outline: none;
}

.fecha-orden-input:focus {
  border-color: #168b83;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(22, 139, 131, 0.13);
}

.guardar-fechas-orden {
  width: 100%;
  border: 1px solid rgba(22, 139, 131, 0.2);
  border-radius: 11px;
  padding: 10px 14px;
  background: #e8f7f4;
  color: #126e68;
  font-weight: 800;
  cursor: pointer;
}

.guardar-fechas-orden:hover:not(:disabled) {
  background: #d8f0eb;
}

.guardar-fechas-orden:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.link {
  border: none;
  background: none;
  color: #66c2b8;
  font-weight: 800;
  cursor: pointer;
  padding: 0;
  text-align: left;
}

.link:disabled {
  opacity: 0.6;
  cursor: wait;
}

.seccion-titulo {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.fotos-grid {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.foto-item,
.foto-vacia {
  width: 94px;
  height: 94px;
  border-radius: 12px;
  border: 1px dashed rgba(10, 31, 56, 0.12);
  background: #fbfdfe;
  display: grid;
  place-items: center;
  color: #9fb4c9;
  overflow: hidden;
  position: relative;
}

.foto-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.btn-quitar-foto {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: none;
  background: rgba(10, 31, 56, 0.65);
  color: #ffffff;
  font-size: 12px;
  line-height: 1;
  display: grid;
  place-items: center;
  cursor: pointer;
  padding: 0;
}

.notas {
  background: rgba(240, 196, 25, 0.08);
  border-color: rgba(240, 196, 25, 0.28);
}

.nota-input {
  width: 100%;
  min-height: 80px;
  border: 1px solid rgba(10, 31, 56, 0.12);
  border-radius: 12px;
  padding: 12px;
  resize: vertical;
  font-family: inherit;
  color: #0a1f38;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.nota-input:focus {
  border-color: #66c2b8;
  box-shadow: 0 0 0 3px rgba(102, 194, 184, 0.16);
}

.nota-estado {
  margin: 0;
  font-size: 0.82rem;
  font-weight: 700;
}

.nota-estado-exito {
  color: #15803d;
}

.nota-estado-error {
  color: #b91c1c;
}

.mini-badge {
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(10, 31, 56, 0.06);
  color: #6f8399;
  font-size: 0.74rem;
  font-weight: 700;
}

.servicios-lista {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.servicio-linea {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  border: 1px solid rgba(10, 31, 56, 0.08);
  border-radius: 12px;
  padding: 10px 12px;
}

.linea-derecha {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.btn-quitar-mini {
  border: none;
  background: rgba(220, 38, 38, 0.08);
  color: #dc2626;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  cursor: pointer;
  flex-shrink: 0;
}

.btn-quitar-mini:hover {
  background: rgba(220, 38, 38, 0.16);
}

.servicio-linea strong {
  color: #0a1f38;
}

.servicio-linea span {
  display: block;
  color: #6f8399;
  font-size: 0.84rem;
}

.extra {
  margin-top: 10px;
}

.total-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px;
  border-radius: 14px;
  border: 1px solid rgba(102, 194, 184, 0.35);
  background: rgba(102, 194, 184, 0.08);
}

.total-box span {
  font-weight: 700;
  color: #0a1f38;
}

.total-box strong {
  font-size: 1.35rem;
  color: #2c7f78;
}

.btn-outline,
.btn-principal {
  width: 100%;
  border: none;
  border-radius: 14px;
  padding: 13px 16px;
  font-weight: 800;
  cursor: pointer;
}

.btn-outline {
  background: #ffffff;
  color: #66c2b8;
  border: 1px solid #66c2b8;
}

.btn-principal {
  background: #66c2b8;
  color: #ffffff;
}

.movimientos-lista {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.movimiento {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.movimiento-bullet {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(102, 194, 184, 0.15);
  color: #66c2b8;
  display: grid;
  place-items: center;
  font-weight: 800;
  flex-shrink: 0;
}

.movimiento-verde .movimiento-bullet,
.movimiento-verde .movimiento-texto-verde {
  color: #16a34a;
}

.movimiento-rojo .movimiento-bullet,
.movimiento-rojo .movimiento-texto-rojo {
  color: #dc2626;
}

.movimiento-verde .movimiento-bullet {
  background: rgba(34, 197, 94, 0.12);
}

.movimiento-rojo .movimiento-bullet {
  background: rgba(239, 68, 68, 0.12);
}

.movimiento strong {
  display: block;
  color: #0a1f38;
  font-size: 0.9rem;
}

.movimiento span {
  color: #7b8fa5;
  font-size: 0.8rem;
}

.restaurar-orden-boton {
  min-height: 44px;
  width: 100%;
  border: 1px solid rgba(22, 163, 74, 0.28);
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(22, 163, 74, 0.12), rgba(18, 58, 102, 0.08));
  color: #147044;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 800;
  cursor: pointer;
  transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
}

.restaurar-orden-boton ion-icon {
  font-size: 1.15rem;
}

.restaurar-orden-boton:hover {
  border-color: rgba(22, 163, 74, 0.5);
  background: linear-gradient(135deg, rgba(22, 163, 74, 0.2), rgba(18, 58, 102, 0.12));
  box-shadow: 0 5px 12px rgba(22, 163, 74, 0.14);
  transform: translateY(-1px);
}

.restaurar-orden-boton:active {
  transform: translateY(0);
}

.modal-restaurar-contenido {
  width: 100%;
  box-sizing: border-box;
  margin: 0;
  padding: 22px;
  border: 1px solid rgba(18, 58, 102, 0.1);
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 20px 50px rgba(10, 31, 56, 0.18);
  text-align: center;
}

.modal-restaurar-icono {
  width: 54px;
  height: 54px;
  margin: 0 auto 12px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: rgba(22, 163, 74, 0.12);
  color: #15803d;
  font-size: 1.55rem;
}

.modal-restaurar-contenido .modal-confirmacion-titulo {
  margin-bottom: 8px;
  font-size: 1.2rem;
}

.modal-restaurar-contenido .modal-confirmacion-subtitulo {
  margin-bottom: 20px;
}

.restaurar-resumen {
  display: grid;
  gap: 10px;
  margin-bottom: 22px;
  text-align: left;
}

.restaurar-resumen-item {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid;
}

.restaurar-resumen-item ion-icon {
  margin-top: 2px;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.restaurar-resumen-item div {
  display: grid;
  gap: 3px;
}

.restaurar-resumen-item strong {
  font-size: 0.88rem;
}

.restaurar-resumen-item span {
  font-size: 0.78rem;
  line-height: 1.35;
}

.restaurar-resumen-eliminar {
  border-color: rgba(220, 38, 38, 0.2);
  background: rgba(254, 226, 226, 0.55);
  color: #991b1b;
}

.restaurar-resumen-conservar {
  border-color: rgba(22, 163, 74, 0.2);
  background: rgba(220, 252, 231, 0.55);
  color: #166534;
}

.modal-confirmacion {
  --width: min(520px, calc(100vw - 24px));
  --height: auto;
  --max-height: calc(100vh - 32px);
  --border-radius: 22px;
}

.modal-confirmacion-contenido {
  background: #ffffff;
  width: 100%;
  box-sizing: border-box;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.modal-confirmacion-header {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.modal-confirmacion-icon {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: rgba(240, 196, 25, 0.18);
  color: #a5791f;
  display: grid;
  place-items: center;
  font-weight: 900;
  flex-shrink: 0;
}

.modal-confirmacion-titulo {
  margin: 0;
  font-size: 1rem;
  font-weight: 900;
  color: #0a1f38;
}

.modal-confirmacion-subtitulo {
  margin: 4px 0 0;
  color: #5c7289;
  line-height: 1.45;
}

.modal-confirmacion-botones {
  display: flex;
  gap: 10px;
}

.modal-confirmacion-botones button {
  flex: 1;
}

.modal-label {
  font-size: 0.78rem;
  font-weight: 800;
  color: #4a627e;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  display: block;
  margin-top: 10px;
  margin-bottom: 6px;
}

.toggle-check {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  margin-top: 14px;
  padding: 11px 13px;
  border: 1px solid #d8e7ec;
  border-radius: 12px;
  background: #f7fbfc;
  color: #28566d;
  font-size: 0.88rem;
  font-weight: 750;
  cursor: pointer;
  transition: border-color 160ms ease, background 160ms ease, box-shadow 160ms ease;
}

.toggle-check:hover {
  border-color: #91cfc9;
  background: #f1fbfa;
}

.toggle-check input {
  appearance: none;
  width: 19px;
  height: 19px;
  flex: 0 0 19px;
  margin: 0;
  border: 1.5px solid #9dbac3;
  border-radius: 6px;
  background: #ffffff;
  cursor: pointer;
  transition: border-color 160ms ease, background 160ms ease, box-shadow 160ms ease;
}

.toggle-check input:checked {
  border-color: #238e87;
  background: #238e87;
  box-shadow: inset 0 0 0 4px #ffffff;
}

.modal-input-select,
.modal-input-fecha {
  width: 100%;
  min-height: 44px;
  padding: 10px 13px;
  border: 1px solid #cfe0e5;
  border-radius: 12px;
  background: #ffffff;
  color: #173c55;
  font: inherit;
  font-size: 0.92rem;
  outline: none;
  transition: border-color 160ms ease, box-shadow 160ms ease, background 160ms ease;
}

.modal-input-select {
  cursor: pointer;
}

.modal-input-texto {
  width: 100%;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid rgba(10, 31, 56, 0.14);
  font-size: 0.9rem;
  color: #0a1f38;
  outline: none;
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
  font-size: 1rem;
  font-weight: 700;
}

.hint-texto-vacio {
  margin: 0;
  color: #9fb4c9;
  font-size: 0.86rem;
}

.seccion-titulo-acciones {
  display: flex;
  align-items: center;
  gap: 14px;
}

.btn-subir-foto-link {
  cursor: pointer;
}

.lista-productos-modal {
  max-height: 280px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
}

.producto-modal-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border: 1px solid rgba(10, 31, 56, 0.08);
  border-radius: 12px;
  padding: 10px 12px;
  background: #fbfdfe;
  cursor: pointer;
  text-align: left;
}

.producto-modal-item:hover {
  border-color: #66c2b8;
  background: rgba(102, 194, 184, 0.06);
}

.producto-modal-item strong {
  display: block;
  color: #0a1f38;
  font-size: 0.9rem;
}

.producto-modal-item span {
  color: #6f8399;
  font-size: 0.78rem;
}

.producto-cantidad-control {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.producto-cantidad-control > span {
  min-width: 22px;
  color: #123a66;
  font-weight: 900;
  text-align: center;
}

.cantidad-btn {
  width: 30px;
  height: 30px;
  padding: 0;
  border: 1px solid rgba(102, 194, 184, 0.4);
  border-radius: 8px;
  background: #ffffff;
  color: #2c7f78;
  font-size: 1.05rem;
  font-weight: 900;
  cursor: pointer;
}

.cantidad-btn:hover:not(:disabled) {
  background: #e8f7f4;
}

.cantidad-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-principal.peligro {
  background: #dc2626;
}

.btn-icono.peligro {
  color: #dc2626;
}

.btn-icono.peligro:hover {
  background: rgba(220, 38, 38, 0.12);
}

.modal-comprobante {
  --width: min(940px, calc(100vw - 24px));
  --height: min(92vh, 860px);
  --border-radius: 20px;
}

.modal-comprobante-contenido {
  background: #ffffff;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 14px;
  gap: 12px;
}

.modal-comprobante-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: #123a66;
}

.modal-comprobante-body {
  flex: 1;
  min-height: 0;
  border: 1px solid rgba(18, 58, 102, 0.12);
  border-radius: 12px;
  overflow: hidden;
  background: #f7fbff;
}

.comprobante-imagen {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #f7fbff;
}

.comprobante-frame {
  width: 100%;
  height: 100%;
  border: none;
  background: #ffffff;
}

.comprobante-externo-link {
  align-self: flex-end;
  color: #4169a1;
  font-weight: 700;
  text-decoration: none;
}

.comprobante-externo-link:hover {
  text-decoration: underline;
}

.metodo-pago-detalle {
  margin-top: 12px;
  padding: 12px;
  border: 1px solid rgba(18, 58, 102, 0.08);
  border-radius: 10px;
  background: rgba(245, 249, 252, 0.5);
}

.metodo-pago-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: #123a66;
  font-size: 0.9rem;
}

.pago-detalle-linea {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  font-size: 0.85rem;
  color: #4a627e;
}

.pago-detalle-linea strong {
  color: #0a1f38;
  font-weight: 700;
}

.comprobante-link {
  display: flex;
  align-items: center;
  gap: 6px;
  border: none;
  color: #4169a1;
  text-decoration: none;
  font-weight: 700;
  font-size: 0.85rem;
  padding: 4px 8px;
  border-radius: 6px;
  background: rgba(65, 105, 161, 0.1);
  cursor: pointer;
  transition: background 0.15s ease;
}

.comprobante-link:hover {
  background: rgba(65, 105, 161, 0.2);
}

.recepcion-resumen {
  margin: 0 0 6px;
  color: #4a627e;
}

.recepcion-ayuda {
  margin: 4px 0 0;
  color: #9fb4c9;
  font-size: 0.8rem;
}

@media (max-width: 1200px) {
  .modal-body {
    grid-template-columns: 1fr;
  }

  .detalle-grid {
    grid-template-columns: 1fr;
  }

  .modal-ordenes {
    --width: min(100vw - 16px, 1120px);
  }
}

@media (max-width: 900px) {
  .modal-ordenes {
    --width: 100vw;
    --height: 100vh;
    --border-radius: 0;
  }

  .modal-detalle {
    padding: 14px;
  }
}

@media (max-width: 760px) {
  .mes-grid {
    grid-auto-rows: minmax(64px, auto);
  }

  .mes-celda {
    padding: 6px 4px;
  }

  .titulo-periodo {
    min-width: 0;
    font-size: 1rem;
  }

  .controles-superiores {
    flex-direction: column;
    align-items: stretch;
  }

  .nav-periodo {
    justify-content: center;
  }

  .vista-switch {
    align-self: center;
  }

  .modal-dia {
    --width: 100vw;
    --height: 100vh;
    --border-radius: 0;
  }
}
</style>