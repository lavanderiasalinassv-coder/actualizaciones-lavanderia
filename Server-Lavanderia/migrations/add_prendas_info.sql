-- Agrega la cantidad y detalles de prendas a la tabla ordenes
-- Ejecutar una sola vez en la base de datos existente

ALTER TABLE ordenes
ADD COLUMN cantidad_prendas INT NOT NULL DEFAULT 0 COMMENT 'Cantidad de prendas recibidas',
ADD COLUMN detalles_prendas TEXT NULL COMMENT 'Notas sobre las prendas recibidas';
