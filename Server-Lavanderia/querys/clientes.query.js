const { randomUUID } = require("crypto");
const { pool } = require("../database/MySQLConexion");
const { AppError } = require("../utils/errors");

const normalizarTexto = (valor) => {
  if (typeof valor !== "string") return "";
  return valor.trim();
};

const normalizarTelefono = (telefono) => {
  if (typeof telefono !== "string") return "";
  return telefono.replace(/\D/g, "");
};

const mapCliente = (row) => ({
  id: row.id,
  nombre: row.nombre,
  celular: row.celular,
  correo: row.correo || "",
  totalOrdenes: Number(row.total_ordenes),
  fechaRegistro: new Date(row.fecha_registro).toISOString(),
  ultimaOrden: row.ultima_orden ? new Date(row.ultima_orden).toISOString() : undefined,
});

const listarClientes = async () => {
  const [rows] = await pool.query(
    "SELECT * FROM clientes ORDER BY fecha_registro DESC"
  );
  return rows.map(mapCliente);
};

const obtenerClientePorId = async (id) => {
  const [rows] = await pool.query(
    "SELECT * FROM clientes WHERE id = ?",
    [id]
  );
  return rows.length ? mapCliente(rows[0]) : null;
};

const buscarClientePorTelefono = async (telefono) => {
  const normalizado = normalizarTelefono(telefono);
  if (!normalizado) return null;

  const [rows] = await pool.query(
    "SELECT * FROM clientes WHERE celular = ?",
    [normalizado]
  );
  return rows.length ? mapCliente(rows[0]) : null;
};

const crearCliente = async (datos) => {
  const nombre = normalizarTexto(datos.nombre);
  const celular = normalizarTelefono(datos.celular);
  const correo = normalizarTexto(datos.correo || "").toLowerCase();

  if (!nombre) {
    throw new AppError("El nombre es obligatorio.", 400);
  }
  if (!celular) {
    throw new AppError("El celular es obligatorio.", 400);
  }
  if (celular.length < 7) {
    throw new AppError("El celular debe tener al menos 7 dígitos.", 400);
  }

  // Verificar duplicado por celular
  const [existente] = await pool.query(
    "SELECT id FROM clientes WHERE celular = ?",
    [celular]
  );
  if (existente.length > 0) {
    throw new AppError("Ya existe un cliente con este celular.", 409);
  }

  const id = randomUUID();
  await pool.query(
    `INSERT INTO clientes (id, nombre, celular, correo, total_ordenes, fecha_registro)
     VALUES (?, ?, ?, ?, 0, NOW())`,
    [id, nombre, celular, correo]
  );

  return await obtenerClientePorId(id);
};

const actualizarCliente = async (id, cambios) => {
  const actual = await obtenerClientePorId(id);
  if (!actual) {
    throw new AppError("No se encontró el cliente.", 404);
  }

  const nombre = normalizarTexto(cambios.nombre ?? actual.nombre);
  const celular = normalizarTelefono(cambios.celular ?? actual.celular);
  const correo = normalizarTexto(cambios.correo ?? actual.correo).toLowerCase();

  if (!nombre) {
    throw new AppError("El nombre es obligatorio.", 400);
  }
  if (!celular) {
    throw new AppError("El celular es obligatorio.", 400);
  }
  if (celular.length < 7) {
    throw new AppError("El celular debe tener al menos 7 dígitos.", 400);
  }

  // Verificar duplicado por celular (excluyendo el cliente actual)
  const [duplicado] = await pool.query(
    "SELECT id FROM clientes WHERE celular = ? AND id != ?",
    [celular, id]
  );
  if (duplicado.length > 0) {
    throw new AppError("El celular ya está asignado a otro cliente.", 409);
  }

  await pool.query(
    `UPDATE clientes SET nombre = ?, celular = ?, correo = ? WHERE id = ?`,
    [nombre, celular, correo, id]
  );

  return await obtenerClientePorId(id);
};

const eliminarCliente = async (id) => {
  const [result] = await pool.query(
    "DELETE FROM clientes WHERE id = ?",
    [id]
  );

  if (result.affectedRows === 0) {
    throw new AppError("No se encontró el cliente.", 404);
  }
};

const registrarOrdenCliente = async (celular) => {
  const normalizado = normalizarTelefono(celular);
  if (!normalizado) return null;

  const [rows] = await pool.query(
    "SELECT * FROM clientes WHERE celular = ?",
    [normalizado]
  );
  if (!rows.length) return null;

  const cliente = rows[0];
  await pool.query(
    `UPDATE clientes SET total_ordenes = total_ordenes + 1, ultima_orden = NOW() WHERE id = ?`,
    [cliente.id]
  );

  return await obtenerClientePorId(cliente.id);
};

const buscarClientes = async (termino) => {
  const query = termino ? `%${termino.toLowerCase()}%` : "%";
  const [rows] = await pool.query(
    `SELECT * FROM clientes 
     WHERE LOWER(nombre) LIKE ? 
     OR celular LIKE ? 
     OR LOWER(correo) LIKE ?
     ORDER BY fecha_registro DESC`,
    [query, query, query]
  );
  return rows.map(mapCliente);
};

const obtenerEstadisticasClientes = async () => {
  const [rows] = await pool.query(
    `SELECT 
      COUNT(*) as total_clientes,
      SUM(CASE WHEN total_ordenes > 5 THEN 1 ELSE 0 END) as clientes_recurrentes,
      SUM(total_ordenes) as total_ordenes
     FROM clientes`
  );
  
  const stats = rows[0];
  return {
    totalClientes: Number(stats.total_clientes),
    clientesRecurrentes: Number(stats.clientes_recurrentes),
    clientesNuevos: Number(stats.total_clientes) - Number(stats.clientes_recurrentes),
    totalOrdenes: Number(stats.total_ordenes) || 0
  };
};

module.exports = {
  listarClientes,
  obtenerClientePorId,
  buscarClientePorTelefono,
  crearCliente,
  actualizarCliente,
  eliminarCliente,
  registrarOrdenCliente,
  buscarClientes,
  obtenerEstadisticasClientes
};