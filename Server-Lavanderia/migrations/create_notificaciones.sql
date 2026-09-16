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
  INDEX idx_notificaciones_tipo_estado (tipo, estado, creada_at),
  CONSTRAINT fk_notificaciones_destinatario
    FOREIGN KEY (destinatario_id) REFERENCES usuarios_equipo(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notificaciones_lecturas (
  notificacion_id CHAR(36) NOT NULL,
  usuario_id CHAR(36) NOT NULL,
  leida TINYINT(1) NOT NULL DEFAULT 1,
  leida_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (notificacion_id, usuario_id),
  INDEX idx_notificaciones_lecturas_usuario (usuario_id, leida)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
