const nodemailer = require("nodemailer");
const pdf = require("html-pdf");
const path = require("path");
const fs = require("fs");

const obtenerRutaLogo = () => {
  const frontendDist = process.env.RESOURCES_PATH
    ? path.join(process.env.RESOURCES_PATH, "backend", "frontend", "dist")
    : path.join(__dirname, "..", "..", "lavanderia-salinas", "dist");
  const logoDistribuido = path.join(frontendDist, "logo.jpg");

  if (fs.existsSync(logoDistribuido)) return logoDistribuido;

  return path.join(
    __dirname,
    "..",
    "..",
    "lavanderia-salinas",
    "public",
    "logo.jpg",
  );
};

// Configuración de Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "lavanderiasalinassv@gmail.com",
    pass: "licn aspz pjfy uyki",
  },
});

// Verificar conexión
transporter.verify((error, success) => {
  if (error) {
    console.error("Error al conectar con el servidor de correo:", error);
  } else {
    console.log("Servidor de correo verificado correctamente");
  }
});

const enviarCorreoHTML = async (req, res) => {
  try {
    const { correo, html, asunto, nombreCliente } = req.body;

    if (!correo || !html) {
      return res.status(400).json({ error: "correo y html son obligatorios." });
    }

    console.log(`Enviando correo HTML a ${correo}`);

    await transporter.sendMail({
      from: "Lavandería Salinas <lavanderiasalinassv@gmail.com>",
      to: correo,
      subject: asunto || "Tu orden - Lavandería Salinas",
      html: `<div style="font-family: Arial, sans-serif;">${html}</div>`,
      attachments: [
        {
          filename: "logo.jpg",
          path: obtenerRutaLogo(),
          cid: "logo-factura",
        },
      ],
    });

    console.log(`Correo enviado exitosamente a ${correo}`);
    res.status(200).json({ enviado: true });
  } catch (error) {
    console.error("Error al enviar correo HTML:", error);
    res.status(500).json({
      error: "No se pudo enviar el correo.",
      detalle:
        process.env.NODE_ENV === "production" ? undefined : error.message,
    });
  }
};

const enviarCorreoNotificacion = async (req, res) => {
  try {
    const {
      correo,
      nombreCliente,
      numeroOrden,
      detalles,
      asunto,
      htmlFactura,
      adjuntarFactura,
    } = req.body;

    if (!correo || !numeroOrden) {
      return res
        .status(400)
        .json({ error: "correo y numeroOrden son obligatorios." });
    }

    const asuntoFinal =
      asunto || `Actualización de tu orden ${numeroOrden} - Lavandería Salinas`;
    const mensajeFinal =
      detalles ||
      `Hola ${nombreCliente || "cliente"}, tu orden ${numeroOrden} ha sido actualizada.`;
    const adjuntos = [];

    if (adjuntarFactura && htmlFactura) {
      const logoPath = obtenerRutaLogo();
      const logoDataUri = `data:image/jpeg;base64,${fs.readFileSync(logoPath).toString("base64")}`;
      const htmlParaPdf = htmlFactura.replace(
        /src=["']cid:logo-factura["']/g,
        `src="${logoDataUri}"`,
      );
      const facturaPdf = await new Promise((resolve, reject) => {
        pdf
          .create(htmlParaPdf, { format: "Letter" })
          .toBuffer((error, buffer) => {
            if (error) reject(error);
            else resolve(buffer);
          });
      });
      adjuntos.push({
        filename: `Comprobante-de-entrega-${numeroOrden}.pdf`,
        content: facturaPdf,
        contentType: "application/pdf",
      });
    }

    console.log(`Enviando notificación a ${correo}: ${asuntoFinal}`);

    await transporter.sendMail({
      from: "Lavandería Salinas <lavanderiasalinassv@gmail.com>",
      to: correo,
      subject: asuntoFinal,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #16a34a;">Lavandería Salinas</h2>
          <div style="color: #526b82; line-height: 1.6;">${mensajeFinal}</div>
          ${adjuntarFactura ? "" : `<p style="margin: 22px 0 0; color: #168276; font-size: 15px; font-weight: bold;">Orden ${numeroOrden}</p>`}
          <p style="color: #6d829c; font-size: 14px;">Gracias por confiar en Lavandería Salinas.</p>
        </div>
      `,
      attachments: adjuntos,
    });

    console.log(`Notificación enviada exitosamente a ${correo}`);
    res.status(200).json({ enviado: true });
  } catch (error) {
    console.error("Error al enviar notificación:", error);
    res.status(500).json({
      error: "No se pudo enviar la notificación.",
      detalle:
        process.env.NODE_ENV === "production" ? undefined : error.message,
    });
  }
};

const enviarCorreoRecuperacion = async (correo, codigo) => {
  try {
    console.log(`Enviando correo de recuperación a ${correo}`);

    await transporter.sendMail({
      from: "Lavandería Salinas <lavanderiasalinassv@gmail.com>",
      to: correo,
      subject: "Código de recuperación de PIN - Lavandería Salinas",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f7fa;">
          <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <h2 style="color: #123a66; margin: 0 0 20px 0;">🔑 Recuperación de PIN</h2>
            <p style="color: #526b82; line-height: 1.6; margin: 0 0 20px 0;">
              Hemos recibido una solicitud para recuperar tu PIN de acceso al sistema de Lavandería Salinas.
            </p>
            <div style="background: linear-gradient(135deg, #4fb3e0 0%, #123a66 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <p style="margin: 0 0 10px 0; font-size: 14px; opacity: 0.9;">Tu código temporal es:</p>
              <p style="margin: 0; font-size: 32px; font-weight: bold; letter-spacing: 4px;">${codigo}</p>
            </div>
            <p style="color: #6d829c; font-size: 14px; margin: 20px 0 10px 0;">
              ⚠️ Este código expirará en <strong>1 minuto</strong> por seguridad.
            </p>
            <p style="color: #6d829c; font-size: 14px; margin: 10px 0 20px 0;">
              Si no solicitaste esta recuperación, ignora este correo.
            </p>
            <p style="color: #6d829c; font-size: 14px; margin: 0;">
              Gracias por confiar en Lavandería Salinas.
            </p>
          </div>
        </div>
      `,
    });

    console.log(`Correo de recuperación enviado exitosamente a ${correo}`);
    return true;
  } catch (error) {
    console.error("Error al enviar correo de recuperación:", error);
    throw error;
  }
};

module.exports = {
  enviarCorreoHTML,
  enviarCorreoNotificacion,
  enviarCorreoRecuperacion,
};
