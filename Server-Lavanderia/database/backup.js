const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

const getBackupDirectory = () =>
  process.env.BACKUP_DIR ||
  path.join(__dirname, "..", "respaldo lavanderia-salinas");

const escaparIdentificador = (identificador) =>
  `\`${identificador.replace(/`/g, "``")}\``;

async function obtenerTablas(pool) {
  const [filas] = await pool.query("SHOW TABLES");
  return filas
    .map((fila) => Object.values(fila)[0])
    .filter((tabla) => typeof tabla === "string");
}

function valorSql(valor) {
  if (valor === null || valor === undefined) return "NULL";
  if (Buffer.isBuffer(valor)) return `X'${valor.toString("hex")}'`;
  if (valor instanceof Date)
    return mysql.escape(valor.toISOString().slice(0, 19).replace("T", " "));
  return mysql.escape(valor);
}

async function crearRespaldo(pool, tablasSolicitadas) {
  const tablasDisponibles = await obtenerTablas(pool);
  const tablas = [...new Set(tablasSolicitadas)].filter((tabla) =>
    tablasDisponibles.includes(tabla),
  );
  if (tablas.length === 0)
    throw new Error("Selecciona al menos una tabla válida.");

  const bloques = [
    "-- Respaldo Lavanderia Salinas",
    `-- Fecha: ${new Date().toISOString()}`,
    "SET FOREIGN_KEY_CHECKS=0;",
    "",
  ];

  for (const tabla of tablas) {
    const identificador = escaparIdentificador(tabla);
    const [estructura] = await pool.query(`SHOW CREATE TABLE ${identificador}`);
    const [filas] = await pool.query(`SELECT * FROM ${identificador}`);
    const createTable =
      estructura[0]["Create Table"] || estructura[0]["Create View"];

    bloques.push(`-- Tabla ${tabla}`);
    bloques.push(`DROP TABLE IF EXISTS ${identificador};`);
    bloques.push(`${createTable};`);
    if (filas.length > 0) {
      const columnas = Object.keys(filas[0])
        .map(escaparIdentificador)
        .join(", ");
      const valores = filas
        .map((fila) => `(${Object.values(fila).map(valorSql).join(", ")})`)
        .join(",\n");
      bloques.push(
        `INSERT INTO ${identificador} (${columnas}) VALUES\n${valores};`,
      );
    }
    bloques.push("");
  }
  bloques.push("SET FOREIGN_KEY_CHECKS=1;", "");

  const fecha = new Date().toISOString().replace(/[:.]/g, "-");
  const directorio = getBackupDirectory();
  fs.mkdirSync(directorio, { recursive: true });
  const nombre = `respaldo-${fecha}.sql`;
  const ruta = path.join(directorio, nombre);
  fs.writeFileSync(ruta, bloques.join("\n"), "utf8");
  return { nombre, ruta, tablas, directorio };
}

module.exports = { obtenerTablas, crearRespaldo, getBackupDirectory };
