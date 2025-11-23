-- ==============================================
-- SETUP COORDINACION + TEMPORADA 2025 + CATEGORIAS + PLANTILLA EQUIPOS (sin jugadores)
-- ==============================================
SET NAMES utf8mb4;
SET @URL := '/imgs/logo.png';

-- ---------- Temporada 2025
INSERT INTO Temporadas (nombre, fecha_inicio, fecha_fin, fecha_corte_edad, is_activa)
VALUES ('2025','2025-02-01','2025-12-15','2025-08-31',1)
ON DUPLICATE KEY UPDATE fecha_inicio=VALUES(fecha_inicio), fecha_fin=VALUES(fecha_fin),
  fecha_corte_edad=VALUES(fecha_corte_edad), is_activa=VALUES(is_activa);
SET @id_temp := (SELECT id_temporada FROM Temporadas WHERE nombre='2025');

-- ---------- Categorías base
INSERT INTO Categorias (nombre_categoria, edad_min, edad_max, url_foto) VALUES
('5-6',5,6,@URL),('7-8',7,8,@URL),('9-10',9,10,@URL),
('11-12',11,12,@URL),('13-14',13,14,@URL),('15-16',15,16,@URL)
ON DUPLICATE KEY UPDATE edad_min=VALUES(edad_min), edad_max=VALUES(edad_max), url_foto=@URL;

SET @cat_56  := (SELECT id_categoria FROM Categorias WHERE nombre_categoria='5-6');
SET @cat_78  := (SELECT id_categoria FROM Categorias WHERE nombre_categoria='7-8');
SET @cat_910 := (SELECT id_categoria FROM Categorias WHERE nombre_categoria='9-10');
SET @cat_1112:= (SELECT id_categoria FROM Categorias WHERE nombre_categoria='11-12');
SET @cat_1314:= (SELECT id_categoria FROM Categorias WHERE nombre_categoria='13-14');
SET @cat_1516:= (SELECT id_categoria FROM Categorias WHERE nombre_categoria='15-16');

-- ---------- Rangos por temporada con corte 2025-08-31
INSERT INTO CategoriaTemporadaRango (id_temporada,id_categoria,nacimiento_desde,nacimiento_hasta) VALUES
(@id_temp,@cat_56 ,'2018-09-01','2020-08-31'),
(@id_temp,@cat_78 ,'2016-09-01','2018-08-31'),
(@id_temp,@cat_910,'2014-09-01','2016-08-31'),
(@id_temp,@cat_1112,'2012-09-01','2014-08-31'),
(@id_temp,@cat_1314,'2010-09-01','2012-08-31'),
(@id_temp,@cat_1516,'2008-09-01','2010-08-31')
ON DUPLICATE KEY UPDATE nacimiento_desde=VALUES(nacimiento_desde), nacimiento_hasta=VALUES(nacimiento_hasta);

-- ---------- Usuarios del sistema (ejemplos)
-- Nota: reemplaza '<hash>' por tu hash real
INSERT INTO UsuarioAdministradores (usuario, contra, rol) VALUES
('admin',      '<hash>', 'ADMIN'),
('coord_56',   '<hash>', 'COORDINADOR'),
('coord_78',   '<hash>', 'COORDINADOR'),
('coord_910',  '<hash>', 'COORDINADOR'),
('coord_1112', '<hash>', 'COORDINADOR'),
('coord_1314', '<hash>', 'COORDINADOR'),
('coord_1516', '<hash>', 'COORDINADOR'),
('stats_56',   '<hash>', 'ESTADISTICAS'),
('stats_78',   '<hash>', 'ESTADISTICAS'),
('stats_910',  '<hash>', 'ESTADISTICAS'),
('stats_1112', '<hash>', 'ESTADISTICAS'),
('stats_1314', '<hash>', 'ESTADISTICAS'),
('stats_1516', '<hash>', 'ESTADISTICAS')
ON DUPLICATE KEY UPDATE contra=VALUES(contra);

