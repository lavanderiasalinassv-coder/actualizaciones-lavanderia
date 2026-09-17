<template>
  <ion-page class="force-light" :style="estiloLogin">
    <ion-content class="keypad-container" :scroll-y="false" :style="estiloLogin">
      <div v-if="cargando" class="loading-overlay">
        <div class="escena-lavado">
          <svg class="lavadora-animada" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <rect x="14" y="8" width="72" height="84" rx="14" fill="#0d2b4e" stroke="#a9d8ee" stroke-width="2"/>
            <line x1="14" y1="26" x2="86" y2="26" stroke="#a9d8ee" stroke-width="1.5" opacity="0.6"/>
            <circle cx="74" cy="17" r="2" fill="#a9d8ee"/>
            <circle cx="66" cy="17" r="2" fill="#a9d8ee"/>
            <circle class="drum-ring" cx="50" cy="58" r="26" fill="#cfe9f5" stroke="#a9d8ee" stroke-width="3"/>
            <clipPath id="drumClip">
              <circle cx="50" cy="58" r="21" />
            </clipPath>
            <g clip-path="url(#drumClip)">
              <rect class="agua agua-1" x="20" y="58" width="60" height="30" fill="#123a66"/>
              <rect class="agua agua-2" x="20" y="62" width="60" height="26" fill="#a9d8ee" opacity="0.75"/>
            </g>
          </svg>
          <div class="sombra-suelo"></div>
        </div>
        <p>
          <template v-if="comprobandoActualizaciones">Comprobando actualizaciones...</template>
          <template v-else>Espere por favor…<br />Estamos preparando su ciclo de lavado</template>
        </p>
      </div>

      <button
        class="btn-apagar-app"
        type="button"
        aria-label="Apagar aplicación"
        :disabled="cargando || cargando2FA"
        @click="apagarAplicacion"
      >
        <ion-icon :icon="powerOutline" />
      </button>

      <div class="desktop-layout">
        <section class="brand-side">
          <div class="brand-panel">
            <div class="brand-orb orb-one"></div>
            <div class="brand-orb orb-two"></div>

            <div class="logo-container">
              <img :src="logoActual" alt="Lavandería Salinas" class="logo" :class="{ 'logo-cargando': logoCargando }" @load="terminarCargaLogo" @error="usarLogoLocal" />
              <span v-if="logoCargando" class="logo-cargando-indicador" aria-label="Cargando logo"></span>
            </div>
            <div v-if="logoConexionError" class="logo-conexion-error">
              <ion-icon :icon="warningOutline" />
              <span>Revisa tu conexión a internet</span>
            </div>
          </div>
        </section>

        <section class="keypad-side">
          <div class="login-card">
            <div class="card-top-glow"></div>

            <div class="logo-container mobile-logo-wrap mobile-only">
              <img :src="logoActual" alt="Lavandería Salinas" class="logo mobile-logo" :class="{ 'logo-cargando': logoCargando }" @load="terminarCargaLogo" @error="usarLogoLocal" />
              <span v-if="logoCargando" class="logo-cargando-indicador" aria-label="Cargando logo"></span>
            </div>
            <div v-if="logoConexionError" class="logo-conexion-error">
              <ion-icon :icon="warningOutline" />
              <span>Revisa tu conexión a internet</span>
            </div>

            <div class="user-avatar-container desktop-only">
              <div class="avatar-shell">
                <ion-icon :icon="personCircleOutline" class="user-avatar" />
              </div>
              <span class="user-avatar-text">Ingrese PIN de acceso</span>
            </div>

            <div class="pad-relativo">
              <div class="display-shell">
                <div v-if="codigo.length > 0" class="display-container">
                <div class="display" :class="{ empty: codigo.length === 0 }">
                  <span
                    v-for="(char, index) in codigo"
                    :key="index"
                    class="dot"
                    :class="{ filled: !!char }"
                  ></span>
                </div>
              </div>
              </div>

              <ion-grid class="keypad-grid">
                <ion-row v-for="fila in teclas" :key="fila.join('-')">
                  <ion-col v-for="n in fila" :key="n" size="4" class="key-col">
                    <ion-button class="key" fill="clear" :disabled="cargando || mostrarModal2FA || mostrarModalRecuperacionPIN" @click="presionar(n)">
                      {{ n }}
                    </ion-button>
                  </ion-col>
                </ion-row>
                <ion-row>

                <ion-col size="4" class="key-col">

                  </ion-col>

                  <ion-col size="4" class="key-col">
                    <ion-button class="key" fill="clear" :disabled="cargando || mostrarModal2FA || mostrarModalRecuperacionPIN" @click="presionar('0')">
                      0
                    </ion-button>
                  </ion-col>

                  <ion-col size="4" class="key-col">
                    <ion-button class="borrar-btn" fill="clear" :disabled="cargando || mostrarModal2FA || mostrarModalRecuperacionPIN" @click="borrar">
                      <span class="delete-symbol">⌫</span>
                    </ion-button>
                  </ion-col>
                </ion-row>
              </ion-grid>

              <button
                class="olvide-pin-btn"
                type="button"
                :disabled="cargando || mostrarModal2FA || mostrarModalRecuperacionPIN || cargandoRecuperacion"
                @click="abrirModalRecuperacionPIN"
              >
                Olvidé mi PIN
              </button>
            </div>
          </div>
        </section>
      </div>

      <div class="system-time desktop-footer">
        {{ fechaHoraActual }}
      </div>
    </ion-content>

    <!-- Modal 2FA -->
    <ion-modal :is-open="mostrarModal2FA" class="modal-2fa" @didDismiss="cerrarModal2FA">
      <div class="modal-2fa-contenido force-light">
        <div class="modal-2fa-header">
          <div class="modal-2fa-icon">🔐</div>
          <div>
            <h3 class="modal-2fa-titulo">Verificación en dos pasos</h3>
            <p class="modal-2fa-subtitulo">
              Hemos enviado un código de 4 dígitos a {{ usuario2FA?.correo || 'tu correo' }}
            </p>
          </div>
        </div>

        <div class="modal-2fa-inputs">
          <label class="modal-2fa-label">Ingresa el código de 4 dígitos</label>
          <div class="modal-2fa-codigo-input">
            <input
              ref="input2FA"
              v-model="codigo2FA"
              type="text"
              maxlength="4"
              placeholder="0000"
              @input="formatearCodigo2FA"
              @keydown.enter="verificarCodigo2FA"
              @keydown="handleModalKeydown"
            />
          </div>
        </div>

        <div class="modal-2fa-botones">
          <button class="btn-outline-2fa" @click="cerrarModal2FA">Cancelar</button>
          <button
            class="btn-principal-2fa"
            :disabled="codigo2FA.length !== 4 || cargando2FA"
            @click="verificarCodigo2FA"
          >
            {{ cargando2FA ? 'Verificando...' : 'Verificar' }}
          </button>
        </div>

        <div class="modal-2fa-reenvio">
          <button
            class="btn-reenvio"
            :disabled="cargando2FA || tiempoReenvio > 0"
            @click="reenviarCodigo2FA"
          >
            {{ tiempoReenvio > 0 ? `Reenviar en ${tiempoReenvio}s` : 'Reenviar código' }}
          </button>
        </div>
      </div>
    </ion-modal>

    <!-- Modal Recuperación PIN -->
    <ion-modal :is-open="mostrarModalRecuperacionPIN" class="modal-recuperacion-pin" @didDismiss="cerrarModalRecuperacionPIN">
      <div class="modal-recuperacion-pin-contenido force-light">
        <div class="modal-recuperacion-pin-header">
          <div class="modal-recuperacion-pin-icon">🔑</div>
          <div>
            <h3 class="modal-recuperacion-pin-titulo">Iniciar Sesión Temporal</h3>
            <p class="modal-recuperacion-pin-subtitulo">
              Ingresa tu correo electrónico que registraste para tu pin, una vez ingreses
              puedes cambiar tu pin desde la sección de perfil.
            </p>
          </div>
        </div>

        <div class="modal-recuperacion-pin-inputs">
          <label class="modal-recuperacion-pin-label">Correo electrónico</label>
          <div class="modal-recuperacion-pin-email-input">
            <input
              v-model="correoRecuperacion"
              type="email"
              style="color: black;"
              placeholder="tu.correo@ejemplo.com"
              :disabled="cargandoRecuperacion || codigoEnviado"
              @keydown.enter="enviarCodigoRecuperacion"
              @keydown="handleModalRecuperacionKeydown"
            />
          </div>
        </div>

        <div v-if="codigoEnviado" class="modal-recuperacion-pin-inputs">
          <label class="modal-recuperacion-pin-label">Código temporal (expira en 1 minuto)</label>
          <div class="modal-recuperacion-pin-codigo-input">
            <input
              v-model="codigoRecuperacion"
              type="text"
              style="color: black;"
              maxlength="6"
              placeholder="000000"
              :disabled="cargandoRecuperacion"
              @input="formatearCodigoRecuperacion"
              @keydown.enter="verificarCodigoRecuperacion"
              @keydown="handleModalRecuperacionKeydown"
            />
          </div>
          <div class="modal-recuperacion-pin-tiempo">
            <span v-if="tiempoExpiracion > 0" class="tiempo-restante">
              ⏱️ Expira en {{ tiempoExpiracion }} segundos
            </span>
            <span v-else class="tiempo-expirado">
              ⏰ Código expirado
            </span>
          </div>
        </div>

        <div class="modal-recuperacion-pin-botones">
          <button class="btn-outline-recuperacion" @click="cerrarModalRecuperacionPIN">Cancelar</button>
          <button
            v-if="!codigoEnviado"
            class="btn-principal-recuperacion"
            :disabled="!correoRecuperacion || cargandoRecuperacion"
            @click="enviarCodigoRecuperacion"
          >
            {{ cargandoRecuperacion ? 'Enviando...' : 'Enviar código' }}
          </button>
          <button
            v-else
            class="btn-principal-recuperacion"
            :disabled="codigoRecuperacion.length !== 6 || cargandoRecuperacion || tiempoExpiracion <= 0"
            @click="verificarCodigoRecuperacion"
          >
            {{ cargandoRecuperacion ? 'Verificando...' : 'Verificar código' }}
          </button>
        </div>

        <div v-if="codigoEnviado && tiempoExpiracion > 0" class="modal-recuperacion-pin-reenvio">
          <button
            class="btn-reenvio-recuperacion"
            :disabled="cargandoRecuperacion || tiempoReenvioRecuperacion > 0"
            @click="reenviarCodigoRecuperacion"
          >
            {{ tiempoReenvioRecuperacion > 0 ? `Reenviar en ${tiempoReenvioRecuperacion}s` : 'Reenviar código' }}
          </button>
        </div>
      </div>
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonModal,
  IonIcon,
  toastController
} from '@ionic/vue'
import { computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { App as CapacitorApp } from '@capacitor/app'
import logo from '@/assets/logo.png'
import { personCircleOutline, fingerPrintOutline as iconoHuella, powerOutline, warningOutline } from 'ionicons/icons'
import { autenticarUsuarioEquipo } from '@/composables/useEquipo'
import { useSesion } from '@/composables/useSesion'
import { useApariencia } from '@/composables/useApariencia'
import { getApiBaseUrl } from '@/composables/useApiConfig'
import { guardarUsuarioConfiable, obtenerUsuarioConfiable, eliminarUsuarioConfiable } from '@/composables/use2FAConfiable'

const { apariencia, estiloLogin } = useApariencia()
const logoCloudinaryFallido = ref(false)
const logoCargando = ref(false)
const logoConexionError = ref(false)
const logoActual = computed(() => logoCloudinaryFallido.value ? logo : (apariencia.loginImagen || logo))
const terminarCargaLogo = () => {
  logoCargando.value = false
}
const usarLogoLocal = () => {
  if (apariencia.loginImagen && !logoCloudinaryFallido.value) {
    logoConexionError.value = true
  }
  logoCloudinaryFallido.value = true
  logoCargando.value = false
}

watch(() => apariencia.loginImagen, (imagen) => {
  logoCloudinaryFallido.value = false
  logoCargando.value = Boolean(imagen)
  logoConexionError.value = false
}, { immediate: true })

const fechaHoraActual = ref('')
let intervalId: any = null

const actualizarReloj = () => {
  const ahora = new Date()

  const formatoFecha = new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  const formatoHora = new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  })

  fechaHoraActual.value = `${formatoFecha.format(ahora)} — ${formatoHora.format(ahora).toUpperCase()}`
}

