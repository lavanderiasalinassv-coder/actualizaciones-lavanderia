const { randomUUID } = require("crypto");
const { pool } = require("../database/MySQLConexion"); // ajusta la ruta si tu pool vive en otro lugar
const { AppError } = require("../utils/errors");
const { descontarInventario } = require("./inventario.query");
const { obtenerTurno } = require("./turno.query");

// ---------- helpers de mapeo / cálculo ----------

const toBool = (v) => !!v;
const toNumber = (v) => (v === null || v === undefined ? 0 : Number(v));
const toISO = (v) => {
  if (!v) return null;
  if (typeof v === "string") {
    if (/Z$|[+-]\d{2}:?\d{2}$/.test(v)) {
      const fecha = new Date(v);
      return Number.isNaN(fecha.getTime()) ? null : fecha.toISOString();
    }
    const coincide = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})/.exec(v);
    if (coincide) {
      return `${coincide[1]}T${coincide[2]}`;
    }
  }
  if (v instanceof Date) {
    const pad = (valor) => String(valor).padStart(2, "0");
    const fechaLocalMySQL = `${v.getUTCFullYear()}-${pad(v.getUTCMonth() + 1)}-${pad(v.getUTCDate())}T${pad(v.getUTCHours())}:${pad(v.getUTCMinutes())}:${pad(v.getUTCSeconds())}-06:00`;
    return new Date(fechaLocalMySQL).toISOString();
  }
  const fecha = new Date(v);
  return Number.isNaN(fecha.getTime()) ? null : fecha.toISOString();
};

const toDateStr = (v) => {
  if (!v) return null;
  if (typeof v === "string") return v.slice(0, 10);
  return new Date(v).toISOString().slice(0, 10);
};

// El cierre se guarda como un resumen JSON. Además de comprobar que exista la
// caja, necesitamos comprobar que el cobro o la entrega realmente aparezcan
// dentro de su reporte.
const obtenerReferenciasDeCierres = (cierresRows) => {
  const referencias = new Map();

  for (const cierre of cierresRows) {
    const turnoId = String(cierre?.turno_id || "");
    if (!turnoId) continue;

    let resumen = cierre?.resumen;
    if (typeof resumen === "string") {
      try {
        resumen = JSON.parse(resumen);
      } catch {
        resumen = {};
      }
    }

    const referencia = referencias.get(turnoId) || {
      ordenes: new Set(),
      ordenesNumeros: new Set(),
      anticipos: new Set(),
    };
    const ordenes = Array.isArray(resumen?.ordenes) ? resumen.ordenes : [];
    for (const orden of ordenes) {
      if (orden?.id) referencia.ordenes.add(String(orden.id));
      if (orden?.numero)
        referencia.ordenesNumeros.add(normalizarNumeroOrden(orden.numero));
      if (orden?.secuencia !== undefined && orden?.secuencia !== null) {
        referencia.ordenesNumeros.add(normalizarNumeroOrden(orden.secuencia));
      }
      const anticipos = Array.isArray(orden?.anticipos) ? orden.anticipos : [];
      for (const anticipo of anticipos) {
        if (anticipo?.id) referencia.anticipos.add(String(anticipo.id));
      }
    }
    referencias.set(turnoId, referencia);
  }

  return referencias;
};

const toTimeStr = (v) => {
  if (!v) return null;
  if (typeof v === "string") return v.slice(0, 5);
  return null;
};

const construirFechaConHora = (fecha, horaBase) => {
  if (!fecha || typeof fecha !== "string") return null;
  const coincide = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha.trim());
  if (!coincide) return null;

  const referencia = horaBase ? new Date(horaBase) : new Date();
  const base = Number.isNaN(referencia.getTime()) ? new Date() : referencia;
  const hh = String(base.getHours()).padStart(2, "0");
  const mm = String(base.getMinutes()).padStart(2, "0");
  const ss = String(base.getSeconds()).padStart(2, "0");
  return `${coincide[1]}-${coincide[2]}-${coincide[3]} ${hh}:${mm}:${ss}`;
};

const obtenerFechaDelTurno = async (conn, turnoId) => {
  if (!turnoId) return null;

  const [[cierre]] = await conn.query(
    "SELECT resumen, cerrado_at FROM cierres_caja WHERE turno_id = ? ORDER BY cerrado_at DESC LIMIT 1",
    [turnoId],
  );
  if (cierre) {
    let resumen = cierre.resumen;
    if (typeof resumen === "string") {
      try {
        resumen = JSON.parse(resumen);
      } catch {
        resumen = {};
      }
    }
    const fecha =
      resumen?.horaInicio || resumen?.cerradoAt || cierre.cerrado_at;
    if (fecha) return toDateStr(fecha);
  }

  const [[turno]] = await conn.query(
    "SELECT hora_inicio FROM turno_caja_actual WHERE turno_id = ? LIMIT 1",
    [turnoId],
  );
  return turno?.hora_inicio ? toDateStr(turno.hora_inicio) : null;
};

const formatearNumero = (secuencia) => `#${String(secuencia).padStart(5, "0")}`;

const normalizarNumeroOrden = (valor) => {
  const texto = String(valor ?? "").trim();
  const digitos = texto.replace(/\D/g, "");
  return digitos ? digitos.replace(/^0+(?=\d)/, "") : texto.toLowerCase();
};

const ordenEstaEnCierre = (referencia, orden) =>
  Boolean(
    referencia &&
    (referencia.ordenes.has(String(orden.id)) ||
      referencia.ordenesNumeros.has(normalizarNumeroOrden(orden.secuencia)) ||
      referencia.ordenesNumeros.has(
        normalizarNumeroOrden(formatearNumero(orden.secuencia)),
      )),
  );

const normalizarUsuario = (usuario) => {
  if (typeof usuario === "string") {
    return {
      id: null,
      nombre: usuario.trim() || "Sistema",
      rol: null,
    };
  }

  const id =
    typeof usuario?.id === "string" && usuario.id.trim()
      ? usuario.id.trim()
      : null;
  const nombre =
    typeof usuario?.nombre === "string" && usuario.nombre.trim()
      ? usuario.nombre.trim()
      : "Sistema";
  const rol =
    typeof usuario?.rol === "string" && usuario.rol.trim()
      ? usuario.rol.trim().toLowerCase()
      : null;

  return { id, nombre, rol };
};

const obtenerMovimientoLegado = (texto, usuarioNombre, usuarioId) => {
  const textoOriginal = typeof texto === "string" ? texto : "";
  const nombrePersistido =
    typeof usuarioNombre === "string" ? usuarioNombre.trim() : "";
  const coincide = textoOriginal.match(/^(.*)\s+por\s+(.+)$/);
  const esLegado =
    !usuarioId &&
    (!nombrePersistido || nombrePersistido === "Sistema") &&
    coincide;

  return {
    texto: esLegado ? coincide[1].trim() : textoOriginal,
    usuarioNombre: esLegado
      ? coincide[2].trim()
      : nombrePersistido || "Sistema",
  };
};

const construirTextoCambioCliente = ({
  nombreClienteAnterior = "",
  nombreClienteNuevo = "",
  correoAnterior = "",
  correoNuevo = "",
  telefonoAnterior = "",
  telefonoNuevo = "",
}) => {
  const cambios = [];

  const nombreAnterior = String(nombreClienteAnterior ?? "").trim();
  const nombreNuevo = String(nombreClienteNuevo ?? "").trim();
  if (nombreNuevo && nombreNuevo !== nombreAnterior) {
    cambios.push(`nombre "${nombreAnterior || "(vacío)"}" → "${nombreNuevo}"`);
  }

  const correoAnteriorLimpio = String(correoAnterior ?? "")
    .trim()
    .toLowerCase();
  const correoNuevoLimpio = String(correoNuevo ?? "")
    .trim()
    .toLowerCase();
  if (correoNuevoLimpio && correoNuevoLimpio !== correoAnteriorLimpio) {
    cambios.push(
      `correo "${correoAnteriorLimpio || "(vacío)"}" → "${correoNuevoLimpio}"`,
    );
  }
  const telefonoAnteriorLimpio = String(telefonoAnterior ?? "").replace(/\D/g);
  const telefonoNuevoLimpio = String(telefonoNuevo ?? "").replace(/\D/g, "");
  if (telefonoNuevoLimpio && telefonoNuevoLimpio !== telefonoAnteriorLimpio) {
    cambios.push(
      `número "${telefonoAnteriorLimpio || "(vacío)"}" → "${telefonoNuevoLimpio}"`,
    );
  }

  if (cambios.length === 0) {
    return "Datos del cliente actualizados";
  }

  return `Datos del cliente actualizados: ${cambios.join("; ")}`;
};

const calcularSubtotal = (items) =>
  items.reduce(
    (acc, item) => acc + Number(item.precio) * Number(item.cantidad),
    0,
  );

const calcularDescuentoTotal = (
  descuento,
  descuentoManual = 0,
  descuentoPromocion = 0,
) => {
  const montoTotal = Number(descuento || 0);
  if (montoTotal > 0) return Math.max(0, montoTotal);

  const combinado =
    Number(descuentoManual || 0) + Number(descuentoPromocion || 0);
  return Math.max(0, combinado);
};

const obtenerDescuentoAplicado = (orden) => {
  const descuentoDirecto = toNumber(orden.descuento);
  if (descuentoDirecto > 0) return descuentoDirecto;

  const combinado =
    toNumber(orden.descuento_manual) + toNumber(orden.descuento_promocion);
  return Math.max(0, combinado);
};

const convertirConsumoAUnidadStock = (cantidad, unidadConsumo, unidadStock) => {
  const unidad = unidadConsumo || unidadStock;
  if (unidad === unidadStock) return cantidad;

  const equivalenciasLiquidas = {
    mililitro: 1,
    litro: 1000,
    galon: 3785.411784,
  };
  if (equivalenciasLiquidas[unidad] && equivalenciasLiquidas[unidadStock]) {
    return (
      (cantidad * equivalenciasLiquidas[unidad]) /
      equivalenciasLiquidas[unidadStock]
    );
  }

  const equivalenciasSolidas = { gramo: 1, kilogramo: 1000, libra: 453.59237 };
  if (equivalenciasSolidas[unidad] && equivalenciasSolidas[unidadStock]) {
    return (
      (cantidad * equivalenciasSolidas[unidad]) /
      equivalenciasSolidas[unidadStock]
    );
  }

  return cantidad;
};

