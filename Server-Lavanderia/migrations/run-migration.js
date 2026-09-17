const fs = require('fs');
const path = require('path');
const { pool } = require('../database/MySQLConexion');

async function ejecutarMigracion() {
  try {
    console.log('🔄 Iniciando migración de códigos de recuperación...');

    // Leer el script SQL
    const sqlPath = path.join(__dirname, 'create_codigos_recuperacion.sql');
    const sqlScript = fs.readFileSync(sqlPath, 'utf8');

    // Dividir el script en sentencias individuales
    const statements = sqlScript
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Ejecutando ${statements.length} sentencias SQL...`);

    for (const statement of statements) {
      try {
        await pool.query(statement);
        console.log(`✅ Ejecutado: ${statement.substring(0, 50)}...`);
      } catch (error) {
        // Si el error es que la tabla ya existe, continuar
        if (error.code === 'ER_TABLE_EXISTS_ERROR') {
          console.log(`⚠️  Tabla ya existe, continuando...`);
        } else {
          throw error;
        }
      }
    }

    console.log('✅ Migración completada exitosamente!');
    console.log('📊 Tabla "codigos_recuperacion" creada correctamente.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error al ejecutar migración:', error.message);
    process.exit(1);
  }
}

ejecutarMigracion();