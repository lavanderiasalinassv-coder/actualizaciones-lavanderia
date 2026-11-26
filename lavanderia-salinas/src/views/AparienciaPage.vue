<template>
  <AppShell>
    <main class="horarios-page workspace">
      <button class="volver-btn" type="button" title="Volver a configuración" @click="volver">
        <ion-icon :icon="arrowBackOutline" />
      </button>

      <header class="page-heading">
        <h1>Apariencia</h1>
      </header>

      <nav v-if="esAdministrador" class="appearance-tabs" role="tablist" aria-label="Secciones de apariencia">
        <button
          id="appearance-tab-principal"
          class="appearance-tab"
          :class="{ active: pestanaActiva === 'principal' }"
          type="button"
          role="tab"
          :aria-selected="pestanaActiva === 'principal'"
          aria-controls="appearance-panel"
          @click="pestanaActiva = 'principal'"
        >
          Tema principal
        </button>
        <button
          id="appearance-tab-sesion"
          class="appearance-tab"
          :class="{ active: pestanaActiva === 'sesion' }"
          type="button"
          role="tab"
          :aria-selected="pestanaActiva === 'sesion'"
          aria-controls="appearance-panel"
          @click="pestanaActiva = 'sesion'"
        >
          Pantalla de sesión
        </button>
      </nav>

      <div v-if="esAdministrador" id="appearance-panel" class="appearance-layout" role="tabpanel" :aria-labelledby="pestanaActiva === 'principal' ? 'appearance-tab-principal' : 'appearance-tab-sesion'">
        <section class="settings-panel apariencia-card">
          <div class="section-title">
            <span class="section-icon">🎨</span>
            <div>
              <h2>{{ pestanaActiva === 'principal' ? 'Tema principal' : 'Pantalla de sesión' }}</h2>
            </div>
          </div>

          <div class="apariencia-grid">
            <section v-if="pestanaActiva === 'principal'" class="apariencia-seccion">
            <strong class="apariencia-titulo">🎨 Color de página</strong>
            <div class="apariencia-campo apariencia-campo-color">
              <span>Color de página</span>
              <span class="apariencia-control">
                <input v-model="borrador.appShellColor" type="color" aria-label="Color de página" />
                <code>{{ borrador.appShellColor.toUpperCase() }}</code>
              </span>
              <fieldset class="color-presets">
                <legend>Colores sugeridos</legend>
                <div class="color-swatches">
                  <button v-for="color in coloresFondoSugeridos" :key="color.value" type="button" class="color-swatch" :class="{ selected: borrador.appShellColor.toUpperCase() === color.value }" :style="{ backgroundColor: color.value }" :aria-label="`Seleccionar ${color.name}`" :title="`${color.name} · ${color.value}`" @click="borrador.appShellColor = color.value">
                    <span v-if="borrador.appShellColor.toUpperCase() === color.value">✓</span>
                  </button>
                </div>
              </fieldset>
            </div>
            </section>

            <section v-if="pestanaActiva === 'principal'" class="apariencia-seccion">
            <strong class="apariencia-titulo">✨ Tema de la app</strong>
            <div class="apariencia-campo apariencia-campo-color">
              <span>Color del tema</span>
              <span class="apariencia-control">
                <input :value="borrador.appShellHeaderColor" type="color" aria-label="Color del tema de la aplicación" @input="cambiarColorMarca" />
                <code>{{ borrador.appShellHeaderColor.toUpperCase() }}</code>
              </span>
              <fieldset class="color-presets">
                <legend>Colores sugeridos</legend>
                <div class="color-swatches">
                  <button v-for="color in coloresSugeridos" :key="color.value" type="button" class="color-swatch" :class="{ selected: borrador.appShellHeaderColor.toUpperCase() === color.value }" :style="{ backgroundColor: color.value }" :aria-label="`Seleccionar ${color.name} como tema de la aplicación`" :title="`${color.name} · ${color.value}`" @click="seleccionarColorMarca(color.value)">
                    <span v-if="borrador.appShellHeaderColor.toUpperCase() === color.value">✓</span>
                  </button>
                </div>
              </fieldset>
            </div>
            </section>

          </div>
            <section v-if="esAdministrador" class="image-settings-panel" aria-label="Configuración de imagen">
              <div class="images-grid images-grid-single">
                <article v-if="pestanaActiva === 'principal'" class="image-option-card">
                  <header class="image-option-heading">
                    <span class="image-option-icon">🧺</span>
                    <div>
                      <h3>Logo</h3>
                    </div>
                  </header>
                  <figure class="image-preview">
                    <img :src="vistaPreviaImagen('appShellImagen')" alt="Vista previa de la imagen del Banner" />
                    <figcaption v-if="!vistasPreviaLocales.appShellImagen && !borrador.appShellImagen" class="image-preview-caption">Logo predeterminado</figcaption>
                  </figure>
                  <div class="image-option-actions">
                    <label class="btn-subir-apariencia" :class="{ cargando: subiendoImagen === 'appShellImagen' }">
                      {{ subiendoImagen === 'appShellImagen' ? 'Subiendo...' : 'Seleccionar imagen' }}
                      <input type="file" accept="image/*" hidden :disabled="guardando" @change="seleccionarImagen($event, 'appShellImagen')" />
                    </label>
                    <button type="button" class="url-toggle-button" :aria-expanded="mostrarUrlImagen.appShellImagen" aria-controls="appshell-image-url" @click="mostrarUrlImagen.appShellImagen = !mostrarUrlImagen.appShellImagen">
                      {{ mostrarUrlImagen.appShellImagen ? 'Ocultar URL' : 'Ingresar dirección URL' }}
                    </button>
                    <button v-if="borrador.appShellImagen" type="button" class="url-toggle-button remove-image-button" @click="restablecerCampo('appShellImagen')">Quitar imagen</button>
                  </div>
                  <div v-if="mostrarUrlImagen.appShellImagen" id="appshell-image-url" class="image-url-entry">
                    <input v-model="borrador.appShellImagen" type="url" aria-label="Dirección URL de imagen para Banner" placeholder="https://ejemplo.com/imagen.jpg" @input="descartarImagenLocal('appShellImagen')" />
                    <button type="button" @click="mostrarUrlImagen.appShellImagen = false">Listo</button>
                  </div>
                </article>

                <article v-else class="image-option-card">
                  <header class="image-option-heading">
                    <span class="image-option-icon login-image-icon">🔐</span>
                    <div>
                      <h3>Logo de la pantalla de sesión</h3>
                    </div>
                  </header>
                  <figure class="image-preview">
                    <img :src="vistaPreviaImagen('loginImagen')" alt="Vista previa del logo de la pantalla de sesión" />
                    <figcaption v-if="!vistasPreviaLocales.loginImagen && !borrador.loginImagen" class="image-preview-caption">Logo predeterminado</figcaption>
                  </figure>
                  <div class="image-option-actions">
                    <label class="btn-subir-apariencia" :class="{ cargando: subiendoImagen === 'loginImagen' }">
                      {{ subiendoImagen === 'loginImagen' ? 'Subiendo...' : 'Seleccionar imagen' }}
                      <input type="file" accept="image/*" hidden :disabled="guardando" @change="seleccionarImagen($event, 'loginImagen')" />
                    </label>
                    <button type="button" class="url-toggle-button" :aria-expanded="mostrarUrlImagen.loginImagen" aria-controls="login-image-url" @click="mostrarUrlImagen.loginImagen = !mostrarUrlImagen.loginImagen">
                      {{ mostrarUrlImagen.loginImagen ? 'Ocultar URL' : 'Ingresar dirección URL' }}
                    </button>
                    <button v-if="borrador.loginImagen" type="button" class="url-toggle-button remove-image-button" @click="restablecerCampo('loginImagen')">Quitar imagen</button>
                  </div>
                  <div v-if="mostrarUrlImagen.loginImagen" id="login-image-url" class="image-url-entry">
                    <input v-model="borrador.loginImagen" type="url" aria-label="Dirección URL del logo de la pantalla de sesión" placeholder="https://ejemplo.com/imagen.jpg" @input="descartarImagenLocal('loginImagen')" />
                    <button type="button" @click="mostrarUrlImagen.loginImagen = false">Listo</button>
                  </div>
                </article>
              </div>
            </section>
          <fieldset v-if="esAdministrador && pestanaActiva === 'principal'" class="font-field">
            <legend>Tipografía de la aplicación</legend>
            <small>Se sincroniza con los demás dispositivos al guardar.</small>
            <div class="font-list" role="radiogroup" aria-label="Tipografía de la aplicación">
              <button
                v-for="fuente in fuentesDisponibles"
                :key="fuente.value"
                type="button"
                class="font-option"
                :class="{ selected: borrador.fontFamily === fuente.value }"
                role="radio"
                :aria-checked="borrador.fontFamily === fuente.value"
                @click="borrador.fontFamily = fuente.value"
              >
                <span class="font-option-copy">
                  <b>{{ fuente.nombre }}</b>
                  <small v-if="fuente.descripcion">{{ fuente.descripcion }}</small>
                </span>
                <span class="font-sample" :style="{ '--preview-font-family': fuente.css }">Aa Bb 123</span>
              </button>
            </div>
          </fieldset>
          <fieldset v-if="esAdministrador && pestanaActiva === 'principal'" class="principal-layout-field">
            <legend>Organización del panel principal</legend>
            <small>Ordena los accesos rápidos y elige en qué lado aparecen las tareas.</small>
            <ol class="principal-access-order">
              <li v-for="(ruta, index) in borrador.principalAccesosOrden" :key="ruta" class="principal-access-order-item">
                <span class="navigation-order-number">{{ index + 1 }}</span>
                <b>{{ etiquetaAcceso(ruta) }}</b>
                <span class="navigation-order-actions">
                  <button type="button" :aria-label="`Mover ${etiquetaAcceso(ruta)} hacia arriba`" :disabled="guardando || index === 0" @click="moverAccesoPrincipal(index, -1)">
                    <ion-icon :icon="chevronUpOutline" />
                  </button>
                  <button type="button" :aria-label="`Mover ${etiquetaAcceso(ruta)} hacia abajo`" :disabled="guardando || index === borrador.principalAccesosOrden.length - 1" @click="moverAccesoPrincipal(index, 1)">
                    <ion-icon :icon="chevronDownOutline" />
                  </button>
                </span>
              </li>
            </ol>
            <div class="principal-panel-options" role="group" aria-label="Distribución de tareas y accesos rápidos">
              <button
                v-for="opcion in opcionesDistribucionPrincipal"
                :key="opcion.invertido ? 'tasks-left' : 'access-left'"
                type="button"
                class="principal-panel-option"
                :class="{ selected: borrador.principalPanelesInvertidos === opcion.invertido }"
                :aria-pressed="borrador.principalPanelesInvertidos === opcion.invertido"
                :style="{ '--app-shell-header-color': borrador.appShellHeaderColor }"
                @click="borrador.principalPanelesInvertidos = opcion.invertido"
              >
                <span
                  class="principal-panel-preview"
                  :class="{ 'principal-panel-preview-swapped': opcion.invertido }"
                  aria-hidden="true"
                >
                  <i class="principal-panel-preview-access"></i>
                  <i class="principal-panel-preview-tasks"></i>
                </span>
                <span class="principal-panel-option-copy">
                  <b>{{ opcion.nombre }}</b>
                  <small>{{ opcion.descripcion }}</small>
                </span>
              </button>
            </div>
          </fieldset>
          <fieldset v-if="esAdministrador && pestanaActiva === 'principal'" class="app-shell-layout-field">
            <legend>Diseño del AppShell</legend>
            <small>Se guarda solo en este dispositivo. Elige una barra superior o una navegación lateral.</small>
            <div class="app-shell-layout-options" role="group" aria-label="Diseño del AppShell">
              <button
                v-for="opcion in opcionesDisenoAppShell"
                :key="opcion.value"
                type="button"
                class="app-shell-layout-option"
                :class="{ selected: borrador.appShellLayout === opcion.value }"
                :aria-pressed="borrador.appShellLayout === opcion.value"
                @click="borrador.appShellLayout = opcion.value"
              >
                <span class="app-shell-layout-preview" :class="`layout-preview-${opcion.value}`"><i></i><i></i></span>
                <b>{{ opcion.label }}</b>
              </button>
            </div>
          </fieldset>
          <fieldset v-if="esAdministrador && pestanaActiva === 'principal'" class="app-shell-layout-field">
            <legend>Posición del icono de Sali AI</legend>
            <small>Elige en qué lado aparece el acceso flotante de Burbujita. Esta preferencia se sincroniza con la base de datos.</small>
            <div class="sali-assistant-position-options" role="group" aria-label="Posición del icono de Sali AI">
              <button
                v-for="opcion in opcionesPosicionSaliAssistant"
                :key="opcion.value"
                type="button"
                class="sali-assistant-position-option"
                :class="{ selected: borrador.saliAssistantPosition === opcion.value }"
                :aria-pressed="borrador.saliAssistantPosition === opcion.value"
                :style="{ '--app-shell-header-color': borrador.appShellHeaderColor }"
                @click="borrador.saliAssistantPosition = opcion.value"
              >
                <span class="sali-assistant-position-preview" :class="`sali-position-preview-${opcion.value}`" aria-hidden="true">
                  <i>🫧</i>
                </span>
                <b>{{ opcion.nombre }}</b>
              </button>
            </div>
          </fieldset>
          <fieldset v-if="esAdministrador && pestanaActiva === 'sesion'" class="login-theme-field">
            <legend>Tema visual del login</legend>
            <small>Selecciona el estilo visual de la pantalla de sesión. Se sincroniza con la base de datos.</small>
            <div class="login-theme-options" role="group" aria-label="Tema visual del login">
              <button
                v-for="tema in temasLogin"
                :key="tema.value"
                type="button"
                class="login-theme-option"
                :class="{ selected: borrador.loginTheme === tema.value }"
                :aria-pressed="borrador.loginTheme === tema.value"
                :style="{
                  '--app-shell-header-color': borrador.appShellHeaderColor,
                  '--login-preview-accent': borrador.appShellHeaderColor
                }"
                @click="borrador.loginTheme = tema.value"
              >
                <span class="login-theme-preview" :class="`login-theme-preview-${tema.value}`" aria-hidden="true">
                  <i class="login-theme-brand"></i>
                  <i class="login-theme-content"></i>
                </span>
                <span class="login-layout-option-copy">
                  <b>{{ tema.nombre }}</b>
                  <small>{{ tema.descripcion }}</small>
                </span>
              </button>
            </div>
          </fieldset>
          <fieldset v-if="esAdministrador && pestanaActiva === 'sesion'" class="login-layout-field">
            <legend>Posición del keypad</legend>
            <small>Elige en qué lado aparece el keypad. Esta preferencia se sincroniza con la base de datos.</small>
            <div class="login-layout-options" role="group" aria-label="Posición del keypad">
              <button
                v-for="opcion in opcionesDisenoLogin"
                :key="opcion.value"
                type="button"
                class="login-layout-option"
                :class="{ selected: borrador.loginLayout === opcion.value }"
                :aria-pressed="borrador.loginLayout === opcion.value"
                :style="{ '--app-shell-header-color': borrador.appShellHeaderColor }"
                @click="borrador.loginLayout = opcion.value"
              >
                <span class="login-layout-option-preview" :class="`login-layout-preview-${opcion.value}`" aria-hidden="true">
                  <i class="login-layout-mark"></i>
                  <i class="login-layout-form"></i>
                </span>
                <span class="login-layout-option-copy">
                  <b>{{ opcion.nombre }}</b>
                  <small>{{ opcion.descripcion }}</small>
                </span>
              </button>
            </div>
          </fieldset>
        </section>
        <aside class="preview-panel" aria-label="Vista previa de la apariencia">
          <span class="preview-label">{{ pestanaActiva === 'principal' ? 'VISTA PREVIA DEL TEMA PRINCIPAL' : 'VISTA PREVIA DE LA PANTALLA DE SESIÓN' }}</span>
          <div v-if="pestanaActiva === 'principal'" class="apariencia-preview" :class="`apariencia-preview-${borrador.appShellLayout}`" :style="{ '--preview-font-family': fuenteSeleccionada.css }">
            <aside v-if="borrador.appShellLayout !== 'top'" class="preview-app-sidebar" :style="{ backgroundColor: borrador.appShellHeaderColor }">
              <div class="preview-sidebar-user">
                <ion-icon :icon="personCircleOutline" />
                <small>Bienvenido</small>
                <b>Usuario</b>
              </div>
              <div class="preview-sidebar-tools" aria-label="Herramientas">
                <small>Herramientas</small>
                <span>Notifs</span>
                <span>WA</span>
                <span>FB</span>
                <span>Web</span>
              </div>
              <div class="preview-sidebar-actions" aria-label="Acciones rápidas">
                <small>Acciones</small>
                <span>Depósito</span>
                <span>Gasto</span>
                <span>Reiniciar</span>
                <span>Cierres</span>
              </div>
              <nav class="preview-sidebar-nav" aria-label="Accesos principales">
                <span>Inicio</span>
                <span v-for="ruta in borrador.principalAccesosOrden" :key="ruta">{{ etiquetaAcceso(ruta) }}</span>
              </nav>
              <div class="preview-sidebar-footer">
                <span class="preview-sidebar-logout">Cerrar sesión</span>
              </div>
            </aside>
            <div class="preview-shell-content">
            <div v-if="borrador.appShellLayout === 'top'" class="preview-banner" :style="{ backgroundColor: borrador.appShellHeaderColor }">
              <div class="preview-banner-top">
                <span class="preview-home-link"><ion-icon :icon="homeOutline" /> Home</span>
                <span class="preview-breadcrumb">Principal</span>
                <ion-icon class="preview-profile" :icon="personOutline" />
              </div>
              <div class="preview-banner-main">
                <div class="preview-banner-center">
                  <img :src="vistaPreviaImagen('appShellImagen')" alt="" />
                  <div>
                    <small>Lavandería Salinas</small>
                    <strong>10:30</strong>
                    <span>¡Bienvenido!</span>
                  </div>
                </div>
                <div class="preview-banner-actions">
                  <span><ion-icon :icon="cashOutline" /> Depósito</span>
                  <span><ion-icon :icon="addOutline" /> Gasto</span>
                  <span><ion-icon :icon="refreshOutline" /> Reiniciar</span>
                  <span><ion-icon :icon="lockClosedOutline" /> Cierres</span>
                  <span><ion-icon :icon="logOutOutline" /> Salir</span>
                </div>
              </div>
            </div>
            <div
              class="preview-home"
              :style="{ backgroundColor: borrador.appShellColor }"
            >
              <div v-if="borrador.appShellLayout === 'top'" class="preview-home-grid" :class="{ 'preview-home-grid-swapped': borrador.principalPanelesInvertidos }">
                <section class="preview-shortcuts">
                  <div class="preview-shortcut-grid">
                    <span
                      v-for="opcion in opcionesVistaPrevia"
                      :key="opcion.nombre"
                      class="preview-shortcut"
                      :class="[`preview-shortcut-${opcion.color}`, { 'preview-shortcut-featured': opcion.destacada }]"
                      :style="opcion.destacada ? { backgroundColor: borrador.appShellHeaderColor } : undefined"
                    >
                      <span class="preview-shortcut-icon">
                        <ion-icon :icon="opcion.icono" />
                        <b v-if="opcion.notificacion">{{ opcion.notificacion }}</b>
                      </span>
                      <small>{{ opcion.nombre }}</small>
                    </span>
                  </div>
                </section>
                <section class="preview-tasks">
                  <header>
                    <strong><ion-icon :icon="createOutline" /> tareas</strong>
                    <button type="button"><ion-icon :icon="checkmarkCircleOutline" /> Administrar tareas</button>
                  </header>
                  <div class="preview-tasks-empty">
                    <ion-icon :icon="listOutline" />
                    <strong>No hay tareas para mostrar</strong>
                  </div>
                </section>
              </div>
              <section v-else class="preview-sidebar-welcome">
                <div class="preview-sidebar-welcome-logo">
                  <img :src="vistaPreviaImagen('appShellImagen')" alt="" />
                </div>
                <div class="preview-sidebar-welcome-copy">
                  <small>25 nov</small>
                  <strong>10:30</strong>
                  <span>Buenos días,</span>
                  <b>Usuario</b>
                  <em>Bienvenido a Lavandería Salinas</em>
                </div>
              </section>
            </div>
          </div>
          </div>
          <span v-if="pestanaActiva === 'principal'" class="preview-label">VISTA PREVIA DE LA PANTALLA DE SESIÓN</span>
          <div
            class="login-preview"
            :class="[
              `login-preview-${borrador.loginLayout}`,
              `login-preview-theme-${borrador.loginTheme}`
            ]"
            :style="{
              '--preview-login-color': borrador.appShellHeaderColor,
              '--login-preview-accent': borrador.appShellHeaderColor,
              '--preview-font-family': fuenteSeleccionada.css
            }"
          >
            <div class="login-preview-layout">
              <div class="login-preview-brand">
                <img :src="vistaPreviaImagen('loginImagen')" alt="" />
                <div class="login-preview-market-copy">
                  <small>CUIDADO PARA CADA PRENDA</small>
                  <b>Tu ropa,<br />en buenas manos.</b>
                  <span>Frescura que se nota.</span>
                </div>
                <span class="login-preview-market-art" aria-hidden="true">🫧</span>
              </div>
              <div class="login-preview-card">
                <img class="login-preview-card-logo" :src="vistaPreviaImagen('loginImagen')" alt="" />
                <div class="login-preview-market-lockup">
                  <img :src="vistaPreviaImagen('loginImagen')" alt="" />
                  <span><b>Lavandería Salinas</b><small>25 nov · 10:30 a. m.</small></span>
                </div>
                <div class="login-preview-market-welcome">
                  <b>Bienvenido<br />de vuelta.</b>
                  <small>Ingresa tu PIN para continuar</small>
                </div>
                <div class="login-preview-avatar">
                  <ion-icon :icon="personCircleOutline" />
                  <span>Ingrese PIN de acceso</span>
                </div>
                <div class="login-preview-dots" aria-hidden="true">
                  <i v-for="n in 6" :key="n"></i>
                </div>
                <div class="login-preview-keypad" aria-hidden="true">
                  <span v-for="n in 9" :key="n">{{ n }}</span>
                  <span class="login-preview-empty"></span>
                  <span class="login-preview-zero">0</span>
                  <span class="login-preview-delete">⌫</span>
                </div>
                <span class="login-preview-forgot">Olvidé mi PIN</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <div v-else class="appearance-layout appearance-layout-single">
        <section class="settings-panel acceso-restringido">
          <strong>Acceso restringido</strong>
        </section>
      </div>

      <div class="acciones-apariencia">
        <span v-if="mensaje" class="mensaje-apariencia" :class="{ error: esError }">{{ mensaje }}</span>
        <div v-if="esAdministrador" class="appearance-action-buttons">
          <button type="button" class="btn-restablecer-todo" :disabled="guardando" @click="restablecerTodo">
            <ion-icon :icon="refreshOutline" />
            Restablecer
          </button>
          <button type="button" class="btn-restablecer-todo" :disabled="guardando" @click="recargarVista">
            <ion-icon :icon="reloadOutline" />
            Recargar
          </button>
          <ion-button
            class="btn-guardar-apariencia"
            :style="{
              '--background': borrador.appShellHeaderColor,
              '--background-hover': `color-mix(in srgb, ${borrador.appShellHeaderColor} 84%, black)`,
              '--color': colorTextoTema(borrador.appShellHeaderColor)
            }"
            :disabled="guardando"
            @click="guardarCambios"
          >
            <ion-icon slot="start" :icon="saveOutline" />
            {{ guardando ? 'Guardando...' : 'Guardar' }}
          </ion-button>
        </div>
      </div>
    </main>
  </AppShell>