const handleKeydown = (e: KeyboardEvent) => {
  if (cargando.value) return
  // No capturar teclas si el modal 2FA está abierto
  if (mostrarModal2FA.value) return

  const key = e.key

  if (/^[0-9]$/.test(key)) {
    presionar(key)
  } else if (key === 'Backspace') {
    borrar()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  actualizarReloj()
  intervalId = setInterval(actualizarReloj, 1000)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  if (intervalId) clearInterval(intervalId)
})

const router = useRouter()
const { recargarSesion } = useSesion()

const codigo = ref('')
const cargando = ref(false)
const validando = ref(false)
const comprobandoActualizaciones = ref(false)

type ElectronAPIActualizaciones = {
  isElectron?: boolean
  buscarActualizaciones?: () => Promise<{
    supported?: boolean
    updateAvailable?: boolean
    version?: string
  }>
}

const comprobarActualizacionesAntesDeEntrar = async () => {
  const api = (window as Window & { electronAPI?: ElectronAPIActualizaciones }).electronAPI
  if (!api?.isElectron || !api.buscarActualizaciones) return

  comprobandoActualizaciones.value = true
  try {
    const resultado = await api.buscarActualizaciones()
    sessionStorage.setItem('actualizacion-verificada-en-sesion', '1')

    if (resultado?.updateAvailable) {
      sessionStorage.setItem('actualizacion-pendiente-al-entrar', JSON.stringify({ version: resultado.version || '' }))
      // Disparar evento para mostrar el modal de actualización inmediatamente
      window.dispatchEvent(new CustomEvent('mostrar-modal-actualizacion'))
    } else {
      sessionStorage.removeItem('actualizacion-pendiente-al-entrar')
    }
  } catch {
    // Un fallo de red no debe impedir que el usuario ingrese a la aplicación.
    sessionStorage.setItem('actualizacion-verificada-en-sesion', '1')
  } finally {
    comprobandoActualizaciones.value = false
  }
}

