<template>
  <AppShell>
    <div class="horarios-page">
      <!-- ───────────── Encabezado con el usuario real de la sesión ───────────── -->
      <div class="config-card usuario-card">
        <div class="config-card-header">
          <span class="config-card-label">Horarios de personal</span>
        </div>
        <div v-if="usuarioActual" class="usuario-actual">
          <span class="empleado-avatar">{{ inicial(usuarioActual.nombre) }}</span>
          <div>
            <small>Hola!</small>
            <p class="usuario-nombre">{{ usuarioActual.nombre }}</p>
          </div>
        </div>
      </div>

      <div v-if="esAdministrador" class="config-card calendario-admin-card">
        <div class="card-header-row calendario-admin-header">
          <span class="card-title">
            <ion-icon :icon="calendarClearOutline" />
            Calendario de horarios
          </span>
          <div class="calendario-admin-acciones">
            <div class="calendario-controles">
              <button :class="{ active: vistaCalendario === 'semana' }" @click="vistaCalendario = 'semana'">Semana</button>
              <button :class="{ active: vistaCalendario === 'mes' }" @click="vistaCalendario = 'mes'">Mes</button>
            </div>
            <button class="btn-programar btn-programar-esquina" @click="abrirModalHorario">
              <ion-icon :icon="addOutline" />
              Programar semana
            </button>
          </div>
        </div>

        <div v-if="vistaCalendario === 'semana'" class="calendario-admin-grid">
          <article
            v-for="dia in calendarioAdminSemana"
            :key="dia.fecha"
            class="calendario-admin-dia"
            :class="{ hoy: dia.fecha === fechaDeHoy }"
          >
            <div class="calendario-admin-dia-cabecera">
              <div>
                <p class="calendario-admin-nombre">{{ formatearDiaSemana(dia.fecha) }}</p>
                <p class="calendario-admin-fecha">{{ formatearFecha(dia.fecha) }}</p>
              </div>
              <button class="btn-agregar-dia" type="button" title="Agregar horario individual" :aria-label="`Agregar horario para ${formatearDiaSemana(dia.fecha)}`" :disabled="dia.fecha < fechaDeHoy" @click="abrirModalHorarioIndividual(dia.fecha)">
                <ion-icon :icon="addOutline" />
              </button>
            </div>
            <span v-if="dia.fecha === fechaDeHoy" class="chip-hoy">Hoy</span>
            <div v-if="dia.turnos.length === 0" class="calendario-admin-vacio">No definido</div>
            <div v-else class="calendario-admin-turnos">
              <div
                v-for="turno in dia.turnos"
                :key="turno.id"
                class="calendario-admin-turno"
                :class="{ libre: turno.libre, horasExtra: turno.horasExtra }"
              >
                <div class="calendario-admin-turno-header">
                  <strong>{{ turno.nombre }}</strong>
                  <button
                    class="btn-editar-turno"
                    title="Editar turno"
                    @click="abrirModalEditarTurno(turno.id)"
                  >
                    <ion-icon :icon="createOutline" />
                  </button>
                </div>
                <small v-if="turno.libre">Libre</small>
                <small v-else>{{ turno.horaInicio }} - {{ turno.horaFin }}</small>
              </div>
            </div>
          </article>
        </div>

        <div v-else class="calendario-mensual">
          <div class="calendario-mes-navegacion">
            <button class="calendario-flecha" :disabled="mesCalendarioOffset <= -24" @click="mesCalendarioOffset--">Anterior</button>
            <strong>{{ nombreMesCalendario }}</strong>
            <button class="calendario-flecha" :disabled="mesCalendarioOffset === 2" @click="mesCalendarioOffset++">Siguiente</button>
          </div>
          <div class="calendario-mes-cabecera">
            <span v-for="dia in nombresDiasSemana" :key="dia">{{ dia }}</span>
          </div>
          <div class="calendario-mes-grid">
            <article
              v-for="dia in calendarioAdminMes"
              :key="dia.clave"
              class="calendario-mes-dia"
              :class="{ hoy: dia.fecha === fechaDeHoy, vacio: dia.esRelleno }"
            >
              <div v-if="!dia.esRelleno" class="calendario-mes-dia-cabecera">
                <strong>{{ dia.numero }}</strong>
                <button class="btn-agregar-dia mini" type="button" title="Agregar horario individual" :aria-label="`Agregar horario para ${dia.fecha}`" :disabled="dia.fecha < fechaDeHoy" @click="abrirModalHorarioIndividual(dia.fecha)">
                  <ion-icon :icon="addOutline" />
                </button>
              </div>
              <template v-if="!dia.esRelleno">
                <div v-if="dia.turnos.length === 0" class="calendario-mes-no-definido">No definido</div>
                <div v-for="turno in dia.turnos" :key="turno.id" class="calendario-mes-turno" :class="{ libre: turno.libre }">
                  <div class="calendario-mes-turno-header">
                    <span>{{ turno.nombre }}</span>
                    <button
                      class="btn-editar-turno mini"
                      title="Editar turno"
                      @click="abrirModalEditarTurno(turno.id)"
                    >
                      <ion-icon :icon="createOutline" />
                    </button>
                  </div>
                  <small>{{ turno.libre ? 'Libre' : `${turno.horaInicio} - ${turno.horaFin}` }}</small>
                </div>
              </template>
            </article>
          </div>
        </div>
      </div>

      <div v-if="esAdministrador" class="config-card panel-reportes">
        <div class="card-header-row">
          <span class="card-title">
            <ion-icon :icon="alertCircleOutline" />
            Reportes del día
          </span>
          <button class="btn-reportes" @click="mostrarModalReportes = true">
            Ver detalle
          </button>
        </div>
        <div class="reportes-resumen">
          <article class="reporte-resumen-card">
            <strong>{{ reportesEntradaHoy.length }}</strong>
            <span>Entradas registradas</span>
          </article>
          <article class="reporte-resumen-card warning">
            <strong>{{ tardanzasHoy.length }}</strong>
            <span>Llegadas tardías</span>
          </article>
          <article class="reporte-resumen-card calm">
            <strong>{{ notificacionesAdmin.length }}</strong>
            <span>Alertas recientes</span>
          </article>
        </div>
      </div>

      <!-- ══════════════════════ VISTA ADMINISTRADOR ══════════════════════ -->
      <template v-if="esAdministrador">
        <div class="home-grid-row">
          <!-- Personal y pago por hora -->
          <div class="accesos-card">
            <div class="card-header-row">
              <span class="card-title">
                <ion-icon :icon="peopleOutline" />
                Pagos y Conexión de personal
              </span>
              <button class="config-add-btn" title="Actualizar lista" @click="refrescarPersonal">
                <ion-icon :icon="refreshOutline" />
              </button>
            </div>

            <div v-if="empleados.length === 0" class="estado-vacio">
              <ion-icon :icon="peopleOutline" class="estado-vacio-icon" />
              <p class="estado-vacio-titulo">Aún no hay personal en el equipo</p>
              <p class="estado-vacio-texto">Agrega personas en la sección "Equipo" y aparecerán aquí para asignarles pago por hora y turnos.</p>
            </div>

            <ul v-else class="lista-empleados">
              <li v-for="emp in empleados" :key="emp.id" class="empleado-item">
                <div class="empleado-info">
                  <span class="empleado-avatar">{{ inicial(emp.nombre) }}</span>
                  <div class="empleado-texto">
                    <span class="empleado-nombre">{{ emp.nombre }}</span>
                    <span class="empleado-rol-chip">{{ formatearRol(emp.rol) }}</span>
                  </div>
                </div>
                <div class="empleado-pago">
                  <span>$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    :value="pagosPorHoraEditando[emp.id] ?? emp.pagoPorHora"
                    @input="actualizarPagoPorHoraEnEdicion(emp.id, ($event.target as HTMLInputElement).value)"
                    @blur="guardarPagoPorHora(emp.id)"
                  />
                  <span class="empleado-pago-sufijo">/h</span>
                </div>
                <div class="empleado-estado-admin">
                  <span class="badge-jornada" :class="estadoJornadaAdmin(emp.id).clase">
                    {{ estadoJornadaAdmin(emp.id).texto }}
                  </span>
                  <button
                    class="btn-estado-admin"
                    :class="`modo-${estadoJornadaAdmin(emp.id).modo}`"
                    :disabled="estadoJornadaAdmin(emp.id).modo === 'bloqueado'"
                    @click="alternarConexionAdmin(emp.id)"
                  >
                    {{ estadoJornadaAdmin(emp.id).accion }}
                  </button>
                </div>
              </li>
            </ul>
          </div>

          <!-- Nómina -->
          <div class="tareas-card">
            <div class="card-header-row">
              <span class="card-title">
                <ion-icon :icon="cashOutline" />
                Nómina
              </span>
            </div>

            <div v-if="empleados.length === 0" class="estado-vacio-mini">Sin personal registrado.</div>
            <div v-else>
              <ul class="lista-pagos">
                <li v-for="emp in empleados" :key="emp.id" class="pago-item">
                  <div class="pago-info">
                    <span class="empleado-avatar chico">{{ inicial(emp.nombre) }}</span>
                    <div>

                  <ion-modal :is-open="mostrarModalHorarioIndividual" class="modal-horario-individual" @didDismiss="cerrarModalHorarioIndividual">
                    <div class="modal-contenido horario-individual-contenido">
                      <div class="modal-header horario-modal-header">
                        <div class="modal-header-left">
                          <div class="modal-header-icon"><ion-icon :icon="addOutline" /></div>
                          <div>
                            <p class="modal-titulo">Agregar horario</p>
                            <p class="modal-subtitulo">Asigna un turno para un día</p>
                          </div>
                        </div>
                        <button class="modal-cerrar" type="button" aria-label="Cerrar modal de horario individual" @click="cerrarModalHorarioIndividual">
                          <ion-icon :icon="closeOutline" />
                        </button>
                      </div>

                      <label class="modal-label">Usuario</label>
                      <select v-model="horarioIndividual.empleadoId" class="input-select">
                        <option value="" disabled>Selecciona usuario</option>
                        <option v-for="emp in empleados" :key="emp.id" :value="emp.id">{{ emp.nombre }}</option>
                      </select>
                      <label class="modal-label">Fecha</label>
                      <input v-model="horarioIndividual.fecha" type="date" :min="fechaDeHoy" class="input-select" />

                      <div class="dia-modal-grid">
                        <label><span>Entrada</span><input v-model="horarioIndividual.horaInicio" type="time" class="input-select" /></label>
                        <label><span>Salida</span><input v-model="horarioIndividual.horaFin" type="time" class="input-select" /></label>
                        <label><span>Almuerzo inicio</span><input v-model="horarioIndividual.horaAlmuerzoInicio" type="time" class="input-select" /></label>
                        <label><span>Almuerzo fin</span><input v-model="horarioIndividual.horaAlmuerzoFin" type="time" class="input-select" /></label>
                      </div>

                      <p v-if="errorHorarioIndividual" class="horario-individual-error">{{ errorHorarioIndividual }}</p>
                      <div class="modal-botones">
                        <ion-button class="btn-fantasma" @click="cerrarModalHorarioIndividual">Cancelar</ion-button>
                        <ion-button class="btn-primario" :disabled="!puedeGuardarHorarioIndividual || guardandoHorarioIndividual" @click="guardarHorarioIndividual">Guardar horario</ion-button>
                      </div>
                    </div>
                  </ion-modal>
                      <p class="pago-nombre">{{ emp.nombre }}</p>
                      <small>{{ formatearDuracion(horasPendientesDe(emp.id)) }} de conexión · {{ formatearMonto(emp.pagoPorHora) }}/h</small>
                    </div>
                  </div>
                  <div class="pago-monto">
                    <span class="pago-monto-cifra">{{ formatearMonto(montoPendienteDe(emp.id)) }}</span>
                    <small>Total a pagar del ciclo</small>
                    <small v-if="ultimoPagoDe(emp.id).value">
                      Último pago: {{ formatearMonto(ultimoPagoDe(emp.id).value!.monto) }}
                    </small>
                  </div>
                  <button
                    class="btn-editar-conexion"
                    type="button"
                    title="Editar tiempo de conexión"
                    @click="abrirEditorConexion(emp.id)"
                  >
                    Editar tiempo
                  </button>
                  <button
                    class="btn-pagar"
                    :disabled="montoPendienteDe(emp.id) === 0"
                    @click="marcarComoPagado(emp.id)"
                  >
                    Marcar pagado
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </template>

      <!-- ══════════════════════ VISTA PERSONAL ══════════════════════ -->
      <template v-else>
        <div v-if="!empleadoActivo" class="config-card">
          <div class="estado-vacio">
            <ion-icon :icon="alertCircleOutline" class="estado-vacio-icon" />
            <p class="estado-vacio-titulo">No encontramos tu registro de personal</p>
            <p class="estado-vacio-texto">
              Pide al administrador que confirme que tu cuenta ({{ usuarioActual?.nombre }}) está activa en "Equipo".
            </p>
          </div>
        </div>

        <template v-else>
          <div class="config-card">
            <div class="card-header-row">
              <span class="card-title">
                <ion-icon :icon="calendarClearOutline" />
                Mi calendario semanal
              </span>
              <div class="calendario-controles">
                <button :class="{ active: vistaCalendario === 'semana' }" @click="vistaCalendario = 'semana'">Semana</button>
                <button :class="{ active: vistaCalendario === 'mes' }" @click="vistaCalendario = 'mes'">Mes</button>
              </div>
              <button class="config-add-btn" @click="irA('/tabs/principal')" title="Marcar entrada">
                <ion-icon :icon="timeOutline" />
              </button>
            </div>

            <div v-if="vistaCalendario === 'semana'" class="calendario-semana-grid">
              <article
                v-for="dia in semanaUsuario"
                :key="dia.fecha"
                ref="diasSemanaRefs"
                class="dia-semana-card"
                :class="{ hoy: dia.fecha === fechaDeHoy }"
              >
                <p class="dia-semana-titulo">{{ formatearDiaSemana(dia.fecha) }}</p>
                <p class="dia-semana-fecha">{{ formatearFecha(dia.fecha) }}</p>
                <span v-if="dia.fecha === fechaDeHoy" class="chip-hoy">Hoy</span>
                <div v-if="dia.turno" class="dia-semana-turno">
                  <template v-if="dia.turno.libre">
                    <strong>Libre</strong>
                  </template>
                  <template v-else>
                    <strong>{{ dia.turno.horaInicio }} - {{ dia.turno.horaFin }}</strong>
                    <small v-if="dia.turno.horaAlmuerzoInicio && dia.turno.horaAlmuerzoFin">
                      Almuerzo: {{ dia.turno.horaAlmuerzoInicio }} - {{ dia.turno.horaAlmuerzoFin }}
                    </small>
                  </template>
                </div>
                <div v-else class="dia-semana-turno libre">No definido</div>
              </article>
            </div>
            <div v-else class="calendario-mensual">
              <div class="calendario-mes-navegacion">
                <button class="calendario-flecha" :disabled="mesCalendarioOffset === 0" @click="mesCalendarioOffset--">Anterior</button>
                <strong>{{ nombreMesCalendario }}</strong>
                <button class="calendario-flecha" :disabled="mesCalendarioOffset >= 24" @click="mesCalendarioOffset++">Siguiente</button>
              </div>
              <div class="calendario-mes-cabecera">
                <span v-for="dia in nombresDiasSemana" :key="dia">{{ dia }}</span>
              </div>
              <div class="calendario-mes-grid">
                <article
                  v-for="dia in calendarioUsuarioMes"
                  :key="dia.clave"
                  class="calendario-mes-dia"
                  :class="{ hoy: dia.fecha === fechaDeHoy, vacio: dia.esRelleno }"
                >
                  <strong v-if="!dia.esRelleno">{{ dia.numero }}</strong>
                  <template v-if="!dia.esRelleno">
                    <div v-if="!dia.turno" class="calendario-mes-no-definido">No definido</div>
                    <div v-else class="calendario-mes-turno" :class="{ libre: dia.turno.libre }">
                      <span>{{ dia.turno.libre ? 'Libre' : 'Turno asignado' }}</span>
                      <small>{{ dia.turno.libre ? 'Libre' : `${dia.turno.horaInicio} - ${dia.turno.horaFin}` }}</small>
                    </div>
                  </template>
                </article>
              </div>
            </div>
          </div>

          <div v-if="false" class="home-grid-row">
            <!-- Mi jornada -->
            <div class="accesos-card">
              <div class="card-header-row">
                <span class="card-title">
                  <ion-icon :icon="timeOutline" />
                  Mi jornada de hoy
                </span>
              </div>

              <div class="toggle-fila asistencia-unica">
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

              <div class="jornada-resumen">
                <div>
                  <p class="jornada-cifra">{{ formatearHoras(horasHoyEnVivo) }}</p>
                  <small>Horas de hoy</small>
                </div>
                <div>
                  <p class="jornada-cifra">{{ formatearMonto(montoHoyEnVivo) }}</p>
                  <small>Ganado hoy</small>
                </div>
              </div>
            </div>

            <!-- Mi próximo turno -->
            <div class="tareas-card">
              <div class="card-header-row">
                <span class="card-title">
                  <ion-icon :icon="calendarClearOutline" />
                  Mi próximo turno
                </span>
              </div>

              <div v-if="!proximoTurno" class="estado-vacio-mini">Sin turnos programados.</div>
              <div v-else class="proximo-turno">
                <p class="proximo-turno-fecha">{{ formatearFecha(proximoTurno?.fecha ?? '') }}</p>
                <p class="proximo-turno-horas">{{ proximoTurno?.horaInicio }} - {{ proximoTurno?.horaFin }}</p>
                <p v-if="proximoTurno?.nota" class="proximo-turno-nota">{{ proximoTurno?.nota }}</p>
              </div>
            </div>
          </div>

          <!-- Mi pago -->
          <div v-if="false" class="config-card">
            <div class="card-header-row">
              <span class="card-title">
                <ion-icon :icon="cashOutline" />
                Mi pago
              </span>
            </div>
            <div class="jornada-resumen tres">
              <div>
                <p class="jornada-cifra">{{ formatearHoras(horasPendientesDe(empleadoActivo?.id ?? '')) }}</p>
                <small>Horas pendientes</small>
              </div>
              <div>
                <p class="jornada-cifra">{{ formatearMonto(empleadoActivo?.pagoPorHora ?? 0) }}</p>
                <small>Pago por hora</small>
              </div>
              <div>
                <p class="jornada-cifra destacada">{{ formatearMonto(montoPendienteDe(empleadoActivo?.id ?? '')) }}</p>
                <small>Total a cobrar ({{ periodoPago }})</small>
              </div>
            </div>
            <p v-if="ultimoPagoDe(empleadoActivo?.id ?? '').value" class="ultimo-pago-texto">
              Último pago recibido: {{ formatearMonto(ultimoPagoDe(empleadoActivo?.id ?? '').value!.monto) }}
            </p>
          </div>
        </template>
      </template>
    </div>

    <ion-modal :is-open="mostrarModalHorario" class="modal-horario" @didDismiss="cerrarModalHorario">
      <div class="modal-contenido horario-modal-contenido">
        <div class="modal-header horario-modal-header">
          <div class="modal-header-left">
            <div class="modal-header-icon">
              <ion-icon :icon="calendarClearOutline" />
            </div>
            <div>
              <p class="modal-titulo">Programar semana</p>
              <p class="modal-subtitulo">Define horarios, almuerzo y días libres</p>
            </div>
          </div>
          <button class="modal-cerrar" type="button" aria-label="Cerrar modal de horarios" @click="cerrarModalHorario">
            <ion-icon :icon="closeOutline" />
          </button>
        </div>

        <label class="modal-label">Empleado</label>
        <select v-model="empleadoHorarioId" class="input-select">
          <option value="" disabled>Selecciona empleado</option>
          <option v-for="emp in empleados" :key="emp.id" :value="emp.id">{{ emp.nombre }}</option>
        </select>

        <label class="modal-label">Inicio de semana</label>
        <input v-model="semanaInicioHorario" type="date" class="input-select" />

        <div class="plantilla-rapida">
          <div class="plantilla-rapida-header">
            <p class="plantilla-rapida-titulo">Copiar horario a varios días</p>
            <p class="plantilla-rapida-subtitulo">Define un horario una vez y aplícalo a los días que elijas, en vez de escribirlo día por día.</p>
          </div>

          <div class="dia-modal-grid">
            <label>
              <span>Entrada</span>
              <input v-model="plantillaRapida.horaInicio" type="time" :disabled="plantillaRapida.libre" class="input-select" />
            </label>
            <label>
              <span>Salida</span>
              <input v-model="plantillaRapida.horaFin" type="time" :disabled="plantillaRapida.libre" class="input-select" />
            </label>
            <label>
              <span>Almuerzo inicio</span>
              <input v-model="plantillaRapida.horaAlmuerzoInicio" type="time" :disabled="plantillaRapida.libre" class="input-select" />
            </label>
            <label>
              <span>Almuerzo fin</span>
              <input v-model="plantillaRapida.horaAlmuerzoFin" type="time" :disabled="plantillaRapida.libre" class="input-select" />
            </label>
          </div>

          <label class="plantilla-rapida-libre">
            <input v-model="plantillaRapida.libre" type="checkbox" />
            <span>Marcar como día libre</span>
          </label>

          <div class="plantilla-rapida-dias">
            <span class="plantilla-rapida-dias-label">Aplicar a:</span>
            <div class="plantilla-rapida-chips">
              <button
                v-for="dia in planSemanaHorario"
                :key="dia.fecha"
                type="button"
                class="chip-dia"
                :class="{ activo: diasSeleccionados.includes(dia.fecha) }"
                :disabled="dia.pasado"
                @click="alternarDiaSeleccionado(dia.fecha)"
              >
                {{ formatearDiaSemana(dia.fecha).slice(0, 3) }}
              </button>
            </div>
            <div class="plantilla-rapida-atajos">
              <button type="button" class="btn-atajo" @click="seleccionarTodosLosDias">Todos</button>
              <button type="button" class="btn-atajo" @click="seleccionarDiasLaborales">Lun-Vie</button>
              <button type="button" class="btn-atajo" @click="limpiarSeleccionDias">Ninguno</button>
            </div>
          </div>

          <ion-button class="btn-aplicar-plantilla" :disabled="!puedeAplicarPlantilla" @click="aplicarPlantillaADias">
            Aplicar a {{ diasSeleccionados.length }} día(s)
          </ion-button>
        </div>

        <div class="dias-modal-lista">
          <article
            v-for="dia in planSemanaHorario"
            :key="dia.fecha"
            class="dia-modal-card"
            :class="{ pasado: dia.pasado, libre: dia.libre && !dia.pasado }"
          >
            <div class="dia-modal-header">
              <div class="dia-modal-header-texto">
                <p class="dia-modal-titulo">{{ formatearDiaSemana(dia.fecha) }}</p>
                <small>{{ formatearFecha(dia.fecha) }}</small>
              </div>

              <span v-if="dia.pasado" class="dia-modal-chip pasado">
                <ion-icon :icon="closeOutline" /> Día ya pasado
              </span>
              <label v-else class="dia-modal-libre">
                <input v-model="dia.libre" type="checkbox" />
                <span>Libre</span>
              </label>
            </div>

            <div v-if="!dia.pasado" class="dia-modal-grid">
              <label>
                <span>Entrada</span>
                <input v-model="dia.horaInicio" type="time" :disabled="dia.libre" class="input-select" />
              </label>
              <label>
                <span>Salida</span>
                <input v-model="dia.horaFin" type="time" :disabled="dia.libre" class="input-select" />
              </label>
              <label>
                <span>Almuerzo inicio</span>
                <input v-model="dia.horaAlmuerzoInicio" type="time" :disabled="dia.libre" class="input-select" />
              </label>
              <label>
                <span>Almuerzo fin</span>
                <input v-model="dia.horaAlmuerzoFin" type="time" :disabled="dia.libre" class="input-select" />
              </label>
            </div>

            <div v-else class="dia-modal-bloqueado-texto">
              No se puede editar el horario de un día que ya pasó.
            </div>

            <div v-if="!dia.pasado && !dia.libre" class="dia-modal-resumen">
              {{ dia.horaInicio && dia.horaFin ? `${dia.horaInicio} - ${dia.horaFin}` : 'Sin horario definido' }}
            </div>
          </article>
        </div>

        <div class="modal-botones">
          <ion-button class="btn-fantasma" @click="cerrarModalHorario">Cancelar</ion-button>
          <ion-button class="btn-primario" :disabled="!puedeGuardarHorario" @click="guardarHorarioSemanal">
            Guardar semana
          </ion-button>
        </div>
      </div>
    </ion-modal>

    <ion-modal :is-open="mostrarModalEditarTurno" class="modal-editar-turno" @didDismiss="cerrarModalEditarTurno">
      <div class="modal-contenido editar-turno-modal-contenido">
        <div class="modal-header horario-modal-header">
          <div class="modal-header-left">
            <div class="modal-header-icon">
              <ion-icon :icon="createOutline" />
            </div>
            <div>
              <p class="modal-titulo">Editar turno</p>
              <p class="modal-subtitulo" v-if="turnoEditando">
                {{ nombreDe(turnoEditando.empleadoId) }} · {{ formatearDiaSemana(turnoEditando.fecha) }} {{ formatearFecha(turnoEditando.fecha) }}
              </p>
            </div>
          </div>
          <button class="modal-cerrar" type="button" aria-label="Cerrar modal de edición" @click="cerrarModalEditarTurno">
            <ion-icon :icon="closeOutline" />
          </button>
        </div>

        <template v-if="turnoEditando">
          <label class="dia-modal-libre editar-turno-libre">
            <input v-model="turnoEditando.libre" type="checkbox" />
            <span>Día libre</span>
          </label>

          <div v-if="!turnoEditando.libre" class="dia-modal-grid">
            <label>
              <span>Entrada</span>
              <input v-model="turnoEditando.horaInicio" type="time" class="input-select" />
            </label>
            <label>
              <span>Salida</span>
              <input v-model="turnoEditando.horaFin" type="time" class="input-select" />
            </label>
            <label>
              <span>Almuerzo inicio</span>
              <input v-model="turnoEditando.horaAlmuerzoInicio" type="time" class="input-select" />
            </label>
            <label>
              <span>Almuerzo fin</span>
              <input v-model="turnoEditando.horaAlmuerzoFin" type="time" class="input-select" />
            </label>
          </div>

          <div class="modal-botones editar-turno-botones">
            <ion-button class="btn-eliminar-turno" @click="eliminarTurnoDesdeModal">
              <ion-icon :icon="trashOutline" slot="start" />
              Eliminar turno
            </ion-button>
            <div class="editar-turno-botones-derecha">
              <ion-button class="btn-fantasma" @click="cerrarModalEditarTurno">Cancelar</ion-button>
              <ion-button class="btn-primario" :disabled="!puedeGuardarEdicionTurno || guardandoEdicionTurno" @click="guardarEdicionTurno">
                Guardar cambios
              </ion-button>
            </div>
          </div>
        </template>
      </div>
    </ion-modal>

    <ion-modal :is-open="mostrarModalReportes" class="modal-reportes" @didDismiss="mostrarModalReportes = false">
      <div class="modal-contenido reportes-modal-contenido">
        <div class="modal-header">
          <div class="modal-header-left">
          </div>
          <button class="modal-cerrar" @click="mostrarModalReportes = false">
            <ion-icon :icon="closeOutline" />
          </button>
        </div>

        <div class="reportes-modal-resumen">
          <article class="reporte-resumen-card">
            <strong>{{ reportesEntradaHoy.length }}</strong>
            <span>Entradas registradas</span>
          </article>
          <article class="reporte-resumen-card warning">
            <strong>{{ tardanzasHoy.length }}</strong>
            <span>Tardanzas notificadas</span>
          </article>
          <article class="reporte-resumen-card calm">
            <strong>{{ notificacionesAdmin.length }}</strong>
            <span>Alertas totales</span>
          </article>
        </div>

        <div class="reportes-modal-grid">
          <section class="reporte-panel">
            <div class="reporte-panel-header">
              <div>
                <p class="subtitulo-lista">Tiempo de Conexión</p>
              </div>
            </div>
            <div v-if="reportesEntradaHoy.length === 0" class="estado-vacio-mini">
              No hay registros de entrada hoy.
            </div>
            <ul v-else class="reporte-lista">
              <li v-for="item in reportesEntradaHoy" :key="item.registro.id" class="reporte-item">
                <div class="reporte-item-block">
                  <div class="reporte-item-main">
                    <span class="empleado-avatar chico">{{ inicial(item.empleado?.nombre ?? '') }}</span>
                    <div class="reporte-item-texto">
                      <p class="reporte-item-nombre">{{ item.empleado?.nombre }}</p>
                      <small>
                        Total trabajado: {{ formatearHoras(item.totalHoras) }} ·
                        Salario estimado: {{ formatearMonto(item.totalMonto) }} ·
                        Entrada: {{ formatearHora(item.registro.horaEntrada) }} ·
                        Salida: {{ formatearHora(item.registro.horaSalida) }}
                      </small>
                    </div>
                  </div>
                  <span
                    class="badge-minutos"
                    :class="{ warning: !!item.puntualidad?.tarde, calm: !item.puntualidad?.tarde }"
                  >
                    {{ item.puntualidad?.tarde ? `Tarde ${item.puntualidad.minutos} min` : 'A tiempo' }}
                  </span>
                </div>
                <div class="reporte-tramos">
                  <div v-for="segmento in item.segmentos" :key="segmento.index" class="tramo-chip" :class="{ activo: segmento.activo }">
                    <strong>Tramo {{ segmento.index + 1 }}</strong>
                    <small>{{ formatearHora(segmento.inicio) }} - {{ formatearHora(segmento.fin) }}</small>
                    <span v-if="segmento.activo">Activo</span>
                  </div>
                </div>
              </li>
              </ul>
          </section>

          <section class="reporte-panel">
            <div class="reporte-panel-header">
              <div>
                <p class="subtitulo-lista">Eventos de jornada</p>
                <strong>Pausas, reanudaciones y tardanzas</strong>
              </div>
            </div>
            <div v-if="eventosJornadaHoy.length === 0" class="estado-vacio-mini">
              No hay eventos reportados hoy.
            </div>
            <ul v-else class="reporte-lista reporte-lista-notas">
              <li v-for="n in eventosJornadaHoy" :key="n.id" class="reporte-item nota">
                <div class="reporte-item-texto">
                  <p class="reporte-item-nombre">{{ n.empleadoNombre }}</p>
                  <small>{{ n.mensaje }}</small>
                  <small>{{ formatearFecha(n.fecha) }} · {{ formatearHora(n.hora) }}</small>
                </div>
                <span
                  class="badge-minutos"
                  :class="{
                    warning: n.tipo === 'entrada_tarde',
                    calm: n.tipo === 'reanudacion',
                  }"
                >
                  {{
                    n.tipo === 'entrada_tarde'
                      ? n.minutos
                        ? `${n.minutos} min`
                        : 'Tarde'
                      : n.tipo === 'reanudacion'
                        ? 'Reanudación'
                        : n.tipo === 'pausa'
                          ? 'Pausa'
                          : 'Salida'
                  }}
                </span>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </ion-modal>

    <ion-modal :is-open="mostrarModalEditarConexion" class="modal-horario-individual" @didDismiss="cerrarEditorConexion">
      <div class="modal-contenido horario-individual-contenido">
        <div class="modal-header horario-modal-header">
          <div class="modal-header-left">
            <div class="modal-header-icon"><ion-icon :icon="createOutline" /></div>
            <div>
              <p class="modal-titulo">Editar tiempo de conexión</p>
              <p class="modal-subtitulo">{{ empleadoConexionEditandoNombre }}</p>
            </div>
          </div>
          <button class="modal-cerrar" type="button" aria-label="Cerrar edición de conexión" @click="cerrarEditorConexion">
            <ion-icon :icon="closeOutline" />
          </button>
        </div>

        <p class="horario-individual-ayuda">
          Corrige las horas de cada registro pendiente. Este ajuste no modifica la entrada ni la salida originales.
        </p>

        <div v-if="registrosConexionEditando.length === 0" class="estado-vacio-mini">
          No hay registros pendientes para editar.
        </div>
        <div v-else class="conexion-edicion-lista">
          <div v-for="registro in registrosConexionEditando" :key="registro.id" class="conexion-edicion-item">
            <div>
              <strong>{{ formatearFecha(registro.fecha) }}</strong>
              <small>{{ registro.horaEntrada ? formatearHora(registro.horaEntrada) : '--:--' }} - {{ registro.horaSalida ? formatearHora(registro.horaSalida) : 'En curso' }}</small>
            </div>
            <label>
              <span>Horas</span>
                <input v-model="horasConexionBorrador[registro.id].horas" type="number" min="0" step="1" class="input-select" />
              </label>
              <label>
                <span>Minutos</span>
                <input v-model="horasConexionBorrador[registro.id].minutos" type="number" min="0" max="59" step="1" class="input-select" />
            </label>
          </div>
        </div>

        <p v-if="errorEdicionConexion" class="horario-individual-error">{{ errorEdicionConexion }}</p>
        <div class="modal-botones">
          <ion-button class="btn-fantasma" @click="cerrarEditorConexion">Cancelar</ion-button>
          <ion-button class="btn-primario" :disabled="guardandoEdicionConexion || registrosConexionEditando.length === 0" @click="guardarEdicionConexion">
            {{ guardandoEdicionConexion ? 'Guardando...' : 'Guardar ajustes' }}
          </ion-button>
        </div>
      </div>
    </ion-modal>
  </AppShell>
