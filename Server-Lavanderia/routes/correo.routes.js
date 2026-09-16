const { Router } = require("express");
const {
  enviarCorreoHTML,
  enviarCorreoNotificacion,
} = require("../controllers/correo.controller");

const router = Router();

router.post("/enviar-html", enviarCorreoHTML);
router.post("/enviar-notificacion", enviarCorreoNotificacion);

module.exports = router;
