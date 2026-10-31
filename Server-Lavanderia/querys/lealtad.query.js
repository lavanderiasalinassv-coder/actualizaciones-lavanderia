const {
  createHash,
  randomBytes,
  randomInt,
  randomUUID,
  timingSafeEqual,
} = require("crypto");
const { pool } = require("../database/MySQLConexion");
const { AppError } = require("../utils/errors");

const normalizarTelefono = (valor) =>
  typeof valor === "string" ? valor.replace(/\D/g, "") : "";

const coincideTelefonoOrden = (orden, celularCliente) => {
  const codigoPais = normalizarTelefono(orden.codigo_pais);
  const telefonoOrden = normalizarTelefono(orden.telefono);
  const telefonoCliente = normalizarTelefono(celularCliente);
  if (telefonoCliente.length < 7 || telefonoOrden.length < 7) return false;

  const telefonoSinCodigoPais =
    codigoPais && telefonoOrden.startsWith(codigoPais)
      ? telefonoOrden.slice(codigoPais.length)
      : telefonoOrden;

  return (
    telefonoCliente === telefonoOrden ||
    telefonoCliente === `${codigoPais}${telefonoOrden}` ||
    telefonoCliente === telefonoSinCodigoPais
  );
};

const mapTarjeta = (row) => ({
  nombre: row.nombre,
  sellos: Number(row.sellos),
  meta: Number(row.visitas_meta ?? row.meta ?? 10),
  premioDisponible: Boolean(row.premio_disponible),
  premio: row.premio,
  token: row.token,
});

let asegurarCamposPremioPromise;
const asegurarCamposPremio = async () => {
  if (!asegurarCamposPremioPromise) {
    asegurarCamposPremioPromise = (async () => {
      const [columnas] = await pool.query("SHOW COLUMNS FROM lealtad_configuracion");
      const nombres = new Set(columnas.map(({ Field }) => Field));
      if (!nombres.has("tipo_descuento")) await pool.query("ALTER TABLE lealtad_configuracion ADD COLUMN tipo_descuento VARCHAR(20) NOT NULL DEFAULT 'porcentaje'");
      if (!nombres.has("valor_descuento")) await pool.query("ALTER TABLE lealtad_configuracion ADD COLUMN valor_descuento DECIMAL(10,2) NOT NULL DEFAULT 10");
      if (!nombres.has("visitas_meta")) await pool.query("ALTER TABLE lealtad_configuracion ADD COLUMN visitas_meta SMALLINT UNSIGNED NOT NULL DEFAULT 10");
      const [columnasTarjeta] = await pool.query("SHOW COLUMNS FROM lealtad_tarjetas");
      if (!columnasTarjeta.some(({ Field }) => Field === "activa")) await pool.query("ALTER TABLE lealtad_tarjetas ADD COLUMN activa TINYINT(1) NOT NULL DEFAULT 1");
    })().catch((error) => { asegurarCamposPremioPromise = null; throw error; });
  }
  return asegurarCamposPremioPromise;
};

const obtenerConfiguracion = async () => {
  await asegurarCamposPremio();
  await pool.query(
    "INSERT IGNORE INTO lealtad_configuracion (id, premio) VALUES (1, 'Premio por definir')",
  );
  const [[configuracion]] = await pool.query(
    `SELECT premio, tipo_descuento, valor_descuento, visitas_meta, (SELECT COUNT(*) FROM lealtad_tarjetas WHERE activa = 1) AS tarjetas_activas
     FROM lealtad_configuracion WHERE id = 1`,
  );
  return {
    premio: configuracion.premio,
    tipoDescuento: configuracion.tipo_descuento,
    valorDescuento: Number(configuracion.valor_descuento),
    visitasMeta: Number(configuracion.visitas_meta),
    tarjetasActivas: Number(configuracion.tarjetas_activas),
  };
};