const revertirInventarioOrden = async (conn, ordenId) => {
  const [consumos] = await conn.query(
    `SELECT insumo.producto_id AS productoId,
            SUM(insumo.cantidad * item.cantidad) AS cantidad
       FROM orden_item_insumos insumo
       INNER JOIN orden_items item ON item.id = insumo.orden_item_id
      WHERE item.orden_id = ?
      GROUP BY insumo.producto_id`,
    [ordenId],
  );

  for (const consumo of consumos) {
    await conn.execute(
      "UPDATE inventario_productos SET cantidad = cantidad + ? WHERE id = ?",
      [toNumber(consumo.cantidad), consumo.productoId],
    );
  }
};

const descontarInventarioOrden = async (conn, ordenId) => {
  const [consumos] = await conn.query(
    `SELECT insumo.producto_id AS productoId,
            SUM(insumo.cantidad * item.cantidad) AS cantidad
       FROM orden_item_insumos insumo
       INNER JOIN orden_items item ON item.id = insumo.orden_item_id
      WHERE item.orden_id = ?
      GROUP BY insumo.producto_id`,
    [ordenId],
  );

  for (const consumo of consumos) {
    await conn.execute(
      "UPDATE inventario_productos SET cantidad = GREATEST(0, cantidad - ?) WHERE id = ?",
      [toNumber(consumo.cantidad), consumo.productoId],
    );
  }
};

const obtenerTurnoAbiertoId = async () => {
  const turno = await obtenerTurno();
  return turno.abierto ? turno.id : null;
};

const mapOrdenBase = (row) => ({
  id: row.id,
  numero: formatearNumero(row.secuencia),
  secuencia: row.secuencia,
  estado: row.estado,
  turnoId: row.turno_id,
  nombreCliente: row.nombre_cliente,
  codigoPais: row.codigo_pais,
  telefono: row.telefono,
  correo: row.correo,
  guardarDirectorio: toBool(row.guardar_directorio),
  envioDomicilio: toBool(row.envio_domicilio),
  direccionEntrega: row.direccion_entrega || "",
  fechaEntregaActiva: toBool(row.fecha_entrega_activa),
  fechaEntrega: toDateStr(row.fecha_entrega),
  horaEntrega: toTimeStr(row.hora_entrega),
  estadoPago: row.estado_pago,
  metodoPago: row.metodo_pago,
  montoRecibido: toNumber(row.monto_recibido),
  descuento: toNumber(row.descuento),
  descuentoManual: toNumber(row.descuento_manual),
  descuentoPromocion: toNumber(row.descuento_promocion),
  subtotal: toNumber(row.subtotal),
  total: toNumber(row.total),
  cambio: toNumber(row.cambio),
  cantidadPrendas: toNumber(row.cantidad_prendas),
  detallesPrendas: row.detalles_prendas || "",
  notaInterna: row.nota_interna || "",
  motivoCancelacion: row.motivo_cancelacion,
  tarjetaMonto: row.tarjeta_monto ? toNumber(row.tarjeta_monto) : null,
  tarjetaReferencia: row.tarjeta_referencia || null,
  transferenciaMonto: row.transferencia_monto
    ? toNumber(row.transferencia_monto)
    : null,
  transferenciaComprobante: row.transferencia_comprobante || null,
  entregadoAt: toISO(row.entregado_at),
  createdAt: toISO(row.created_at),
  updatedAt: toISO(row.updated_at),
});

// Ensambla una orden completa (items + insumos + fotos + cargos + anticipos + movimientos)
const obtenerOrdenCompleta = async (id, ejecutor = pool) => {
  const [[row]] = await ejecutor.query("SELECT * FROM ordenes WHERE id = ?", [
    id,
  ]);
  if (!row) return null;

  const [itemsRows] = await ejecutor.query(
    "SELECT * FROM orden_items WHERE orden_id = ?",
    [id],
  );

  const itemIds = itemsRows.map((r) => r.id);
  let insumosRows = [];
  if (itemIds.length) {
    const placeholders = itemIds.map(() => "?").join(",");
    [insumosRows] = await ejecutor.query(
      `SELECT * FROM orden_item_insumos WHERE orden_item_id IN (${placeholders})`,
      itemIds,
    );
  }

  const [fotosRows] = await ejecutor.query(
    "SELECT * FROM orden_fotos WHERE orden_id = ? ORDER BY posicion ASC",
    [id],
  );
  const [cargosRows] = await ejecutor.query(
    "SELECT * FROM orden_cargos_extra WHERE orden_id = ? ORDER BY fecha ASC",
    [id],
  );
  const [anticiposRows] = await ejecutor.query(
    "SELECT * FROM orden_anticipos WHERE orden_id = ? ORDER BY fecha ASC",
    [id],
  );
  const [movimientosRows] = await ejecutor.query(
    "SELECT * FROM orden_movimientos WHERE orden_id = ? ORDER BY fecha DESC",
    [id],
  );
  const [cierresRows] = await ejecutor.query(
    "SELECT turno_id, resumen FROM cierres_caja",
  );
  const [turnoAbiertoRows] = await ejecutor.query(
    "SELECT turno_id FROM turno_caja_actual WHERE id = 1 AND abierto = 1 AND turno_id <> ''",
  );

  // Una caja es válida si conserva su cierre o si sigue abierta. De ese modo,
  // solo se señalan referencias a cajas eliminadas, no al turno en curso.
  const turnosConCierre = new Set(cierresRows.map((row) => row.turno_id));
  for (const turno of turnoAbiertoRows) turnosConCierre.add(turno.turno_id);
  const referenciasCierres = obtenerReferenciasDeCierres(cierresRows);

  const items = itemsRows.map((item) => ({
    id: item.producto_id,
    nombre: item.nombre,
    precio: toNumber(item.precio),
    unidad: item.unidad,
    cantidad: toNumber(item.cantidad),
    nota: item.nota || "",
    insumos: insumosRows
      .filter((i) => i.orden_item_id === item.id)
      .map((i) => ({
        productoId: i.producto_id,
        cantidad: toNumber(i.cantidad),
      })),
  }));

  const esEntregaCerrada =
    row.estado === "entregado" ||
    row.estado === "cerrada" ||
    row.estado === "Cerrada-Cancelada";
  const turnoHuerfano =
    esEntregaCerrada &&
    Boolean(row.turno_id) &&
    (!turnosConCierre.has(row.turno_id) ||
      (!turnoAbiertoRows.some((turno) => turno.turno_id === row.turno_id) &&
        !ordenEstaEnCierre(referenciasCierres.get(row.turno_id), row)));

  return {
    ...mapOrdenBase(row),
    items,
    fotos: fotosRows.map((f) => f.url),
    cargosExtra: cargosRows.map((c) => ({
      id: c.id,
      descripcion: c.descripcion,
      monto: toNumber(c.monto),
      fecha: toISO(c.fecha),
    })),
    anticipos: anticiposRows.map((a) => ({
      id: a.id,
      monto: toNumber(a.monto),
      fecha: toISO(a.fecha),
      turnoId: a.turno_id,
      cierreHuerfano:
        Boolean(a.turno_id) &&
        (!turnosConCierre.has(a.turno_id) ||
          (!turnoAbiertoRows.some((turno) => turno.turno_id === a.turno_id) &&
            !referenciasCierres.get(a.turno_id)?.anticipos.has(a.id))),
    })),
    turnoHuerfano,
    movimientos: movimientosRows.map((m) => {
      const movimiento = obtenerMovimientoLegado(
        m.texto,
        m.usuario_nombre,
        m.usuario_id,
      );
      return {
        id: m.id,
        texto: movimiento.texto,
        fecha: toISO(m.fecha),
        usuarioId: m.usuario_id || null,
        usuarioNombre: movimiento.usuarioNombre,
      };
    }),
  };
};

const registrarMovimientoConn = async (
  conn,
  ordenId,
  texto,
  usuario = "Sistema",
) => {
  const usuarioNormalizado = normalizarUsuario(usuario);
  const textoLimpio = typeof texto === "string" ? texto.trim() : "";
  if (!textoLimpio) return;

  // El acceso de desarrollador es un acceso especial de prueba; no debe dejar
  // auditoría de movimientos en las órdenes.
  if (
    usuarioNormalizado.id === "dev-mode" ||
    usuarioNormalizado.nombre === "Desarrollador"
  ) {
    await conn.execute("UPDATE ordenes SET updated_at = NOW() WHERE id = ?", [
      ordenId,
    ]);
    return;
  }

  await conn.execute(
    "INSERT INTO orden_movimientos (id, orden_id, texto, usuario_id, usuario_nombre, fecha) VALUES (?,?,?,?,?,NOW())",
    [
      randomUUID(),
      ordenId,
      textoLimpio,
      usuarioNormalizado.id,
      usuarioNormalizado.nombre,
    ],
  );
  await conn.execute("UPDATE ordenes SET updated_at = NOW() WHERE id = ?", [
    ordenId,
  ]);
};

