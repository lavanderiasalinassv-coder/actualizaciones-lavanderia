const query = require("../querys/cierresCaja.query");
const listar = async (_req, res) => {
  try {
    res.json(await query.listarCierres());
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
module.exports = { listar, crear, revisar, eliminar };
