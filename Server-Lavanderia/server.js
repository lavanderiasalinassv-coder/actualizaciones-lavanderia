const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const { execFile } = require("child_process");
const mysql = require("mysql2/promise");
const { pool } = require("./database/MySQLConexion");
const {
  DEFAULT_DATABASE_CONFIG,
  leerConfiguracionBaseDatos,
  validarConfiguracionBaseDatos,
  guardarConfiguracionBaseDatos,
} = require("./database/databaseConfig");
const {
  obtenerTablas,
  crearRespaldo,
  getBackupDirectory,
} = require("./database/backup");
const equipoRoutes = require("./routes/equipo.routes");
const promocionesRoutes = require("./routes/promociones.routes");
const catalogo = require("./routes/catalogo.routes");
const inventario = require("./routes/inventario.routes");
const horarios = require("./routes/horarios.routes");
const turno = require("./routes/turno.routes");
const ordenes = require("./routes/orden.routes");
const tareas = require("./routes/tareas.routes");
const apariencia = require("./routes/apariencia.routes");
const uploads = require("./routes/uploads.routes");
const movimientosCaja = require("./routes/movimientosCaja.routes");
const cierresCaja = require("./routes/cierresCaja.routes");
const clientes = require("./routes/clientes.routes");
const auth2faRoutes = require("./routes/auth2fa.routes");
const correoRoutes = require("./routes/correo.routes");
const mantenimientoRoutes = require("./routes/mantenimiento.routes");
const ayudaIARoutes = require("./routes/ayudaIA.routes");
const saliConocimientoRoutes = require("./routes/saliConocimiento.routes");
const notificacionesRoutes = require("./routes/notificaciones.routes");
const ttsRoutes = require("./routes/tts.routes");
const speechRoutes = require("./routes/speech.routes");
const RESOURCES_PATH = process.env.RESOURCES_PATH;
const EMPAQUETADO = !!RESOURCES_PATH;

const FRONTEND_DIST_PATH = EMPAQUETADO
  ? path.join(RESOURCES_PATH, "backend", "frontend", "dist")
  : path.join(__dirname, "..", "lavanderia-salinas", "dist");

const LOGO_PATH = path.join(FRONTEND_DIST_PATH, "logo.jpg");

async function migratePaymentColumns() {
  try {
    console.log("Verificando migración de columnas de pago...");

    const [columns] = await pool.execute(
      "SHOW COLUMNS FROM ordenes LIKE 'tarjeta_monto'",
    );

    if (columns.length > 0) {
      console.log("✓ Las columnas de pago ya existen en la tabla.");
      return;
    }

    console.log("Agregando columnas de pago a la tabla ordenes...");

    await pool.execute(`
      ALTER TABLE ordenes
      ADD COLUMN tarjeta_monto DECIMAL(12,2) NULL COMMENT 'Monto pagado con tarjeta',
      ADD COLUMN tarjeta_referencia VARCHAR(50) NULL COMMENT 'Número de referencia del POS'
    `);

    console.log("✓ Columnas de tarjeta agregadas.");

    await pool.execute(`
      ALTER TABLE ordenes
      ADD COLUMN transferencia_monto DECIMAL(12,2) NULL COMMENT 'Monto pagado por transferencia',
      ADD COLUMN transferencia_comprobante TEXT NULL COMMENT 'URL del comprobante de transferencia'
    `);

    console.log("✓ Columnas de transferencia agregadas.");

    await pool.execute(`
      CREATE INDEX idx_ordenes_tarjeta_referencia ON ordenes(tarjeta_referencia)
    `);

    await pool.execute(`
      CREATE INDEX idx_ordenes_transferencia_monto ON ordenes(transferencia_monto)
    `);

    console.log("✓ Índices creados.");
    console.log("✅ Migración de columnas de pago completada.");
  } catch (error) {
    if (error.code === "ER_DUP_FIELDNAME") {
      console.log("✓ Las columnas de pago ya existen (se ignoró duplicación).");
    } else {
      console.error("Error durante la migración:", error.message);
    }
  }
}

