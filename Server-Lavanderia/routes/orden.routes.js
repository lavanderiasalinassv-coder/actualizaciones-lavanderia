const express = require("express");
const router = express.Router();
const controller = require("../controllers/orden.controller");

router.get("/", controller.listarOrdenes);
router.get("/:id", controller.obtenerOrden);
router.post("/", controller.crear);

router.patch("/:id/estado", controller.cambiarEstado);
router.patch("/:id/pago", controller.marcarPago);
router.patch("/:id", controller.actualizarCampos); // solo notaInterna y/o fotos

router.post("/:id/anticipos", controller.crearAnticipo);
router.delete("/:id/anticipos/:idAnticipo", controller.borrarAnticipo);

router.post("/:id/cargos-extra", controller.crearCargoExtra);
router.delete("/:id/cargos-extra/:idCargo", controller.borrarCargoExtra);

router.post("/:id/items", controller.agregarItem);
router.delete("/:id/items/:itemId", controller.borrarItem);

router.delete("/:id/fotos/:index", controller.borrarFoto);

router.post("/:id/movimientos", controller.crearMovimiento);
router.post("/:id/cancelar", controller.cancelar);
router.post("/:id/restaurar", controller.restaurar);
router.patch("/:id/cancelar", controller.cancelar); // compatibilidad con clientes anteriores

router.delete("/:id", controller.eliminar);

module.exports = router;
