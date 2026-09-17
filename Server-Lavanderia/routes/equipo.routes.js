const { Router } = require("express");
const multer = require("multer");
const {
  listarEquipo,
  autenticarEquipo,
  verificar2FA,
  validarConfiable, // 👈 nuevo
  crearEquipo,
  editarEquipo,
  eliminarEquipo,
  subirImagenPerfil,
  recuperarPIN,
  verificarRecuperacionPIN,
} = require("../controllers/equipo.controller");

const router = Router();
const subirImagen = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    callback(null, file.mimetype.startsWith("image/"));
  },
});

router.get("/equipo", listarEquipo);
router.post("/equipo/auth", autenticarEquipo);
router.post("/equipo/verificar-2fa", verificar2FA);
router.post("/equipo/validar-confiable", validarConfiable); // 👈 nuevo
router.post("/equipo/recuperar-pin", recuperarPIN);
router.post("/equipo/verificar-recuperacion-pin", verificarRecuperacionPIN);
router.post("/equipo", crearEquipo);
router.put("/equipo/:id", editarEquipo);
router.post(
  "/equipo/:id/imagen",
  subirImagen.single("imagen"),
  subirImagenPerfil,
);
router.delete("/equipo/:id", eliminarEquipo);

module.exports = router;
