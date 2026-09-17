-- =============================================================================
-- QUERIES CRUD - USUARIOS DE EQUIPO (LAVANDERÍA SALINAS)
-- Roles: administrador, recepcionista, cajero, operador
-- Restricciones: Código no puede iniciar con 0 (excepto administrador)
-- =============================================================================

-- ============================================================================
-- 1. CREAR TABLA DE USUARIOS DE EQUIPO
-- ============================================================================
CREATE TABLE IF NOT EXISTS usuarios_equipo (
  id VARCHAR(36) PRIMARY KEY COMMENT 'UUID del usuario',
  nombre VARCHAR(150) NOT NULL COMMENT 'Nombre completo del usuario',
  correo VARCHAR(120) NOT NULL UNIQUE COMMENT 'Correo electrónico único',
  codigo VARCHAR(6) NOT NULL UNIQUE COMMENT 'Código de acceso (6 dígitos)',
  rol ENUM('administrador', 'recepcionista', 'cajero', 'operador') NOT NULL DEFAULT 'cajero' COMMENT 'Rol del usuario',
  activo BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Usuario activo o inactivo',
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación',
  fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Última actualización',
  
  INDEX idx_correo (correo),
  INDEX idx_codigo (codigo),
  INDEX idx_rol (rol),
  INDEX idx_activo (activo),
  
  CONSTRAINT chk_codigo_valido CHECK (
    rol = 'administrador' OR (rol != 'administrador' AND codigo NOT LIKE '0%')
  ),
  CONSTRAINT chk_codigo_length CHECK (LENGTH(codigo) = 6 AND codigo REGEXP '^[0-9]{6}$'),
  CONSTRAINT chk_nombre_length CHECK (LENGTH(nombre) > 0),
  CONSTRAINT chk_correo_format CHECK (correo REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- ============================================================================
-- 2. AGREGAR USUARIO (INSERT)
-- ============================================================================
INSERT INTO usuarios_equipo (id, nombre, correo, codigo, rol, activo)
VALUES (
  ?, -- id: UUID único
  ?, -- nombre: nombre completo
  ?, -- correo: correo electrónico
  ?, -- codigo: código de 6 dígitos
  ?, -- rol: 'administrador', 'recepcionista' o 'cajero'
  TRUE
);

-- Verificar unicidad antes de insertar
SELECT COUNT(*) as existe FROM usuarios_equipo 
WHERE (correo = ? OR codigo = ?) AND activo = TRUE;

-- Verificar validez del código según rol
-- Si rol != 'administrador' y el código inicia con 0, rechazar

-- ============================================================================
-- 3. OBTENER TODOS LOS USUARIOS ACTIVOS
-- ============================================================================
SELECT 
  id,
  nombre,
  correo,
  codigo,
  rol,
  activo,
  fecha_creacion,
  fecha_actualizacion
FROM usuarios_equipo
WHERE activo = TRUE
ORDER BY fecha_creacion DESC;

-- ============================================================================
-- 4. OBTENER USUARIO POR CÓDIGO (LOGIN)
-- ============================================================================
SELECT 
  id,
  nombre,
  correo,
  codigo,
  rol,
  activo,
  fecha_creacion
FROM usuarios_equipo
WHERE codigo = ? AND activo = TRUE
LIMIT 1;

-- ============================================================================
-- 5. OBTENER USUARIO POR CORREO
-- ============================================================================
SELECT 
  id,
  nombre,
  correo,
  codigo,
  rol,
  activo,
  fecha_creacion
FROM usuarios_equipo
WHERE correo = ? AND activo = TRUE
LIMIT 1;

-- ============================================================================
-- 6. OBTENER USUARIO POR ID
-- ============================================================================
SELECT 
  id,
  nombre,
  correo,
  codigo,
  rol,
  activo,
  fecha_creacion,
  fecha_actualizacion
FROM usuarios_equipo
WHERE id = ? AND activo = TRUE
LIMIT 1;

-- ============================================================================
-- 7. ACTUALIZAR USUARIO (UPDATE)
-- ============================================================================
UPDATE usuarios_equipo
SET 
  nombre = ?,
  correo = ?,
  codigo = ?,
  rol = ?,
  activo = ?
WHERE id = ? AND activo = TRUE;

-- Verificar duplicados antes de actualizar
SELECT COUNT(*) as existe FROM usuarios_equipo 
WHERE (
  (correo = ? AND id != ?) OR 
  (codigo = ? AND id != ?)
) AND activo = TRUE;

-- ============================================================================
-- 8. ELIMINAR USUARIO (DELETE LÓGICO - SOFT DELETE)
-- ============================================================================
UPDATE usuarios_equipo
SET activo = FALSE
WHERE id = ?;

-- Alternativa: DELETE físico (si se requiere eliminar completamente)
-- DELETE FROM usuarios_equipo WHERE id = ?;

-- ============================================================================
-- 9. LISTAR USUARIOS POR ROL
-- ============================================================================
SELECT 
  id,
  nombre,
  correo,
  rol,
  activo,
  fecha_creacion
FROM usuarios_equipo
WHERE rol = ? AND activo = TRUE
ORDER BY nombre ASC;

-- ============================================================================
-- 10. CONTAR USUARIOS POR ROL
-- ============================================================================
SELECT 
  rol,
  COUNT(*) as total
FROM usuarios_equipo
WHERE activo = TRUE
GROUP BY rol
ORDER BY rol;

-- ============================================================================
-- 11. VERIFICAR CÓDIGO ÚNICO
-- ============================================================================
SELECT COUNT(*) as existe FROM usuarios_equipo 
WHERE codigo = ? AND id != ? AND activo = TRUE;

-- ============================================================================
-- 12. VERIFICAR CORREO ÚNICO
-- ============================================================================
SELECT COUNT(*) as existe FROM usuarios_equipo 
WHERE correo = ? AND id != ? AND activo = TRUE;

-- ============================================================================
-- 13. OBTENER ESTADÍSTICAS DEL EQUIPO
-- ============================================================================
SELECT 
  COUNT(*) as total_usuarios,
  SUM(CASE WHEN activo = TRUE THEN 1 ELSE 0 END) as usuarios_activos,
  SUM(CASE WHEN rol = 'administrador' THEN 1 ELSE 0 END) as total_administradores,
  SUM(CASE WHEN rol = 'recepcionista' THEN 1 ELSE 0 END) as total_recepcionistas,
  SUM(CASE WHEN rol = 'cajero' THEN 1 ELSE 0 END) as total_cajeros
FROM usuarios_equipo;

-- ============================================================================
-- 14. BUSCAR USUARIOS (BÚSQUEDA POR NOMBRE O CORREO)
-- ============================================================================
SELECT 
  id,
  nombre,
  correo,
  codigo,
  rol,
  activo,
  fecha_creacion
FROM usuarios_equipo
WHERE (
  nombre LIKE CONCAT('%', ?, '%') OR 
  correo LIKE CONCAT('%', ?, '%')
) AND activo = TRUE
ORDER BY nombre ASC;

-- ============================================================================
-- 15. LISTAR ÚLTIMOS N USUARIOS REGISTRADOS
-- ============================================================================
SELECT 
  id,
  nombre,
  correo,
  codigo,
  rol,
  activo,
  fecha_creacion
FROM usuarios_equipo
WHERE activo = TRUE
ORDER BY fecha_creacion DESC
LIMIT 10;

-- ============================================================================
-- 16. CAMBIAR ESTADO ACTIVO/INACTIVO DE USUARIO
-- ============================================================================
UPDATE usuarios_equipo
SET activo = ?
WHERE id = ?;

-- ============================================================================
-- 17. CAMBIAR ROL DE USUARIO
-- ============================================================================
UPDATE usuarios_equipo
SET rol = ?
WHERE id = ?;

-- ============================================================================
-- 18. CAMBIAR CÓDIGO DE USUARIO
-- ============================================================================
UPDATE usuarios_equipo
SET codigo = ?
WHERE id = ? AND id NOT IN (
  SELECT id FROM usuarios_equipo WHERE codigo = ? AND activo = TRUE
);

-- ============================================================================
-- VALIDACIONES Y RESTRICCIONES
-- ============================================================================
/*
  
  RESTRICCIÓN DE CÓDIGO:
  - El código debe tener exactamente 6 dígitos numéricos
  - Si el rol es 'administrador': puede iniciar con 0
  - Si el rol es 'recepcionista' o 'cajero': NO puede iniciar con 0
  - El código debe ser ÚNICO entre todos los usuarios activos
  
  RESTRICCIÓN DE CORREO:
  - Debe ser un correo válido con formato estándar
  - Debe ser ÚNICO entre todos los usuarios activos
  - Validar antes de guardar en base de datos
  
  RESTRICCIÓN DE NOMBRE:
  - No puede estar vacío
  - Debe tener al menos 1 carácter
  
  RESTRICCIÓN DE ROL:
  - Solo puede ser: 'administrador', 'recepcionista' o 'cajero'
  - Si el rol cambia, se deben re-validar los permisos del código
  
  ACTIVIDAD:
  - Usar soft delete (activo = FALSE) en lugar de eliminar registros
  - Las consultas siempre deben filtrar por activo = TRUE
*/

-- ============================================================================
-- AUDITORÍA Y REGISTRO DE CAMBIOS
-- ============================================================================
CREATE TABLE IF NOT EXISTS usuarios_equipo_audit (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id VARCHAR(36),
  accion ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
  datos_anteriores JSON,
  datos_nuevos JSON,
  fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (usuario_id) REFERENCES usuarios_equipo(id)
);

-- Trigger para auditoría automática
DELIMITER $$
CREATE TRIGGER audit_usuarios_equipo_insert
AFTER INSERT ON usuarios_equipo
FOR EACH ROW
BEGIN
  INSERT INTO usuarios_equipo_audit (usuario_id, accion, datos_nuevos)
  VALUES (NEW.id, 'INSERT', JSON_OBJECT(
    'nombre', NEW.nombre,
    'correo', NEW.correo,
    'rol', NEW.rol
  ));
END$$
DELIMITER ;

-- ============================================================================
-- DATOS DE EJEMPLO - USUARIO ADMINISTRADOR POR DEFECTO
-- ============================================================================
INSERT INTO usuarios_equipo (id, nombre, correo, codigo, rol)
VALUES (
  'admin-default',
  'Administrador',
  'admin@lavanderia.com',
  '592647',
  'administrador'
);

-- Usuarios de ejemplo
INSERT INTO usuarios_equipo (id, nombre, correo, codigo, rol) VALUES
(UUID(), 'Juan Pérez', 'juan@lavanderia.com', '123456', 'recepcionista'),
(UUID(), 'María García', 'maria@lavanderia.com', '234567', 'cajero'),
(UUID(), 'Carlos López', 'carlos@lavanderia.com', '345678', 'recepcionista'),
(UUID(), 'Ana Martínez', 'ana@lavanderia.com', '456789', 'cajero');
