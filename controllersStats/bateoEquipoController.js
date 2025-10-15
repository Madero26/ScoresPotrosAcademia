// controllersStats/bateoEquipoController.js
const db = require('../utils/db');

const wantsJSON = req =>
  !!(req.xhr || req.get('x-requested-with') === 'XMLHttpRequest' || req.is('application/json'));

const backCrear = '/adminEstadisticas/StatsCargarBateoEquipo';

async function getScope(req) {
  // asume que el middleware de auth pobló req.auth con id_temporada e id_categoria
  const id_temporada = Number(req.auth?.temporadaId || req.auth?.id_temporada || 0);
  const id_categoria = Number(req.auth?.categoriaId || req.auth?.id_categoria || 0);
  return { id_temporada, id_categoria };
}

// Equipos de mi categoría/temporada
async function equiposDeMiScope(req) {
  const { id_temporada, id_categoria } = await getScope(req);
  if (!id_temporada || !id_categoria) return [];
  return db.query(
    `SELECT et.id_equipo_temporada, et.nombre
       FROM EquipoTemporada et
      WHERE et.id_temporada=? AND et.id_categoria=?
      ORDER BY et.nombre`,
    [id_temporada, id_categoria]
  );
}

// Plantel de un equipo del scope
async function plantelEquipo(req, id_equipo_temporada) {
  const { id_temporada, id_categoria } = await getScope(req);
  return db.query(
    `SELECT j.id_jugador,
            CONCAT(j.apellido_paterno,' ',j.apellido_materno,' ',j.nombres) AS nombre
       FROM JugadorEquipoTemporada jet
       JOIN EquipoTemporada et ON et.id_equipo_temporada=jet.id_equipo_temporada
       JOIN Jugadores j ON j.id_jugador=jet.id_jugador
      WHERE jet.id_equipo_temporada=?
        AND et.id_temporada=? AND et.id_categoria=?
      ORDER BY nombre`,
    [id_equipo_temporada, id_temporada, id_categoria]
  );
}

/* ====== FORM ====== */
exports.formCrear = async (req, res) => {
  const equipos = await equiposDeMiScope(req);
  res.render('Coordinacion/Estadisticas/Crear/CargarBateoEquipo', {
    ...res.locals,
    equipos
  });
};

