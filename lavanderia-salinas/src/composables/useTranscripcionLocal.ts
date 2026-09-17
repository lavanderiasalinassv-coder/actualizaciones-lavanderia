let transcriptorPromesa: Promise<any> | null = null
// "base" reconoce mejor el español y nombres propios que el modelo "tiny".
// La descarga ocurre una sola vez y queda guardada en la caché del equipo.
const MODELO_TRANSCRIPCION = 'onnx-community/whisper-base'

export const obtenerTranscriptor = async () => {
  if (typeof window === 'undefined') return null

  if (!transcriptorPromesa) {
    transcriptorPromesa = (async () => {
      const { pipeline, env } = await import('@huggingface/transformers')

      env.allowLocalModels = false
      // En Electron el backend WASM puede no estar inicializado aún. Acceder a
      // él directamente abortaba la carga del modelo y terminaba mostrando el
      // mensaje genérico de que no se pudo transcribir.
      if (env.backends?.onnx?.wasm) {
        env.backends.onnx.wasm.numThreads = 1
        // El worker proxy de ONNX no es necesario para Whisper y es menos
        // fiable cuando la aplicación se ejecuta desde el empaquetado de Electron.
        env.backends.onnx.wasm.proxy = false
      }

      return pipeline(
        'automatic-speech-recognition',
        MODELO_TRANSCRIPCION,
        // La exportación q8 de Whisper falla en ONNX Runtime Web 4.x al crear
        // el decodificador ("Missing required scale"). En Electron usamos
        // WASM + fp32: tarda más en descargarse la primera vez, pero inicia la
        // sesión de forma estable incluso cuando la GPU está deshabilitada.
        { device: 'wasm', dtype: 'fp32' }
      )
    })().catch((error) => {
      transcriptorPromesa = null
      throw error
    })
  }
  return transcriptorPromesa
}

export const decodificarAudioParaWhisper = async (blob: Blob): Promise<Float32Array> => {
  if (typeof window === 'undefined') {
    throw new Error('AudioContext solo puede ejecutarse en el navegador.')
  }

  const bufferArray = await blob.arrayBuffer()
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
  const contextoTemporal = new AudioCtx()

  const bufferDecodificado = await contextoTemporal.decodeAudioData(bufferArray)
  await contextoTemporal.close()

  const duracion = bufferDecodificado.duration
  const contextoOffline = new OfflineAudioContext(1, Math.ceil(duracion * 16000), 16000)
  const fuente = contextoOffline.createBufferSource()
  fuente.buffer = bufferDecodificado
  fuente.connect(contextoOffline.destination)
  fuente.start()

  const bufferFinal = await contextoOffline.startRendering()
  return bufferFinal.getChannelData(0)
}
