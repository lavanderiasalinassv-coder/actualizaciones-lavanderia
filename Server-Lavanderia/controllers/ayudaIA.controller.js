const { pool } = require("../database/MySQLConexion");
const { consultarConocimiento } = require("./saliConocimiento.controller");
const {
  obtenerOrdenes,
  obtenerOrdenesPorTerminos,
} = require("../querys/orden.query");
const { obtenerEquipo } = require("../querys/equipo.query");
const { listarMovimientos } = require("../querys/movimientosCaja.query");
const { obtenerTurno } = require("../querys/turno.query");
const { leerConfiguracionModelos } = require("../database/modelosia");

const MAX_MENSAJE = 2000;
const MAX_HISTORIAL = 12;
const esperar = (milisegundos) =>
  new Promise((resolve) => setTimeout(resolve, milisegundos));

const esPreguntaDeProcedimiento = (mensaje) =>
  /\b(?:c[oó]mo\s+(?:puedo\s+)?(?:cambiar|modificar|editar|actualizar|crear|registrar|abrir|cerrar|usar|agregar|quitar|eliminar|consultar|buscar|ver)|d[oó]nde\s+(?:puedo\s+)?(?:ver|buscar|consultar))\b/i.test(
    mensaje,
  );

const requiereDatosOperativos = (mensaje) =>
  !esPreguntaDeProcedimiento(mensaje) &&
  /\b(?:cu[aá]nt[oa]s?|total|resumen|muestra|mostrar|lista|listar|busca|buscar|consulta|consultar|revisa|revisar|estado|estatus|pendientes?|stock|existencias?|disponibles?|ventas?|gastos?|cierre|turno|saldos?|monto|hay|tenemos|quedan|queda|existe|cu[aá]l(?:es)?\s+(?:es|fue|son))\b/i.test(
    mensaje,
  ) &&
  /\b(?:orden(?:es)?|pedido(?:s)?|caja|turno|inventario|insumo(?:s)?|producto(?:s)?|cliente(?:s)?|equipo|promoci[oó]n(?:es)?|cat[aá]logo|tarea(?:s)?|gasto(?:s)?|venta(?:s)?|cierre(?:s)?)\b/i.test(
    mensaje,
  );

const requiereBuscarOrden = (mensaje) =>
  /\b(?:orden(?:es)?|pedido(?:s)?)\b/i.test(mensaje) &&
  (/\d/.test(mensaje) ||
    (!esPreguntaDeProcedimiento(mensaje) &&
      /\b(?:busca|buscar|consulta|consultar|revisa|revisar|estado|estatus|cliente|tel[eé]fono|n[uú]mero|qui[eé]n|quien|c[oó]mo va|c[oó]mo est[aá])\b/i.test(
        mensaje,
      )));

const extraerTerminosConsultaOrden = (mensaje) => {
  const numeros = mensaje.match(/\d{1,15}/g) || [];
  if (numeros.length) {
    return {
      numeros: [...new Set(numeros)],
      nombre: "",
      buscarTelefono:
        numeros[0].length >= 7 || /\b(?:tel[eé]fono|celular|m[oó]vil)\b/i.test(mensaje),
    };
  }

  const palabrasIgnoradas = new Set([
    "orden", "ordenes", "pedido", "pedidos", "estado", "estatus",
    "busca", "buscar", "consulta", "consultar", "revisa", "revisar",
    "dime", "decir", "quiero", "saber", "ver", "muestra", "mostrar",
    "cliente", "telefono", "numero", "cual", "como", "esta", "estan",
    "por", "favor", "de", "del", "la", "el", "los", "las", "una", "un",
    "que", "para", "con", "me", "mi",
  ]);
  const nombre = mensaje
    .replace(/\d{1,15}/g, " ")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\s]/gu, " ")
    .split(/\s+/)
    .filter((palabra) => palabra.length >= 3 && !palabrasIgnoradas.has(palabra))
    .slice(0, 5)
    .join(" ");

  return { numeros: [...new Set(numeros)], nombre, buscarTelefono: false };
};

