const query = require("../querys/clientes.query");

const manejarError = (res, error) => {
  console.error("Error en clientes.controller:", error);
  return res.status(500).json({ error: "Error interno del servidor." });
};

const listar = async (_req, res) => {
  try {
    res.json(await query.listarClientes());
  } catch (error) {
    manejarError(res, error);
  }
};

const obtenerPorId = async (req, res) => {
  try {
    const cliente = await query.obtenerClientePorId(req.params.id);
    if (!cliente) {
      return res.status(404).json({ error: "No se encontró el cliente." });
    }
    res.json(cliente);
  } catch (error) {
    manejarError(res, error);
  }
};

const buscarPorTelefono = async (req, res) => {
  try {
    const { telefono } = req.params;
    const cliente = await query.buscarClientePorTelefono(telefono);
    if (!cliente) {
      return res.status(404).json({ error: "No se encontró el cliente." });
    }
    res.json(cliente);
  } catch (error) {
    manejarError(res, error);
  }
};

const crear = async (req, res) => {
  try {
    const { nombre, celular, correo } = req.body;
    const cliente = await query.crearCliente({ nombre, celular, correo });
    res.status(201).json(cliente);
  } catch (error) {
    if (error.message.includes("obligatorio") || error.message.includes("dígito")) {
      return res.status(400).json({ error: error.message });
    }
    if (error.message.includes("ya existe")) {
      return res.status(409).json({ error: error.message });
    }
    manejarError(res, error);
  }
};

const actualizar = async (req, res) => {
  try {
    const cliente = await query.actualizarCliente(req.params.id, req.body);
    res.json(cliente);
  } catch (error) {
    if (error.message.includes("No se encontró")) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes("obligatorio") || error.message.includes("dígito")) {
      return res.status(400).json({ error: error.message });
    }
    if (error.message.includes("ya está asignado")) {
      return res.status(409).json({ error: error.message });
    }
    manejarError(res, error);
  }
};

const eliminar = async (req, res) => {
  try {
    await query.eliminarCliente(req.params.id);
    res.status(204).send();
  } catch (error) {
    if (error.message.includes("No se encontró")) {
      return res.status(404).json({ error: error.message });
    }
    manejarError(res, error);
  }
};

const registrarOrden = async (req, res) => {
  try {
    const { telefono } = req.body;
    const cliente = await query.registrarOrdenCliente(telefono);
    if (!cliente) {
      return res.status(404).json({ error: "No se encontró el cliente." });
    }
    res.json(cliente);
  } catch (error) {
    manejarError(res, error);
  }
};

const buscar = async (req, res) => {
  try {
    const { termino } = req.query;
    const clientes = await query.buscarClientes(termino || "");
    res.json(clientes);
  } catch (error) {
    manejarError(res, error);
  }
};

const estadisticas = async (_req, res) => {
  try {
    res.json(await query.obtenerEstadisticasClientes());
  } catch (error) {
    manejarError(res, error);
  }
};

module.exports = {
  listar,
  obtenerPorId,
  buscarPorTelefono,
  crear,
  actualizar,
  eliminar,
  registrarOrden,
  buscar,
  estadisticas
};