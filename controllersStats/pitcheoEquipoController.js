// controllersStats/pitcheoEquipoController.js
const db = require('../utils/db');

const wantsJSON = req =>
  !!(req.xhr || req.get('x-requested-with') === 'XMLHttpRequest' || req.is('application/json'));

const backCrear = '/adminEstadisticas/StatsCargarPitcheoEquipo';

async function getScope(req){
  const id_temporada = Number(req.auth?.temporadaId || req.auth?.id_temporada || 0);
  const id_categoria = Number(req.auth?.categoriaId  || req.auth?.id_categoria  || 0);
  return { id_temporada, id_categoria };
}

async function equiposDeMiScope(req){
  const { id_temporada, id_categoria } = await getScope(req);
  if(!id_temporada || !id_categoria) return [];
  return db.query(
    `SELECT id_equipo_temporada, nombre
       FROM EquipoTemporada
      WHERE id_temporada=? AND id_categoria=?
      ORDER BY nombre`,
    [id_temporada, id_categoria]
  );
}

async function plantelEquipo(req, id_equipo_temporada){
  const { id_temporada, id_categoria } = await getScope(req);
  return db.query(
    `SELECT j.id_jugador,
            CONCAT(j.apellido_paterno,' ',j.apellido_materno,' ',j.nombres) AS nombre
       FROM JugadorEquipoTemporada jet
       JOIN EquipoTemporada et ON et.id_equipo_temporada=jet.id_equipo_temporada
       JOIN Jugadores j ON j.id_jugador=jet.id_jugador
      WHERE jet.id_equipo_temporada=? AND et.id_temporada=? AND et.id_categoria=?
      ORDER BY nombre`,
    [id_equipo_temporada, id_temporada, id_categoria]
  );
}

/* ===== FORM ===== */
exports.formCrear = async (req, res) => {
  const equipos = await equiposDeMiScope(req);
  res.render('Coordinacion/Estadisticas/Crear/CargarPitcheoEquipo', { ...res.locals, equipos });
};

/* ===== AJAX: plantel ===== */
exports.plantel = async (req, res) => {
  const id = Number(req.query.id_equipo_temporada) || 0;
  if(!id) return res.json([]);
  const r = await plantelEquipo(req, id);
  res.json(r);
};

/* ===== CARGA MASIVA (SUMA) ===== */
exports.batchUpsertPitcheo = async (req, res) => {
  try{
    const { id_equipo_temporada } = req.body;
    const eqId = Number(id_equipo_temporada) || 0;
    if(!eqId){
      return wantsJSON(req) ? res.status(400).json({error:'equipo requerido'})
        : res.flash({alertTitle:'Datos inválidos',alertMessage:'Selecciona un equipo.',alertIcon:'warning',
                     showConfirmButton:true,timer:null,ruta:backCrear}, backCrear);
    }

    // alcanza
    const eq = await db.query(
      `SELECT id_temporada,id_categoria FROM EquipoTemporada WHERE id_equipo_temporada=? LIMIT 1`,[eqId]
    );
    if(!eq.length){
      return wantsJSON(req)?res.status(404).json({error:'equipo no existe'})
        : res.flash({alertTitle:'No encontrado',alertMessage:'El equipo no existe.',alertIcon:'error',
                     showConfirmButton:true,timer:null,ruta:backCrear}, backCrear);
    }
    const scope = await getScope(req);
    if(eq[0].id_temporada!==scope.id_temporada || eq[0].id_categoria!==scope.id_categoria){
      return wantsJSON(req)?res.status(403).json({error:'fuera de tu alcance'})
        : res.flash({alertTitle:'Sin permisos',alertMessage:'Equipo fuera de tu categoría/temporada.',alertIcon:'error',
                     showConfirmButton:true,timer:null,ruta:backCrear}, backCrear);
    }

    const ids = Array.isArray(req.body.id_jugador) ? req.body.id_jugador : [];
    if(!ids.length){
      return wantsJSON(req)?res.status(400).json({error:'sin jugadores'})
        : res.flash({alertTitle:'Datos inválidos',alertMessage:'No hay jugadores para cargar.',alertIcon:'warning',
                     showConfirmButton:true,timer:null,ruta:backCrear}, backCrear);
    }

    const toInt = v => Math.max(0, Number(v)||0);
    const toDec = v => Math.max(0, Number(v)||0);

    const BB = req.body.bases_por_bolas || [];
    const W  = req.body.victorias       || [];
    const L  = req.body.derrotas        || [];
    const IP = req.body.entradas_lanzadas || [];
    const ER = req.body.carreras_limpias  || [];
    const SO = req.body.ponches           || [];

    const rows = [];
    for(let i=0;i<ids.length;i++){
      const idj = Number(ids[i])||0; if(!idj) continue;
      rows.push([
        scope.id_temporada, idj, eqId,
        toInt(BB[i]), toInt(W[i]), toInt(L[i]),
        toDec(IP[i]), toInt(ER[i]), toInt(SO[i])
      ]);
    }
    if(!rows.length){
      return wantsJSON(req)?res.status(400).json({error:'datos vacíos'})
        : res.flash({alertTitle:'Datos inválidos',alertMessage:'No hay datos válidos para cargar.',alertIcon:'warning',
                     showConfirmButton:true,timer:null,ruta:backCrear}, backCrear);
    }

    const sql = `
      INSERT INTO EstadisticasPitcheoTemporada
        (id_temporada,id_jugador,id_equipo_temporada,bases_por_bolas,victorias,derrotas,entradas_lanzadas,carreras_limpias,ponches)
      VALUES ?
      ON DUPLICATE KEY UPDATE
        id_equipo_temporada = VALUES(id_equipo_temporada),
        bases_por_bolas     = bases_por_bolas  + VALUES(bases_por_bolas),
        victorias           = victorias        + VALUES(victorias),
        derrotas            = derrotas         + VALUES(derrotas),
        entradas_lanzadas   = entradas_lanzadas+ VALUES(entradas_lanzadas),
        carreras_limpias    = carreras_limpias + VALUES(carreras_limpias),
        ponches             = ponches          + VALUES(ponches)
    `;
    await db.query(sql, [rows]);

    return wantsJSON(req)?res.json({ok:true})
      : res.flash({alertTitle:'Listo',alertMessage:'Pitcheo cargado.',alertIcon:'success',
                   showConfirmButton:false,timer:1200,ruta:backCrear}, backCrear);
  }catch(e){
    console.error(e);
    return wantsJSON(req)?res.status(500).json({error:'error'})
      : res.flash({alertTitle:'Error',alertMessage:'No se pudo cargar.',alertIcon:'error',
                   showConfirmButton:true,timer:null,ruta:backCrear}, backCrear);
  }
};
