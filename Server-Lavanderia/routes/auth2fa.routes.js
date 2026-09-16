const { Router } = require("express");
const { enviarCodigo2FA, verificarCodigo2FA } = require("../controllers/auth2fa.controller");

const router = Router();

router.post("/enviar-codigo", enviarCodigo2FA);
router.post("/verificar-codigo", verificarCodigo2FA);

module.exports = router;