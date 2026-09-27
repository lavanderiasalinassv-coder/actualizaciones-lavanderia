const query = require("../querys/cierresCaja.query");
const listar = async (_req, res) => {
  try {
    res.json(_req.query.resumen === "1"
      ? await query.listarCierresResumen()
      : await query.listarCierres());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
const obtener = async (req, res) => {
  try {
    const cierre = await query.obtenerCierre(req.params.id);
    if (!cierre) return res.status(404).json({ error: "El cierre no existe." });
    res.json(cierre);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
const crear = async (req, res) => {
  try {
    res.status(201).json(await query.crearCierre(req.body));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
const revisar = async (req, res) => {
  try {
    res.json(await query.revisarDeposito(req.params.id, req.body));
  } catch (e) {
    res.status(e.statusCode || 500).json({ error: e.message });
  }
};
const eliminar = async (req, res) => {
  try {
    res.json(await query.eliminarCierre(req.params.id));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
module.exports = { listar, obtener, crear, revisar, eliminar };
