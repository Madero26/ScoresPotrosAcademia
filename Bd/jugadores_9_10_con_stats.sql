-- ==============================================
-- JUGADORES CATEGORIA 9-10 - TEMPORADA 2025
-- Inserta jugadores, los asigna a 2025/9-10 y a sus equipos.
-- Crea estadísticas iniciales de bateo, pitcheo y rendimiento.
-- ==============================================
SET NAMES utf8mb4;
SET @URL := '/imgs/logo.png';

-- ----- Identificadores base
SET @id_temp  := (SELECT id_temporada FROM Temporadas WHERE nombre='2025');
SET @cat_910  := (SELECT id_categoria FROM Categorias  WHERE nombre_categoria='9-10');

SET @e_ponys    := (SELECT id_equipo_temporada FROM EquipoTemporada WHERE id_temporada=@id_temp AND id_categoria=@cat_910 AND nombre='Ponys');
SET @e_potr     := (SELECT id_equipo_temporada FROM EquipoTemporada WHERE id_temporada=@id_temp AND id_categoria=@cat_910 AND nombre='Potrillos');
SET @e_broncos  := (SELECT id_equipo_temporada FROM EquipoTemporada WHERE id_temporada=@id_temp AND id_categoria=@cat_910 AND nombre='Broncos');
SET @e_mustangs := (SELECT id_equipo_temporada FROM EquipoTemporada WHERE id_temporada=@id_temp AND id_categoria=@cat_910 AND nombre='Mustangs');

-- Seguridad
-- Guardas previas
DELIMITER $$

DROP PROCEDURE IF EXISTS _assert_setup $$
CREATE PROCEDURE _assert_setup()
BEGIN
  IF @id_temp IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Temporada 2025 no existe';
  END IF;

  IF @cat_910 IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Categoría 9-10 no existe';
  END IF;

  IF @e_ponys IS NULL OR @e_potr IS NULL OR @e_broncos IS NULL OR @e_mustangs IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Faltan equipos de temporada para 9-10';
  END IF;
END $$
CALL _assert_setup() $$
DROP PROCEDURE _assert_setup $$
DELIMITER ;


-- ===== Jugadores =====
-- Fechas válidas 2014-09-01 .. 2016-08-31
INSERT INTO Jugadores (url_foto,nombres,apellido_paterno,apellido_materno,fecha_nacimiento) VALUES
-- PONYS
(@URL,'Victoria','Arvizu','N/A','2015-05-10'),
(@URL,'Alfredo','Gutierrez','N/A','2014-11-22'),
(@URL,'Mateo','Dominguez','N/A','2016-03-03'),
(@URL,'Alain','Sanchez','N/A','2015-01-18'),
(@URL,'Carlos','Castelo','N/A','2015-07-27'),
(@URL,'Mateo','Beltran','N/A','2014-10-08'),
(@URL,'Ramon','Rodriguez','N/A','2016-06-14'),
(@URL,'Khaleb','Sanabia','N/A','2015-09-05'),
(@URL,'Mateo','Amarillas','N/A','2016-01-26'),
(@URL,'Davin','Gutierrez','N/A','2015-03-30'),
(@URL,'Vladimir','Miranda','N/A','2014-12-15'),
-- POTRILLOS
(@URL,'Alexis','Ruiz','N/A','2015-06-06'),
(@URL,'Manuel','Cuen','N/A','2014-09-12'),
(@URL,'Damian','Ruiz','N/A','2016-07-02'),
(@URL,'Yaddiel','Figueroa','N/A','2015-02-09'),
(@URL,'Christian','Ortega','N/A','2015-11-01'),
(@URL,'David','Paredes','N/A','2014-10-28'),
(@URL,'Rodrigo','Gastelum','N/A','2016-04-21'),
(@URL,'Luis Pablo','V.','N/A','2015-08-19'),
(@URL,'Abdiel','Camacho','N/A','2015-12-07'),
(@URL,'Emilio','Hernandez','N/A','2016-05-05'),
(@URL,'Ivan','Franco','N/A','2014-09-25'),
-- BRONCOS
(@URL,'Dioner','Ortiz','N/A','2015-01-06'),
(@URL,'Pedro','Quintero','N/A','2016-02-16'),
(@URL,'Alejandro','Medina','N/A','2014-11-10'),
(@URL,'Angel','Flores','N/A','2015-09-02'),
(@URL,'Jesus','Quintero','N/A','2016-08-15'),
(@URL,'Hermes','Arreola','N/A','2015-03-12'),
(@URL,'Carlos','Borbon','N/A','2014-12-29'),
(@URL,'Vanny','Valenzuela','N/A','2015-05-24'),
(@URL,'Yairk','Bojorquez','N/A','2016-06-09'),
(@URL,'Marco','Fajardo','N/A','2015-02-25'),
(@URL,'Alan','Beltran','N/A','2014-09-30'),
(@URL,'Sergio','Somochi','N/A','2015-07-14'),
-- MUSTANGS
(@URL,'Santiago','Zepeda','N/A','2016-03-18'),
(@URL,'Mauro','Macias','N/A','2015-10-11'),
(@URL,'Santiago','Cisneros','N/A','2014-09-07'),
(@URL,'Nicolas','Perez','N/A','2015-12-19'),
(@URL,'Francisco','Peñuñuri','N/A','2016-08-03'),
(@URL,'Angel','Barra','N/A','2015-01-27'),
(@URL,'Rigo','Cornejo','N/A','2014-11-19'),
(@URL,'Ramon','Garcia','N/A','2016-05-28'),
(@URL,'Emiliano','Gerardo','N/A','2015-06-22'),
(@URL,'Misael','Quintero','N/A','2014-10-03');

