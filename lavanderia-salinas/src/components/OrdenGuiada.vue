<template>
  <section class="orden-guiada force-light" @keydown="manejarTeclaOrden">
    <header class="orden-header">
    </header>
   <div v-if="ultimaOrdenCreada" class="orden-exito">
      <div class="exito-icono">
        <ion-icon :icon="checkmarkCircleOutline" />
      </div>

      <div class="exito-copy">
        <p class="exito-titulo">Orden creada exitosamente</p>
        <p class="exito-numero">
          Número de orden: <strong>{{ ultimaOrdenCreada.numero }}</strong>
        </p>
        <p v-if="ultimaOrdenCreada.fechaEntregaActiva && ultimaOrdenCreada.fechaEntregaTexto" class="exito-fecha">
          <ion-icon :icon="calendarOutline" />
          Fecha estimada de entrega: {{ ultimaOrdenCreada.fechaEntregaTexto }}
        </p>
      </div>

      <div class="exito-acciones">
        <button class="action-btn" @click="imprimirTicketOrden">
          <ion-icon :icon="printOutline" />
          Imprimir ticket
        </button>
        <button class="action-btn" @click="imprimirEtiquetaPrendas">
          <ion-icon :icon="pricetagOutline" />
          Etiqueta de prendas
        </button>
        <button class="action-btn verde" @click="enviarWhatsApp">
          <ion-icon :icon="logoWhatsapp" />
          Enviar por WhatsApp
        </button>
        <button class="action-btn morado" @click="abrirModalCorreo">
          <ion-icon :icon="mailOutline" />
          Enviar por correo
        </button>
        <button class="action-btn principal new-order-btn" @click="nuevaOrden">
          <ion-icon :icon="refreshOutline" />
          Nueva orden
        </button>
      </div>
    </div>

    <div v-else class="orden-board">
      <nav class="pasos-nav">
        <button
          v-for="(paso, index) in pasos"
          :key="paso.id"
          class="paso-chip"
          :class="{ active: etapaActiva === index, done: index < etapaActiva }"
          :disabled="index > etapaActiva"
          @click="irAPaso(index)"
        >
          <span class="paso-numero">{{ index + 1 }}</span>
          <span>{{ paso.title }}</span>
        </button>
      </nav>

      <div class="orden-layout">
        <section class="panel-principal">
          <div class="panel-cabecera">
            <div>
              <h3>{{ pasos[etapaActiva].title }}</h3>
            </div>
            <div class="mini-resumen">
              <span>{{ cantidadTotal }} artículos</span>
              <strong>${{ total.toFixed(2) }}</strong>
            </div>
          </div>

          <div v-if="etapaActiva === 0" class="paso-contenido">
            <transition name="slide-fade" mode="out-in">
              <div :key="pasoClienteActiva" class="wizard-card">
                <div class="wizard-header">
                  <div>
                    <p class="wizard-step">{{ pasoClienteActiva + 1 }} de {{ pasosCliente.length }}</p>
                    <h4>{{ pasosCliente[pasoClienteActiva].title }}</h4>
                    <p>{{ pasosCliente[pasoClienteActiva].description }}</p>
                  </div>
                  <div class="wizard-dots">
                    <span
                      v-for="(paso, index) in pasosCliente"
                      :key="paso.id"
                      :class="{ active: index === pasoClienteActiva, done: index < pasoClienteActiva }"
                    ></span>
                  </div>
                </div>

                <div v-if="pasoClienteActiva === 0" class="wizard-panel">
                  <div v-if="clienteEncontrado" class="cliente-badge cliente-badge-fuerte">
                    <ion-icon :icon="starOutline" />
                    <div>
                      <strong>{{ clienteEncontrado.nombre }}</strong>
                      <span>
                        {{ clienteEncontrado.esRecurrente ? 'Cliente frecuente' : 'Cliente registrado' }}
                        · {{ clienteEncontrado.totalOrdenes }} órdenes
                      </span>
                    </div>
                  </div>

                  <div class="cliente-grid">
                    <label class="campo">
                      <span class="campo-label">📱 Teléfono</span>
                      <div class="telefono-row">
                        <input
                          v-model="pedido.codigoPais"
                          class="input-codigo"
                          type="text"
                          inputmode="numeric"
                          maxlength="4"
                          placeholder="503"
                          aria-label="Código de país sin signo más"
                        />
                        <input
                          v-model="pedido.telefono"
                          class="input-texto"
                          :class="{ error: pedido.telefono && !telefonoValido }"
                          type="tel"
                          inputmode="numeric"
                          placeholder="Teléfono del cliente"
                        />
                      </div>
                      <p v-if="pedido.telefono && !telefonoValido" class="ayuda-error">
                        Ingresa un número válido
                      </p>
                    </label>

                    <label class="campo">
                      <span class="campo-label">👤 Nombre</span>
                      <div class="cliente-autocompletado">
                        <input
                          v-model="pedido.nombreCliente"
                          class="input-texto"
                          :class="{ readonly: clienteEncontrado }"
                          type="text"
                          placeholder="Nombre del Cliente"
                          autocomplete="off"
                          @input="limpiarClienteSeleccionado"
                        />
                        <div v-if="clientesSugeridos.length" class="clientes-sugerencias">
                          <button
                            v-for="cliente in clientesSugeridos"
                            :key="cliente.id"
                            type="button"
                            class="cliente-sugerencia"
                            @mousedown.prevent="seleccionarCliente(cliente)"
                          >
                            <strong>{{ cliente.nombre }}</strong>
                            <span>{{ cliente.celular }}{{ cliente.correo ? ` · ${cliente.correo}` : '' }}</span>
                          </button>
                        </div>
                      </div>
                    </label>
  
                    <label class="campo campo-ancha">
                      <span class="campo-label">✉️ Correo</span>
                      <input
                        v-model="pedido.correo"
                        class="input-texto"
                        type="email"
                        placeholder="Correo opcional"
                      />
                      <button
                        v-if="mostrarBotonGuardarCorreo"
                        type="button"
                        class="btn-guardar-correo-cliente"
                        :disabled="!correoPedidoValido || guardandoCorreoCliente"
                        @click="guardarCorreoCliente"
                      >
                        <ion-icon :icon="mailOutline" />
                        {{ guardandoCorreoCliente ? 'Guardando...' : 'Guardar correo en perfil' }}
                      </button>
                    </label>
                  </div>
                </div>

                <div v-else class="wizard-panel">
                  <div class="ajustes-grid">
                    <div class="ajustes-col">
                      <label v-if="!clienteEncontrado" class="toggle-card toggle-card-soft">
                        <div>
                          <strong>Guardar cliente</strong>
                          <span>Añadirlo al directorio al crear la orden</span>
                        </div>
                        <ion-toggle v-model="pedido.guardarDirectorio" class="toggle-personalizado" />
                      </label>

                      <div class="descuento-zone">
                        <button class="descuento-btn" @click="mostrarDescuento = !mostrarDescuento">
                          <ion-icon :icon="pricetagOutline" />
                          ✨ Descuento manual
                        </button>
                        <div v-if="mostrarDescuento" class="descuento-input-row">
                          <input
                            v-model.number="pedido.descuentoManual"
                            class="input-texto input-descuento-mini"
                            type="number"
                            :min="0"
                            :max="pedido.descuentoManualTipo === 'porcentaje' ? 100 : undefined"
                            :placeholder="pedido.descuentoManualTipo === 'porcentaje' ? '%' : '$'"
                          />
                          <select v-model="pedido.descuentoManualTipo" class="input-texto input-descuento-mini select-mini">
                            <option value="porcentaje">%</option>
                            <option value="dinero">$</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div class="promos-box compact">
                      <div class="promos-header">
                        <ion-icon :icon="sparklesOutline" />
                        Promociones disponibles
                      </div>
                      <div v-if="promocionesAplicables.length" class="promo-grid">
                        <button
                          v-for="promo in promocionesAplicables"
                          :key="promo.id"
                          class="promo-card"
                          :class="{ active: promoSeleccionada?.id === promo.id }"
                          @click="seleccionarPromocion(promo)"
                        >
                          <span class="promo-emoji">🎉</span>
                          <strong>{{ promo.nombre }}</strong>
                          <span>{{ textoValorPromocion(promo) }}</span>
                        </button>
                      </div>
                      <p v-else class="promo-empty">No hay promociones para este cliente.</p>
                      <button v-if="promoSeleccionada" class="link-btn" @click="limpiarPromocion">
                        Quitar promoción
                      </button>
                    </div>
                  </div>
                </div>

                <div class="wizard-actions">
                  <button class="ghost-btn" :disabled="pasoClienteActiva === 0" @click="clientePasoAnterior">
                    Atrás
                  </button>
                  <button class="primary-btn" :disabled="!pasoActualPermiteAvanzar" @click="clientePasoSiguiente">
                    {{ pasoClienteActiva === pasosCliente.length - 1 ? 'Continuar' : 'Siguiente' }}
                  </button>
                </div>
              </div>
            </transition>
          </div>

          <div v-else-if="etapaActiva === 1" class="paso-contenido">
            <div class="buscador-row">
              <div class="search-bar">
                <ion-icon :icon="searchOutline" />
                <input v-model="busqueda" type="text" placeholder="Buscar productos..." />
              </div>
              <button class="ghost-btn" @click="irA('/tabs/productos')">Administrar servicios</button>
            </div>

            <div v-if="busquedaActiva" class="resultados-busqueda">
              <div class="resultados-busqueda-cabecera">
                <div>
                  <strong>Servicios encontrados</strong>
                  <span>{{ totalResultadosBusqueda }} coincidencia{{ totalResultadosBusqueda === 1 ? '' : 's' }} para “{{ busqueda.trim() }}”</span>
                </div>
                <button type="button" class="limpiar-busqueda" @click="busqueda = ''">Limpiar</button>
              </div>

              <div v-if="resultadosBusquedaPorCategoria.length === 0" class="estado-vacio">
                <ion-icon :icon="searchOutline" class="estado-icono" />
                <p class="estado-titulo">No encontramos servicios parecidos</p>
                <p class="estado-texto">Prueba con otro nombre o una palabra más corta.</p>
              </div>

              <section
                v-for="grupo in resultadosBusquedaPorCategoria"
                :key="grupo.id"
                class="grupo-resultados"
              >
                <div class="grupo-resultados-categoria">
                  <span class="categoria-chip" :style="{ background: grupo.color }"></span>
                  <div>
                    <span class="grupo-etiqueta">Categoría</span>
                    <strong>{{ grupo.nombre }}</strong>
                  </div>
                </div>

                <div class="lista-resultados-servicios">
                  <button
                    v-for="servicio in grupo.servicios"
                    :key="servicio.id"
                    type="button"
                    class="resultado-servicio"
                    :class="{ seleccionado: cantidadEnCarrito(servicio.id) > 0 }"
                    @click="agregarItem(servicio)"
                  >
                    <span class="servicio-icono resultado-icono">
                      <img v-if="servicio.imagenUrl" :src="servicio.imagenUrl" alt="" />
                      <ion-icon v-else :icon="obtenerIconoPorNombre(servicio.nombre)" />
                    </span>
                    <span class="resultado-servicio-info">
                      <span class="resultado-etiqueta">Item encontrado</span>
                      <strong>{{ servicio.nombre }}</strong>
                      <span>{{ etiquetaUnidad(servicio.unidad) }}</span>
                    </span>
                    <span class="resultado-precio">${{ servicio.precio.toFixed(2) }}</span>
                    <span v-if="cantidadEnCarrito(servicio.id) > 0" class="resultado-cantidad">
                      {{ cantidadEnCarrito(servicio.id) }}
                    </span>
                  </button>
                </div>
              </section>
            </div>

            <div v-else-if="vistaServicios === 'categorias'" class="categorias-view">
              <article
                v-for="cat in categoriasConConteo"
                :key="cat.id"
                class="categoria-card"
                @click="abrirCategoria(cat.id)"
              >
                <span class="categoria-chip" :style="{ background: cat.color }"></span>
                <div>
                  <strong>{{ cat.nombre }}</strong>
                  <span>{{ cat.cantidad }} servicio{{ cat.cantidad === 1 ? '' : 's' }}</span>
                </div>
                <ion-icon :icon="chevronForwardOutline" />
              </article>
            </div>

            <div v-else class="productos-view">
              <button class="volver-categorias" @click="volverACategorias">
                <ion-icon :icon="chevronBackOutline" />
                Volver a categorías
              </button>

              <div class="categoria-actual">
                <span class="categoria-chip" :style="{ background: categoriaActivaDetalle?.color ?? '#9fb4c9' }"></span>
                <div>
                  <strong>{{ categoriaActivaDetalle?.nombre ?? 'Sin categoría' }}</strong>
                  <span>{{ productosCategoriaActiva.length }} servicio{{ productosCategoriaActiva.length === 1 ? '' : 's' }}</span>
                </div>
              </div>

              <div v-if="productosCategoriaActiva.length === 0" class="estado-vacio">
                <ion-icon :icon="cubeOutline" class="estado-icono" />
                <p class="estado-titulo">No hay productos en esta categoría</p>
                <p class="estado-texto">Regresa a categorías o usa la búsqueda para encontrar otro servicio.</p>
              </div>

              <div v-else class="productos-carousel">
                <button class="carousel-nav" @click="slideProductoAnterior">
                  <ion-icon :icon="chevronBackOutline" />
                </button>

                <div ref="productosScroll" class="carousel-viewport">
                  <div class="carousel-track">
                    <button
                      v-for="servicio in productosCategoriaActiva"
                      :key="servicio.id"
                      class="producto-card"
                      :class="{ seleccionado: cantidadEnCarrito(servicio.id) > 0 }"
                      @click="agregarItem(servicio)"
                    >
                      <span v-if="cantidadEnCarrito(servicio.id) > 0" class="badge-seleccionado">
                        {{ cantidadEnCarrito(servicio.id) }}
                      </span>
                      <span class="servicio-icono">
                        <img v-if="servicio.imagenUrl" :src="servicio.imagenUrl" alt="" />
                        <ion-icon v-else :icon="obtenerIconoPorNombre(servicio.nombre)" />
                      </span>
                      <strong>{{ servicio.nombre }}</strong>
                      <span class="precio">${{ servicio.precio.toFixed(2) }}</span>
                      <span class="unidad">{{ etiquetaUnidad(servicio.unidad) }}</span>
                      <span class="accion">Agregar</span>
                    </button>
                  </div>
                </div>

                <button class="carousel-nav" @click="slideProductoSiguiente">
                  <ion-icon :icon="chevronForwardOutline" />
                </button>
              </div>
            </div>

            <div class="carrito-box compact">
              <div class="carrito-header">
                <strong>🛍️ Servicios seleccionados</strong>
                <span>{{ cantidadTotal }} piezas</span>
              </div>

              <div v-if="pedido.items.length === 0" class="carrito-vacio">
                Agrega servicios para comenzar.
              </div>

              <div v-else class="carrito-lista">
                <article v-for="item in pedido.items" :key="item.id" class="carrito-item">
                  <div class="carrito-info">
                    <strong>{{ item.nombre }}</strong>
                    <span>${{ item.precio.toFixed(2) }} / {{ etiquetaUnidad(item.unidad) }}</span>
                  </div>
                  <div class="carrito-cantidad">
                    <button @click="decrementar(item.id)">-</button>
                    <span>{{ item.cantidad }}</span>
                    <button @click="incrementar(item.id)">+</button>
                  </div>
                  <button class="quitar-btn" @click="quitarItem(item.id)">
                    <ion-icon :icon="trashOutline" />
                  </button>
                </article>
              </div>
            </div>

            <div class="step-actions">
              <button type="button" class="ghost-btn" @click="retrocederPaso">
                Atrás
              </button>
              <button
                class="primary-btn step-next-btn"
                :disabled="!pasoActualPermiteAvanzar"
                @click="etapaActiva = 2"
              >
                Siguiente
              </button>
            </div>
          </div>

          <div v-else-if="etapaActiva === 2" class="paso-contenido">
            <div class="prendas-seccion">
              <div class="prendas-card">
                <div class="prendas-header">
                  <h4>📊 Cantidad de prendas recibidas</h4>
                  <p>Este campo es obligatorio</p>
                </div>

                <div class="prendas-input-group">
                  <label class="campo">
                    <span class="campo-label">Número de prendas *</span>
                    <input
                      v-model.number="pedido.cantidadPrendas"
                      type="number"
                      min="1"
                      class="input-texto"
                      placeholder="Ej: 5"
                      :class="{ error: pedido.cantidadPrendas <= 0 }"
                    />
                    <p v-if="pedido.cantidadPrendas <= 0" class="ayuda-error">
                      Ingresa al menos una prenda
                    </p>
                  </label>
                </div>
              </div>

              <div class="prendas-card">
                <div class="prendas-header">
                  <h4>📝 Detalles adicionales</h4>
                  <p>Información opcional sobre las prendas</p>
                </div>

                <div class="prendas-textarea-group">
                  <label class="campo">
                    <span class="campo-label">Notas sobre las prendas (opcional)</span>
                    <textarea
                      v-model="pedido.detallesPrendas"
                      class="input-texto prendas-textarea"
                      rows="4"
                      placeholder="Ej: 2 pantalones dañados, 1 camisa con botones sueltos, manchas de grasa..."
                    ></textarea>
                    <p class="ayuda-texto">
                      {{ pedido.detallesPrendas.length }}/500 caracteres
                    </p>
                  </label>
                </div>
              </div>
            </div>

            <div class="step-actions">
              <button type="button" class="ghost-btn" @click="retrocederPaso">
                Atrás
              </button>
              <button class="primary-btn step-next-btn" :disabled="!pasoActualPermiteAvanzar" @click="avanzarPaso">
                Siguiente
              </button>
            </div>
          </div>

          <div v-else-if="etapaActiva === 3" class="paso-contenido">
            <label class="toggle-card horizontal">
              <div>
                <strong>Envío a domicilio</strong>
                <span>Activa el servicio si la entrega no será en mostrador</span>
              </div>
              <ion-toggle v-model="pedido.envioDomicilio" class="toggle-personalizado" />
            </label>

            <label v-if="pedido.envioDomicilio" class="campo direccion-entrega-box">
              <span class="campo-label">Dirección de entrega *</span>
              <textarea
                v-model="pedido.direccionEntrega"
                class="input-texto direccion-entrega-input"
                rows="3"
                placeholder="Colonia, calle, número, referencias y municipio"
              ></textarea>
            </label>

            <label class="toggle-card horizontal">
              <div>
                <strong>Fecha estimada de entrega</strong>
                <span>Define cuándo quedará listo el pedido</span>
              </div>
              <ion-toggle v-model="pedido.fechaEntregaActiva" class="toggle-personalizado" />
            </label>

            <div v-if="pedido.fechaEntregaActiva" class="fecha-grid">
              <div class="campo">
                <label>Fecha</label>
                <input v-model="pedido.fechaEntrega" class="input-texto" type="date" :min="fechaMinima" />
              </div>
              <div class="campo">
                <label>Hora</label>
                <input v-model="pedido.horaEntrega" class="input-texto" type="time" />
              </div>
            </div>

            <div class="estado-pago">
              <strong>💳 Estado de pago</strong>
              <div class="botones-fila">
                <button
                  class="estado-btn"
                  :class="{ active: pedido.estadoPago === 'porCobrar' }"
                  @click="pedido.estadoPago = 'porCobrar'"
                >
                  Por cobrar
                </button>
                <button
                  class="estado-btn"
                  :class="{ active: pedido.estadoPago === 'anticipo' }"
                  @click="pedido.estadoPago = 'anticipo'"
                >
                  Anticipo
                </button>
                <button
                  class="estado-btn"
                  :class="{ active: pedido.estadoPago === 'pagado' }"
                  @click="pedido.estadoPago = 'pagado'"
                >
                  Pagado
                </button>
              </div>
            </div>

            <div v-if="pedido.estadoPago === 'pagado' || pedido.estadoPago === 'anticipo'" class="estado-pago">
              <strong>✨ Método de pago</strong>
              <div class="botones-fila">
                <button
                  class="estado-btn"
                  :class="{ active: pedido.metodoPago === 'efectivo' }"
                  @click="pedido.metodoPago = 'efectivo'"
                >
                  <ion-icon :icon="cashOutline" />
                  Efectivo
                </button>
                <button
                  class="estado-btn"
                  :class="{ active: pedido.metodoPago === 'tarjeta' }"
                  @click="pedido.metodoPago = 'tarjeta'"
                >
                  <ion-icon :icon="cardOutline" />
                  Tarjeta
                </button>
                <button
                  class="estado-btn"
                  :class="{ active: pedido.metodoPago === 'transferencia' }"
                  @click="pedido.metodoPago = 'transferencia'"
                >
                  <ion-icon :icon="swapHorizontalOutline" />
                  Transferencia
                </button>
              </div>

              <div v-if="pedido.metodoPago === 'efectivo'" class="montos-rapidos">
                <button
                  v-for="monto in montosRapidos"
                  :key="monto"
                  class="monto-chip"
                  :class="{ active: pedido.montoRecibido === monto }"
                  @click="pedido.montoRecibido = monto"
                >
                  ${{ monto.toFixed(2) }}
                </button>
                <span class="cambio-texto">
                  Cambio: <strong>${{ cambio.toFixed(2) }}</strong>
                </span>
                <div class="monto-input campos-efectivo">
                  <span>$</span>
                  <input
                    v-model.number="pedido.montoRecibido"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Otro monto"
                    aria-label="Monto recibido en efectivo"
                  />
                </div>
              </div>

              <!-- Campos adicionales para tarjeta -->
              <div v-if="pedido.metodoPago === 'tarjeta'" class="campos-tarjeta">
                <label class="campo-label">Monto pagado con tarjeta</label>
                <div class="monto-input">
                  <span>$</span>
                  <input v-model.number="pedido.tarjetaMonto" type="number" min="0" step="0.01" placeholder="0.00" />
                </div>
                <label class="campo-label">Número de referencia POS</label>
                <input v-model="pedido.tarjetaReferencia" type="text" placeholder="Últimos 4 dígitos" maxlength="10" />
              </div>

              <!-- Campos adicionales para transferencia -->
              <div v-if="pedido.metodoPago === 'transferencia'" class="campos-transferencia">
                <label class="campo-label">Monto transferido</label>
                <div class="monto-input">
                  <span>$</span>
                  <input v-model.number="pedido.transferenciaMonto" type="number" min="0" step="0.01" placeholder="0.00" />
                </div>
                <label class="campo-label">Comprobante de transferencia</label>
                  <input type="file" accept="image/*" :disabled="subiendoComprobante" @change="subirComprobanteTransferencia" />
                <a v-if="pedido.transferenciaComprobante" class="comprobante-link" :href="pedido.transferenciaComprobante" target="_blank" rel="noreferrer">📷 Ver comprobante cargado</a>
              </div>
            </div>

            <div class="step-actions">
              <button type="button" class="ghost-btn" @click="retrocederPaso">
                Atrás
              </button>
              <button class="primary-btn step-next-btn" :disabled="!pasoActualPermiteAvanzar" @click="avanzarPaso">
                Siguiente
              </button>
            </div>
          </div>

          <div v-else class="paso-contenido">
            <div class="fotos-box">
              <div class="fotos-header">
                <strong>📸 Fotos opcionales</strong>
                <span>{{ (pedido.fotos ?? []).length }}/{{ MAX_FOTOS_PEDIDO }}</span>
              </div>
              <label class="upload-btn">
                <ion-icon :icon="imageOutline" />
                Agregar fotos
                <input type="file" accept="image/*" multiple hidden @change="manejarFotosPedido" />
              </label>
              <div v-if="pedido.fotos?.length" class="fotos-preview">
                <div v-for="(foto, index) in pedido.fotos" :key="`${foto}-${index}`" class="foto-item">
                  <img :src="foto" alt="Foto de la orden" />
                  <button type="button" class="quitar-foto" @click="quitarFoto(index)">
                    <ion-icon :icon="closeOutline" />
                  </button>
                </div>
              </div>
            </div>

            <div class="resumen-box">
              <div class="resumen-linea">
                <span>Cliente</span>
                <strong>{{ pedido.nombreCliente || 'Sin nombre' }}</strong>
              </div>
              <div class="resumen-linea">
                <span>Servicios</span>
                <strong>{{ cantidadTotal }}</strong>
              </div>
              <div class="resumen-linea">
                <span>Prendas recibidas</span>
                <strong>{{ pedido.cantidadPrendas }}</strong>
              </div>
              <div class="resumen-linea">
                <span>Total</span>
                <strong>${{ total.toFixed(2) }}</strong>
              </div>
              <div class="resumen-linea">
                <span>Recibido</span>
                    <strong>${{ Number(pedido.montoRecibido || 0).toFixed(2) }}</strong>
              </div>
              <div class="resumen-linea">
                <span>Cambio</span>
                <strong>${{ cambio.toFixed(2) }}</strong>
              </div>
              <div class="resumen-linea">
                <span>Descuento aplicado</span>
                <strong>${{ (descuentoPromocionMonto + descuentoManualMonto).toFixed(2) }}</strong>
              </div>

              <label v-if="esAdministrador" class="toggle-check orden-correo-toggle">
                <input v-model="enviarCorreoAlCrear" type="checkbox" :disabled="!pedido.correo.trim()" />
                Enviar confirmación por correo al crear
              </label>
              <p v-if="esAdministrador && !pedido.correo.trim()" class="hint-texto-vacio">
                Agrega un correo del cliente para habilitar esta opción.
              </p>

              <div v-if="hayFaltantesStock" class="alerta-stock">
                Hay insumos insuficientes para esta orden. Revisa los faltantes antes de continuar.
              </div>

              <div class="acciones-finales">
                  <button type="button" class="ghost-btn" @click="retrocederPaso">
                    Atrás
                  </button>
                <button type="button" class="primary-btn" :disabled="!puedeCrearOrden || creandoOrden" @click="crearOrdenConCliente">
                  {{ creandoOrden ? 'Creando...' : 'Crear orden' }}
                </button>
              </div>
            </div>
          </div>
        </section>

        <aside class="panel-lateral">
          <div class="factura-card">
            <div class="factura-header">
              <div>
                <p class="panel-etiqueta">🧾 Factura </p>
              </div>
              <span class="factura-badge">{{ cantidadTotal }} ítems</span>
            </div>

            <div class="factura-linea subtotal">
              <span>Subtotal</span>
              <strong>${{ subtotal.toFixed(2) }}</strong>
            </div>
            <div class="factura-linea descuento">
              <span>Promoción ({{ promoSeleccionada ? textoValorPromocion(promoSeleccionada) : 'sin aplicar' }})</span>
              <strong>-${{ descuentoPromocionMonto.toFixed(2) }}</strong>
            </div>
            <div class="factura-linea descuento">
              <span>Descuento manual ({{ pedido.descuentoManualTipo === 'porcentaje' ? `${Number(pedido.descuentoManual || 0).toFixed(2)}%` : `$${Number(pedido.descuentoManual || 0).toFixed(2)}` }})</span>
              <strong>-${{ descuentoManualMonto.toFixed(2) }}</strong>
            </div>
            <div class="factura-linea total">
              <span>Total</span>
              <strong>${{ total.toFixed(2) }}</strong>
            </div>
            <div class="factura-linea">
              <span>Cliente</span>
              <strong>{{ pedido.nombreCliente || 'Sin nombre' }}</strong>
            </div>
            <div class="factura-linea">
              <span>Prendas recibidas</span>
              <strong>{{ pedido.cantidadPrendas }}</strong>
            </div>
            <div class="factura-linea">
              <span>Entrega</span>
              <strong>{{ pedido.fechaEntregaActiva ? fechaEntregaTexto : 'Sin fecha' }}</strong>
            </div>
            <div class="factura-linea">
              <span>Pago</span>
              <strong>{{ pedido.estadoPago }}</strong>
            </div>
            <div class="factura-linea">
              <span>{{ pedido.estadoPago === 'anticipo' ? 'Anticipo recibido' : 'Pago recibido' }}</span>
              <strong>${{ Number(pedido.montoRecibido || 0).toFixed(2) }}</strong>
            </div>
            <div class="factura-linea">
              <span>Saldo pendiente</span>
              <strong>${{ saldoPendiente.toFixed(2) }}</strong>
            </div>

            <div class="factura-mini-items">
              <article v-for="item in pedido.items.slice(0, 3)" :key="item.id" class="factura-item">
                <span>{{ item.nombre }}</span>
                <strong>{{ item.cantidad }}</strong>
              </article>
              <p v-if="pedido.items.length === 0" class="factura-vacia">Aún no agregas servicios.</p>
              <p v-else-if="pedido.items.length > 3" class="factura-mas">
                +{{ pedido.items.length - 3 }} servicios más
              </p>
            </div>
          </div>

          <div class="tarjeta-resumen acciones-card">
            <p class="panel-etiqueta">Cancelar</p>
            <button class="cancel-order-btn" @click="reiniciarFlujo">
              Cancelar pedido
            </button>
            <p class="acciones-texto">Se limpia el carrito y vuelves al inicio del flujo.</p>
          </div>
        </aside>
      </div>
    </div>

    <ion-modal :is-open="mostrarAdvertenciaStock" class="modal-stock" @didDismiss="cerrarAdvertenciaStock">
      <div class="modal-stock-contenido">
        <div class="modal-stock-header">
          <div class="modal-stock-icono">!</div>
          <div>
            <p class="modal-stock-titulo">No hay suficientes insumos</p>
            <p class="modal-stock-subtitulo">
              Revisa los faltantes antes de continuar con la orden.
            </p>
          </div>
        </div>

        <div class="modal-stock-lista">
          <article v-for="insumo in faltantesStockModal" :key="insumo.productoId" class="modal-stock-item">
            <div>
              <strong>{{ insumo.nombreProducto }}</strong>
              <span>
                Requiere {{ insumo.requerido.toFixed(2) }} {{ etiquetaUnidadInventario(insumo.unidadMedida) }}
                y hay {{ insumo.disponible.toFixed(2) }}
              </span>
            </div>
            <p class="modal-stock-faltante">
              Faltan {{ insumo.faltante.toFixed(2) }} {{ etiquetaUnidadInventario(insumo.unidadMedida) }}
            </p>
          </article>
        </div>

        <div class="modal-stock-pregunta">¿Quieres continuar con la orden?</div>

        <div class="modal-stock-botones">
          <button type="button" class="ghost-btn" @click="cancelarOrdenSinStock">No, cancelar</button>
          <button type="button" class="primary-btn" @click="continuarOrdenSinStock">Sí, continuar</button>
        </div>
      </div>
    </ion-modal>

    <ion-modal :is-open="mostrarModalCorreo" class="modal-correo-modal" @didDismiss="cerrarModalCorreo">
      <div class="modal-correo">
        <h3>Enviar factura por correo</h3>
        <p>Ingresa el correo electrónico donde deseas enviar la factura:</p>
        <input
          v-model="correoManual"
          type="email"
          placeholder="ejemplo@correo.com"
          class="input-correo"
        />
        <div class="modal-correo-botones">
          <button class="btn-cancelar" @click="cerrarModalCorreo">Cancelar</button>
          <button class="btn-enviar" :disabled="!correoManual || enviandoCorreo" @click="enviarCorreoManual">
            {{ enviandoCorreo ? 'Enviando...' : 'Enviar' }}
          </button>
        </div>
      </div>
    </ion-modal>
  </section>
