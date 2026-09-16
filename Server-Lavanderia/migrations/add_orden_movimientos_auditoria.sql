-- Auditoría de movimientos de órdenes.
-- Ejecutar después de crear la tabla orden_movimientos.
ALTER TABLE orden_movimientos
  ADD COLUMN IF NOT EXISTS usuario_id CHAR(36) NULL AFTER texto,
  ADD COLUMN IF NOT EXISTS usuario_nombre VARCHAR(150) NOT NULL DEFAULT 'Sistema' AFTER usuario_id;

SET @indice_usuario_existe := (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'orden_movimientos'
    AND index_name = 'idx_orden_movimientos_usuario'
);

SET @sql_indice_usuario := IF(
  @indice_usuario_existe = 0,
  'CREATE INDEX idx_orden_movimientos_usuario ON orden_movimientos(usuario_id)',
  'SELECT 1'
);

PREPARE sentencia_indice_usuario FROM @sql_indice_usuario;
EXECUTE sentencia_indice_usuario;
DEALLOCATE PREPARE sentencia_indice_usuario;
