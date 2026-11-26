SET @add_login_layout = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE apariencia_config ADD COLUMN login_layout VARCHAR(32) NOT NULL DEFAULT ''classic'' AFTER login_imagen',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'apariencia_config'
    AND COLUMN_NAME = 'login_layout'
);
PREPARE add_login_layout FROM @add_login_layout;
EXECUTE add_login_layout;
DEALLOCATE PREPARE add_login_layout;
