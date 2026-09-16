const {
  obtenerEquipo,
  autenticarUsuarioEquipo,
  autenticarUsuarioEquipoPorId,
  crearUsuarioEquipo,
  editarUsuarioEquipo,
  actualizarImagenPerfil,
  obtenerImagenPerfil,
  eliminarUsuarioEquipo,
} = require("../querys/equipo.query");
const { crearCodigo2FA, validarCodigo2FA } = require("../querys/auth2fa.query");
const { obtenerTurnoDeFecha } = require("../querys/horarios.query");
const { AppError } = require("../utils/errors");
const { v2: cloudinary } = require("cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const manejarError = (res, error) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  console.error("Error inesperado en equipo.controller:", error);
  return res.status(500).json({ error: "Error interno del servidor." });
};

const obtenerPublicIdDesdeUrl = (url) => {
  if (typeof url !== "string" || !url) return null;
  const coincidencia = url.match(/\/image\/upload\/(?:v\d+\/)?(.+)$/);
  if (!coincidencia) return null;
  return coincidencia[1].replace(/\.[^/.?]+(?:\?.*)?$/, "");
};

const eliminarImagenCloudinary = async (url) => {
  const publicId = obtenerPublicIdDesdeUrl(url);
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  } catch (error) {
    console.error(
      "No se pudo eliminar la imagen de Cloudinary:",
      error.message,
    );
  }
};

/* ───────────── Validación de horario (cajero / recepcionista / operador) ───────────── */

const ROLES_CON_HORARIO_OBLIGATORIO = ["cajero", "recepcionista", "operador"];
const MARGEN_ANTICIPO_MIN = 30; // permite entrar 30 min antes del inicio del turno

