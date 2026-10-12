const express = require("express");
const router = express.Router();
const controller = require("../controllers/orden.controller");

router.get("/", controller.listarOrdenes);
router.get("/:id", controller.actualizarMoraAntesDeOperacion, controller.obtenerOrden);
router.post("/", controller.crear);

router.post("/:id/recalcular-mora", controller.recalcularMora);
router.post("/:id/aplicar-mora-antigua", controller.aplicarMoraAntigua);
router.patch("/:id/estado", controller.actualizarMoraAntesDeOperacion, controller.cambiarEstado);
router.post("/:id/detener-mora", controller.detenerMora);
router.post("/:id/reanudar-mora", controller.reanudarMora);
router.post("/:id/eliminar-mora", controller.eliminarMora);
router.post("/:id/aplicar-mora", controller.aplicarMora);
router.patch("/:id/pago", controller.actualizarMoraAntesDeOperacion, controller.marcarPago);
router.patch("/:id", controller.actualizarCampos); // solo notaInterna y/o fotos

router.post("/:id/anticipos", controller.actualizarMoraAntesDeOperacion, controller.crearAnticipo);
router.delete("/:id/anticipos/:idAnticipo", controller.actualizarMoraAntesDeOperacion, controller.borrarAnticipo);

router.post("/:id/cargos-extra", controller.actualizarMoraAntesDeOperacion, controller.crearCargoExtra);
router.delete("/:id/cargos-extra/:idCargo", controller.actualizarMoraAntesDeOperacion, controller.borrarCargoExtra);

router.post("/:id/items", controller.actualizarMoraAntesDeOperacion, controller.agregarItem);
router.delete("/:id/items/:itemId", controller.actualizarMoraAntesDeOperacion, controller.borrarItem);

router.delete("/:id/fotos/:index", controller.borrarFoto);

router.post("/:id/movimientos", controller.crearMovimiento);
router.post("/:id/cancelar", controller.actualizarMoraAntesDeOperacion, controller.cancelar);
router.post("/:id/restaurar", controller.restaurar);
router.patch("/:id/cancelar", controller.actualizarMoraAntesDeOperacion, controller.cancelar); // compatibilidad con clientes anteriores
router.post("/:id/descuento", controller.actualizarMoraAntesDeOperacion, controller.aplicarDescuento);

router.delete("/:id", controller.eliminar);

module.exports = router;
