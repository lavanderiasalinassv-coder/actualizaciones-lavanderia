<template>
  <AppShell>
    <div class="home-page">
    <div class="home-banner-mobile">
      <div class="home-banner-mobile-top">
        <div class="home-banner-mobile-logo">
          <img :src="logoActual" alt="Lavandería Salinas" />
        </div>
        <div class="home-banner-mobile-actions">
          <div class="home-banner-mobile-notificaciones-container">
            <button
              class="home-banner-mobile-notificaciones"
              type="button"
              title="Notificaciones"
              aria-label="Notificaciones"
              @click="abrirMenuNotificaciones"
            >
              <ion-icon :icon="notificationsOutline" />
              <span v-if="totalNotificacionesNoLeidas > 0" class="notificaciones-badge">
                {{ totalNotificacionesNoLeidas }}
              </span>
            </button>
            <div v-if="mostrarMenuNotificaciones" class="notificacion-menu">
              <button class="notificacion-menu-item" @click="abrirModalNotificaciones">
                <ion-icon :icon="notificationsOutline" />
                <span>{{ esModoDesarrollador ? 'Historial de avisos' : 'Notificaciones' }}</span>
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
              <button v-if="esModoDesarrollador" class="notificacion-menu-item" @click="abrirHistorialAvisos">
                <ion-icon :icon="listOutline" />
                <span>Mis avisos enviados</span>
              </button>
              <button v-if="esAdministrador && !esModoDesarrollador" class="notificacion-menu-item" @click="abrirHistorialAvisos">
                <ion-icon :icon="listOutline" />
                <span>Mis avisos enviados</span>
              </button>
              <button v-if="esAdministrador || esModoDesarrollador" class="notificacion-menu-item" @click="abrirModalAviso">
                <ion-icon :icon="megaphoneOutline" />
                <span>Enviar aviso</span>
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
          <button
            class="home-banner-mobile-user"
            type="button"
            title="Editar mi perfil"
            aria-label="Editar mi perfil"
            @click="abrirModalPerfil"
          >
            <img v-if="esDesarrollador" :src="imagenDesarrollador" :alt="`Foto de ${nombreUsuario}`" />
            <img v-else-if="imagenPerfil" :src="imagenPerfil" :alt="`Foto de ${nombreUsuario}`" />
            <ion-icon v-else :icon="personCircleOutline" />
          </button>
        </div>
      </div>
      <div class="home-banner-mobile-saludo">
        <p class="saludo-texto">{{ saludoHora }}</p>
        <p class="saludo-nombre">{{ nombreUsuario }}</p>
      </div>
      <div class="home-banner-mobile-reloj">
        <span class="reloj-hora">{{ horaActual }}</span>
        <span class="reloj-fecha">{{ fechaCorta }}</span>
      </div>

      <button
        class="home-banner-mobile-recargar"
        type="button"
        title="Recargar la app"
        aria-label="Recargar la app"
        :disabled="recargandoApp"
        @click="recargarApp"
      >
        <ion-icon :icon="refreshOutline" :class="{ girando: recargandoApp }" />
      </button>
    </div>

    <div class="home-body">
      <!-- ───────────── Alerta de turno antiguo abierto ───────────── -->
      <div v-if="alertaTurnoAntiguo" class="alerta-turno-antiguo">
        <div class="alerta-turno-icono">
          <ion-icon :icon="warningOutline" />
        </div>
        <div class="alerta-turno-contenido">
          <p class="alerta-turno-titulo">⚠️ Caja sin cerrar</p>
          <p class="alerta-turno-mensaje">{{ alertaTurnoAntiguo }}</p>
        </div>
        <button class="alerta-turno-cerrar" @click="alertaTurnoAntiguo = ''">
          <ion-icon :icon="closeOutline" />
        </button>
      </div>

      <!-- ───────────── Sucursal ───────────── -->
      <div class="config-card sucursal-card">
        <div class="config-card-header">
          <span class="config-card-label">Vista de sucursal</span>
            <ion-icon :icon="addOutline" />
        </div>
        <div class="sucursal-select">
          <ion-icon :icon="locationOutline" class="sucursal-pin" />
          <select v-model="sucursalActiva" class="sucursal-native">
            <option v-for="s in sucursales" :key="s" :value="s">{{ s }}</option>
          </select>
          <ion-icon :icon="chevronDownOutline" class="sucursal-caret" />
        </div>
      </div>

      <div v-if="!esAdministrador" class="config-card asistencia-card">
        <div class="card-header-row">
          <span class="card-title">
            <ion-icon :icon="timeOutline" />
            Mi entrada de hoy
          </span>
          <button class="config-add-btn" @click="irA('/tabs/horarios')" title="Ver calendario">
            <ion-icon :icon="calendarClearOutline" />
          </button>
        </div>

        <div v-if="!empleadoActivo" class="estado-vacio-mini">
          No encontramos tu perfil activo en equipo.
        </div>
        <template v-else>
          <div class="toggle-fila asistencia-unica">
            <span class="asistencia-icono">
              <ion-icon :icon="asistenciaActiva ? checkmarkCircleOutline : timeOutline" />
            </span>
            <div class="toggle-texto">
              <span>{{ etiquetaAsistencia }}</span>
              <small>{{ detalleAsistencia }}</small>
            </div>
            <label class="switch">
              <input
                type="checkbox"
                :checked="asistenciaActiva"
                :disabled="asistenciaBloqueada"
                @change="onToggleAsistencia(($event.target as HTMLInputElement).checked)"
              />
              <span class="switch-riel"></span>
            </label>
          </div>
          <span v-if="accesoOperativoBloqueado && usuarioActual" class="turno-finalizado-mensaje">
            Tu turno ha finalizado
          </span>
        </template>
      </div>

      <!-- ───────────── Accesos rápidos + Tareas ───────────── -->
      <div class="home-grid-row">
        <div class="accesos-card">
          <div class="accesos-grid">
            <button
              v-for="a in accesos"
              :key="a.route"
              class="acceso-item"
              :class="{ destacado: a.destacado, active: route.path === a.route }"
              :style="{ '--acceso-color': a.color }"
              :disabled="
                !esAdministrador &&
                funcionesBloqueadas &&
                a.route !== '/tabs/horarios'
              "
              :title="
                !esAdministrador &&
                funcionesBloqueadas &&
                a.route !== '/tabs/calendario' &&
                a.route !== '/tabs/horarios'
                  ? 'Activa tu turno para continuar'
                  : undefined
              "
              @click="irA(a.route)"
            >
              <span class="acceso-icono">
                <ion-icon :icon="a.icon" />
              </span>
              <span class="acceso-label">{{ a.label }}</span>
            </button>
          </div>

        </div>

        <div class="tareas-card" :class="{ 'usuario-scroll': !esAdministrador }">
          <div class="tareas-header">
            <span class="tareas-title">
              <ion-icon :icon="createOutline" />
              tareas
            </span>
            <button v-if="esAdministrador" class="tareas-btn" :disabled="funcionesBloqueadas" @click="irA('/tabs/tareas')">
              <ion-icon :icon="checkmarkCircleOutline" />
              Administrar tareas
            </button>
          </div>

          <div v-if="tareasPrincipales.length === 0" class="tareas-vacio">
            <ion-icon :icon="listOutline" class="tareas-vacio-icon" />
            <p class="tareas-vacio-titulo">No hay tareas para mostrar</p>
          </div>

          <ul v-else class="tareas-lista">
            <li v-for="t in tareasPrincipales" :key="t.id" class="tarea-item" :class="{ bloqueada: funcionesBloqueadas }" @click="abrirModalTarea(t)">
              <label class="tarea-check">
                <input type="checkbox" :checked="t.completada" :disabled="funcionesBloqueadas" @click.stop @change="alternarCompletada(t.id)" />
                <span></span>
              </label>
              <div class="tarea-info">
                <span class="tarea-texto" :class="{ hecha: t.completada }">
                  {{ t.emoji }} {{ t.titulo }}
                </span>
                <small>{{ t.asignadaANombre }}</small>
              </div>
              <button class="tarea-detalle-btn" type="button" :disabled="funcionesBloqueadas" @click.stop="abrirModalTarea(t)">
                Ver
              </button>
            </li>
          </ul>
          <p v-if="esAdministrador && tareasVisibles.length > tareasPrincipales.length" class="tareas-extra">
            +{{ tareasVisibles.length - tareasPrincipales.length }} tareas más en la página de tareas
          </p>
        </div>
      </div>
    </div>

    <div
      v-if="!esAdministrador"
      class="asistencia-flotante"
      :title="`${etiquetaAsistencia} - ${detalleAsistencia}`"
    >
      <span class="sr-only">{{ etiquetaAsistencia }} - {{ detalleAsistencia }}</span>
      <label class="switch switch-asistencia" :aria-label="etiquetaAsistencia">
        <input
          type="checkbox"
          :checked="asistenciaActiva"
          :disabled="asistenciaBloqueada"
          @change="onToggleAsistencia(($event.target as HTMLInputElement).checked)"
        />
        <span class="switch-riel"></span>
      </label>
    </div>

    <ion-modal :is-open="mostrarModalGasto" class="modal-home" @didDismiss="mostrarModalGasto = false">
      <div class="modal-contenido">
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

        <label class="modal-label">Motivo</label>
        <textarea v-model="motivoGasto" class="modal-textarea" placeholder="Ej: compra de detergente"></textarea>

        <div class="modal-botones">
          <ion-button class="btn-fantasma" @click="mostrarModalGasto = false">Cancelar</ion-button>
          <ion-button class="btn-primario" @click="mostrarModalGasto = false">Guardar gasto</ion-button>
        </div>
      </div>
    </ion-modal>

    <ion-modal :is-open="mostrarModalTarea" class="modal-home" @didDismiss="cerrarModalTarea">
      <div class="modal-contenido modal-tarea-contenido">
        <div class="modal-header">
          <div class="modal-header-left">
            <div class="modal-header-icon">
              <ion-icon :icon="createOutline" />
            </div>
            <div>
              <p class="modal-titulo">Detalle de tarea</p>
              <p class="modal-subtitulo">Revisa y completa sin salir de inicio</p>
            </div>
          </div>
          <button class="modal-cerrar" type="button" aria-label="Cerrar detalle de tarea" @click="cerrarModalTarea">
            <ion-icon :icon="closeOutline" />
          </button>
        </div>

        <div v-if="tareaSeleccionada" class="modal-tarea-cuerpo">
          <div class="tarea-modal-hero">
            <span class="tarea-modal-emoji">{{ tareaSeleccionada.emoji }}</span>
            <div>
              <p class="tarea-modal-titulo">{{ tareaSeleccionada.titulo }}</p>
              <p class="tarea-modal-meta">Asignada a: {{ tareaSeleccionada.asignadaANombre }}</p>
            </div>
          </div>

          <div class="tarea-modal-bloque">
            <span class="modal-label">Descripción</span>
            <p class="tarea-modal-descripcion">
              {{ tareaSeleccionada.descripcion || 'Sin descripción.' }}
            </p>
          </div>

          <div class="tarea-modal-bloque">
            <span class="modal-label">Nota al completar</span>
            <textarea
              v-model="notaCierreTarea"
              class="modal-textarea"
              placeholder="Escribe una nota opcional para dejar contexto al equipo"
            ></textarea>
          </div>

          <div class="modal-botones tarea-modal-botones">
            <ion-button class="btn-fantasma" @click="cerrarModalTarea">Cerrar</ion-button>
            <ion-button
              class="btn-primario"
              :disabled="tareaSeleccionada.completada || guardandoTarea || funcionesBloqueadas"
              @click="completarTareaDesdeModal"
            >
              {{ tareaSeleccionada.completada ? 'Tarea completada' : (guardandoTarea ? 'Completando...' : 'Completar tarea') }}
            </ion-button>
          </div>
        </div>
      </div>
    </ion-modal>

    <ion-modal :is-open="mostrarModalPerfil" class="modal-home" @didDismiss="cerrarModalPerfil">
      <div class="modal-contenido modal-perfil-contenido">
        <div class="modal-header">
          <div class="modal-header-left">
            <div>
              <p class="modal-titulo">Mi perfil</p>
              <p class="modal-subtitulo">Puedes actualizar tu información personal.</p>
              <p class="modal-fecha-miembro">Miembro desde {{ fechaMiembro }}</p>
            </div>
          </div>
          <button class="modal-cerrar" type="button" aria-label="Cerrar perfil" @click="cerrarModalPerfil">
            <ion-icon :icon="closeOutline" />
          </button>
        </div>

        <div class="perfil-imagen-editor">
          <div class="perfil-imagen-preview">
            <img v-if="esDesarrollador" :src="imagenDesarrollador" :alt="`Foto de ${nombreUsuario}`" />
            <img v-else-if="imagenPerfil" :src="imagenPerfil" :alt="`Foto de ${nombreUsuario}`" />
            <ion-icon v-else :icon="personOutline" />
          </div>
          <div v-if="!esDesarrollador" class="perfil-imagen-acciones">
            <div class="perfil-imagen-botones">
              <label class="btn-foto-perfil" :class="{ deshabilitado: cambiosImagenPerfil >= 2 || subiendoImagen }">
                <ion-icon :icon="cameraOutline" />
                {{ subiendoImagen ? 'Subiendo...' : 'Cambiar foto' }}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  hidden
                  :disabled="cambiosImagenPerfil >= 2 || subiendoImagen"
                  @change="seleccionarImagenPerfil"
                />
              </label>
              <button
                v-if="imagenPerfil"
                class="btn-eliminar-foto"
                type="button"
                :disabled="cambiosImagenPerfil >= 2 || subiendoImagen"
                @click="eliminarImagenPerfil"
              >
                Eliminar foto
              </button>
            </div>
            <small>{{ cambiosImagenPerfil >= 2 ? 'Límite de 2 cambios alcanzado.' : `Puedes cambiarla ${2 - cambiosImagenPerfil} vez${2 - cambiosImagenPerfil === 1 ? '' : 'es'} más.` }}</small>
          </div>
          <div v-else class="perfil-imagen-acciones">
            <small>La foto de perfil del desarrollador no se puede cambiar.</small>
          </div>
        </div>

        <label class="modal-label" for="perfil-nombre">Nombre</label>
        <input id="perfil-nombre" v-model="perfilForm.nombre" class="modal-input-texto" type="text" maxlength="80" :disabled="esDesarrollador" />

        <div v-if="!esDesarrollador">
          <label class="modal-label" for="perfil-pin">Nuevo PIN de acceso</label>
          <input id="perfil-pin" v-model="perfilForm.codigo" class="modal-input-texto" type="password" inputmode="numeric" maxlength="6" placeholder="6 dígitos" />

          <label class="modal-label" for="perfil-pin-confirmacion">Confirmar nuevo PIN</label>
          <input id="perfil-pin-confirmacion" v-model="perfilForm.confirmacion" class="modal-input-texto" type="password" inputmode="numeric" maxlength="6" placeholder="Repite el PIN" />
        </div>
        <div v-else class="perfil-desarrollador-info">
          <small>El PIN del desarrollador no se puede cambiar desde la aplicación.</small>
        </div>

        <p v-if="perfilError" class="perfil-error">{{ perfilError }}</p>

        <div class="modal-botones">
          <ion-button class="btn-fantasma" @click="cerrarModalPerfil">Cancelar</ion-button>
          <ion-button class="btn-primario" :disabled="guardandoPerfil" @click="guardarPerfil">
            {{ guardandoPerfil ? 'Guardando...' : 'Guardar cambios' }}
          </ion-button>
        </div>
      </div>
    </ion-modal>

    <!-- Modal de notificaciones -->
    <ion-modal :is-open="mostrarModalNotificaciones" class="modal-shell modal-notificaciones-grande" @didDismiss="mostrarModalNotificaciones = false">
      <div class="modal-contenido modal-notificaciones-contenido modal-fondo-blanco">
        <div class="modal-header">
          <div class="modal-header-left">
            <div class="modal-header-icon">
              <ion-icon :icon="shirtOutline" />
            </div>
            <div>
              <p class="modal-titulo">{{ esModoDesarrollador || mostrandoHistorialAvisos ? 'Historial de avisos enviados' : 'Notificaciones' }}</p>
              <p class="modal-subtitulo">{{ esModoDesarrollador || mostrandoHistorialAvisos ? 'Edita o elimina cada aviso de forma individual' : `${notificacionesNoLeidas.length} notificaciones sin leer` }}</p>
            </div>
          </div>
          <div class="modal-header-right">
            <button 
              v-if="!esModoDesarrollador && !mostrandoHistorialAvisos && notificacionesNoLeidas.length > 0"
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
                    <ion-icon :icon="notificacion.tipo === 'success' ? checkmarkCircleOutline : notificationsOutline" />
                  </span>
                  <strong class="notificacion-titulo">{{ notificacion.titulo }}</strong>
                </div>
                <span class="notificacion-fecha">{{ new Date(notificacion.fecha).toLocaleDateString('es-ES') }}</span>
              </div>

              <p class="notificacion-mensaje" v-html="notificacion.mensaje" @click="manejarClickImagen($event)"></p>
              <div v-if="notificacion.imagenUrl" class="notificacion-imagen-container" @click="abrirModalImagenGrande(notificacion.imagenUrl)">
                <img :src="notificacion.imagenUrl" alt="Imagen del aviso" class="notificacion-imagen" />
                <div class="notificacion-imagen-lupa">
                  <ion-icon :icon="expandOutline" />
                </div>
              </div>
              <div class="notificacion-footer">
                <p v-if="notificacion.autorNombre" class="notificacion-autor">Enviado por: {{ notificacion.autorNombre }}</p>
                <button v-if="notificacion.imagenUrl || tieneImagenEnMensaje(notificacion.mensaje)" class="btn-ampliar-imagen" @click="ampliarPrimeraImagen(notificacion)">
                  <ion-icon :icon="expandOutline" />
                  Ampliar imagen
                </button>
              </div>

              <div class="notificacion-acciones">
                <button
                  v-if="!esModoDesarrollador && !mostrandoHistorialAvisos && !notificacion.leida"
                  class="notificacion-marcar-leida"
                  @click="marcarNotificacionLeida(notificacion.id)"
                >
                  Marcar como leída
                </button>
                <button
                  v-if="puedeGestionarAviso(notificacion)"
                  class="notificacion-editar"
                  @click="editarAvisoIndividual(notificacion)"
                >
                  <ion-icon :icon="createOutline" />
                </button>
                <button
                  v-if="puedeGestionarAviso(notificacion)"
                  class="notificacion-eliminar"
                  @click="eliminarNotificacionIndividual(notificacion.id)"
                >
                  <ion-icon :icon="closeOutline" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ion-modal>

    <!-- Modal de reportar problema -->
    <ion-modal :is-open="mostrarModalReportarProblema" class="modal-shell modal-problema-reportar" @didDismiss="mostrarModalReportarProblema = false">
      <div class="modal-contenido modal-problema-reportar-contenido">
        <div class="modal-header">
          <div class="modal-header-left">
            <div class="modal-header-icon modal-header-icon-problema">
              <ion-icon :icon="documentTextOutline" />
            </div>
            <div>
              <p class="modal-titulo">Reportar problema</p>
              <p class="modal-subtitulo">Describe el problema que encontraste</p>
            </div>
          </div>
          <button class="modal-cerrar" @click="mostrarModalReportarProblema = false">
            <ion-icon :icon="closeOutline" />
          </button>
        </div>

        <label class="modal-label">Tema del problema</label>
        <input v-model="temaProblema" class="modal-input-texto modal-input-moderno" type="text" placeholder="Ej: Error en el sistema" />

        <label class="modal-label">Detalles</label>
        <textarea v-model="detallesProblema" class="modal-textarea modal-textarea-moderna" placeholder="Describe el problema en detalle"></textarea>

        <div class="modal-botones">
          <ion-button class="btn-fantasma" @click="mostrarModalReportarProblema = false">Cancelar</ion-button>
          <ion-button class="btn-primario" :disabled="!temaProblema.trim() || !detallesProblema.trim() || enviandoProblema" @click="enviarProblema">
            {{ enviandoProblema ? 'Enviando...' : 'Enviar reporte' }}
          </ion-button>
        </div>
      </div>
    </ion-modal>

    <!-- Modal de lista de problemas -->
    <ion-modal :is-open="mostrarModalListaProblemas" class="modal-shell modal-problemas-grande" @didDismiss="mostrarModalListaProblemas = false">
      <div class="modal-contenido modal-problemas-contenido">
        <div class="modal-header">
          <div class="modal-header-left">
            <div class="modal-header-icon">
              <ion-icon :icon="listOutline" />
            </div>
            <div>
              <p class="modal-titulo">{{ esModoDesarrollador ? 'Lista de problemas' : 'Mis reportes' }}</p>
              <p class="modal-subtitulo">{{ problemasPendientes.length }} pendientes</p>
            </div>
          </div>
          <button class="modal-cerrar" @click="mostrarModalListaProblemas = false">
            <ion-icon :icon="closeOutline" />
          </button>
        </div>

        <div v-if="problemasPendientes.length === 0" class="problemas-vacio">
          <ion-icon :icon="checkmarkCircleOutline" class="problemas-vacio-icon" />
          <p class="problemas-vacio-texto">No hay problemas pendientes</p>
        </div>

        <div v-else class="problemas-lista">
          <div v-for="problema in problemasPendientes" :key="problema.id" class="problema-item">
            <div class="problema-header">
              <strong class="problema-tema">{{ problema.tema }}</strong>
              <span class="problema-fecha">{{ new Date(problema.fechaCreacion).toLocaleDateString('es-ES') }}</span>
            </div>
            <p class="problema-detalles">{{ problema.detalles }}</p>
            <div class="problema-acciones">
              <button v-if="esModoDesarrollador" class="problema-accion" @click="cambiarEstadoProblema(problema.id, 'resuelto')">
                Marcar como resuelto
              </button>
              <button class="problema-accion problema-eliminar" @click="eliminarProblema(problema.id)">
                {{ esModoDesarrollador ? 'Eliminar' : 'Eliminar reporte' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ion-modal>

    <!-- Modal de enviar aviso -->
    <ion-modal :is-open="mostrarModalAviso" class="modal-shell modal-aviso-grande" @didDismiss="mostrarModalAviso = false">
      <div class="modal-contenido modal-aviso-contenido modal-fondo-blanco">
        <div class="modal-header">
          <div class="modal-header-left">
            <div class="modal-header-icon">
              <ion-icon :icon="megaphoneOutline" />
            </div>
            <div>
              <p class="modal-titulo">Enviar aviso</p>
              <p class="modal-subtitulo">Comunica algo importante al equipo</p>
            </div>
          </div>
          <button class="modal-cerrar" @click="mostrarModalAviso = false">
            <ion-icon :icon="closeOutline" />
          </button>
        </div>

        <label class="modal-label">Título</label>
        <input v-model="tituloAviso" class="modal-input-texto" type="text" placeholder="Ej: Mantenimiento programado" />

        <label class="modal-label">Destinatario</label>
        <select v-model="destinatarioAviso" class="modal-input-select">
          <option value="todos">Todos los usuarios</option>
          <option value="administrador">Solo administradores</option>
          <option value="recepcionista">Solo recepcionistas</option>
          <option value="cajero">Solo cajeros</option>
          <option value="operador">Solo operadores</option>
          <option value="individual">Usuario específico</option>
        </select>
        <select v-if="destinatarioAviso === 'individual'" v-model="destinatarioAvisoId" class="modal-input-select">
          <option value="" disabled>Selecciona un usuario</option>
          <option v-for="usuario in usuariosDestinatarios" :key="usuario.id" :value="usuario.id">
            {{ usuario.nombre }} ({{ usuario.rol }})
          </option>
        </select>

        <label class="modal-label">Mensaje</label>
        <div class="aviso-editor-container">
          <div class="aviso-html-toolbar">
            <button type="button" class="html-toolbar-btn" @click="insertarHtmlTag('strong')" title="Texto en negrita">
              <strong>B</strong>
            </button>
            <button type="button" style="color: black;" class="html-toolbar-btn" @click="insertarHtmlTag('em')" title="Texto en cursiva">
              <em>K</em>
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
            <button type="button" style="color: black;" class="html-toolbar-btn" @click="insertarLista('bullet')" title="Puntos iniciales">
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
            <button type="button" class="html-toolbar-btn imagen-btn" @click="abrirModalImagenAviso" title="Agregar imagen desde URL">
              <ion-icon :icon="imageOutline" />
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
          <div class="preview-content preview-content-grande" v-html="mensajeAviso" @click="eliminarImagenPreview"></div>
        </div>

        <div class="modal-botones">
          <ion-button class="btn-fantasma" @click="mostrarModalAviso = false">Cancelar</ion-button>
          <ion-button class="btn-primario" :disabled="!tituloAviso.trim() || !mensajeAviso.trim() || (destinatarioAviso === 'individual' && !destinatarioAvisoId) || enviandoAviso" @click="enviarAvisoDesdeModal">
            {{ enviandoAviso ? 'Enviando...' : 'Enviar aviso' }}
          </ion-button>
        </div>
      </div>
    </ion-modal>

    <!-- Modal de imagen URL -->
    <ion-modal :is-open="mostrarModalImagenAviso" class="modal-shell modal-imagen-url" @didDismiss="mostrarModalImagenAviso = false">
      <div class="modal-contenido modal-imagen-url-contenido modal-fondo-blanco">
        <div class="modal-header">
          <div class="modal-header-left">
            <div class="modal-header-icon">
              <ion-icon :icon="imageOutline" />
            </div>
            <div>
              <p class="modal-titulo">Agregar imagen</p>
              <p class="modal-subtitulo">Pega la URL de la imagen</p>
            </div>
          </div>
          <button class="modal-cerrar" @click="mostrarModalImagenAviso = false">
            <ion-icon :icon="closeOutline" />
          </button>
        </div>

        <label class="modal-label">URL de la imagen</label>
        <input 
          v-model="imagenAvisoUrl" 
          class="modal-input-texto" 
          type="url" 
          placeholder="https://ejemplo.com/imagen.jpg" 
        />
        
        <div v-if="imagenAvisoUrl" class="imagen-url-preview">
          <img :src="imagenAvisoUrl" alt="Vista previa" class="imagen-url-preview-img" />
          <button type="button" class="imagen-url-preview-eliminar" @click="imagenAvisoUrl = ''">
            <ion-icon :icon="closeOutline" />
          </button>
        </div>

        <div class="modal-botones">
          <ion-button class="btn-fantasma" @click="mostrarModalImagenAviso = false">Cancelar</ion-button>
          <ion-button class="btn-primario" :disabled="!imagenAvisoUrl.trim()" @click="confirmarImagenAviso">
            Agregar imagen
          </ion-button>
        </div>
      </div>
    </ion-modal>

    <!-- Modal de imagen grande -->
    <ion-modal :is-open="mostrarModalImagenGrande" class="modal-shell modal-imagen-grande" @didDismiss="mostrarModalImagenGrande = false">
      <div class="modal-contenido modal-imagen-grande-contenido">
        <button class="modal-cerrar-imagen-grande" @click="mostrarModalImagenGrande = false">
          <ion-icon :icon="closeOutline" />
        </button>
        <img :src="imagenGrandeUrl" alt="Imagen en grande" class="imagen-grande" />
      </div>
    </ion-modal>

  </div>
  </AppShell>
</template>

<script setup lang="ts">
import { IonButton, IonIcon, IonModal, onIonViewWillEnter, toastController } from '@ionic/vue'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import { useSesion } from '@/composables/useSesion'
import { useHorarios } from '@/composables/Usehorarios'
import { useTareas, type TareaAsignada } from '@/composables/useTareas'
import { useTurno } from '@/composables/useTurno'
import { useApariencia } from '@/composables/useApariencia'
import { combinarFechaHoraCentroamerica, formatearFechaCentroamerica } from '@/composables/useFechas'
import logo from '@/assets/logo.png'
import imagenDesarrollador from '@/assets/perfilprogramador.png'
import { useAccesoOperativo } from '@/composables/useAccesoOperativo'
import { editarUsuarioEquipo } from '@/composables/useEquipo'
import { subirImagenPerfil } from '@/composables/useCloudinary'
import { useNotificaciones } from '@/composables/useNotificaciones'
import {
  addOutline,
  archiveOutline,
  businessOutline,
  calendarClearOutline,
  checkmarkCircleOutline,
  cartOutline,
  chevronDownOutline,
  closeOutline,
  cutOutline,
  createOutline,
  cubeOutline,
  documentTextOutline,
  ellipseOutline,
  homeOutline,
  locationOutline,
  listOutline,
  peopleOutline,
  pricetagOutline,
  receiptOutline,
  settingsOutline,
  shieldCheckmarkOutline,
  shirtOutline,
  squareOutline,
  statsChartOutline,
  timeOutline,
  personOutline,
  personCircleOutline,
  cameraOutline,
  calendarOutline,
  refreshOutline,
  notificationsOutline,
  bodyOutline,
  warningOutline,
  imageOutline,
  manOutline,
  womanOutline,
  megaphoneOutline,
  trashOutline,
  expandOutline,
} from 'ionicons/icons'

const route = useRoute()
const router = useRouter()
const navegando = ref(false)
const { turno, cargarTurno, verificarTurnosAntiguosAbiertos } = useTurno()
const rutasQueRequierenTurno = new Set(['/tabs/home', '/tabs/ordenes'])
const mostrarAvisoTurno = ref(false)
const avisoCierreProximoMostrado = ref(false)
const alertaTurnoAntiguo = ref('')
const { empleadoActivo, asistenciaActiva, accesoOperativoBloqueado, funcionesBloqueadas } = useAccesoOperativo()

const { apariencia } = useApariencia()
const logoActual = computed(() => apariencia.appShellImagen || logo)
const recargandoApp = ref(false)

const recargarApp = () => {
  if (recargandoApp.value) return
  recargandoApp.value = true
  // Fuerza recarga completa evitando la caché del navegador
  window.location.reload()
}

const mostrarAvisoTurnoRequerido = async () => {
  // No mostrar aviso visual, solo toast
  const toast = await toastController.create({
    message: 'Debes iniciar un turno en Caja y Reportes para acceder a esta sección.',
    duration: 4500,
    position: 'top',
    color: 'warning'
  })
  await toast.present()
}

const mostrarAvisoTurnoTerminado = async () => {
  const toast = await toastController.create({
    message: 'Tu turno ha finalizado',
    duration: 4500,
    position: 'top',
    color: 'warning'
  })
  await toast.present()
}

const mostrarAvisoCierreProximo = async () => {
  const toast = await toastController.create({
    message: 'Tu turno se cerrará en 5 minutos',
    duration: 4500,
    position: 'top',
    color: 'warning'
  })
  await toast.present()
}

const mostrarAvisoDesdeRuta = () => {
  if (route.query.aviso !== 'turno-requerido' && route.query.aviso !== 'turno-terminado') return

  // Los administradores no necesitan ver avisos de turno
  if (esAdministrador.value) {
    const query = { ...route.query }
    delete query.aviso
    void router.replace({ query }).catch(() => {})
    return
  }

  const query = { ...route.query }
  delete query.aviso
  void router.replace({ query }).catch(() => {})
  void (route.query.aviso === 'turno-terminado'
    ? mostrarAvisoTurnoTerminado()
    : mostrarAvisoTurnoRequerido())
}

onIonViewWillEnter(mostrarAvisoDesdeRuta)
watch(() => route.query.aviso, (aviso) => {
  if (aviso === 'turno-requerido' || aviso === 'turno-terminado') mostrarAvisoDesdeRuta()
})
watch(() => turno.abierto, (abierto) => {
  if (abierto) mostrarAvisoTurno.value = false
})

const irA = async (r: string) => {
  if (navegando.value) return

  // Para la página de venta (home), todos necesitan turno abierto
  if (r === '/tabs/home' && !turno.abierto) {
    const turnoActual = await cargarTurno()
    if (!turnoActual?.abierto) {
      void mostrarAvisoTurnoRequerido()
      return
    }
  }

  const rutasSinRestriccionDeTurno = new Set([
    '/tabs/calendario',
    '/tabs/horarios'
  ])

  if (
    !esAdministrador.value &&
    funcionesBloqueadas.value &&
    !rutasSinRestriccionDeTurno.has(r)
  ) {
    void mostrarAvisoTurnoTerminado()
    return
  }

  if (rutasQueRequierenTurno.has(r) && !esOperador.value && !esAdministrador.value) {
    if (!turno.abierto) {
      const turnoActual = await cargarTurno()
      if (!turnoActual?.abierto) {
        void mostrarAvisoTurnoRequerido()
        return
      }
    }
  }

  navegando.value = true
  await router.replace(r).catch(() => {})
  navegando.value = false
}

const ahora = ref(new Date())
let relojId: any = null

onMounted(() => {
  relojId = setInterval(() => {
    ahora.value = new Date()
    if (empleadoActivo.value) {
      verificarAutoSalida(empleadoActivo.value.id, ahora.value)
    }
    const turnoProgramado = turnoDeHoy.value
    if (!empleadoActivo.value || !turnoProgramado || turnoProgramado.libre || turnoProgramado.horasExtra) {
      avisoCierreProximoMostrado.value = false
      return
    }
    const finDelTurno = combinarFechaHoraCentroamerica(turnoProgramado.fecha, turnoProgramado.horaFin).getTime()
    const faltanCincoMinutos = ahora.value.getTime() >= finDelTurno - 5 * 60 * 1000 && ahora.value.getTime() < finDelTurno
    if (faltanCincoMinutos && !avisoCierreProximoMostrado.value) {
      avisoCierreProximoMostrado.value = true
      void mostrarAvisoCierreProximo()
    } else if (ahora.value.getTime() < finDelTurno - 5 * 60 * 1000) {
      avisoCierreProximoMostrado.value = false
    }
  }, 1000)
  
  // Verificar si hay turnos antiguos abiertos
  verificarTurnosAntiguosAbiertos().then(resultado => {
    if (resultado.tieneTurnoAntiguoAbierto) {
      alertaTurnoAntiguo.value = resultado.mensaje
    }
  })
})

onUnmounted(() => {
  if (relojId) clearInterval(relojId)
})

const fechaLarga = computed(() =>
  ahora.value.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) +
  ' a las ' +
  ahora.value.toLocaleTimeString('es-ES', { hour: 'numeric', minute: '2-digit', hour12: true })
)

const horaActual = computed(() =>
  ahora.value.toLocaleTimeString('es-ES', { hour: 'numeric', minute: '2-digit', hour12: true })
)

/* ───────────── Encabezado móvil (saludo / reloj) ───────────── */
const saludoHora = computed(() => {
  const h = ahora.value.getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
})

// Ajusta "usuarioActual.nombre" al campo real que exponga tu useSesion()
const nombreUsuario = computed(() => (usuarioActual as any)?.value?.nombre || 'Usuario')

const fechaCorta = computed(() =>
  ahora.value.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
)

/* ───────────── Sucursal ───────────── */
const sucursales = ['Ahuachapán']
const sucursalActiva = ref(sucursales[0])

const agregarSucursal = () => {
  // Aquí se abrirá el flujo de creación de sucursal
}

type RolAcceso = 'administrador' | 'recepcionista' | 'cajero' | 'operador'

type AccesoDirecto = {
  route: string
  label: string
  icon: string
  color: string          // ← nuevo
  destacado?: boolean
  roles: RolAcceso[]
}

const { usuarioActual, esAdministrador, esOperador, rol, recargarSesion } = useSesion()

const esDesarrollador = computed(() => usuarioActual.value?.nombre === 'Desarrollador')

// Lógica de notificaciones
const {
  notificacionesUsuario,
  notificacionesNoLeidas,
  totalNotificacionesNoLeidas,
  cargarNotificaciones,
  cargarAvisosEnviados,
  cargarUsuariosDestinatarios,
  marcarNotificacionLeida,
  marcarTodasNotificacionesLeidas,
  eliminarNotificacion,
  esModoDesarrollador,
  problemasPendientes,
  usuariosDestinatarios,
  reportarProblema,
  enviarAviso,
  editarAviso,
  cambiarEstadoProblema,
  eliminarProblema,
  limpiarNotificaciones
} = useNotificaciones()

const mostrarModalNotificaciones = ref(false)
const mostrandoHistorialAvisos = ref(false)
const mostrarMenuNotificaciones = ref(false)
const mostrarModalReportarProblema = ref(false)
const mostrarModalListaProblemas = ref(false)
const mostrarModalAviso = ref(false)
const insigniaNotificacionesOculta = ref(false)
const tituloAviso = ref('')
const mensajeAviso = ref('')
const destinatarioAviso = ref('todos')
const destinatarioAvisoId = ref('')
const imagenAvisoUrl = ref('')
const mostrarModalImagenAviso = ref(false)
const imagenGrandeUrl = ref('')
const mostrarModalImagenGrande = ref(false)
const enviandoAviso = ref(false)

const abrirMenuNotificaciones = () => {
  insigniaNotificacionesOculta.value = true
  mostrarMenuNotificaciones.value = !mostrarMenuNotificaciones.value
}

const abrirModalNotificaciones = async () => {
  mostrandoHistorialAvisos.value = false
  await cargarNotificaciones(true)
  mostrarModalNotificaciones.value = true
  mostrarMenuNotificaciones.value = false
}

const abrirHistorialAvisos = async () => {
  mostrandoHistorialAvisos.value = true
  await cargarAvisosEnviados()
  mostrarModalNotificaciones.value = true
  mostrarMenuNotificaciones.value = false
}

const abrirModalAviso = async () => {
  try {
    await cargarUsuariosDestinatarios()
  } catch (error) {
    console.error('No se pudo cargar el listado de destinatarios:', error)
  }
  mostrarModalAviso.value = true
  mostrarMenuNotificaciones.value = false
}

const puedeGestionarAviso = (notificacion: typeof notificacionesUsuario.value[number]) => {
  if (esModoDesarrollador.value) return true
  if (!esAdministrador.value) return false
  return String(notificacion.autorId ?? '') === String(usuarioActual.value?.id ?? '')
}

const editarAvisoIndividual = async (notificacion: typeof notificacionesUsuario.value[number]) => {
  const titulo = window.prompt('Título del aviso:', notificacion.titulo)
  if (titulo === null || !titulo.trim()) return
  const mensaje = window.prompt('Mensaje del aviso:', notificacion.mensaje)
  if (mensaje === null || !mensaje.trim()) return
  const imagenUrl = window.prompt('URL de la imagen (opcional):', notificacion.imagenUrl || '')
  
  // Validar URL si se proporciona
  if (imagenUrl && imagenUrl.trim()) {
    try {
      new URL(imagenUrl.trim())
    } catch {
      window.alert('La URL de la imagen no es válida.')
      return
    }
  }

  try {
    await editarAviso(
      notificacion.id,
      titulo.trim(),
      mensaje.trim(),
      notificacion.destinatarioRol || 'todos',
      notificacion.destinatarioId,
      imagenUrl.trim() || undefined
    )
  } catch (error) {
    window.alert(error instanceof Error ? error.message : 'No se pudo editar el aviso.')
  }
}

const eliminarNotificacionIndividual = async (notificacionId: string) => {
  if (!window.confirm('¿Confirmas que deseas eliminar este aviso?')) return
  try {
    await eliminarNotificacion(notificacionId)
  } catch (error) {
    window.alert(error instanceof Error ? error.message : 'No se pudo eliminar el aviso.')
  }
}

const enviarAvisoDesdeModal = async () => {
  if (!tituloAviso.value.trim() || !mensajeAviso.value.trim() || enviandoAviso.value) return
  enviandoAviso.value = true
  try {
    await enviarAviso(tituloAviso.value, mensajeAviso.value, destinatarioAviso.value, destinatarioAvisoId.value || undefined, imagenAvisoUrl.value || undefined)
    tituloAviso.value = ''
    mensajeAviso.value = ''
    destinatarioAviso.value = 'todos'
    destinatarioAvisoId.value = ''
    imagenAvisoUrl.value = ''
    mostrarModalAviso.value = false
  } catch (error) {
    window.alert(error instanceof Error ? error.message : 'No se pudo enviar el aviso.')
  } finally {
    enviandoAviso.value = false
  }
}

const abrirModalImagenAviso = () => {
  console.log('abrirModalImagenAviso llamado')
  mostrarModalImagenAviso.value = true
  console.log('mostrarModalImagenAviso.value:', mostrarModalImagenAviso.value)
}

const confirmarImagenAviso = () => {
  if (!imagenAvisoUrl.value.trim()) return
  // Insertar la etiqueta img en el mensaje
  const imgTag = `<img src="${imagenAvisoUrl.value}" alt="Imagen del aviso" style="max-width: 100%; border-radius: 12px; margin: 12px 0;" />`
  mensajeAviso.value += imgTag
  imagenAvisoUrl.value = ''
  mostrarModalImagenAviso.value = false
}

const eliminarImagenPreview = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (target.tagName === 'IMG') {
    if (window.confirm('¿Eliminar esta imagen del aviso?')) {
      target.remove()
      mensajeAviso.value = (document.getElementById('aviso-mensaje') as HTMLElement).innerHTML
    }
  }
}

