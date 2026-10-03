-- Habilita cupones QR solo en las promociones que lo soliciten.
ALTER TABLE promociones
ADD COLUMN generar_qr TINYINT(1) NOT NULL DEFAULT 0;