const { randomUUID } = require("crypto");
const { pool } = require("../database/MySQLConexion");
const { AppError } = require("../utils/errors");

/* ───────────────── Helpers de mapeo ───────────────── */

const parsearJSON = (valor, porDefecto) => {
  if (valor == null) return porDefecto;
  if (typeof valor !== "string") return valor;
  try {
    return JSON.parse(valor);
  } catch {
    return porDefecto;
  }
};

const soloFecha = (valor) => {
  if (!valor) return null;
  const d = valor instanceof Date ? valor : new Date(valor);
  return d.toISOString().slice(0, 10);
};

const mapRegistro = (row) => ({
  id: row.id,
  empleadoId: row.empleado_id,
  fecha: soloFecha(row.fecha),
  horaEntrada: row.hora_entrada
    ? new Date(row.hora_entrada).toISOString()
    : null,
  horaSalida: row.hora_salida ? new Date(row.hora_salida).toISOString() : null,
  pagado: !!row.pagado,
  horasAjustadas:
    row.horas_ajustadas === null || row.horas_ajustadas === undefined
      ? undefined
      : Number(row.horas_ajustadas),
  salidaAutomatica: !!row.salida_automatica,
  segmentos: parsearJSON(row.segmentos, []),
});

const mapTurno = (row) => ({
  id: row.id,
  empleadoId: row.empleado_id,
  fecha: soloFecha(row.fecha),
  horaInicio: row.hora_inicio,
  horaFin: row.hora_fin,
  nota: row.nota ?? undefined,
  libre: !!row.libre,
  horaAlmuerzoInicio: row.hora_almuerzo_inicio,
  horaAlmuerzoFin: row.hora_almuerzo_fin,
  horasExtra: !!row.horas_extra,
});

const mapPago = (row) => ({
  id: row.id,
  empleadoId: row.empleado_id,
  fecha: new Date(row.fecha).toISOString(),
  monto: Number(row.monto),
  horas: Number(row.horas),
  registrosIds: parsearJSON(row.registros_ids, []),
});

const mapNotificacion = (row) => ({
  id: row.id,
  destinatario: row.destinatario,
  empleadoId: row.empleado_id,
  empleadoNombre: row.empleado_nombre,
  tipo: row.tipo,
  fecha: soloFecha(row.fecha),
  hora: row.hora,
  mensaje: row.mensaje,
  minutos: row.minutos ?? undefined,
  leida: !!row.leida,
  creadaAt: new Date(row.creada_at).toISOString(),
});

/* ───────────────── Estado completo (carga inicial) ───────────────── */

const obtenerEstado = async () => {
  const [registros] = await pool.query("SELECT * FROM horarios_registros");
  const [turnos] = await pool.query("SELECT * FROM horarios_turnos");
  const [pagos] = await pool.query(
    "SELECT * FROM horarios_pagos ORDER BY fecha DESC",
  );
  const [notificaciones] = await pool.query(
    "SELECT * FROM horarios_notificaciones ORDER BY creada_at DESC",
  );
  const [pagoPorHoraRows] = await pool.query(
    "SELECT empleado_id, monto FROM horarios_pago_por_hora",
  );
  const [configRows] = await pool.query(
    "SELECT periodo_pago FROM horarios_config WHERE id = 1",
  );

  const pagoPorHora = {};
  pagoPorHoraRows.forEach((row) => {
    pagoPorHora[row.empleado_id] = Number(row.monto);
  });

  return {
    registros: registros.map(mapRegistro),
    turnos: turnos.map(mapTurno),
    pagos: pagos.map(mapPago),
    notificaciones: notificaciones.map(mapNotificacion),
    pagoPorHora,
    periodoPago: configRows[0]?.periodo_pago ?? "semanal",
  };
};

/* ───────────────── Reemplazo total por recurso ─────────────────
   Mismo patrón que localStorage: cada guardado sustituye TODO el
   arreglo. Se usa transacción para no dejar datos a medias. */