const abrirModalImagenGrande = (url: string) => {
  imagenGrandeUrl.value = url
  mostrarModalImagenGrande.value = true
}

const manejarClickImagen = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (target.tagName === 'IMG' && target instanceof HTMLImageElement) {
    abrirModalImagenGrande(target.src)
  }
}

const tieneImagenEnMensaje = (mensaje: string) => {
  return mensaje.includes('<img')
}

const ampliarPrimeraImagen = (notificacion: typeof notificacionesUsuario.value[number]) => {
  // Primero revisar imagenUrl
  if (notificacion.imagenUrl) {
    abrirModalImagenGrande(notificacion.imagenUrl)
    return
  }
  
  // Si no, buscar en el mensaje HTML
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = notificacion.mensaje
  const img = tempDiv.querySelector('img')
  if (img && img.src) {
    abrirModalImagenGrande(img.src)
  }
}

const limpiarNotificacionesDesdeMenu = async () => {
  mostrarMenuNotificaciones.value = false
  if (!window.confirm('Se eliminarán todos los avisos y reportes de la tabla. ¿Deseas continuar?')) return

  try {
    await limpiarNotificaciones()
  } catch (error) {
    window.alert(error instanceof Error ? error.message : 'No se pudieron limpiar las notificaciones.')
  }
}

