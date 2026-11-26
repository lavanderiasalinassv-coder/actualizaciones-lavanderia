SET @add_sali_assistant_position = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE apariencia_config ADD COLUMN sali_assistant_position VARCHAR(16) NOT NULL DEFAULT ''right'' AFTER login_theme',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'apariencia_config'
    AND COLUMN_NAME = 'sali_assistant_position'
);
PREPARE add_sali_assistant_position FROM @add_sali_assistant_position;
EXECUTE add_sali_assistant_position;
DEALLOCATE PREPARE add_sali_assistant_position;
