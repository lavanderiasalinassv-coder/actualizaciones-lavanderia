-- Script para agregar tabla de códigos 2FA
CREATE TABLE IF NOT EXISTS codigos_2fa (
  id CHAR(36) NOT NULL PRIMARY KEY,
  usuario_id CHAR(36) NOT NULL,
  codigo VARCHAR(4) NOT NULL,
  expiracion DATETIME NOT NULL,
  usado TINYINT(1) NOT NULL DEFAULT 0,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_codigos_2fa_usuario_id (usuario_id),
  INDEX idx_codigos_2fa_codigo (codigo),
  INDEX idx_codigos_2fa_expiracion (expiracion),
  FOREIGN KEY (usuario_id) REFERENCES usuarios_equipo(id) ON DELETE CASCADE
);

-- Si la tabla ya existe con VARCHAR(6), modificar a VARCHAR(4)
ALTER TABLE codigos_2fa MODIFY COLUMN codigo VARCHAR(4) NOT NULL;