const mostrarModalPerfil = ref(false)
const guardandoPerfil = ref(false)
const subiendoImagen = ref(false)
const perfilError = ref('')
const perfilForm = ref({ nombre: '', codigo: '', confirmacion: '' })
const CODIGOS_PROHIBIDOS = ['123456', '592647']
const imagenPerfil = computed(() => usuarioActual.value?.imagenPerfil || '')
const cambiosImagenPerfil = computed(() => usuarioActual.value?.cambiosImagenPerfil ?? 0)
const fechaMiembro = computed(() => formatearFechaCentroamerica(
  usuarioActual.value?.creadoEn ?? usuarioActual.value?.created_at ?? null,
  { day: '2-digit', month: 'long', year: 'numeric' }
))

const abrirModalPerfil = () => {
  perfilForm.value = {
    nombre: usuarioActual.value?.nombre ?? '',
    codigo: '',
    confirmacion: ''
  }
  perfilError.value = ''
  mostrarModalPerfil.value = true
}

const cerrarModalPerfil = () => {
  if (guardandoPerfil.value) return
  mostrarModalPerfil.value = false
  perfilError.value = ''
}

watch(() => route.query.perfil, (perfil) => {
  if (perfil !== '1') return
  abrirModalPerfil()
  const query = { ...route.query }
  delete query.perfil
  void router.replace({ query }).catch(() => {})
}, { immediate: true })

