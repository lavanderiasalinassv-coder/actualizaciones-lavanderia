const { Router } = require("express");
const controller = require("../controllers/lealtad.controller");

const router = Router();

router.get("/lealtad/configuracion", controller.obtenerConfiguracion);
router.get("/lealtad/tarjetas", controller.listarTarjetas);
router.patch("/lealtad/tarjetas/:tarjetaId/visitas", controller.ajustarVisitas);
router.delete("/lealtad/tarjetas/:tarjetaId", controller.desactivarTarjeta);
router.put("/lealtad/configuracion", controller.actualizarPremio);
router.post("/lealtad/verificacion", controller.solicitarCodigo);
router.post("/lealtad/canje/verificacion", controller.solicitarCodigoCanje);
router.post("/lealtad/canje/verificacion/validar", controller.verificarCodigoCanje);
router.post("/lealtad/registro", controller.registrarTarjeta);
router.get("/lealtad/tarjeta/:token", controller.obtenerTarjeta);
router.post("/lealtad/visitas", controller.registrarVisita);
router.post("/lealtad/tarjeta-telefono", controller.obtenerTarjetaPorTelefono);
router.post("/lealtad/canjes", controller.canjearPremio);

module.exports = router;
