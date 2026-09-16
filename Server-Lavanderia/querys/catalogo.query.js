const { randomUUID } = require("crypto");
const { pool } = require("../database/MySQLConexion");
const { AppError } = require("../utils/errors");

const TIPOS_VALIDOS = ["servicio", "articulo"];
const UNIDADES_VALIDAS = [
  "kilo",
  "libra",
  "pieza",
  "m2",
  "galon",
  "mililitro",
  "otro",
];
const CLASIFICACIONES_PRENDAS_VALIDAS = ["por_prenda", "extra"];

const PALETA_COLORES = [
  "#123a66",
  "#16a34a",
  "#7c3aed",
  "#e0b64a",
  "#0891b2",
  "#db2777",
  "#ea580c",
  "#4f46e5",
];

const CATEGORIAS_SEMILLA = [
  { id: "cat-lavado", nombre: "Lavado", color: "#123a66" },
  { id: "cat-plancha", nombre: "Planchado", color: "#16a34a" },
  { id: "cat-express", nombre: "Express", color: "#e0b64a" },
];

const ITEMS_SEMILLA = [
  {
    id: "item-express",
    tipo: "servicio",
    nombre: "Express",
    categoriaId: "cat-express",
    precio: 0.5,
    unidad: "libra",
    clasificacionPrendas: "extra",
    variantesActivas: false,
    variantesPrecio: [],
    etiquetas: [],
    insumos: [],
    descripcion: "Servicio express por libra",
    imagenUrl: null,
  },
  {
    id: "item-camisa",
    tipo: "servicio",
    nombre: "Camisa",
    categoriaId: "cat-lavado",
    precio: 2,
    unidad: "pieza",
    clasificacionPrendas: "por_prenda",
    variantesActivas: false,
    variantesPrecio: [],
    etiquetas: [],
    insumos: [],
    descripcion: "Lavado de camisa",
    imagenUrl: null,
  },
  {
    id: "item-pantalon",
    tipo: "servicio",
    nombre: "Pantalon",
    categoriaId: "cat-lavado",
    precio: 2,
    unidad: "libra",
    clasificacionPrendas: "por_prenda",
    variantesActivas: false,
    variantesPrecio: [],
    etiquetas: [],
    insumos: [],
    descripcion: "Lavado de pantalon",
    imagenUrl: null,
  },
];

/* ───────────────── Helpers ───────────────── */

const normalizarTexto = (valor) => {
  if (typeof valor !== "string") return "";
  return valor.trim();
};

const parsearJSON = (valor, porDefecto) => {
  if (valor == null) return porDefecto;
  if (typeof valor !== "string") return valor; // mysql2 ya lo puede devolver parseado
  try {
    return JSON.parse(valor);
  } catch {
    return porDefecto;
  }
};

const parsearListaJSON = (valor) => {
  const lista = parsearJSON(valor, []);
  return Array.isArray(lista) ? lista : [];
};

const mapRowCategoria = (row) => ({
  id: row.id,
  nombre: row.nombre,
  color: row.color,
});

const mapRowItem = (row) => ({
  id: row.id,
  tipo: row.tipo,
  nombre: row.nombre,
  categoriaId: row.categoria_id,
  precio: Number(row.precio),
  unidad: row.unidad,
  clasificacionPrendas: row.clasificacion_prendas ?? "por_prenda",
  variantesActivas: !!row.variantes_activas,
  variantesPrecio: parsearListaJSON(row.variantes_precio),
  etiquetas: parsearListaJSON(row.etiquetas),
  insumos: parsearListaJSON(row.insumos),
  descripcion: row.descripcion ?? "",
  imagenUrl: row.imagen_url,
});

/* ───────────────── Categorías ───────────────── */

const obtenerCategorias = async () => {
  const [rows] = await pool.query(
    "SELECT id, nombre, color FROM catalogo_categorias ORDER BY creado_en ASC",
  );
  return rows.map(mapRowCategoria);
};

