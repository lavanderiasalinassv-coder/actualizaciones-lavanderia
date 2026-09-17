<template>
  <ion-page class="shell-root" :style="estiloAppShell">
    <div v-if="mostrarCargador && cargandoVista" class="shell-loading-overlay" aria-live="polite">
      <div class="shell-loading-logo">
        <img :src="logoActual" alt="" @error="usarLogoLocal" />
        <span class="shell-loading-ring"></span>
      </div>
      <p>Cargando...</p>
    </div>

    <div v-if="notificacionOrdenVisible" class="notificacion-orden" role="status">
      <ion-icon :icon="checkmarkCircleOutline" />
      <span>Orden {{ notificacionOrdenNumero }} en proceso</span>
    </div>

    <ion-content
      class="shell-container"
      :scroll-y="false"
      :force-overscroll="false"
    >
      <main class="main-content">
        <div class="content-wrapper">
          <!-- Banner general (aparece en todas las vistas) -->
          <div class="global-banner" ref="bannerRef" :class="{ 'banner-colapsado': squeeze >= 0.98 }">
            <div class="banner-glow" aria-hidden="true"></div>

            <div class="banner-full" :style="bannerFullStyle">
              <div class="banner-perfil-notificaciones">
                <div class="banner-notificacion-icono">
                  <button class="notificacion-icono-btn" @click="abrirMenuNotificaciones">
                    <ion-icon :icon="notificationsOutline" />
                    <div v-if="!insigniaNotificacionesOculta && totalAlertasNotificaciones > 0" class="notificacion-burbuja-pequena">
                      {{ totalAlertasNotificaciones }}
                    </div>
                  </button>
                  <div v-if="mostrarMenuNotificaciones" class="notificacion-menu">
                    <button v-if="!esModoDesarrollador" class="notificacion-menu-item" @click="mostrarModalNotificaciones = true; mostrarMenuNotificaciones = false">
                      <ion-icon :icon="notificationsOutline" />
                      <span>Notificaciones</span>
                      <div v-if="totalNotificacionesNoLeidas > 0" class="notificacion-menu-burbuja">
                        {{ totalNotificacionesNoLeidas }}
                      </div>
                    </button>
                    <button v-if="!esModoDesarrollador" class="notificacion-menu-item" @click="mostrarModalReportarProblema = true; mostrarMenuNotificaciones = false">
                      <ion-icon :icon="documentTextOutline" />
                      <span>Reportar problema</span>
                    </button>
                    <button v-if="esModoDesarrollador" class="notificacion-menu-item" @click="mostrarModalListaProblemas = true; mostrarMenuNotificaciones = false">
                      <ion-icon :icon="listOutline" />
                      <span>Lista de problemas</span>
                      <div v-if="problemasPendientes.length > 0" class="notificacion-menu-burbuja">
                        {{ problemasPendientes.length }}
                      </div>
                    </button>
                    <button v-if="esAdministrador" class="notificacion-menu-item" @click="abrirModalAviso">
                      <ion-icon :icon="megaphoneOutline" />
                      <span>Enviar aviso</span>
                    </button>
                    <button v-if="esElectron" class="notificacion-menu-item" @click="abrirBuscarActualizaciones()">
                      <ion-icon :icon="cloudDownloadOutline" />
                      <span>Buscar actualizaciones</span>
                      <div v-if="actualizacionPendiente" class="notificacion-menu-burbuja">1</div>
                    </button>
                    <button v-if="esModoDesarrollador" class="notificacion-menu-item notificacion-menu-item-peligro" @click="limpiarNotificacionesDesdeMenu">
                      <ion-icon :icon="trashOutline" />
                      <span>Limpiar notificaciones</span>
                    </button>
                    <button v-else class="notificacion-menu-item" @click="mostrarModalListaProblemas = true; mostrarMenuNotificaciones = false">
                      <ion-icon :icon="listOutline" />
                      <span>Mis reportes</span>
                    </button>
                  </div>
                </div>
                <button v-if="!esOperador" class="notificacion-icono-btn whatsapp-launch-btn" type="button" title="Abrir WhatsApp Web" aria-label="Abrir WhatsApp Web" :disabled="!esAdministrador && funcionesBloqueadas" @click="abrirWhatsapp">
                  <ion-icon :icon="logoWhatsapp" />
                </button>
                <button v-if="esAdministrador" class="notificacion-icono-btn facebook-launch-btn" type="button" title="Abrir Facebook Messenger" aria-label="Abrir Facebook Messenger" @click="abrirFacebook">
                  <ion-icon :icon="logoFacebook" />
                </button>
                <button class="banner-perfil-superior" type="button" title="Editar mi perfil" aria-label="Editar mi perfil" :disabled="!esAdministrador && funcionesBloqueadas" @click="abrirPerfil">
                  <img v-if="usuarioActual?.imagenPerfil" :src="usuarioActual.imagenPerfil" :alt="`Foto de ${usuarioActual.nombre}`" />
                  <ion-icon v-else :icon="personCircleOutline" />
                </button>
              </div>
              <div class="banner-top-row">
                <button class="banner-home-btn" @click="irA('/tabs/principal')">
                  <ion-icon :icon="homeOutline" />
                  <span>Home</span>
                </button>

                <nav class="breadcrumb-nav">
                  <template v-for="(miga, i) in migas" :key="miga.path">
                    <button
                      class="breadcrumb-item"
                      :class="{ active: i === migas.length - 1 }"
                      @click="irA(miga.path)"
                    >
                      {{ miga.label }}
                    </button>
                    <span v-if="i < migas.length - 1" class="breadcrumb-sep">/</span>
                  </template>
                </nav>
              </div>

              <div class="banner-centro">
                <div class="banner-logo-marco">
                  <img :src="logoActual" alt="Lavandería Salinas" class="banner-logo-grande" @error="usarLogoLocal" />
                </div>
                <div class="banner-centro-copy">
                  <p class="banner-fecha">{{ fechaLarga }}</p>
                  <h1 class="banner-reloj">{{ horaActual }}</h1>
                  <p class="banner-saludo">{{ saludoPersonalizado }}</p>
                </div>
              </div>

              <div v-show="!mostrarAccionesCompactas" class="banner-acciones">
                <button v-if="!esOperador && !esRecepcionista" class="banner-btn" :disabled="botonesOperativosBloqueados" @click="IrAdeposito">
                  <ion-icon :icon="businessOutline" />
                  <span>Deposito</span>
                </button>
                <button v-if="!esOperador" class="banner-btn" :disabled="botonesOperativosBloqueados" @click="abrirModalGasto">
                  <ion-icon :icon="cutOutline" />
                  <span>Gasto</span>
                </button>
                <button class="banner-btn" :disabled="recargandoApp" title="Reiniciar toda la aplicación" @click="refrescarAplicacion">
                  <ion-icon :icon="refreshOutline" />
                  <span>{{ recargandoApp ? 'Reiniciando...' : 'Reiniciar' }}</span>
                </button>
                <button v-if="!esOperador && !esRecepcionista && !esCajero" class="banner-btn" :disabled="botonesOperativosBloqueados" @click="mostrarModalCierres = true">
                  <ion-icon :icon="lockClosedOutline" />
                  <span>Cierres</span>
                </button>
                <button class="banner-btn banner-btn-salir" @click="cerrarSesion">
                  <ion-icon :icon="logOutOutline" />
                  <span>Salir</span>
                </button>
              </div>
            </div>

            <div class="banner-compacta" :style="bannerCompactaStyle">
              <div class="banner-perfil-notificaciones-compacto">
                <div v-if="squeeze < 0.98" class="banner-notificacion-icono">
                  <button class="notificacion-icono-btn" @click="abrirMenuNotificaciones">
                    <ion-icon :icon="notificationsOutline" />
                    <div v-if="!insigniaNotificacionesOculta && totalAlertasNotificaciones > 0" class="notificacion-burbuja-pequena">
                      {{ totalAlertasNotificaciones }}
                    </div>
                  </button>
                  <div v-if="mostrarMenuNotificaciones" class="notificacion-menu">
                    <button class="notificacion-menu-item" @click="mostrarModalNotificaciones = true; mostrarMenuNotificaciones = false">
                      <ion-icon :icon="notificationsOutline" />
                      <span>Notificaciones</span>
                      <div v-if="totalNotificacionesNoLeidas > 0" class="notificacion-menu-burbuja">
                        {{ totalNotificacionesNoLeidas }}
                      </div>
                    </button>
                    <button v-if="!esUsuarioDesarrollador" class="notificacion-menu-item" @click="mostrarModalReportarProblema = true; mostrarMenuNotificaciones = false">
                      <ion-icon :icon="documentTextOutline" />
                      <span>Reportar problema</span>
                    </button>
                    <button v-if="esModoDesarrollador" class="notificacion-menu-item" @click="mostrarModalListaProblemas = true; mostrarMenuNotificaciones = false">
                      <ion-icon :icon="listOutline" />
                      <span>Lista de problemas</span>
                      <div v-if="problemasPendientes.length > 0" class="notificacion-menu-burbuja">
                        {{ problemasPendientes.length }}
                      </div>
                    </button>
                    <button v-if="esAdministrador" class="notificacion-menu-item" @click="abrirModalAviso">
                      <ion-icon :icon="megaphoneOutline" />
                      <span>Enviar aviso</span>
                    </button>
                    <button v-if="esElectron" class="notificacion-menu-item" @click="abrirBuscarActualizaciones()">
                      <ion-icon :icon="cloudDownloadOutline" />
                      <span>Buscar actualizaciones</span>
                      <div v-if="actualizacionPendiente" class="notificacion-menu-burbuja">1</div>
                    </button>
                    <button v-if="esModoDesarrollador" class="notificacion-menu-item notificacion-menu-item-peligro" @click="limpiarNotificacionesDesdeMenu">
                      <ion-icon :icon="trashOutline" />
                      <span>Limpiar notificaciones</span>
                    </button>
                    <button v-else class="notificacion-menu-item" @click="mostrarModalListaProblemas = true; mostrarMenuNotificaciones = false">
                      <ion-icon :icon="listOutline" />
                      <span>Mis reportes</span>
                    </button>
                  </div>
                </div>
                <button v-if="squeeze < 0.98 && (esAdministrador || esCajero)" class="notificacion-icono-btn whatsapp-launch-btn" type="button" title="Abrir WhatsApp Web" aria-label="Abrir WhatsApp Web" :disabled="!esAdministrador && funcionesBloqueadas" @click="abrirWhatsapp">
                  <ion-icon :icon="logoWhatsapp" />
                </button>
                <button v-if="squeeze < 0.98 && esAdministrador" class="notificacion-icono-btn facebook-launch-btn" type="button" title="Abrir Facebook Messenger" aria-label="Abrir Facebook Messenger" @click="abrirFacebook">
                  <ion-icon :icon="logoFacebook" />
                </button>
                <button class="banner-perfil-superior banner-perfil-superior-compacto" type="button" title="Editar mi perfil" aria-label="Editar mi perfil" :disabled="!esAdministrador && funcionesBloqueadas" @click="abrirPerfil">
                  <img v-if="usuarioActual?.imagenPerfil" :src="usuarioActual.imagenPerfil" :alt="`Foto de ${usuarioActual.nombre}`" />
                  <ion-icon v-else :icon="personCircleOutline" />
                </button>
              </div>
              <button class="banner-home-btn banner-home-btn-compacta" @click="irA('/tabs/principal')">
                <ion-icon :icon="homeOutline" />
                <span>Home nuevas actualizaciones</span>
              </button>

              <div class="banner-compacta-reloj">
                {{ horaActual }}
              </div>

              <button
                class="mobile-refresh-button"
                type="button"
                :disabled="recargandoApp"
                :title="recargandoApp ? 'Actualizando...' : 'Actualizar toda la aplicación'"
                :aria-label="recargandoApp ? 'Actualizando...' : 'Actualizar toda la aplicación'"
                @click="refrescarAplicacion"
              >
                <ion-icon :icon="refreshOutline" />
              </button>

              <div v-show="mostrarAccionesCompactas" class="banner-acciones banner-acciones-compactas">
                <button v-if="!esOperador && !esRecepcionista" class="banner-btn banner-btn-compacta" :disabled="botonesOperativosBloqueados" @click="abrirModalGasto">
                  <ion-icon :icon="cutOutline" />
                  <span>Gasto</span>
                </button>
                <button class="banner-btn banner-btn-compacta" :disabled="recargandoApp" title="Actualizar toda la aplicación" @click="refrescarAplicacion">
                  <ion-icon :icon="refreshOutline" />
                  <span>{{ recargandoApp ? 'Actualizando...' : 'Actualizar' }}</span>
                </button>
                <button v-if="!esOperador && !esRecepcionista && !esCajero" class="banner-btn banner-btn-compacta" :disabled="botonesOperativosBloqueados" @click="mostrarModalCierres = true">
                  <ion-icon :icon="lockClosedOutline" />
                  <span>Cierres</span>
                </button>
                <button class="banner-btn banner-btn-compacta banner-btn-salir" @click="cerrarSesion">
                  <ion-icon :icon="logOutOutline" />
                  <span>Salir</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Contenido de cada vista (scrollable real) -->
          <div
            ref="contentAreaRef"
            class="content-area"
            :class="{ 'content-area-principal': route.path === '/tabs/principal' }"
            @scroll="actualizarShellCompacto"
          >
            <slot />
          </div>

        </div>

      </main>
    </ion-content>

    <!-- Modal: gasto -->
    <ion-modal :is-open="mostrarModalGasto" class="modal-shell" @didDismiss="mostrarModalGasto = false">
      <div class="modal-contenido modal-gasto-contenido force-light">
        <div class="modal-header">
          <div class="modal-header-left">
            <div class="modal-header-icon">
              <ion-icon :icon="cutOutline" />
            </div>
            <div>
              <p class="modal-titulo">Registrar gasto</p>
              <p class="modal-subtitulo">Salida de efectivo de la caja</p>
            </div>
          </div>
          <button class="modal-cerrar" @click="mostrarModalGasto = false">
            <ion-icon :icon="closeOutline" />
          </button>
        </div>

        <label class="modal-label">Monto</label>
        <div class="modal-input-monto">
          <span>$</span>
          <input v-model.number="montoGasto" type="number" min="0" step="0.01" />
        </div>

        <label class="modal-label">Tipo de gasto</label>
          <select v-model="tipoGasto" class="modal-input-select">
            <option v-for="tipo in tiposGasto" :key="tipo" :value="tipo">
              {{ tipo }}
            </option>
          </select>
          <p v-if="tipoGasto" class="gasto-tipo-preview">
            Se registrará como: <strong>{{ tipoGasto }}</strong>
          </p>

        <label class="modal-label">Motivo</label>
        <textarea v-model="motivoGasto" class="modal-textarea" placeholder="Ej: compra de detergente" required></textarea>

        <label v-if="esAdministrador" class="toggle-check">
          <input v-model="registrarGastoAntiguo" type="checkbox" />
          Registrar gasto de caja antiguo
        </label>

        <template v-if="registrarGastoAntiguo">
          <label class="modal-label">Caja</label>
          <select v-model="turnoIdGasto" class="modal-input-select">
            <option value="" disabled>Selecciona una caja</option>
            <option v-for="opcion in turnosParaGasto" :key="opcion.id" :value="opcion.id">
              {{ opcion.etiqueta }}
            </option>
          </select>
        </template>

        <div class="modal-botones">
          <ion-button class="btn-fantasma" @click="mostrarModalGasto = false">Cancelar</ion-button>
          <ion-button class="btn-primario" :disabled="!motivoGasto.trim() || montoGasto <= 0 || (registrarGastoAntiguo && !turnoIdGasto)" @click="guardarGasto">Guardar gasto</ion-button>
        </div>
      </div>
    </ion-modal>

    <!-- Modal: cierre -->
    <ion-modal :is-open="mostrarModalCierre" class="modal-shell" @didDismiss="mostrarModalCierre = false">
      <div class="modal-contenido">
        <div class="modal-header">
          <div class="modal-header-left">
            <div class="modal-header-icon">
              <ion-icon :icon="lockClosedOutline" />
            </div>
            <div>
              <p class="modal-titulo">Cierre de caja</p>
              <p class="modal-subtitulo">Cuenta el efectivo final y cierra el turno</p>
            </div>
          </div>
          <button class="modal-cerrar" @click="mostrarModalCierre = false">
            <ion-icon :icon="closeOutline" />
          </button>
        </div>

        <label class="modal-label">Efectivo contado</label>
        <div class="modal-input-monto">
          <span>$</span>
          <input v-model.number="montoCierre" type="number" min="0" step="0.01" />
        </div>
        <p class="modal-ayuda">
          Este monto quedará guardado como el efectivo final para el siguiente día.
        </p>

        <div class="modal-botones">
          <ion-button class="btn-fantasma" @click="mostrarModalCierre = false">Cancelar</ion-button>
          <ion-button class="btn-primario" @click="cerrarCaja">Cerrar caja</ion-button>
        </div>
      </div>
    </ion-modal>

    <ion-modal :is-open="mostrarModalCierres" class="modal-shell modal-cierres-grande" @didDismiss="mostrarModalCierres = false">
      <div class="modal-contenido modal-cierres-contenido">
        <div class="modal-header">
          <div class="modal-header-left">
            <div class="modal-header-icon">
              <ion-icon :icon="documentTextOutline" />
            </div>
            <div>
              <p class="modal-titulo">Historial de cierres</p>
              <p class="modal-subtitulo">Todos los cierres de caja registrados</p>
            </div>
          </div>
          <button class="modal-cerrar" @click="mostrarModalCierres = false">
            <ion-icon :icon="closeOutline" />
          </button>
        </div>

        <div class="cierres-contenido">
          <div class="cierres-filtro-fechas">
            <label class="filtro-fecha-campo">
              Desde
              <input v-model="fechaDesde" type="date" />
            </label>
            <label class="filtro-fecha-campo">
              Hasta
              <input v-model="fechaHasta" type="date" />
            </label>
            <button class="filtro-limpiar" @click="limpiarFiltroFechas">Limpiar fechas</button>
          </div>

          <div class="cierres-lista">
            <div v-if="cierresFiltrados.length === 0" class="cierres-vacio">
              <ion-icon :icon="listOutline" class="cierres-vacio-icon" />
              <p class="cierres-vacio-texto">No hay cierres registrados</p>
            </div>

            <div v-else class="cierres-box">
              <div v-for="cierre in cierresFiltrados" :key="cierre.id" class="cierre-item">
                <div class="cierre-header">
                  <div class="cierre-info">
                    <span class="cierre-numero">#{{ cierre.numeroCaja }}</span>
                    <span class="cierre-fecha">{{ new Date(cierre.cerradoAt).toLocaleDateString('es-ES') }}</span>
                  </div>
                  <span class="cierre-monto">${{ cierre.totales.recaudado.toFixed(2) }}</span>
                </div>
                <div class="cierre-detalles">
                  <div class="cierre-detalle">
                    <span class="detalle-label">Operador:</span>
                    <span>{{ cierre.usuario }}</span>
                  </div>
                  <div class="cierre-detalle">
                    <span class="detalle-label">Efectivo Dejado en caja:</span>
                    <span>${{ cierre.saldoCierre.toFixed(2) }}</span>
                  </div>
                  <div class="cierre-detalle">
                    <span class="detalle-label">Cobrado:</span>
                    <span class="cierre-estado estado-verificado">${{ cierre.totales.cobrado.toFixed(2) }}</span>
                  </div>
                  <div class="cierre-detalle">
                    <span class="detalle-label">Depósitos:</span>
                    <span class="cierre-estado estado-pendiente">${{ cierre.totales.depositos.toFixed(2) }}</span>
                  </div>
                  <div class="cierre-detalle">
                    <span class="detalle-label">Cancelaciones:</span>
                    <span class="cierre-estado estado-pendiente">${{ cierre.totales.cancelaciones.toFixed(2) }}</span>
                  </div>
                  <div class="cierre-detalle">
                    <span class="detalle-label">Gastos:</span>
                    <span class="cierre-estado estado-gstos">${{ cierre.totales.gastos.toFixed(2) }}</span>
                  </div>
                  <div class="cierre-detalle">
                    <span class="detalle-label">Total recaudado:</span>
                    <span class="cierre-estado estado-verificado">${{ cierre.totales.recaudado.toFixed(2) }}</span>
                  </div>
                </div>
                <div class="cierre-acciones">
                  <button class="cierre-ver-ordenes" @click="verOrdenesCierre(cierre)">
                    <ion-icon :icon="listOutline" />
                    Ver órdenes
                  </button>
                  <button type="button" class="cierre-descargar" title="Descargar reporte PDF" @click="descargarReporteCierre(cierre)">
                    <ion-icon :icon="documentTextOutline" />
                    PDF
                  </button>
                  <button type="button" class="cierre-eliminar" title="Eliminar cierre sin borrar órdenes" aria-label="Eliminar cierre sin borrar órdenes" @click="eliminarCierreDesdeHistorial(cierre)">
                    <ion-icon :icon="trashOutline" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ion-modal>

    <ion-modal :is-open="mostrarConfirmacionEliminarCierre" class="modal-shell modal-confirmar-cierre" @didDismiss="cerrarConfirmacionEliminarCierre">
      <div class="modal-contenido force-light">
        <div class="modal-header">
          <div class="modal-header-left">
            <div class="modal-header-icon peligro-icono">
              <ion-icon :icon="trashOutline" />
            </div>
            <div>
              <p class="modal-titulo">Eliminar cierre</p>
              <p class="modal-subtitulo">Esta acción no se puede deshacer.</p>
            </div>
          </div>
          <button class="modal-cerrar" type="button" aria-label="Cerrar confirmación" @click="cerrarConfirmacionEliminarCierre">
            <ion-icon :icon="closeOutline" />
          </button>
        </div>
        <p v-if="cierrePendienteEliminar" class="confirmacion-cierre-texto">
          Vas a eliminar el cierre de caja #{{ cierrePendienteEliminar.numeroCaja }} del {{ new Date(cierrePendienteEliminar.cerradoAt).toLocaleDateString('es-ES') }}. Las órdenes no se eliminarán.
        </p>
        <p class="confirmacion-cierre-recomendacion">
          Se recomienda descargar el reporte PDF o respaldar la información antes de eliminar este cierre.
        </p>
        <div class="modal-botones">
          <ion-button class="btn-fantasma" @click="cerrarConfirmacionEliminarCierre">Cancelar</ion-button>
          <ion-button class="btn-primario peligro" :disabled="eliminandoCierre" @click="confirmarEliminarCierre">
            {{ eliminandoCierre ? 'Eliminando...' : 'Eliminar cierre' }}
          </ion-button>
        </div>
      </div>
    </ion-modal>

    <!-- Modal: órdenes de cierre -->
    <ion-modal :is-open="mostrarModalOrdenesCierre" class="modal-shell modal-cierres-grande" @didDismiss="mostrarModalOrdenesCierre = false">
      <div class="modal-contenido modal-cierres-contenido">
        <div class="modal-header">
          <div class="modal-header-left">
            <div class="modal-header-icon">
              <ion-icon :icon="documentTextOutline" />
            </div>
            <div>
              <p class="modal-titulo">Órdenes del cierre #{{ cierreSeleccionado?.numeroCaja }}</p>
              <p class="modal-subtitulo">{{ ordenesCobradasCierre.length }} órdenes con cobro en turno</p>
              <p v-if="cierreSeleccionado" class="modal-subtitulo modal-subtitulo-movimientos">
                <ion-icon :icon="listOutline" /> Reporte de movimientos: {{ cierreSeleccionado.movimientos?.length || 0 }} registros
              </p>
            </div>
          </div>
          <button class="modal-cerrar" @click="mostrarModalOrdenesCierre = false">
            <ion-icon :icon="closeOutline" />
          </button>
        </div>

        <div class="cierres-contenido">
          <div v-if="cierreSeleccionado" class="cierre-resumen-grid">
            <div class="cierre-resumen-card card-emerald">
              <span>Total recaudado</span>
              <strong>${{ cierreSeleccionado.totales.recaudado.toFixed(2) }}</strong>
            </div>
            <div class="cierre-resumen-card card-blue">
              <span>Órdenes</span>
              <strong>{{ ordenesCobradasCierre.length }}</strong>
            </div>
            <button type="button" class="cierre-resumen-card card-amber cierre-resumen-boton" @click="abrirGastosCierre">
              <span>Gastos</span>
              <strong>${{ cierreSeleccionado.totales.gastos.toFixed(2) }}</strong>
              <small>Ver detalle</small>
            </button>
            <div class="cierre-resumen-card card-slate">
              <span>Movimientos</span>
              <strong>{{ cierreSeleccionado.movimientos?.length || 0 }}</strong>
            </div>
          </div>

          <div class="cierres-lista">
            <div v-if="!cierreSeleccionado || cierreSeleccionado.ordenes.length === 0" class="cierres-vacio">
              <ion-icon :icon="listOutline" class="cierres-vacio-icon" />
              <p class="cierres-vacio-texto">No hay órdenes asociadas a este cierre</p>
            </div>

            <div v-else class="cierres-box">
              <div
                v-for="orden in ordenesCobradasCierre"
                :key="orden.id"
                class="cierre-orden-item orden-item-clickable"
                role="button"
                tabindex="0"
                @click="abrirModalDetalleOrden(orden)"
                @keydown.enter.prevent="abrirModalDetalleOrden(orden)"
                @keydown.space.prevent="abrirModalDetalleOrden(orden)"
              >
                <div class="cierre-orden-header">
                  <div class="cierre-orden-titulo">
                    <span class="cierre-orden-numero">{{ orden.numero }}</span>
                    <span v-if="orden.esReferencia" class="cierre-orden-referencia">Solo referencia</span>
                  </div>
                  <span class="cierre-orden-monto">${{ orden.cobradoEnTurno.toFixed(2) }}</span>
                </div>

                <div class="cierre-orden-info">
                  <div class="cierre-orden-cliente-wrap">
                    <span class="detalle-label">Cliente</span>
                    <strong class="cierre-orden-cliente">{{ orden.nombreCliente }}</strong>
                  </div>
                  <div class="cierre-orden-estado-wrap">
                    <span class="detalle-label">Estado</span>
                    <span class="cierre-orden-estado" :class="`estado-${orden.estado}`">{{ orden.estado }}</span>
                  </div>
                  <div class="cierre-orden-pago-wrap">
                    <span class="detalle-label">Pago</span>
                    <span class="cierre-orden-pago" :class="`pago-${orden.estadoPago}`">{{ orden.estadoPago }}</span>
                  </div>
                </div>

                <div class="cierre-orden-footer">
                  <span>Recibido: ${{ orden.montoRecibido.toFixed(2) }}</span>
                  <span>{{ new Date(orden.createdAt).toLocaleDateString('es-ES') }}</span>
                  <button type="button" class="mini-btn" @click.stop="abrirModalDetalleOrden(orden)">
                    Ver detalle
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </ion-modal>

    <ion-modal :is-open="mostrarModalGastosCierre" class="modal-shell modal-gastos-cierre" @didDismiss="mostrarModalGastosCierre = false">
      <div class="modal-contenido force-light">
        <div class="modal-header">
          <div class="modal-header-left">
            <div class="modal-header-icon"><ion-icon :icon="cutOutline" /></div>
            <div>
              <p class="modal-titulo">Gastos del cierre</p>
              <p class="modal-subtitulo">{{ gastosCierreSeleccionado.length }} registros · ${{ totalGastosCierre.toFixed(2) }}</p>
            </div>
          </div>
          <button class="modal-cerrar" @click="mostrarModalGastosCierre = false">
            <ion-icon :icon="closeOutline" />
          </button>
        </div>

        <div v-if="gastosCierreSeleccionado.length" class="gastos-cierre-lista">
          <article v-for="gasto in gastosCierreSeleccionado" :key="gasto.id" class="gasto-cierre-item">
            <div>
              <span v-if="extraerTipoGasto(gasto.concepto).tipo" class="gasto-cierre-tipo">
                {{ extraerTipoGasto(gasto.concepto).tipo }}
              </span>
              <strong>{{ extraerTipoGasto(gasto.concepto).motivo || 'Gasto sin concepto' }}</strong>
              <span>{{ formatearFechaHoraCierre(gasto.creadoAt) }}</span>
            </div>
            <div class="gasto-cierre-acciones">
              <strong class="gasto-cierre-monto">-${{ Number(gasto.monto || 0).toFixed(2) }}</strong>
              <button
                v-if="esAdministrador"
                type="button"
                class="gasto-cierre-eliminar"
                title="Eliminar gasto"
                :disabled="eliminandoGastoCierreId === gasto.id"
                @click="eliminarGastoCierre(gasto)"
              >
                <ion-spinner v-if="eliminandoGastoCierreId === gasto.id" name="crescent" />
                <ion-icon v-else :icon="trashOutline" />
              </button>
            </div>
          </article>
        </div>
        <p v-else class="historial-vacio">No hay gastos registrados en este cierre.</p>
      </div>
    </ion-modal>

    <ion-modal :is-open="mostrarModalDetalleOrden" class="modal-shell modal-orden-cierre" @didDismiss="cerrarModalDetalleOrden">
      <div class="modal-contenido modal-orden-cierre-contenido force-light">
        <div class="modal-header">
          <div class="modal-header-left">
            <div class="modal-header-icon">
              <ion-icon :icon="documentTextOutline" />
            </div>
            <div>
              <p class="modal-titulo">Detalle de orden</p>
              <p class="modal-subtitulo">{{ ordenSeleccionadaCierre?.numero || 'Sin número' }}</p>
            </div>
          </div>
          <button class="modal-cerrar" @click="cerrarModalDetalleOrden">
            <ion-icon :icon="closeOutline" />
          </button>
        </div>

        <div v-if="ordenSeleccionadaCierre" class="detalle-orden-cierre-card">
          <div class="detalle-orden-cierre-header">
            <span class="detalle-orden-cierre-badge">N° {{ ordenSeleccionadaCierre.numero }}</span>
            <span v-if="ordenSeleccionadaCierre.esReferencia" class="cierre-orden-referencia">Referencia</span>
          </div>
          <div class="detalle-orden-cierre-grid">
            <div class="detalle-orden-cierre-item">
              <span class="detalle-label">Cliente</span>
              <strong>{{ ordenSeleccionadaCierre.nombreCliente }}</strong>
            </div>
            <div class="detalle-orden-cierre-item">
              <span class="detalle-label">Cobrado en turno</span>
              <strong>${{ ordenSeleccionadaCierre.cobradoEnTurno.toFixed(2) }}</strong>
            </div>
            <div class="detalle-orden-cierre-item">
              <span class="detalle-label">Estado</span>
              <strong>{{ ordenSeleccionadaCierre.estado }}</strong>
            </div>
            <div class="detalle-orden-cierre-item">
              <span class="detalle-label">Pago</span>
              <strong>{{ ordenSeleccionadaCierre.estadoPago }}</strong>
            </div>
            <div class="detalle-orden-cierre-item">
              <span class="detalle-label">Monto recibido</span>
              <strong>${{ ordenSeleccionadaCierre.montoRecibido.toFixed(2) }}</strong>
            </div>
            <div class="detalle-orden-cierre-item">
              <span class="detalle-label">Fecha</span>
              <strong>{{ new Date(ordenSeleccionadaCierre.createdAt).toLocaleDateString('es-ES') }}</strong>
            </div>
          </div>

          <section class="detalle-orden-cierre-movimientos">
            <div class="detalle-orden-cierre-seccion-header">
              <div>
                <p class="modal-titulo small">Historial de movimientos</p>
                <p class="modal-subtitulo">
                  {{ ordenSeleccionadaCierre.movimientos?.length || 0 }} registros de la orden
                </p>
              </div>
            </div>

            <div v-if="ordenSeleccionadaCierre.movimientos?.length" class="detalle-orden-cierre-movimientos-lista">
              <article
                v-for="movimiento in ordenSeleccionadaCierre.movimientos"
                :key="movimiento.id"
                class="detalle-orden-cierre-movimiento"
              >
                <span class="detalle-orden-cierre-movimiento-bullet">+</span>
                <div class="detalle-orden-cierre-movimiento-info">
                  <strong>{{ movimiento.texto || 'Movimiento registrado' }}</strong>
                  <span>Usuario a cargo: {{ movimiento.usuarioNombre || 'Sistema' }}</span>
                  <span>Fecha: {{ formatearFechaHoraCierre(movimiento.fecha) }}</span>
                </div>
              </article>
            </div>
            <p v-else class="detalle-orden-cierre-movimientos-vacio">
              No hay movimientos registrados para esta orden.
            </p>
          </section>
        </div>
      </div>
    </ion-modal>

    <!-- Modal: Reportar problema -->
    <ion-modal :is-open="mostrarModalReportarProblema" class="modal-shell modal-problema-compacto" @didDismiss="mostrarModalReportarProblema = false">
      <div class="modal-contenido force-light modal-fondo-blanco">
        <div class="modal-header">
          <div class="modal-header-left">
            <div class="modal-header-icon">
              <ion-icon :icon="documentTextOutline" />
            </div>
            <div>
              <p class="modal-titulo">Reportar problema</p>
              <p class="modal-subtitulo">Reporta problemas que experimentas en el sistema</p>
            </div>
          </div>
          <button class="modal-cerrar" @click="mostrarModalReportarProblema = false">
            <ion-icon :icon="closeOutline" />
          </button>
        </div>

        <label class="modal-label">Usuario</label>
        <input 
          :value="usuarioActual?.nombre || 'Usuario actual'" 
          type="text" 
          class="modal-input-text" 
          disabled 
        />

        <label class="modal-label">Tema del problema</label>
        <input 
          v-model="temaProblema" 
          type="text" 
          class="modal-input-text" 
          placeholder="Ej: Error al guardar orden"
          required
        />

        <label class="modal-label">Detalles del problema</label>
        <textarea 
          v-model="detallesProblema" 
          class="modal-textarea" 
          placeholder="Describe el problema con el mayor detalle posible..."
          required
        ></textarea>

        <div class="modal-botones">
          <ion-button class="btn-fantasma" @click="mostrarModalReportarProblema = false">Cancelar</ion-button>
          <ion-button 
            class="btn-primario" 
            :disabled="!temaProblema.trim() || !detallesProblema.trim() || enviandoProblema" 
            @click="enviarReporteProblema"
          >
            {{ enviandoProblema ? 'Enviando...' : 'Enviar reporte' }}
          </ion-button>
        </div>
      </div>
    </ion-modal>

    <!-- Modal: Lista de problemas (desarrolladores) -->
    <ion-modal :is-open="mostrarModalListaProblemas" class="modal-shell modal-problemas-grande" @didDismiss="mostrarModalListaProblemas = false">
      <div class="modal-contenido modal-problemas-contenido modal-fondo-blanco">
        <div class="modal-header">
          <div class="modal-header-left">
            <div class="modal-header-icon">
              <ion-icon :icon="listOutline" />
            </div>
            <div>
              <p class="modal-titulo">{{ esModoDesarrollador ? 'Lista de problemas' : 'Mis reportes' }}</p>
              <p class="modal-subtitulo">{{ esModoDesarrollador ? 'Gestiona los problemas reportados por usuarios' : 'Consulta los problemas que has reportado' }}</p>
            </div>
          </div>
          <button class="modal-cerrar" @click="mostrarModalListaProblemas = false">
            <ion-icon :icon="closeOutline" />
          </button>
        </div>

        <div class="problemas-contenido">
          <div v-if="problemasReportados.length === 0" class="problemas-vacio">
            <ion-icon :icon="listOutline" class="problemas-vacio-icon" />
            <p class="problemas-vacio-texto">{{ esModoDesarrollador ? 'No hay problemas reportados' : 'No has reportado problemas' }}</p>
          </div>

          <div v-else class="problemas-lista">
            <div v-for="problema in problemasReportados" :key="problema.id" class="problema-item" :class="`problema-${problema.estado}`">
              <div class="problema-header">
                <div class="problema-info">
                  <span class="problema-usuario">{{ problema.usuario }}</span>
                  <span class="problema-fecha">{{ new Date(problema.fechaCreacion).toLocaleDateString('es-ES') }}</span>
                </div>
                <span class="problema-estado" :class="`estado-${problema.estado}`">
                  {{ problema.estado === 'pendiente' ? 'Pendiente' : problema.estado === 'en_proceso' ? 'En proceso' : 'Resuelto' }}
                </span>
              </div>

              <div class="problema-detalle">
                <span class="detalle-label">Tema:</span>
                <strong>{{ problema.tema }}</strong>
              </div>

              <div class="problema-detalle">
                <span class="detalle-label">Detalles:</span>
                <p>{{ problema.detalles }}</p>
              </div>

              <div class="problema-acciones">
                <button 
                  v-if="problema.estado === 'pendiente'" 
                  class="problema-accion-btn problema-accion-proceso" 
                  @click="cambiarEstadoProblema(problema.id, 'en_proceso')"
                >
                  <ion-icon :icon="refreshOutline" />
                  En proceso
                </button>
                <button 
                  v-if="problema.estado === 'en_proceso'" 
                  class="problema-accion-btn problema-accion-resolver" 
                  @click="cambiarEstadoProblema(problema.id, 'resuelto')"
                >
                  <ion-icon :icon="checkmarkCircleOutline" />
                  Marcar como resuelto
                </button>
                <button
                  v-if="!esModoDesarrollador"
                  class="problema-accion-btn problema-accion-funciona"
                  :disabled="eliminandoProblemaId === problema.id"
                  @click="eliminarMiProblema(problema.id)"
                >
                  <ion-icon :icon="checkmarkCircleOutline" />
                  {{ eliminandoProblemaId === problema.id ? 'Eliminando...' : 'Ya funciona' }}
                </button>
                <span v-if="problema.estado === 'resuelto'" class="problema-resuelto-info">
                  Resuelto el {{ new Date(problema.fechaResolucion!).toLocaleDateString('es-ES') }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ion-modal>

    <!-- Modal: Notificaciones (usuarios finales) -->
    <ion-modal :is-open="mostrarModalNotificaciones" class="modal-shell modal-notificaciones-grande" @didDismiss="mostrarModalNotificaciones = false">
      <div class="modal-contenido modal-notificaciones-contenido modal-fondo-blanco">
        <div class="modal-header">
          <div class="modal-header-left">
            <div class="modal-header-icon">
              <ion-icon :icon="shirtOutline" />
            </div>
            <div>
              <p class="modal-titulo">Notificaciones</p>
              <p class="modal-subtitulo">{{ notificacionesNoLeidas.length }} notificaciones sin leer</p>
            </div>
          </div>
          <div class="modal-header-right">
            <button 
              v-if="notificacionesNoLeidas.length > 0" 
              class="modal-accion-secundaria" 
              @click="marcarTodasNotificacionesLeidas"
            >
              Marcar todas como leídas
            </button>
            <button class="modal-cerrar" @click="mostrarModalNotificaciones = false">
              <ion-icon :icon="closeOutline" />
            </button>
          </div>
        </div>

        <div class="notificaciones-contenido">
          <!-- Iconos de lavandería como marca de agua -->
          <div class="lavanderia-watermark">
            <ion-icon :icon="shirtOutline" class="watermark-icon watermark-icon-1" />
            <ion-icon :icon="bodyOutline" class="watermark-icon watermark-icon-2" />
            <ion-icon :icon="manOutline" class="watermark-icon watermark-icon-3" />
            <ion-icon :icon="womanOutline" class="watermark-icon watermark-icon-4" />
            <ion-icon :icon="shirtOutline" class="watermark-icon watermark-icon-5" />
            <ion-icon :icon="bodyOutline" class="watermark-icon watermark-icon-6" />
          </div>

          <div v-if="notificacionesUsuario.length === 0" class="notificaciones-vacio">
            <ion-icon :icon="notificationsOutline" class="notificaciones-vacio-icon" />
            <p class="notificaciones-vacio-texto">No hay notificaciones</p>
          </div>

          <div v-else class="notificaciones-lista">
            <div 
              v-for="notificacion in notificacionesUsuario" 
              :key="notificacion.id" 
              class="notificacion-item" 
              :class="[!notificacion.leida ? 'no-leida' : '', 'tipo-' + notificacion.tipo]"
            >
              <div class="notificacion-header">
                <div class="notificacion-info">
                  <span class="notificacion-tipo-icon" :class="`icono-${notificacion.tipo}`">
                    <ion-icon :icon="getIconoLavanderia(notificacion.id)" />
                  </span>
                  <strong class="notificacion-titulo">{{ notificacion.titulo }}</strong>
                </div>
                <span class="notificacion-fecha">{{ new Date(notificacion.fecha).toLocaleDateString('es-ES') }}</span>
              </div>

              <p class="notificacion-mensaje" v-html="notificacion.mensaje"></p>
              <p v-if="notificacion.autorNombre" class="notificacion-autor">Enviado por: {{ notificacion.autorNombre }}</p>

              <div class="notificacion-acciones">
                <button
                  v-if="!notificacion.leida"
                  class="notificacion-marcar-leida"
                  @click="marcarNotificacionLeida(notificacion.id)"
                >
                  Marcar como leída
                </button>
                <button
                  v-if="puedeEditarAviso(notificacion)"
                  class="notificacion-editar"
                  @click="abrirModalEditarAviso(notificacion)"
                >
                  <ion-icon :icon="createOutline" />
                </button>
                <button
                  v-if="esAdministrador"
                  class="notificacion-eliminar"
                  @click="eliminarNotificacionConfirmada(notificacion.id)"
                >
                  <ion-icon :icon="trashOutline" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ion-modal>

    <!-- Aviso inicial: se muestra hasta que el usuario lo marca como leído -->
    <ion-modal :is-open="mostrarModalAvisoInicial" class="modal-shell modal-aviso-inicial" :backdrop-dismiss="false">
      <div v-if="avisoInicial" class="modal-contenido modal-aviso-inicial-contenido modal-fondo-blanco">
        <div class="modal-header">
          <div class="modal-header-left">
            <div class="modal-header-icon">
              <ion-icon :icon="getIconoLavanderia(avisoInicial.id)" />
            </div>
            <div>
              <p class="modal-titulo">{{ avisoInicial.titulo }}</p>
              <p class="modal-subtitulo">Aviso Importante</p>
            </div>
          </div>
          <button class="modal-cerrar" @click="leerDespues">
            <ion-icon :icon="closeOutline" />
          </button>
        </div>

        <div class="aviso-inicial-body">
          <!-- Iconos de lavandería como marca de agua -->
          <div class="lavanderia-watermark">
            <ion-icon :icon="shirtOutline" class="watermark-icon watermark-icon-1" />
            <ion-icon :icon="bodyOutline" class="watermark-icon watermark-icon-2" />
            <ion-icon :icon="manOutline" class="watermark-icon watermark-icon-3" />
            <ion-icon :icon="womanOutline" class="watermark-icon watermark-icon-4" />
          </div>

          <div class="aviso-inicial-mensaje-container">
            <p class="aviso-inicial-mensaje" v-html="avisoInicial.mensaje"></p>
          </div>
          <p v-if="avisoInicial.autorNombre" class="aviso-inicial-autor">Enviado por: {{ avisoInicial.autorNombre }}</p>
          <span class="aviso-inicial-fecha">{{ new Date(avisoInicial.fecha).toLocaleDateString('es-ES') }}</span>
        </div>

        <div class="aviso-inicial-botones">
          <ion-button class="btn-fantasma aviso-inicial-boton" @click="leerDespues">
            Leer después
          </ion-button>
          <ion-button class="btn-primario aviso-inicial-boton" @click="marcarAvisoInicialLeido">
            Marcar como leído
          </ion-button>
        </div>
      </div>
    </ion-modal>

    <ion-modal :is-open="mostrarModalAviso" class="modal-shell modal-aviso-compacto" @didDismiss="mostrarModalAviso = false">
      <div class="modal-contenido modal-aviso-contenido modal-fondo-blanco">
        <div class="modal-header">
          <div class="modal-header-left">
            <div class="modal-header-icon"><ion-icon :icon="shirtOutline" /></div>
            <div>
              <p class="modal-titulo">Enviar aviso</p>
              <p class="modal-subtitulo">Comunica una novedad a tu equipo</p>
            </div>
          </div>
          <button class="modal-cerrar" @click="mostrarModalAviso = false"><ion-icon :icon="closeOutline" /></button>
        </div>

        <label class="modal-label" for="aviso-destinatario">Destinatarios</label>
        <select id="aviso-destinatario" v-model="destinatarioAviso" class="modal-input-text">
          <option value="todos">Todos los usuarios</option>
          <option value="administrador">Administradores</option>
          <option value="recepcionista">Recepcionistas</option>
          <option value="cajero">Cajeros</option>
          <option value="operador">Operadores</option>
        </select>
        <label class="modal-label" for="aviso-titulo">Título</label>
        <input id="aviso-titulo" v-model="tituloAviso" class="modal-input-text" type="text" placeholder="Ej: Nuevo aviso" />
        <label class="modal-label" for="aviso-mensaje">Mensaje</label>
        
        <div class="aviso-editor-container">
          <!-- Iconos de lavandería como marca de agua -->
          <div class="lavanderia-watermark aviso-watermark">
            <ion-icon :icon="shirtOutline" class="watermark-icon watermark-icon-1" />
            <ion-icon :icon="bodyOutline" class="watermark-icon watermark-icon-2" />
            <ion-icon :icon="manOutline" class="watermark-icon watermark-icon-3" />
          </div>

          <div class="aviso-editor-column">
            <div class="aviso-html-toolbar">
              <button type="button" class="html-toolbar-btn" @click="insertarHtmlTag('strong')" title="Texto en negrita">
                <strong>B</strong>
              </button>
              <button type="button" class="html-toolbar-btn" @click="insertarHtmlTag('em')" title="Texto en cursiva">
                <em style="color: black;" >K</em>
              </button>
              <button type="button" style="color: black;" class="html-toolbar-btn" @click="insertarHtmlTag('u')" title="Texto subrayado">
                <u>S</u>
              </button>
              <div class="color-picker-wrapper">
                <input 
                  type="color" 
                  v-model="colorSeleccionado" 
                  class="color-picker-input"
                  @input="aplicarColor"
                  title="Seleccionar color"
                />
              </div>
              <button type="button" style="color: black;"  class="html-toolbar-btn" @click="insertarLista('bullet')" title="Puntos iniciales">
                •
              </button>
              <button type="button" style="color: black;" class="html-toolbar-btn" @click="insertarLista('asterisk')" title="Asteriscos">
                *
              </button>
              <button type="button" style="color: black;" class="html-toolbar-btn" @click="insertarLista('dash')" title="Guiones">
                -
              </button>
              <button type="button" class="html-toolbar-btn" @click="insertarEmoji('⚠️')" title="Advertencia">
                ⚠️
              </button>
              <button type="button" class="html-toolbar-btn" @click="insertarEmoji('✅')" title="Éxito">
                ✅
              </button>
              <button type="button" class="html-toolbar-btn" @click="insertarEmoji('❌')" title="Error">
                ❌
              </button>
              <button type="button" class="html-toolbar-btn" @click="insertarEmoji('ℹ️')" title="Información">
                ℹ️
              </button>
              <button type="button" class="html-toolbar-btn" @click="insertarEmoji('🎉')" title="Celebración">
                🎉
              </button>
              <button type="button" class="html-toolbar-btn" @click="insertarEmoji('📢')" title="Anuncio">
                📢
              </button>
            </div>
            
            <div 
              id="aviso-mensaje" 
              contenteditable="true" 
              class="modal-textarea modal-textarea-grande editor-textarea" 
              placeholder="Escribe aquí... (Soporta HTML y emojis)"
              @input="mensajeAviso = ($event.target as HTMLElement).innerHTML"
            ></div>
          </div>
          
          <div v-if="mensajeAviso" class="aviso-preview-column">
            <p class="preview-label">Vista previa:</p>
            <div class="preview-content preview-content-grande" v-html="mensajeAviso"></div>
          </div>
        </div>
        
        <div class="modal-botones">
          <ion-button class="btn-fantasma" @click="mostrarModalAviso = false">Cancelar</ion-button>
          <ion-button class="btn-primario" :disabled="!tituloAviso.trim() || !mensajeAviso.trim() || enviandoAviso" @click="enviarAvisoDesdeModal">
            {{ enviandoAviso ? 'Enviando...' : 'Enviar aviso' }}
          </ion-button>
        </div>
      </div>
    </ion-modal>

    <ion-modal :is-open="mostrarModalEditarAviso" class="modal-shell modal-aviso-compacto" @didDismiss="mostrarModalEditarAviso = false">
      <div class="modal-contenido modal-aviso-contenido modal-fondo-blanco">
        <div class="modal-header">
          <div class="modal-header-left">
            <div class="modal-header-icon"><ion-icon :icon="shirtOutline" /></div>
            <div>
              <p class="modal-titulo">Editar aviso</p>
              <p class="modal-subtitulo">Modifica el contenido del aviso</p>
            </div>
          </div>
          <button class="modal-cerrar" @click="mostrarModalEditarAviso = false"><ion-icon :icon="closeOutline" /></button>
        </div>

        <label class="modal-label" for="aviso-editar-titulo">Título</label>
        <input id="aviso-editar-titulo" v-model="tituloAvisoEditar" class="modal-input-text" type="text" placeholder="Ej: Nuevo aviso" />
        <label class="modal-label" for="aviso-editar-mensaje">Mensaje</label>
        
        <div class="aviso-editor-container">
          <!-- Iconos de lavandería como marca de agua -->
          <div class="lavanderia-watermark aviso-watermark">
            <ion-icon :icon="shirtOutline" class="watermark-icon watermark-icon-1" />
            <ion-icon :icon="bodyOutline" class="watermark-icon watermark-icon-2" />
            <ion-icon :icon="manOutline" class="watermark-icon watermark-icon-3" />
          </div>

          <div class="aviso-editor-column">
            <div class="aviso-html-toolbar">
              <button type="button" class="html-toolbar-btn" @click="insertarHtmlTagEditar('strong')" title="Texto en negrita">
                <strong>B</strong>
              </button>
              <button type="button" style="color: black;" class="html-toolbar-btn" @click="insertarHtmlTagEditar('em')" title="Texto en cursiva">
                <em>K</em>
              </button>
              <button type="button" style="color: black;" class="html-toolbar-btn" @click="insertarHtmlTagEditar('u')" title="Texto subrayado">
                <u>S</u>
              </button>
              <div class="color-picker-wrapper">
                <input 
                  type="color" 
                  v-model="colorSeleccionadoEditar" 
                  class="color-picker-input"
                  @input="aplicarColorEditar"
                  title="Seleccionar color"
                />
              </div>
              <button type="button" style="color: black;" class="html-toolbar-btn" @click="insertarListaEditar('bullet')" title="Puntos iniciales">
                •
              </button>
              <button type="button" style="color: black;" class="html-toolbar-btn" @click="insertarListaEditar('asterisk')" title="Asteriscos">
                *
              </button>
              <button type="button" style="color: black;" class="html-toolbar-btn" @click="insertarListaEditar('dash')" title="Guiones">
                -
              </button>
              <button type="button" class="html-toolbar-btn" @click="insertarEmojiEditar('⚠️')" title="Advertencia">
                ⚠️
              </button>
              <button type="button" class="html-toolbar-btn" @click="insertarEmojiEditar('✅')" title="Éxito">
                ✅
              </button>
              <button type="button" class="html-toolbar-btn" @click="insertarEmojiEditar('❌')" title="Error">
                ❌
              </button>
              <button type="button" class="html-toolbar-btn" @click="insertarEmojiEditar('ℹ️')" title="Información">
                ℹ️
              </button>
              <button type="button" class="html-toolbar-btn" @click="insertarEmojiEditar('🎉')" title="Celebración">
                🎉
              </button>
              <button type="button" class="html-toolbar-btn" @click="insertarEmojiEditar('📢')" title="Anuncio">
                📢
              </button>
            </div>
            
            <div 
              id="aviso-editar-mensaje" 
              contenteditable="true" 
              class="modal-textarea modal-textarea-grande editor-textarea" 
              placeholder="Escribe aquí... (Soporta HTML y emojis)"
              @input="mensajeAvisoEditar = ($event.target as HTMLElement).innerHTML"
            ></div>
          </div>
          
          <div v-if="mensajeAvisoEditar" class="aviso-preview-column">
            <p class="preview-label">Vista previa:</p>
            <div class="preview-content preview-content-grande" v-html="mensajeAvisoEditar"></div>
          </div>
        </div>
        
        <div class="modal-botones">
          <ion-button class="btn-fantasma" @click="mostrarModalEditarAviso = false">Cancelar</ion-button>
          <ion-button class="btn-primario" :disabled="!tituloAvisoEditar.trim() || !mensajeAvisoEditar.trim() || enviandoAvisoEditar" @click="guardarEdicionAviso">
            {{ enviandoAvisoEditar ? 'Guardando...' : 'Guardar cambios' }}
          </ion-button>
        </div>
      </div>
    </ion-modal>
    <ion-modal :is-open="mostrarModalActualizacion" class="modal-shell modal-actualizacion" :backdrop-dismiss="false" @didDismiss="cerrarModalActualizacion">
      <div class="modal-contenido modal-fondo-blanco">
        <div class="modal-header">
          <div class="modal-header-left">
            <div class="modal-header-icon">
              <ion-icon :icon="cloudDownloadOutline" />
            </div>
            <div>
              <p class="modal-titulo">Actualización del sistema</p>
              <p class="modal-subtitulo">
                <template v-if="estadoActualizacion === 'buscando'">Buscando actualizaciones...</template>
                <template v-else-if="estadoActualizacion === 'sin-actualizacion'">Ya tienes la última versión</template>
                <template v-else-if="estadoActualizacion === 'disponible'">Versión {{ versionDisponible }} disponible</template>
                <template v-else-if="estadoActualizacion === 'descargando'">Descargando versión {{ versionDisponible }}</template>
                <template v-else-if="estadoActualizacion === 'lista'">Versión {{ versionDisponible }} lista para instalar</template>
                <template v-else-if="estadoActualizacion === 'error'">Ocurrió un error al buscar actualizaciones</template>
              </p>
            </div>
          </div>
          <button v-if="estadoActualizacion !== 'descargando' && estadoActualizacion !== 'lista'" class="modal-cerrar" @click="mostrarModalActualizacion = false">
            <ion-icon :icon="closeOutline" />
          </button>
        </div>

        <div class="actualizacion-cuerpo">
          <div v-if="estadoActualizacion === 'buscando'" class="actualizacion-spinner">
            <ion-spinner name="crescent" />
            <p>Revisando si hay una versión más reciente...</p>
          </div>

          <div v-else-if="estadoActualizacion === 'sin-actualizacion'" class="actualizacion-info">
            <p>Tu aplicación ya está actualizada.</p>
          </div>

          <div v-else-if="estadoActualizacion === 'disponible'" class="actualizacion-info">
            <p>Hay una nueva actualización disponible. Puedes instalarla ahora o verla después.</p>
          </div>
          <div v-else-if="estadoActualizacion === 'error'" class="actualizacion-info">
          <p>No se pudo verificar la actualización.</p>
          <p style="font-size: 0.8rem; color: #dc2626; margin-top: 8px;">{{ mensajeErrorActualizacion }}</p>
          </div>
          <div v-else-if="estadoActualizacion === 'descargando'" class="actualizacion-progreso">
            <div class="actualizacion-barra">
              <div class="actualizacion-barra-relleno" :style="{ width: progresoActualizacion + '%' }"></div>
            </div>
            <p>{{ progresoActualizacion }}%</p>
          </div>

          <div v-else-if="estadoActualizacion === 'lista'" class="actualizacion-info">
            <p>La actualización ya se descargó. Reinicia la aplicación para aplicarla.</p>
          </div>
          <p class="actualizacion-version-actual">Versión actual: {{ versionActual || 'Consultando...' }}</p>
        </div>

        <div class="modal-botones">
          <template v-if="estadoActualizacion === 'disponible'">
            <ion-button class="btn-fantasma" @click="mostrarModalActualizacion = false">
              Ver después
            </ion-button>
            <ion-button class="btn-primario" :disabled="instalandoActualizacion" @click="descargarEInstalarActualizacion">
              {{ instalandoActualizacion ? 'Preparando instalación...' : 'Instalar ahora' }}
            </ion-button>
          </template>
          <ion-button
            v-if="estadoActualizacion === 'lista'"
            class="btn-primario"
            :disabled="instalandoActualizacion"
            @click="instalarActualizacionAhora"
          >
            {{ instalandoActualizacion ? 'Reiniciando...' : 'Instalar ahora' }}
          </ion-button>
          <ion-button v-if="estadoActualizacion === 'lista'" class="btn-fantasma" @click="mostrarModalActualizacion = false">
            Ver después
          </ion-button>
          <ion-button
            v-else-if="estadoActualizacion === 'buscando' || estadoActualizacion === 'descargando'"
            class="btn-fantasma"
            disabled
          >
            Espera un momento...
          </ion-button>
          <ion-button v-else class="btn-fantasma" @click="mostrarModalActualizacion = false">
            Cerrar
          </ion-button>
        </div>
      </div>
    </ion-modal>

  </ion-page>
</template>

<script setup lang="ts">
import { IonButton, IonContent, IonIcon, IonModal, IonPage, IonSpinner } from '@ionic/vue'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import logo from '@/assets/logo.png'
import { useTurno } from '@/composables/useTurno'
import { useCajaMovimientos } from '@/composables/useCajaMovimientos'
import { useHistorialCierres } from '@/composables/useHistorialCierres'
import { useSesion } from '@/composables/useSesion'
import { useHorarios } from '@/composables/Usehorarios'
import { combinarFechaHoraCentroamerica } from '@/composables/useFechas'
import { usePedido } from '@/composables/Usepedido'
import { useApariencia } from '@/composables/useApariencia'
import { useModalesCaja } from '@/composables/useModalesCaja'
import { getApiBaseUrl } from '@/composables/useApiConfig'
import { useNotificaciones, type NotificacionUsuario } from '@/composables/useNotificaciones'
import { usePanelRedes } from '@/composables/usePanelRedes'
import { useAccesoOperativo } from '@/composables/useAccesoOperativo'
import { jsPDF } from 'jspdf'
const { validarSesion } = useSesion()
const mensajeErrorActualizacion = ref('')

onMounted(() => {
  void validarSesion()
})

import {
  homeOutline,
  cutOutline,
  lockClosedOutline,
  checkmarkCircleOutline,
  closeOutline,
  logOutOutline,
  buildOutline,
  documentTextOutline,
  listOutline,
  refreshOutline,
  trashOutline,
  personCircleOutline,
  notificationsOutline,
  megaphoneOutline,
  logoWhatsapp,
  logoFacebook,
  businessOutline,
  createOutline,
  shirtOutline,
  bodyOutline,
  manOutline,
  womanOutline,
  cloudDownloadOutline,
} from 'ionicons/icons'

let resizeObserver: ResizeObserver | null = null
const router = useRouter()
const route = useRoute()
const { ultimaOrdenCreada } = usePedido()
const { apariencia, estiloAppShell } = useApariencia()
const logoCloudinaryFallido = ref(false)
const logoActual = computed(() => logoCloudinaryFallido.value ? logo : (apariencia.appShellImagen || logo))
const usarLogoLocal = () => {
  logoCloudinaryFallido.value = true
}
const notificacionOrdenVisible = ref(false)
const notificacionOrdenNumero = ref('')
let notificacionOrdenTimer: ReturnType<typeof setTimeout> | null = null

watch(ultimaOrdenCreada, (orden) => {
  if (!orden) return

  notificacionOrdenNumero.value = orden.numero
  notificacionOrdenVisible.value = true

  if (notificacionOrdenTimer) clearTimeout(notificacionOrdenTimer)
  notificacionOrdenTimer = setTimeout(() => {
    notificacionOrdenVisible.value = false
    notificacionOrdenTimer = null
  }, 5000)
})
const { turno } = useTurno()
const { registrarGasto, eliminarGasto } = useCajaMovimientos()
const { registrarCierreTurno, cargarHistorial, historialCierres, eliminarCierre } = useHistorialCierres()
const { cerrarSesion: cerrarSesionSesion, recargarSesion, rol, usuarioActual, esOperador, esAdministrador } = useSesion()
const { funcionesBloqueadas } = useAccesoOperativo()
const {
  totalNotificacionesNoLeidas,
  esModoDesarrollador,
  problemasPendientes,
  problemasReportados,
  notificacionesUsuario,
  notificacionesNoLeidas,
  cargarNotificaciones,
  reportarProblema,
  enviarAviso,
  editarAviso,
  limpiarNotificaciones,
  cambiarEstadoProblema,
  eliminarProblema,
  marcarNotificacionLeida,
  marcarTodasNotificacionesLeidas,
  eliminarNotificacion
} = useNotificaciones()

// Estados para modales de notificaciones y problemas
const mostrarMenuNotificaciones = ref(false)
const mostrarModalReportarProblema = ref(false)
const mostrarModalListaProblemas = ref(false)
const mostrarModalNotificaciones = ref(false)
const mostrarModalAviso = ref(false)
const mostrarModalAvisoInicial = ref(false)
const mostrarModalEditarAviso = ref(false)
const avisoParaEditar = ref<NotificacionUsuario | null>(null)
const tituloAvisoEditar = ref('')
const mensajeAvisoEditar = ref('')
const destinatarioAvisoEditar = ref('todos')
const enviandoAvisoEditar = ref(false)
const colorSeleccionado = ref('#000000')
const colorSeleccionadoEditar = ref('#000000')
const {
  mostrarPanelWhatsapp,
  mostrarPanelFacebook,
  urlWhatsappInicial,
  panelWhatsappLateral,
  panelFacebookLateral,
  panelLado,
  panelLateralAbierto,
  ladoPanelActivo,
  abrirWhatsapp: abrirWhatsappPanel,
  abrirFacebook,
  cerrarWhatsapp,
  cerrarFacebook
} = usePanelRedes()

const abrirWhatsapp = () => {
  abrirWhatsappPanel()
}
const insigniaNotificacionesOculta = ref(false)
const eliminandoProblemaId = ref('')

type ElectronAPIActualizaciones = {
  isElectron?: boolean
  onUpdateDisponible?: (cb: (info: any) => void) => void
  onUpdateProgreso?: (cb: (percent: number) => void) => void
  onUpdateLista?: (cb: (info: any) => void) => void
  onUpdateNoDisponible?: (cb: () => void) => void
  onUpdateError?: (cb: (mensaje: string) => void) => void
  onLogMain?: (cb: (mensaje: string) => void) => void
  instalarActualizacion?: () => Promise<void>
  descargarEInstalarActualizacion?: () => Promise<{ supported?: boolean }>
  buscarActualizaciones?: () => Promise<{ supported?: boolean, updateAvailable?: boolean, version?: string }>
  obtenerVersionAplicacion?: () => Promise<string>
}

const obtenerElectronAPI = () =>
  (window as Window & { electronAPI?: ElectronAPIActualizaciones }).electronAPI

const esElectron = computed(() => Boolean(obtenerElectronAPI()?.isElectron))

const mostrarModalActualizacion = ref(false)
const estadoActualizacion = ref<'buscando' | 'disponible' | 'descargando' | 'lista' | 'sin-actualizacion' | 'error'>('buscando')
const progresoActualizacion = ref(0)
const versionDisponible = ref('')
const versionActual = ref('')
const instalandoActualizacion = ref(false)
const actualizacionPendiente = ref(false)
const totalAlertasNotificaciones = computed(() =>
  totalNotificacionesNoLeidas.value
  + (esModoDesarrollador.value ? problemasPendientes.value.length : 0)
  + (actualizacionPendiente.value ? 1 : 0)
)

const abrirBuscarActualizaciones = async (mostrarModal = true) => {
  mostrarMenuNotificaciones.value = false
  const api = obtenerElectronAPI()
  if (!api?.buscarActualizaciones) return

  estadoActualizacion.value = 'buscando'
  progresoActualizacion.value = 0
  mostrarModalActualizacion.value = mostrarModal

  try {
    const resultado = await api.buscarActualizaciones()
    if (resultado?.supported === false) estadoActualizacion.value = 'sin-actualizacion'
  } catch (error) {
    mensajeErrorActualizacion.value = error instanceof Error ? error.message : 'No se pudo verificar la actualización.'
    estadoActualizacion.value = 'error'
    if (mostrarModal) mostrarModalActualizacion.value = true
  }
}

const descargarEInstalarActualizacion = async () => {
  const api = obtenerElectronAPI()
  if (!api?.descargarEInstalarActualizacion || instalandoActualizacion.value) return
  instalandoActualizacion.value = true
  estadoActualizacion.value = 'descargando'
  try {
    await api.descargarEInstalarActualizacion()
  } catch (error) {
    mensajeErrorActualizacion.value = error instanceof Error ? error.message : 'No se pudo preparar la actualización.'
    estadoActualizacion.value = 'error'
    instalandoActualizacion.value = false
  }
}

const instalarActualizacionAhora = async () => {
  const api = obtenerElectronAPI()
  if (!api?.instalarActualizacion || instalandoActualizacion.value) return
  instalandoActualizacion.value = true
  try {
    await api.instalarActualizacion()
  } catch {
    instalandoActualizacion.value = false
  }
}

const cerrarModalActualizacion = () => {
  if (estadoActualizacion.value === 'descargando' || estadoActualizacion.value === 'lista') return
  mostrarModalActualizacion.value = false
}

onMounted(() => {
  const api = obtenerElectronAPI()
  if (!api?.isElectron) return

  // Listener para logs del proceso principal
  api.onLogMain?.((mensaje) => {
    console.log('[MAIN PROCESS]:', mensaje)
  })

  api.onUpdateDisponible?.((info) => {
    console.log('[UPDATE] Actualización disponible:', info)
    versionDisponible.value = info?.version || ''
    actualizacionPendiente.value = true
    estadoActualizacion.value = 'disponible'
    progresoActualizacion.value = 0
    mostrarModalActualizacion.value = true
  })

  api.onUpdateProgreso?.((percent) => {
    console.log('[UPDATE] Progreso:', percent)
    estadoActualizacion.value = 'descargando'
    progresoActualizacion.value = Math.round(percent || 0)
    mostrarModalActualizacion.value = true
  })

  api.onUpdateLista?.((info) => {
    console.log('[UPDATE] Actualización lista:', info)
    versionDisponible.value = info?.version || versionDisponible.value
    estadoActualizacion.value = 'lista'
    progresoActualizacion.value = 100
    mostrarModalActualizacion.value = true
  })

  api.onUpdateNoDisponible?.(() => {
    console.log('[UPDATE] No hay actualización disponible')
    estadoActualizacion.value = 'sin-actualizacion'
    actualizacionPendiente.value = false
  })

  api.onUpdateError?.((mensaje) => {
    mensajeErrorActualizacion.value = mensaje
    estadoActualizacion.value = 'error'
  })

  api.obtenerVersionAplicacion?.().then((version) => {
    versionActual.value = version
  }).catch(() => {})

  const pendienteAlEntrar = sessionStorage.getItem('actualizacion-pendiente-al-entrar')
  if (pendienteAlEntrar) {
    try {
      const { version } = JSON.parse(pendienteAlEntrar) as { version?: string }
      versionDisponible.value = version || ''
      actualizacionPendiente.value = true
      estadoActualizacion.value = 'disponible'
      mostrarModalActualizacion.value = true
    } catch {
      // Ignorar datos temporales inválidos y continuar con la app.
    } finally {
      sessionStorage.removeItem('actualizacion-pendiente-al-entrar')
    }
  }

  // AppShell se monta al entrar desde el login. La marca evita búsquedas al
  // navegar entre vistas, pero se elimina al cerrar sesión.
  if (!sessionStorage.getItem('actualizacion-verificada-en-sesion')) {
    sessionStorage.setItem('actualizacion-verificada-en-sesion', '1')
    void abrirBuscarActualizaciones(false)
  }
})

const temaProblema = ref('')
const detallesProblema = ref('')
const enviandoProblema = ref(false)
const tituloAviso = ref('')
const mensajeAviso = ref('')
const destinatarioAviso = ref('todos')
const enviandoAviso = ref(false)
const contentAreaRef = ref<HTMLDivElement | null>(null)
const navegando = ref(false)
const esRecepcionista = computed(() => rol.value === 'recepcionista')
const esUsuarioDesarrollador = computed(() => usuarioActual.value?.nombre === 'Desarrollador')
const esCajero = computed(() => rol.value === 'cajero' || rol.value === 'caja')
const avisoInicial = computed(() => notificacionesNoLeidas.value[0] ?? null)
const avisosConocidos = new Set<string>()
let intervaloNotificaciones: ReturnType<typeof setInterval> | null = null

const abrirMenuNotificaciones = () => {
  insigniaNotificacionesOculta.value = true
  mostrarMenuNotificaciones.value = !mostrarMenuNotificaciones.value
}

const abrirModalAviso = () => {
  mostrarModalAviso.value = true
  mostrarMenuNotificaciones.value = false
}

const actualizarEspacioPanel = (activo: boolean) => {
  document.documentElement.classList.toggle('app-panel-lateral-activo', activo)
  document.documentElement.classList.toggle('app-panel-lateral-izquierda', activo && panelLado.value === 'izquierda')
}

watch([mostrarPanelWhatsapp, mostrarPanelFacebook, panelWhatsappLateral, panelFacebookLateral, panelLado], ([whatsappAbierto, facebookAbierto, whatsappLateral, facebookLateral]) => {
  actualizarEspacioPanel(Boolean((whatsappAbierto && whatsappLateral) || (facebookAbierto && facebookLateral)))
}, { immediate: true })

const limpiarNotificacionesDesdeMenu = async () => {
  mostrarMenuNotificaciones.value = false
  if (!window.confirm('Se eliminarán todos los avisos y reportes de la tabla. ¿Deseas continuar?')) return

  try {
    await limpiarNotificaciones()
    mostrarModalAvisoInicial.value = false
  } catch (error) {
    window.alert(error instanceof Error ? error.message : 'No se pudieron limpiar las notificaciones.')
  }
}

const eliminarMiProblema = async (problemaId: string) => {
  if (eliminandoProblemaId.value) return
  if (!window.confirm('¿Confirmas que el problema ya funciona y deseas eliminar este reporte?')) return

  eliminandoProblemaId.value = problemaId
  try {
    await eliminarProblema(problemaId)
  } catch (error) {
    window.alert(error instanceof Error ? error.message : 'No se pudo eliminar el reporte.')
  } finally {
    eliminandoProblemaId.value = ''
  }
}

const eliminarNotificacionConfirmada = async (notificacionId: string) => {
  if (!window.confirm('¿Confirmas que deseas eliminar esta notificación?')) return

  try {
    await eliminarNotificacion(notificacionId)
  } catch (error) {
    window.alert(error instanceof Error ? error.message : 'No se pudo eliminar la notificación.')
  }
}

const marcarAvisoInicialLeido = async () => {
  if (!avisoInicial.value) return
  try {
    await marcarNotificacionLeida(avisoInicial.value.id)
    mostrarModalAvisoInicial.value = false
  } catch (error) {
    window.alert(error instanceof Error ? error.message : 'No se pudo marcar el aviso como leído.')
  }
}

const leerDespues = () => {
  mostrarModalAvisoInicial.value = false
}

const abrirPerfil = () => {
  void router.replace({ path: '/tabs/principal', query: { perfil: '1' } }).catch(() => {})
}
const recargandoApp = ref(false)
const mostrarCargador = computed(() => ['/tabs/home', '/tabs/ordenes', '/tabs/reportes'].includes(route.path))
const cargandoVista = ref(mostrarCargador.value)
let solicitudesPendientes = 0
let fetchOriginal: typeof window.fetch | null = null
let cargandoVistaMaxTimer: ReturnType<typeof setTimeout> | null = null

const finalizarCargadorSiCorresponde = () => {
  if (solicitudesPendientes > 0) return
  cargandoVista.value = false
}

const observarSolicitudesVista = () => {
  if (typeof window === 'undefined' || fetchOriginal) return
  fetchOriginal = window.fetch.bind(window)
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    solicitudesPendientes += 1
    try {
      return await fetchOriginal!(input, init)
    } finally {
      solicitudesPendientes = Math.max(0, solicitudesPendientes - 1)
      finalizarCargadorSiCorresponde()
    }
  }
}