async function migrateDireccionEntrega() {
  try {
    const [columns] = await pool.execute(
      "SHOW COLUMNS FROM ordenes LIKE 'direccion_entrega'",
    );
    if (columns.length === 0) {
      await pool.execute(
        "ALTER TABLE ordenes ADD COLUMN direccion_entrega TEXT NULL AFTER envio_domicilio",
      );
      console.log("Direccion de entrega agregada a ordenes.");
    }
  } catch (error) {
    console.error(
      "Error durante la migracion de direccion de entrega:",
      error.message,
    );
  }
}

async function migrateCatalogoClasificacionPrendas() {
  try {
    const [columns] = await pool.execute(
      "SHOW COLUMNS FROM catalogo_items LIKE 'clasificacion_prendas'",
    );
    if (columns.length === 0) {
      await pool.execute(
        "ALTER TABLE catalogo_items ADD COLUMN clasificacion_prendas ENUM('por_prenda', 'extra') NOT NULL DEFAULT 'por_prenda' AFTER unidad",
      );
      console.log("Clasificación de prendas agregada al catálogo.");
    }
  } catch (error) {
    console.error(
      "Error durante la migración de clasificación de prendas:",
      error.message,
    );
  }
}

async function migrateOrdenMovimientosAuditoria() {
  try {
    const [columns] = await pool.execute("SHOW COLUMNS FROM orden_movimientos");
    const nombresColumnas = new Set(columns.map((column) => column.Field));

    if (!nombresColumnas.has("usuario_id")) {
      await pool.execute(
        "ALTER TABLE orden_movimientos ADD COLUMN usuario_id CHAR(36) NULL AFTER texto",
      );
    }

    if (!nombresColumnas.has("usuario_nombre")) {
      await pool.execute(
        "ALTER TABLE orden_movimientos ADD COLUMN usuario_nombre VARCHAR(150) NOT NULL DEFAULT 'Sistema' AFTER usuario_id",
      );
    }

    const [indices] = await pool.execute(
      "SHOW INDEX FROM orden_movimientos WHERE Key_name = ?",
      ["idx_orden_movimientos_usuario"],
    );
    if (indices.length === 0) {
      await pool.execute(
        "CREATE INDEX idx_orden_movimientos_usuario ON orden_movimientos(usuario_id)",
      );
    }

    await pool.execute(
      "ALTER TABLE orden_movimientos CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
    );

    await pool.execute(
      "ALTER TABLE ordenes CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
    );

    console.log("✓ Auditoría de movimientos de órdenes verificada.");
  } catch (error) {
    console.error(
      "Error durante la migración de auditoría de movimientos:",
      error.message,
    );
  }
}

async function migrateUnidadesMedida() {
  console.log("Verificando unidades de medida...");
  const unidadesInventario = [
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
  const unidadesCatalogo = [
    "kilo",
    "libra",
    "pieza",
    "m2",
    "galon",
    "mililitro",
    "otro",
  ];

  const actualizarEnum = async (tabla, columna, unidades) => {
    const [columnas] = await pool.query(`SHOW COLUMNS FROM ${tabla} LIKE ?`, [
      columna,
    ]);
    if (!columnas.length || !String(columnas[0].Type).startsWith("enum("))
      return;

    const actuales =
      String(columnas[0].Type)
        .match(/'([^']+)'/g)
        ?.map((valor) => valor.slice(1, -1)) ?? [];
    const valores = [...new Set([...actuales, ...unidades])];
    if (valores.length === actuales.length) return;

    const valoresSql = valores.map((valor) => `'${valor}'`).join(",");
    await pool.query(
      `ALTER TABLE ${tabla} MODIFY COLUMN ${columna} ENUM(${valoresSql}) NOT NULL DEFAULT 'pieza'`,
    );
    console.log(`✓ Unidades actualizadas en ${tabla}.${columna}`);
  };

  await actualizarEnum(
    "inventario_productos",
    "unidad_medida",
    unidadesInventario,
  );
  await actualizarEnum("catalogo_items", "unidad", unidadesCatalogo);
}

