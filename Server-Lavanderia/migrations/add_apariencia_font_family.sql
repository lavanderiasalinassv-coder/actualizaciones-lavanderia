ALTER TABLE apariencia_config
  ADD COLUMN font_family VARCHAR(32) NOT NULL DEFAULT 'system'
  AFTER orb_color_dos;
