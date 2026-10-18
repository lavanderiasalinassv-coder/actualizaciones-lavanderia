<template>
  <AppShell>
    <div class="page-content">
      <div class="header-row">
        <ion-button class="btn-primario" @click="abrirFormulario()">
          <ion-icon :icon="personAddOutline" slot="start" />
          Agregar usuario
        </ion-button>
      </div>

      <div class="usuarios-grid" v-if="usuarios.length">
        <div v-for="usuario in usuarios" :key="usuario.id" class="usuario-card">
          <div class="usuario-card-header">
            <div class="avatar-grid">
              <img v-if="usuario.imagenPerfil" :src="usuario.imagenPerfil" :alt="`Foto de ${usuario.nombre}`" />
              <ion-icon v-else :icon="personCircleOutline" />
            </div>
            <span class="estado-usuario" :class="{ inactivo: !usuario.activo }">
              <span class="estado-punto" />
              {{ usuario.activo ? 'Activo' : 'Inactivo' }}
            </span>
          </div>

          <div class="usuario-topline">
            <h3>{{ usuario.nombre }}</h3>
            <span class="badge-role" :class="usuario.rol">{{ etiquetaRol(usuario.rol) }}</span>
          </div>

          <div class="usuario-info">
            <div class="info-row">
              <ion-icon :icon="mailOutline" />
              <span>{{ usuario.correo }}</span>
            </div>
            <div class="info-row">
              <ion-icon :icon="calendarOutline" />
              <span>
                <small>MIEMBRO DESDE</small>
                <strong>{{ formatearFechaMiembro(usuario) }}</strong>
              </span>
            </div>
          </div>

          <div class="usuario-actions">
            <ion-button fill="clear" class="btn-icon" aria-label="Editar usuario" title="Editar usuario" @click="editarUsuario(usuario)">
              <ion-icon :icon="createOutline" />
            </ion-button>
            <ion-button fill="clear" class="btn-icon danger" aria-label="Eliminar usuario" title="Eliminar usuario" @click="confirmarEliminar(usuario)">
              <ion-icon :icon="trashOutline" />
            </ion-button>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <ion-icon :icon="peopleOutline" />
        <h3>No hay usuarios registrados</h3>
        <p>Agrega al primer miembro de tu equipo para habilitar el acceso.</p>
      </div>
    </div>

    <ion-modal :is-open="mostrarFormulario" class="modal-equipo" @didDismiss="cerrarFormulario">
      <div class="modal-content">
        <div class="modal-header">
          <div class="modal-heading">
            <div class="modal-heading-icon">
              <ion-icon :icon="modoEdicion ? createOutline : personAddOutline" />
            </div>
            <div>
              <p class="eyebrow">{{ modoEdicion ? 'Editar usuario' : 'Nuevo usuario' }}</p>
              <h2>{{ modoEdicion ? 'Actualizar perfil' : 'Agregar a tu equipo' }}</h2>
            </div>
          </div>
          <button class="modal-close" aria-label="Cerrar formulario" @click="cerrarFormulario">
            <ion-icon :icon="closeOutline" />
          </button>
        </div>

        <div class="modal-body-scroll">
          <div class="form-grid">
            <label>
              <span>Nombre completo</span>
              <input v-model="form.nombre" type="text" placeholder="Ej. Lavandería" />
            </label>

            <label>
              <span>Correo electrónico</span>
              <input v-model="form.correo" type="email" placeholder="correo@dominio.com" />
            </label>

            <label>
              <span>Código de acceso (6 dígitos)</span>
              <input v-model="form.codigo" type="password" maxlength="6" placeholder="Ej. 123456" />
            </label>

            <label>
              <span>Rol</span>
              <select v-model="form.rol">
                <option value="administrador">Administrador</option>
                <option value="recepcionista">Recepcionista</option>
                <option value="cajero">Cajero</option>
                <option value="operador">Operador</option>
              </select>
            </label>

            <div v-if="mostrarErrorCodigo" class="error-message">
              {{ mensajeErrorCodigo }}
            </div>
          </div>

          <div class="switch-row">
            <label class="switch-label">Usuario activo</label>
            <ion-toggle :checked="form.activo" @ionChange="form.activo = $event.detail.checked" />
          </div>
        </div>

        <div class="modal-actions">
          <ion-button class="btn-fantasma" @click="cerrarFormulario">Cancelar</ion-button>
          <ion-button class="btn-primario" @click="guardarUsuario">{{ modoEdicion ? 'Guardar cambios' : 'Agregar usuario' }}</ion-button>
        </div>
      </div>
    </ion-modal>
  </AppShell>
