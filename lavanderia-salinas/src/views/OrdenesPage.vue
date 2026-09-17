<template>
  <component :is="soloDetalleId ? 'div' : AppShell">
    <div class="ordenes-page force-light" :class="{ 'modo-solo-detalle': soloDetalleId }">
      <div class="header-row">
        <h1>Órdenes</h1>
      </div>

      <div class="ordenes-resumen">
        <span class="resumen-chip">{{ ordenesFiltradas.length }} Ordenes</span>
      </div>

      <section class="controles-superiores">
        <div class="search-bar">
          <ion-icon :icon="searchOutline" />
          <input
            v-model="busqueda"
            type="text"
            placeholder="Buscar por nombre, telefono o orden ID..."
          />
        </div>

        <div class="chip-row">
          <button
            v-for="filtro in filtrosEstadoVisibles"
            :key="filtro.value"
            class="filtro-chip"
            :class="{ active: estadoActivo === filtro.value }"
            :style="estadoActivo === filtro.value ? { background: filtro.color, borderColor: filtro.color, color: filtro.textOn } : {}"
            @click="estadoActivo = filtro.value"
          >
            <span class="dot" :style="{ background: estadoActivo === filtro.value ? filtro.textOn : filtro.color }"></span>
            {{ filtro.label }}
          </button>

          <div class="chip-row chip-row-ordenamiento">
            <span class="ordenamiento-label">Ordenar por</span>
          </div>

          <div class="filtros-fecha">
            <label class="ordenamiento-label" for="filtro-fecha-creacion">Creación</label>
            <input
              id="filtro-fecha-creacion"
              :value="fechaCreacionFiltro"
              type="date"
              class="fecha-filtro-input"
              @input="onFechaCreacionInput"
            />

            <label class="ordenamiento-label" for="filtro-fecha-entrega">Entrega</label>
            <input
              id="filtro-fecha-entrega"
              :value="fechaEntregaFiltro"
              type="date"
              class="fecha-filtro-input"
              @input="onFechaEntregaInput"
            />

            <button
              v-if="fechaCreacionFiltro || fechaEntregaFiltro"
              type="button"
              class="filtro-chip filtro-chip-secundario filtro-chip-limpiar"
              @click="limpiarFiltroFecha"
            >
              Restablecer
            </button>
          </div>

          <button
            v-if="esAdministrador"
            type="button"
            class="btn-eliminar-dia"
            title="Eliminar órdenes de un día"
            aria-label="Eliminar órdenes de un día"
            @click="abrirModalEliminarDia"
          >
            <ion-icon :icon="trashOutline" />
          </button>
        </div>
      </section>

      <ion-modal :is-open="mostrarModalIntervencion" class="modal-confirmacion" @didDismiss="cerrarModalIntervencion">
        <div class="modal-confirmacion-contenido force-light">
          <div class="modal-confirmacion-header">
            <div class="modal-confirmacion-icon">
              <ion-icon :icon="warningOutline" />
            </div>
            <div>
              <p class="modal-confirmacion-titulo">Órdenes que requieren intervención</p>
              <p class="modal-confirmacion-subtitulo">
                Hay {{ ordenesQueRequierenIntervencion.length }} orden{{ ordenesQueRequierenIntervencion.length === 1 ? '' : 'es' }} con pagos, anticipos o entregas que necesitan revisión.
              </p>
            </div>
          </div>

          <div class="modal-confirmacion-botones">
            <button class="btn-outline" type="button" @click="cerrarModalIntervencion">Cerrar</button>
            <button class="btn-principal" type="button" @click="irAIntervencion">Ver órdenes</button>
          </div>
        </div>
      </ion-modal>

      <ion-modal
        :is-open="mostrarModalMotivoIntervencion"
        class="modal-confirmacion modal-motivo-intervencion"
        @didDismiss="cerrarModalMotivoIntervencion"
      >
        <div class="modal-confirmacion-contenido force-light">
          <div class="modal-confirmacion-header">
            <div class="modal-confirmacion-icon peligro-icono">
              <ion-icon :icon="warningOutline" />
            </div>
            <div>
              <p class="modal-confirmacion-titulo">Orden {{ ordenIntervencionSeleccionada?.numero }}</p>
              <p class="modal-confirmacion-subtitulo">Esta orden requiere intervención porque:</p>
            </div>
          </div>

          <p class="motivo-intervencion-modal-texto">
            {{ motivoIntervencion(ordenIntervencionSeleccionada) }}
          </p>

          <div class="modal-confirmacion-botones">
            <button class="btn-outline" type="button" @click="cerrarModalMotivoIntervencion">Cerrar</button>
          </div>
        </div>
      </ion-modal>

      <ion-modal :is-open="mostrarModalEliminarDia" class="modal-confirmacion" @didDismiss="cerrarModalEliminarDia">
        <div class="modal-confirmacion-contenido force-light">
          <div class="modal-confirmacion-header">
            <div class="modal-confirmacion-icon peligro-icono">
              <ion-icon :icon="trashOutline" />
            </div>
            <div>
              <p class="modal-confirmacion-titulo">Eliminar órdenes por día</p>
              <p class="modal-confirmacion-subtitulo">
                Esta acción eliminará permanentemente las órdenes creadas en la fecha seleccionada.
              </p>
            </div>
          </div>

          <label class="modal-label" for="fecha-eliminar-ordenes">Fecha de creación</label>
          <input id="fecha-eliminar-ordenes" v-model="fechaEliminarDia" type="date" class="modal-input-fecha" />

          <div v-if="fechaEliminarDia" class="resumen-eliminacion-dia">
            <strong>{{ ordenesDelDiaParaEliminar.length }} órdenes encontradas</strong>
            <span>Se eliminarán junto con sus servicios, fotos, anticipos y movimientos.</span>
          </div>

          <p v-if="fechaEliminarDia && ordenesDelDiaParaEliminar.length === 0" class="hint-texto-vacio">
            No hay órdenes creadas en esa fecha.
          </p>

          <div class="modal-confirmacion-botones">
            <button class="btn-outline" :disabled="eliminandoOrdenesDia" @click="cerrarModalEliminarDia">Cancelar</button>
            <button
              class="btn-principal peligro"
              :disabled="!fechaEliminarDia || ordenesDelDiaParaEliminar.length === 0 || eliminandoOrdenesDia"
              @click="confirmarEliminarOrdenesDia"
            >
              {{ eliminandoOrdenesDia ? 'Eliminando...' : 'Eliminar órdenes' }}
            </button>
          </div>
        </div>
      </ion-modal>

      <section class="contenido-principal">
        <div class="grid-header">
          <span
            class="grid-header-badge"
              :style="estadoActivo !== 'todos' && estadoActivo !== 'intervencion'
              ? { background: estadoColores[estadoActivo].bg, color: estadoColores[estadoActivo].textStrong }
              : { background: 'rgba(18,58,102,0.1)', color: '#123a66' }"
          >
            <ion-icon
              :icon="estadoActivo === 'pendiente' ? timeOutline
                : estadoActivo === 'en_proceso' ? refreshOutline
                : estadoActivo === 'listo' ? checkmarkDoneOutline
                : estadoActivo === 'entregado' ? bagCheckOutline
                : estadoActivo === 'cancelada' ? banOutline
                : estadoActivo === 'intervencion' ? warningOutline
                : receiptOutline"
            />
          </span>
          <strong>
            {{ estadoActivo === 'todos' ? 'Todas las órdenes'
              : estadoActivo === 'intervencion' ? 'Requieren intervención'
              : textoEstado(estadoActivo) }}
          </strong>
          <span class="grid-header-count">{{ ordenesFiltradas.length }}</span>
        </div>

        <div v-if="totalPaginas > 1" class="paginacion-ordenes" aria-label="Paginación de órdenes">
          <button
            type="button"
            class="paginacion-btn"
            :disabled="paginaActual === 1"
            @click="paginaAnterior"
          >
            Anterior
          </button>
          <span>Página {{ paginaActual }} de {{ totalPaginas }}</span>
          <button
            type="button"
            class="paginacion-btn"
            :disabled="paginaActual === totalPaginas"
            @click="paginaSiguiente"
          >
            Siguiente
          </button>
        </div>

        <div class="ordenes-tablero-layout">
          <aside class="cola-ordenes">
            <div class="cola-ordenes-header">
              <div>
                <p class="cola-ordenes-etiqueta">Orden de llegada</p>
                <strong>Cola de trabajo</strong>
              </div>
              <span class="cola-ordenes-count">{{ ordenesLlegada.length }}</span>
            </div>

            <div class="cola-ordenes-lista">
              <label
                v-for="(orden, index) in ordenesLlegada"
                :key="orden.id"
                class="cola-orden-item"
                :class="{ vencida: orden.estado === 'pendiente' && ordenVencida(orden) }"
              >
                <span class="cola-orden-posicion">{{ index + 1 }}</span>
                <span class="cola-orden-info">
                  <strong>{{ orden.numero }}</strong>
                  <small>{{ orden.nombreCliente }}</small>
                </span>
              </label>

              <p v-if="ordenesLlegada.length === 0" class="cola-orden-vacia">
                No hay órdenes activas.
              </p>
            </div>
          </aside>

          <div class="cards-grid">
            <button
              v-for="orden in ordenesPagina"
              :key="orden.id"
              class="orden-card"
              :class="{ selected: orden.id === ordenSeleccionadaId, vencida: ordenVencida(orden) }"
              :style="{
                '--card-accent': estadoColores[orden.estado].dot,
                '--card-accent-bg': estadoColores[orden.estado].bg,
                '--card-accent-fuerte': estadoColores[orden.estado].textStrong
              }"
              @click="abrirDetalle(orden.id)"
            >
            <div class="card-top">
              <div class="card-top-identidad">
                <div class="header-numero">
                  <strong>{{ orden.numero }}</strong>
                </div>
                <span
                  class="pill estado-chip"
                  :style="{ background: '#ffffff', color: estadoColores[orden.estado].textStrong }"
                >
                  {{ textoEstado(orden.estado) }}
                </span>
              </div>
              <button
                v-if="requiereIntervencion(orden)"
                type="button"
                class="card-top-intervencion"
                title="Ver razón de la intervención"
                @click.stop="abrirModalMotivoIntervencion(orden)"
              >
                <ion-icon :icon="warningOutline" />
                <span>Requiere atención</span>
              </button>
            </div>

            <p class="cliente">{{ orden.nombreCliente }}</p>
            <p class="detalles">{{ resumenServicios(orden.items) }}</p>
            <p class="prendas">🧦 {{ Number(orden.cantidadPrendas || 0) }} prenda{{ Number(orden.cantidadPrendas || 0) === 1 ? '' : 's' }}</p>
            <p class="entrega">Entrega: {{ textoEntrega(orden) }}</p>

            <div class="card-bottom">
              <div class="precios-info">
                <span v-if="puedeVerMontos && orden.estadoPago !== 'pagado'" class="total-label">Total de la orden</span>

                <strong
                  v-if="puedeVerMontos"
                  class="total"
                  :class="{ 'total-pagada': orden.estadoPago === 'pagado' }"
                  :style="{ color: estadoColores[orden.estado].textStrong }"
                >
                  {{ orden.estadoPago === 'pagado'
                    ? '✓ Orden pagada'
                    : `$${totalFinalOrden(orden).toFixed(2)}` }}
                </strong>
              </div>

              <span v-if="puedeVerMontos && orden.estado !== 'cancelada'" class="pill pago" :class="`pago-${orden.estadoPago}`">
                <ion-icon v-if="iconoEstadoPago(orden.estadoPago)" :icon="iconoEstadoPago(orden.estadoPago)" />
                <span v-if="orden.estadoPago === 'anticipo'">💵</span>
                {{ textoEstadoPago(orden.estadoPago) }}
              </span>
            </div>

            </button>

            <div v-if="ordenesFiltradas.length === 0" class="grid-vacio">
              Sin ordenes{{ estadoActivo !== 'todos' ? ' en este estado' : '' }}
            </div>
          </div>
        </div>

      </section>

      <ion-modal :is-open="detalleAbierto" class="modal-ordenes" @didDismiss="cerrarDetalle">
        <div class="modal-detalle force-light">
          <div class="modal-header">
            <div class="modal-header-left">
              <div class="modal-icon">
                <ion-icon :icon="receiptOutline" />
              </div>
              <div>
                <p class="detalle-numero">🧾 Orden {{ ordenSeleccionada?.numero ?? '' }}</p>
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
              <p class="columna-titulo">⚙️ Opciones de modificacion</p>

              <section v-if="ordenSeleccionada.estado !== 'cerrada'" class="estado-deslizador">
                <div class="detalle-bloque-head">
                  <div>
                    <p class="label">📍 Estado</p>
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
                    @click="solicitarCambioEstado(ordenSeleccionada.id, estado.value, 'detalle')"
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
                  <strong>🧼 Servicios</strong>
                  <div class="seccion-titulo-acciones">
                    <span class="mini-badge">📦 {{ ordenSeleccionada.items.length }} items</span>
                    <button v-if="ordenSeleccionada.estado !== 'cancelada' && ordenSeleccionada.estado !== 'cerrada'" class="link extra" :disabled="peticionOrdenEnCurso || turnoCerrado" @click="abrirModalAgregarProducto">
                      + Agregar servicio
                    </button>
                  </div>
                </div>

                <div class="prendas-editable">
                  <span class="prendas-editable-label">🧦 Prendas recibidas</span>
                  <div class="prendas-editable-control">
                    <input
                      v-model.number="cantidadPrendasBorrador"
                      type="number"
                      min="0"
                      class="prendas-editable-input"
                      :disabled="!esAdministrador || guardandoPrendas || ordenSeleccionada.estado === 'cerrada'"
                    />
                    <button
                      v-if="esAdministrador && ordenSeleccionada.estado !== 'cerrada'"
                      type="button"
                      class="prendas-editable-guardar"
                      :disabled="guardandoPrendas || cantidadPrendasBorrador === Number(ordenSeleccionada.cantidadPrendas || 0)"
                      @click="guardarCantidadPrendas"
                    >
                      {{ guardandoPrendas ? 'Guardando...' : '💾 Guardar' }}
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
                      <button v-if="esAdministrador && ordenSeleccionada.estado !== 'cerrada'" type="button" class="btn-quitar-mini" title="Quitar producto" :disabled="peticionOrdenEnCurso || turnoCerrado" @click="abrirModalQuitarItem(item)">
                        <ion-icon :icon="trashOutline" />
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
                  <strong>💵 Cargos extra</strong>
                  <button v-if="ordenSeleccionada.estado !== 'cancelada' && ordenSeleccionada.estado !== 'cerrada'" class="link extra" :disabled="peticionOrdenEnCurso || turnoCerrado" @click="abrirModalCargoExtra">
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
                      <button v-if="ordenSeleccionada.estado !== 'cerrada'" type="button" class="btn-quitar-mini" title="Eliminar cargo" :disabled="peticionOrdenEnCurso || turnoCerrado" @click="eliminarCargoExtraSeleccionado(cargo.id)">
                        <ion-icon :icon="trashOutline" />
                      </button>
                    </div>
                  </article>
                </div>
                <p v-else class="hint-texto-vacio">Sin cargos extra registrados.</p>
              </section>

              <section class="detalle-bloque">
                <div class="seccion-titulo">
                  <strong>📸 Fotos</strong>
                    <label v-if="ordenSeleccionada.estado !== 'cancelada' && ordenSeleccionada.estado !== 'cerrada'" class="link btn-subir-foto-link">
                    + Agregar
                    <input type="file" accept="image/*" multiple hidden :disabled="peticionOrdenEnCurso || turnoCerrado" @change="manejarFotosOrden" />
                  </label>
                </div>
                <div class="fotos-grid">
                  <div v-for="(foto, index) in ordenSeleccionada.fotos" :key="foto" class="foto-item">
                    <img :src="foto" alt="Foto de la orden" />
                    <button v-if="ordenSeleccionada.estado !== 'cerrada'" type="button" class="btn-quitar-foto" :disabled="peticionOrdenEnCurso || turnoCerrado" @click="eliminarFotoSeleccionada(index)">×</button>
                  </div>
                  <div v-if="ordenSeleccionada.fotos.length === 0" class="foto-vacia">
                    📷 Foto
                  </div>
                </div>
              </section>

              <section class="detalle-bloque notas">
                <div class="seccion-titulo">
                  <strong>📝 Notas internas</strong>
                  <button v-if="ordenSeleccionada.estado !== 'cerrada'" class="link extra" :disabled="guardandoNota || peticionOrdenEnCurso || turnoCerrado" @click="guardarNota">
                    <ion-icon :icon="saveOutline" />
                    {{ guardandoNota ? 'Guardando...' : 'Guardar nota' }}
                  </button>
                </div>
                <textarea
                  v-model="notaBorrador"
                  class="nota-input"
                  :disabled="ordenSeleccionada.estado === 'cerrada'"
                  :aria-busy="guardandoNota"
                  aria-label="Nota interna de la orden"
                  placeholder="Ej: Se embolso, falta planchar, cliente pide entrega temprano..."
                />
                <p v-if="notaGuardada" class="nota-estado nota-estado-exito" aria-live="polite">
                  ✅ Nota guardada correctamente.
                </p>
                <p v-if="errorNota" class="nota-estado nota-estado-error" role="alert">
                  ⚠️ {{ errorNota }}
                </p>
              </section>
            </div>

            <div class="modal-columna info-columna">
              <p class="columna-titulo">{{ esOperador ? '📋 Información de la orden' : '💰 Informacion de la orden y dinero' }}</p>

              <section class="detalle-bloque cliente-box">
                <div class="detalle-bloque-head">
                  <div>
                    <p class="label">👤 Informacion del cliente</p>
                    <strong v-if="!editandoCliente">{{ ordenSeleccionada.nombreCliente }}</strong>
                  </div>
                  <span
                    class="pill estado-pill"
                    :style="{ background: estadoColores[ordenSeleccionada.estado].bg, color: estadoColores[ordenSeleccionada.estado].text }"
                  >
                    {{ textoEstado(ordenSeleccionada.estado) }}
                  </span>
                </div>

                <template v-if="editandoCliente && ordenSeleccionada.estado !== 'cerrada'">
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
                  <span>📱 {{ ordenSeleccionada.codigoPais }} {{ ordenSeleccionada.telefono }}</span>
                  <span v-if="ordenSeleccionada.correo">✉️ {{ ordenSeleccionada.correo }}</span>
                  <button v-if="esAdministrador && ordenSeleccionada.estado !== 'cerrada'" type="button" class="link cliente-editar-btn" @click="iniciarEdicionCliente">
                    Editar datos del cliente
                  </button>
                </template>
                <span v-if="ordenSeleccionada.envioDomicilio && ordenSeleccionada.direccionEntrega">
                  🏠 Dirección de entrega: {{ ordenSeleccionada.direccionEntrega }}
                </span>
              </section>

              <section class="detalle-grid">
                <div v-if="puedeVerMontos" class="mini-card">
                  <p class="label">💳 Estado de pago</p>
                  <strong>{{ textoEstadoPago(ordenSeleccionada.estadoPago) }}</strong>
                  <button
                    v-if="ordenSeleccionada.estado !== 'cancelada' && (ordenSeleccionada.estado !== 'cerrada' || requiereIntervencion(ordenSeleccionada)) && (ordenSeleccionada.estadoPago === 'porCobrar' || (esAdministrador && ordenSeleccionada.estadoPago === 'pagado'))"
                    class="link"
                    :disabled="peticionOrdenEnCurso || turnoCerrado"
                    @click="cambiarEstadoPago(ordenSeleccionada.id)"
                  >
                    {{ ordenSeleccionada.estadoPago === 'pagado' ? 'Regresar a por cobrar' : 'Marcar Pagado' }}
                  </button>
                </div>

                <div class="mini-card">
                  <p class="label">📅 Fecha de entrega</p>
                  <input v-model="fechaEntregaBorrador" type="date" class="fecha-orden-input" :disabled="!esAdministrador || ordenSeleccionada.estado === 'cerrada'" />
                  <input v-model="horaEntregaBorrador" type="time" class="fecha-orden-input" :disabled="!esAdministrador || ordenSeleccionada.estado === 'cerrada'" />
                </div>

                <div class="mini-card">
                  <p class="label">🗓️ Fecha de creacion</p>
                  <input v-model="fechaCreacionBorrador" type="date" class="fecha-orden-input" :disabled="!esAdministrador || ordenSeleccionada.estado === 'cerrada'" />
                  <span>🕒 Hora: {{ formatearHora(ordenSeleccionada.createdAt) }}</span>
                </div>
              </section>

              <button
                v-if="esAdministrador && ordenSeleccionada.estado !== 'cerrada'"
                type="button"
                class="guardar-fechas-orden"
                :disabled="guardandoFechas || peticionOrdenEnCurso || !fechaEntregaBorrador"
                @click="guardarFechasOrden"
              >
                {{ guardandoFechas ? 'Actualizando...' : '💾 Guardar fechas' }}
              </button>

              <section v-if="puedeVerMontos" class="total-box">
                <span :class="{ 'total-box-pagada': ordenSeleccionada.estadoPago === 'pagado' }">
                  {{ ordenSeleccionada.estadoPago === 'pagado' ? '✓ Orden pagada' : '💵 Total a pagar' }}
                </span>
                <strong>${{ totalFinalOrden(ordenSeleccionada).toFixed(2) }} USD</strong>
              </section>

              <section v-if="puedeVerMontos" class="detalle-bloque pago-box">
                <div class="seccion-titulo">
                  <strong>💰 Pago y anticipos</strong>
                  <button
                    v-if="ordenSeleccionada.estado !== 'cancelada'"
                    class="link extra"
                    :disabled="peticionOrdenEnCurso || turnoCerrado"
                    @click="abrirModalAnticipo"
                  >
                    + Registrar anticipo
                  </button>
                </div>

                <div class="pago-resumen">
                  <div>
                    <p class="label">✅ Recibido</p>
                    <strong>${{ ordenSeleccionada.montoRecibido.toFixed(2) }}</strong>
                  </div>
                  <div>
                    <p class="label">📍 Estado</p>
                    <strong>{{ textoEstadoPago(ordenSeleccionada.estadoPago) }}</strong>
                  </div>
                </div>

                <div v-if="ordenSeleccionada.metodoPago === 'tarjeta' && (ordenSeleccionada.tarjetaMonto || ordenSeleccionada.tarjetaReferencia)" class="metodo-pago-detalle">
                  <div class="metodo-pago-header">
                    <ion-icon :icon="cardOutline" />
                    <strong>💳 Pago con tarjeta</strong>
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
                    <strong>🔁 Transferencia</strong>
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
                  <article v-for="(anticipo, indice) in ordenSeleccionada.anticipos" :key="anticipo.id" class="servicio-linea" :class="{ 'anticipo-huerfano': anticipo.cierreHuerfano }">
                    <div>
                      <strong>💵 {{ textoTipoCobro(ordenSeleccionada, indice) }}</strong>
                      <span>{{ formatearFechaHora(anticipo.fecha) }}</span>
                      <span v-if="anticipo.cierreHuerfano" class="anticipo-error-badge">⚠️ El anticipo no aparece en el cierre asignado (ID: {{ anticipo.turnoId }})</span>
                    </div>
                    <div class="linea-derecha">
                      <strong>${{ anticipo.monto.toFixed(2) }}</strong>
                      <button v-if="esAdministrador && ordenSeleccionada.estado !== 'cancelada'" type="button" class="btn-quitar-mini" title="Eliminar anticipo" :disabled="peticionOrdenEnCurso || turnoCerrado" @click="eliminarAnticipoSeleccionado(anticipo.id)">
                        <ion-icon :icon="trashOutline" />
                      </button>
                    </div>
                  </article>
                </div>
                <p v-else class="hint-texto-vacio">Sin anticipos registrados.</p>

                <button
                  v-if="ordenSeleccionada.estado !== 'cancelada' && (ordenSeleccionada.estado !== 'cerrada' || requiereIntervencion(ordenSeleccionada)) && (ordenSeleccionada.estadoPago === 'porCobrar' || (esAdministrador && ordenSeleccionada.estadoPago === 'pagado'))"
                  class="link"
                  :disabled="peticionOrdenEnCurso || turnoCerrado"
                  @click="cambiarEstadoPago(ordenSeleccionada.id)"
                >
                  {{ ordenSeleccionada.estadoPago === 'pagado' ? 'Regresar a por cobrar' : 'Marcar facturada' }}
                </button>
              </section>

              <section v-if="esAdministrador" class="detalle-bloque movimientos">
                <div class="seccion-titulo">
                  <strong>📜 Movimientos</strong>
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
                      <span>👤 Usuario a cargo: {{ mov.usuarioNombre || 'Sistema' }}</span> <br>
                      <span>🕒 Fecha: {{ formatearFechaHora(mov.fecha) }}</span>
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
            <div
              v-if="esAdministrador && !turno.abierto"
              style="margin-top: 12px; padding: 12px 14px; border-radius: 12px; background: linear-gradient(135deg, #fff7ed, #ffedd5); border: 1px solid #fdba74; color: #9a4d00; font-weight: 600; line-height: 1.4;"
            >
              No se pueden entregar órdenes del día actual si no hay una caja abierta. Solo se pueden registrar entregas en cajas antiguas.
            </div>
            <div v-if="esAdministrador" class="anticipo-antiguo-toggle">
              <label class="toggle-check">
                <input type="checkbox" v-model="registrarEntregaAntigua" />
                Registrar entrega antigua
              </label>
            </div>
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
            <button
              class="btn-principal"
              :disabled="peticionOrdenEnCurso || turnoCerrado || (estadoObjetivoCambio === 'entregado' && !turno.abierto && !registrarEntregaAntigua) || (estadoObjetivoCambio === 'entregado' && registrarEntregaAntigua && !turnoIdEntregaAntigua)"
              @click="confirmarCambioEstado"
            >
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
  </component>