const seleccionarImagenPerfil = async (evento: Event) => {
  const input = evento.target as HTMLInputElement
  const archivo = input.files?.[0]
  input.value = ''
  if (!archivo || subiendoImagen.value) return

  if (cambiosImagenPerfil.value >= 2) {
    perfilError.value = 'Ya utilizaste los 2 cambios permitidos para la foto de perfil.'
    return
  }
  if (!archivo.type.startsWith('image/')) {
    perfilError.value = 'Selecciona una imagen válida.'
    return
  }
  if (archivo.size > 5 * 1024 * 1024) {
    perfilError.value = 'La imagen no puede superar 5 MB.'
    return
  }
  if (!usuarioActual.value?.id) {
    perfilError.value = 'No se encontró el usuario de la sesión.'
    return
  }

  subiendoImagen.value = true
  perfilError.value = ''
  try {
    const actualizado = await subirImagenPerfil(usuarioActual.value.id, archivo)
    localStorage.setItem('usuario', JSON.stringify({
      ...usuarioActual.value,
      imagenPerfil: actualizado.imagenPerfil,
      cambiosImagenPerfil: actualizado.cambiosImagenPerfil ?? cambiosImagenPerfil.value + 1
    }))
    recargarSesion()
  } catch (error) {
    perfilError.value = error instanceof Error ? error.message : 'No se pudo actualizar la foto de perfil.'
  } finally {
    subiendoImagen.value = false
  }
}

const eliminarImagenPerfil = async () => {
  if (!usuarioActual.value?.id || !imagenPerfil.value || subiendoImagen.value) return
  if (cambiosImagenPerfil.value >= 2) {
    perfilError.value = 'Ya utilizaste los 2 cambios permitidos para la foto de perfil.'
    return
  }

  subiendoImagen.value = true
  perfilError.value = ''
  try {
    const actualizado = await editarUsuarioEquipo(usuarioActual.value.id, {
      imagenPerfil: null,
      cambiosImagenPerfil: cambiosImagenPerfil.value + 1
    })
    localStorage.setItem('usuario', JSON.stringify({
      ...usuarioActual.value,
      imagenPerfil: actualizado.imagenPerfil ?? null,
      cambiosImagenPerfil: actualizado.cambiosImagenPerfil ?? cambiosImagenPerfil.value + 1
    }))
    recargarSesion()
  } catch (error) {
    perfilError.value = error instanceof Error ? error.message : 'No se pudo eliminar la foto de perfil.'
  } finally {
    subiendoImagen.value = false
  }
}

const validarPerfil = () => {
  const nombre = perfilForm.value.nombre.trim()
  const codigo = perfilForm.value.codigo.trim()
  const confirmacion = perfilForm.value.confirmacion.trim()
  const quiereCambiarCodigo = Boolean(codigo || confirmacion)
  const cambioNombre = nombre !== (usuarioActual.value?.nombre ?? '').trim()

  if (!usuarioActual.value?.id) {
    perfilError.value = 'No se encontró el usuario de la sesión.'
    return false
  }

  // Restricciones para el desarrollador
  if (esDesarrollador.value) {
    if (cambioNombre) {
      perfilError.value = 'El nombre del desarrollador no se puede cambiar.'
      return false
    }
    if (quiereCambiarCodigo) {
      perfilError.value = 'El PIN del desarrollador no se puede cambiar desde la aplicación.'
      return false
    }
    perfilError.value = 'No se pueden realizar cambios al perfil del desarrollador.'
    return false
  }

  if (!nombre) {
    perfilError.value = 'El nombre es obligatorio.'
    return false
  }
  if (!cambioNombre && !quiereCambiarCodigo) {
    perfilError.value = 'Modifica el nombre o escribe un PIN nuevo.'
    return false
  }
  if (quiereCambiarCodigo) {
    if (!/^\d{6}$/.test(codigo)) {
      perfilError.value = 'El PIN debe contener exactamente 6 dígitos.'
      return false
    }
    if (CODIGOS_PROHIBIDOS.includes(codigo)) {
      perfilError.value = 'Elige un PIN diferente.'
      return false
    }
    if (!esAdministrador.value && codigo.startsWith('0')) {
      perfilError.value = 'El PIN no puede iniciar con 0 para este rol.'
      return false
    }
    if (codigo !== confirmacion) {
      perfilError.value = 'La confirmación del PIN no coincide.'
      return false
    }
  }

  perfilError.value = ''
  return true
}

const guardarPerfil = async () => {
  if (guardandoPerfil.value || !validarPerfil() || !usuarioActual.value?.id) return

  guardandoPerfil.value = true
  try {
    const nombre = perfilForm.value.nombre.trim()
    const codigo = perfilForm.value.codigo.trim()
    const cambios: Record<string, string> = {}
    if (nombre !== (usuarioActual.value.nombre ?? '').trim()) cambios.nombre = nombre
    if (codigo) cambios.codigo = codigo

    const actualizado = await editarUsuarioEquipo(usuarioActual.value.id, cambios)
    localStorage.setItem('usuario', JSON.stringify({
      ...usuarioActual.value,
      nombre: actualizado.nombre,
      codigo: actualizado.codigo,
      imagenPerfil: actualizado.imagenPerfil ?? usuarioActual.value.imagenPerfil,
      cambiosImagenPerfil: actualizado.cambiosImagenPerfil ?? usuarioActual.value.cambiosImagenPerfil
    }))
    recargarSesion()
    cerrarModalPerfil()
    const toast = await toastController.create({ message: 'Perfil actualizado correctamente.', duration: 2200, color: 'success', position: 'top' })
    await toast.present()
  } catch (error) {
    perfilError.value = error instanceof Error ? error.message : 'No se pudo actualizar el perfil.'
  } finally {
    guardandoPerfil.value = false
  }
}

const opcionesAcceso: AccesoDirecto[] = [
  { route: '/tabs/home', label: 'Vender', icon: cartOutline, color: '', destacado: true, roles: ['administrador', 'recepcionista', 'cajero'] },
  { route: '/tabs/ordenes', label: 'Órdenes', icon: documentTextOutline, color: '#2563eb', roles: ['administrador', 'recepcionista', 'cajero', 'operador'] },
  { route: '/tabs/reportes', label: 'Caja y Reportes', icon: statsChartOutline, color: '#0d9488', roles: ['administrador', 'cajero'] },
  { route: '/tabs/calendario', label: 'Calendario', icon: calendarOutline, color: '#0d5681', roles: [ 'administrador', 'recepcionista', 'cajero', 'operador'] },
  { route: '/tabs/clientes', label: 'Clientes', icon: peopleOutline, color: '#7c3aed', roles: ['administrador'] },
  { route: '/tabs/productos', label: 'Catálogo', icon: shirtOutline, color: '#c026d3', roles: ['administrador'] },
  { route: '/tabs/inventario', label: 'Inventario', icon: cubeOutline, color: '#ea580c', roles: ['administrador'] },
  { route: '/tabs/promociones', label: 'Promociones', icon: pricetagOutline, color: '#e11d48', roles: ['administrador'] },
  { route: '/tabs/facturas', label: 'Facturas', icon: receiptOutline, color: '#ca8a04', roles: ['administrador'] },
  { route: '/tabs/equipo', label: 'Usuarios y Rol', icon: personOutline, color: '#0891b2', roles: ['administrador'] },
  { route: '/tabs/horarios', label: 'Horarios', icon: calendarClearOutline, color: '#0284c7', roles: ['administrador', 'recepcionista', 'cajero', 'operador'] },
  { route: '/tabs/configuracion', label: 'Configuración', icon: settingsOutline, color: '#475569', roles: ['administrador', 'recepcionista', 'cajero', 'operador'] },
]

