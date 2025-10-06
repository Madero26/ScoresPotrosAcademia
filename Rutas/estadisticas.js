// Rutas/estadisticas.js
const express = require('express');
const router = express.Router();
const db = require('../database/conexion');

const SCHEMA = process.env.DB_NAME || 'academia_bd';
const T = (t) => `\`${SCHEMA}\`.${t}`;

// wrapper
const q = async (sql, p = []) => {
  const r = await db.query(sql, p);
  return Array.isArray(r) && Array.isArray(r[0]) ? r[0] : (Array.isArray(r) ? r : (r?.rows || []));
};


const getTemporadas = () =>
  q(`SELECT id_temporada, nombre FROM ${T('Temporadas')} ORDER BY fecha_inicio DESC`);

const getTempActivaOReciente = async () => {
  const a = await q(`SELECT id_temporada FROM ${T('Temporadas')} WHERE is_activa=1 ORDER BY fecha_inicio DESC LIMIT 1`);
  if (a.length) return a[0].id_temporada;
  const r = await q(`SELECT id_temporada FROM ${T('Temporadas')} ORDER BY fecha_inicio DESC LIMIT 1`);
  return r[0]?.id_temporada ?? null;
};

// Categorías por temporada
router.get('/', async (req, res, next) => {
  try {
    const temporadas = await getTemporadas();
    const idTemp = Number(req.query.temporada) || await getTempActivaOReciente();

    const cats = await q(`
      SELECT c.id_categoria, c.nombre_categoria, NULL AS url_foto
      FROM ${T('CategoriaTemporadaRango')} ctr
      JOIN ${T('Categorias')} c ON c.id_categoria = ctr.id_categoria
      WHERE ctr.id_temporada = ?
      ORDER BY c.edad_min, c.edad_max
    `, [idTemp]);

    // debug rápido
    if (!temporadas.length) console.warn('Temporadas vacío');
    if (!cats.length) console.warn('Cats vacío para temporada', idTemp);

    res.render('Publico/Estadisticas/Categorias', { temporadas, idTemp, cats });
  } catch (e) { next(e); }
});

// Equipos por categoría
router.get('/categoria/:idCat', async (req, res, next) => {
  try {
    const idTemp = Number(req.query.temporada) || await getTempActivaOReciente();
    const cat = (await q(`SELECT nombre_categoria FROM ${T('Categorias')} WHERE id_categoria=?`, [req.params.idCat]))[0];

    const teams = await q(`
      SELECT et.id_equipo_temporada, et.nombre, et.colores, et.url_foto
      FROM ${T('EquipoTemporada')} et
      WHERE et.id_temporada=? AND et.id_categoria=?
      ORDER BY et.nombre
    `, [idTemp, req.params.idCat]);

    res.render('Publico/Estadisticas/Equipos', {
      teams, idCat: req.params.idCat, idTemp, categoriaNombre: cat?.nombre_categoria || ''
    });
  } catch (e) { next(e); }
});

// helper: toma temporada de la query o usa activa/reciente
const getTemp = async (req) =>
  Number(req.query.temporada) || await getTempActivaOReciente();

/* 3) Estadísticas del equipo */
router.get('/categoria/:idCat/equipo/:idEt', async (req, res, next) => {
  try {
    const idTemp = await getTemp(req);
    const et = (await q(
      `SELECT nombre, url_foto FROM ${T('EquipoTemporada')} WHERE id_equipo_temporada=?`,
      [req.params.idEt]
    ))[0];

    const stats = (await q(
      `SELECT * FROM ${T('EstadisticasEquipoTemporada')}
       WHERE id_temporada=? AND id_equipo_temporada=?`,
      [idTemp, req.params.idEt]
    ))[0] || null;

    res.render('Publico/Estadisticas/EquipoStats', {
      equipoNombre: et?.nombre || 'Equipo',
      logoUrl: et?.url_foto || null,
      estadisticas: stats,
      idTemp
    });
  } catch (e) { next(e); }
});


/* 4) Jugadores del equipo: bateo + pitcheo */
router.get('/categoria/:idCat/jugadores', async (req, res, next) => {
  try {
    const idTemp = await getTemp(req);
    const idEt = Number(req.query.equipo) || 0;

    const jugadores = await q(`
      SELECT
        j.id_jugador, j.nombres, j.apellido_paterno, j.apellido_materno,
        /* Bateo */
        COALESCE(b.apariciones_al_bat,0) AS apariciones_al_bat,
        COALESCE(b.hits,0)               AS hits,
        COALESCE(b.sencillos,0)          AS sencillos,
        COALESCE(b.dobles,0)             AS dobles,
        COALESCE(b.triples,0)            AS triples,
        COALESCE(b.home_runs,0)          AS home_runs,
        COALESCE(b.bases_robadas,0)      AS bases_robadas,
        COALESCE(b.bases_por_bolas,0)    AS bases_por_bolas,
        COALESCE(b.carreras,0)           AS carreras,
        COALESCE(b.carreras_producidas,0) AS carreras_producidas,
        COALESCE(b.promedio_bateo,0.000) AS promedio_bateo,
        /* Pitcheo */
        COALESCE(p.entradas_lanzadas,0)  AS entradas_lanzadas,
        COALESCE(p.bases_por_bolas,0)    AS bb,
        COALESCE(p.ponches,0)            AS ponches,
        COALESCE(p.victorias,0)          AS victorias,
        COALESCE(p.derrotas,0)           AS derrotas,
        COALESCE(p.efectividad,0.00)     AS efectividad
      FROM ${T('JugadorEquipoTemporada')} jet
      JOIN ${T('Jugadores')} j ON j.id_jugador = jet.id_jugador
      LEFT JOIN ${T('EstadisticasBateoTemporada')}  b ON b.id_temporada=? AND b.id_jugador=j.id_jugador
      LEFT JOIN ${T('EstadisticasPitcheoTemporada')} p ON p.id_temporada=? AND p.id_jugador=j.id_jugador
      WHERE jet.id_equipo_temporada=?
      ORDER BY j.apellido_paterno, j.apellido_materno, j.nombres
    `, [idTemp, idTemp, idEt]);

    // Rutas/estadisticas.js  (jugadores del equipo)
    res.render('Publico/Estadisticas/Jugadores', {
      jugadores, idTemp, idCat: req.params.idCat, idEt,
      idEquipo: idEt      // <-- agrega esto
    });

  } catch (e) { next(e); }
});