</template>

<script setup lang="ts">
import AppShell from '@/components/AppShell.vue'
import {
  IonButton,
  IonIcon,
  IonModal,
  IonToggle,
  toastController
} from '@ionic/vue'
import { computed, onMounted, ref } from 'vue'
import {
  personAddOutline,
  personCircleOutline,
  mailOutline,
  keyOutline,
  createOutline,
  trashOutline,
  closeOutline,
  peopleOutline,
  calendarOutline
} from 'ionicons/icons'
import { formatearFechaCentroamerica } from '@/composables/useFechas'
import {
  agregarUsuarioEquipo,
  editarUsuarioEquipo,
  eliminarUsuarioEquipo,
  getEquipo,
  type UsuarioEquipo
} from '@/composables/useEquipo'

const usuarios = ref<UsuarioEquipo[]>([])
const mostrarFormulario = ref(false)
const modoEdicion = ref(false)
const usuarioEditandoId = ref<string | null>(null)
const guardando = ref(false)

const rolesDisponibles = ['administrador', 'recepcionista', 'cajero', 'operador']

const form = ref({
  nombre: '',
  correo: '',
  codigo: '',
  rol: 'cajero' as UsuarioEquipo['rol'],
  activo: true
})

const mostrarErrorCodigo = ref(false)
const mensajeErrorCodigo = ref('')

const CODIGOS_PROHIBIDOS = ['123456', '592647']

const mostrarToast = async (mensaje: string, color: 'success' | 'danger' | 'warning' = 'success') => {
  const toast = await toastController.create({
    message: mensaje,
    duration: 2000,
    color
  })
  await toast.present()
}

const cargarUsuarios = async () => {
  try {
    usuarios.value = await getEquipo()
  } catch (error: any) {
    await mostrarToast(error.message || 'No se pudo conectar con el servidor.', 'danger')
  }
}

onMounted(() => {
  cargarUsuarios()
})

const etiquetaRol = (rol: string) => {
  const mapa: Record<string, string> = {
    administrador: 'Admin',
    recepcionista: 'Recepción',
    cajero: 'Cajero',
    operador: 'Operador'
  }
  return mapa[rol] ?? rol
}

const formatearFechaMiembro = (usuario: UsuarioEquipo) => formatearFechaCentroamerica(
  usuario.creadoEn ?? usuario.created_at ?? null,
  { day: '2-digit', month: 'long', year: 'numeric' }
)

const validarCodigoLocal = (codigo: string, rol: UsuarioEquipo['rol']) => {
  if (!codigo || codigo.length === 0) {
    mostrarErrorCodigo.value = true
    mensajeErrorCodigo.value = 'El código es obligatorio'
    return false
  }

  if (codigo.length !== 6) {
    mostrarErrorCodigo.value = true
    mensajeErrorCodigo.value = 'El código debe tener exactamente 6 dígitos'
    return false
  }

  if (!/^\d{6}$/.test(codigo)) {
    mostrarErrorCodigo.value = true
    mensajeErrorCodigo.value = 'El código debe contener solo números'
    return false
  }

  if (CODIGOS_PROHIBIDOS.includes(codigo)) {
    mostrarErrorCodigo.value = true
    mensajeErrorCodigo.value = 'Ingrese un codigo diferente'
    return false
  }

  if (rol !== 'administrador' && codigo.startsWith('0')) {
    mostrarErrorCodigo.value = true
    mensajeErrorCodigo.value = 'El código no puede iniciar con 0 para este rol'
    return false
  }

  mostrarErrorCodigo.value = false
  mensajeErrorCodigo.value = ''
  return true
}

