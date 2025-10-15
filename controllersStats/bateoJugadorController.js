// controllersStats/bateoJugadorController.js
const db = require('../utils/db');
const { getScope, equiposDeMiScope, plantelEquipo } = require('./bateoEquipoController');

const wantsJSON = req =>
  !!(req.xhr || req.get('x-requested-with') === 'XMLHttpRequest' || req.is('application/json'));

const backUpd = '/adminEstadisticas/StatsEditarBateoJugador';

/* ===== FORM EDITAR ===== */
exports.formActualizar = async (req, res) => {
  const equipos = await equiposDeMiScope(req);
  res.render('Coordinacion/Estadisticas/Actualizar/EditarBateoJugador', {
    ...res.locals,
    equipos
  });
};

/* ===== AJAX: plantel equipo ===== */
exports.plantel = async (req, res) => {
  const id = Number(req.query.id_equipo_temporada) || 0;
  const rows = id ? await plantelEquipo(req, id) : [];
  res.json(rows);
};

/* ===== AJAX: obtener stats jugador ===== */
exports.obtenerStats = async (req, res) => {
  const { id_temporada } = await getScope(req);
  const id_jugador = Number(req.query.id_jugador) || 0;
  if (!id_jugador) return res.json(null);
  const r = await db.query(
    `SELECT apariciones_al_bat,hits,bases_por_bolas,carreras,carreras_producidas,
            sencillos,dobles,triples,home_runs,bases_robadas,promedio_bateo
       FROM EstadisticasBateoTemporada
      WHERE id_temporada=? AND id_jugador=? LIMIT 1`,
    [id_temporada, id_jugador]
  );
  res.json(r[0] || null);
};

