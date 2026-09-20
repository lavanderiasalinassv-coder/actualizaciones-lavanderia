const { randomUUID } = require("crypto");
const { pool } = require("../database/MySQLConexion");

const obtenerVariantePluralRol = (rol) =>
  ({
    administrador: "administradores",
    recepcionista: "recepcionistas",
    cajero: "cajeros",
    operador: "operadores",
  }[String(rol || "").toLowerCase()] || rol);

const mapNotificacion = (row) => ({
  id: row.id,
  tipo: row.tipo,
  destinatarioId: row.destinatario_id,
  destinatarioRol: row.destinatario_rol,
  autorId: row.autor_id,
  autorNombre: row.autor_nombre,
  titulo: row.titulo,
  mensaje: row.mensaje,
  tema: row.tema,
  detalles: row.detalles,
  estado: row.estado,
  leida: Boolean(row.leida),
  fecha: new Date(row.creada_at).toISOString(),
  fechaResolucion: row.fecha_resolucion
    ? new Date(row.fecha_resolucion).toISOString()
    : undefined,
  imagenUrl: row.imagen_url,
});

const obtenerParaUsuario = async (usuarioId, rol) => {
  const rolPlural = obtenerVariantePluralRol(rol);
  const [rows] = await pool.query(
    `SELECT n.*,
       CASE WHEN n.destinatario_id IS NULL
         THEN COALESCE(l.leida, 0)
         ELSE COALESCE(l.leida, n.leida)
       END AS leida
     FROM notificaciones n
     LEFT JOIN notificaciones_lecturas l
       ON l.notificacion_id = n.id AND l.usuario_id = ?
     WHERE n.tipo = 'aviso'
       AND (n.autor_id IS NULL OR n.autor_id <> ?)
       AND (n.destinatario_id = ? OR n.destinatario_rol = 'todos'
         OR n.destinatario_rol IN (?, ?))
     ORDER BY n.creada_at DESC`,
    [usuarioId, usuarioId, usuarioId, rol, rolPlural],
  );
  return rows.map(mapNotificacion);
};

const obtenerProblemas = async () => {
  const [rows] = await pool.query(
    "SELECT * FROM notificaciones WHERE tipo = 'problema' ORDER BY creada_at DESC",
  );
  return rows.map(mapNotificacion);
};

const obtenerProblemasDeUsuario = async (usuarioId) => {
  const [rows] = await pool.query(
    `SELECT * FROM notificaciones
     WHERE tipo = 'problema' AND autor_id = ?
     ORDER BY creada_at DESC`,
    [usuarioId],
  );
  return rows.map(mapNotificacion);
};

const obtenerAvisosDeAutor = async (autorId) => {
  const [rows] = await pool.query(
    `SELECT * FROM notificaciones
     WHERE tipo = 'aviso' AND autor_id = ?
     ORDER BY creada_at DESC`,
    [autorId],
  );
  return rows.map(mapNotificacion);
};

const obtenerTodosLosAvisosEnviados = async () => {
  const [rows] = await pool.query(
    `SELECT * FROM notificaciones
     WHERE tipo = 'aviso'
     ORDER BY creada_at DESC`,
  );
  return rows.map(mapNotificacion);
};

const crearProblema = async ({ usuarioId, usuarioNombre, tema, detalles }) => {
  const id = randomUUID();
  await pool.query(
    `INSERT INTO notificaciones
      (id, tipo, autor_id, autor_nombre, titulo, mensaje, tema, detalles, estado)
     VALUES (?, 'problema', ?, ?, ?, ?, ?, ?, 'pendiente')`,
    [id, usuarioId || null, usuarioNombre, tema, detalles, tema, detalles],
  );
  const [rows] = await pool.query("SELECT * FROM notificaciones WHERE id = ?", [
    id,
  ]);
  return mapNotificacion(rows[0]);
};

