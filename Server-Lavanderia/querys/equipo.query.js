const { randomUUID } = require("crypto");
const { pool } = require("../database/MySQLConexion");
const { AppError } = require("../utils/errors");

const ROLES_VALIDOS = ["administrador", "recepcionista", "cajero", "operador"];
const CODIGOS_PROHIBIDOS = ["123456", "592647"];
const CAMPOS_EQUIPO =
  "id, nombre, correo, codigo, rol, activo, creado_en, imagen_perfil, cambios_imagen_perfil";

const normalizarTexto = (valor) => {
  if (typeof valor !== "string") return "";
  return valor.trim();
};

const normalizarRol = (valor) => {
  const rol = normalizarTexto(valor).toLowerCase();
  return ROLES_VALIDOS.includes(rol) ? rol : "cajero";
};

const validarCodigo = (codigo, rol) => {
  if (!codigo || codigo.length === 0) return false;
  if (codigo.length !== 6 || !/^\d{6}$/.test(codigo)) return false;
  if (CODIGOS_PROHIBIDOS.includes(codigo)) return false;
  if (rol !== "administrador" && codigo.startsWith("0")) return false;
  return true;
};

const mensajeErrorCodigo = (codigo, rol) => {
  if (codigo.length !== 6 || !/^\d{6}$/.test(codigo)) {
    return "El código debe tener exactamente 6 dígitos numéricos.";
  }
  if (CODIGOS_PROHIBIDOS.includes(codigo)) {
    return "Este código está reservado por el sistema y no puede usarse.";
  }
  if (rol !== "administrador" && codigo.startsWith("0")) {
    return "El código no puede iniciar con 0 para este rol.";
  }
  return "El código no es válido.";
};

const mapRow = (row) => ({
  id: row.id,
  nombre: row.nombre,
  correo: row.correo,
  codigo: row.codigo,
  rol: row.rol,
  activo: !!row.activo,
  creadoEn: new Date(row.creado_en).toISOString(),
  imagenPerfil: row.imagen_perfil ?? null,
  cambiosImagenPerfil: Number(row.cambios_imagen_perfil ?? 0),
});

const obtenerEquipo = async () => {
  const [rows] = await pool.query(
    `SELECT ${CAMPOS_EQUIPO} FROM usuarios_equipo ORDER BY creado_en ASC`,
  );
  return rows.map(mapRow);
};

const autenticarUsuarioEquipo = async (codigo) => {
  const codigoNormalizado = normalizarTexto(codigo);
  if (!codigoNormalizado) return null;

  const [rows] = await pool.query(
    `SELECT ${CAMPOS_EQUIPO} FROM usuarios_equipo WHERE codigo = ? AND activo = 1 LIMIT 1`,
    [codigoNormalizado],
  );

  return rows.length ? mapRow(rows[0]) : null;
};

const autenticarUsuarioEquipoPorId = async (id) => {
  if (!id) return null;

  const [rows] = await pool.query(
    `SELECT ${CAMPOS_EQUIPO} FROM usuarios_equipo WHERE id = ? AND activo = 1 LIMIT 1`,
    [id],
  );

  return rows.length ? mapRow(rows[0]) : null;
};

const crearUsuarioEquipo = async (data) => {
  const nombre = normalizarTexto(data.nombre);
  const correo = normalizarTexto(data.correo).toLowerCase();
  const codigo = normalizarTexto(data.codigo);
  const rol = normalizarRol(data.rol);

  if (!nombre || !correo || !codigo) {
    throw new AppError(
      "Faltan datos obligatorios: nombre, correo y código.",
      400,
    );
  }

  if (!validarCodigo(codigo, rol)) {
    throw new AppError(mensajeErrorCodigo(codigo, rol), 400);
  }

  const [correoDup] = await pool.query(
    "SELECT id FROM usuarios_equipo WHERE correo = ? AND activo = 1 LIMIT 1",
    [correo],
  );
  if (correoDup.length) {
    throw new AppError("Ya existe un usuario con ese correo.", 409);
  }

  const [codigoDup] = await pool.query(
    "SELECT id FROM usuarios_equipo WHERE codigo = ? AND activo = 1 LIMIT 1",
    [codigo],
  );
  if (codigoDup.length) {
    throw new AppError("Ya existe un usuario con ese código.", 409);
  }

  const id = randomUUID();

  try {
    await pool.query(
      "INSERT INTO usuarios_equipo (id, nombre, correo, codigo, rol, activo) VALUES (?, ?, ?, ?, ?, 1)",
      [id, nombre, correo, codigo, rol],
    );
  } catch (error) {
    if (
      (error?.errno === 1265 || error?.code === "WARN_DATA_TRUNCATED") &&
      rol === "operador"
    ) {
      throw new AppError(
        "La base de datos todavía no tiene el rol operador. Ejecuta la migración add_operador_role.sql para actualizar el campo rol.",
        500,
      );
    }
    throw error;
  }

  const [rows] = await pool.query(
    `SELECT ${CAMPOS_EQUIPO} FROM usuarios_equipo WHERE id = ?`,
    [id],
  );

  return mapRow(rows[0]);
};

