-- Agrega el límite opcional por cliente y el registro transaccional de canjes QR.
ALTER TABLE promociones
ADD COLUMN max_usos_por_cliente INT UNSIGNED NULL DEFAULT NULL;

CREATE TABLE IF NOT EXISTS promocion_usos_qr (
  id CHAR(36) NOT NULL,
  promocion_id CHAR(36) NOT NULL,
  orden_id CHAR(36) NOT NULL,
  cliente_telefono VARCHAR(32) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_promocion_usos_qr_orden (orden_id),
  KEY idx_promocion_usos_qr_cliente (promocion_id, cliente_telefono)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;