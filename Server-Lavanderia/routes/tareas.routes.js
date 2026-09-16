const { Router } = require("express");
const {
  listarTareas,
  obtenerTarea,
  crearTareaController,
  completarTareaController,
  reasignarTareaController,
  eliminarTareaController,
  limpiarCompletadasController,
} = require("../controllers/tareas.controller");

const router = Router();

router.get("/", listarTareas);
router.get("/:id", obtenerTarea);
router.post("/", crearTareaController);
router.patch("/:id/completar", completarTareaController);
router.patch("/:id/reasignar", reasignarTareaController);
router.delete("/completadas", limpiarCompletadasController);
router.delete("/:id", eliminarTareaController);

module.exports = router;
