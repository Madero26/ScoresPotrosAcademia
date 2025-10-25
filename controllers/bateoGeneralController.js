// controllersGeneralStats/bateoGeneralController.js
const db = require('../utils/db');

const wantsJSON = req =>
  !!(req.xhr || req.get('x-requested-with') === 'XMLHttpRequest' || req.is('application/json'));

const num = v => Math.max(0, Number(v) || 0);

function flash(res, payload, back){
  const ruta = back || '/adminGeneral/inicio';
  return res.flash({
    alertTitle: payload.title || payload.alertTitle || 'Aviso',
    alertMessage: payload.text || payload.alertMessage || '',
    alertIcon: payload.icon || payload.alertIcon || 'info',
    showConfirmButton: payload.showConfirmButton ?? false,
    timer: payload.timer ?? 1200,
    ruta
  }, ruta);
}

/* ========= AJAX CASCADA ========= */

exports.categoriasPorTemporada = async (req,res)=>{
  const id_temporada = Number(req.query.id_temporada)||0;
  if(!id_temporada) return res.json([]);
  const rows = await db.query(
    `SELECT ctr.id_categoria, c.nombre_categoria AS nombre
       FROM CategoriaTemporadaRango ctr
       JOIN Categorias c ON c.id_categoria=ctr.id_categoria
      WHERE ctr.id_temporada=?
      ORDER BY c.edad_min, c.edad_max`, [id_temporada]
  );
  res.json(rows);
};

exports.equiposPorTempCat = async (req,res)=>{
  const t = Number(req.query.id_temporada)||0;
  const c = Number(req.query.id_categoria)||0;
  if(!t||!c) return res.json([]);
  const rows = await db.query(
    `SELECT id_equipo_temporada, nombre
       FROM EquipoTemporada
      WHERE id_temporada=? AND id_categoria=?
      ORDER BY nombre`, [t,c]
  );
  res.json(rows);
};

exports.plantelPorEquipo = async (req,res)=>{
  const eq = Number(req.query.id_equipo_temporada)||0;
  if(!eq) return res.json([]);
  const rows = await db.query(
    `SELECT j.id_jugador,
            CONCAT(j.apellido_paterno,' ',j.apellido_materno,' ',j.nombres) AS nombre
       FROM JugadorEquipoTemporada jet
       JOIN Jugadores j ON j.id_jugador=jet.id_jugador
      WHERE jet.id_equipo_temporada=?
      ORDER BY nombre`, [eq]
  );
  res.json(rows);
};

exports.obtenerBateoJugador = async (req,res)=>{
  const id_temporada = Number(req.query.id_temporada)||0;
  const id_jugador  = Number(req.query.id_jugador)||0;
  if(!id_temporada||!id_jugador) return res.json(null);
  const rows = await db.query(
    `SELECT id_temporada,id_jugador,id_equipo_temporada,
            apariciones_al_bat,hits,bases_por_bolas,carreras,carreras_producidas,
            sencillos,dobles,triples,home_runs,bases_robadas
       FROM EstadisticasBateoTemporada
      WHERE id_temporada=? AND id_jugador=? LIMIT 1`,
    [id_temporada,id_jugador]
  );
  res.json(rows[0]||null);
};

/* ========= CARGA MASIVA EQUIPO (SUMA) ========= */

