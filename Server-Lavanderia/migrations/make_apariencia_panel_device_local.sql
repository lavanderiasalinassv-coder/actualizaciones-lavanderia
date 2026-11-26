SET @add_font_family = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE apariencia_config ADD COLUMN font_family VARCHAR(32) NOT NULL DEFAULT ''system''',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'apariencia_config'
    AND COLUMN_NAME = 'font_family'
);
PREPARE add_font_family FROM @add_font_family;
EXECUTE add_font_family;
DEALLOCATE PREPARE add_font_family;

SET @drop_app_shell_layout = (
  SELECT IF(
    COUNT(*) > 0,
    'ALTER TABLE apariencia_config DROP COLUMN app_shell_layout',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'apariencia_config'
    AND COLUMN_NAME = 'app_shell_layout'
);
PREPARE drop_app_shell_layout FROM @drop_app_shell_layout;
EXECUTE drop_app_shell_layout;
DEALLOCATE PREPARE drop_app_shell_layout;