</template>
<script setup lang="ts">
import { IonButton, IonIcon, IonModal, onIonViewWillEnter } from '@ionic/vue'
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import AppShell from '@/components/AppShell.vue'
import { useRouter } from 'vue-router'
import { useHorarios, type TurnoProgramado } from '@/composables/Usehorarios'
import { combinarFechaHoraCentroamerica, fechaHoyCentroamerica } from '@/composables/useFechas'
import { useSesion } from '@/composables/useSesion'
import {
  addOutline,
  alertCircleOutline,
  calendarClearOutline,
  cashOutline,
  closeOutline,
  createOutline,
  peopleOutline,
  refreshOutline,
  timeOutline,
  trashOutline,
} from 'ionicons/icons'

const {
  cargando,
  error,
  cargarHorarios,
  empleados,
  periodoPago,
  refrescarPersonal,
  actualizarPagoPorHora,
  encontrarEmpleadoPara,
  turnos,
  registros,
  registroDeHoy,
  registrosDeHoyTodos,
  registrosPendientesDe,
  entradaMarcada,
  salidaMarcada,
  registrarEntrada,
  registrarSalida,
  ventanaEntrada,
  turnoSigueVigente,
  horasDeRegistro,
  montoDeRegistro,
  registrosDe,
  horasPendientesDe,
  montoPendienteDe,
  marcarComoPagado,
  ultimoPagoDe,
  estadoPuntualidad,
  programarTurno,
  programarTurnosSemana,
  guardarTurnosAhora,
  guardarRegistrosAhora,
  eliminarTurnoGuardado,
  turnoDeHoyDe,
  proximoTurnoDe,
  turnosDeFecha,
  turnosSemanaDe,
  todosLosTurnosFuturos,
  notificaciones,
  formatearHora,
  formatearMonto,
  formatearHoras,
  formatearFecha,
  formatearDiaSemana,
  formatearRol,
  verificarAutoSalida,
  cerrarSegmentosVencidos,
} = useHorarios()

