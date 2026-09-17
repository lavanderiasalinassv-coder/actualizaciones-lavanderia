CREATE TABLE `apariencia_config` (
  `id` tinyint(3) unsigned NOT NULL,
  `app_shell_color` varchar(20) NOT NULL,
  `app_shell_header_color` varchar(20) NOT NULL,
  `app_shell_imagen` longtext NOT NULL,
  `login_color` varchar(20) NOT NULL,
  `login_imagen` longtext NOT NULL,
  `orb_color_uno` varchar(20) NOT NULL,
  `orb_color_dos` varchar(20) NOT NULL,
  `actualizado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

INSERT INTO `apariencia_config` VALUES (1,'#eef4f8','#081a30','','#0a1f38','','#a9d8ee','#123a66','2026-08-23 04:16:42');

CREATE TABLE `catalogo_categorias` (
  `id` varchar(36) NOT NULL,
  `nombre` varchar(120) NOT NULL,
  `color` varchar(20) NOT NULL,
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_catalogo_categorias_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE `catalogo_items` (
  `id` varchar(36) NOT NULL,
  `tipo` enum('servicio','articulo') NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `categoria_id` varchar(36) DEFAULT NULL,
  `precio` decimal(10,2) NOT NULL DEFAULT '0.00',
    `unidad` enum('kilo','libra','pieza','m2','galon','mililitro','otro') NOT NULL DEFAULT 'pieza',
  `clasificacion_prendas` enum('por_prenda','extra') NOT NULL DEFAULT 'por_prenda',
  `variantes_activas` tinyint(1) NOT NULL DEFAULT '0',
  `variantes_precio` json DEFAULT NULL,
  `etiquetas` json DEFAULT NULL,
  `insumos` json DEFAULT NULL,
  `descripcion` text,
  `imagen_url` longtext,
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_catalogo_items_categoria` (`categoria_id`),
  CONSTRAINT `fk_catalogo_items_categoria` FOREIGN KEY (`categoria_id`) REFERENCES `catalogo_categorias` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE `cierres_caja` (
  `id` char(36) NOT NULL,
  `turno_id` varchar(80) NOT NULL,
  `numero_caja` int(11) NOT NULL DEFAULT '0',
  `cerrado_at` datetime NOT NULL,
  `resumen` json NOT NULL,
  `estado_deposito` enum('pendiente','depositado','diferente') NOT NULL DEFAULT 'pendiente',
  `monto_depositado` decimal(12,2) DEFAULT NULL,
  `motivo_diferencia` text,
  `revisado_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_cierres_caja_fecha` (`cerrado_at`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;


CREATE TABLE `clientes` (
  `id` char(36) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `celular` varchar(20) NOT NULL,
  `correo` varchar(150) NOT NULL DEFAULT '',
  `total_ordenes` int(11) NOT NULL DEFAULT '0',
  `fecha_registro` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ultima_orden` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_clientes_celular` (`celular`),
  KEY `idx_clientes_nombre` (`nombre`),
  KEY `idx_clientes_total_ordenes` (`total_ordenes`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;


CREATE TABLE `codigos_2fa` (
  `id` char(36) NOT NULL,
  `usuario_id` char(36) NOT NULL,
  `codigo` varchar(4) NOT NULL,
  `expiracion` datetime NOT NULL,
  `usado` tinyint(1) NOT NULL DEFAULT '0',
  `creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_codigos_2fa_usuario_id` (`usuario_id`),
  KEY `idx_codigos_2fa_codigo` (`codigo`),
  KEY `idx_codigos_2fa_expiracion` (`expiracion`),
  CONSTRAINT `codigos_2fa_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios_equipo` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;


CREATE TABLE `horarios_config` (
  `id` tinyint(4) NOT NULL DEFAULT '1',
  `periodo_pago` enum('semanal','quincenal') NOT NULL DEFAULT 'semanal',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE `horarios_notificaciones` (
  `id` varchar(36) NOT NULL,
  `destinatario` enum('administrador','usuario') NOT NULL,
  `empleado_id` varchar(36) NOT NULL,
  `empleado_nombre` varchar(150) NOT NULL,
  `tipo` enum('entrada_tarde','salida','pausa','reanudacion') NOT NULL,
  `fecha` date NOT NULL,
  `hora` varchar(40) NOT NULL,
  `mensaje` text NOT NULL,
  `minutos` int(11) DEFAULT NULL,
  `leida` tinyint(1) NOT NULL DEFAULT '0',
  `creada_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_horarios_notificaciones_empleado` (`empleado_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE `horarios_pago_por_hora` (
  `empleado_id` varchar(36) NOT NULL,
  `monto` decimal(10,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`empleado_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE `horarios_pagos` (
  `id` varchar(36) NOT NULL,
  `empleado_id` varchar(36) NOT NULL,
  `fecha` datetime NOT NULL,
  `monto` decimal(10,2) NOT NULL DEFAULT '0.00',
  `horas` decimal(10,2) NOT NULL DEFAULT '0.00',
  `registros_ids` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_horarios_pagos_empleado` (`empleado_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE `horarios_registros` (
  `id` varchar(36) NOT NULL,
  `empleado_id` varchar(36) NOT NULL,
  `fecha` date NOT NULL,
  `hora_entrada` datetime DEFAULT NULL,
  `hora_salida` datetime DEFAULT NULL,
  `pagado` tinyint(1) NOT NULL DEFAULT '0',
  `salida_automatica` tinyint(1) NOT NULL DEFAULT '0',
  `segmentos` json DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_horarios_registros_empleado_fecha` (`empleado_id`,`fecha`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE `horarios_turnos` (
  `id` varchar(36) NOT NULL,
  `empleado_id` varchar(36) NOT NULL,
  `fecha` date NOT NULL,
  `hora_inicio` varchar(5) NOT NULL,
  `hora_fin` varchar(5) NOT NULL,
  `nota` varchar(255) DEFAULT NULL,
  `libre` tinyint(1) NOT NULL DEFAULT '0',
  `hora_almuerzo_inicio` varchar(5) DEFAULT NULL,
  `hora_almuerzo_fin` varchar(5) DEFAULT NULL,
  `horas_extra` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_horarios_turnos_empleado_fecha` (`empleado_id`,`fecha`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE `inventario_productos` (
  `id` varchar(36) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `categoria` varchar(100) NOT NULL,
  `unidad_medida` enum('pieza','litro','mililitro','kilogramo','libra','gramo','paquete','caja','galon','otro') NOT NULL DEFAULT 'pieza',
  `cantidad` decimal(14,6) NOT NULL DEFAULT '0.000000',
  `costo` decimal(10,2) NOT NULL DEFAULT '0.00',
  `descripcion` text,
  `imagen_url` longtext,
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_inventario_categoria` (`categoria`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE `movimientos_caja` (
  `id` char(36) NOT NULL,
  `tipo` enum('gasto','deposito','cierre') NOT NULL,
  `monto` decimal(12,2) NOT NULL,
  `concepto` varchar(255) NOT NULL,
  `turno_id` varchar(80) NOT NULL,
  `numero_caja` int(11) NOT NULL DEFAULT '0',
  `usuario` varchar(150) NOT NULL DEFAULT '',
  `comprobante_url` text,
  `creado_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_movimientos_caja_turno` (`turno_id`),
  KEY `idx_movimientos_caja_tipo` (`tipo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `orden_anticipos` (
  `id` char(36) NOT NULL,
  `orden_id` char(36) NOT NULL,
  `turno_id` varchar(64) DEFAULT NULL,
  `monto` decimal(10,2) NOT NULL,
  `fecha` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_anticipos_orden` (`orden_id`),
  CONSTRAINT `fk_anticipos_orden` FOREIGN KEY (`orden_id`) REFERENCES `ordenes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `orden_cargos_extra` (
  `id` char(36) NOT NULL,
  `orden_id` char(36) NOT NULL,
  `descripcion` varchar(200) NOT NULL,
  `monto` decimal(10,2) NOT NULL,
  `fecha` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_cargos_orden` (`orden_id`),
  CONSTRAINT `fk_cargos_orden` FOREIGN KEY (`orden_id`) REFERENCES `ordenes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `orden_fotos` (
  `id` char(36) NOT NULL,
  `orden_id` char(36) NOT NULL,
  `posicion` int(11) NOT NULL DEFAULT '0',
  `url` longtext NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_fotos_orden` (`orden_id`),
  CONSTRAINT `fk_fotos_orden` FOREIGN KEY (`orden_id`) REFERENCES `ordenes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `orden_item_insumos` (
  `id` char(36) NOT NULL,
  `orden_item_id` char(36) NOT NULL,
  `producto_id` varchar(36) NOT NULL,
  `cantidad` decimal(10,3) NOT NULL DEFAULT '0.000',
  PRIMARY KEY (`id`),
  KEY `idx_insumos_item` (`orden_item_id`),
  CONSTRAINT `fk_insumos_item` FOREIGN KEY (`orden_item_id`) REFERENCES `orden_items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `orden_items` (
  `id` char(36) NOT NULL,
  `orden_id` char(36) NOT NULL,
  `producto_id` varchar(36) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `precio` decimal(10,2) NOT NULL DEFAULT '0.00',
  `unidad` varchar(20) NOT NULL DEFAULT 'otro',
  `cantidad` decimal(10,2) NOT NULL DEFAULT '1.00',
  `nota` text,
  PRIMARY KEY (`id`),
  KEY `idx_orden_items_orden` (`orden_id`),
  KEY `idx_orden_items_producto` (`producto_id`),
  CONSTRAINT `fk_orden_items_orden` FOREIGN KEY (`orden_id`) REFERENCES `ordenes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `orden_movimientos` (
  `id` char(36) NOT NULL,
  `orden_id` char(36) NOT NULL,
  `texto` text NOT NULL,
  `usuario_id` char(36) DEFAULT NULL,
  `usuario_nombre` varchar(150) NOT NULL DEFAULT 'Sistema',
  `fecha` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_movs_orden` (`orden_id`),
  KEY `idx_orden_movimientos_usuario` (`usuario_id`),
  CONSTRAINT `fk_movs_orden` FOREIGN KEY (`orden_id`) REFERENCES `ordenes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `ordenes` (
  `id` char(36) NOT NULL,
  `secuencia` int(11) NOT NULL AUTO_INCREMENT,
  `estado` enum('pendiente','en_proceso','listo','entregado','cerrada','cancelada') NOT NULL DEFAULT 'pendiente',
  `turno_id` varchar(36) NOT NULL DEFAULT '',
  `nombre_cliente` varchar(150) NOT NULL,
  `codigo_pais` varchar(10) NOT NULL DEFAULT '+503',
  `telefono` varchar(30) NOT NULL DEFAULT '',
  `correo` varchar(150) NOT NULL DEFAULT '',
  `guardar_directorio` tinyint(1) NOT NULL DEFAULT '0',
  `envio_domicilio` tinyint(1) NOT NULL DEFAULT '0',
  `direccion_entrega` text,
  `fecha_entrega_activa` tinyint(1) NOT NULL DEFAULT '0',
  `fecha_entrega` date DEFAULT NULL,
  `hora_entrega` time DEFAULT NULL,
  `entregado_at` datetime DEFAULT NULL,
  `estado_pago` enum('porCobrar','anticipo','pagado') NOT NULL DEFAULT 'porCobrar',
  `metodo_pago` enum('efectivo','tarjeta','transferencia') NOT NULL DEFAULT 'efectivo',
  `monto_recibido` decimal(10,2) NOT NULL DEFAULT '0.00',
  `descuento` decimal(5,2) NOT NULL DEFAULT '0.00',
  `descuento_manual` decimal(5,2) NOT NULL DEFAULT '0.00',
  `descuento_promocion` decimal(5,2) NOT NULL DEFAULT '0.00',
  `subtotal` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total` decimal(10,2) NOT NULL DEFAULT '0.00',
  `cambio` decimal(10,2) NOT NULL DEFAULT '0.00',
  `cantidad_prendas` int(11) NOT NULL DEFAULT '0' COMMENT 'Cantidad de prendas recibidas',
  `detalles_prendas` text COMMENT 'Notas sobre las prendas recibidas',
  `nota_interna` text,
  `motivo_cancelacion` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `tarjeta_monto` decimal(12,2) DEFAULT NULL COMMENT 'Monto pagado con tarjeta',
  `tarjeta_referencia` varchar(50) DEFAULT NULL COMMENT 'Número de referencia del POS',
  `transferencia_monto` decimal(12,2) DEFAULT NULL COMMENT 'Monto pagado por transferencia',
  `transferencia_comprobante` text COMMENT 'URL del comprobante de transferencia',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ordenes_secuencia` (`secuencia`),
  KEY `idx_ordenes_turno` (`turno_id`),
  KEY `idx_ordenes_telefono` (`telefono`),
  KEY `idx_ordenes_estado` (`estado`),
  KEY `idx_ordenes_tarjeta_referencia` (`tarjeta_referencia`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=latin1;

CREATE TABLE `promociones` (
  `id` char(36) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `descripcion` text,
  `tipo_descuento` enum('porcentaje','dinero') NOT NULL,
  `valor` decimal(10,2) NOT NULL,
  `tipo_cliente_aplica` enum('todos','registrados','recurrentes') NOT NULL DEFAULT 'todos',
  `min_ordenes` int(11) DEFAULT NULL,
  `vigente` tinyint(1) NOT NULL DEFAULT '1',
  `fecha_inicio` date NOT NULL,
  `fecha_fin` date NOT NULL,
  `dias_especificos` json NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_promociones_vigente` (`vigente`),
  KEY `idx_promociones_fechas` (`fecha_inicio`,`fecha_fin`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `tareas` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `titulo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `emoji` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '?',
  `prioridad` enum('baja','media','alta') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'media',
  `asignada_a_id` char(36) CHARACTER SET latin1 NOT NULL,
  `asignada_a_nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `creada_por_id` char(36) CHARACTER SET latin1 DEFAULT NULL,
  `creada_por_nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Sistema',
  `creada_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completada` tinyint(1) NOT NULL DEFAULT '0',
  `completada_en` datetime DEFAULT NULL,
  `completada_por_id` char(36) CHARACTER SET latin1 DEFAULT NULL,
  `completada_por_nombre` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_tareas_asignada_a` (`asignada_a_id`),
  KEY `idx_tareas_completada` (`completada`),
  KEY `idx_tareas_creada_en` (`creada_en`),
  KEY `fk_tareas_creada_por` (`creada_por_id`),
  KEY `fk_tareas_completada_por` (`completada_por_id`),
  CONSTRAINT `fk_tareas_asignada_a` FOREIGN KEY (`asignada_a_id`) REFERENCES `usuarios_equipo` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tareas_completada_por` FOREIGN KEY (`completada_por_id`) REFERENCES `usuarios_equipo` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_tareas_creada_por` FOREIGN KEY (`creada_por_id`) REFERENCES `usuarios_equipo` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `turno_caja_actual` (
  `id` tinyint(4) NOT NULL DEFAULT '1',
  `turno_id` varchar(64) NOT NULL DEFAULT '',
  `numero_caja` int(11) NOT NULL DEFAULT '0',
  `abierto` tinyint(1) NOT NULL DEFAULT '0',
  `usuario` varchar(150) NOT NULL DEFAULT '',
  `apertura` decimal(10,2) NOT NULL DEFAULT '0.00',
  `saldo_cierre` decimal(10,2) DEFAULT NULL,
  `hora_inicio` datetime DEFAULT NULL,
  `notas` text,
  `cerrado_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `turno_contador_cajas` (
  `id` tinyint(4) NOT NULL DEFAULT '1',
  `valor` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `turnos_historial` (
  `id` varchar(64) NOT NULL,
  `numero_caja` int(11) NOT NULL,
  `usuario` varchar(255) NOT NULL,
  `apertura` decimal(10,2) NOT NULL,
  `saldo_cierre` decimal(10,2) DEFAULT NULL,
  `total_cobrado` decimal(10,2) NOT NULL DEFAULT '0.00',
  `hora_inicio` datetime DEFAULT NULL,
  `hora_fin` datetime DEFAULT NULL,
  `notas` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `usuarios_equipo` (
  `id` char(36) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `correo` varchar(150) NOT NULL,
  `codigo` varchar(50) NOT NULL,
  `rol` enum('administrador','recepcionista','cajero','operador') NOT NULL DEFAULT 'cajero',
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `imagen_perfil` longtext,
  `cambios_imagen_perfil` tinyint unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_usuarios_equipo_correo` (`correo`),
  KEY `idx_usuarios_equipo_codigo` (`codigo`),
  KEY `idx_usuarios_equipo_activo` (`activo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
