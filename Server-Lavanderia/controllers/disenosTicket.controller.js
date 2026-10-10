const { pool } = require("../database/MySQLConexion");
const { v2: cloudinary } = require("cloudinary");

cloudinary.config({ cloud_name:process.env.CLOUDINARY_CLOUD_NAME, api_key:process.env.CLOUDINARY_API_KEY, api_secret:process.env.CLOUDINARY_API_SECRET });

const POLITICAS_PREDETERMINADAS = [
  "Para retirar las prendas, es indispensable presentar este recibo como único comprobante válido.",
  "La mora por retraso en la entrega inicia después de 2 días calendario de gracia desde la fecha prometida; luego se aplica $0.50 por día.",
  "El plazo para realizar cualquier reclamación sobre el servicio es de 2 días hábiles después de la entrega.",
  "La lavandería no se responsabiliza por pérdidas o daños causados por eventos fortuitos o fuerza mayor, como robos, incendios o desastres naturales, siendo este riesgo asumido por el cliente.",
  "Las prendas no retiradas en un plazo de 30 días serán consideradas abandonadas, liberando a la lavandería de toda responsabilidad sobre ellas.",
  "Si dichas prendas no son reclamadas en un plazo adicional de 10 días (40 días en total desde su disponibilidad), la lavandería se reserva el derecho de donarlas a refugios u organizaciones benéficas sin posibilidad de reclamos futuros.",
];

const DISENO_PREDETERMINADO = {
  ticket: { ancho: 80, tamanoFuente: 12, mostrarLogo: true, logoUrl: "", mostrarTelefono: true, mostrarCorreo: true, mostrarEntrega: true, mostrarDetalles: true, mostrarServicios: true, mostrarPrecios: true, mostrarPago: true, mensajeFinal: "¡Gracias por su preferencia!", instruccion: "Presente este ticket al retirar sus prendas.", mostrarFirma: true, textoAceptacion: "Al firmar usted acepta nuestras condiciones y políticas del servicio.", mostrarPoliticas: true, politicas: POLITICAS_PREDETERMINADAS, contactoPolitica: "Dudas: lavanderiasalinassv@gmail.com · WhatsApp 2497 6699", mostrarDireccion: true, direccion: "3 calle oriente, Barrio Las Flores, Ahuachapán local número dos, situado, Ahuachapán", mostrarPromocion: false, promocionId: "", promocionNombre: "", promocionDescripcion: "", promocionTipoDescuento: "porcentaje", promocionValor: 0, promocionFechaFin: "", textoPromocion: "¡Aprovecha esta promoción en tu próxima visita!" },
  prendas: { ancho: 58, tamanoFuente: 11, mostrarLogo: true, logoUrl: "", mostrarTelefono: true, mostrarEntrega: true, mostrarDetalles: true, mensajeFinal: "" },
};

let tablaLista;
const asegurarTabla = () => {
  if (!tablaLista) tablaLista = pool.query(`CREATE TABLE IF NOT EXISTS disenos_ticket (
    id TINYINT NOT NULL PRIMARY KEY, configuracion JSON NOT NULL,
    actualizado_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`).catch((error) => { tablaLista = null; throw error; });
  return tablaLista;
};

const obtener = async (_req, res) => {
  try {
    await asegurarTabla();
    const [filas] = await pool.query("SELECT configuracion FROM disenos_ticket WHERE id = 1 LIMIT 1");
    let guardado = filas[0]?.configuracion || {};
    if (typeof guardado === "string") guardado = JSON.parse(guardado);
    if (!filas.length) {
      await pool.query("INSERT INTO disenos_ticket (id, configuracion) VALUES (1, ?)", [JSON.stringify(DISENO_PREDETERMINADO)]);
      guardado = DISENO_PREDETERMINADO;
    }
    return res.json({ ...DISENO_PREDETERMINADO, ...guardado, ticket: { ...DISENO_PREDETERMINADO.ticket, ...(guardado.ticket || {}) }, prendas: { ...DISENO_PREDETERMINADO.prendas, ...(guardado.prendas || {}) } });
  } catch (error) {
    console.error("No se pudo cargar el diseño de impresión:", error);
    return res.status(500).json({ error: "No se pudo cargar el diseño de impresión." });
  }
};

