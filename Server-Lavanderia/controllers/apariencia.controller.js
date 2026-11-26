const {
  obtenerApariencia,
  guardarApariencia,
} = require("../querys/apariencia.query");
const { v2: cloudinary } = require("cloudinary");

const FUENTES_APARIENCIA = new Set([
  "system",
  "segoe",
  "arial",
  "verdana",
  "tahoma",
  "trebuchet",
  "calibri",
  "candara",
  "gill-sans",
  "lucida-sans",
  "century-gothic",
  "georgia",
  "cambria",
  "palatino",
  "times",
  "courier",
  "comic-sans",
  "segoe-script",
  "segoe-print",
  "lucida-handwriting",
  "mobile-cursive",
]);
const DISENOS_LOGIN = new Set([
  "classic",
  "reverse",
  "centered",
  "integrated",
  "header",
]);
const TEMAS_LOGIN = new Set([
  "market",
  "nocturne",
  "linen",
  "aurora",
  "minimal",
]);
const POSICIONES_SALI_AI = new Set(["left", "right"]);
const RUTAS_ACCESO_PRINCIPAL = new Set([
  "/tabs/home",
  "/tabs/ordenes",
  "/tabs/reportes",
  "/tabs/calendario",
  "/tabs/clientes",
  "/tabs/productos",
  "/tabs/inventario",
  "/tabs/promociones",
  "/tabs/facturas",
  "/tabs/equipo",
  "/tabs/horarios",
  "/tabs/configuracion",
]);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const manejarError = (res, error) => {
  console.error("Error en apariencia.controller:", error);
  return res.status(500).json({ error: "Error interno del servidor." });
};

const obtenerPublicIdDesdeUrl = (url) => {
  if (typeof url !== "string" || !url) return null;
  const coincidencia = url.match(/\/image\/upload\/(?:v\d+\/)?(.+)$/);
  if (!coincidencia) return null;
  return coincidencia[1].replace(/\.[^/.?]+(?:\?.*)?$/, "");
};

const eliminarImagenCloudinary = async (url) => {
  const publicId = obtenerPublicIdDesdeUrl(url);
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  } catch (error) {
    console.error(
      "No se pudo eliminar la imagen de apariencia:",
      error.message,
    );
  }
};

const obtenerConfiguracion = async (_req, res) => {
  try {
    res.status(200).json(await obtenerApariencia());
  } catch (error) {
    manejarError(res, error);
  }
};

const actualizarConfiguracion = async (req, res) => {
  try {
    if (
      req.body?.fontFamily !== undefined &&
      !FUENTES_APARIENCIA.has(req.body.fontFamily)
    ) {
      return res.status(400).json({ error: "La fuente seleccionada no es válida." });
    }
    if (
      req.body?.loginLayout !== undefined &&
      !DISENOS_LOGIN.has(req.body.loginLayout)
    ) {
      return res.status(400).json({ error: "El diseño de la pantalla de sesión no es válido." });
    }
    if (
      req.body?.loginTheme !== undefined &&
      !TEMAS_LOGIN.has(req.body.loginTheme)
    ) {
      return res.status(400).json({ error: "El tema de la pantalla de sesión no es válido." });
    }
    if (
      req.body?.saliAssistantPosition !== undefined &&
      !POSICIONES_SALI_AI.has(req.body.saliAssistantPosition)
    ) {
      return res.status(400).json({ error: "La posición del icono de Sali AI no es válida." });
    }
    if (
      req.body?.principalPanelesInvertidos !== undefined &&
      typeof req.body.principalPanelesInvertidos !== "boolean"
    ) {
      return res.status(400).json({ error: "La distribución de los paneles no es válida." });
    }
    if (req.body?.principalAccesosOrden !== undefined) {
      const orden = req.body.principalAccesosOrden;
      if (
        !Array.isArray(orden) ||
        orden.length > RUTAS_ACCESO_PRINCIPAL.size ||
        orden.some((ruta) => !RUTAS_ACCESO_PRINCIPAL.has(ruta)) ||
        new Set(orden).size !== orden.length
      ) {
        return res.status(400).json({ error: "El orden de los accesos no es válido." });
      }
    }

    const anterior = await obtenerApariencia();
    const actualizada = await guardarApariencia(req.body ?? {});
    for (const campo of ["appShellImagen", "loginImagen"]) {
      if (anterior[campo] && anterior[campo] !== actualizada[campo]) {
        await eliminarImagenCloudinary(anterior[campo]);
      }
    }
    res.status(200).json(actualizada);
  } catch (error) {
    manejarError(res, error);
  }
};

const subirImagen = async (req, res) => {
  try {
    const campo = req.body?.campo;
    if (!req.file) {
      return res.status(400).json({ error: "Debes seleccionar una imagen." });
    }
    if (!["appShellImagen", "loginImagen"].includes(campo)) {
      return res
        .status(400)
        .json({ error: "El destino de la imagen no es válido." });
    }
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return res
        .status(500)
        .json({ error: "Cloudinary no está configurado en el servidor." });
    }

    const anterior = await obtenerApariencia();
    const resultado = await new Promise((resolve, reject) => {
      const carga = cloudinary.uploader.upload_stream(
        {
          folder: `lavanderia-salinas/apariencia/${campo}`,
          resource_type: "image",
        },
        (error, resultadoCarga) =>
          error ? reject(error) : resolve(resultadoCarga),
      );
      carga.end(req.file.buffer);
    });
    const actualizada = await guardarApariencia({
      ...anterior,
      [campo]: resultado.secure_url,
    });
    await eliminarImagenCloudinary(anterior[campo]);
    return res
      .status(201)
      .json({ url: actualizada[campo], apariencia: actualizada });
  } catch (error) {
    return manejarError(res, error);
  }
};

module.exports = {
  obtenerConfiguracion,
  actualizarConfiguracion,
  subirImagen,
};
