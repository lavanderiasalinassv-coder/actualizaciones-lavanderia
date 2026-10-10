const { Router } = require("express");
const multer = require("multer");
const { obtener, guardar, subirImagen } = require("../controllers/disenosTicket.controller");
const router = Router();
const cargarImagen = multer({ storage:multer.memoryStorage(), limits:{ fileSize:5*1024*1024 }, fileFilter:(_req,file,cb)=>cb(null,file.mimetype.startsWith("image/")) });
router.get("/disenos-ticket", obtener);
router.put("/disenos-ticket", guardar);
router.post("/disenos-ticket/imagen", cargarImagen.single("imagen"), subirImagen);
module.exports = router;
