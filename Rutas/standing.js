// Rutas/standing.js
const express = require('express');
const router = express.Router();
const db = require('../database/conexion');

const SCHEMA = process.env.DB_NAME || 'academia_bd';
const T = (t) => `\`${SCHEMA}\`.${t}`;

const q = async (sql, p = []) => {
  const r = await db.query(sql, p);
  return Array.isArray(r) && Array.isArray(r[0]) ? r[0] : (Array.isArray(r) ? r : (r?.rows || []));
};

const getTemporadas = () =>
  q(`SELECT id_temporada, nombre FROM ${T('Temporadas')} ORDER BY fecha_inicio DESC`);

const getTempActivaOReciente = async () => {
  const a = await q(`
    SELECT id_temporada FROM ${T('Temporadas')}
    WHERE is_activa=1 ORDER BY fecha_inicio DESC LIMIT 1`);
  if (a.length) return a[0].id_temporada;
  const r = await q(`
    SELECT id_temporada FROM ${T('Temporadas')}
    ORDER BY fecha_inicio DESC LIMIT 1`);
  return r[0]?.id_temporada ?? null;
};

// Helpers
const getTemp = async (req) => Number(req.query.temporada) || await getTempActivaOReciente();

// Página de categorías por temporada (inicio del Standing)
router.get('/', async (req, res, next) => {
  try {
    const temporadas = await getTemporadas();
    const idTemp = Number(req.query.temporada) || await getTempActivaOReciente();

const cats = await q(`
  SELECT 
    c.id_categoria,
    c.nombre_categoria,
    NULL AS url_foto          -- <- ya no pedimos c.url_foto
  FROM ${T('CategoriaTemporadaRango')} ctr
  JOIN ${T('Categorias')} c ON c.id_categoria = ctr.id_categoria
  WHERE ctr.id_temporada = ?
  ORDER BY c.edad_min, c.edad_max
`, [idTemp]);


    res.render('Publico/Standing/Categorias', { temporadas, idTemp, cats });
  } catch (e) { next(e); }
});


// 2) Standing por categoría
router.get('/categoria/:idCat', async (req, res, next) => {
  try {
    const idTemp = await getTemp(req);
    const idCat = Number(req.params.idCat);

    const cat = (await q(`SELECT nombre_categoria FROM ${T('Categorias')} WHERE id_categoria=?`, [idCat]))[0];

    const rows = await q(`
      SELECT
        et.id_equipo_temporada,
        et.nombre AS equipo,
        COALESCE(NULLIF(et.url_foto,''), 'resources/imgs/logo.png') AS url_foto,
        COALESCE(es.ganados,0)              AS w,
        COALESCE(es.perdidos,0)             AS l,
        COALESCE(es.empatados,0)            AS t,
        COALESCE(es.carreras_a_favor,0)     AS gf,
        COALESCE(es.carreras_en_contra,0)   AS gc,
        COALESCE(es.errores,0)              AS err
      FROM ${T('EquipoTemporada')} et
      LEFT JOIN ${T('EstadisticasEquipoTemporada')} es
        ON es.id_temporada = ? AND es.id_equipo_temporada = et.id_equipo_temporada
      WHERE et.id_temporada = ? AND et.id_categoria = ?
      ORDER BY w DESC, gf DESC, gc ASC, equipo ASC
    `, [idTemp, idTemp, idCat]);

    // ranking con empates + métricas derivadas
    let rank = 0;
    let prevKey = null;

    const tabla = rows.map((r, i) => {
      const key = `${r.w}|${r.gf}|${r.gc}`;
      if (key === prevKey) {
        r.rank = rank; r.empate = true;
      } else {
        rank = i + 1; r.rank = rank; r.empate = false; prevKey = key;
      }
      const juegos = r.w + r.l + r.t;
      r.pct = juegos ? (r.w / juegos) : 0;
      r.dif = r.gf - r.gc;
      return r;
    });

    res.render('Publico/Standing/Tabla', {
      idTemp, idCat, categoriaNombre: cat?.nombre_categoria || '',
      tabla
    });
  } catch (e) { next(e); }
});


module.exports = router;

