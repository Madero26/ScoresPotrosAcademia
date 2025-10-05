-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS academia_bd;
USE academia_bd;

-- 1) Temporadas
CREATE TABLE Temporadas (
  id_temporada INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,           -- ej. "2025", "2025-Primavera"
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  fecha_corte_edad DATE NOT NULL,         -- ej. 2025-08-31
  is_activa TINYINT(1) DEFAULT 0,
  UNIQUE KEY uq_temporada_nombre (nombre)
);

-- 2) Categorías
CREATE TABLE Categorias (
  id_categoria INT AUTO_INCREMENT PRIMARY KEY,
  nombre_categoria VARCHAR(100) NOT NULL, -- ej. "7-8", "9-10"
  edad_min INT NOT NULL,
  edad_max INT NOT NULL
);

-- 3) Rangos por temporada
CREATE TABLE CategoriaTemporadaRango (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_temporada INT NOT NULL,
  id_categoria INT NOT NULL,
  nacimiento_desde DATE NOT NULL,
  nacimiento_hasta DATE NOT NULL,
  FOREIGN KEY (id_temporada) REFERENCES Temporadas(id_temporada) ON DELETE CASCADE,
  FOREIGN KEY (id_categoria) REFERENCES Categorias(id_categoria) ON DELETE RESTRICT,
  UNIQUE KEY uq_cat_temp (id_temporada, id_categoria)
);

-- 4) Usuarios (admin / coordinador / estadísticas)
CREATE TABLE UsuarioAdministradores (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  usuario VARCHAR(50) NOT NULL,
  contra VARCHAR(255) NOT NULL,           -- hash
  rol ENUM('ADMIN','COORDINADOR','ESTADISTICAS') NOT NULL
);

-- 5) Coordinadores (persona, sin vínculo a usuario)
CREATE TABLE Coordinadores (
  id_coordinador INT AUTO_INCREMENT PRIMARY KEY,
  url_foto VARCHAR(255),
  nombres VARCHAR(100) NOT NULL,
  apellido_paterno VARCHAR(100) NOT NULL,
  apellido_materno VARCHAR(100) NOT NULL
);

-- 6) Asignación de coordinador por temporada/categoría (máximo uno)
CREATE TABLE CoordinadorTemporadaCategoria (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_coordinador INT NOT NULL,
  id_temporada INT NOT NULL,
  id_categoria INT NOT NULL,
  FOREIGN KEY (id_coordinador) REFERENCES Coordinadores(id_coordinador) ON DELETE CASCADE,
  FOREIGN KEY (id_temporada) REFERENCES Temporadas(id_temporada) ON DELETE CASCADE,
  FOREIGN KEY (id_categoria) REFERENCES Categorias(id_categoria) ON DELETE RESTRICT,
  -- Solo un coordinador por (temporada, categoría)
  UNIQUE KEY uq_unico_coord_por_cat (id_temporada, id_categoria)
);

-- 7) Alcance por rol de usuario (coordinador/estadísticas) con alias
CREATE TABLE UsuarioRolTemporadaCategoria (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario  INT NOT NULL,
  rol ENUM('COORDINADOR','ESTADISTICAS') NOT NULL,
  id_temporada INT NOT NULL,
  id_categoria INT NOT NULL,
  alias VARCHAR(100) NOT NULL,            -- nombre/etiqueta visible para el rol en esa categoría
  FOREIGN KEY (id_usuario)   REFERENCES UsuarioAdministradores(id_usuario) ON DELETE CASCADE,
  FOREIGN KEY (id_temporada) REFERENCES Temporadas(id_temporada)          ON DELETE CASCADE,
  FOREIGN KEY (id_categoria) REFERENCES Categorias(id_categoria)           ON DELETE RESTRICT,
  -- Solo un usuario por rol en cada (temporada, categoría)
  UNIQUE KEY uq_un_usuario_por_rol_cat (rol, id_temporada, id_categoria)
);

-- 8) Entrenadores
CREATE TABLE Entrenadores (
  id_entrenador INT AUTO_INCREMENT PRIMARY KEY,
  nombres VARCHAR(100) NOT NULL,
  apellido_paterno VARCHAR(100) NOT NULL,
  apellido_materno VARCHAR(100) NOT NULL
);

