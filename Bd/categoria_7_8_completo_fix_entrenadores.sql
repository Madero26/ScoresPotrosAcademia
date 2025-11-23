-- ==============================================
-- CATEGORÍA 7-8 - TEMPORADA 2025 | CARGA COMPLETA (FIX ENTRENADORES ÚNICOS)
-- ==============================================
SET NAMES utf8mb4;
SET @URL := '/imgs/logo.png';

-- ----- Identificadores base
SET @id_temp := (SELECT id_temporada FROM Temporadas WHERE nombre='2025');
SET @cat_78  := (SELECT id_categoria  FROM Categorias  WHERE nombre_categoria='7-8');

-- Seguridad básica de existencia de temporada y categoría
DELIMITER $$
DROP PROCEDURE IF EXISTS _assert_pre $$
CREATE PROCEDURE _assert_pre()
BEGIN
  IF @id_temp IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Temporada 2025 no existe';
  END IF;
  IF @cat_78 IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Categoría 7-8 no existe';
  END IF;
END $$
CALL _assert_pre() $$
DROP PROCEDURE _assert_pre $$
DELIMITER ;

-- ----- Asegurar equipos base
INSERT INTO Equipos (nombre_corto) VALUES ('PONYS'),('POTRILLOS')
ON DUPLICATE KEY UPDATE nombre_corto=VALUES(nombre_corto);

SET @eq_ponys := (SELECT id_equipo FROM Equipos WHERE nombre_corto='PONYS');
SET @eq_potr  := (SELECT id_equipo FROM Equipos WHERE nombre_corto='POTRILLOS');

-- ----- Entrenadores únicos para evitar colisiones
-- Se insertan explícitamente y se guardan sus IDs con LAST_INSERT_ID()
INSERT INTO Entrenadores (nombres,apellido_paterno,apellido_materno)
VALUES ('Hector_78','Madrigal','L78');
SET @ent_ponys := LAST_INSERT_ID();

INSERT INTO Entrenadores (nombres,apellido_paterno,apellido_materno)
VALUES ('Gerardo_78','Pastrana','I78');
SET @ent_potr := LAST_INSERT_ID();

-- ----- Crear EquipoTemporada si no existen, ligando a los entrenadores insertados
INSERT INTO EquipoTemporada (id_equipo,id_temporada,id_categoria,nombre,colores,url_foto,id_entrenador)
SELECT @eq_ponys,@id_temp,@cat_78,'Ponys','morado/blanco',@URL,@ent_ponys
WHERE NOT EXISTS (
  SELECT 1 FROM EquipoTemporada 
  WHERE id_equipo=@eq_ponys AND id_temporada=@id_temp AND id_categoria=@cat_78
);

INSERT INTO EquipoTemporada (id_equipo,id_temporada,id_categoria,nombre,colores,url_foto,id_entrenador)
SELECT @eq_potr,@id_temp,@cat_78,'Potrillos','gris/amarillo',@URL,@ent_potr
WHERE NOT EXISTS (
  SELECT 1 FROM EquipoTemporada 
  WHERE id_equipo=@eq_potr AND id_temporada=@id_temp AND id_categoria=@cat_78
);

SET @e_ponys := (SELECT id_equipo_temporada FROM EquipoTemporada WHERE id_temporada=@id_temp AND id_categoria=@cat_78 AND id_equipo=@eq_ponys);
SET @e_potr  := (SELECT id_equipo_temporada FROM EquipoTemporada WHERE id_temporada=@id_temp AND id_categoria=@cat_78 AND id_equipo=@eq_potr);

-- Seguridad equipos
DELIMITER $$
DROP PROCEDURE IF EXISTS _assert_78 $$
CREATE PROCEDURE _assert_78()
BEGIN
  IF @e_ponys IS NULL OR @e_potr IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Faltan equipos Ponys/Potrillos para 7-8';
  END IF;
END $$
CALL _assert_78() $$
DROP PROCEDURE _assert_78 $$
DELIMITER ;

