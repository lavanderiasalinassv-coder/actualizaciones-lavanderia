-- Ejecutar en instalaciones existentes.
-- El endpoint PUT /equipo/:id debe validar cambios_imagen_perfil < 2 en el servidor.
ALTER TABLE `usuarios_equipo`
  ADD COLUMN `imagen_perfil` longtext NULL,
  ADD COLUMN `cambios_imagen_perfil` tinyint unsigned NOT NULL DEFAULT '0';