</template>

<script setup lang="ts">
import { IonIcon, IonModal, IonToggle, toastController } from '@ionic/vue'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { enviarFacturaOrdenPorCorreo, generarHtmlFacturaOrden, usePedido, type ItemPedido } from '@/composables/Usepedido'
import { useCatalogo } from '@/composables/Usecatalogo'
import { buscarClientePorTelefono, agregarCliente, type ClienteConEstado, editarCliente as editarClienteAPI, useClientes } from '@/composables/useClientes'
import { usePromociones, type Promocion } from '@/composables/usePromociones'
import { ZONA_HORARIA_NEGOCIO } from '@/composables/useFechas'
import { useSesion } from '@/composables/useSesion'
import { obtenerIconoPorNombre } from '@/composables/iconosPrendas'
import { getApiBaseUrl } from '@/composables/useApiConfig'
import logoTicket from '@/assets/logo.jpg' // usa el mismo logo que ya usas en AppShell; ajusta el nombre si tu logo de ticket es otro archivo

const obtenerImagenBase64 = async (rutaImagen: string): Promise<string> => {
  try {
    const respuesta = await fetch(rutaImagen)
    const blob = await respuesta.blob()
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(blob)
    })
  } catch {
    return ''
  }
}
import {
  calendarOutline,
  cashOutline,
  cardOutline,
  checkmarkCircleOutline,
  closeOutline,
  cubeOutline,
  chevronBackOutline,
  chevronForwardOutline,
  globeOutline,
  imageOutline,
  mailOutline,
  logoWhatsapp,
  printOutline,
  pricetagOutline,
  refreshOutline,
  searchOutline,
  sparklesOutline,
  starOutline,
  swapHorizontalOutline,
  trashOutline,
} from 'ionicons/icons'

