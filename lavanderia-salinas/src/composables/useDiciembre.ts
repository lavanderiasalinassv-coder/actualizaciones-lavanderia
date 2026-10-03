import { computed, onMounted, onUnmounted, ref } from 'vue'

export const useDiciembre = () => {
  const ahora = ref(new Date())
  let intervalo: ReturnType<typeof setInterval> | null = null

  onMounted(() => {
    intervalo = setInterval(() => { ahora.value = new Date() }, 60_000)
  })

  onUnmounted(() => {
    if (intervalo) clearInterval(intervalo)
  })

  return computed(() => ahora.value.getMonth() === 11)
}