const { usuarioActual, esAdministrador } = useSesion()
const router = useRouter()
const navegando = ref(false)
const irA = async (ruta: string) => {
  if (navegando.value) return
  navegando.value = true
  await router.replace(ruta).catch(() => {})
  navegando.value = false
}
const empleadoActivo = computed(() => encontrarEmpleadoPara(usuarioActual.value))

onMounted(async () => {
  await cargarHorarios()
  await refrescarPersonal()
  void centrarDiaActual()
})

onIonViewWillEnter(async () => {
  cerrarSegmentosVencidos()
  await cargarHorarios(true)
  await refrescarPersonal()
  void centrarDiaActual()
})
const ahora = ref(new Date())
let relojId: any = null
onMounted(() => {
   cerrarSegmentosVencidos()
  relojId = setInterval(() => {
    ahora.value = new Date()
    empleados.value.forEach((emp) => verificarAutoSalida(emp.id, ahora.value))
  }, 1000)
})
onUnmounted(() => {
  if (relojId) clearInterval(relojId)
})

const inicial = (nombre: string) => nombre.trim().charAt(0).toUpperCase()
const nombreDe = (empleadoId: string) => empleados.value.find((e) => e.id === empleadoId)?.nombre ?? '—'
const formatearFechaLocal = (fecha: Date) => {
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}
const fechaDeHoy = fechaHoyCentroamerica()
const fechaCalendarioAdmin = ref(fechaDeHoy)
const vistaCalendario = ref<'semana' | 'mes'>('semana')
const mesCalendarioOffset = ref(0)
const nombresDiasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const fechaDesdeMes = (offset: number, dia: number) => {
  const hoy = new Date()
  const fecha = new Date(hoy.getFullYear(), hoy.getMonth() + offset, dia)
  return formatearFechaLocal(fecha)
}

const nombreMesCalendario = computed(() => {
  const fecha = new Date()
  fecha.setMonth(fecha.getMonth() + mesCalendarioOffset.value)
  return fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
})

/* ───────────── Admin: programar turno ───────────── */
interface DiaHorarioModal {
  fecha: string
  libre: boolean
  horaInicio: string
  horaFin: string
  horaAlmuerzoInicio: string
  horaAlmuerzoFin: string
}

const mostrarModalHorario = ref(false)
const mostrarModalHorarioIndividual = ref(false)
const mostrarModalReportes = ref(false)
const empleadoHorarioId = ref('')
const semanaInicioHorario = ref(fechaDeHoy)
const pagosPorHoraEditando = reactive<Record<string, string>>({})
const guardandoHorarioIndividual = ref(false)
const errorHorarioIndividual = ref('')
const horarioIndividual = reactive({
  empleadoId: '',
  fecha: fechaDeHoy,
  horaInicio: '',
  horaFin: '',
  horaAlmuerzoInicio: '',
  horaAlmuerzoFin: '',
})

const mostrarModalEditarConexion = ref(false)
const empleadoConexionEditandoId = ref('')
const horasConexionBorrador = reactive<Record<string, { horas: string; minutos: string }>>({})
const guardandoEdicionConexion = ref(false)
const errorEdicionConexion = ref('')

const registrosConexionEditando = computed(() =>
  empleadoConexionEditandoId.value ? registrosPendientesDe(empleadoConexionEditandoId.value) : []
)

const empleadoConexionEditandoNombre = computed(() =>
  empleados.value.find((empleado) => empleado.id === empleadoConexionEditandoId.value)?.nombre ?? 'Empleado'
)

