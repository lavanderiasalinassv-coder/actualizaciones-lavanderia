<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>

      <ion-tab-bar slot="bottom" class="mobile-tab-bar">
        <ion-tab-button v-if="!esOperador" tab="principal" href="/tabs/principal" class="tab-btn tab-home">
          <span class="tab-icon-wrap tab-icon-wrap-sm">
            <ion-icon aria-hidden="true" :icon="homeOutline" />
          </span>
          <ion-label>Home</ion-label>
        </ion-tab-button>

        <ion-tab-button
          v-if="!esOperador && !esRecepcionista"
          tab="depositos"
          :href="turnoCerrado ? undefined : '/tabs/depositos'"
          class="tab-btn tab-depositos"
          :class="{ 'tab-disabled': turnoCerrado }"
        >
          <span class="tab-icon-wrap">
            <ion-icon aria-hidden="true" :icon="walletOutline" />
          </span>
          <ion-label>Depósitos</ion-label>
        </ion-tab-button>

        <ion-tab-button v-if="!esOperador" class="tab-btn tab-gastos" :class="{ 'tab-disabled': turnoCerrado }" @click="!turnoCerrado && abrirModalGasto()">
          <span class="tab-icon-wrap">
            <ion-icon aria-hidden="true" :icon="cashOutline" />
          </span>
          <ion-label>Gastos</ion-label>
        </ion-tab-button>

        <ion-tab-button
          v-if="!esOperador && esAdministrador"
          class="tab-btn tab-cierres"
          @click="abrirModalCierres()"
        >
          <span class="tab-icon-wrap">
            <ion-icon aria-hidden="true" :icon="lockClosedOutline" />
          </span>
          <ion-label>Cierres</ion-label>
        </ion-tab-button>

        <ion-tab-button v-if="esOperador" tab="home" href="/tabs/home" class="tab-btn tab-home">
          <span class="tab-icon-wrap tab-icon-wrap-sm">
            <ion-icon aria-hidden="true" :icon="homeOutline" />
          </span>
          <ion-label>Home</ion-label>
        </ion-tab-button>

        <ion-tab-button class="tab-btn tab-salir" @click="salir">
          <span class="tab-icon-wrap">
            <ion-icon aria-hidden="true" :icon="logOutOutline" />
          </span>
          <ion-label>Salir</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IonTabBar, IonTabButton, IonTabs, IonLabel, IonIcon, IonPage, IonRouterOutlet } from '@ionic/vue'
import { useRouter } from 'vue-router'
import { cashOutline, homeOutline, lockClosedOutline, logOutOutline, receiptOutline, walletOutline } from 'ionicons/icons'
import { useModalesCaja } from '@/composables/useModalesCaja'
import { useSesion } from '@/composables/useSesion'
import { useTurno } from '@/composables/useTurno'
import { useAccesoOperativo } from '@/composables/useAccesoOperativo'

const { funcionesBloqueadas } = useAccesoOperativo()

const turnoCerrado = computed(() =>
  (esCajero.value || esRecepcionista.value) && (!turno.abierto || funcionesBloqueadas.value)
)

const router = useRouter()
const { abrirModalGasto, abrirModalCierres } = useModalesCaja()
const { cerrarSesion, esAdministrador, esOperador, rol } = useSesion()
const { turno } = useTurno()
const esRecepcionista = computed(() => rol.value === 'recepcionista')
const esCajero = computed(() => rol.value === 'cajero' || rol.value === 'caja')

const salir = () => {
  cerrarSesion()
  router.replace('/login').catch(() => {})
}
</script>

<style scoped>
.mobile-tab-bar {
  --background: linear-gradient(180deg, #ffffff 0%, #f5f9fc 100%);
  --border: none;
  box-shadow: 0 -6px 20px rgba(10, 31, 56, 0.10);
  padding: 6px 6px calc(4px + env(safe-area-inset-bottom));
}

.tab-btn {
  --color: #6d829c;
  --color-selected: #123a66;
  font-weight: 700;
  gap: 2px;
}

.tab-btn.tab-disabled {
  --color: #b0b8c4 !important;
  opacity: 0.5;
  pointer-events: none;
}

.tab-btn.tab-disabled .tab-icon-wrap {
  background: rgba(176, 184, 196, 0.2) !important;
}

.tab-btn.tab-disabled ion-icon {
  color: #b0b8c4 !important;
}

.tab-btn ion-label {
  font-size: 0.68rem;
  font-weight: 800;
  margin-top: 2px;
}

.tab-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 12px;
  background: rgba(18, 58, 102, 0.08);
  transition: transform 0.15s ease, background 0.15s ease;
}

.tab-icon-wrap ion-icon {
  font-size: 19px;
  color: inherit;
}

/* Home un poco más chico para que no tope con la barra */
.tab-icon-wrap-sm {
  width: 28px;
  height: 28px;
  border-radius: 10px;
}

.tab-icon-wrap-sm ion-icon {
  font-size: 16px;
}

.tab-btn.tab-selected .tab-icon-wrap,
.tab-btn:active .tab-icon-wrap {
  transform: translateY(-2px) scale(1.06);
}

/* 🏠 Home — azul marca */
.tab-home .tab-icon-wrap {
  background: rgba(18, 58, 102, 0.10);
  color: #123a66;
}
.tab-home.tab-selected .tab-icon-wrap {
  background: #123a66;
  color: #ffffff;
}

/* 💰 Depósitos — verde */
.tab-depositos .tab-icon-wrap {
  background: rgba(22, 163, 74, 0.12);
  color: #16a34a;
}
.tab-depositos.tab-selected .tab-icon-wrap {
  background: #16a34a;
  color: #ffffff;
}

/* 💸 Gastos — naranja */
.tab-gastos .tab-icon-wrap {
  background: rgba(217, 119, 6, 0.14);
  color: #d97706;
}

/* 🔒 Cierres — morado */
.tab-cierres .tab-icon-wrap {
  background: rgba(124, 58, 237, 0.14);
  color: #7c3aed;
}

/* 🚪 Salir — rojo */
.tab-salir .tab-icon-wrap {
  background: rgba(220, 38, 38, 0.12);
  color: #dc2626;
}
.tab-ordenes .tab-icon-wrap {
  background: rgba(18, 58, 102, 0.14);
  color: #123a66;
}
.tab-salir ion-label {
  color: #dc2626;
}

@media (min-width: 901px) {
  .mobile-tab-bar {
    display: none !important;
  }
}
</style>