</template>

<script setup lang="ts">
const props = defineProps<{
  soloDetalleId?: string | null
  mostrarRestaurarCerrada?: boolean
}>()
const emit = defineEmits<{
  cerrado: []
  'restaurar-cerrada': [id: string]
}>()

import AppShell from '@/components/AppShell.vue'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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
  cardOutline,
  swapHorizontalOutline,
  imageOutline,
  searchOutline,
  trashOutline,
  addCircleOutline,
  timeOutline,
  refreshOutline,
  checkmarkDoneOutline,
  bagCheckOutline,
  lockClosedOutline,
  banOutline,
  warningOutline,
} from 'ionicons/icons'
const route = useRoute()
const router = useRouter()

const { servicios, cargarCatalogo } = useCatalogo()
const { turno } = useTurno()
const { esAdministrador, esOperador, usuarioActual, rol } = useSesion()
const puedeVerMontos = computed(() => esAdministrador.value || rol.value === 'cajero')
const { historialCierres, cargarHistorial } = useHistorialCierres()
const mostrarRestaurarCerrada = computed(() =>
  props.mostrarRestaurarCerrada === true || esAdministrador.value
)

const {
  ordenes,
  totalOrdenes,
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
  registrarMovimiento,
} = useOrdenes()

const busqueda = ref('')
const estadoActivo = ref<'todos' | 'intervencion' | OrdenEstado>('todos')
const mostrarModalEliminarDia = ref(false)
const mostrarModalMotivoIntervencion = ref(false)
const ordenIntervencionSeleccionada = ref<Orden | null>(null)
const fechaEliminarDia = ref('')
const eliminandoOrdenesDia = ref(false)
const restaurandoOrdenCerrada = ref(false)
const mostrarModalRestaurar = ref(false)
const ordenSeleccionadaId = ref('')
const notaBorrador = ref('')
const guardandoNota = ref(false)
const notaGuardada = ref(false)
const errorNota = ref('')
const editandoCliente = ref(false)
const guardandoCliente = ref(false)
const errorEdicionCliente = ref('')
const clienteBorrador = ref({ nombre: '', telefono: '', correo: '' })

