-- ==============================================
-- CATEGORÍA 13-14 - TEMPORADA 2025 | CARGA COMPLETA
-- Equipos: Ponys, Mustangs, Potrillos, Broncos
-- Entrenadores inventados por categoría para evitar duplicados
-- Rango de nacimiento válido: 2010-09-01 .. 2012-08-31
-- ==============================================
SET NAMES utf8mb4;
SET @URL := '/imgs/logo.png';

-- ----- Identificadores base
SET @id_temp := (SELECT id_temporada FROM Temporadas WHERE nombre='2025');
SET @cat_1314 := (SELECT id_categoria  FROM Categorias  WHERE nombre_categoria='13-14');

-- Seguridad de temporada y categoría
DELIMITER $$
DROP PROCEDURE IF EXISTS _assert_pre_1314 $$
CREATE PROCEDURE _assert_pre_1314()
BEGIN
  IF @id_temp IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Temporada 2025 no existe';
  END IF;
  IF @cat_1314 IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Categoría 13-14 no existe';
  END IF;
END $$
CALL _assert_pre_1314() $$
DROP PROCEDURE _assert_pre_1314 $$
DELIMITER ;

-- ----- Asegurar equipos base
INSERT INTO Equipos (nombre_corto) VALUES ('PONYS'),('MUSTANGS'),('POTRILLOS'),('BRONCOS')
ON DUPLICATE KEY UPDATE nombre_corto=VALUES(nombre_corto);

SET @eq_ponys    := (SELECT id_equipo FROM Equipos WHERE nombre_corto='PONYS');
SET @eq_mustangs := (SELECT id_equipo FROM Equipos WHERE nombre_corto='MUSTANGS');
SET @eq_potr     := (SELECT id_equipo FROM Equipos WHERE nombre_corto='POTRILLOS');
SET @eq_broncos  := (SELECT id_equipo FROM Equipos WHERE nombre_corto='BRONCOS');

-- ----- Entrenadores únicos para esta categoría
INSERT INTO Entrenadores (nombres,apellido_paterno,apellido_materno) VALUES ('Jaison_1314','Vega','MGR');
SET @ent_ponys := LAST_INSERT_ID();
INSERT INTO Entrenadores (nombres,apellido_paterno,apellido_materno) VALUES ('Ismael_1314','Aguero','MGR');
SET @ent_must := LAST_INSERT_ID();
INSERT INTO Entrenadores (nombres,apellido_paterno,apellido_materno) VALUES ('Abel_1314','Encinas','MGR');
SET @ent_potr := LAST_INSERT_ID();
INSERT INTO Entrenadores (nombres,apellido_paterno,apellido_materno) VALUES ('Refugio_1314','Felix','MGR');
SET @ent_bron := LAST_INSERT_ID();

-- ----- Crear EquipoTemporada si no existen
INSERT INTO EquipoTemporada (id_equipo,id_temporada,id_categoria,nombre,colores,url_foto,id_entrenador)
SELECT @eq_ponys,@id_temp,@cat_1314,'Ponys','amarillo/negro',@URL,@ent_ponys
WHERE NOT EXISTS (
  SELECT 1 FROM EquipoTemporada 
  WHERE id_equipo=@eq_ponys AND id_temporada=@id_temp AND id_categoria=@cat_1314
);

INSERT INTO EquipoTemporada (id_equipo,id_temporada,id_categoria,nombre,colores,url_foto,id_entrenador)
SELECT @eq_mustangs,@id_temp,@cat_1314,'Mustangs','verde/negro',@URL,@ent_must
WHERE NOT EXISTS (
  SELECT 1 FROM EquipoTemporada 
  WHERE id_equipo=@eq_mustangs AND id_temporada=@id_temp AND id_categoria=@cat_1314
);

INSERT INTO EquipoTemporada (id_equipo,id_temporada,id_categoria,nombre,colores,url_foto,id_entrenador)
SELECT @eq_potr,@id_temp,@cat_1314,'Potrillos','azul/amarillo',@URL,@ent_potr
WHERE NOT EXISTS (
  SELECT 1 FROM EquipoTemporada 
  WHERE id_equipo=@eq_potr AND id_temporada=@id_temp AND id_categoria=@cat_1314
);

