const { Router } = require("express");
const {
  limpiarTablasController,
} = require("../controllers/mantenimiento.controller");

const router = Router();

router.post("/limpiar", limpiarTablasController);

module.exports = router;
