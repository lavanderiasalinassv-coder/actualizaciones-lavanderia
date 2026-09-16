-- Trigger para proteger avisos del desarrollador contra eliminación
-- Este trigger se ejecuta antes de eliminar cualquier notificación
DELIMITER $$

CREATE TRIGGER proteger_avisos_desarrollador_before_delete
BEFORE DELETE ON notificaciones
FOR EACH ROW
BEGIN
    -- Verificar si es un aviso del desarrollador
    IF OLD.tipo = 'aviso' AND LOWER(OLD.autor_nombre) = 'desarrollador' THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'No se pueden eliminar avisos del desarrollador';
    END IF;
END$$

DELIMITER ;

-- Trigger adicional para proteger actualizaciones de avisos del desarrollador
DELIMITER $$

CREATE TRIGGER proteger_avisos_desarrollador_before_update
BEFORE UPDATE ON notificaciones
FOR EACH ROW
BEGIN
    -- Verificar si es un aviso del desarrollador
    IF OLD.tipo = 'aviso' AND LOWER(OLD.autor_nombre) = 'desarrollador' THEN
        -- Bloquear cambios en título, mensaje o destinatario
        IF OLD.titulo <> NEW.titulo OR OLD.mensaje <> NEW.mensaje OR OLD.destinatario_rol <> NEW.destinatario_rol THEN
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'No se pueden modificar avisos del desarrollador';
        END IF;
    END IF;
END$$

DELIMITER ;

-- Para eliminar estos triggers si es necesario:
-- DROP TRIGGER IF EXISTS proteger_avisos_desarrollador_before_delete;
-- DROP TRIGGER IF EXISTS proteger_avisos_desarrollador_before_update;