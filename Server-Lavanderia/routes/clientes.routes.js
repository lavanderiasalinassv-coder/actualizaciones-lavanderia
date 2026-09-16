const { Router } = require("express");
const controller = require("../controllers/clientes.controller");

const router = Router();

router.get("/clientes", controller.listar);
router.get("/clientes/buscar", controller.buscar);
router.get("/clientes/telefono/:telefono", controller.buscarPorTelefono);
router.get("/clientes/estadisticas", controller.estadisticas);
router.get("/clientes/:id", controller.obtenerPorId);
router.post("/clientes", controller.crear);
router.put("/clientes/:id", controller.actualizar);
router.delete("/clientes/:id", controller.eliminar);
router.post("/clientes/registrar-orden", controller.registrarOrden);

module.exports = router;