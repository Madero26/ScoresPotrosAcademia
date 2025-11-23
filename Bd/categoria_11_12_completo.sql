-- ==============================================
-- CATEGORÍA 11-12 - TEMPORADA 2025 | CARGA COMPLETA
-- Equipos: Ponys, Mustangs, Potrillos
-- Entrenadores inventados para evitar duplicados
-- Rango de nacimiento válido: 2012-09-01 .. 2014-08-31
-- ==============================================
SET NAMES utf8mb4;
SET @URL := '/imgs/logo.png';

-- ----- Identificadores base
SET @id_temp := (SELECT id_temporada FROM Temporadas WHERE nombre='2025');
SET @cat_1112 := (SELECT id_categoria  FROM Categorias  WHERE nombre_categoria='11-12');

-- Seguridad de temporada y categoría
DELIMITER $$
DROP PROCEDURE IF EXISTS _assert_pre_1112 $$
CREATE PROCEDURE _assert_pre_1112()
BEGIN
  IF @id_temp IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Temporada 2025 no existe';
  END IF;
  IF @cat_1112 IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Categoría 11-12 no existe';
  END IF;
END $$
CALL _assert_pre_1112() $$
DROP PROCEDURE _assert_pre_1112 $$
DELIMITER ;

-- ----- Asegurar equipos base
INSERT INTO Equipos (nombre_corto) VALUES ('PONYS'),('MUSTANGS'),('POTRILLOS')
ON DUPLICATE KEY UPDATE nombre_corto=VALUES(nombre_corto);

SET @eq_ponys    := (SELECT id_equipo FROM Equipos WHERE nombre_corto='PONYS');
SET @eq_mustangs := (SELECT id_equipo FROM Equipos WHERE nombre_corto='MUSTANGS');
SET @eq_potr     := (SELECT id_equipo FROM Equipos WHERE nombre_corto='POTRILLOS');

-- ----- Entrenadores únicos para esta categoría
INSERT INTO Entrenadores (nombres,apellido_paterno,apellido_materno)
VALUES ('Sergio_1112','Castañeda','R1');
SET @ent_ponys := LAST_INSERT_ID();

INSERT INTO Entrenadores (nombres,apellido_paterno,apellido_materno)
VALUES ('Damián_1112','Villaseñor','R2');
SET @ent_must := LAST_INSERT_ID();

INSERT INTO Entrenadores (nombres,apellido_paterno,apellido_materno)
VALUES ('Óscar_1112','Montijo','R3');
SET @ent_potr := LAST_INSERT_ID();

-- ----- Crear EquipoTemporada si no existen
INSERT INTO EquipoTemporada (id_equipo,id_temporada,id_categoria,nombre,colores,url_foto,id_entrenador)
SELECT @eq_ponys,@id_temp,@cat_1112,'Ponys','amarillo/negro',@URL,@ent_ponys
WHERE NOT EXISTS (
  SELECT 1 FROM EquipoTemporada 
  WHERE id_equipo=@eq_ponys AND id_temporada=@id_temp AND id_categoria=@cat_1112
);

INSERT INTO EquipoTemporada (id_equipo,id_temporada,id_categoria,nombre,colores,url_foto,id_entrenador)
SELECT @eq_mustangs,@id_temp,@cat_1112,'Mustangs','verde/negro',@URL,@ent_must
WHERE NOT EXISTS (
  SELECT 1 FROM EquipoTemporada 
  WHERE id_equipo=@eq_mustangs AND id_temporada=@id_temp AND id_categoria=@cat_1112
);

INSERT INTO EquipoTemporada (id_equipo,id_temporada,id_categoria,nombre,colores,url_foto,id_entrenador)
SELECT @eq_potr,@id_temp,@cat_1112,'Potrillos','azul/amarillo',@URL,@ent_potr
WHERE NOT EXISTS (
  SELECT 1 FROM EquipoTemporada 
  WHERE id_equipo=@eq_potr AND id_temporada=@id_temp AND id_categoria=@cat_1112
);

