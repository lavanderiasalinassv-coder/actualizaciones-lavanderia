const { Router } = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { subirComprobante } = require("../controllers/uploads.controller");

const router = Router();
const directorioComprobantes = path.join(
  __dirname,
  "..",
  "uploads",
  "comprobantes",
);
fs.mkdirSync(directorioComprobantes, { recursive: true });

const almacenamiento = multer.diskStorage({
  destination: (_req, _file, callback) =>
    callback(null, directorioComprobantes),
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(
      null,
      `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`,
    );
  },
});

const subirArchivo = multer({
  storage: almacenamiento,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) =>
    callback(null, file.mimetype.startsWith("image/")),
});

router.post(
  "/comprobantes/imagen",
  subirArchivo.single("imagen"),
  subirComprobante,
);

module.exports = router;
