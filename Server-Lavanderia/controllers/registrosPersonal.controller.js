const { randomUUID } = require("crypto");
const { pool } = require("../database/MySQLConexion");

let tablaSesionesLista;
const asegurarTablaSesiones = () => {
  if (!tablaSesionesLista) {
    tablaSesionesLista = Promise.all([
      pool.query(`CREATE TABLE IF NOT EXISTS registros_sesion_personal (
        id VARCHAR(36) NOT NULL PRIMARY KEY, usuario_id VARCHAR(191) NULL,
        usuario_nombre VARCHAR(160) NOT NULL, usuario_rol VARCHAR(80) NULL,
        ingreso_at DATETIME(3) NOT NULL, desconexion_at DATETIME(3) NULL,
        motivo_desconexion VARCHAR(40) NULL,
        INDEX idx_registro_sesion_personal_ingreso (ingreso_at),
        INDEX idx_registro_sesion_personal_usuario (usuario_id, ingreso_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`),
      pool.query(`CREATE TABLE IF NOT EXISTS orden_movimientos_archivados (
        id CHAR(36) NOT NULL PRIMARY KEY, orden_id CHAR(36) NOT NULL, secuencia INT NULL,
        texto TEXT NOT NULL, usuario_id CHAR(36) NULL, usuario_nombre VARCHAR(150) NOT NULL, fecha DATETIME NOT NULL,
        INDEX idx_movs_archivados_numero (secuencia), INDEX idx_movs_archivados_fecha (fecha)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`),
      pool.query(`CREATE TABLE IF NOT EXISTS ordenes_eliminadas_auditoria (
        id CHAR(36) NOT NULL PRIMARY KEY, orden_id CHAR(36) NOT NULL, secuencia INT NULL,
        usuario_id CHAR(36) NULL, usuario_nombre VARCHAR(150) NOT NULL, fecha DATETIME NOT NULL,
        orden_json LONGTEXT NULL,
        INDEX idx_ordenes_eliminadas_fecha (fecha), INDEX idx_ordenes_eliminadas_usuario (usuario_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`),
    ]).then(async () => {
      const [columnas] = await pool.query("SHOW COLUMNS FROM ordenes_eliminadas_auditoria LIKE 'orden_json'");
      if (!columnas.length) await pool.query("ALTER TABLE ordenes_eliminadas_auditoria ADD COLUMN orden_json LONGTEXT NULL");
    }).catch((error) => { tablaSesionesLista = undefined; throw error; });
  }
  return tablaSesionesLista;
};

const iniciarSesion = async (req, res) => {
  try {
    const { usuarioId, nombre, rol } = req.body || {};
    const nombreLimpio = typeof nombre === "string" ? nombre.trim().slice(0, 160) : "";
    const idLimpio = typeof usuarioId === "string" ? usuarioId.trim() : "";
    if (!nombreLimpio || !idLimpio) return res.status(400).json({ error: "El usuario es obligatorio." });
    if (idLimpio === "dev-mode" || nombreLimpio === "Desarrollador") return res.status(200).json({ sessionId: null, omitido: true });
    await asegurarTablaSesiones();
    const sessionId = randomUUID();
    await pool.execute(
      `INSERT INTO registros_sesion_personal
        (id, usuario_id, usuario_nombre, usuario_rol, ingreso_at)
       VALUES (?, ?, ?, ?, UTC_TIMESTAMP(3))`,
      [sessionId, idLimpio, nombreLimpio, typeof rol === "string" ? rol.trim().slice(0, 80) : null],
    );
    return res.status(201).json({ sessionId });
  } catch (error) {
    console.error("No se pudo registrar el ingreso del personal:", error);
    return res.status(500).json({ error: "No se pudo registrar el ingreso." });
  }
};