const CONOCIMIENTO_BASE_SALI = `
Guía base de Lavandería Salinas:
- Principal muestra accesos rápidos, tareas y asistencia. Los accesos cambian según el rol.
- Vender permite crear una orden: seleccionar o registrar cliente, agregar servicios/artículos del catálogo, indicar prendas, fecha/hora de entrega, notas, descuentos y método de pago. Para cobros operativos puede requerirse un turno de caja abierto.
- Órdenes permite buscar y revisar la cola de trabajo. Una orden puede estar pendiente, en proceso, lista, entregada, cerrada o cancelada. Las cerradas son parte del historial y deben consultarse cuando el usuario las pida; no las confundas con las canceladas. En el detalle se administran servicios, cargos extra, fotos, notas internas, anticipos y pagos (efectivo, tarjeta o transferencia). No afirmes que una orden fue modificada: explica al usuario cómo hacerlo.
- Una orden requiere intervención si está cerrada sin pago completo, si su entrega no aparece en el cierre de caja correspondiente o si alguno de sus anticipos no aparece en ese cierre. Al ser consultada, explica únicamente los motivos presentes en el resumen operativo.
- Calendario de entregas organiza las órdenes por fecha de entrega y abre su detalle para consultar o actualizar su estado.
- Caja y Reportes permite abrir/cerrar turno, ver ventas, pagos, movimientos, depósitos, gastos, cancelaciones e historial de cierres. No inventes montos; usa solo el resumen operativo actual cuando esté disponible.
- Clientes administra perfiles y muestra historial/cantidad de órdenes. Catálogo administra los servicios y artículos que se agregan a las órdenes, con categoría, precio, unidad, variantes e insumos.
- Inventario administra insumos, cantidades, costo, valor y reposición (refill); los productos con cantidad baja necesitan revisión.
- Promociones crea y edita descuentos por porcentaje o dinero, vigencia, fechas y tipo de cliente. Facturas prepara una factura a partir de una orden.
- Equipo administra usuarios y roles. Horarios gestiona turnos, asistencia, entradas, salidas, pausas, tardanzas y pagos. Tareas permite revisar y completar tareas asignadas.
- Guía es el centro de ayuda de la aplicación: tendrá un índice y buscador de instrucciones de uso, además de tutoriales en video. Si el usuario pregunta dónde encontrar ayuda, indícale que abra el menú de la campana de notificaciones y seleccione Guía; si pide que lo lleves a la Guía, la aplicación puede abrir esa vista.
- Configuración incluye apariencia, conexión API, respaldo, base de datos, mantenimiento y, solo para el modo desarrollador, Entrenamiento de Burbujita. Entrenamiento de Burbujita agrega conocimiento personalizado; no es necesario usarlo para esta guía base.
`;

const CAMPOS_PERSONAL = [
  "inventario",
  "tareasPendientes",
  "catalogo",
  "promocionesVigentes",
  "conocimientoRelevante",
];

const RESTRICCIONES_PERSONAL =
  "NO debe recibir información de caja, cierres, montos agregados, órdenes con intervención, cantidad de clientes, gastos ni datos del equipo (nómina/roles).";

const PERMISOS_POR_ROL = {
  Administrador: {
    campos: [
      "ordenesPorEstado",
      "ordenesCerradas",
      "ordenesConIntervencion",
      "inventario",
      "tareasPendientes",
      "totalClientes",
      "turnoCaja",
      "catalogo",
      "promocionesVigentes",
      "gastos",
      "equipo",
      "conocimientoRelevante",
    ],
    descripcion:
      "tiene acceso completo: operación diaria, caja, cierres, órdenes con intervención, gastos y datos del equipo.",
  },
  Personal: {
    campos: CAMPOS_PERSONAL,
    descripcion:
      `solo tiene acceso a operación diaria: inventario, tareas, catálogo, promociones y búsqueda de órdenes por número/nombre/teléfono. ${RESTRICCIONES_PERSONAL}`,
  },
  Operador: {
    campos: CAMPOS_PERSONAL,
    descripcion:
      `es Operador. Prioriza ayuda sobre el flujo de trabajo, prendas, inventario y tareas asignadas. Puede consultar órdenes por número, nombre o teléfono. ${RESTRICCIONES_PERSONAL}`,
  },
  Cajero: {
    campos: CAMPOS_PERSONAL,
    descripcion:
      `es Cajero. Prioriza ayuda sobre atención en mostrador, búsqueda de órdenes, catálogo, promociones y tareas de su jornada. ${RESTRICCIONES_PERSONAL}`,
  },
  Recepcionista: {
    campos: CAMPOS_PERSONAL,
    descripcion:
      `es Recepcionista. Prioriza ayuda sobre recibir prendas, registrar datos del cliente, fechas de entrega, catálogo, promociones y búsqueda de órdenes. ${RESTRICCIONES_PERSONAL}`,
  },
};