const reemplazarRegistros = async (registros) => {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    await conexion.query("DELETE FROM horarios_registros");

    for (const r of registros) {
      await conexion.query(
        `INSERT INTO horarios_registros
          (id, empleado_id, fecha, hora_entrada, hora_salida, pagado, horas_ajustadas, salida_automatica, segmentos)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          r.id ?? randomUUID(),
          r.empleadoId,
          r.fecha,
          r.horaEntrada ? new Date(r.horaEntrada) : null,
          r.horaSalida ? new Date(r.horaSalida) : null,
          r.pagado ? 1 : 0,
          typeof r.horasAjustadas === "number" &&
          Number.isFinite(r.horasAjustadas)
            ? Math.max(0, r.horasAjustadas)
            : null,
          r.salidaAutomatica ? 1 : 0,
          JSON.stringify(r.segmentos ?? []),
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

  return registros;
};

const reemplazarTurnos = async (turnos) => {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    await conexion.query("DELETE FROM horarios_turnos");

    for (const t of turnos) {
      await conexion.query(
        `INSERT INTO horarios_turnos
          (id, empleado_id, fecha, hora_inicio, hora_fin, nota, libre, hora_almuerzo_inicio, hora_almuerzo_fin, horas_extra)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          t.id ?? randomUUID(),
          t.empleadoId,
          t.fecha,
          t.horaInicio,
          t.horaFin,
          t.nota ?? null,
          t.libre ? 1 : 0,
          t.horaAlmuerzoInicio ?? null,
          t.horaAlmuerzoFin ?? null,
          t.horasExtra ? 1 : 0,
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

  return turnos;
};

const eliminarTurnoPorId = async (id) => {
  const [resultado] = await pool.query(
    "DELETE FROM horarios_turnos WHERE id = ?",
    [id],
  );
  return resultado.affectedRows > 0;
};

const reemplazarPagos = async (pagos) => {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    await conexion.query("DELETE FROM horarios_pagos");

    for (const p of pagos) {
      await conexion.query(
        `INSERT INTO horarios_pagos (id, empleado_id, fecha, monto, horas, registros_ids)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          p.id ?? randomUUID(),
          p.empleadoId,
          new Date(p.fecha),
          p.monto,
          p.horas,
          JSON.stringify(p.registrosIds ?? []),
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

  return pagos;
};

const reemplazarNotificaciones = async (notificaciones) => {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    await conexion.query("DELETE FROM horarios_notificaciones");

    for (const n of notificaciones) {
      await conexion.query(
        `INSERT INTO horarios_notificaciones
          (id, destinatario, empleado_id, empleado_nombre, tipo, fecha, hora, mensaje, minutos, leida, creada_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          n.id ?? randomUUID(),
          n.destinatario,
          n.empleadoId,
          n.empleadoNombre,
          n.tipo,
          n.fecha,
          n.hora,
          n.mensaje,
          n.minutos ?? null,
          n.leida ? 1 : 0,
          new Date(n.creadaAt),
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

  return notificaciones;
};

const reemplazarPagoPorHora = async (pagoPorHora) => {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    await conexion.query("DELETE FROM horarios_pago_por_hora");

    for (const [empleadoId, monto] of Object.entries(pagoPorHora ?? {})) {
      await conexion.query(
        "INSERT INTO horarios_pago_por_hora (empleado_id, monto) VALUES (?, ?)",
        [empleadoId, Number(monto) || 0],
      );
    }

    await conexion.commit();
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }

  return pagoPorHora;
};

const actualizarPeriodoPago = async (periodo) => {
  if (!["semanal", "quincenal"].includes(periodo)) {
    throw new AppError("Periodo de pago inválido.", 400);
  }
  await pool.query("UPDATE horarios_config SET periodo_pago = ? WHERE id = 1", [
    periodo,
  ]);
  return periodo;
};

const obtenerTurnoDeFecha = async (empleadoId, fecha) => {
  const [rows] = await pool.query(
    "SELECT hora_inicio, hora_fin, libre, horas_extra FROM horarios_turnos WHERE empleado_id = ? AND fecha = ? LIMIT 1",
    [empleadoId, fecha],
  );

  if (!rows.length) return null;

  const row = rows[0];
  return {
    horaInicio: row.hora_inicio,
    horaFin: row.hora_fin,
    libre: !!row.libre,
    horasExtra: !!row.horas_extra,
  };
};
module.exports = {
  obtenerEstado,
  reemplazarRegistros,
  reemplazarTurnos,
  eliminarTurnoPorId,
  reemplazarPagos,
  reemplazarNotificaciones,
  reemplazarPagoPorHora,
  actualizarPeriodoPago,
  obtenerTurnoDeFecha,
};