// Estado del 2FA
const mostrarModal2FA = ref(false)
const usuario2FA = ref<{ id: string; nombre: string; correo: string; rol: string } | null>(null)
const codigoAcceso2FA = ref('')
const codigo2FA = ref('')
const cargando2FA = ref(false)
const tiempoReenvio = ref(0)
const input2FA = ref<HTMLInputElement | null>(null)
let intervaloReenvio: any = null

// Estado de recuperación de PIN
const mostrarModalRecuperacionPIN = ref(false)
const correoRecuperacion = ref('')
const codigoRecuperacion = ref('')
const codigoEnviado = ref(false)
const cargandoRecuperacion = ref(false)
const tiempoExpiracion = ref(0)
const tiempoReenvioRecuperacion = ref(0)
let intervaloExpiracion: any = null
let intervaloReenvioRecuperacion: any = null

const esElectron = () => {
  const nav = typeof navigator !== 'undefined' ? navigator : null
  const userAgent = nav?.userAgent ?? ''
  const processElectron = (window as any)?.process?.versions?.electron
  return userAgent.includes('Electron') || Boolean(processElectron)
}

const apagarAplicacion = async () => {
  if (!esElectron()) {
    const toast = await toastController.create({
      message: 'El botón apagar solo está disponible en la app de escritorio.',
      duration: 2200,
      color: 'warning'
    })
    toast.present()
    return
  }

  try {
    await CapacitorApp.exitApp()
    return
  } catch {
  }

  window.close()
}

const teclas = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9']
]

const presionar = (n: string) => {
  if (!cargando.value && codigo.value.length < 6) {
    codigo.value += n
  }
}

const borrar = () => {
  if (!cargando.value) {
    codigo.value = codigo.value.slice(0, -1)
  }
}

watch(codigo, async (nuevo) => {
  if (nuevo.length !== 6) return
  if (validando.value) return

  validando.value = true
  cargando.value = true

  try {
    let usuario = null

    // 🔴 ACCESO DIRECTO DE DESARROLLADOR
    if (nuevo === '592647') {
      usuario = {
        id: 'dev-mode',
        nombre: 'Desarrollador',
        correo: 'dev@app.com',
        rol: 'Admin',
        codigo: '592647'
      }
    } else {
      // 1. ¿Hay confianza 2FA local vigente para este PIN?
      //    No golpea /equipo/auth, así que NO dispara el correo 2FA.
      const usuarioConfiable = await obtenerUsuarioConfiable(nuevo)

      if (usuarioConfiable) {
        try {
          const respuestaValidacion = await fetch(`${getApiBaseUrl()}/equipo/validar-confiable`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuarioId: usuarioConfiable.id })
          })

          if (respuestaValidacion.ok) {
            usuario = await respuestaValidacion.json()
          } else {
            eliminarUsuarioConfiable()
          }
        } catch {
          eliminarUsuarioConfiable()
        }
      }

      // 2. Solo si NO hay confianza vigente, autenticamos contra BD.
      //    Este es el único punto que genera y envía el código 2FA.
      if (!usuario) {
        const respuesta = await autenticarUsuarioEquipo(nuevo)

        if (!respuesta) {
          const toast = await toastController.create({
            message: 'Código incorrecto o usuario inactivo.',
            duration: 2000,
            color: 'danger'
          })
          toast.present()
          return
        }

        if (!respuesta.requiere2FA) {
          usuario = respuesta
        } else {
          usuario2FA.value = {
            id: respuesta.usuarioId ?? respuesta.id,
            nombre: respuesta.nombre,
            correo: respuesta.correo,
            rol: respuesta.rol
          }
          codigoAcceso2FA.value = nuevo
          mostrarModal2FA.value = true
          iniciarContadorReenvio()
          nextTick(() => {
            input2FA.value?.focus()
          })

          if (respuesta.errorEnvio) {
            const toast = await toastController.create({
              message: respuesta.errorEnvio,
              duration: 4000,
              color: 'warning'
            })
            toast.present()
          }
          return
        }
      }
    }

    if (!usuario) {
      const toast = await toastController.create({
        message: 'Código incorrecto o usuario inactivo.',
        duration: 2000,
        color: 'danger'
      })
      toast.present()
      return
    }

    localStorage.setItem('usuario', JSON.stringify({
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol,
      creadoEn: usuario.creadoEn ?? usuario.created_at,
      imagenPerfil: usuario.imagenPerfil,
      cambiosImagenPerfil: usuario.cambiosImagenPerfil
    }))
    localStorage.setItem('rol', usuario.rol)
    localStorage.setItem('codigo', usuario.codigo ?? nuevo)
    recargarSesion()

    const toast = await toastController.create({
      message: `¡Bienvenid@ ${usuario.nombre}!`,
      duration: 1200,
      color: 'success'
    })
    toast.present()

    await comprobarActualizacionesAntesDeEntrar()
    await router.replace('/tabs/principal')
  } catch (err: any) {
    const esErrorRed = err?.message?.includes('fetch') || err?.message?.includes('network')
    const esFueraDeHorario = err?.message?.startsWith('El acceso solo se habilita en horario programado')

    const mensajeFinal = esErrorRed
      ? 'No se pudo conectar con el servidor. Revisa tu conexión.'
      : err?.message ?? 'Ocurrió un error al iniciar sesión.'

    const toast = await toastController.create({
      message: mensajeFinal,
      duration: esFueraDeHorario ? 2800 : 2500,
      color: esFueraDeHorario ? 'warning' : 'danger'
    })
    toast.present()
  } finally {
    cargando.value = false
    validando.value = false
    codigo.value = ''
  }
})