SET @e_ponys_1112    := (SELECT id_equipo_temporada FROM EquipoTemporada WHERE id_temporada=@id_temp AND id_categoria=@cat_1112 AND id_equipo=@eq_ponys);
SET @e_mustangs_1112 := (SELECT id_equipo_temporada FROM EquipoTemporada WHERE id_temporada=@id_temp AND id_categoria=@cat_1112 AND id_equipo=@eq_mustangs);
SET @e_potr_1112     := (SELECT id_equipo_temporada FROM EquipoTemporada WHERE id_temporada=@id_temp AND id_categoria=@cat_1112 AND id_equipo=@eq_potr);

DELIMITER $$
DROP PROCEDURE IF EXISTS _assert_1112 $$
CREATE PROCEDURE _assert_1112()
BEGIN
  IF @e_ponys_1112 IS NULL OR @e_mustangs_1112 IS NULL OR @e_potr_1112 IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Faltan equipos 11-12';
  END IF;
END $$
CALL _assert_1112() $$
DROP PROCEDURE _assert_1112 $$
DELIMITER ;

-- ==============================================
-- Jugadores 11-12
-- Nota: se asignan fechas dentro del rango 2012-09-01 .. 2014-08-31
-- ==============================================
INSERT INTO Jugadores (url_foto,nombres,apellido_paterno,apellido_materno,fecha_nacimiento) VALUES
-- PONYS (11)
(@URL,'Max','Estrada','N/A','2013-01-12'),
(@URL,'Sebastián','Leyva','N/A','2013-02-08'),
(@URL,'Iker','Hernández','N/A','2013-03-05'),
(@URL,'Andrés','Gastelum','Chinchillas','2013-04-10'),
(@URL,'Malkiel','Verdugo','Malkiel','2013-05-07'),
(@URL,'Roberto','Espinoza','N/A','2013-06-18'),
(@URL,'Máximo','Castellano','Frías','2013-07-22'),
(@URL,'Ethan','Córdova','N/A','2013-08-14'),
(@URL,'Sahid','Rodríguez','N/A','2013-09-03'),
(@URL,'Rafael','Álvarez','N/A','2013-10-11'),
(@URL,'Dustin','Rivera','N/A','2013-11-19'),
-- MUSTANGS (10)
(@URL,'Emmanuel','Ruiz','N/A','2013-01-28'),
(@URL,'Paolo','Mendívil','N/A','2013-03-02'),
(@URL,'Esteban','Espinoza','N/A','2013-04-06'),
(@URL,'Emmanuel','Calderón','N/A','2013-05-09'),
(@URL,'Liam','Verdugo','N/A','2013-06-12'),
(@URL,'Iren','Gutiérrez','N/A','2013-07-16'),
(@URL,'Leo','Beltrán','N/A','2013-08-19'),
(@URL,'José Daniel','Hernández','N/A','2013-09-23'),
(@URL,'Francisco','Salas','N/A','2013-10-27'),
(@URL,'Julio','Montejano','N/A','2013-11-30'),
-- POTRILLOS (11)
(@URL,'Tadeo','Higuera','N/A','2013-01-06'),
(@URL,'Luis','Castro','N/A','2013-02-10'),
(@URL,'Fernando','Antelo','N/A','2013-03-14'),
(@URL,'Esteban','López','N/A','2013-04-18'),
(@URL,'Emiliano','Cantú','N/A','2013-05-22'),
(@URL,'Felipe','Acuña','N/A','2013-06-26'),
(@URL,'Alejandro','Robles','N/A','2013-07-30'),
(@URL,'Ernesto','Avilés','N/A','2013-08-04'),
(@URL,'Benito','Amavizca','N/A','2013-09-08'),
(@URL,'Manuel','Agroman','N/A','2013-10-12'),
(@URL,'Lerin','Valencia','N/A','2013-11-15');

-- ==============================================
-- Asignación a temporada/categoría 11-12
-- ==============================================
INSERT IGNORE INTO JugadorTemporadaCategoria (id_jugador,id_temporada,id_categoria,asignado_automatico)
SELECT j.id_jugador,@id_temp,@cat_1112,1
FROM Jugadores j
WHERE (j.nombres,j.apellido_paterno) IN
 (('Max','Estrada'),('Sebastián','Leyva'),('Iker','Hernández'),('Andrés','Gastelum'),
  ('Malkiel','Verdugo'),('Roberto','Espinoza'),('Máximo','Castellano'),('Ethan','Córdova'),
  ('Sahid','Rodríguez'),('Rafael','Álvarez'),('Dustin','Rivera'),
  ('Emmanuel','Ruiz'),('Paolo','Mendívil'),('Esteban','Espinoza'),('Emmanuel','Calderón'),
  ('Liam','Verdugo'),('Iren','Gutiérrez'),('Leo','Beltrán'),('José Daniel','Hernández'),
  ('Francisco','Salas'),('Julio','Montejano'),
  ('Tadeo','Higuera'),('Luis','Castro'),('Fernando','Antelo'),('Esteban','López'),
  ('Emiliano','Cantú'),('Felipe','Acuña'),('Alejandro','Robles'),('Ernesto','Avilés'),
  ('Benito','Amavizca'),('Manuel','Agroman'),('Lerin','Valencia'));

