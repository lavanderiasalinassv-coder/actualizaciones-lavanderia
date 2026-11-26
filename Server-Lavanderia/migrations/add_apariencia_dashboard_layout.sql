ALTER TABLE apariencia_config
  ADD COLUMN app_shell_layout VARCHAR(24) NOT NULL DEFAULT 'top'
    AFTER app_shell_imagen,
  ADD COLUMN principal_access_order LONGTEXT NULL
    AFTER app_shell_layout,
  ADD COLUMN principal_panels_swapped TINYINT(1) NOT NULL DEFAULT 0
    AFTER principal_access_order;

UPDATE apariencia_config
SET principal_access_order = '["/tabs/home","/tabs/ordenes","/tabs/reportes","/tabs/calendario","/tabs/clientes","/tabs/productos","/tabs/inventario","/tabs/promociones","/tabs/facturas","/tabs/equipo","/tabs/horarios","/tabs/configuracion"]'
WHERE principal_access_order IS NULL;