const abrirEditorConexion = (empleadoId: string) => {
  empleadoConexionEditandoId.value = empleadoId
  errorEdicionConexion.value = ''
  Object.keys(horasConexionBorrador).forEach((id) => delete horasConexionBorrador[id])
  registrosPendientesDe(empleadoId).forEach((registro) => {
    const minutosTotales = Math.max(0, Math.round(horasDeRegistro(registro, ahora.value) * 60))
    horasConexionBorrador[registro.id] = {
      horas: String(Math.floor(minutosTotales / 60)),
      minutos: String(minutosTotales % 60),
    }
  })
  mostrarModalEditarConexion.value = true
}

const cerrarEditorConexion = () => {
  mostrarModalEditarConexion.value = false
  empleadoConexionEditandoId.value = ''
  errorEdicionConexion.value = ''
}

const guardarEdicionConexion = async () => {
  if (guardandoEdicionConexion.value || registrosConexionEditando.value.length === 0) return
  const ajustes = registrosConexionEditando.value.map((registro) => ({
    registro,
    horas: Number(horasConexionBorrador[registro.id]?.horas),
    minutos: Number(horasConexionBorrador[registro.id]?.minutos)
  }))
  if (ajustes.some(({ horas, minutos }) =>
    !Number.isInteger(horas) || horas < 0 ||
    !Number.isInteger(minutos) || minutos < 0 || minutos > 59
  )) {
    errorEdicionConexion.value = 'Ingresa horas enteras y minutos entre 0 y 59.'
    return
  }

  guardandoEdicionConexion.value = true
  errorEdicionConexion.value = ''
  try {
    // Buscar y actualizar los registros por ID en el array principal
    // Esto asegura que Vue detecte correctamente los cambios
    ajustes.forEach(({ registro, horas, minutos }) => {
      const indice = registros.value.findIndex(r => r.id === registro.id)
      if (indice !== -1) {
        const horasAjustadas = Number((horas + minutos / 60).toFixed(2))
        console.log(`Actualizando registro ${registro.id} con ${horasAjustadas} horas ajustadas`)
        // Usar Object.assign para crear una nueva referencia del objeto
        // Esto garantiza que Vue detecte el cambio correctamente
        registros.value[indice] = Object.assign({}, registros.value[indice], {
          horasAjustadas
        })
      }
    })
    console.log('Registros actualizados, guardando...', registros.value.filter(r => ajustes.some(a => a.registro.id === r.id)))
    await guardarRegistrosAhora()
    cerrarEditorConexion()
  } catch (error) {
    console.error('Error al guardar edición de conexión:', error)
    errorEdicionConexion.value = error instanceof Error ? error.message : 'No se pudieron guardar los ajustes.'
  } finally {
    guardandoEdicionConexion.value = false
  }
}

const actualizarPagoPorHoraEnEdicion = (empleadoId: string, valor: string) => {
  pagosPorHoraEditando[empleadoId] = valor
}

const guardarPagoPorHora = (empleadoId: string) => {
  const valor = pagosPorHoraEditando[empleadoId]
  if (valor === undefined || valor.trim() === '') {
    delete pagosPorHoraEditando[empleadoId]
    return
  }
  actualizarPagoPorHora(empleadoId, Number(valor))
  delete pagosPorHoraEditando[empleadoId]
}

const obtenerLunesDeFecha = (fecha: string) => {
  const base = new Date(`${fecha}T00:00:00`)
  const diaSemana = base.getDay()
  const offset = diaSemana === 0 ? -6 : 1 - diaSemana
  base.setDate(base.getDate() + offset)
  return formatearFechaLocal(base)
}

interface DiaHorarioModal {
  fecha: string
  libre: boolean
  horaInicio: string
  horaFin: string
  horaAlmuerzoInicio: string
  horaAlmuerzoFin: string
  pasado: boolean   // 👈 nuevo: true si la fecha ya pasó
}

const esFechaPasada = (fecha: string) => fecha < fechaDeHoy

const crearPlanSemana = (fechaBase: string, empleadoId: string): DiaHorarioModal[] => {
  const lunes = new Date(`${obtenerLunesDeFecha(fechaBase)}T00:00:00`)
  return Array.from({ length: 7 }, (_, i) => {
    const dia = new Date(lunes)
    dia.setDate(lunes.getDate() + i)
    const fecha = formatearFechaLocal(dia)
    const existente = empleadoId
      ? turnos.value.find((t) => t.empleadoId === empleadoId && t.fecha === fecha)
      : null

    if (existente) {
      return {
        fecha,
        libre: !!existente.libre,
        horaInicio: existente.libre ? '' : existente.horaInicio,
        horaFin: existente.libre ? '' : existente.horaFin,
        horaAlmuerzoInicio: existente.horaAlmuerzoInicio ?? '',
        horaAlmuerzoFin: existente.horaAlmuerzoFin ?? '',
        pasado: esFechaPasada(fecha),
      }
    }

    // 👇 Sin horario predeterminado: el admin debe llenarlo
    return {
      fecha,
      libre: false,
      horaInicio: '',
      horaFin: '',
      horaAlmuerzoInicio: '',
      horaAlmuerzoFin: '',
      pasado: esFechaPasada(fecha),
    }
  })
}


const planSemanaHorario = ref<DiaHorarioModal[]>(
  crearPlanSemana(semanaInicioHorario.value, empleadoHorarioId.value)
)

/* ───────────── Plantilla rápida: copiar horario a varios días ───────────── */
const plantillaRapida = reactive({
  horaInicio: '',
  horaFin: '',
  horaAlmuerzoInicio: '',
  horaAlmuerzoFin: '',
  libre: false,
})

const diasSeleccionados = ref<string[]>([])

watch(
  [semanaInicioHorario, empleadoHorarioId],
  ([fecha, empleadoId]) => {
    planSemanaHorario.value = crearPlanSemana(fecha, empleadoId)
    diasSeleccionados.value = [] // las fechas cambiaron, la selección ya no aplica
  },
  { immediate: true }
)


const alternarDiaSeleccionado = (fecha: string) => {
  const idx = diasSeleccionados.value.indexOf(fecha)
  if (idx === -1) {
    diasSeleccionados.value = [...diasSeleccionados.value, fecha]
  } else {
    diasSeleccionados.value = diasSeleccionados.value.filter((f) => f !== fecha)
  }
}

const seleccionarTodosLosDias = () => {
  diasSeleccionados.value = planSemanaHorario.value
    .filter((dia) => !dia.pasado)
    .map((dia) => dia.fecha)
}

const seleccionarDiasLaborales = () => {
  // El plan siempre empieza en lunes (índices 0-4 = lunes a viernes)
  diasSeleccionados.value = planSemanaHorario.value
    .filter((dia, index) => !dia.pasado && index < 5)
    .map((dia) => dia.fecha)
}

const limpiarSeleccionDias = () => {
  diasSeleccionados.value = []
}

const puedeAplicarPlantilla = computed(() => {
  if (diasSeleccionados.value.length === 0) return false
  if (plantillaRapida.libre) return true
  return !!plantillaRapida.horaInicio && !!plantillaRapida.horaFin && plantillaRapida.horaFin > plantillaRapida.horaInicio
})

const aplicarPlantillaADias = () => {
  if (!puedeAplicarPlantilla.value) return
  planSemanaHorario.value = planSemanaHorario.value.map((dia) => {
    if (dia.pasado || !diasSeleccionados.value.includes(dia.fecha)) return dia
    return {
      ...dia,
      libre: plantillaRapida.libre,
      horaInicio: plantillaRapida.libre ? '' : plantillaRapida.horaInicio,
      horaFin: plantillaRapida.libre ? '' : plantillaRapida.horaFin,
      horaAlmuerzoInicio: plantillaRapida.libre ? '' : plantillaRapida.horaAlmuerzoInicio,
      horaAlmuerzoFin: plantillaRapida.libre ? '' : plantillaRapida.horaAlmuerzoFin,
    }
  })
}

const reiniciarPlantillaRapida = () => {
  plantillaRapida.horaInicio = ''
  plantillaRapida.horaFin = ''
  plantillaRapida.horaAlmuerzoInicio = ''
  plantillaRapida.horaAlmuerzoFin = ''
  plantillaRapida.libre = false
  diasSeleccionados.value = []
}

const formatearHora12 = (horaTexto: string | null | undefined) => {
  if (!horaTexto) return '--:--'
  const [h, m] = horaTexto.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return horaTexto
  const periodo = h >= 12 ? 'PM' : 'AM'
  const hora12 = h % 12 === 0 ? 12 : h % 12
  return `${hora12}:${String(m).padStart(2, '0')} ${periodo}`
}

const abrirModalHorario = async () => {
  empleadoHorarioId.value = ''
  semanaInicioHorario.value = fechaDeHoy
  reiniciarPlantillaRapida()

  try {
    await cargarHorarios(true)
  } catch (err) {
    window.alert(err instanceof Error ? err.message : 'No se pudieron cargar los horarios guardados.')
  }

  planSemanaHorario.value = crearPlanSemana(semanaInicioHorario.value, empleadoHorarioId.value)
  mostrarModalHorario.value = true
}

const cerrarModalHorario = () => {
  mostrarModalHorario.value = false
}

const puedeGuardarHorario = computed(() => {
  if (!empleadoHorarioId.value || planSemanaHorario.value.length !== 7) return false
  return planSemanaHorario.value.every((dia) => {
    if (dia.pasado) return true // los pasados no bloquean el guardado, se ignoran
    if (dia.libre) return true
    return !!dia.horaInicio && !!dia.horaFin && dia.horaFin > dia.horaInicio
  })
})

const guardarHorarioSemanal = () => {
  if (!puedeGuardarHorario.value) return
  const empleadoId = empleadoHorarioId.value

  const turnosSemana = planSemanaHorario.value
    .filter((dia) => !dia.pasado) // 👈 no tocar días que ya pasaron
    .map((dia) => ({
      empleadoId,
      fecha: dia.fecha,
      horaInicio: dia.libre ? '00:00' : dia.horaInicio,
      horaFin: dia.libre ? '00:00' : dia.horaFin,
      horaAlmuerzoInicio: dia.libre ? null : (dia.horaAlmuerzoInicio || null),
      horaAlmuerzoFin: dia.libre ? null : (dia.horaAlmuerzoFin || null),
      libre: dia.libre,
      horasExtra: false,
      nota: dia.libre ? 'Libre' : 'Horario semanal',
    }))

  if (turnosSemana.length > 0) {
    programarTurnosSemana(turnosSemana)
  }
  mostrarModalHorario.value = false
}

const abrirModalHorarioIndividual = (fecha = fechaDeHoy) => {
  horarioIndividual.empleadoId = ''
  horarioIndividual.fecha = fecha
  horarioIndividual.horaInicio = ''
  horarioIndividual.horaFin = ''
  horarioIndividual.horaAlmuerzoInicio = ''
  horarioIndividual.horaAlmuerzoFin = ''
  errorHorarioIndividual.value = ''
  mostrarModalHorarioIndividual.value = true
}

const cargarHorarioIndividualExistente = () => {
  if (!horarioIndividual.empleadoId || !horarioIndividual.fecha) return
  const existente = turnos.value.find(
    (turno) => turno.empleadoId === horarioIndividual.empleadoId && turno.fecha === horarioIndividual.fecha
  )
  horarioIndividual.horaInicio = existente && !existente.libre ? existente.horaInicio : ''
  horarioIndividual.horaFin = existente && !existente.libre ? existente.horaFin : ''
  horarioIndividual.horaAlmuerzoInicio = existente?.horaAlmuerzoInicio ?? ''
  horarioIndividual.horaAlmuerzoFin = existente?.horaAlmuerzoFin ?? ''
}

watch(
  [() => horarioIndividual.empleadoId, () => horarioIndividual.fecha],
  cargarHorarioIndividualExistente
)

const cerrarModalHorarioIndividual = () => {
  mostrarModalHorarioIndividual.value = false
}

const puedeGuardarHorarioIndividual = computed(() => {
  const horario = horarioIndividual
  const almuerzoCompleto = !!horario.horaAlmuerzoInicio === !!horario.horaAlmuerzoFin
  return !!horario.empleadoId && !!horario.fecha && !!horario.horaInicio && !!horario.horaFin && horario.horaFin > horario.horaInicio && almuerzoCompleto
})

const guardarHorarioIndividual = async () => {
  if (!puedeGuardarHorarioIndividual.value || guardandoHorarioIndividual.value) return
  guardandoHorarioIndividual.value = true
  errorHorarioIndividual.value = ''
  const horario = horarioIndividual

  programarTurnosSemana([{
    empleadoId: horario.empleadoId,
    fecha: horario.fecha,
    horaInicio: horario.horaInicio,
    horaFin: horario.horaFin,
    horaAlmuerzoInicio: horario.horaAlmuerzoInicio || null,
    horaAlmuerzoFin: horario.horaAlmuerzoFin || null,
    libre: false,
    horasExtra: false,
    nota: 'Horario individual',
  }])

  try {
    await guardarTurnosAhora()
    cerrarModalHorarioIndividual()
  } catch (err) {
    errorHorarioIndividual.value = err instanceof Error ? err.message : 'No se pudo guardar el horario.'
  } finally {
    guardandoHorarioIndividual.value = false
  }
}