/** Fecha (YYYY-MM-DD) y minutos desde medianoche, calculados en horario de Centroamérica. */
const obtenerFechaHoraCentroamerica = () => {
  const ahora = new Date();
  const zona = "America/El_Salvador";

  const fecha = new Intl.DateTimeFormat("en-CA", {
    timeZone: zona,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(ahora); // => "YYYY-MM-DD"

  const horaTexto = new Intl.DateTimeFormat("en-GB", {
    timeZone: zona,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(ahora); // => "HH:mm"

  return { fecha, minutosAhora: horaTextoAMinutos(horaTexto) };
};

/** Convierte "HH:mm" o "HH:mm:ss" a minutos desde medianoche. */
const horaTextoAMinutos = (horaTexto) => {
  if (!horaTexto) return null;
  const [h, m] = horaTexto.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};

const validarAccesoPorHorario = async (usuario) => {
  const rol = (usuario.rol || "").toLowerCase();

  if (!ROLES_CON_HORARIO_OBLIGATORIO.includes(rol)) {
    return { permitido: true };
  }

  const { fecha, minutosAhora } = obtenerFechaHoraCentroamerica();
  const turno = await obtenerTurnoDeFecha(usuario.id, fecha);

  if (!turno || turno.libre) {
    return {
      permitido: false,
      motivo: "El acceso solo se habilita en horario programado",
    };
  }

  // Turnos con horas extra habilitadas no tienen restricción de ventana
  if (turno.horasExtra) {
    return { permitido: true };
  }

  const inicioMin = horaTextoAMinutos(turno.horaInicio) - MARGEN_ANTICIPO_MIN;
  const finMin = horaTextoAMinutos(turno.horaFin);

  if (minutosAhora == null || inicioMin == null || finMin == null) {
    // Datos de turno inválidos: no bloqueamos por un problema de datos
    return { permitido: true };
  }

  const cruzaMedianoche = inicioMin > finMin;
  const fueraDeHorario = cruzaMedianoche
    ? minutosAhora < inicioMin && minutosAhora > finMin
    : minutosAhora < inicioMin || minutosAhora > finMin;

  if (fueraDeHorario) {
    return {
      permitido: false,
      motivo: `El acceso solo se habilita en horario programado (${turno.horaInicio} - ${turno.horaFin})`,
    };
  }

  return { permitido: true };
};

/* ───────────── Controladores ───────────── */

const listarEquipo = async (_req, res) => {
  try {
    const equipo = await obtenerEquipo();
    res.status(200).json(equipo);
  } catch (error) {
    manejarError(res, error);
  }
};

const autenticarEquipo = async (req, res) => {
  try {
    const { codigo } = req.body;

    if (!codigo) {
      return res.status(400).json({ error: "El código es obligatorio." });
    }

    const usuario = await autenticarUsuarioEquipo(codigo);

    if (!usuario) {
      return res
        .status(401)
        .json({ error: "Código inválido o usuario inactivo." });
    }

    // Verificar si el usuario tiene correo configurado
    if (!usuario.correo) {
      return res
        .status(400)
        .json({ error: "El usuario no tiene correo configurado para 2FA." });
    }

    // ── Validación de horario (cajero / recepcionista / operador) ──
    // Se hace ANTES de generar y enviar el código 2FA para no
    // desperdiciar correos si el usuario está fuera de su turno.
    const chequeoHorario = await validarAccesoPorHorario(usuario);
    if (!chequeoHorario.permitido) {
      return res.status(403).json({
        fueraDeHorario: true,
        error: chequeoHorario.motivo,
      });
    }

    // Generar y enviar código 2FA
    try {
      await crearCodigo2FA(usuario.id, usuario.correo);
    } catch (error) {
      console.error("Error al enviar código 2FA:", error);
      // No fallar el login si falla el envío del correo, pero notificar
      return res.status(200).json({
        requiere2FA: true,
        usuarioId: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
        errorEnvio: "No se pudo enviar el código por correo. Intenta reenviar.",
      });
    }

    // Devolver usuario sin datos sensibles, pero con indicador de que requiere 2FA
    res.status(200).json({
      requiere2FA: true,
      usuarioId: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol,
    });
  } catch (error) {
    manejarError(res, error);
  }
};

const verificar2FA = async (req, res) => {
  console.log("[verificar2FA] === INICIO ===");
  console.log("[verificar2FA] Body recibido:", req.body);

  try {
    const { usuarioId, codigo } = req.body;

    console.log(
      `[verificar2FA] Recibido: usuarioId=${usuarioId}, codigo=${codigo}`,
    );

    if (!usuarioId || !codigo) {
      console.log("[verificar2FA] Error: Faltan datos");
      return res
        .status(400)
        .json({ error: "usuarioId y código son obligatorios." });
    }

    await validarCodigo2FA(usuarioId, codigo);

    // Si el código es válido, obtener usuario completo
    const usuario = await autenticarUsuarioEquipoPorId(usuarioId);

    if (!usuario) {
      console.log("[verificar2FA] Error: Usuario no encontrado");
      return res.status(401).json({ error: "Usuario no encontrado." });
    }

    console.log("[verificar2FA] Usuario autenticado correctamente:", usuario);
    res.status(200).json(usuario);
  } catch (error) {
    console.error("[verificar2FA] Error:", error);
    manejarError(res, error);
  }
};

const crearEquipo = async (req, res) => {
  try {
    const usuario = await crearUsuarioEquipo(req.body);
    res.status(201).json(usuario);
  } catch (error) {
    manejarError(res, error);
  }
};

const editarEquipo = async (req, res) => {
  try {
    const imagenAnterior = await obtenerImagenPerfil(req.params.id);
    const usuario = await editarUsuarioEquipo(req.params.id, req.body);
    if (imagenAnterior && usuario.imagenPerfil !== imagenAnterior) {
      await eliminarImagenCloudinary(imagenAnterior);
    }
    res.status(200).json(usuario);
  } catch (error) {
    manejarError(res, error);
  }
};

const subirImagenPerfil = async (req, res) => {
  try {
    if (!req.file) {
      throw new AppError("Debes seleccionar una imagen válida.", 400);
    }

    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      throw new AppError("Cloudinary no está configurado en el servidor.", 500);
    }

    const imagenAnterior = await obtenerImagenPerfil(req.params.id);
    const resultado = await new Promise((resolve, reject) => {
      const carga = cloudinary.uploader.upload_stream(
        { folder: "lavanderia-salinas/perfiles", resource_type: "image" },
        (error, resultadoCarga) =>
          error ? reject(error) : resolve(resultadoCarga),
      );
      carga.end(req.file.buffer);
    });

    const usuario = await actualizarImagenPerfil(
      req.params.id,
      resultado.secure_url,
    );
    await eliminarImagenCloudinary(imagenAnterior);
    res.status(200).json(usuario);
  } catch (error) {
    manejarError(res, error);
  }
};

const eliminarEquipo = async (req, res) => {
  try {
    const imagenPerfil = await eliminarUsuarioEquipo(req.params.id);
    await eliminarImagenCloudinary(imagenPerfil);
    res.status(204).send();
  } catch (error) {
    manejarError(res, error);
  }
};

const validarConfiable = async (req, res) => {
  try {
    const { usuarioId } = req.body;

    if (!usuarioId) {
      return res.status(400).json({ error: "usuarioId es obligatorio." });
    }

    const usuario = await autenticarUsuarioEquipoPorId(usuarioId);

    if (!usuario) {
      return res
        .status(401)
        .json({ error: "Usuario no encontrado o inactivo." });
    }

    const chequeoHorario = await validarAccesoPorHorario(usuario);
    if (!chequeoHorario.permitido) {
      return res.status(403).json({
        fueraDeHorario: true,
        error: chequeoHorario.motivo,
      });
    }

    res.status(200).json(usuario);
  } catch (error) {
    manejarError(res, error);
  }
};

module.exports = {
  listarEquipo,
  autenticarEquipo,
  verificar2FA,
  crearEquipo,
  editarEquipo,
  eliminarEquipo,
  subirImagenPerfil,
  validarConfiable,
};