const cerrarModal2FA = () => {
  mostrarModal2FA.value = false
  codigo2FA.value = ''
  codigoAcceso2FA.value = ''
  usuario2FA.value = null
  if (intervaloReenvio) {
    clearInterval(intervaloReenvio)
    intervaloReenvio = null
  }
  tiempoReenvio.value = 0
}

const formatearCodigo2FA = () => {
  codigo2FA.value = codigo2FA.value.replace(/\D/g, '').slice(0, 4)
}

const handleModalKeydown = (e: KeyboardEvent) => {
  // Prevenir que las teclas del modal afecten al keypad del login
  e.stopPropagation()
}

const handleModalRecuperacionKeydown = (e: KeyboardEvent) => {
  // Prevenir que las teclas del modal de recuperación afecten al keypad del login
  e.stopPropagation()
}

const verificarCodigo2FA = async () => {
  if (!usuario2FA.value || codigo2FA.value.length !== 4) return

  cargando2FA.value = true

  try {
    const datosEnvio = {
      usuarioId: usuario2FA.value.id,
      codigo: codigo2FA.value
    }
    const apiUrl = getApiBaseUrl()
    const fullUrl = `${apiUrl}/equipo/verificar-2fa`

    const respuesta = await fetch(fullUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datosEnvio)
    })

    if (!respuesta.ok) {
      const errorData = await respuesta.json().catch(() => {
        return { error: 'Error al verificar código (no se pudo leer la respuesta del servidor)' }
      })
      throw new Error(errorData.error || 'Código inválido')
    }

    const usuario = await respuesta.json()

    localStorage.setItem('usuario', JSON.stringify({
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol,
      creadoEn: usuario.creadoEn ?? usuario.created_at,
      imagenPerfil: usuario.imagenPerfil,
      cambiosImagenPerfil: usuario.cambiosImagenPerfil
    }))
    localStorage.setItem('rol', usuario.rol)
    localStorage.setItem('codigo', usuario.codigo)
    await guardarUsuarioConfiable(codigoAcceso2FA.value, usuario)
    recargarSesion()

    const toast = await toastController.create({
      message: `¡Bienvenid@ ${usuario.nombre}!`,
      duration: 1200,
      color: 'success'
    })
    toast.present()

    cerrarModal2FA()
    cargando.value = true
    await comprobarActualizacionesAntesDeEntrar()
    await router.replace('/tabs/principal')
  } catch (error: any) {
    const toast = await toastController.create({
      message: error.message || 'Código inválido. Intenta nuevamente.',
      duration: 2500,
      color: 'danger'
    })
    toast.present()
  } finally {
    cargando2FA.value = false
    cargando.value = false
  }
}