const iniciarCargador = () => {
  if (!mostrarCargador.value) return
  cargandoVistaMaxTimer = setTimeout(() => {
    cargandoVista.value = false
    cargandoVistaMaxTimer = null
  }, 3000)
  queueMicrotask(finalizarCargadorSiCorresponde)
}

if (mostrarCargador.value) observarSolicitudesVista()

const refrescarAplicacion = () => {
  if (recargandoApp.value) return
  recargandoApp.value = true

  const electronAPI = (window as Window & { electronAPI?: { isElectron?: boolean; reiniciarElectron?: () => Promise<void> } }).electronAPI

  if (electronAPI?.isElectron && electronAPI.reiniciarElectron) {
    electronAPI.reiniciarElectron().catch(() => {
      // Si por alguna razón falla el IPC, no dejamos la app colgada esperando.
      recargandoApp.value = false
    })
    return
  }

  window.location.reload()
}

const irA = async (r: string) => {
  if (navegando.value) return
  navegando.value = true

  if (r === '/login') {
    await router.replace(r).catch(() => {})
    navegando.value = false
    return
  }

  await router.replace(r).catch(() => {})
  navegando.value = false
}

const IrAdeposito = async () => {
  await irA('/tabs/depositos')
}

const etiquetasRuta: Record<string, string> = {
  principal: 'Principal',
  home: 'Principal',
  ordenes: 'Gestionar órdenes',
  reportes: 'Reportes',
  productos: 'Catálogo',
  clientes: 'Clientes',
  estantes: 'Estantes',
  inventario: 'Inventario',
  promociones: 'Promociones',
  configuracion: 'Configuración',
  equipo: 'Equipo',
  depositos: 'Depósitos',
  facturas: 'Facturas',
  calendario: 'Calendario',
  categorias: 'Categorías',
  abonos: 'Abonos',
  gastos: 'Gastos',
  cierres: 'Cierres',
  produccion: 'Producción',
  tareas: 'Tareas'
}

