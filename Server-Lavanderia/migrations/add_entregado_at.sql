-- Agrega la fecha/hora real en que la orden fue entregada al cliente.
-- Distinta de fecha_entrega, que es la fecha PROGRAMADA de entrega.
ALTER TABLE ordenes
ADD COLUMN entregado_at datetime DEFAULT NULL AFTER hora_entrega;
