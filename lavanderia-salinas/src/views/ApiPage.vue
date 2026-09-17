<template>
  <AppShell>
    <div class="api-page">
      <header class="api-header">
        <button class="volver-btn" type="button" title="Volver a configuración" @click="volver">
          <ion-icon :icon="arrowBackOutline" />
        </button>
        <div>
          <p class="api-eyebrow">Conexión</p>
          <h2>API del sistema</h2>
          <p>Elige el servidor que utilizarán los módulos de la aplicación.</p>
        </div>
        <span class="estado" :class="{ online: servidorConfigurado && destinoActual === 'servidor' }">
          <span class="estado-punto"></span>
          {{ destinoActual === 'local' ? 'API local' : 'API en línea' }}
        </span>
      </header>

      <section class="destinos" aria-label="Servidores disponibles">
        <button
          type="button"
          class="destino"
          :class="{ seleccionado: destinoActual === 'local' }"
          @click="seleccionarDestino('local')"
        >
          <span class="destino-icono"><ion-icon :icon="desktopOutline" /></span>
          <span class="destino-contenido">
            <strong>Servidor local</strong>
            <small>Para trabajar con la API en tu equipo</small>
            <code>{{ API_LOCAL_URL }}</code>
          </span>
          <ion-icon v-if="destinoActual === 'local'" :icon="checkmarkCircleOutline" class="destino-check" />
        </button>

        <button
          type="button"
          class="destino"
          :class="{ seleccionado: destinoActual === 'servidor' }"
          @click="seleccionarServidor"
        >
          <span class="destino-icono"><ion-icon :icon="globeOutline" /></span>
          <span class="destino-contenido">
            <strong>Servidor en línea</strong>
            <small>Conecta la aplicación a tu API publicada</small>
            <code>{{ apiOnline }}</code>
          </span>
          <ion-icon v-if="destinoActual === 'servidor'" :icon="checkmarkCircleOutline" class="destino-check" />
        </button>
      </section>

      <section class="configuracion-api">
        <div class="seccion-titulo">
          <div>
            <p class="api-eyebrow">Servidor en línea</p>
            <h3>Dirección de la API</h3>
          </div>
          <span class="badge">/api incluido</span>
        </div>

        <label for="api-online">URL base</label>
        <div class="campo-url">
          <ion-icon :icon="linkOutline" />
          <input
            id="api-online"
            v-model="apiOnline"
            type="url"
            inputmode="url"
            placeholder="Ingresa la URL de tu API"
            autocomplete="url"
            @keydown.enter.prevent="guardarConfiguracion"
          />
        </div>
        <p class="campo-ayuda">La dirección debe terminar en <code>/api</code>.</p>

        <div class="acciones">
          <ion-button fill="clear" class="btn-secundario" @click="seleccionarDestino('local')">
            <ion-icon slot="start" :icon="refreshOutline" />
            Usar API local
          </ion-button>
          <ion-button class="btn-guardar" @click="guardarConfiguracion">
          <ion-icon slot="start" :icon="saveOutline" />
          Guardar cambios
        </ion-button>
        </div>
        <p v-if="mensaje" class="mensaje" :class="{ error: esError }">{{ mensaje }}</p>
      </section>

      <div class="api-activa">
        <span class="api-activa-icono"><ion-icon :icon="shieldCheckmarkOutline" /></span>
        <div>
          <strong>Conexión activa</strong>
          <code>{{ urlActiva }}</code>
        </div>
      </div>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { IonButton, IonIcon } from '@ionic/vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import { API_LOCAL_URL, useApiConfig } from '@/composables/useApiConfig'
import {
  arrowBackOutline,
  checkmarkCircleOutline,
  desktopOutline,
  globeOutline,
  linkOutline,
  refreshOutline,
  saveOutline,
  shieldCheckmarkOutline
} from 'ionicons/icons'

const {
  destinoActual,
  apiOnline,
  urlActiva,
  servidorConfigurado,
  seleccionarDestino,
  guardarApiConfig // 👈 Usamos la función principal del composable
} = useApiConfig()

const router = useRouter()
const mensaje = ref('')
const esError = ref(false)

const volver = () => void router.replace('/tabs/configuracion')

// Clic en la tarjeta de Servidor en Línea
const seleccionarServidor = () => {
  if (!servidorConfigurado.value) {
    mensaje.value = 'Configura primero la URL del servidor en línea.'
    esError.value = true
    return
  }

  seleccionarDestino('servidor')
  mensaje.value = 'Servidor en línea seleccionado.'
  esError.value = false
}

const guardarConfiguracion = () => {
  try {
    guardarApiConfig(destinoActual.value, apiOnline.value)
    
    mensaje.value = destinoActual.value === 'local' 
      ? 'Configuración guardada: Usando API local.' 
      : 'Configuración guardada: Usando API en línea.'
      
    esError.value = false
  } catch (error) {
    mensaje.value = error instanceof Error ? error.message : 'No se pudo guardar la configuración.'
    esError.value = true
  }
}
</script>