// Normaliza las variantes de rol sin perder el cargo con el que trabaja la persona.
const normalizarRol = (rol) => {
  const valor = (rol || "").toString().trim().toLowerCase();
  if (["administrador", "admin"].includes(valor)) return "Administrador";
  if (valor === "operador") return "Operador";
  if (["cajero", "caja"].includes(valor)) return "Cajero";
  if (valor === "recepcionista") return "Recepcionista";
  return "Personal";
};

const obtenerPermisos = (rol) => PERMISOS_POR_ROL[normalizarRol(rol)];

// Se queda solo con los campos del contexto que el rol tiene permitido ver.
const filtrarContextoPorRol = (contexto, rol) => {
  const permisos = obtenerPermisos(rol);
  const contextoFiltrado = {};
  for (const campo of permisos.campos) {
    if (campo in contexto) contextoFiltrado[campo] = contexto[campo];
  }
  return contextoFiltrado;
};

const textoSeguro = (valor, limite = MAX_MENSAJE) =>
  typeof valor === "string" ? valor.trim().slice(0, limite) : "";

// Errores de conexión (no de la query en sí) que justifican un reintento:
// suelen pasar cuando el pool reutiliza una conexión que la base de datos
// ya había cerrado por inactividad.
const esErrorConexionTemporal = (error) =>
  [
    "ECONNRESET",
    "ETIMEDOUT",
    "PROTOCOL_CONNECTION_LOST",
    "ECONNREFUSED",
    "EPIPE",
  ].includes(error?.code);

// orden.turnoHuerfano y orden.anticipos[].cierreHuerfano ya vienen calculados
// por obtenerOrdenes(), así que aquí solo se traducen a motivos legibles.
const motivoIntervencionOrden = (orden) => {
  const ordenCerrada = ["cerrada", "Cerrada-Cancelada"].includes(orden.estado);
  const motivos = [];

  if (ordenCerrada && orden.estadoPago !== "pagado") {
    motivos.push("Orden cerrada sin pago completo");
  }
  if (orden?.anticipos?.some((anticipo) => anticipo.cierreHuerfano === true)) {
    motivos.push("Anticipo no encontrado en el cierre");
  }
  if (orden.turnoHuerfano === true) {
    motivos.push("Entrega no encontrada en el cierre");
  }

  return motivos;
};