const actualizarCierreConAnticipo = async (
  conn,
  turnoId,
  orden,
  anticipoId,
  monto,
  fecha,
  concepto,
  estadoPago,
) => {
  const [[cierre]] = await conn.query(
    "SELECT id, numero_caja, resumen FROM cierres_caja WHERE turno_id = ? ORDER BY cerrado_at DESC LIMIT 1 FOR UPDATE",
    [turnoId],
  );
  if (!cierre) return null;

  let resumen = cierre.resumen;
  if (typeof resumen === "string") {
    try {
      resumen = JSON.parse(resumen);
    } catch {
      resumen = {};
    }
  }
  resumen = resumen && typeof resumen === "object" ? resumen : {};
  resumen.totales = resumen.totales || {};
  resumen.ordenes = Array.isArray(resumen.ordenes) ? resumen.ordenes : [];
  resumen.movimientos = Array.isArray(resumen.movimientos)
    ? resumen.movimientos
    : [];

  const montoAnticipo = Number(monto.toFixed(2));
  const fechaBase = fecha || resumen.horaInicio || resumen.cerradoAt;
  const fechaHistorica =
    fechaBase && !Number.isNaN(new Date(fechaBase).getTime())
      ? new Date(fechaBase)
      : new Date();
  const ordenResumen = resumen.ordenes.find((item) => item?.id === orden.id);
  const anticipoResumen = {
    id: anticipoId,
    monto: montoAnticipo,
    fecha: toISO(fechaBase),
    turnoId,
  };
  if (ordenResumen) {
    ordenResumen.montoRecibido = Number(orden.monto_recibido);
    ordenResumen.estado = orden.estado;
    ordenResumen.estadoPago = estadoPago || "anticipo";
    ordenResumen.total = toNumber(orden.total);
    ordenResumen.cobradoEnTurno = Number(
      (Number(ordenResumen.cobradoEnTurno || 0) + montoAnticipo).toFixed(2),
    );
    ordenResumen.updatedAt = new Date().toISOString();
    ordenResumen.anticipos = Array.isArray(ordenResumen.anticipos)
      ? ordenResumen.anticipos
      : [];
    if (anticipoId) ordenResumen.anticipos.push(anticipoResumen);
  } else {
    resumen.ordenes.push({
      id: orden.id,
      numero: formatearNumero(orden.secuencia),
      nombreCliente: orden.nombre_cliente,
      total: toNumber(orden.total),
      montoRecibido: toNumber(orden.monto_recibido),
      cobradoEnTurno: montoAnticipo,
      esReferencia: true,
      estado: orden.estado,
      estadoPago: estadoPago || orden.estado_pago,
      createdAt: toISO(orden.created_at),
      updatedAt: new Date().toISOString(),
      anticipos: anticipoId ? [anticipoResumen] : [],
    });
  }

  resumen.movimientos.push({
    id: anticipoId || randomUUID(),
    tipo: "cierre",
    monto: montoAnticipo,
    concepto:
      concepto || `Anticipo de la orden ${formatearNumero(orden.secuencia)}`,
    creadoAt: toISO(fechaBase),
    turnoId,
    numeroCaja: cierre.numero_caja,
    usuario: "Sistema",
  });

  const totales = resumen.totales;
  totales.cobrado = Number(
    (toNumber(totales.cobrado) + montoAnticipo).toFixed(2),
  );
  totales.ventas = totales.cobrado;
  totales.recaudado = Number(
    (
      totales.cobrado -
      toNumber(totales.cancelaciones) -
      toNumber(totales.gastos)
    ).toFixed(2),
  );
  totales.gananciaNeta = totales.recaudado;
  totales.saldoEsperado = Number(
    (
      toNumber(resumen.apertura) +
      totales.recaudado -
      toNumber(totales.depositos)
    ).toFixed(2),
  );
  totales.diferencia = Number(
    (toNumber(resumen.saldoCierre) - totales.saldoEsperado).toFixed(2),
  );

  await conn.execute("UPDATE cierres_caja SET resumen = ? WHERE id = ?", [
    JSON.stringify(resumen),
    cierre.id,
  ]);
  return cierre.numero_caja;
};

const formatearReferenciaCaja = (_turnoId, numeroCaja) =>
  numeroCaja == null ? "Caja #—" : `Caja #${numeroCaja}`;