const router = useRouter()
const { servicios, categorias: categoriasCatalogo, cargarCatalogo } = useCatalogo()
const { obtenerPromocionesAplicables } = usePromociones()
const { clientesConEstado } = useClientes()
const { esAdministrador } = useSesion()

const {
  pedido,
  subtotal,
  total,
  cambio,
  descuentoTotal,
  cantidadTotal,
  cantidadPrendasServicios,
  telefonoValido,
  turnoAbierto,
  ultimaOrdenCreada,
  fechaEntregaTexto,
  fechaMinima,
  puedeCrearOrden,
  agregarItem,
  incrementar,
  decrementar,
  quitarItem,
  cantidadEnCarrito,
  crearOrden,
  limpiarUltimaOrdenCreada,
  reiniciarPedido,
  hayFaltantesStock
} = usePedido()

const irA = (ruta: string) => router.push(ruta).catch(() => {})

const manejarTeclaOrden = (event: KeyboardEvent) => {
  if (event.key !== 'Enter' || event.target instanceof HTMLTextAreaElement) return

  event.preventDefault()
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) {
    if (etapaActiva.value === 0) clientePasoSiguiente()
    else if (etapaActiva.value < pasos.length - 1) avanzarPaso()
    else crearOrdenConCliente()
  }
}

const pasos = [
  {
    id: 'cliente',
    title: 'Cliente'
  },
  {
    id: 'servicios',
    title: 'Servicios'
  },
  {
    id: 'prendas',
    title: 'Prendas'
  },
  {
    id: 'entrega',
    title: 'Entrega y pago'
  },
  {
    id: 'revision',
    title: 'Revisión'
  }
]

const etapaActiva = ref(0)
const pasoClienteActiva = ref(0)
const vistaServicios = ref<'categorias' | 'productos'>('categorias')
const categoriaActivaId = ref<string | null>(null)
const productoSlideIndex = ref(0)
const productosScroll = ref<HTMLElement | null>(null)
const mostrarDescuento = ref(false)
const clienteEncontrado = ref<ClienteConEstado | null>(null)
const promoSeleccionada = ref<Promocion | null>(null)
const montosRapidos = [5, 10, 20, 50]
const MAX_FOTOS_PEDIDO = 6
const busqueda = ref('')
const mostrarAdvertenciaStock = ref(false)
const faltantesStockModal = ref<
  Array<{
    productoId: string
    nombreProducto: string
    unidadMedida: string
    requerido: number
    disponible: number
    faltante: number
  }>
>([])
const mostrarModalCorreo = ref(false)
const correoManual = ref('')
const enviandoCorreo = ref(false)

const pasosCliente = [
  {
    id: 'datos',
    title: 'Datos del cliente',
    description: 'Ingresa la información de contacto del cliente.'
  },
  {
    id: 'promocion',
    title: 'Promociones y descuento',
    description: 'Selecciona una promoción o agrega un descuento manual.'
  }
]

const categoriasConConteo = computed(() => {
  const conteoPorCategoria = new Map<string, number>()
  for (const item of servicios.value) {
    const clave = item.categoriaId ?? 'sin-categoria'
    conteoPorCategoria.set(clave, (conteoPorCategoria.get(clave) ?? 0) + 1)
  }

  return categoriasCatalogo.value.map((categoria) => ({
    id: categoria.id,
    nombre: categoria.nombre,
    color: categoria.color,
    cantidad: conteoPorCategoria.get(categoria.id) ?? 0
  }))
})

const categoriaActivaDetalle = computed(
  () => categoriasCatalogo.value.find((categoria) => categoria.id === categoriaActivaId.value) ?? null
)

const productosCategoriaActiva = computed(() => {
  const consulta = normalizarTextoBusqueda(busqueda.value)
  if (!categoriaActivaId.value) return []

  let lista = servicios.value.filter((item) => item.categoriaId === categoriaActivaId.value)
  if (consulta) {
    lista = lista.filter((item) => normalizarTextoBusqueda(item.nombre).includes(consulta))
  }
  return lista
})

const normalizarTextoBusqueda = (texto: string) =>
  texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim()

const busquedaActiva = computed(() => Boolean(normalizarTextoBusqueda(busqueda.value)))

const resultadosBusquedaPorCategoria = computed(() => {
  const consulta = normalizarTextoBusqueda(busqueda.value)
  if (!consulta) return []

  const serviciosEncontrados = servicios.value.filter((servicio) =>
    normalizarTextoBusqueda(servicio.nombre).includes(consulta)
  )
  const serviciosPorCategoria = new Map<string, typeof serviciosEncontrados>()

  for (const servicio of serviciosEncontrados) {
    const categoriaId = servicio.categoriaId ?? 'sin-categoria'
    const lista = serviciosPorCategoria.get(categoriaId) ?? []
    lista.push(servicio)
    serviciosPorCategoria.set(categoriaId, lista)
  }

  const categoriasOrdenadas = [
    ...categoriasCatalogo.value.map((categoria) => ({
      id: categoria.id,
      nombre: categoria.nombre,
      color: categoria.color
    })),
    { id: 'sin-categoria', nombre: 'Sin categoría', color: '#9fb4c9' }
  ]

  return categoriasOrdenadas
    .map((categoria) => ({ ...categoria, servicios: serviciosPorCategoria.get(categoria.id) ?? [] }))
    .filter((grupo) => grupo.servicios.length > 0)
})

const totalResultadosBusqueda = computed(() =>
  resultadosBusquedaPorCategoria.value.reduce((total, grupo) => total + grupo.servicios.length, 0)
)

watch(productosCategoriaActiva, (lista) => {
  productoSlideIndex.value = Math.min(productoSlideIndex.value, Math.max(0, lista.length - 1))
})

const promocionesAplicables = computed(() =>
  obtenerPromocionesAplicables(
    !!clienteEncontrado.value,
    clienteEncontrado.value?.esRecurrente ?? false,
    clienteEncontrado.value?.totalOrdenes ?? 0
  )
)

const clientesSugeridos = computed(() => {
  const consulta = pedido.nombreCliente.trim().toLowerCase()
  if (clienteEncontrado.value || consulta.length < 2) return []

  return clientesConEstado.value
    .filter((cliente) => cliente.nombre.toLowerCase().includes(consulta))
    .slice(0, 8)
})

const limpiarClienteSeleccionado = () => {
  clienteEncontrado.value = null
}

const seleccionarCliente = (cliente: ClienteConEstado) => {
  const codigoPais = normalizarTelefono(pedido.codigoPais || '503')
  const celular = normalizarTelefono(cliente.celular)
  const telefonoLocal = celular.startsWith(codigoPais) && celular.length > codigoPais.length
    ? celular.slice(codigoPais.length)
    : celular

  clienteEncontrado.value = cliente
  pedido.nombreCliente = cliente.nombre
  pedido.telefono = telefonoLocal
  pedido.correo = cliente.correo || ''
  pedido.guardarDirectorio = true
}

const guardandoCorreoCliente = ref(false)

const correoPedidoValido = computed(() =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pedido.correo.trim())
)

const mostrarBotonGuardarCorreo = computed(() =>
  !!clienteEncontrado.value && !(clienteEncontrado.value.correo && clienteEncontrado.value.correo.trim())
)

const guardarCorreoCliente = async () => {
  if (!clienteEncontrado.value || !correoPedidoValido.value || guardandoCorreoCliente.value) return

  guardandoCorreoCliente.value = true

  try {
    const nuevoCorreo = pedido.correo.trim()
    editarClienteAPI(clienteEncontrado.value.id, {
      nombre: clienteEncontrado.value.nombre,
      celular: clienteEncontrado.value.celular,
      correo: nuevoCorreo
    })

    clienteEncontrado.value = { ...clienteEncontrado.value, correo: nuevoCorreo }

    const toast = await toastController.create({
      message: 'Correo guardado en el perfil del cliente',
      duration: 2000,
      color: 'success'
    })
    toast.present()
  } catch (error: any) {
    const toast = await toastController.create({
      message: error.message || 'No se pudo guardar el correo',
      duration: 2000,
      color: 'danger'
    })
    toast.present()
  } finally {
    guardandoCorreoCliente.value = false
  }
}

const descuentoPromocionMonto = computed(() =>
  pedido.descuentoPromocionTipo === 'dinero'
    ? Math.min(Math.max(0, Number(pedido.descuentoPromocion || 0)), subtotal.value)
    : Math.max(0, subtotal.value * Number(pedido.descuentoPromocion || 0) / 100)
)
const textoValorPromocion = (promo: Promocion) =>
  promo.tipoDescuento === 'porcentaje'
    ? `${Number(promo.valor).toFixed(2)}%`
    : `$${Number(promo.valor).toFixed(2)}`

const descuentoManualMonto = computed(() => {
  const valor = Number(pedido.descuentoManual || 0)
  if (pedido.descuentoManualTipo === 'dinero') {
    return Math.min(Math.max(0, valor), subtotal.value)
  }
  return Math.max(0, subtotal.value * valor / 100)
})
const saldoPendiente = computed(() => Math.max(0, total.value - pedido.montoRecibido))

