const { pool } = require("../database/MySQLConexion");

const TABLAS_POR_GRUPO = Object.freeze({
  ordenes: [
    "orden_item_insumos",
    "orden_anticipos",
    "orden_cargos_extra",
    "orden_fotos",
    "orden_movimientos",
    "orden_items",
    "ordenes",
  ],
  caja: ["movimientos_caja", "cierres_caja", "turnos_historial"],
  cierres: ["cierres_caja", "turnos_historial"],
  depositos: ["movimientos_caja"],
  horarios: [
    "horarios_registros",
    "horarios_pagos",
    "horarios_turnos",
    "horarios_notificaciones",
    "horarios_pago_por_hora",
  ],
  // Se eliminan primero las lecturas para respetar la relación con los avisos.
  notificaciones: ["notificaciones_lecturas", "notificaciones"],
  tareas: ["tareas"],
  clientes: ["clientes"],
  seguridad: ["codigos_2fa"],
});

const limpiarTablas = async (grupos) => {
  const tablas = [
    ...new Set(grupos.flatMap((grupo) => TABLAS_POR_GRUPO[grupo] || [])),
  ];
  if (tablas.length === 0) {
    const error = new Error("Selecciona al menos un grupo de datos.");
    error.statusCode = 400;
    throw error;
  }

  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    await conexion.query("SET FOREIGN_KEY_CHECKS = 0");
    for (const tabla of tablas) {
      if (
        tabla === "movimientos_caja" &&
        grupos.includes("depositos") &&
        !grupos.includes("caja")
      ) {
        await conexion.query(
          "DELETE FROM `movimientos_caja` WHERE tipo = 'deposito'",
        );
      } else {
        await conexion.query(`DELETE FROM \`${tabla}\``);
      }
    }
    await conexion.query("SET FOREIGN_KEY_CHECKS = 1");
    await conexion.commit();
    return { grupos, tablas, cantidadTablas: tablas.length };
  } catch (error) {
    await conexion.rollback();
    try {
      await conexion.query("SET FOREIGN_KEY_CHECKS = 1");
    } catch {
      // La conexión se liberará y MySQL restablecerá la sesión.
    }
    throw error;
  } finally {
    conexion.release();
  }
};

module.exports = { TABLAS_POR_GRUPO, limpiarTablas };