interface Miga {
  label: string
  path: string
}

const migas = computed<Miga[]>(() => {
  const partes = route.path.split('/').filter((p) => p && p !== 'tabs')
  const resultado: Miga[] = []

  let acumulado = ''
  for (const parte of partes) {
    if (parte === 'principal' || parte === 'home') continue
    acumulado += `/${parte}`
    resultado.push({
      label: etiquetasRuta[parte] ?? parte.charAt(0).toUpperCase() + parte.slice(1),
      path: `/tabs${acumulado}`
    })
  }

  return resultado
})

const esVistaPrincipal = () => route.path === '/tabs/principal' || route.path === '/tabs/home'

const mostrarAvisoPendiente = () => {
  if (esVistaPrincipal() && avisoInicial.value) {
    mostrarModalAvisoInicial.value = true
  }
}

const cargarAvisosIniciales = async () => {
  await cargarNotificaciones()
  notificacionesUsuario.value.forEach(notificacion => avisosConocidos.add(notificacion.id))
  mostrarAvisoPendiente()
}

const revisarAvisosNuevos = async () => {
  const conocidosAntesDeCargar = new Set(avisosConocidos)
  await cargarNotificaciones()
  const avisoNuevo = notificacionesNoLeidas.value.find(notificacion => !conocidosAntesDeCargar.has(notificacion.id))
  notificacionesUsuario.value.forEach(notificacion => avisosConocidos.add(notificacion.id))

  if (avisoNuevo) mostrarAvisoPendiente()
}