const accesos = computed<AccesoDirecto[]>(() => {
  const rolActual: RolAcceso = rol.value === 'admin' ? 'administrador' : (rol.value as RolAcceso)
  return opcionesAcceso.filter((opcion) => opcion.roles.includes(rolActual))
})

/* ───────────── Tareas ───────────── */
const {
  encontrarEmpleadoPara,
  registroDeHoy,
  entradaMarcada,
  salidaMarcada,
  registrarEntrada,
  registrarSalida,
  ventanaEntrada,
  turnoSigueVigente,
  turnoDeHoyDe,
  verificarAutoSalida,
  formatearHora,
  cargarHorarios,
  refrescarPersonal,
} = useHorarios()

const cargarDatosAsistencia = async () => {
  try {
    await Promise.all([cargarHorarios(), refrescarPersonal()])
  } catch (error) {
    console.error('Error al cargar los datos de asistencia:', error)
  }
}

onMounted(cargarDatosAsistencia)
onIonViewWillEnter(cargarDatosAsistencia)

const turnoDeHoy = computed(() =>
  empleadoActivo.value ? turnoDeHoyDe(empleadoActivo.value.id).value : null
)

const ventana = computed(() => ventanaEntrada(turnoDeHoy.value, ahora.value))
const asistenciaBloqueada = computed(() => {
  if (!empleadoActivo.value) return true
  if (entradaMarcada(empleadoActivo.value.id)) return false
  if (salidaMarcada(empleadoActivo.value.id) && turnoSigueVigente(turnoDeHoy.value, ahora.value)) return false
  return !ventana.value.puedeActivar
})
const etiquetaAsistencia = computed(() => {
  if (!empleadoActivo.value) return 'Asistencia'
  if (entradaMarcada(empleadoActivo.value.id)) return 'Marcar salida'
  if (salidaMarcada(empleadoActivo.value.id)) {
    return turnoSigueVigente(turnoDeHoy.value, ahora.value) ? 'Reanudar turno' : 'Salida registrada'
  }
  return 'Marcar entrada'
})
const detalleAsistencia = computed(() => {
  if (!empleadoActivo.value) return 'No hay sesión activa.'
  const r = registroDeHoy(empleadoActivo.value.id)
  if (entradaMarcada(empleadoActivo.value.id)) return `Entrada: ${formatearHora(r?.horaEntrada ?? null)}`
  if (salidaMarcada(empleadoActivo.value.id)) {
    return turnoSigueVigente(turnoDeHoy.value, ahora.value)
      ? 'Turno en pausa. Puedes volver a activarlo.'
      : `Salida: ${formatearHora(r?.horaSalida ?? null)}`
  }
  if (!ventana.value.puedeActivar) return ventana.value.motivo
  return turnoDeHoy.value
    ? `Turno de hoy: ${turnoDeHoy.value.horaInicio} - ${turnoDeHoy.value.horaFin}`
    : 'Sin turno programado para hoy.'
})
const onToggleAsistencia = (activo: boolean) => {
  if (!empleadoActivo.value) return
  if (activo) {
    if (entradaMarcada(empleadoActivo.value.id)) return
    if (salidaMarcada(empleadoActivo.value.id) && turnoSigueVigente(turnoDeHoy.value, ahora.value)) {
      registrarEntrada(empleadoActivo.value.id)
      return
    }
    if (!ventana.value.puedeActivar) return
    registrarEntrada(empleadoActivo.value.id)
    return
  }
  if (entradaMarcada(empleadoActivo.value.id) && !salidaMarcada(empleadoActivo.value.id)) {
    registrarSalida(empleadoActivo.value.id)
  }
}
const { tareasVisibles, alternarCompletada, completarTarea, cargarTareas } = useTareas()
const tareasPrincipales = computed(() =>
  esAdministrador.value ? tareasVisibles.value.slice(0, 4) : tareasVisibles.value
)

const mostrarModalTarea = ref(false)
const tareaSeleccionada = ref<TareaAsignada | null>(null)
const notaCierreTarea = ref('')
const guardandoTarea = ref(false)

const abrirModalTarea = (tarea: TareaAsignada) => {
  if (accesoOperativoBloqueado.value) {
    void mostrarAvisoTurnoTerminado()
    return
  }
  tareaSeleccionada.value = tarea
  notaCierreTarea.value = ''
  mostrarModalTarea.value = true
}

const cerrarModalTarea = () => {
  mostrarModalTarea.value = false
  tareaSeleccionada.value = null
  notaCierreTarea.value = ''
}

const completarTareaDesdeModal = async () => {
  if (funcionesBloqueadas.value || !tareaSeleccionada.value || tareaSeleccionada.value.completada) return

  guardandoTarea.value = true
  try {
    await completarTarea(tareaSeleccionada.value.id, true, notaCierreTarea.value)
    await cargarTareas()
    cerrarModalTarea()
  } catch (error) {
    const toast = await toastController.create({
      message: error instanceof Error ? error.message : 'No se pudo completar la tarea.',
      duration: 2500,
      color: 'danger',
      position: 'top'
    })
    await toast.present()
  } finally {
    guardandoTarea.value = false
  }
}

onIonViewWillEnter(() => {
  cargarTareas().catch(() => {})
})

/* ───────────── Modales banner ───────────── */
const mostrarModalGasto = ref(false)
const mostrarModalCierre = ref(false)
const mostrarModalDeposito = ref(false)
const montoGasto = ref(0)
const motivoGasto = ref('')

/* ───────────── Formularios notificaciones ───────────── */
const temaProblema = ref('')
const detallesProblema = ref('')
const enviandoProblema = ref(false)
const colorSeleccionado = ref('#000000')

const enviarProblema = async () => {
  if (!temaProblema.value.trim() || !detallesProblema.value.trim()) return

  enviandoProblema.value = true
  try {
    await reportarProblema(temaProblema.value, detallesProblema.value)
    mostrarModalReportarProblema.value = false
    temaProblema.value = ''
    detallesProblema.value = ''
    const toast = await toastController.create({
      message: 'Problema reportado correctamente.',
      duration: 2200,
      color: 'success',
      position: 'top'
    })
    await toast.present()
  } catch (error) {
    const toast = await toastController.create({
      message: error instanceof Error ? error.message : 'No se pudo reportar el problema.',
      duration: 2500,
      color: 'danger',
      position: 'top'
    })
    await toast.present()
  } finally {
    enviandoProblema.value = false
  }
}

const insertarHtmlTag = (tag: string) => {
  const textarea = document.getElementById('aviso-mensaje') as HTMLElement
  if (!textarea) return
  
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return
  
  const range = selection.getRangeAt(0)
  const selectedText = range.toString()
  
  const newElement = document.createElement(tag)
  newElement.textContent = selectedText || 'texto'
  
  range.deleteContents()
  range.insertNode(newElement)
  
  // Actualizar el mensaje
  mensajeAviso.value = textarea.innerHTML
}

const insertarEmoji = (emoji: string) => {
  const textarea = document.getElementById('aviso-mensaje') as HTMLElement
  if (!textarea) return
  
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return
  
  const range = selection.getRangeAt(0)
  const textNode = document.createTextNode(emoji)
  
  range.deleteContents()
  range.insertNode(textNode)
  
  mensajeAviso.value = textarea.innerHTML
}

const insertarLista = (tipo: string) => {
  const textarea = document.getElementById('aviso-mensaje') as HTMLElement
  if (!textarea) return
  
  const simbolo = tipo === 'bullet' ? '•' : (tipo === 'asterisk' ? '*' : '-')
  const textoLista = `\n${simbolo} Item 1\n${simbolo} Item 2\n${simbolo} Item 3`
  
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return
  
  const range = selection.getRangeAt(0)
  const textNode = document.createTextNode(textoLista)
  
  range.deleteContents()
  range.insertNode(textNode)
  
  mensajeAviso.value = textarea.innerHTML
}

const aplicarColor = () => {
  const textarea = document.getElementById('aviso-mensaje') as HTMLElement
  if (!textarea) return
  
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return
  
  const range = selection.getRangeAt(0)
  const selectedText = range.toString()
  
  if (!selectedText) return
  
  const span = document.createElement('span')
  span.style.color = colorSeleccionado.value
  span.textContent = selectedText
  
  range.deleteContents()
  range.insertNode(span)
  
  mensajeAviso.value = textarea.innerHTML
}
</script>

<style scoped>
.home-page {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding-bottom: 32px;
  color-scheme: light;
}

.alerta-turno-antiguo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #fff7ed, #ffedd5);
  border: 1.5px solid #fdba74;
  border-radius: 12px;
  color: #9a4d00;
}

.alerta-turno-icono {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: #fdba74;
  border-radius: 50%;
  flex-shrink: 0;
}

.alerta-turno-icono ion-icon {
  font-size: 1.2rem;
  color: #9a4d00;
}

.alerta-turno-contenido {
  flex: 1;
  min-width: 0;
}

.alerta-turno-titulo {
  margin: 0 0 4px;
  font-size: 0.9rem;
  font-weight: 700;
  color: #9a4d00;
}

.alerta-turno-mensaje {
  margin: 0;
  font-size: 0.85rem;
  color: #c2410c;
  line-height: 1.4;
}

.alerta-turno-cerrar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  border: none;
  border-radius: 50%;
  color: #9a4d00;
  cursor: pointer;
  transition: background 0.2s ease;
  flex-shrink: 0;
}

.alerta-turno-cerrar:hover {
  background: rgba(251, 186, 116, 0.3);
}

.alerta-turno-cerrar ion-icon {
  font-size: 1rem;
}
.home-banner-mobile {
  display: none;
}

.perfil-acceso-desktop {
  position: absolute;
  top: 18px;
  right: 22px;
  z-index: 3;
  width: 46px;
  height: 46px;
  padding: 0;
  border: 2px solid rgba(18, 58, 102, 0.18);
  border-radius: 50%;
  background: #ffffff;
  color: #123a66;
  box-shadow: 0 8px 18px rgba(10, 31, 56, 0.14);
  cursor: pointer;
}

.perfil-acceso img,
.home-banner-mobile-user img,
.modal-header-icon img,
.perfil-imagen-preview img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.perfil-acceso ion-icon {
  font-size: 1.45rem;
}

.perfil-imagen-editor {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 0 0 4px;
}

.perfil-imagen-preview {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 50%;
  background: #eef4f8;
  color: #123a66;
  font-size: 1.8rem;
}

.perfil-imagen-acciones {
  display: grid;
  gap: 4px;
}