async function migratePrecisionInventario() {
  try {
    const [columnas] = await pool.query(
      "SHOW COLUMNS FROM inventario_productos LIKE 'cantidad'",
    );
    if (
      columnas.length &&
      String(columnas[0].Type).toLowerCase() !== "decimal(14,6)"
    ) {
      await pool.query(
        "ALTER TABLE inventario_productos MODIFY COLUMN cantidad DECIMAL(14,6) NOT NULL DEFAULT '0.000000'",
      );
      console.log("✓ Precisión de cantidades de inventario actualizada.");
    }
  } catch (error) {
    console.error(
      "Error durante la migración de precisión del inventario:",
      error.message,
    );
  }
}

// Ejecutar migración de estado 'listo' al iniciar
async function migrateEstadoListo() {
  try {
    console.log('Verificando migración de estado "listo"...');

    const [columns] = await pool.execute(
      "SHOW COLUMNS FROM ordenes WHERE Field = 'estado'",
    );

    if (columns.length > 0) {
      const tipo = columns[0].Type;
      if (tipo.includes("listo")) {
        console.log('✓ El estado "listo" ya existe en la tabla.');
        return;
      }
    }

    console.log("Actualizando datos existentes antes de modificar el ENUM...");

    const [estadosActuales] = await pool.execute(
      "SELECT DISTINCT estado FROM ordenes",
    );
    console.log(
      "Estados actuales en la tabla:",
      estadosActuales.map((r) => r.estado),
    );

    try {
      await pool.execute(`
        UPDATE ordenes SET estado = 'en_proceso' WHERE estado = 'terminado'
      `);
      console.log(
        '✓ Registros con estado "terminado" actualizados a "en_proceso".',
      );
    } catch (updateError) {
      console.log(
        'No se pudieron actualizar registros con estado "terminado":',
        updateError.message,
      );
      console.log("Intentando actualizar registros individualmente...");
      try {
        const [terminados] = await pool.execute(
          "SELECT id FROM ordenes WHERE estado = 'terminado'",
        );
        for (const row of terminados) {
          await pool.execute(
            "UPDATE ordenes SET estado = 'en_proceso' WHERE id = ?",
            [row.id],
          );
        }
        console.log(
          `✓ ${terminados.length} registros actualizados individualmente.`,
        );
      } catch (individualError) {
        console.log(
          "Error en actualización individual:",
          individualError.message,
        );
      }
    }

    const [estadosDespues] = await pool.execute(
      "SELECT DISTINCT estado FROM ordenes",
    );
    console.log(
      "Estados después del UPDATE:",
      estadosDespues.map((r) => r.estado),
    );

    console.log('Agregando estado "listo" a la tabla ordenes...');

    await pool.execute(`
      ALTER TABLE ordenes
      MODIFY COLUMN estado ENUM('pendiente', 'en_proceso', 'listo', 'entregado', 'cancelada') NOT NULL DEFAULT 'pendiente'
    `);

    console.log('✓ Estado "listo" agregado.');
    console.log('✅ Migración de estado "listo" completada.');
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      console.log('✓ El estado "listo" ya existe (se ignoró duplicación).');
    } else {
      console.error("Error durante la migración de estado:", error.message);
      console.log("Intentando aproximación alternativa...");
      try {
        await pool.execute(
          "UPDATE ordenes SET estado = 'en_proceso' WHERE estado = 'terminado'",
        );
        console.log(
          '✓ Registros con estado "terminado" actualizados a "en_proceso" (método alternativo).',
        );

        await pool.execute(`
          ALTER TABLE ordenes
          MODIFY COLUMN estado ENUM('pendiente', 'en_proceso', 'listo', 'entregado', 'cancelada') NOT NULL DEFAULT 'pendiente'
        `);
        console.log('✓ Estado "listo" agregado (método alternativo).');
        console.log(
          '✅ Migración de estado "listo" completada (método alternativo).',
        );
      } catch (altError) {
        console.error("Error en método alternativo:", altError.message);
      }
    }
  }
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/factura/logo.jpg", (_req, res) => {
  res.sendFile(LOGO_PATH, (err) => {
    if (err) {
      console.error("No se pudo servir el logo desde:", LOGO_PATH, err.message);
      res.status(404).send("Logo no encontrado");
    }
  });
});