const actualizarCierreAlEliminarAnticipo = async (
  conn,
  anticipo,
  orden,
  usuario,
) => {
  if (!anticipo?.turno_id) return;

  const [[cierre]] = await conn.query(
    "SELECT id, numero_caja, resumen FROM cierres_caja WHERE turno_id = ? ORDER BY cerrado_at DESC LIMIT 1 FOR UPDATE",
    [anticipo.turno_id],
  );
  if (!cierre) return;

  let resumen = cierre.resumen;
  if (typeof resumen === "string") {
    try {
      resumen = JSON.parse(resumen);
    } catch {
      resumen = {};
    }
  }
  resumen = resumen && typeof resumen === "object" ? resumen : {};
  resumen.ordenes = Array.isArray(resumen.ordenes) ? resumen.ordenes : [];
  resumen.totales = resumen.totales || {};
  resumen.movimientos = Array.isArray(resumen.movimientos)
    ? resumen.movimientos
    : [];

  const ordenResumen = resumen.ordenes.find((item) => item?.id === orden.id);
  const anticipoResumen = ordenResumen?.anticipos?.find(
    (item) => item?.id === anticipo.id,
  );
  if (!ordenResumen || !anticipoResumen) return;

  const montoRemovido = Number(
    toNumber(anticipoResumen.monto ?? anticipo.monto).toFixed(2),
  );
  ordenResumen.anticipos = ordenResumen.anticipos.filter(
    (item) => item?.id !== anticipo.id,
  );
  ordenResumen.cobradoEnTurno = Number(
    Math.max(0, toNumber(ordenResumen.cobradoEnTurno) - montoRemovido).toFixed(
      2,
    ),
  );
  ordenResumen.updatedAt = new Date().toISOString();

  const cobrado = Number(
    Math.max(0, toNumber(resumen.totales.cobrado) - montoRemovido).toFixed(2),
  );
  const recaudado = Number(
    (
      cobrado -
      toNumber(resumen.totales.cancelaciones) -
      toNumber(resumen.totales.gastos)
    ).toFixed(2),
  );
  const saldoEsperado = Number(
    (
      toNumber(resumen.apertura) +
      recaudado -
      toNumber(resumen.totales.depositos)
    ).toFixed(2),
  );
  resumen.totales.cobrado = cobrado;
  resumen.totales.ventas = cobrado;
  resumen.totales.recaudado = recaudado;
  resumen.totales.gananciaNeta = recaudado;
  resumen.totales.saldoEsperado = saldoEsperado;
  resumen.totales.diferencia = Number(
    (toNumber(resumen.saldoCierre) - saldoEsperado).toFixed(2),
  );
  resumen.movimientos = resumen.movimientos.filter(
    (movimiento) => movimiento?.id !== anticipo.id,
  );

  const usuarioNormalizado = normalizarUsuario(usuario);
  const concepto = `Se eliminó el anticipo de $${montoRemovido.toFixed(2)} de la orden ${formatearNumero(orden.secuencia)} del cierre`;
  const movimientoId = randomUUID();
  resumen.movimientos.push({
    id: movimientoId,
    tipo: "cierre",
    monto: 0,
    concepto,
    creadoAt: new Date().toISOString(),
    turnoId: anticipo.turno_id,
    numeroCaja: cierre.numero_caja,
    usuario: usuarioNormalizado.nombre,
  });

  await conn.execute("UPDATE cierres_caja SET resumen = ? WHERE id = ?", [
    JSON.stringify(resumen),
    cierre.id,
  ]);
  await conn.execute(
    `INSERT INTO movimientos_caja (id, tipo, monto, concepto, turno_id, numero_caja, usuario, creado_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      movimientoId,
      "cierre",
      0,
      concepto,
      anticipo.turno_id,
      cierre.numero_caja,
      usuarioNormalizado.nombre,
    ],
  );
};

const recalcularTotales = (subtotal, orden, totalCargos) => {
  const descuentoAplicado = Math.min(
    Math.max(0, obtenerDescuentoAplicado(orden)),
    subtotal,
  );
  const baseConDescuento = Math.max(0, subtotal - descuentoAplicado);
  const total = Number((baseConDescuento + totalCargos).toFixed(2));
  const cambio = Math.max(
    0,
    Number((toNumber(orden.monto_recibido) - total).toFixed(2)),
  );
  return { total, cambio };
};

// ---------- API pública ----------

const obtenerOrdenes = async () => {
  const [ordenRows] = await pool.query(
    "SELECT * FROM ordenes ORDER BY secuencia DESC",
  );
  if (!ordenRows.length) return [];

  const [
    itemsRows,
    fotosRows,
    cargosRows,
    anticiposRows,
    movimientosRows,
    insumosRows,
    cierresRows,
    turnoAbiertoRows,
  ] = await Promise.all([
    pool.query("SELECT * FROM orden_items"),
    pool.query("SELECT * FROM orden_fotos ORDER BY posicion ASC"),
    pool.query("SELECT * FROM orden_cargos_extra ORDER BY fecha ASC"),
    pool.query("SELECT * FROM orden_anticipos ORDER BY fecha ASC"),
    pool.query("SELECT * FROM orden_movimientos ORDER BY fecha DESC"),
    pool.query("SELECT * FROM orden_item_insumos"),
    pool.query("SELECT turno_id, resumen FROM cierres_caja"),
    pool.query(
      "SELECT turno_id FROM turno_caja_actual WHERE id = 1 AND abierto = 1 AND turno_id <> ''",
    ),
  ]).then((resultados) => resultados.map(([filas]) => filas));

  // Incluye el turno abierto: todavía no tiene cierre, pero su ID es válido.
  const turnosConCierre = new Set(cierresRows.map((row) => row.turno_id));
  for (const turno of turnoAbiertoRows) turnosConCierre.add(turno.turno_id);
  const referenciasCierres = obtenerReferenciasDeCierres(cierresRows);
  const turnosAbiertos = new Set(
    turnoAbiertoRows.map((turno) => turno.turno_id),
  );

  const porOrden = (filas, campo = "orden_id") => {
    const grupos = new Map();
    for (const fila of filas) {
      const clave = fila[campo];
      if (!grupos.has(clave)) grupos.set(clave, []);
      grupos.get(clave).push(fila);
    }
    return grupos;
  };
  const itemsPorOrden = porOrden(itemsRows);
  const fotosPorOrden = porOrden(fotosRows);
  const cargosPorOrden = porOrden(cargosRows);
  const anticiposPorOrden = porOrden(anticiposRows);
  const movimientosPorOrden = porOrden(movimientosRows);
  const insumosPorItem = porOrden(insumosRows, "orden_item_id");

  return ordenRows.map((row) => {
    const items = (itemsPorOrden.get(row.id) || []).map((item) => ({
      id: item.producto_id,
      nombre: item.nombre,
      precio: toNumber(item.precio),
      unidad: item.unidad,
      cantidad: toNumber(item.cantidad),
      nota: item.nota || "",
      insumos: (insumosPorItem.get(item.id) || []).map((insumo) => ({
        productoId: insumo.producto_id,
        cantidad: toNumber(insumo.cantidad),
      })),
    }));
    const esEntregaCerrada =
      row.estado === "entregado" ||
      row.estado === "cerrada" ||
      row.estado === "Cerrada-Cancelada";
    const turnoHuerfano =
      esEntregaCerrada &&
      Boolean(row.turno_id) &&
      (!turnosConCierre.has(row.turno_id) ||
        (!turnosAbiertos.has(row.turno_id) &&
          !ordenEstaEnCierre(referenciasCierres.get(row.turno_id), row)));
    return {
      ...mapOrdenBase(row),
      items,
      fotos: (fotosPorOrden.get(row.id) || []).map((foto) => foto.url),
      cargosExtra: (cargosPorOrden.get(row.id) || []).map((cargo) => ({
        id: cargo.id,
        descripcion: cargo.descripcion,
        monto: toNumber(cargo.monto),
        fecha: toISO(cargo.fecha),
      })),
      anticipos: (anticiposPorOrden.get(row.id) || []).map((anticipo) => ({
        id: anticipo.id,
        monto: toNumber(anticipo.monto),
        fecha: toISO(anticipo.fecha),
        turnoId: anticipo.turno_id,
        cierreHuerfano:
          Boolean(anticipo.turno_id) &&
          (!turnosConCierre.has(anticipo.turno_id) ||
            (!turnosAbiertos.has(anticipo.turno_id) &&
              !referenciasCierres
                .get(anticipo.turno_id)
                ?.anticipos.has(anticipo.id))),
      })),
      turnoHuerfano,
      movimientos: (movimientosPorOrden.get(row.id) || []).map(
        (movimientoRow) => {
          const movimiento = obtenerMovimientoLegado(
            movimientoRow.texto,
            movimientoRow.usuario_nombre,
            movimientoRow.usuario_id,
          );
          return {
            id: movimientoRow.id,
            texto: movimiento.texto,
            fecha: toISO(movimientoRow.fecha),
            usuarioId: movimientoRow.usuario_id || null,
            usuarioNombre: movimiento.usuarioNombre,
          };
        },
      ),
    };
  });
};

const obtenerOrdenPorId = async (id) => {
  const orden = await obtenerOrdenCompleta(id);
  if (!orden) throw new AppError("Orden no encontrada.", 404);
  return orden;
};

const crearOrden = async (datos, usuario = "Sistema") => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const id = randomUUID();
    const subtotal = calcularSubtotal(datos.items || []);
    const descuentoTotal = calcularDescuentoTotal(
      datos.descuento,
      datos.descuentoManual,
      datos.descuentoPromocion,
    );
    const total = Math.max(
      0,
      Number((subtotal - Math.min(descuentoTotal, subtotal)).toFixed(2)),
    );
    const metodoPago = datos.metodoPago || "efectivo";
    const montoSolicitado = Math.max(
      0,
      toNumber(
        metodoPago === "tarjeta"
          ? datos.tarjetaMonto
          : metodoPago === "transferencia"
            ? datos.transferenciaMonto
            : datos.montoRecibido,
      ),
    );
    const montoRecibido = Math.min(montoSolicitado, total);
    const cambio = Math.max(
      0,
      Number((montoSolicitado - montoRecibido).toFixed(2)),
    );
    const estadoPago =
      montoRecibido >= total && total > 0
        ? "pagado"
        : montoRecibido > 0
          ? "anticipo"
          : "porCobrar";
    const puedeUsarTurnoSolicitado = ["administrador", "admin"].includes(
      String(usuario?.rol || "").toLowerCase(),
    );
    let turnoId = await obtenerTurnoAbiertoId();
    if (montoRecibido > 0) {
      if (puedeUsarTurnoSolicitado && datos.turnoId) {
        const [cierres] = await conn.execute(
          "SELECT id FROM cierres_caja WHERE turno_id = ? LIMIT 1",
          [datos.turnoId],
        );
        const turnoActualId = await obtenerTurnoAbiertoId();
        if (datos.turnoId !== turnoActualId && cierres.length === 0) {
          throw new AppError(
            "La caja seleccionada no existe o no está cerrada.",
            400,
          );
        }
        turnoId = datos.turnoId;
      } else if (!turnoId) {
        turnoId = await obtenerTurnoAbiertoId();
      }
    }
    if (montoRecibido > 0 && !turnoId) {
      throw new AppError(
        "No hay un turno de caja abierto. Abre un turno para registrar cobros.",
        409,
      );
    }

    await conn.execute(
      `INSERT INTO ordenes (
        id, estado, turno_id, nombre_cliente, codigo_pais, telefono, correo,
        guardar_directorio, envio_domicilio, direccion_entrega, fecha_entrega_activa, fecha_entrega, hora_entrega,
        estado_pago, metodo_pago, monto_recibido, descuento, descuento_manual, descuento_promocion,
        subtotal, total, cambio, cantidad_prendas, detalles_prendas, nota_interna, motivo_cancelacion,
        tarjeta_monto, tarjeta_referencia, transferencia_monto, transferencia_comprobante
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, // El UUID generado arriba
        "pendiente",
        turnoId || "",
        (datos.nombreCliente || "").trim(),
        datos.codigoPais || "+503",
        (datos.telefono || "").trim(),
        (datos.correo || "").trim(),
        datos.guardarDirectorio ? 1 : 0,
        datos.envioDomicilio ? 1 : 0,
        datos.envioDomicilio ? (datos.direccionEntrega || "").trim() : null,
        datos.fechaEntregaActiva ? 1 : 0,
        datos.fechaEntregaActiva && datos.fechaEntrega
          ? datos.fechaEntrega
          : null,
        datos.fechaEntregaActiva && datos.horaEntrega
          ? datos.horaEntrega
          : null,
        estadoPago,
        metodoPago,
        montoRecibido,
        descuentoTotal,
        Number(datos.descuentoManual || 0),
        Number(datos.descuentoPromocion || 0),
        subtotal,
        total,
        cambio,
        Number(datos.cantidadPrendas || 0),
        (datos.detallesPrendas || "").trim(),
        "",
        null,
        datos.tarjetaMonto ? Number(datos.tarjetaMonto) : null,
        datos.tarjetaReferencia || null,
        datos.transferenciaMonto ? Number(datos.transferenciaMonto) : null,
        datos.transferenciaComprobante || null,
      ],
    );

    const anticipoId = montoRecibido > 0 ? randomUUID() : null;
    let fechaAnticipo = new Date();
    if (montoRecibido > 0 && turnoId && datos.turnoId) {
      const [[cierreFecha]] = await conn.query(
        "SELECT resumen FROM cierres_caja WHERE turno_id = ? ORDER BY cerrado_at DESC LIMIT 1",
        [turnoId],
      );
      if (cierreFecha?.resumen) {
        let resumenFecha = cierreFecha.resumen;
        if (typeof resumenFecha === "string") {
          try {
            resumenFecha = JSON.parse(resumenFecha);
          } catch {
            resumenFecha = {};
          }
        }
        const fechaBase = resumenFecha?.horaInicio || resumenFecha?.cerradoAt;
        if (fechaBase && !Number.isNaN(new Date(fechaBase).getTime())) {
          fechaAnticipo = new Date(fechaBase);
        }
      }
    }
    if (montoRecibido > 0) {
      await conn.execute(
        "INSERT INTO orden_anticipos (id, orden_id, turno_id, monto, fecha) VALUES (?,?,?,?,?)",
        [anticipoId, id, turnoId, montoRecibido, fechaAnticipo],
      );
    }

    // Recolectar todos los insumos para descontar del inventario
    const consumosInventario = [];
    for (const item of datos.items || []) {
      const itemId = randomUUID();
      await conn.execute(
        `INSERT INTO orden_items (id, orden_id, producto_id, nombre, precio, unidad, cantidad, nota)
         VALUES (?,?,?,?,?,?,?,?)`,
        [
          itemId,
          id,
          item.id,
          item.nombre,
          Number(item.precio),
          item.unidad,
          Number(item.cantidad),
          item.nota || "",
        ],
      );

      if (Array.isArray(item.insumos)) {
        for (const insumo of item.insumos) {
          const [[producto]] = await conn.query(
            "SELECT unidad_medida FROM inventario_productos WHERE id = ?",
            [insumo.productoId],
          );
          const cantidadPorServicio = convertirConsumoAUnidadStock(
            Number(insumo.cantidad),
            insumo.unidadConsumo,
            producto?.unidad_medida || "pieza",
          );
          await conn.execute(
            `INSERT INTO orden_item_insumos (id, orden_item_id, producto_id, cantidad)
             VALUES (?,?,?,?)`,
            [randomUUID(), itemId, insumo.productoId, cantidadPorServicio],
          );
          // Agregar al listado de consumos, multiplicando por la cantidad del item
          consumosInventario.push({
            productoId: insumo.productoId,
            cantidad: cantidadPorServicio * Number(item.cantidad),
          });
        }
      }
    }

    const fotos = datos.fotos ?? [];
    for (let i = 0; i < fotos.length; i++) {
      await conn.execute(
        "INSERT INTO orden_fotos (id, orden_id, posicion, url) VALUES (?,?,?,?)",
        [randomUUID(), id, i, fotos[i]],
      );
    }

    await registrarMovimientoConn(
      conn,
      id,
      `Creada por ${(datos.nombreCliente || "").trim()}`,
      usuario,
    );

    const detallesPrendas = (datos.detallesPrendas || "").trim();
    if (detallesPrendas) {
      await registrarMovimientoConn(
        conn,
        id,
        `Nota sobre las prendas: ${detallesPrendas}`,
        usuario,
      );
    }

    const direccionEntrega = (datos.direccionEntrega || "").trim();
    if (datos.envioDomicilio && direccionEntrega) {
      await registrarMovimientoConn(
        conn,
        id,
        `Dirección de entrega: ${direccionEntrega}`,
        usuario,
      );
    }

    // Descontar del inventario los insumos utilizados
    if (consumosInventario.length > 0) {
      await descontarInventario(consumosInventario, {
        permitirNegativo: false,
      });
    }

    if (montoRecibido > 0 && turnoId && datos.turnoId) {
      const [[ordenCreada]] = await conn.query(
        "SELECT * FROM ordenes WHERE id = ? FOR UPDATE",
        [id],
      );
      await actualizarCierreConAnticipo(
        conn,
        turnoId,
        ordenCreada,
        anticipoId,
        montoRecibido,
        null,
        `Anticipo de la orden ${formatearNumero(ordenCreada.secuencia)}`,
        estadoPago,
      );
    }

    await conn.commit();
    return await obtenerOrdenCompleta(id);
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

const actualizarEstado = async (
  id,
  estado,
  usuario = "Sistema",
  cambios = {},
) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[orden]] = await conn.query(
      "SELECT * FROM ordenes WHERE id = ? FOR UPDATE",
      [id],
    );
    if (!orden) throw new AppError("Orden no encontrada.", 404);

    if (orden.estado === "cancelada" && estado !== "cancelada") {
      await descontarInventarioOrden(conn, id);
    }

    const sets = ["estado = ?"];
    const values = [estado];

    if (Object.prototype.hasOwnProperty.call(cambios, "cantidadPrendas")) {
      sets.push("cantidad_prendas = ?");
      values.push(Math.max(0, Number(cambios.cantidadPrendas || 0)));
    }

    if (typeof cambios.notaInterna === "string") {
      const notaLimpia = cambios.notaInterna.trim();
      if (notaLimpia) {
        const notaAnterior =
          typeof orden.nota_interna === "string"
            ? orden.nota_interna.trim()
            : "";
        const notaFinal = notaAnterior
          ? `${notaAnterior}\n\n${notaLimpia}`
          : notaLimpia;
        sets.push("nota_interna = ?");
        values.push(notaFinal);
      }
    }

    let cajaTexto = "";
    let fechaTurnoSeleccionado = null;
    if (estado === "entregado" || estado === "cerrada") {
      fechaTurnoSeleccionado = cambios.turnoId
        ? await obtenerFechaDelTurno(conn, cambios.turnoId)
        : null;
      const entregadoAtValor = construirFechaConHora(
        fechaTurnoSeleccionado || cambios.fechaEntregado,
      );
      sets.push("entregado_at = COALESCE(?, NOW())");
      values.push(entregadoAtValor);
      if (cambios.turnoId) {
        sets.push("turno_id = ?");
        values.push(cambios.turnoId);
      }

      const turnoAbiertoId = await obtenerTurnoAbiertoId();
      const turnoEfectivo = cambios.turnoId || turnoAbiertoId;

      if (turnoEfectivo && turnoEfectivo === turnoAbiertoId) {
        cajaTexto = " en la caja actual";
      } else if (turnoEfectivo) {
        const [[cierreCaja]] = await conn.query(
          "SELECT numero_caja FROM cierres_caja WHERE turno_id = ? ORDER BY cerrado_at DESC LIMIT 1",
          [turnoEfectivo],
        );
        cajaTexto = cierreCaja ? ` en Caja #${cierreCaja.numero_caja}` : "";
      }
    }

    values.push(id);
    await conn.execute(
      `UPDATE ordenes SET ${sets.join(", ")} WHERE id = ?`,
      values,
    );

    if (estado === "cerrada" && cambios.turnoId) {
      await actualizarCierreConAnticipo(
        conn,
        cambios.turnoId,
        { ...orden, estado: "cerrada" },
        null,
        0,
        construirFechaConHora(fechaTurnoSeleccionado || cambios.fechaEntregado),
        `Entrega antigua de la orden ${formatearNumero(orden.secuencia)}`,
        "pagado",
      );
    }

    const textoMovimiento =
      typeof cambios.textoMovimiento === "string" &&
      cambios.textoMovimiento.trim()
        ? cambios.textoMovimiento.trim()
        : `Estado cambiado a ${estado}${cajaTexto}`;
    await registrarMovimientoConn(conn, id, textoMovimiento, usuario);

    await conn.commit();
    return await obtenerOrdenCompleta(id);
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