.perfil-imagen-botones {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-foto-perfil {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  padding: 8px 10px;
  border-radius: 8px;
  background: #eef4f8;
  color: #123a66;
  font-size: 0.8rem;
  font-weight: 800;
  cursor: pointer;
}

.btn-foto-perfil.deshabilitado {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn-eliminar-foto {
  padding: 8px 10px;
  border: 1px solid rgba(185, 28, 28, 0.22);
  border-radius: 8px;
  background: #fff5f5;
  color: #b91c1c;
  font-size: 0.8rem;
  font-weight: 800;
  cursor: pointer;
}

.btn-eliminar-foto:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.perfil-imagen-acciones small {
  color: #6d829c;
  font-size: 0.75rem;
}
.modal-input-select{
  background-color: white;
  color: black;
  border-block-color: white;
}

.modal-header-icon {
  overflow: hidden;
}

.modal-header-icon img {
  display: block;
}

.aviso-turno-requerido {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border: 1px solid rgba(217, 119, 6, 0.24);
  border-radius: 16px;
  background: #fffaf0;
  color: #6b4a13;
}

.aviso-turno-requerido-copy {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
}

.aviso-turno-requerido-copy ion-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  color: #d97706;
}

.aviso-turno-requerido-copy div {
  display: grid;
  gap: 2px;
}

.aviso-turno-requerido-copy strong {
  color: #6b4a13;
  font-size: 0.92rem;
}

.aviso-turno-requerido-copy span {
  color: #876b3c;
  font-size: 0.84rem;
  line-height: 1.35;
}

.aviso-turno-requerido button {
  flex-shrink: 0;
  padding: 9px 13px;
  border: 1px solid rgba(217, 119, 6, 0.28);
  border-radius: 10px;
  background: #d97706;
  color: #ffffff;
  font-size: 0.82rem;
  font-weight: 800;
  cursor: pointer;
}

.aviso-turno-requerido button:hover {
  background: #b45309;
}

/* ── Banner (a todo el ancho, sin tarjeta) ── */
.home-banner {
  flex-shrink: 0;
  background: linear-gradient(160deg, #0a1f38 0%, #0d2b4e 55%, #123a66 100%);
  margin: -24px -28px 0;
  padding: 20px 28px 28px;
  color: #eaf4fa;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.banner-top-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.banner-brand {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  overflow: hidden;
  background: #ffffff;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.banner-logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.banner-breadcrumb {
  font-size: 0.95rem;
  font-weight: 700;
  color: #f5f9fc;
}

.banner-centro {
  text-align: center;
}

.banner-fecha {
  margin: 0;
  font-size: 0.9rem;
  color: #a9d8ee;
  font-weight: 600;
}

.banner-reloj {
  margin: 6px 0 0;
  font-size: 3.4rem;
  font-weight: 900;
  letter-spacing: -0.02em;
  color: #f5f9fc;
}

.banner-marca {
  margin: 0;
  font-size: 0.9rem;
  color: #cfe9f5;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.banner-acciones {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.modal-input-texto{
  background-color: white;
  color: black;
  border-block-color: white;
}

.banner-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 18px;
  border-radius: 12px;
  border: 1px solid rgba(169, 216, 238, 0.22);
  background: rgba(169, 216, 238, 0.10);
  color: #eaf4fa;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
}

.banner-btn ion-icon {
  font-size: 18px;
}

.banner-btn:hover {
  background: rgba(169, 216, 238, 0.18);
}

/* ── Cuerpo (con scroll propio, debajo del banner) ── */
.home-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 0;
}

/* ── Sucursal ── */
.config-card {
  background: #ffffff;
  border: 1px solid rgba(10, 31, 56, 0.08);
  border-radius: 16px;
  padding: 18px 20px;
  box-shadow: 0 4px 12px rgba(10, 31, 56, 0.05);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.asistencia-card {
  display: none;
}

.config-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.config-card-label {
  font-size: 0.78rem;
  font-weight: 800;
  color: #6d829c;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.config-add-btn {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: none;
  background: rgba(18, 58, 102, 0.08);
  color: #123a66;
  display: grid;
  place-items: center;
  cursor: pointer;
}

.asistencia-flotante {
  position: fixed;
  left: 16px;
  bottom: 16px;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  width: fit-content;
  padding: 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(10, 31, 56, 0.10);
  box-shadow: 0 14px 32px rgba(10, 31, 56, 0.16);
  backdrop-filter: blur(10px);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 46px;
  height: 26px;
  flex-shrink: 0;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.switch-riel {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  background: #d6e6f2;
  transition: background 0.2s ease;
}

.switch-riel::before {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  left: 3px;
  top: 3px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(10, 31, 56, 0.18);
  transition: transform 0.2s ease;
}

.switch input:checked + .switch-riel {
  background: #123a66;
}

.switch input:checked + .switch-riel::before {
  transform: translateX(20px);
}

.switch input:disabled + .switch-riel {
  opacity: 0.55;
  cursor: not-allowed;
}

.sucursal-select {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f5f9fc;
  border-radius: 12px;
  padding: 10px 14px;
  position: relative;
}

.sucursal-pin {
  color: #123a66;
  font-size: 18px;
  flex-shrink: 0;
}

.sucursal-native {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-weight: 700;
  color: #0a1f38;
  font-size: 0.95rem;
  appearance: none;
}

.sucursal-caret {
  color: #6d829c;
  font-size: 16px;
  flex-shrink: 0;
  pointer-events: none;
}

/* ── Accesos + tareas ── */
.home-grid-row {
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  gap: 18px;
  align-items: start;
}

.accesos-card {
  background: #ffffff;
  border: 1px solid rgba(10, 31, 56, 0.08);
  border-radius: 18px;
  padding: 18px;
  box-shadow: 0 4px 12px rgba(10, 31, 56, 0.05);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.accesos-toggle {
  align-self: flex-end;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid rgba(10, 31, 56, 0.10);
  background: #f5f9fc;
  color: #4a627e;
  font-weight: 700;
  font-size: 0.82rem;
  cursor: pointer;
}

.accesos-toggle.active {
  background: #123a66;
  border-color: #123a66;
  color: #f5f9fc;
}

.acceso-destacado {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, #123a66, #0d2b4e);
  color: #f5f9fc;
  font-weight: 800;
  font-size: 1rem;
  cursor: pointer;
}

.acceso-destacado ion-icon {
  font-size: 20px;
  color: #a9d8ee;
}

.accesos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(142px, 1fr));
  gap: 10px;
}

.acceso-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 10px;
  border-radius: 12px;
  border: 1px solid rgba(10, 31, 56, 0.08);
  background: #f5f9fc;
  color: #0a1f38;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease;
}

.acceso-item:hover {
  background: rgba(18, 58, 102, 0.08);
  transform: translateY(-1px);
}

.acceso-item:disabled {
  cursor: not-allowed;
  filter: grayscale(0.55);
  opacity: 0.48;
  transform: none;
}

.acceso-item:disabled:hover {
  background: #f5f9fc;
}

.turno-finalizado-mensaje {
  color: #b91c1c;
  font-size: 0.78rem;
  font-weight: 800;
  text-align: right;
}

.acceso-item.destacado {
  background: linear-gradient(135deg, #123a66, #0d2b4e);
  color: #f5f9fc;
  border-color: transparent;
}

.acceso-item.active {
  box-shadow: 0 0 0 2px rgba(18, 58, 102, 0.18);
}

.acceso-item.destacado .acceso-icono,
.acceso-item.destacado .acceso-label {
  color: #f5f9fc;
}

.acceso-icono {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: rgba(18, 58, 102, 0.10);
  color: #123a66;
  display: grid;
  place-items: center;
  font-size: 18px;
}

.acceso-label {
  font-size: 0.82rem;
  font-weight: 700;
}

.acceso-full {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 13px;
  border-radius: 12px;
  border: none;
  background: #0a1f38;
  color: #f5f9fc;
  font-weight: 800;
  font-size: 0.95rem;
  cursor: pointer;
}

/* ── Tareas ── */
.tareas-card {
  background: #ffffff;
  border: 1px solid rgba(10, 31, 56, 0.08);
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(10, 31, 56, 0.05);
  min-height: 220px;
}

.tareas-card.usuario-scroll {
  max-height: 420px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tareas-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.tareas-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 800;
  color: #0a1f38;
  font-size: 1rem;
}

.tareas-title ion-icon {
  color: #d97706;
}

.tareas-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid rgba(10, 31, 56, 0.10);
  background: #f5f9fc;
  color: #123a66;
  font-weight: 700;
  font-size: 0.82rem;
  cursor: pointer;
}

.tareas-vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 4px;
  padding: 30px 10px;
  color: #6d829c;
}

.tareas-vacio-icon {
  font-size: 34px;
  color: #a9c3d8;
  margin-bottom: 4px;
}

.tareas-vacio-titulo {
  margin: 0;
  font-weight: 800;
  color: #0a1f38;
}

.tareas-vacio-texto {
  margin: 0;
  font-size: 0.88rem;
}

.tareas-lista {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tareas-card.usuario-scroll .tareas-lista {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
}

.tarea-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #f5f9fc;
  cursor: pointer;
}

.tarea-info {
  flex: 1;
  display: grid;
  gap: 2px;
  color: #0a1f38;
}

.tarea-check input {
  width: 18px;
  height: 18px;
  accent-color: #123a66;
}

.tarea-detalle-btn {
  border: 1px solid rgba(18, 58, 102, 0.14);
  background: #ffffff;
  color: #123a66;
  border-radius: 9px;
  padding: 5px 10px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
}

.tarea-texto {
  flex: 1;
  font-size: 0.92rem;
  color: #0a1f38;
  font-weight: 600;
}

.tarea-texto.hecha {
  text-decoration: line-through;
  color: #9fb4c9;
}

.tarea-item.bloqueada {
  cursor: not-allowed;
  opacity: 0.5;
}

.tareas-extra {
  margin: 10px 0 0;
  color: #6d829c;
  font-size: 0.84rem;
  text-align: center;
}

.tarea-borrar {
  border: none;
  background: none;
  color: #9fb4c9;
  cursor: pointer;
  font-size: 16px;
}

/* ── Modales ── */
.modal-home {
  --width: 420px;
  --height: auto;
  --border-radius: 20px;
}

.modal-contenido {
  background: #ffffff !important;
  color: #000000 !important;
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(10, 31, 56, 0.15);
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
  color: #000000 !important;
  font-size: 1.1rem;
}

.modal-subtitulo {
  margin: 0;
  font-size: 0.88rem;
  color: #000000 !important;
}

.modal-fecha-miembro {
  margin: 4px 0 0;
  font-size: 0.78rem;
  color: #123a66;
  font-weight: 700;
}

.perfil-error {
  margin: 0;
  padding: 9px 10px;
  border: 1px solid rgba(185, 28, 28, 0.18);
  border-radius: 9px;
  background: #fff5f5;
  color: #b91c1c;
  font-size: 0.8rem;
  font-weight: 700;
  line-height: 1.35;
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

.modal-tarea-contenido {
  max-height: 84vh;
  overflow: auto;
}

.modal-tarea-cuerpo {
  display: grid;
  gap: 12px;
}

.tarea-modal-hero {
  display: flex;
  gap: 10px;
  align-items: center;
  background: #f5f9fc;
  border: 1px solid rgba(10, 31, 56, 0.08);
  border-radius: 12px;
  padding: 10px;
}

.tarea-modal-emoji {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: #ffffff;
  font-size: 1.3rem;
}

.tarea-modal-titulo {
  margin: 0;
  color: #0a1f38;
  font-weight: 800;
}

.tarea-modal-meta {
  margin: 2px 0 0;
  color: #6d829c;
  font-size: 0.85rem;
}

.tarea-modal-bloque {
  display: grid;
  gap: 7px;
}

.tarea-modal-descripcion {
  margin: 0;
  white-space: pre-line;
  background: #f8fbfe;
  border: 1px solid rgba(10, 31, 56, 0.08);
  border-radius: 10px;
  padding: 10px 12px;
  color: #123a66;
  font-size: 0.9rem;
  line-height: 1.45;
}

.tarea-modal-botones {
  margin-top: 4px;
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

/* ── Responsive: SOLO se toca este bloque para el nuevo diseño móvil ── */
@media (max-width: 900px) {
  .home-banner-mobile {
    position: relative; /* necesario para posicionar el botón absoluto */
  }

  .home-banner-mobile-notificaciones-container {
    position: relative;
  }

  .home-banner-mobile-recargar {
  position: absolute;
  right: 18px;   /* antes: left: 18px */
  bottom: 14px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1.5px solid rgba(255, 255, 255, 0);
  background: rgba(255, 255, 255, 0);
  color: #eaf4fa;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  transition: background 0.18s ease, transform 0.18s ease;
}

  .home-banner-mobile-recargar:hover,
  .home-banner-mobile-recargar:focus-visible {
    background: rgba(255, 255, 255, 0.24);
    transform: translateY(-1px);
    outline: none;
  }

  .home-banner-mobile-recargar:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .home-banner-mobile-recargar ion-icon.girando {
    animation: sali-girar-recarga 0.9s linear infinite;
  }

  @keyframes sali-girar-recarga {
    to { transform: rotate(360deg); }
  }

  .asistente-pc {
    display: none;
  }

  .perfil-acceso-desktop {
    display: none;
  }

  /* Encabezado móvil: logo + saludo + reloj, reemplaza el banner viejo */
  .home-banner-mobile {
    display: flex;
    flex-direction: column;
    gap: 14px;
    background: linear-gradient(160deg, #0a1f38 0%, #0d2b4e 55%, #123a66 100%);
    margin: -18px -18px 0;
    padding: 18px 18px 26px;
  }

  .home-banner-mobile-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .home-banner-mobile-actions {
    display: flex;
    align-items: center;
    gap: 9px;
  }

  .home-banner-mobile-notificaciones {
    position: relative;
    min-width: 40px;
    height: 40px;
    padding: 0;
    border: 2px solid rgba(255, 255, 255, 0.42);
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    color: white;
    font-size: 1.3rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .home-banner-mobile-notificaciones:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.05);
  }

  .notificaciones-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    background: #dc2626;
    color: white;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid white;
  }

  .home-banner-mobile-notificaciones-container {
    position: relative;
  }

  .notificacion-menu {
    position: absolute;
    top: calc(100% + 12px);
    right: 0;
    min-width: 220px;
    background: linear-gradient(135deg, rgba(8, 16, 28, 0.98) 0%, rgba(13, 43, 78, 0.98) 100%);
    border: 2px solid rgba(79, 179, 224, 0.4);
    border-radius: 18px;
    backdrop-filter: blur(16px);
    padding: 10px 0;
    z-index: 1000;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5), 0 4px 12px rgba(79, 179, 224, 0.2);
    animation: fadeInDown 0.3s ease;
  }

  @keyframes fadeInDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .notificacion-menu-item {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 12px 18px;
    border: none;
    background: transparent;
    color: #eaf4fa;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    border-radius: 12px;
    margin: 2px 8px;
  }

  .notificacion-menu-item:hover {
    background: linear-gradient(135deg, rgba(79, 179, 224, 0.2) 0%, rgba(79, 179, 224, 0.1) 100%);
    color: #4fb3e0;
    transform: translateX(-2px);
    box-shadow: 0 4px 12px rgba(79, 179, 224, 0.2);
  }

  .notificacion-menu-item-peligro {
    color: #f7a6a6;
  }

  .notificacion-menu-item-peligro:hover {
    background: linear-gradient(135deg, rgba(220, 38, 38, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%);
    color: #fecaca;
    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);
  }

  .notificacion-menu-item ion-icon {
    font-size: 20px;
  }

  .notificacion-menu-burbuja {
    margin-left: auto;
    padding: 4px 10px;
    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
    color: white;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 700;
    border: 2px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 2px 8px rgba(220, 38, 38, 0.4);
  }

/* Estilos para modal de notificaciones */
.modal-notificaciones-grande {
  --width: min(760px, 94vw);
  --height: auto;
  --max-height: 85vh;
  --border-radius: 24px;
  --background: #ffffff;
}

.modal-notificaciones-contenido {
  height: auto;
  max-height: 85vh;
  overflow-y: auto;
  padding: 0;
  border-radius: 24px;
  background: #ffffff !important;
  color: #000000 !important;
}

.modal-notificaciones-contenido > .modal-header {
  position: sticky;
  top: 0;
  z-index: 2;
  padding: 28px 32px 24px;
  background: #ffffff !important;
  color: #000000 !important;
  border-bottom: 2px solid rgba(79, 179, 224, 0.15);
  border-radius: 24px 24px 0 0;
  box-shadow: 0 4px 20px rgba(10, 31, 56, 0.08);
}

.notificaciones-contenido {
  padding: 16px;
  position: relative;
}

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

.notificaciones-lista,
.notificaciones-vacio {
  position: relative;
  z-index: 1;
  padding: 20px;
}

.notificaciones-vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 30px;
  gap: 20px;
  color: #000000 !important;
  background: #ffffff !important;
}

