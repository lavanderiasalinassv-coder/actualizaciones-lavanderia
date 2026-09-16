const mysql = require('mysql2/promise');

async function migratePaymentColumns() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // Cambia esto si tu MySQL tiene contraseña
    database: 'lavanderia_salinas'
  });

  try {
    console.log('Verificando estructura de la tabla ordenes...');

    // Verificar si las columnas ya existen
    const [columns] = await connection.execute(
      "SHOW COLUMNS FROM ordenes LIKE 'tarjeta_monto'"
    );

    if (columns.length > 0) {
      console.log('Las columnas de pago ya existen en la tabla.');
      return;
    }

    console.log('Agregando columnas de pago a la tabla ordenes...');

    // Agregar columnas para pagos con tarjeta
    await connection.execute(`
      ALTER TABLE ordenes 
      ADD COLUMN tarjeta_monto DECIMAL(12,2) NULL COMMENT 'Monto pagado con tarjeta',
      ADD COLUMN tarjeta_referencia VARCHAR(50) NULL COMMENT 'Número de referencia del POS'
    `);

    console.log('Columnas de tarjeta agregadas exitosamente.');

    // Agregar columnas para pagos por transferencia
    await connection.execute(`
      ALTER TABLE ordenes 
      ADD COLUMN transferencia_monto DECIMAL(12,2) NULL COMMENT 'Monto pagado por transferencia',
      ADD COLUMN transferencia_comprobante TEXT NULL COMMENT 'URL del comprobante de transferencia'
    `);

    console.log('Columnas de transferencia agregadas exitosamente.');

    // Crear índices
    await connection.execute(`
      CREATE INDEX idx_ordenes_tarjeta_referencia ON ordenes(tarjeta_referencia)
    `);

    await connection.execute(`
      CREATE INDEX idx_ordenes_transferencia_monto ON ordenes(transferencia_monto)
    `);

    console.log('Índices creados exitosamente.');
    console.log('✅ Migración completada exitosamente.');

  } catch (error) {
    console.error('Error durante la migración:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

migratePaymentColumns()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