const estadoColores: Record<OrdenEstado, { dot: string; bg: string; text: string; textStrong: string }> = {
  pendiente: { dot: '#e8a317', bg: 'rgba(232, 163, 23, 0.16)', text: '#8a5a09', textStrong: '#a5691c' },
  en_proceso: { dot: '#3b82f6', bg: 'rgba(59, 130, 246, 0.14)', text: '#1d4ed8', textStrong: '#1d4ed8' },
  listo: { dot: '#16a34a', bg: 'rgba(22, 163, 74, 0.14)', text: '#15803d', textStrong: '#15803d' },
  entregado: { dot: '#2b8da0', bg: 'rgba(43, 141, 160, 0.16)', text: '#1f6e7d', textStrong: '#1f6e7d' },
  cerrada: { dot: '#6b7280', bg: 'rgba(107, 114, 128, 0.16)', text: '#4b5563', textStrong: '#374151' },
  cancelada: { dot: '#dc2626', bg: 'rgba(220, 38, 38, 0.14)', text: '#b91c1c', textStrong: '#b91c1c' },
  'Cerrada-Cancelada': { dot: '#7f1d1d', bg: 'rgba(127, 29, 29, 0.14)', text: '#7f1d1d', textStrong: '#7f1d1d' }
}

const filtrosEstado = [
  { label: 'Todas', value: 'todos' as const, color: '#123a66', textOn: '#ffffff' },
  { label: 'Intervención', value: 'intervencion' as const, color: '#d97706', textOn: '#ffffff' },
  { label: 'Pendiente', value: 'pendiente' as const, color: estadoColores.pendiente.dot, textOn: '#ffffff' },
  { label: 'En proceso', value: 'en_proceso' as const, color: estadoColores.en_proceso.dot, textOn: '#ffffff' },
  { label: 'Listo', value: 'listo' as const, color: estadoColores.listo.dot, textOn: '#ffffff' },
  { label: 'Entregado', value: 'entregado' as const, color: estadoColores.entregado.dot, textOn: '#ffffff' },
  { label: 'Cancelada', value: 'cancelada' as const, color: estadoColores.cancelada.dot, textOn: '#ffffff' }
]

const ordenamientosDisponibles = [
  { label: 'Fecha creación', value: 'createdAt' as const },
  { label: 'Fecha entrega', value: 'fechaEntrega' as const }
]

const ordenamientoActivo = ref<'createdAt' | 'fechaEntrega'>('createdAt')
const fechaCreacionFiltro = ref('')
const fechaEntregaFiltro = ref('')

const limpiarFiltroFecha = () => {
  fechaCreacionFiltro.value = ''
  fechaEntregaFiltro.value = ''
}

const onFechaFiltroChange = (tipo: 'creacion' | 'entrega', valor: string) => {
  if (tipo === 'creacion') {
    fechaCreacionFiltro.value = valor
    fechaEntregaFiltro.value = ''
    return
  }

  fechaEntregaFiltro.value = valor
  fechaCreacionFiltro.value = ''
}

const onFechaCreacionInput = (event: Event) => {
  const target = event.target as HTMLInputElement | null
  onFechaFiltroChange('creacion', target?.value || '')
}

const onFechaEntregaInput = (event: Event) => {
  const target = event.target as HTMLInputElement | null
  onFechaFiltroChange('entrega', target?.value || '')
}

const filtrosEstadoVisibles = computed(() =>
  filtrosEstado.filter((filtro) => {
    if (filtro.value === 'intervencion') {
      return esAdministrador.value && ordenesQueRequierenIntervencion.value.length > 0
    }
    return true
  })
)

const mostrarModalIntervencion = ref(false)
const intervencionNotificada = ref(false)