.notificaciones-vacio-icon {
  font-size: 56px;
  color: #4fb3e0 !important;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
}

.notificaciones-vacio-texto {
  margin: 0;
  font-size: 16px;
  color: #000000 !important;
  font-weight: 600;
}

.notificaciones-lista {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.notificacion-item {
  padding: 18px;
  background: #ffffff !important;
  color: #000000 !important;
  border: 2px solid rgba(79, 179, 224, 0.2);
  border-radius: 18px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(10, 31, 56, 0.1);
}

.notificacion-item:hover {
  background: #ffffff !important;
  color: #000000 !important;
  border-color: rgba(79, 179, 224, 0.4);
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(79, 179, 224, 0.2);
}

.notificacion-item.no-leida {
  background: #ffffff !important;
  color: #000000 !important;
  border-color: rgba(79, 179, 224, 0.5);
  border-left: 5px solid #4fb3e0;
  box-shadow: 0 6px 20px rgba(79, 179, 224, 0.25);
}

.notificacion-item.tipo-success {
  border-left: 5px solid #16a34a;
}

.notificacion-item.tipo-warning {
  border-left: 5px solid #d97706;
}

.notificacion-item.tipo-error {
  border-left: 5px solid #dc2626;
}

.notificacion-item.tipo-info {
  border-left: 5px solid #4fb3e0;
}

.notificacion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.notificacion-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.notificacion-tipo-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  font-size: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.icono-success {
  background: linear-gradient(135deg, rgba(22, 163, 74, 0.25) 0%, rgba(22, 163, 74, 0.15) 100%);
  color: #16a34a;
  box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
}

.icono-warning {
  background: linear-gradient(135deg, rgba(217, 119, 6, 0.25) 0%, rgba(217, 119, 6, 0.15) 100%);
  color: #d97706;
  box-shadow: 0 4px 12px rgba(217, 119, 6, 0.3);
}

.icono-error {
  background: linear-gradient(135deg, rgba(220, 38, 38, 0.25) 0%, rgba(220, 38, 38, 0.15) 100%);
  color: #dc2626;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
}

.icono-info {
  background: linear-gradient(135deg, rgba(79, 179, 224, 0.25) 0%, rgba(79, 179, 224, 0.15) 100%);
  color: #4fb3e0;
  box-shadow: 0 4px 12px rgba(79, 179, 224, 0.3);
}

.notificacion-titulo {
  font-size: 16px;
  font-weight: 700;
  color: #000000 !important;
}

.notificacion-fecha {
  font-size: 12px;
  color: #000000 !important;
  font-weight: 600;
  background: #f0f0f0 !important;
  padding: 4px 10px;
  border-radius: 10px;
}

.notificacion-mensaje {
  margin: 10px 0;
  font-size: 14px;
  color: #000000 !important;
  line-height: 1.6;
}

.notificacion-mensaje img {
  cursor: pointer;
  transition: transform 0.2s ease;
  border-radius: 8px;
  max-width: 100%;
}

.notificacion-mensaje img:hover {
  transform: scale(1.02);
}

.notificacion-autor {
  margin: 6px 0 0;
  font-size: 12px;
  color: #000000 !important;
  font-style: italic;
  font-weight: 600;
}

.notificacion-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(79, 179, 224, 0.15);
}

