const { Router } = require("express");
const controller = require("../controllers/cierresCaja.controller");
const router = Router();
router.get("/cierres-caja", controller.listar);
router.post("/cierres-caja", controller.crear);
router.put("/cierres-caja/:id/deposito", controller.revisar);
router.delete("/cierres-caja/:id", controller.eliminar);
module.exports = router;
