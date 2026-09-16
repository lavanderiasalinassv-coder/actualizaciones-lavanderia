const fs = require("fs");
const path = require("path");

const CONFIG_FIELDS = ["host", "port", "user", "password", "database"];
const DEFAULT_DATABASE_CONFIG = {
  host: process.env.DB_HOST || "",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "defaultdb",
};
const fallbackPath = path.join(__dirname, "database.json");

function getDatabaseConfigPath() {
  return process.env.DATABASE_CONFIG_PATH || fallbackPath;
}

function normalizarConfiguracion(configuracion) {
  return {
    host: String(configuracion.host || "").trim(),
    port: Number(configuracion.port) || 3306,
    user: String(configuracion.user || "").trim(),
    password: String(configuracion.password || ""),
    database: String(configuracion.database || "").trim(),
  };
}

function leerConfiguracionBaseDatos() {
  const ruta = getDatabaseConfigPath();
  if (!fs.existsSync(ruta)) {
    return normalizarConfiguracion({
      ...DEFAULT_DATABASE_CONFIG,
      host: process.env.DB_HOST || DEFAULT_DATABASE_CONFIG.host,
      port: process.env.DB_PORT || DEFAULT_DATABASE_CONFIG.port,
      user: process.env.DB_USER || DEFAULT_DATABASE_CONFIG.user,
      password: process.env.DB_PASSWORD || DEFAULT_DATABASE_CONFIG.password,
      database: process.env.DB_NAME || DEFAULT_DATABASE_CONFIG.database,
    });
  }

  return normalizarConfiguracion(JSON.parse(fs.readFileSync(ruta, "utf8")));
}

function validarConfiguracionBaseDatos(configuracion) {
  const segura = normalizarConfiguracion(configuracion);
  if (
    !segura.host ||
    !segura.user ||
    !segura.database ||
    !Number.isInteger(segura.port)
  ) {
    throw new Error("Completa host, puerto, usuario y base de datos.");
  }
  return segura;
}

function guardarConfiguracionBaseDatos(configuracion) {
  const ruta = getDatabaseConfigPath();
  const segura = validarConfiguracionBaseDatos(configuracion);
  fs.mkdirSync(path.dirname(ruta), { recursive: true });
  fs.writeFileSync(ruta, `${JSON.stringify(segura, null, 2)}\n`, "utf8");
  return segura;
}

module.exports = {
  CONFIG_FIELDS,
  DEFAULT_DATABASE_CONFIG,
  leerConfiguracionBaseDatos,
  validarConfiguracionBaseDatos,
  guardarConfiguracionBaseDatos,
};
