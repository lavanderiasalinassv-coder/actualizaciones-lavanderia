<template>
  <AppShell>
    <div class="configuracion-page">
      <header class="configuracion-header">
        <div>
          <p class="configuracion-eyebrow">✨ Preferencias</p>
          <h2>Configuración</h2>
          <p>Selecciona una sección para administrar el sistema.</p>
        </div>
      </header>

      <nav class="configuracion-menu" aria-label="Opciones de configuración">
        <button v-if="esAdministrador" class="configuracion-opcion tema-apariencia" @click="irA('/tabs/apariencia')">
          <ion-icon :icon="chevronForwardOutline" class="configuracion-opcion-flecha" />
          <span class="configuracion-opcion-icono">
            <ion-icon :icon="colorPaletteOutline" />
          </span>
          <span class="configuracion-opcion-texto">
            <strong>🎨 Apariencia</strong>
            <small>Colores, imágenes y orbes de la aplicación</small>
          </span>
        </button>

       <button
          v-if="esDesarrollador"
          class="configuracion-opcion tema-sali"
          @click="irA('/tabs/api')"
        >
          <ion-icon :icon="chevronForwardOutline" class="configuracion-opcion-flecha" />
          <span class="configuracion-opcion-icono">
            <ion-icon :icon="cloudOutline" />
          </span>
          <span class="configuracion-opcion-texto">
            <strong>☁️ API del sistema </strong>
            <small>Selecciona el servidor local o en línea</small>
          </span>
        </button>

        <!-- Base de datos (Protegido) -->
        <button
          v-if="esDesarrollador"
          class="configuracion-opcion tema-sali solo-desktop"
          @click="irA('/tabs/base-datos')"
        >
          <ion-icon :icon="chevronForwardOutline" class="configuracion-opcion-flecha" />
          <span class="configuracion-opcion-icono">
            <ion-icon :icon="serverOutline" />
          </span>
          <span class="configuracion-opcion-texto">
            <strong>🗄️ Base de datos</strong>
            <small>Conecta la aplicación con otro servidor MySQL</small>
          </span>
        </button>

        <button v-if="esAdministrador" class="configuracion-opcion tema-respaldo solo-desktop" @click="irA('/tabs/respaldo')">
          <ion-icon :icon="chevronForwardOutline" class="configuracion-opcion-flecha" />
          <span class="configuracion-opcion-icono">
            <ion-icon :icon="cloudDownloadOutline" />
          </span>
          <span class="configuracion-opcion-texto">
            <strong>📦 Respaldo</strong>
            <small>Exporta tablas seleccionadas de la base de datos</small>
          </span>
        </button>

        <button
          v-if="esDesarrollador"
          class="configuracion-opcion tema-sali"
          @click="irA('/tabs/mantenimiento')"
        >
          <ion-icon :icon="chevronForwardOutline" class="configuracion-opcion-flecha" />
          <span class="configuracion-opcion-icono">
            <ion-icon :icon="constructOutline" />
          </span>
          <span class="configuracion-opcion-texto">
            <strong>🛠️ Mantenimiento </strong>
            <small>Limpia datos operativos de la base de datos</small>
          </span>
        </button>

        <button
          class="configuracion-opcion tema-sali"
          @click="irA('/tabs/ajustes-burbujita')"
        >
          <ion-icon :icon="chevronForwardOutline" class="configuracion-opcion-flecha" />
          <span class="configuracion-opcion-icono">
            <ion-icon :icon="sparklesOutline" />
          </span>
          <span class="configuracion-opcion-texto">
            <strong>🫧 Ajustes de Burbujita AI</strong>
          </span>
        </button>
      </nav>

      <ion-modal :is-open="modalAbierto" @didDismiss="cerrarModal">
        <div class="modal-clave-contenido">
          <div class="modal-header">
            <div class="modal-icono">
              <ion-icon :icon="lockClosedOutline" />
            </div>
            <h3>Acceso Protegido</h3>
            <p>Ingresa la contraseña para acceder a esta sección crítica.</p>
          </div>

          <form @submit.prevent="validarPassword">
            <div class="campo-password">
              <input
                v-model="passwordInput"
                type="password"
                placeholder="Ingresa la contraseña"
                ref="passwordRef"
                required
              />
            </div>

            <p v-if="errorPassword" class="mensaje-error">
              Contraseña incorrecta. Inténtalo de nuevo.
            </p>

            <div class="modal-acciones">
              <ion-button fill="clear" color="medium" type="button" @click="cerrarModal">
                Cancelar
              </ion-button>
              <ion-button type="submit" class="btn-confirmar">
                Ingresar
              </ion-button>
            </div>
          </form>
        </div>
      </ion-modal>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { IonButton, IonIcon, IonModal } from '@ionic/vue'
