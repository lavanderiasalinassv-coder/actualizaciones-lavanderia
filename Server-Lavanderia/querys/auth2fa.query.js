const { randomUUID } = require("crypto");
const { pool } = require("../database/MySQLConexion");
const { AppError } = require("../utils/errors");
const nodemailer = require("nodemailer");

// Configuración de Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "lavanderiasalinassv@gmail.com",
    pass: "licn aspz pjfy uyki",
  },
});

// Verificar conexión con el servidor de correo
transporter.verify((error, success) => {
  if (error) {
    console.error("Error al conectar con el servidor de correo:", error);
  } else {
    console.log("Servidor de correo verificado correctamente");
  }
});

const generarCodigo4Digitos = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

const crearCodigo2FA = async (usuarioId, correo) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.execute(
      "DELETE FROM codigos_2fa WHERE usuario_id = ? AND usado = 0",
      [usuarioId],
    );

    const codigo = generarCodigo4Digitos();

    const id = randomUUID();
    await conn.execute(
      "INSERT INTO codigos_2fa (id, usuario_id, codigo, expiracion, usado, creado_en) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 2 MINUTE), 0, NOW())",
      [id, usuarioId, codigo],
    );

    await conn.commit();
    // Enviar correo
    try {
      await transporter.sendMail({
        from: "Lavandería Salinas <lavanderiasalinassv@gmail.com>",
        to: correo,
        subject: "Código de acceso 2FA - Lavandería Salinas",
        text: `Tu código de acceso de 4 dígitos es: ${codigo}\n\nEste código expira en 2 minutos.\n\nSi no solicitaste este código, ignora este mensaje.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #123a66;">Código de Acceso 2FA</h2>
            <p>Tu código de acceso de 4 dígitos es:</p>
            <div style="background: #f5f9fc; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; color: #16a34a; border-radius: 10px; margin: 20px 0;">
              ${codigo}
            </div>
            <p>Este código expira en 2 minutos.</p>
            <p style="color: #6d829c; font-size: 14px;">Si no solicitaste este código, ignora este mensaje.</p>
          </div>
        `,
      });
      console.log(`Código 2FA enviado a ${correo}: ${codigo}`);
    } catch (error) {
      console.error("Error al enviar correo 2FA:", error);
      throw new AppError(
        "No se pudo enviar el código 2FA. Intente nuevamente.",
        500,
      );
    }

    return { codigoEnviado: true };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

const validarCodigo2FA = async (usuarioId, codigo) => {
  const codigoNormalizado = codigo.toString().trim();
  console.log(
    `Validando código 2FA - usuarioId: ${usuarioId}, código recibido: "${codigoNormalizado}"`,
  );

  if (codigoNormalizado.length !== 4) {
    console.log("Error: Código no tiene 4 dígitos");
    throw new AppError("El código debe tener 4 dígitos.", 400);
  }

  const conn = await pool.getConnection();
  try {
    // Primero verificar qué códigos existen para este usuario
    const [allCodes] = await conn.query(
      `SELECT * FROM codigos_2fa WHERE usuario_id = ? ORDER BY creado_en DESC LIMIT 5`,
      [usuarioId],
    );
    console.log("Códigos encontrados para usuario:", allCodes);

    const [rows] = await conn.query(
      `SELECT * FROM codigos_2fa
       WHERE usuario_id = ? AND codigo = ? AND usado = 0 AND expiracion > NOW()
       ORDER BY creado_en DESC LIMIT 1`,
      [usuarioId, codigoNormalizado],
    );

    console.log("Resultado de búsqueda:", rows);

    if (!rows.length) {
      console.log("Error: No se encontró código válido");
      throw new AppError("Código inválido o expirado.", 401);
    }

    // Marcar como usado
    await conn.execute("UPDATE codigos_2fa SET usado = 1 WHERE id = ?", [
      rows[0].id,
    ]);

    console.log("Código marcado como usado exitosamente");
    return { valido: true };
  } catch (error) {
    console.error("Error en validarCodigo2FA:", error);
    throw error;
  } finally {
    conn.release();
  }
};

module.exports = {
  crearCodigo2FA,
  validarCodigo2FA,
};
