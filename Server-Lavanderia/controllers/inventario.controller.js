const {
  obtenerProductos,
  obtenerProductoPorId,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  descontarInventario,
  revertirInventario,
} = require("../querys/inventario.query");
const { AppError } = require("../utils/errors");

const manejarError = (res, error) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  console.error("Error inesperado en inventario.controller:", error);
  return res.status(500).json({ error: "Error interno del servidor." });
};

const listarProductos = async (_req, res) => {
  try {
    const productos = await obtenerProductos();
    res.status(200).json(productos);
  } catch (error) {
    manejarError(res, error);
  }
};

const obtenerProducto = async (req, res) => {
  try {
    const producto = await obtenerProductoPorId(req.params.id);
    if (!producto) {
      return res.status(404).json({ error: "No se encontró el insumo." });
    }
    res.status(200).json(producto);
  } catch (error) {
    manejarError(res, error);
  }
};

const crearProductoInventario = async (req, res) => {
  try {
    const producto = await crearProducto(req.body);
    res.status(201).json(producto);
  } catch (error) {
    manejarError(res, error);
  }
};

const editarProductoInventario = async (req, res) => {
  try {
    const producto = await actualizarProducto(req.params.id, req.body);
    res.status(200).json(producto);
  } catch (error) {
    manejarError(res, error);
  }
};

const eliminarProductoInventario = async (req, res) => {
  try {
    await eliminarProducto(req.params.id);
    res.status(204).send();
  } catch (error) {
    manejarError(res, error);
  }
};

const descontarConsumos = async (req, res) => {
  try {
    const { consumos, permitirNegativo } = req.body;
    if (!Array.isArray(consumos)) {
      return res.status(400).json({ error: "consumos debe ser un arreglo." });
    }
    const resultado = await descontarInventario(consumos, { permitirNegativo });
    res.status(200).json(resultado);
  } catch (error) {
    manejarError(res, error);
  }
};

const revertirConsumos = async (req, res) => {
  try {
    const { consumos } = req.body;
    if (!Array.isArray(consumos)) {
      return res.status(400).json({ error: "consumos debe ser un arreglo." });
    }
    const resultado = await revertirInventario(consumos);
    res.status(200).json(resultado);
  } catch (error) {
    manejarError(res, error);
  }
};

module.exports = {
  listarProductos,
  obtenerProducto,
  crearProductoInventario,
  editarProductoInventario,
  eliminarProductoInventario,
  descontarConsumos,
  revertirConsumos,
};