-- ==============================================
-- Jugadores (31) provistos
-- Nota: Fechas dentro de 2016-09-01 .. 2018-08-31
-- ==============================================
INSERT INTO Jugadores (url_foto,nombres,apellido_paterno,apellido_materno,fecha_nacimiento) VALUES
-- PONYS (16)
(@URL,'Jocksan','Pérez','N/A','2017-01-05'),
(@URL,'Jesús Rubén','León','N/A','2017-02-12'),
(@URL,'Alan','Gastelum','N/A','2016-11-23'),
(@URL,'Icker','Beltrán','N/A','2017-03-18'),
(@URL,'Ricardo','Ortega','N/A','2017-04-09'),
(@URL,'Israel','Dorame','N/A','2017-05-27'),
(@URL,'Ian','Gutiérrez','N/A','2017-06-15'),
(@URL,'Santiago','Beltrán','N/A','2017-07-08'),
(@URL,'Alexis','Cabrera','N/A','2017-08-21'),
(@URL,'Santiago','Villalobos','N/A','2017-09-10'),
(@URL,'Gael','Martínez','N/A','2017-10-14'),
(@URL,'Eden','Padilla','N/A','2017-11-19'),
(@URL,'José Carlos','Grajeda','N/A','2018-01-07'),
(@URL,'Ramón','Valdez','N/A','2018-02-16'),
(@URL,'Javier','Salazar','N/A','2018-03-22'),
(@URL,'Matías','Molina','N/A','2018-05-02'),
-- POTRILLOS (15)
(@URL,'Mateo','Flores','N/A','2017-01-17'),
(@URL,'Axel','Villarreal','N/A','2016-12-05'),
(@URL,'Jesed','Bacasegua','N/A','2017-02-24'),
(@URL,'Eduardo','Bojorquez','N/A','2017-03-29'),
(@URL,'Abrahám','Torres','N/A','2017-04-25'),
(@URL,'Luis Ángel','Flores','N/A','2017-05-13'),
(@URL,'Cristian','Leyva','N/A','2017-06-28'),
(@URL,'Felipe','Leyva','N/A','2017-07-19'),
(@URL,'Ángel','Pérez','N/A','2017-08-06'),
(@URL,'Max','Quintana','N/A','2017-09-27'),
(@URL,'Raúl','Lugo','N/A','2017-10-20'),
(@URL,'Said','Jacobo','N/A','2017-11-08'),
(@URL,'Santiago','Grajeda','N/A','2018-02-05'),
(@URL,'Daniel','Camargo','N/A','2018-03-11'),
(@URL,'Felipe','Pazos','N/A','2018-04-18');

-- ==============================================
-- Asignación a temporada/categoría 7-8
-- ==============================================
INSERT IGNORE INTO JugadorTemporadaCategoria (id_jugador,id_temporada,id_categoria,asignado_automatico)
SELECT j.id_jugador,@id_temp,@cat_78,1
FROM Jugadores j
WHERE (j.nombres,j.apellido_paterno) IN
 (('Jocksan','Pérez'),('Jesús Rubén','León'),('Alan','Gastelum'),('Icker','Beltrán'),
  ('Ricardo','Ortega'),('Israel','Dorame'),('Ian','Gutiérrez'),('Santiago','Beltrán'),
  ('Alexis','Cabrera'),('Santiago','Villalobos'),('Gael','Martínez'),('Eden','Padilla'),
  ('José Carlos','Grajeda'),('Ramón','Valdez'),('Javier','Salazar'),('Matías','Molina'),
  ('Mateo','Flores'),('Axel','Villarreal'),('Jesed','Bacasegua'),('Eduardo','Bojorquez'),
  ('Abrahám','Torres'),('Luis Ángel','Flores'),('Cristian','Leyva'),('Felipe','Leyva'),
  ('Ángel','Pérez'),('Max','Quintana'),('Raúl','Lugo'),('Said','Jacobo'),
  ('Santiago','Grajeda'),('Daniel','Camargo'),('Felipe','Pazos'));