onMounted(() => {
  recargarSesion()
  void cargarAvisosIniciales()
  intervaloNotificaciones = setInterval(() => {
    void revisarAvisosNuevos()
  }, 5000)
  iniciarCargador()
  relojId = setInterval(() => {
    ahora.value = new Date()
  }, 1000)

  nextTick(() => {
    medirBanner()
    if (bannerRef.value && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => medirBanner())
      resizeObserver.observe(bannerRef.value)
    }
  })

  void validarSesion()
  const intervalo = setInterval(() => {
    void validarSesion()
  }, 60000) // cada 60 segundos

  onUnmounted(() => clearInterval(intervalo))

  window.addEventListener('resize', medirBanner)
})

const ahora = ref(new Date())
let relojId: any = null

const { encontrarEmpleadoPara, turnoDeHoyDe, entradaMarcada } = useHorarios()
const botonesOperativosBloqueados = computed(() => {
  if (rol.value === 'administrador' || rol.value === 'admin') return false
  if (!esCajero.value && !esRecepcionista.value) return false
  const empleado = encontrarEmpleadoPara(usuarioActual.value)
  const turnoProgramado = empleado ? turnoDeHoyDe(empleado.id).value : null
  if (!turnoProgramado || turnoProgramado.libre) return false
  if (!entradaMarcada(empleado!.id)) return true
  const finDelTurno = combinarFechaHoraCentroamerica(turnoProgramado.fecha, turnoProgramado.horaFin)
  return ahora.value.getTime() >= finDelTurno.getTime() + 1 * 60 * 1000
})

/* Header deslizable con el scroll */
const bannerRef = ref<HTMLDivElement | null>(null)
const alturaBannerPx = ref(320)
const alturaBannerCss = computed(() => `${alturaBannerPx.value}px`)
const bannerOffsetPx = ref(0)
const bannerOffsetCss = computed(() => `${bannerOffsetPx.value}px`)
let ultimoScrollTop = 0

const medirBanner = () => {
  if (bannerRef.value) {
    alturaBannerPx.value = bannerRef.value.offsetHeight
  }
}

watch(() => route.path, () => {
  bannerOffsetPx.value = 0
  ultimoScrollTop = 0
  nextTick(() => medirBanner())
})

onUnmounted(() => {
  if (relojId) clearInterval(relojId)
  if (notificacionOrdenTimer) clearTimeout(notificacionOrdenTimer)
  if (cargandoVistaMaxTimer) clearTimeout(cargandoVistaMaxTimer)
  if (fetchOriginal) window.fetch = fetchOriginal
  window.removeEventListener('resize', medirBanner)
  resizeObserver?.disconnect()   // ← AGREGAR esta línea
  if (intervaloNotificaciones) clearInterval(intervaloNotificaciones)
  document.documentElement.classList.remove('app-panel-lateral-activo')
  document.documentElement.classList.remove('app-panel-lateral-izquierda')
})

const fechaLarga = computed(() =>
  ahora.value.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }))

const horaActual = computed(() =>
  ahora.value.toLocaleTimeString('es-ES', { hour: 'numeric', minute: '2-digit', hour12: true })
)

const saludoPersonalizado = computed(() => {
  const hora = ahora.value.getHours()
  let saludo = 'Buenas noches'
  let emoji = '🌙'
  if (hora >= 5 && hora < 12) {
    saludo = 'Buenos días'
    emoji = '🌅'
  } else if (hora >= 12 && hora < 19) {
    saludo = 'Buenas tardes'
    emoji = '🌤️'
  }
  const nombre = usuarioActual.value?.nombre || 'Usuario'
  return `${emoji} ${saludo}, ${nombre}`
})

const bannerFullStyle = computed(() => ({
  opacity: String(Math.max(0, 1 - squeeze.value * 0.82)),
  transform: `translateY(${-14 * squeeze.value}px)`,
  maxHeight: `${Math.max(0, 340 * (1 - squeeze.value))}px`
}))

const bannerCompactaStyle = computed(() => ({
  opacity: String(Math.max(0, Math.min(1, (squeeze.value - 0.58) / 0.28))),
  transform: `translateY(${(1 - Math.max(0, Math.min(1, (squeeze.value - 0.58) / 0.28))) * 10}px)`
}))

const mostrarAccionesCompactas = computed(() => squeeze.value >= 0.72)

const UMBRAL_COLAPSAR = 32
const UMBRAL_EXPANDIR = 6
const squeeze = ref(0)
let bannerColapsado = false
let frameProgramado = false