const reenviarCodigo2FA = async () => {
  if (!usuario2FA.value) return

  try {
    const respuesta = await fetch(`${getApiBaseUrl()}/auth2fa/enviar-codigo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usuarioId: usuario2FA.value.id,
        correo: usuario2FA.value.correo
      })
    })

    if (!respuesta.ok) {
      const error = await respuesta.json().catch(() => ({ error: 'No se pudo reenviar el código.' }))
      throw new Error(error.error || 'No se pudo reenviar el código.')
    }

    const toast = await toastController.create({
      message: 'Nuevo código enviado a tu correo.',
      duration: 2500,
      color: 'success'
    })
    toast.present()

    iniciarContadorReenvio()
  } catch (error) {
    const toast = await toastController.create({
      message: error instanceof Error ? error.message : 'Error al reenviar código. Intenta nuevamente.',
      duration: 2500,
      color: 'danger'
    })
    toast.present()
  }
}

const iniciarContadorReenvio = () => {
  tiempoReenvio.value = 60
  if (intervaloReenvio) clearInterval(intervaloReenvio)

  intervaloReenvio = setInterval(() => {
    tiempoReenvio.value--
    if (tiempoReenvio.value <= 0) {
      clearInterval(intervaloReenvio)
      intervaloReenvio = null
    }
  }, 1000)
}

// Funciones de recuperación de PIN
const abrirModalRecuperacionPIN = () => {
  mostrarModalRecuperacionPIN.value = true
  correoRecuperacion.value = ''
  codigoRecuperacion.value = ''
  codigoEnviado.value = false
  tiempoExpiracion.value = 0
  tiempoReenvioRecuperacion.value = 0
}

const cerrarModalRecuperacionPIN = () => {
  mostrarModalRecuperacionPIN.value = false
  correoRecuperacion.value = ''
  codigoRecuperacion.value = ''
  codigoEnviado.value = false
  tiempoExpiracion.value = 0
  tiempoReenvioRecuperacion.value = 0
  if (intervaloExpiracion) {
    clearInterval(intervaloExpiracion)
    intervaloExpiracion = null
  }
  if (intervaloReenvioRecuperacion) {
    clearInterval(intervaloReenvioRecuperacion)
    intervaloReenvioRecuperacion = null
  }
}

const formatearCodigoRecuperacion = () => {
  codigoRecuperacion.value = codigoRecuperacion.value.replace(/\D/g, '').slice(0, 6)
}

const iniciarContadorExpiracion = () => {
  tiempoExpiracion.value = 60
  if (intervaloExpiracion) clearInterval(intervaloExpiracion)

  intervaloExpiracion = setInterval(() => {
    tiempoExpiracion.value--
    if (tiempoExpiracion.value <= 0) {
      clearInterval(intervaloExpiracion)
      intervaloExpiracion = null
      codigoEnviado.value = false
    }
  }, 1000)
}

const iniciarContadorReenvioRecuperacion = () => {
  tiempoReenvioRecuperacion.value = 30
  if (intervaloReenvioRecuperacion) clearInterval(intervaloReenvioRecuperacion)

  intervaloReenvioRecuperacion = setInterval(() => {
    tiempoReenvioRecuperacion.value--
    if (tiempoReenvioRecuperacion.value <= 0) {
      clearInterval(intervaloReenvioRecuperacion)
      intervaloReenvioRecuperacion = null
    }
  }, 1000)
}

const enviarCodigoRecuperacion = async () => {
  if (!correoRecuperacion.value) return

  cargandoRecuperacion.value = true

  try {
    const respuesta = await fetch(`${getApiBaseUrl()}/equipo/recuperar-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: correoRecuperacion.value })
    })

    if (!respuesta.ok) {
      const error = await respuesta.json().catch(() => ({ error: 'No se pudo enviar el código.' }))
      throw new Error(error.error || 'No se pudo enviar el código.')
    }

    const resultado = await respuesta.json()

    if (resultado.error) {
      throw new Error(resultado.error)
    }

    codigoEnviado.value = true
    iniciarContadorExpiracion()
    iniciarContadorReenvioRecuperacion()

    const toast = await toastController.create({
      message: 'Código enviado a tu correo electrónico.',
      duration: 2500,
      color: 'success'
    })
    toast.present()
  } catch (error: any) {
    const toast = await toastController.create({
      message: error.message || 'Error al enviar código. Intenta nuevamente.',
      duration: 2500,
      color: 'danger'
    })
    toast.present()
  } finally {
    cargandoRecuperacion.value = false
  }
}

const verificarCodigoRecuperacion = async () => {
  if (codigoRecuperacion.value.length !== 6 || tiempoExpiracion.value <= 0) return

  cargandoRecuperacion.value = true

  try {
    const respuesta = await fetch(`${getApiBaseUrl()}/equipo/verificar-recuperacion-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        correo: correoRecuperacion.value,
        codigo: codigoRecuperacion.value
      })
    })

    if (!respuesta.ok) {
      const error = await respuesta.json().catch(() => ({ error: 'Código inválido.' }))
      throw new Error(error.error || 'Código inválido.')
    }

    const resultado = await respuesta.json()

    if (resultado.error) {
      throw new Error(resultado.error)
    }

    // El código es válido, ahora enviamos el 2FA y mostramos el PIN temporal
    if (resultado.usuario) {
      // Primero cerramos el modal de recuperación
      cerrarModalRecuperacionPIN()

      // Mostramos un toast con el PIN
      const toast = await toastController.create({
        message: `Tu PIN temporal es: ${resultado.pinTemporal}. Este código expirará en 1 minuto.`,
        duration: 60000,
        color: 'success',
        position: 'top'
      })
      toast.present()

      // Si el usuario requiere 2FA, también enviamos el código 2FA
      if (resultado.requiere2FA) {
        usuario2FA.value = {
          id: resultado.usuario.id,
          nombre: resultado.usuario.nombre,
          correo: resultado.usuario.correo,
          rol: resultado.usuario.rol
        }
        codigoAcceso2FA.value = resultado.pinTemporal
        mostrarModal2FA.value = true
        iniciarContadorReenvio()
        nextTick(() => {
          input2FA.value?.focus()
        })
      } else {
        // Si no requiere 2FA, preparamos el código y permitimos acceso
        codigo.value = resultado.pinTemporal
      }
    }
  } catch (error: any) {
    const toast = await toastController.create({
      message: error.message || 'Código inválido. Intenta nuevamente.',
      duration: 2500,
      color: 'danger'
    })
    toast.present()
  } finally {
    cargandoRecuperacion.value = false
  }
}

const reenviarCodigoRecuperacion = async () => {
  if (!correoRecuperacion.value) return

  try {
    const respuesta = await fetch(`${getApiBaseUrl()}/equipo/recuperar-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: correoRecuperacion.value })
    })

    if (!respuesta.ok) {
      const error = await respuesta.json().catch(() => ({ error: 'No se pudo reenviar el código.' }))
      throw new Error(error.error || 'No se pudo reenviar el código.')
    }

    codigoEnviado.value = true
    codigoRecuperacion.value = ''
    iniciarContadorExpiracion()
    iniciarContadorReenvioRecuperacion()

    const toast = await toastController.create({
      message: 'Nuevo código enviado a tu correo.',
      duration: 2500,
      color: 'success'
    })
    toast.present()
  } catch (error: any) {
    const toast = await toastController.create({
      message: error.message || 'Error al reenviar código. Intenta nuevamente.',
      duration: 2500,
      color: 'danger'
    })
    toast.present()
  }
}
</script>
<style scoped>
ion-content {
  --background:
    radial-gradient(circle at 8% 10%,  rgba(18, 58, 102, 0.20) 0%, transparent 30%),
    radial-gradient(circle at 92% 8%,  rgba(169, 216, 238, 0.18) 0%, transparent 25%),
    radial-gradient(circle at 50% 50%, rgba(207, 233, 245, 0.12) 0%, transparent 40%),
    radial-gradient(circle at 15% 80%, rgba(18, 58, 102, 0.14) 0%, transparent 28%),
    radial-gradient(circle at 85% 75%, rgba(169, 216, 238, 0.12) 0%, transparent 30%),
    linear-gradient(160deg, #f5f9fc 0%, #eef4f8 45%, #e7eff5 100%);
  color: #0a1f38;
}

.loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(8, 16, 28, 0.78);
  backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 35px;
  text-align: center;
}

