const { randomUUID } = require("crypto");
const { pool } = require("../database/MySQLConexion");
const { AppError } = require("../utils/errors");

const serializarFechaLocal = (valor) => {
  if (!valor) return null;
  const pad = (numero) => String(numero).padStart(2, "0");
  const fechaLocalMySQL = `${valor.getUTCFullYear()}-${pad(valor.getUTCMonth() + 1)}-${pad(valor.getUTCDate())}T${pad(valor.getUTCHours())}:${pad(valor.getUTCMinutes())}:${pad(valor.getUTCSeconds())}-06:00`;
  return new Date(fechaLocalMySQL).toISOString();
};

const mapTurno = (row) => ({
  id: row.turno_id,
  numeroCaja: row.numero_caja,
  abierto: !!row.abierto,
  usuario: row.usuario,
  apertura: Number(row.apertura),
  saldoCierre: row.saldo_cierre != null ? Number(row.saldo_cierre) : null,
  horaInicio: row.hora_inicio
    ? serializarFechaLocal(new Date(row.hora_inicio))
    : null,
  notas: row.notas ?? "",
  cerradoAt: row.cerrado_at
    ? serializarFechaLocal(new Date(row.cerrado_at))
    : null,
});

// Combina una fecha (YYYY-MM-DD) elegida por el usuario con la hora actual,
// para permitir abrir/cerrar turnos con fecha retroactiva (órdenes viejas).
const construirFechaHora = (fecha) => {
  if (!fecha || typeof fecha !== "string") return null;
  const coincide = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha.trim());
  if (!coincide) return null;

  const ahora = new Date();
  const hh = String(ahora.getHours()).padStart(2, "0");
  const mm = String(ahora.getMinutes()).padStart(2, "0");
  const ss = String(ahora.getSeconds()).padStart(2, "0");
  return `${coincide[1]}-${coincide[2]}-${coincide[3]} ${hh}:${mm}:${ss}`;
};

const asegurarFilas = async () => {
  await pool.query(
    "INSERT INTO turno_caja_actual (id) VALUES (1) ON DUPLICATE KEY UPDATE id = id",
  );
  await pool.query(
    "INSERT INTO turno_contador_cajas (id, valor) VALUES (1, 0) ON DUPLICATE KEY UPDATE id = id",
  );
};

const obtenerTurno = async () => {
  await asegurarFilas();
  const [rows] = await pool.query(
    "SELECT * FROM turno_caja_actual WHERE id = 1",
  );

  if (!rows.length) {
    throw new AppError("No se pudo cargar el turno de caja.", 500);
  }

  return mapTurno(rows[0]);
};

const siguienteNumeroCaja = async () => {
  await asegurarFilas();
  await pool.query(
    "UPDATE turno_contador_cajas SET valor = valor + 1 WHERE id = 1",
  );
  const [rows] = await pool.query(
    "SELECT valor FROM turno_contador_cajas WHERE id = 1",
  );
  return rows[0].valor;
};

const abrirTurno = async ({ usuario, apertura, notas, fecha }) => {
  const actual = await obtenerTurno();
  if (actual.abierto) {
    throw new AppError("Ya hay un turno de caja abierto.", 409);
  }

  const usuarioLimpio = (usuario ?? "").trim() || "Caja";
  const aperturaNum = Number.isFinite(Number(apertura))
    ? Number(Number(apertura).toFixed(2))
    : 0;
  const notasLimpias = (notas ?? "").trim();
  const numeroCaja = await siguienteNumeroCaja();
  const turnoId =
    `TUR-${Date.now().toString(36)}-${randomUUID().slice(0, 6)}`.toUpperCase();
  const horaInicioValor = construirFechaHora(fecha);

  await pool.query(
    `UPDATE turno_caja_actual SET
      turno_id = ?, numero_caja = ?, abierto = 1, usuario = ?, apertura = ?,
      saldo_cierre = NULL, hora_inicio = COALESCE(?, NOW()), notas = ?, cerrado_at = NULL
     WHERE id = 1`,
    [
      turnoId,
      numeroCaja,
      usuarioLimpio,
      aperturaNum,
      horaInicioValor,
      notasLimpias,
    ],
  );

  return obtenerTurno();
};

const cerrarTurno = async (saldoCierre, fecha) => {
  const actual = await obtenerTurno();
  if (!actual.abierto) {
    return actual;
  }

  const saldoNum =
    typeof saldoCierre === "number" && Number.isFinite(saldoCierre)
      ? Number(saldoCierre.toFixed(2))
      : actual.saldoCierre;

  // Solo cerrar órdenes realmente entregadas. Si ya tienen pago o anticipo,
  // el dinero queda en la contabilidad del turno, pero la orden sigue abierta
  // hasta que se entregue.
  await pool.query(
    `UPDATE ordenes 
     SET estado = 'cerrada', 
         updated_at = NOW() 
     WHERE turno_id = ? 
       AND estado = 'entregado'
       AND estado != 'cancelada'`,
    [actual.id],
  );

  const cerradoAtValor = construirFechaHora(fecha);

  await pool.query(
    "UPDATE turno_caja_actual SET abierto = 0, saldo_cierre = ?, cerrado_at = COALESCE(?, NOW()) WHERE id = 1",
    [saldoNum, cerradoAtValor],
  );

  return obtenerTurno();
};

const actualizarNotas = async (notas) => {
  await asegurarFilas();
  await pool.query("UPDATE turno_caja_actual SET notas = ? WHERE id = 1", [
    notas ?? "",
  ]);
  return obtenerTurno();
};

const resetTurno = async () => {
  await asegurarFilas();
  await pool.query(
    `UPDATE turno_caja_actual SET
      turno_id = '', numero_caja = 0, abierto = 0, usuario = '', apertura = 0,
      saldo_cierre = NULL, hora_inicio = NULL, notas = '', cerrado_at = NULL
     WHERE id = 1`,
  );
  return obtenerTurno();
};

const verificarTurnosAntiguosAbiertos = async () => {
  const actual = await obtenerTurno();
  if (!actual.abierto || !actual.horaInicio) {
    return { tieneTurnoAntiguoAbierto: false, mensaje: "" };
  }

  const hoy = new Date();
  const fechaTurno = new Date(actual.horaInicio);

  // Comparar solo las fechas (ignorar hora)
  const hoyFecha = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const turnoFecha = new Date(
    fechaTurno.getFullYear(),
    fechaTurno.getMonth(),
    fechaTurno.getDate(),
  );

  // Si el turno es de un día anterior
  if (turnoFecha < hoyFecha) {
    const fechaFormateada = fechaTurno.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    return {
      tieneTurnoAntiguoAbierto: true,
      mensaje: `⚠️ El turno del día ${fechaFormateada} sigue abierto.`,
      fechaInicio: fechaFormateada,
      horaInicio: fechaTurno.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  }

  return { tieneTurnoAntiguoAbierto: false, mensaje: "" };
};

module.exports = {
  obtenerTurno,
  abrirTurno,
  cerrarTurno,
  actualizarNotas,
  resetTurno,
  verificarTurnosAntiguosAbiertos,
};