-- 9) Jugadores
CREATE TABLE Jugadores (
  id_jugador INT AUTO_INCREMENT PRIMARY KEY,
  url_foto VARCHAR(255),
  nombres VARCHAR(100) NOT NULL,
  apellido_paterno VARCHAR(100) NOT NULL,
  apellido_materno VARCHAR(100) NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  activo TINYINT(1) DEFAULT 1
);

-- 10) Asignación del jugador a categoría por temporada
CREATE TABLE JugadorTemporadaCategoria (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_jugador INT NOT NULL,
  id_temporada INT NOT NULL,
  id_categoria INT NOT NULL,
  asignado_automatico TINYINT(1) DEFAULT 1,
  fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_jugador) REFERENCES Jugadores(id_jugador) ON DELETE CASCADE,
  FOREIGN KEY (id_temporada) REFERENCES Temporadas(id_temporada) ON DELETE CASCADE,
  FOREIGN KEY (id_categoria) REFERENCES Categorias(id_categoria) ON DELETE RESTRICT,
  UNIQUE KEY uq_jug_temp (id_jugador, id_temporada)  -- una categoría por temporada
);

-- 11) Equipos (identidad base)
CREATE TABLE Equipos (
  id_equipo INT AUTO_INCREMENT PRIMARY KEY,
  nombre_corto VARCHAR(50) NOT NULL,
  UNIQUE KEY uq_equipo_nombre (nombre_corto)
);

-- 12) Equipo por temporada (instancia real que juega)
CREATE TABLE EquipoTemporada (
  id_equipo_temporada INT AUTO_INCREMENT PRIMARY KEY,
  id_equipo INT,
  id_temporada INT NOT NULL,
  id_categoria INT NOT NULL,
  nombre VARCHAR(80) NOT NULL,           -- puede repetirse entre categorías; no dentro de la misma categoría-temporada
  colores VARCHAR(50) NOT NULL,
  url_foto VARCHAR(255),
  id_entrenador INT,
  FOREIGN KEY (id_equipo) REFERENCES Equipos(id_equipo) ON DELETE SET NULL,
  FOREIGN KEY (id_temporada) REFERENCES Temporadas(id_temporada) ON DELETE CASCADE,
  FOREIGN KEY (id_categoria) REFERENCES Categorias(id_categoria) ON DELETE RESTRICT,
  FOREIGN KEY (id_entrenador) REFERENCES Entrenadores(id_entrenador) ON DELETE SET NULL,
  UNIQUE KEY uq_equipo_temp_nombre (id_temporada, id_categoria, nombre)
);

-- 13) Pertenencia del jugador al equipo en la temporada
CREATE TABLE JugadorEquipoTemporada (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_jugador INT NOT NULL,
  id_equipo_temporada INT NOT NULL,
  fecha_alta DATE DEFAULT NULL,
  fecha_baja DATE DEFAULT NULL,
  FOREIGN KEY (id_jugador) REFERENCES Jugadores(id_jugador) ON DELETE CASCADE,
  FOREIGN KEY (id_equipo_temporada) REFERENCES EquipoTemporada(id_equipo_temporada) ON DELETE CASCADE,
  UNIQUE KEY uq_plantel (id_jugador, id_equipo_temporada)
);

-- 14) Estadísticas de bateo por temporada (totales)
CREATE TABLE EstadisticasBateoTemporada (
  id_estadistica INT AUTO_INCREMENT PRIMARY KEY,
  id_temporada INT NOT NULL,
  id_jugador INT NOT NULL,
  id_equipo_temporada INT NULL,          -- referencia del equipo del jugador en esa temporada
  apariciones_al_bat INT DEFAULT 0,      -- antes "turnos"
  hits INT DEFAULT 0,
  bases_por_bolas INT DEFAULT 0,
  carreras INT DEFAULT 0,
  carreras_producidas INT DEFAULT 0,
  sencillos INT DEFAULT 0,
  dobles INT DEFAULT 0,
  triples INT DEFAULT 0,
  home_runs INT DEFAULT 0,
  bases_robadas INT DEFAULT 0,
  promedio_bateo DECIMAL(5,3) GENERATED ALWAYS AS (
    CASE WHEN apariciones_al_bat > 0
         THEN ROUND(hits / apariciones_al_bat, 3)
         ELSE 0.000
    END
  ) STORED,
  FOREIGN KEY (id_temporada) REFERENCES Temporadas(id_temporada) ON DELETE CASCADE,
  FOREIGN KEY (id_jugador) REFERENCES Jugadores(id_jugador) ON DELETE CASCADE,
  FOREIGN KEY (id_equipo_temporada) REFERENCES EquipoTemporada(id_equipo_temporada) ON DELETE SET NULL,
  UNIQUE KEY uq_bateo (id_temporada, id_jugador)
);

