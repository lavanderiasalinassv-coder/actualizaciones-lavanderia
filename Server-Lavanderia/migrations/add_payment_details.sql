-- Script para agregar campos de detalles de pago a la tabla ordenes
-- Este script debe ejecutarse una sola vez para migrar la base de datos

-- Agregar campos para pagos con tarjeta
ALTER TABLE ordenes 
ADD COLUMN tarjeta_monto DECIMAL(12,2) NULL COMMENT 'Monto pagado con tarjeta',
ADD COLUMN tarjeta_referencia VARCHAR(50) NULL COMMENT 'Número de referencia del POS';

-- Agregar campos para pagos por transferencia
ALTER TABLE ordenes 
ADD COLUMN transferencia_monto DECIMAL(12,2) NULL COMMENT 'Monto pagado por transferencia',
ADD COLUMN transferencia_comprobante TEXT NULL COMMENT 'URL del comprobante de transferencia';

-- Crear índices para búsquedas rápidas
CREATE INDEX idx_ordenes_tarjeta_referencia ON ordenes(tarjeta_referencia);
CREATE INDEX idx_ordenes_transferencia_monto ON ordenes(transferencia_monto);