/* ───────────── Editar/eliminar un turno individual desde el calendario ───────────── */
interface TurnoEditando {
  id: string
  empleadoId: string
  fecha: string
  libre: boolean
  horaInicio: string
  horaFin: string
  horaAlmuerzoInicio: string
  horaAlmuerzoFin: string
}

const mostrarModalEditarTurno = ref(false)
const guardandoEdicionTurno = ref(false)
const turnoEditando = ref<TurnoEditando | null>(null)

const abrirModalEditarTurno = (turnoId: string) => {
  const turno = turnos.value.find((t) => t.id === turnoId)
  if (!turno) return
  turnoEditando.value = {
    id: turno.id,
    empleadoId: turno.empleadoId,
    fecha: turno.fecha,
    libre: !!turno.libre,
    horaInicio: turno.libre ? '' : turno.horaInicio,
    horaFin: turno.libre ? '' : turno.horaFin,
    horaAlmuerzoInicio: turno.horaAlmuerzoInicio ?? '',
    horaAlmuerzoFin: turno.horaAlmuerzoFin ?? '',
  }
  mostrarModalEditarTurno.value = true
}

const cerrarModalEditarTurno = () => {
  mostrarModalEditarTurno.value = false
  turnoEditando.value = null
}

const puedeGuardarEdicionTurno = computed(() => {
  if (!turnoEditando.value) return false
  if (turnoEditando.value.libre) return true
  return !!turnoEditando.value.horaInicio && !!turnoEditando.value.horaFin && turnoEditando.value.horaFin > turnoEditando.value.horaInicio
})

const guardarEdicionTurno = async () => {
  if (!turnoEditando.value || !puedeGuardarEdicionTurno.value || guardandoEdicionTurno.value) return
  guardandoEdicionTurno.value = true
  const t = turnoEditando.value

  programarTurnosSemana([
    {
      empleadoId: t.empleadoId,
      fecha: t.fecha,
      horaInicio: t.libre ? '00:00' : t.horaInicio,
      horaFin: t.libre ? '00:00' : t.horaFin,
      horaAlmuerzoInicio: t.libre ? null : (t.horaAlmuerzoInicio || null),
      horaAlmuerzoFin: t.libre ? null : (t.horaAlmuerzoFin || null),
      libre: t.libre,
      horasExtra: false,
      nota: t.libre ? 'Libre' : 'Horario editado',
    },
  ])

  try {
    await guardarTurnosAhora()
    cerrarModalEditarTurno()
  } catch (err) {
    window.alert(err instanceof Error ? err.message : 'No se pudo guardar la edición del horario.')
  } finally {
    guardandoEdicionTurno.value = false
  }
}

const eliminarTurnoDesdeModal = async () => {
  if (!turnoEditando.value) return
  try {
    await eliminarTurnoGuardado(turnoEditando.value.id)
    cerrarModalEditarTurno()
  } catch (err) {
    window.alert(err instanceof Error ? err.message : 'No se pudo eliminar el horario.')
  }
}

/* ───────────── Personal: marcaje del empleado vinculado a la sesión ───────────── */
const turnoDeHoy = computed(() =>
  empleadoActivo.value ? turnoDeHoyDe(empleadoActivo.value.id).value : null
)

const ventana = computed(() => ventanaEntrada(turnoDeHoy.value, ahora.value))

const asistenciaActiva = computed(() =>
  empleadoActivo.value ? entradaMarcada(empleadoActivo.value.id) : false
)

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
  return 'Registrar entrada'
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

  if (entradaMarcada(empleadoActivo.value.id)) {
    registrarSalida(empleadoActivo.value.id)
  }
}

const proximoTurno = computed(() =>
  empleadoActivo.value ? proximoTurnoDe(empleadoActivo.value.id).value : null
)

const semanaUsuario = computed(() =>
  empleadoActivo.value ? turnosSemanaDe(empleadoActivo.value.id).value : []
)

const diasSemanaRefs = ref<HTMLElement[]>([])
const centrarDiaActual = async () => {
  if (typeof window === 'undefined' || window.innerWidth > 900 || vistaCalendario.value !== 'semana') return
  await nextTick()
  const indiceHoy = semanaUsuario.value.findIndex((dia) => dia.fecha === fechaDeHoy)
  diasSemanaRefs.value[indiceHoy]?.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'center' })
}

watch([vistaCalendario, semanaUsuario], () => {
  void centrarDiaActual()
}, { flush: 'post' })

const turnosAdminFecha = computed(() => turnosDeFecha(fechaCalendarioAdmin.value).value)
const notificacionesAdmin = computed(() =>
  notificaciones.value.filter((n) => n.destinatario === 'administrador')
)
const notificacionesUsuario = computed(() => {
  const empleadoId = empleadoActivo.value?.id
  if (!empleadoId) return []
  return notificaciones.value
    .filter((n) => n.destinatario === 'usuario' && n.empleadoId === empleadoId)
    .slice(0, 5)
})
const tardanzasHoy = computed(() =>
  notificacionesAdmin.value.filter((n) => n.tipo === 'entrada_tarde')
)
const reportesEntradaHoy = computed(() =>
  registrosDeHoyTodos.value
    .map((registro) => {
      const empleado = empleados.value.find((e) => e.id === registro.empleadoId) ?? null
      const turno = turnoDeHoyDe(registro.empleadoId).value
      const puntualidad = estadoPuntualidad(registro, turno)
      const segmentos = (registro.segmentos ?? []).map((segmento, index) => {
        const inicio = new Date(segmento.inicio)
        const fin = segmento.fin ? new Date(segmento.fin) : null
        const horas = Math.max(((fin ?? ahora.value).getTime() - inicio.getTime()) / 1000 / 60 / 60, 0)
        return {
          index,
          inicio: segmento.inicio,
          fin: segmento.fin,
          horas,
          activo: !segmento.fin,
        }
      })
      return {
        registro,
        empleado,
        turno,
        puntualidad,
        segmentos,
        totalHoras: horasDeRegistro(registro, ahora.value),
        totalMonto: montoDeRegistro(registro, ahora.value),
      }
    })
    .filter((item) => !!item.empleado)
    .sort((a, b) => (a.registro.horaEntrada ?? '').localeCompare(b.registro.horaEntrada ?? ''))
)

const eventosJornadaHoy = computed(() =>
  notificacionesAdmin.value
    .filter((n) => ['entrada_tarde', 'salida', 'pausa', 'reanudacion'].includes(n.tipo))
    .sort((a, b) => a.creadaAt.localeCompare(b.creadaAt))
)

const calendarioAdminSemana = computed(() => {
  const hoy = new Date()
  const diaSemana = hoy.getDay()
  const offsetALunes = diaSemana === 0 ? -6 : 1 - diaSemana
  const lunes = new Date(hoy)
  lunes.setHours(0, 0, 0, 0)
  lunes.setDate(hoy.getDate() + offsetALunes)

  const dias: Array<{
    fecha: string
    turnos: Array<{
      id: string
      empleadoId: string
      nombre: string
      horaInicio: string
      horaFin: string
      libre?: boolean
      horasExtra?: boolean
    }>
  }> = []

  for (let i = 0; i < 7; i++) {
    const d = new Date(lunes)
    d.setDate(lunes.getDate() + i)
    const fecha = formatearFechaLocal(d)
    const turnosDia = turnos.value
      .filter((t) => t.fecha === fecha)
      .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
      .map((t) => ({
        id: t.id,
        empleadoId: t.empleadoId,
        nombre: nombreDe(t.empleadoId),
        horaInicio: t.horaInicio,
        horaFin: t.horaFin,
        libre: t.libre,
        horasExtra: t.horasExtra,
      }))
    dias.push({ fecha, turnos: turnosDia })
  }

  return dias
})

type DiaCalendarioAdmin = {
  clave: string
  fecha: string
  numero: number
  esRelleno: boolean
  turnos: Array<{
    id: string
    nombre: string
    horaInicio: string
    horaFin: string
    libre?: boolean
  }>
}

type DiaCalendarioUsuario = {
  clave: string
  fecha: string
  numero: number
  esRelleno: boolean
  turno: TurnoProgramado | null
}

const calendarioAdminMes = computed<DiaCalendarioAdmin[]>(() => {
  const hoy = new Date()
  const anio = hoy.getFullYear()
  const mes = hoy.getMonth() + mesCalendarioOffset.value
  const primerDia = new Date(anio, mes, 1)
  const diasDelMes = new Date(anio, mes + 1, 0).getDate()
  const espaciosIniciales = (primerDia.getDay() + 6) % 7
  const dias: DiaCalendarioAdmin[] = []

  for (let i = 0; i < espaciosIniciales; i++) {
    dias.push({ clave: `relleno-inicio-${i}`, fecha: '', numero: 0, esRelleno: true, turnos: [] })
  }

  for (let numero = 1; numero <= diasDelMes; numero++) {
    const fecha = fechaDesdeMes(mesCalendarioOffset.value, numero)
    const turnosDia = turnos.value
      .filter((turno) => turno.fecha === fecha)
      .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
      .map((turno) => ({
        id: turno.id,
        nombre: nombreDe(turno.empleadoId),
        horaInicio: turno.horaInicio,
        horaFin: turno.horaFin,
        libre: turno.libre
      }))
    dias.push({ clave: fecha, fecha, numero, esRelleno: false, turnos: turnosDia })
  }

  return dias
})

const calendarioUsuarioMes = computed<DiaCalendarioUsuario[]>(() => {
  const hoy = new Date()
  const anio = hoy.getFullYear()
  const mes = hoy.getMonth() + mesCalendarioOffset.value
  const primerDia = new Date(anio, mes, 1)
  const diasDelMes = new Date(anio, mes + 1, 0).getDate()
  const espaciosIniciales = (primerDia.getDay() + 6) % 7
  const dias: DiaCalendarioUsuario[] = []
  const empleadoId = empleadoActivo.value?.id

  for (let i = 0; i < espaciosIniciales; i++) {
    dias.push({ clave: `relleno-inicio-${i}`, fecha: '', numero: 0, esRelleno: true, turno: null })
  }

  for (let numero = 1; numero <= diasDelMes; numero++) {
    const fecha = fechaDesdeMes(mesCalendarioOffset.value, numero)
    const turno = empleadoId
      ? turnos.value.find((turno) => turno.empleadoId === empleadoId && turno.fecha === fecha) ?? null
      : null
    dias.push({ clave: fecha, fecha, numero, esRelleno: false, turno })
  }

  return dias
})

const estadoJornadaAdmin = (empleadoId: string) => {
  const turno = turnoDeHoyDe(empleadoId).value
  if (!turno || turno.libre) {
    return { texto: 'Fuera de horario', clase: 'gris', accion: 'Fuera de horario', modo: 'bloqueado' }
  }

  const registro = registroDeHoy(empleadoId)
  const inicio = combinarFechaHoraCentroamerica(turno.fecha, turno.horaInicio).getTime()
  const fin = combinarFechaHoraCentroamerica(turno.fecha, turno.horaFin).getTime()
  const ahoraMs = ahora.value.getTime()
  const fueraDeHorario = ahoraMs < inicio - 60 * 1000 || ahoraMs > fin + 60 * 1000

  // ⬇️ Esto va primero: si sigue conectado, mándalo así aunque ya pasó el horario
  if (entradaMarcada(empleadoId)) {
    return { texto: 'Conectado', clase: 'verde', accion: 'Desconectar', modo: 'desconectar' }
  }

  if (fueraDeHorario) {
    if (registro && salidaMarcada(empleadoId)) {
      return { texto: 'Finalizado', clase: 'gris', accion: 'Cerrado', modo: 'bloqueado' }
    }
    return { texto: 'Fuera de horario', clase: 'gris', accion: 'Fuera de horario', modo: 'bloqueado' }
  }

  if (registro && salidaMarcada(empleadoId) && turnoSigueVigente(turno, ahora.value)) {
    return { texto: 'Pausado', clase: 'amarillo', accion: 'Reanudar', modo: 'reconectar' }
  }

  const tarde = ahoraMs > inicio + 60 * 1000
  return {
    texto: tarde ? 'Con retraso' : 'Pendiente',
    clase: tarde ? 'rojo' : 'gris',
    accion: 'Conectar',
    modo: 'conectar',
  }
}

const alternarConexionAdmin = (empleadoId: string) => {
  const estado = estadoJornadaAdmin(empleadoId)
  if (estado.accion === 'Desconectar') {
    registrarSalida(empleadoId)
    return
  }
  if (estado.accion === 'Conectar' || estado.accion === 'Reanudar') {
    registrarEntrada(empleadoId)
  }
}

const formatearDuracion = (horas: number) => {
  const totalMinutos = Math.max(Math.round(horas * 60), 0)
  const horasEnteras = Math.floor(totalMinutos / 60)
  const minutos = totalMinutos % 60
  if (horasEnteras === 0) return `${minutos} min`
  if (minutos === 0) return `${horasEnteras} h`
  return `${horasEnteras} h ${String(minutos).padStart(2, '0')} min`
}