const pasoActualPermiteAvanzar = computed(() => {
  if (etapaActiva.value === 0) {
    return pedido.nombreCliente.trim().length > 0 && telefonoValido.value
  }
  if (etapaActiva.value === 1) {
    return pedido.items.length > 0
  }
  if (etapaActiva.value === 2) {
    return pedido.cantidadPrendas > 0
  }
  if (etapaActiva.value === 3) {
    const domicilioValido = !pedido.envioDomicilio || pedido.direccionEntrega.trim().length > 0
    const entregaValida = !pedido.fechaEntregaActiva || Boolean(pedido.fechaEntrega && pedido.horaEntrega)
    return domicilioValido && entregaValida
  }
  return true
})

const irAPaso = (paso: number) => {
  if (paso <= etapaActiva.value) etapaActiva.value = paso
}

const avanzarPaso = () => {
  if (!pasoActualPermiteAvanzar.value) return
  etapaActiva.value = Math.min(pasos.length - 1, etapaActiva.value + 1)
}

const retrocederPaso = () => {
  if (etapaActiva.value <= 0) return

  etapaActiva.value -= 1
  if (etapaActiva.value === 0) {
    pasoClienteActiva.value = 0
  }
}

const horaActualCentroamerica = () =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: ZONA_HORARIA_NEGOCIO,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date())

const abrirNuevaOrden = () => {
  etapaActiva.value = 0
  pasoClienteActiva.value = 0
  vistaServicios.value = 'categorias'
  categoriaActivaId.value = null
  productoSlideIndex.value = 0
}

const reiniciarFlujo = () => {
  reiniciarPedido()
  pedido.codigoPais = '+503'
  pedido.fechaEntregaActiva = true
  pedido.fechaEntrega = fechaMinima
  pedido.horaEntrega = horaActualCentroamerica()
  pedido.estadoPago = 'porCobrar'
  pedido.metodoPago = 'efectivo'
  pedido.montoRecibido = 0
  pedido.guardarDirectorio = false
  pedido.descuento = 0
  pedido.descuentoManual = 0
  pedido.descuentoPromocion = 0
  pedido.envioDomicilio = false
  pedido.direccionEntrega = ''
  pedido.fotos = []
  enviarCorreoAlCrear.value = true
  pedido.items.splice(0, pedido.items.length)
  busqueda.value = ''
  pasoClienteActiva.value = 0
  vistaServicios.value = 'categorias'
  categoriaActivaId.value = null
  productoSlideIndex.value = 0
  mostrarDescuento.value = false
  clienteEncontrado.value = null
  promoSeleccionada.value = null
  mostrarAdvertenciaStock.value = false
  faltantesStockModal.value = []
  limpiarUltimaOrdenCreada()
  etapaActiva.value = 0
}

const normalizarTelefono = (telefono: string) => telefono.replace(/\D/g, '')

let tokenBusquedaCliente = 0

const buscarCliente = async (telefono: string) => {
  const codigoPais = normalizarTelefono(pedido.codigoPais || '503')
  const normalizado = normalizarTelefono(telefono)
  const tokenActual = ++tokenBusquedaCliente

  if (normalizado.length < 7) {
    clienteEncontrado.value = null
    return
  }

  const numeroCompleto = normalizado.startsWith(codigoPais)
    ? normalizado
    : `${codigoPais}${normalizado}`

  const resultado = await buscarClientePorTelefono(numeroCompleto)
  if (tokenActual !== tokenBusquedaCliente) return // respuesta vieja, se ignora

  clienteEncontrado.value = resultado
  if (resultado) {
    pedido.nombreCliente = resultado.nombre
    pedido.correo = resultado.correo || ''
    if (resultado.esRecurrente) {
      pedido.guardarDirectorio = true
    }
  }
}

const subirComprobanteTransferencia = async (event: Event) => {
  if (subiendoComprobante.value) return
  const input = event.target as HTMLInputElement
  const archivo = input.files?.[0]
  input.value = ''
  if (!archivo) return
  subiendoComprobante.value = true

  try {
    const formulario = new FormData()
    formulario.append('imagen', archivo)
    const respuesta = await fetch(`${getApiBaseUrl()}/comprobantes/imagen`, {
      method: 'POST',
      body: formulario
    })
    const datos = await respuesta.json().catch(() => null)
    if (!respuesta.ok || typeof datos?.url !== 'string') {
      throw new Error(datos?.error ?? 'No se pudo subir el comprobante.')
    }
    pedido.transferenciaComprobante = datos.url
  } catch (error) {
    console.error('Error al subir comprobante:', error)
    alert('No se pudo subir el comprobante. Intenta nuevamente.')
  } finally {
    subiendoComprobante.value = false
  }
}

watch(() => pedido.telefono, buscarCliente)
watch(() => pedido.codigoPais, () => buscarCliente(pedido.telefono))

// Limpiar campos específicos de pago cuando cambia el método
watch(() => pedido.metodoPago, (nuevoMetodo) => {
  if (nuevoMetodo === 'efectivo') {
    pedido.tarjetaMonto = 0
    pedido.tarjetaReferencia = ''
    pedido.transferenciaMonto = 0
    pedido.transferenciaComprobante = ''
  } else if (nuevoMetodo === 'tarjeta') {
    pedido.transferenciaMonto = 0
    pedido.transferenciaComprobante = ''
    pedido.montoRecibido = Number(pedido.tarjetaMonto || 0)
  } else if (nuevoMetodo === 'transferencia') {
    pedido.tarjetaMonto = 0
    pedido.tarjetaReferencia = ''
    pedido.montoRecibido = Number(pedido.transferenciaMonto || 0)
  }
})

watch(() => pedido.tarjetaMonto, (monto) => {
  if (pedido.metodoPago === 'tarjeta') {
    pedido.montoRecibido = Number(monto || 0)
  }
})

watch(() => pedido.transferenciaMonto, (monto) => {
  if (pedido.metodoPago === 'transferencia') {
    pedido.montoRecibido = Number(monto || 0)
  }
})

const guardarClienteEnDirectorio = async () => {
  if (!pedido.guardarDirectorio) return true

  const nombre = pedido.nombreCliente.trim()
  const codigoPais = pedido.codigoPais.trim()
  const telefono = pedido.telefono.trim()
  const correo = pedido.correo.trim()

  if (!nombre || !telefono) {
    return false
  }

  try {
    if (clienteEncontrado.value) return true
    const numeroCompleto = `${codigoPais}${telefono}`.replace(/\D/g, '')
    agregarCliente({ nombre, celular: numeroCompleto, correo: correo || '' })
    return true
  } catch (error) {
    console.error('Error al guardar cliente:', error)
    return false
  }
}

const seleccionarPromocion = (promo: Promocion) => {
  if (promoSeleccionada.value?.id === promo.id) {
    limpiarPromocion()
    return
  }

  promoSeleccionada.value = promo
  pedido.descuentoPromocionTipo = promo.tipoDescuento
  pedido.descuentoPromocion = promo.valor
}

const limpiarPromocion = () => {
  promoSeleccionada.value = null
  pedido.descuentoPromocion = 0
  pedido.descuentoPromocionTipo = 'porcentaje'
}

const clientePasoSiguiente = () => {
  if (pasoClienteActiva.value === 0 && (!telefonoValido.value || !pedido.nombreCliente.trim())) return
  if (pasoClienteActiva.value === pasosCliente.length - 1) {
    etapaActiva.value = 1
    return
  }
  pasoClienteActiva.value = Math.min(pasosCliente.length - 1, pasoClienteActiva.value + 1)
}

const clientePasoAnterior = () => {
  if (pasoClienteActiva.value === 0) return
  pasoClienteActiva.value = Math.max(0, pasoClienteActiva.value - 1)
}

const abrirCategoria = (categoriaId: string) => {
  categoriaActivaId.value = categoriaId
  productoSlideIndex.value = 0
  vistaServicios.value = 'productos'
}

const volverACategorias = () => {
  vistaServicios.value = 'categorias'
  productoSlideIndex.value = 0
}

const slideProductoAnterior = () => {
  productoSlideIndex.value = Math.max(0, productoSlideIndex.value - 1)
  productosScroll.value?.scrollBy({ left: -420, behavior: 'smooth' })
}

const slideProductoSiguiente = () => {
  productoSlideIndex.value += 1
  productosScroll.value?.scrollBy({ left: 420, behavior: 'smooth' })
}

const manejarFotosPedido = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input?.files?.length) return

  const archivos = Array.from(input.files).slice(0, MAX_FOTOS_PEDIDO - (pedido.fotos?.length ?? 0))
  const nuevasFotos = await Promise.all(
    archivos.map(
      (archivo) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = () => reject(reader.error)
          reader.readAsDataURL(archivo)
        })
    )
  )

  pedido.fotos = [...(pedido.fotos ?? []), ...nuevasFotos]
  input.value = ''
}

const quitarFoto = (index: number) => {
  if (!pedido.fotos) return
  pedido.fotos.splice(index, 1)
}

const creandoOrden = ref(false)
const subiendoComprobante = ref(false)
const enviarCorreoAlCrear = ref(true)

const enviarConfirmacionCorreo = async (orden: any) => {
  if (!orden?.correo || !enviarCorreoAlCrear.value || !esAdministrador.value) return

  try {
    await enviarFacturaOrdenPorCorreo({
      numero: orden.numero,
      nombreCliente: orden.nombreCliente,
      createdAt: orden.createdAt,
      total: orden.total,
      subtotal: orden.subtotal,
      descuento: orden.descuento,
      items: orden.items,
      correo: orden.correo,
      fechaEntregaActiva: orden.fechaEntregaActiva,
      fechaEntregaTexto: orden.fechaEntregaActiva ? fechaEntregaTexto.value : '',
      cantidadPrendas: orden.cantidadPrendas,
      detallesPrendas: orden.detallesPrendas,
      estado: orden.estado,
      estadoPago: orden.estadoPago,
      montoRecibido: orden.montoRecibido
    })
  } catch (error) {
    console.error('No se pudo enviar la confirmación por correo:', error)
    const toast = await toastController.create({
      message: 'La orden se creó, pero no se pudo enviar el correo.',
      duration: 3000,
      color: 'warning'
    })
    await toast.present()
  }
}

const crearOrdenConCliente = async () => {
  if (!pasoActualPermiteAvanzar.value || !turnoAbierto.value || creandoOrden.value) {
    return
  }

  creandoOrden.value = true

  try {
    if (pedido.guardarDirectorio) {
      const guardado = await guardarClienteEnDirectorio()
      if (!guardado) {
        window.alert('No se pudo guardar el cliente. Verifica que hayas ingresado nombre y teléfono.')
        return
      }
    }

    const resultado = await crearOrden()

    if (resultado?.error) {
      window.alert(`No se pudo crear la orden: ${resultado.error}`)
      return
    }

    if (resultado && 'faltantes' in resultado && resultado.faltantes.length > 0) {
      faltantesStockModal.value = resultado.faltantes
      mostrarAdvertenciaStock.value = true
      return
    }

    await enviarConfirmacionCorreo(resultado?.orden)
  } finally {
    creandoOrden.value = false
  }
}

const cerrarAdvertenciaStock = async () => {
  mostrarAdvertenciaStock.value = false
  await nextTick()
}

const continuarOrdenSinStock = async () => {
  if (creandoOrden.value) return
  creandoOrden.value = true

  try {
  await cerrarAdvertenciaStock()
  if (pedido.guardarDirectorio) {
    const guardado = await guardarClienteEnDirectorio()
    if (!guardado) {
      window.alert('No se pudo guardar el cliente. Verifica que hayas ingresado nombre y teléfono.')
      return
    }
  }

  const resultado = await crearOrden({ forzarSinStock: true })

  if (resultado?.error) {
    window.alert(`No se pudo crear la orden: ${resultado.error}`)
  }
  } finally {
    creandoOrden.value = false
  }
}

const cancelarOrdenSinStock = async () => {
  await cerrarAdvertenciaStock()
  reiniciarFlujo()
}

const escaparHtml = (valor: string) =>
  valor
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

const construirMensajeWhatsApp = () => {
  if (!ultimaOrdenCreada.value) return ''

  const orden = ultimaOrdenCreada.value

  // --- Helpers para alinear texto en las secciones "monospace" (estilo ticket) ---
  const pad = (texto: string, ancho: number) =>
    texto.length >= ancho ? texto.slice(0, ancho) : texto + ' '.repeat(ancho - texto.length)

  const padIzq = (texto: string, ancho: number) =>
    texto.length >= ancho ? texto.slice(0, ancho) : ' '.repeat(ancho - texto.length) + texto

  const formatoMonto = (monto: number) => {
    const signo = monto < 0 ? '-' : ''
    return `${signo}$${Math.abs(monto).toFixed(2)}`
  }

  const lineaItem = (item: ItemPedido) => {
    const cantidad = Number(item.cantidad) || 0
    const precioUnitario = Number(item.precio) || 0
    const subtotalServicio = precioUnitario * cantidad
    return [
      `${cantidad}x ${item.nombre}`,
      `   Precio por unidad: ${formatoMonto(precioUnitario)}`,
      `   Subtotal servicio: ${formatoMonto(subtotalServicio)}`
    ].join('\n')
  }

  const lineaTotal = (etiqueta: string, monto: number) =>
    `${pad(etiqueta, 14)}${padIzq(formatoMonto(monto), 10)}`

  // --- Datos de la orden ---
  const servicios = orden.items.length
    ? orden.items
        .map((item: ItemPedido) => lineaItem(item))
        .join('\n')
    : 'Sin servicios registrados'

  const descuento = Math.max(0, orden.subtotal - orden.total)
  const entrega = orden.fechaEntregaActiva
    ? orden.fechaEntregaTexto
    : 'Te avisaremos cuando esté lista para recoger.'

  const canasta = '\u{1F9FA}'    // 🧺
  const check = '\u{2705}'       // ✅
  const jabon = '\u{1F9FC}'      // 🧼
  const dinero = '\u{1F4B0}'     // 💰
  const calendario = '\u{1F4C5}' // 📅
  const chincheta = '\u{1F4CC}'  // 📌
  const corazon = '\u{1F499}'    // 💙
  const sobre = '\u{1F4E7}'      // 📧

  return [
    `${canasta} *LAVANDERÍA SALINAS* ${canasta}`,
    '🎟️ *TICKET DE ORDEN*',
    '----------',
    `¡Hola, *${orden.nombreCliente}*! ${check}`,
    'Tu orden fue creada correctamente.',
    '📋 DATOS DE LA ORDEN',
    `ORDEN  : ${orden.numero}`,
    `FECHA  : ${new Date(orden.createdAt).toLocaleDateString('es-ES')}`,
    `CLIENTE: ${orden.nombreCliente}`,
    `PRENDAS: ${Number(orden.cantidadPrendas || 0)}`,
    '----------',
    `🧼 *SERVICIOS*`,
    servicios,
    orden.detallesPrendas ? `DETALLES: ${orden.detallesPrendas}` : '',
    '----------',
    `${dinero} *RESUMEN DE PAGO*`,
    lineaTotal('Subtotal', orden.subtotal),
    lineaTotal('Descuento', -descuento),
    '----------',
    lineaTotal('TOTAL', orden.total),
    lineaTotal('Recibido', orden.montoRecibido),
    '----------',
    `Estado de pago: *${orden.estadoPago === 'pagado' ? 'Pagado' : orden.estadoPago === 'anticipo' ? 'Anticipo' : 'Por cobrar'}*`,
    `ESTADO: *${orden.estado || 'Pendiente'}*`,
    entrega,
    '----------',
    `${chincheta} *POLÍTICA DEL SERVICIO*`,
    '• Presenta este mensaje o tu recibo al retirar tu ropa.',
    '• Las prendas deben retirarse en máx. 1 día después de estar listas.',
    '• Reclamos dentro de los 2 días hábiles posteriores a la entrega.',
    '',
    `🙏 Gracias por confiar en *Lavandería Salinas* ${corazon}`,
    `${sobre} lavanderiasalinassv@gmail.com`
  ].filter(Boolean).join('\n')
}