.btn-ampliar-imagen {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: linear-gradient(135deg, #4fb3e0, #22d3ee);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(79, 179, 224, 0.3);
}

.btn-ampliar-imagen:hover {
  background: linear-gradient(135deg, #22d3ee, #0ea5e9);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(34, 211, 238, 0.4);
}

.btn-ampliar-imagen ion-icon {
  font-size: 1rem;
}

.notificacion-acciones {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}

.notificacion-marcar-leida {
  padding: 8px 16px;
  background: linear-gradient(135deg, #4fb3e0 0%, #3ba8cc 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(79, 179, 224, 0.3);
}

.notificacion-marcar-leida:hover {
  background: linear-gradient(135deg, #3ba8cc 0%, #2d8db5 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(79, 179, 224, 0.4);
}

.notificacion-eliminar {
  padding: 8px 12px;
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #dc2626;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);
}

.notificacion-eliminar:hover {
  background: linear-gradient(135deg, #fecaca 0%, #fca5a5 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(220, 38, 38, 0.3);
}

  .home-banner-mobile-help {
    min-height: 40px;
    padding: 0 10px;
    border: 1px solid rgba(255, 255, 255, 0.42);
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.14);
    color: #eaf4fa;
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.76rem;
    font-weight: 800;
    cursor: pointer;
  }

  .home-banner-mobile-help ion-icon {
    font-size: 19px;
  }

  .home-banner-mobile-logo {
    width: 70px;
    height: 70px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex-shrink: 0;
  }

  .home-banner-mobile-logo img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .home-banner-mobile-user {
    border: 2px solid rgba(255, 255, 255, 0.42);
    padding: 0;
    cursor: pointer;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.14);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #eaf4fa;
    font-size: 23px;
    flex-shrink: 0;
    transition: background 0.18s ease, transform 0.18s ease;
  }

  .home-banner-mobile-user:hover,
  .home-banner-mobile-user:focus-visible {
    background: rgba(255, 255, 255, 0.24);
    transform: translateY(-1px);
    outline: none;
  }

  .home-banner-mobile-saludo {
    margin: 0;
  }

  .saludo-texto {
    margin: 0;
    font-size: 0.82rem;
    color: #9fc3e0;
    font-weight: 600;
  }

  .saludo-nombre {
    margin: 2px 0 0;
    font-size: 1.25rem;
    font-weight: 800;
    color: #f5f9fc;
  }

  .home-banner-mobile-reloj {
    display: flex;
    align-items: baseline;
    gap: 10px;
  }

  .reloj-hora {
    font-size: 2.4rem;
    font-weight: 900;
    letter-spacing: -0.02em;
    color: #f5f9fc;
  }

  .reloj-fecha {
    font-size: 0.82rem;
    color: #9fc3e0;
    font-weight: 600;
  }

  .aviso-turno-requerido {
    align-items: flex-start;
    flex-direction: column;
  }

  .aviso-turno-requerido button {
    width: 100%;
  }

  .sucursal-card {
    display: none;
  }

  /* Tarjeta de asistencia integrada en el flujo (reemplaza el botón flotante) */
  .asistencia-card {
    display: flex;
    margin-top: -18px;
    position: relative;
    z-index: 2;
    border-radius: 16px;
    box-shadow: 0 10px 26px rgba(10, 31, 56, 0.14);
  }

  .card-header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .card-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.78rem;
    font-weight: 800;
    color: #6d829c;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .toggle-fila.asistencia-unica {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .asistencia-icono {
    width: 38px;
    height: 38px;
    border-radius: 11px;
    background: rgba(18, 58, 102, 0.08);
    color: #123a66;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 19px;
    flex-shrink: 0;
  }

  .toggle-texto {
    flex: 1;
    min-width: 0;
    display: grid;
    gap: 2px;
  }

  .toggle-texto span {
    font-size: 0.92rem;
    font-weight: 700;
    color: #0a1f38;
  }

  .toggle-texto small {
    font-size: 0.78rem;
    color: #6d829c;
  }

  /* El botón flotante deja de mostrarse en móvil: su función ya la cubre la tarjeta de arriba */
  .asistencia-flotante {
    display: none;
  }

  .home-grid-row {
    grid-template-columns: 1fr;
  }

  /* Accesos: grid compacto de 3 columnas con icono en chip de color */
  .accesos-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .acceso-item {
    padding: 12px 6px;
    border-radius: 14px;
    gap: 6px;
  }

  .acceso-icono {
    width: 36px;
    height: 36px;
    font-size: 18px;
  }

  .acceso-label {
    font-size: 0.72rem;
    text-align: center;
    line-height: 1.2;
  }

  /* Tareas: lista más compacta */
  .tareas-card {
    padding: 16px;
    border-radius: 16px;
  }

  .tarea-item {
    padding: 9px 10px;
  }

  .tarea-texto {
    font-size: 0.86rem;
  }

  .home-banner {
    margin: -18px -18px 0;
    padding: 16px 18px 22px;
  }

  .banner-reloj {
    font-size: 2.6rem;
  }

  .home-page {
    padding-bottom: 32px;
  }

  .home-body {
    padding-top: 14px;
  }
}

.acceso-icono {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--acceso-color, #123a66) 14%, white);
  color: var(--acceso-color, #123a66);
  display: grid;
  place-items: center;
  font-size: 19px;
  transition: transform 0.15s ease, background 0.15s ease;
}

.acceso-item:hover .acceso-icono {
  transform: scale(1.08) rotate(-2deg);
}

.acceso-item.destacado {
  background: linear-gradient(135deg, var(--acceso-color, #123a66), color-mix(in srgb, var(--acceso-color, #123a66) 65%, black));
  color: #f5f9fc;
  border-color: transparent;
}

.acceso-item.destacado .acceso-icono {
  background: rgba(255, 255, 255, 0.22);
  color: #ffffff;
}

.acceso-item.destacado .acceso-label {
  color: #f5f9fc;
}

/* ── Estilos para modales de problemas y avisos ── */
.modal-problema-reportar {
  --width: min(480px, 92vw);
  --height: auto;
  --max-height: 85vh;
  --border-radius: 24px;
  --background: #ffffff;
}

.modal-problema-reportar-contenido {
  height: auto;
  max-height: 85vh;
  overflow-y: auto;
  padding: 0;
  border-radius: 24px;
  background: #ffffff !important;
  color: #000000 !important;
}

.modal-problemas-grande {
  --width: min(620px, 94vw);
  --height: auto;
  --max-height: 86vh;
  --border-radius: 24px;
  --background: #ffffff;
}

.modal-problemas-contenido {
  height: auto;
  max-height: 86vh;
  overflow-y: auto;
  padding: 0;
  border-radius: 24px;
  background: #ffffff !important;
  color: #000000 !important;
}

.problemas-vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 30px;
  text-align: center;
  background: #ffffff !important;
  color: #000000 !important;
  border-radius: 20px;
  margin: 20px;
}

.problemas-vacio-icon {
  font-size: 64px;
  color: #4fb3e0;
  margin-bottom: 20px;
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.problemas-vacio-texto {
  font-size: 1rem;
  color: #6d829c;
  margin: 0;
  font-weight: 600;
}

.problemas-lista {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
}

.problema-item {
  padding: 20px;
  border: 2px solid rgba(79, 179, 224, 0.15);
  border-radius: 20px;
  background: #ffffff !important;
  color: #000000 !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 16px rgba(10, 31, 56, 0.08);
  position: relative;
  overflow: hidden;
}

.problema-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #4fb3e0 0%, #3ba8cc 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.problema-item:hover::before {
  opacity: 1;
}

.problema-item:hover {
  background: #ffffff !important;
  color: #000000 !important;
  border-color: rgba(79, 179, 224, 0.4);
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 12px 32px rgba(79, 179, 224, 0.2);
}

.problema-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  gap: 12px;
}

.problema-tema {
  font-size: 1.05rem;
  font-weight: 700;
  color: #000000 !important;
  flex: 1;
}

.problema-fecha {
  font-size: 0.85rem;
  color: #000000 !important;
  font-weight: 600;
  background: #f0f0f0 !important;
  padding: 6px 12px;
  border-radius: 12px;
  white-space: nowrap;
}

.problema-detalles {
  font-size: 0.92rem;
  color: #000000 !important;
  margin: 12px 0;
  line-height: 1.6;
  font-weight: 500;
}

.problema-acciones {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  flex-wrap: wrap;
}

.problema-accion {
  padding: 10px 18px;
  background: linear-gradient(135deg, #4fb3e0 0%, #3ba8cc 100%);
  color: white;
  border: none;
  border-radius: 14px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 16px rgba(79, 179, 224, 0.3);
  flex: 1;
  min-width: 120px;
}

.problema-accion:hover {
  background: linear-gradient(135deg, #3ba8cc 0%, #2d8db5 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(79, 179, 224, 0.4);
}

.problema-eliminar {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #dc2626;
  box-shadow: 0 4px 16px rgba(220, 38, 38, 0.3);
}

.problema-eliminar:hover {
  background: linear-gradient(135deg, #fecaca 0%, #fca5a5 100%);
  box-shadow: 0 8px 24px rgba(220, 38, 38, 0.4);
}

.modal-aviso-grande {
  --width: min(720px, 94vw);
  --height: auto;
  --max-height: 92vh;
  --border-radius: 24px;
  --background: #ffffff;
}

.modal-aviso-contenido {
  height: auto;
  max-height: 92vh;
  overflow-y: auto;
  padding: 0;
  border-radius: 24px;
  background: #ffffff !important;
  color: #000000 !important;
}

.aviso-editor-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.aviso-html-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 14px;
  background: #f5f5f5 !important;
  color: #000000 !important;
  border: 2px solid rgba(79, 179, 224, 0.2);
  border-radius: 18px;
  align-items: center;
  box-shadow: 0 4px 16px rgba(79, 179, 224, 0.1);
}

.html-toolbar-btn {
  padding: 10px 16px;
  background: #ffffff !important;
  color: #000000 !important;
  border: 2px solid rgba(79, 179, 224, 0.15);
  border-radius: 12px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 700;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(10, 31, 56, 0.08);
  min-height: 40px;
}

.html-toolbar-btn:hover {
  background: #f0f0f0 !important;
  color: #000000 !important;
  border-color: #4fb3e0;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(79, 179, 224, 0.25);
}

.imagen-btn {
  background: linear-gradient(135deg, #4fb3e0, #22d3ee) !important;
  color: white !important;
  border-color: #4fb3e0 !important;
  font-size: 1rem;
  padding: 10px 14px;
  min-height: 40px;
}

.imagen-btn:hover {
  background: linear-gradient(135deg, #22d3ee, #0ea5e9) !important;
  border-color: #22d3ee !important;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(34, 211, 238, 0.35);
}

.color-picker-wrapper {
  position: relative;
  width: 40px;
  height: 40px;
}

.color-picker-input {
  width: 100%;
  height: 100%;
  border: 2px solid rgba(79, 179, 224, 0.2);
  border-radius: 12px;
  cursor: pointer;
  padding: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(10, 31, 56, 0.1);
}

.color-picker-input:hover {
  border-color: #4fb3e0;
  transform: scale(1.1) rotate(5deg);
  box-shadow: 0 4px 16px rgba(79, 179, 224, 0.3);
}

.editor-textarea {
  min-height: 180px;
  border: 2px solid rgba(79, 179, 224, 0.15);
  border-radius: 18px;
  padding: 20px;
  font-size: 1rem;
  line-height: 1.7;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: #ffffff !important;
  color: #000000 !important;
  box-shadow: 0 4px 16px rgba(10, 31, 56, 0.08);
}

.editor-textarea:focus {
  outline: none;
  border-color: #4fb3e0;
  background: #ffffff !important;
  color: #000000 !important;
  box-shadow: 0 8px 32px rgba(79, 179, 224, 0.2);
  transform: scale(1.01);
}

.aviso-preview-column {
  margin-top: 16px;
}

.preview-label {
  font-size: 0.9rem;
  font-weight: 700;
  color: #6d829c;
  margin: 0 0 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.preview-content {
  padding: 20px;
  background: #ffffff !important;
  color: #000000 !important;
  border: 2px solid rgba(79, 179, 224, 0.25);
  border-radius: 18px;
  font-size: 0.95rem;
  line-height: 1.6;
  box-shadow: 0 4px 16px rgba(79, 179, 224, 0.1);
}

.preview-content-grande {
  min-height: 100px;
}

.preview-imagen-container {
  margin-top: 12px;
  position: relative;
  display: inline-block;
}

.preview-imagen {
  max-width: 100%;
  max-height: 200px;
  border-radius: 12px;
  border: 2px solid rgba(79, 179, 224, 0.25);
  box-shadow: 0 4px 16px rgba(79, 179, 224, 0.1);
}

.preview-imagen-eliminar {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
  transition: all 0.2s ease;
}

.preview-imagen-eliminar:hover {
  background: #dc2626;
  transform: scale(1.1);
}

.imagen-btn {
  position: relative;
}

.imagen-url-preview {
  margin-top: 16px;
  position: relative;
  display: inline-block;
}

.imagen-url-preview-img {
  max-width: 100%;
  max-height: 300px;
  border-radius: 12px;
  border: 2px solid rgba(79, 179, 224, 0.25);
  box-shadow: 0 4px 16px rgba(79, 179, 224, 0.1);
}

.imagen-url-preview-eliminar {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
  transition: all 0.2s ease;
}

.imagen-url-preview-eliminar:hover {
  background: #dc2626;
  transform: scale(1.1);
}

.notificacion-imagen-container {
  margin-top: 12px;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid rgba(79, 179, 224, 0.15);
  position: relative;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.notificacion-imagen-container:hover {
  transform: scale(1.02);
}

.notificacion-imagen {
  width: 100%;
  max-height: 300px;
  object-fit: cover;
  display: block;
}

.notificacion-imagen-lupa {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 48px;
  height: 48px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  pointer-events: none;
}

.notificacion-imagen-lupa ion-icon {
  font-size: 1.4rem;
}

.notificacion-imagen-container:hover .notificacion-imagen-lupa {
  background: rgba(0, 0, 0, 0.8);
  transform: translate(-50%, -50%) scale(1.1);
}

.modal-imagen-grande {
  --width: 100vw;
  --height: 100vh;
  --max-width: 100vw;
  --max-height: 100vh;
  --border-radius: 0;
  --backdrop-opacity: 0.95;
  --background: rgba(0, 0, 0, 0.9);
}

.modal-imagen-grande-contenido {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.95);
  position: relative;
}

.modal-cerrar-imagen-grande {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 10;
}

.modal-cerrar-imagen-grande:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: white;
  transform: scale(1.1);
}

.modal-cerrar-imagen-grande ion-icon {
  font-size: 1.5rem;
}

.imagen-grande {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.btn-agregar-imagen {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #4fb3e0, #22d3ee);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(79, 179, 224, 0.3);
}

.btn-agregar-imagen:hover {
  background: linear-gradient(135deg, #22d3ee, #0ea5e9);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(34, 211, 238, 0.4);
}

.btn-agregar-imagen ion-icon {
  font-size: 1.2rem;
}

.modal-imagen-url {
  --width: min(480px, 90vw);
  --height: auto;
  --max-height: 80vh;
  --border-radius: 20px;
  --backdrop-opacity: 0.6;
  --background: rgba(0, 0, 0, 0.4);
}

.modal-imagen-url-contenido {
  max-width: 480px;
  margin: 0 auto;
  padding: 24px;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

/* Estilos modernos para inputs y textareas en modales */
.modal-input-moderno {
  border: 2px solid rgba(79, 179, 224, 0.15);
  border-radius: 14px;
  padding: 14px 18px;
  font-size: 1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: #ffffff !important;
  color: #000000 !important;
  box-shadow: 0 2px 8px rgba(10, 31, 56, 0.08);
}

.modal-input-moderno:focus {
  outline: none;
  border-color: #4fb3e0;
  background: #ffffff !important;
  color: #000000 !important;
  box-shadow: 0 4px 20px rgba(79, 179, 224, 0.2);
  transform: scale(1.01);
}

.modal-input-moderno::placeholder {
  color: #666666 !important;
  font-weight: 500;
}

.modal-textarea-moderna {
  border: 2px solid rgba(79, 179, 224, 0.15);
  border-radius: 14px;
  padding: 16px;
  font-size: 1rem;
  line-height: 1.6;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: #ffffff !important;
  color: #000000 !important;
  box-shadow: 0 2px 8px rgba(10, 31, 56, 0.08);
  min-height: 120px;
  resize: vertical;
}

.modal-textarea-moderna:focus {
  outline: none;
  border-color: #4fb3e0;
  background: #ffffff !important;
  color: #000000 !important;
  box-shadow: 0 4px 20px rgba(79, 179, 224, 0.2);
  transform: scale(1.01);
}

.modal-textarea-moderna::placeholder {
  color: #666666 !important;
  font-weight: 500;
}

.modal-header-icon-problema {
  background: linear-gradient(135deg, rgba(220, 38, 38, 0.15) 0%, rgba(220, 38, 38, 0.05) 100%);
  color: #dc2626;
  box-shadow: 0 4px 16px rgba(220, 38, 38, 0.2);
}

/* Responsive para móviles y tablets */
@media (max-width: 768px) {
  .modal-problema-reportar {
    --width: 95vw;
    --border-radius: 20px;
  }

  .modal-problemas-grande {
    --width: 95vw;
    --border-radius: 20px;
  }

  .modal-aviso-grande {
    --width: 95vw;
    --border-radius: 20px;
  }

  .modal-problema-reportar-contenido,
  .modal-problemas-contenido,
  .modal-aviso-contenido {
    padding: 16px;
  }

  .problemas-lista {
    padding: 16px;
    gap: 12px;
  }

  .problema-item {
    padding: 16px;
    border-radius: 16px;
  }

  .problema-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .problema-fecha {
    align-self: flex-start;
  }

  .problema-acciones {
    flex-direction: column;
    gap: 8px;
  }

  .problema-accion {
    width: 100%;
    min-width: auto;
  }

  .aviso-html-toolbar {
    padding: 10px;
    gap: 6px;
  }

  .html-toolbar-btn {
    padding: 8px 12px;
    font-size: 0.8rem;
    min-height: 36px;
  }

  .imagen-btn {
    background: linear-gradient(135deg, #4fb3e0, #22d3ee) !important;
    color: white !important;
    border-color: #4fb3e0 !important;
    font-size: 1rem;
    padding: 10px 14px;
    min-height: 40px;
  }

  .imagen-btn:hover {
    background: linear-gradient(135deg, #22d3ee, #0ea5e9) !important;
    border-color: #22d3ee !important;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(34, 211, 238, 0.35);
  }

  .color-picker-wrapper {
    width: 36px;
    height: 36px;
  }

  .editor-textarea {
    min-height: 150px;
    padding: 16px;
    font-size: 0.95rem;
  }

  .modal-input-moderno,
  .modal-textarea-moderna {
    padding: 12px 16px;
    font-size: 0.95rem;
  }

  .modal-textarea-moderna {
    min-height: 100px;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .modal-problema-reportar {
    --width: min(550px, 90vw);
  }

  .modal-problemas-grande {
    --width: min(650px, 90vw);
  }

  .modal-aviso-grande {
    --width: min(750px, 90vw);
  }

  .problema-item {
    padding: 18px;
  }

  .problema-acciones {
    gap: 10px;
  }

  .aviso-html-toolbar {
    padding: 12px;
  }
}
</style>
