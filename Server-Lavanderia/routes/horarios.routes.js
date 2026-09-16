const { Router } = require("express");
const {
  obtenerEstadoHorarios,
  guardarRegistros,
  guardarTurnos,
  eliminarTurno,
  guardarPagos,
  guardarNotificaciones,
  guardarPagoPorHora,
  guardarPeriodoPago,
} = require("../controllers/horarios.controller");

const router = Router();

router.get("/horarios/estado", obtenerEstadoHorarios);
router.put("/horarios/registros", guardarRegistros);
router.put("/horarios/turnos", guardarTurnos);
router.delete("/horarios/turnos/:id", eliminarTurno);
router.put("/horarios/pagos", guardarPagos);
router.put("/horarios/notificaciones", guardarNotificaciones);
router.put("/horarios/pago-por-hora", guardarPagoPorHora);
router.put("/horarios/periodo", guardarPeriodoPago);

module.exports = router;
