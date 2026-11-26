SET @add_login_theme = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE apariencia_config ADD COLUMN login_theme VARCHAR(32) NOT NULL DEFAULT ''nocturne'' AFTER login_layout',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'apariencia_config'
    AND COLUMN_NAME = 'login_theme'
);
PREPARE add_login_theme FROM @add_login_theme;
EXECUTE add_login_theme;
DEALLOCATE PREPARE add_login_theme;
