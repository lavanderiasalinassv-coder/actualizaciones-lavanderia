const {
  obtenerEstado,
  reemplazarRegistros,
  reemplazarTurnos,
  reemplazarPagos,
  reemplazarNotificaciones,
  reemplazarPagoPorHora,
  actualizarPeriodoPago,
  eliminarTurnoPorId,
} = require("../querys/horarios.query");
const { AppError } = require("../utils/errors");

const manejarError = (res, error) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  console.error("Error inesperado en horarios.controller:", error);
  return res.status(500).json({ error: "Error interno del servidor." });
};

const validarHoraTurno = (valor) =>
  typeof valor === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(valor);

const validarTurnos = (turnos) => {
  for (const [indice, turno] of turnos.entries()) {
    if (turno.libre) continue;

    if (
      !validarHoraTurno(turno.horaInicio) ||
      !validarHoraTurno(turno.horaFin)
    ) {
      return `El turno ${turno.fecha || `#${indice + 1}`} tiene horas inválidas. Usa formato HH:mm entre 00:00 y 23:59.`;
    }

    if (turno.horaFin <= turno.horaInicio) {
      return `El turno ${turno.fecha || `#${indice + 1}`} (${turno.horaInicio} - ${turno.horaFin}) es inválido: la salida debe ser posterior a la entrada.`;
    }
  }

  return null;
};

const obtenerEstadoHorarios = async (_req, res) => {
  try {
    const estado = await obtenerEstado();
    res.status(200).json(estado);
  } catch (error) {
    manejarError(res, error);
  }
};

const guardarRegistros = async (req, res) => {
  try {
    if (!Array.isArray(req.body)) {
      return res
        .status(400)
        .json({ error: "Se esperaba un arreglo de registros." });
    }
    const registros = await reemplazarRegistros(req.body);
    res.status(200).json(registros);
  } catch (error) {
    manejarError(res, error);
  }
};

const guardarTurnos = async (req, res) => {
  try {
    if (!Array.isArray(req.body)) {
      return res
        .status(400)
        .json({ error: "Se esperaba un arreglo de turnos." });
    }
    const errorValidacion = validarTurnos(req.body);
    if (errorValidacion)
      return res.status(400).json({ error: errorValidacion });
    const turnos = await reemplazarTurnos(req.body);
    res.status(200).json(turnos);
  } catch (error) {
    manejarError(res, error);
  }
};

const eliminarTurno = async (req, res) => {
  try {
    const eliminado = await eliminarTurnoPorId(req.params.id);
    if (!eliminado)
      return res.status(404).json({ error: "No se encontró el horario." });
    res.status(204).send();
  } catch (error) {
    manejarError(res, error);
  }
};

const guardarPagos = async (req, res) => {
  try {
    if (!Array.isArray(req.body)) {
      return res
        .status(400)
        .json({ error: "Se esperaba un arreglo de pagos." });
    }
    const pagos = await reemplazarPagos(req.body);
    res.status(200).json(pagos);
  } catch (error) {
    manejarError(res, error);
  }
};

const guardarNotificaciones = async (req, res) => {
  try {
    if (!Array.isArray(req.body)) {
      return res
        .status(400)
        .json({ error: "Se esperaba un arreglo de notificaciones." });
    }
    const notificaciones = await reemplazarNotificaciones(req.body);
    res.status(200).json(notificaciones);
  } catch (error) {
    manejarError(res, error);
  }
};

const guardarPagoPorHora = async (req, res) => {
  try {
    if (
      typeof req.body !== "object" ||
      Array.isArray(req.body) ||
      req.body === null
    ) {
      return res
        .status(400)
        .json({ error: "Se esperaba un objeto { empleadoId: monto }." });
    }
    const pagoPorHora = await reemplazarPagoPorHora(req.body);
    res.status(200).json(pagoPorHora);
  } catch (error) {
    manejarError(res, error);
  }
};

const guardarPeriodoPago = async (req, res) => {
  try {
    const { periodo } = req.body;
    const periodoGuardado = await actualizarPeriodoPago(periodo);
    res.status(200).json({ periodo: periodoGuardado });
  } catch (error) {
    manejarError(res, error);
  }
};

module.exports = {
  obtenerEstadoHorarios,
  guardarRegistros,
  guardarTurnos,
  eliminarTurno,
  guardarPagos,
  guardarNotificaciones,
  guardarPagoPorHora,
  guardarPeriodoPago,
};