const editarUsuarioEquipo = async (id, cambios) => {
  const [actualRows] = await pool.query(
    `SELECT ${CAMPOS_EQUIPO} FROM usuarios_equipo WHERE id = ?`,
    [id],
  );

  if (!actualRows.length) {
    throw new AppError("No se encontró el usuario.", 404);
  }

  const actual = mapRow(actualRows[0]);
  const nombre = normalizarTexto(cambios.nombre ?? actual.nombre);
  const correo = normalizarTexto(cambios.correo ?? actual.correo).toLowerCase();
  const codigo = normalizarTexto(cambios.codigo ?? actual.codigo);
  const rol = normalizarRol(cambios.rol ?? actual.rol);
  const activo = cambios.activo ?? actual.activo;
  const imagenPerfil = Object.prototype.hasOwnProperty.call(
    cambios,
    "imagenPerfil",
  )
    ? cambios.imagenPerfil
    : actual.imagenPerfil;
  const cambiosImagenPerfil = Object.prototype.hasOwnProperty.call(
    cambios,
    "cambiosImagenPerfil",
  )
    ? Number(cambios.cambiosImagenPerfil)
    : actual.cambiosImagenPerfil;

  if (
    !Number.isInteger(cambiosImagenPerfil) ||
    cambiosImagenPerfil < 0 ||
    cambiosImagenPerfil > 2
  ) {
    throw new AppError("El límite de cambios de imagen no es válido.", 400);
  }
  const solicitaCambioDeImagen =
    Object.prototype.hasOwnProperty.call(cambios, "imagenPerfil") ||
    Object.prototype.hasOwnProperty.call(cambios, "cambiosImagenPerfil");
  if (solicitaCambioDeImagen) {
    if (
      actual.cambiosImagenPerfil >= 2 ||
      cambiosImagenPerfil !== actual.cambiosImagenPerfil + 1
    ) {
      throw new AppError(
        "Ya utilizaste los 2 cambios permitidos para la foto de perfil.",
        400,
      );
    }
  }

  if (!nombre || !correo || !codigo) {
    throw new AppError(
      "Faltan datos obligatorios: nombre, correo y código.",
      400,
    );
  }

  if (codigo !== actual.codigo && !validarCodigo(codigo, rol)) {
    throw new AppError(mensajeErrorCodigo(codigo, rol), 400);
  }

  const [correoDup] = await pool.query(
    "SELECT id FROM usuarios_equipo WHERE correo = ? AND activo = 1 AND id != ? LIMIT 1",
    [correo, id],
  );
  if (correoDup.length) {
    throw new AppError("El correo ya está asignado a otro usuario.", 409);
  }

  if (codigo !== actual.codigo) {
    const [codigoDup] = await pool.query(
      "SELECT id FROM usuarios_equipo WHERE codigo = ? AND activo = 1 AND id != ? LIMIT 1",
      [codigo, id],
    );
    if (codigoDup.length) {
      throw new AppError("El código ya está asignado a otro usuario.", 409);
    }
  }

  try {
    await pool.query(
      "UPDATE usuarios_equipo SET nombre = ?, correo = ?, codigo = ?, rol = ?, activo = ?, imagen_perfil = ?, cambios_imagen_perfil = ? WHERE id = ?",
      [
        nombre,
        correo,
        codigo,
        rol,
        activo ? 1 : 0,
        imagenPerfil || null,
        cambiosImagenPerfil,
        id,
      ],
    );
  } catch (error) {
    if (
      (error?.errno === 1265 || error?.code === "WARN_DATA_TRUNCATED") &&
      rol === "operador"
    ) {
      throw new AppError(
        "La base de datos todavía no tiene el rol operador. Ejecuta la migración add_operador_role.sql para actualizar el campo rol.",
        500,
      );
    }
    throw error;
  }

  return {
    ...actual,
    nombre,
    correo,
    codigo,
    rol,
    activo,
    imagenPerfil: imagenPerfil || null,
    cambiosImagenPerfil,
  };
};