const imprimirTicketOrden = async () => {
  if (!ultimaOrdenCreada.value || typeof window === 'undefined') return

  const orden = ultimaOrdenCreada.value
  const logoBase64 = await obtenerImagenBase64(logoTicket)

  const ventana = window.open('', '_blank', 'width=400,height=650')
  if (!ventana) {
    window.alert('El navegador bloqueó la ventana emergente. Habilita las ventanas emergentes para imprimir el ticket.')
    return
  }

  const itemsHtml = orden.items
    .map(
      (item: ItemPedido) => `
        <tr>
          <td style="width: 12%; text-align: center;">${item.cantidad}</td>
          <td style="width: 48%; text-align: left;">${escaparHtml(item.nombre)}</td>
          <td style="width: 20%; text-align: right;">$${item.precio.toFixed(2)}</td>
          <td style="width: 20%; text-align: right;">$${(item.precio * item.cantidad).toFixed(2)}</td>
        </tr>
      `
    )
    .join('')

  const descuentoAplicado = Math.min(
    Number(orden.subtotal || 0),
    Math.max(0, Number(orden.descuento || 0))
  )
  const saldo = Math.max(0, orden.total - orden.montoRecibido)
  const etiquetaRecibido = orden.estadoPago === 'anticipo' ? 'Anticipo rec.' : 'Pago rec.'

  ventana.document.write(`
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Ticket ${escaparHtml(orden.numero)} - Lavandería Salinas</title>
        <style>
          * {
            box-sizing: border-box;
          }
          @page {
            size: 80mm auto;
            margin: 0;
          }
          html, body {
            margin: 0;
            padding: 0;
          }
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
            line-height: 1.4;
            color: #000;
            width: 80mm;
            padding: 6mm 4mm 4mm;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .contenedor-ticket {
            width: 100%;
          }
          .header {
            text-align: center;
            margin-bottom: 5px;
          }
          .logo-wrap {
            width: 100%;
            text-align: center;
            margin-bottom: 6px;
          }
          .logo {
            width: 100px;
            height: auto;
            display: inline-block;
            max-width: 100%;
          }
          .nombre-local {
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .num-orden {
            font-size: 12px;
            font-weight: bold;
            margin-top: 3px;
          }
          .linea-punteada {
            border-top: 1px dashed #000;
            margin: 6px 0;
            width: 100%;
          }
          .seccion-info {
            font-size: 12px;
            line-height: 1.5;
          }
          table.tabla-items {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }
          table.tabla-items th {
            font-size: 10px;
            text-transform: uppercase;
            padding-bottom: 4px;
            border-bottom: 1px dashed #000;
          }
          table.tabla-items td {
            padding: 5px 0;
            font-size: 12px;
            word-wrap: break-word;
            vertical-align: top;
            line-height: 1.35;
          }
          table.tabla-totales {
            width: 100%;
            border-collapse: collapse;
          }
          table.tabla-totales td {
            padding: 3px 0;
            font-size: 12px;
          }
          .filas-resaltadas {
            font-size: 13px !important;
            font-weight: bold;
          }
          .footer {
            text-align: center;
            font-size: 11px;
            margin-top: 8px;
            line-height: 1.4;
          }
        </style>
      </head>
      <body>
        <div class="contenedor-ticket">

          <div class="header">
            ${logoBase64 ? `<div class="logo-wrap"><img src="${logoBase64}" alt="Logo" class="logo" /></div>` : ''}
            <div class="nombre-local">Lavandería Salinas</div>
            <div class="num-orden">ORDEN DE SERVICIO #${escaparHtml(orden.numero)}</div>
          </div>

          <div class="linea-punteada"></div>

          <div class="seccion-info">
            <strong>Cliente:</strong> ${escaparHtml(orden.nombreCliente)}<br/>
            <strong>Cant. Prendas:</strong> ${Number(orden.cantidadPrendas || 0)}<br/>
            ${orden.detallesPrendas ? `<strong>Detalles:</strong> ${escaparHtml(orden.detallesPrendas)}` : ''}
          </div>

          <div class="linea-punteada"></div>

          <table class="tabla-items">
            <thead>
              <tr>
                <th style="width: 12%; text-align: center;">Cant</th>
                <th style="width: 48%; text-align: left;">Servicio</th>
                <th style="width: 20%; text-align: right;">P.U.</th>
                <th style="width: 20%; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="linea-punteada"></div>

          <table class="tabla-totales">
            <tr>
              <td>Subtotal:</td>
              <td style="text-align: right;">$${orden.subtotal.toFixed(2)}</td>
            </tr>
            ${descuentoAplicado > 0 ? `
            <tr>
              <td>Descuento:</td>
              <td style="text-align: right;">-$${descuentoAplicado.toFixed(2)}</td>
            </tr>` : ''}
            <tr class="filas-resaltadas">
              <td>TOTAL:</td>
              <td style="text-align: right;">$${orden.total.toFixed(2)}</td>
            </tr>
            <tr>
              <td>${etiquetaRecibido}:</td>
              <td style="text-align: right;">$${orden.montoRecibido.toFixed(2)}</td>
            </tr>
            <tr class="filas-resaltadas">
              <td>Saldo Pendiente:</td>
              <td style="text-align: right;">$${saldo.toFixed(2)}</td>
            </tr>
          </table>

          <div class="linea-punteada"></div>

          <div class="footer">
            ¡Gracias por su preferencia!<br/>
            Presente este ticket al retirar sus prendas.
          </div>

        </div>

        <script>
          function _imprimirYcerrar() {
            window.focus();
            window.print();
          }
          window.onload = function () {
            requestAnimationFrame(function () {
              setTimeout(_imprimirYcerrar, 200);
            });
          };
          window.onafterprint = function () {
            window.close();
          };
          setTimeout(function () {
            if (!window.closed) window.close();
          }, 60000);
        <\/script>
      </body>
    </html>
  `)
  ventana.document.close()
}

const imprimirEtiquetaPrendas = () => {
  if (!ultimaOrdenCreada.value || typeof window === 'undefined') return
  const orden = ultimaOrdenCreada.value

  const ventana = window.open('', '_blank', 'width=320,height=420')
  if (!ventana) {
    window.alert('El navegador bloqueó la ventana emergente. Habilita las ventanas emergentes para imprimir la etiqueta.')
    return
  }

  const serviciosTexto = orden.items
    .map((item: ItemPedido) => `${item.cantidad} x ${escaparHtml(item.nombre)}`)
    .join('<br/>')

  const telefonoTexto = `${orden.codigoPais ?? ''}${orden.telefono ?? ''}`.trim()

  ventana.document.write(`
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Etiqueta ${escaparHtml(orden.numero)}</title>
        <style>
          * { box-sizing: border-box; }
          @page { size: 58mm auto; margin: 0; }
          html, body { margin: 0; padding: 0; }
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 11px;
            line-height: 1.4;
            color: #000;
            width: 58mm;
            padding: 4mm 3mm;
          }
          .etiqueta-titulo { text-align: center; font-weight: bold; font-size: 13px; text-transform: uppercase; margin-bottom: 4px; }
          .etiqueta-orden { text-align: center; font-weight: bold; margin-bottom: 6px; }
          .linea-punteada { border-top: 1px dashed #000; margin: 4px 0; }
          .etiqueta-campo { margin: 3px 0; }
          .etiqueta-campo strong { display: block; }
          .etiqueta-total { margin-top: 6px; font-weight: bold; font-size: 13px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="etiqueta-titulo">Lavandería Salinas</div>
        <div class="etiqueta-orden">Orden #${escaparHtml(orden.numero)}</div>
        <div class="linea-punteada"></div>
        <div class="etiqueta-campo"><strong>Cliente:</strong> ${escaparHtml(orden.nombreCliente || 'Sin nombre')}</div>
        ${telefonoTexto ? `<div class="etiqueta-campo"><strong>Teléfono:</strong> ${escaparHtml(telefonoTexto)}</div>` : ''}
        ${orden.correo ? `<div class="etiqueta-campo"><strong>Correo:</strong> ${escaparHtml(orden.correo)}</div>` : ''}
        <div class="linea-punteada"></div>
        <div class="etiqueta-campo"><strong>Prendas:</strong> ${Number(orden.cantidadPrendas || 0)}</div>
        <div class="etiqueta-campo"><strong>Servicios:</strong><br/>${serviciosTexto || 'Sin servicios registrados'}</div>
        <div class="linea-punteada"></div>
        <div class="etiqueta-total">Total: $${Number(orden.total || 0).toFixed(2)}</div>
        <script>
          function _imprimirYcerrar() { window.focus(); window.print(); }
          window.onload = function () {
            requestAnimationFrame(function () { setTimeout(_imprimirYcerrar, 200); });
          };
          window.onafterprint = function () { window.close(); };
          setTimeout(function () { if (!window.closed) window.close(); }, 60000);
        <\/script>
      </body>
    </html>
  `)
  ventana.document.close()
}

const navegadoresDisponibles = ref<Array<{ id: string; nombre: string; ruta: string }>>([])
const urlWhatsappPendiente = ref('')
const esElectron = computed(() => typeof (window as any).electronAPI?.detectarNavegadores === 'function')

const enviarWhatsApp = async () => {
  if (!ultimaOrdenCreada.value || typeof window === 'undefined') return

  const mensaje = construirMensajeWhatsApp()
  if (!mensaje) return

  const orden = ultimaOrdenCreada.value
  const numero = `${orden.codigoPais}${orden.telefono}`.replace(/\D/g, '')

  window.dispatchEvent(new CustomEvent('whatsapp-compose', {
    detail: { phone: numero, message: mensaje }
  }))
}

const abrirModalCorreo = () => {
  if (!ultimaOrdenCreada.value) return
  correoManual.value = ultimaOrdenCreada.value.correo || ''
  mostrarModalCorreo.value = true
}

const cerrarModalCorreo = () => {
  mostrarModalCorreo.value = false
  correoManual.value = ''
  enviandoCorreo.value = false
}

const enviarCorreoManual = async () => {
  if (!ultimaOrdenCreada.value || !correoManual.value) return

  enviandoCorreo.value = true

  try {
    await enviarFacturaOrdenPorCorreo({
      ...ultimaOrdenCreada.value,
      correo: correoManual.value
    })

    const toast = await toastController.create({
      message: 'Factura enviada por correo exitosamente',
      duration: 2500,
      color: 'success'
    })
    toast.present()

    cerrarModalCorreo()
  } catch (error: any) {
    const toast = await toastController.create({
      message: error.message || 'Error al enviar correo',
      duration: 2500,
      color: 'danger'
    })
    toast.present()
  } finally {
    enviandoCorreo.value = false
  }
}