const actualizarPago = async (
  id,
  estadoPago,
  usuario = "Sistema",
  turnoIdSolicitado,
) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[orden]] = await conn.query(
      "SELECT * FROM ordenes WHERE id = ? FOR UPDATE",
      [id],
    );
    if (!orden) throw new AppError("Orden no encontrada.", 404);

    if (estadoPago === "porCobrar") {
      const [[ultimoCobro]] = await conn.query(
        "SELECT id, monto FROM orden_anticipos WHERE orden_id = ? ORDER BY fecha DESC, id DESC LIMIT 1 FOR UPDATE",
        [id],
      );

      if (ultimoCobro) {
        await conn.execute("DELETE FROM orden_anticipos WHERE id = ?", [
          ultimoCobro.id,
        ]);
        await actualizarCierreAlEliminarAnticipo(
          conn,
          ultimoCobro,
          orden,
          usuario,
        );
      }

      const [[resumenCobros]] = await conn.query(
        "SELECT COALESCE(SUM(monto), 0) AS monto_recibido FROM orden_anticipos WHERE orden_id = ?",
        [id],
      );
      const montoRecibido = Number(
        toNumber(resumenCobros?.monto_recibido).toFixed(2),
      );
      const nuevoEstadoPago = montoRecibido > 0 ? "anticipo" : "porCobrar";
      const [[ultimoCobroRestante]] = await conn.query(
        "SELECT turno_id FROM orden_anticipos WHERE orden_id = ? ORDER BY fecha DESC, id DESC LIMIT 1",
        [id],
      );

      await conn.execute(
        "UPDATE ordenes SET estado_pago = ?, monto_recibido = ?, cambio = 0, turno_id = ? WHERE id = ?",
        [
          nuevoEstadoPago,
          montoRecibido,
          ultimoCobroRestante?.turno_id || orden.turno_id,
          id,
        ],
      );
      await registrarMovimientoConn(
        conn,
        id,
        `${ultimoCobro ? `Se eliminó el último cobro de $${toNumber(ultimoCobro.monto).toFixed(2)}. ` : ""}Pago revertido a ${nuevoEstadoPago}`,
        usuario,
      );

      await conn.commit();
      return await obtenerOrdenCompleta(id);
    }

    const total = toNumber(orden.total);
    const montoActual = toNumber(orden.monto_recibido);
    const saldoPendiente = Math.max(
      0,
      Number((total - montoActual).toFixed(2)),
    );
    const turnoActualId =
      estadoPago === "pagado"
        ? turnoIdSolicitado || orden.turno_id || (await obtenerTurnoAbiertoId())
        : null;
    let numeroCaja = null;

    if (turnoActualId) {
      const fechaTurnoPago = await obtenerFechaDelTurno(conn, turnoActualId);
      const fechaPago = construirFechaConHora(fechaTurnoPago);
      let anticipoId = null;
      if (saldoPendiente > 0) {
        anticipoId = randomUUID();
        await conn.execute(
          "INSERT INTO orden_anticipos (id, orden_id, turno_id, monto, fecha) VALUES (?,?,?,?,COALESCE(?, NOW()))",
          [anticipoId, id, turnoActualId, saldoPendiente, fechaPago],
        );
      }

      await conn.execute(
        "UPDATE ordenes SET estado_pago = ?, monto_recibido = ?, cambio = ?, turno_id = ? WHERE id = ?",
        [
          estadoPago,
          Math.max(total, montoActual),
          Math.max(
            0,
            Number((Math.max(total, montoActual) - total).toFixed(2)),
          ),
          turnoActualId,
          id,
        ],
      );
      if (saldoPendiente > 0) {
        numeroCaja = await actualizarCierreConAnticipo(
          conn,
          turnoActualId,
          { ...orden, monto_recibido: Math.max(total, montoActual) },
          anticipoId,
          saldoPendiente,
          fechaPago,
        );
      }
    } else {
      await conn.execute("UPDATE ordenes SET estado_pago = ? WHERE id = ?", [
        estadoPago,
        id,
      ]);
    }
    await registrarMovimientoConn(
      conn,
      id,
      `Pago actualizado a ${estadoPago}${turnoActualId && saldoPendiente > 0 ? ` por $${saldoPendiente.toFixed(2)} en ${formatearReferenciaCaja(turnoActualId, numeroCaja)}` : ""}`,
      usuario,
    );

    await conn.commit();
    return await obtenerOrdenCompleta(id);
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

const registrarAnticipo = async (
  id,
  monto,
  usuario = "Sistema",
  turnoId,
  fechaPersonalizada,
) => {
  const montoValido = Number.isFinite(monto) ? Math.max(0, Number(monto)) : 0;
  if (montoValido <= 0) return await obtenerOrdenPorId(id);
  if (!turnoId) {
    throw new AppError(
      "No hay un turno de caja abierto. Abre un turno para registrar cobros.",
      409,
    );
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[orden]] = await conn.query(
      "SELECT * FROM ordenes WHERE id = ? FOR UPDATE",
      [id],
    );
    if (!orden) throw new AppError("Orden no encontrada.", 404);

    const total = toNumber(orden.total);
    const saldoPendiente = Math.max(
      0,
      Number((total - toNumber(orden.monto_recibido)).toFixed(2)),
    );
    const montoAplicado = Math.min(montoValido, saldoPendiente);
    const cambioEntregado = Number((montoValido - montoAplicado).toFixed(2));
    const nuevoMontoRecibido = Number(
      (toNumber(orden.monto_recibido) + montoAplicado).toFixed(2),
    );
    const nuevoCambio = Math.max(
      0,
      Number((toNumber(orden.cambio) + cambioEntregado).toFixed(2)),
    );
    const nuevoEstadoPago = nuevoMontoRecibido >= total ? "pagado" : "anticipo";
    const ordenCerrada =
      orden.estado === "cerrada" || orden.estado === "Cerrada-Cancelada";
    const turnoActualId =
      nuevoEstadoPago === "pagado"
        ? ordenCerrada
          ? orden.turno_id || turnoId
          : turnoId
        : null;
    let numeroCaja = null;

    if (turnoActualId) {
      await conn.execute(
        "UPDATE ordenes SET monto_recibido = ?, cambio = ?, estado_pago = ?, turno_id = ? WHERE id = ?",
        [nuevoMontoRecibido, nuevoCambio, nuevoEstadoPago, turnoActualId, id],
      );
    } else {
      await conn.execute(
        "UPDATE ordenes SET monto_recibido = ?, cambio = ?, estado_pago = ? WHERE id = ?",
        [nuevoMontoRecibido, nuevoCambio, nuevoEstadoPago, id],
      );
    }
    if (montoAplicado > 0) {
      const anticipoId = randomUUID();
      const fechaAnticipoValor = construirFechaConHora(fechaPersonalizada);
      await conn.execute(
        "INSERT INTO orden_anticipos (id, orden_id, turno_id, monto, fecha) VALUES (?,?,?,?, COALESCE(?, NOW()))",
        [anticipoId, id, turnoId, montoAplicado, fechaAnticipoValor],
      );
      numeroCaja = await actualizarCierreConAnticipo(
        conn,
        turnoId,
        { ...orden, monto_recibido: nuevoMontoRecibido },
        anticipoId,
        montoAplicado,
        fechaAnticipoValor,
        undefined,
        nuevoEstadoPago,
      );
    }
    await registrarMovimientoConn(
      conn,
      id,
      `${nuevoEstadoPago === "pagado" ? "Se registró el pago final" : "Se registró un anticipo"} de $${montoAplicado.toFixed(2)} para la orden ${formatearNumero(orden.secuencia)} en ${formatearReferenciaCaja(turnoId, numeroCaja)}${fechaPersonalizada ? ` con fecha ${fechaPersonalizada}` : ""}. Total recibido: $${nuevoMontoRecibido.toFixed(2)}${cambioEntregado > 0 ? `. Cambio entregado: $${cambioEntregado.toFixed(2)}` : ""}`,
      usuario,
    );

    await conn.commit();
    return await obtenerOrdenCompleta(id);
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

const eliminarAnticipo = async (id, idAnticipo, usuario = "Sistema") => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[orden]] = await conn.query(
      "SELECT * FROM ordenes WHERE id = ? FOR UPDATE",
      [id],
    );
    if (!orden) throw new AppError("Orden no encontrada.", 404);

    const [[anticipo]] = await conn.query(
      "SELECT * FROM orden_anticipos WHERE id = ? AND orden_id = ? FOR UPDATE",
      [idAnticipo, id],
    );
    if (!anticipo) throw new AppError("Anticipo no encontrado.", 404);

    const nuevoMontoRecibido = Math.max(
      0,
      Number(
        (toNumber(orden.monto_recibido) - toNumber(anticipo.monto)).toFixed(2),
      ),
    );
    const total = toNumber(orden.total);
    const nuevoCambio = Math.max(
      0,
      Number((nuevoMontoRecibido - total).toFixed(2)),
    );
    const nuevoEstadoPago =
      nuevoMontoRecibido <= 0
        ? "porCobrar"
        : nuevoMontoRecibido >= total
          ? "pagado"
          : "anticipo";

    await conn.execute("DELETE FROM orden_anticipos WHERE id = ?", [
      idAnticipo,
    ]);
    await actualizarCierreAlEliminarAnticipo(conn, anticipo, orden, usuario);
    await conn.execute(
      "UPDATE ordenes SET monto_recibido = ?, cambio = ?, estado_pago = ? WHERE id = ?",
      [nuevoMontoRecibido, nuevoCambio, nuevoEstadoPago, id],
    );
    await registrarMovimientoConn(
      conn,
      id,
      `Se eliminó un anticipo de $${toNumber(anticipo.monto).toFixed(2)}`,
      usuario,
    );

    await conn.commit();
    return await obtenerOrdenCompleta(id);
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