const actualizarPremio = async ({ premio, tipoDescuento, valorDescuento, visitasMeta }) => {
  await asegurarCamposPremio();
  if (typeof premio !== "string" || !premio.trim()) {
    throw new AppError("Escribe el nombre del premio del programa de lealtad.", 400);
  }
  const premioLimpio = premio.trim();
  if (premioLimpio.length > 255) {
    throw new AppError("El premio no puede superar 255 caracteres.", 400);
  }
  if (!["porcentaje", "dinero"].includes(tipoDescuento)) throw new AppError("Selecciona un tipo de descuento válido.", 400);
  const valor = Number(valorDescuento);
  const meta = Number(visitasMeta);
  if (!Number.isInteger(meta) || meta < 1 || meta > 100) throw new AppError("La meta de visitas debe ser un número entero entre 1 y 100.", 400);
  if (!Number.isFinite(valor) || valor <= 0 || (tipoDescuento === "porcentaje" && valor > 100)) throw new AppError("El descuento debe ser mayor que cero y el porcentaje no puede superar 100.", 400);
  await pool.query(`INSERT INTO lealtad_configuracion (id, premio, tipo_descuento, valor_descuento, visitas_meta) VALUES (1, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE premio = VALUES(premio), tipo_descuento = VALUES(tipo_descuento), valor_descuento = VALUES(valor_descuento), visitas_meta = VALUES(visitas_meta)`, [premioLimpio, tipoDescuento, valor, meta]);
  await pool.execute("UPDATE lealtad_tarjetas SET premio_disponible = (sellos >= ?)", [meta]);
  return obtenerConfiguracion();
};