const construirContextoOperacion = async (ordenesDetalladas) => {
  const [
    inventario,
    tareas,
    clientes,
    catalogo,
    promociones,
    turno,
    movimientosCaja,
    equipoCompleto,
  ] = await Promise.all([
    pool.query(`SELECT nombre, categoria, cantidad, unidad_medida AS unidad
      FROM inventario_productos ORDER BY cantidad ASC, nombre ASC LIMIT 20`),
    pool.query(`SELECT titulo, prioridad, asignada_a_nombre AS asignadaA
      FROM tareas WHERE completada = 0 ORDER BY prioridad DESC, creada_en DESC LIMIT 15`),
    pool.query("SELECT COUNT(*) AS cantidad FROM clientes"),
    pool.query(`SELECT ci.nombre, ci.tipo, ci.precio, ci.unidad, cc.nombre AS categoria
      FROM catalogo_items ci LEFT JOIN catalogo_categorias cc ON cc.id = ci.categoria_id
      ORDER BY ci.nombre ASC LIMIT 25`),
    pool.query(`SELECT nombre, tipo_descuento AS tipoDescuento, valor, fecha_inicio AS fechaInicio, fecha_fin AS fechaFin
      FROM promociones WHERE vigente = 1 ORDER BY fecha_fin ASC LIMIT 20`),
    obtenerTurno(),
    listarMovimientos(), // solo Administrador ve "gastos" (se filtra después por rol)
    obtenerEquipo(), // solo Administrador ve "equipo" (se filtra después por rol)
  ]);

  const ordenesPorEstadoMapa = new Map();
  for (const orden of ordenesDetalladas) {
    const acumulado = ordenesPorEstadoMapa.get(orden.estado) || {
      estado: orden.estado,
      cantidad: 0,
      total: 0,
    };
    acumulado.cantidad += 1;
    acumulado.total = Number((acumulado.total + orden.total).toFixed(2));
    ordenesPorEstadoMapa.set(orden.estado, acumulado);
  }

  const ordenesCerradas = ordenesDetalladas
    .filter((orden) => ["cerrada", "Cerrada-Cancelada"].includes(orden.estado))
    .map((orden) => ({
      numero: orden.numero,
      estadoPago: orden.estadoPago,
      total: orden.total,
      entregadoAt: orden.entregadoAt,
    }));

  const ordenesConIntervencion = ordenesDetalladas
    .map((orden) => ({ orden, motivos: motivoIntervencionOrden(orden) }))
    .filter(({ motivos }) => motivos.length > 0)
    .map(({ orden, motivos }) => ({
      numero: orden.numero,
      estado: orden.estado,
      estadoPago: orden.estadoPago,
      total: orden.total,
      motivos,
    }));

  return {
    ordenesPorEstado: [...ordenesPorEstadoMapa.values()],
    ordenesCerradas,
    ordenesConIntervencion,
    inventario: inventario[0].map((fila) => ({
      nombre: fila.nombre,
      categoria: fila.categoria,
      cantidad: Number(fila.cantidad),
      unidad: fila.unidad,
    })),
    tareasPendientes: tareas[0].map((fila) => ({
      titulo: fila.titulo,
      prioridad: fila.prioridad,
      asignadaA: fila.asignadaA,
    })),
    totalClientes: Number(clientes[0][0]?.cantidad || 0),
    turnoCaja: {
      abierto: turno.abierto,
      numeroCaja: turno.numeroCaja,
      usuario: turno.usuario,
      apertura: turno.apertura,
      horaInicio: turno.horaInicio,
    },
    catalogo: catalogo[0].map((fila) => ({
      nombre: fila.nombre,
      tipo: fila.tipo,
      categoria: fila.categoria,
      precio: Number(fila.precio),
      unidad: fila.unidad,
    })),
    promocionesVigentes: promociones[0].map((fila) => ({
      nombre: fila.nombre,
      tipoDescuento: fila.tipoDescuento,
      valor: Number(fila.valor),
      fechaInicio: fila.fechaInicio,
      fechaFin: fila.fechaFin,
    })),
    gastos: movimientosCaja
      .filter((mov) => mov.tipo === "gasto")
      .slice(0, 20)
      .map((mov) => ({
        concepto: mov.concepto,
        monto: mov.monto,
        usuario: mov.usuario,
        creadoEn: mov.creadoAt,
      })),
    // Se excluyen a propósito "correo" y "codigo" (el PIN de acceso): nunca
    // deben llegar al prompt de la IA.
    equipo: equipoCompleto.map((persona) => ({
      nombre: persona.nombre,
      rol: persona.rol,
      activo: persona.activo,
    })),
  };
};

