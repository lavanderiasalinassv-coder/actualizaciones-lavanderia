const { randomUUID } = require("crypto");
const { pool } = require("../database/MySQLConexion");
const { AppError } = require("../utils/errors");

const TIPOS_DESCUENTO_VALIDOS = ["porcentaje", "dinero"];
const TIPOS_CLIENTE_VALIDOS = ["todos", "registrados", "recurrentes"];
const DIAS_VALIDOS = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo",
];

const normalizarTexto = (valor) => {
  if (typeof valor !== "string") return "";
  return valor.trim();
};

const normalizarDiasEspecificos = (valor) => {
  let dias = valor;
  if (typeof valor === "string") {
    try {
      dias = JSON.parse(valor);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(dias)) return [];
  return dias.filter((dia) => DIAS_VALIDOS.includes(dia));
};

const mapRow = (row) => ({
  id: row.id,
  nombre: row.nombre,
  descripcion: row.descripcion ?? "",
  tipoDescuento: row.tipo_descuento,
  valor: Number(row.valor),
  tipoClienteAplica: row.tipo_cliente_aplica,
  minOrdenes: row.min_ordenes ?? undefined,
  vigente: !!row.vigente,
  fechaInicio:
    row.fecha_inicio instanceof Date
      ? row.fecha_inicio.toISOString().slice(0, 10)
      : String(row.fecha_inicio).slice(0, 10),
  fechaFin:
    row.fecha_fin instanceof Date
      ? row.fecha_fin.toISOString().slice(0, 10)
      : String(row.fecha_fin).slice(0, 10),
  diasEspecificos: normalizarDiasEspecificos(row.dias_especificos),
  createdAt: Number.isNaN(new Date(row.created_at).getTime())
    ? new Date(0).toISOString()
    : new Date(row.created_at).toISOString(),
});

const validarPromocion = (datos) => {
  const nombre = normalizarTexto(datos.nombre);
  if (!nombre) {
    throw new AppError("El nombre de la promoción es obligatorio.", 400);
  }

  if (!TIPOS_DESCUENTO_VALIDOS.includes(datos.tipoDescuento)) {
    throw new AppError("El tipo de descuento no es válido.", 400);
  }

  const valor = Number(datos.valor);
  if (Number.isNaN(valor) || valor < 0) {
    throw new AppError("El valor del descuento no es válido.", 400);
  }

  if (datos.tipoDescuento === "porcentaje" && valor > 100) {
    throw new AppError("El porcentaje no puede ser mayor a 100.", 400);
  }

  if (!TIPOS_CLIENTE_VALIDOS.includes(datos.tipoClienteAplica)) {
    throw new AppError("El tipo de cliente al que aplica no es válido.", 400);
  }

  if (!datos.fechaInicio || !datos.fechaFin) {
    throw new AppError("Debes indicar fecha de inicio y fecha de fin.", 400);
  }

  if (datos.fechaInicio > datos.fechaFin) {
    throw new AppError(
      "La fecha de inicio no puede ser posterior a la fecha de fin.",
      400,
    );
  }

  return {
    nombre,
    descripcion: normalizarTexto(datos.descripcion),
    tipoDescuento: datos.tipoDescuento,
    valor,
    tipoClienteAplica: datos.tipoClienteAplica,
    minOrdenes:
      datos.tipoClienteAplica === "recurrentes" && datos.minOrdenes != null
        ? Number(datos.minOrdenes)
        : null,
    vigente: datos.vigente !== false,
    fechaInicio: datos.fechaInicio,
    fechaFin: datos.fechaFin,
    diasEspecificos: normalizarDiasEspecificos(datos.diasEspecificos),
  };
};

const obtenerPromociones = async () => {
  const [rows] = await pool.query(
    "SELECT * FROM promociones ORDER BY created_at DESC",
  );
  return rows.map(mapRow);
};

const obtenerPromocionPorId = async (id) => {
  const [rows] = await pool.query("SELECT * FROM promociones WHERE id = ?", [
    id,
  ]);
  return rows.length ? mapRow(rows[0]) : null;
};

const obtenerPromocionesVigentes = async () => {
  const [rows] = await pool.query(
    "SELECT * FROM promociones WHERE vigente = 1 AND fecha_inicio <= CURDATE() AND fecha_fin >= CURDATE()",
  );
  return rows.map(mapRow);
};

const DIAS_MAP = {
  0: "domingo",
  1: "lunes",
  2: "martes",
  3: "miercoles",
  4: "jueves",
  5: "viernes",
  6: "sabado",
};

const obtenerPromocionesAplicables = async (
  esRegistrado,
  esRecurrente,
  totalOrdenes,
) => {
  const vigentes = await obtenerPromocionesVigentes();
  const diaActual = DIAS_MAP[new Date().getDay()];

  return vigentes.filter((p) => {
    if (
      p.diasEspecificos.length > 0 &&
      !p.diasEspecificos.includes(diaActual)
    ) {
      return false;
    }

    if (p.tipoClienteAplica === "todos") return true;
    if (p.tipoClienteAplica === "registrados" && esRegistrado) return true;
    if (
      p.tipoClienteAplica === "recurrentes" &&
      esRecurrente &&
      (!p.minOrdenes || totalOrdenes >= p.minOrdenes)
    ) {
      return true;
    }
    return false;
  });
};

const crearPromocion = async (datos) => {
  const validado = validarPromocion(datos);
  const id = randomUUID();

  await pool.query(
    `INSERT INTO promociones
      (id, nombre, descripcion, tipo_descuento, valor, tipo_cliente_aplica, min_ordenes, vigente, fecha_inicio, fecha_fin, dias_especificos)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      validado.nombre,
      validado.descripcion,
      validado.tipoDescuento,
      validado.valor,
      validado.tipoClienteAplica,
      validado.minOrdenes,
      validado.vigente ? 1 : 0,
      validado.fechaInicio,
      validado.fechaFin,
      JSON.stringify(validado.diasEspecificos),
    ],
  );

  return obtenerPromocionPorId(id);
};

const actualizarPromocion = async (id, cambios) => {
  const actual = await obtenerPromocionPorId(id);
  if (!actual) {
    throw new AppError("No se encontró la promoción.", 404);
  }

  const validado = validarPromocion({ ...actual, ...cambios });

  await pool.query(
    `UPDATE promociones SET
      nombre = ?, descripcion = ?, tipo_descuento = ?, valor = ?, tipo_cliente_aplica = ?,
      min_ordenes = ?, vigente = ?, fecha_inicio = ?, fecha_fin = ?, dias_especificos = ?
     WHERE id = ?`,
    [
      validado.nombre,
      validado.descripcion,
      validado.tipoDescuento,
      validado.valor,
      validado.tipoClienteAplica,
      validado.minOrdenes,
      validado.vigente ? 1 : 0,
      validado.fechaInicio,
      validado.fechaFin,
      JSON.stringify(validado.diasEspecificos),
      id,
    ],
  );

  return obtenerPromocionPorId(id);
};

const eliminarPromocion = async (id) => {
  const [result] = await pool.query("DELETE FROM promociones WHERE id = ?", [
    id,
  ]);

  if (result.affectedRows === 0) {
    throw new AppError("No se encontró la promoción.", 404);
  }
};

const calcularDescuentoPromocion = (promocion, subtotal) => {
  if (promocion.tipoDescuento === "porcentaje") {
    return (subtotal * promocion.valor) / 100;
  }
  return Math.min(promocion.valor, subtotal);
};

module.exports = {
  obtenerPromociones,
  obtenerPromocionPorId,
  obtenerPromocionesVigentes,
  obtenerPromocionesAplicables,
  crearPromocion,
  actualizarPromocion,
  eliminarPromocion,
  calcularDescuentoPromocion,
};
