const { pool } = require("../database/MySQLConexion");

const APARIENCIA_PREDETERMINADA = {
  appShellColor: "#eef4f8",
  appShellHeaderColor: "#081a30",
  appShellImagen: "",
  loginColor: "#0a1f38",
  loginImagen: "",
  orbColorUno: "#a9d8ee",
  orbColorDos: "#123a66",
};

const mapearApariencia = (fila) => ({
  appShellColor: fila.app_shell_color,
  appShellHeaderColor: fila.app_shell_header_color,
  appShellImagen: fila.app_shell_imagen ?? "",
  loginColor: fila.login_color,
  loginImagen: fila.login_imagen ?? "",
  orbColorUno: fila.orb_color_uno,
  orbColorDos: fila.orb_color_dos,
});

const obtenerApariencia = async () => {
  const [filas] = await pool.query(
    "SELECT * FROM apariencia_config WHERE id = 1 LIMIT 1",
  );

  if (!filas.length) return APARIENCIA_PREDETERMINADA;
  return mapearApariencia(filas[0]);
};

const guardarApariencia = async (cambios) => {
  const apariencia = { ...APARIENCIA_PREDETERMINADA, ...cambios };

  await pool.query(
    `INSERT INTO apariencia_config
      (id, app_shell_color, app_shell_header_color, app_shell_imagen,
       login_color, login_imagen, orb_color_uno, orb_color_dos)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       app_shell_color = VALUES(app_shell_color),
       app_shell_header_color = VALUES(app_shell_header_color),
       app_shell_imagen = VALUES(app_shell_imagen),
       login_color = VALUES(login_color),
       login_imagen = VALUES(login_imagen),
       orb_color_uno = VALUES(orb_color_uno),
       orb_color_dos = VALUES(orb_color_dos)`,
    [
      apariencia.appShellColor,
      apariencia.appShellHeaderColor,
      apariencia.appShellImagen,
      apariencia.loginColor,
      apariencia.loginImagen,
      apariencia.orbColorUno,
      apariencia.orbColorDos,
    ],
  );

  return obtenerApariencia();
};

module.exports = {
  obtenerApariencia,
  guardarApariencia,
};
