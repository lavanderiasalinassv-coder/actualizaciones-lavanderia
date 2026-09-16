const { Router } = require("express");
const {
  listarPromociones,
  obtenerUnaPromocion,
  listarVigentes,
  listarAplicables,
  crearUnaPromocion,
  editarUnaPromocion,
  eliminarUnaPromocion,
} = require("../controllers/promociones.controller");

const router = Router();

router.get("/promociones", listarPromociones);
router.get("/promociones/vigentes", listarVigentes);
router.post("/promociones/aplicables", listarAplicables);
router.get("/promociones/:id", obtenerUnaPromocion);
router.post("/promociones", crearUnaPromocion);
router.put("/promociones/:id", editarUnaPromocion);
router.delete("/promociones/:id", eliminarUnaPromocion);

module.exports = router;