const agregarCargoExtra = async (
  id,
  descripcion,
  monto,
  usuario = "Sistema",
) => {
  const montoValido = Number.isFinite(monto) ? Math.max(0, Number(monto)) : 0;
  if (montoValido <= 0) return await obtenerOrdenPorId(id);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[orden]] = await conn.query(
      "SELECT * FROM ordenes WHERE id = ? FOR UPDATE",
      [id],
    );
    if (!orden) throw new AppError("Orden no encontrada.", 404);

    const descripcionLimpia = (descripcion || "").trim() || "Cargo extra";

    await conn.execute(
      "INSERT INTO orden_cargos_extra (id, orden_id, descripcion, monto, fecha) VALUES (?,?,?,?,NOW())",
      [randomUUID(), id, descripcionLimpia, montoValido],
    );

    const [cargos] = await conn.query(
      "SELECT monto FROM orden_cargos_extra WHERE orden_id = ?",
      [id],
    );
    const totalCargos = cargos.reduce((acc, c) => acc + toNumber(c.monto), 0);
    const { total, cambio } = recalcularTotales(
      toNumber(orden.subtotal),
      orden,
      totalCargos,
    );

    await conn.execute(
      "UPDATE ordenes SET total = ?, cambio = ? WHERE id = ?",
      [total, cambio, id],
    );
    await registrarMovimientoConn(
      conn,
      id,
      `Se agregó cargo extra "${descripcionLimpia}" de $${montoValido.toFixed(2)}`,
      usuario,
    );

    await conn.commit();
    return await obtenerOrdenCompleta(id);
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

const eliminarCargoExtra = async (id, idCargo, usuario = "Sistema") => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[orden]] = await conn.query(
      "SELECT * FROM ordenes WHERE id = ? FOR UPDATE",
      [id],
    );
    if (!orden) throw new AppError("Orden no encontrada.", 404);

    const [[cargo]] = await conn.query(
      "SELECT * FROM orden_cargos_extra WHERE id = ? AND orden_id = ?",
      [idCargo, id],
    );
    if (!cargo) throw new AppError("Cargo extra no encontrado.", 404);

    await conn.execute("DELETE FROM orden_cargos_extra WHERE id = ?", [
      idCargo,
    ]);

    const [cargos] = await conn.query(
      "SELECT monto FROM orden_cargos_extra WHERE orden_id = ?",
      [id],
    );
    const totalCargos = cargos.reduce((acc, c) => acc + toNumber(c.monto), 0);
    const { total, cambio } = recalcularTotales(
      toNumber(orden.subtotal),
      orden,
      totalCargos,
    );

    await conn.execute(
      "UPDATE ordenes SET total = ?, cambio = ? WHERE id = ?",
      [total, cambio, id],
    );
    await registrarMovimientoConn(
      conn,
      id,
      `Se eliminó el cargo extra "${cargo.descripcion}" de $${toNumber(cargo.monto).toFixed(2)}`,
      usuario,
    );

    await conn.commit();
    return await obtenerOrdenCompleta(id);
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

const agregarItemAOrden = async (id, itemCatalogo, usuario = "Sistema") => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[orden]] = await conn.query(
      "SELECT * FROM ordenes WHERE id = ? FOR UPDATE",
      [id],
    );
    if (!orden) throw new AppError("Orden no encontrada.", 404);

    const cantidad = Number(itemCatalogo.cantidad ?? 1);
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      throw new AppError(
        "La cantidad del servicio debe ser un entero mayor que 0.",
        400,
      );
    }

    const [[existente]] = await conn.query(
      "SELECT * FROM orden_items WHERE orden_id = ? AND producto_id = ?",
      [id, itemCatalogo.id],
    );

    if (existente) {
      await conn.execute(
        "UPDATE orden_items SET cantidad = cantidad + ? WHERE id = ?",
        [cantidad, existente.id],
      );
    } else {
      await conn.execute(
        `INSERT INTO orden_items (id, orden_id, producto_id, nombre, precio, unidad, cantidad, nota)
         VALUES (?,?,?,?,?,?,?,'')`,
        [
          randomUUID(),
          id,
          itemCatalogo.id,
          itemCatalogo.nombre,
          Number(itemCatalogo.precio),
          itemCatalogo.unidad,
          cantidad,
        ],
      );
    }

    const [itemsRows] = await conn.query(
      "SELECT precio, cantidad FROM orden_items WHERE orden_id = ?",
      [id],
    );
    const subtotal = itemsRows.reduce(
      (acc, i) => acc + toNumber(i.precio) * toNumber(i.cantidad),
      0,
    );

    const [cargos] = await conn.query(
      "SELECT monto FROM orden_cargos_extra WHERE orden_id = ?",
      [id],
    );
    const totalCargos = cargos.reduce((acc, c) => acc + toNumber(c.monto), 0);
    const { total, cambio } = recalcularTotales(subtotal, orden, totalCargos);

    await conn.execute(
      "UPDATE ordenes SET subtotal = ?, total = ?, cambio = ? WHERE id = ?",
      [subtotal, total, cambio, id],
    );
    await registrarMovimientoConn(
      conn,
      id,
      `Se agregó "${itemCatalogo.nombre}" a la orden`,
      usuario,
    );

    await conn.commit();
    return await obtenerOrdenCompleta(id);
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

const eliminarItemDeOrden = async (
  id,
  productoId,
  razon,
  usuario = "Sistema",
) => {
  const razonLimpia = (razon || "").trim();
  if (!razonLimpia) throw new AppError("El motivo es obligatorio.", 400);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[orden]] = await conn.query(
      "SELECT * FROM ordenes WHERE id = ? FOR UPDATE",
      [id],
    );
    if (!orden) throw new AppError("Orden no encontrada.", 404);

    const [[item]] = await conn.query(
      "SELECT * FROM orden_items WHERE orden_id = ? AND producto_id = ?",
      [id, productoId],
    );
    if (!item) throw new AppError("Item no encontrado en la orden.", 404);

    await conn.execute("DELETE FROM orden_items WHERE id = ?", [item.id]);

    const [itemsRows] = await conn.query(
      "SELECT precio, cantidad FROM orden_items WHERE orden_id = ?",
      [id],
    );
    const subtotal = itemsRows.reduce(
      (acc, i) => acc + toNumber(i.precio) * toNumber(i.cantidad),
      0,
    );

    const [cargos] = await conn.query(
      "SELECT monto FROM orden_cargos_extra WHERE orden_id = ?",
      [id],
    );
    const totalCargos = cargos.reduce((acc, c) => acc + toNumber(c.monto), 0);
    const { total, cambio } = recalcularTotales(subtotal, orden, totalCargos);

    await conn.execute(
      "UPDATE ordenes SET subtotal = ?, total = ?, cambio = ? WHERE id = ?",
      [subtotal, total, cambio, id],
    );
    await registrarMovimientoConn(
      conn,
      id,
      `Se quitó "${item.nombre}" (${toNumber(item.cantidad)} x $${toNumber(
        item.precio,
      ).toFixed(2)}). Motivo: ${razonLimpia}`,
      usuario,
    );

    await conn.commit();
    return await obtenerOrdenCompleta(id);
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

const eliminarFoto = async (id, index, usuario = "Sistema") => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[orden]] = await conn.query(
      "SELECT id FROM ordenes WHERE id = ? FOR UPDATE",
      [id],
    );
    if (!orden) throw new AppError("Orden no encontrada.", 404);

    const [fotos] = await conn.query(
      "SELECT id FROM orden_fotos WHERE orden_id = ? ORDER BY posicion ASC",
      [id],
    );
    const foto = fotos[index];
    if (!foto) throw new AppError("Foto no encontrada.", 404);

    await conn.execute("DELETE FROM orden_fotos WHERE id = ?", [foto.id]);
    await registrarMovimientoConn(conn, id, "Se eliminó una foto", usuario);

    await conn.commit();
    return await obtenerOrdenCompleta(id);
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

const cancelarOrden = async (id, motivo, usuario = "Sistema") => {
  const motivoLimpio = (motivo || "").trim();
  if (!motivoLimpio)
    throw new AppError("El motivo de cancelación es obligatorio.", 400);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[orden]] = await conn.query(
      "SELECT id, estado FROM ordenes WHERE id = ? FOR UPDATE",
      [id],
    );
    if (!orden) throw new AppError("Orden no encontrada.", 404);
    if (orden.estado === "cancelada") {
      throw new AppError("La orden ya está cancelada.", 400);
    }

    await revertirInventarioOrden(conn, id);
    await conn.execute("DELETE FROM orden_anticipos WHERE orden_id = ?", [id]);
    await conn.execute(
      "UPDATE ordenes SET estado = 'cancelada', estado_pago = 'porCobrar', monto_recibido = 0, cambio = 0, motivo_cancelacion = ? WHERE id = ?",
      [motivoLimpio, id],
    );
    await registrarMovimientoConn(
      conn,
      id,
      `Orden cancelada. Motivo: ${motivoLimpio}`,
      usuario,
    );

    await conn.commit();
    return await obtenerOrdenCompleta(id);
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

