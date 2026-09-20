const {
  obtenerTurno,
  abrirTurno,
  cerrarTurno,
  actualizarNotas,
  resetTurno,
  verificarTurnosAntiguosAbiertos,
} = require("../querys/turno.query");
const { AppError } = require("../utils/errors");

const manejarError = (res, error) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  console.error("Error inesperado en turno.controller:", error);
  return res.status(500).json({ error: "Error interno del servidor." });
};

const obtenerTurnoActual = async (_req, res) => {
  try {
    const turno = await obtenerTurno();
    res.status(200).json(turno);
  } catch (error) {
    manejarError(res, error);
  }
};

const abrirTurnoCaja = async (req, res) => {
  try {
    const rol = String(req.body?.usuarioRol || '').toLowerCase();
    if (req.body?.fecha !== undefined && !['administrador', 'admin'].includes(rol)) {
      return res.status(403).json({ error: "Solo un administrador puede abrir un turno con fecha específica." });
    }
    const turno = await abrirTurno(req.body);
    res.status(200).json(turno);
  } catch (error) {
    manejarError(res, error);
  }
};

const cerrarTurnoCaja = async (req, res) => {
  try {
    const { saldoCierre, fecha } = req.body;
    const rol = String(req.body?.usuarioRol || '').toLowerCase();
    if (fecha !== undefined && !['administrador', 'admin'].includes(rol)) {
      return res.status(403).json({ error: "Solo un administrador puede cerrar un turno con fecha específica." });
    }
    const turno = await cerrarTurno(saldoCierre, fecha);
    res.status(200).json(turno);
  } catch (error) {
    manejarError(res, error);
  }
};

const actualizarNotasTurno = async (req, res) => {
  try {
    const { notas } = req.body;
    const turno = await actualizarNotas(notas);
    res.status(200).json(turno);
  } catch (error) {
    manejarError(res, error);
  }
};

const reiniciarTurno = async (_req, res) => {
  try {
    const turno = await resetTurno();
    res.status(200).json(turno);
  } catch (error) {
    manejarError(res, error);
  }
};

const verificarTurnosAntiguos = async (_req, res) => {
  try {
    const resultado = await verificarTurnosAntiguosAbiertos();
    res.status(200).json(resultado);
  } catch (error) {
    manejarError(res, error);
  }
};

module.exports = {
  obtenerTurnoActual,
  abrirTurnoCaja,
  cerrarTurnoCaja,
  actualizarNotasTurno,
  reiniciarTurno,
  verificarTurnosAntiguos,
};
