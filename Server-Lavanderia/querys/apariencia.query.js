const { pool } = require("../database/MySQLConexion");

const RUTAS_ACCESO_PRINCIPAL_PREDETERMINADAS = [
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
];

const APARIENCIA_PREDETERMINADA = {
  appShellColor: "#e2ecef",
  appShellHeaderColor: "#072346",
  appShellImagen: "",
  principalAccesosOrden: RUTAS_ACCESO_PRINCIPAL_PREDETERMINADAS,
  principalPanelesInvertidos: false,
  loginColor: "#0a1f38",
  loginImagen: "",
  loginLayout: "classic",
  loginTheme: "nocturne",
  saliAssistantPosition: "right",
  orbColorUno: "#a9d8ee",
  orbColorDos: "#123a66",
  fontFamily: "system",
};

const mapearOrdenAccesos = (valor) => {
  let rutas = valor;
  if (typeof rutas === "string") {
    try {
      rutas = JSON.parse(rutas);
    } catch {
      rutas = [];
    }
  }

  const validas = Array.isArray(rutas)
    ? [...new Set(rutas.filter((ruta) =>
        RUTAS_ACCESO_PRINCIPAL_PREDETERMINADAS.includes(ruta),
      ))]
    : [];
  return [
    ...validas,
    ...RUTAS_ACCESO_PRINCIPAL_PREDETERMINADAS.filter((ruta) =>
      !validas.includes(ruta),
    ),
  ];
};

const mapearApariencia = (fila) => ({
  appShellColor: fila.app_shell_color,
  appShellHeaderColor: fila.app_shell_header_color,
  appShellImagen: fila.app_shell_imagen ?? "",
  principalAccesosOrden: mapearOrdenAccesos(fila.principal_access_order),
  principalPanelesInvertidos: Number(fila.principal_panels_swapped) === 1,
  loginColor: fila.login_color,
  loginImagen: fila.login_imagen ?? "",
  loginLayout: fila.login_layout ?? APARIENCIA_PREDETERMINADA.loginLayout,
  loginTheme: fila.login_theme ?? APARIENCIA_PREDETERMINADA.loginTheme,
  saliAssistantPosition: fila.sali_assistant_position ?? APARIENCIA_PREDETERMINADA.saliAssistantPosition,
  orbColorUno: fila.orb_color_uno,
  orbColorDos: fila.orb_color_dos,
  fontFamily: fila.font_family ?? APARIENCIA_PREDETERMINADA.fontFamily,
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
       principal_access_order, principal_panels_swapped,
       login_color, login_imagen, login_layout, login_theme, sali_assistant_position,
       orb_color_uno, orb_color_dos, font_family)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       app_shell_color = VALUES(app_shell_color),
       app_shell_header_color = VALUES(app_shell_header_color),
       app_shell_imagen = VALUES(app_shell_imagen),
       principal_access_order = VALUES(principal_access_order),
       principal_panels_swapped = VALUES(principal_panels_swapped),
       login_color = VALUES(login_color),
       login_imagen = VALUES(login_imagen),
       login_layout = VALUES(login_layout),
       login_theme = VALUES(login_theme),
       sali_assistant_position = VALUES(sali_assistant_position),
       orb_color_uno = VALUES(orb_color_uno),
       orb_color_dos = VALUES(orb_color_dos),
       font_family = VALUES(font_family)`,
    [
      apariencia.appShellColor,
      apariencia.appShellHeaderColor,
      apariencia.appShellImagen,
      JSON.stringify(apariencia.principalAccesosOrden),
      apariencia.principalPanelesInvertidos ? 1 : 0,
      apariencia.loginColor,
      apariencia.loginImagen,
      apariencia.loginLayout,
      apariencia.loginTheme,
      apariencia.saliAssistantPosition,
      apariencia.orbColorUno,
      apariencia.orbColorDos,
      apariencia.fontFamily,
    ],
  );

  return obtenerApariencia();
};

module.exports = {
  obtenerApariencia,
  guardarApariencia,
};