-- ---------- Coordinadores (personas)
INSERT INTO Coordinadores (url_foto,nombres,apellido_paterno,apellido_materno) VALUES
(@URL,'Coordinacion','5-6','N/A'),
(@URL,'Coordinacion','7-8','N/A'),
(@URL,'Coordinacion','9-10','N/A'),
(@URL,'Coordinacion','11-12','N/A'),
(@URL,'Coordinacion','13-14','N/A'),
(@URL,'Coordinacion','15-16','N/A')
ON DUPLICATE KEY UPDATE url_foto=@URL;

SET @co_56  := (SELECT id_coordinador FROM Coordinadores WHERE nombres='Coordinacion' AND apellido_paterno='5-6');
SET @co_78  := (SELECT id_coordinador FROM Coordinadores WHERE nombres='Coordinacion' AND apellido_paterno='7-8');
SET @co_910 := (SELECT id_coordinador FROM Coordinadores WHERE nombres='Coordinacion' AND apellido_paterno='9-10');
SET @co_1112:= (SELECT id_coordinador FROM Coordinadores WHERE nombres='Coordinacion' AND apellido_paterno='11-12');
SET @co_1314:= (SELECT id_coordinador FROM Coordinadores WHERE nombres='Coordinacion' AND apellido_paterno='13-14');
SET @co_1516:= (SELECT id_coordinador FROM Coordinadores WHERE nombres='Coordinacion' AND apellido_paterno='15-16');

-- ---------- Asignación de coordinador por temporada/categoría
INSERT INTO CoordinadorTemporadaCategoria (id_coordinador,id_temporada,id_categoria) VALUES
(@co_56,@id_temp,@cat_56),
(@co_78,@id_temp,@cat_78),
(@co_910,@id_temp,@cat_910),
(@co_1112,@id_temp,@cat_1112),
(@co_1314,@id_temp,@cat_1314),
(@co_1516,@id_temp,@cat_1516)
ON DUPLICATE KEY UPDATE id_coordinador=VALUES(id_coordinador);

-- ---------- Alcance por rol/usuario con alias legible
INSERT INTO UsuarioRolTemporadaCategoria (id_usuario,rol,id_temporada,id_categoria,alias)
SELECT u.id_usuario,'COORDINADOR',@id_temp,@cat_56,'Coordinación 5-6'  FROM UsuarioAdministradores u WHERE u.usuario='coord_56'
UNION ALL
SELECT u.id_usuario,'COORDINADOR',@id_temp,@cat_78,'Coordinación 7-8'  FROM UsuarioAdministradores u WHERE u.usuario='coord_78'
UNION ALL
SELECT u.id_usuario,'COORDINADOR',@id_temp,@cat_910,'Coordinación 9-10' FROM UsuarioAdministradores u WHERE u.usuario='coord_910'
UNION ALL
SELECT u.id_usuario,'COORDINADOR',@id_temp,@cat_1112,'Coordinación 11-12' FROM UsuarioAdministradores u WHERE u.usuario='coord_1112'
UNION ALL
SELECT u.id_usuario,'COORDINADOR',@id_temp,@cat_1314,'Coordinación 13-14' FROM UsuarioAdministradores u WHERE u.usuario='coord_1314'
UNION ALL
SELECT u.id_usuario,'COORDINADOR',@id_temp,@cat_1516,'Coordinación 15-16' FROM UsuarioAdministradores u WHERE u.usuario='coord_1516'
ON DUPLICATE KEY UPDATE alias=VALUES(alias);

