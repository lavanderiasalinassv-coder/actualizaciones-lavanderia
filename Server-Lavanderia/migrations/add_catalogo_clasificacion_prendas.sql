ALTER TABLE catalogo_items
ADD COLUMN clasificacion_prendas ENUM('por_prenda', 'extra') NOT NULL DEFAULT 'por_prenda'
AFTER unidad;