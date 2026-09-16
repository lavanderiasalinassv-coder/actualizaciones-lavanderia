const { Router } = require("express");
const controller = require("../controllers/movimientosCaja.controller");

const router = Router();
router.get("/movimientos-caja", controller.listar);
router.post("/movimientos-caja", controller.crear);
router.put("/movimientos-caja/:id", controller.actualizar);
router.delete("/movimientos-caja/:id", controller.eliminar);

module.exports = router;
