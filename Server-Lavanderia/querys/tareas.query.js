const { randomUUID } = require("crypto");
const { pool } = require("../database/MySQLConexion");
const { AppError } = require("../utils/errors");

const PRIORIDADES_VALIDAS = ["baja", "media", "alta"];
const EMOJI_POR_DEFECTO = "🧼";

/* ───────────────── Helpers ───────────────── */

const normalizarTexto = (valor) => {
  if (typeof valor !== "string") return "";
  return valor.trim();
};

const mapRowTarea = (row) => ({
  id: row.id,
  titulo: row.titulo,
  descripcion: row.descripcion ?? "",
  emoji: row.emoji,
  prioridad: row.prioridad,
  asignadaAId: row.asignada_a_id,
  asignadaANombre: row.asignada_a_nombre,
  creadaPorId: row.creada_por_id,
  creadaPorNombre: row.creada_por_nombre,
  creadaEn:
    row.creada_en instanceof Date ? row.creada_en.toISOString() : row.creada_en,
  completada: !!row.completada,
  completadaEn: row.completada_en
    ? row.completada_en instanceof Date
      ? row.completada_en.toISOString()
      : row.completada_en
    : null,
  completadaPorId: row.completada_por_id,
  completadaPorNombre: row.completada_por_nombre,
});

const obtenerUsuarioEquipo = async (usuarioId) => {
  if (!normalizarTexto(usuarioId)) return null;

  const [rows] = await pool.query(
    "SELECT id, nombre FROM usuarios_equipo WHERE id = ? AND activo = 1 LIMIT 1",
    [usuarioId],
  );

  return rows.length ? rows[0] : null;
};

/* ───────────────── Lectura ───────────────── */

// Los usuarios normales solo ven las tareas asignadas a su cuenta.
const obtenerTareas = async ({ usuarioId, esAdmin }) => {
  const sql = esAdmin
    ? "SELECT * FROM tareas ORDER BY completada ASC, creada_en DESC"
    : usuarioId
      ? "SELECT * FROM tareas WHERE asignada_a_id = ? ORDER BY completada ASC, creada_en DESC"
      : "SELECT * FROM tareas WHERE 1 = 0";
  const params = esAdmin || !usuarioId ? [] : [usuarioId];

  const [rows] = await pool.query(sql, params);
  return rows.map(mapRowTarea);
};

const obtenerTareaPorId = async (id) => {
  const [rows] = await pool.query("SELECT * FROM tareas WHERE id = ?", [id]);
  return rows.length ? mapRowTarea(rows[0]) : null;
};

/* ───────────────── Escritura ───────────────── */

const crearTarea = async (datos, usuarioActual) => {
  const titulo = normalizarTexto(datos.titulo);
  if (!titulo) {
    throw new AppError("La tarea necesita un título.", 400);
  }

  const prioridad = PRIORIDADES_VALIDAS.includes(datos.prioridad)
    ? datos.prioridad
    : "media";

  const esAdminActual = usuarioActual?.rol === "administrador";
  const asignadaAId = esAdminActual
    ? normalizarTexto(datos.asignadaAId)
    : usuarioActual?.id;

  const asignadaA = await obtenerUsuarioEquipo(asignadaAId);
  if (!asignadaA) {
    throw new AppError(
      "Selecciona un usuario válido para asignar la tarea.",
      400,
    );
  }

  const id = randomUUID();
  const creadaPorId = usuarioActual?.id ?? null;
  const creadaPorNombre = normalizarTexto(usuarioActual?.nombre) || "Sistema";

  await pool.query(
    `INSERT INTO tareas
      (id, titulo, descripcion, emoji, prioridad, asignada_a_id, asignada_a_nombre, creada_por_id, creada_por_nombre)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      titulo,
      normalizarTexto(datos.descripcion),
      normalizarTexto(datos.emoji) || EMOJI_POR_DEFECTO,
      prioridad,
      asignadaA.id,
      asignadaA.nombre,
      creadaPorId,
      creadaPorNombre,
    ],
  );

  return obtenerTareaPorId(id);
};

const completarTarea = async (id, completada, nota, usuarioActual) => {
  const tarea = await obtenerTareaPorId(id);
  if (!tarea) {
    throw new AppError("No se encontró la tarea.", 404);
  }

  const esAdminActual = usuarioActual?.rol === "administrador";
  const puedeEditar =
    esAdminActual ||
    !usuarioActual?.id ||
    tarea.asignadaAId === usuarioActual.id;

  if (!puedeEditar) {
    throw new AppError("No puedes modificar esta tarea.", 403);
  }

  const notaLimpia = normalizarTexto(nota);
  let descripcionActualizada = null;
  if (completada && notaLimpia) {
    const autorNota = normalizarTexto(usuarioActual?.nombre) || "Usuario";
    const fechaNota = new Date().toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const bloqueNota = `Nota de cierre (${fechaNota} · ${autorNota}): ${notaLimpia}`;
    const descripcionBase = normalizarTexto(tarea.descripcion || "");
    descripcionActualizada = descripcionBase
      ? `${descripcionBase}\n\n${bloqueNota}`
      : bloqueNota;
  }

  await pool.query(
    `UPDATE tareas SET
      completada = ?,
      completada_en = ?,
      completada_por_id = ?,
      completada_por_nombre = ?
      ,descripcion = COALESCE(?, descripcion)
     WHERE id = ?`,
    [
      completada ? 1 : 0,
      completada ? new Date() : null,
      completada ? (usuarioActual?.id ?? null) : null,
      completada ? normalizarTexto(usuarioActual?.nombre) || null : null,
      descripcionActualizada,
      id,
    ],
  );

  return obtenerTareaPorId(id);
};

const reasignarTarea = async (id, asignadaAId, usuarioActual) => {
  if (usuarioActual?.rol !== "administrador") {
    throw new AppError("Solo el administrador puede reasignar tareas.", 403);
  }

  const tarea = await obtenerTareaPorId(id);
  if (!tarea) {
    throw new AppError("No se encontró la tarea.", 404);
  }

  const asignadaA = await obtenerUsuarioEquipo(asignadaAId);
  if (!asignadaA) {
    throw new AppError(
      "El usuario seleccionado no existe o está inactivo.",
      400,
    );
  }

  await pool.query(
    "UPDATE tareas SET asignada_a_id = ?, asignada_a_nombre = ? WHERE id = ?",
    [asignadaA.id, asignadaA.nombre, id],
  );

  return obtenerTareaPorId(id);
};

const eliminarTarea = async (id, usuarioActual) => {
  if (usuarioActual?.rol !== "administrador") {
    throw new AppError("Solo el administrador puede eliminar tareas.", 403);
  }

  const [result] = await pool.query("DELETE FROM tareas WHERE id = ?", [id]);

  if (result.affectedRows === 0) {
    throw new AppError("No se encontró la tarea.", 404);
  }
};

const limpiarCompletadas = async (usuarioActual) => {
  if (usuarioActual?.rol !== "administrador") {
    throw new AppError(
      "Solo el administrador puede limpiar tareas completadas.",
      403,
    );
  }

  await pool.query("DELETE FROM tareas WHERE completada = 1");

  return obtenerTareas({ usuarioId: null, esAdmin: true });
};

module.exports = {
  obtenerTareas,
  obtenerTareaPorId,
  crearTarea,
  completarTarea,
  reasignarTarea,
  eliminarTarea,
  limpiarCompletadas,
};