const ordenesDelDiaParaEliminar = computed(() => {
  if (!fechaEliminarDia.value) return []
  return ordenes.value.filter((orden) => fechaISOaCentroamerica(orden.createdAt) === fechaEliminarDia.value)
})

const columnas = [
  { estado: 'pendiente' as const, label: 'Pendiente', color: estadoColores.pendiente.dot, textStrong: estadoColores.pendiente.textStrong, icono: timeOutline, arrastrable: true },
  { estado: 'en_proceso' as const, label: 'En proceso', color: estadoColores.en_proceso.dot, textStrong: estadoColores.en_proceso.textStrong, icono: refreshOutline, arrastrable: true },
  { estado: 'listo' as const, label: 'Listo', color: estadoColores.listo.dot, textStrong: estadoColores.listo.textStrong, icono: checkmarkDoneOutline, arrastrable: true },
  { estado: 'entregado' as const, label: 'Entregado', color: estadoColores.entregado.dot, textStrong: estadoColores.entregado.textStrong, icono: bagCheckOutline, arrastrable: true },
  { estado: 'cancelada' as const, label: 'Cancelada', color: estadoColores.cancelada.dot, textStrong: estadoColores.cancelada.textStrong, icono: banOutline, arrastrable: false }
]

const estadosOrden: OrdenEstado[] = ['pendiente', 'en_proceso', 'listo', 'entregado']

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

const estadosVisibles: OrdenEstado[] = [
  'pendiente',
  'en_proceso',
  'listo',
  'entregado',
  'cancelada'
]

const prioridadEstado: Record<string, number> = {
  pendiente: 0,
  en_proceso: 1,
  listo: 2,
  entregado: 3,
  cancelada: 4,
  'Cerrada-Cancelada': 4,
  cerrada: 5
}

const arrastrandoOrdenId = ref('')
const columnaActivaDrop = ref<OrdenEstado | ''>('')
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
const mostrarModalComprobante = ref(false)
const comprobanteActual = ref('')

