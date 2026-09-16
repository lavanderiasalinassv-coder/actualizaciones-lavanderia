const { Router } = require("express");
const {
  listarNotificaciones,
  listarProblemas,
  listarMisProblemas,
  reportarProblema,
  enviarAviso,
  editarAviso,
  cambiarEstado,
  marcarComoLeida,
  limpiarTodas,
  eliminarMiProblema,
  eliminarNotificacionPorId,
} = require("../controllers/notificaciones.controller");

const router = Router();
router.get("/notificaciones", listarNotificaciones);
router.get("/notificaciones/problemas", listarProblemas);
router.get("/notificaciones/problemas/mios", listarMisProblemas);
router.post("/notificaciones/problemas", reportarProblema);
router.patch("/notificaciones/problemas/:id", cambiarEstado);
router.delete("/notificaciones/problemas/:id", eliminarMiProblema);
router.post("/notificaciones/avisos", enviarAviso);
router.patch("/notificaciones/avisos/:id", editarAviso);
router.patch("/notificaciones/:id/leida", marcarComoLeida);
router.delete("/notificaciones", limpiarTodas);
router.delete("/notificaciones/:id", eliminarNotificacionPorId);

module.exports = router;