-- ===== Asignación a temporada/categoría 9-10
INSERT IGNORE INTO JugadorTemporadaCategoria (id_jugador,id_temporada,id_categoria,asignado_automatico)
SELECT j.id_jugador,@id_temp,@cat_910,1
FROM Jugadores j
WHERE j.fecha_nacimiento BETWEEN '2014-09-01' AND '2016-08-31';

-- ===== Pertenencia a equipos
-- PONYS
INSERT IGNORE INTO JugadorEquipoTemporada (id_jugador,id_equipo_temporada,fecha_alta)
SELECT id_jugador,@e_ponys,'2025-02-10' FROM Jugadores
WHERE (nombres,apellido_paterno) IN
 (('Victoria','Arvizu'),('Alfredo','Gutierrez'),('Mateo','Dominguez'),
  ('Alain','Sanchez'),('Carlos','Castelo'),('Mateo','Beltran'),
  ('Ramon','Rodriguez'),('Khaleb','Sanabia'),('Mateo','Amarillas'),
  ('Davin','Gutierrez'),('Vladimir','Miranda'));

-- POTRILLOS
INSERT IGNORE INTO JugadorEquipoTemporada (id_jugador,id_equipo_temporada,fecha_alta)
SELECT id_jugador,@e_potr,'2025-02-10' FROM Jugadores
WHERE (nombres,apellido_paterno) IN
 (('Alexis','Ruiz'),('Manuel','Cuen'),('Damian','Ruiz'),('Yaddiel','Figueroa'),
  ('Christian','Ortega'),('David','Paredes'),('Rodrigo','Gastelum'),
  ('Luis Pablo','V.'),('Abdiel','Camacho'),('Emilio','Hernandez'),('Ivan','Franco'));

-- BRONCOS
INSERT IGNORE INTO JugadorEquipoTemporada (id_jugador,id_equipo_temporada,fecha_alta)
SELECT id_jugador,@e_broncos,'2025-02-10' FROM Jugadores
WHERE (nombres,apellido_paterno) IN
 (('Dioner','Ortiz'),('Pedro','Quintero'),('Alejandro','Medina'),('Angel','Flores'),
  ('Jesus','Quintero'),('Hermes','Arreola'),('Carlos','Borbon'),('Vanny','Valenzuela'),
  ('Yairk','Bojorquez'),('Marco','Fajardo'),('Alan','Beltran'),('Sergio','Somochi'));

-- MUSTANGS
INSERT IGNORE INTO JugadorEquipoTemporada (id_jugador,id_equipo_temporada,fecha_alta)
SELECT id_jugador,@e_mustangs,'2025-02-10' FROM Jugadores
WHERE (nombres,apellido_paterno) IN
 (('Santiago','Zepeda'),('Mauro','Macias'),('Santiago','Cisneros'),('Nicolas','Perez'),
  ('Francisco','Peñuñuri'),('Angel','Barra'),('Rigo','Cornejo'),('Ramon','Garcia'),
  ('Emiliano','Gerardo'),('Misael','Quintero'));

-- ===== Estadísticas iniciales por jugador
-- Bateo
INSERT IGNORE INTO EstadisticasBateoTemporada
(id_temporada,id_jugador,id_equipo_temporada,apariciones_al_bat,hits,bases_por_bolas,
 carreras,carreras_producidas,sencillos,dobles,triples,home_runs,bases_robadas)
SELECT @id_temp, je.id_jugador, je.id_equipo_temporada, 0,0,0,0,0,0,0,0,0,0
FROM JugadorEquipoTemporada je
JOIN EquipoTemporada et ON et.id_equipo_temporada=je.id_equipo_temporada
WHERE et.id_temporada=@id_temp AND et.id_categoria=@cat_910;

-- Pitcheo
INSERT IGNORE INTO EstadisticasPitcheoTemporada
(id_temporada,id_jugador,id_equipo_temporada,bases_por_bolas,victorias,derrotas,
 entradas_lanzadas,carreras_limpias,ponches)
SELECT @id_temp, je.id_jugador, je.id_equipo_temporada, 0,0,0,0.0,0,0
FROM JugadorEquipoTemporada je
JOIN EquipoTemporada et ON et.id_equipo_temporada=je.id_equipo_temporada
WHERE et.id_temporada=@id_temp AND et.id_categoria=@cat_910;

-- Rendimiento mensual inicial (una fila cero)
INSERT IGNORE INTO EstadisticasRendimientoMensual
(id_temporada,id_jugador,fecha_medicion,tiempo_carrera_seg,vel_lanzamiento_mph,
 potencia_brazo_mph,pop_time_seg,vel_bate_mph)
SELECT @id_temp, je.id_jugador, '2025-02-15', 0.00,0.00,0.00,0.00,0.00
FROM JugadorEquipoTemporada je
JOIN EquipoTemporada et ON et.id_equipo_temporada=je.id_equipo_temporada
WHERE et.id_temporada=@id_temp AND et.id_categoria=@cat_910;