const crearCategoria = async (nombre) => {
  const nombreLimpio = normalizarTexto(nombre);
  if (!nombreLimpio) {
    throw new AppError("El nombre de la categoría es obligatorio.", 400);
  }

  const [existente] = await pool.query(
    "SELECT id, nombre, color FROM catalogo_categorias WHERE LOWER(nombre) = LOWER(?) LIMIT 1",
    [nombreLimpio],
  );
  if (existente.length) {
    return mapRowCategoria(existente[0]);
  }

  const [conteo] = await pool.query(
    "SELECT COUNT(*) AS total FROM catalogo_categorias",
  );
  const color = PALETA_COLORES[conteo[0].total % PALETA_COLORES.length];

  const id = randomUUID();
  await pool.query(
    "INSERT INTO catalogo_categorias (id, nombre, color) VALUES (?, ?, ?)",
    [id, nombreLimpio, color],
  );

  return { id, nombre: nombreLimpio, color };
};

const actualizarCategoria = async (id, cambios) => {
  const nombreLimpio = normalizarTexto(cambios?.nombre);
  if (!nombreLimpio) {
    throw new AppError("El nombre de la categoría es obligatorio.", 400);
  }

  const [actual] = await pool.query(
    "SELECT id, nombre, color FROM catalogo_categorias WHERE id = ? LIMIT 1",
    [id],
  );
  if (!actual.length) {
    throw new AppError("No se encontró la categoría.", 404);
  }

  const [duplicada] = await pool.query(
    "SELECT id FROM catalogo_categorias WHERE LOWER(nombre) = LOWER(?) AND id <> ? LIMIT 1",
    [nombreLimpio, id],
  );
  if (duplicada.length) {
    throw new AppError("Ya existe una categoría con ese nombre.", 409);
  }

  const color =
    typeof cambios?.color === "string" && /^#[0-9a-f]{6}$/i.test(cambios.color)
      ? cambios.color.toLowerCase()
      : actual[0].color;
  await pool.query(
    "UPDATE catalogo_categorias SET nombre = ?, color = ? WHERE id = ?",
    [nombreLimpio, color, id],
  );
  return { ...mapRowCategoria(actual[0]), nombre: nombreLimpio, color };
};

const eliminarCategoria = async (id) => {
  // ON DELETE SET NULL en catalogo_items.categoria_id se encarga
  // de dejar "sin categoría" a los items que la tenían.
  const [result] = await pool.query(
    "DELETE FROM catalogo_categorias WHERE id = ?",
    [id],
  );

  if (result.affectedRows === 0) {
    throw new AppError("No se encontró la categoría.", 404);
  }
};

/* ───────────────── Items ───────────────── */

const obtenerItems = async (tipo) => {
  if (tipo && !TIPOS_VALIDOS.includes(tipo)) {
    throw new AppError("Tipo de catálogo inválido.", 400);
  }

  const sql = tipo
    ? "SELECT * FROM catalogo_items WHERE tipo = ? ORDER BY creado_en ASC"
    : "SELECT * FROM catalogo_items ORDER BY creado_en ASC";
  const params = tipo ? [tipo] : [];

  const [rows] = await pool.query(sql, params);
  return rows.map(mapRowItem);
};

const obtenerItemPorId = async (id) => {
  const [rows] = await pool.query("SELECT * FROM catalogo_items WHERE id = ?", [
    id,
  ]);
  return rows.length ? mapRowItem(rows[0]) : null;
};

const validarDatosItem = (datos, { parcial } = { parcial: false }) => {
  if (!parcial || datos.tipo !== undefined) {
    if (!TIPOS_VALIDOS.includes(datos.tipo)) {
      throw new AppError("El tipo debe ser 'servicio' o 'articulo'.", 400);
    }
  }
  if (!parcial || datos.nombre !== undefined) {
    if (!normalizarTexto(datos.nombre)) {
      throw new AppError("El nombre del item es obligatorio.", 400);
    }
  }
  if (!parcial || datos.unidad !== undefined) {
    if (!UNIDADES_VALIDAS.includes(datos.unidad)) {
      throw new AppError("Unidad inválida.", 400);
    }
  }
  if (!parcial || datos.precio !== undefined) {
    if (typeof datos.precio !== "number" || datos.precio < 0) {
      throw new AppError(
        "El precio debe ser un número mayor o igual a 0.",
        400,
      );
    }
  }
  if (
    datos.clasificacionPrendas !== undefined &&
    !CLASIFICACIONES_PRENDAS_VALIDAS.includes(datos.clasificacionPrendas)
  ) {
    throw new AppError("Clasificación de prendas inválida.", 400);
  }
};

