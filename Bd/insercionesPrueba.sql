USE academia_bd;

START TRANSACTION;

-- 1) Temporada
INSERT INTO Temporadas (nombre, fecha_inicio, fecha_fin, fecha_corte_edad, is_activa)
VALUES ('2025','2025-01-01','2025-12-31','2025-08-31',1);
SET @id_temp_2025 = LAST_INSERT_ID();

-- 2) Categoría
INSERT INTO Categorias (nombre_categoria, edad_min, edad_max)
VALUES ('7-8',7,8);
SET @id_cat_78 = LAST_INSERT_ID();

-- 3) Rango por temporada
INSERT INTO CategoriaTemporadaRango (id_temporada, id_categoria, nacimiento_desde, nacimiento_hasta)
VALUES (@id_temp_2025, @id_cat_78, '2016-09-01', '2018-08-31');

-- 4) Usuarios (admin, coordinador, estadísticas)
INSERT INTO UsuarioAdministradores (usuario, contra, rol) VALUES
('admin','hash_admin','ADMIN'),
('coord_78_2025','hash_coord','COORDINADOR'),
('stats_78_2025','hash_stats','ESTADISTICAS');

SET @base_user := LAST_INSERT_ID();      -- id de 'admin'
SET @id_user_admin := @base_user;        -- admin
SET @id_user_coord := @base_user + 1;    -- coordinador
SET @id_user_stats := @base_user + 2;    -- estadísticas


-- 5) Coordinador (persona)
INSERT INTO Coordinadores (url_foto, nombres, apellido_paterno, apellido_materno)
VALUES (NULL,'Carlos','López','Mendoza');
SET @id_coord1 = LAST_INSERT_ID();

-- 6) Asignación de coordinador a categoría-temporada (único)
INSERT INTO CoordinadorTemporadaCategoria (id_coordinador, id_temporada, id_categoria)
VALUES (@id_coord1, @id_temp_2025, @id_cat_78);

-- 7) Alcance por rol de usuarios (único por rol-categoría-temporada)
INSERT INTO UsuarioRolTemporadaCategoria (id_usuario, rol, id_temporada, id_categoria, alias)
VALUES (@id_user_coord, 'COORDINADOR',  @id_temp_2025, @id_cat_78, 'Coord 7-8 2025'),
       (@id_user_stats, 'ESTADISTICAS', @id_temp_2025, @id_cat_78, 'Stats 7-8 2025');

-- 8) Entrenador
INSERT INTO Entrenadores (nombres, apellido_paterno, apellido_materno)
VALUES ('Miguel','Ramírez','Soto');
SET @id_entrenador1 = LAST_INSERT_ID();

-- 9) Jugador
INSERT INTO Jugadores (url_foto, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, activo)
VALUES (NULL,'Gael','Meneses','García','2017-05-10',1);
SET @id_jug1 = LAST_INSERT_ID();

-- 10) Jugador -> categoría-temporada
INSERT INTO JugadorTemporadaCategoria (id_jugador, id_temporada, id_categoria, asignado_automatico)
VALUES (@id_jug1, @id_temp_2025, @id_cat_78, 1);

-- 11) Equipo base
INSERT INTO Equipos (nombre_corto) VALUES ('Potros');
SET @id_equipo_base = LAST_INSERT_ID();

-- 12) Equipo en temporada-categoría
INSERT INTO EquipoTemporada (id_equipo, id_temporada, id_categoria, nombre, colores, url_foto, id_entrenador)
VALUES (@id_equipo_base, @id_temp_2025, @id_cat_78, 'Potros', 'Rojo/Blanco', NULL, @id_entrenador1);
SET @id_equipo_temp1 = LAST_INSERT_ID();

-- 13) Alta del jugador en el equipo
INSERT INTO JugadorEquipoTemporada (id_jugador, id_equipo_temporada, fecha_alta)
VALUES (@id_jug1, @id_equipo_temp1, '2025-02-01');

-- 14) Stats bateo jugador-temporada
INSERT INTO EstadisticasBateoTemporada (
  id_temporada, id_jugador, id_equipo_temporada,
  apariciones_al_bat, hits, bases_por_bolas, carreras, carreras_producidas,
  sencillos, dobles, triples, home_runs, bases_robadas
) VALUES (
  @id_temp_2025, @id_jug1, @id_equipo_temp1,
  20, 8, 3, 6, 5,
  5, 2, 0, 1, 4
);

-- 15) Stats pitcheo jugador-temporada
INSERT INTO EstadisticasPitcheoTemporada (
  id_temporada, id_jugador, id_equipo_temporada,
  bases_por_bolas, victorias, derrotas, entradas_lanzadas,
  carreras_limpias, ponches
) VALUES (
  @id_temp_2025, @id_jug1, @id_equipo_temp1,
  2, 1, 0, 7.0,
  1, 9
);

-- 16) Stats equipo-temporada
INSERT INTO EstadisticasEquipoTemporada (
  id_temporada, id_equipo_temporada,
  carreras_en_contra, carreras_a_favor, ganados, perdidos, empatados, errores
) VALUES (
  @id_temp_2025, @id_equipo_temp1,
  12, 28, 3, 1, 0, 3
);

-- 17) Métrica mensual de rendimiento del jugador
INSERT INTO EstadisticasRendimientoMensual (
  id_temporada, id_jugador, fecha_medicion,
  tiempo_carrera_seg, vel_lanzamiento_mph, potencia_brazo_mph, pop_time_seg, vel_bate_mph
) VALUES (
  @id_temp_2025, @id_jug1, '2025-03-15',
  7.10, 54.30, 56.80, 2.15, 62.40
);

-- 18) Mínimo de apariciones para clasificar
INSERT INTO MinimoAparicionesBateoTemporada (id_temporada, habilitado, min_apariciones)
VALUES (@id_temp_2025, 1, 15);

COMMIT;
