const {
  DEFAULT_MODELOS_CONFIG,
  leerConfiguracionModelos,
  guardarConfiguracionModelos,
} = require("../database/modelosia");

const obtenerConfiguracion = (req, res) => {
  try {
    return res.json(leerConfiguracionModelos());
  } catch (error) {
    return res.status(500).json({
      message: error.message || "No se pudo leer la configuración de modelos.",
    });
  }
};

const obtenerPredeterminados = (req, res) => {
  return res.json(DEFAULT_MODELOS_CONFIG);
};

const actualizarConfiguracion = (req, res) => {
  try {
    const guardada = guardarConfiguracionModelos(req.body || {});
    return res.json(guardada);
  } catch (error) {
    return res.status(400).json({
      message:
        error.message || "No se pudo guardar la configuración de modelos.",
    });
  }
};

module.exports = {
  obtenerConfiguracion,
  obtenerPredeterminados,
  actualizarConfiguracion,
};