const resumenJornadaAdmin = (empleadoId: string) => {
  const turno = turnoDeHoyDe(empleadoId).value
  const registro = registroDeHoy(empleadoId)
  const ultimoRegistro = registrosDe(empleadoId).value[0] ?? null
  const estado = estadoJornadaAdmin(empleadoId)
  const horas = registro ? horasDeRegistro(registro, ahora.value) : 0
  const salario = registro ? montoDeRegistro(registro, ahora.value) : 0
  const horasUltimo = ultimoRegistro ? horasDeRegistro(ultimoRegistro, ahora.value) : 0
  const salarioUltimo = ultimoRegistro ? montoDeRegistro(ultimoRegistro, ahora.value) : 0
  const usaUltimo = !registro && !!ultimoRegistro

  if (!turno || turno.libre) {
    return {
      texto: 'Sin turno hoy',
      detalle: 'No tiene horario asignado.',
      clase: 'gris',
    }
  }

  if (entradaMarcada(empleadoId)) {
    return {
      texto: `Conectado desde ${formatearHora(registro?.horaEntrada ?? null)}`,
      detalle: `Lleva ${formatearDuracion(horas)} · Salario ${formatearMonto(salario)}`,
      clase: 'verde',
    }
  }

  if (salidaMarcada(empleadoId) && turnoSigueVigente(turno, ahora.value)) {
    return {
      texto: `Pausado desde ${formatearHora(registro?.horaSalida ?? null)}`,
      detalle: `Tiempo acumulado ${formatearDuracion(horas)} · Salario ${formatearMonto(salario)}`,
      clase: 'amarillo',
    }
  }

  if (salidaMarcada(empleadoId)) {
    return {
      texto: `Cerrado a las ${formatearHora(registro?.horaSalida ?? null)}`,
      detalle: `Tiempo total ${formatearDuracion(horas)} · Salario ${formatearMonto(salario)}`,
      clase: 'gris',
    }
  }

  if (usaUltimo) {
    const tarifa = empleados.value.find((e) => e.id === empleadoId)?.pagoPorHora ?? 0
    return {
      texto: `Último turno ${formatearFecha(ultimoRegistro?.fecha ?? '')}`,
      detalle:
        tarifa > 0
          ? `Trabajó ${formatearDuracion(horasUltimo)} · Ganó ${formatearMonto(salarioUltimo)}`
          : `Trabajó ${formatearDuracion(horasUltimo)} · Sin tarifa por hora asignada`,
      clase: 'gris',
    }
  }

  return {
    texto: estado.texto === 'Pendiente tardío' ? 'Aún no entra' : 'Pendiente de conexión',
    detalle: `Inicio ${turno.horaInicio} · Salario estimado ${formatearMonto(salario)}`,
    clase: estado.clase,
  }
}

const horasHoyEnVivo = computed(() => {
  if (!empleadoActivo.value) return 0
  const r = registroDeHoy(empleadoActivo.value.id)
  if (!r || !r.horaEntrada) return 0
  return horasDeRegistro(r, ahora.value)
})

const montoHoyEnVivo = computed(() => {
  if (!empleadoActivo.value) return 0
  const r = registroDeHoy(empleadoActivo.value.id)
  if (!r || !r.horaEntrada) return 0
  return montoDeRegistro(r, ahora.value)
})
</script>

<style scoped>
.horarios-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  color-scheme: light;
}

/* ── Tarjeta base ── */
.config-card {
  background: #ffffff;
  border: 1px solid rgba(10, 31, 56, 0.07);
  border-radius: 18px;
  padding: 20px 22px;
  box-shadow: 0 6px 20px rgba(10, 31, 56, 0.05);
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: box-shadow 0.2s ease;
}