-- ==============================================
-- Pertenencia a equipos
-- ==============================================
-- Ponys
INSERT IGNORE INTO JugadorEquipoTemporada (id_jugador,id_equipo_temporada,fecha_alta)
SELECT id_jugador,@e_ponys,'2025-02-10' FROM Jugadores
WHERE (nombres,apellido_paterno) IN
 (('Jocksan','Pérez'),('Jesús Rubén','León'),('Alan','Gastelum'),('Icker','Beltrán'),
  ('Ricardo','Ortega'),('Israel','Dorame'),('Ian','Gutiérrez'),('Santiago','Beltrán'),
  ('Alexis','Cabrera'),('Santiago','Villalobos'),('Gael','Martínez'),('Eden','Padilla'),
  ('José Carlos','Grajeda'),('Ramón','Valdez'),('Javier','Salazar'),('Matías','Molina'));

-- Potrillos
INSERT IGNORE INTO JugadorEquipoTemporada (id_jugador,id_equipo_temporada,fecha_alta)
SELECT id_jugador,@e_potr,'2025-02-10' FROM Jugadores
WHERE (nombres,apellido_paterno) IN
 (('Mateo','Flores'),('Axel','Villarreal'),('Jesed','Bacasegua'),('Eduardo','Bojorquez'),
  ('Abrahám','Torres'),('Luis Ángel','Flores'),('Cristian','Leyva'),('Felipe','Leyva'),
  ('Ángel','Pérez'),('Max','Quintana'),('Raúl','Lugo'),('Said','Jacobo'),
  ('Santiago','Grajeda'),('Daniel','Camargo'),('Felipe','Pazos'));

-- ==============================================
-- Estadísticas iniciales por jugador
-- ==============================================
-- Bateo
INSERT IGNORE INTO EstadisticasBateoTemporada
(id_temporada,id_jugador,id_equipo_temporada,apariciones_al_bat,hits,bases_por_bolas,
 carreras,carreras_producidas,sencillos,dobles,triples,home_runs,bases_robadas)
SELECT @id_temp, je.id_jugador, je.id_equipo_temporada, 0,0,0,0,0,0,0,0,0,0
FROM JugadorEquipoTemporada je
JOIN EquipoTemporada et ON et.id_equipo_temporada=je.id_equipo_temporada
WHERE et.id_temporada=@id_temp AND et.id_categoria=@cat_78;

-- Pitcheo
INSERT IGNORE INTO EstadisticasPitcheoTemporada
(id_temporada,id_jugador,id_equipo_temporada,bases_por_bolas,victorias,derrotas,
 entradas_lanzadas,carreras_limpias,ponches)
SELECT @id_temp, je.id_jugador, je.id_equipo_temporada, 0,0,0,0.0,0,0
FROM JugadorEquipoTemporada je
JOIN EquipoTemporada et ON et.id_equipo_temporada=je.id_equipo_temporada
WHERE et.id_temporada=@id_temp AND et.id_categoria=@cat_78;

-- Rendimiento mensual inicial
INSERT IGNORE INTO EstadisticasRendimientoMensual
(id_temporada,id_jugador,fecha_medicion,tiempo_carrera_seg,vel_lanzamiento_mph,
 potencia_brazo_mph,pop_time_seg,vel_bate_mph)
SELECT @id_temp, je.id_jugador, '2025-02-15', 0.00,0.00,0.00,0.00,0.00
FROM JugadorEquipoTemporada je
JOIN EquipoTemporada et ON et.id_equipo_temporada=je.id_equipo_temporada
WHERE et.id_temporada=@id_temp AND et.id_categoria=@cat_78;

-- Estadística de equipo inicial
INSERT IGNORE INTO EstadisticasEquipoTemporada (id_temporada,id_equipo_temporada)
SELECT @id_temp, et.id_equipo_temporada
FROM EquipoTemporada et
WHERE et.id_temporada=@id_temp AND et.id_categoria=@cat_78;