.loading-overlay p {
  font-size: 18px;
  font-weight: 700;
  color: #a9d8ee;
  margin: 0;
}

.btn-apagar-app {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1100;
  width: 56px;
  height: 56px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: rgba(255, 255, 255, 0.72);
  cursor: pointer;
  transition: transform 0.15s ease, color 0.2s ease;
}

.btn-apagar-app:hover {
  color: rgba(255, 255, 255, 0.95);
  transform: translateY(-1px);
}

.btn-apagar-app:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
}

.btn-apagar-app ion-icon {
  font-size: 34px;
}

.escena-lavado {
  position: relative;
  width: 100px;
  height: 100px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.lavadora-animada {
  width: 92px;
  height: 92px;
  z-index: 2;
  animation: giroSuave 2.4s ease-in-out infinite;
  transform-origin: center center;
}

.drum-ring {
  animation: pulsoAro 2.4s ease-in-out infinite;
}

.agua {
  animation: chapoteo 1.6s ease-in-out infinite;
  transform-origin: center;
}
.agua-2 {
  animation-delay: -0.5s;
  animation-duration: 1.9s;
}

@keyframes giroSuave {
  0%   { transform: rotate(0deg); }
  50%  { transform: rotate(8deg); }
  100% { transform: rotate(0deg); }
}

@keyframes pulsoAro {
  0%, 100% { stroke-width: 3; }
  50%      { stroke-width: 1.5; }
}

@keyframes chapoteo {
  0%, 100% { transform: translateX(-4%) rotate(-3deg); }
  50%      { transform: translateX(4%) rotate(3deg); }
}

.sombra-suelo {
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  width: 70px;
  height: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 50%;
  z-index: 1;
  animation: sombraEscala 2.4s ease-in-out infinite;
}

@keyframes sombraEscala {
  0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.7; }
  50%      { transform: translateX(-50%) scale(0.85); opacity: 0.4; }
}

@keyframes popIn {
  from { transform: scale(0.5); opacity: 0; }
  to   { transform: scale(1); opacity: 1; }
}

