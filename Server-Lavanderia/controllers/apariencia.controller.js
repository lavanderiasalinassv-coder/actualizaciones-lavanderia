const {
  obtenerApariencia,
  guardarApariencia,
} = require("../querys/apariencia.query");
const { v2: cloudinary } = require("cloudinary");

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
