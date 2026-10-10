const express = require("express");
const router = express.Router();
const controller = require("../controllers/registrosPersonal.controller");
router.get("/registros-personal", controller.listarRegistros);
router.post("/registros-personal/sesiones", controller.iniciarSesion);
router.post("/registros-personal/sesiones/:id/desconexion", controller.cerrarSesion);
module.exports = router;