const construirInstruccionSistema = ({
  usuario,
  contexto,
  esPrimerMensaje,
}) => {
  const nombre = textoSeguro(usuario?.nombre, 80) || "Usuario";
  const rol = normalizarRol(usuario?.rol);
  const permisos = obtenerPermisos(rol);

  const instruccionSaludo = esPrimerMensaje
    ? `Este es el primer mensaje de la conversación. Empieza con un saludo breve, casual y natural, y llama a la persona por su nombre (${nombre}) si el nombre está disponible. No te presentes ni digas "Soy Burbujita", "Soy tu asistente" ni repitas el nombre de la aplicación en el saludo; responde enseguida a su pregunta.`
    : `Esta conversación ya empezó: no vuelvas a saludar ni repitas el nombre de ${nombre} en cada respuesta. Ve directo a responder de forma natural.`;

  return `Eres Burbujita, asistente de consulta de la aplicación de lavandería Salinas. Responde siempre en español, salvo que te escriban en otro idioma, y hazlo de forma clara, breve y natural. Puedes usar emojis con moderación. Sigue estas reglas de saludo: ${instruccionSaludo} Nunca empieces una respuesta con "Soy Burbujita, tu asistente en Salinas" ni otra presentación equivalente. Puedes analizar el resumen operativo y el conocimiento personalizado que se te entregan, pero no inventes datos ni afirmes haber realizado cambios: eres solo de consulta. Cuando haya conocimientoRelevante, úsalo como referencia prioritaria para responder. No solicites ni reveles PINes, códigos de acceso, correos, direcciones u otra información sensible, salvo el teléfono/nombre cuando forme parte de una orden que el propio usuario está consultando por su número, nombre o teléfono.

Cuando el usuario solicite una lista o comparación de varias promociones, órdenes, productos u otros registros, responde con una tabla Markdown real usando esta estructura: | Columna | ... |, seguida de una fila | --- | ... | y después una fila por registro. No pongas esa tabla dentro de un bloque de código y no reemplaces las barras verticales por texto corrido.

Estás hablando con ${nombre}, cuyo rol es ${rol}.

Permisos de ${nombre} (rol ${rol}): ${permisos.descripcion}
El resumen operativo que se te adjunta ya viene filtrado según ese rol: solo contiene lo que ${nombre} tiene permitido ver. Si ${nombre} pregunta por algo que no aparece en el resumen (caja, cierres, montos agregados, órdenes con intervención, cantidad de clientes, gastos o datos del equipo/nómina), responde con amabilidad que esa información es exclusiva de un Administrador y sugiere que lo consulte con uno, sin especular sobre cifras ni detalles que no tienes.

Si el campo "ordenesEncontradas" trae resultados, son las órdenes que coinciden con lo que ${nombre} preguntó (por número, nombre de cliente o teléfono), con su detalle completo: items, fotos, cargos extra, anticipos y movimientos (cada movimiento indica quién hizo el cambio en "usuarioNombre", qué hizo en "texto" y cuándo en "fecha"). Debes usar esos registros como fuente de verdad y responder directamente. Nunca digas que una orden no existe si "ordenesEncontradas" trae una o más órdenes; el número de orden corresponde a su campo "numero". Si "ordenesEncontradas" está vacío pero el mensaje parece pedir una orden específica, dile que no encontraste una orden que coincida y pídele el número, nombre o teléfono correcto.

${CONOCIMIENTO_BASE_SALI}
Resumen operativo actual (ya filtrado para este usuario): ${JSON.stringify(contexto)}`;
};