/* ====== CARGA MASIVA (SUMA) ====== */
exports.batchUpsertBateo = async (req, res) => {
  const toArr = v => v == null ? [] : (Array.isArray(v) ? v : [v]);

  const ids = toArr(req.body.id_jugador);
  const AB = toArr(req.body.apariciones_al_bat);
  const H = toArr(req.body.hits);
  const BB = toArr(req.body.bases_por_bolas);
  const R = toArr(req.body.carreras);
  const RBI = toArr(req.body.carreras_producidas);
  const S = toArr(req.body.sencillos);
  const D = toArr(req.body.dobles);
  const T = toArr(req.body.triples);
  const HR = toArr(req.body.home_runs);
  const SB = toArr(req.body.bases_robadas);

  try {
    const { id_equipo_temporada } = req.body;
    const eqId = Number(id_equipo_temporada) || 0;
    if (!eqId) {
      return wantsJSON(req)
        ? res.status(400).json({ error: 'equipo requerido' })
        : res.flash({
          alertTitle: 'Datos inválidos',
          alertMessage: 'Selecciona un equipo.',
          alertIcon: 'warning', showConfirmButton: true, timer: null, ruta: backCrear
        }, backCrear);
    }

    // Verifica que el equipo pertenezca al scope del usuario
    const eq = await db.query(
      `SELECT id_temporada, id_categoria FROM EquipoTemporada WHERE id_equipo_temporada=? LIMIT 1`,
      [eqId]
    );
    if (!eq.length) {
      return wantsJSON(req) ? res.status(404).json({ error: 'equipo no existe' })
        : res.flash({
          alertTitle: 'No encontrado', alertMessage: 'El equipo no existe.',
          alertIcon: 'error', showConfirmButton: true, timer: null, ruta: backCrear
        }, backCrear);
    }
    const scope = await getScope(req);
    if (eq[0].id_temporada !== scope.id_temporada || eq[0].id_categoria !== scope.id_categoria) {
      return wantsJSON(req) ? res.status(403).json({ error: 'fuera de tu categoría/temporada' })
        : res.flash({
          alertTitle: 'Sin permisos', alertMessage: 'Equipo fuera de tu alcance.',
          alertIcon: 'error', showConfirmButton: true, timer: null, ruta: backCrear
        }, backCrear);
    }

    // Datos vienen como arrays indexados por el mismo orden de id_jugador[]
    const ids = Array.isArray(req.body.id_jugador) ? req.body.id_jugador : [];
    const toNum = v => Math.max(0, Number(v) || 0);
    const AB = req.body.apariciones_al_bat || req.body.turnos || [];
    const H = req.body.hits || [];
    const BB = req.body.bases_por_bolas || [];
    const R = req.body.carreras || [];
    const RBI = req.body.carreras_producidas || [];
    const S = req.body.sencillos || [];
    const D = req.body.dobles || [];
    const T = req.body.triples || [];
    const HR = req.body.home_runs || [];
    const SB = req.body.bases_robadas || [];

    if (!ids.length) {
      return wantsJSON(req) ? res.status(400).json({ error: 'sin jugadores' })
        : res.flash({
          alertTitle: 'Datos inválidos', alertMessage: 'No hay jugadores para cargar.',
          alertIcon: 'warning', showConfirmButton: true, timer: null, ruta: backCrear
        }, backCrear);
    }

    // Inserta o suma
    // Usamos UNIQUE(id_temporada,id_jugador)
    const sql = `
      INSERT INTO EstadisticasBateoTemporada
        (id_temporada,id_jugador,id_equipo_temporada,apariciones_al_bat,hits,bases_por_bolas,carreras,carreras_producidas,sencillos,dobles,triples,home_runs,bases_robadas)
      VALUES ?
      ON DUPLICATE KEY UPDATE
        id_equipo_temporada=VALUES(id_equipo_temporada),
        apariciones_al_bat = apariciones_al_bat + VALUES(apariciones_al_bat),
        hits               = hits               + VALUES(hits),
        bases_por_bolas    = bases_por_bolas    + VALUES(bases_por_bolas),
        carreras           = carreras           + VALUES(carreras),
        carreras_producidas= carreras_producidas+ VALUES(carreras_producidas),
        sencillos          = sencillos          + VALUES(sencillos),
        dobles             = dobles             + VALUES(dobles),
        triples            = triples            + VALUES(triples),
        home_runs          = home_runs          + VALUES(home_runs),
        bases_robadas      = bases_robadas      + VALUES(bases_robadas)
    `;

    const rows = [];
    for (let i = 0; i < ids.length; i++) {
      const idj = Number(ids[i]) || 0; if (!idj) continue;
      rows.push([
        scope.id_temporada, idj, eqId,
        toNum(AB[i]), toNum(H[i]), toNum(BB[i]),
        toNum(R[i]), toNum(RBI[i]),
        toNum(S[i]), toNum(D[i]), toNum(T[i]), toNum(HR[i]), toNum(SB[i])
      ]);
    }
    if (!rows.length) {
      return wantsJSON(req) ? res.status(400).json({ error: 'datos vacíos' })
        : res.flash({
          alertTitle: 'Datos inválidos', alertMessage: 'No hay datos válidos para cargar.',
          alertIcon: 'warning', showConfirmButton: true, timer: null, ruta: backCrear
        }, backCrear);
    }

    await db.query(sql, [rows]);

    return wantsJSON(req) ? res.json({ ok: true })
      : res.flash({
        alertTitle: 'Listo', alertMessage: 'Estadísticas cargadas.',
        alertIcon: 'success', showConfirmButton: false, timer: 1200, ruta: backCrear
      }, backCrear);

  } catch (e) {
    console.error(e);
    return wantsJSON(req) ? res.status(500).json({ error: 'error' })
      : res.flash({
        alertTitle: 'Error', alertMessage: 'No se pudo cargar.',
        alertIcon: 'error', showConfirmButton: true, timer: null, ruta: backCrear
      }, backCrear);
  }
};

module.exports.getScope = getScope;
module.exports.equiposDeMiScope = equiposDeMiScope;
module.exports.plantelEquipo = plantelEquipo;


