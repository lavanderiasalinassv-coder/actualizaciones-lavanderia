const {
  obtenerPromociones,
  obtenerPromocionPorId,
  obtenerPromocionesVigentes,
  obtenerPromocionesAplicables,
  crearPromocion,
  actualizarPromocion,
  eliminarPromocion,
} = require("../querys/promociones.query");
const { AppError } = require("../utils/errors");

const manejarError = (res, error) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  console.error("Error inesperado en promociones.controller:", error);
  return res.status(500).json({ error: "Error interno del servidor." });
};

const listarPromociones = async (_req, res) => {
  try {
    const promociones = await obtenerPromociones();
    res.status(200).json(promociones);
  } catch (error) {
    manejarError(res, error);
  }
};

const obtenerUnaPromocion = async (req, res) => {
  try {
    const promocion = await obtenerPromocionPorId(req.params.id);
    if (!promocion) {
      return res.status(404).json({ error: "No se encontró la promoción." });
    }
    res.status(200).json(promocion);
  } catch (error) {
    manejarError(res, error);
  }
};

const listarVigentes = async (_req, res) => {
  try {
    const promociones = await obtenerPromocionesVigentes();
    res.status(200).json(promociones);
  } catch (error) {
    manejarError(res, error);
  }
};

const listarAplicables = async (req, res) => {
  try {
    const { esRegistrado, esRecurrente, totalOrdenes } = req.body;
    const promociones = await obtenerPromocionesAplicables(
      !!esRegistrado,
      !!esRecurrente,
      Number(totalOrdenes) || 0,
    );
    res.status(200).json(promociones);
  } catch (error) {
    manejarError(res, error);
  }
};

const crearUnaPromocion = async (req, res) => {
  try {
    const promocion = await crearPromocion(req.body);
    res.status(201).json(promocion);
  } catch (error) {
    manejarError(res, error);
  }
};

const editarUnaPromocion = async (req, res) => {
  try {
    const promocion = await actualizarPromocion(req.params.id, req.body);
    res.status(200).json(promocion);
  } catch (error) {
    manejarError(res, error);
  }
};

const eliminarUnaPromocion = async (req, res) => {
  try {
    await eliminarPromocion(req.params.id);
    res.status(204).send();
  } catch (error) {
    manejarError(res, error);
  }
};

module.exports = {
  listarPromociones,
  obtenerUnaPromocion,
  listarVigentes,
  listarAplicables,
  crearUnaPromocion,
  editarUnaPromocion,
  eliminarUnaPromocion,
};
