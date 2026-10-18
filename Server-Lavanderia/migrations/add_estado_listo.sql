-- Estados activos e históricos permitidos para las órdenes.

ALTER TABLE ordenes 
MODIFY COLUMN estado ENUM('pendiente', 'en_proceso', 'listo', 'entregado', 'cancelada', 'cerrada', 'Cerrada-Cancelada') NOT NULL DEFAULT 'pendiente';
