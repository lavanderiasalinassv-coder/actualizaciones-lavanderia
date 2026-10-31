<template>
  <ion-modal :is-open="isOpen" class="modal-visita-lealtad" @didDismiss="emit('close')">
    <section class="visita-lealtad force-light" role="dialog" aria-labelledby="titulo-visita-lealtad">
      <header class="visita-encabezado">
        <span class="visita-etiqueta">PUNTO DE LEALTAD</span>
        <h2 id="titulo-visita-lealtad">{{ resultado ? '¡Visita registrada!' : '¿Marcar una visita?' }}</h2>
        <p v-if="!resultado">La orden {{ ordenNumero }} de {{ nombreCliente }} fue entregada. ¿Registrar este punto en su tarjeta?</p>
      </header>

      <div v-if="resultado" class="visita-celebracion" role="status" aria-live="polite">
        <div class="visita-sello"><span>✓</span></div>
        <strong class="visita-contador">{{ resultado.sellos }}<small>/{{ resultado.meta }}</small></strong>
        <p>{{ resultado.nombre || nombreCliente }} ahora tiene {{ resultado.sellos }} de {{ resultado.meta }} visitas.</p>
        <span v-if="resultado.premioDisponible" class="visita-premio">¡Completó las visitas y tiene un premio disponible!</span>
      </div>

      <p v-if="error" class="visita-error" role="alert">{{ error }}</p>

      <footer class="visita-acciones">
        <template v-if="!resultado">
          <button type="button" class="visita-no" :disabled="procesando" @click="emit('close')">No, omitir</button>
          <button type="button" class="visita-si" :disabled="procesando" @click="emit('confirm')">
            {{ procesando ? 'Registrando…' : 'Sí, marcar visita' }}
          </button>
        </template>
        <button v-else type="button" class="visita-si" @click="emit('close')">Listo</button>
      </footer>
    </section>
  </ion-modal>
</template>

<script setup lang="ts">
import { IonModal } from '@ionic/vue'

defineProps<{
  isOpen: boolean
  nombreCliente: string
  ordenNumero: string
  procesando: boolean
  error: string
  resultado: { nombre?: string; sellos: number; meta: number; premioDisponible: boolean } | null
}>()

const emit = defineEmits<{ close: []; confirm: [] }>()
</script>

<style scoped>
.modal-visita-lealtad { --width: min(92vw, 440px); --height: auto; --border-radius: 24px; }
.visita-lealtad { display: grid; gap: 20px; max-height: 90vh; overflow: auto; padding: 28px; border-radius: 24px; background: #fff !important; color: #123a66 !important; text-align: center; }
.visita-encabezado { display: grid; justify-items: center; gap: 8px; }
.visita-etiqueta { color: #168b83; font-size: .72rem; font-weight: 900; letter-spacing: .14em; }
.visita-encabezado h2 { margin: 0; color: #123a66 !important; font-size: 1.45rem; }
.visita-encabezado p, .visita-celebracion p { margin: 0; color: #52677e !important; line-height: 1.5; }
.visita-celebracion { display: grid; justify-items: center; gap: 10px; padding: 22px 16px; border: 1px solid #cdece2; border-radius: 20px; background: #f0fbf6; animation: visita-entrada .45s cubic-bezier(.2,.8,.2,1) both; }
.visita-sello { display: grid; width: 68px; height: 68px; place-items: center; border: 4px solid #168b83; border-radius: 50%; background: #fff; color: #168b83; font-size: 2rem; font-weight: 900; animation: sello-pop .55s cubic-bezier(.16,1.5,.4,1) both; }
.visita-contador { color: #123a66; font-size: 2.4rem; line-height: 1; font-variant-numeric: tabular-nums; }
.visita-contador small { color: #718198; font-size: 1.1rem; }
.visita-premio { padding: 8px 12px; border-radius: 10px; background: #fff3cc; color: #775500; font-size: .88rem; font-weight: 800; }
.visita-error { margin: 0; color: #b42318 !important; font-weight: 750; }
.visita-acciones { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; }
.visita-acciones button { min-height: 44px; padding: 0 17px; border-radius: 11px; font: inherit; font-weight: 800; cursor: pointer; }
.visita-acciones button:disabled { cursor: wait; opacity: .65; }
.visita-no { border: 1px solid #cbd5e1; background: #fff; color: #475569; }
.visita-si { border: 0; background: #168b83; color: #fff; }
@keyframes visita-entrada { from { opacity: 0; transform: translateY(10px) scale(.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes sello-pop { from { opacity: 0; transform: scale(.25) rotate(-35deg); } to { opacity: 1; transform: scale(1) rotate(0); } }
@media (prefers-reduced-motion: reduce) { .visita-celebracion, .visita-sello { animation: none; } }
</style>
