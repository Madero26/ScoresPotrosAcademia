// Rutas/jugadoresDestacados.js
const express = require('express');
const router = express.Router();
const db = require('../database/conexion');

const SCHEMA = process.env.DB_NAME || 'academia_bd';
const T = t => `\`${SCHEMA}\`.${t}`;
const q = async (sql, p = []) => {
  const r = await db.query(sql, p);
  return Array.isArray(r) && Array.isArray(r[0]) ? r[0] : (Array.isArray(r) ? r : (r?.rows || []));
};

// helpers temporada
const getTemporadas = () =>
  q(`SELECT id_temporada, nombre FROM ${T('Temporadas')} ORDER BY fecha_inicio DESC`);

const getTempActivaOReciente = async () => {
  const a = await q(`SELECT id_temporada FROM ${T('Temporadas')} WHERE is_activa=1 ORDER BY fecha_inicio DESC LIMIT 1`);
  if (a.length) return a[0].id_temporada;
  const r = await q(`SELECT id_temporada FROM ${T('Temporadas')} ORDER BY fecha_inicio DESC LIMIT 1`);
  return r[0]?.id_temporada ?? null;
};

// 1) Vista de categorías
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

    res.render('Publico/Destacados/Categorias', { temporadas, idTemp, cats });
  } catch (e) { next(e); }
});

// 2) Menú de métricas por categoría
router.get('/categoria/:idCat', async (req, res, next) => {
  try {
    const idTemp = Number(req.query.temporada) || await getTempActivaOReciente();
    const cat = (await q(`SELECT nombre_categoria FROM ${T('Categorias')} WHERE id_categoria=?`, [req.params.idCat]))[0];

    res.render('Publico/Destacados/Menu', {
      categoriaNombre: cat?.nombre_categoria || '',
      categoriaID: req.params.idCat,
      idTemp
    });
  } catch (e) { next(e); }
});

// 3) Tabla paginada de una métrica
router.get('/categoria/:idCat/estadisticas/:tipo', async (req, res, next) => {
  try {
    const idTemp = Number(req.query.temporada) || await getTempActivaOReciente();
    const idCat = Number(req.params.idCat);
    const tipo = String(req.params.tipo || '').toLowerCase();
    const pagina = Math.max(1, Number(req.query.pagina) || 1);
    const pageSize = 20;
    const offset = (pagina - 1) * pageSize;

    const cat = (await q(`SELECT nombre_categoria FROM ${T('Categorias')} WHERE id_categoria=?`, [idCat]))[0];
    const nombreCategoria = cat?.nombre_categoria || '';

    // Mapas
    const mapBateo = {
      promedio:     { col: 'b.promedio_bateo',  label: 'Promedio de bateo', order: 'DESC' },
      sencillos:    { col: 'b.sencillos',       label: 'Sencillos',         order: 'DESC' },
      dobles:       { col: 'b.dobles',          label: 'Dobles',            order: 'DESC' },
      triples:      { col: 'b.triples',         label: 'Triples',           order: 'DESC' },
      homeruns:     { col: 'b.home_runs',       label: 'Home Runs',         order: 'DESC' },
      basesrobadas: { col: 'b.bases_robadas',   label: 'Bases Robadas',     order: 'DESC' },
    };
    const mapPitcheo = {
      efectividad: { col: 'p.efectividad', label: 'Efectividad', order: 'ASC' },
      victorias:   { col: 'p.victorias',   label: 'Victorias',   order: 'DESC' },
      ponches:     { col: 'p.ponches',     label: 'Ponches',     order: 'DESC' },
    };

    const isBat = !!mapBateo[tipo];
    const meta = isBat ? mapBateo[tipo] : mapPitcheo[tipo];
    if (!meta) return res.status(404).send('Tipo no válido');

    // FROM y JOIN según tipo
    const fromJoin = isBat
      ? `FROM ${T('JugadorTemporadaCategoria')} jtc
         JOIN ${T('Jugadores')} j ON j.id_jugador=jtc.id_jugador
         LEFT JOIN ${T('EstadisticasBateoTemporada')} b
           ON b.id_temporada=? AND b.id_jugador=j.id_jugador`
      : `FROM ${T('JugadorTemporadaCategoria')} jtc
         JOIN ${T('Jugadores')} j ON j.id_jugador=jtc.id_jugador
         LEFT JOIN ${T('EstadisticasPitcheoTemporada')} p
           ON p.id_temporada=? AND p.id_jugador=j.id_jugador`;

    const whereBase = `WHERE jtc.id_temporada=? AND jtc.id_categoria=?`;

    // Sólo bateo tiene PA
    const selectPa = isBat ? 'IFNULL(b.apariciones_al_bat,0)' : '0';

    // Regla de apariciones solo para promedio de bateo
    let rule = null;
    if (isBat && tipo === 'promedio') {
      rule = (await q(
        `SELECT habilitado, min_apariciones
           FROM ${T('MinimoAparicionesBateoTemporada')}
          WHERE id_temporada=? LIMIT 1`,
        [idTemp]
      ))[0] || null;
    }

    // Query base
    const baseRows = await q(`
      SELECT j.id_jugador,
             CONCAT(j.apellido_paterno,' ',j.apellido_materno,' ',j.nombres) AS nombre,
             ${meta.col} AS valor,
             ${selectPa} AS pa
      ${fromJoin}
      ${whereBase}
      ORDER BY ${meta.col} ${meta.order}, nombre ASC
    `, [idTemp, idTemp, idCat]);

    // Filtro por PA mínimo si aplica
    let rowsToUse = baseRows;
    if (rule && rule.habilitado) {
      const min = Number(rule.min_apariciones) || 0;
      const meets = baseRows.filter(r => (r.pa || 0) >= min);

      if (meets.length >= 2) {
        rowsToUse = meets;
      } else if (meets.length === 1) {
        const first = meets[0];
        const rest = baseRows.filter(r => r.id_jugador !== first.id_jugador);
        rowsToUse = [first, ...rest];
      }
    }

    // Paginación
    const total = rowsToUse.length;
    const totalPaginas = Math.max(1, Math.ceil(total / pageSize));
    const pageSlice = rowsToUse.slice(offset, offset + pageSize);

    const jugadoresPaginados = pageSlice.map(r => ({
      id_jugador: r.id_jugador,
      nombre: r.nombre,
      valor: (typeof r.valor === 'number' && (tipo === 'promedio' || tipo === 'efectividad'))
        ? r.valor.toFixed(3)
        : (r.valor ?? 0)
    }));

    res.render('Publico/Destacados/Tabla', {
      jugadoresPaginados,
      paginaActual: pagina,
      totalPaginas,
      categoriaID: idCat,
      tipo,
      tituloEstadistica: meta.label,
      nombreCategoria,
      idTemp // para conservar ?temporada= en los links
    });
  } catch (e) { next(e); }
});

module.exports = router;