const pedirRespuestaGemini = async ({
  mensaje,
  historial,
  usuario,
  contexto,
  esPrimerMensaje,
  intento = 0,
  modelo,
}) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const error = new Error(
      "La ayuda con IA no está configurada. Agrega GEMINI_API_KEY al archivo .env del servidor.",
    );
    error.statusCode = 503;
    throw error;
  }

  const { geminiModel, geminiFallbackModel } = leerConfiguracionModelos();
  const model = modelo || geminiModel;
  const contenidos = historial.map((item) => ({
    role: item.rol === "assistant" ? "model" : "user",
    parts: [{ text: item.texto }],
  }));
  contenidos.push({ role: "user", parts: [{ text: mensaje }] });

  const controlador = new AbortController();
  const timeout = setTimeout(() => controlador.abort(), 15000);
  try {
    const respuesta = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        signal: controlador.signal,
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: construirInstruccionSistema({
                  usuario,
                  contexto,
                  esPrimerMensaje,
                }),
              },
            ],
          },
          contents: contenidos,
          generationConfig: { temperature: 0.35, maxOutputTokens: 700 },
        }),
      },
    );
    const datos = await respuesta.json();
    if (!respuesta.ok) {
      console.error(
        "Gemini rechazó la solicitud:",
        datos?.error?.message || respuesta.status,
      );
      const errorTemporal = [408, 429, 500, 502, 503, 504].includes(
        respuesta.status,
      );
      if (errorTemporal && intento < 1) {
        await esperar((intento + 1) * 1200 + Math.floor(Math.random() * 350));
        return pedirRespuestaGemini({
          mensaje,
          historial,
          usuario,
          contexto,
          esPrimerMensaje,
          intento: intento + 1,
          modelo: intento === 1 ? geminiFallbackModel : model,
        });
      }
      throw Object.assign(new Error("gemini_agotado"), {
        statusCode: 503,
        esGeminiAgotado: true,
      });
    }
    const texto = datos?.candidates?.[0]?.content?.parts
      ?.map((parte) => parte.text)
      .filter(Boolean)
      .join("\n")
      ?.trim();
    if (!texto) {
      const error = new Error(
        "La IA no devolvió una respuesta. Intenta reformular la pregunta.",
      );
      error.statusCode = 502;
      throw error;
    }
    return texto;
  } finally {
    clearTimeout(timeout);
  }
};

// Respaldo con Groq (API compatible con OpenAI). Se usa solo si Gemini falla tras sus reintentos.
const pedirRespuestaGroq = async ({
  mensaje,
  historial,
  usuario,
  contexto,
  esPrimerMensaje,
  intento = 0,
}) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    const error = new Error(
      "No pude obtener una respuesta de la IA. Revisa la clave y el modelo configurados.",
    );
    error.statusCode = 502;
    throw error;
  }

  const { groqModel } = leerConfiguracionModelos();
  const model = groqModel;
  const mensajes = [
    {
      role: "system",
      content: construirInstruccionSistema({
        usuario,
        contexto,
        esPrimerMensaje,
      }),
    },
    ...historial.map((item) => ({
      role: item.rol === "assistant" ? "assistant" : "user",
      content: item.texto,
    })),
    { role: "user", content: mensaje },
  ];

  const controlador = new AbortController();
  const timeout = setTimeout(() => controlador.abort(), 15000);
  try {
    const respuesta = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        signal: controlador.signal,
        body: JSON.stringify({
          model,
          messages: mensajes,
          temperature: 0.35,
          max_tokens: 700,
        }),
      },
    );
    const datos = await respuesta.json();
    if (!respuesta.ok) {
      console.error(
        "Groq rechazó la solicitud:",
        datos?.error?.message || respuesta.status,
      );
      const error = new Error(
        "Burbujita no está disponible en este momento. Intenta nuevamente en unos segundos.",
      );
      error.statusCode = 503;
      throw error;
    }
    const texto = datos?.choices?.[0]?.message?.content?.trim();
    if (!texto) {
      const error = new Error(
        "La IA no devolvió una respuesta. Intenta reformular la pregunta.",
      );
      error.statusCode = 502;
      throw error;
    }
    return texto;
  } finally {
    clearTimeout(timeout);
  }
};

const pedirRespuestaIA = async (parametros) => {
  try {
    return await pedirRespuestaGemini(parametros);
  } catch (error) {
    if (process.env.GROQ_API_KEY) {
      console.warn(
        "Gemini falló, usando Groq de respaldo:",
        error?.message || "Error desconocido",
      );
      return pedirRespuestaGroq(parametros);
    }

    if (error?.name === "AbortError") {
      error.message =
        "Gemini tardó demasiado en responder y no hay un respaldo de IA configurado.";
    }
    throw error;
  }
};