const abrirFormulario = () => {
  modoEdicion.value = false
  usuarioEditandoId.value = null
  form.value = {
    nombre: '',
    correo: '',
    codigo: '',
    rol: 'cajero',
    activo: true
  }
  mostrarErrorCodigo.value = false
  mensajeErrorCodigo.value = ''
  mostrarFormulario.value = true
}

const editarUsuario = (usuario: UsuarioEquipo) => {
  modoEdicion.value = true
  usuarioEditandoId.value = usuario.id
  form.value = {
    nombre: usuario.nombre,
    correo: usuario.correo,
    codigo: usuario.codigo,
    rol: usuario.rol,
    activo: usuario.activo
  }
  mostrarFormulario.value = true
}

const cerrarFormulario = () => {
  mostrarFormulario.value = false
}

const guardarUsuario = async () => {
  if (guardando.value) return

  const payload = {
    ...form.value,
    correo: form.value.correo.trim(),
    nombre: form.value.nombre.trim(),
    codigo: form.value.codigo.trim()
  }

  if (!payload.nombre || !payload.correo || !payload.codigo) {
    await mostrarToast('Completa nombre, correo y código.', 'danger')
    return
  }

  if (!validarCodigoLocal(payload.codigo, form.value.rol)) {
    return
  }

  guardando.value = true

  try {
    if (modoEdicion.value && usuarioEditandoId.value) {
      await editarUsuarioEquipo(usuarioEditandoId.value, payload)
      await mostrarToast('Usuario actualizado correctamente', 'success')
    } else {
      await agregarUsuarioEquipo(payload)
      await mostrarToast('Usuario agregado correctamente', 'success')
    }

    await cargarUsuarios()
    cerrarFormulario()
  } catch (error: any) {
    await mostrarToast(error.message || 'No se pudo guardar el usuario', 'danger')
  } finally {
    guardando.value = false
  }
}

const confirmarEliminar = async (usuario: UsuarioEquipo) => {
  const ok = window.confirm(`¿Deseas eliminar a ${usuario.nombre}?`)
  if (!ok) return

  try {
    await eliminarUsuarioEquipo(usuario.id)
    await cargarUsuarios()
    await mostrarToast('Usuario eliminado', 'success')
  } catch (error: any) {
    await mostrarToast(error.message || 'No se pudo eliminar', 'danger')
  }
}

const totalActivos = computed(() => usuarios.value.filter((usuario) => usuario.activo).length)
const totalRoles = computed(() => rolesDisponibles.length)

const statsRow = computed(() => [
  { label: 'Total', value: usuarios.value.length },
  { label: 'Activos', value: totalActivos.value },
  { label: 'Roles', value: totalRoles.value }
])
</script>

<style scoped>
:deep(body) {
  background: #f5f9fc;
}

.page-content {
  padding: 20px 18px 28px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-height: calc(100% + 220px);
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
}

.eyebrow {
  margin: 0 0 6px;
  color: #6d829c;
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  color: #0a1f38;
  font-size: clamp(1.8rem, 2.5vw, 2.6rem);
  font-weight: 900;
}

h2 {
  margin: 0;
  color: #0a1f38;
  font-size: 1.5rem;
  font-weight: 800;
}

h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #0a1f38;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(120px, 1fr));
  gap: 12px;
}