</template>

<script setup lang="ts">
import { IonIcon, onIonViewWillEnter } from '@ionic/vue'
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import logoPredeterminado from '@/assets/logo.png'
import { useSesion } from '@/composables/useSesion'
import { aparienciaPredeterminada, type AparienciaConfig, useApariencia } from '@/composables/useApariencia'
import { OPCIONES_ACCESO_PRINCIPAL, type RutaPrincipalAcceso } from '@/data/opcionesAccesoPrincipal'
import { getApiBaseUrl } from '@/composables/useApiConfig'
import {
  addOutline,
  alertCircleOutline,
  arrowBackOutline,
  barChartOutline,
  calendarOutline,
  calendarClearOutline,
  cashOutline,
  cartOutline,
  checkmarkCircleOutline,
  chevronDownOutline,
  chevronUpOutline,
  closeOutline,
  createOutline,
  cubeOutline,
  documentTextOutline,
  homeOutline,
  logInOutline,
  lockClosedOutline,
  listOutline,
  logOutOutline,
  peopleOutline,
  personOutline,
  personCircleOutline,
  pricetagOutline,
  receiptOutline,
  reloadOutline,
  refreshOutline,
  saveOutline,
  settingsOutline,
  shirtOutline,
  timeOutline,
} from 'ionicons/icons'

