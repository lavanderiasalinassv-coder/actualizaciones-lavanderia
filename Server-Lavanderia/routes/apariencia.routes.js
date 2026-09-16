const { Router } = require("express");
const multer = require("multer");
const {
  obtenerConfiguracion,
  actualizarConfiguracion,
  subirImagen,
} = require("../controllers/apariencia.controller");

const router = Router();

const subirArchivo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    callback(null, file.mimetype.startsWith("image/"));
  },
});

router.get("/apariencia", obtenerConfiguracion);
router.put("/apariencia", actualizarConfiguracion);
router.post("/apariencia/imagen", subirArchivo.single("imagen"), subirImagen);

module.exports = router;
