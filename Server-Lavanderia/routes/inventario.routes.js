const { Router } = require("express");
const {
  listarProductos,
  obtenerProducto,
  crearProductoInventario,
  editarProductoInventario,
  eliminarProductoInventario,
  descontarConsumos,
  revertirConsumos,
} = require("../controllers/inventario.controller");

const router = Router();

router.get("/inventario", listarProductos);
router.get("/inventario/:id", obtenerProducto);
router.post("/inventario", crearProductoInventario);
router.put("/inventario/:id", editarProductoInventario);
router.delete("/inventario/:id", eliminarProductoInventario);

router.post("/inventario/consumos", descontarConsumos);
router.post("/inventario/consumos/revertir", revertirConsumos);

module.exports = router;
