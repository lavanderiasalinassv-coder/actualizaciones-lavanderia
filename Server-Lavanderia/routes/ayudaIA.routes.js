const { Router } = require("express");
const { responderAyuda } = require("../controllers/ayudaIA.controller");
const {
  obtenerConfiguracion,
  obtenerPredeterminados,
  actualizarConfiguracion,
} = require("../controllers/modelosIA.controller");

const router = Router();

router.post("/ayuda-ia", responderAyuda);

router.get("/configuracion-modelos", obtenerConfiguracion);
router.get("/configuracion-modelos/defaults", obtenerPredeterminados);
router.put("/configuracion-modelos", actualizarConfiguracion);

module.exports = router;
