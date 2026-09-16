const { crearCodigo2FA, validarCodigo2FA } = require("../querys/auth2fa.query");
const { AppError } = require("../utils/errors");

const manejarError = (res, error) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  console.error("Error inesperado en auth2fa.controller:", error);
  return res.status(500).json({ error: "Error interno del servidor." });
};

const enviarCodigo2FA = async (req, res) => {
  try {
    const { usuarioId, correo } = req.body;

    if (!usuarioId || !correo) {
      return res.status(400).json({ error: "usuarioId y correo son obligatorios." });
    }

    console.log(`Intentando enviar código 2FA a usuario ${usuarioId}, correo ${correo}`);
    const resultado = await crearCodigo2FA(usuarioId, correo);
    console.log("Código 2FA enviado exitosamente");
    res.status(200).json(resultado);
  } catch (error) {
    console.error("Error en enviarCodigo2FA:", error);
    manejarError(res, error);
  }
};

const verificarCodigo2FA = async (req, res) => {
  try {
    const { usuarioId, codigo } = req.body;

    if (!usuarioId || !codigo) {
      return res.status(400).json({ error: "usuarioId y código son obligatorios." });
    }

    console.log(`Verificando código 2FA para usuario ${usuarioId}`);
    const resultado = await validarCodigo2FA(usuarioId, codigo);
    console.log("Código 2FA verificado exitosamente");
    res.status(200).json(resultado);
  } catch (error) {
    console.error("Error en verificarCodigo2FA:", error);
    manejarError(res, error);
  }
};

module.exports = {
  enviarCodigo2FA,
  verificarCodigo2FA,
};