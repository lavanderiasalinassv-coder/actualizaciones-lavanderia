const subirComprobante = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Debes seleccionar una imagen." });
  }

  const url = `${req.protocol}://${req.get("host")}/uploads/comprobantes/${req.file.filename}`;
  return res.status(201).json({ url });
};

module.exports = { subirComprobante };