const cerrarSesion = async (req, res) => {
  try {
    await asegurarTablaSesiones();
    const motivo = ["salida", "inactividad", "reemplazada"].includes(req.body?.motivo) ? req.body.motivo : "salida";
    const [resultado] = await pool.execute(
      `UPDATE registros_sesion_personal
       SET desconexion_at = COALESCE(desconexion_at, UTC_TIMESTAMP(3)),
           motivo_desconexion = COALESCE(motivo_desconexion, ?)
       WHERE id = ?`,
      [motivo, req.params.id],
    );
    return res.status(resultado.affectedRows ? 200 : 404).json({ ok: resultado.affectedRows > 0 });
  } catch (error) {
    console.error("No se pudo registrar la desconexión del personal:", error);
    return res.status(500).json({ error: "No se pudo registrar la desconexión." });
  }
};

const listarRegistros = async (req, res) => {
  try {
    await asegurarTablaSesiones();
    const paginaSolicitada = Number.parseInt(req.query.pagina, 10);
    const pagina = Number.isFinite(paginaSolicitada) ? Math.max(1, paginaSolicitada) : 1;
    const limite = 50;
    const offset = (pagina - 1) * limite;
    const tiposPermitidos = new Set(["ingreso", "desconexion", "orden_creada", "orden_modificada", "orden_eliminada"]);
    const condiciones = [];
    const parametros = [];
    const usuario = typeof req.query.usuario === "string" ? req.query.usuario.trim() : "";
    const tipo = typeof req.query.tipo === "string" && tiposPermitidos.has(req.query.tipo) ? req.query.tipo : "";
    const desde = typeof req.query.desde === "string" && /^\d{4}-\d{2}-\d{2}$/.test(req.query.desde) ? req.query.desde : "";
    const hasta = typeof req.query.hasta === "string" && /^\d{4}-\d{2}-\d{2}$/.test(req.query.hasta) ? req.query.hasta : "";
    const grupo = req.query.grupo === "sesiones" ? "sesiones" : req.query.grupo === "ordenes" ? "ordenes" : "";
    if (grupo === "sesiones") condiciones.push("tipo IN ('ingreso', 'desconexion')");
    if (grupo === "ordenes") condiciones.push("tipo = 'orden_eliminada'");
    if (usuario && usuario !== "todos") { condiciones.push("usuarioNombre = ?"); parametros.push(usuario); }
    if (tipo) { condiciones.push("tipo = ?"); parametros.push(tipo); }
    if (desde) { condiciones.push("DATE(fecha) >= ?"); parametros.push(desde); }
    if (hasta) { condiciones.push("DATE(fecha) <= ?"); parametros.push(hasta); }
    const filtroSql = condiciones.length ? " WHERE " + condiciones.join(" AND ") : "";
    const baseSql = [
      "SELECT CONCAT('sesion-ingreso-', s.id) AS id, s.id AS sessionId, s.usuario_id AS usuarioId, s.usuario_nombre AS usuarioNombre, s.usuario_rol AS usuarioRol, 'ingreso' AS tipo, s.ingreso_at AS fecha, 'Sesión iniciada' AS detalle, NULL AS numeroOrden, TIMESTAMPDIFF(SECOND, s.ingreso_at, COALESCE(s.desconexion_at, UTC_TIMESTAMP())) AS duracionSegundos, (s.desconexion_at IS NULL) AS sesionActiva FROM registros_sesion_personal s WHERE s.usuario_id <> 'dev-mode' AND s.usuario_nombre <> 'Desarrollador'",
      "UNION ALL",
      "SELECT CONCAT('sesion-salida-', s.id) AS id, s.id AS sessionId, s.usuario_id AS usuarioId, s.usuario_nombre AS usuarioNombre, s.usuario_rol AS usuarioRol, 'desconexion' AS tipo, s.desconexion_at AS fecha, CASE s.motivo_desconexion WHEN 'inactividad' THEN 'Sesión cerrada por inactividad' WHEN 'reemplazada' THEN 'Sesión reemplazada por un nuevo ingreso' ELSE 'Sesión cerrada' END AS detalle, NULL AS numeroOrden, TIMESTAMPDIFF(SECOND, s.ingreso_at, s.desconexion_at) AS duracionSegundos, 0 AS sesionActiva FROM registros_sesion_personal s WHERE s.desconexion_at IS NOT NULL AND s.usuario_id <> 'dev-mode' AND s.usuario_nombre <> 'Desarrollador'",
      "UNION ALL",
      "SELECT CONCAT('orden-', m.id) AS id, NULL AS sessionId, m.usuario_id AS usuarioId, m.usuario_nombre AS usuarioNombre, NULL AS usuarioRol, CASE WHEN m.texto LIKE 'Creada por %' THEN 'orden_creada' ELSE 'orden_modificada' END AS tipo, m.fecha AS fecha, m.texto AS detalle, COALESCE(LPAD(o.secuencia, 5, '0'), 'Eliminada') AS numeroOrden, NULL AS duracionSegundos, NULL AS sesionActiva FROM orden_movimientos m LEFT JOIN ordenes o ON o.id = m.orden_id WHERE m.usuario_id IS NOT NULL AND m.usuario_id <> '' AND m.usuario_id <> 'dev-mode' AND m.usuario_nombre IS NOT NULL AND m.usuario_nombre <> 'Sistema' AND m.usuario_nombre <> 'Desarrollador'",
      "UNION ALL",
      "SELECT CONCAT('archivo-', a.id) AS id, NULL AS sessionId, a.usuario_id AS usuarioId, a.usuario_nombre AS usuarioNombre, NULL AS usuarioRol, CASE WHEN a.texto LIKE 'Creada por %' THEN 'orden_creada' ELSE 'orden_modificada' END AS tipo, a.fecha AS fecha, a.texto AS detalle, LPAD(a.secuencia, 5, '0') AS numeroOrden, NULL AS duracionSegundos, NULL AS sesionActiva FROM orden_movimientos_archivados a WHERE a.usuario_id IS NOT NULL AND a.usuario_id <> '' AND a.usuario_id <> 'dev-mode' AND a.usuario_nombre <> 'Sistema' AND a.usuario_nombre <> 'Desarrollador'",
      "UNION ALL",
      "SELECT CONCAT('eliminada-', e.id) AS id, NULL AS sessionId, e.usuario_id AS usuarioId, e.usuario_nombre AS usuarioNombre, NULL AS usuarioRol, 'orden_eliminada' AS tipo, e.fecha AS fecha, CONCAT('Orden eliminada #', LPAD(e.secuencia, 5, '0')) AS detalle, LPAD(e.secuencia, 5, '0') AS numeroOrden, NULL AS duracionSegundos, NULL AS sesionActiva FROM ordenes_eliminadas_auditoria e WHERE e.usuario_id IS NOT NULL AND e.usuario_id <> 'dev-mode' AND e.usuario_nombre <> 'Desarrollador'",
    ].join(" ");
    const numeroOrdenDetalle = typeof req.query.numeroOrden === "string" ? req.query.numeroOrden.replace(/\D/g, "") : "";
    if (numeroOrdenDetalle && grupo === "ordenes") {
      const [historial] = await pool.query(
        "SELECT * FROM (" + baseSql + ") AS registros WHERE tipo = 'orden_eliminada' AND numeroOrden = ? ORDER BY fecha DESC, id DESC",
        [numeroOrdenDetalle],
      );
      const [ordenesEliminadas] = await pool.query(
        "SELECT id, orden_json AS ordenEliminada FROM ordenes_eliminadas_auditoria WHERE LPAD(secuencia, 5, '0') = ? ORDER BY fecha DESC",
        [numeroOrdenDetalle],
      );
      const ordenPorId = new Map(ordenesEliminadas.map((fila) => [String(fila.id), fila.ordenEliminada]));
      for (const registro of historial) {
        const idAuditoria = String(registro.id || '').replace(/^eliminada-/, '');
        registro.ordenEliminada = ordenPorId.get(idAuditoria) || null;
      }
      return res.status(200).json({ numeroOrden: numeroOrdenDetalle, registros: historial });
    }
    const [resumenRows] = await pool.query(
      "SELECT COUNT(*) AS totalEventos, COALESCE(SUM(tipo = 'ingreso'), 0) AS ingresos, COALESCE(SUM(tipo = 'orden_creada'), 0) AS ordenesCreadas, COALESCE(SUM(tipo = 'orden_modificada'), 0) AS ordenesModificadas, COALESCE(SUM(tipo = 'orden_eliminada'), 0) AS ordenesEliminadas FROM (" + baseSql + ") AS registros" + filtroSql,
      parametros,
    );
    const resumen = resumenRows[0] || {};
    let total = Number(resumen.totalEventos || 0);
    if (grupo === "ordenes") {
      const [totalRows] = await pool.query(
        "SELECT COUNT(*) AS total FROM (SELECT numeroOrden FROM (" + baseSql + ") AS registros" + filtroSql + " GROUP BY numeroOrden) AS grupos",
        parametros,
      );
      total = Number(totalRows[0]?.total || 0);
    }
    const totalPaginas = Math.max(1, Math.ceil(total / limite));
    const paginaValida = Math.min(pagina, totalPaginas);
    const offsetValido = (paginaValida - 1) * limite;
    const consultaPagina = grupo === "ordenes"
      ? "SELECT numeroOrden, COUNT(*) AS cantidadMovimientos, MAX(fecha) AS fecha, SUBSTRING_INDEX(GROUP_CONCAT(usuarioNombre ORDER BY fecha DESC, id DESC SEPARATOR '\n'), '\n', 1) AS ultimoUsuario FROM (" + baseSql + ") AS registros" + filtroSql + " GROUP BY numeroOrden ORDER BY fecha DESC, numeroOrden DESC LIMIT ? OFFSET ?"
      : "SELECT * FROM (" + baseSql + ") AS registros" + filtroSql + " ORDER BY fecha DESC, id DESC LIMIT ? OFFSET ?";
    const [registros] = await pool.query(consultaPagina, [...parametros, limite, offsetValido]);
    const [usuariosSesion] = await pool.query(
      "SELECT usuario_nombre AS usuarioNombre FROM registros_sesion_personal WHERE usuario_id <> 'dev-mode' AND usuario_nombre <> 'Desarrollador' UNION SELECT DISTINCT usuario_nombre AS usuarioNombre FROM orden_movimientos WHERE usuario_id IS NOT NULL AND usuario_id <> '' AND usuario_id <> 'dev-mode' AND usuario_nombre IS NOT NULL AND usuario_nombre <> 'Sistema' AND usuario_nombre <> 'Desarrollador' UNION SELECT DISTINCT usuario_nombre AS usuarioNombre FROM orden_movimientos_archivados WHERE usuario_id IS NOT NULL AND usuario_id <> '' AND usuario_id <> 'dev-mode' AND usuario_nombre <> 'Sistema' AND usuario_nombre <> 'Desarrollador' UNION SELECT DISTINCT usuario_nombre AS usuarioNombre FROM ordenes_eliminadas_auditoria WHERE usuario_id IS NOT NULL AND usuario_id <> '' AND usuario_id <> 'dev-mode' AND usuario_nombre <> 'Desarrollador' ORDER BY usuarioNombre",
    );
    const [sesionesActivasRows] = await pool.query(
      "SELECT COUNT(*) AS total FROM registros_sesion_personal WHERE desconexion_at IS NULL AND usuario_id <> 'dev-mode' AND usuario_nombre <> 'Desarrollador'" + (usuario && usuario !== 'todos' ? ' AND usuario_nombre = ?' : ''),
      usuario && usuario !== 'todos' ? [usuario] : [],
    );
    return res.status(200).json({
      registros,
      total,
      pagina: paginaValida,
      limite,
      totalPaginas,
      usuarios: usuariosSesion.map((fila) => fila.usuarioNombre).filter(Boolean),
      conteos: {
        ingreso: Number(resumen.ingresos || 0),
        orden_creada: Number(resumen.ordenesCreadas || 0),
        orden_modificada: Number(resumen.ordenesModificadas || 0),
        orden_eliminada: Number(resumen.ordenesEliminadas || 0),
      },
      sesionesActivas: Number(sesionesActivasRows[0]?.total || 0),
    });
  } catch (error) {
    console.error("No se pudieron cargar los registros del personal:", error);
    return res.status(500).json({ error: "No se pudieron cargar los registros." });
  }
};

module.exports = { iniciarSesion, cerrarSesion, listarRegistros };