const actualizarShellCompacto = (event: Event) => {
  if (frameProgramado) return
  frameProgramado = true

  requestAnimationFrame(() => {
    frameProgramado = false
    const target = event.target as HTMLDivElement
    const scrollTop = Math.max(0, target?.scrollTop ?? 0)
    const delta = scrollTop - ultimoScrollTop
    ultimoScrollTop = scrollTop

    if (scrollTop <= UMBRAL_EXPANDIR) {
      // Arriba del todo: banner siempre visible
      bannerOffsetPx.value = 0
    } else {
      const maxOcultar = bannerRef.value?.offsetHeight ?? alturaBannerPx.value
      // Baja -> se oculta progresivamente; sube -> reaparece progresivamente
      bannerOffsetPx.value = Math.min(maxOcultar, Math.max(0, bannerOffsetPx.value + delta))
    }

    if (!bannerColapsado && scrollTop >= UMBRAL_COLAPSAR) bannerColapsado = true
    if (bannerColapsado && scrollTop <= UMBRAL_EXPANDIR) bannerColapsado = false
    squeeze.value = bannerColapsado ? 1 : 0
  })
}

const cerrarMenuNotificacionesFuera = (evento: MouseEvent) => {
  const objetivo = evento.target as HTMLElement
  if (mostrarMenuNotificaciones.value && !objetivo.closest('.banner-notificacion-icono')) {
    mostrarMenuNotificaciones.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', cerrarMenuNotificacionesFuera)
})

onUnmounted(() => {
  document.removeEventListener('click', cerrarMenuNotificacionesFuera)
})

const { mostrarModalGasto, mostrarModalCierres, abrirModalGasto } = useModalesCaja()
const mostrarModalCierre = ref(false)
const mostrarModalOrdenesCierre = ref(false)
const mostrarModalDetalleOrden = ref(false)
const mostrarModalGastosCierre = ref(false)
const montoGasto = ref(0)
const tiposGasto = [
  'Fijos',
  'Variables',
  'Directos',
  'Indirectos',
  'Gastos recurrentes',
  'Gastos de venta y marketing',
  'Gastos financieros',
  'Transporte',
  'Servicios públicos',
  'Alimentación',
  'Nómina',
  'Gastos administrativos',
  'Papelería',
  'Otros'
] as const
const tipoGasto = ref<(typeof tiposGasto)[number]>('Otros')
const motivoGasto = ref('')
const turnoIdGasto = ref('')
const registrarGastoAntiguo = ref(false)
const montoCierre = ref(0)
const cierreSeleccionado = ref<any>(null)
const ordenSeleccionadaCierre = ref<any>(null)
const cierrePendienteEliminar = ref<any>(null)
const mostrarConfirmacionEliminarCierre = ref(false)
const eliminandoCierre = ref(false)
const eliminandoGastoCierreId = ref('')
const gastosCierreSeleccionado = computed(() =>
  cierreSeleccionado.value?.movimientos?.filter((movimiento: any) => movimiento.tipo === 'gasto') ?? []
)
const totalGastosCierre = computed(() =>
  gastosCierreSeleccionado.value.reduce((total: number, gasto: any) => total + Number(gasto.monto || 0), 0)
)

const turnosParaGasto = computed(() => {
  const lista: { id: string; numeroCaja: number; etiqueta: string }[] = []
  if (turno.abierto && turno.id) {
    lista.push({
      id: turno.id,
      numeroCaja: turno.numeroCaja,
      etiqueta: `Caja #${turno.numeroCaja} (actual)`
    })
  }
  for (const cierre of historialCierres.value) {
    if (cierre.turnoId === turno.id) continue
    lista.push({
      id: cierre.turnoId,
      numeroCaja: cierre.numeroCaja,
      etiqueta: `Caja #${cierre.numeroCaja} - ${new Date(cierre.cerradoAt).toLocaleDateString('es-ES')}`
    })
  }
  return lista
})


// Historial de cierres
const filtroCierresActivo = ref('todos')
const fechaDesde = ref('')
const fechaHasta = ref('')
const filtrosCierres = [
  { label: 'Todos', valor: 'todos' },
  { label: 'Pendientes', valor: 'pendiente' },
  { label: 'Verificados', valor: 'depositado' },
]

const limpiarFiltroFechas = () => {
  fechaDesde.value = ''
  fechaHasta.value = ''
}

const inicioDelDia = (fecha: Date) => {
  const copia = new Date(fecha)
  copia.setHours(0, 0, 0, 0)
  return copia
}

const finDelDia = (fecha: Date) => {
  const copia = new Date(fecha)
  copia.setHours(23, 59, 59, 999)
  return copia
}

const cargarCierres = async () => {
  try {
    await cargarHistorial()
  } catch (error) {
    console.error('Error al cargar cierres:', error)
  }
}

const eliminarCierreDesdeHistorial = async (cierre: any) => {
  cierrePendienteEliminar.value = cierre
  mostrarConfirmacionEliminarCierre.value = true
}

const cerrarConfirmacionEliminarCierre = () => {
  if (eliminandoCierre.value) return
  mostrarConfirmacionEliminarCierre.value = false
  cierrePendienteEliminar.value = null
}

const confirmarEliminarCierre = async () => {
  if (!cierrePendienteEliminar.value || eliminandoCierre.value) return
  const cierre = cierrePendienteEliminar.value
  eliminandoCierre.value = true

  try {
    await eliminarCierre(cierre.id)
    if (cierreSeleccionado.value?.id === cierre.id) {
      cierreSeleccionado.value = null
      mostrarModalOrdenesCierre.value = false
    }
    cerrarConfirmacionEliminarCierre()
  } catch (error) {
    window.alert(error instanceof Error ? error.message : 'No se pudo eliminar el cierre.')
  } finally {
    eliminandoCierre.value = false
  }
}

const descargarReporteCierre = (cierre: any) => {
  const pdf = new jsPDF({ unit: 'mm', format: 'letter' })
  const ancho = pdf.internal.pageSize.getWidth()
  const alto = pdf.internal.pageSize.getHeight()
  const margen = 16
  const anchoUtil = ancho - margen * 2
  let y = 18

  const encabezado = () => {
    pdf.setFillColor(8, 26, 48)
    pdf.rect(0, 0, ancho, 34, 'F')
    pdf.setTextColor(255, 255, 255)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(17)
    pdf.text('Reporte de cierre', margen, 14)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    pdf.text('Lavanderia Salinas', margen, 23)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(13)
    pdf.text(`CAJA #${cierre.numeroCaja}`, ancho - margen, 15, { align: 'right' })
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.text(new Date(cierre.cerradoAt).toLocaleDateString('es-ES'), ancho - margen, 23, { align: 'right' })
    pdf.setTextColor(10, 31, 56)
    y = 43
  }

  const nuevaPaginaSiNecesario = (altoNecesario = 8) => {
    if (y + altoNecesario <= alto - 16) return
    pdf.addPage()
    encabezado()
  }

  const texto = (valor: unknown, x = margen, anchoTexto = anchoUtil, tamano = 9) => {
    const lineas = pdf.splitTextToSize(String(valor ?? '-'), anchoTexto)
    nuevaPaginaSiNecesario(lineas.length * 4.5)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(tamano)
    pdf.text(lineas, x, y)
    y += lineas.length * 4.5 + 1.5
  }

  const tituloSeccion = (titulo: string) => {
    nuevaPaginaSiNecesario(12)
    pdf.setFillColor(224, 237, 246)
    pdf.roundedRect(margen, y - 5, anchoUtil, 8, 1.5, 1.5, 'F')
    pdf.setTextColor(18, 58, 102)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(10)
    pdf.text(titulo, margen + 3, y)
    pdf.setTextColor(10, 31, 56)
    y += 9
  }

  encabezado()
  texto(`Responsable: ${cierre.usuario || '-'}    Inicio: ${cierre.horaInicio || '-'}    Cierre: ${new Date(cierre.cerradoAt).toLocaleTimeString('es-ES')}`, margen, anchoUtil, 9)
  if (cierre.notas) texto(`Notas: ${cierre.notas}`, margen, anchoUtil, 8)

  tituloSeccion('Resumen de caja')
  const resumen = [
    ['Apertura', `$${Number(cierre.apertura || 0).toFixed(2)}`],
    ['Efectivo dejado', `$${Number(cierre.saldoCierre || 0).toFixed(2)}`],
    ['Cobrado', `$${Number(cierre.totales?.cobrado || 0).toFixed(2)}`],
    ['Depósitos', `$${Number(cierre.totales?.depositos || 0).toFixed(2)}`],
    ['Cancelaciones', `$${Number(cierre.totales?.cancelaciones || 0).toFixed(2)}`],
    ['Total recaudado', `$${Number(cierre.totales?.recaudado || 0).toFixed(2)}`],
    ['Diferencia', `$${Number(cierre.totales?.diferencia || 0).toFixed(2)}`]
  ]
  const resumenAncho = anchoUtil / 2
  resumen.forEach(([etiqueta, valor], indice) => {
    const columna = indice % 2
    const fila = Math.floor(indice / 2)
    if (columna === 0) nuevaPaginaSiNecesario(8)
    const x = margen + columna * resumenAncho + 4
    const yLinea = y + fila * 6
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.text(`${etiqueta}:`, x, yLinea)
    pdf.setFont('helvetica', 'bold')
    pdf.text(valor, x + resumenAncho - 34, yLinea, { align: 'right' })
    if (columna === 1 || indice === resumen.length - 1) y = yLinea + 7
  })

  const gastos = (cierre.movimientos || []).filter((movimiento: any) => movimiento.tipo === 'gasto')
  tituloSeccion(`Gastos del cierre (${gastos.length})`)
  const altoGastos = Math.max(18, 13 + gastos.length * 7)
  nuevaPaginaSiNecesario(altoGastos)
  const gastoY = y - 5
  pdf.setFillColor(255, 251, 235)
  pdf.setDrawColor(245, 190, 72)
  pdf.roundedRect(margen, gastoY, anchoUtil, altoGastos, 3, 3, 'FD')
  pdf.setTextColor(146, 64, 14)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(11)
  pdf.text(`Total de gastos: $${Number(cierre.totales?.gastos || 0).toFixed(2)}`, margen + 5, gastoY + 9)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  if (gastos.length === 0) {
    pdf.text('No se registraron gastos en este cierre.', margen + 5, gastoY + 16)
  } else {
    gastos.forEach((gasto: any, indice: number) => {
      const concepto = String(gasto.concepto || 'Gasto sin concepto').slice(0, 72)
      pdf.text(`${concepto} · ${gasto.creadoAt || ''}`, margen + 5, gastoY + 16 + indice * 7)
      pdf.setFont('helvetica', 'bold')
      pdf.text(`-$${Number(gasto.monto || 0).toFixed(2)}`, ancho - margen - 5, gastoY + 16 + indice * 7, { align: 'right' })
      pdf.setFont('helvetica', 'normal')
    })
  }
  y = gastoY + altoGastos + 8

  tituloSeccion(`Ordenes registradas (${cierre.ordenes?.length || 0})`)
  const columnas = [
    { titulo: 'ORDEN', ancho: 24 },
    { titulo: 'CLIENTE', ancho: 61 },
    { titulo: 'ESTADO', ancho: 32 },
    { titulo: 'PAGO', ancho: 35 },
    { titulo: 'MONTO', ancho: anchoUtil - 152 }
  ]
  const dibujarCabeceraTabla = () => {
    nuevaPaginaSiNecesario(14)
    pdf.setFillColor(18, 58, 102)
    pdf.rect(margen, y - 5, anchoUtil, 9, 'F')
    pdf.setTextColor(255, 255, 255)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(7.5)
    let x = margen + 3
    columnas.forEach((columna) => {
      pdf.text(columna.titulo, x, y + 1)
      x += columna.ancho
    })
    y += 10
  }
  dibujarCabeceraTabla()
  ;(cierre.ordenes || []).forEach((orden: any, indice: number) => {
    const valores = [
      String(orden.numero || '-'),
      String(orden.nombreCliente || '-'),
      String(orden.estado || '-'),
      String(orden.estadoPago || '-'),
      `$${Number(orden.cobradoEnTurno || orden.total || 0).toFixed(2)}`
    ]
    const lineasCliente = pdf.splitTextToSize(valores[1], columnas[1].ancho - 5)
    const altoFila = Math.max(8, lineasCliente.length * 4 + 4)
    if (y + altoFila > alto - 16) {
      pdf.addPage()
      encabezado()
      tituloSeccion(`Ordenes registradas (${cierre.ordenes?.length || 0})`)
      dibujarCabeceraTabla()
    }
    if (indice % 2 === 0) {
      pdf.setFillColor(245, 249, 252)
      pdf.rect(margen, y - 5, anchoUtil, altoFila, 'F')
    }
    pdf.setTextColor(10, 31, 56)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    let x = margen + 3
    valores.forEach((valor, valorIndice) => {
      const lineas = valorIndice === 1 ? lineasCliente : pdf.splitTextToSize(valor, columnas[valorIndice].ancho - 5)
      pdf.text(lineas, x, y)
      x += columnas[valorIndice].ancho
    })
    y += altoFila
  })

  pdf.setFontSize(8)
  pdf.setTextColor(100, 116, 139)
  pdf.text('Documento generado desde Lavandería Salinas', margen, alto - 9)
  pdf.save(`reporte-cierre-${cierre.numeroCaja}-${String(cierre.cerradoAt).slice(0, 10)}.pdf`)
}

watch(
  () => turno.id,
  () => {
    cierreSeleccionado.value = null
    mostrarModalOrdenesCierre.value = false
  }
)

const cierresFiltrados = computed(() => {
  const desde = fechaDesde.value ? inicioDelDia(new Date(`${fechaDesde.value}T00:00:00`)) : null
  const hasta = fechaHasta.value ? finDelDia(new Date(`${fechaHasta.value}T00:00:00`)) : null

  return historialCierres.value.filter((cierre) => {
    const pasaEstado =
      filtroCierresActivo.value === 'todos' ||
      cierre.deposito?.estado === filtroCierresActivo.value

    if (!pasaEstado) return false

    const fechaCierre = new Date(cierre.cerradoAt)
    if (Number.isNaN(fechaCierre.getTime())) return false

    if (desde && fechaCierre < desde) return false
    if (hasta && fechaCierre > hasta) return false

    return true
  })
})

watch(mostrarModalCierres, (abierto) => {
  if (abierto) cargarCierres()
})

watch(mostrarModalGasto, (abierto) => {
  if (!abierto) return
  registrarGastoAntiguo.value = false
  turnoIdGasto.value = turno.id || ''
})

const verOrdenesCierre = (cierre: any) => {
  cierreSeleccionado.value = cierre
  ordenSeleccionadaCierre.value = null
  mostrarModalOrdenesCierre.value = true
}

const abrirGastosCierre = () => {
  if (!cierreSeleccionado.value) return
  mostrarModalGastosCierre.value = true
}

const eliminarGastoCierre = async (gasto: any) => {
  if (!esAdministrador.value || !gasto?.id || !cierreSeleccionado.value || eliminandoGastoCierreId.value) return

  const concepto = extraerTipoGasto(gasto.concepto).motivo || 'Gasto sin concepto'
  const confirmado = window.confirm(
    `¿Eliminar el gasto "${concepto}" de $${Number(gasto.monto || 0).toFixed(2)}? Esta acción actualizará el total del cierre.`
  )
  if (!confirmado) return

  eliminandoGastoCierreId.value = gasto.id
  try {
    await eliminarGasto(gasto.id)
    await cargarHistorial()
    const cierreActualizado = historialCierres.value.find((cierre) => cierre.id === cierreSeleccionado.value?.id)
    if (cierreActualizado) cierreSeleccionado.value = cierreActualizado
  } catch (error) {
    window.alert(error instanceof Error ? error.message : 'No se pudo eliminar el gasto.')
  } finally {
    eliminandoGastoCierreId.value = ''
  }
}

const extraerTipoGasto = (concepto: string) => {
  if (!concepto) return { tipo: '', motivo: '' }
  const match = concepto.match(/^Tipo:\s*(.*?)\s*-\s*(.*)$/s)
  if (match) return { tipo: match[1], motivo: match[2] }
  return { tipo: '', motivo: concepto }
}

const abrirModalDetalleOrden = async (orden: any) => {
  ordenSeleccionadaCierre.value = orden
  mostrarModalDetalleOrden.value = true

  try {
    const respuesta = await fetch(`${getApiBaseUrl()}/ordenes/${orden.id}`)
    if (!respuesta.ok) return
    const ordenCompleta = await respuesta.json()
    if (ordenSeleccionadaCierre.value?.id !== orden.id) return
    ordenSeleccionadaCierre.value = {
      ...orden,
      ...ordenCompleta,
      movimientos: Array.isArray(ordenCompleta?.movimientos)
        ? ordenCompleta.movimientos
        : []
    }
  } catch {
    // El resumen del cierre sigue disponible si falla la consulta detallada.
  }
}

const cerrarModalDetalleOrden = () => {
  mostrarModalDetalleOrden.value = false
  ordenSeleccionadaCierre.value = null
}

const obtenerMontoPendientes = (cierre: any) => {
  return cierre.ordenes
    .filter((o: any) => o.estadoPago === 'porCobrar')
    .reduce((acc: number, o: any) => acc + o.total, 0)
}

const ordenesCobradasCierre = computed(() => {
  if (!cierreSeleccionado.value) return []
  return cierreSeleccionado.value.ordenes.filter((o: any) => 
    o.estadoPago === 'pagado' || o.estadoPago === 'anticipo'
  )
})

const etiquetaMovimiento = (tipo: string) => {
  const mapa: Record<string, string> = {
    cierre: 'Cierre',
    gasto: 'Gasto',
    deposito: 'Depósito',
    anticipo: 'Anticipo',
    venta: 'Venta'
  }
  return mapa[tipo] ?? 'Movimiento'
}

