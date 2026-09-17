-- Tabla para almacenar códigos de recuperación de PIN
CREATE TABLE IF NOT EXISTS codigos_recuperacion (
  id CHAR(36) PRIMARY KEY,
  usuario_id CHAR(36) NOT NULL,
  codigo VARCHAR(6) NOT NULL,
  expiracion DATETIME NOT NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_usuario_codigo (usuario_id, codigo)
);

-- Índice para limpieza automática de códigos expirados
CREATE INDEX idx_expiracion ON codigos_recuperacion(expiracion);