const responderAyuda = async (req, res) => {
  const inicioConsulta = Date.now();
  let etapaConsulta = "contexto";
  const mensaje = textoSeguro(req.body?.mensaje);
  if (!mensaje)
    return res
      .status(400)
      .json({ error: "Escribe una pregunta para continuar." });

  const historial = Array.isArray(req.body?.historial)
    ? req.body.historial
        .slice(-MAX_HISTORIAL)
        .map((item) => ({
          rol: item?.rol === "assistant" ? "assistant" : "user",
          texto: textoSeguro(item?.texto),
        }))
        .filter((item) => item.texto)
    : [];

  const usuario = req.body?.usuario;
  const rol = usuario?.rol;
  const esPrimerMensaje = historial.length === 0;
  const necesitaContextoOperativo = requiereDatosOperativos(mensaje);
  const necesitaBuscarOrden = requiereBuscarOrden(mensaje);
  const necesitaDatosOrdenes =
    necesitaContextoOperativo &&
    !necesitaBuscarOrden &&
    /\b(?:orden(?:es)?|pedido(?:s)?)\b/i.test(mensaje);
  const necesitaContextoGeneral =
    necesitaContextoOperativo && !necesitaBuscarOrden;
  const terminosConsultaOrden = extraerTerminosConsultaOrden(mensaje);

  try {
    let ordenesDetalladas = [];
    let contextoCompleto = {};
    let conocimiento;
    const cargarContexto = async () => {
      if (necesitaDatosOrdenes) {
        ordenesDetalladas = await obtenerOrdenes();
      } else if (
        necesitaBuscarOrden &&
        (terminosConsultaOrden.numeros.length || terminosConsultaOrden.nombre.length >= 3)
      ) {
        ordenesDetalladas = await obtenerOrdenesPorTerminos(terminosConsultaOrden);
      } else {
        ordenesDetalladas = [];
      }
      [contextoCompleto, conocimiento] = await Promise.all([
        necesitaContextoGeneral
          ? construirContextoOperacion(ordenesDetalladas)
          : Promise.resolve({}),
        consultarConocimiento(mensaje),
      ]);
    };

    try {
      await cargarContexto();
    } catch (errorDatos) {
      if (!esErrorConexionTemporal(errorDatos)) throw errorDatos;
      console.warn(
        "Reintentando ayuda IA tras error de conexión a la base de datos:",
        errorDatos.code,
      );
      await esperar(400);
      await cargarContexto();
    }

    const tiempoContexto = Date.now() - inicioConsulta;
    const ordenesEncontradas = ordenesDetalladas;

    if (
      necesitaBuscarOrden &&
      terminosConsultaOrden.numeros.length > 0 &&
      ordenesEncontradas.length === 0
    ) {
      console.info(
        `[ayuda-ia] búsqueda orden sin resultados números=${terminosConsultaOrden.numeros.join(",")}`,
      );
      return res.json({
        respuesta: `No encontré una orden con el número ${terminosConsultaOrden.numeros[0]}. Revisa el número e inténtalo de nuevo.`,
      });
    }

    // Se filtra el resumen operativo según el rol ANTES de mandarlo a la IA.
    // "ordenesEncontradas" se agrega SIEMPRE, sin filtrar por rol: es consulta
    // puntual de estado de una orden por número/nombre/teléfono.
    const contextoFiltrado = {
      ...filtrarContextoPorRol(
        { ...contextoCompleto, conocimientoRelevante: conocimiento },
        rol,
      ),
      ordenesEncontradas,
    };

    etapaConsulta = "proveedor-ia";
    const inicioIA = Date.now();
    const respuesta = await pedirRespuestaIA({
      mensaje,
      historial,
      usuario,
      contexto: contextoFiltrado,
      esPrimerMensaje,
    });
    console.info(
      `[ayuda-ia] completada contexto=${tiempoContexto}ms ia=${Date.now() - inicioIA}ms total=${Date.now() - inicioConsulta}ms`,
    );
    return res.json({ respuesta });
  } catch (error) {
    console.error(
      `[ayuda-ia] error etapa=${etapaConsulta} total=${Date.now() - inicioConsulta}ms:`,
      error.message,
    );
    return res
      .status(error.statusCode || 500)
      .json({ error: error.message || "No se pudo procesar tu pregunta." });
  }
};

module.exports = { responderAyuda };