const comprobanteEsImagen = computed(() => {
  const comprobante = comprobanteActual.value
  return /^data:image\//i.test(comprobante)
    || /\.(png|jpe?g|gif|webp|bmp|svg)(\?|#|$)/i.test(comprobante)
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

const ordenPerteneceATurnoActivo = (orden: Orden) => {
  if (esAdministrador.value) return true
  if (!turno.abierto) return false
  if (!orden.turnoId) return true
  return orden.turnoId === turno.id
}

const turnoCerrado = computed(() => !turno.abierto && !esAdministrador.value)

function requiereIntervencion(orden?: Pick<Orden, 'estado' | 'anticipos' | 'turnoHuerfano' | 'estadoPago'> | null) {
  if (!orden) return false

  const ordenCerrada = orden.estado === 'cerrada' || orden.estado === 'Cerrada-Cancelada'
  const pagoInconsistente = ordenCerrada && orden.estadoPago !== 'pagado'

  return (
    pagoInconsistente ||
    orden.turnoHuerfano === true ||
    tieneAnticiposHuerfanos(orden)
  )
}

function motivoIntervencion(orden?: Pick<Orden, 'estado' | 'anticipos' | 'turnoHuerfano' | 'estadoPago'> | null) {
  if (!orden) return ''

  const ordenCerrada = orden.estado === 'cerrada' || orden.estado === 'Cerrada-Cancelada'
  const pagoInconsistente = ordenCerrada && orden.estadoPago !== 'pagado'
  const anticipoFueraDeCierre = tieneAnticiposHuerfanos(orden)
  const entregaFueraDeCierre = orden.turnoHuerfano === true

  if (pagoInconsistente && anticipoFueraDeCierre && entregaFueraDeCierre) {
    return 'Orden cerrada sin pago completo, anticipo no encontrado en el cierre y entrega no encontrada en el cierre'
  }
  if (pagoInconsistente && anticipoFueraDeCierre) {
    return 'Orden cerrada sin pago completo y anticipo no encontrado en el cierre'
  }
  if (pagoInconsistente && entregaFueraDeCierre) {
    return 'Orden cerrada sin pago completo y entrega no encontrada en el cierre'
  }
  if (pagoInconsistente) return 'Orden cerrada sin pago completo'
  if (anticipoFueraDeCierre && entregaFueraDeCierre) return 'Anticipo no encontrado en el cierre y entrega no encontrada en el cierre'
  if (anticipoFueraDeCierre) return 'Anticipo no encontrado en el cierre'
  if (entregaFueraDeCierre) return 'Entrega no encontrada en el cierre'
  return ''
}

const abrirModalMotivoIntervencion = (orden: Orden) => {
  ordenIntervencionSeleccionada.value = orden
  mostrarModalMotivoIntervencion.value = true
}

const cerrarModalMotivoIntervencion = () => {
  mostrarModalMotivoIntervencion.value = false
  ordenIntervencionSeleccionada.value = null
}

const ordenesQueRequierenIntervencion = computed(() =>
  esAdministrador.value ? ordenes.value.filter((orden) => requiereIntervencion(orden)) : []
)

const cerrarModalIntervencion = () => {
  mostrarModalIntervencion.value = false
}

const irAIntervencion = () => {
  estadoActivo.value = 'intervencion'
  cerrarModalIntervencion()
}

watch(ordenesQueRequierenIntervencion, (ordenesIntervencion) => {
  if (estadoActivo.value === 'intervencion' && ordenesIntervencion.length === 0) {
    estadoActivo.value = 'todos'
  }

  if (ordenesIntervencion.length === 0) {
    intervencionNotificada.value = false
    return
  }
  if (esAdministrador.value && !intervencionNotificada.value) {
    mostrarModalIntervencion.value = true
    intervencionNotificada.value = true
  }
}, { immediate: true })

const ordenesFiltradas = computed(() => {
  const consulta = busqueda.value.trim().toLowerCase()
  const inicioTurno = turno.horaInicio ? new Date(turno.horaInicio) : null
  const inicioTurnoValido = inicioTurno && !Number.isNaN(inicioTurno.getTime())

  return ordenes.value.filter((orden) => {
    const intervencion = requiereIntervencion(orden)
    const ordenCerrada = orden.estado === 'cerrada' || orden.estado === 'Cerrada-Cancelada'

    if (fechaCreacionFiltro.value) {
      const fechaCreacion = String(orden.createdAt || '').slice(0, 10)
      if (fechaCreacion !== fechaCreacionFiltro.value) return false
    }

    if (fechaEntregaFiltro.value) {
      const fechaEntrega = String(orden.fechaEntrega || '').slice(0, 10)
      if (fechaEntrega !== fechaEntregaFiltro.value) return false
    }

    if (intervencion && !esAdministrador.value) return false
    if (estadoActivo.value === 'intervencion') return intervencion
    if (ordenCerrada) return false

    // Las canceladas solo se muestran durante el turno donde se cancelaron.
    if (orden.estado === 'cancelada') {
      if (!turno.abierto) return false

      const canceladaAt = new Date(orden.updatedAt)
      const canceladaAtValida = !Number.isNaN(canceladaAt.getTime())

      if (inicioTurnoValido && canceladaAtValida && canceladaAt < inicioTurno) {
        return false
      }
    }

    const coincideEstado =
      estadoActivo.value === 'todos' ||
      orden.estado === estadoActivo.value

    if (!coincideEstado) return false

    if (!consulta) return true

    const texto = [
      orden.numero,
      orden.nombreCliente,
      orden.telefono,
      orden.codigoPais,
      ...orden.items.map((item) => item.nombre)
    ]
      .join(' ')
      .toLowerCase()

    return texto.includes(consulta)
  }).sort((a, b) => {
    // Mantener el orden habitual por estado y luego aplicar el tipo de ordenamiento seleccionado.
    const prioridadA = prioridadEstado[a.estado] ?? 99
    const prioridadB = prioridadEstado[b.estado] ?? 99
    if (prioridadA !== prioridadB) return prioridadA - prioridadB

    if (ordenamientoActivo.value === 'fechaEntrega') {
      const fechaA = a.fechaEntrega ? new Date(`${a.fechaEntrega}T00:00:00`).getTime() : Number.MAX_SAFE_INTEGER
      const fechaB = b.fechaEntrega ? new Date(`${b.fechaEntrega}T00:00:00`).getTime() : Number.MAX_SAFE_INTEGER

      if (fechaA !== fechaB) return fechaA - fechaB
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
})

const ordenesPorPagina = ref(16)
const paginaActual = ref(1)
const totalPaginas = computed(() => Math.max(1, Math.ceil(ordenesFiltradas.value.length / ordenesPorPagina.value)))
const ordenesPagina = computed(() => {
  const inicio = (paginaActual.value - 1) * ordenesPorPagina.value
  return ordenesFiltradas.value.slice(inicio, inicio + ordenesPorPagina.value)
})

const actualizarOrdenesPorPagina = () => {
  if (typeof window === 'undefined') return
  ordenesPorPagina.value = window.matchMedia('(max-width: 900px)').matches ? 9 : 16
  paginaActual.value = 1
}

const paginaAnterior = () => {
  paginaActual.value = Math.max(1, paginaActual.value - 1)
}

const paginaSiguiente = () => {
  paginaActual.value = Math.min(totalPaginas.value, paginaActual.value + 1)
}

watch([busqueda, estadoActivo], () => {
  paginaActual.value = 1
})

watch(totalPaginas, (total) => {
  if (paginaActual.value > total) paginaActual.value = total
})

const ordenesLlegada = computed(() =>
  ordenes.value
    .filter((orden) => orden.estado === 'pendiente')
    .sort((a, b) => {
      const fechaA = new Date(a.createdAt).getTime()
      const fechaB = new Date(b.createdAt).getTime()
      const fechaValidaA = !Number.isNaN(fechaA)
      const fechaValidaB = !Number.isNaN(fechaB)

      if (fechaValidaA && fechaValidaB && fechaA !== fechaB) return fechaA - fechaB
      return a.secuencia - b.secuencia
    })
)

const MAX_FOTOS_ORDEN = 6

const mostrarModalAnticipo = ref(false)
const montoAnticipoModal = ref(0)
const enviarNotificacionCambioEstado = ref(true)
const registrarAnticipoAntiguo = ref(false)
const turnoIdAnticipoAntiguo = ref('')
const registrarEntregaAntigua = ref(false)
const turnoIdEntregaAntigua = ref('')
const fechaCreacionBorrador = ref('')
const fechaEntregaBorrador = ref('')
const cantidadPrendasBorrador = ref(0)
const guardandoPrendas = ref(false)
const horaEntregaBorrador = ref('')
const guardandoFechas = ref(false)

const turnosParaAnticipoAntiguo = computed(() => {
  const lista: { id: string; etiqueta: string; horaInicio: string | null; numeroCaja: number }[] = []

  for (const cierre of historialCierres.value) {
    if (turno.abierto && cierre.turnoId === turno.id) continue

    lista.push({
      id: cierre.turnoId,
      etiqueta: `Caja #${cierre.numeroCaja} - ${cierre.horaInicio ? new Date(cierre.horaInicio).toLocaleDateString('es-ES') : 'fecha desconocida'}`,
      horaInicio: cierre.horaInicio,
      numeroCaja: cierre.numeroCaja
    })
  }

  return lista
})

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

  const orden = ordenSeleccionada.value
  const usarAnticipoAntiguo = esAdministrador.value && registrarAnticipoAntiguo.value

  if (usarAnticipoAntiguo && (!fechaAnticipoAntiguo.value || !turnoIdAnticipoAntiguo.value)) {
    void mostrarToastAnticipo('Selecciona la caja para registrar el anticipo antiguo.')
    return
  }

  peticionOrdenEnCurso.value = true
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
        void mostrarToastAnticipo(
          `Cambio a entregar: $${cambio.toFixed(2)}. La orden quedó totalmente cobrada.`
        )
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

const abrirModalEliminarDia = () => {
  if (!esAdministrador.value || esOperador.value) return
  fechaEliminarDia.value = fechaHoyCentroamerica()
  mostrarModalEliminarDia.value = true
}

const cerrarModalEliminarDia = () => {
  if (eliminandoOrdenesDia.value) return
  mostrarModalEliminarDia.value = false
  fechaEliminarDia.value = ''
}

const confirmarEliminarOrdenesDia = async () => {
  if (
    !esAdministrador.value ||
    esOperador.value ||
    !fechaEliminarDia.value ||
    ordenesDelDiaParaEliminar.value.length === 0 ||
    eliminandoOrdenesDia.value
  ) return

  const ordenesAEliminar = [...ordenesDelDiaParaEliminar.value]
  const fecha = fechaEliminarDia.value
  const confirmado = window.confirm(
    `¿Eliminar definitivamente ${ordenesAEliminar.length} orden${ordenesAEliminar.length === 1 ? '' : 'es'} creada${ordenesAEliminar.length === 1 ? '' : 's'} el ${fecha}? Esta acción no se puede deshacer.`
  )
  if (!confirmado) return

  eliminandoOrdenesDia.value = true
  peticionOrdenEnCurso.value = true
  try {
    if (ordenSeleccionadaId.value && ordenesAEliminar.some((orden) => orden.id === ordenSeleccionadaId.value)) {
      cerrarDetalle()
    }

    for (const orden of ordenesAEliminar) {
      await eliminarOrden(orden.id)
    }

    mostrarModalEliminarDia.value = false
    fechaEliminarDia.value = ''
  } catch (error) {
    window.alert(error instanceof Error ? error.message : 'No se pudieron eliminar todas las órdenes seleccionadas.')
  } finally {
    eliminandoOrdenesDia.value = false
    peticionOrdenEnCurso.value = false
  }
}

type EstadoVisible = 'pendiente' | 'en_proceso' | 'listo' | 'entregado' | 'cancelada'

const pedidosPorEstado = computed<Record<EstadoVisible, Orden[]>>(() => ({
  pendiente: ordenesFiltradas.value.filter((orden) => orden.estado === 'pendiente'),
  en_proceso: ordenesFiltradas.value.filter((orden) => orden.estado === 'en_proceso'),
  listo: ordenesFiltradas.value.filter((orden) => orden.estado === 'listo'),
  entregado: ordenesFiltradas.value.filter((orden) => orden.estado === 'entregado'),
  cancelada: ordenesFiltradas.value.filter((orden) => orden.estado === 'cancelada')
}))

const ordenSeleccionada = computed(() =>
  ordenSeleccionadaId.value ? obtenerOrdenPorId(ordenSeleccionadaId.value) : null
)

const anticiposDelTurnoEntrega = computed(() => {
  const orden = ordenSeleccionada.value
  if (!orden?.turnoId) return []
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

const siguienteEstado = (estado: OrdenEstado): OrdenEstado | null => {
  const indice = estadosOrden.indexOf(estado)

  return indice >= 0 && indice < estadosOrden.length - 1
    ? estadosOrden[indice + 1]
    : null
}

const siguienteEstadoDisponible = computed(() =>
  ordenSeleccionada.value ? siguienteEstado(ordenSeleccionada.value.estado) : null
)

const estadoAnterior = (estado: OrdenEstado): OrdenEstado | null => {
  const indice = estadosOrden.indexOf(estado)
  return indice > 0 ? estadosOrden[indice - 1] : null
}

const estadoAnteriorDisponible = computed(() =>
  ordenSeleccionada.value ? estadoAnterior(ordenSeleccionada.value.estado) : null
)

const ordenCambioPendiente = computed(() =>
  ordenCambioPendienteId.value ? obtenerOrdenPorId(ordenCambioPendienteId.value) : null
)

const ordenRecepcionPendiente = computed(() =>
  ordenRecepcionPendienteId.value ? obtenerOrdenPorId(ordenRecepcionPendienteId.value) : null
)

const estadoObjetivoTexto = computed(() =>
  estadoObjetivoCambio.value ? textoEstado(estadoObjetivoCambio.value) : ''
)

const reiniciarArrastre = () => {
  arrastrandoOrdenId.value = ''
  columnaActivaDrop.value = ''
}

const abrirDetalle = (id: string) => {
  const orden = obtenerOrdenPorId(id)
  if (requiereIntervencion(orden) && !esAdministrador.value) return

  ordenSeleccionadaId.value = id
  if (orden) {
    fechaCreacionBorrador.value = orden.createdAt.slice(0, 10)
    fechaEntregaBorrador.value = orden.fechaEntrega ?? ''
    horaEntregaBorrador.value = orden.horaEntrega ?? ''
    cantidadPrendasBorrador.value = Number(orden.cantidadPrendas || 0)
  }
  if (props.soloDetalleId) return
  const query = { ...route.query, id }
  router.replace({ query }).catch(() => {})
}

watch(
  () => props.soloDetalleId,
  (id) => {
    if (id) abrirDetalle(id)
  },
  { immediate: true }
)

const guardarFechasOrden = async () => {
  const orden = ordenSeleccionada.value
  if (!esAdministrador.value || !orden || !fechaCreacionBorrador.value || !fechaEntregaBorrador.value || guardandoFechas.value) return

  guardandoFechas.value = true
  try {
    const ordenActualizada = await actualizarOrden(orden.id, {
      fechaCreacion: fechaCreacionBorrador.value,
      fechaEntrega: fechaEntregaBorrador.value,
      horaEntrega: horaEntregaBorrador.value
    })
    if (ordenActualizada) {
      fechaCreacionBorrador.value = ordenActualizada.createdAt.slice(0, 10)
      fechaEntregaBorrador.value = ordenActualizada.fechaEntrega ?? ''
      horaEntregaBorrador.value = ordenActualizada.horaEntrega ?? ''
    }
    window.alert('Fechas de la orden actualizadas correctamente.')
  } catch (error) {
    window.alert(error instanceof Error ? error.message : 'No se pudieron actualizar las fechas.')
  } finally {
    guardandoFechas.value = false
  }
}

const guardarCantidadPrendas = async () => {
  const orden = ordenSeleccionada.value
  if (!esAdministrador.value || !orden || guardandoPrendas.value) return

  const cantidad = Number(cantidadPrendasBorrador.value)
  if (!Number.isFinite(cantidad) || cantidad < 0) {
    window.alert('Ingresa una cantidad de prendas válida.')
    return
  }

  guardandoPrendas.value = true
  try {
    await actualizarOrden(orden.id, { cantidadPrendas: cantidad })
  } catch (error) {
    window.alert(error instanceof Error ? error.message : 'No se pudo actualizar la cantidad de prendas.')
  } finally {
    guardandoPrendas.value = false
  }
}

watch(ordenSeleccionada, (orden) => {
  if (!orden) return
  fechaCreacionBorrador.value = orden.createdAt.slice(0, 10)
  fechaEntregaBorrador.value = orden.fechaEntrega ?? ''
  horaEntregaBorrador.value = orden.horaEntrega ?? ''
  cantidadPrendasBorrador.value = Number(orden.cantidadPrendas || 0)
}, { immediate: true })

watch([ordenSeleccionada, () => turno.abierto], ([orden]) => {
  if (!orden) cerrarModalRecepcion()
})

const cerrarDetalle = () => {
  ordenSeleccionadaId.value = ''
  notaBorrador.value = ''

  if (props.soloDetalleId) {
    emit('cerrado')
  } else {
    const { id, ...resto } = route.query
    void id
    router.replace({ query: resto }).catch(() => {})
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

watch(
  () => route.query.id,
  (id) => {
    if (typeof id === 'string' && id) {
      ordenSeleccionadaId.value = id
    }
  },
  { immediate: true }
)

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

const textoTipoCobro = (orden: Orden, indice: number) => {
  if (orden.estadoPago !== 'pagado') return 'Anticipo'
  if (orden.anticipos.length === 1) return 'Pago Total'
  return indice === orden.anticipos.length - 1 ? 'Pago complementario' : 'Anticipo'
}

const iconoEstadoPago = (estado: EstadoPago) => {
  if (estado === 'porCobrar') return timeOutline
  if (estado === 'pagado') return checkmarkCircleOutline
  return null
}

const totalFinalOrden = (orden?: Pick<Orden, 'total' | 'montoRecibido' | 'estado' | 'estadoPago'> | null) =>
  Number(((orden?.estado === 'cancelada' ? -1 : 1) * Math.abs(
    orden?.estadoPago === 'pagado'
      ? (orden?.total ?? 0)
      : (orden?.total ?? 0) - (orden?.montoRecibido ?? 0)
  )).toFixed(2))

// Se usa durante el cálculo de la lista de órdenes, que se evalúa antes que
// las utilidades declaradas al final del módulo. Una declaración de función se
// eleva de forma segura y evita el acceso temporal antes de inicializarla.
function tieneAnticiposHuerfanos(orden?: Pick<Orden, 'anticipos'> | null) {
  return orden?.anticipos?.some((anticipo) => anticipo.cierreHuerfano === true) === true
}

const necesitaAtencion = (orden?: Orden | null) =>
  tieneAnticiposHuerfanos(orden) || orden?.turnoHuerfano === true

const escaparHtml = (texto: string) =>
  texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const formatearFechaCorta = (valor: string) =>
  formatearFechaCentroamerica(valor, {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })

const construirMensajeWhatsApp = () => {
  const orden = ordenSeleccionada.value
  if (!orden) return ''

  // --- Helpers para alinear texto en las secciones "monospace" (estilo ticket) ---
  const pad = (texto: string, ancho: number) =>
    texto.length >= ancho ? texto.slice(0, ancho) : texto + ' '.repeat(ancho - texto.length)

  const padIzq = (texto: string, ancho: number) =>
    texto.length >= ancho ? texto.slice(0, ancho) : ' '.repeat(ancho - texto.length) + texto

  const formatoMonto = (monto: number) => {
    const signo = monto < 0 ? '-' : ''
    return `${signo}$${Math.abs(monto).toFixed(2)}`
  }

  const lineaItem = (item: typeof orden.items[number]) => {
    const cantidad = Number(item.cantidad) || 0
    const precioUnitario = Number(item.precio) || 0
    const subtotalServicio = precioUnitario * cantidad
    return [
      `${cantidad}x ${item.nombre}`,
      `   Precio por unidad: ${formatoMonto(precioUnitario)}`,
      `   Subtotal servicio: ${formatoMonto(subtotalServicio)}`
    ].join('\n')
  }

  const lineaTotal = (etiqueta: string, monto: number) =>
    `${pad(etiqueta, 14)}${padIzq(formatoMonto(monto), 10)}`

  // --- Datos de la orden ---
  const servicios = orden.items.length
    ? orden.items.map((item) => lineaItem(item)).join('\n')
    : 'Sin servicios registrados'

  const descuento = Math.max(0, orden.subtotal - orden.total)
  const entrega = orden.fechaEntrega
    ? textoEntrega(orden)
    : 'Te avisaremos cuando esté lista para recoger.'

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
    `Entrega estimada: ${entrega}`,
    ...(orden.estado === 'entregado'
      ? [`Entregada el: *${formatearFechaHora(orden.updatedAt)}*`]
      : []),
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

const enviarWhatsApp = () => {
  const orden = ordenSeleccionada.value
  if (!orden || typeof window === 'undefined') return

  const mensaje = construirMensajeWhatsApp()
  if (!mensaje) return

  const numero = `${orden.codigoPais}${orden.telefono}`.replace(/\D/g, '')

  window.dispatchEvent(new CustomEvent('whatsapp-compose', {
    detail: { phone: numero, message: mensaje }
  }))
}


const generarHtmlReporteOrden = (orden: Orden) => {
  const fecha = formatearFechaCorta(orden.createdAt)

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

  const cargosExtraHtml = orden.cargosExtra.length
    ? `
      <div class="bloque">
        <h3>Cargos extra</h3>
        <table>
          <thead><tr><th>Descripción</th><th style="text-align:right">Fecha</th><th style="text-align:right">Monto</th></tr></thead>
          <tbody>
            ${orden.cargosExtra
              .map(
                (c) => `
                  <tr>
                    <td>${escaparHtml(c.descripcion)}</td>
                    <td style="text-align:right">${formatearFechaHora(c.fecha)}</td>
                    <td style="text-align:right">$${c.monto.toFixed(2)}</td>
                  </tr>
                `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `
    : ''

  const anticiposHtml = orden.anticipos.length
    ? `
      <div class="bloque">
        <h3>Historial de anticipos</h3>
        <table>
          <thead><tr><th>Fecha</th><th style="text-align:right">Monto</th></tr></thead>
          <tbody>
            ${orden.anticipos
              .map(
                (a) => `
                  <tr>
                    <td>${formatearFechaHora(a.fecha)}</td>
                    <td style="text-align:right">$${a.monto.toFixed(2)}</td>
                  </tr>
                `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `
    : ''

  const notasHtml = orden.notaInterna
    ? `
      <div class="bloque">
        <h3>Notas internas</h3>
        <p class="nota">${escaparHtml(orden.notaInterna)}</p>
      </div>
    `
    : ''

  const fotosHtml = orden.fotos.length
    ? `
      <div class="bloque">
        <h3>Fotos</h3>
        <div class="fotos">
          ${orden.fotos.map((foto) => `<img src="${foto}" />`).join('')}
        </div>
      </div>
    `
    : ''

  return `
    <html>
      <head>
      <meta charset="UTF-8" />
        <title>${escaparHtml(orden.numero)} - Lavandería Salinas</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 28px; color: #0a1f38; }
          .sheet { max-width: 760px; margin: 0 auto; border: 1px solid #e5edf3; border-radius: 18px; padding: 24px; }
          .header { margin-bottom: 18px; }
          h1 { margin: 0; font-size: 1.5rem; }
          h3 { margin: 0 0 10px; font-size: 1rem; color: #123a66; }
          .muted { color: #6f8399; margin: 4px 0 0; }
          .hero { background: #f3fbfa; border: 1px solid #cdebe6; border-radius: 16px; padding: 18px; margin: 18px 0; }
          .hero strong { color: #123a66; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 20px; margin: 18px 0; }
          .info-grid div { font-size: 0.9rem; }
          .info-grid span { display: block; color: #6f8399; font-size: 0.76rem; text-transform: uppercase; letter-spacing: 0.05em; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { padding: 10px 8px; border-bottom: 1px solid #e6edf3; font-size: 0.95rem; }
          th { text-align: left; color: #5c7289; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.05em; }
          .bloque { margin-top: 24px; }
          .nota { background: #fef9ec; border: 1px solid #f0e0b0; border-radius: 12px; padding: 12px; font-size: 0.9rem; white-space: pre-wrap; }
          .fotos { display: flex; flex-wrap: wrap; gap: 10px; }
          .fotos img { width: 120px; height: 120px; object-fit: cover; border-radius: 10px; border: 1px solid #e5edf3; }
          .total { display: flex; justify-content: space-between; margin-top: 24px; font-size: 1.1rem; font-weight: 800; }
          .footer { margin-top: 18px; color: #6f8399; font-size: 0.88rem; }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="header">
            <h1>Lavandería Salinas</h1>
            <p class="muted">Tu orden</p>
          </div>
          <div class="hero">
            <div><strong>Orden ${escaparHtml(orden.numero)}</strong></div>
            <p>Cliente: ${escaparHtml(orden.nombreCliente)}</p>
            <p>Fecha de creación: ${fecha}</p>
            <p>Prendas recibidas: <strong>${Number(orden.cantidadPrendas || 0)}</strong></p>
            ${orden.detallesPrendas ? `<p>Detalles: ${escaparHtml(orden.detallesPrendas)}</p>` : ''}
            <p><strong>Total a pagar:</strong> $${totalFinalOrden(orden).toFixed(2)}</p>
          </div>

          <div class="info-grid">
            <div><span>Estado de la orden</span>${textoEstado(orden.estado)}</div>
            <div><span>Estado de pago</span>${textoEstadoPago(orden.estadoPago)}</div>
            <div><span>Monto recibido</span>$${orden.montoRecibido.toFixed(2)}</div>
            <div><span>Entrega</span>${textoEntrega(orden)}</div>
            <div><span>Prendas recibidas</span>${Number(orden.cantidadPrendas || 0)}</div>
            <div><span>Detalles</span>${orden.detallesPrendas ? escaparHtml(orden.detallesPrendas) : 'Sin detalles'}</div>
          </div>

          <div class="bloque">
            <h3>Servicios</h3>
            <table>
              <thead>
                <tr><th>Servicio</th><th>Cant.</th><th>Precio</th><th>Subtotal</th></tr>
              </thead>
              <tbody>${itemsHtml}</tbody>
            </table>
          </div>

          ${cargosExtraHtml}
          ${anticiposHtml}
          ${notasHtml}
          ${fotosHtml}

          <div class="total">
            <span>Total a pagar</span>
            <span>$${totalFinalOrden(orden).toFixed(2)}</span>
          </div>
          <div class="footer">Gracias por su preferencia.</div>
          <p>Contrato de servicio
            Para retirar las prendas, es indispensable presentar este recibo como único comprobante válido. Las prendas deberán ser retiradas en un máximo de 1 día; de no hacerlo, se aplicará un cargo adicional de $0.50 por cada día de retraso. El plazo para realizar cualquier reclamación sobre el servicio es de 2 días hábiles después de la entrega. La lavandería no se responsabiliza por pérdidas o daños causados por eventos fortuitos o fuerza mayor, como robos, incendios o desastres naturales, siendo este riesgo asumido por el clienteb. Las prendas no retiradas en un plazo de 30 días serán consideradas abandonadas, liberando a la lavandería de toda responsabilidad sobre ellas. Si dichas prendas no son reclamadas en un plazo adicional de 10 días (40 días en total desde su disponibilidad), la lavandería se reserva el derecho de donarlas a refugios u organizaciones benéficas sin posibilidad de reclamos futuros. En caso de dudas, comuníquese con nosotros a lavanderiasalinassv@gmail.com o al teléfono 2497 6699.
            Este documento es válido como comprobante de pago emitido por Lavandería Salinas.</p>
          </div>
      </body>
    </html>
  `
}

const resumenServicios = (items: OrdenItem[]) => items.map((item) => item.nombre).join(', ')

const textoEntrega = (orden: Orden) => {
  if (!orden.fechaEntrega) return 'Sin fecha'
  const fecha = new Date(`${orden.fechaEntrega}T00:00:00`)
  const fechaTexto = fecha.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
  if (orden.horaEntrega) {
    return `${fechaTexto} a las ${orden.horaEntrega}`
  }
  return fechaTexto
}

const ordenVencida = (orden: Orden) => {
  if (!orden.fechaEntrega || orden.estado === 'entregado' || orden.estado === 'cancelada') return false
  return orden.fechaEntrega < fechaHoyCentroamerica()
}

const formatearFecha = (valor: string) =>
  formatearFechaCentroamerica(valor, {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })

const formatearHora = (valor: string) =>
  formatearFechaCentroamerica(valor, {
    hour: '2-digit',
    minute: '2-digit'
  })

const formatearFechaHora = (valor: string) =>
  formatearFechaCentroamerica(valor, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

const iniciarArrastreOrden = (id: string) => {
  arrastrandoOrdenId.value = id
  columnaActivaDrop.value = ''
}

const finalizarArrastreOrden = () => {
  reiniciarArrastre()
}

const puedeCambiarEstado = (estadoActual: OrdenEstado, estadoDestino: OrdenEstado) => {
  if (esOperador.value) {
    return (estadoActual === 'pendiente' && estadoDestino === 'en_proceso') ||
           (estadoActual === 'en_proceso' && estadoDestino === 'listo')
  }

  const indiceDestino = estadosOrden.indexOf(estadoDestino)
  if (indiceDestino === -1) return false
  if (esAdministrador.value && estadoActual === 'cancelada') return true

  const indiceActual = estadosOrden.indexOf(estadoActual)
  if (indiceActual === -1 || indiceActual === indiceDestino) return false

  return esAdministrador.value
    ? true
    : indiceDestino === indiceActual + 1
}

const puedeSoltarEnColumna = (orden: Orden, estadoDestino: OrdenEstado) => {
  const indiceActual = estadosOrden.indexOf(orden.estado)
  const indiceDestino = estadosOrden.indexOf(estadoDestino)
  if (indiceActual === -1 || indiceDestino === -1) return false
  return puedeCambiarEstado(orden.estado, estadoDestino)
}

const activarDrop = (estadoDestino: OrdenEstado) => {
  columnaActivaDrop.value = estadoDestino
}

const limpiarDrop = () => {
  columnaActivaDrop.value = ''
}

const soltarEnColumna = async (estadoDestino: OrdenEstado) => {
  if (!arrastrandoOrdenId.value) return

  const orden = obtenerOrdenPorId(arrastrandoOrdenId.value)
  if (!orden) return

  if (!puedeSoltarEnColumna(orden, estadoDestino)) {
    reiniciarArrastre()
    return
  }

  solicitarCambioEstado(orden.id, estadoDestino, 'tablero')
  reiniciarArrastre()
}

const solicitarCambioEstado = (
  idOrden: string,
  estadoDestino: OrdenEstado,
  _origen: 'tablero' | 'detalle'
) => {
  const orden = obtenerOrdenPorId(idOrden)
  if (!orden) return

  if (!puedeCambiarEstado(orden.estado, estadoDestino)) return

  ordenCambioPendienteId.value = idOrden
  estadoObjetivoCambio.value = estadoDestino
  enviarNotificacionCambioEstado.value = true
  if (estadoDestino === 'entregado') {
    registrarEntregaAntigua.value = false
    turnoIdEntregaAntigua.value = turno.id || ''
    if (esAdministrador.value) void cargarHistorial()
  }

  if (
    esOperador.value &&
    estadoDestino === 'en_proceso' &&
    orden.estado === 'pendiente'
  ) {
    ordenRecepcionPendienteId.value = idOrden
    cantidadRecibidaModal.value = Number(orden.cantidadPrendas || 0)
    notaRecepcionModal.value = ''
    mostrarModalRecepcion.value = true
    return
  }

  // El operador puede cambiar a "listo" sin modal de recepción
  if (
    esOperador.value &&
    estadoDestino === 'listo' &&
    orden.estado === 'en_proceso'
  ) {
    // No se requiere modal de recepción para este cambio
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
    window.alert(
      error instanceof Error
        ? error.message
        : 'No se pudo registrar la recepción de la orden.'
    )
  } finally {
    peticionOrdenEnCurso.value = false
  }
}

// Arma asunto + mensaje según el estado y envía la notificación por correo.
// Se usa tanto para cambios normales de estado como para cancelación.
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
      await enviarCorreoNotificacion(
        orden.correo,
        orden.nombreCliente,
        orden.numero,
        orden.total.toFixed(2),
        mensaje,
        asunto
      )

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
      await enviarCorreoNotificacion(
        orden.correo,
        orden.nombreCliente,
        orden.numero,
        orden.total.toFixed(2),
        mensaje,
        asunto
      )
    }
    console.log(`Notificación enviada al cliente para estado: ${estado}`)
  } catch (error) {
    console.error('Error al enviar notificación:', error)
    // No fallar el flujo principal si falla el correo
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
      ...(usarEntregaAntigua ? { turnoId: turnoIdEntregaAntigua.value } : {})
    })

    // Al entregar la orden, marcar automáticamente como pagada
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
    window.alert(
      error instanceof Error
        ? error.message
        : 'No se pudo actualizar el estado de la orden.'
    )
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
    // Registrar como movimiento en lugar de solo actualizar nota interna
    const movimientoCreado = await registrarMovimiento(ordenSeleccionada.value.id, notaTexto)
    if (!movimientoCreado) throw new Error('No se pudo registrar el movimiento.')
    
    // Limpiar el textarea después de guardar
    notaBorrador.value = ''
    notaGuardada.value = true
  } catch (error) {
    errorNota.value = error instanceof Error
      ? error.message
      : 'No se pudo guardar la nota. Intenta nuevamente.'
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

onMounted(() => {
  actualizarOrdenesPorPagina()
  window.addEventListener('resize', actualizarOrdenesPorPagina)
  void cargarCatalogo()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', actualizarOrdenesPorPagina)
})

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

.ordenes-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-height: calc(100% + 220px);
}

.ordenes-page.modo-solo-detalle > :not(ion-modal) {
  display: none !important;
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
}

.header-row h1 {
  margin: 0;
  font-size: clamp(1.8rem, 2.5vw, 2.6rem);
  color: #0a1f38;
  font-weight: 900;
}

.subtitulo {
  margin: 6px 0 0;
  color: #5c7289;
  max-width: 700px;
}

.ordenes-resumen {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-subir-foto-link {
  cursor: pointer;
}

.resumen-chip {
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(102, 194, 184, 0.14);
  color: #2c7f78;
  font-weight: 700;
  font-size: 0.85rem;
}

.controles-superiores {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #ffffff;
  border: 1px solid rgba(10, 31, 56, 0.1);
  border-radius: 14px;
  padding: 11px 16px;
  color: #4a627e;
  box-shadow: 0 2px 10px rgba(10, 31, 56, 0.04);
}

.search-bar input {
  border: none;
  outline: none;
  flex: 1;
  font-size: 0.92rem;
  background: transparent;
  color: #0a1f38;
}

.chip-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.chip-row-ordenamiento {
  align-items: center;
}

.filtros-fecha {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-left: 4px;
}

.ordenamiento-label {
  font-size: 0.8rem;
  color: #4a627e;
  font-weight: 700;
  margin-right: 2px;
}

.filtro-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid rgba(10, 31, 56, 0.1);
  background: #ffffff;
  color: #123a66;
  cursor: pointer;
  font-weight: 700;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease, transform 0.1s ease;
}

.fecha-filtro-input {
  border: 1px solid rgba(10, 31, 56, 0.12);
  border-radius: 10px;
  background: #ffffff;
  color: #0a1f38;
  padding: 7px 10px;
  font-size: 0.82rem;
}

.filtro-chip-secundario {
  padding: 7px 12px;
  font-size: 0.82rem;
}

.filtro-chip-limpiar {
  border-color: rgba(18, 58, 102, 0.2);
  background: #eef3fb;
  color: #123a66;
}

.filtro-chip:hover {
  transform: translateY(-1px);
}

.filtro-chip.active {
  color: #ffffff;
}

.btn-eliminar-dia {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  margin-left: auto;
  border: 1px solid rgba(220, 38, 38, 0.24);
  border-radius: 10px;
  background: #fff7f7;
  color: #b91c1c;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease;
}

.btn-eliminar-dia:hover {
  background: #fee2e2;
  transform: translateY(-1px);
}

.resumen-eliminacion-dia {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 14px;
  padding: 12px;
  border: 1px solid rgba(220, 38, 38, 0.18);
  border-radius: 10px;
  background: #fff7f7;
  color: #7f1d1d;
}

.resumen-eliminacion-dia span {
  font-size: 0.82rem;
}

.dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* ---------- Estilos para detalles de método de pago ---------- */
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

/* ---------- Contenido principal: grid de cards por estado ---------- */

.contenido-principal {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
  flex: 1;
}

.grid-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.grid-header-badge {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  font-size: 18px;
  flex-shrink: 0;
}

.grid-header strong {
  font-size: 1.08rem;
  color: #0a1f38;
}

.grid-header-count {
  margin-left: auto;
  padding: 5px 13px;
  border-radius: 999px;
  background: rgba(10, 31, 56, 0.06);
  color: #5c7289;
  font-weight: 800;
  font-size: 0.82rem;
}

.ordenes-tablero-layout {
  display: grid;
  grid-template-columns: minmax(190px, 220px) minmax(0, 1fr);
  gap: 16px;
  align-items: start;
  min-width: 0;
}

.cola-ordenes {
  position: sticky;
  top: 0;
  min-width: 0;
  max-height: min(620px, calc(100vh - 180px));
  padding: 12px;
  border: 1px solid rgba(18, 58, 102, 0.1);
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 8px 20px rgba(10, 31, 56, 0.05);
}

.cola-ordenes-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(10, 31, 56, 0.08);
}

.cola-ordenes-etiqueta {
  margin: 0 0 3px;
  color: #6f8399;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.cola-ordenes-header strong {
  color: #0a1f38;
  font-size: 0.95rem;
}

.cola-ordenes-count {
  display: grid;
  place-items: center;
  min-width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #e8f7f4;
  color: #126e68;
  font-size: 0.76rem;
  font-weight: 900;
}

.cola-ordenes-lista {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: calc(min(620px, 100vh - 180px) - 62px);
  padding-top: 8px;
  overflow-y: auto;
}

.cola-orden-item {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr);
  align-items: center;
  gap: 7px;
  min-width: 0;
  padding: 8px 6px;
  border: 1px solid transparent;
  border-radius: 9px;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.cola-orden-item:hover {
  border-color: rgba(22, 139, 131, 0.2);
  background: #f1fbfa;
}

.cola-orden-item.vencida {
  border-color: rgba(220, 38, 38, 0.45);
  animation: cola-vencida 1.4s ease-in-out infinite;
}

@keyframes cola-vencida {
  0%, 100% { box-shadow: inset 0 0 0 rgba(220, 38, 38, 0); }
  50% { box-shadow: inset 0 0 10px rgba(220, 38, 38, 0.32); }
}

.cola-orden-posicion {
  color: #6f8399;
  font-size: 0.78rem;
  font-weight: 900;
  text-align: center;
}

.cola-orden-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 2px;
}

.cola-orden-info strong,
.cola-orden-info small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cola-orden-info strong {
  color: #123a66;
  font-size: 0.78rem;
}

.cola-orden-info small {
  color: #6f8399;
  font-size: 0.72rem;
}

.cola-orden-vacia {
  margin: 12px 4px;
  color: #9fb4c9;
  font-size: 0.78rem;
  text-align: center;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  align-items: start;
}

.paginacion-ordenes {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin-top: 18px;
  color: #5c7289;
  font-size: 0.82rem;
  font-weight: 800;
}

.paginacion-btn {
  border: 1px solid rgba(18, 58, 102, 0.18);
  border-radius: 9px;
  padding: 8px 14px;
  color: #123a66;
  background: #ffffff;
  font: inherit;
  cursor: pointer;
}

.paginacion-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.orden-card {
  text-align: left;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(10, 31, 56, 0.08);
  border-radius: 16px;
  padding: 16px;
  background: #ffffff;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 230px;
  box-sizing: border-box;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
}

.orden-card.vencida::before {
  content: '';
  position: absolute;
  inset: 0;
  border: 2px solid #dc2626;
  border-radius: inherit;
  opacity: 0.35;
  pointer-events: none;
  animation: destello-vencida 1.4s ease-in-out infinite;
}

@keyframes destello-vencida {
  0%, 100% { opacity: 0.2; box-shadow: inset 0 0 0 rgba(220, 38, 38, 0), 0 0 0 rgba(220, 38, 38, 0); }
  50% { opacity: 1; box-shadow: inset 0 0 10px rgba(220, 38, 38, 0.35), 0 0 14px rgba(220, 38, 38, 0.75); }
}

.orden-card:hover,
.orden-card.selected {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(10, 31, 56, 0.1);
  border-color: var(--card-accent, #66c2b8);
}

.card-top,
.card-bottom {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
}

.card-top {
  margin: -16px -16px 0;
  padding: 0;
  background: #ffffff;
  min-height: 48px;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: 7fr 3fr;
  align-items: stretch;
}

.card-top-identidad {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
  min-width: 0;
  padding: 12px 8px;
  box-sizing: border-box;
  background: var(--card-accent, #66c2b8);
  color: #ffffff;
}

.header-numero {
  display: flex;
  flex: 0 0 auto;
  min-width: max-content;
}

.header-numero strong {
  font-size: 1rem;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.card-top-identidad .estado-chip {
  flex: 0 0 auto;
  width: max-content;
  max-width: 100%;
  min-width: 0;
  justify-content: center;
  margin: 0;
  padding: 5px 8px;
  border-radius: 999px;
  font-size: 0.56rem;
  line-height: 1.05;
  text-align: center;
  white-space: normal;
  overflow-wrap: anywhere;
}

.card-top-intervencion {
  border: 0;
  font: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 0;
  padding: 6px 8px;
  box-sizing: border-box;
  background: #fff1f2;
  color: #b91c1c;
  font-size: 0.65rem;
  font-weight: 800;
  line-height: 1.1;
  text-align: center;
  cursor: pointer;
}

.card-top-intervencion ion-icon {
  color: #dc2626;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.card-top-intervencion:hover {
  background: #ffe4e6;
}

.motivo-intervencion-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  max-width: 42%;
  margin: 0 auto;
  padding: 6px 10px;
  border-radius: 6px;
  background: #fff1f2;
  color: #b91c1c;
  font-size: 0.95rem;
  font-weight: 800;
  line-height: 1.2;
  text-align: center;
}

.motivo-intervencion-header ion-icon {
  color: #eab308;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.alerta-requiere-atencion {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #dc2626;
  font-weight: 600;
  font-size: 0.9rem;
  padding: 8px 12px;
  margin: 8px 0;
  border-radius: 6px;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.alerta-requiere-atencion ion-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
}

.precios-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.saldo-pendiente {
  font-size: 0.65rem;
  font-weight: 700;
  color: #dc2626;
}

.estado-chip {
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 0.72rem;
  font-weight: 800;
  flex-shrink: 0;
}

.cliente {
  margin: 2px 0 0;
  font-weight: 800;
  color: #0a1f38;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.detalles,
.entrega,
.prendas {
  margin: 0;
  color: #6f8399;
  font-size: 0.84rem;
  line-height: 1.35;
}

.detalles {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.entrega {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  width: 100%;
}

.card-bottom {
  margin-top: 4px;
}

.total {
  font-size: 1.05rem;
}

.total-pagada {
  color: #15803d !important;
}

.grid-vacio {
  grid-column: 1 / -1;
  min-height: 220px;
  display: grid;
  place-items: center;
  color: #9fb4c9;
  background: rgba(10, 31, 56, 0.02);
  border-radius: 16px;
  border: 1px dashed rgba(10, 31, 56, 0.08);
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

.pill ion-icon {
  font-size: 13px;
}

.pago-porCobrar {
  background: rgba(232, 163, 23, 0.18);
  color: #8a5a09;
}

.pago-anticipo {
  background: rgba(18, 58, 102, 0.1);
  color: #123a66;
}

.pago-pagado {
  background: rgba(22, 163, 74, 0.12);
  color: #15803d;
}

/* ---------- Modal detalle ---------- */

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

.orden-cerrada-header {
  margin: 4px 0 0;
  color: #4b5563;
  font-size: 0.78rem;
  font-weight: 700;
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

.estado-rapido,
.estado-deslizador {
  border: 1px solid rgba(10, 31, 56, 0.08);
  border-radius: 18px;
  padding: 14px;
  background: linear-gradient(180deg, #ffffff 0%, #f9fcfd 100%);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.estado-meta {
  color: #5c7289;
  font-weight: 700;
  font-size: 0.85rem;
}

.estado-hint {
  margin: 0;
  color: #6f8399;
  font-size: 0.84rem;
}

.estado-acciones {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
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

@media (max-width: 480px) {
  .estado-cuadritos {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.mini {
  width: auto;
  flex: 1 1 220px;
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
}

.foto-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
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

.prendas-editable {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 12px;
  padding: 10px 12px;
  border: 1px solid rgba(10, 31, 56, 0.08);
  border-radius: 12px;
  background: rgba(102, 194, 184, 0.06);
}

.prendas-editable-label {
  font-weight: 700;
  color: #0a1f38;
  font-size: 0.86rem;
}

.prendas-editable-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.prendas-editable-input {
  width: 80px;
  padding: 7px 10px;
  border: 1px solid rgba(10, 31, 56, 0.14);
  border-radius: 8px;
  color: #0a1f38;
  font-weight: 800;
  text-align: center;
}

.prendas-editable-input:disabled {
  opacity: 0.6;
  background: #f1f5f7;
}

.prendas-editable-guardar {
  border: none;
  border-radius: 8px;
  padding: 7px 12px;
  background: #66c2b8;
  color: #ffffff;
  font-weight: 800;
  font-size: 0.8rem;
  cursor: pointer;
  white-space: nowrap;
}

.prendas-editable-guardar:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.foto-item {
  position: relative;
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

.servicio-linea strong {
  color: #0a1f38;
}

.servicio-linea span {
  display: block;
  color: #6f8399;
  font-size: 0.84rem;
}

.anticipo-huerfano {
  border-color: rgba(239, 68, 68, 0.3) !important;
  background-color: rgba(239, 68, 68, 0.08) !important;
}

.anticipo-error-badge {
  display: block;
  color: #dc2626;
  font-size: 0.8rem;
  font-weight: 600;
  margin-top: 4px;
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

.total-box .total-box-pagada {
  color: #123a66;
}

.total-box strong {
  font-size: 1.35rem;
  color: #2c7f78;
}

.saldo-pendiente-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-radius: 14px;
  border: 1px solid rgba(239, 68, 68, 0.35);
  background: rgba(239, 68, 68, 0.08);
  margin-top: 8px;
}

.saldo-pendiente-box span {
  font-weight: 700;
  color: #0a1f38;
}

.saldo-pendiente-box strong {
  font-size: 1.2rem;
  color: #dc2626;
}

.btn-outline,
.btn-verde,
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

.btn-verde {
  background: #16a34a;
  color: #ffffff;
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

.motivo-intervencion-modal-texto {
  margin: 0;
  padding: 11px 12px;
  border-radius: 8px;
  background: #fff1f2;
  color: #b91c1c;
  font-size: 0.9rem;
  font-weight: 700;
  line-height: 1.4;
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
  .ordenes-tablero-layout {
    grid-template-columns: 1fr;
  }

  .cola-ordenes {
    display: none;
  }

  .card-top-identidad {
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    gap: 12px;
    padding-block: 12px;
  }

  .card-top {
    min-height: 48px;
  }

  .card-top-identidad .estado-chip {
    align-self: center;
    flex: 0 0 auto;
    width: max-content;
    max-width: 100%;
    padding: 5px 8px;
    border-radius: 999px;
    font-size: 0.62rem;
    white-space: normal;
    overflow-wrap: anywhere;
  }

  .cards-grid {
    grid-template-columns: 1fr;
  }

  .motivo-intervencion-header {
    max-width: 180px;
    margin: 0;
    font-size: 0.72rem;
  }

  .modal-header {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
  }

  .modal-header-acciones {
    grid-column: 1 / -1;
    justify-content: flex-end;
    width: 100%;
    padding-top: 2px;
  }

  .modal-ordenes {
    --width: 100vw;
    --height: 100vh;
    --border-radius: 0;
  }

  .modal-detalle {
    padding: 26px 14px 14px;
  }
}

@media (max-width: 480px) {
  .cards-grid {
    grid-template-columns: 1fr;
  }

  .card-top-intervencion {
    gap: 2px;
    padding-inline: 4px;
    font-size: 0.56rem;
    overflow-wrap: anywhere;
  }

  .card-top-intervencion ion-icon {
    font-size: 0.75rem;
  }

  .motivo-intervencion-header {
    width: 32px;
    height: 32px;
    flex: 0 0 32px;
    max-width: none;
    padding: 0;
    border-radius: 50%;
    gap: 0;
  }

  .motivo-intervencion-header span {
    display: none;
  }

  .motivo-intervencion-header ion-icon {
    font-size: 1.05rem;
  }
}

@media (min-width: 481px) and (max-width: 600px) {
  .motivo-intervencion-header {
    width: 32px;
    height: 32px;
    flex: 0 0 32px;
    max-width: none;
    padding: 0;
    border-radius: 50%;
    gap: 0;
  }

  .motivo-intervencion-header span {
    display: none;
  }

  .motivo-intervencion-header ion-icon {
    font-size: 1.05rem;
  }
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

.toggle-check:has(input:focus-visible) {
  border-color: #2c9b96;
  box-shadow: 0 0 0 3px rgba(44, 155, 150, 0.14);
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

.toggle-check input:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(44, 155, 150, 0.18);
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

.modal-input-select:hover,
.modal-input-fecha:hover {
  border-color: #91cfc9;
  background: #fbfefe;
}

.modal-input-select:focus,
.modal-input-fecha:focus {
  border-color: #2c9b96;
  box-shadow: 0 0 0 3px rgba(44, 155, 150, 0.14);
}

.modal-input-select option {
  color: #173c55;
  background: #ffffff;
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

.producto-modal-item ion-icon {
  font-size: 20px;
  color: #66c2b8;
  flex-shrink: 0;
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
.btn-icono.peligro { color: #dc2626; }
.btn-icono.peligro:hover { background: rgba(220,38,38,0.12); }
</style>
