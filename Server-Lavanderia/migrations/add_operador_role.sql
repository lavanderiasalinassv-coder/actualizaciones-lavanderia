-- Agrega el rol operador a la tabla usuarios_equipo
ALTER TABLE usuarios_equipo
  MODIFY COLUMN rol ENUM('administrador', 'recepcionista', 'cajero', 'operador') NOT NULL DEFAULT 'cajero';
