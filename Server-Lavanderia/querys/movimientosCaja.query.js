const { randomUUID } = require("crypto");
const { pool } = require("../database/MySQLConexion");

const mapMovimiento = (row) => ({
  id: row.id,
  tipo: row.tipo,
  monto: Number(row.monto),
  concepto: String(row.concepto || "").replace(/\s*\[CIERRES:[^\]]*\]\s*$/, ""),
  cierreIds: (() => {
    const coincidencia = String(row.concepto || "").match(
      /\[CIERRES:([^\]]*)\]/,
    );
    return coincidencia
      ? coincidencia[1]
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean)
      : [];
  })(),
  creadoAt: new Date(row.creado_at).toISOString(),
  turnoId: row.turno_id,
  numeroCaja: Number(row.numero_caja),
  usuario: row.usuario,
  comprobanteUrl: row.comprobante_url || undefined,
});

const listarMovimientos = async () => {
  const [rows] = await pool.query(
    "SELECT * FROM movimientos_caja ORDER BY creado_at DESC",
  );
  return rows.map(mapMovimiento);
};

const hayTurnoAbierto = async () => {
  const [rows] = await pool.query(
    "SELECT abierto FROM turno_caja_actual WHERE id = 1 LIMIT 1",
  );
  return rows.length > 0 && Boolean(rows[0].abierto);
};

const hayCierreParaTurno = async (turnoId) => {
  const [rows] = await pool.query(
    "SELECT id FROM cierres_caja WHERE turno_id = ? LIMIT 1",
    [turnoId],
  );
  return rows.length > 0;
};

const actualizarCierreConGasto = async (turnoId, movimiento) => {
  const [rows] = await pool.query(
    "SELECT id, resumen FROM cierres_caja WHERE turno_id = ? LIMIT 1",
    [turnoId],
  );
  if (!rows.length) return false;

  let resumen = rows[0].resumen;
  if (typeof resumen === "string") {
    try {
      resumen = JSON.parse(resumen);
    } catch {
      resumen = {};
    }
  }

  const monto = Number(movimiento.monto);
  const totales = resumen.totales || {};
  const conteos = resumen.conteos || {};
  const movimientos = Array.isArray(resumen.movimientos)
    ? resumen.movimientos
    : [];
  resumen.totales = {
    ...totales,
    gastos: Number((Number(totales.gastos || 0) + monto).toFixed(2)),
    recaudado: Number((Number(totales.recaudado || 0) - monto).toFixed(2)),
    gananciaNeta: Number(
      (Number(totales.gananciaNeta || 0) - monto).toFixed(2),
    ),
    saldoEsperado: Number(
      (Number(totales.saldoEsperado || 0) - monto).toFixed(2),
    ),
    diferencia: Number((Number(totales.diferencia || 0) + monto).toFixed(2)),
  };
  resumen.conteos = {
    ...conteos,
    gastos: Number(conteos.gastos || 0) + 1,
  };
  resumen.movimientos = [
    ...movimientos,
    {
      id: movimiento.id,
      tipo: "gasto",
      monto,
      concepto: movimiento.concepto,
      creadoAt: movimiento.creadoAt,
    },
  ].sort(
    (a, b) => new Date(b.creadoAt).getTime() - new Date(a.creadoAt).getTime(),
  );

  await pool.query("UPDATE cierres_caja SET resumen = ? WHERE id = ?", [
    JSON.stringify(resumen),
    rows[0].id,
  ]);
  return true;
};

const crearMovimiento = async ({
  tipo,
  monto,
  concepto,
  turnoId,
  numeroCaja,
  usuario,
  comprobanteUrl,
}) => {
  const id = randomUUID();
  await pool.query(
    `INSERT INTO movimientos_caja (id, tipo, monto, concepto, turno_id, numero_caja, usuario, comprobante_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      tipo,
      Number(monto),
      concepto,
      turnoId,
      numeroCaja,
      usuario,
      comprobanteUrl || null,
    ],
  );
  const [rows] = await pool.query(
    "SELECT * FROM movimientos_caja WHERE id = ?",
    [id],
  );
  return mapMovimiento(rows[0]);
};

const actualizarMovimiento = async (id, datos) => {
  await pool.query(
    "UPDATE movimientos_caja SET monto = ?, concepto = ?, comprobante_url = ? WHERE id = ? AND tipo = 'deposito'",
    [Number(datos.monto), datos.concepto, datos.comprobanteUrl || null, id],
  );
  const [rows] = await pool.query(
    "SELECT * FROM movimientos_caja WHERE id = ?",
    [id],
  );
  return rows.length ? mapMovimiento(rows[0]) : null;
};

const eliminarMovimiento = async (id) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[movimiento]] = await conn.query(
      "SELECT * FROM movimientos_caja WHERE id = ? FOR UPDATE",
      [id],
    );
    if (!movimiento) {
      await conn.rollback();
      return false;
    }

    if (movimiento.tipo === "gasto") {
      const [cierres] = await conn.query(
        "SELECT id, resumen FROM cierres_caja WHERE turno_id = ? FOR UPDATE",
        [movimiento.turno_id],
      );

      for (const cierre of cierres) {
        let resumen = cierre.resumen;
        if (typeof resumen === "string") {
          try {
            resumen = JSON.parse(resumen);
          } catch {
            resumen = {};
          }
        }
        resumen = resumen && typeof resumen === "object" ? resumen : {};
        resumen.totales = resumen.totales || {};
        resumen.conteos = resumen.conteos || {};
        resumen.movimientos = Array.isArray(resumen.movimientos)
          ? resumen.movimientos
          : [];

        const movimientoResumen = resumen.movimientos.find(
          (item) => item?.id === id,
        );
        if (!movimientoResumen) continue;

        resumen.movimientos = resumen.movimientos.filter(
          (item) => item?.id !== id,
        );
        const gastos = resumen.movimientos
          .filter((item) => item?.tipo === "gasto")
          .reduce((total, item) => total + Number(item.monto || 0), 0);
        const cobrado = Number(resumen.totales.cobrado || 0);
        const cancelaciones = Number(resumen.totales.cancelaciones || 0);
        const depositos = Number(resumen.totales.depositos || 0);
        const recaudado = Number((cobrado - cancelaciones - gastos).toFixed(2));
        const saldoEsperado = Number(
          (Number(resumen.apertura || 0) + recaudado - depositos).toFixed(2),
        );

        resumen.totales.gastos = Number(gastos.toFixed(2));
        resumen.totales.recaudado = recaudado;
        resumen.totales.gananciaNeta = recaudado;
        resumen.totales.saldoEsperado = saldoEsperado;
        resumen.totales.diferencia = Number(
          (Number(resumen.saldoCierre || 0) - saldoEsperado).toFixed(2),
        );
        resumen.conteos.gastos = resumen.movimientos.filter(
          (item) => item?.tipo === "gasto",
        ).length;

        await conn.execute("UPDATE cierres_caja SET resumen = ? WHERE id = ?", [
          JSON.stringify(resumen),
          cierre.id,
        ]);
      }
    }

    const [result] = await conn.execute(
      "DELETE FROM movimientos_caja WHERE id = ?",
      [id],
    );
    await conn.commit();
    return result.affectedRows > 0;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

module.exports = {
  listarMovimientos,
  hayTurnoAbierto,
  hayCierreParaTurno,
  crearMovimiento,
  actualizarCierreConGasto,
  actualizarMovimiento,
  eliminarMovimiento,
};
