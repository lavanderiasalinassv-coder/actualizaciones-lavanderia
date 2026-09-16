const { Router } = require("express");
const {
  obtenerTurnoActual,
  abrirTurnoCaja,
  cerrarTurnoCaja,
  actualizarNotasTurno,
  reiniciarTurno,
} = require("../controllers/turno.controller");

const router = Router();

router.get("/turno", obtenerTurnoActual);
router.post("/turno/abrir", abrirTurnoCaja);
router.post("/turno/cerrar", cerrarTurnoCaja);
router.put("/turno/notas", actualizarNotasTurno);
router.post("/turno/reset", reiniciarTurno);

module.exports = router;