INSERT INTO EquipoTemporada (id_equipo,id_temporada,id_categoria,nombre,colores,url_foto,id_entrenador)
SELECT @eq_broncos,@id_temp,@cat_1314,'Broncos','naranja/blanco',@URL,@ent_bron
WHERE NOT EXISTS (
  SELECT 1 FROM EquipoTemporada 
  WHERE id_equipo=@eq_broncos AND id_temporada=@id_temp AND id_categoria=@cat_1314
);

SET @e_ponys_1314    := (SELECT id_equipo_temporada FROM EquipoTemporada WHERE id_temporada=@id_temp AND id_categoria=@cat_1314 AND id_equipo=@eq_ponys);
SET @e_mustangs_1314 := (SELECT id_equipo_temporada FROM EquipoTemporada WHERE id_temporada=@id_temp AND id_categoria=@cat_1314 AND id_equipo=@eq_mustangs);
SET @e_potr_1314     := (SELECT id_equipo_temporada FROM EquipoTemporada WHERE id_temporada=@id_temp AND id_categoria=@cat_1314 AND id_equipo=@eq_potr);
SET @e_broncos_1314  := (SELECT id_equipo_temporada FROM EquipoTemporada WHERE id_temporada=@id_temp AND id_categoria=@cat_1314 AND id_equipo=@eq_broncos);

DELIMITER $$
DROP PROCEDURE IF EXISTS _assert_1314 $$
CREATE PROCEDURE _assert_1314()
BEGIN
  IF @e_ponys_1314 IS NULL OR @e_mustangs_1314 IS NULL OR @e_potr_1314 IS NULL OR @e_broncos_1314 IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Faltan equipos 13-14';
  END IF;
END $$
CALL _assert_1314() $$
DROP PROCEDURE _assert_1314 $$
DELIMITER ;

-- ==============================================
-- Jugadores 13-14 (fechas dentro de 2010-09-01 .. 2012-08-31)
-- ==============================================
INSERT INTO Jugadores (url_foto,nombres,apellido_paterno,apellido_materno,fecha_nacimiento) VALUES
-- BRONCOS (12)
(@URL,'Irvin','Cuevas','N/A','2011-01-05'),
(@URL,'Miguel','Elliot','N/A','2011-02-08'),
(@URL,'Mauricio','Arguelles','N/A','2011-03-11'),
(@URL,'Ángel','López','N/A','2011-04-14'),
(@URL,'Óscar','Gálvez','N/A','2011-05-17'),
(@URL,'Francisco','Urías','N/A','2011-06-20'),
(@URL,'Eduardo','Morquecho','N/A','2011-07-23'),
(@URL,'Hiram','Ponce','N/A','2011-08-26'),
(@URL,'Esteban','Orduño','N/A','2011-09-29'),
(@URL,'Eduardo','Montes','N/A','2011-10-03'),
(@URL,'Santiago','Rodríguez','N/A','2011-11-06'),
(@URL,'Julián','Granillo','N/A','2011-12-09'),
-- POTRILLOS (12)
(@URL,'Rodrigo','Andrade','N/A','2011-01-12'),
(@URL,'Joshua','Islas','N/A','2011-02-15'),
(@URL,'Héctor','Guillén','N/A','2011-03-18'),
(@URL,'Sebastián','Martínez','N/A','2011-04-21'),
(@URL,'José','Fuerte','N/A','2011-05-24'),
(@URL,'Héctor','Borbón','N/A','2011-06-27'),
(@URL,'Miguel','Cornejo','N/A','2011-07-30'),
(@URL,'Luis','Covarrubias','N/A','2011-08-05'),
(@URL,'Alex','Martínez','N/A','2011-09-08'),
(@URL,'Víctor','Esqueda','N/A','2011-10-11'),
(@URL,'Orlando','Rosas','N/A','2011-11-14'),
(@URL,'Francisco','Esparza','N/A','2011-12-17'),
-- PONYS (13)
(@URL,'Manuel','Esquer','N/A','2011-01-03'),
(@URL,'Iker','Medina','N/A','2011-02-06'),
(@URL,'Iker','Arvizu','N/A','2011-03-09'),
(@URL,'Cristian','Meneses','N/A','2011-04-12'),
(@URL,'Gael','Meneses','N/A','2011-05-15'),
(@URL,'Dylan','Molina','N/A','2011-06-18'),
(@URL,'Óscar','Segura','N/A','2011-07-21'),
(@URL,'Enrique','Nieblas','N/A','2011-08-24'),
(@URL,'Abraham','Tadeo','N/A','2011-09-27'),
(@URL,'Edgar','Valenzuela','N/A','2011-10-30'),
(@URL,'Rodrigo','Vázquez','N/A','2011-11-04'),
(@URL,'Emmanuel','Quintero','N/A','2011-12-07'),
(@URL,'Daniel','Rodríguez','N/A','2011-08-12'),
-- MUSTANGS (13)
(@URL,'Fernando','Pérez','N/A','2011-01-09'),
(@URL,'Francisco','López','N/A','2011-02-13'),
(@URL,'Diego','Vega','N/A','2011-03-17'),
(@URL,'Marysol','Fraire','N/A','2011-04-21'),
(@URL,'Francisco','Márquez','N/A','2011-05-25'),
(@URL,'Iván','Machi','N/A','2011-06-29'),
(@URL,'Zalatiel','Rábago','N/A','2011-07-02'),
(@URL,'Diego','Payán','N/A','2011-08-06'),
(@URL,'José','Corral','N/A','2011-09-10'),
(@URL,'Yadier','Corral','N/A','2011-10-14'),
(@URL,'Omar','Valenzuela','N/A','2011-11-18'),
(@URL,'Santiago','Fornes','N/A','2011-12-22'),
(@URL,'Jhoan','Molina','N/A','2011-07-12');

