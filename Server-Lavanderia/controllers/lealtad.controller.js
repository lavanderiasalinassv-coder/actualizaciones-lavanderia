const query = require("../querys/lealtad.query");
const { enviarCorreoVerificacionLealtad } = require("./correo.controller");

const manejarError = (res, error) => {
  if (error.statusCode) {
    return res.status(error.statusCode).json({ error: error.message });
  }
  console.error("Error en lealtad.controller:", error);
  return res.status(500).json({ error: "Error interno del servidor." });
};

const actualizarPremio = async (req, res) => {
  const rol = String(req.header("x-user-role") || "").toLowerCase();
  if (!["admin", "administrador"].includes(rol)) {
    return res.status(403).json({ error: "Solo un administrador puede cambiar el premio." });
  }
  try {
    res.json(await query.actualizarPremio({
      premio: req.body?.premio,
      tipoDescuento: req.body?.tipoDescuento,
      valorDescuento: req.body?.valorDescuento,
      visitasMeta: req.body?.visitasMeta,
    }));
  } catch (error) {
    manejarError(res, error);
  }
};

const requierePersonal = (req, res) => {
  const rol = String(req.header("x-user-role") || "").toLowerCase();
  if (["admin", "administrador", "programador", "recepcionista", "cajero"].includes(rol)) return true;
  res.status(403).json({ error: "Solo personal autorizado puede registrar visitas o canjes." });
  return false;
};

const requiereAdministrador = (req, res) => {
  const rol = String(req.header("x-user-role") || "").toLowerCase();
  if (["admin", "administrador", "programador"].includes(rol)) return true;
  res.status(403).json({ error: "Solo un administrador puede administrar las tarjetas de lealtad." });
  return false;
};

const listarTarjetas = async (req, res) => {
  if (!requiereAdministrador(req, res)) return;
  try {
    res.json(await query.listarTarjetas());
  } catch (error) {
    manejarError(res, error);
  }
};

const ajustarVisitas = async (req, res) => {
  if (!requiereAdministrador(req, res)) return;
  try {
    res.json(await query.ajustarVisitas({
      tarjetaId: req.params.tarjetaId,
      cambio: req.body?.cambio,
    }));
  } catch (error) {
    manejarError(res, error);
  }
};

const desactivarTarjeta = async (req, res) => {
  if (!requiereAdministrador(req, res)) return;
  try {
    res.json(await query.desactivarTarjeta(req.params.tarjetaId));
  } catch (error) {
    manejarError(res, error);
  }
};

const obtenerConfiguracion = async (_req, res) => {
  try {
    res.json(await query.obtenerConfiguracion());
  } catch (error) {
    manejarError(res, error);
  }
};

const solicitarCodigo = async (req, res) => {
  let solicitud;
  try {
    solicitud = await query.solicitarCodigo(req.body?.telefono);
    await enviarCorreoVerificacionLealtad(
      solicitud.correo,
      solicitud.nombre,
      solicitud.codigo,
    );
    res.json({ enviado: true });
  } catch (error) {
    if (solicitud?.id) {
      try {
        await query.cancelarSolicitudCodigo(solicitud.id);
      } catch (cleanupError) {
        console.error("No se pudo invalidar el código de lealtad fallido:", cleanupError);
      }
    }
    if (solicitud && !error.statusCode) {
      console.error("No se pudo enviar un código de verificación de lealtad:", error);
      return res.status(503).json({ error: "No se pudo enviar el código al correo registrado. Intenta más tarde." });
    }
    manejarError(res, error);
  }
};

const solicitarCodigoCanje = async (req, res) => {
  if (!requierePersonal(req, res)) return;
  let solicitud;
  try {
    solicitud = await query.solicitarCodigo(req.body?.telefono, "canje");
    await enviarCorreoVerificacionLealtad(solicitud.correo, solicitud.nombre, solicitud.codigo, "canje_premio");
    res.json({ enviado: true, correo: solicitud.correo });
  } catch (error) {
    if (solicitud?.id) {
      try { await query.cancelarSolicitudCodigo(solicitud.id); }
      catch (cleanupError) { console.error("No se pudo invalidar el código de canje fallido:", cleanupError); }
    }
    if (solicitud && !error.statusCode) {
      console.error("No se pudo enviar el código de canje de lealtad:", error);
      return res.status(503).json({ error: "No se pudo enviar el código al correo registrado. Intenta más tarde." });
    }
    manejarError(res, error);
  }
};

const verificarCodigoCanje = async (req, res) => {
  if (!requierePersonal(req, res)) return;
  try {
    res.json(await query.verificarCodigoYRegistrarTarjeta({ telefono: req.body?.telefono, codigo: req.body?.codigo, modo: "canje" }));
  } catch (error) {
    manejarError(res, error);
  }
};

const registrarTarjeta = async (req, res) => {
  try {
    res.status(201).json(
      await query.verificarCodigoYRegistrarTarjeta({
        telefono: req.body?.telefono,
        codigo: req.body?.codigo,
      }),
    );
  } catch (error) {
    manejarError(res, error);
  }
};

const obtenerTarjeta = async (req, res) => {
  try {
    res.json(await query.obtenerTarjeta(req.params.token));
  } catch (error) {
    manejarError(res, error);
  }
};

const registrarVisita = async (req, res) => {
  if (!requierePersonal(req, res)) return;
  try {
    res.json(
      await query.registrarVisita({
        token: req.body?.token,
        ordenId: req.body?.ordenId,
      }),
    );
  } catch (error) {
    manejarError(res, error);
  }
};

const obtenerTarjetaPorTelefono = async (req, res) => {
  if (!requierePersonal(req, res)) return;
  try {
    res.json(await query.buscarTarjetaLealtadPorTelefono(req.body?.telefono));
  } catch (error) {
    manejarError(res, error);
  }
};

const canjearPremio = async (req, res) => {
  if (!requierePersonal(req, res)) return;
  try {
    res.json(
      await query.canjearPremio({
        token: req.body?.token,
        ordenId: req.body?.ordenId,
      }),
    );
  } catch (error) {
    manejarError(res, error);
  }
};

module.exports = {
  obtenerConfiguracion,
  actualizarPremio,
  solicitarCodigo,
  solicitarCodigoCanje,
  verificarCodigoCanje,
  registrarTarjeta,
  obtenerTarjeta,
  registrarVisita,
  obtenerTarjetaPorTelefono,
  canjearPremio,
  listarTarjetas,
  ajustarVisitas,
  desactivarTarjeta,
};