const formatearFechaHoraCierre = (valor: string) => {
  if (!valor) return 'Sin fecha'
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return valor
  return fecha.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const limpiarEntradas = () => {
  montoGasto.value = 0
  tipoGasto.value = 'Otros'
  motivoGasto.value = ''
  turnoIdGasto.value = ''
  registrarGastoAntiguo.value = false
  montoCierre.value = 0
}

const guardarGasto = async () => {
  const motivo = motivoGasto.value.trim()
  if (!motivo) {
    window.alert('El motivo del gasto es obligatorio.')
    return
  }

  let creado
  try {
    const caja = registrarGastoAntiguo.value
      ? turnosParaGasto.value.find((opcion) => opcion.id === turnoIdGasto.value)
      : turnosParaGasto.value.find((opcion) => opcion.id === turno.id)
    if (registrarGastoAntiguo.value && !caja) {
      window.alert('Selecciona la caja a la que pertenece el gasto.')
      return
    }
    creado = await registrarGasto({
      monto: montoGasto.value,
      concepto: `Tipo: ${tipoGasto.value} - ${motivo}`,
      usuario: usuarioActual.value?.nombre || usuarioActual.value?.correo || undefined,
      turnoId: registrarGastoAntiguo.value ? caja?.id : turno.id,
      numeroCaja: registrarGastoAntiguo.value ? caja?.numeroCaja : turno.numeroCaja
    })
  } catch (error) {
    window.alert(error instanceof Error ? error.message : 'No se pudo guardar el gasto.')
    return
  }

  if (!creado) return

  limpiarEntradas()
  await cargarHistorial()
  mostrarModalGasto.value = false
  router.push('/tabs/reportes').catch(() => {})
}

const cerrarCaja = async () => {
  if (!turno.abierto) return

  try {
    const creado = await registrarCierreTurno(montoCierre.value)
    if (!creado) return
  } catch (error) {
    window.alert(error instanceof Error ? error.message : 'No se pudo guardar el cierre de caja.')
    return
  }

  limpiarEntradas()
  mostrarModalCierre.value = false
  router.push('/tabs/reportes').catch(() => {})
}

const cerrarSesion = () => {
  sessionStorage.removeItem('actualizacion-verificada-en-sesion')
  sessionStorage.removeItem('actualizacion-pendiente-al-entrar')
  cerrarSesionSesion()
  router.replace('/login').catch(() => {})
}

// Funciones para el sistema de notificaciones y problemas
const enviarReporteProblema = async () => {
  if (!temaProblema.value.trim() || !detallesProblema.value.trim()) return
  
  enviandoProblema.value = true
  
  try {
    await reportarProblema(temaProblema.value, detallesProblema.value)
    temaProblema.value = ''
    detallesProblema.value = ''
    mostrarModalReportarProblema.value = false
  } catch (error) {
    console.error('Error al enviar reporte de problema:', error)
  } finally {
    enviandoProblema.value = false
  }
}

const enviarAvisoDesdeModal = async () => {
  if (!tituloAviso.value.trim() || !mensajeAviso.value.trim() || enviandoAviso.value) return
  enviandoAviso.value = true
  try {
    await enviarAviso(tituloAviso.value, mensajeAviso.value, destinatarioAviso.value)
    tituloAviso.value = ''
    mensajeAviso.value = ''
    destinatarioAviso.value = 'todos'
    mostrarModalAviso.value = false
  } catch (error) {
    window.alert(error instanceof Error ? error.message : 'No se pudo enviar el aviso.')
  } finally {
    enviandoAviso.value = false
  }
}

const insertarHtmlTag = (tag: string, style = '') => {
  const editor = document.getElementById('aviso-mensaje') as HTMLElement
  if (!editor) return

  // Dar foco al editor si no lo tiene
  if (document.activeElement !== editor) {
    editor.focus()
  }

  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return

  // Usar execCommand para formato normal
  if (tag === 'strong') {
    document.execCommand('bold', false, undefined)
  } else if (tag === 'em') {
    document.execCommand('italic', false, undefined)
  } else if (tag === 'u') {
    document.execCommand('underline', false, undefined)
  }
  
  // Actualizar el valor del mensaje
  mensajeAviso.value = editor.innerHTML
}

const aplicarColor = () => {
  const editor = document.getElementById('aviso-mensaje') as HTMLElement
  if (!editor) return

  // Dar foco al editor si no lo tiene
  if (document.activeElement !== editor) {
    editor.focus()
  }

  document.execCommand('foreColor', false, colorSeleccionado.value)
  mensajeAviso.value = editor.innerHTML
}

const insertarLista = (tipo: string) => {
  const editor = document.getElementById('aviso-mensaje') as HTMLElement
  if (!editor) return

  // Dar foco al editor si no lo tiene
  if (document.activeElement !== editor) {
    editor.focus()
  }

  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return

  const marcador = tipo === 'bullet' ? '• ' : tipo === 'asterisk' ? '* ' : '- '
  
  const range = selection.getRangeAt(0)
  const textNode = document.createTextNode(marcador)
  range.insertNode(textNode)
  
  range.setStartAfter(textNode)
  range.setEndAfter(textNode)
  selection.removeAllRanges()
  selection.addRange(range)
  
  mensajeAviso.value = editor.innerHTML
}

const insertarEmoji = (emoji: string) => {
  const editor = document.getElementById('aviso-mensaje') as HTMLElement
  if (!editor) return

  // Dar foco al editor si no lo tiene
  if (document.activeElement !== editor) {
    editor.focus()
  }

  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return

  const range = selection.getRangeAt(0)
  range.deleteContents()
  
  const textNode = document.createTextNode(emoji)
  range.insertNode(textNode)
  
  // Mover el cursor después del emoji
  range.setStartAfter(textNode)
  range.setEndAfter(textNode)
  selection.removeAllRanges()
  selection.addRange(range)
  
  // Actualizar el valor del mensaje
  mensajeAviso.value = editor.innerHTML
}

const abrirModalEditarAviso = (notificacion: NotificacionUsuario) => {
  avisoParaEditar.value = notificacion
  tituloAvisoEditar.value = notificacion.titulo
  mensajeAvisoEditar.value = notificacion.mensaje
  destinatarioAvisoEditar.value = 'todos' // No tenemos esta info en la notificación
  mostrarModalEditarAviso.value = true
}

const guardarEdicionAviso = async () => {
  if (!avisoParaEditar.value || !tituloAvisoEditar.value.trim() || !mensajeAvisoEditar.value.trim() || enviandoAvisoEditar.value) return
  
  enviandoAvisoEditar.value = true
  try {
    await editarAviso(avisoParaEditar.value.id, tituloAvisoEditar.value, mensajeAvisoEditar.value, destinatarioAvisoEditar.value)
    mostrarModalEditarAviso.value = false
    avisoParaEditar.value = null
    tituloAvisoEditar.value = ''
    mensajeAvisoEditar.value = ''
    destinatarioAvisoEditar.value = 'todos'
  } catch (error) {
    window.alert(error instanceof Error ? error.message : 'No se pudo editar el aviso.')
  } finally {
    enviandoAvisoEditar.value = false
  }
}

const puedeEditarAviso = (notificacion: NotificacionUsuario) => {
  // Solo el autor o administradores pueden editar, excepto si el autor es el desarrollador
  const esAutorDesarrollador = notificacion.autorNombre?.toLowerCase() === 'desarrollador'
  if (esAutorDesarrollador) return false
  
  return esAdministrador || (notificacion.autorNombre === usuarioActual.value?.nombre)
}

const insertarHtmlTagEditar = (tag: string, style = '') => {
  const editor = document.getElementById('aviso-editar-mensaje') as HTMLElement
  if (!editor) return

  // Dar foco al editor si no lo tiene
  if (document.activeElement !== editor) {
    editor.focus()
  }

  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return

  // Usar execCommand para formato normal
  if (tag === 'strong') {
    document.execCommand('bold', false, undefined)
  } else if (tag === 'em') {
    document.execCommand('italic', false, undefined)
  } else if (tag === 'u') {
    document.execCommand('underline', false, undefined)
  }
  
  // Actualizar el valor del mensaje
  mensajeAvisoEditar.value = editor.innerHTML
}

const aplicarColorEditar = () => {
  const editor = document.getElementById('aviso-editar-mensaje') as HTMLElement
  if (!editor) return

  // Dar foco al editor si no lo tiene
  if (document.activeElement !== editor) {
    editor.focus()
  }

  document.execCommand('foreColor', false, colorSeleccionadoEditar.value)
  mensajeAvisoEditar.value = editor.innerHTML
}

const insertarListaEditar = (tipo: string) => {
  const editor = document.getElementById('aviso-editar-mensaje') as HTMLElement
  if (!editor) return

  // Dar foco al editor si no lo tiene
  if (document.activeElement !== editor) {
    editor.focus()
  }

  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return

  const marcador = tipo === 'bullet' ? '• ' : tipo === 'asterisk' ? '* ' : '- '
  
  const range = selection.getRangeAt(0)
  const textNode = document.createTextNode(marcador)
  range.insertNode(textNode)
  
  range.setStartAfter(textNode)
  range.setEndAfter(textNode)
  selection.removeAllRanges()
  selection.addRange(range)
  
  mensajeAvisoEditar.value = editor.innerHTML
}

const insertarEmojiEditar = (emoji: string) => {
  const editor = document.getElementById('aviso-editar-mensaje') as HTMLElement
  if (!editor) return

  // Dar foco al editor si no lo tiene
  if (document.activeElement !== editor) {
    editor.focus()
  }

  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return

  const range = selection.getRangeAt(0)
  range.deleteContents()
  
  const textNode = document.createTextNode(emoji)
  range.insertNode(textNode)
  
  // Mover el cursor después del emoji
  range.setStartAfter(textNode)
  range.setEndAfter(textNode)
  selection.removeAllRanges()
  selection.addRange(range)
  
  // Actualizar el valor del mensaje
  mensajeAvisoEditar.value = editor.innerHTML
}

// Función para obtener iconos de lavandería aleatorios basados en el ID de notificación
const getIconoLavanderia = (id: string) => {
  const iconos = [shirtOutline, bodyOutline, manOutline, womanOutline]
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return iconos[hash % iconos.length]
}
</script>

<style scoped>

.whatsapp-panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 5000;
  left: auto;
  display: flex;               /* CAMBIO: antes "block" */
  flex-direction: column;      /* AGREGAR */
  width: var(--whatsapp-panel-ancho, 30vw);
  min-width: 0;
  height: 100dvh;
  overflow: hidden;
  background: #f0f2f5;
  border-left: 1px solid #d7dde3;
  box-shadow: -12px 0 34px rgba(12, 34, 48, 0.2);
  animation: whatsapp-panel-in 180ms ease-out;
}

.whatsapp-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;              /* AGREGAR: que no se encoja */
  height: 68px;
  min-height: 0;
  box-sizing: border-box;
  padding: 12px 16px;
  background: #075e54;
  color: #fff;
}

.whatsapp-webview {
  display: flex;                /* CAMBIO: antes "block" */
  flex: 1 1 auto;                /* AGREGAR: ocupa todo lo que sobra */
  position: static;              /* CAMBIO: quita el absolute */
  width: 100%;
  height: 100%;                  /* CAMBIO: antes "auto" */
  border: 0;
}

.whatsapp-browser-fallback {
  display: flex;
  flex: 1 1 auto;                /* AGREGAR: mismo trato para el fallback */
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 32px;
  color: #425466;
  text-align: center;
}

:global(html.app-panel-lateral-activo) {
  --app-panel-ancho: 30vw;
  --whatsapp-panel-ancho: 30vw;
  --facebook-panel-ancho: 30vw;
}

:global(html.app-panel-lateral-activo ion-app > ion-router-outlet) {
  width: calc(100vw - 30vw);
  margin-right: 30vw;
  margin-left: 0;
  transition: width 180ms ease, margin-right 180ms ease, margin-left 180ms ease;
}

:global(html.app-panel-lateral-activo.app-panel-lateral-izquierda ion-app > ion-router-outlet) {
  margin-right: 0;
  margin-left: 30vw;
  width: calc(100vw - 30vw);
  transition: width 180ms ease, margin-left 180ms ease, margin-right 180ms ease;
}

@media (max-width: 700px) {
  :global(html.app-panel-lateral-activo ion-app > ion-router-outlet) {
    width: 100%;
    margin-right: 0;
    margin-left: 0;
  }
}

.shell-root {
  width: 100%;
  height: 100%;
}

.shell-loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 22px;
  background: rgba(8, 16, 28, 0.82);
  backdrop-filter: blur(9px);
}

.shell-loading-overlay p {
  margin: 0;
  color: #a9d8ee;
  font-size: 16px;
  font-weight: 800;
}

.shell-loading-logo {
  position: relative;
  display: grid;
  place-items: center;
  width: 148px;
  height: 148px;
}

.shell-loading-logo img {
  width: 108px;
  height: 108px;
  border-radius: 18px;
  object-fit: contain;
  animation: shell-logo-pulse 1.1s ease-in-out infinite;
}

.shell-loading-ring {
  position: absolute;
  inset: 5px;
  border: 3px solid rgba(169, 216, 238, 0.24);
  border-top-color: #a9d8ee;
  border-right-color: #4fb3e0;
  border-radius: 50%;
  animation: shell-ring-spin 1s linear infinite;
}

@keyframes shell-ring-spin { to { transform: rotate(360deg); } }
@keyframes shell-logo-pulse { 50% { transform: scale(0.92); opacity: 0.72; } }

ion-content.shell-container {
  --background: var(--app-shell-color);
  --padding-top: 0;
  --padding-bottom: 0;
  height: 100dvh;
  background-image: var(--app-shell-imagen);
  background-size: cover;
  background-position: center;
}

/* Contenido principal */
.main-content {
  height: 100dvh;
  display: flex;
  gap: 18px;
  padding: 0;
  overflow: hidden;
  width: 100%;
}

.notificacion-orden {
  position: fixed;
  top: 18px;
  right: 22px;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 12px 16px;
  border: 1px solid rgba(22, 163, 74, 0.28);
  border-radius: 12px;
  background: #ffffff;
  color: #14532d;
  font-size: 0.9rem;
  font-weight: 800;
  box-shadow: 0 12px 28px rgba(10, 31, 56, 0.16);
  animation: entrada-notificacion 0.2s ease-out;
}

.notificacion-orden ion-icon {
  color: #16a34a;
  font-size: 21px;
}

