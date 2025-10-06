// Rutas/coordinador.js
const express = require('express');
const router = express.Router();
const db = require('../database/conexion');

const SCHEMA = process.env.DB_NAME || 'academia_bd';
const T = (t) => `\`${SCHEMA}\`.${t}`;

const q = async (sql, p = []) => {
  const r = await db.query(sql, p);
  return Array.isArray(r) && Array.isArray(r[0]) ? r[0] : (Array.isArray(r) ? r : (r?.rows || []));
};

const getTempActivaOReciente = async () => {
  const a = await q(`
    SELECT id_temporada
    FROM ${T('Temporadas')}
    WHERE is_activa=1
    ORDER BY fecha_inicio DESC
    LIMIT 1`);
  if (a.length) return a[0].id_temporada;
  const r = await q(`
    SELECT id_temporada
    FROM ${T('Temporadas')}
    ORDER BY fecha_inicio DESC
    LIMIT 1`);
  return r[0]?.id_temporada ?? null;
};

router.get('/', async (req, res, next) => {
  try {
    const idTemp = Number(req.query.temporada) || await getTempActivaOReciente();

    const rows = await q(`
      SELECT 
        c.id_coordinador,
        COALESCE(NULLIF(c.url_foto,''), 'resources/imgs/logo.png') AS url_foto,
        c.nombres, c.apellido_paterno, c.apellido_materno,
        cat.nombre_categoria
      FROM ${T('CoordinadorTemporadaCategoria')} ctc
      JOIN ${T('Coordinadores')} c     ON c.id_coordinador = ctc.id_coordinador
      JOIN ${T('Categorias')}    cat   ON cat.id_categoria = ctc.id_categoria
      WHERE ctc.id_temporada = ?
      ORDER BY c.apellido_paterno, c.apellido_materno, c.nombres, cat.edad_min, cat.edad_max
    `, [idTemp]);

    let coordinadores = [];
    if (rows.length) {
      const map = new Map();
      rows.forEach(r => {
        if (!map.has(r.id_coordinador)) {
          map.set(r.id_coordinador, {
            id_coordinador: r.id_coordinador,
            url_foto: r.url_foto,
            nombres: r.nombres,
            apellido_paterno: r.apellido_paterno,
            apellido_materno: r.apellido_materno,
            categorias: []
          });
        }
        map.get(r.id_coordinador).categorias.push(r.nombre_categoria);
      });
      coordinadores = Array.from(map.values());
    } else {
      // Fallback: lista base sin categorías (por si no hay asignaciones cargadas aún)
      const base = await q(`
        SELECT 
          id_coordinador,
          COALESCE(NULLIF(url_foto,''), 'resources/imgs/logo.png') AS url_foto,
          nombres, apellido_paterno, apellido_materno
        FROM ${T('Coordinadores')}
        ORDER BY apellido_paterno, apellido_materno, nombres
      `);
      coordinadores = base.map(c => ({ ...c, categorias: [] }));
    }

    res.render('Publico/Coordinadores/Lista', { coordinadores, idTemp });
  } catch (e) { next(e); }
});

module.exports = router;