-- ==============================================
-- Pertenencia a equipos
-- ==============================================
-- Ponys
INSERT IGNORE INTO JugadorEquipoTemporada (id_jugador,id_equipo_temporada,fecha_alta)
SELECT id_jugador,@e_ponys_1112,'2025-02-10' FROM Jugadores
WHERE (nombres,apellido_paterno) IN
 (('Max','Estrada'),('Sebastián','Leyva'),('Iker','Hernández'),('Andrés','Gastelum'),
  ('Malkiel','Verdugo'),('Roberto','Espinoza'),('Máximo','Castellano'),('Ethan','Córdova'),
  ('Sahid','Rodríguez'),('Rafael','Álvarez'),('Dustin','Rivera'));

-- Mustangs
INSERT IGNORE INTO JugadorEquipoTemporada (id_jugador,id_equipo_temporada,fecha_alta)
SELECT id_jugador,@e_mustangs_1112,'2025-02-10' FROM Jugadores
WHERE (nombres,apellido_paterno) IN
 (('Emmanuel','Ruiz'),('Paolo','Mendívil'),('Esteban','Espinoza'),('Emmanuel','Calderón'),
  ('Liam','Verdugo'),('Iren','Gutiérrez'),('Leo','Beltrán'),('José Daniel','Hernández'),
  ('Francisco','Salas'),('Julio','Montejano'));

-- Potrillos
INSERT IGNORE INTO JugadorEquipoTemporada (id_jugador,id_equipo_temporada,fecha_alta)
SELECT id_jugador,@e_potr_1112,'2025-02-10' FROM Jugadores
WHERE (nombres,apellido_paterno) IN
 (('Tadeo','Higuera'),('Luis','Castro'),('Fernando','Antelo'),('Esteban','López'),
  ('Emiliano','Cantú'),('Felipe','Acuña'),('Alejandro','Robles'),('Ernesto','Avilés'),
  ('Benito','Amavizca'),('Manuel','Agroman'),('Lerin','Valencia'));

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
WHERE et.id_temporada=@id_temp AND et.id_categoria=@cat_1112;

-- Pitcheo
INSERT IGNORE INTO EstadisticasPitcheoTemporada
(id_temporada,id_jugador,id_equipo_temporada,bases_por_bolas,victorias,derrotas,
 entradas_lanzadas,carreras_limpias,ponches)
SELECT @id_temp, je.id_jugador, je.id_equipo_temporada, 0,0,0,0.0,0,0
FROM JugadorEquipoTemporada je
JOIN EquipoTemporada et ON et.id_equipo_temporada=je.id_equipo_temporada
WHERE et.id_temporada=@id_temp AND et.id_categoria=@cat_1112;

-- Rendimiento mensual inicial
INSERT IGNORE INTO EstadisticasRendimientoMensual
(id_temporada,id_jugador,fecha_medicion,tiempo_carrera_seg,vel_lanzamiento_mph,
 potencia_brazo_mph,pop_time_seg,vel_bate_mph)
SELECT @id_temp, je.id_jugador, '2025-02-15', 0.00,0.00,0.00,0.00,0.00
FROM JugadorEquipoTemporada je
JOIN EquipoTemporada et ON et.id_equipo_temporada=je.id_equipo_temporada
WHERE et.id_temporada=@id_temp AND et.id_categoria=@cat_1112;

-- Estadística de equipo inicial
INSERT IGNORE INTO EstadisticasEquipoTemporada (id_temporada,id_equipo_temporada)
SELECT @id_temp, et.id_equipo_temporada
FROM EquipoTemporada et
WHERE et.id_temporada=@id_temp AND et.id_categoria=@cat_1112;
