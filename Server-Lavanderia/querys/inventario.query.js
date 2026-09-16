const { randomUUID } = require("crypto");
const { pool } = require("../database/MySQLConexion");
const { AppError } = require("../utils/errors");

const UNIDADES_VALIDAS = [
  "pieza",
  "litro",
  "mililitro",
  "kilogramo",
  "libra",
  "gramo",
  "paquete",
  "caja",
  "galon",
  "otro",
];

const normalizarTexto = (valor) => {
  if (typeof valor !== "string") return "";
  return valor.trim();
};

const normalizarUnidad = (valor) =>
  UNIDADES_VALIDAS.includes(valor) ? valor : "pieza";

const mapRow = (row) => ({
  id: row.id,
  nombre: row.nombre,
  categoria: row.categoria,
  unidadMedida: row.unidad_medida,
  cantidad: Number(row.cantidad),
  costo: Number(row.costo),
  descripcion: row.descripcion ?? "",
  imagenUrl: row.imagen_url,
  creadoEn: new Date(row.creado_en).toISOString(),
  actualizadoEn: new Date(row.actualizado_en).toISOString(),
});

/* ───────────────── CRUD básico ───────────────── */

const obtenerProductos = async () => {
  const [rows] = await pool.query(
    "SELECT * FROM inventario_productos ORDER BY creado_en DESC",
  );
  return rows.map(mapRow);
};

const obtenerProductoPorId = async (id) => {
  const [rows] = await pool.query(
    "SELECT * FROM inventario_productos WHERE id = ?",
    [id],
  );
  return rows.length ? mapRow(rows[0]) : null;
};

const validarDatosProducto = (datos, { parcial } = { parcial: false }) => {
  if (!parcial || datos.nombre !== undefined) {
    if (!normalizarTexto(datos.nombre)) {
      throw new AppError("El nombre del insumo es obligatorio.", 400);
    }
  }
  if (!parcial || datos.categoria !== undefined) {
    if (!normalizarTexto(datos.categoria)) {
      throw new AppError("La categoría es obligatoria.", 400);
    }
  }
  if (!parcial || datos.cantidad !== undefined) {
    if (typeof datos.cantidad !== "number" || datos.cantidad < 0) {
      throw new AppError(
        "La cantidad debe ser un número mayor o igual a 0.",
        400,
      );
    }
  }
  if (!parcial || datos.costo !== undefined) {
    if (typeof datos.costo !== "number" || datos.costo < 0) {
      throw new AppError("El costo debe ser un número mayor o igual a 0.", 400);
    }
  }
};

const crearProducto = async (datos) => {
  validarDatosProducto(datos);

  const id = randomUUID();
  await pool.query(
    `INSERT INTO inventario_productos
      (id, nombre, categoria, unidad_medida, cantidad, costo, descripcion, imagen_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      normalizarTexto(datos.nombre),
      normalizarTexto(datos.categoria),
      normalizarUnidad(datos.unidadMedida),
      datos.cantidad,
      datos.costo,
      datos.descripcion ?? "",
      datos.imagenUrl ?? null,
    ],
  );

  return obtenerProductoPorId(id);
};

const actualizarProducto = async (id, cambios) => {
  const actual = await obtenerProductoPorId(id);
  if (!actual) {
    throw new AppError("No se encontró el insumo.", 404);
  }

  validarDatosProducto(cambios, { parcial: true });

  const fusionado = { ...actual, ...cambios };

  await pool.query(
    `UPDATE inventario_productos SET
      nombre = ?, categoria = ?, unidad_medida = ?, cantidad = ?, costo = ?,
      descripcion = ?, imagen_url = ?
     WHERE id = ?`,
    [
      normalizarTexto(fusionado.nombre),
      normalizarTexto(fusionado.categoria),
      normalizarUnidad(fusionado.unidadMedida),
      fusionado.cantidad,
      fusionado.costo,
      fusionado.descripcion ?? "",
      fusionado.imagenUrl ?? null,
      id,
    ],
  );

  return obtenerProductoPorId(id);
};

const eliminarProducto = async (id) => {
  const [result] = await pool.query(
    "DELETE FROM inventario_productos WHERE id = ?",
    [id],
  );

  if (result.affectedRows === 0) {
    throw new AppError("No se encontró el insumo.", 404);
  }
};

/* ───────────────── Consumos (descuento / reversión en lote) ───────────────── */

const agruparConsumos = (consumos) => {
  const mapa = new Map();

  for (const consumo of consumos ?? []) {
    if (!consumo?.productoId) continue;
    const cantidad = Number(consumo.cantidad);
    if (!Number.isFinite(cantidad) || cantidad <= 0) continue;
    mapa.set(
      consumo.productoId,
      (mapa.get(consumo.productoId) ?? 0) + cantidad,
    );
  }

  return mapa;
};

const descontarInventario = async (consumos, opciones = {}) => {
  const mapaConsumos = agruparConsumos(consumos);
  if (mapaConsumos.size === 0) return [];

  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();

    for (const [productoId, cantidad] of mapaConsumos.entries()) {
      const [rows] = await conexion.query(
        "SELECT cantidad FROM inventario_productos WHERE id = ? FOR UPDATE",
        [productoId],
      );
      if (!rows.length) continue;

      const actual = Number(rows[0].cantidad);
      let nuevaCantidad = Number((actual - cantidad).toFixed(6));
      if (!opciones.permitirNegativo) {
        nuevaCantidad = Math.max(0, nuevaCantidad);
      }

      await conexion.query(
        "UPDATE inventario_productos SET cantidad = ? WHERE id = ?",
        [nuevaCantidad, productoId],
      );
    }

    await conexion.commit();
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }

  return Array.from(mapaConsumos.entries()).map(([productoId, cantidad]) => ({
    productoId,
    cantidad,
  }));
};

const revertirInventario = async (consumos) => {
  const mapaConsumos = agruparConsumos(consumos);
  if (mapaConsumos.size === 0) return [];

  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();

    for (const [productoId, cantidad] of mapaConsumos.entries()) {
      const [rows] = await conexion.query(
        "SELECT cantidad FROM inventario_productos WHERE id = ? FOR UPDATE",
        [productoId],
      );
      if (!rows.length) continue;

      const actual = Number(rows[0].cantidad);
      const nuevaCantidad = Number((actual + cantidad).toFixed(6));

      await conexion.query(
        "UPDATE inventario_productos SET cantidad = ? WHERE id = ?",
        [nuevaCantidad, productoId],
      );
    }

    await conexion.commit();
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }

  return Array.from(mapaConsumos.entries()).map(([productoId, cantidad]) => ({
    productoId,
    cantidad,
  }));
};

module.exports = {
  obtenerProductos,
  obtenerProductoPorId,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  descontarInventario,
  revertirInventario,
};