const actualizarImagenPerfil = async (id, imagenPerfil) => {
  const [rows] = await pool.query(
    `SELECT ${CAMPOS_EQUIPO} FROM usuarios_equipo WHERE id = ?`,
    [id],
  );
  if (!rows.length) throw new AppError("No se encontró el usuario.", 404);

  const actual = mapRow(rows[0]);
  if (actual.cambiosImagenPerfil >= 2) {
    throw new AppError(
      "Ya utilizaste los 2 cambios permitidos para la foto de perfil.",
      400,
    );
  }

  await pool.query(
    "UPDATE usuarios_equipo SET imagen_perfil = ?, cambios_imagen_perfil = ? WHERE id = ?",
    [imagenPerfil, actual.cambiosImagenPerfil + 1, id],
  );
  return {
    ...actual,
    imagenPerfil,
    cambiosImagenPerfil: actual.cambiosImagenPerfil + 1,
  };
};

const obtenerImagenPerfil = async (id) => {
  const [rows] = await pool.query(
    `SELECT imagen_perfil FROM usuarios_equipo WHERE id = ?`,
    [id],
  );
  if (!rows.length) throw new AppError("No se encontró el usuario.", 404);
  return rows[0].imagen_perfil || null;
};

const eliminarUsuarioEquipo = async (id) => {
  const imagenPerfil = await obtenerImagenPerfil(id);
  const [result] = await pool.query(
    "DELETE FROM usuarios_equipo WHERE id = ?",
    [id],
  );

  if (result.affectedRows === 0) {
    throw new AppError("No se encontró el usuario.", 404);
  }

  return imagenPerfil;
};

// Funciones para recuperación de PIN
const obtenerUsuarioPorCorreo = async (correo) => {
  const correoNormalizado = normalizarTexto(correo).toLowerCase();
  if (!correoNormalizado) return null;

  const [rows] = await pool.query(
    `SELECT ${CAMPOS_EQUIPO} FROM usuarios_equipo WHERE correo = ? AND activo = 1 LIMIT 1`,
    [correoNormalizado],
  );

  return rows.length ? mapRow(rows[0]) : null;
};

const generarCodigoTemporal = () => {
  // Generar código de 6 dígitos
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const guardarCodigoRecuperacion = async (usuarioId, codigo) => {
  const expiracion = new Date(Date.now() + 60 * 1000); // 1 minuto de expiración

  await pool.query(
    "INSERT INTO codigos_recuperacion (id, usuario_id, codigo, expiracion) VALUES (?, ?, ?, ?) " +
    "ON DUPLICATE KEY UPDATE codigo = ?, expiracion = ?",
    [randomUUID(), usuarioId, codigo, expiracion, codigo, expiracion]
  );
};

const verificarCodigoRecuperacion = async (usuarioId, codigo) => {
  const [rows] = await pool.query(
    "SELECT * FROM codigos_recuperacion WHERE usuario_id = ? AND codigo = ? AND expiracion > NOW() LIMIT 1",
    [usuarioId, codigo]
  );

  if (!rows.length) {
    throw new AppError("Código inválido o expirado.", 400);
  }

  // Eliminar el código usado
  await pool.query(
    "DELETE FROM codigos_recuperacion WHERE usuario_id = ?",
    [usuarioId]
  );

  return true;
};

module.exports = {
  obtenerEquipo,
  autenticarUsuarioEquipo,
  autenticarUsuarioEquipoPorId,
  crearUsuarioEquipo,
  editarUsuarioEquipo,
  actualizarImagenPerfil,
  obtenerImagenPerfil,
  eliminarUsuarioEquipo,
  obtenerUsuarioPorCorreo,
  generarCodigoTemporal,
  guardarCodigoRecuperacion,
  verificarCodigoRecuperacion,
};