const generarHtmlOrden = (orden: any) => {
  const fecha = new Date(orden.createdAt).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })

  const itemsHtml = orden.items
    .map(
      (item: any) => `
        <tr>
          <td>${escaparHtml(item.nombre)}</td>
          <td style="text-align:right">${item.cantidad}</td>
          <td style="text-align:right">$${item.precio.toFixed(2)}</td>
          <td style="text-align:right">$${(item.precio * item.cantidad).toFixed(2)}</td>
        </tr>
      `
    )
    .join('')
  const descuentoAplicado = Math.min(
    Number(orden.subtotal || 0),
    Math.max(0, Number(orden.descuento || 0))
  )
  const saldoBase = Number(orden.total || 0) - Number(orden.montoRecibido || 0)
  const saldo = orden.estado === 'cancelada' ? -Math.abs(saldoBase) : Math.max(0, saldoBase)
  const etiquetaRecibido = orden.estadoPago === 'anticipo' ? 'Anticipo recibido' : 'Pago recibido'

  return `
    <div style="font-family: Arial, sans-serif; color: #0a1f38; max-width: 800px; margin: 0 auto;">
      <section style="position: relative; min-height: 245mm; padding-bottom: 74mm;">
      <div style="display: flex; align-items: flex-start; margin-bottom: 24px; border-bottom: 2px solid #0a1f38; padding-bottom: 16px;">
        <div style="flex: 1;">
          <h1 style="margin: 0; font-size: 1.8rem; color: #0a1f38;">Lavandería Salinas</h1>
          <p style="color: #6f8399; margin: 4px 0 0; font-size: 0.95rem;">Tu orden</p>
          <p style="color: #4a627e; margin: 12px 0 0; font-size: 0.82rem; line-height: 1.5;">Teléfono: <a href="https://wa.me/50324976699" style="color:#168276; font-weight:bold; text-decoration:underline;">2497 6699 por WhatsApp</a><br>Correo: <a href="mailto:lavanderiasalinassv@gmail.com" style="color:#168276; font-weight:bold; text-decoration:underline;">lavanderiasalinassv@gmail.com</a></p>
        </div>
        <div style="text-align: right;">
          <img src="cid:logo-factura" alt="Lavandería Salinas" style="width: 130px; max-height: 130px; object-fit: contain;" />
        </div>
      </div>

      <!-- Información de la orden -->
      <div style="background: #f3fbfa; border: 1px solid #cdebe6; border-radius: 12px; padding: 20px; margin: 20px 0;">
        <div style="font-size: 1.2rem; font-weight: bold; margin-bottom: 12px;">Orden ${escaparHtml(orden.numero)}</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <p style="margin: 4px 0;"><strong>Cliente:</strong> ${escaparHtml(orden.nombreCliente)}</p>
          <p style="margin: 4px 0;"><strong>Fecha:</strong> ${fecha}</p>
          <p style="margin: 4px 0;"><strong>Prendas recibidas:</strong> ${Number(orden.cantidadPrendas || 0)}</p>
          ${orden.detallesPrendas ? `<p style="margin: 4px 0;"><strong>Detalles:</strong> ${escaparHtml(orden.detallesPrendas)}</p>` : ''}
          <p style="margin: 4px 0;"><strong>Pago:</strong> <span style="color:${orden.estadoPago === 'pagado' ? '#15803d' : orden.estadoPago === 'anticipo' ? '#2563eb' : '#d97706'}; font-weight:bold;">${orden.estadoPago === 'pagado' ? 'Pagado' : orden.estadoPago === 'anticipo' ? 'Anticipo' : 'Por cobrar'}</span></p>
        </div>
      </div>

      <!-- Tabla de items -->
      <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
        <thead>
          <tr style="background: #0a1f38; color: white;">
            <th style="text-align: left; padding: 12px 16px; font-size: 0.9rem;">Servicio</th>
            <th style="text-align: right; padding: 12px 16px; font-size: 0.9rem;">Cantidad</th>
            <th style="text-align: right; padding: 12px 16px; font-size: 0.9rem;">Precio</th>
            <th style="text-align: right; padding: 12px 16px; font-size: 0.9rem;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div style="position: absolute; left: 0; right: 0; bottom: 0; padding: 16px; background: #0a1f38; color: white; border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;"><span>Subtotal</span><strong>$${Number(orden.subtotal || 0).toFixed(2)}</strong></div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;"><span>Descuento aplicado</span><strong>-$${descuentoAplicado.toFixed(2)}</strong></div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 1.3rem; font-weight: bold;"><span>Total</span><span>$${orden.total.toFixed(2)}</span></div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;"><span>${etiquetaRecibido}</span><strong>$${Number(orden.montoRecibido || 0).toFixed(2)}</strong></div>
        <div style="display: flex; justify-content: space-between; font-weight: bold;"><span>Saldo pendiente</span><span>$${saldo.toFixed(2)}</span></div>
      </div>

      </section>

      <section style="page-break-before: always; padding: 8mm 0;">
      <div style="padding: 24px; background: #fff9e6; border: 1px solid #ffd700; border-radius: 12px;">
        <h3 style="margin: 0 0 16px; color: #b8860b; font-size: 1.1rem; text-transform: uppercase; letter-spacing: 0.05em;">Condiciones del servicio</h3>
        <div style="color: #333; font-size: 0.85rem; line-height: 1.6;">
          <p style="margin: 0 0 12px;"><strong>Para retirar las prendas</strong>, es indispensable presentar este recibo como único comprobante válido.</p>

          <p style="margin: 0 0 12px;">Las prendas deberán ser retiradas en un <strong>máximo de 1 día</strong>; de no hacerlo, se aplicará un cargo adicional de <strong>$0.50</strong> por cada día de retraso.</p>

          <p style="margin: 0 0 12px;">El plazo para realizar cualquier reclamación sobre el servicio es de <strong>2 días hábiles</strong> después de la entrega.</p>

          <p style="margin: 0 0 12px;">La lavandería no se responsabiliza por pérdidas o daños causados por eventos fortuitos o fuerza mayor, como robos, incendios o desastres naturales, siendo este riesgo asumido por el cliente.</p>

          <p style="margin: 0 0 12px;">Las prendas no retiradas en un plazo de <strong>30 días</strong> serán consideradas abandonadas, liberando a la lavandería de toda responsabilidad sobre ellas.</p>

          <p style="margin: 0 0 12px;">Si dichas prendas no son reclamadas en un plazo adicional de <strong>10 días</strong> (40 días en total desde su disponibilidad), la lavandería se reserva el derecho de donarlas a refugios u organizaciones benéficas sin posibilidad de reclamos futuros.</p>

          <p style="margin: 0 0 16px;">En caso de dudas, comuníquese con nosotros:</p>

          <div style="display: flex; gap: 20px; align-items: center; margin-top: 12px;">
            <a href="mailto:lavanderiasalinassv@gmail.com" style="color: #168276; font-weight: bold; text-decoration: underline;">📧 lavanderiasalinassv@gmail.com</a>
            <a href="https://wa.me/50324976699" style="color: #168276; font-weight: bold; text-decoration: underline;">📱 2497 6699 por WhatsApp</a>
          </div>
        </div>
      </div>

      <!-- Pie de página -->
      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e6edf3; text-align: center; color: #6f8399; font-size: 0.8rem;">
        <p style="margin: 0;">Este documento es válido como comprobante de pago emitido por Lavandería Salinas.</p>
        <p style="margin: 8px 0 0;">Gracias por confiar en nuestros servicios.</p>
      </div>
      </section>
    </div>
  `
}

const enviarEmail = () => {
  if (!ultimaOrdenCreada.value || typeof window === 'undefined') return

  const orden = ultimaOrdenCreada.value
  if (!orden.correo) return

  const asunto = `Pedido ${orden.numero} - Lavandería Salinas`
  const cuerpo = construirMensajeWhatsApp()
  window.location.href = `mailto:${encodeURIComponent(orden.correo)}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`
}

const nuevaOrden = () => {
  reiniciarFlujo()
}

const etiquetaUnidad = (u: string) => {
  const map: Record<string, string> = {
    kilo: 'por kilo',
    libra: 'por libra',
    pieza: 'por pieza',
    m2: 'por m²',
    galon: 'por galón',
    mililitro: 'por mL',
    otro: 'por unidad'
  }
  return map[u] ?? 'por unidad'
}

const etiquetaUnidadInventario = (u: string) => {
  const map: Record<string, string> = {
    pieza: 'pz',
    litro: 'L',
    mililitro: 'mL',
    kilogramo: 'kg',
    gramo: 'g',
    paquete: 'paq',
    caja: 'caja',
    otro: 'u'
  }
  return map[u] ?? 'u'
}

onMounted(() => {
  cargarCatalogo().catch((error) => {
    console.error('Error al cargar el catálogo para crear la orden:', error)
  })

  if (!pedido.fechaEntrega) {
    pedido.fechaEntrega = fechaMinima
  }
  if (!pedido.horaEntrega) {
    pedido.horaEntrega = horaActualCentroamerica()
  }
})
</script>

<style scoped>

.force-light {
  --ion-background-color: #ffffff;
  --ion-text-color: #0a1f38;
  color-scheme: light;
}

.orden-guiada {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 2px;
  background:
    radial-gradient(circle at top left, rgba(255, 184, 77, 0.15), transparent 34%),
    radial-gradient(circle at top right, rgba(79, 179, 224, 0.16), transparent 30%),
    radial-gradient(circle at bottom left, rgba(22, 163, 74, 0.08), transparent 28%),
    linear-gradient(180deg, rgba(245, 249, 252, 0.98), rgba(236, 243, 248, 0.92));
  border-radius: 28px;
}

.orden-hero,
.orden-board,
.orden-exito {
  position: relative;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(247, 250, 253, 0.96) 100%);
  border: 1px solid rgba(18, 58, 102, 0.10);
  border-radius: 22px;
  box-shadow: 0 18px 44px rgba(10, 31, 56, 0.10), 0 2px 0 rgba(255, 255, 255, 0.72) inset;
}

.orden-hero::before,
.orden-board::before,
.orden-exito::before {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 5px;
  background: linear-gradient(90deg, #ff8a3d 0%, #4fb3e0 45%, #16a34a 100%);
  opacity: 0.9;
}

.orden-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 22px;
}

.eyebrow,
.panel-etiqueta {
  margin: 0 0 6px;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #6d829c;
  font-weight: 800;
}

.orden-hero-copy h2,
.panel-cabecera h3 {
  margin: 0 0 8px;
  color: #0a1f38;
}

.orden-hero-copy p,
.panel-cabecera p {
  margin: 0;
  color: #4a627e;
}

.orden-hero-actions {
  position: relative;
  z-index: 1;
}

.orden-hero-actions,
.exito-acciones,
.acciones-finales {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

/* ============================================================
   BOTONES
   ============================================================ */
.ghost-btn,
.primary-btn,
.secondary-btn,
.action-btn {
  border: none;
  border-radius: 14px;
  padding: 12px 16px;
  font-weight: 800;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
}

.ghost-btn:hover,
.primary-btn:hover,
.secondary-btn:hover,
.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 18px rgba(10, 31, 56, 0.10);
}

.ghost-btn:disabled,
.primary-btn:disabled,
.secondary-btn:disabled,
.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.ghost-btn,
.secondary-btn {
  background: #f5f9fc;
  color: #123a66;
}

.primary-btn,
.action-btn.principal {
  background: linear-gradient(135deg, #123a66, #0d2b4e);
  color: #f5f9fc;
}

.new-order-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #ff8a3d 0%, #ffb74d 55%, #ffd86f 100%);
  color: #1f2a44;
  box-shadow: 0 12px 24px rgba(255, 155, 61, 0.24);
}

.new-order-btn ion-icon {
  font-size: 1.05em;
}

.action-btn.verde {
  background: #16a34a;
  color: #ffffff;
}

.action-btn.azul {
  background: #1d4ed8;
  color: #ffffff;
}

.action-btn.morado {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.action-btn.morado:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(139, 92, 246, 0.4);
}

.turno-alerta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px;
  border-radius: 16px;
  border: 1px solid rgba(245, 158, 11, 0.22);
  background: linear-gradient(135deg, rgba(255, 248, 225, 0.96), rgba(255, 236, 182, 0.78));
  color: #8a5a00;
  box-shadow: 0 12px 28px rgba(245, 158, 11, 0.10);
}

/* ============================================================
   PANTALLA DE ÉXITO
   ============================================================ */
.orden-exito {
  padding: 24px;
  display: grid;
  gap: 18px;
  justify-items: center;
  text-align: center;
}

.exito-icono {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, rgba(22, 163, 74, 0.16), rgba(79, 179, 224, 0.16));
  color: #16a34a;
  font-size: 34px;
  box-shadow: 0 10px 22px rgba(22, 163, 74, 0.12);
}

.exito-titulo {
  margin: 0 0 4px;
  font-size: 1.2rem;
  font-weight: 900;
  color: #16a34a
}

.exito-numero,
.exito-fecha {
  margin: 0;
  color: #4a627e;
}

.exito-fecha {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.orden-board {
  padding: 18px;
  display: grid;
  gap: 16px;
}

.pasos-nav {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
}
.input-texto.input-descuento-mini {
  color: #0a1f38;
}
.paso-chip {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid rgba(18, 58, 102, 0.08);
  background: linear-gradient(180deg, rgba(245, 249, 252, 0.98), rgba(235, 243, 250, 0.92));
  color: #4a627e;
  border-radius: 16px;
  font-weight: 800;
  box-shadow: 0 8px 16px rgba(10, 31, 56, 0.05);
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.paso-chip.active {
  background: linear-gradient(135deg, #123a66 0%, #0d2b4e 45%, #16a34a 100%);
  color: #f5f9fc;
  box-shadow: 0 14px 24px rgba(18, 58, 102, 0.24);
}

.paso-chip:disabled {
  cursor: not-allowed;
}

.paso-chip.done {
  border-color: rgba(22, 163, 74, 0.26);
  background: linear-gradient(180deg, rgba(232, 248, 238, 0.96), rgba(246, 252, 249, 0.94));
}

.paso-numero {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  background: linear-gradient(135deg, rgba(18, 58, 102, 0.12), rgba(79, 179, 224, 0.18));
}

/* ============================================================
   LAYOUT: PANEL PRINCIPAL + LATERAL
   ============================================================ */
.orden-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(250px, 0.65fr);
  gap: 16px;
  align-items: start;
}

.panel-principal,
.panel-lateral,
.tarjeta-resumen,
.carrito-box,
.promos-box,
.fotos-box,
.resumen-box {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(247, 250, 253, 0.96) 100%);
  border: 1px solid rgba(18, 58, 102, 0.10);
  border-radius: 18px;
  box-shadow: 0 12px 28px rgba(10, 31, 56, 0.06);
}

.panel-principal {
  padding: 18px;
}

.panel-cabecera {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: start;
  margin-bottom: 18px;
}

/* ============================================================
   WIZARD DEL CLIENTE
   ============================================================ */
.wizard-card {
  border: 1px solid rgba(18, 58, 102, 0.10);
  border-radius: 18px;
  padding: 18px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(249, 251, 253, 0.96) 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72), 0 10px 22px rgba(10, 31, 56, 0.05);
}

.wizard-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px 16px;
  margin-bottom: 16px;
}

.wizard-step {
  margin: 0 0 6px;
  color: #123a66;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.wizard-header h4 {
  margin: 0 0 6px;
  font-size: 1.15rem;
  color: #0a1f38;
}

.wizard-header p {
  margin: 0;
  color: #4a627e;
}

.wizard-dots {
  display: flex;
  gap: 6px;
  padding-top: 4px;
}

.wizard-dots span {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: rgba(159, 180, 201, 0.6);
}

.wizard-dots span.active,
.wizard-dots span.done {
  background: linear-gradient(135deg, #123a66, #16a34a);
}

.wizard-panel {
  display: grid;
  gap: 14px;
  min-height: 180px;
}

.wizard-actions {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 8px;
}

.step-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}

.step-actions .step-next-btn {
  min-width: 180px;
}

.step-actions-final {
  justify-content: flex-start;
}