/* ===== ACTUALIZAR EXACTO (SET, NO SUMA) ===== */
exports.actualizar = async (req, res) => {
  try {
    const scope = await getScope(req);
    const id_jugador = Number(req.body.id_jugador) || 0;
    const id_equipo_temporada = Number(req.body.id_equipo_temporada) || 0;
    if (!id_jugador || !id_equipo_temporada) {
      return wantsJSON(req) ? res.status(400).json({ error:'faltan' })
        : res.flash({ alertTitle:'Datos inválidos', alertMessage:'Selecciona equipo y jugador.',
            alertIcon:'warning', showConfirmButton:true, timer:null, ruta:backUpd }, backUpd);
    }

    // Verifica equipo dentro del scope
    const eq = await db.query(
      `SELECT id_temporada,id_categoria FROM EquipoTemporada WHERE id_equipo_temporada=? LIMIT 1`,
      [id_equipo_temporada]
    );
    if (!eq.length || eq[0].id_temporada !== scope.id_temporada || eq[0].id_categoria !== scope.id_categoria) {
      return wantsJSON(req) ? res.status(403).json({ error:'fuera de alcance' })
        : res.flash({ alertTitle:'Sin permisos', alertMessage:'Equipo fuera de tu alcance.',
            alertIcon:'error', showConfirmButton:true, timer:null, ruta:backUpd }, backUpd);
    }

    const toNum = v => Math.max(0, Number(v) || 0);
    const payload = {
      apariciones_al_bat: toNum(req.body.apariciones_al_bat || req.body.turnos),
      hits:               toNum(req.body.hits),
      bases_por_bolas:    toNum(req.body.bases_por_bolas),
      carreras:           toNum(req.body.carreras),
      carreras_producidas:toNum(req.body.carreras_producidas),
      sencillos:          toNum(req.body.sencillos),
      dobles:             toNum(req.body.dobles),
      triples:            toNum(req.body.triples),
      home_runs:          toNum(req.body.home_runs),
      bases_robadas:      toNum(req.body.bases_robadas)
    };

    // UPSERT con SET exacto
    await db.query(
      `INSERT INTO EstadisticasBateoTemporada
        (id_temporada,id_jugador,id_equipo_temporada,apariciones_al_bat,hits,bases_por_bolas,carreras,carreras_producidas,
         sencillos,dobles,triples,home_runs,bases_robadas)
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
      [
        scope.id_temporada, id_jugador, id_equipo_temporada,
        payload.apariciones_al_bat, payload.hits, payload.bases_por_bolas,
        payload.carreras, payload.carreras_producidas,
        payload.sencillos, payload.dobles, payload.triples, payload.home_runs, payload.bases_robadas
      ]
    );

    return wantsJSON(req) ? res.json({ ok:true })
      : res.flash({ alertTitle:'Actualizado', alertMessage:'Estadística guardada.',
          alertIcon:'success', showConfirmButton:false, timer:1200, ruta:backUpd }, backUpd);

  } catch (e) {
    console.error(e);
    return wantsJSON(req) ? res.status(500).json({ error:'error' })
      : res.flash({ alertTitle:'Error', alertMessage:'No se pudo actualizar.',
          alertIcon:'error', showConfirmButton:true, timer:null, ruta:backUpd }, backUpd);
  }
};

/* ===== CARGAR SUMANDO (individual) ===== */
exports.formCrear = async (req,res)=>{
  const equipos = await equiposDeMiScope(req);
  res.render('Coordinacion/Estadisticas/Crear/CargarBateoJugador', { ...res.locals, equipos });
};
exports.sumar = async (req,res)=>{
  const back = '/adminEstadisticas/StatsCargarBateoJugador';
  try{
    const scope = await getScope(req);
    const id_jugador = Number(req.body.id_jugador)||0;
    const id_equipo_temporada = Number(req.body.id_equipo_temporada)||0;
    if(!id_jugador || !id_equipo_temporada){
      return res.flash({alertTitle:'Datos inválidos',alertMessage:'Equipo y jugador requeridos.',
                        alertIcon:'warning',showConfirmButton:true,timer:null,ruta:back}, back);
    }
    const to = v => Math.max(0, Number(v)||0);
    const p = {
      ab:  to(req.body.apariciones_al_bat || req.body.turnos),
      h:   to(req.body.hits),
      bb:  to(req.body.bases_por_bolas),
      r:   to(req.body.carreras),
      rbi: to(req.body.carreras_producidas),
      s:   to(req.body.sencillos),
      d:   to(req.body.dobles),
      t:   to(req.body.triples),
      hr:  to(req.body.home_runs),
      sb:  to(req.body.bases_robadas)
    };
    const sql = `
      INSERT INTO EstadisticasBateoTemporada
        (id_temporada,id_jugador,id_equipo_temporada,apariciones_al_bat,hits,bases_por_bolas,carreras,carreras_producidas,
         sencillos,dobles,triples,home_runs,bases_robadas)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
      ON DUPLICATE KEY UPDATE
        id_equipo_temporada=VALUES(id_equipo_temporada),
        apariciones_al_bat=apariciones_al_bat+VALUES(apariciones_al_bat),
        hits=hits+VALUES(hits),
        bases_por_bolas=bases_por_bolas+VALUES(bases_por_bolas),
        carreras=carreras+VALUES(carreras),
        carreras_producidas=carreras_producidas+VALUES(carreras_producidas),
        sencillos=sencillos+VALUES(sencillos),
        dobles=dobles+VALUES(dobles),
        triples=triples+VALUES(triples),
        home_runs=home_runs+VALUES(home_runs),
        bases_robadas=bases_robadas+VALUES(bases_robadas)
    `;
    await db.query(sql, [
      scope.id_temporada, id_jugador, id_equipo_temporada,
      p.ab,p.h,p.bb,p.r,p.rbi,p.s,p.d,p.t,p.hr,p.sb
    ]);
    return res.flash({alertTitle:'Listo',alertMessage:'Bateo agregado.',
                      alertIcon:'success',showConfirmButton:false,timer:1200,ruta:back}, back);
  }catch(e){
    console.error(e);
    return res.flash({alertTitle:'Error',alertMessage:'No se pudo guardar.',
                      alertIcon:'error',showConfirmButton:true,timer:null,ruta:back}, back);
  }
};

