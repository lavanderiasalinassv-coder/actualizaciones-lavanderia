const { Router } = require("express");
const controlador = require("../controllers/saliConocimiento.controller");

const router = Router();
router.get("/sali/acceso", controlador.accesoSali);
router.get("/sali/conocimiento", controlador.listarConocimiento);
router.post("/sali/conocimiento", controlador.guardarConocimiento);
router.put("/sali/conocimiento/:id", controlador.actualizarConocimiento);
router.delete("/sali/conocimiento/:id", controlador.eliminarConocimiento);

module.exports = router;
