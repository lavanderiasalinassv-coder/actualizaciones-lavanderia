const { Router } = require("express");
const controlador = require("../controllers/guia.controller");

const router = Router();
router.get("/guia/articulos", controlador.listarArticulos);
router.post("/guia/articulos", controlador.crearArticulo);
router.put("/guia/articulos/:id", controlador.actualizarArticulo);
router.delete("/guia/articulos/:id", controlador.eliminarArticulo);

module.exports = router;