app.use("/api", equipoRoutes);
app.use("/api", promocionesRoutes);
app.use("/api", catalogo);
app.use("/api", inventario);
app.use("/api", horarios);
app.use("/api", turno);
app.use("/api/ordenes", ordenes);
app.use("/api/tareas", tareas);
app.use("/api", apariencia);
app.use("/api", uploads);
app.use("/api", movimientosCaja);
app.use("/api", cierresCaja);
app.use("/api", clientes);
app.use("/api/auth2fa", auth2faRoutes);
app.use("/api/correo", correoRoutes);
app.use("/api/mantenimiento", mantenimientoRoutes);
app.use("/api", ayudaIARoutes);
app.use("/api", saliConocimientoRoutes);
app.use("/api", notificacionesRoutes);
app.use("/api", ttsRoutes);
app.use("/api", speechRoutes);
app.get("/api/database-config", (_req, res) => {
  res.json(leerConfiguracionBaseDatos());
});
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});

app.get("/api/database-config/defaults", (_req, res) => {
  res.json(DEFAULT_DATABASE_CONFIG);
});

app.post("/api/database-config/test", async (req, res) => {
  let conexion;
  try {
    const configuracion = validarConfiguracionBaseDatos(req.body);
    conexion = await mysql.createConnection({
      ...configuracion,
      connectTimeout: 5000,
      charset: "latin1",
      collation: "latin1_swedish_ci",
    });
    res.json({ ok: true, message: "La conexión fue exitosa." });
  } catch (error) {
    res
      .status(400)
      .json({ ok: false, message: error.message || "No se pudo conectar." });
  } finally {
    if (conexion) await conexion.end().catch(() => {});
  }
});

app.put("/api/database-config", (req, res) => {
  try {
    guardarConfiguracionBaseDatos(req.body);
    res.json({ ok: true, requiresRestart: true });
  } catch (error) {
    res
      .status(400)
      .json({ ok: false, message: error.message || "No se pudo guardar." });
  }
});

app.get("/api/backups/tables", async (_req, res) => {
  try {
    res.json({
      tablas: await obtenerTablas(pool),
      directorio: getBackupDirectory(),
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: error.message || "No se pudieron cargar las tablas." });
  }
});

app.post("/api/backups", async (_req, res) => {
  try {
    const respaldo = await crearRespaldo(pool);
    res.json({ ok: true, ...respaldo });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error.message || "No se pudo crear el respaldo.",
    });
  }
});

app.post("/api/backups/open", (_req, res) => {
  const directorio = getBackupDirectory();
  fs.mkdirSync(directorio, { recursive: true });
  const comando =
    process.platform === "win32"
      ? "explorer.exe"
      : process.platform === "darwin"
        ? "open"
        : "xdg-open";
  execFile(comando, [directorio], (error) => {
    if (error)
      return res
        .status(500)
        .json({ message: "No se pudo abrir la carpeta del respaldo." });
    return res.json({ ok: true });
  });
});

app.get("/test-db", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT NOW() AS hora_actual");
    res.json({
      mensaje: "¡Conexión a la base de datos funcionando correctamente!",
      resultado: rows[0],
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al consultar la base de datos",
      detalles: error.message,
    });
  }
});