.stat-card {
  background: linear-gradient(180deg, #ffffff 0%, #f2f9ff 100%);
  border: 1px solid rgba(18, 58, 102, 0.08);
  border-radius: 18px;
  padding: 16px 18px;
  box-shadow: 0 10px 20px rgba(10, 31, 56, 0.04);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-label {
  color: #6d829c;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
}

.stat-card strong {
  color: #123a66;
  font-size: 1.7rem;
  font-weight: 900;
}

.usuarios-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 18px;
  margin-top: 8px;
}

.usuario-card {
  position: relative;
  overflow: hidden;
  min-width: 0;
  background: linear-gradient(160deg, #ffffff 0%, #fbfdff 100%);
  border: 1px solid #e4ebf2;
  border-radius: 20px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: 0 8px 22px rgba(10, 31, 56, 0.055);
  transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
}

.usuario-card::before {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  height: 4px;
  background: linear-gradient(90deg, #123a66, #4fb3e0);
}

.usuario-card:hover {
  transform: translateY(-3px);
  border-color: #c7d9e8;
  box-shadow: 0 14px 30px rgba(10, 31, 56, 0.11);
}

.usuario-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.avatar-grid {
  width: 54px;
  height: 54px;
  flex: 0 0 auto;
  border-radius: 16px;
  background: linear-gradient(145deg, #e4f3ff, #cce8fb);
  display: grid;
  place-items: center;
  color: #123a66;
  font-size: 1.9rem;
  box-shadow: inset 0 0 0 1px rgba(18, 58, 102, 0.06);
  overflow: hidden;
}

.avatar-grid img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.usuario-topline {
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
}

.usuario-topline h3 {
  max-width: 100%;
  overflow: hidden;
  color: #173858;
  font-size: 1.05rem;
  font-weight: 850;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.badge-role {
  padding: 5px 9px;
  border-radius: 999px;
  font-size: 0.66rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  line-height: 1.2;
}

.badge-role.administrador {
  background: rgba(18, 58, 102, 0.08);
  color: #123a66;
}

.badge-role.recepcionista {
  background: rgba(168, 85, 247, 0.12);
  color: #7c3aed;
}

.badge-role.cajero {
  background: rgba(59, 130, 246, 0.12);
  color: #1d4ed8;
}

.badge-role.operador {
  background: rgba(22, 128, 82, 0.11);
  color: #16734a;
}

.estado-usuario {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 9px;
  border: 1px solid #d5f0df;
  border-radius: 999px;
  background: #effaf3;
  color: #18784a;
  font-size: 0.68rem;
  font-weight: 800;
}

.estado-usuario.inactivo {
  border-color: #e5e9ee;
  background: #f3f5f7;
  color: #68798a;
}

.estado-punto {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
}

.usuario-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 0;
  border-top: 1px solid #edf1f5;
  border-bottom: 1px solid #edf1f5;
}

.info-row {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  color: #4a627e;
  font-size: 0.8rem;
  min-width: 0;
}

.info-row ion-icon {
  flex: 0 0 auto;
  margin-top: 2px;
  font-size: 0.95rem;
  color: #4383b5;
}

.info-row span {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.info-row small {
  color: #8797a8;
  font-size: 0.56rem;
  font-weight: 850;
  letter-spacing: 0.09em;
}

.info-row strong {
  color: #405a73;
  font-size: 0.76rem;
  font-weight: 750;
}

.usuario-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  margin-top: auto;
}

.btn-icon {
  --color: #45627d;
  --background: #f1f6fa;
  --padding-start: 8px;
  --padding-end: 8px;
  --padding-top: 8px;
  --padding-bottom: 8px;
  --border-radius: 10px;
  margin: 0;
}

.btn-icon.danger {
  --color: #b91c1c;
  --background: #fff1f1;
}

.empty-state {
  background: rgba(255, 255, 255, 0.8);
  border: 1.5px dashed rgba(18, 58, 102, 0.18);
  border-radius: 20px;
  padding: 28px 18px;
  text-align: center;
  color: #4a627e;
}

.empty-state ion-icon {
  font-size: 3rem;
  color: #a9c3d8;
}

.empty-state h3 {
  margin: 12px 0 10px;
}

.empty-state p {
  margin: 0;
  font-size: 0.95rem;
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

.modal-content {
  background: #ffffff;
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-height: 88vh;
  overflow: hidden;
}

.modal-equipo {
  --height: fit-content;
  --min-height: 0;
  --width: min(92vw, 560px);
  --border-radius: 18px;
}

.modal-equipo::part(content) {
  height: fit-content;
  min-height: 0;
  max-height: 90vh;
  overflow: hidden;
  border: 1px solid rgba(18, 58, 102, 0.1);
  box-shadow: 0 24px 70px rgba(10, 31, 56, 0.25);
}

.modal-body-scroll {
  overflow: auto;
  padding-right: 4px;
  display: grid;
  gap: 14px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 17px;
  border: 1px solid #e4edf5;
  border-radius: 17px;
  background:
    radial-gradient(circle at 0% 0%, rgba(79, 179, 224, 0.14), transparent 45%),
    linear-gradient(135deg, #f7fbff, #eef6fc);
}

.modal-heading {
  display: flex;
  align-items: center;
  gap: 13px;
  min-width: 0;
}

.modal-heading-icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  border-radius: 14px;
  background: linear-gradient(145deg, #123a66, #327cad);
  color: #ffffff;
  font-size: 1.35rem;
  box-shadow: 0 7px 14px rgba(18, 58, 102, 0.2);
}

.modal-header .eyebrow {
  margin-bottom: 4px;
  color: #4683af;
  font-size: 0.64rem;
}

.modal-header h2 {
  color: #173858;
  font-size: clamp(1.15rem, 3vw, 1.4rem);
  line-height: 1.2;
}

.modal-close {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
  border: none;
  border-radius: 11px;
  background: rgba(255, 255, 255, 0.8);
  color: #7c8fa6;
  font-size: 1.3rem;
  cursor: pointer;
  transition: color 160ms ease, background 160ms ease;
}

.modal-close:hover {
  color: #123a66;
  background: #ffffff;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 7px;
  font-size: 0.72rem;
  font-weight: 850;
  color: #45627d;
  text-transform: uppercase;
  letter-spacing: 0.055em;
}

input,
select {
  width: 100%;
  border: 1px solid #dce6ef;
  background: #f8fbfe;
  border-radius: 11px;
  padding: 12px 13px;
  font-size: 0.9rem;
  color: #173858;
  font-family: inherit;
  letter-spacing: normal;
  text-transform: none;
  transition: border-color 160ms ease, box-shadow 160ms ease, background 160ms ease;
}

input:focus,
select:focus {
  outline: none;
  border-color: #58a4d0;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(79, 179, 224, 0.16);
}

input::placeholder {
  color: #9aabba;
}

.error-message {
  background: rgba(220, 38, 38, 0.08);
  border: 1px solid rgba(220, 38, 38, 0.3);
  border-radius: 8px;
  padding: 10px 12px;
  color: #b91c1c;
  font-size: 0.85rem;
  font-weight: 600;
}

.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid #e4edf5;
  background: linear-gradient(135deg, #f8fbfe, #f2f8fc);
  border-radius: 13px;
  padding: 12px 14px;
}

.switch-label {
  color: #123a66;
  font-size: 0.9rem;
  font-weight: 700;
  text-transform: none;
  letter-spacing: 0;
}

.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 0;
  position: sticky;
  bottom: 0;
  background: #ffffff;
  padding-top: 12px;
  border-top: 1px solid #edf1f5;
}

.modal-actions ion-button {
  flex: 1;
  min-height: 42px;
}

@media (max-width: 560px) {
  .page-content {
    padding: 16px 12px 20px;
  }

  .stats-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .header-row {
    align-items: flex-start;
  }

  .usuarios-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    margin-top: 8px;
  }

  .usuario-card {
    padding: 14px 12px 12px;
    border-radius: 16px;
    gap: 11px;
  }

  .avatar-grid {
    width: 44px;
    height: 44px;
    border-radius: 13px;
    font-size: 1.45rem;
  }

  .usuario-topline {
    gap: 6px;
  }

  .usuario-topline h3 {
    font-size: 0.86rem;
  }

  .badge-role {
    padding: 4px 7px;
    font-size: 0.56rem;
  }

  .estado-usuario {
    gap: 4px;
    padding: 5px 7px;
    font-size: 0.59rem;
  }

  .info-row {
    font-size: 0.68rem;
    gap: 6px;
  }

  .info-row strong {
    font-size: 0.66rem;
  }

  .usuario-actions {
    justify-content: stretch;
  }

  .usuario-actions .btn-icon {
    flex: 1;
  }

  .modal-content {
    padding: 15px;
    gap: 14px;
  }

  .modal-header {
    padding: 13px;
    border-radius: 14px;
  }

  .modal-heading {
    gap: 10px;
  }

  .modal-heading-icon {
    width: 39px;
    height: 39px;
    border-radius: 12px;
    font-size: 1.2rem;
  }
}
</style>