.mini-resumen {
  min-width: 120px;
  padding: 12px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(18, 58, 102, 0.08), rgba(79, 179, 224, 0.10));
  color: #0a1f38 !important;
  display: grid;
  gap: 4px;
  text-align: right;
}

.mini-resumen span,
.kpi span,
.resumen-linea span,
.carrito-info span {
  color: #6d829c !important;
  font-size: 0.82rem;
}

.mini-resumen strong {
  color: #0a1f38 !important;
}

.paso-contenido {
  display: grid;
  gap: 16px;
  color: #0a1f38;
}
.cliente-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}

.campo-ancha {
  grid-column: 1 / -1;
}

.btn-guardar-correo-cliente {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  border: none;
  border-radius: 10px;
  padding: 8px 12px;
  margin-top: 4px;
  font-size: 0.8rem;
  font-weight: 800;
  color: #ffffff;
  background: linear-gradient(135deg, #16a34a, #4ade80);
  cursor: pointer;
}

.btn-guardar-correo-cliente:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.ajustes-grid {
  display: grid;
  grid-template-columns: minmax(220px, 0.9fr) minmax(0, 1.1fr);
  gap: 12px;
  align-items: start;
}

.ajustes-col {
  display: grid;
  gap: 12px;
}

.campo {
  display: grid;
  gap: 8px;
}

.campo label,
.campo > .campo-label {
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #6d829c;
}

.direccion-entrega-box {
  padding: 14px 16px;
  border: 1px solid rgba(18, 58, 102, 0.10);
  border-radius: 16px;
  background: rgba(245, 249, 252, 0.75);
}

.direccion-entrega-input {
  min-height: 88px;
  resize: vertical;
}

.input-texto,
.select-codigo,
.input-codigo,
.search-bar input {
  width: 100%;
  border: 1px solid rgba(18, 58, 102, 0.14);
  border-radius: 14px;
  padding: 12px 14px;
  font: inherit;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(243, 248, 252, 0.96));
  color: #0a1f38;
  outline: none;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.72),
    0 8px 18px rgba(10, 31, 56, 0.05);
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease, background 0.18s ease;
}

.input-texto:focus,
.select-codigo:focus,
.input-codigo:focus,
.search-bar input:focus {
  border-color: rgba(18, 58, 102, 0.38);
  background: linear-gradient(180deg, #ffffff 0%, #f7fbff 100%);
  box-shadow:
    0 0 0 4px rgba(79, 179, 224, 0.16),
    0 12px 22px rgba(10, 31, 56, 0.08);
  transform: translateY(-1px);
}

.input-texto.readonly {
  background: rgba(22, 163, 74, 0.08);
}

.cliente-autocompletado {
  position: relative;
}

.clientes-sugerencias {
  position: absolute;
  z-index: 20;
  top: calc(100% + 4px);
  right: 0;
  left: 0;
  display: grid;
  gap: 4px;
  max-height: 230px;
  overflow-y: auto;
  padding: 6px;
  border: 1px solid rgba(18, 58, 102, 0.14);
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 10px 24px rgba(10, 31, 56, 0.16);
}

.cliente-sugerencia {
  display: grid;
  gap: 2px;
  width: 100%;
  padding: 8px 10px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: #0a1f38;
  text-align: left;
  cursor: pointer;
}

.cliente-sugerencia:hover {
  background: #eef8f7;
}

.cliente-sugerencia strong,
.cliente-sugerencia span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cliente-sugerencia span {
  color: #6d829c;
  font-size: 0.75rem;
}

.input-texto.error {
  border-color: #dc2626;
}

.telefono-row {
  display: grid;
  grid-template-columns: 84px minmax(0, 1fr);
  gap: 10px;
}

.input-codigo {
  text-align: center;
  padding-inline: 8px;
}

.toggle-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid rgba(18, 58, 102, 0.10);
  background: linear-gradient(135deg, rgba(245, 249, 252, 0.98), rgba(232, 244, 255, 0.92));
  box-shadow: 0 10px 20px rgba(10, 31, 56, 0.05);
}

.toggle-card-soft {
  min-height: 74px;
}

.toggle-card.horizontal div {
  display: grid;
  gap: 4px;
}

.toggle-card strong {
  color: #0a1f38;
}

.toggle-card span {
  color: #6d829c;
  font-size: 0.88rem;
}

.cliente-badge {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(22, 163, 74, 0.12), rgba(18, 58, 102, 0.06));
  color: #166534;
  border: 1px solid rgba(22, 163, 74, 0.18);
}

.cliente-badge-fuerte {
  box-shadow: 0 8px 20px rgba(22, 163, 74, 0.08);
}

.cliente-badge ion-icon {
  font-size: 22px;
}

.cliente-badge strong {
  color: #0a1f38;
}

.cliente-badge span {
  display: block;
  font-size: 0.88rem;
  color: #4a627e;
}

/* ============================================================
   DESCUENTOS / PROMOCIONES
   ============================================================ */
.descuento-btn,
.upload-btn,
.link-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 14px;
  border: 1px solid rgba(10, 31, 56, 0.12);
  background: #ffffff;
  color: #123a66;
  font-weight: 800;
  padding: 12px 14px;
  cursor: pointer;
}

.descuento-zone {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.descuento-btn {
  background: linear-gradient(135deg, rgba(18, 58, 102, 0.10), rgba(22, 163, 74, 0.10));
  border-color: rgba(18, 58, 102, 0.16);
}

.input-descuento-mini {
  width: 120px;
  padding-inline: 12px;
  text-align: center;
}

.promos-box {
  padding: 14px;
  display: grid;
  gap: 12px;
}

.promos-box.compact {
  background: linear-gradient(180deg, rgba(247, 250, 252, 0.98) 0%, rgba(235, 244, 255, 0.94) 100%);
}

.promos-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 800;
  color: #0a1f38;
}

.promo-empty {
  margin: 0;
  color: #7c8fa6;
  font-size: 0.88rem;
}

.promo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 10px;
}

.promo-card {
  display: grid;
  justify-items: start;
  gap: 6px;
  padding: 14px;
  border: 1px solid rgba(18, 58, 102, 0.10);
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(245, 249, 252, 0.96) 100%);
  cursor: pointer;
  text-align: left;
  box-shadow: 0 10px 20px rgba(10, 31, 56, 0.06);
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.promo-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(10, 31, 56, 0.08);
}

.promo-card.active {
  border-color: #123a66;
  background: linear-gradient(180deg, rgba(18, 58, 102, 0.12), rgba(79, 179, 224, 0.12), rgba(22, 163, 74, 0.08));
}

.promo-emoji {
  font-size: 1.2rem;
}

.promo-card strong {
  color: #0a1f38;
}

.promo-card span:last-child {
  color: #123a66;
  font-weight: 900;
}

/* ============================================================
   BÚSQUEDA / CATEGORÍAS / PRODUCTOS
   ============================================================ */
.buscador-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.search-bar {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(243, 248, 252, 0.96));
  border: 1px solid rgba(18, 58, 102, 0.12);
  border-radius: 14px;
  padding: 0 14px;
  box-shadow: 0 8px 18px rgba(10, 31, 56, 0.05);
}

.search-bar input {
  border: none;
  box-shadow: none;
  padding-inline: 0;
}

.search-bar input:focus {
  box-shadow: none;
  transform: none;
}

.resultados-busqueda {
  display: grid;
  gap: 14px;
}

.resultados-busqueda-cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(18, 58, 102, 0.06);
}

.resultados-busqueda-cabecera div {
  display: grid;
  gap: 2px;
}

.resultados-busqueda-cabecera strong {
  color: #0a1f38;
}

.resultados-busqueda-cabecera span {
  color: #6d829c;
  font-size: 0.84rem;
}

.limpiar-busqueda {
  border: none;
  background: transparent;
  color: #123a66;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}

.grupo-resultados {
  display: grid;
  gap: 8px;
}

.grupo-resultados-categoria {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 2px;
}

.grupo-resultados-categoria .categoria-chip {
  height: 38px;
}

.grupo-resultados-categoria div,
.resultado-servicio-info {
  display: grid;
  gap: 2px;
}

.grupo-resultados-categoria strong,
.resultado-servicio-info strong {
  color: #0a1f38;
}

.grupo-etiqueta,
.resultado-etiqueta,
.resultado-servicio-info > span:last-child {
  color: #6d829c;
  font-size: 0.78rem;
}

.grupo-etiqueta,
.resultado-etiqueta {
  font-weight: 800;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.lista-resultados-servicios {
  display: grid;
  gap: 8px;
}

.resultado-servicio {
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 14px;
  border: 1px solid rgba(18, 58, 102, 0.10);
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(245, 249, 252, 0.96));
  text-align: left;
  cursor: pointer;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.resultado-servicio:hover {
  transform: translateY(-1px);
  border-color: rgba(18, 58, 102, 0.28);
  box-shadow: 0 8px 18px rgba(10, 31, 56, 0.07);
}

.resultado-servicio.seleccionado {
  border-color: #16a34a;
  box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.14);
}

.resultado-icono {
  width: 42px;
  height: 42px;
  border-radius: 13px;
}

.resultado-precio {
  color: #16a34a;
  font-weight: 900;
  white-space: nowrap;
}

.resultado-cantidad {
  position: absolute;
  top: -7px;
  right: -6px;
  display: grid;
  width: 21px;
  height: 21px;
  place-items: center;
  border-radius: 50%;
  background: #16a34a;
  color: #fff;
  font-size: 0.72rem;
  font-weight: 900;
}

.categorias-view {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.categoria-card {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: space-between;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid rgba(18, 58, 102, 0.10);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(245, 249, 252, 0.96));
  cursor: pointer;
  text-align: left;
  box-shadow: 0 10px 22px rgba(10, 31, 56, 0.05);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.categoria-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(10, 31, 56, 0.07);
}

.categoria-card div {
  display: grid;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.categoria-card strong {
  color: #0a1f38;
}

.categoria-card span {
  color: #6d829c;
  font-size: 0.88rem;
}

.categoria-chip {
  width: 14px;
  height: 42px;
  border-radius: 999px;
  flex-shrink: 0;
}

.categoria-actual {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(18, 58, 102, 0.06);
  color: #0a1f38;
}

.volver-categorias {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
  background: none;
  color: #123a66;
  font-weight: 800;
  padding: 4px 0;
  cursor: pointer;
}

.productos-carousel {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
}

.carousel-nav {
  width: 42px;
  height: 42px;
  border: none;
  border-radius: 14px;
  background: #f5f9fc;
  color: #123a66;
  display: grid;
  place-items: center;
  cursor: pointer;
  flex-shrink: 0;
}

.carousel-nav:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.carousel-viewport {
  overflow-x: auto;
  overflow-y: hidden;
  border-radius: 18px;
  scroll-behavior: smooth;
  scroll-snap-type: x proximity;
}

.carousel-viewport::-webkit-scrollbar {
  height: 12px;
}

.carousel-viewport::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

.carousel-viewport::-webkit-scrollbar-thumb {
  background: rgba(128, 128, 128, 0.6);
  border-radius: 10px;
  border: 3px solid transparent;
  background-clip: content-box;
}

.carousel-viewport::-webkit-scrollbar-thumb:hover {
  background: rgba(128, 128, 128, 0.8);
  background-clip: content-box;
}

.carousel-track {
  display: flex;
  gap: 12px;
  padding: 2px 2px 10px;
  align-items: stretch;
}

.producto-card {
  position: relative;
  flex: 0 0 clamp(150px, 40vw, 210px);
  border: 1px solid rgba(18, 58, 102, 0.10);
  border-radius: 18px;
  padding: 18px 14px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(245, 249, 252, 0.96) 100%);
  display: grid;
  gap: 10px;
  justify-items: center;
  text-align: center;
  cursor: pointer;
  box-shadow: 0 10px 22px rgba(10, 31, 56, 0.06);
  scroll-snap-align: start;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.producto-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(10, 31, 56, 0.08);
}

.producto-card.seleccionado {
  border-color: #16a34a;
  box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.18), 0 14px 26px rgba(22, 163, 74, 0.08);
}

.badge-seleccionado {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #16a34a;
  color: #ffffff;
  display: grid;
  place-items: center;
  font-size: 0.78rem;
  font-weight: 900;
}

.servicio-icono {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  overflow: hidden;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, rgba(18, 58, 102, 0.10), rgba(79, 179, 224, 0.14));
  color: #123a66;
}

.servicio-icono img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.producto-card .precio {
  color: #16a34a;
  font-weight: 900;
}

.producto-card .unidad,
.producto-card .accion {
  font-size: 0.82rem;
  color: #6d829c;
}

.estado-vacio {
  text-align: center;
  color: #6d829c;
  display: grid;
  gap: 6px;
  justify-items: center;
  padding: 28px 0;
}

.estado-icono {
  font-size: 48px;
  color: #a9c3d8;
}

.estado-titulo {
  margin: 0;
  font-weight: 800;
  color: #0a1f38;
}

.estado-texto {
  margin: 0;
}

/* ============================================================
   CARRITO
   ============================================================ */
.carrito-box {
  padding: 14px;
  display: grid;
  gap: 12px;
}

.carrito-box.compact {
  background: linear-gradient(180deg, rgba(251, 252, 254, 0.98), rgba(244, 248, 252, 0.96));
}

.carrito-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #0a1f38;
}

.carrito-vacio {
  color: #6d829c;
  text-align: center;
  padding: 12px;
}

.carrito-lista {
  display: grid;
  gap: 10px;
}

.carrito-item {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(245, 249, 252, 0.98), rgba(235, 243, 250, 0.94));
}

.carrito-info {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.carrito-info strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #0a1f38;
}

.carrito-cantidad {
  display: flex;
  align-items: center;
  gap: 6px;
}

.carrito-cantidad button,
.quitar-btn {
  border: none;
  background: #123a66;
  color: #ffffff;
  width: 30px;
  height: 30px;
  border-radius: 10px;
  cursor: pointer;
  flex-shrink: 0;
}

.quitar-btn {
  background: transparent;
  color: #9fb4c9;
}

/* ============================================================
   PAGO
   ============================================================ */
.estado-pago {
  display: grid;
  gap: 10px;
}

.estado-pago strong {
  color: #0a1f38;
}