/* ───────────── Sesión real (viene del login por PIN) ───────────── */
const router = useRouter()
const { usuarioActual, esAdministrador } = useSesion()
const { apariencia, cargarApariencia, guardarApariencia: guardarAparienciaServidor } = useApariencia()
const borrador = reactive<AparienciaConfig>({ ...aparienciaPredeterminada })
type CampoImagen = 'appShellImagen' | 'loginImagen'
const imagenesLocalesPendientes = reactive<Record<CampoImagen, File | null>>({
  appShellImagen: null,
  loginImagen: null
})
const vistasPreviaLocales = reactive<Record<CampoImagen, string>>({
  appShellImagen: '',
  loginImagen: ''
})
const pestanaActiva = ref<'principal' | 'sesion'>('principal')
const mostrarUrlImagen = reactive({ appShellImagen: false, loginImagen: false })
const subiendoImagen = ref<CampoImagen | null>(null)
const guardando = ref(false)
const mensaje = ref('')
const esError = ref(false)
const coloresSugeridos = [
  { name: 'Azul noche', value: '#072346' },
  { name: 'Azul océano', value: '#2563EB' },
  { name: 'Azul real', value: '#1D4ED8' },
  { name: 'Verde jade', value: '#0F766E' },
  { name: 'Turquesa profundo', value: '#0E7490' },
  { name: 'Lavanda', value: '#6D4EB5' },
  { name: 'Púrpura', value: '#7C3AED' },
  { name: 'Frambuesa', value: '#B33465' },
  { name: 'Vino', value: '#7F1D3A' },
  { name: 'Coral', value: '#B84D36' },
  { name: 'Terracota', value: '#9A3412' },
  { name: 'Dorado', value: '#9C6715' },
  { name: 'Verde salvia', value: '#35714B' },
  { name: 'Verde bosque', value: '#166534' },
  { name: 'Grafito', value: '#40536B' },
  { name: 'Carbón', value: '#263445' },
]
const coloresFondoSugeridos = [
  { name: 'Nube', value: '#F3F6FA' },
  { name: 'Azul bruma', value: '#EAF2FA' },
  { name: 'Menta suave', value: '#EAF5F0' },
  { name: 'Lavanda suave', value: '#F1EDFA' },
  { name: 'Rosa pétalo', value: '#F9EEF2' },
  { name: 'Arena', value: '#F7F1E8' },
  { name: 'Gris perla', value: '#EBEFF3' },
  { name: 'Turquesa suave', value: '#E8F5F4' },
]
const fuentesDisponibles: Array<{
  value: AparienciaConfig['fontFamily']
  nombre: string
  descripcion?: string
  css: string
}> = [
  { value: 'system', nombre: 'Sistema móvil', descripcion: 'Predeterminada', css: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
  { value: 'segoe', nombre: 'Segoe UI', css: "'Segoe UI', Tahoma, sans-serif" },
  { value: 'arial', nombre: 'Arial', css: 'Arial, Helvetica, sans-serif' },
  { value: 'verdana', nombre: 'Verdana', css: 'Verdana, Geneva, sans-serif' },
  { value: 'tahoma', nombre: 'Tahoma', css: "Tahoma, 'Segoe UI', sans-serif" },
  { value: 'trebuchet', nombre: 'Trebuchet MS', css: "'Trebuchet MS', sans-serif" },
  { value: 'calibri', nombre: 'Calibri', css: 'Calibri, sans-serif' },
  { value: 'candara', nombre: 'Candara', css: 'Candara, sans-serif' },
  { value: 'gill-sans', nombre: 'Gill Sans', css: "'Gill Sans', 'Gill Sans MT', sans-serif" },
  { value: 'lucida-sans', nombre: 'Lucida Sans', css: "'Lucida Sans Unicode', 'Lucida Grande', sans-serif" },
  { value: 'century-gothic', nombre: 'Century Gothic', css: "'Century Gothic', sans-serif" },
  { value: 'georgia', nombre: 'Georgia', css: "Georgia, 'Times New Roman', serif" },
  { value: 'cambria', nombre: 'Cambria', css: 'Cambria, Georgia, serif' },
  { value: 'palatino', nombre: 'Palatino', css: "'Palatino Linotype', Palatino, serif" },
  { value: 'times', nombre: 'Times New Roman', css: "'Times New Roman', Times, serif" },
  { value: 'courier', nombre: 'Courier New', css: "'Courier New', monospace" },
  { value: 'comic-sans', nombre: 'Comic Sans MS', css: "'Comic Sans MS', 'Comic Sans', cursive" },
  { value: 'segoe-script', nombre: 'Segoe Script', css: "'Segoe Script', 'Apple Chancery', cursive" },
  { value: 'segoe-print', nombre: 'Segoe Print', css: "'Segoe Print', 'Bradley Hand', cursive" },
  { value: 'lucida-handwriting', nombre: 'Lucida Handwriting', css: "'Lucida Handwriting', 'Brush Script MT', cursive" },
  { value: 'mobile-cursive', nombre: 'Cursiva móvil', css: "'Snell Roundhand', 'Segoe Script', 'Apple Chancery', cursive" },
]
const clasesColorVistaPrevia: Record<RutaPrincipalAcceso, string> = {
  '/tabs/home': 'venta',
  '/tabs/ordenes': 'ordenes',
  '/tabs/reportes': 'reportes',
  '/tabs/calendario': 'calendario',
  '/tabs/clientes': 'clientes',
  '/tabs/productos': 'catalogo',
  '/tabs/inventario': 'inventario',
  '/tabs/promociones': 'promociones',
  '/tabs/facturas': 'facturas',
  '/tabs/equipo': 'usuarios',
  '/tabs/horarios': 'horarios',
  '/tabs/configuracion': 'configuracion',
}
const opcionesVistaPrevia = computed(() => {
  const orden = new Map(borrador.principalAccesosOrden.map((ruta, index) => [ruta, index]))
  return OPCIONES_ACCESO_PRINCIPAL
    .map((opcion) => ({
      ruta: opcion.route,
      nombre: opcion.label,
      icono: opcion.icon,
      color: clasesColorVistaPrevia[opcion.route],
      destacada: opcion.destacado,
      notificacion: opcion.route === '/tabs/ordenes' ? '8' : undefined,
    }))
    .sort((a, b) => (orden.get(a.ruta) ?? Number.MAX_SAFE_INTEGER) - (orden.get(b.ruta) ?? Number.MAX_SAFE_INTEGER))
})
const opcionesDistribucionPrincipal: Array<{
    invertido: boolean
    nombre: string
    descripcion: string
}> = [
    { invertido: false, nombre: 'Accesos a la izquierda', descripcion: 'Tareas a la derecha.' },
    { invertido: true, nombre: 'Tareas a la izquierda', descripcion: 'Accesos a la derecha.' },
]
const opcionesDisenoAppShell: Array<{
  value: AparienciaConfig['appShellLayout']
  label: string
}> = [
  { value: 'top', label: 'Barra superior' },
  { value: 'sidebar-left', label: 'Lateral izquierda' },
  { value: 'sidebar-right', label: 'Lateral derecha' },
]
const opcionesDisenoLogin: Array<{
  value: AparienciaConfig['loginLayout']
  nombre: string
  descripcion: string
}> = [
  { value: 'classic', nombre: 'Keypad a la derecha', descripcion: 'Keypad a la derecha y marca a la izquierda.' },
  { value: 'reverse', nombre: 'Keypad a la izquierda', descripcion: 'Keypad a la izquierda y marca a la derecha.' },
]
const opcionesPosicionSaliAssistant: Array<{
  value: AparienciaConfig['saliAssistantPosition']
  nombre: string
}> = [
  { value: 'left', nombre: 'Izquierda' },
  { value: 'right', nombre: 'Derecha' },
]
const temasLogin: Array<{
  value: Exclude<AparienciaConfig['loginTheme'], 'minimal'>
  nombre: string
  descripcion: string
}> = [
  { value: 'market', nombre: 'Marca editorial', descripcion: 'Panel gráfico y acceso claro, como la referencia.' },
  { value: 'nocturne', nombre: 'Oscuro original', descripcion: 'Mantiene el diseño de inicio de sesión anterior.' },
  { value: 'linen', nombre: 'Tarjeta suave', descripcion: 'Superficies claras y acceso enmarcado.' },
  { value: 'aurora', nombre: 'Aurora', descripcion: 'Degradado luminoso y controles flotantes.' },
]
const fuenteSeleccionada = computed(
  () => fuentesDisponibles.find((fuente) => fuente.value === borrador.fontFamily) ?? fuentesDisponibles[0]
)

const volver = () => void router.replace('/tabs/configuracion')

const etiquetaAcceso = (ruta: RutaPrincipalAcceso) =>
  OPCIONES_ACCESO_PRINCIPAL.find((opcion) => opcion.route === ruta)?.label ?? ruta

const moverAccesoPrincipal = (index: number, desplazamiento: -1 | 1) => {
  const destino = index + desplazamiento
  if (destino < 0 || destino >= borrador.principalAccesosOrden.length) return
  const rutas = [...borrador.principalAccesosOrden]
  const rutaActual = rutas[index]
  rutas[index] = rutas[destino]
  rutas[destino] = rutaActual
  borrador.principalAccesosOrden = rutas
}

const seleccionarColorMarca = (color: string) => {
  borrador.appShellHeaderColor = color
  borrador.loginColor = color
}

const cambiarColorMarca = (event: Event) => {
  const input = event.target as HTMLInputElement
  seleccionarColorMarca(input.value)
}

const vistaPreviaImagen = (campo: CampoImagen) =>
  vistasPreviaLocales[campo] || borrador[campo] || logoPredeterminado

const limpiarImagenLocalPendiente = (campo: CampoImagen) => {
  if (vistasPreviaLocales[campo]) URL.revokeObjectURL(vistasPreviaLocales[campo])
  vistasPreviaLocales[campo] = ''
  imagenesLocalesPendientes[campo] = null
}

const descartarImagenLocal = (campo: CampoImagen) => {
  if (!imagenesLocalesPendientes[campo]) return
  limpiarImagenLocalPendiente(campo)
}

onIonViewWillEnter(async () => {
  await cargarApariencia(true)
  Object.assign(borrador, apariencia)
  seleccionarColorMarca(borrador.appShellHeaderColor)
})

const restablecerTodo = () => {
  limpiarImagenLocalPendiente('appShellImagen')
  limpiarImagenLocalPendiente('loginImagen')
  Object.assign(borrador, aparienciaPredeterminada)
  seleccionarColorMarca(aparienciaPredeterminada.appShellHeaderColor)
  mostrarUrlImagen.appShellImagen = false
  mostrarUrlImagen.loginImagen = false
  mensaje.value = ''
  esError.value = false
}

const recargarVista = () => {
  const hayCambiosSinGuardar = JSON.stringify(borrador) !== JSON.stringify(apariencia)
    || Object.values(imagenesLocalesPendientes).some(Boolean)

  if (hayCambiosSinGuardar && !window.confirm('Hay cambios sin guardar. ¿Deseas descartarlos y recargar la vista?')) {
    return
  }

  window.location.reload()
}

const restablecerCampo = (campo: 'appShellImagen' | 'loginImagen') => {
  limpiarImagenLocalPendiente(campo)
  borrador[campo] = aparienciaPredeterminada[campo]
  mostrarUrlImagen[campo] = false
}

const colorTextoTema = (color: string) => {
  const hex = color.replace('#', '')
  const canales = [0, 2, 4].map(inicio => Number.parseInt(hex.slice(inicio, inicio + 2), 16))
  const luminosidad = canales[0] * 0.299 + canales[1] * 0.587 + canales[2] * 0.114
  return luminosidad > 155 ? '#17243a' : '#ffffff'
}

const guardarCambios = async () => {
  guardando.value = true
  mensaje.value = ''
  try {
    const configuracion = { ...borrador }
    for (const campo of ['appShellImagen', 'loginImagen'] as const) {
      const archivo = imagenesLocalesPendientes[campo]
      if (!archivo) continue

      configuracion[campo] = await subirImagen(archivo, campo)
      borrador[campo] = configuracion[campo]
      limpiarImagenLocalPendiente(campo)
    }

    await guardarAparienciaServidor(configuracion)
    mensaje.value = 'Cambios guardados correctamente.'
    esError.value = false
  } catch (error) {
    mensaje.value = error instanceof Error ? error.message : 'No se pudieron guardar los cambios.'
    esError.value = true
  } finally {
    guardando.value = false
  }
}

const seleccionarImagen = (event: Event, campo: CampoImagen) => {
  const input = event.target as HTMLInputElement
  const archivo = input.files?.[0]
  input.value = ''
  if (!archivo) return

  limpiarImagenLocalPendiente(campo)
  imagenesLocalesPendientes[campo] = archivo
  vistasPreviaLocales[campo] = URL.createObjectURL(archivo)
  mostrarUrlImagen[campo] = false
}

const subirImagen = async (archivo: File, campo: CampoImagen): Promise<string> => {
  subiendoImagen.value = campo
  try {
    const formulario = new FormData()
    formulario.append('imagen', archivo)
    formulario.append('campo', campo)
    const respuesta = await fetch(`${getApiBaseUrl()}/apariencia/imagen`, {
      method: 'POST',
      body: formulario
    })
    const datos = await respuesta.json().catch(() => null)
    if (!respuesta.ok || typeof datos?.url !== 'string') {
      throw new Error(datos?.error ?? 'No se pudo subir la imagen.')
    }
    return datos.url
  } finally {
    subiendoImagen.value = null
  }
}


/* ───────────── Reloj para calcular ventanas de marcaje y auto-cierre ───────────── */
const ahora = ref(new Date())
let relojId: any = null
onMounted(() => {
  relojId = setInterval(() => (ahora.value = new Date()), 1000)
})
onUnmounted(() => {
  if (relojId) clearInterval(relojId)
  limpiarImagenLocalPendiente('appShellImagen')
  limpiarImagenLocalPendiente('loginImagen')
})


/* ───────────── Utilidades ───────────── */
const inicial = (nombre: string) => nombre.trim().charAt(0).toUpperCase()
</script>

<style scoped>
.horarios-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
  color-scheme: light;
}

