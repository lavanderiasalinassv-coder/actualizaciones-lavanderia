const { randomUUID } = require("crypto");
const { pool } = require("../database/MySQLConexion");

const parsearResumen = (resumen) => {
  if (resumen == null) return {};
  if (typeof resumen === "object") return resumen;
  try {
    return JSON.parse(resumen);
  } catch {
    return {};
  }
};

const listarCierres = async () => {
  const [rows] = await pool.query(
    "SELECT resumen, estado_deposito, monto_depositado, motivo_diferencia, revisado_at FROM cierres_caja ORDER BY cerrado_at DESC",
  );
  return rows.map((row) => ({
    ...parsearResumen(row.resumen),
    deposito: {
      estado: row.estado_deposito,
      monto: row.monto_depositado == null ? null : Number(row.monto_depositado),
      motivo: row.motivo_diferencia,
      revisadoAt: row.revisado_at,
    },
  }));
};

const crearCierre = async (resumen) => {
  const [existentes] = await pool.query(
    "SELECT id, resumen FROM cierres_caja WHERE turno_id = ? LIMIT 1",
    [resumen.turnoId],
  );
  if (existentes.length) {
    const error = new Error("Este turno ya tiene un cierre registrado.");
    error.statusCode = 409;
    throw error;
  }

  const id =
    resumen.id && String(resumen.id).length <= 36 ? resumen.id : randomUUID();
  const cerradoAt = resumen.cerradoAt
    ? new Date(resumen.cerradoAt)
    : new Date();
  const payload = { ...resumen, id };
  await pool.query(
    `INSERT INTO cierres_caja (id, turno_id, numero_caja, cerrado_at, resumen)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       numero_caja = VALUES(numero_caja),
       cerrado_at = VALUES(cerrado_at),
       resumen = VALUES(resumen)`,
    [
      id,
      resumen.turnoId,
      resumen.numeroCaja,
      Number.isNaN(cerradoAt.getTime()) ? new Date() : cerradoAt,
      JSON.stringify(payload),
    ],
  );
  return payload;
};

const revisarDeposito = async (id, { estado, monto, motivo }) => {
  const [resultado] = await pool.query(
    "UPDATE cierres_caja SET estado_deposito = ?, monto_depositado = ?, motivo_diferencia = ?, revisado_at = NOW() WHERE id = ? AND estado_deposito = 'pendiente'",
    [estado, monto == null ? null : Number(monto), motivo || null, id],
  );
  if (resultado.affectedRows === 0) {
    const [existentes] = await pool.query(
      "SELECT id FROM cierres_caja WHERE id = ? LIMIT 1",
      [id],
    );
    if (!existentes.length) throw new Error("El cierre no existe.");
    const error = new Error("Este cierre ya fue marcado como depositado.");
    error.statusCode = 409;
    throw error;
  }
  return listarCierres();
};

const eliminarCierre = async (id) => {
  const [resultado] = await pool.query(
    "DELETE FROM cierres_caja WHERE id = ?",
    [id],
  );
  if (resultado.affectedRows === 0) throw new Error("El cierre no existe.");
  return { id, ordenesEliminadas: 0 };
};

module.exports = {
  listarCierres,
  crearCierre,
  revisarDeposito,
  eliminarCierre,
};