@keyframes entrada-notificacion {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.content-wrapper {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative; /* AGREGAR */
}

.global-banner {
  position: absolute;   /* CAMBIAR: antes no tenía position (estaba en flujo normal) */
  top: 0;                /* AGREGAR */
  left: 0;                /* AGREGAR */
  right: 0;               /* AGREGAR */
  flex-shrink: 0;
  min-height: 76px;
  background: var(--app-shell-header-color);
  color: #eaf4fa;
  display: flex;
  flex-direction: column;
  z-index: 20;
  overflow: hidden;
  box-shadow: 0 12px 30px -10px rgba(6, 20, 38, 0.35);
  box-sizing: border-box;
  transform: translateY(calc(-1 * v-bind(bannerOffsetCss))); /* AGREGAR */
  transition: transform 0.22s ease;                           /* AGREGAR */
  will-change: transform;                                     /* AGREGAR */
}

/* Cuando ya llegó a barra completa, la zona central no recibe clics. */
.global-banner.banner-colapsado .banner-centro {
  pointer-events: none;
}

/* Línea de acento inferior, sutil, propia de marca */
.global-banner::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 3px;
  background: linear-gradient(90deg, #4fb3e0 0%, #a9d8ee 45%, #4fb3e0 100%);
  opacity: 0.55;
}

.banner-full {
  position: relative;
  z-index: 1;
  padding: calc(22px - 12px * v-bind(squeeze))
           calc(30px - 10px * v-bind(squeeze))
           calc(24px - 18px * v-bind(squeeze));
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  grid-template-rows: auto 1fr;
  align-items: center;
  gap: calc(18px - 12px * v-bind(squeeze));
  overflow: hidden;
  box-sizing: border-box;
  will-change: max-height, opacity, transform;
  transition: max-height 0.28s ease, opacity 0.22s ease, transform 0.28s ease, padding 0.28s ease, gap 0.28s ease;
}

.banner-perfil-superior {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  padding: 0;
  border: 2px solid rgba(169, 216, 238, 0.52);
  border-radius: 50%;
  background: rgba(169, 216, 238, 0.14);
  color: #eaf4fa;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease;
}

.banner-perfil-superior:hover {
  background: rgba(169, 216, 238, 0.28);
  transform: translateY(-1px);
}

.banner-perfil-superior:disabled {
  cursor: not-allowed;
  opacity: 0.42;
  transform: none;
}

.banner-perfil-superior:disabled:hover {
  background: rgba(169, 216, 238, 0.10);
  transform: none;
}

.banner-perfil-superior img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.banner-perfil-superior ion-icon {
  font-size: 31px;
}

.banner-perfil-superior-compacto {
  display: none;
  width: 46px;
  height: 46px;
}

.banner-compacta {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 14px;
  padding: 0 24px;
  overflow: hidden;
  box-sizing: border-box;
  will-change: max-height, opacity, transform;
  pointer-events: none;
  transition: opacity 0.22s ease, transform 0.28s ease;
}

.banner-compacta-navegacion {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  overflow: hidden;
  pointer-events: auto;
}

.banner-compacta .banner-btn {
  pointer-events: auto;
}

.banner-compacta-reloj {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  text-align: center;
  font-size: clamp(1.05rem, 2vw, 1.45rem);
  font-weight: 900;
  letter-spacing: -0.02em;
  color: #f5f9fc;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  grid-column: 2;
  justify-self: center;
}

/* Resplandor ambiental, decorativo, detrás del contenido */
.banner-glow {
  position: absolute;
  top: -60%;
  right: -10%;
  width: 420px;
  height: 420px;
  background: radial-gradient(circle, rgba(79, 179, 224, 0.22) 0%, rgba(79, 179, 224, 0) 70%);
  pointer-events: none;
}

.banner-top-row {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
  grid-column: 1 / -1;
}

.banner-home-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 10px;
  border: 1px solid rgba(169, 216, 238, 0.22);
  background: rgba(169, 216, 238, 0.12);
  color: #f5f9fc;
  font-weight: 700;
  font-size: 0.86rem;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.banner-home-btn:hover {
  background: rgba(169, 216, 238, 0.20);
  border-color: rgba(169, 216, 238, 0.4);
}

.banner-home-btn ion-icon {
  font-size: 16px;
}

.breadcrumb-nav {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.breadcrumb-nav-compacta {
  flex-wrap: nowrap;
  overflow: hidden;
  white-space: nowrap;
}

.breadcrumb-item {
  border: none;
  background: none;
  color: #a9d8ee;
  font-weight: 600;
  font-size: 0.86rem;
  cursor: pointer;
  padding: 2px 2px;
}

.breadcrumb-item-compacta {
  font-size: 0.82rem;
}

.breadcrumb-item:hover {
  text-decoration: underline;
}

.breadcrumb-item.active {
  color: #f5f9fc;
  font-weight: 800;
  cursor: default;
  pointer-events: none;
}

.breadcrumb-sep {
  color: rgba(169, 216, 238, 0.5);
  font-size: 0.86rem;
}

.banner-centro {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: calc(20px - 20px * v-bind(squeeze));
  text-align: left;
  position: relative;
  z-index: 1;
  grid-column: 2;
  justify-self: center;
}

/* Marco del logo: se desvanece más rápido que el tamaño. */
.banner-logo-marco {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: calc(22px - 6px * v-bind(squeeze));
  padding: calc(10px - 10px * v-bind(squeeze));
  opacity: calc(1 - v-bind(squeeze) * 1.7);
  width: calc(250px - 250px * v-bind(squeeze));
  overflow: hidden;
}

.banner-logo-grande {
  width: calc(230px - 230px * v-bind(squeeze));
  height: calc(230px - 230px * v-bind(squeeze));
  flex-shrink: 0;
  border-radius: 16px;
  object-fit: contain;
}

.banner-centro-copy {
  display: grid;
  gap: 3px;
}

.banner-fecha {
  margin: 0;
  font-size: 0.9rem;
  color: #a9d8ee;
  font-weight: 600;
  opacity: calc(1 - v-bind(squeeze) * 2);
  max-height: calc(20px - 20px * v-bind(squeeze));
  overflow: hidden;
}

.banner-reloj {
  margin: 0;
  font-size: calc(3rem - 1.85rem * v-bind(squeeze));
  font-weight: 900;
  letter-spacing: -0.02em;
  color: #f5f9fc;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.banner-saludo {
  margin: 0;
  font-size: 1.1rem;
  color: #ffffff;
  font-weight: 600;
  text-align: center;
  opacity: calc(1 - v-bind(squeeze) * 2);
  max-height: calc(25px - 25px * v-bind(squeeze));
  overflow: hidden;
}

.banner-marca {
  margin: 0;
  font-size: 0.85rem;
  color: #cfe9f5;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  opacity: calc(1 - v-bind(squeeze) * 2);
  max-height: calc(18px - 18px * v-bind(squeeze));
  overflow: hidden;
}

.banner-acciones {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  position: relative;
  z-index: 1;
  grid-column: 3;
  justify-self: end;
}

.banner-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: calc(10px - 4px * v-bind(squeeze)) calc(18px - 6px * v-bind(squeeze));
  border-radius: 12px;
  border: 1px solid rgba(169, 216, 238, 0.22);
  background: rgba(169, 216, 238, 0.10);
  color: #eaf4fa;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
}

.banner-btn ion-icon {
  font-size: 18px;
}

.banner-btn-perfil img {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
}

.banner-btn:hover {
  background: rgba(169, 216, 238, 0.18);
  border-color: rgba(169, 216, 238, 0.4);
  transform: translateY(-1px);
}

.banner-btn:disabled {
  cursor: not-allowed;
  opacity: 0.42;
  transform: none;
}

.banner-btn:disabled:hover {
  background: rgba(169, 216, 238, 0.10);
  border-color: rgba(169, 216, 238, 0.22);
}

.banner-btn-salir {
  background: rgba(220, 38, 38, 0.12);
  border-color: rgba(248, 113, 113, 0.28);
}

.banner-btn-salir:hover {
  background: rgba(220, 38, 38, 0.2);
  border-color: rgba(248, 113, 113, 0.45);
}

.banner-acciones-compactas {
  grid-column: 3;
  justify-self: end;
  justify-content: center;
  gap: 10px;
}

.banner-home-btn-compacta,
.banner-btn-compacta {
  flex-direction: row;
  gap: 6px;
}

.banner-home-btn-compacta {
  grid-column: 1;
  justify-self: start;
  position: relative;
  z-index: 1;
  pointer-events: auto;
}

.banner-compacta .banner-btn,
.banner-compacta .banner-home-btn {
  padding-top: 8px;
  padding-bottom: 8px;
}

.content-area {
  flex: 1;
  min-height: 0;
  width: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  padding: calc(24px + v-bind(alturaBannerCss)) 28px 220px; /* CAMBIAR: antes decía "padding: 24px 28px 220px" */
}

.content-area > * {
  width: 100%;
  max-width: 100%;
}

.content-area::-webkit-scrollbar {
  width: 12px;
}

.content-area::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

.content-area::-webkit-scrollbar-thumb {
  background: rgba(128, 128, 128, 0.6);
  border-radius: 10px;
  border: 3px solid transparent;
  background-clip: content-box;
}

.content-area::-webkit-scrollbar-thumb:hover {
  background: rgba(128, 128, 128, 0.8);
  background-clip: content-box;
}

.content-area-principal {
  padding-bottom: 420px;
}

.mobile-refresh-button {
  position: absolute;
  right: 14px;
  bottom: 12px;
  z-index: 5;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #ffffff;
  display: none;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.18s ease, opacity 0.18s ease;
}

.mobile-refresh-button ion-icon {
  font-size: 22px;
}

.mobile-refresh-button:hover:not(:disabled) {
  transform: scale(1.08);
}

.mobile-refresh-button:disabled {
  opacity: 0.6;
  cursor: wait;
}

.panel-pedido-shell {
  display: block;
  padding: 24px 28px 24px 0;
}

/* Modales del banner */
.modal-shell {
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

.modal-gasto-contenido {
  --ion-background-color: #ffffff;
  --ion-text-color: #0a1f38;
  color-scheme: light;
  color: #0a1f38;
}

.modal-gasto-contenido input,
.modal-gasto-contenido textarea {
  color: #0a1f38;
  background: #ffffff;
  caret-color: #123a66;
}

.modal-gasto-contenido input::placeholder,
.modal-gasto-contenido textarea::placeholder {
  color: #7b8fa5;
  opacity: 1;
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

.modal-ayuda {
  margin: -2px 0 0;
  color: #6d829c;
  font-size: 0.82rem;
  line-height: 1.4;
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

@media (max-width: 900px) {
   .global-banner {
    display: none;
  }

  .content-area {
    padding: calc(22px + env(safe-area-inset-top)) 18px calc(96px + env(safe-area-inset-bottom));
  }

  .content-area-principal {
    background: linear-gradient(
      to bottom,
      #123a66 0,
      #123a66 calc(22px + env(safe-area-inset-top)),
      transparent calc(22px + env(safe-area-inset-top))
    );
  }

  .banner-acciones,
  .banner-acciones-compactas {
    display: none !important;
  }

  .mobile-refresh-button {
    display: flex;
  }

  .banner-full {
    padding: calc(16px - 6px * v-bind(squeeze))
             calc(18px - 4px * v-bind(squeeze))
             calc(20px - 12px * v-bind(squeeze));
  }

  .banner-compacta {
    padding: 0 16px;
    gap: 10px;
  }

   /* Solo el logo, centrado — sin fecha ni reloj en mobile/tablet */
  .banner-centro {
    justify-content: center;
  }

  .banner-centro-copy {
    display: none;
  }

  .banner-compacta-reloj {
    display: none;
  }
    .banner-logo-marco {
    width: calc(150px - 150px * v-bind(squeeze));
    padding: 0;
  }

  .banner-logo-grande {
    width: calc(130px - 130px * v-bind(squeeze));
    height: calc(130px - 130px * v-bind(squeeze));
  }

  .banner-compacta .banner-home-btn span,
  .banner-compacta .banner-btn span {
    display: none;
  }

  .panel-pedido-shell {
    display: none !important;
  }
}

/* Modal de cierres */
.modal-cierres-grande {
  --height: 100dvh;
  --width: 100vw;
  --border-radius: 0;
  --background: transparent;
  --backdrop-opacity: 0.18;
  --ion-backdrop-opacity: 0.18;
}

.modal-cierres-grande::part(content) {
  width: 100vw;
  height: 100dvh;
  max-width: 100vw;
  max-height: 100dvh;
  margin: 0;
  border-radius: 0;
  inset: 0;
  background: transparent;
  box-shadow: none;
}

.modal-cierres-grande ion-backdrop {
  --backdrop-opacity: 0.18;
  background: rgba(0, 0, 0, .18);
  backdrop-filter: none;
}

.modal-cierres-contenido {
  max-height: calc(100dvh - 28px); /* antes tenía además "height: calc(100dvh - 28px);" -> quítala */
  width: min(1080px, calc(100vw - 24px));
  margin: 14px auto;
  border-radius: 18px;
  box-shadow: 0 28px 56px rgba(10, 31, 56, 0.28);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.cierres-contenido {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
}

.cierres-filtros {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.cierres-filtro-fechas {
  display: grid;
  grid-template-columns: repeat(2, minmax(180px, 220px)) auto;
  align-items: end;
  gap: 10px;
}

.filtro-fecha-campo {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #4a627e;
}

.filtro-fecha-campo input {
  border: 1.5px solid #a9d8ee;
  border-radius: 10px;
  padding: 9px 10px;
  color: #0a1f38;
  background: #ffffff;
  font-weight: 600;
}

.filtro-limpiar {
  height: 38px;
  border: 1.5px solid rgba(18, 58, 102, 0.28);
  border-radius: 10px;
  background: transparent;
  color: #123a66;
  font-size: 0.82rem;
  font-weight: 700;
  padding: 0 12px;
  cursor: pointer;
}

.filtro-limpiar:hover {
  border-color: #4fb3e0;
  color: #0d2b4e;
}

.filtro-chip {
  padding: 8px 16px;
  border: 1.5px solid #a9d8ee;
  border-radius: 20px;
  background: #ffffff;
  color: #4a627e;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filtro-chip:hover {
  background: #f0f8ff;
  border-color: #4fb3e0;
}

.filtro-chip.active {
  background: #4fb3e0;
  color: #ffffff;
  border-color: #4fb3e0;
}

.cierres-lista {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto; /* antes era overflow: hidden */
}

.cierres-vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  color: #6d829c;
}

.cierres-vacio-icon {
  font-size: 48px;
  color: #a9d8ee;
}

.cierres-vacio-texto {
  margin: 0;
  font-size: 0.95rem;
}

.cierres-box {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 100%;
  overflow-y: auto;
  padding-right: 8px;
}

.cierre-item {
  border: 1.5px solid #fbc500;
  border-radius: 12px;
  background: #a026261a;
  color: #0a1f38;
  font-weight: bold;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: all 0.2s ease;
}

.cierre-item:hover {
  border-color: #4fb3e0;
  box-shadow: 0 4px 12px rgba(79, 179, 224, 0.1);
}

.cierre-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.cierre-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cierre-numero {
  font-weight: 800;
  color: #0a1f38;
  font-size: 0.95rem;
}

.cierre-fecha {
  color: #6d829c;
  font-size: 0.85rem;
}

.cierre-monto {
  font-weight: 800;
  color: #16a34a;
  font-size: 1.1rem;
}

.cierre-detalles {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 8px;
}

.cierre-detalle {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detalle-label {
  font-size: 0.75rem;
  color: #6d829c;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.cierre-estado {
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: capitalize;
}

.estado-pendiente {
  color: #d97706;
}
.estado-gstos {
  color: #d90606;
}

.estado-verificado {
  color: #16a34a;
}

.cierre-ver-ordenes {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1.5px solid #a9d8ee;
  border-radius: 8px;
  background: #f0f8ff;
  color: #4a627e;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cierre-acciones {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
}

.cierre-acciones .cierre-ver-ordenes {
  flex: 1;
  margin-top: 0;
}

.cierre-descargar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 36px;
  padding: 8px 10px;
  border: 1.5px solid rgba(22, 163, 74, 0.28);
  border-radius: 8px;
  background: #f0fdf4;
  color: #15803d;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
}

.cierre-descargar:hover,
.cierre-descargar:focus-visible {
  background: #dcfce7;
  outline: 0;
}

.cierre-descargar ion-icon {
  font-size: 16px;
}

.confirmacion-cierre-texto,
.confirmacion-cierre-recomendacion {
  margin: 0;
  color: #334155;
  line-height: 1.5;
}

.confirmacion-cierre-recomendacion {
  padding: 12px;
  border: 1px solid rgba(217, 119, 6, 0.25);
  border-radius: 10px;
  background: #fffbeb;
  color: #92400e;
  font-size: 0.9rem;
  font-weight: 700;
}

.cierre-ver-ordenes:hover {
  background: #4fb3e0;
  color: #ffffff;
  border-color: #4fb3e0;
}

.cierre-ver-ordenes ion-icon {
  font-size: 16px;
}

.cierre-eliminar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  margin-top: 0;
  padding: 8px 12px;
  border: 1px solid rgba(220, 38, 38, .24);
  border-radius: 8px;
  background: #fff5f5;
  color: #b42318;
  font-size: .82rem;
  font-weight: 700;
  cursor: pointer;
}

.cierre-eliminar:hover,
.cierre-eliminar:focus-visible {
  background: #fee2e2;
  outline: 0;
}

.cierre-eliminar ion-icon {
  font-size: 16px;
}

.modal-subtitulo-movimientos {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 5px;
  color: #168b83;
  font-weight: 700;
}

.modal-subtitulo-movimientos ion-icon {
  font-size: 15px;
}

/* Modal de órdenes de cierre */
.cierre-resumen-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.cierre-resumen-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 12px 26px rgba(10, 31, 56, 0.08);
  color: #ffffff;
}

.cierre-resumen-boton {
  width: 100%;
  text-align: left;
  font: inherit;
  cursor: pointer;
  transition: transform .2s ease, box-shadow .2s ease, filter .2s ease;
}

.cierre-resumen-boton:hover,
.cierre-resumen-boton:focus-visible {
  filter: brightness(1.06);
  transform: translateY(-2px);
  outline: 0;
  box-shadow: 0 15px 28px rgba(217, 119, 6, .2);
}

.cierre-resumen-boton small {
  font-size: .72rem;
  font-weight: 700;
  opacity: .82;
}

.cierre-resumen-card span {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  opacity: 0.88;
}

.cierre-resumen-card strong {
  font-size: 1.3rem;
  font-weight: 800;
}

.card-emerald { background: linear-gradient(135deg, #10b981, #059669); }
.card-blue { background: linear-gradient(135deg, #3b82f6, #2563eb); }
.card-amber { background: linear-gradient(135deg, #f59e0b, #d97706); }
.card-slate { background: linear-gradient(135deg, #475569, #334155); }

.gastos-cierre-lista {
  display: grid;
  gap: 10px;
  max-height: 420px;
  overflow-y: auto;
}

.gasto-cierre-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 13px 14px;
  border: 1px solid #e5edf3;
  border-radius: 12px;
  background: #fbfdff;
}

.gasto-cierre-item > div {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.gasto-cierre-item strong {
  color: #0a1f38;
  overflow-wrap: anywhere;
}

.gasto-cierre-item span {
  color: #7c8fa6;
  font-size: .78rem;
}

.gasto-cierre-monto {
  flex: 0 0 auto;
  color: #dc2626 !important;
}

.gasto-cierre-acciones {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 0 0 auto;
}

.gasto-cierre-eliminar {
  width: 32px;
  height: 32px;
  border: 1px solid rgba(220, 38, 38, 0.2);
  border-radius: 8px;
  display: grid;
  place-items: center;
  background: rgba(254, 226, 226, 0.7);
  color: #b91c1c;
  cursor: pointer;
}

.gasto-cierre-eliminar:hover:not(:disabled) {
  background: rgba(220, 38, 38, 0.16);
}

.gasto-cierre-eliminar:disabled {
  opacity: 0.6;
  cursor: wait;
}

.cierre-orden-item {
  border: 1.5px solid #dfeaf5;
  border-radius: 16px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: all 0.2s ease;
  text-align: left;
  cursor: pointer;
}

.cierre-orden-item:hover {
  border-color: #4fb3e0;
  box-shadow: 0 10px 24px rgba(79, 179, 224, 0.12);
  transform: translateY(-1px);
}

.cierre-orden-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.cierre-orden-titulo {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.cierre-orden-numero {
  font-weight: 800;
  color: #0a1f38;
  font-size: 1rem;
}

.cierre-orden-cliente {
  color: #123a66;
  font-size: 0.96rem;
  flex: 1;
  min-width: 0;
}

.cierre-orden-referencia {
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(79, 179, 224, 0.12);
  color: #1d6d99;
  font-size: 0.72rem;
  font-weight: 700;
}

.cierre-orden-monto {
  font-weight: 800;
  color: #0f9f5c;
  font-size: 1.12rem;
}

.cierre-orden-info {
  display: grid;
  grid-template-columns: repeat(3, minmax(120px, 1fr));
  gap: 12px;
}

.cierre-orden-cliente-wrap,
.cierre-orden-estado-wrap,
.cierre-orden-pago-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cierre-orden-estado,
.cierre-orden-pago {
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: capitalize;
}

.cierre-orden-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 0.8rem;
  color: #6d829c;
  border-top: 1px solid #edf3f8;
  padding-top: 10px;
}

.mini-btn {
  border: 1px solid #a9d8ee;
  background: #edf9ff;
  color: #123a66;
  border-radius: 10px;
  padding: 7px 10px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
}

.mini-btn:hover {
  background: #ddecf9;
}

.movimientos-cierre-panel {
  margin-top: 18px;
  background: linear-gradient(180deg, #f8fbff 0%, #eef6ff 100%);
  border: 1px solid #dfeaf5;
  border-radius: 16px;
  padding: 16px;
}

.movimientos-cierre-panel-superior {
  margin-top: 12px;
  padding: 12px;
  border-radius: 12px;
}

.movimientos-cierre-panel-superior .movimientos-header {
  margin-bottom: 8px;
}

.movimientos-cierre-panel-superior .movimientos-lista {
  max-height: 150px;
  gap: 6px;
}

.movimientos-cierre-panel-superior .movimiento-fila {
  padding: 7px 9px;
  border-radius: 9px;
}

.movimientos-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.modal-titulo.small {
  margin: 0;
  font-size: 1rem;
}

.movimientos-lista {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 260px;
  overflow-y: auto;
}

.movimiento-fila {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid #e1ebf5;
  border-radius: 12px;
  padding: 10px 12px;
}

.movimiento-main {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
}

.movimiento-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 78px;
  padding: 6px 8px;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.tipo-cierre { background: rgba(79, 179, 224, 0.14); color: #0d5b7a; }
.tipo-gasto { background: rgba(234, 88, 12, 0.12); color: #b45309; }
.tipo-deposito { background: rgba(16, 185, 129, 0.12); color: #047857; }
.tipo-anticipo { background: rgba(59, 130, 246, 0.12); color: #1d4ed8; }
.tipo-venta { background: rgba(168, 85, 247, 0.12); color: #7c3aed; }

.movimiento-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 2px;
}

.movimiento-info strong {
  color: #123a66;
  font-size: 0.88rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.movimiento-info small {
  color: #6d829c;
}

.movimiento-monto {
  font-weight: 800;
  font-size: 0.92rem;
  white-space: nowrap;
}

.movimiento-monto.positivo { color: #0f9f5c; }
.movimiento-monto.negativo { color: #c2410c; }

.modal-orden-cierre-contenido {
  --ion-background-color: #ffffff;
  --ion-text-color: #0a1f38;
  width: min(760px, calc(100vw - 24px));
  max-height: min(760px, calc(100dvh - 24px)); /* antes tenía "height" fijo además de max-height */
  border-radius: 18px;
  box-shadow: 0 20px 44px rgba(10, 31, 56, 0.22);
  box-sizing: border-box;
  overflow: hidden;
  color: #0a1f38;
  background: #ffffff;
}

.modal-orden-cierre::part(content) {
  --background: #ffffff;
  background: #ffffff;
  width: min(760px, calc(100vw - 24px));
  max-height: min(760px, calc(100dvh - 24px)); /* antes tenía "height" fijo además */
  border-radius: 18px;
}

.detalle-orden-cierre-card {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 10px 0 0;
}

.detalle-orden-cierre-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.detalle-orden-cierre-badge {
  display: inline-flex;
  align-items: center;
  padding: 7px 12px;
  border-radius: 999px;
  background: linear-gradient(135deg, #0f172a, #123a66);
  color: #ffffff;
  font-weight: 800;
}

.detalle-orden-cierre-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(180px, 1fr));
  gap: 14px;
}

.detalle-orden-cierre-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px;
  border: 1px solid #e7edf5;
  border-radius: 14px;
  background: linear-gradient(180deg, #ffffff 0%, #f9fbff 100%);
}

.detalle-orden-cierre-movimientos {
  flex: 0 0 auto;
  margin-top: 2px;
  padding: 16px;
  border: 1px solid #dfeaf5;
  border-radius: 14px;
  background: #ffffff;
}

.detalle-orden-cierre-seccion-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #edf3f8;
}

.detalle-orden-cierre-seccion-header .modal-subtitulo {
  margin-top: 3px;
}

.detalle-orden-cierre-movimientos-lista {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 12px;
}

.detalle-orden-cierre-movimiento {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 11px 12px;
  border: 1px solid #e7edf5;
  border-radius: 11px;
  background: #f9fbff;
  color: #0a1f38;
}

.detalle-orden-cierre-movimiento-bullet {
  display: grid;
  flex: 0 0 24px;
  width: 24px;
  height: 24px;
  place-items: center;
  border-radius: 50%;
  background: #e3f5ec;
  color: #0f9f5c;
  font-weight: 800;
}

.detalle-orden-cierre-movimiento-info {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 3px;
}

.detalle-orden-cierre-movimiento-info strong {
  color: #123a66;
  font-size: 0.9rem;
  overflow-wrap: anywhere;
}

.detalle-orden-cierre-movimiento-info span {
  color: #6d829c;
  font-size: 0.78rem;
}

.detalle-orden-cierre-movimientos-vacio {
  margin: 0;
  padding: 16px 0 2px;
  color: #6d829c;
  font-size: 0.85rem;
}

@media (max-width: 760px) {
  .modal-orden-cierre-contenido,
  .modal-orden-cierre::part(content) {
    width: 100vw;
    height: 100dvh;
    max-height: 100dvh;
    border-radius: 0;
  }

  .cierre-resumen-grid,
  .cierre-orden-info,
  .detalle-orden-cierre-grid {
    grid-template-columns: 1fr;
  }

  .cierre-orden-footer {
    align-items: flex-start;
    flex-direction: column;
  }
}
@media (max-width: 760px) {
  .modal-cierres-contenido {
    width: 100vw;
    height: 100dvh;
    max-height: 100dvh;
    margin: 0;
    border-radius: 0;
  }

  .cierres-filtro-fechas {
    grid-template-columns: 1fr;
  }
}

.estado-pendiente {
  color: #d97706;
}

.estado-en_proceso {
  color: #4fb3e0;
}

.estado-listo {
  color: #16a34a;
}

.estado-entregado {
  color: #16a34a;
}

.estado-cerrada {
  color: #6b7280;
}

.estado-cancelada {
  color: #dc2626;
}

.pago-porCobrar {
  color: #d97706;
}

.pago-anticipo {
  color: #4fb3e0;
}

.pago-pagado {
  color: #16a34a;
}
.gasto-tipo-preview {
  margin: -4px 0 4px;
  font-size: 0.82rem;
  color: #124c63;
  font-weight: 700;
}

.gasto-tipo-preview strong {
  color: #124c63;
}

.gasto-cierre-tipo {
  display: inline-block;
  margin-bottom: 3px;
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba(220, 38, 38, 0.10);
  color: #b42318;
  font-weight: 800;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

/* Estilos para el sistema de notificaciones y problemas */
.banner-perfil-notificaciones {
  position: absolute;
  top: 12px;
  right: 24px;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 8px;
}

.banner-perfil-notificaciones-compacto {
  position: absolute;
  top: 8px;
  right: 16px;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 6px;
}

.banner-notificacion-icono {
  position: relative;
}

.notificacion-icono-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  background: rgba(79, 179, 224, 0.15);
  border: 1px solid rgba(79, 179, 224, 0.3);
  border-radius: 8px;
  color: #4fb3e0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.notificacion-icono-btn:hover {
  background: rgba(79, 179, 224, 0.25);
  border-color: rgba(79, 179, 224, 0.5);
}

.whatsapp-launch-btn {
  background: rgba(37, 211, 102, 0.16);
  border-color: rgba(37, 211, 102, 0.36);
  color: #25d366;
}

.whatsapp-launch-btn:hover {
  background: rgba(37, 211, 102, 0.26);
  border-color: rgba(37, 211, 102, 0.58);
}

.facebook-launch-btn {
  background: rgba(8, 102, 255, 0.16);
  border-color: rgba(8, 102, 255, 0.36);
  color: #4d8dff;
}

.facebook-launch-btn:hover {
  background: rgba(8, 102, 255, 0.26);
  border-color: rgba(8, 102, 255, 0.58);
}

.notificacion-icono-btn:disabled {
  cursor: not-allowed;
  opacity: 0.42;
  transform: none;
}

.notificacion-icono-btn:disabled:hover {
  background: rgba(79, 179, 224, 0.10);
  border-color: rgba(79, 179, 224, 0.22);
}

.whatsapp-launch-btn:disabled {
  background: rgba(37, 211, 102, 0.10);
  border-color: rgba(37, 211, 102, 0.22);
  color: rgba(37, 211, 102, 0.5);
}

.facebook-launch-btn:disabled {
  background: rgba(8, 102, 255, 0.10);
  border-color: rgba(8, 102, 255, 0.22);
  color: rgba(8, 102, 255, 0.5);
}

.notificacion-icono-btn ion-icon {
  font-size: 18px;
}

.notificacion-burbuja-pequena {
  position: absolute;
  top: -4px;
  right: -4px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 14px;
  height: 14px;
  padding: 0 4px;
  background: #dc2626;
  color: white;
  border-radius: 7px;
  font-size: 9px;
  font-weight: 700;
  border: 2px solid var(--app-shell-color, #08101c);
}

.banner-btn-notificacion-container {
  position: relative;
}

.banner-btn-notificacion {
  position: relative;
}

.notificacion-burbuja {
  position: absolute;
  top: -6px;
  right: -6px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: #dc2626;
  color: white;
  border-radius: 9px;
  font-size: 11px;
  font-weight: 700;
  border: 2px solid var(--app-shell-color, #08101c);
}

.notificacion-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 200px;
  background: rgba(8, 16, 28, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(79, 179, 224, 0.3);
  border-radius: 12px;
  padding: 8px 0;
  z-index: 1000;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.notificacion-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 16px;
  background: transparent;
  border: none;
  color: #a9d8ee;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.notificacion-menu-item:hover {
  background: rgba(79, 179, 224, 0.15);
  color: #4fb3e0;
}

.notificacion-menu-item-peligro {
  color: #f7a6a6;
}

.notificacion-menu-item-peligro:hover {
  background: rgba(220, 38, 38, 0.16);
  color: #fecaca;
}

.notificacion-menu-item ion-icon {
  font-size: 18px;
}

.notificacion-menu-burbuja {
  margin-left: auto;
  padding: 2px 8px;
  background: #dc2626;
  color: white;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 700;
}

/* Estilos para modales de notificaciones y problemas */
.modal-problema-compacto {
  --width: 500px;
  --height: auto;
}

.modal-problemas-grande,
.modal-notificaciones-grande {
  --width: min(760px, 94vw);
  --height: auto;
  --max-height: 84vh;
}

.modal-aviso-compacto {
  --width: min(640px, 94vw);
  --height: auto;
}

.modal-aviso-contenido {
  max-height: 85vh;
  overflow-y: auto;
}

.aviso-html-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 8px 0 12px;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  justify-content: space-between;
}

.html-toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-width: 32px;
  height: 32px;
  padding: 4px 8px;
  background: white;
  border: 1px solid #ccc;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.html-toolbar-btn:hover {
  background: #e8f4fd;
  border-color: #4fb3e0;
  transform: translateY(-1px);
}

.html-toolbar-btn:active {
  transform: translateY(0);
}

.color-btn {
  min-width: auto;
  padding: 4px 8px;
}

.color-picker-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-width: 32px;
  height: 32px;
  padding: 4px 8px;
  background: white;
  border: 1px solid #ccc;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.color-picker-wrapper:hover {
  background: #e8f4fd;
  border-color: #4fb3e0;
  transform: translateY(-1px);
}

.color-picker-input {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  padding: 0;
  background: transparent;
}

.color-picker-input::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-picker-input::-webkit-color-swatch {
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.color-square {
  display: block;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.2);
}

.aviso-preview {
  margin-top: 16px;
  padding: 12px;
  background: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.aviso-editor-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 8px;
}

.aviso-editor-column {
  display: flex;
  flex-direction: column;
}

.aviso-preview-column {
  display: flex;
  flex-direction: column;
}

.modal-textarea-grande {
  min-height: 200px;
  resize: vertical;
}

.preview-label {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
}

.preview-content {
  padding: 8px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-height: 40px;
  word-wrap: break-word;
}

.preview-content-grande {
  flex: 1;
  min-height: 200px;
  max-height: 300px;
  overflow-y: auto;
}

.modal-aviso-inicial {
  --width: min(460px, 92vw);
  --height: auto;
}

ion-modal.modal-shell::part(content) {
  position: relative;
  inset: auto;
  margin: auto;
  overflow: hidden;
  border-radius: 18px;
  transform: none;
}

ion-modal.modal-problema-compacto::part(content),
ion-modal.modal-aviso-compacto::part(content) {
  width: min(560px, 94vw);
  height: auto;
  max-height: 88vh;
}

ion-modal.modal-problemas-grande::part(content),
ion-modal.modal-notificaciones-grande::part(content) {
  width: min(760px, 94vw);
  height: auto;
  max-height: 84vh;
}

ion-modal.modal-aviso-inicial::part(content) {
  width: min(460px, 92vw);
  height: auto;
  max-height: 88vh;
}

.modal-aviso-inicial-contenido {
  padding: 0;
  display: flex;
  flex-direction: column;
  max-height: 85vh;
}

.modal-aviso-inicial-contenido > .modal-header {
  position: sticky;
  top: 0;
  z-index: 2;
  padding: 22px 24px 18px;
  background: #ffffff;
  border-bottom: 1px solid #e5ebf1;
}

.modal-aviso-inicial-contenido .modal-header-icon {
  background: #e7f4fa;
  color: #12617d;
}

.aviso-inicial-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  position: relative;
}

.aviso-inicial-mensaje-container {
  max-height: 45vh;
  overflow-y: auto;
  margin: 16px 0 12px;
  padding-right: 8px;
}

.aviso-inicial-mensaje-container::-webkit-scrollbar {
  width: 6px;
}

.aviso-inicial-mensaje-container::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}

.aviso-inicial-mensaje-container::-webkit-scrollbar-thumb {
  background: rgba(18, 58, 102, 0.3);
  border-radius: 3px;
}

.aviso-inicial-mensaje-container::-webkit-scrollbar-thumb:hover {
  background: rgba(18, 58, 102, 0.5);
}

.aviso-inicial-mensaje {
  margin: 0;
  color: #27394a !important;
  font-size: 16px;
  line-height: 1.55;
  white-space: pre-wrap;
}

.aviso-inicial-fecha {
  display: block;
  color: #718396 !important;
  font-size: 12px;
  margin-top: 8px;
}

.aviso-inicial-autor {
  display: block;
  color: #718396 !important;
  font-size: 12px;
  font-style: italic;
  margin: 8px 0;
}

.aviso-inicial-botones {
  display: flex;
  gap: 12px;
  padding: 16px 24px 20px;
  border-top: 1px solid #e5ebf1;
  background: #ffffff;
}

.aviso-inicial-boton {
  flex: 1;
  margin-top: 0;
}

.modal-problemas-contenido,
.modal-notificaciones-contenido {
  height: auto;
  max-height: 84vh;
  overflow-y: auto;
  padding: 0;
}

.modal-problemas-contenido > .modal-header,
.modal-notificaciones-contenido > .modal-header {
  position: sticky;
  top: 0;
  z-index: 2;
  padding: 22px 24px 18px;
  background: #ffffff;
  border-bottom: 1px solid #e5ebf1;
}

.modal-fondo-blanco {
  background: white !important;
  color: black !important;
}

.modal-fondo-blanco .modal-titulo,
.modal-fondo-blanco .modal-subtitulo,
.modal-fondo-blanco .modal-label,
.modal-fondo-blanco strong,
.modal-fondo-blanco p,
.modal-fondo-blanco span,
.modal-fondo-blanco .notificacion-titulo,
.modal-fondo-blanco .notificacion-mensaje,
.modal-fondo-blanco .problema-usuario,
.modal-fondo-blanco .problema-detalle p,
.modal-fondo-blanco .detalle-label {
  color: black !important;
}

.modal-fondo-blanco .modal-header-icon,
.modal-fondo-blanco .notificacion-tipo-icon,
.modal-fondo-blanco ion-icon {
  color: #124c63 !important;
}

.modal-fondo-blanco .modal-input-text,
.modal-fondo-blanco .modal-textarea {
  background: white !important;
  border: 1px solid #ccc !important;
  color: black !important;
}

.modal-fondo-blanco .modal-input-text:focus,
.modal-fondo-blanco .modal-textarea:focus {
  border-color: #124c63 !important;
  background: #f9f9f9 !important;
}

.modal-fondo-blanco .problema-item,
.modal-fondo-blanco .notificacion-item {
  background: #f5f5f5 !important;
  border-color: #ddd !important;
}

.modal-fondo-blanco .notificacion-item.no-leida {
  background: #e8f4fd !important;
  border-color: #4fb3e0 !important;
}

@media (max-width: 760px) {
  ion-modal.modal-problema-compacto::part(content),
  ion-modal.modal-problemas-grande::part(content),
  ion-modal.modal-notificaciones-grande::part(content),
  ion-modal.modal-aviso-compacto::part(content),
  ion-modal.modal-aviso-inicial::part(content) {
    width: calc(100vw - 24px);
    max-height: calc(100dvh - 24px);
    border-radius: 16px;
  }

  .modal-problemas-contenido > .modal-header,
  .modal-notificaciones-contenido > .modal-header,
  .modal-aviso-inicial-contenido > .modal-header {
    padding: 18px 16px 14px;
  }

  .problemas-contenido,
  .notificaciones-contenido,
  .aviso-inicial-body {
    padding: 14px 16px 20px;
  }

  .aviso-inicial-botones {
    padding: 14px 16px 18px;
  }

  .aviso-html-toolbar {
    gap: 4px;
    padding: 6px;
  }

  .html-toolbar-btn {
    min-width: 28px;
    height: 28px;
    font-size: 12px;
  }

  .color-btn {
    min-width: auto;
    padding: 4px 6px;
  }

  .color-square {
    width: 16px;
    height: 16px;
  }

  .aviso-editor-container {
    flex-direction: column;
    gap: 12px;
  }

  .modal-textarea-grande {
    min-height: 150px;
  }

  .preview-content-grande {
    min-height: 150px;
    max-height: 200px;
  }
}

/* Estilos para lista de problemas */
.problemas-contenido {
  padding: 20px 24px 28px;
  background: #f6f8fb;
}

.problemas-vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 16px;
  color: #6b7280;
}

.problemas-vacio-icon {
  font-size: 48px;
  color: #4b5563;
}

.problemas-vacio-texto {
  margin: 0;
  font-size: 16px;
  color: #6b7280;
}

.problemas-lista {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.problema-item {
  padding: 18px 20px;
  background: #ffffff;
  border: 1px solid #e1e7ef;
  border-radius: 10px;
  box-shadow: 0 4px 14px rgba(15, 35, 55, 0.06);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.problema-item:hover {
  border-color: #92c9e1;
  box-shadow: 0 7px 20px rgba(15, 35, 55, 0.1);
}

.problema-pendiente {
  border-left: 4px solid #d97706;
}

.problema-en_proceso {
  border-left: 4px solid #4fb3e0;
}

.problema-resuelto {
  border-left: 4px solid #16a34a;
  opacity: 0.7;
}

.problema-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.problema-info {
  display: flex;
  gap: 12px;
  align-items: center;
}

.problema-usuario {
  font-weight: 600;
  color: #123f54;
}

.problema-fecha {
  font-size: 12px;
  color: #6b7280;
}

.problema-estado {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.estado-pendiente {
  background: rgba(217, 119, 6, 0.2);
  color: #d97706;
}

.estado-en_proceso {
  background: rgba(79, 179, 224, 0.2);
  color: #4fb3e0;
}

.estado-resuelto {
  background: rgba(22, 163, 74, 0.2);
  color: #16a34a;
}

.problema-detalle {
  margin-bottom: 8px;
  font-size: 14px;
  color: #27394a;
}

.problema-detalle .detalle-label {
  color: #6b7280;
  font-size: 12px;
  margin-right: 8px;
}

.problema-detalle p {
  margin: 4px 0 0;
  color: #4b6070;
  line-height: 1.5;
  white-space: pre-wrap;
}

.problema-acciones {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.problema-accion-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.problema-accion-proceso {
  background: rgba(79, 179, 224, 0.2);
  color: #4fb3e0;
}

.problema-accion-proceso:hover {
  background: rgba(79, 179, 224, 0.3);
}

.problema-accion-resolver {
  background: rgba(22, 163, 74, 0.2);
  color: #16a34a;
}

.problema-accion-resolver:hover {
  background: rgba(22, 163, 74, 0.3);
}

.problema-accion-funciona {
  background: #e8f7ef;
  color: #167044;
}

.problema-accion-funciona:hover:not(:disabled) {
  background: #d4f0df;
}

.problema-accion-btn:disabled {
  cursor: wait;
  opacity: 0.6;
}

.problema-resuelto-info {
  font-size: 12px;
  color: #16a34a;
  font-weight: 600;
}

/* Estilos para notificaciones */
.notificaciones-contenido {
  padding: 16px;
  position: relative;
}

/* Marca de agua de iconos de lavandería */
.lavanderia-watermark {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.watermark-icon {
  position: absolute;
  opacity: 0.08;
  font-size: 80px;
  color: #124c63;
}

.watermark-icon-1 {
  top: 10%;
  left: 5%;
  transform: rotate(-15deg);
}

.watermark-icon-2 {
  top: 20%;
  right: 10%;
  transform: rotate(20deg);
}

.watermark-icon-3 {
  top: 50%;
  left: 15%;
  transform: rotate(-10deg);
}

.watermark-icon-4 {
  top: 60%;
  right: 5%;
  transform: rotate(15deg);
}

.watermark-icon-5 {
  bottom: 20%;
  left: 30%;
  transform: rotate(-5deg);
}

.watermark-icon-6 {
  bottom: 15%;
  right: 25%;
  transform: rotate(10deg);
}

/* Asegurar que el contenido esté por encima de la marca de agua */
.notificaciones-lista,
.notificaciones-vacio,
.aviso-inicial-mensaje-container,
.aviso-editor-column {
  position: relative;
  z-index: 1;
}

/* Estilos específicos para marca de agua en aviso */
.aviso-watermark .watermark-icon-1 {
  top: 5%;
  left: 3%;
  transform: rotate(-10deg);
  font-size: 60px;
}

.aviso-watermark .watermark-icon-2 {
  top: 15%;
  right: 5%;
  transform: rotate(15deg);
  font-size: 70px;
}

.aviso-watermark .watermark-icon-3 {
  bottom: 10%;
  left: 8%;
  transform: rotate(-5deg);
  font-size: 65px;
}

@media (max-width: 520px) {
  .problema-header,
  .problema-acciones {
    align-items: flex-start;
    flex-wrap: wrap;
  }
}

.notificaciones-vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 16px;
  color: #6b7280;
}

.notificaciones-vacio-icon {
  font-size: 48px;
  color: #4b5563;
}

.notificaciones-vacio-texto {
  margin: 0;
  font-size: 16px;
  color: #6b7280;
}

.notificaciones-lista {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notificacion-item {
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(79, 179, 224, 0.2);
  border-radius: 12px;
  transition: all 0.2s ease;
}

.notificacion-item.no-leida {
  background: rgba(79, 179, 224, 0.1);
  border-color: rgba(79, 179, 224, 0.4);
}

.notificacion-item.tipo-success {
  border-left: 4px solid #16a34a;
}

.notificacion-item.tipo-warning {
  border-left: 4px solid #d97706;
}

.notificacion-item.tipo-error {
  border-left: 4px solid #dc2626;
}

.notificacion-item.tipo-info {
  border-left: 4px solid #4fb3e0;
}

.notificacion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.notificacion-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.notificacion-tipo-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
}

.icono-success {
  background: rgba(22, 163, 74, 0.2);
  color: #16a34a;
}

.icono-warning {
  background: rgba(217, 119, 6, 0.2);
  color: #d97706;
}

.icono-error {
  background: rgba(220, 38, 38, 0.2);
  color: #dc2626;
}

.icono-info {
  background: rgba(79, 179, 224, 0.2);
  color: #4fb3e0;
}

.notificacion-titulo {
  font-size: 15px;
  font-weight: 600;
  color: #a9d8ee;
}

.notificacion-fecha {
  font-size: 12px;
  color: #6b7280;
}

.notificacion-mensaje {
  margin: 8px 0;
  font-size: 14px;
  color: #d1d5db;
  line-height: 1.5;
}

.notificacion-autor {
  margin: 4px 0 8px 0;
  font-size: 12px;
  color: #9ca3af;
  font-style: italic;
}

.notificacion-acciones {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.notificacion-marcar-leida {
  padding: 6px 12px;
  background: rgba(79, 179, 224, 0.2);
  color: #4fb3e0;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.notificacion-marcar-leida:hover {
  background: rgba(79, 179, 224, 0.3);
}

.notificacion-editar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.notificacion-editar:hover {
  background: rgba(59, 130, 246, 0.3);
}

.notificacion-eliminar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  background: rgba(220, 38, 38, 0.2);
  color: #dc2626;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.notificacion-eliminar:hover {
  background: rgba(220, 38, 38, 0.3);
}

.modal-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-accion-secundaria {
  padding: 8px 16px;
  background: rgba(79, 179, 224, 0.2);
  color: #4fb3e0;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.modal-accion-secundaria:hover {
  background: rgba(79, 179, 224, 0.3);
}

.modal-input-text {
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(79, 179, 224, 0.3);
  border-radius: 8px;
  color: #d1d5db;
  font-size: 14px;
  transition: all 0.2s ease;
}

.modal-input-text:focus {
  outline: none;
  border-color: #4fb3e0;
  background: rgba(255, 255, 255, 0.08);
}

.modal-input-text:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.modal-actualizacion {
  --width: min(420px, 92vw);
}

.actualizacion-cuerpo {
  min-height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 0;
}

.actualizacion-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: #4a627e;
  text-align: center;
}

.actualizacion-spinner ion-spinner {
  width: 34px;
  height: 34px;
  color: #4fb3e0;
}

.actualizacion-info {
  color: #27394a;
  text-align: center;
  margin: 0;
}

.actualizacion-version-actual {
  width: 100%;
  margin: 14px 0 0;
  color: #718396 !important;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
}

.actualizacion-progreso {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.actualizacion-barra {
  width: 100%;
  height: 10px;
  border-radius: 999px;
  background: rgba(18, 58, 102, 0.12);
  overflow: hidden;
}

.actualizacion-barra-relleno {
  height: 100%;
  background: linear-gradient(90deg, #4fb3e0, #123a66);
  border-radius: 999px;
  transition: width 0.25s ease;
}

.actualizacion-progreso p {
  margin: 0;
  font-weight: 800;
  color: #123a66;
}
</style>