.workspace {
  width: min(1120px, 100%);
  margin: 0 auto;
  padding: 28px 30px 40px;
}

.volver-btn {
  display: flex;
  align-items: center;
  align-self: flex-start;
  gap: 8px;
  min-height: 38px;
  padding: 8px 12px;
  border: 1px solid #dfe5ed;
  border-radius: 9px;
  background: #fff;
  color: #40516c;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.volver-btn ion-icon {
  font-size: 18px;
}

.page-heading {
  margin: -2px 0 6px;
}

.eyebrow {
  color: #72819a;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.4px;
  text-transform: uppercase;
}

.page-heading h1 {
  margin: 7px 0;
  color: #17243a;
  font-size: 31px;
  font-weight: 800;
}

.appearance-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(300px, 0.9fr);
  gap: 20px;
  align-items: start;
}

.appearance-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 5px;
  border: 1px solid #e5eaf1;
  border-radius: 12px;
  background: #eef2f7;
}

.appearance-tab {
  min-height: 40px;
  flex: 1 1 180px;
  padding: 9px 16px;
  border: 1px solid transparent;
  border-radius: 9px;
  background: transparent;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
}

.appearance-tab:hover {
  color: #233651;
}

.appearance-tab.active {
  border-color: #dfe5ed;
  background: #fff;
  color: #173c59;
  box-shadow: 0 2px 6px rgba(28, 45, 69, 0.08);
}

.appearance-tab:focus-visible {
  outline: 3px solid rgba(22, 139, 131, 0.24);
  outline-offset: 2px;
}

.appearance-layout-single {
  grid-template-columns: 1fr;
}

.acceso-restringido {
  color: #354660;
}

.acceso-restringido strong {
  font-size: 15px;
}

.settings-panel,
.preview-panel {
  min-width: 0;
  padding: 23px;
  border: 1px solid #e5eaf1;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 8px 24px rgba(28, 45, 69, 0.03);
}

.settings-panel {
  display: grid;
  gap: 20px;
}

.image-settings-panel {
  padding-top: 16px;
  border-top: 1px solid #e8edf3;
  animation: aparecer 0.55s ease both;
}

