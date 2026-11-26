UPDATE apariencia_config
SET login_theme = 'nocturne'
WHERE login_theme = 'market';

ALTER TABLE apariencia_config
  MODIFY COLUMN login_theme VARCHAR(32) NOT NULL DEFAULT 'nocturne';