const limpiarOrdenDeCierres = async (conn, orden) => {
  const referenciaOrden = formatearNumero(orden.secuencia);
  const [cierres] = await conn.query(
    "SELECT id, resumen FROM cierres_caja FOR UPDATE",
  );

  for (const cierre of cierres) {
    let resumen = cierre.resumen;
    if (typeof resumen === "string") {
      try {
        resumen = JSON.parse(resumen);
      } catch {
        resumen = {};
      }
    }
    resumen = resumen && typeof resumen === "object" ? resumen : {};
    resumen.ordenes = Array.isArray(resumen.ordenes) ? resumen.ordenes : [];
    resumen.totales = resumen.totales || {};
    resumen.conteos = resumen.conteos || {};
    resumen.movimientos = Array.isArray(resumen.movimientos)
      ? resumen.movimientos
      : [];

    const ordenResumen = resumen.ordenes.find((item) => item?.id === orden.id);
    const movimientosPago = resumen.movimientos.filter(
      (movimiento) =>
        movimiento?.tipo === "cierre" &&
        toNumber(movimiento.monto) > 0 &&
        String(movimiento.concepto || "").includes(referenciaOrden),
    );
    if (!ordenResumen && movimientosPago.length === 0) continue;

    const cobradoRemovido = ordenResumen
      ? toNumber(ordenResumen.cobradoEnTurno)
      : movimientosPago.reduce(
          (total, movimiento) => total + toNumber(movimiento.monto),
          0,
        );
    const cobrado = Number(
      Math.max(0, toNumber(resumen.totales.cobrado) - cobradoRemovido).toFixed(
        2,
      ),
    );
    const recaudado = Number(
      (
        cobrado -
        toNumber(resumen.totales.cancelaciones) -
        toNumber(resumen.totales.gastos)
      ).toFixed(2),
    );
    const saldoEsperado = Number(
      (
        toNumber(resumen.apertura) +
        recaudado -
        toNumber(resumen.totales.depositos)
      ).toFixed(2),
    );

    resumen.ordenes = resumen.ordenes.filter((item) => item?.id !== orden.id);
    resumen.movimientos = resumen.movimientos.filter(
      (movimiento) =>
        !(
          movimiento?.tipo === "cierre" &&
          toNumber(movimiento.monto) > 0 &&
          String(movimiento.concepto || "").includes(referenciaOrden)
        ),
    );
    resumen.totales.cobrado = cobrado;
    resumen.totales.ventas = cobrado;
    resumen.totales.recaudado = recaudado;
    resumen.totales.gananciaNeta = recaudado;
    resumen.totales.saldoEsperado = saldoEsperado;
    resumen.totales.diferencia = Number(
      (toNumber(resumen.saldoCierre) - saldoEsperado).toFixed(2),
    );
    if (ordenResumen) {
      resumen.conteos.ordenes = Math.max(
        0,
        Number(resumen.conteos.ordenes || 0) - 1,
      );
    }

    await conn.execute("UPDATE cierres_caja SET resumen = ? WHERE id = ?", [
      JSON.stringify(resumen),
      cierre.id,
    ]);
  }

  await conn.execute(
    "DELETE FROM movimientos_caja WHERE tipo = 'cierre' AND monto > 0 AND concepto LIKE ?",
    [`%${referenciaOrden}%`],
  );
};

const eliminarOrden = async (id) => {
  const ordenEliminada = await obtenerOrdenCompleta(id);
  if (!ordenEliminada) throw new AppError("Orden no encontrada.", 404);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[orden]] = await conn.query(
      "SELECT * FROM ordenes WHERE id = ? FOR UPDATE",
      [id],
    );
    if (!orden) throw new AppError("Orden no encontrada.", 404);

    if (orden.estado !== "cancelada") {
      await revertirInventarioOrden(conn, id);
    }

    await limpiarOrdenDeCierres(conn, orden);
    await conn.execute("DELETE FROM orden_movimientos WHERE orden_id = ?", [
      id,
    ]);
    await conn.execute("DELETE FROM ordenes WHERE id = ?", [id]);
    await conn.commit();
    return ordenEliminada;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

// Patch genérico para datos editables de la orden.
// No se expone aquí nada que afecte montos (total, subtotal, estado, etc.) para
// evitar que el cliente pueda desincronizar los totales calculados en el servidor.
const actualizarCamposOrden = async (id, cambios, usuario = "Sistema") => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[orden]] = await conn.query(
      "SELECT * FROM ordenes WHERE id = ? FOR UPDATE",
      [id],
    );
    if (!orden) throw new AppError("Orden no encontrada.", 404);

    const [fotosAnteriores] = await conn.query(
      "SELECT url FROM orden_fotos WHERE orden_id = ? ORDER BY posicion ASC",
      [id],
    );
    const notaAnterior = orden.nota_interna || "";
    const nombreClienteAnterior = orden.nombre_cliente || "";
    const correoAnterior = orden.correo || "";
    const telefonoAnterior = orden.telefono || "";
    const cantidadPrendasAnterior = toNumber(orden.cantidad_prendas);
    const sets = [];
    const values = [];

    if (typeof cambios.notaInterna === "string") {
      sets.push("nota_interna = ?");
      values.push(cambios.notaInterna);
    }

    if (typeof cambios.fechaCreacion === "string") {
      const fechaCreacion = construirFechaConHora(
        cambios.fechaCreacion,
        orden.created_at,
      );
      if (!fechaCreacion)
        throw new AppError("La fecha de creación no es válida.", 400);
      sets.push("created_at = ?");
      values.push(fechaCreacion);
    }

    if (typeof cambios.fechaEntrega === "string") {
      const fechaEntrega = cambios.fechaEntrega.trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaEntrega)) {
        throw new AppError("La fecha de entrega no es válida.", 400);
      }
      sets.push("fecha_entrega = ?");
      values.push(fechaEntrega);
      sets.push("fecha_entrega_activa = 1");
    }

    if (typeof cambios.horaEntrega === "string") {
      const horaEntrega = cambios.horaEntrega.trim();
      if (!/^\d{2}:\d{2}$/.test(horaEntrega)) {
        throw new AppError(
          "La hora de entrega no es válida. Debe ser formato HH:MM.",
          400,
        );
      }
      sets.push("hora_entrega = ?");
      values.push(horaEntrega);
    }

    if (typeof cambios.nombreCliente === "string") {
      sets.push("nombre_cliente = ?");
      values.push(cambios.nombreCliente.trim());
    }
    if (typeof cambios.correo === "string") {
      sets.push("correo = ?");
      values.push(cambios.correo.trim().toLowerCase());
    }
    if (typeof cambios.telefono === "string") {
      sets.push("telefono = ?");
      values.push(cambios.telefono.replace(/\D/g, ""));
    }

    let cantidadPrendasNueva = null;
    if (Object.prototype.hasOwnProperty.call(cambios, "cantidadPrendas")) {
      cantidadPrendasNueva = Math.max(0, Number(cambios.cantidadPrendas || 0));
      sets.push("cantidad_prendas = ?");
      values.push(cantidadPrendasNueva);
    }

    if (sets.length) {
      values.push(id);
      await conn.execute(
        `UPDATE ordenes SET ${sets.join(", ")} WHERE id = ?`,
        values,
      );
    }

    if (Array.isArray(cambios.fotos)) {
      await conn.execute("DELETE FROM orden_fotos WHERE orden_id = ?", [id]);
      for (let i = 0; i < cambios.fotos.length; i++) {
        await conn.execute(
          "INSERT INTO orden_fotos (id, orden_id, posicion, url) VALUES (?,?,?,?)",
          [randomUUID(), id, i, cambios.fotos[i]],
        );
      }
    }

    const notaCambio =
      typeof cambios.notaInterna === "string" &&
      cambios.notaInterna !== notaAnterior;
    const fotosCambio =
      Array.isArray(cambios.fotos) &&
      JSON.stringify(cambios.fotos) !==
        JSON.stringify(fotosAnteriores.map((foto) => foto.url));

    if (notaCambio) {
      await registrarMovimientoConn(
        conn,
        id,
        "Nota interna actualizada",
        usuario,
      );
    }
    if (fotosCambio) {
      await registrarMovimientoConn(
        conn,
        id,
        "Fotos de la orden actualizadas",
        usuario,
      );
    }

    if (
      typeof cambios.fechaCreacion === "string" ||
      typeof cambios.fechaEntrega === "string"
    ) {
      await registrarMovimientoConn(
        conn,
        id,
        "Fechas de la orden actualizadas",
        usuario,
      );
    }

    if (
      cantidadPrendasNueva !== null &&
      cantidadPrendasNueva !== cantidadPrendasAnterior
    ) {
      await registrarMovimientoConn(
        conn,
        id,
        `Cantidad de prendas actualizada: ${cantidadPrendasAnterior} → ${cantidadPrendasNueva}`,
        usuario,
      );
    }

    const nombreClienteNuevo =
      typeof cambios.nombreCliente === "string"
        ? cambios.nombreCliente.trim()
        : null;
    const correoNuevo =
      typeof cambios.correo === "string"
        ? cambios.correo.trim().toLowerCase()
        : null;
    const telefonoNuevo =
      typeof cambios.telefono === "string"
        ? cambios.telefono.replace(/\D/g, "")
        : null;

    if (
      (nombreClienteNuevo !== null &&
        nombreClienteNuevo !== nombreClienteAnterior) ||
      (correoNuevo !== null && correoNuevo !== correoAnterior) ||
      (telefonoNuevo !== null && telefonoNuevo !== telefonoAnterior)
    ) {
      await registrarMovimientoConn(
        conn,
        id,
        construirTextoCambioCliente({
          nombreClienteAnterior,
          nombreClienteNuevo: nombreClienteNuevo ?? "",
          correoAnterior,
          correoNuevo: correoNuevo ?? "",
          telefonoAnterior,
          telefonoNuevo: telefonoNuevo ?? "",
        }),
        usuario,
      );
    }

    if (sets.length || Array.isArray(cambios.fotos)) {
      await conn.execute("UPDATE ordenes SET updated_at = NOW() WHERE id = ?", [
        id,
      ]);
    }

    await conn.commit();
    return await obtenerOrdenCompleta(id);
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

const registrarMovimiento = async (id, texto, usuario = "Sistema") => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[orden]] = await conn.query(
      "SELECT id FROM ordenes WHERE id = ? FOR UPDATE",
      [id],
    );
    if (!orden) throw new AppError("Orden no encontrada.", 404);

    await registrarMovimientoConn(conn, id, texto, usuario);

    await conn.commit();
    return await obtenerOrdenCompleta(id);
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