.keypad-container {
  --background:
    radial-gradient(circle at 8% 10%,  rgba(169, 216, 238, 0.20) 0%, transparent 28%),
    radial-gradient(circle at 90% 6%,  rgba(207, 233, 245, 0.26) 0%, transparent 26%),
    radial-gradient(circle at 50% 52%, rgba(207, 233, 245, 0.14) 0%, transparent 38%),
    radial-gradient(circle at 12% 82%, rgba(169, 216, 238, 0.20) 0%, transparent 30%),
    radial-gradient(circle at 88% 78%, rgba(18, 58, 102, 0.18) 0%, transparent 26%),
    linear-gradient(160deg, var(--login-color) 0%, color-mix(in srgb, var(--login-color) 82%, #123a66) 100%) !important;
  background-image: none !important;
  background-size: cover;
  background-position: center;
  background-blend-mode: soft-light;
  min-height: 100%;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 16px;
  position: relative;
  overflow: hidden;
}

/* Orbes decorativos del fondo */
.keypad-container::before,
.keypad-container::after {
  content: '';
  position: absolute;
  border-radius: 999px;
  pointer-events: none;
}

.keypad-container::before {
  width: 220px;
  height: 220px;
  background: color-mix(in srgb, var(--orb-color-uno) 20%, transparent);
  top: -90px;
  right: -60px;
  filter: blur(4px);
}

.keypad-container::after {
  width: 180px;
  height: 180px;
  background: color-mix(in srgb, var(--orb-color-dos) 32%, transparent);
  bottom: -70px;
  left: -50px;
  filter: blur(8px);
}

/* ── Layout de dos columnas ── */
.desktop-layout {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 100%;
  gap: 18px;
  position: relative;
  z-index: 1;
}

.brand-side,
.keypad-side {
  width: 100%;
}

.brand-panel {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 24px;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.brand-orb {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.orb-one {
  width: 140px;
  height: 140px;
  right: -40px;
  top: -30px;
  background: color-mix(in srgb, var(--orb-color-uno) 16%, transparent);
}

.orb-two {
  width: 160px;
  height: 160px;
  left: -70px;
  bottom: -90px;
  background: color-mix(in srgb, var(--orb-color-dos) 14%, transparent);
}

.logo-container {
  position: relative;
  display: flex;
  justify-content: center;
  margin: 6px 0 10px;
}

.logo-cargando {
  opacity: 0.35;
}

.logo-cargando-indicador {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 28px;
  height: 28px;
  margin: -14px 0 0 -14px;
  border: 3px solid rgba(18, 58, 102, 0.2);
  border-top-color: #123a66;
  border-radius: 50%;
  animation: giroLogo 0.8s linear infinite;
}

.logo-conexion-error {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin: -4px auto 10px;
  color: #b45309;
  font-size: 0.78rem;
  font-weight: 700;
  text-align: center;
}

.logo-conexion-error ion-icon {
  flex-shrink: 0;
  font-size: 1.1rem;
}

@keyframes giroLogo {
  to { transform: rotate(360deg); }
}

.logo {
  width: 180px;
  max-width: 58vw;
  opacity: 0.98;
  filter: drop-shadow(0 16px 28px rgba(0, 0, 0, 0.35));
}

.mobile-logo-wrap {
  display: none;
}

.mobile-only {
  display: none;
}

.mobile-logo {
  width: 190px;
  max-width: 54vw;
  margin-bottom: 10px;
}

.brand-copy {
  text-align: center;
}

.eyebrow {
  display: inline-block;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(169, 216, 238, 0.12);
  margin-bottom: 14px;
  color: #a9d8ee;
}

.brand-copy h1 {
  margin: 0 0 10px;
  font-size: 2.2rem;
  line-height: 1.05;
  font-weight: 900;
  color: #f5f9fc;
}

.login-card {
  width: 100%;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 22px 18px 18px;
  position: relative;
}

.card-top-glow {
  display: none;
}

.keypad-side {
  display: flex;
  justify-content: center;
  align-items: center;
}

.user-avatar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
  text-align: center;
}

.avatar-shell {
  width: 92px;
  height: 92px;
  border-radius: 28px;
  display: grid;
  place-items: center;
  background: rgba(169, 216, 238, 0.10);
  border: 1px solid rgba(169, 216, 238, 0.20);
  margin-bottom: 12px;
}

.user-avatar {
  font-size: 64px;
  color: #a9d8ee;
}

.user-avatar-text {
  font-size: 1rem;
  color: #eaf4fa;
  font-weight: 800;
}

.pad-relativo {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 320px;
  margin: 0 auto;
}

.display-shell {
  min-height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.display-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 52px;
  margin-bottom: 18px;
  z-index: 5;
}

.display {
  display: flex;
  gap: 14px;
  padding: 14px 18px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.10);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.display.empty {
  opacity: 0.82;
}

.dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: transparent;
  border: 2px solid rgba(169, 216, 238, 0.35);
}

.dot.filled {
  background: #a9d8ee;
  border-color: #5c9dc2;
  animation: popIn 0.2s ease-out;
}

/* ── Keypad ── */
.keypad-grid {
  width: 100%;
  max-width: 320px;
  margin: 0 auto;
}

.key-col {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}

.key {
  width: 68px;
  height: 68px;
  border-radius: 22px;
  font-size: 22px;
  font-weight: 800;
  color: #cfe9f5;
  background: rgba(255, 255, 255, 0.05) !important;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.30), inset 0 1px 0 rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
}

.key:active {
  background: rgba(255, 255, 255, 0.10) !important;
  transform: scale(0.97);
}

.btn-huella,
.borrar-btn {
  width: 68px;
  height: 68px;
  border-radius: 22px;
}

.btn-huella {
  --background: rgba(169, 216, 238, 0.10) !important;
  --box-shadow: none !important;
  --color: #a9d8ee !important;
  --padding-start: 0 !important;
  --padding-end: 0 !important;
  --ripple-color: rgba(169, 216, 238, 0.24) !important;
  background: rgba(169, 216, 238, 0.10) !important;
  border: 1px solid rgba(169, 216, 238, 0.20) !important;
  color: #a9d8ee !important;
  font-size: 32px !important;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-huella ion-icon {
  font-size: 31px;
  color: inherit;
  opacity: 1;
}

.huella-icon {
  display: block;
  color: currentColor;
  font-size: 32px;
  min-width: 32px;
  min-height: 32px;
  visibility: visible;
}

.btn-huella:active,
.borrar-btn:active {
  opacity: 0.82;
  transform: scale(0.97);
}

.borrar-btn {
  background: rgba(148, 163, 184, 0.10);
  border: 1px solid rgba(148, 163, 184, 0.22);
  color: #c3ccd6;
  font-size: 20px;
  font-weight: 700;
}

.delete-symbol {
  line-height: 1;
}

/* ── Reloj ── */
.system-time {
  position: absolute;
  bottom: 25px;
  left: 0;
  right: 0;
  text-align: center;
  color: rgba(245, 249, 252, 0.55);
  font-weight: 800;
  font-size: 0.95rem;
}

/* ── Botón cerrar app ── */
.btn-cerrar-app {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 48px;
  height: 48px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #6d829c;
  cursor: pointer;
  z-index: 9999;
}

.btn-cerrar-app ion-icon {
  font-size: 32px;
}

/* ── Mobile ── */
@media (max-width: 991px) {
  .desktop-only,
  .desktop-footer {
    display: none !important;
  }
  .btn-apagar-app {
    display: none;
  }

  .keypad-container {
    --background:
      radial-gradient(circle at 8% 10%,  rgba(169, 216, 238, 0.20) 0%, transparent 28%),
      radial-gradient(circle at 90% 6%,  rgba(207, 233, 245, 0.26) 0%, transparent 26%),
      radial-gradient(circle at 50% 52%, rgba(207, 233, 245, 0.14) 0%, transparent 38%),
      radial-gradient(circle at 12% 82%, rgba(169, 216, 238, 0.20) 0%, transparent 30%),
      radial-gradient(circle at 88% 78%, rgba(18, 58, 102, 0.18) 0%, transparent 26%),
      linear-gradient(160deg, var(--login-color) 0%, color-mix(in srgb, var(--login-color) 82%, #123a66) 100%) !important;
    padding: 24px;
  }

  .desktop-layout {
    gap: 0;
    min-height: 100dvh;
    justify-content: center;
  }

  .brand-side {
    display: none;
  }

  .mobile-logo-wrap {
    display: flex;
    justify-content: center;
  }

  .mobile-only {
    display: flex;
  }

  .logo {
    width: 168px;
    max-width: 52vw;
  }

  .login-card {
    max-width: 360px;
    padding: 14px 12px 14px;
  }

  .keypad-side {
    width: 100%;
    max-width: 380px;
  }

  .display-container {
    margin-bottom: 14px;
  }

  .pad-relativo {
    max-width: 300px;
  }

  .display-shell {
    min-height: 68px;
  }
}

/* ── Desktop ── */
@media (min-width: 992px) {
  .keypad-container {
    --background:
      radial-gradient(circle at 10% 10%, rgba(169, 216, 238, 0.14) 0%, transparent 28%),
      radial-gradient(circle at 90% 90%, rgba(207, 233, 245, 0.10) 0%, transparent 22%),
      linear-gradient(180deg, var(--login-color) 0%, color-mix(in srgb, var(--login-color) 82%, #123a66) 100%) !important;
    padding: 24px;
  }

  .desktop-layout {
    flex-direction: row;
    height: 100vh;
    max-width: 1380px;
    margin: 0 auto;
    gap: 88px;
  }

  .brand-side,
  .keypad-side {
    flex: 1;
    max-width: none;
  }

  .mobile-only {
    display: none !important;
  }

  .brand-panel,
  .login-card {
    min-height: 760px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .logo-container {
    margin: 0 0 30px;
  }

  .logo {
    width: 470px;
    max-width: none;
    filter: drop-shadow(0 18px 32px rgba(0, 0, 0, 0.38));
  }

  .brand-copy {
    text-align: left;
  }

  .pad-relativo,
  .keypad-grid {
    max-width: 360px;
  }

  .key {
    width: 88px !important;
    height: 85px !important;
    border-radius: 24px !important;
    font-size: 28px !important;
  }
}

/* ── Modal 2FA ── */
.modal-2fa {
  --background: transparent;
  --backdrop-opacity: 0;
  --box-shadow: none;
  --height: auto;
  --width: auto;
}

.modal-2fa-contenido {
  background: linear-gradient(180deg, #f5f9fc 0%, #eef4f8 100%);
  border-radius: 24px;
  padding: 32px;
  max-width: 420px;
  margin: 16px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.35);
}

.modal-2fa-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 28px;
}

.modal-2fa-icon {
  font-size: 48px;
  line-height: 1;
}

.modal-2fa-titulo {
  margin: 0 0 8px;
  font-size: 1.5rem;
  font-weight: 800;
  color: #0a1f38;
}

.modal-2fa-subtitulo {
  margin: 0;
  font-size: 0.95rem;
  color: #6d829c;
  line-height: 1.5;
}

.modal-2fa-inputs {
  margin-bottom: 24px;
}

.modal-2fa-label {
  display: block;
  font-size: 0.9rem;
  font-weight: 700;
  color: #6d829c;
  margin-bottom: 12px;
}

.modal-2fa-codigo-input {
  display: flex;
  justify-content: center;
}

.modal-2fa-codigo-input input {
  width: 100%;
  max-width: 280px;
  padding: 16px 20px;
  font-size: 24px;
  font-weight: 800;
  text-align: center;
  letter-spacing: 0.5em;
  border: 2px solid #d1dbe5;
  border-radius: 16px;
  background: #ffffff;
  color: #0a1f38;
  outline: none;
  transition: all 0.2s ease;
}

.modal-2fa-codigo-input input:focus {
  border-color: #16a34a;
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.15);
}

.modal-2fa-codigo-input input::placeholder {
  letter-spacing: 0.2em;
  color: #cbd5e1;
}

.modal-2fa-botones {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.btn-outline-2fa,
.btn-principal-2fa {
  flex: 1;
  padding: 14px 20px;
  font-size: 1rem;
  font-weight: 700;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-outline-2fa {
  background: transparent;
  border: 2px solid #d1dbe5;
  color: #6d829c;
}

.btn-outline-2fa:hover {
  background: #f5f9fc;
  border-color: #a9d8ee;
}

.btn-principal-2fa {
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
}

.btn-principal-2fa:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(22, 163, 74, 0.4);
}

.btn-principal-2fa:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-2fa-reenvio {
  text-align: center;
}

.btn-reenvio {
  background: transparent;
  border: none;
  color: #6d829c;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.btn-reenvio:hover:not(:disabled) {
  background: #f5f9fc;
  color: #16a34a;
}

.btn-reenvio:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Estilos para recuperación de PIN */
.olvide-pin-btn {
  background: transparent;
  border: none;
  color: #4fb3e0;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 15px;
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.3s ease;
  text-decoration: underline;
}

.olvide-pin-btn:hover:not(:disabled) {
  color: #123a66;
  background: rgba(79, 179, 224, 0.1);
}

.olvide-pin-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-recuperacion-pin {
  --width: min(450px, 90vw);
  --height: auto;
  --border-radius: 16px;
}

.modal-recuperacion-pin-contenido {
  padding: 32px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.modal-recuperacion-pin-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.modal-recuperacion-pin-icon {
  font-size: 2.5rem;
  background: linear-gradient(135deg, #4fb3e0 0%, #123a66 100%);
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(79, 179, 224, 0.3);
}

.modal-recuperacion-pin-titulo {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #123a66;
}

.modal-recuperacion-pin-subtitulo {
  margin: 4px 0 0 0;
  font-size: 0.9rem;
  color: #6b7280;
}

.modal-recuperacion-pin-inputs {
  margin-bottom: 20px;
}

.modal-recuperacion-pin-label {
  display: block;
  margin-bottom: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #374151;
}

.modal-recuperacion-pin-email-input,
.modal-recuperacion-pin-codigo-input {
  width: 100%;
}

.modal-recuperacion-pin-email-input input,
.modal-recuperacion-pin-codigo-input input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: white;
}

.modal-recuperacion-pin-email-input input:focus,
.modal-recuperacion-pin-codigo-input input:focus {
  outline: none;
  border-color: #4fb3e0;
  box-shadow: 0 0 0 3px rgba(79, 179, 224, 0.1);
}

.modal-recuperacion-pin-email-input input:disabled,
.modal-recuperacion-pin-codigo-input input:disabled {
  background: #f3f4f6;
  cursor: not-allowed;
}

.modal-recuperacion-pin-tiempo {
  margin-top: 8px;
  font-size: 0.85rem;
}

.tiempo-restante {
  color: #059669;
  font-weight: 600;
}

.tiempo-expirado {
  color: #dc2626;
  font-weight: 600;
}

.modal-recuperacion-pin-botones {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.btn-outline-recuperacion {
  flex: 1;
  padding: 12px 20px;
  border: 2px solid #e5e7eb;
  background: white;
  color: #374151;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-outline-recuperacion:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.btn-principal-recuperacion {
  flex: 1;
  padding: 12px 20px;
  border: none;
  background: linear-gradient(135deg, #4fb3e0 0%, #123a66 100%);
  color: white;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(79, 179, 224, 0.3);
}

.btn-principal-recuperacion:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(79, 179, 224, 0.4);
}

.btn-principal-recuperacion:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.modal-recuperacion-pin-reenvio {
  margin-top: 16px;
  text-align: center;
}

.btn-reenvio-recuperacion {
  background: transparent;
  border: none;
  color: #4fb3e0;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.btn-reenvio-recuperacion:hover:not(:disabled) {
  background: rgba(79, 179, 224, 0.1);
  color: #123a66;
}

.btn-reenvio-recuperacion:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.force-light {
  --ion-background-color: transparent;
  --ion-text-color: #ffffff;
}
</style>
