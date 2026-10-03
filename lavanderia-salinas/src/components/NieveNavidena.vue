<template>
  <div v-if="esDiciembre" class="nieve-temporada" aria-hidden="true">
    <span
      v-for="copo in coposNieve"
      :key="copo.id"
      class="copo-nieve"
      :style="{
        left: copo.left,
        width: `${copo.size}px`,
        height: `${copo.size}px`,
        animationDuration: copo.duracion,
        animationDelay: copo.retraso,
        '--nieve-deriva': copo.deriva,
        '--nieve-opacidad': copo.opacidad,
        '--nieve-posicion-estatica': copo.posicionEstatica,
      }"
    ></span>
  </div>
</template>

<script setup lang="ts">
import { useDiciembre } from '@/composables/useDiciembre'

const esDiciembre = useDiciembre()
const coposNieve = Array.from({ length: 42 }, (_, id) => ({
  id,
  left: `${(id * 37) % 100}%`,
  size: 2 + (id * 7) % 5,
  duracion: `${10 + (id * 13) % 15}s`,
  retraso: `-${(id * 17) % 24}s`,
  deriva: `${(id * 19) % 61 - 30}px`,
  posicionEstatica: `${(id * 23) % 90}vh`,
  opacidad: 0.35 + ((id * 11) % 60) / 100,
}))
</script>

<style scoped>
.nieve-temporada {
  position: fixed;
  inset: 0;
  z-index: 3;
  overflow: hidden;
  pointer-events: none;
}

.copo-nieve {
  position: absolute;
  top: -10px;
  display: block;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 0 7px rgba(255, 255, 255, 0.66);
  opacity: var(--nieve-opacidad, 0.7);
  animation-name: nieve-caida;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  will-change: transform;
}

@keyframes nieve-caida {
  from { transform: translate3d(0, -4vh, 0); }
  to { transform: translate3d(var(--nieve-deriva, 0), 108vh, 0); }
}

@media (prefers-reduced-motion: reduce) {
  .copo-nieve { top: var(--nieve-posicion-estatica, 50vh); animation: none; }
}
</style>