-- 15) Estadísticas de pitcheo por temporada (totales)
CREATE TABLE EstadisticasPitcheoTemporada (
  id_estadistica INT AUTO_INCREMENT PRIMARY KEY,
  id_temporada INT NOT NULL,
  id_jugador INT NOT NULL,
  id_equipo_temporada INT NULL,          -- referencia del equipo del jugador en esa temporada
  bases_por_bolas INT DEFAULT 0,
  victorias INT DEFAULT 0,
  derrotas INT DEFAULT 0,
  entradas_lanzadas DECIMAL(5,1) DEFAULT 0.0,
  carreras_limpias INT DEFAULT 0,
  ponches INT DEFAULT 0,
  efectividad DECIMAL(6,3) GENERATED ALWAYS AS (
    CASE WHEN entradas_lanzadas > 0
         THEN ROUND((carreras_limpias * 9) / entradas_lanzadas, 3)
         ELSE 0.000
    END
  ) STORED,
  FOREIGN KEY (id_temporada) REFERENCES Temporadas(id_temporada) ON DELETE CASCADE,
  FOREIGN KEY (id_jugador) REFERENCES Jugadores(id_jugador) ON DELETE CASCADE,
  FOREIGN KEY (id_equipo_temporada) REFERENCES EquipoTemporada(id_equipo_temporada) ON DELETE SET NULL,
  UNIQUE KEY uq_pitcheo (id_temporada, id_jugador)
);

-- 16) Estadísticas de equipo por temporada
CREATE TABLE EstadisticasEquipoTemporada (
  id_estadistica INT AUTO_INCREMENT PRIMARY KEY,
  id_temporada INT NOT NULL,
  id_equipo_temporada INT NOT NULL,
  carreras_en_contra INT DEFAULT 0,
  carreras_a_favor INT DEFAULT 0,
  ganados INT DEFAULT 0,
  perdidos INT DEFAULT 0,
  empatados INT DEFAULT 0,
  puntos INT DEFAULT 0,
  errores INT DEFAULT 0,
  FOREIGN KEY (id_temporada) REFERENCES Temporadas(id_temporada) ON DELETE CASCADE,
  FOREIGN KEY (id_equipo_temporada) REFERENCES EquipoTemporada(id_equipo_temporada) ON DELETE CASCADE,
  UNIQUE KEY uq_team_stats (id_temporada, id_equipo_temporada)
);

-- 17) Métricas mensuales por jugador y temporada (básica, sin UNIQUE extra)
CREATE TABLE IF NOT EXISTS EstadisticasRendimientoMensual (
  id_estadistica INT AUTO_INCREMENT PRIMARY KEY,
  id_temporada INT NOT NULL,
  id_jugador INT NOT NULL,
  fecha_medicion DATE NOT NULL,
  tiempo_carrera_seg   DECIMAL(5,2) NOT NULL DEFAULT 0.00,  -- s
  vel_lanzamiento_mph  DECIMAL(5,2) NOT NULL DEFAULT 0.00,  -- mph
  potencia_brazo_mph   DECIMAL(5,2) NOT NULL DEFAULT 0.00,  -- mph
  pop_time_seg         DECIMAL(5,2) NOT NULL DEFAULT 0.00,  -- s
  vel_bate_mph         DECIMAL(5,2) NOT NULL DEFAULT 0.00,  -- mph
  FOREIGN KEY (id_temporada) REFERENCES Temporadas(id_temporada) ON DELETE CASCADE,
  FOREIGN KEY (id_jugador)   REFERENCES Jugadores(id_jugador)   ON DELETE CASCADE
);

CREATE TABLE MinimoAparicionesBateoTemporada (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_temporada INT NOT NULL,
  habilitado TINYINT(1) NOT NULL DEFAULT 1,  -- booleano
  min_apariciones INT NOT NULL DEFAULT 0,    -- número mínimo
  FOREIGN KEY (id_temporada) REFERENCES Temporadas(id_temporada) ON DELETE CASCADE
);
