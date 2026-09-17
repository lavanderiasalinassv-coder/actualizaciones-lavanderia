<template>
  <AppShell>
    <div class="base-datos-page">
      <header class="page-header">
        <button class="volver-btn" type="button" title="Volver a configuración" @click="volver">
          <ion-icon :icon="arrowBackOutline" />
        </button>
        <div>
          <p class="eyebrow">Conexión</p>
          <h2>Base de datos</h2>
          <p>Configura el servidor MySQL que utiliza la aplicación.</p>
        </div>
      </header>

      <form class="config-card" @submit.prevent="guardar">
        <div class="card-heading">
          <div>
            <h3>Credenciales MySQL</h3>
            <p>Los cambios se guardan en <strong>database.json</strong> y se aplican al reiniciar.</p>
          </div>
          <ion-icon :icon="serverOutline" class="card-icon" />
        </div>

        <div class="fields-grid">
          <label>Servidor<input v-model.trim="formulario.host" required autocomplete="off" style="background-color: white;" /></label>
          <label>Puerto<input v-model.number="formulario.port" type="number" style="background-color: white;" min="1" max="65535" required /></label>
          <label>Usuario<input v-model.trim="formulario.user" required autocomplete="username" style="background-color: white;" /></label>
          <label>Base de datos<input v-model.trim="formulario.database" required autocomplete="off" style="background-color: white;" /></label>
          <label class="campo-ancho">Contraseña<input v-model="formulario.password" type="password" autocomplete="new-password" style="background-color: white;" /></label>
        </div>

        <p v-if="mensaje" class="mensaje" :class="{ error: error }" role="status">{{ mensaje }}</p>

        <div class="acciones">
          <button class="btn-secundario" type="button" :disabled="procesando" @click="probarConexion">
            <ion-icon :icon="pulseOutline" /> Probar conexión
          </button>
          <button class="btn-secundario" type="button" :disabled="procesando" @click="restablecerPredeterminados">
            <ion-icon :icon="refreshOutline" /> Restablecer predeterminados
          </button>
          <button class="btn-primario" type="submit" :disabled="procesando">
            <ion-icon :icon="saveOutline" /> {{ procesando ? 'Guardando...' : 'Guardar y reiniciar' }}
          </button>
        </div>
      </form>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { IonIcon } from '@ionic/vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import { API_LOCAL_URL } from '@/composables/useApiConfig'
import { arrowBackOutline, pulseOutline, refreshOutline, saveOutline, serverOutline } from 'ionicons/icons'

type ConfiguracionBaseDatos = { host: string; port: number; user: string; password: string; database: string }
const router = useRouter()
const formulario = reactive<ConfiguracionBaseDatos>({ host: '', port: 3306, user: '', password: '', database: '' })
const mensaje = ref('')
const error = ref(false)
const procesando = ref(false)

const cargar = async () => {
  try {
    const respuesta = await fetch(`${API_LOCAL_URL}/database-config`)
    if (!respuesta.ok) throw new Error('No se pudo cargar la configuración.')
    Object.assign(formulario, await respuesta.json())
  } catch (e) {
    error.value = true
    mensaje.value = e instanceof Error ? e.message : 'No se pudo cargar la configuración.'
  }
}

const probarConexion = async () => {
  procesando.value = true
  mensaje.value = ''
  error.value = false
  try {
    const respuesta = await fetch(`${API_LOCAL_URL}/database-config/test`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formulario)
    })
    const resultado = await respuesta.json()
    if (!respuesta.ok) throw new Error(resultado.message)
    mensaje.value = resultado.message
  } catch (e) {
    error.value = true
    mensaje.value = e instanceof Error ? e.message : 'No se pudo probar la conexión.'
  } finally { procesando.value = false }
}