const guardar = async (req, res) => {
  try {
    const config = req.body;
    if (!config || typeof config !== "object" || !config.ticket || !config.prendas) return res.status(400).json({ error: "La configuración de ticket y prendas es obligatoria." });
    const limitar = (diseno) => ({
      ancho: [58, 72, 80].includes(Number(diseno.ancho)) ? Number(diseno.ancho) : 80,
      tamanoFuente: Math.min(16, Math.max(8, Number(diseno.tamanoFuente) || 11)),
      ...Object.fromEntries(["mostrarLogo", "mostrarTelefono", "mostrarCorreo", "mostrarEntrega", "mostrarDetalles", "mostrarServicios", "mostrarPrecios", "mostrarPago"].filter((campo) => campo in diseno).map((campo) => [campo, Boolean(diseno[campo])])),
      ...(diseno.mostrarFirma !== undefined ? { mostrarFirma: Boolean(diseno.mostrarFirma) } : {}),
      ...(typeof diseno.textoAceptacion === "string" ? { textoAceptacion: diseno.textoAceptacion.slice(0, 300) } : {}),
      logoUrl: typeof diseno.logoUrl === "string" ? diseno.logoUrl.slice(0, 1000) : "",
      mensajeFinal: String(diseno.mensajeFinal || "").slice(0, 300),
      instruccion: String(diseno.instruccion || "").slice(0, 300),
      ...(diseno.mostrarPoliticas !== undefined ? { mostrarPoliticas: Boolean(diseno.mostrarPoliticas) } : {}),
      ...(diseno.mostrarDireccion !== undefined ? { mostrarDireccion: Boolean(diseno.mostrarDireccion) } : {}),
      ...(typeof diseno.direccion === "string" ? { direccion: diseno.direccion.slice(0, 300) } : {}),
      ...(diseno.mostrarPromocion !== undefined ? { mostrarPromocion: Boolean(diseno.mostrarPromocion) } : {}),
      ...(typeof diseno.promocionId === "string" ? { promocionId: diseno.promocionId.slice(0, 100) } : {}),
      ...(typeof diseno.promocionNombre === "string" ? { promocionNombre: diseno.promocionNombre.slice(0, 150) } : {}),
      ...(typeof diseno.promocionDescripcion === "string" ? { promocionDescripcion: diseno.promocionDescripcion.slice(0, 300) } : {}),
      ...(diseno.promocionTipoDescuento === "porcentaje" || diseno.promocionTipoDescuento === "dinero" ? { promocionTipoDescuento: diseno.promocionTipoDescuento } : {}),
      ...(Number.isFinite(Number(diseno.promocionValor)) ? { promocionValor: Math.max(0, Number(diseno.promocionValor)) } : {}),
      ...(typeof diseno.promocionFechaFin === "string" ? { promocionFechaFin: diseno.promocionFechaFin.slice(0, 30) } : {}),
      ...(typeof diseno.textoPromocion === "string" ? { textoPromocion: diseno.textoPromocion.slice(0, 300) } : {}),
      ...(Array.isArray(diseno.politicas) ? { politicas: diseno.politicas.map((texto) => String(texto).trim().slice(0, 500)).filter(Boolean).slice(0, 20) } : {}),
      ...(typeof diseno.contactoPolitica === "string" ? { contactoPolitica: diseno.contactoPolitica.slice(0, 300) } : {}),
    });
    const configSegura = { ticket: limitar(config.ticket), prendas: limitar(config.prendas) };
    await asegurarTabla();
    await pool.query("INSERT INTO disenos_ticket (id, configuracion) VALUES (1, ?) ON DUPLICATE KEY UPDATE configuracion = VALUES(configuracion)", [JSON.stringify(configSegura)]);
    return res.json(configSegura);
  } catch (error) {
    console.error("No se pudo guardar el diseño de impresión:", error);
    return res.status(500).json({ error: "No se pudo guardar el diseño de impresión." });
  }
};

const subirImagen = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Selecciona una imagen." });
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) return res.status(500).json({ error: "Cloudinary no está configurado en el servidor." });
    const tipo = req.body?.tipo === "prendas" ? "prendas" : "ticket";
    const resultado = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder: `lavanderia-salinas/disenos-ticket/${tipo}`, resource_type: "image" }, (error, data) => error ? reject(error) : resolve(data));
      stream.end(req.file.buffer);
    });
    await asegurarTabla();
    const [filas] = await pool.query("SELECT configuracion FROM disenos_ticket WHERE id = 1 LIMIT 1");
    let configuracion = filas[0]?.configuracion || {};
    if (typeof configuracion === "string") configuracion = JSON.parse(configuracion);
    configuracion = { ...DISENO_PREDETERMINADO, ...configuracion, [tipo]: { ...DISENO_PREDETERMINADO[tipo], ...(configuracion[tipo] || {}), logoUrl: resultado.secure_url } };
    await pool.query("INSERT INTO disenos_ticket (id, configuracion) VALUES (1, ?) ON DUPLICATE KEY UPDATE configuracion = VALUES(configuracion)", [JSON.stringify(configuracion)]);
    return res.status(201).json({ url: resultado.secure_url });
  } catch (error) {
    console.error("No se pudo cargar el logotipo del ticket:", error);
    return res.status(500).json({ error: "No se pudo cargar la imagen a Cloudinary." });
  }
};

module.exports = { obtener, guardar, subirImagen };