const restaurarOrden = async (id, usuario = "Sistema") => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[orden]] = await conn.query(
      "SELECT * FROM ordenes WHERE id = ? FOR UPDATE",
      [id],
    );
    if (!orden) throw new AppError("Orden no encontrada.", 404);
    if (orden.estado !== "cerrada") {
      throw new AppError("Solo se pueden restaurar órdenes cerradas.", 400);
    }

    let pagosDelCierre = [];
    if (orden.turno_id) {
      const [pagos] = await conn.query(
        "SELECT id, monto FROM orden_anticipos WHERE orden_id = ? AND turno_id = ? FOR UPDATE",
        [id, orden.turno_id],
      );
      pagosDelCierre = pagos;
    }

    const montoPagosRemovidos = pagosDelCierre.reduce(
      (total, pago) => total + toNumber(pago.monto),
      0,
    );
    if (pagosDelCierre.length) {
      await conn.execute(
        "DELETE FROM orden_anticipos WHERE orden_id = ? AND turno_id = ?",
        [id, orden.turno_id],
      );
    }

    const [[cobrosRestantes]] = await conn.query(
      "SELECT COALESCE(SUM(monto), 0) AS monto_recibido FROM orden_anticipos WHERE orden_id = ?",
      [id],
    );
    const montoRecibidoRestante = Number(
      toNumber(cobrosRestantes?.monto_recibido).toFixed(2),
    );
    const estadoPagoRestante =
      montoRecibidoRestante >= toNumber(orden.total)
        ? "pagado"
        : montoRecibidoRestante > 0
          ? "anticipo"
          : "porCobrar";
    const cambioRestante = Math.max(
      0,
      Number((montoRecibidoRestante - toNumber(orden.total)).toFixed(2)),
    );
    const [[ultimoCobroRestante]] = await conn.query(
      "SELECT turno_id FROM orden_anticipos WHERE orden_id = ? ORDER BY fecha DESC, id DESC LIMIT 1",
      [id],
    );

    let cierre = null;
    let ordenResumenCierre = null;
    if (orden.turno_id) {
      const [cierres] = await conn.query(
        "SELECT id, numero_caja, resumen FROM cierres_caja WHERE turno_id = ? ORDER BY cerrado_at DESC LIMIT 1 FOR UPDATE",
        [orden.turno_id],
      );
      cierre = cierres[0] || null;

      if (cierre) {
        let resumen = cierre.resumen;
        if (typeof resumen === "string") {
          try {
            resumen = JSON.parse(resumen);
          } catch {
            resumen = {};
          }
        }
        resumen = resumen && typeof resumen === "object" ? resumen : {};
        resumen.ordenes = Array.isArray(resumen.ordenes) ? resumen.ordenes : [];
        resumen.totales = resumen.totales || {};
        resumen.conteos = resumen.conteos || {};
        resumen.movimientos = Array.isArray(resumen.movimientos)
          ? resumen.movimientos
          : [];
        const numeroOrdenNormalizado = normalizarNumeroOrden(
          formatearNumero(orden.secuencia),
        );
        const indiceOrdenCierre = resumen.ordenes.findIndex(
          (item) =>
            item?.id === id ||
            normalizarNumeroOrden(item?.numero) === numeroOrdenNormalizado ||
            normalizarNumeroOrden(item?.secuencia) === numeroOrdenNormalizado,
        );
        ordenResumenCierre =
          indiceOrdenCierre >= 0 ? resumen.ordenes[indiceOrdenCierre] : null;

        if (ordenResumenCierre) {
          const cobradoRemovido = Number(
            ordenResumenCierre.cobradoEnTurno ??
              (ordenResumenCierre.estadoPago === "pagado"
                ? ordenResumenCierre.total
                : ordenResumenCierre.montoRecibido) ??
              0,
          );
          const cobradoActual = toNumber(resumen.totales.cobrado);
          const cobrado = Number(
            Math.max(0, cobradoActual - cobradoRemovido).toFixed(2),
          );
          const recaudado = Number(
            (
              cobrado -
              toNumber(resumen.totales.cancelaciones) -
              toNumber(resumen.totales.gastos)
            ).toFixed(2),
          );
          const saldoEsperado = Number(
            (
              toNumber(resumen.apertura) +
              recaudado -
              toNumber(resumen.totales.depositos)
            ).toFixed(2),
          );

          resumen.ordenes = resumen.ordenes.filter(
            (_item, indice) => indice !== indiceOrdenCierre,
          );
          resumen.totales.cobrado = cobrado;
          resumen.totales.ventas = cobrado;
          resumen.totales.recaudado = recaudado;
          resumen.totales.gananciaNeta = recaudado;
          resumen.totales.saldoEsperado = saldoEsperado;
          resumen.totales.diferencia = Number(
            (toNumber(resumen.saldoCierre) - saldoEsperado).toFixed(2),
          );
          resumen.conteos.ordenes = Math.max(
            0,
            Number(resumen.conteos.ordenes || 0) - 1,
          );

          const referenciaOrden = formatearNumero(orden.secuencia);
          resumen.movimientos = resumen.movimientos.filter(
            (movimiento) =>
              !(
                movimiento?.tipo === "cierre" &&
                toNumber(movimiento.monto) > 0 &&
                String(movimiento.concepto || "").includes(referenciaOrden)
              ),
          );
        }

        cierre.resumen = resumen;
      }
    }

    // Restaurar la orden y conservar solo pagos que pertenecen a otros turnos.
    await conn.execute(
      "UPDATE ordenes SET estado = ?, estado_pago = ?, monto_recibido = ?, cambio = ?, turno_id = ?, updated_at = NOW() WHERE id = ?",
      [
        "pendiente",
        estadoPagoRestante,
        montoRecibidoRestante,
        cambioRestante,
        ultimoCobroRestante?.turno_id || "",
        id,
      ],
    );

    // Registrar movimiento de auditoría en orden_movimientos
    await registrarMovimientoConn(
      conn,
      id,
      `Orden restaurada de cerrada a pendiente (se eliminaron $${montoPagosRemovidos.toFixed(2)} de pagos del cierre)`,
      usuario,
    );

    // Si la orden tenía un cierre asociado, persistir el snapshot actualizado y la auditoría.
    if (cierre) {
      const usuarioNormalizado = normalizarUsuario(usuario);
      const concepto = `Restauración de orden ${formatearNumero(orden.secuencia)} (${orden.nombre_cliente}) - removida del cierre`;
      const movimientoId = randomUUID();

      if (ordenResumenCierre) {
        cierre.resumen.movimientos.push({
          id: movimientoId,
          tipo: "cierre",
          monto: 0,
          concepto,
          creadoAt: new Date().toISOString(),
          turnoId: orden.turno_id,
          numeroCaja: cierre.numero_caja,
          usuario: usuarioNormalizado.nombre,
        });
        await conn.execute("UPDATE cierres_caja SET resumen = ? WHERE id = ?", [
          JSON.stringify(cierre.resumen),
          cierre.id,
        ]);
      }

      // Registrar auditoría también en movimientos_caja.
      if (cierre) {
        await conn.execute(
          "DELETE FROM movimientos_caja WHERE turno_id = ? AND tipo = 'cierre' AND monto > 0 AND concepto LIKE ?",
          [orden.turno_id, `%${formatearNumero(orden.secuencia)}%`],
        );
        await conn.execute(
          `INSERT INTO movimientos_caja (id, tipo, monto, concepto, turno_id, numero_caja, usuario, creado_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            movimientoId,
            "cierre",
            0,
            concepto,
            orden.turno_id,
            cierre.numero_caja,
            usuarioNormalizado.nombre,
          ],
        );
      }
    }

    await conn.commit();
    return await obtenerOrdenCompleta(id);
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

const aplicarDescuentoOrden = async (id, tipo, valor, usuario = "Sistema") => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    
    const [[orden]] = await conn.query(
      "SELECT * FROM ordenes WHERE id = ? FOR UPDATE",
      [id],
    );
    if (!orden) throw new AppError("Orden no encontrada.", 404);
    
    if (orden.estado === "cerrada" || orden.estado === "Cerrada-Cancelada") {
      throw new AppError("No se puede aplicar descuento a una orden cerrada.", 400);
    }
    
    const subtotal = toNumber(orden.subtotal);
    let descuentoAplicado = 0;
    
    if (tipo === "porcentaje") {
      const porcentaje = Math.max(0, Math.min(100, Number(valor)));
      descuentoAplicado = Number((subtotal * (porcentaje / 100)).toFixed(2));
    } else if (tipo === "monto") {
      descuentoAplicado = Math.max(0, Math.min(subtotal, Number(valor)));
    } else {
      throw new AppError("Tipo de descuento inválido. Use 'porcentaje' o 'monto'.", 400);
    }
    
    const total = Math.max(0, Number((subtotal - descuentoAplicado).toFixed(2)));
    const montoRecibido = toNumber(orden.monto_recibido);
    const cambio = Math.max(0, Number((montoRecibido - total).toFixed(2)));
    
    const estadoPago = montoRecibido >= total && total > 0
      ? "pagado"
      : montoRecibido > 0
        ? "anticipo"
        : "porCobrar";
    
    await conn.execute(
      `UPDATE ordenes 
       SET descuento = ?, descuento_manual = ?, total = ?, cambio = ?, estado_pago = ?, updated_at = NOW() 
       WHERE id = ?`,
      [descuentoAplicado, descuentoAplicado, total, cambio, estadoPago, id],
    );
    
    const textoTipo = tipo === "porcentaje" ? `${valor}%` : `$${Number(valor).toFixed(2)}`;
    await registrarMovimientoConn(
      conn,
      id,
      `Descuento aplicado: ${textoTipo} (-$${descuentoAplicado.toFixed(2)})`,
      usuario,
    );
    
    await conn.commit();
    return await obtenerOrdenCompleta(id);
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

module.exports = {
  formatearNumero,
  obtenerOrdenes,
  obtenerOrdenPorId,
  crearOrden,
  actualizarEstado,
  actualizarPago,
  registrarAnticipo,
  eliminarAnticipo,
  agregarCargoExtra,
  eliminarCargoExtra,
  agregarItemAOrden,
  eliminarItemDeOrden,
  eliminarFoto,
  cancelarOrden,
  restaurarOrden,
  eliminarOrden,
  registrarMovimiento,
  actualizarCamposOrden,
  construirTextoCambioCliente,
  aplicarDescuentoOrden,
};