<style scoped>
.api-page {
  display: grid;
  gap: 24px;
  min-height: 100%;
  color: #0a1f38;
}

.api-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 8px 2px 0;
}

.volver-btn {
  width: 38px;
  height: 38px;
  border: 1px solid rgba(10,31,56,.12);
  border-radius: 10px;
  background: #fff;
  color: #123a66;
  font-size: 20px;
  cursor: pointer;
}

.api-eyebrow {
  margin: 0 0 6px;
  color: #168b83;
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.api-header h2,
.seccion-titulo h3 {
  margin: 0;
  color: #0a1f38;
  font-weight: 900;
}

.api-header h2 { font-size: 1.6rem; }
.api-header p:last-child { margin: 8px 0 0; color: #6d829c; }

.estado {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  padding: 8px 12px;
  border: 1px solid rgba(10, 31, 56, 0.1);
  border-radius: 999px;
  background: #f3f6f8;
  color: #6d829c;
  font-size: 0.78rem;
  font-weight: 800;
}

.estado.online { border-color: rgba(22, 139, 131, 0.25); background: #e8f7f4; color: #08766f; }
.estado-punto { width: 7px; height: 7px; border-radius: 50%; background: #aab8c5; }
.estado.online .estado-punto { background: #168b83; box-shadow: 0 0 0 4px rgba(22, 139, 131, 0.14); }

.destinos { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }

.destino {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
  padding: 22px;
  border: 1px solid rgba(10, 31, 56, 0.09);
  border-radius: 18px;
  background: #fff;
  color: #0a1f38;
  text-align: left;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(10, 31, 56, 0.05);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.destino:hover { transform: translateY(-3px); border-color: rgba(22, 139, 131, 0.4); box-shadow: 0 14px 28px rgba(10, 31, 56, 0.1); }
.destino.seleccionado { border: 2px solid #168b83; padding: 21px; box-shadow: 0 12px 26px rgba(22, 139, 131, 0.12); }
.destino-icono { display: grid; place-items: center; flex-shrink: 0; width: 48px; height: 48px; border-radius: 14px; background: #e8f7f4; color: #168b83; font-size: 25px; }
.destino:nth-child(2) .destino-icono { background: #eef2fb; color: #4169a1; }
.destino-contenido { display: grid; gap: 5px; min-width: 0; }
.destino-contenido strong { font-size: 1rem; }
.destino-contenido small { color: #6d829c; line-height: 1.35; }
code { overflow-wrap: anywhere; color: #4169a1; font-family: 'Cascadia Code', Consolas, monospace; font-size: 0.78rem; }
.destino-check { position: absolute; top: 18px; right: 18px; color: #168b83; font-size: 21px; }

.configuracion-api { padding: 24px; border: 1px solid rgba(10, 31, 56, 0.08); border-radius: 18px; background: #fff; box-shadow: 0 8px 20px rgba(10, 31, 56, 0.05); }
.seccion-titulo { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 20px; }
.seccion-titulo h3 { font-size: 1.12rem; }
.badge { padding: 5px 9px; border-radius: 999px; background: #eef2fb; color: #4169a1; font-size: 0.7rem; font-weight: 800; }
.configuracion-api label { display: block; margin-bottom: 8px; color: #0a1f38; font-size: 0.82rem; font-weight: 800; }
.campo-url { display: flex; align-items: center; gap: 10px; padding: 0 14px; border: 1px solid #cbd7df; border-radius: 10px; background: #fbfdfe; color: #6d829c; }
.campo-url:focus-within { border-color: #168b83; box-shadow: 0 0 0 3px rgba(22, 139, 131, 0.12); }
.campo-url input { width: 100%; min-width: 0; padding: 13px 0; border: 0; outline: 0; background: transparent; color: #0a1f38; font: inherit; }
.campo-ayuda { margin: 8px 0 0; color: #6d829c; font-size: 0.78rem; }
.acciones { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
.btn-secundario { --color: #4169a1; }
.btn-guardar { --background: #168b83; --background-hover: #08766f; --border-radius: 9px; }
.mensaje { margin: 14px 0 0; color: #08766f; font-size: 0.82rem; font-weight: 700; text-align: right; }
.mensaje.error { color: #b74444; }

.api-activa { display: flex; align-items: center; gap: 14px; padding: 16px 18px; border-left: 4px solid #168b83; background: #eef8f6; }
.api-activa-icono { display: grid; place-items: center; flex-shrink: 0; width: 36px; height: 36px; border-radius: 10px; background: #d2f0eb; color: #168b83; font-size: 20px; }
.api-activa div { display: grid; gap: 4px; min-width: 0; }
.api-activa strong { font-size: 0.82rem; }

@media (max-width: 650px) {
  .api-header { flex-direction: column; }
  .destinos { grid-template-columns: 1fr; }
  .configuracion-api { padding: 18px; }
  .acciones { flex-direction: column-reverse; }
  .acciones ion-button { margin: 0; }
}
</style>
