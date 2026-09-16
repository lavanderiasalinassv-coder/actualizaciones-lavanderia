const {
  obtenerCategorias,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
  obtenerItems,
  obtenerItemPorId,
  crearItem,
  actualizarItem,
  eliminarItem,
  restaurarCatalogoBase,
} = require("../querys/catalogo.query");
const { AppError } = require("../utils/errors");

const manejarError = (res, error) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  console.error("Error inesperado en catalogo.controller:", error);
  return res.status(500).json({ error: "Error interno del servidor." });
};

/* ---- Categorías ---- */

const listarCategorias = async (_req, res) => {
  try {
    const categorias = await obtenerCategorias();
    res.status(200).json(categorias);
  } catch (error) {
    manejarError(res, error);
  }
};

const crearCategoriaCatalogo = async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre) {
      return res.status(400).json({ error: "El nombre es obligatorio." });
    }
    const categoria = await crearCategoria(nombre);
    res.status(201).json(categoria);
  } catch (error) {
    manejarError(res, error);
  }
};

const eliminarCategoriaCatalogo = async (req, res) => {
  try {
    await eliminarCategoria(req.params.id);
    res.status(204).send();
  } catch (error) {
    manejarError(res, error);
  }
};

const editarCategoriaCatalogo = async (req, res) => {
  try {
    const categoria = await actualizarCategoria(req.params.id, req.body);
    res.status(200).json(categoria);
  } catch (error) {
    manejarError(res, error);
  }
};

/* ---- Items ---- */

const listarItems = async (req, res) => {
  try {
    const { tipo } = req.query; // 'servicio' | 'articulo' | undefined
    const items = await obtenerItems(tipo);
    res.status(200).json(items);
  } catch (error) {
    manejarError(res, error);
  }
};

const obtenerItem = async (req, res) => {
  try {
    const item = await obtenerItemPorId(req.params.id);
    if (!item) {
      return res.status(404).json({ error: "No se encontró el item." });
    }
    res.status(200).json(item);
  } catch (error) {
    manejarError(res, error);
  }
};

const crearItemCatalogo = async (req, res) => {
  try {
    const item = await crearItem(req.body);
    res.status(201).json(item);
  } catch (error) {
    manejarError(res, error);
  }
};

const editarItemCatalogo = async (req, res) => {
  try {
    const item = await actualizarItem(req.params.id, req.body);
    res.status(200).json(item);
  } catch (error) {
    manejarError(res, error);
  }
};

const eliminarItemCatalogo = async (req, res) => {
  try {
    await eliminarItem(req.params.id);
    res.status(204).send();
  } catch (error) {
    manejarError(res, error);
  }
};

const restaurarCatalogo = async (_req, res) => {
  try {
    const catalogo = await restaurarCatalogoBase();
    res.status(200).json(catalogo);
  } catch (error) {
    manejarError(res, error);
  }
};

module.exports = {
  listarCategorias,
  crearCategoriaCatalogo,
  editarCategoriaCatalogo,
  eliminarCategoriaCatalogo,
  listarItems,
  obtenerItem,
  crearItemCatalogo,
  editarItemCatalogo,
  eliminarItemCatalogo,
  restaurarCatalogo,
};