exports.batchUpsertBateoEquipo = async (req,res)=>{
  const back = '/adminGeneral/formStatsCargarBateoEquipo';
  try{
    const id_temporada = Number(req.body.id_temporada)||0;
    const id_categoria = Number(req.body.id_categoria)||0;
    const eqId         = Number(req.body.id_equipo_temporada)||0;

    if(!id_temporada||!id_categoria||!eqId){
      return wantsJSON(req) ? res.status(400).json({error:'faltan filtros'})
        : flash(res,{title:'Datos inválidos',text:'Selecciona temporada, categoría y equipo.',icon:'warning',showConfirmButton:true,timer:null},back);
    }

    // Verificación de relaciones
    const eq = await db.query(
      `SELECT id_temporada,id_categoria FROM EquipoTemporada WHERE id_equipo_temporada=? LIMIT 1`, [eqId]
    );
    if(!eq.length || eq[0].id_temporada!==id_temporada || eq[0].id_categoria!==id_categoria){
      return wantsJSON(req) ? res.status(400).json({error:'equipo no coincide con filtros'})
        : flash(res,{title:'Sin coincidencia',text:'El equipo no pertenece a los filtros seleccionados.',icon:'error',showConfirmButton:true,timer:null},back);
    }

    const ids = Array.isArray(req.body.id_jugador) ? req.body.id_jugador : [];
    if(!ids.length){
      return wantsJSON(req) ? res.status(400).json({error:'sin jugadores'})
        : flash(res,{title:'Datos inválidos',text:'No hay jugadores para cargar.',icon:'warning',showConfirmButton:true,timer:null},back);
    }

    const AB  = req.body.apariciones_al_bat || req.body.turnos || [];
    const H   = req.body.hits || [];
    const BB  = req.body.bases_por_bolas || [];
    const R   = req.body.carreras || [];
    const RBI = req.body.carreras_producidas || [];
    const S   = req.body.sencillos || [];
    const D   = req.body.dobles || [];
    const T   = req.body.triples || [];
    const HR  = req.body.home_runs || [];
    const SB  = req.body.bases_robadas || [];

    const rows=[];
    for(let i=0;i<ids.length;i++){
      const idj = Number(ids[i])||0;
      if(!idj) continue;
      rows.push([
        id_temporada,idj,eqId,
        num(AB[i]),num(H[i]),num(BB[i]),num(R[i]),num(RBI[i]),
        num(S[i]),num(D[i]),num(T[i]),num(HR[i]),num(SB[i])
      ]);
    }
    if(!rows.length){
      return wantsJSON(req) ? res.status(400).json({error:'datos vacíos'})
        : flash(res,{title:'Datos inválidos',text:'No hay datos válidos para cargar.',icon:'warning',showConfirmButton:true,timer:null},back);
    }

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
    await db.query(sql,[rows]);

    return wantsJSON(req) ? res.json({ok:true})
      : flash(res,{title:'Listo',text:'Bateo cargado correctamente.',icon:'success',showConfirmButton:false,timer:1200},back);

  }catch(e){
    console.error(e);
    return wantsJSON(req) ? res.status(500).json({error:'error'})
      : flash(res,{title:'Error',text:'No se pudo cargar.',icon:'error',showConfirmButton:true,timer:null},'/adminGeneral/formStatsCargarBateoEquipo');
  }
};

/* ========= ACTUALIZAR BATEO JUGADOR (REEMPLAZO) ========= */
exports.actualizarBateoJugador = async (req,res)=>{
  const back = '/adminGeneral/formStatsEditarBateoJugador';
  try{
    const id_temporada = Number(req.body.id_temporada)||0;
    const id_jugador   = Number(req.body.id_jugador)||0;
    const id_equipo_temporada = Number(req.body.id_equipo_temporada)||0;

    if(!id_temporada||!id_jugador||!id_equipo_temporada){
      return wantsJSON(req) ? res.status(400).json({error:'faltan campos'})
        : flash(res,{title:'Datos inválidos',text:'Selecciona filtros y jugador.',icon:'warning',showConfirmButton:true,timer:null},back);
    }

    const data = {
      ab:  num(req.body.apariciones_al_bat),
      h:   num(req.body.hits),
      bb:  num(req.body.bases_por_bolas),
      r:   num(req.body.carreras),
      rbi: num(req.body.carreras_producidas),
      s:   num(req.body.sencillos),
      d:   num(req.body.dobles),
      t:   num(req.body.triples),
      hr:  num(req.body.home_runs),
      sb:  num(req.body.bases_robadas)
    };

    await db.query(
      `INSERT INTO EstadisticasBateoTemporada
        (id_temporada,id_jugador,id_equipo_temporada,apariciones_al_bat,hits,bases_por_bolas,carreras,carreras_producidas,sencillos,dobles,triples,home_runs,bases_robadas)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         id_equipo_temporada=VALUES(id_equipo_temporada),
         apariciones_al_bat=VALUES(apariciones_al_bat),
         hits=VALUES(hits),
         bases_por_bolas=VALUES(bases_por_bolas),
         carreras=VALUES(carreras),
         carreras_producidas=VALUES(carreras_producidas),
         sencillos=VALUES(sencillos),
         dobles=VALUES(dobles),
         triples=VALUES(triples),
         home_runs=VALUES(home_runs),
         bases_robadas=VALUES(bases_robadas)`,
      [id_temporada,id_jugador,id_equipo_temporada,
       data.ab,data.h,data.bb,data.r,data.rbi,data.s,data.d,data.t,data.hr,data.sb]
    );

    return wantsJSON(req) ? res.json({ok:true})
      : flash(res,{title:'Actualizado',text:'Bateo del jugador actualizado.',icon:'success',showConfirmButton:false,timer:1200},back);

  }catch(e){
    console.error(e);
    return wantsJSON(req) ? res.status(500).json({error:'error'})
      : flash(res,{title:'Error',text:'No se pudo actualizar.',icon:'error',showConfirmButton:true,timer:null},back);
  }
};
