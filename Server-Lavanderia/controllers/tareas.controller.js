const {
  obtenerTareas,
  obtenerTareaPorId,
  crearTarea,
  completarTarea,
  reasignarTarea,
  eliminarTarea,
  limpiarCompletadas,
} = require("../querys/tareas.query");
const { AppError } = require("../utils/errors");

const manejarError = (res, error) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  console.error("Error inesperado en tareas.controller:", error);
  return res.status(500).json({ error: "Error interno del servidor." });
};

// GET y DELETE mandan el usuario por query string; POST y PATCH lo mandan en el body.
const obtenerUsuarioActual = (req) => {
  const fuente =
    req.method === "GET" || req.method === "DELETE" ? req.query : req.body;

  const id = fuente?.usuarioId;
  const nombre = fuente?.usuarioNombre;
  const rol = fuente?.usuarioRol;

  if (!id && !nombre) return null;

  return {
    id: id ?? "",
    nombre: nombre ?? "",
    rol: (rol ?? "").toLowerCase(),
  };
};

/* ---- Lectura ---- */

const listarTareas = async (req, res) => {
  try {
    const usuarioActual = obtenerUsuarioActual(req);
    const esAdmin = usuarioActual?.rol === "administrador";

    const tareas = await obtenerTareas({
      usuarioId: usuarioActual?.id,
      esAdmin,
    });

    res.status(200).json(tareas);
  } catch (error) {
    manejarError(res, error);
  }
};

const obtenerTarea = async (req, res) => {
  try {
    const tarea = await obtenerTareaPorId(req.params.id);
    if (!tarea) {
      return res.status(404).json({ error: "No se encontró la tarea." });
    }
    res.status(200).json(tarea);
  } catch (error) {
    manejarError(res, error);
  }
};

/* ---- Escritura ---- */

const crearTareaController = async (req, res) => {
  try {
    const usuarioActual = obtenerUsuarioActual(req);
    const tarea = await crearTarea(req.body, usuarioActual);
    res.status(201).json(tarea);
  } catch (error) {
    manejarError(res, error);
  }
};

const completarTareaController = async (req, res) => {
  try {
    const usuarioActual = obtenerUsuarioActual(req);
    const completada = req.body?.completada ?? true;
    const nota = req.body?.nota ?? "";
    const tarea = await completarTarea(
      req.params.id,
      completada,
      nota,
      usuarioActual,
    );
    res.status(200).json(tarea);
  } catch (error) {
    manejarError(res, error);
  }
};

const reasignarTareaController = async (req, res) => {
  try {
    const usuarioActual = obtenerUsuarioActual(req);
    const { asignadaAId } = req.body;
    if (!asignadaAId) {
      return res.status(400).json({ error: "asignadaAId es obligatorio." });
    }
    const tarea = await reasignarTarea(
      req.params.id,
      asignadaAId,
      usuarioActual,
    );
    res.status(200).json(tarea);
  } catch (error) {
    manejarError(res, error);
  }
};

const eliminarTareaController = async (req, res) => {
  try {
    const usuarioActual = obtenerUsuarioActual(req);
    await eliminarTarea(req.params.id, usuarioActual);
    res.status(204).send();
  } catch (error) {
    manejarError(res, error);
  }
};

const limpiarCompletadasController = async (req, res) => {
  try {
    const usuarioActual = obtenerUsuarioActual(req);
    const tareas = await limpiarCompletadas(usuarioActual);
    res.status(200).json(tareas);
  } catch (error) {
    manejarError(res, error);
  }
};

module.exports = {
  listarTareas,
  obtenerTarea,
  crearTareaController,
  completarTareaController,
  reasignarTareaController,
  eliminarTareaController,
  limpiarCompletadasController,
};