const restablecerPredeterminados = async () => {
  procesando.value = true
  mensaje.value = ''
  error.value = false
  try {
    const respuesta = await fetch(`${API_LOCAL_URL}/database-config/defaults`)
    const resultado = await respuesta.json()
    if (!respuesta.ok) throw new Error(resultado.message)
    Object.assign(formulario, resultado)
    mensaje.value = 'Credenciales predeterminadas cargadas. Guarda para aplicarlas.'
  } catch (e) {
    error.value = true
    mensaje.value = e instanceof Error ? e.message : 'No se pudieron cargar las credenciales predeterminadas.'
  } finally { procesando.value = false }
}

const guardar = async () => {
  procesando.value = true
  mensaje.value = ''
  error.value = false
  try {
    const respuesta = await fetch(`${API_LOCAL_URL}/database-config`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formulario)
    })
    const resultado = await respuesta.json()
    if (!respuesta.ok) throw new Error(resultado.message)
    mensaje.value = 'Configuración guardada. Reiniciando...'
    const api = (window as Window & { electronAPI?: { reiniciarElectron: () => Promise<void> } }).electronAPI
    if (api) await api.reiniciarElectron()
    else mensaje.value = 'Configuración guardada. Reinicia el servidor para aplicarla.'
  } catch (e) {
    error.value = true
    mensaje.value = e instanceof Error ? e.message : 'No se pudo guardar la configuración.'
  } finally { procesando.value = false }
}

const volver = () => void router.replace('/tabs/configuracion')
onMounted(cargar)
</script>

<style scoped>
.base-datos-page { display: grid; gap: 24px; min-height: 100%; padding-bottom: 96px; color: #0a1f38; }
.page-header { display: flex; align-items: flex-start; gap: 14px; padding: 8px 2px 0; }
.volver-btn { width: 38px; height: 38px; border: 1px solid rgba(10,31,56,.12); border-radius: 10px; background: #fff; color: #123a66; font-size: 20px; cursor: pointer; }
.eyebrow { margin: 0 0 6px; color: #6d829c; font-size: .76rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
h2, h3, p { margin-top: 0; } h2 { margin-bottom: 8px; font-size: 1.6rem; } .page-header p:last-child, .card-heading p { margin-bottom: 0; color: #6d829c; }
.config-card { display: grid; width: min(100%, 760px); box-sizing: border-box; gap: 24px; margin-inline: auto; padding: 24px; border: 1px solid rgba(10,31,56,.08); border-radius: 18px; background: #fff; box-shadow: 0 8px 20px rgba(10,31,56,.06); }
.card-heading { display: flex; justify-content: space-between; gap: 16px; } h3 { margin-bottom: 6px; font-size: 1.15rem; } .card-icon { color: #168b83; font-size: 32px; }
.fields-grid { display: grid; grid-template-columns: 1fr 180px; gap: 16px; } label { display: grid; gap: 7px; color: #4a627e; font-size: .8rem; font-weight: 800; } input { width: 100%; box-sizing: border-box; padding: 11px 12px; border: 1px solid rgba(10,31,56,.16); border-radius: 10px; color: #0a1f38; font: inherit; font-weight: 500; outline: none; } input:focus { border-color: #168b83; box-shadow: 0 0 0 3px rgba(22,139,131,.12); } .campo-ancho { grid-column: 1 / -1; }
.acciones { display: flex; justify-content: flex-end; gap: 12px; flex-wrap: wrap; } .acciones button { display: inline-flex; align-items: center; gap: 8px; padding: 11px 15px; border-radius: 10px; border: 1px solid transparent; font-weight: 800; cursor: pointer; } button:disabled { opacity: .6; cursor: wait; } .btn-secundario { border-color: rgba(18,58,102,.22) !important; background: #fff; color: #123a66; } .btn-primario { background: #123a66; color: #fff; } .mensaje { margin: 0; color: #168b83; font-weight: 700; } .mensaje.error { color: #c0392b; }
@media (max-width: 560px) { .config-card { padding: 18px; } .fields-grid { grid-template-columns: 1fr; } .campo-ancho { grid-column: auto; } .acciones button { flex: 1; justify-content: center; } }
</style>