// ───────────── Servir el frontend compilado (SIEMPRE al final,
// después de /api y /test-db, para no interceptar esas rutas) ─────────────
if (fs.existsSync(FRONTEND_DIST_PATH)) {
  app.use(express.static(FRONTEND_DIST_PATH));

  app.get("/{*splat}", (req, res) => {
    res.sendFile(path.join(FRONTEND_DIST_PATH, "index.html"));
  });

  console.log(`✓ Sirviendo frontend desde: ${FRONTEND_DIST_PATH}`);
} else {
  // Esto es normal en desarrollo si usas Vite aparte (npm run dev del frontend).
  app.get("/", (req, res) => {
    res.send("🚀 Servidor Express corriendo y listo.");
  });
  console.log(
    `⚠ No se encontró build del frontend en ${FRONTEND_DIST_PATH} (modo dev con Vite, es normal).`,
  );
}

async function migrateHorasAjustadas() {
  try {
    const [columns] = await pool.execute(
      "SHOW COLUMNS FROM horarios_registros LIKE 'horas_ajustadas'",
    );
    if (columns.length === 0) {
      await pool.execute(
        "ALTER TABLE horarios_registros ADD COLUMN horas_ajustadas DECIMAL(6,2) NULL AFTER pagado",
      );
      console.log("✓ Columna horas_ajustadas agregada.");
    }
  } catch (error) {
    console.error("No se pudo migrar horas_ajustadas:", error.message);
  }
}

async function migratePerfilImagen() {
  try {
    const [columns] = await pool.execute(
      "SHOW COLUMNS FROM usuarios_equipo LIKE 'imagen_perfil'",
    );
    if (columns.length === 0) {
      await pool.execute(
        "ALTER TABLE usuarios_equipo ADD COLUMN imagen_perfil LONGTEXT NULL, ADD COLUMN cambios_imagen_perfil TINYINT UNSIGNED NOT NULL DEFAULT 0",
      );
      console.log("✓ Columnas de imagen de perfil agregadas.");
    }
  } catch (error) {
    console.error("No se pudo migrar imagen de perfil:", error.message);
  }
}

async function migrateNotificaciones() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notificaciones (
        id CHAR(36) NOT NULL,
        tipo ENUM('aviso', 'problema') NOT NULL,
        destinatario_id CHAR(36) NULL,
        destinatario_rol VARCHAR(40) NULL,
        autor_id CHAR(36) NULL,
        autor_nombre VARCHAR(150) NOT NULL,
        titulo VARCHAR(180) NOT NULL,
        mensaje TEXT NOT NULL,
        tema VARCHAR(180) NULL,
        detalles TEXT NULL,
        estado ENUM('pendiente', 'en_proceso', 'resuelto') NULL,
        leida TINYINT(1) NOT NULL DEFAULT 0,
        fecha_resolucion DATETIME NULL,
        creada_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        INDEX idx_notificaciones_destinatario (destinatario_id, leida, creada_at),
        INDEX idx_notificaciones_tipo_estado (tipo, estado, creada_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notificaciones_lecturas (
        notificacion_id CHAR(36) NOT NULL,
        usuario_id CHAR(36) NOT NULL,
        leida TINYINT(1) NOT NULL DEFAULT 1,
        leida_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (notificacion_id, usuario_id),
        INDEX idx_notificaciones_lecturas_usuario (usuario_id, leida)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✓ Tabla notificaciones verificada.");
  } catch (error) {
    console.error("No se pudo migrar notificaciones:", error.message);
  }
}

app.listen(PORT, async () => {
  console.log(`=========================================================`);
  console.log(`📡 Servidor ejecutándose`);
  console.log(`=========================================================`);

  await migratePaymentColumns();
  await migrateDireccionEntrega();
  await migrateCatalogoClasificacionPrendas();
  await migrateUnidadesMedida();
  await migratePrecisionInventario();
  await migrateEstadoListo();
  await migrateOrdenMovimientosAuditoria();
  await migrateHorasAjustadas();
  await migratePerfilImagen();
  await migrateNotificaciones();
});