/* 5) Buscador para datalist (opcional) */
router.get('/categoria/:idCat/buscar', async (req, res, next) => {
  try {
    const idTemp = await getTemp(req);
    const qtext = `%${(req.query.q || '').trim()}%`;
    const rows = await q(`
      SELECT j.id_jugador,
             CONCAT(j.apellido_paterno,' ',j.apellido_materno,' ',j.nombres) AS nombre
      FROM ${T('JugadorTemporadaCategoria')} jtc
      JOIN ${T('Jugadores')} j ON j.id_jugador=jtc.id_jugador
      WHERE jtc.id_temporada=? AND jtc.id_categoria=? AND
            CONCAT(j.nombres,' ',j.apellido_paterno,' ',j.apellido_materno) LIKE ?
      ORDER BY j.apellido_paterno, j.apellido_materno, j.nombres
      LIMIT 15
    `, [idTemp, req.params.idCat, qtext]);
    res.json(rows);
  } catch (e) { next(e); }
});

/* 6) Perfil del jugador */
router.get('/perfilJugador/:idJug', async (req, res, next) => {
  try {
    const idTemp = await getTemp(req);
    const jug = (await q(`SELECT * FROM ${T('Jugadores')} WHERE id_jugador=?`, [req.params.idJug]))[0];

    const cat = (await q(`
      SELECT c.nombre_categoria
      FROM ${T('JugadorTemporadaCategoria')} jtc
      JOIN ${T('Categorias')} c ON c.id_categoria=jtc.id_categoria
      WHERE jtc.id_jugador=? AND jtc.id_temporada=?`,
      [req.params.idJug, idTemp]))[0];

    const et = (await q(`
      SELECT et.nombre
      FROM ${T('JugadorEquipoTemporada')} jet
      JOIN ${T('EquipoTemporada')} et ON et.id_equipo_temporada=jet.id_equipo_temporada
      WHERE jet.id_jugador=? ORDER BY jet.fecha_alta DESC LIMIT 1`, [req.params.idJug]))[0];

    const bat = (await q(`
      SELECT * FROM ${T('EstadisticasBateoTemporada')}
      WHERE id_temporada=? AND id_jugador=?`, [idTemp, req.params.idJug]))[0] || null;

    const pit = (await q(`
      SELECT * FROM ${T('EstadisticasPitcheoTemporada')}
      WHERE id_temporada=? AND id_jugador=?`, [idTemp, req.params.idJug]))[0] || null;

    const rend = await q(`
      SELECT fecha_medicion, tiempo_carrera_seg, vel_lanzamiento_mph,
             potencia_brazo_mph, pop_time_seg, vel_bate_mph
      FROM ${T('EstadisticasRendimientoMensual')}
      WHERE id_temporada=? AND id_jugador=?
      ORDER BY fecha_medicion DESC`, [idTemp, req.params.idJug]);

    // ...
res.render('Publico/Estadisticas/JugadorPerfil', {
  jugador: jug || {},
  categoriaNombre: cat?.nombre_categoria || '',
  equipoNombre: et?.nombre || '',
  bateo: bat || {},
  pitcheo: pit || {},
  rendimiento: rend || [],
  idTemp
});
// ...

  } catch (e) { next(e); }
});
// API: jugadores por equipo o por categoría (para el <select>)
router.get('/api/jugadores', async (req, res, next) => {
  try {
    const idTemp = await getTemp(req);
    const { team, cat } = req.query;

    if (team) {
      const rows = await q(`
        SELECT j.id_jugador,
               CONCAT(j.apellido_paterno,' ',j.apellido_materno,' ',j.nombres) AS nombre
        FROM ${T('JugadorEquipoTemporada')} jet
        JOIN ${T('Jugadores')} j ON j.id_jugador = jet.id_jugador
        WHERE jet.id_equipo_temporada=?
        ORDER BY j.apellido_paterno, j.apellido_materno, j.nombres
      `,[team]);
      return res.json(rows);
    }

    if (cat) {
      const rows = await q(`
        SELECT j.id_jugador,
               CONCAT(j.apellido_paterno,' ',j.apellido_materno,' ',j.nombres) AS nombre
        FROM ${T('JugadorTemporadaCategoria')} jtc
        JOIN ${T('Jugadores')} j ON j.id_jugador=jtc.id_jugador
        WHERE jtc.id_temporada=? AND jtc.id_categoria=?
        ORDER BY j.apellido_paterno, j.apellido_materno, j.nombres
      `,[idTemp, cat]);
      return res.json(rows);
    }

    res.json([]);
  } catch (e) { next(e); }
});


module.exports = router;