const crearAviso = async ({
  autorId,
  autorNombre,
  titulo,
  mensaje,
  destinatarioRol,
  destinatarioId,
  imagenUrl,
}) => {
  const id = randomUUID();
  await pool.query(
    `INSERT INTO notificaciones
      (id, tipo, destinatario_rol, destinatario_id, autor_id, autor_nombre, titulo, mensaje, imagen_url)
     VALUES (?, 'aviso', ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      destinatarioRol || "todos",
      destinatarioId || null,
      autorId || null,
      autorNombre,
      titulo,
      mensaje,
      imagenUrl || null,
    ],
  );
  const [rows] = await pool.query("SELECT * FROM notificaciones WHERE id = ?", [
    id,
  ]);
  return mapNotificacion(rows[0]);
};

const editarAviso = async (
  id,
  { titulo, mensaje, destinatarioRol, destinatarioId, usuarioId, esDesarrollador, imagenUrl },
) => {
  const [rows] = await pool.query(
    `SELECT * FROM notificaciones WHERE id = ? AND tipo = 'aviso'`,
    [id]
  );
  
  if (!rows.length) return null;
  
  const aviso = rows[0];
  // Los administradores solo modifican sus propios avisos; el desarrollador
  // puede administrar el historial completo.
  if (!esDesarrollador && String(aviso.autor_id) !== String(usuarioId)) {
    return null;
  }
  
  await pool.query(
    `UPDATE notificaciones
     SET titulo = ?, mensaje = ?, destinatario_rol = ?, destinatario_id = ?, imagen_url = ?
     WHERE id = ? AND tipo = 'aviso'`,
    [titulo, mensaje, destinatarioRol, destinatarioId || null, imagenUrl || null, id]
  );
  
  const [updatedRows] = await pool.query("SELECT * FROM notificaciones WHERE id = ?", [id]);
  return mapNotificacion(updatedRows[0]);
};

const actualizarEstadoProblema = async (id, estado) => {
  await pool.query(
    `UPDATE notificaciones
     SET estado = ?, fecha_resolucion = IF(? = 'resuelto', NOW(), NULL)
     WHERE id = ? AND tipo = 'problema'`,
    [estado, estado, id],
  );
  const [rows] = await pool.query("SELECT * FROM notificaciones WHERE id = ?", [
    id,
  ]);
  if (!rows.length) return null;

  const problema = rows[0];
  const mensaje =
    estado === "en_proceso"
      ? `Tu reporte de problema "${problema.tema || problema.titulo}" está en proceso.`
      : `Tu reporte de problema "${problema.tema || problema.titulo}" ha sido resuelto.`;
  await pool.query(
    `INSERT INTO notificaciones
      (id, tipo, destinatario_id, autor_nombre, titulo, mensaje)
     VALUES (?, 'aviso', ?, 'Desarrollador', ?, ?)`,
    [
      randomUUID(),
      problema.autor_id,
      estado === "en_proceso" ? "Reporte en proceso" : "Reporte resuelto",
      mensaje,
    ],
  );

  return mapNotificacion(problema);
};

const marcarLeida = async (id, usuarioId, rol) => {
  const rolPlural = obtenerVariantePluralRol(rol);
  await pool.query(
    `INSERT INTO notificaciones_lecturas (notificacion_id, usuario_id, leida)
     SELECT n.id, ?, 1
     FROM notificaciones n
     WHERE n.id = ? AND n.tipo = 'aviso'
       AND (n.destinatario_id = ? OR n.destinatario_rol = 'todos'
         OR n.destinatario_rol IN (?, ?))
     ON DUPLICATE KEY UPDATE leida = 1`,
    [usuarioId, id, usuarioId, rol, rolPlural],
  );
};

const eliminarProblemaDeUsuario = async (id, usuarioId) => {
  const [resultado] = await pool.query(
    "DELETE FROM notificaciones WHERE id = ? AND tipo = 'problema' AND autor_id = ?",
    [id, usuarioId],
  );
  return resultado.affectedRows > 0;
};

const limpiarNotificaciones = async () => {
  await pool.query("DELETE FROM notificaciones_lecturas");
  await pool.query("DELETE FROM notificaciones");
};

const eliminarNotificacion = async (id, usuarioId, esDesarrollador = false) => {
  const [rows] = await pool.query(
    "SELECT autor_id FROM notificaciones WHERE id = ? AND tipo = 'aviso'",
    [id],
  );
  if (!rows.length) return false;

  if (!esDesarrollador && String(rows[0].autor_id) !== String(usuarioId))
    return false;

  await pool.query("DELETE FROM notificaciones_lecturas WHERE notificacion_id = ?", [id]);
  const [resultado] = await pool.query(
    "DELETE FROM notificaciones WHERE id = ? AND tipo = 'aviso'",
    [id],
  );
  return resultado.affectedRows > 0;
};

module.exports = {
  obtenerParaUsuario,
  obtenerProblemas,
  obtenerProblemasDeUsuario,
  obtenerAvisosDeAutor,
  obtenerTodosLosAvisosEnviados,
  crearProblema,
  crearAviso,
  editarAviso,
  actualizarEstadoProblema,
  marcarLeida,
  eliminarProblemaDeUsuario,
  limpiarNotificaciones,
  eliminarNotificacion,
};