import { ref, nextTick, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import { useSesion } from '@/composables/useSesion'
import {
  chevronForwardOutline,
  cloudDownloadOutline,
  cloudOutline,
  colorPaletteOutline,
  constructOutline,
  lockClosedOutline,
  micOutline,
  serverOutline,
  sparklesOutline
} from 'ionicons/icons'
import { getApiBaseUrl } from '@/composables/useApiConfig'

const ADMIN_PASSWORD = '592647'

const router = useRouter()
const { esAdministrador, usuarioActual } = useSesion()

const esDesarrollador = computed(() => {
  const nombre = usuarioActual.value?.nombre?.toLowerCase() || ''
  const rol = usuarioActual.value?.rol?.toLowerCase() || ''
  return nombre === 'desarrollador' || rol === 'developer' || rol === 'desarrollador'
})

const modalAbierto = ref(false)
const rutaDestino = ref('')
const passwordInput = ref('')
const errorPassword = ref(false)
const passwordRef = ref<HTMLInputElement | null>(null)

const irA = (ruta: string) => {
  void router.replace(ruta).catch(() => {})
}

const solicitarAcceso = (ruta: string) => {
  rutaDestino.value = ruta
  passwordInput.value = ''
  errorPassword.value = false
  modalAbierto.value = true

  void nextTick(() => {
    passwordRef.value?.focus()
  })
}

const cerrarModal = () => {
  modalAbierto.value = false
  passwordInput.value = ''
  errorPassword.value = false
}

const validarPassword = () => {
  if (passwordInput.value === ADMIN_PASSWORD) {
    const destino = rutaDestino.value
    cerrarModal()
    irA(destino)
  } else {
    errorPassword.value = true
    passwordInput.value = ''
  }
}

onMounted(async () => {
  // esDesarrollador es ahora un computed, no necesita ser cargado desde el servidor
})
</script>

<style scoped>
.configuracion-page {
  display: grid;
  gap: 24px;
  min-height: 100%;
  color-scheme: light;
}

.configuracion-header {
  padding: 8px 2px 0;
}

.configuracion-eyebrow {
  margin: 0 0 6px;
  color: #6d829c;
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.configuracion-header h2 {
  margin: 0;
  color: #0a1f38;
  font-size: 1.6rem;
  font-weight: 900;
  background: linear-gradient(135deg, #123a66, #4fb3e0);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.configuracion-header p:last-child {
  margin: 8px 0 0;
  color: #6d829c;
}

/* ---------- Grid de cards cuadrados ---------- */

.configuracion-menu {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
  align-content: start;
}

.configuracion-opcion {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  aspect-ratio: 1 / 1;
  padding: 28px 20px;
  border: 1px solid rgba(10, 31, 56, 0.08);
  border-radius: 24px;
  background: #ffffff;
  color: #0a1f38;
  text-align: center;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(10, 31, 56, 0.06);
  transition: transform 0.22s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.22s ease,
    border-color 0.22s ease,
    background 0.22s ease;
}

.configuracion-opcion:hover:not(:disabled) {
  transform: translateY(-6px) scale(1.03);
  box-shadow: 0 22px 40px rgba(10, 31, 56, 0.16);
}

.configuracion-opcion:active:not(:disabled) {
  transform: translateY(-2px) scale(0.99);
}

.configuracion-opcion-icono {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 72px;
  height: 72px;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(102, 194, 184, 0.2), rgba(18, 58, 102, 0.12));
  color: #123a66;
  font-size: 34px;
  transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), background 0.22s ease, color 0.22s ease;
}

.configuracion-opcion:hover:not(:disabled) .configuracion-opcion-icono {
  transform: scale(1.12) rotate(-4deg);
}

/* 🎨 Temas */
.tema-apariencia { border-color: rgba(236, 72, 153, 0.16); }
.tema-apariencia .configuracion-opcion-icono {
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.16), rgba(236, 72, 153, 0.06));
  color: #db2777;
}
.tema-apariencia:hover:not(:disabled) {
  border-color: rgba(236, 72, 153, 0.45);
  background: linear-gradient(180deg, #ffffff 0%, #fdf2f8 100%);
}
.tema-apariencia:hover:not(:disabled) .configuracion-opcion-icono {
  background: linear-gradient(135deg, #ec4899, #db2777);
  color: #ffffff;
}

.tema-voz { border-color: rgba(6, 182, 212, 0.18); }
.tema-voz .configuracion-opcion-icono {
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.18), rgba(6, 182, 212, 0.06));
  color: #0e7490;
}
.tema-voz:hover:not(:disabled) {
  border-color: rgba(6, 182, 212, 0.45);
  background: linear-gradient(180deg, #ffffff 0%, #ecfeff 100%);
}
.tema-voz:hover:not(:disabled) .configuracion-opcion-icono {
  background: linear-gradient(135deg, #22d3ee, #0e7490);
  color: #ffffff;
}

.tema-api { border-color: rgba(79, 179, 224, 0.16); }
.tema-api .configuracion-opcion-icono {
  background: linear-gradient(135deg, rgba(79, 179, 224, 0.18), rgba(79, 179, 224, 0.06));
  color: #1c6f95;
}
.tema-api:hover:not(:disabled) {
  border-color: rgba(79, 179, 224, 0.45);
  background: linear-gradient(180deg, #ffffff 0%, #f0f9ff 100%);
}
.tema-api:hover:not(:disabled) .configuracion-opcion-icono {
  background: linear-gradient(135deg, #4fb3e0, #1c6f95);
  color: #ffffff;
}

.tema-basedatos { border-color: rgba(124, 58, 237, 0.16); }
.tema-basedatos .configuracion-opcion-icono {
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.16), rgba(124, 58, 237, 0.06));
  color: #7c3aed;
}
.tema-basedatos:hover:not(:disabled) {
  border-color: rgba(124, 58, 237, 0.45);
  background: linear-gradient(180deg, #ffffff 0%, #f5f3ff 100%);
}
.tema-basedatos:hover:not(:disabled) .configuracion-opcion-icono {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: #ffffff;
}

.tema-respaldo { border-color: rgba(22, 163, 74, 0.16); }
.tema-respaldo .configuracion-opcion-icono {
  background: linear-gradient(135deg, rgba(22, 163, 74, 0.16), rgba(22, 163, 74, 0.06));
  color: #16a34a;
}
.tema-respaldo:hover:not(:disabled) {
  border-color: rgba(22, 163, 74, 0.45);
  background: linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%);
}
.tema-respaldo:hover:not(:disabled) .configuracion-opcion-icono {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #ffffff;
}

.tema-mantenimiento { border-color: rgba(217, 119, 6, 0.16); }
.tema-mantenimiento .configuracion-opcion-icono {
  background: linear-gradient(135deg, rgba(217, 119, 6, 0.18), rgba(217, 119, 6, 0.06));
  color: #d97706;
}
.tema-mantenimiento:hover:not(:disabled) {
  border-color: rgba(217, 119, 6, 0.45);
  background: linear-gradient(180deg, #ffffff 0%, #fffaf0 100%);
}
.tema-mantenimiento:hover:not(:disabled) .configuracion-opcion-icono {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: #ffffff;
}

.configuracion-opcion-texto {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.configuracion-opcion-texto strong {
  font-size: 1.05rem;
  font-weight: 800;
  color: #0a1f38;
}

.configuracion-opcion-texto small {
  color: #6d829c;
  font-size: 0.82rem;
  line-height: 1.4;
}

.configuracion-opcion-flecha {
  position: absolute;
  top: 16px;
  right: 16px;
  color: #b7c3d1;
  font-size: 18px;
  opacity: 0;
  transform: translateX(-6px);
  transition: opacity 0.22s ease, transform 0.22s ease, color 0.22s ease;
}

.configuracion-opcion:hover:not(:disabled) .configuracion-opcion-flecha {
  opacity: 1;
  transform: translateX(0);
  color: #4fb3e0;
}

.tema-sali { border-color: rgba(37, 99, 235, 0.18); }
.tema-sali .configuracion-opcion-icono { background: linear-gradient(135deg, rgba(37, 99, 235, 0.17), rgba(139, 92, 246, 0.08)); color: #2563eb; }
.tema-sali:hover:not(:disabled) { border-color: rgba(37, 99, 235, 0.45); background: linear-gradient(180deg, #ffffff 0%, #eff6ff 100%); }
.tema-sali:hover:not(:disabled) .configuracion-opcion-icono { background: linear-gradient(135deg, #2563eb, #7c3aed); color: #ffffff; }

/* ---------- Estilos del Modal de Seguridad ---------- */
ion-modal {
  --width: 90%;
  --max-width: 400px;
  --height: auto;
  --border-radius: 20px;
  --box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.modal-clave-contenido {
  padding: 24px;
  background: #ffffff;
  border-radius: 20px;
}

.modal-header {
  text-align: center;
  margin-bottom: 20px;
}

.modal-icono {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  margin: 0 auto 12px;
  border-radius: 16px;
  background: #fee2e2;
  color: #dc2626;
  font-size: 28px;
}

.modal-header h3 {
  margin: 0 0 6px;
  color: #0a1f38;
  font-size: 1.25rem;
  font-weight: 800;
}

.modal-header p {
  margin: 0;
  color: #6d829c;
  font-size: 0.85rem;
}

.campo-password input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #cbd7df;
  border-radius: 12px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
  background: white;
  color: #0a1f38;
}

.campo-password input:focus {
  border-color: #123a66;
  box-shadow: 0 0 0 3px rgba(18, 58, 102, 0.12);
  background: white;
}

.mensaje-error {
  margin: 8px 0 0;
  color: #dc2626;
  font-size: 0.8rem;
  font-weight: 600;
  text-align: center;
}

.modal-acciones {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
}

.btn-confirmar {
  --background: #123a66;
  --border-radius: 10px;
  color: white;
}

/* ---------- Responsive ---------- */
@media (max-width: 900px) {
  .solo-desktop {
    display: none !important;
  }

  .configuracion-menu {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .configuracion-opcion {
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    aspect-ratio: auto;
    padding: 14px 12px;
    border-radius: 18px;
    gap: 10px;
    min-height: 165px;
  }

  .configuracion-opcion-icono {
    width: 48px;
    height: 48px;
    font-size: 24px;
    border-radius: 14px;
  }

  .configuracion-opcion-flecha {
    position: absolute;
    top: 12px;
    right: 12px;
    opacity: 0.85;
    transform: none;
    margin-left: 0;
    color: #b7c3d1;
  }

  .configuracion-opcion:hover:not(:disabled) {
    transform: none;
  }

  .configuracion-opcion:active:not(:disabled) {
    transform: scale(0.98);
  }
}

@media (max-width: 480px) {
  .configuracion-menu {
    gap: 10px;
  }

  .configuracion-opcion {
    padding: 12px 10px;
    min-height: 150px;
    gap: 8px;
  }

  .configuracion-opcion-icono {
    width: 42px;
    height: 42px;
    font-size: 20px;
    border-radius: 12px;
  }

  .configuracion-opcion-texto strong {
    font-size: 0.9rem;
  }

  .configuracion-opcion-texto small {
    font-size: 0.72rem;
    line-height: 1.3;
  }
}
</style>