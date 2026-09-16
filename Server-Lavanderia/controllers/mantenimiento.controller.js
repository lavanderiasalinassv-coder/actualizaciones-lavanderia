const { limpiarTablas } = require("../querys/mantenimiento.query");

const limpiarTablasController = async (req, res) => {
  const rol = (req.body?.usuarioRol || "").toLowerCase();
  if (rol !== "administrador" && rol !== "admin") {
    return res
      .status(403)
      .json({
        error: "Solo un administrador puede realizar el mantenimiento.",
      });
  }

  try {
    const resultado = await limpiarTablas(
      Array.isArray(req.body?.grupos) ? req.body.grupos : [],
    );
    return res
      .status(200)
      .json({ mensaje: "Mantenimiento completado.", ...resultado });
  } catch (error) {
    console.error("Error en mantenimiento.controller:", error);
    return res.status(error.statusCode || 500).json({
      error: error.statusCode
        ? error.message
        : "No se pudieron limpiar las tablas.",
    });
  }
};

module.exports = { limpiarTablasController };
