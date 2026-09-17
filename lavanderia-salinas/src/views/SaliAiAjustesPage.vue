<template>
  <AppShell>
    <div class="sali-ai-ajustes">
      <header class="sali-ai-header">
        <button class="volver" type="button" aria-label="Volver a configuración" @click="volver">
          <ion-icon :icon="arrowBackOutline" />
        </button>
        <div>
          <p class="eyebrow">Burbujita AI</p>
          <h2>Ajustes de Burbujita AI</h2>
          <p>Personaliza el asistente en este dispositivo.</p>
        </div>
      </header>

      <section class="ajustes-grid">
        <article class="ajuste-card voz-card">
          <div class="card-icon"><ion-icon :icon="volumeHighOutline" /></div>
          <div class="card-heading">
            <div>
              <p class="eyebrow">Preferencia local</p>
              <h3>Voz de Burbujita</h3>
            </div>
            <span class="local-badge">Este dispositivo</span>
          </div>
          <p class="card-copy">Elige el timbre que escuchas al presionar la bocina y confirma el cambio con Guardar voz.</p>
          <label class="campo-voz">
            <span>Voz</span>
            <select v-model="vozTemporal" :disabled="controlesBloqueados">
              <option v-for="voz in voces" :key="voz.id" :value="voz.id">{{ voz.nombre }} · {{ voz.descripcion }}</option>
            </select>
          </label>
          <div class="acciones-voz">
            <button class="probar-voz" type="button" :disabled="probandoVoz || controlesBloqueados" @click="probarVoz">
              <ion-icon :icon="playCircleOutline" />
              {{ probandoVoz ? 'Reproduciendo...' : 'Probar voz' }}
            </button>
            <button class="guardar-voz" type="button" :disabled="controlesBloqueados || vozTemporal === vozSeleccionada" @click="confirmarVoz">
              Guardar voz
            </button>
          </div>
          <p v-if="mensajeVoz" class="estado-voz" role="status">{{ mensajeVoz }}</p>
        </article>

        <button v-if="esAdministrador" class="ajuste-card enlace-card" type="button" @click="irA('/tabs/entrenamiento-sali')">
          <div class="card-icon"><ion-icon :icon="sparklesOutline" /></div>
          <div class="card-heading"><h3>Entrenamiento</h3><ion-icon :icon="chevronForwardOutline" /></div>
          <p class="card-copy">Agrega y administra el conocimiento que Burbujita puede consultar.</p>
          <span class="card-link">Abrir entrenamiento</span>
        </button>

        <button v-if="esAdministrador" class="ajuste-card enlace-card" type="button" @click="irA('/tabs/modelosia')">
          <div class="card-icon"><ion-icon :icon="hardwareChipOutline" /></div>
          <div class="card-heading"><h3>Modelos de IA</h3><ion-icon :icon="chevronForwardOutline" /></div>
          <p class="card-copy">Configura los modelos usados por las respuestas de Burbujita.</p>
          <span class="card-link">Abrir modelos</span>
        </button>
      </section>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { arrowBackOutline, chevronForwardOutline, hardwareChipOutline, playCircleOutline, sparklesOutline, volumeHighOutline } from 'ionicons/icons'
import AppShell from '@/components/AppShell.vue'
import { getApiBaseUrl } from '@/composables/useApiConfig'
import { useSaliAiConfig } from '@/composables/useSaliAiConfig'
import { useSesion } from '@/composables/useSesion'
import { useAccesoOperativo } from '@/composables/useAccesoOperativo'

const router = useRouter()
const { esAdministrador, usuarioActual } = useSesion()
const { funcionesBloqueadas } = useAccesoOperativo()
const controlesBloqueados = computed(() => !esAdministrador.value && funcionesBloqueadas.value)
const { vozSeleccionada, guardarVoz, voces } = useSaliAiConfig()
const vozTemporal = ref(vozSeleccionada.value)
const probandoVoz = ref(false)
const mensajeVoz = ref('')
const esDesarrollador = ref(false)

let audioPrueba: HTMLAudioElement | null = null

const volver = () => void router.replace('/tabs/configuracion')
const irA = (ruta: string) => void router.replace(ruta)

const confirmarVoz = () => {
  guardarVoz(vozTemporal.value)
  mensajeVoz.value = 'Voz guardada en este dispositivo.'
}

