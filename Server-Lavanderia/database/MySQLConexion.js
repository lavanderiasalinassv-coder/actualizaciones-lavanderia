const mysql = require("mysql2/promise");
const { leerConfiguracionBaseDatos } = require("./databaseConfig");

const configuracion = leerConfiguracionBaseDatos();

const pool = mysql.createPool({
  ...configuracion,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "Z",
  charset: "utf8mb4",
  collation: "utf8mb4_unicode_ci",
  multipleStatements: false,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  connectTimeout: 10000,
});

module.exports = { pool };
