const { Router } = require("express");
const {
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
} = require("../controllers/catalogo.controller");

const router = Router();

router.get("/catalogo/categorias", listarCategorias);
router.post("/catalogo/categorias", crearCategoriaCatalogo);
router.put("/catalogo/categorias/:id", editarCategoriaCatalogo);
router.delete("/catalogo/categorias/:id", eliminarCategoriaCatalogo);

router.get("/catalogo/items", listarItems);
router.get("/catalogo/items/:id", obtenerItem);
router.post("/catalogo/items", crearItemCatalogo);
router.put("/catalogo/items/:id", editarItemCatalogo);
router.delete("/catalogo/items/:id", eliminarItemCatalogo);

router.post("/catalogo/restaurar", restaurarCatalogo);

module.exports = router;