const probarVoz = async () => {
  if (probandoVoz.value) return
  probandoVoz.value = true
  mensajeVoz.value = ''
  try {
    const respuesta = await fetch(`${getApiBaseUrl()}/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto: 'Hola, soy Burbujita. Estoy lista para ayudarte.', voz: vozTemporal.value }),
    })
    if (!respuesta.ok) throw new Error('tts')
    audioPrueba?.pause()
    audioPrueba = new Audio(URL.createObjectURL(await respuesta.blob()))
    audioPrueba.playbackRate = 1.18
    audioPrueba.onended = () => { probandoVoz.value = false }
    audioPrueba.onerror = () => { probandoVoz.value = false; mensajeVoz.value = 'No se pudo reproducir la voz.' }
    await audioPrueba.play()
  } catch {
    probandoVoz.value = false
    mensajeVoz.value = 'No se pudo conectar con el servicio de voz.'
  }
}

onMounted(async () => {
  if (!usuarioActual.value?.id) return
  try {
    const respuesta = await fetch(`${getApiBaseUrl()}/sali/acceso?usuarioId=${encodeURIComponent(usuarioActual.value.id)}`)
    esDesarrollador.value = Boolean((await respuesta.json()).permitido)
  } catch {
    esDesarrollador.value = false
  }
})
</script>

<style scoped>
.sali-ai-ajustes { display: grid; gap: 24px; min-height: 100%; color: #102a43; }
.sali-ai-header { display: flex; align-items: flex-start; gap: 14px; padding-top: 8px; }
.volver { width: 38px; height: 38px; border: 1px solid #d8e5ed; border-radius: 10px; background: #fff; color: #176e88; font-size: 20px; cursor: pointer; }
.eyebrow { margin: 0 0 5px; color: #1f8d9c; font-size: .74rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
h2, h3, p { margin-top: 0; }
h2 { margin-bottom: 5px; color: #123a66; font-size: 1.65rem; font-weight: 900; }
.sali-ai-header > div > p:last-child { margin: 0; color: #6d829c; }
.ajustes-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; align-items: stretch; }
.ajuste-card { min-width: 0; padding: 20px; border: 1px solid #d8e8ef; border-radius: 10px; background: rgba(255,255,255,.88); box-shadow: 0 7px 20px rgba(18,58,102,.07); text-align: left; }
.voz-card { border-color: #8bd2d1; background: linear-gradient(145deg, #f2fffd, #fff); }
.enlace-card { color: #102a43; cursor: pointer; transition: transform .18s ease, border-color .18s ease; }
.enlace-card:hover { transform: translateY(-3px); border-color: #53bfc0; }
.card-icon { display: grid; place-items: center; width: 42px; height: 42px; margin-bottom: 17px; border-radius: 12px; background: #dff5f2; color: #16756c; font-size: 22px; }
.card-heading { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
h3 { margin-bottom: 8px; color: #123a66; font-size: 1.1rem; font-weight: 900; }
.card-heading > ion-icon { color: #1f8d9c; font-size: 21px; }
.card-copy { min-height: 42px; margin-bottom: 18px; color: #59728b; font-size: .88rem; line-height: 1.5; }
.local-badge { padding: 5px 8px; border-radius: 999px; background: #e7f7f3; color: #16756c; font-size: .68rem; font-weight: 800; white-space: nowrap; }
.campo-voz { display: grid; gap: 6px; margin-bottom: 13px; color: #31536d; font-size: .78rem; font-weight: 800; }
select { width: 100%; min-height: 42px; padding: 0 10px; border: 1px solid #b9d5df; border-radius: 8px; background: #fff; color: #173b59; font: inherit; font-size: .8rem; }
.acciones-voz { display: flex; flex-wrap: wrap; gap: 9px; }
.probar-voz, .guardar-voz { display: inline-flex; align-items: center; justify-content: center; gap: 7px; min-height: 38px; padding: 0 13px; border: 0; border-radius: 8px; color: #fff; font-weight: 800; cursor: pointer; }
.probar-voz { background: #1f8d9c; }
.guardar-voz { background: #176e88; }
.probar-voz:disabled { opacity: .55; cursor: wait; }
.guardar-voz:disabled { opacity: .45; cursor: not-allowed; }
.estado-voz { margin: 9px 0 0; color: #b45309; font-size: .76rem; }
.card-link { color: #1f8d9c; font-size: .8rem; font-weight: 800; }
@media (max-width: 850px) { .ajustes-grid { grid-template-columns: 1fr; } .ajuste-card { padding: 17px; } }
</style>