-- ==============================================
-- Asignación a temporada/categoría 13-14
-- ==============================================
INSERT IGNORE INTO JugadorTemporadaCategoria (id_jugador,id_temporada,id_categoria,asignado_automatico)
SELECT j.id_jugador,@id_temp,@cat_1314,1
FROM Jugadores j
WHERE (j.nombres,j.apellido_paterno) IN
 (('Irvin','Cuevas'),('Miguel','Elliot'),('Mauricio','Arguelles'),('Ángel','López'),
  ('Óscar','Gálvez'),('Francisco','Urías'),('Eduardo','Morquecho'),('Hiram','Ponce'),
  ('Esteban','Orduño'),('Eduardo','Montes'),('Santiago','Rodríguez'),('Julián','Granillo'),
  ('Rodrigo','Andrade'),('Joshua','Islas'),('Héctor','Guillén'),('Sebastián','Martínez'),
  ('José','Fuerte'),('Héctor','Borbón'),('Miguel','Cornejo'),('Luis','Covarrubias'),
  ('Alex','Martínez'),('Víctor','Esqueda'),('Orlando','Rosas'),('Francisco','Esparza'),
  ('Manuel','Esquer'),('Iker','Medina'),('Iker','Arvizu'),('Cristian','Meneses'),
  ('Gael','Meneses'),('Dylan','Molina'),('Óscar','Segura'),('Enrique','Nieblas'),
  ('Abraham','Tadeo'),('Edgar','Valenzuela'),('Rodrigo','Vázquez'),('Emmanuel','Quintero'),
  ('Daniel','Rodríguez'),
  ('Fernando','Pérez'),('Francisco','López'),('Diego','Vega'),('Marysol','Fraire'),
  ('Francisco','Márquez'),('Iván','Machi'),('Zalatiel','Rábago'),('Diego','Payán'),
  ('José','Corral'),('Yadier','Corral'),('Omar','Valenzuela'),('Santiago','Fornes'),
  ('Jhoan','Molina'));

