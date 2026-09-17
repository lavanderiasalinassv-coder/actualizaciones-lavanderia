<template>
  <AppShell>
    <div class="page-content">
      <div class="header-row">
        <div>
          <p class="eyebrow">Administración</p>
          <h1>Equipo</h1>
        </div>
        <ion-button class="btn-primario" @click="abrirFormulario()">
          <ion-icon :icon="personAddOutline" slot="start" />
          Agregar usuario
        </ion-button>
      </div>

      <div class="usuarios-grid" v-if="usuarios.length">
        <div v-for="usuario in usuarios" :key="usuario.id" class="usuario-card">
          <div class="avatar-grid">
            <img v-if="usuario.imagenPerfil" :src="usuario.imagenPerfil" :alt="`Foto de ${usuario.nombre}`" />
            <ion-icon v-else :icon="personCircleOutline" />
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
              <span>Miembro desde {{ formatearFechaMiembro(usuario) }}</span>
            </div>
          </div>

          <div class="usuario-actions">
            <ion-button fill="clear" class="btn-icon" @click="editarUsuario(usuario)">
              <ion-icon :icon="createOutline" />
            </ion-button>
            <ion-button fill="clear" class="btn-icon danger" @click="confirmarEliminar(usuario)">
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
          <div>
            <p class="eyebrow">{{ modoEdicion ? 'Editar usuario' : 'Nuevo usuario' }}</p>
            <h2>{{ modoEdicion ? 'Actualizar perfil' : 'Agregar a tu equipo' }}</h2>
          </div>
          <button class="modal-close" @click="cerrarFormulario">
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
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  column-gap: 16px;
  row-gap: 40px;
  margin-top: 16px;
}

.usuario-card {
  position: relative;
  overflow: visible;
  background: #ffffff;
  border: 1px solid rgba(10, 31, 56, 0.08);
  border-radius: 20px;
  padding: 48px 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 10px 18px rgba(10, 31, 56, 0.04);
}

.avatar-grid {
  position: absolute;
  top: -31px;
  left: 50%;
  transform: translateX(-50%);
  width: 62px;
  height: 62px;
  border-radius: 18px;
  background: linear-gradient(135deg, #e7f2fb 0%, #d4ebff 100%);
  display: grid;
  place-items: center;
  color: #123a66;
  font-size: 2rem;
  border: 4px solid #ffffff;
  box-shadow: 0 8px 18px rgba(10, 31, 56, 0.16);
  overflow: hidden;
}

.avatar-grid img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.usuario-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.badge-role {
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
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

.usuario-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #4a627e;
  font-size: 0.88rem;
  min-width: 0;
  word-break: break-word;
}

.info-row ion-icon {
  font-size: 1rem;
  color: #123a66;
}

.info-row span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.usuario-actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
  margin-top: auto;
}

.btn-icon {
  --color: #123a66;
  --padding-start: 8px;
  --padding-end: 8px;
  --padding-top: 8px;
  --padding-bottom: 8px;
}

.btn-icon.danger {
  --color: #b91c1c;
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
  padding: 20px 18px 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
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
}

.modal-body-scroll {
  overflow: auto;
  padding-right: 4px;
  display: grid;
  gap: 14px;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.modal-close {
  border: none;
  background: none;
  color: #7c8fa6;
  font-size: 1.6rem;
  cursor: pointer;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 0.82rem;
  font-weight: 800;
  color: #4a627e;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

input,
select {
  border: 1.5px solid rgba(10, 31, 56, 0.12);
  background: #f8fbff;
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 0.96rem;
  color: #0a1f38;
  font-family: inherit;
}

input:focus,
select:focus {
  outline: 2px solid rgba(18, 58, 102, 0.16);
  border-color: rgba(18, 58, 102, 0.25);
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
  background: #f7faff;
  border-radius: 12px;
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
  margin-top: 4px;
  position: sticky;
  bottom: 0;
  background: #ffffff;
  padding-top: 8px;
}

.modal-actions ion-button {
  flex: 1;
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
    column-gap: 10px;
    row-gap: 34px;
    margin-top: 12px;
  }

  .usuario-card {
    padding: 14px 12px;
    border-radius: 16px;
    gap: 10px;
  }

  .avatar-grid {
    width: 52px;
    height: 52px;
    border-radius: 16px;
    font-size: 1.6rem;
  }

  .usuario-topline {
    gap: 6px;
    flex-wrap: wrap;
  }

  .usuario-topline h3 {
    font-size: 0.9rem;
  }

  .badge-role {
    padding: 4px 8px;
    font-size: 0.62rem;
  }

  .info-row {
    font-size: 0.76rem;
    gap: 6px;
  }

  .usuario-actions {
    justify-content: stretch;
  }

  .usuario-actions .btn-icon {
    flex: 1;
  }
}
</style>