.font-field {
  display: grid;
  gap: 8px;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.font-field legend {
  margin-bottom: 2px;
  color: #4c5c72;
  font-size: 11px;
  font-weight: 700;
}

.font-field > small {
  display: block;
  color: #7b8799;
  font-size: 10px;
  line-height: 1.5;
}

.font-list {
  --preview-font-family: 'Segoe UI', 'Roboto', sans-serif;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  max-height: 340px;
  overflow: auto;
  padding: 3px;
}

.font-option {
  display: flex;
  min-width: 0;
  min-height: 72px;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 7px;
  padding: 9px 10px;
  border: 1px solid #e2e7ef;
  border-radius: 10px;
  background: #fff;
  color: #354660;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
}

.font-option:hover {
  border-color: #aab8cb;
  background: #f9fbfd;
}

.font-option.selected {
  border-color: var(--app-shell-header-color, #4265ae);
  background: color-mix(in srgb, var(--app-shell-header-color, #4265ae) 6%, #ffffff);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--app-shell-header-color, #4265ae) 14%, transparent);
}

.font-option:focus-visible {
  outline: 2px solid #4265ae;
  outline-offset: 2px;
}

.font-option-copy {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.font-option-copy b {
  overflow: hidden;
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.font-option-copy small {
  color: #8491a5;
  font-size: 9px;
  font-weight: 400;
  line-height: 1.3;
}

.font-sample {
  align-self: flex-end;
  flex: none;
  color: #263b5b;
  font-family: var(--preview-font-family) !important;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.principal-layout-field,
.app-shell-layout-field {
  display: grid;
  gap: 9px;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.principal-layout-field legend,
.app-shell-layout-field legend {
  color: #4c5c72;
  font-size: 11px;
  font-weight: 700;
}

.principal-layout-field > small,
.app-shell-layout-field > small {
  color: #7b8799;
  font-size: 10px;
  line-height: 1.5;
}

.principal-access-order {
  display: grid;
  gap: 7px;
  max-height: 340px;
  overflow: auto;
  margin: 0;
  padding: 2px;
  list-style: none;
}

.principal-access-order-item {
  display: flex;
  min-width: 0;
  min-height: 44px;
  align-items: center;
  gap: 10px;
  padding: 5px 8px;
  border: 1px solid #e2e7ef;
  border-radius: 10px;
  color: #354660;
  font-size: 10px;
  transition: border-color 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease;
}

.principal-access-order-item:hover {
  border-color: #c9d6ec;
  box-shadow: 0 3px 9px rgba(48, 77, 125, 0.08);
  transform: translateY(-1px);
}

.navigation-order-number {
  display: grid;
  width: 25px;
  height: 25px;
  flex: 0 0 25px;
  place-items: center;
  border: 1px solid #dce5f2;
  border-radius: 50%;
  background: #f1f5fb;
  color: #49689e;
  font-size: 10px;
  font-weight: 800;
}

.principal-access-order-item > b {
  overflow: hidden;
  min-width: 0;
  flex: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.navigation-order-actions {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  gap: 3px;
  margin-left: auto;
}

.navigation-order-actions button {
  display: grid;
  width: 26px;
  height: 19px;
  place-items: center;
  padding: 0;
  border: 1px solid #dce5f2;
  border-radius: 6px;
  background: #fff;
  color: #49689e;
  cursor: pointer;
  transition: border-color 0.16s ease, background 0.16s ease, color 0.16s ease, transform 0.16s ease;
}

.navigation-order-actions button ion-icon {
  font-size: 14px;
}

.navigation-order-actions button:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: #7d9bd0;
  background: #edf3ff;
  color: #244b91;
}

.navigation-order-actions button:active:not(:disabled) {
  transform: translateY(0);
}

.navigation-order-actions button:disabled {
  background: #f5f7fa;
  color: #b7c1cf;
  cursor: not-allowed;
}

.navigation-order-actions button:focus-visible {
  outline: 2px solid #7898d2;
  outline-offset: 2px;
}

.principal-panel-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.principal-panel-option {
  display: flex;
  min-width: 0;
  min-height: 60px;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border: 1px solid color-mix(in srgb, var(--app-shell-header-color, #072346) 22%, #e2e7ef);
  border-radius: 11px;
  background: color-mix(in srgb, var(--app-shell-header-color, #072346) 3%, #ffffff);
  color: #354660;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease;
}

.principal-panel-option:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--app-shell-header-color, #072346) 54%, #ffffff);
}

.principal-panel-option.selected {
  border-color: var(--app-shell-header-color, #072346);
  background: color-mix(in srgb, var(--app-shell-header-color, #072346) 7%, #ffffff);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--app-shell-header-color, #072346) 14%, transparent);
}

.principal-panel-option:focus-visible {
  outline: 2px solid var(--app-shell-header-color, #072346);
  outline-offset: 2px;
}

.principal-panel-preview {
  display: grid;
  width: 54px;
  height: 38px;
  flex: none;
  grid-template-columns: 1.15fr 1fr;
  gap: 3px;
  padding: 4px;
  border: 1px solid #cbd5e1;
  border-radius: 7px;
  background: #f1f5f9;
}

.principal-panel-preview-swapped {
  direction: rtl;
}

.principal-panel-preview-access,
.principal-panel-preview-tasks {
  min-width: 0;
  border-radius: 3px;
}

.principal-panel-preview-access {
  background: color-mix(in srgb, var(--app-shell-header-color, #072346) 48%, #ffffff);
}

.principal-panel-preview-tasks {
  background: repeating-linear-gradient(to bottom, #b8c5d5 0 2px, #f8fafc 2px 6px);
}

.principal-panel-option-copy {
  display: grid;
  min-width: 0;
  gap: 3px;
}

.principal-panel-option-copy b {
  color: #354660;
  font-size: 9px;
  line-height: 1.3;
}

.principal-panel-option-copy small {
  color: #7b8799;
  font-size: 8px;
  line-height: 1.3;
}

.app-shell-layout-options {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.app-shell-layout-option {
  display: grid;
  justify-items: center;
  gap: 7px;
  min-width: 0;
  padding: 10px 7px;
  border: 1px solid #e2e7ef;
  border-radius: 10px;
  background: #fff;
  color: #354660;
  font-size: 9px;
  cursor: pointer;
}

.app-shell-layout-option.selected {
  border-color: #4265ae;
  background: #f1f5ff;
  box-shadow: 0 0 0 2px rgba(66, 101, 174, 0.12);
}

.app-shell-layout-preview {
  display: grid;
  width: 76px;
  height: 40px;
  grid-template-rows: 9px 1fr;
  gap: 3px;
  padding: 3px;
  border: 1px solid #cbd5e1;
  border-radius: 5px;
  background: #f1f5f9;
}

.app-shell-layout-preview i:first-child {
  border-radius: 2px;
  background: #4265ae;
}

.app-shell-layout-preview i:last-child {
  border-radius: 2px;
  background: #d7e0eb;
}

.app-shell-layout-preview.layout-preview-sidebar-left,
.app-shell-layout-preview.layout-preview-sidebar-right {
  grid-template-rows: 1fr;
  grid-template-columns: 16px 1fr;
}

.app-shell-layout-preview.layout-preview-sidebar-right {
  direction: rtl;
}

.login-layout-field,
.login-theme-field {
  display: grid;
  gap: 9px;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.login-layout-field legend,
.login-theme-field legend {
  color: #4c5c72;
  font-size: 11px;
  font-weight: 700;
}

.login-layout-field > small,
.login-theme-field > small {
  color: #7b8799;
  font-size: 10px;
  line-height: 1.5;
}

.login-layout-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(132px, 1fr));
  gap: 8px;
}

.sali-assistant-position-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.sali-assistant-position-option {
  display: flex;
  min-width: 0;
  min-height: 60px;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border: 1px solid color-mix(in srgb, var(--app-shell-header-color, #072346) 22%, #e2e7ef);
  border-radius: 11px;
  background: color-mix(in srgb, var(--app-shell-header-color, #072346) 3%, #ffffff);
  color: #354660;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease;
}

.sali-assistant-position-option:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--app-shell-header-color, #072346) 54%, #ffffff);
}

.sali-assistant-position-option.selected {
  border-color: var(--app-shell-header-color, #072346);
  background: color-mix(in srgb, var(--app-shell-header-color, #072346) 7%, #ffffff);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--app-shell-header-color, #072346) 14%, transparent);
}

.sali-assistant-position-preview {
  position: relative;
  display: block;
  width: 62px;
  height: 38px;
  flex: none;
  overflow: hidden;
  border-radius: 7px;
  background: linear-gradient(
    145deg,
    var(--app-shell-header-color, #072346),
    color-mix(in srgb, var(--app-shell-header-color, #072346) 62%, #ffffff)
  );
}

.sali-assistant-position-preview i {
  position: absolute;
  top: 8px;
  font-size: 19px;
  font-style: normal;
  line-height: 1;
}

.sali-position-preview-left i {
  left: 6px;
}

.sali-position-preview-right i {
  right: 6px;
}

.login-theme-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(132px, 1fr));
  gap: 8px;
}

.login-theme-option {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  align-items: center;
  gap: 9px;
  min-width: 0;
  min-height: 66px;
  padding: 8px;
  border: 1px solid #e2e7ef;
  border-radius: 11px;
  background: #fff;
  color: #354660;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease;
}

.login-theme-option:hover {
  transform: translateY(-1px);
  border-color: #b7c8df;
}

.login-theme-option.selected {
  border-color: var(--app-shell-header-color, #4265ae);
  background: color-mix(in srgb, var(--app-shell-header-color, #4265ae) 6%, #ffffff);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--app-shell-header-color, #4265ae) 14%, transparent);
}

.login-theme-preview {
  position: relative;
  display: grid;
  width: 72px;
  height: 44px;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 3px;
  padding: 3px;
  overflow: hidden;
  border: 1px solid #d5deea;
  border-radius: 7px;
  background: #eef2f7;
}

.login-theme-brand {
  border-radius: 4px;
  background: linear-gradient(
    145deg,
    var(--login-preview-accent, #0a1f38),
    color-mix(in srgb, var(--login-preview-accent, #0a1f38) 68%, #000000)
  );
}

.login-theme-content {
  border: 1px solid #e0e6ee;
  border-radius: 4px;
  background-color: #fff;
  background-image: radial-gradient(circle, #91a3bc 1px, transparent 1.4px);
  background-position: center;
  background-size: 5px 5px;
}

.login-theme-preview-nocturne {
  background: linear-gradient(145deg, #0a1224, #1d2942);
}

.login-theme-preview-nocturne .login-theme-brand {
  background: linear-gradient(
    145deg,
    color-mix(in srgb, var(--login-preview-accent, #0a1f38) 65%, #ffffff),
    color-mix(in srgb, var(--login-preview-accent, #0a1f38) 68%, #000000)
  );
}

.login-theme-preview-nocturne .login-theme-content {
  border-color: rgba(235, 242, 255, 0.12);
  background-color: transparent;
}

.login-theme-preview-linen {
  background: #f3f5f8;
}

.login-theme-preview-linen .login-theme-brand {
  background: linear-gradient(
    145deg,
    color-mix(in srgb, var(--login-preview-accent, #0a1f38) 85%, #ffffff),
    color-mix(in srgb, var(--login-preview-accent, #0a1f38) 68%, #000000)
  );
}

.login-theme-preview-linen .login-theme-content {
  background-color: #ffffff;
}

.login-theme-preview-aurora {
  background:
    radial-gradient(ellipse at 30% 20%, color-mix(in srgb, var(--login-preview-accent, #0a1f38) 76%, #ffffff), transparent 58%),
    linear-gradient(145deg, color-mix(in srgb, var(--login-preview-accent, #0a1f38) 42%, #101010), #101010);
}

.login-theme-preview-aurora .login-theme-brand {
  background: linear-gradient(
    145deg,
    color-mix(in srgb, var(--login-preview-accent, #0a1f38) 72%, #ffffff),
    var(--login-preview-accent, #0a1f38)
  );
}

.login-theme-preview-aurora .login-theme-content {
  border-color: color-mix(in srgb, var(--login-preview-accent, #0a1f38) 42%, #ffffff);
  background-color: rgba(245, 246, 255, 0.2);
}

.login-layout-option {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  align-items: center;
  gap: 9px;
  min-width: 0;
  min-height: 66px;
  padding: 8px;
  border: 1px solid color-mix(in srgb, var(--app-shell-header-color, #4265ae) 22%, #e2e7ef);
  border-radius: 11px;
  background: color-mix(in srgb, var(--app-shell-header-color, #4265ae) 3%, #ffffff);
  color: #354660;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease;
}

.login-layout-option:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--app-shell-header-color, #4265ae) 54%, #ffffff);
}

.login-layout-option.selected {
  border-color: var(--app-shell-header-color, #4265ae);
  background: color-mix(in srgb, var(--app-shell-header-color, #4265ae) 6%, #ffffff);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--app-shell-header-color, #4265ae) 14%, transparent);
}

.login-layout-option-preview {
  display: grid;
  width: 72px;
  height: 44px;
  grid-template-columns: 0.85fr 1.15fr;
  align-items: center;
  gap: 4px;
  padding: 4px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--app-shell-header-color, #4265ae) 38%, #cbd5e1);
  border-radius: 7px;
  background: color-mix(in srgb, var(--app-shell-header-color, #4265ae) 13%, #ffffff);
}

.login-layout-mark {
  width: 100%;
  height: 18px;
  border-radius: 4px;
  background: linear-gradient(
    145deg,
    var(--app-shell-header-color, #4265ae),
    color-mix(in srgb, var(--app-shell-header-color, #4265ae) 56%, #ffffff)
  );
}

.login-layout-form {
  width: 100%;
  height: 32px;
  border: 1px solid color-mix(in srgb, var(--app-shell-header-color, #4265ae) 32%, #ffffff);
  border-radius: 5px;
  background-color: color-mix(in srgb, var(--app-shell-header-color, #4265ae) 5%, #ffffff);
  background-image: radial-gradient(
    circle,
    color-mix(in srgb, var(--app-shell-header-color, #4265ae) 40%, #ffffff) 1px,
    transparent 1.4px
  );
  background-position: center;
  background-size: 6px 6px;
}

.login-layout-preview-reverse {
  grid-template-columns: 1.15fr 0.85fr;
}

.login-layout-preview-reverse .login-layout-mark {
  grid-column: 2;
  grid-row: 1;
}

.login-layout-preview-reverse .login-layout-form {
  grid-column: 1;
  grid-row: 1;
}

.login-layout-preview-centered,
.login-layout-preview-integrated,
.login-layout-preview-header {
  grid-template-columns: 1fr;
  grid-template-rows: 9px 1fr;
}

.login-layout-preview-centered .login-layout-mark,
.login-layout-preview-integrated .login-layout-mark,
.login-layout-preview-header .login-layout-mark {
  width: 26px;
  height: 7px;
  justify-self: center;
}

.login-layout-preview-centered .login-layout-form,
.login-layout-preview-integrated .login-layout-form,
.login-layout-preview-header .login-layout-form {
  width: 35px;
  height: 24px;
  justify-self: center;
}

.login-layout-preview-integrated {
  border-color: color-mix(in srgb, var(--app-shell-header-color, #4265ae) 50%, #ffffff);
  background: color-mix(in srgb, var(--app-shell-header-color, #4265ae) 22%, #ffffff);
}

.login-layout-preview-integrated .login-layout-mark {
  height: 6px;
}

.login-layout-preview-header .login-layout-mark {
  width: 42px;
  justify-self: start;
}

.login-layout-option-copy {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.login-layout-option-copy b {
  font-size: 10px;
  line-height: 1.25;
}

.login-layout-option-copy small {
  color: #78869a;
  font-size: 9px;
  line-height: 1.3;
}

.image-section-icon {
  background: #eaf5f5;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.images-grid-single {
  grid-template-columns: minmax(0, 1fr);
}

.image-option-card {
  display: grid;
  align-content: start;
  gap: 13px;
  min-width: 0;
  padding: 17px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: linear-gradient(145deg, #fff 0%, #f8fafc 100%);
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
}

.image-option-card:hover {
  transform: translateY(-2px);
  border-color: #cbd6e5;
  box-shadow: 0 8px 18px rgba(28, 45, 69, 0.06);
}

.image-option-heading {
  display: flex;
  align-items: center;
  gap: 11px;
}

.image-option-icon {
  display: grid;
  width: 40px;
  height: 40px;
  flex: none;
  place-items: center;
  border-radius: 12px;
  background: #eaf3f3;
  font-size: 19px;
}

.login-image-icon {
  background: #f0ecff;
}

.image-option-heading h3 {
  margin: 0 0 3px;
  color: #233651;
  font-size: 13px;
  font-weight: 800;
}

.image-preview {
  position: relative;
  display: grid;
  width: min(100%, 160px);
  aspect-ratio: 1;
  place-items: center;
  overflow: hidden;
  justify-self: center;
  margin: 0;
  border: 1px dashed #d4dce7;
  border-radius: 11px;
  background: linear-gradient(135deg, #102a43, #3c5a75);
}

.image-preview > img {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  padding: 5px;
  object-fit: contain;
}

.image-preview-caption {
  position: absolute;
  right: 6px;
  bottom: 6px;
  left: 6px;
  width: max-content;
  max-width: calc(100% - 12px);
  padding: 4px 7px;
  border-radius: 6px;
  background: rgba(30, 41, 59, 0.84);
  color: #fff;
  font-size: 9px;
  font-weight: 700;
}

.image-option-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.url-toggle-button,
.image-url-entry button {
  min-height: 36px;
  padding: 8px 11px;
  border: 1px solid #dfe5ed;
  border-radius: 9px;
  background: #fff;
  color: #40516c;
  font-size: 0.72rem;
  font-weight: 800;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.url-toggle-button:hover,
.image-url-entry button:hover {
  border-color: #b8c5d6;
  background: #f7f9fc;
}

.remove-image-button {
  color: #a33;
}

.image-url-entry {
  display: flex;
  gap: 8px;
  min-width: 0;
}

.image-url-entry input {
  width: 100%;
  min-width: 0;
  padding: 9px 11px;
  border: 1px solid #dfe5ed;
  border-radius: 9px;
  outline: none;
  color: #354660;
  font-size: 0.78rem;
}

.image-url-entry input:focus {
  border-color: #168b83;
  box-shadow: 0 0 0 3px rgba(22, 139, 131, 0.1);
}

.image-option-card > .btn-subir-apariencia {
  justify-self: start;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 13px;
}

.section-icon {
  display: grid;
  width: 46px;
  height: 46px;
  flex: none;
  place-items: center;
  border-radius: 14px;
  background: #f0ecff;
  font-size: 23px;
}

.section-title h2 {
  margin: 0 0 4px;
  color: #233651;
  font-size: 16px;
}

.preview-panel {
  position: sticky;
  top: 24px;
  display: grid;
  gap: 15px;
}

.preview-label {
  color: #8491a5;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1.3px;
}

.apariencia-preview {
  width: 100%;
  max-width: 760px;
  justify-self: center;
  overflow: hidden;
  border: 1px solid #d5dee8;
  border-radius: 12px;
  background: #f4f6fa;
  box-shadow: 0 8px 20px rgba(23, 36, 58, 0.1);
}

.apariencia-preview-sidebar-left,
.apariencia-preview-sidebar-right {
  display: flex;
  min-height: 220px;
}

.apariencia-preview-sidebar-right {
  flex-direction: row-reverse;
}

.preview-app-sidebar {
  display: flex;
  flex: 0 0 22%;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
  padding: 8px 5px;
  background: var(--app-shell-header-color);
  color: #fff;
}

.preview-sidebar-user {
  display: grid;
  justify-items: center;
  gap: 2px;
  margin-bottom: 2px;
  padding: 2px;
  text-align: center;
}

.preview-sidebar-user ion-icon {
  color: rgba(245, 249, 252, 0.95);
  font-size: 28px;
}

.preview-sidebar-user small {
  color: rgba(226, 238, 248, 0.7);
  font-size: 5px;
}

.preview-sidebar-user b {
  max-width: 100%;
  overflow: hidden;
  font-size: 6px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-app-sidebar span {
  overflow: hidden;
  padding: 5px 4px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.12);
  font-size: 6px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-sidebar-tools,
.preview-sidebar-actions,
.preview-sidebar-nav,
.preview-sidebar-footer {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.preview-sidebar-tools {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  padding: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  background: rgba(3, 12, 24, 0.16);
}

.preview-sidebar-actions {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.preview-sidebar-tools small,
.preview-sidebar-actions small {
  grid-column: 1 / -1;
  color: rgba(226, 238, 248, 0.6);
  font-size: 4px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.preview-sidebar-tools span,
.preview-sidebar-actions span {
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.07);
}

.preview-sidebar-tools span,
.preview-sidebar-actions span,
.preview-sidebar-footer span {
  padding: 4px 1px;
  font-size: 5px;
  text-align: center;
}

.preview-sidebar-nav {
  align-content: start;
}

.preview-sidebar-footer {
  margin-top: auto;
}

.preview-sidebar-footer .preview-sidebar-logout {
  border: 1px solid rgba(248, 113, 113, 0.4);
  background: rgba(220, 38, 38, 0.28);
}

.preview-shell-content {
  flex: 1;
  min-width: 0;
}

.preview-banner {
  position: relative;
  display: grid;
  grid-template-columns: 1fr;
  gap: 5px;
  min-height: 92px;
  padding: 8px 10px 9px;
  color: #f5f9fc;
  box-shadow: 0 5px 12px rgba(6, 20, 38, 0.2);
}

.preview-banner-top {
  display: flex;
  grid-column: 1 / -1;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: 8px;
}

.preview-home-link {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 4px 6px;
  border: 1px solid rgba(169, 216, 238, 0.24);
  border-radius: 6px;
  background: rgba(169, 216, 238, 0.12);
  font-weight: 700;
}

.preview-breadcrumb {
  color: #a9d8ee;
  font-weight: 700;
}

.preview-profile {
  display: grid;
  width: 17px;
  height: 17px;
  place-items: center;
  margin-left: auto;
  border: 1px solid rgba(169, 216, 238, 0.5);
  border-radius: 50%;
  background: rgba(169, 216, 238, 0.14);
  font-size: 12px;
}

.preview-banner-main {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-column: 1 / -1;
  align-items: center;
  gap: 4px;
  min-height: 38px;
  min-width: 0;
}

.preview-banner-center {
  justify-self: end;
  margin-right: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-align: center;
  min-width: 0;
}

.preview-banner-center img {
  width: 34px;
  height: 34px;
  flex: none;
  border-radius: 8px;
  object-fit: contain;
}

.preview-banner-center div {
  display: grid;
  gap: 1px;
}

.preview-banner-center small {
  color: #a9d8ee;
  font-size: 7px;
  font-weight: 700;
}

.preview-banner-center strong {
  font-size: 17px;
  font-weight: 900;
  line-height: 1;
}

.preview-banner-center span {
  font-size: 8px;
  font-weight: 600;
}

.preview-banner-actions {
  display: flex;
  justify-content: flex-end;
  gap: 3px;
  min-width: 0;
  flex: none;
}

.preview-banner-actions span {
  display: grid;
  min-width: 28px;
  justify-items: center;
  align-items: center;
  gap: 2px;
  padding: 3px 1px;
  border: 1px solid rgba(169, 216, 238, 0.2);
  border-radius: 6px;
  background: rgba(169, 216, 238, 0.1);
  font-size: 5.5px;
  font-weight: 700;
  white-space: nowrap;
}

.preview-banner-actions ion-icon {
  font-size: 10px;
}

.preview-home {
  min-height: 126px;
  padding: 10px;
  background-position: center;
  background-size: cover;
}

.preview-sidebar-welcome {
  display: grid;
  min-height: 204px;
  grid-template-columns: minmax(58px, 0.75fr) minmax(0, 1fr);
  align-items: center;
  justify-items: center;
  gap: 12px;
  padding: 14px;
  background:
    radial-gradient(ellipse at 18% 16%, rgba(79, 179, 224, 0.17), transparent 42%),
    radial-gradient(ellipse at 85% 88%, rgba(18, 58, 102, 0.08), transparent 42%);
}

.preview-sidebar-welcome-logo {
  display: grid;
  width: min(100%, 100px);
  aspect-ratio: 1;
  place-items: center;
  padding: 14px;
  border-radius: 50%;
  background: radial-gradient(circle at 32% 26%, color-mix(in srgb, var(--app-shell-header-color) 78%, #4fb3e0), #072346 76%);
  box-shadow: 0 8px 16px rgba(10, 31, 56, 0.2);
}

.preview-sidebar-welcome-logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.preview-sidebar-welcome-copy {
  display: grid;
  min-width: 0;
  justify-items: start;
  color: #10243d;
}

.preview-sidebar-welcome-copy small {
  color: #72839a;
  font-size: 7px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.preview-sidebar-welcome-copy strong {
  color: var(--app-shell-header-color);
  font-size: clamp(20px, 4vw, 36px);
  font-weight: 900;
  letter-spacing: -0.06em;
  line-height: 1.1;
}

.preview-sidebar-welcome-copy span {
  margin-top: 6px;
  color: #687a91;
  font-size: 8px;
  font-weight: 600;
}

.preview-sidebar-welcome-copy b {
  overflow: hidden;
  max-width: 100%;
  font-size: clamp(10px, 2vw, 16px);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-sidebar-welcome-copy em {
  margin-top: 3px;
  color: #72839a;
  font-size: 6px;
  font-style: normal;
}

.preview-home-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  grid-template-areas: "shortcuts tasks";
  align-items: start;
  gap: 8px;
}

.preview-home-grid-swapped {
  grid-template-areas: "tasks shortcuts";
}

.preview-shortcuts {
  grid-area: shortcuts;
  min-width: 0;
  padding: 6px;
  border: 1px solid rgba(10, 31, 56, 0.08);
  border-radius: 9px;
  background: #fff;
  box-shadow: 0 4px 12px rgba(10, 31, 56, 0.06);
}

.preview-shortcut-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 5px;
}

.preview-shortcut {
  position: relative;
  display: grid;
  min-width: 0;
  min-height: 46px;
  align-content: center;
  align-items: center;
  justify-items: center;
  gap: 3px;
  padding: 4px 2px;
  border: 1px solid rgba(10, 31, 56, 0.08);
  border-radius: 8px;
  background: #f5f9fc;
  color: #0a1f38;
}

.preview-shortcut-icon {
  position: relative;
  display: grid;
  width: 21px;
  height: 21px;
  place-items: center;
  border-radius: 7px;
  background: var(--shortcut-tint, #e1eaf2);
  color: var(--shortcut-accent, #34516e);
}

.preview-shortcut-icon ion-icon {
  font-size: 12px;
}

.preview-shortcut-icon b {
  position: absolute;
  top: -6px;
  right: -7px;
  display: grid;
  width: 15px;
  height: 15px;
  place-items: center;
  border: 1px solid #fff;
  border-radius: 50%;
  background: #ed2626;
  color: #fff;
  font-size: 8px;
  line-height: 1;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.preview-shortcut small {
  overflow: hidden;
  max-width: 100%;
  font-size: 6.5px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-shortcut.preview-shortcut-featured {
  border-color: transparent;
  color: #f5f9fc;
}

.preview-shortcut-featured .preview-shortcut-icon {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.preview-shortcut-ordenes {
  --shortcut-accent: #2868ee;
  --shortcut-tint: #e0eaff;
}

.preview-shortcut-reportes,
.preview-shortcut-horarios {
  --shortcut-accent: #009e91;
  --shortcut-tint: #dcf2ef;
}

.preview-shortcut-calendario {
  --shortcut-accent: #1672a5;
  --shortcut-tint: #dce8ee;
}

.preview-shortcut-clientes {
  --shortcut-accent: #8739ff;
  --shortcut-tint: #eee2ff;
}

.preview-shortcut-catalogo {
  --shortcut-accent: #cb22c9;
  --shortcut-tint: #f7e1f7;
}

.preview-shortcut-inventario {
  --shortcut-accent: #f05a18;
  --shortcut-tint: #ffeadf;
}

.preview-shortcut-promociones {
  --shortcut-accent: #ed315b;
  --shortcut-tint: #ffe0e7;
}

.preview-shortcut-facturas {
  --shortcut-accent: #d88a00;
  --shortcut-tint: #fbf0d8;
}

.preview-shortcut-usuarios {
  --shortcut-accent: #00a4c4;
  --shortcut-tint: #dff3f6;
}

.preview-shortcut-configuracion {
  --shortcut-accent: #56677d;
  --shortcut-tint: #e5e9ee;
}

.preview-tasks {
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 8px;
  min-width: 0;
  min-height: 166px;
  padding: 9px;
  border: 1px solid rgba(10, 31, 56, 0.08);
  border-radius: 9px;
  background: #fff;
  box-shadow: 0 4px 12px rgba(10, 31, 56, 0.06);
}

.preview-tasks > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 5px;
  min-width: 0;
}

.preview-tasks > header strong {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #0a1f38;
  font-size: 9px;
  text-transform: lowercase;
}

.preview-tasks > header strong ion-icon {
  color: #d97706;
  font-size: 11px;
}

.preview-tasks > header button {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 4px 6px;
  border: 1px solid #dce5ed;
  border-radius: 7px;
  background: #f5f9fc;
  color: #123a66;
  font-size: 6px;
  font-weight: 700;
  white-space: nowrap;
}

.preview-tasks > header button ion-icon {
  font-size: 8px;
}

.preview-tasks-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 5px;
  color: #0a1f38;
  text-align: center;
}

.preview-tasks-empty ion-icon {
  color: #a7c7dc;
  font-size: 18px;
}

.preview-tasks-empty strong {
  font-size: 8px;
}

.login-preview {
  position: relative;
  isolation: isolate;
  width: 100%;
  max-width: 430px;
  justify-self: center;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--preview-login-color) 28%, transparent);
  border-radius: 12px;
  background: linear-gradient(
    180deg,
    var(--preview-login-color) 0%,
    color-mix(in srgb, var(--preview-login-color) 82%, #000000) 100%
  );
  color: #f5f9fc;
  box-shadow: 0 8px 20px rgba(23, 36, 58, 0.16);
}

.login-preview::before,
.login-preview::after {
  position: absolute;
  z-index: 0;
  border-radius: 50%;
  content: '';
  pointer-events: none;
  filter: blur(4px);
}

.login-preview::before {
  top: -15px;
  right: -10px;
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.18);
}

.login-preview::after {
  bottom: -34px;
  left: -24px;
  width: 88px;
  height: 88px;
  background: rgba(255, 255, 255, 0.12);
}

.login-preview-layout {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  min-height: 196px;
  padding: 12px 10px;
}

.login-preview-brand {
  display: grid;
  min-width: 0;
  min-height: 150px;
  place-items: center;
}

.login-preview-brand img {
  width: 100%;
  max-height: 150px;
  object-fit: contain;
  filter: drop-shadow(0 8px 14px rgba(0, 0, 0, 0.35));
}

.login-preview-card {
  display: grid;
  justify-items: center;
  gap: 6px;
  min-width: 0;
}

.login-preview-avatar {
  display: grid;
  justify-items: center;
  gap: 2px;
  margin-bottom: 1px;
  color: #eaf4fa;
  font-size: 7px;
  font-weight: 800;
  text-align: center;
}

.login-preview-avatar ion-icon {
  color: color-mix(in srgb, var(--preview-login-color) 42%, #ffffff);
  font-size: 27px;
}

.login-preview-dots {
  display: flex;
  justify-content: center;
  gap: 5px;
  padding: 5px 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
}

.login-preview-dots i {
  width: 6px;
  height: 6px;
  border: 1px solid color-mix(in srgb, var(--preview-login-color) 48%, #ffffff);
  border-radius: 50%;
}

.login-preview-keypad {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 3px;
  width: min(100%, 112px);
}

.login-preview-keypad span {
  display: grid;
  min-height: 18px;
  place-items: center;
  border: 1px solid color-mix(in srgb, var(--preview-login-color) 20%, transparent);
  border-radius: 5px;
  background: color-mix(in srgb, var(--preview-login-color) 10%, transparent);
  color: #f5f9fc;
  font-size: 8px;
  font-weight: 700;
}

.login-preview-keypad .login-preview-empty {
  border-color: transparent;
  background: transparent;
}

.login-preview-forgot {
  color: color-mix(in srgb, var(--preview-login-color) 52%, #ffffff);
  font-size: 7px;
  font-weight: 700;
}

.login-preview-card-logo {
  display: none;
  width: 82px;
  max-height: 34px;
  object-fit: contain;
  filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.28));
}

.login-preview-reverse .login-preview-layout {
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
}

.login-preview-reverse .login-preview-card {
  grid-column: 1;
  grid-row: 1;
}

.login-preview-reverse .login-preview-brand {
  grid-column: 2;
  grid-row: 1;
}

.login-preview-centered .login-preview-layout,
.login-preview-header .login-preview-layout {
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto auto;
  gap: 2px;
}

.login-preview-centered .login-preview-brand {
  min-height: 76px;
}

.login-preview-centered .login-preview-brand img {
  max-height: 72px;
}

.login-preview-header .login-preview-brand {
  min-height: 52px;
  justify-items: start;
  padding: 3px 12px;
}

.login-preview-header .login-preview-brand img {
  width: 92px;
  max-height: 48px;
}

.login-preview-integrated .login-preview-layout {
  grid-template-columns: minmax(0, 1fr);
}

.login-preview-integrated .login-preview-brand {
  display: none;
}

.login-preview-integrated .login-preview-card {
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.08);
}

.login-preview-integrated .login-preview-card-logo {
  display: block;
}

.login-preview-market-copy,
.login-preview-market-art,
.login-preview-market-lockup,
.login-preview-market-welcome {
  display: none;
}

.login-preview-theme-market {
  background: #f3f5f8;
  box-shadow: 0 12px 28px rgba(20, 34, 54, 0.1);
}

.login-preview-theme-market .login-preview-layout {
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
  gap: 7px;
  padding: 8px;
}

.login-preview-theme-market .login-preview-brand {
  position: relative;
  align-content: center;
  justify-items: start;
  min-height: 180px;
  padding: 11px;
  overflow: hidden;
  border-radius: 12px;
  background:
    radial-gradient(ellipse at 82% 30%, color-mix(in srgb, var(--preview-login-color) 76%, #ffffff), transparent 44%),
    linear-gradient(145deg, var(--preview-login-color), color-mix(in srgb, var(--preview-login-color) 70%, #000000));
}

.login-preview-theme-market .login-preview-brand img {
  display: none;
}

.login-preview-theme-market .login-preview-market-copy {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 5px;
  color: #ffffff;
}

.login-preview-market-copy small {
  color: rgba(235, 243, 251, 0.72);
  font-size: 5px;
  font-weight: 800;
  letter-spacing: 0.12em;
}

.login-preview-market-copy b {
  font-size: 14px;
  letter-spacing: -0.06em;
  line-height: 1.03;
}

.login-preview-market-copy span {
  color: rgba(232, 241, 249, 0.78);
  font-size: 6px;
}

.login-preview-theme-market .login-preview-market-art {
  position: absolute;
  right: 12px;
  bottom: 20px;
  display: block;
  color: #ffffff;
  font-size: 25px;
  opacity: 0.9;
}

.login-preview-theme-market .login-preview-card {
  align-content: center;
  justify-items: start;
  gap: 5px;
  padding: 7px 5px;
  border-radius: 10px;
  background: #ffffff;
}

.login-preview-theme-market .login-preview-card-logo {
  display: none;
}

.login-preview-theme-market .login-preview-market-lockup {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
}

.login-preview-market-lockup > img {
  width: 18px;
  height: 18px;
  object-fit: contain;
}

.login-preview-market-lockup > span {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.login-preview-market-lockup b {
  overflow: hidden;
  color: #17243a;
  font-size: 5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.login-preview-market-lockup small {
  color: #8491a5;
  font-size: 4px;
}

.login-preview-theme-market .login-preview-market-welcome {
  display: grid;
  gap: 2px;
}

.login-preview-market-welcome b {
  color: var(--preview-login-color);
  font-size: 10px;
  letter-spacing: -0.05em;
  line-height: 1.05;
}

.login-preview-market-welcome small {
  color: #8591a1;
  font-size: 5px;
}

.login-preview-theme-market .login-preview-avatar {
  display: none;
}

.login-preview-theme-market .login-preview-dots {
  padding: 3px 5px;
  border-color: #e7ebf0;
  background: #f7f9fb;
}

.login-preview-theme-market .login-preview-dots i {
  width: 4px;
  height: 4px;
  border-color: #b7c1ce;
}

.login-preview-theme-market .login-preview-keypad {
  width: min(100%, 70px);
  gap: 2px;
}

.login-preview-theme-market .login-preview-keypad span {
  min-height: 11px;
  border-color: #e1e6ed;
  background-color: #ffffff;
  color: #26364d;
  font-size: 5px;
}

.login-preview-theme-market .login-preview-forgot {
  color: var(--preview-login-color);
  font-size: 5px;
}

.login-preview-theme-linen {
  background: #f3f5f8;
}

.login-preview-theme-linen .login-preview-brand {
  border-radius: 12px;
  background: linear-gradient(
    145deg,
    color-mix(in srgb, var(--preview-login-color) 86%, #ffffff),
    color-mix(in srgb, var(--preview-login-color) 68%, #000000)
  );
}

.login-preview-theme-linen .login-preview-card {
  padding: 8px;
  border: 1px solid #e4e9f0;
  border-radius: 12px;
  background: #ffffff;
}

.login-preview-theme-aurora {
  background:
    radial-gradient(ellipse at 18% 8%, color-mix(in srgb, var(--preview-login-color) 76%, #ffffff), transparent 42%),
    radial-gradient(ellipse at 85% 90%, color-mix(in srgb, var(--preview-login-color) 34%, transparent), transparent 40%),
    linear-gradient(
      140deg,
      color-mix(in srgb, var(--preview-login-color) 42%, #101010),
      color-mix(in srgb, var(--preview-login-color) 30%, #101010) 56%,
      #101010
    );
}

.login-preview-theme-aurora .login-preview-card {
  padding: 8px;
  border: 1px solid rgba(231, 234, 255, 0.2);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.1);
}

.login-preview-theme-minimal {
  background: #f4f6f9;
}

.login-preview-theme-minimal .login-preview-brand {
  border-radius: 12px;
  background: linear-gradient(145deg, #ffffff, #eaf0f6);
}

.login-preview-theme-minimal .login-preview-card {
  padding: 8px;
  border: 1px solid #e4e9f0;
  border-radius: 12px;
  background: #ffffff;
}

.login-preview-theme-minimal .login-preview-avatar,
.login-preview-theme-minimal .login-preview-avatar ion-icon,
.login-preview-theme-minimal .login-preview-forgot {
  color: #26364d;
}

/* ── Tarjeta base (reutiliza look del Home) ── */
.config-card {
  background: #ffffff;
  border: 1px solid rgba(10, 31, 56, 0.07);
  border-radius: 20px;
  padding: 20px 22px;
  box-shadow: 0 10px 26px rgba(10, 31, 56, 0.06);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.apariencia-card {
  gap: 20px;
  background: #fff;
  animation: aparecer 0.55s ease both;
}

.btn-restablecer-apariencia,
.btn-subir-apariencia {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  border: 1px solid rgba(18, 58, 102, 0.14);
  border-radius: 10px;
  padding: 8px 13px;
  background: #ffffff;
  color: #123a66;
  font-size: 0.78rem;
  font-weight: 800;
  cursor: pointer;
  transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
}

.btn-restablecer-apariencia:hover,
.btn-subir-apariencia:hover {
  transform: translateY(-1px);
  border-color: rgba(22, 139, 131, 0.4);
  background: #f4fbfa;
  box-shadow: 0 6px 14px rgba(10, 31, 56, 0.08);
}

.apariencia-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.apariencia-seccion {
  display: grid;
  align-content: start;
  gap: 10px;
  padding: 16px;
  border: 1px solid rgba(10, 31, 56, 0.08);
  border-radius: 16px;
  background: #fff;
  animation: aparecer 0.55s ease both;
  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}

.apariencia-seccion:hover {
  transform: translateY(-2px);
  border-color: #cbd6e5;
  box-shadow: 0 8px 18px rgba(28, 45, 69, 0.06);
}

.apariencia-seccion:nth-child(2) { animation-delay: 0.08s; }
.apariencia-seccion:nth-child(3) { animation-delay: 0.16s; }
.apariencia-seccion:nth-child(4) { animation-delay: 0.24s; }
.apariencia-seccion:nth-child(1) { border-top: 2px solid #168b83; }
.apariencia-seccion:nth-child(2) { border-top: 2px solid #4169a1; }
.apariencia-seccion:nth-child(3) { border-top: 2px solid #7c3aed; }
.apariencia-seccion:nth-child(4) { border-top: 2px solid #d97706; }

@keyframes aparecer {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.apariencia-seccion > strong {
  color: #0a1f38;
}

.apariencia-titulo {
  display: flex;
  align-items: center;
  gap: 7px;
  padding-bottom: 1px;
  color: #123a66;
  font-size: 1rem;
}



.apariencia-campo {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 9px 10px;
  border: 1px solid rgba(10, 31, 56, 0.06);
  border-radius: 11px;
  background: rgba(255, 255, 255, 0.78);
  color: #4a627e;
  font-size: 0.8rem;
  font-weight: 700;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.apariencia-campo-color {
  grid-template-columns: 1fr;
  align-items: start;
}

.apariencia-campo-color .apariencia-control {
  flex-wrap: wrap;
}

.apariencia-campo-color code {
  color: #354660;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.color-presets {
  grid-column: 1 / -1;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.color-presets legend {
  margin-bottom: 9px;
  color: #4c5c72;
  font-size: 0.7rem;
  font-weight: 700;
}

.color-swatches {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  justify-items: center;
  gap: 8px 10px;
}

.color-swatch {
  display: grid;
  width: 28px;
  height: 28px;
  flex: none;
  place-items: center;
  border: 2px solid #fff;
  border-radius: 50%;
  color: #fff;
  font-size: 13px;
  font-weight: 800;
  box-shadow: 0 0 0 1px #d8dee8, 0 3px 8px rgba(21, 37, 58, 0.12);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.color-swatch:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 0 2px #8190a5, 0 5px 11px rgba(21, 37, 58, 0.14);
}

.color-swatch.selected {
  box-shadow: 0 0 0 2px #243b5b, 0 4px 10px rgba(21, 37, 58, 0.14);
}

.color-swatch:focus-visible {
  outline: 2px solid #243b5b;
  outline-offset: 3px;
}

.apariencia-campo:focus-within {
  border-color: rgba(22, 139, 131, 0.34);
  box-shadow: 0 0 0 3px rgba(22, 139, 131, 0.08);
}

.apariencia-campo input[type='url'] {
  grid-column: 1 / -1;
  width: 100%;
  border: 1px solid rgba(10, 31, 56, 0.14);
  border-radius: 9px;
  padding: 8px 10px;
  outline: none;
  color: #0a1f38;
  background: #ffffff;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.apariencia-campo input[type='url']:focus {
  border-color: #168b83;
  box-shadow: 0 0 0 3px rgba(22, 139, 131, 0.12);
}

.apariencia-control,
.apariencia-control-apilado {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.apariencia-control-apilado {
  grid-column: 1 / -1;
  width: 100%;
  flex-wrap: wrap;
}

.apariencia-control-apilado input[type='url'] {
  flex: 1;
  min-width: 180px;
}

.apariencia-control button,
.apariencia-control-apilado button {
  border: 1px solid rgba(18, 58, 102, 0.12);
  border-radius: 8px;
  padding: 6px 8px;
  background: #f7fafc;
  color: #41627f;
  font-size: 0.68rem;
  font-weight: 800;
  white-space: nowrap;
  cursor: pointer;
  transition: color 0.18s ease, background 0.18s ease, border-color 0.18s ease;
}

.apariencia-control button:hover,
.apariencia-control-apilado button:hover {
  border-color: rgba(22, 139, 131, 0.3);
  background: #eaf7f5;
  color: #08766f;
}

.apariencia-campo input[type='color'] {
  width: 46px;
  height: 34px;
  padding: 2px;
  border: 1px solid rgba(10, 31, 56, 0.14);
  border-radius: 9px;
  background: #ffffff;
  cursor: pointer;
}

.btn-subir-apariencia {
  justify-self: start;
}

.btn-subir-apariencia.cargando {
  opacity: 0.6;
  cursor: wait;
}

.acciones-apariencia {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  padding: 4px 2px 2px;
  border-top: 1px solid rgba(10, 31, 56, 0.08);
}

.mensaje-apariencia { margin-right: auto; color: #08766f; font-size: 0.82rem; font-weight: 700; }
.mensaje-apariencia.error { color: #b74444; }
.appearance-action-buttons {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-restablecer-todo {
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 0 15px;
  border: 1px solid #d5dee8;
  border-radius: 11px;
  background: #fff;
  color: #40516c;
  font-size: 0.78rem;
  font-weight: 800;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.btn-restablecer-todo:hover:not(:disabled) {
  border-color: #b8c5d6;
  background: #f7f9fc;
}

.btn-restablecer-todo:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn-guardar-apariencia {
  --border-radius: 11px;
  --padding-start: 18px;
  --padding-end: 18px;
  --padding-top: 10px;
  --padding-bottom: 10px;
  font-weight: 800;
  transition: filter 0.15s ease;
}

.btn-guardar-apariencia:hover:not([disabled]) {
  filter: brightness(0.92);
}

@media (prefers-reduced-motion: reduce) {
  .apariencia-card,
  .apariencia-seccion { animation: none; }
}

.config-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(10, 31, 56, 0.07);
}

.config-card-label {
  font-size: 0.78rem;
  font-weight: 800;
  color: #6d829c;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.config-card-hint {
  margin: 0;
  font-size: 0.76rem;
  color: #9fb4c9;
}

.apariencia-subtitulo {
  margin: 5px 0 0;
  color: #7890a7;
  font-size: 0.8rem;
  line-height: 1.4;
}

.config-add-btn {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: none;
  background: rgba(18, 58, 102, 0.08);
  color: #123a66;
  display: grid;
  place-items: center;
  cursor: pointer;
}

/* ── Badge de rol + usuario actual ── */
.badge-rol {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(159, 180, 201, 0.2);
  color: #4a627e;
  font-weight: 800;
  font-size: 0.76rem;
}

.badge-rol ion-icon {
  font-size: 14px;
}

.badge-rol.admin {
  background: rgba(18, 58, 102, 0.12);
  color: #123a66;
}

.usuario-actual {
  display: flex;
  align-items: center;
  gap: 10px;
}

.usuario-nombre {
  margin: 0;
  font-weight: 800;
  color: #0a1f38;
  font-size: 0.95rem;
}

.usuario-actual small {
  color: #6d829c;
  font-size: 0.78rem;
}

/* ── Toggle de periodo de pago ── */
.rol-toggle {
  display: flex;
  background: #f5f9fc;
  border-radius: 999px;
  padding: 4px;
  gap: 4px;
}

.rol-toggle button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 999px;
  border: none;
  background: transparent;
  color: #4a627e;
  font-weight: 700;
  font-size: 0.82rem;
  cursor: pointer;
}

.rol-toggle button.active {
  background: #123a66;
  color: #f5f9fc;
}

.rol-toggle.chico button {
  padding: 6px 12px;
  font-size: 0.76rem;
}

/* ── Grid de dos columnas ── */
.home-grid-row {
  display: grid;
  grid-template-columns: 1.05fr 1fr;
  gap: 18px;
  align-items: start;
}

.accesos-card,
.tareas-card {
  background: #ffffff;
  border: 1px solid rgba(10, 31, 56, 0.08);
  border-radius: 18px;
  padding: 18px;
  box-shadow: 0 4px 12px rgba(10, 31, 56, 0.05);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 4px 2px 16px;
  border-bottom: 1px solid rgba(10, 31, 56, 0.08);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 800;
  color: #0a1f38;
  font-size: 1.08rem;
}

.card-title ion-icon {
  color: #123a66;
  font-size: 18px;
}

/* ── Estados vacíos ── */
.estado-vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 4px;
  padding: 26px 10px;
  color: #6d829c;
}

.estado-vacio-icon {
  font-size: 32px;
  color: #a9c3d8;
  margin-bottom: 4px;
}

.estado-vacio-titulo {
  margin: 0;
  font-weight: 800;
  color: #0a1f38;
}

.estado-vacio-texto {
  margin: 0;
  font-size: 0.86rem;
  max-width: 360px;
}

.estado-vacio-mini {
  color: #9fb4c9;
  font-size: 0.85rem;
  text-align: center;
  padding: 12px 0;
}

/* ── Lista de empleados (config de pago) ── */
.lista-empleados {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.empleado-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #f5f9fc;
}

.empleado-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.empleado-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #123a66;
  color: #f5f9fc;
  display: grid;
  place-items: center;
  font-weight: 800;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.empleado-avatar.chico {
  width: 28px;
  height: 28px;
  font-size: 0.75rem;
}

.empleado-texto {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.empleado-nombre {
  font-weight: 700;
  color: #0a1f38;
  font-size: 0.92rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empleado-rol-chip {
  align-self: flex-start;
  font-size: 0.7rem;
  font-weight: 800;
  color: #4a627e;
  background: rgba(74, 98, 126, 0.1);
  padding: 2px 8px;
  border-radius: 999px;
}

.empleado-pago {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #ffffff;
  border: 1px solid rgba(10, 31, 56, 0.1);
  border-radius: 10px;
  padding: 4px 8px;
  font-weight: 700;
  color: #0a1f38;
  flex-shrink: 0;
}

.empleado-pago input {
  width: 56px;
  border: none;
  outline: none;
  font-weight: 700;
  color: #0a1f38;
  background: transparent;
}

.empleado-pago-sufijo {
  color: #6d829c;
  font-size: 0.78rem;
}

.empleado-borrar {
  border: none;
  background: none;
  color: #9fb4c9;
  cursor: pointer;
  font-size: 16px;
  flex-shrink: 0;
}

/* ── Formulario de turno ── */
.form-turno {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-turno-fila {
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-turno-guion {
  color: #6d829c;
  font-size: 0.8rem;
}

.input-select {
  width: 100%;
  border: 1px solid rgba(10, 31, 56, 0.14);
  background: #f5f9fc;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #0a1f38;
  outline: none;
}

.checkbox-horas-extra {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #4a627e;
  padding: 4px 2px;
  cursor: pointer;
}

.checkbox-horas-extra input {
  width: 16px;
  height: 16px;
  accent-color: #123a66;
}

.btn-programar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: none;
  border-radius: 12px;
  padding: 11px;
  background: #123a66;
  color: #f5f9fc;
  font-weight: 800;
  font-size: 0.9rem;
  cursor: pointer;
}

.btn-programar:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.subtitulo-lista {
  margin: 4px 0 0;
  font-size: 0.78rem;
  font-weight: 800;
  color: #6d829c;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.lista-turnos {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 180px;
  overflow-y: auto;
}

.turno-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 10px;
  background: #f5f9fc;
}

.turno-info {
  flex: 1;
  display: grid;
  gap: 1px;
}

.turno-empleado {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  color: #0a1f38;
  font-size: 0.88rem;
}

.turno-info small {
  color: #6d829c;
  font-size: 0.78rem;
}

.chip-horas-extra {
  font-size: 0.68rem;
  font-weight: 800;
  color: #b45309;
  background: rgba(217, 119, 6, 0.15);
  padding: 2px 8px;
  border-radius: 999px;
  white-space: nowrap;
}

.chip-horas-extra.chico {
  font-size: 0.62rem;
  padding: 1px 6px;
}

/* ── Registro de hoy ── */
.lista-registro-hoy {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.registro-hoy-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #f5f9fc;
  flex-wrap: wrap;
}

.registro-hoy-nombre {
  flex: 1;
  font-weight: 700;
  color: #0a1f38;
  font-size: 0.88rem;
}

.registro-hoy-hora {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.82rem;
  color: #4a627e;
  font-weight: 600;
}

.registro-hoy-hora ion-icon {
  font-size: 14px;
}

.badge-puntualidad {
  font-size: 0.72rem;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 999px;
}

.badge-puntualidad.tarde {
  background: rgba(220, 38, 38, 0.12);
  color: #b91c1c;
}

.badge-estado {
  font-size: 0.72rem;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(159, 180, 201, 0.25);
  color: #6d829c;
}

.badge-estado.activo {
  background: rgba(217, 119, 6, 0.15);
  color: #b45309;
}

.badge-estado.completo {
  background: rgba(18, 58, 102, 0.12);
  color: #123a66;
}

/* ── Pago por empleado ── */
.lista-pagos {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pago-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  background: #f5f9fc;
  flex-wrap: wrap;
}

.pago-info {
  flex: 1;
  min-width: 160px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.pago-nombre {
  margin: 0;
  font-weight: 700;
  color: #0a1f38;
  font-size: 0.9rem;
}

.pago-info small {
  color: #6d829c;
  font-size: 0.78rem;
}

.pago-monto {
  text-align: right;
  min-width: 100px;
}

.pago-monto-cifra {
  display: block;
  font-weight: 800;
  color: #0a1f38;
  font-size: 1.05rem;
}

.pago-monto small {
  color: #9fb4c9;
  font-size: 0.72rem;
}

.btn-pagar {
  border: none;
  border-radius: 10px;
  padding: 9px 14px;
  background: #123a66;
  color: #f5f9fc;
  font-weight: 700;
  font-size: 0.82rem;
  cursor: pointer;
}

.btn-pagar:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* ── Resumen del turno de hoy (personal) ── */
.turno-hoy-resumen {
  font-size: 0.86rem;
  color: #4a627e;
  background: #f5f9fc;
  border-radius: 10px;
  padding: 8px 12px;
}

.turno-hoy-resumen strong {
  color: #123a66;
}

.turno-hoy-resumen.sin-turno {
  color: #9fb4c9;
}

/* ── Toggles de entrada / salida ── */
.toggle-fila {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-radius: 12px;
  background: #f5f9fc;
  gap: 10px;
}

.toggle-texto {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.toggle-texto span {
  font-weight: 700;
  color: #0a1f38;
  font-size: 0.92rem;
}

.toggle-texto small {
  color: #6d829c;
  font-size: 0.78rem;
}

.toggle-texto small.ventana-motivo {
  color: #b45309;
}

.switch {
  position: relative;
  width: 50px;
  height: 28px;
  flex-shrink: 0;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.switch-riel {
  position: absolute;
  inset: 0;
  background: #d6e2ec;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.switch-riel::before {
  content: '';
  position: absolute;
  width: 22px;
  height: 22px;
  left: 3px;
  top: 3px;
  background: #ffffff;
  border-radius: 50%;
  transition: transform 0.2s ease;
  box-shadow: 0 1px 3px rgba(10, 31, 56, 0.25);
}

.switch input:checked + .switch-riel {
  background: #123a66;
}

.switch input:checked + .switch-riel::before {
  transform: translateX(22px);
}

.switch input:disabled + .switch-riel {
  opacity: 0.45;
  cursor: not-allowed;
}

/* ── Estado de puntualidad (personal) ── */
.puntualidad-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
  padding: 10px;
  border-radius: 10px;
  background: rgba(18, 58, 102, 0.1);
  color: #123a66;
  font-weight: 800;
  font-size: 0.88rem;
}

.puntualidad-badge ion-icon {
  font-size: 16px;
}

.puntualidad-badge.tarde {
  background: rgba(220, 38, 38, 0.12);
  color: #b91c1c;
}

/* ── Calendario semanal (personal) ── */
.calendario-semana {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dia-chip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #f5f9fc;
  flex-wrap: wrap;
}

.dia-chip.hoy {
  background: rgba(18, 58, 102, 0.1);
  border: 1px solid rgba(18, 58, 102, 0.25);
}

.dia-chip.libre {
  opacity: 0.7;
}

.dia-chip-encabezado {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 90px;
}

.dia-chip-nombre {
  font-weight: 700;
  color: #0a1f38;
  font-size: 0.86rem;
  text-transform: capitalize;
}

.dia-chip-fecha {
  color: #9fb4c9;
  font-size: 0.72rem;
}

.dia-chip-horario {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  color: #123a66;
  font-size: 0.86rem;
}

.dia-chip-libre {
  color: #9fb4c9;
  font-size: 0.82rem;
  font-weight: 600;
}

/* ── Responsive ── */
@media (max-width: 900px) {
  .home-grid-row {
    grid-template-columns: 1fr;
  }

  .workspace {
    padding: 24px 20px 32px;
  }

  .appearance-layout {
    grid-template-columns: 1fr;
  }

  .preview-panel {
    position: static;
    order: -1;
  }

  .apariencia-grid {
    grid-template-columns: 1fr;
  }

  .images-grid {
    grid-template-columns: 1fr;
  }

  .config-card {
    padding: 18px;
  }

  .apariencia-control-apilado input[type='url'] {
    min-width: 0;
  }

  .acciones-apariencia {
    align-items: stretch;
    flex-direction: column;
  }

  .appearance-action-buttons {
    width: 100%;
    flex-direction: column;
  }

  .btn-restablecer-todo,
  .btn-guardar-apariencia {
    width: 100%;
    margin: 0;
  }
}

@media (max-width: 480px) {
  .workspace {
    padding: 18px 14px 28px;
  }

  .page-heading h1 {
    font-size: 27px;
  }

  .settings-panel,
  .preview-panel {
    padding: 17px;
  }

  .image-option-card {
    padding: 14px;
  }

  .image-url-entry {
    align-items: stretch;
    flex-direction: column;
  }

  .image-url-entry button {
    align-self: flex-start;
  }

  .config-card-header,
  .card-header-row {
    align-items: flex-start;
    gap: 10px;
  }

  .apariencia-seccion {
    padding: 14px;
  }

  .apariencia-campo {
    grid-template-columns: 1fr;
    align-items: start;
  }

  .apariencia-control,
  .apariencia-control-apilado {
    width: 100%;
  }

  .apariencia-control {
    justify-content: space-between;
  }

  .apariencia-control-apilado {
    align-items: stretch;
    flex-direction: column;
  }

  .apariencia-control-apilado button {
    align-self: flex-start;
  }

  .apariencia-preview {
    max-width: 100%;
  }

  .font-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
