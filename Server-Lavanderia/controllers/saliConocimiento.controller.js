const { randomUUID } = require("crypto");
const { pool } = require("../database/MySQLConexion");

const texto = (valor, limite = 10000) =>
  typeof valor === "string" ? valor.trim().slice(0, limite) : "";

const asegurarTabla = async () => {
  await pool.query(`CREATE TABLE IF NOT EXISTS sali_conocimiento (
    id CHAR(36) NOT NULL,
    titulo VARCHAR(180) NOT NULL,
    contenido TEXT NOT NULL,
    categoria VARCHAR(80) NOT NULL DEFAULT 'general',
    palabras_clave VARCHAR(500) NOT NULL DEFAULT '',
    activo TINYINT(1) NOT NULL DEFAULT 1,
    usuario_id CHAR(36) NOT NULL,
    creado_por VARCHAR(100) NOT NULL DEFAULT 'Sistema',
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FULLTEXT KEY ft_sali_conocimiento (titulo, contenido, palabras_clave),
    KEY idx_usuario_id (usuario_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  // Migración para agregar las nuevas columnas si no existen
  try {
    await pool.query(`
      ALTER TABLE sali_conocimiento
      ADD COLUMN IF NOT EXISTS usuario_id CHAR(36) NOT NULL DEFAULT 'dev-mode' AFTER activo,
      ADD COLUMN IF NOT EXISTS creado_por VARCHAR(100) NOT NULL DEFAULT 'Sistema' AFTER usuario_id,
      ADD INDEX IF NOT EXISTS idx_usuario_id (usuario_id)
    `);
  } catch (error) {
    // Si falla la migración (por ejemplo, en MySQL antiguo que no soporta IF NOT EXISTS en ALTER TABLE),
    // intentamos agregar las columnas de forma tradicional
    try {
      await pool.query(`
        ALTER TABLE sali_conocimiento
        ADD COLUMN usuario_id CHAR(36) NOT NULL DEFAULT 'dev-mode' AFTER activo
      `);
    } catch (e) {
      // La columna probablemente ya existe, ignoramos el error
    }

    try {
      await pool.query(`
        ALTER TABLE sali_conocimiento
        ADD COLUMN creado_por VARCHAR(100) NOT NULL DEFAULT 'Sistema' AFTER usuario_id
      `);
    } catch (e) {
      // La columna probablemente ya existe, ignoramos el error
    }

    try {
      await pool.query(`
        ALTER TABLE sali_conocimiento
        ADD INDEX idx_usuario_id (usuario_id)
      `);
    } catch (e) {
      // El índice probablemente ya existe, ignoramos el error
    }
  }
};

const esDesarrollador = (req) => {
  const rol = String(req.header("x-user-role") || "").toLowerCase();
  const nombre = String(req.header("x-user-name") || "").toLowerCase();
  const userId = String(req.header("x-user-id") || "").toLowerCase();
  
  // El desarrollador principal se identifica por nombre "desarrollador" o ID específico
  return (
    rol === "developer" || 
    rol === "desarrollador" || 
    nombre === "desarrollador" ||
    userId === "dev-mode"
  );
};

const esAdministrador = (req) => {
  const rol = String(req.header("x-user-role") || "").toLowerCase();
  return rol === "admin" || rol === "administrador";
};

const exigirAccesoValido = async (req, res) => {
  if (esDesarrollador(req) || esAdministrador(req)) return true;
  res.status(403).json({
    error:
      "Esta sección está disponible únicamente para administradores y desarrolladores.",
  });
  return false;
};

const consultarConocimiento = async (pregunta) => {
  await asegurarTabla();
  const terminos = texto(pregunta, 400)
    .split(/\s+/)
    .filter((termino) => termino.length >= 3)
    .slice(0, 10)
    .map((termino) => termino.replace(/[^\p{L}\p{N}]/gu, ""))
    .filter((termino) => termino.length > 0)
    .join(" ");

  if (!terminos) return [];
  const [filas] = await pool.query(
    `SELECT titulo, contenido, categoria FROM sali_conocimiento
     WHERE activo = 1 AND MATCH(titulo, contenido, palabras_clave) AGAINST (? IN BOOLEAN MODE)
     ORDER BY actualizado_en DESC LIMIT 5`,
    [terminos],
  );
  return filas;
};

const accesoSali = async (req, res) => {
  try {
    const esDev = esDesarrollador(req);
    const esAdmin = esAdministrador(req);
    return res.json({ 
      permitido: esDev, 
      esAdministrador: esAdmin 
    });
  } catch (error) {
    console.error("Error al validar acceso de Sali:", error.message);
    return res.status(500).json({ error: "No se pudo validar el acceso." });
  }
};

const listarConocimiento = async (req, res) => {
  if (!(await exigirAccesoValido(req, res))) return;
  try {
    await asegurarTabla();
    const usuarioId = req.header("x-user-id") || req.query?.usuarioId;
    const esDesarrolladorPrincipal = esDesarrollador(req);

    let query = "SELECT id, titulo, contenido, categoria, palabras_clave AS palabrasClave, activo, usuario_id AS usuarioId, creado_por AS creadoPor, creado_en AS creadoEn, actualizado_en AS actualizadoEn FROM sali_conocimiento";
    let params = [];

    if (esDesarrolladorPrincipal) {
      // El desarrollador ve TODOS los conocimientos (incluyendo los de 'dev-mode' y los de administradores)
      query += " WHERE 1=1"; // Sin filtro, ve todo
    } else {
      // Los administradores solo ven sus propios conocimientos (no los de 'dev-mode')
      query += " WHERE usuario_id = ?";
      params.push(usuarioId);
    }

    query += " ORDER BY actualizado_en DESC";

    const [filas] = await pool.query(query, params);
    return res.json(
      filas.map((fila) => ({
        ...fila,
        activo: Boolean(fila.activo),
        exclusivoDesarrollador: fila.usuarioId === 'dev-mode'
      })),
    );
  } catch (error) {
    console.error("Error al listar conocimiento de Sali:", error.message);
    return res
      .status(500)
      .json({ error: "No se pudo cargar el conocimiento de Sali." });
  }
};

const guardarConocimiento = async (req, res) => {
  if (!(await exigirAccesoValido(req, res))) return;
  const titulo = texto(req.body?.titulo, 180);
  const contenido = texto(req.body?.contenido);
  const usuarioId = req.header("x-user-id") || texto(req.body?.usuarioId, 36);
  const creadoPor = req.header("x-user-name") || texto(req.body?.creadoPor, 100) || "Usuario";

  if (!titulo || !contenido || !usuarioId)
    return res
      .status(400)
      .json({ error: "El título, contenido y usuario son obligatorios." });
  try {
    await asegurarTabla();
    const id = randomUUID();
    await pool.query(
      "INSERT INTO sali_conocimiento (id, titulo, contenido, categoria, palabras_clave, activo, usuario_id, creado_por) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        id,
        titulo,
        contenido,
        texto(req.body?.categoria, 80) || "general",
        texto(req.body?.palabrasClave, 500),
        req.body?.activo === false ? 0 : 1,
        usuarioId,
        creadoPor,
      ],
    );
    return res.status(201).json({ id });
  } catch (error) {
    console.error("Error al guardar conocimiento de Sali:", error.message);
    return res
      .status(500)
      .json({ error: "No se pudo guardar la información." });
  }
};

const actualizarConocimiento = async (req, res) => {
  if (!(await exigirAccesoValido(req, res))) return;
  const titulo = texto(req.body?.titulo, 180);
  const contenido = texto(req.body?.contenido);
  const usuarioId = req.header("x-user-id") || texto(req.body?.usuarioId, 36);

  if (!titulo || !contenido || !usuarioId)
    return res
      .status(400)
      .json({ error: "El título, contenido y usuario son obligatorios." });
  try {
    await asegurarTabla();
    const [resultado] = await pool.query(
      "UPDATE sali_conocimiento SET titulo = ?, contenido = ?, categoria = ?, palabras_clave = ?, activo = ?, usuario_id = ? WHERE id = ?",
      [
        titulo,
        contenido,
        texto(req.body?.categoria, 80) || "general",
        texto(req.body?.palabrasClave, 500),
        req.body?.activo === false ? 0 : 1,
        usuarioId,
        req.params.id,
      ],
    );
    if (!resultado.affectedRows)
      return res.status(404).json({ error: "No se encontró ese aprendizaje." });
    return res.json({ ok: true });
  } catch (error) {
    console.error("Error al actualizar conocimiento de Sali:", error.message);
    return res
      .status(500)
      .json({ error: "No se pudo actualizar la información." });
  }
};

const eliminarConocimiento = async (req, res) => {
  if (!(await exigirAccesoValido(req, res))) return;
  try {
    await asegurarTabla();
    await pool.query("DELETE FROM sali_conocimiento WHERE id = ?", [
      req.params.id,
    ]);
    return res.status(204).send();
  } catch (error) {
    console.error("Error al eliminar conocimiento de Sali:", error.message);
    return res
      .status(500)
      .json({ error: "No se pudo eliminar la información." });
  }
};

module.exports = {
  accesoSali,
  listarConocimiento,
  guardarConocimiento,
  actualizarConocimiento,
  eliminarConocimiento,
  consultarConocimiento,
};