const crearItem = async (datos) => {
  validarDatosItem(datos);

  const id = randomUUID();
  await pool.query(
    `INSERT INTO catalogo_items
      (id, tipo, nombre, categoria_id, precio, unidad, clasificacion_prendas, variantes_activas, variantes_precio, etiquetas, insumos, descripcion, imagen_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      datos.tipo,
      normalizarTexto(datos.nombre),
      datos.categoriaId ?? null,
      datos.precio,
      datos.unidad,
      datos.clasificacionPrendas ?? "por_prenda",
      datos.variantesActivas ? 1 : 0,
      JSON.stringify(datos.variantesPrecio ?? []),
      JSON.stringify(datos.etiquetas ?? []),
      JSON.stringify(datos.insumos ?? []),
      datos.descripcion ?? "",
      datos.imagenUrl ?? null,
    ],
  );

  return obtenerItemPorId(id);
};

const actualizarItem = async (id, cambios) => {
  const actual = await obtenerItemPorId(id);
  if (!actual) {
    throw new AppError("No se encontró el item.", 404);
  }

  validarDatosItem(cambios, { parcial: true });

  const fusionado = { ...actual, ...cambios };

  await pool.query(
    `UPDATE catalogo_items SET
      tipo = ?, nombre = ?, categoria_id = ?, precio = ?, unidad = ?, clasificacion_prendas = ?,
      variantes_activas = ?, variantes_precio = ?, etiquetas = ?, insumos = ?,
      descripcion = ?, imagen_url = ?
     WHERE id = ?`,
    [
      fusionado.tipo,
      normalizarTexto(fusionado.nombre),
      fusionado.categoriaId ?? null,
      fusionado.precio,
      fusionado.unidad,
      fusionado.clasificacionPrendas ?? "por_prenda",
      fusionado.variantesActivas ? 1 : 0,
      JSON.stringify(fusionado.variantesPrecio ?? []),
      JSON.stringify(fusionado.etiquetas ?? []),
      JSON.stringify(fusionado.insumos ?? []),
      fusionado.descripcion ?? "",
      fusionado.imagenUrl ?? null,
      id,
    ],
  );

  return obtenerItemPorId(id);
};

const eliminarItem = async (id) => {
  const [result] = await pool.query("DELETE FROM catalogo_items WHERE id = ?", [
    id,
  ]);

  if (result.affectedRows === 0) {
    throw new AppError("No se encontró el item.", 404);
  }
};

/* ───────────────── Restaurar catálogo base ───────────────── */

const restaurarCatalogoBase = async () => {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();

    await conexion.query("DELETE FROM catalogo_items");
    await conexion.query("DELETE FROM catalogo_categorias");

    for (const cat of CATEGORIAS_SEMILLA) {
      await conexion.query(
        "INSERT INTO catalogo_categorias (id, nombre, color) VALUES (?, ?, ?)",
        [cat.id, cat.nombre, cat.color],
      );
    }

    for (const item of ITEMS_SEMILLA) {
      await conexion.query(
        `INSERT INTO catalogo_items
          (id, tipo, nombre, categoria_id, precio, unidad, clasificacion_prendas, variantes_activas, variantes_precio, etiquetas, insumos, descripcion, imagen_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id,
          item.tipo,
          item.nombre,
          item.categoriaId,
          item.precio,
          item.unidad,
          item.clasificacionPrendas ?? "por_prenda",
          item.variantesActivas ? 1 : 0,
          JSON.stringify(item.variantesPrecio),
          JSON.stringify(item.etiquetas),
          JSON.stringify(item.insumos),
          item.descripcion,
          item.imagenUrl,
        ],
      );
    }

    await conexion.commit();
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }

  return { categorias: await obtenerCategorias(), items: await obtenerItems() };
};

module.exports = {
  obtenerCategorias,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
  obtenerItems,
  obtenerItemPorId,
  crearItem,
  actualizarItem,
  eliminarItem,
  restaurarCatalogoBase,
};