INSERT INTO UsuarioRolTemporadaCategoria (id_usuario,rol,id_temporada,id_categoria,alias)
SELECT u.id_usuario,'ESTADISTICAS',@id_temp,@cat_56,'Estadísticas 5-6'  FROM UsuarioAdministradores u WHERE u.usuario='stats_56'
UNION ALL
SELECT u.id_usuario,'ESTADISTICAS',@id_temp,@cat_78,'Estadísticas 7-8'  FROM UsuarioAdministradores u WHERE u.usuario='stats_78'
UNION ALL
SELECT u.id_usuario,'ESTADISTICAS',@id_temp,@cat_910,'Estadísticas 9-10' FROM UsuarioAdministradores u WHERE u.usuario='stats_910'
UNION ALL
SELECT u.id_usuario,'ESTADISTICAS',@id_temp,@cat_1112,'Estadísticas 11-12' FROM UsuarioAdministradores u WHERE u.usuario='stats_1112'
UNION ALL
SELECT u.id_usuario,'ESTADISTICAS',@id_temp,@cat_1314,'Estadísticas 13-14' FROM UsuarioAdministradores u WHERE u.usuario='stats_1314'
UNION ALL
SELECT u.id_usuario,'ESTADISTICAS',@id_temp,@cat_1516,'Estadísticas 15-16' FROM UsuarioAdministradores u WHERE u.usuario='stats_1516'
ON DUPLICATE KEY UPDATE alias=VALUES(alias);

-- ---------- Plantilla de Equipos (estructura base, sin jugadores)
-- Crea identidad de equipos
INSERT INTO Equipos (nombre_corto) VALUES ('PONYS'),('POTRILLOS'),('BRONCOS'),('MUSTANGS')
ON DUPLICATE KEY UPDATE nombre_corto=VALUES(nombre_corto);

SET @eq_ponys    := (SELECT id_equipo FROM Equipos WHERE nombre_corto='PONYS');
SET @eq_potr     := (SELECT id_equipo FROM Equipos WHERE nombre_corto='POTRILLOS');
SET @eq_broncos  := (SELECT id_equipo FROM Equipos WHERE nombre_corto='BRONCOS');
SET @eq_mustangs := (SELECT id_equipo FROM Equipos WHERE nombre_corto='MUSTANGS');

-- Entrenadores placeholders para dejar listo el vínculo
INSERT INTO Entrenadores (nombres,apellido_paterno,apellido_materno) VALUES
('Antelmo','Mancinas','N/A'),
('Mike','Cervantes','N/A'),
('Eduardo','Mendoza','N/A'),
('Angel','Ochoa','N/A')
ON DUPLICATE KEY UPDATE apellido_materno='N/A';

SET @ent_ponys    := (SELECT id_entrenador FROM Entrenadores WHERE nombres='Antelmo' AND apellido_paterno='Mancinas');
SET @ent_potr     := (SELECT id_entrenador FROM Entrenadores WHERE nombres='Mike' AND apellido_paterno='Cervantes');
SET @ent_broncos  := (SELECT id_entrenador FROM Entrenadores WHERE nombres='Eduardo' AND apellido_paterno='Mendoza');
SET @ent_mustangs := (SELECT id_entrenador FROM Entrenadores WHERE nombres='Angel' AND apellido_paterno='Ochoa');

-- Instancias de equipos para la categoría 9-10 en 2025
INSERT INTO EquipoTemporada (id_equipo,id_temporada,id_categoria,nombre,colores,url_foto,id_entrenador) VALUES
(@eq_ponys,@id_temp,@cat_910,'Ponys','morado/blanco',@URL,@ent_ponys),
(@eq_potr ,@id_temp,@cat_910,'Potrillos','gris/amarillo',@URL,@ent_potr),
(@eq_broncos,@id_temp,@cat_910,'Broncos','azul/morado',@URL,@ent_broncos),
(@eq_mustangs,@id_temp,@cat_910,'Mustangs','cian/azul',@URL,@ent_mustangs)
ON DUPLICATE KEY UPDATE colores=VALUES(colores), url_foto=@URL, id_entrenador=VALUES(id_entrenador);

-- Estadística de equipo inicial en cero
INSERT IGNORE INTO EstadisticasEquipoTemporada (id_temporada,id_equipo_temporada)
SELECT @id_temp, et.id_equipo_temporada
FROM EquipoTemporada et
WHERE et.id_temporada=@id_temp AND et.id_categoria=@cat_910;
