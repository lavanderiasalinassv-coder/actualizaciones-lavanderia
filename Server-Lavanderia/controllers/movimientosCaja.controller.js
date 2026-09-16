const query = require("../querys/movimientosCaja.query");

const manejarError = (res, error) => {
  console.error("Error en movimientosCaja.controller:", error);
  return res.status(500).json({ error: "Error interno del servidor." });
};

const listar = async (_req, res) => {
  try {
    res.json(await query.listarMovimientos());
  } catch (error) {
    manejarError(res, error);
  }
};

const crear = async (req, res) => {
  try {
    const {
      tipo,
      monto,
      concepto,
      turnoId,
      numeroCaja,
      usuario,
      comprobanteUrl,
    } = req.body;
    if (
      !["gasto", "deposito", "cierre"].includes(tipo) ||
      Number(monto) <= 0 ||
      !concepto ||
      !String(concepto).trim() ||
      !turnoId
    ) {
      return res.status(400).json({ error: "Datos del movimiento inválidos." });
    }
    if (tipo === "gasto" && !String(usuario || "").trim()) {
      return res
        .status(400)
        .json({ error: "El usuario creador del gasto es obligatorio." });
    }
    if (
      tipo === "gasto" &&
      !(await query.hayTurnoAbierto()) &&
      !(await query.hayCierreParaTurno(turnoId))
    ) {
      return res.status(409).json({
        error:
          "El gasto debe estar asociado a un turno abierto o a una caja cerrada existente.",
      });
    }
    const movimiento = await query.crearMovimiento({
      tipo,
      monto,
      concepto: concepto.trim(),
      turnoId,
      numeroCaja,
      usuario: String(usuario || "").trim(),
      comprobanteUrl,
    });
    if (tipo === "gasto" && (await query.hayCierreParaTurno(turnoId))) {
      await query.actualizarCierreConGasto(turnoId, movimiento);
    }
    res.status(201).json(movimiento);
  } catch (error) {
    manejarError(res, error);
  }
};

const actualizar = async (req, res) => {
  try {
    const movimiento = await query.actualizarMovimiento(
      req.params.id,
      req.body,
    );
    if (!movimiento)
      return res.status(404).json({ error: "No se encontró el movimiento." });
    res.json(movimiento);
  } catch (error) {
    manejarError(res, error);
  }
};

const eliminar = async (req, res) => {
  try {
    if (!(await query.eliminarMovimiento(req.params.id)))
      return res.status(404).json({ error: "No se encontró el movimiento." });
    res.status(204).send();
  } catch (error) {
    manejarError(res, error);
  }
};

module.exports = { listar, crear, actualizar, eliminar };