-- ==============================================
-- Pertenencia a equipos
-- ==============================================
-- Broncos
INSERT IGNORE INTO JugadorEquipoTemporada (id_jugador,id_equipo_temporada,fecha_alta)
SELECT id_jugador,@e_broncos_1314,'2025-02-10' FROM Jugadores
WHERE (nombres,apellido_paterno) IN
 (('Irvin','Cuevas'),('Miguel','Elliot'),('Mauricio','Arguelles'),('Ángel','López'),
  ('Óscar','Gálvez'),('Francisco','Urías'),('Eduardo','Morquecho'),('Hiram','Ponce'),
  ('Esteban','Orduño'),('Eduardo','Montes'),('Santiago','Rodríguez'),('Julián','Granillo'));

-- Potrillos
INSERT IGNORE INTO JugadorEquipoTemporada (id_jugador,id_equipo_temporada,fecha_alta)
SELECT id_jugador,@e_potr_1314,'2025-02-10' FROM Jugadores
WHERE (nombres,apellido_paterno) IN
 (('Rodrigo','Andrade'),('Joshua','Islas'),('Héctor','Guillén'),('Sebastián','Martínez'),
  ('José','Fuerte'),('Héctor','Borbón'),('Miguel','Cornejo'),('Luis','Covarrubias'),
  ('Alex','Martínez'),('Víctor','Esqueda'),('Orlando','Rosas'),('Francisco','Esparza'));

-- Ponys
INSERT IGNORE INTO JugadorEquipoTemporada (id_jugador,id_equipo_temporada,fecha_alta)
SELECT id_jugador,@e_ponys_1314,'2025-02-10' FROM Jugadores
WHERE (nombres,apellido_paterno) IN
 (('Manuel','Esquer'),('Iker','Medina'),('Iker','Arvizu'),('Cristian','Meneses'),
  ('Gael','Meneses'),('Dylan','Molina'),('Óscar','Segura'),('Enrique','Nieblas'),
  ('Abraham','Tadeo'),('Edgar','Valenzuela'),('Rodrigo','Vázquez'),('Emmanuel','Quintero'),
  ('Daniel','Rodríguez'));

-- Mustangs
INSERT IGNORE INTO JugadorEquipoTemporada (id_jugador,id_equipo_temporada,fecha_alta)
SELECT id_jugador,@e_mustangs_1314,'2025-02-10' FROM Jugadores
WHERE (nombres,apellido_paterno) IN
 (('Fernando','Pérez'),('Francisco','López'),('Diego','Vega'),('Marysol','Fraire'),
  ('Francisco','Márquez'),('Iván','Machi'),('Zalatiel','Rábago'),('Diego','Payán'),
  ('José','Corral'),('Yadier','Corral'),('Omar','Valenzuela'),('Santiago','Fornes'),
  ('Jhoan','Molina'));

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
WHERE et.id_temporada=@id_temp AND et.id_categoria=@cat_1314;

-- Pitcheo
INSERT IGNORE INTO EstadisticasPitcheoTemporada
(id_temporada,id_jugador,id_equipo_temporada,bases_por_bolas,victorias,derrotas,
 entradas_lanzadas,carreras_limpias,ponches)
SELECT @id_temp, je.id_jugador, je.id_equipo_temporada, 0,0,0,0.0,0,0
FROM JugadorEquipoTemporada je
JOIN EquipoTemporada et ON et.id_equipo_temporada=je.id_equipo_temporada
WHERE et.id_temporada=@id_temp AND et.id_categoria=@cat_1314;

-- Rendimiento mensual inicial
INSERT IGNORE INTO EstadisticasRendimientoMensual
(id_temporada,id_jugador,fecha_medicion,tiempo_carrera_seg,vel_lanzamiento_mph,
 potencia_brazo_mph,pop_time_seg,vel_bate_mph)
SELECT @id_temp, je.id_jugador, '2025-02-15', 0.00,0.00,0.00,0.00,0.00
FROM JugadorEquipoTemporada je
JOIN EquipoTemporada et ON et.id_equipo_temporada=je.id_equipo_temporada
WHERE et.id_temporada=@id_temp AND et.id_categoria=@cat_1314;

-- Estadística de equipo inicial
INSERT IGNORE INTO EstadisticasEquipoTemporada (id_temporada,id_equipo_temporada)
SELECT @id_temp, et.id_equipo_temporada
FROM EquipoTemporada et
WHERE et.id_temporada=@id_temp AND et.id_categoria=@cat_1314;