const solicitarCodigo = async (telefono, modo = "registro") => {
  await asegurarCamposPremio();
  const celular = normalizarTelefono(telefono);
  if (celular.length < 7 || celular.length > 20) {
    throw new AppError("Ingresa un teléfono válido.", 400);
  }

  const [clientes] = await pool.execute(
    "SELECT id, nombre, correo FROM clientes WHERE celular = ? LIMIT 2",
    [celular],
  );
  if (!clientes.length) {
    throw new AppError("No encontramos ese teléfono. Solicita al personal que revise tu registro de cliente.", 404);
  }
  if (clientes.length > 1) {
    throw new AppError("Hay varios clientes con ese teléfono. Solicita al personal que revise los registros.", 409);
  }
  const cliente = clientes[0];
  if (modo === "canje") {
    const [[tarjeta]] = await pool.execute(
      "SELECT id FROM lealtad_tarjetas WHERE cliente_id = ? AND activa = 1 LIMIT 1",
      [cliente.id],
    );
    if (!tarjeta) throw new AppError("El cliente todavía no tiene una tarjeta de lealtad.", 404);
  }
  const correo = typeof cliente.correo === "string" ? cliente.correo.trim() : "";
  if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    throw new AppError("Tu cliente no tiene un correo válido registrado. Solicita al personal que lo actualice.", 409);
  }

  const [[limite]] = await pool.execute(
    `SELECT COUNT(*) AS cantidad,
            TIMESTAMPDIFF(SECOND, MAX(solicitado_at), NOW()) AS segundos_desde_ultima
     FROM lealtad_verificaciones
     WHERE cliente_id = ? AND solicitado_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
    [cliente.id],
  );
  if (Number(limite.cantidad) >= 5) {
    throw new AppError("Se alcanzó el límite de códigos. Intenta de nuevo más tarde.", 429);
  }
  if (
    Number(limite.cantidad) > 0 &&
    Number(limite.segundos_desde_ultima) < 60
  ) {
    throw new AppError("Espera un minuto antes de solicitar otro código.", 429);
  }

  const codigo = String(randomInt(100000, 1000000));
  const id = randomUUID();
  const codigoHash = createHash("sha256").update(codigo).digest("hex");
  await pool.execute(
    `INSERT INTO lealtad_verificaciones (id, cliente_id, codigo_hash, expira_at)
     VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))`,
    [id, cliente.id, codigoHash],
  );
  return {
    id,
    codigo,
    nombre: cliente.nombre,
    correo,
  };
};

const cancelarSolicitudCodigo = async (id) => {
  await pool.execute("DELETE FROM lealtad_verificaciones WHERE id = ?", [id]);
};

const verificarCodigoYRegistrarTarjeta = async ({ telefono, codigo, modo = "registro" }) => {
  await asegurarCamposPremio();
  if (!["registro", "canje"].includes(modo)) throw new AppError("El motivo de verificación no es válido.", 400);
  const celular = normalizarTelefono(telefono);
  const codigoLimpio = typeof codigo === "string" ? codigo.trim() : "";
  if (celular.length < 7 || celular.length > 20) {
    throw new AppError("Ingresa un teléfono válido.", 400);
  }
  if (!/^\d{6}$/.test(codigoLimpio)) {
    throw new AppError("El código debe tener 6 dígitos.", 400);
  }

  await pool.query(
    "INSERT IGNORE INTO lealtad_configuracion (id, premio) VALUES (1, 'Premio por definir')",
  );
  const conn = await pool.getConnection();
  let transaccionActiva = false;
  try {
    await conn.beginTransaction();
    transaccionActiva = true;
    const [clientes] = await conn.execute(
      "SELECT id, nombre FROM clientes WHERE celular = ? LIMIT 2 FOR UPDATE",
      [celular],
    );
    if (!clientes.length) {
      throw new AppError("No encontramos ese teléfono. Solicita al personal que revise tu registro de cliente.", 404);
    }
    if (clientes.length > 1) {
      throw new AppError("Hay varios clientes con ese teléfono. Solicita al personal que revise los registros.", 409);
    }
    const cliente = clientes[0];
    const [[verificacion]] = await conn.execute(
      `SELECT id, codigo_hash, intentos, usado_at, (expira_at > NOW()) AS vigente
       FROM lealtad_verificaciones
       WHERE cliente_id = ? AND usado_at IS NULL
       ORDER BY solicitado_at DESC LIMIT 1 FOR UPDATE`,
      [cliente.id],
    );
    if (!verificacion || verificacion.usado_at || !verificacion.vigente) {
      throw new AppError("El código expiró o no es válido. Solicita uno nuevo.", 400);
    }
    if (Number(verificacion.intentos) >= 5) {
      throw new AppError("Se agotaron los intentos. Solicita un código nuevo.", 429);
    }

    const codigoHash = createHash("sha256").update(codigoLimpio).digest();
    const hashGuardado = Buffer.from(verificacion.codigo_hash, "hex");
    if (!timingSafeEqual(codigoHash, hashGuardado)) {
      await conn.execute(
        "UPDATE lealtad_verificaciones SET intentos = intentos + 1 WHERE id = ?",
        [verificacion.id],
      );
      await conn.commit();
      transaccionActiva = false;
      throw new AppError("El código ingresado no coincide.", 400);
    }
    await conn.execute(
      "UPDATE lealtad_verificaciones SET usado_at = NOW() WHERE id = ?",
      [verificacion.id],
    );
    let [tarjetas] = await conn.execute(
      "SELECT id, token, activa FROM lealtad_tarjetas WHERE cliente_id = ? LIMIT 1 FOR UPDATE",
      [cliente.id],
    );
    if (modo === "canje" && (!tarjetas.length || !Boolean(tarjetas[0].activa))) {
      throw new AppError("El cliente todavía no tiene una tarjeta de lealtad.", 404);
    }
    if (tarjetas.length && !Boolean(tarjetas[0].activa) && modo !== "canje") {
      await conn.execute("UPDATE lealtad_tarjetas SET activa = 1, sellos = 0, premio_disponible = 0, token = ? WHERE id = ?", [randomBytes(32).toString("hex"), tarjetas[0].id]);
      tarjetas[0].activa = 1;
    }
    if (!tarjetas.length) {
      const tarjeta = { id: randomUUID(), token: randomBytes(32).toString("hex") };
      await conn.execute(
        "INSERT INTO lealtad_tarjetas (id, cliente_id, token) VALUES (?, ?, ?)",
        [tarjeta.id, cliente.id, tarjeta.token],
      );
      tarjetas = [tarjeta];
    }
    await conn.commit();
    transaccionActiva = false;

    const [filas] = await pool.execute(
      `SELECT c.nombre, t.sellos, t.premio_disponible, t.token, cfg.premio, cfg.visitas_meta
       FROM lealtad_tarjetas t
       JOIN clientes c ON CONVERT(c.id USING utf8mb4) COLLATE utf8mb4_unicode_ci = t.cliente_id COLLATE utf8mb4_unicode_ci
       JOIN lealtad_configuracion cfg ON cfg.id = 1
       WHERE t.id = ? AND t.activa = 1`,
      [tarjetas[0].id],
    );
    if (!filas.length) {
      throw new Error("No se pudo recuperar la tarjeta de lealtad creada.");
    }
    return mapTarjeta(filas[0]);
  } catch (error) {
    if (transaccionActiva) await conn.rollback();
    if (error.code === "ER_DUP_ENTRY") {
      throw new AppError("Ya existe una tarjeta de lealtad para este cliente.", 409);
    }
    throw error;
  } finally {
    conn.release();
  }
};

const obtenerTarjeta = async (token) => {
  await asegurarCamposPremio();
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/i.test(token)) {
    throw new AppError("El código de la tarjeta no es válido.", 400);
  }
  const [filas] = await pool.execute(
    `SELECT c.nombre, t.sellos, t.premio_disponible, t.token, cfg.premio, cfg.visitas_meta
     FROM lealtad_tarjetas t
     JOIN clientes c ON CONVERT(c.id USING utf8mb4) COLLATE utf8mb4_unicode_ci = t.cliente_id COLLATE utf8mb4_unicode_ci
     JOIN lealtad_configuracion cfg ON cfg.id = 1
     WHERE t.token = ? AND t.activa = 1`,
    [token],
  );
  if (!filas.length) throw new AppError("No se encontró la tarjeta.", 404);
  return mapTarjeta(filas[0]);
};

const registrarVisita = async ({ token, ordenId }) => {
  await asegurarCamposPremio();
  if (typeof ordenId !== "string" || !ordenId.trim()) {
    throw new AppError("No se indicó la orden entregada.", 400);
  }
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/i.test(token)) {
    throw new AppError("El código de la tarjeta no es válido.", 400);
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[orden]] = await conn.execute(
      `SELECT id, estado, codigo_pais, telefono
       FROM ordenes WHERE id = ? LIMIT 1 FOR UPDATE`,
      [ordenId],
    );
    if (!orden || !["entregado", "cerrada"].includes(orden.estado)) {
      throw new AppError("Solo se pueden marcar órdenes ya entregadas.", 409);
    }

    const [[tarjeta]] = await conn.execute(
      `SELECT t.id, t.cliente_id, t.sellos, t.premio_disponible,
              c.nombre, c.celular, cfg.premio, cfg.visitas_meta
       FROM lealtad_tarjetas t
       JOIN clientes c ON CONVERT(c.id USING utf8mb4) COLLATE utf8mb4_unicode_ci = t.cliente_id COLLATE utf8mb4_unicode_ci
       JOIN lealtad_configuracion cfg ON cfg.id = 1
       WHERE t.token = ? AND t.activa = 1 LIMIT 1 FOR UPDATE`,
      [token],
    );
    if (!tarjeta) throw new AppError("No se encontró la tarjeta de lealtad.", 404);
    if (!coincideTelefonoOrden(orden, tarjeta.celular)) {
      throw new AppError("La tarjeta no pertenece al cliente de esta orden.", 409);
    }
    const [visitasExistentes] = await conn.execute(
      "SELECT id FROM lealtad_visitas WHERE orden_id = ? LIMIT 1",
      [ordenId],
    );
    if (visitasExistentes.length) {
      throw new AppError("Esta orden ya registró su punto de lealtad.", 409);
    }
    if (tarjeta.premio_disponible) {
      throw new AppError("La tarjeta ya tiene un premio pendiente de canje.", 409);
    }

    const meta = Number(tarjeta.visitas_meta);
    const numeroSello = Math.min(meta, Number(tarjeta.sellos) + 1);
    await conn.execute(
      `INSERT INTO lealtad_visitas (id, tarjeta_id, cliente_id, orden_id, numero_sello)
       VALUES (?, ?, ?, ?, ?)`,
      [randomUUID(), tarjeta.id, tarjeta.cliente_id, ordenId, numeroSello],
    );
    await conn.execute(
      `UPDATE lealtad_tarjetas SET sellos = ?, premio_disponible = ?
       WHERE id = ?`,
      [numeroSello, numeroSello >= meta ? 1 : 0, tarjeta.id],
    );
    await conn.commit();
    return {
      nombre: tarjeta.nombre,
      sellos: numeroSello,
      meta,
      premioDisponible: numeroSello >= meta,
      premio: tarjeta.premio,
    };
  } catch (error) {
    await conn.rollback();
    if (error.code === "ER_DUP_ENTRY") {
      throw new AppError("Esta orden ya registró su punto de lealtad.", 409);
    }
    throw error;
  } finally {
    conn.release();
  }
};

const canjearPremio = async ({ token, ordenId }) => {
  await asegurarCamposPremio();
  if (typeof ordenId !== "string" || !ordenId.trim()) {
    throw new AppError("No se indicó la orden entregada.", 400);
  }
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/i.test(token)) {
    throw new AppError("El código de la tarjeta no es válido.", 400);
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[orden]] = await conn.execute(
      `SELECT id, estado, codigo_pais, telefono
       FROM ordenes WHERE id = ? LIMIT 1 FOR UPDATE`,
      [ordenId],
    );
    if (!orden || !["pendiente", "en_proceso", "listo", "entregado", "cerrada"].includes(orden.estado)) {
      throw new AppError("El premio se canjea al crear una orden válida del cliente.", 409);
    }

    const [[tarjeta]] = await conn.execute(
      `SELECT t.id, t.cliente_id, t.sellos, t.premio_disponible,
              c.nombre, c.celular, cfg.premio, cfg.visitas_meta
       FROM lealtad_tarjetas t
       JOIN clientes c ON CONVERT(c.id USING utf8mb4) COLLATE utf8mb4_unicode_ci = t.cliente_id COLLATE utf8mb4_unicode_ci
       JOIN lealtad_configuracion cfg ON cfg.id = 1
       WHERE t.token = ? AND t.activa = 1 LIMIT 1 FOR UPDATE`,
      [token],
    );
    if (!tarjeta) throw new AppError("No se encontró la tarjeta de lealtad.", 404);
    if (!coincideTelefonoOrden(orden, tarjeta.celular)) {
      throw new AppError("La tarjeta no pertenece al cliente de esta orden.", 409);
    }
    if (!tarjeta.premio_disponible || Number(tarjeta.sellos) < Number(tarjeta.visitas_meta)) {
      throw new AppError("Esta tarjeta todavía no tiene un premio disponible.", 409);
    }

    const [canjes] = await conn.execute(
      "SELECT id FROM lealtad_canjes WHERE orden_id = ? LIMIT 1",
      [ordenId],
    );
    if (canjes.length) {
      throw new AppError("Esta orden ya registró un canje de lealtad.", 409);
    }

    await conn.execute(
      `INSERT INTO lealtad_canjes (id, tarjeta_id, cliente_id, orden_id, premio)
       VALUES (?, ?, ?, ?, ?)`,
      [randomUUID(), tarjeta.id, tarjeta.cliente_id, ordenId, tarjeta.premio],
    );
    await conn.execute(
      "UPDATE lealtad_tarjetas SET sellos = 0, premio_disponible = 0 WHERE id = ?",
      [tarjeta.id],
    );
    await conn.commit();
    return {
      nombre: tarjeta.nombre,
      sellos: 0,
      meta: Number(tarjeta.visitas_meta),
      premioDisponible: false,
      premioCanjeado: true,
      premio: tarjeta.premio,
    };
  } catch (error) {
    await conn.rollback();
    if (error.code === "ER_DUP_ENTRY") {
      throw new AppError("Esta orden ya registró un canje de lealtad.", 409);
    }
    throw error;
  } finally {
    conn.release();
  }
};

const buscarTarjetaLealtadPorTelefono = async (telefono) => {
  await asegurarCamposPremio();
  const celular = normalizarTelefono(telefono);
  if (celular.length < 7 || celular.length > 20) throw new AppError("Ingresa un teléfono válido.", 400);
  const candidatos = new Set([celular]);
  if (celular.startsWith("503") && celular.length === 11) candidatos.add(celular.slice(3));
  else if (celular.length === 8) candidatos.add("503" + celular);
  const valores = [...candidatos];
  const [filas] = await pool.execute(
    `SELECT t.id AS tarjeta_id, t.token, t.sellos, t.premio_disponible,
            c.nombre, c.celular, cfg.premio, cfg.tipo_descuento, cfg.valor_descuento, cfg.visitas_meta
     FROM lealtad_tarjetas t
     JOIN clientes c ON CONVERT(c.id USING utf8mb4) COLLATE utf8mb4_unicode_ci = t.cliente_id COLLATE utf8mb4_unicode_ci
     JOIN lealtad_configuracion cfg ON cfg.id = 1
     WHERE t.activa = 1 AND c.celular IN (${valores.map(() => "?").join(",")}) LIMIT 2`, valores,
  );
  if (!filas.length) return null;
  if (filas.length > 1) throw new AppError("Hay varios clientes con ese teléfono. Revisa el directorio.", 409);
  const fila = filas[0];
  return { tarjetaId: fila.tarjeta_id, nombre: fila.nombre, telefono: fila.celular, token: fila.token,
    sellos: Number(fila.sellos), meta: Number(fila.visitas_meta), premioDisponible: Boolean(fila.premio_disponible), premio: fila.premio,
    tipoDescuento: fila.tipo_descuento, valorDescuento: Number(fila.valor_descuento) };
};

const listarTarjetas = async () => {
  await asegurarCamposPremio();
  const [filas] = await pool.query(
    `SELECT t.id AS tarjeta_id, c.nombre, c.celular, t.sellos,
            t.premio_disponible, cfg.premio, cfg.visitas_meta
     FROM lealtad_tarjetas t
     JOIN clientes c ON CONVERT(c.id USING utf8mb4) COLLATE utf8mb4_unicode_ci = t.cliente_id COLLATE utf8mb4_unicode_ci
     JOIN lealtad_configuracion cfg ON cfg.id = 1
     WHERE t.activa = 1
     ORDER BY c.nombre ASC`,
  );
  return filas.map((fila) => ({
    tarjetaId: fila.tarjeta_id,
    nombre: fila.nombre,
    telefono: fila.celular,
    sellos: Number(fila.sellos),
    meta: Number(fila.visitas_meta),
    premioDisponible: Boolean(fila.premio_disponible),
    premio: fila.premio,
  }));
};

const ajustarVisitas = async ({ tarjetaId, cambio }) => {
  await asegurarCamposPremio();
  if (typeof tarjetaId !== "string" || !tarjetaId.trim()) {
    throw new AppError("No se indicó la tarjeta de lealtad.", 400);
  }
  if (![1, -1].includes(Number(cambio))) {
    throw new AppError("El ajuste debe sumar o quitar una visita.", 400);
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[tarjeta]] = await conn.execute(
      `SELECT t.id, t.sellos, c.nombre, cfg.premio, cfg.visitas_meta
       FROM lealtad_tarjetas t
       JOIN clientes c ON CONVERT(c.id USING utf8mb4) COLLATE utf8mb4_unicode_ci = t.cliente_id COLLATE utf8mb4_unicode_ci
       JOIN lealtad_configuracion cfg ON cfg.id = 1
       WHERE t.id = ? AND t.activa = 1 LIMIT 1 FOR UPDATE`,
      [tarjetaId],
    );
    if (!tarjeta) throw new AppError("No se encontró la tarjeta de lealtad.", 404);
    const sellos = Number(tarjeta.sellos) + Number(cambio);
    const meta = Number(tarjeta.visitas_meta);
    if (sellos < 0 || sellos > meta) {
      throw new AppError(sellos < 0 ? "La tarjeta ya tiene cero visitas." : `La tarjeta ya completó las ${meta} visitas.`, 409);
    }
    await conn.execute(
      "UPDATE lealtad_tarjetas SET sellos = ?, premio_disponible = ? WHERE id = ?",
      [sellos, sellos >= meta ? 1 : 0, tarjeta.id],
    );
    await conn.commit();
    return {
      tarjetaId: tarjeta.id,
      nombre: tarjeta.nombre,
      sellos,
      meta,
      premioDisponible: sellos >= meta,
      premio: tarjeta.premio,
    };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

const desactivarTarjeta = async (tarjetaId) => {
  await asegurarCamposPremio();
  if (typeof tarjetaId !== "string" || !tarjetaId.trim()) throw new AppError("No se indicó la tarjeta de lealtad.", 400);
  const [resultado] = await pool.execute("UPDATE lealtad_tarjetas SET activa = 0, sellos = 0, premio_disponible = 0, token = ? WHERE id = ? AND activa = 1", [randomBytes(32).toString("hex"), tarjetaId]);
  if (!resultado.affectedRows) throw new AppError("No se encontró una tarjeta activa de lealtad.", 404);
  return { tarjetaId, removida: true };
};

module.exports = {
  obtenerConfiguracion,
  actualizarPremio,
  solicitarCodigo,
  cancelarSolicitudCodigo,
  verificarCodigoYRegistrarTarjeta,
  obtenerTarjeta,
  registrarVisita,
  buscarTarjetaLealtadPorTelefono,
  canjearPremio,
  listarTarjetas,
  ajustarVisitas,
  desactivarTarjeta,
};
