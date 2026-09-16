-- Script para agregar el estado 'listo' a la tabla ordenes
-- Este script debe ejecutarse una sola vez para migrar la base de datos

-- Modificar el ENUM para agregar el estado 'listo'
ALTER TABLE ordenes 
MODIFY COLUMN estado ENUM('pendiente', 'en_proceso', 'listo', 'entregado', 'cancelada') NOT NULL DEFAULT 'pendiente';