.usuario-card {
  background: linear-gradient(135deg, #ffffff 0%, #f6faff 100%);
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
  letter-spacing: 0.07em;
}

.panel-reportes {
  background: linear-gradient(180deg, #ffffff 0%, #f8fbfe 100%);
}

.btn-reportes {
  border: none;
  background: rgba(18, 58, 102, 0.08);
  color: #123a66;
  font-weight: 800;
  font-size: 0.8rem;
  padding: 9px 14px;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.btn-reportes:hover {
  background: rgba(18, 58, 102, 0.16);
}

.reportes-resumen,
.reportes-modal-resumen {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.calendario-admin-card,
.config-card:has(.calendario-semana-grid) {
  overflow: hidden;
}

.reporte-resumen-card {
  background: #f5f9fc;
  border: 1px solid rgba(10, 31, 56, 0.06);
  border-radius: 16px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.reporte-resumen-card strong {
  font-size: 1.35rem;
  color: #0a1f38;
}

.reporte-resumen-card span {
  font-size: 0.78rem;
  color: #6d829c;
  font-weight: 700;
}

.reporte-resumen-card.warning {
  background: rgba(217, 119, 6, 0.08);
}

.reporte-resumen-card.warning strong,
.badge-minutos.warning {
  color: #b45309;
}

.reporte-resumen-card.calm {
  background: rgba(18, 58, 102, 0.08);
}

.reporte-resumen-card.calm strong,
.badge-minutos.calm {
  color: #123a66;
}

.config-add-btn {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  border: none;
  background: rgba(18, 58, 102, 0.08);
  color: #123a66;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: background 0.15s ease;
}

.config-add-btn:hover {
  background: rgba(18, 58, 102, 0.16);
}

/* ── Usuario actual ── */
.usuario-actual {
  display: flex;
  align-items: center;
  gap: 12px;
}

.usuario-nombre {
  margin: 0;
  font-weight: 800;
  color: #0a1f38;
  font-size: 0.98rem;
}

.usuario-actual small {
  color: #6d829c;
  font-size: 0.78rem;
}

/* ── Grid de dos columnas (Pagos y Conexión / Nómina) ── */
.home-grid-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  align-items: start;
}

.home-grid-row > * {
  min-width: 0;
}

.accesos-card,
.tareas-card {
  background: #ffffff;
  border: 1px solid rgba(10, 31, 56, 0.07);
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 6px 20px rgba(10, 31, 56, 0.05);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.card-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 9px;
  font-weight: 800;
  color: #0a1f38;
  font-size: 1.02rem;
}

.card-title ion-icon {
  color: #123a66;
  font-size: 19px;
}

/* ── Estados vacíos ── */
.estado-vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 4px;
  padding: 30px 12px;
  color: #6d829c;
}

.estado-vacio-icon {
  font-size: 34px;
  color: #a9c3d8;
  margin-bottom: 4px;
}

.estado-vacio-titulo {
  margin: 0;
  font-weight: 800;
  color: #0a1f38;
}

.estado-vacio-texto {
  margin: 0;
  font-size: 0.86rem;
  max-width: 360px;
}

.estado-vacio-mini {
  color: #9fb4c9;
  font-size: 0.85rem;
  text-align: center;
  padding: 14px 0;
}

/* ── Lista de empleados ── */
.lista-empleados {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 520px;
  overflow-y: auto;
}

.empleado-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  background: #f5f9fc;
  flex-wrap: wrap;
  transition: background 0.15s ease;
}

.empleado-item:hover {
  background: #eef4fa;
}

.empleado-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.empleado-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, #123a66 0%, #1c4f88 100%);
  color: #f5f9fc;
  display: grid;
  place-items: center;
  font-weight: 800;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.empleado-avatar.chico {
  width: 28px;
  height: 28px;
  font-size: 0.75rem;
}

.empleado-texto {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.empleado-nombre {
  font-weight: 700;
  color: #0a1f38;
  font-size: 0.92rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empleado-rol-chip {
  align-self: flex-start;
  font-size: 0.7rem;
  font-weight: 800;
  color: #4a627e;
  background: rgba(74, 98, 126, 0.1);
  padding: 2px 8px;
  border-radius: 999px;
}

.empleado-pago {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #ffffff;
  border: 1px solid rgba(10, 31, 56, 0.1);
  border-radius: 10px;
  padding: 5px 9px;
  font-weight: 700;
  color: #0a1f38;
  flex-shrink: 0;
}

.empleado-pago input {
  width: 56px;
  border: none;
  outline: none;
  font-weight: 700;
  color: #0a1f38;
  background: transparent;
}

.empleado-pago-sufijo {
  color: #6d829c;
  font-size: 0.78rem;
}

.empleado-estado-admin {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-left: auto;
}

.badge-jornada {
  font-size: 0.72rem;
  font-weight: 800;
  padding: 5px 10px;
  border-radius: 999px;
  white-space: nowrap;
}

.badge-jornada.verde {
  background: rgba(22, 163, 74, 0.14);
  color: #15803d;
}

.badge-jornada.rojo {
  background: rgba(220, 38, 38, 0.14);
  color: #b91c1c;
}

.badge-jornada.gris {
  background: rgba(148, 163, 184, 0.18);
  color: #64748b;
}

.badge-jornada.amarillo {
  background: rgba(245, 158, 11, 0.16);
  color: #b45309;
}

.btn-estado-admin {
  border: none;
  border-radius: 10px;
  padding: 8px 12px;
  font-weight: 800;
  font-size: 0.78rem;
  cursor: pointer;
  color: #0a1f38;
  background: #e2e8f0;
  transition: filter 0.15s ease;
}

.btn-estado-admin:hover:not(:disabled) {
  filter: brightness(0.96);
}

.btn-estado-admin.modo-conectar {
  background: rgba(22, 163, 74, 0.12);
  color: #15803d;
}

.btn-estado-admin.modo-reconectar {
  background: rgba(245, 158, 11, 0.16);
  color: #b45309;
}

.btn-estado-admin.modo-desconectar {
  background: rgba(220, 38, 38, 0.12);
  color: #b91c1c;
}

.btn-estado-admin.modo-bloqueado {
  background: rgba(148, 163, 184, 0.18);
  color: #64748b;
  cursor: not-allowed;
}

.btn-estado-admin:disabled {
  opacity: 0.65;
}

/* ── Formulario / inputs comunes ── */
.input-select {
  width: 100%;
  border: 1px solid rgba(10, 31, 56, 0.14);
  background: #f5f9fc;
  border-radius: 11px;
  padding: 11px 12px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #0a1f38;
  outline: none;
  transition: border-color 0.15s ease;
}

.input-select:focus {
  border-color: rgba(18, 58, 102, 0.4);
}

.subtitulo-lista {
  margin: 4px 0 0;
  font-size: 0.78rem;
  font-weight: 800;
  color: #6d829c;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge-minutos {
  flex-shrink: 0;
  border-radius: 999px;
  padding: 4px 10px;
  background: rgba(217, 119, 6, 0.14);
  color: #b45309;
  font-size: 0.72rem;
  font-weight: 800;
}

/* ── Nómina (lista de pagos) ── */
.lista-pagos {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 520px;
  overflow-y: auto;
}

.pago-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border-radius: 14px;
  background: #f5f9fc;
  flex-wrap: wrap;
}

.pago-info {
  flex: 1;
  min-width: 160px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.pago-nombre {
  margin: 0;
  font-weight: 700;
  color: #0a1f38;
  font-size: 0.9rem;
}

.pago-info small {
  color: #6d829c;
  font-size: 0.78rem;
}

.pago-monto {
  text-align: right;
  min-width: 100px;
}

.pago-monto-cifra {
  display: block;
  font-weight: 800;
  color: #0a1f38;
  font-size: 1.08rem;
}

.pago-monto small {
  color: #9fb4c9;
  font-size: 0.72rem;
}

.btn-pagar {
  border: none;
  border-radius: 11px;
  padding: 10px 15px;
  background: #123a66;
  color: #f5f9fc;
  font-weight: 700;
  font-size: 0.82rem;
  cursor: pointer;
  transition: filter 0.15s ease;
}

.btn-editar-conexion {
  border: 1px solid rgba(18, 58, 102, 0.2);
  border-radius: 10px;
  padding: 9px 12px;
  background: #f5f9fc;
  color: #123a66;
  font-weight: 800;
  font-size: 0.76rem;
  cursor: pointer;
}

.btn-editar-conexion:hover {
  background: #e7f0f8;
}

.conexion-edicion-lista {
  display: flex;
  flex-direction: column;
  gap: 9px;
  max-height: 360px;
  overflow-y: auto;
  margin: 14px 0;
}

.conexion-edicion-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 11px 12px;
  border: 1px solid rgba(10, 31, 56, 0.1);
  border-radius: 11px;
  background: #f8fbfd;
}

.conexion-edicion-item > div {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.conexion-edicion-item small {
  color: #6f8399;
}

.conexion-edicion-item label {
  width: 112px;
  flex-shrink: 0;
}

.conexion-edicion-item label span {
  display: block;
  margin-bottom: 4px;
  color: #526b82;
  font-size: 0.72rem;
  font-weight: 800;
}

.btn-pagar:hover:not(:disabled) {
  filter: brightness(1.08);
}

.btn-pagar:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* ── Toggles de entrada / salida ── */
.toggle-fila {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-radius: 12px;
  background: #f5f9fc;
}

.toggle-texto {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.toggle-texto span {
  font-weight: 700;
  color: #0a1f38;
  font-size: 0.92rem;
}

.toggle-texto small {
  color: #6d829c;
  font-size: 0.78rem;
}

.asistencia-unica {
  border: 1px solid rgba(18, 58, 102, 0.08);
  background: linear-gradient(180deg, #f7fbff 0%, #eef5fb 100%);
}

.switch {
  position: relative;
  width: 50px;
  height: 28px;
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
  background: #d6e2ec;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.switch-riel::before {
  content: '';
  position: absolute;
  width: 22px;
  height: 22px;
  left: 3px;
  top: 3px;
  background: #ffffff;
  border-radius: 50%;
  transition: transform 0.2s ease;
  box-shadow: 0 1px 3px rgba(10, 31, 56, 0.25);
}

.switch input:checked + .switch-riel {
  background: #123a66;
}

.switch input:checked + .switch-riel::before {
  transform: translateX(22px);
}

.switch input:disabled + .switch-riel {
  opacity: 0.45;
  cursor: not-allowed;
}

/* ── Resumen de jornada / pago ── */
.jornada-resumen {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  text-align: center;
  padding-top: 4px;
}

.jornada-resumen.tres {
  grid-template-columns: 1fr 1fr 1fr;
}

.jornada-cifra {
  margin: 0;
  font-weight: 800;
  color: #0a1f38;
  font-size: 1.15rem;
}

.jornada-cifra.destacada {
  color: #123a66;
}

.jornada-resumen small {
  color: #6d829c;
  font-size: 0.76rem;
}

.ultimo-pago-texto {
  margin: 4px 0 0;
  font-size: 0.82rem;
  color: #6d829c;
}

/* ── Próximo turno (personal, oculto pero conservado) ── */
.proximo-turno {
  background: #f5f9fc;
  border-radius: 12px;
  padding: 14px;
  text-align: center;
}

.proximo-turno-fecha {
  margin: 0;
  font-weight: 800;
  color: #0a1f38;
  text-transform: capitalize;
}

.proximo-turno-horas {
  margin: 4px 0 0;
  color: #123a66;
  font-weight: 700;
  font-size: 1.1rem;
}

.proximo-turno-nota {
  margin: 6px 0 0;
  color: #6d829c;
  font-size: 0.82rem;
}

/* ── Vista semanal personal ── */
.calendario-semana-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(120px, 1fr));
  gap: 12px;
}

.dia-semana-card {
  position: relative;
  padding: 14px;
  border-radius: 16px;
  background: #f5f9fc;
  border: 2px solid transparent;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.dia-semana-card.hoy {
  border-color: #16a34a;
  background: linear-gradient(180deg, #f3fbf6 0%, #eafaf0 100%);
  box-shadow: 0 8px 20px rgba(22, 163, 74, 0.14);
}

.dia-semana-titulo,
.dia-semana-fecha {
  margin: 0;
  text-transform: capitalize;
}

.dia-semana-titulo {
  font-size: 0.82rem;
  font-weight: 800;
  color: #0a1f38;
}

.dia-semana-fecha {
  font-size: 0.74rem;
  color: #6d829c;
}

.dia-semana-turno {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #123a66;
  font-size: 0.82rem;
}

.dia-semana-turno.libre {
  color: #6d829c;
}

.dia-semana-turno strong {
  font-size: 0.88rem;
}

/* ── Chip "Hoy" reutilizable ── */
.chip-hoy {
  align-self: flex-start;
  font-size: 0.66rem;
  font-weight: 800;
  color: #15803d;
  background: rgba(22, 163, 74, 0.14);
  padding: 3px 9px;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* ── Modales generales ── */
.modal-horario {
  --width: min(920px, calc(100vw - 24px));
  --height: fit-content;
  --min-height: 0;
  --max-height: 92vh;
  --border-radius: 24px;
  --backdrop-opacity: 0.5;
}

.modal-horario-individual {
  --width: min(520px, calc(100vw - 24px));
  --height: fit-content;
  --max-height: 92vh;
  --background: #ffffff;
  --ion-background-color: #ffffff;
  --ion-text-color: #0a1f38;
  color-scheme: light;
}

.modal-horario-individual::part(content) {
  background: #ffffff !important;
  color: #0a1f38;
}

.horario-individual-contenido {
  width: min(520px, calc(100vw - 24px));
  max-height: 92vh;
  overflow: auto;
  box-sizing: border-box;
  background: #ffffff !important;
  color: #0a1f38 !important;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.horario-individual-contenido .input-select {
  background: #f5f9fc !important;
  color: #0a1f38 !important;
  color-scheme: light;
}

.horario-modal-contenido {
  max-width: 920px;
  width: min(920px, calc(100vw - 24px));
  max-height: 92vh;
  height: fit-content;
  overflow: auto;
  background: linear-gradient(180deg, #ffffff 0%, #f4f8fc 100%);
  padding: 28px 30px;
  display: flex;
  flex-direction: column;
  color: #0a1f38;
  gap: 18px;
}

.horario-modal-header {
  position: sticky;
  top: 0;
  z-index: 12;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px;
  margin: -4px -4px 2px;
  border-radius: 16px;
  border: 1px solid rgba(18, 58, 102, 0.11);
  background: linear-gradient(135deg, #eef5ff 0%, #f8fbff 55%, #f4f8fc 100%);
}

.modal-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.modal-header-icon {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  color: #123a66;
  background: #ffffff;
  border: 1px solid rgba(18, 58, 102, 0.16);
  box-shadow: 0 6px 14px rgba(18, 58, 102, 0.1);
  flex-shrink: 0;
}

.modal-header-icon ion-icon {
  font-size: 18px;
}

.modal-titulo {
  margin: 0;
  font-weight: 800;
  font-size: 1.02rem;
  color: #0a1f38;
}

.modal-subtitulo {
  margin: 2px 0 0;
  font-size: 0.78rem;
  color: #4a627e;
}

.modal-cerrar {
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 10px;
  background: rgba(10, 31, 56, 0.08);
  color: #123a66;
  display: grid;
  place-items: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background-color 0.15s ease, transform 0.15s ease;
}

.modal-cerrar ion-icon {
  font-size: 18px;
}

.modal-cerrar:hover {
  background: rgba(18, 58, 102, 0.18);
  transform: translateY(-1px);
}

.modal-cerrar:focus-visible {
  outline: 2px solid rgba(18, 58, 102, 0.55);
  outline-offset: 2px;
}

.dias-modal-lista {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  max-height: 62vh;
  overflow: auto;
  padding: 4px 2px;
}

.dia-modal-card {
  border: 1px solid rgba(10, 31, 56, 0.08);
  border-radius: 18px;
  padding: 16px;
  background: #ffffff;
  box-shadow: 0 6px 16px rgba(10, 31, 56, 0.05);
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.dia-modal-card:hover {
  border-color: rgba(18, 58, 102, 0.18);
}

.dia-modal-card.libre {
  background: linear-gradient(180deg, #fffdf5 0%, #fff9ec 100%);
  border-color: rgba(217, 119, 6, 0.2);
}

.dia-modal-card.pasado {
  background: #f1f4f7;
  border-color: rgba(10, 31, 56, 0.06);
  opacity: 0.75;
}

.dia-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.dia-modal-header-texto {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dia-modal-titulo {
  margin: 0;
  font-weight: 800;
  color: #0a1f38;
  font-size: 0.95rem;
  text-transform: capitalize;
}

.dia-modal-header small {
  color: #6d829c;
  font-size: 0.76rem;
}

.dia-modal-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.7rem;
  font-weight: 800;
  padding: 4px 9px;
  border-radius: 999px;
  white-space: nowrap;
}

.dia-modal-chip.pasado {
  background: rgba(148, 163, 184, 0.22);
  color: #64748b;
}

.dia-modal-chip ion-icon {
  font-size: 12px;
}

.dia-modal-libre {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  color: #4a627e;
  font-weight: 700;
}

.dia-modal-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.dia-modal-grid label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: #4a627e;
  font-size: 0.75rem;
  font-weight: 700;
}

.dia-modal-resumen {
  border-top: 1px dashed rgba(10, 31, 56, 0.1);
  padding-top: 10px;
  font-size: 0.82rem;
  font-weight: 800;
  color: #123a66;
  text-align: center;
}

.dia-modal-bloqueado-texto {
  font-size: 0.78rem;
  color: #94a3b8;
  text-align: center;
  padding: 10px 0 2px;
}

.modal-horario::part(content) {
  height: fit-content;
  min-height: 0;
  max-height: 92vh;
  display: flex;
}

.modal-horario .modal-contenido {
  width: 100%;
}

.reportes-modal-contenido {
  max-width: 980px;
  width: min(980px, calc(100vw - 28px));
  max-height: 90vh;
  height: fit-content;
  overflow: auto;
  background: linear-gradient(180deg, #ffffff 0%, #f7fafc 100%);
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.modal-reportes {
  --width: min(980px, calc(100vw - 28px));
  --height: fit-content;
  --min-height: 0;
  --border-radius: 22px;
  --backdrop-opacity: 0.42;
}

.modal-reportes::part(content) {
  height: fit-content;
  min-height: 0;
  max-height: 90vh;
  display: flex;
}

.modal-reportes .modal-contenido {
  width: 100%;
}

.reportes-modal-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.reporte-panel {
  border: 1px solid rgba(10, 31, 56, 0.08);
  border-radius: 16px;
  background: #ffffff;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.reporte-panel-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}

.reporte-panel-header strong {
  color: #0a1f38;
}

.reporte-lista {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reporte-item {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
  padding: 11px 12px;
  border-radius: 12px;
  background: #f5f9fc;
}

.reporte-item.nota {
  background: linear-gradient(180deg, #f7fbff 0%, #eef5fb 100%);
}

.reporte-item-block {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.reporte-item-main {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
}

.reporte-item-texto {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.reporte-item-nombre {
  margin: 0;
  color: #0a1f38;
  font-weight: 800;
  font-size: 0.88rem;
}

.reporte-item-texto small {
  color: #6d829c;
  font-size: 0.75rem;
  line-height: 1.25;
}

.reporte-lista-notas .reporte-item {
  flex-direction: row;
}

.reporte-tramos {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tramo-chip {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 10px;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid rgba(10, 31, 56, 0.08);
  min-width: 150px;
}

.tramo-chip strong {
  color: #0a1f38;
  font-size: 0.78rem;
}

.tramo-chip small {
  color: #123a66;
  font-size: 0.74rem;
}

.tramo-chip span {
  color: #16a34a;
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.tramo-chip.activo {
  border-color: rgba(22, 163, 74, 0.22);
  background: rgba(22, 163, 74, 0.08);
}

/* ── Calendario admin (encabezado con botón en esquina) ── */
.calendario-admin-card {
  background: linear-gradient(180deg, #ffffff 0%, #f8fbfe 100%);
}

.calendario-admin-header {
  align-items: flex-start;
}

.calendario-admin-acciones {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.calendario-controles {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  border-radius: 11px;
  background: #eef4f8;
}

.calendario-controles button {
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  background: transparent;
  color: #6d829c;
  font-size: 0.78rem;
  font-weight: 800;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.calendario-controles button.active {
  background: #123a66;
  color: #ffffff;
}

.btn-programar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: none;
  border-radius: 12px;
  padding: 10px 16px;
  background: linear-gradient(135deg, #123a66 0%, #1c4f88 100%);
  color: #f5f9fc;
  font-weight: 800;
  font-size: 0.84rem;
  cursor: pointer;
  box-shadow: 0 6px 16px rgba(18, 58, 102, 0.22);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  white-space: nowrap;
}

.btn-programar:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(18, 58, 102, 0.28);
}

/* ── Vista mensual ── */
.calendario-mensual {
  display: grid;
  gap: 14px;
  min-width: 0;
}

.calendario-mes-navegacion {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #0a1f38;
  text-transform: capitalize;
}

.calendario-mes-navegacion strong {
  color: #123a66;
  font-size: 1.08rem;
  text-align: center;
}

.calendario-flecha {
  border: 1px solid rgba(18, 58, 102, 0.14);
  border-radius: 10px;
  padding: 8px 12px;
  background: #ffffff;
  color: #123a66;
  font-size: 0.76rem;
  font-weight: 800;
  cursor: pointer;
  transition: background 0.15s ease;
}

.calendario-flecha:hover:not(:disabled) {
  background: rgba(18, 58, 102, 0.08);
}

.calendario-flecha:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.calendario-mes-cabecera,
.calendario-mes-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 7px;
}

.calendario-mes-grid {
  grid-auto-rows: minmax(100px, auto);
}

.calendario-mes-cabecera {
  color: #6d829c;
  font-size: 0.72rem;
  font-weight: 800;
  text-align: center;
  text-transform: uppercase;
}

.calendario-mes-dia {
  min-height: 100px;
  padding: 9px;
  border: 2px solid rgba(10, 31, 56, 0.06);
  border-radius: 12px;
  background: #f8fbfd;
  color: #0a1f38;
  overflow: hidden;
  min-width: 0;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.calendario-mes-dia.hoy {
  border-color: #16a34a;
  background: linear-gradient(180deg, #f3fbf6 0%, #eafaf0 100%);
  box-shadow: 0 6px 16px rgba(22, 163, 74, 0.14);
}

.calendario-mes-dia.vacio {
  border-color: transparent;
  background: transparent;
  box-shadow: none;
}

.calendario-mes-dia-cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.calendario-mes-dia-cabecera > strong {
  font-size: 0.78rem;
}

.calendario-mes-no-definido {
  color: #94a3b8;
  font-size: 0.72rem;
}

.calendario-mes-turno {
  display: grid;
  gap: 2px;
  margin-top: 4px;
  padding: 6px;
  border-radius: 8px;
  background: rgba(18, 58, 102, 0.1);
  color: #123a66;
  font-size: 0.68rem;
  font-weight: 800;
}

.calendario-mes-turno small {
  font-size: 0.65rem;
  font-weight: 600;
}

.calendario-mes-turno.libre {
  background: rgba(217, 119, 6, 0.12);
  color: #a16207;
}

/* ── Calendario admin (vista semana) ── */
.calendario-admin-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(140px, 1fr));
  gap: 12px;
  min-width: 0;
}

.calendario-admin-dia {
  position: relative;
  border: 2px solid rgba(10, 31, 56, 0.06);
  border-radius: 16px;
  padding: 14px;
  background: #f5f9fc;
  display: flex;
  flex-direction: column;
  gap: 9px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.calendario-admin-dia.hoy {
  border-color: #16a34a;
  background: linear-gradient(180deg, #f3fbf6 0%, #eafaf0 100%);
  box-shadow: 0 8px 22px rgba(22, 163, 74, 0.16);
}

.calendario-admin-dia-cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.btn-agregar-dia {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 30px;
  height: 30px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: #1976d2;
  color: #ffffff;
  font-size: 1.15rem;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(25, 118, 210, 0.24);
  transition: background 0.15s ease, transform 0.15s ease;
}

.btn-agregar-dia:hover {
  background: #125eaa;
  transform: translateY(-1px);
}

.btn-agregar-dia.mini {
  width: 23px;
  height: 23px;
  font-size: 0.9rem;
}

.calendario-admin-nombre,
.calendario-admin-fecha {
  margin: 0;
  text-transform: capitalize;
}

.calendario-admin-nombre {
  font-weight: 800;
  color: #0a1f38;
  font-size: 0.82rem;
}

.calendario-admin-fecha {
  font-size: 0.74rem;
  color: #6d829c;
}

.calendario-admin-vacio {
  color: #94a3b8;
  font-size: 0.8rem;
  min-height: 42px;
  display: grid;
  place-items: center;
}

.calendario-admin-turnos {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.calendario-admin-turno {
  border-radius: 12px;
  padding: 10px;
  background: #ffffff;
  border: 1px solid rgba(10, 31, 56, 0.08);
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.calendario-admin-turno strong {
  font-size: 0.8rem;
  color: #0a1f38;
}

.calendario-admin-turno small {
  font-size: 0.74rem;
  color: #123a66;
}

.calendario-admin-turno.libre {
  background: rgba(148, 163, 184, 0.09);
}

.calendario-admin-turno.horasExtra {
  border-color: rgba(217, 119, 6, 0.18);
}

.calendario-admin-turno-header,
.calendario-mes-turno-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.btn-editar-turno {
  border: none;
  background: rgba(18, 58, 102, 0.1);
  color: #123a66;
  width: 22px;
  height: 22px;
  border-radius: 7px;
  display: grid;
  place-items: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s ease;
}

.btn-editar-turno:hover:not(:disabled) {
  background: rgba(18, 58, 102, 0.2);
}

.btn-editar-turno ion-icon {
  font-size: 13px;
}

.btn-editar-turno.mini {
  width: 18px;
  height: 18px;
}

.btn-editar-turno.mini ion-icon {
  font-size: 11px;
}

.btn-editar-turno:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* ── Plantilla rápida ── */
.plantilla-rapida {
  border: 1px dashed rgba(18, 58, 102, 0.22);
  border-radius: 16px;
  padding: 16px;
  background: linear-gradient(180deg, #f7fbff 0%, #eef5fb 100%);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.plantilla-rapida-titulo {
  margin: 0;
  font-weight: 800;
  color: #0a1f38;
  font-size: 0.92rem;
}

.plantilla-rapida-subtitulo {
  margin: 2px 0 0;
  font-size: 0.78rem;
  color: #4a627e;
}

.plantilla-rapida-libre {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  font-weight: 700;
  color: #4a627e;
}

.plantilla-rapida-dias {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.plantilla-rapida-dias-label {
  font-size: 0.76rem;
  font-weight: 800;
  color: #6d829c;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.plantilla-rapida-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip-dia {
  border: 1px solid rgba(18, 58, 102, 0.18);
  background: #ffffff;
  color: #123a66;
  font-weight: 800;
  font-size: 0.78rem;
  padding: 7px 12px;
  border-radius: 999px;
  cursor: pointer;
  text-transform: capitalize;
  transition: background 0.15s ease, color 0.15s ease;
}

.chip-dia.activo {
  background: #123a66;
  color: #ffffff;
  border-color: #123a66;
}

.chip-dia:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.plantilla-rapida-atajos {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-atajo {
  border: none;
  background: rgba(18, 58, 102, 0.08);
  color: #123a66;
  font-weight: 700;
  font-size: 0.74rem;
  padding: 6px 10px;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.btn-atajo:hover {
  background: rgba(18, 58, 102, 0.16);
}

.btn-aplicar-plantilla {
  --background: #123a66;
  --color: #f5f9fc;
  --border-radius: 12px;
  font-weight: 800;
}

/* ── Modal editar turno ── */
.modal-editar-turno {
  --width: min(460px, calc(100vw - 24px));
  --height: fit-content;
  --min-height: 0;
  --max-height: 92vh;
  --border-radius: 22px;
  --backdrop-opacity: 0.5;
}

.modal-editar-turno::part(content) {
  height: fit-content;
  min-height: 0;
  max-height: 92vh;
  display: flex;
}

.modal-editar-turno .modal-contenido {
  width: 100%;
}

.editar-turno-modal-contenido {
  max-width: 460px;
  width: min(460px, calc(100vw - 24px));
  background: linear-gradient(180deg, #ffffff 0%, #f4f8fc 100%);
  padding: 22px;
  display: flex;
  flex-direction: column;
  color: #0a1f38;
  gap: 16px;
}

.editar-turno-libre {
  align-self: flex-start;
}

.editar-turno-botones {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}

.editar-turno-botones-derecha {
  display: flex;
  gap: 8px;
}

.btn-eliminar-turno {
  --background: rgba(220, 38, 38, 0.1);
  --color: #b91c1c;
  --border-radius: 12px;
  font-weight: 800;
}

/* ══════════════════════ RESPONSIVE: TABLETS ══════════════════════ */
@media (max-width: 1024px) {
  .home-grid-row {
    grid-template-columns: 1fr;
  }

  .calendario-admin-grid {
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 6px;
  }

  .calendario-semana-grid {
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 6px;
  }

  .calendario-admin-dia,
  .dia-semana-card {
    padding: 10px 8px;
    border-radius: 12px;
  }

  .calendario-admin-turno {
    padding: 7px;
  }

  .calendario-admin-turno strong,
  .dia-semana-turno strong {
    font-size: 0.72rem;
  }

  .calendario-admin-turno small,
  .dia-semana-turno {
    font-size: 0.68rem;
  }

  .dias-modal-lista {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .horario-modal-contenido {
    padding: 20px;
  }

  .horario-modal-header {
    padding: 12px;
  }

  .jornada-resumen.tres {
    grid-template-columns: 1fr;
  }

  .reportes-resumen,
  .reportes-modal-resumen,
  .reportes-modal-grid {
    grid-template-columns: 1fr;
  }

  .calendario-mes-dia {
    min-height: 84px;
  }

  .calendario-admin-header {
    flex-direction: column;
    align-items: stretch;
  }

  .calendario-admin-acciones {
    justify-content: space-between;
  }
}

/* ══════════════════════ RESPONSIVE: TELÉFONOS ══════════════════════ */
@media (max-width: 768px) {
  .horarios-page {
    gap: 16px;
  }

  .config-card,
  .accesos-card,
  .tareas-card {
    padding: 16px;
    border-radius: 16px;
  }

  .card-title {
    font-size: 0.95rem;
  }

  .calendario-admin-acciones {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
  }

  .calendario-controles {
    justify-content: center;
  }

  .btn-programar {
    width: 100%;
  }

  .empleado-estado-admin {
    margin-left: 0;
    width: 100%;
    justify-content: space-between;
  }

  .empleado-item {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
  }

  .empleado-info {
    min-width: 0;
  }

  .empleado-estado-admin {
    grid-column: 1 / -1;
  }

  .pago-item {
    flex-direction: column;
    align-items: stretch;
  }

  .pago-monto {
    text-align: left;
  }

  .btn-pagar {
    width: 100%;
  }
}

@media (max-width: 560px) {
  .horario-modal-contenido {
    width: calc(100vw - 14px);
    padding: 14px;
    gap: 14px;
  }

  .horario-modal-header {
    align-items: flex-start;
  }

  .modal-header-left {
    align-items: flex-start;
  }

  .modal-subtitulo {
    font-size: 0.74rem;
  }

  .dias-modal-lista {
    grid-template-columns: 1fr;
  }

  .calendario-mes-cabecera,
  .calendario-mes-grid {
    gap: 4px;
  }

  .calendario-mes-navegacion {
    gap: 6px;
  }

  .calendario-flecha {
    padding: 8px 9px;
    font-size: 0.68rem;
  }

  .calendario-mes-navegacion strong {
    font-size: 0.92rem;
  }

  .calendario-mes-grid {
    grid-auto-rows: minmax(72px, auto);
  }

  .calendario-mes-dia {
    min-height: 68px;
    padding: 6px;
    border-width: 1px;
    border-radius: 9px;
  }

  .calendario-mes-dia > strong {
    margin-bottom: 3px;
    font-size: 0.7rem;
  }

  .calendario-mes-no-definido {
    display: none;
  }

  .calendario-mes-turno span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .reportes-resumen,
  .reportes-modal-resumen {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px;
  }

  .reporte-resumen-card {
    padding: 10px 8px;
    border-radius: 12px;
    min-width: 0;
  }

  .reporte-resumen-card strong {
    font-size: 1rem;
    line-height: 1;
  }

  .reporte-resumen-card span {
    font-size: 0.62rem;
    line-height: 1.15;
  }

  .calendario-admin-grid,
  .calendario-semana-grid {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding: 2px 2px 8px;
    margin: 0 -2px;
    scroll-snap-type: x proximity;
    -webkit-overflow-scrolling: touch;
  }

  .calendario-admin-grid::-webkit-scrollbar,
  .calendario-semana-grid::-webkit-scrollbar {
    display: none;
  }

  .calendario-admin-dia,
  .dia-semana-card {
    flex: 0 0 128px;
    padding: 8px 6px;
    border-width: 1px;
    border-radius: 10px;
    gap: 5px;
    scroll-snap-align: center;
  }

  .calendario-admin-nombre,
  .dia-semana-titulo {
    font-size: 0.62rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .calendario-admin-fecha,
  .dia-semana-fecha {
    font-size: 0.6rem;
  }

  .calendario-admin-turnos {
    gap: 4px;
  }

  .calendario-admin-turno {
    padding: 5px 4px;
    border-radius: 7px;
  }

  .calendario-admin-turno strong,
  .dia-semana-turno strong {
    font-size: 0.6rem;
    line-height: 1.15;
  }

  .calendario-admin-turno small,
  .dia-semana-turno,
  .calendario-admin-vacio {
    font-size: 0.56rem;
    line-height: 1.15;
  }

  .calendario-admin-turno-header .btn-editar-turno {
    display: inline-grid;
    width: 20px;
    height: 20px;
    border-radius: 6px;
  }

  .chip-hoy {
    font-size: 0.52rem;
    padding: 2px 5px;
  }

  .calendario-mes-turno {
    font-size: 0.6rem;
    padding: 4px;
  }

  .calendario-mes-turno small {
    font-size: 0.55rem;
  }

  .plantilla-rapida-atajos {
    width: 100%;
  }

  .plantilla-rapida-atajos .btn-atajo {
    flex: 1;
    text-align: center;
  }

  .home-grid-row {
    gap: 14px;
  }

  .accesos-card,
  .tareas-card {
    padding: 14px;
  }

  .empleado-item {
    grid-template-columns: 1fr;
  }

  .empleado-pago,
  .empleado-estado-admin {
    width: 100%;
  }

  .empleado-pago {
    justify-content: flex-start;
  }

  .empleado-estado-admin {
    grid-column: auto;
    align-items: stretch;
  }

  .empleado-estado-admin .badge-jornada,
  .empleado-estado-admin .btn-estado-admin {
    flex: 1;
    text-align: center;
  }

  .editar-turno-botones {
    flex-direction: column;
    align-items: stretch;
  }

  .editar-turno-botones-derecha {
    justify-content: stretch;
  }

  .editar-turno-botones-derecha ion-button {
    flex: 1;
  }
}
</style>