.botones-fila {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.estado-btn {
  border: 1px solid rgba(18, 58, 102, 0.12);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(245, 249, 252, 0.96));
  color: #123a66;
  border-radius: 999px;
  padding: 10px 14px;
  font-weight: 800;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.estado-btn.active {
  background: linear-gradient(135deg, #123a66, #16a34a);
  color: #f5f9fc;
}

.montos-rapidos {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.monto-chip {
  border: 1px solid rgba(18, 58, 102, 0.12);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(245, 249, 252, 0.96));
  color: #123a66;
  border-radius: 999px;
  padding: 8px 14px;
  font-weight: 800;
  cursor: pointer;
}

.monto-chip.active {
  background: linear-gradient(135deg, #123a66, #16a34a);
  color: #f5f9fc;
}

.campos-tarjeta,
.campos-transferencia {
  display: grid;
  gap: 10px;
  margin-top: 15px;
  padding: 15px;
  border: 1px solid rgba(18, 58, 102, 0.08);
  border-radius: 12px;
  background: rgba(245, 249, 252, 0.5);
}

.campo-label {
  font-size: 0.8rem;
  font-weight: 800;
  color: #4a627e;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.campos-tarjeta .monto-input,
.campos-transferencia .monto-input,
.campos-efectivo {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border: 1px solid #cbd7df;
  border-radius: 10px;
  background: #fbfdfe;
  color: #168b83;
  font-size: 1.1rem;
  font-weight: 900;
}

.campos-tarjeta .monto-input input,
.campos-transferencia .monto-input input,
.campos-efectivo input {
  width: 100%;
  padding: 13px 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #0a1f38;
  font: inherit;
}

.campos-tarjeta input[type="text"],
.campos-transferencia input[type="text"],
.campos-transferencia input[type="file"] {
  width: 100%;
  padding: 11px 12px;
  border: 1px solid #cbd7df;
  border-radius: 10px;
  outline: 0;
  color: #0a1f38;
  font: inherit;
}

.campos-tarjeta input:focus,
.campos-transferencia input:focus,
.campos-efectivo:focus-within,
.campos-transferencia .monto-input:focus-within {
  border-color: #168b83;
  box-shadow: 0 0 0 3px rgba(22, 139, 131, 0.12);
}

.comprobante-link {
  color: #4169a1;
  font-size: 0.72rem;
  font-weight: 800;
  text-decoration: none;
  margin-top: 5px;
  display: inline-block;
}

.comprobante-link:hover {
  text-decoration: underline;
}

.campos-efectivo {
  min-width: 160px;
}

.cambio-texto {
  margin-left: auto;
  color: #4a627e;
}

/* ============================================================
   FOTOS / RESUMEN FINAL
   ============================================================ */
.fotos-box,
.resumen-box {
  padding: 14px;
  display: grid;
  gap: 12px;
}

.fotos-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.upload-btn {
  width: fit-content;
}

.fotos-preview {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(86px, 1fr));
  gap: 10px;
}

.foto-item {
  position: relative;
  border-radius: 14px;
  overflow: hidden;
  aspect-ratio: 1 / 1;
}

.foto-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.quitar-foto {
  position: absolute;
  top: 8px;
  right: 8px;
  border: none;
  background: rgba(10, 31, 56, 0.8);
  color: #ffffff;
  border-radius: 999px;
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  cursor: pointer;
}

.resumen-linea {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.alerta-stock {
  padding: 12px 14px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(255, 248, 225, 0.96), rgba(255, 236, 182, 0.78));
  color: #8a5a00;
}

/* ============================================================
   PANEL LATERAL / FACTURA
   ============================================================ */
.panel-lateral {
  padding: 0;
  display: grid;
  gap: 14px;
  align-content: start;
}

.tarjeta-resumen {
  padding: 14px;
  display: grid;
  gap: 10px;
}

.factura-card {
  background: #fffef8;
  border: 1px dashed rgba(18, 58, 102, 0.28);
  border-radius: 4px;
  padding: 12px;
  display: grid;
  gap: 8px;
  position: sticky;
  top: 0;
  box-shadow: 3px 4px 0 rgba(18, 58, 102, 0.06), 0 10px 20px rgba(10, 31, 56, 0.05);
}

.factura-header {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: flex-start;
  padding-bottom: 8px;
  border-bottom: 1px dashed rgba(18, 58, 102, 0.22);
}

.factura-header h4 {
  margin: 0;
  color: #0a1f38;
}

.factura-badge {
  padding: 6px 10px;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(18, 58, 102, 0.10), rgba(79, 179, 224, 0.12));
  color: #123a66;
  font-size: 0.78rem;
  font-weight: 800;
  white-space: nowrap;
}

.factura-linea {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  font-size: 0.82rem;
  color: #0a1f38 !important;
}

.factura-linea strong {
  color: #0a1f38 !important;
  text-align: right;
}

.factura-linea.total {
  border-top: 1px dashed rgba(18, 58, 102, 0.14);
  padding-top: 8px;
  margin-top: 2px;
}

.factura-linea.subtotal {
  padding-bottom: 2px;
}

.factura-linea.descuento {
  color: #0f7a3a !important;
}

.factura-linea.descuento strong {
  color: #0f7a3a !important;
}

.factura-linea span,
.factura-vacia,
.factura-mas {
  color: #6d829c !important;
}

.factura-mini-items {
  display: grid;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(10, 31, 56, 0.08);
  color : #6d829c;
}

.factura-item {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 0.84rem;
}

.acciones-card {
  position: sticky;
  top: 270px;
}

.cancel-order-btn {
  width: 100%;
  border: 1px solid rgba(220, 38, 38, 0.16);
  border-radius: 18px;
  padding: 14px 16px;
  background: linear-gradient(135deg, rgba(220, 38, 38, 0.12), rgba(248, 113, 113, 0.18));
  color: #b91c1c;
  font-weight: 900;
  cursor: pointer;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.cancel-order-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 18px rgba(220, 38, 38, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.5);
}

.acciones-texto {
  margin: 0;
  color: #6d829c;
  font-size: 0.84rem;
  line-height: 1.4;
}

.kpi {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 14px;
  background: #f5f9fc;
}

.secondary-btn {
  width: 100%;
  padding: 12px 14px;
}

.secondary-btn.danger {
  background: rgba(220, 38, 38, 0.08);
  color: #dc2626;
}

/* ============================================================
   MODALES
   ============================================================ */
.modal-stock {
  --width: min(460px, 92vw);
  --border-radius: 20px;
}

.modal-stock::part(content) {
  max-height: 88vh;
}

.modal-stock-contenido {
  background: #ffffff;
  padding: 22px;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto auto;
  gap: 12px;
  max-height: min(82vh, 720px);
  overflow: hidden;
}

.modal-stock-header {
  display: flex;
  gap: 12px;
}

.modal-stock-icono {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: rgba(245, 158, 11, 0.14);
  color: #8a5a00;
  font-weight: 900;
  flex-shrink: 0;
}

.modal-stock-lista {
  display: grid;
  gap: 10px;
  overflow: auto;
  padding-right: 4px;
}

.modal-stock-item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  border-radius: 14px;
  background: #f5f9fc;
}

.modal-stock-item span,
.modal-stock-faltante {
  color: #6d829c;
  font-size: 0.9rem;
}

.modal-stock-pregunta {
  font-weight: 800;
  color: #0a1f38;
}

.modal-stock-botones {
  display: flex;
  gap: 10px;
  position: sticky;
  bottom: 0;
  padding-top: 8px;
  background: #ffffff;
}

.modal-stock-botones > * {
  flex: 1;
}

.modal-correo {
  width: 100%;
  box-sizing: border-box;
  background: #ffffff;
  padding: 28px;
  border-radius: 20px;
  color: #000000;
}

.modal-correo-modal {
  --width: min(92vw, 460px);
  --height: auto;
  --max-height: 90vh;
  --border-radius: 20px;
  --background: #ffffff;
}

.modal-correo-modal::part(content) {
  height: auto;
  max-height: 90vh;
  background: #ffffff;
}

.modal-correo h3 {
  margin: 0 0 12px;
  font-size: 1.3rem;
  color: #0a1f38;
}

.modal-correo p {
  margin: 0 0 16px;
  color: #000000;
  font-size: 0.95rem;
}

.input-correo {
  width: 100%;
  box-sizing: border-box;
  padding: 12px 16px;
  font-size: 1rem;
  color: #000000;
  background: #ffffff;
  border: 2px solid #d1dbe5;
  border-radius: 12px;
  margin-bottom: 20px;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.input-correo:focus {
  border-color: #16a34a;
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.15);
}

.modal-correo-botones {
  display: flex;
  gap: 12px;
}

.modal-correo-botones button {
  flex: 1;
  padding: 12px 20px;
  font-size: 1rem;
  font-weight: 700;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease, border-color 0.2s ease;
}

.btn-cancelar {
  background: transparent;
  border: 2px solid #d1dbe5;
  color: #6d829c;
}

.btn-cancelar:hover {
  background: #f5f9fc;
  border-color: #a9d8ee;
}

.btn-enviar {
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
}

.btn-enviar:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(22, 163, 74, 0.4);
}

.btn-enviar:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ============================================================
   TRANSICIONES Y ERRORES
   ============================================================ */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: opacity 0.28s ease, transform 0.28s ease;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(10px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

.ayuda-error {
  margin: -2px 0 0;
  color: #dc2626;
  font-size: 0.78rem;
  font-weight: 600;
}

/* ============================================================
   ACCESIBILIDAD: foco visible + movimiento reducido
   ============================================================ */
.ghost-btn:focus-visible,
.primary-btn:focus-visible,
.secondary-btn:focus-visible,
.action-btn:focus-visible,
.paso-chip:focus-visible,
.estado-btn:focus-visible,
.monto-chip:focus-visible,
.promo-card:focus-visible,
.categoria-card:focus-visible,
.producto-card:focus-visible,
.carousel-nav:focus-visible,
.upload-btn:focus-visible,
.link-btn:focus-visible {
  outline: 3px solid rgba(79, 179, 224, 0.55);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  * {
    transition-duration: 0.001ms !important;
    animation-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
}

/* ============================================================
   TABLET (entre 761px y 1024px)
   Landscape conserva 2 columnas; se afinan espacios e inputs.
   ============================================================ */
@media (min-width: 761px) and (max-width: 1024px) {
  .orden-board {
    padding: 16px;
    gap: 14px;
  }

  .orden-layout {
    gap: 14px;
  }

  .ajustes-grid {
    grid-template-columns: 1fr;
  }

  .pasos-nav {
    grid-template-columns: repeat(4, 1fr);
  }

  .producto-card {
    flex-basis: clamp(150px, 22vw, 190px);
  }
}

/* ============================================================
   Portrait tablet + phones (colapsa a 1 columna)
   ============================================================ */
@media (max-width: 900px) {
  .orden-layout {
    grid-template-columns: 1fr;
  }

  @media (max-width: 900px) {
  .panel-lateral {
      display: none;
    }
  }

  .acciones-card {
    position: static;
  }

  .factura-card {
    position: static;
  }
}

/* ============================================================
   TELÉFONOS
   ============================================================ */
@media (max-width: 760px) {
  .orden-board {
    padding: 12px;
    gap: 12px;
  }

  .panel-principal {
    padding: 14px;
  }

  .orden-hero {
    flex-direction: column;
    align-items: stretch;
  }

  .cliente-grid,
  .fecha-grid,
  .telefono-row {
    grid-template-columns: 1fr;
  }

  .ajustes-grid {
    grid-template-columns: 1fr;
  }

  .panel-cabecera,
  .turno-alerta {
    grid-template-columns: 1fr;
    flex-direction: column;
  }

  .mini-resumen {
    width: 100%;
    text-align: left;
  }

  .carrito-item {
    grid-template-columns: 1fr auto;
    grid-template-areas:
      'nombre nombre'
      'cantidad quitar';
    row-gap: 8px;
  }

  .carrito-info {
    grid-area: nombre;
  }

  .carrito-cantidad {
    grid-area: cantidad;
  }

  .quitar-btn {
    grid-area: quitar;
    justify-self: end;
  }

  .buscador-row {
    flex-direction: column;
    align-items: stretch;
  }

  .resultados-busqueda-cabecera {
    align-items: flex-start;
    flex-direction: column;
  }

  .resultado-servicio {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .resultado-precio {
    grid-column: 2;
  }

  .productos-carousel {
    grid-template-columns: 1fr;
  }

  .carousel-nav {
    display: none;
  }

  .wizard-header {
    flex-wrap: wrap;
  }
}

@media (max-width: 480px) {
  .pasos-nav {
    display: flex;
    overflow-x: auto;
    gap: 8px;
    scroll-snap-type: x proximity;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 2px;
  }

  .paso-chip {
    flex: 0 0 auto;
    scroll-snap-align: start;
    white-space: nowrap;
  }

  .producto-card {
    flex-basis: clamp(140px, 62vw, 190px);
  }
}

.modal-navegador-contenido {
  background: #ffffff;
  padding: 26px;
  border-radius: 20px;
  max-width: 420px;
  margin: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal-navegador-contenido h3 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 900;
  color: #0a1f38;
}

.modal-navegador-lista {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.modal-navegador-btn {
  width: 100%;
  border: 1px solid rgba(18, 58, 102, 0.14);
  border-radius: 12px;
  padding: 12px 14px;
  background: #f5f9fc;
  color: #123a66;
  font-weight: 700;
  font-size: 0.95rem;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
}

.modal-navegador-btn:hover {
  background: rgba(18, 58, 102, 0.08);
  border-color: rgba(18, 58, 102, 0.3);
  transform: translateY(-1px);
}

.modal-navegador-default {
  background: #ffffff;
  color: #4a627e;
  border-style: dashed;
}

.modal-navegador {
  --width: min(420px, 92vw);
  --border-radius: 20px;
}

.modal-navegador::part(content) {
  max-height: 88vh;
}

.modal-navegador-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.modal-navegador-icono {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  background: rgba(37, 211, 102, 0.14);
  color: #16a34a;
  font-size: 22px;
}

.modal-navegador-header p {
  margin: 4px 0 0;
  color: #6d829c;
  font-size: 0.88rem;
}

.modal-navegador-btn {
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal-navegador-cancelar {
  width: 100%;
}
</style>
