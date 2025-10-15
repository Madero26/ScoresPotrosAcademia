// controllersStats/pitcheoJugadorController.js
const db = require('../utils/db');

async function getScope(req){
  const id_temporada = Number(req.auth?.temporadaId || 0);
  const id_categoria = Number(req.auth?.categoriaId  || 0);
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

/* ===== FORM CREAR (no usado aquí, solo actualizar) ===== */
exports.formCrear = async (req, res) => {
  const equipos = await equiposDeMiScope(req);
  res.render('Coordinacion/Estadisticas/Crear/CargarPitcheoJugador', { ...res.locals, equipos });
};

/* ===== FORM ACTUALIZAR ===== */
exports.formActualizar = async (req, res) => {
  const equipos = await equiposDeMiScope(req);
  res.render('Coordinacion/Estadisticas/Actualizar/EditarPitcheoJugador', { ...res.locals, equipos });
};

/* ===== AJAX ===== */
exports.plantel = async (req, res) => {
  const id = Number(req.query.id_equipo_temporada) || 0;
  if(!id) return res.json([]);
  const r = await plantelEquipo(req, id);
  res.json(r);
};

exports.obtenerStats = async (req, res) => {
  const { id_temporada } = await getScope(req);
  const id_jugador = Number(req.query.id_jugador) || 0;
  if(!id_temporada || !id_jugador) return res.json(null);
  const r = await db.query(
    `SELECT * FROM EstadisticasPitcheoTemporada
      WHERE id_temporada=? AND id_jugador=? LIMIT 1`,
    [id_temporada, id_jugador]
  );
  res.json(r[0] || null);
};

/* ===== ACTUALIZAR ABSOLUTO ===== */
exports.actualizar = async (req, res) => {
  const back = '/adminEstadisticas/StatsEditarPitcheoJugador';
  try{
    const { id_jugador, id_equipo_temporada } = req.body;
    const jid = Number(id_jugador)||0, etid = Number(id_equipo_temporada)||0;
    if(!jid || !etid){
      return res.flash({alertTitle:'Datos inválidos',alertMessage:'Equipo y jugador requeridos.',
                        alertIcon:'warning',showConfirmButton:true,timer:null,ruta:back}, back);
    }

    const { id_temporada } = await getScope(req);

    const toInt = v => Math.max(0, Number(v)||0);
    const toDec = v => Math.max(0, Number(v)||0);

    const data = {
      bases_por_bolas:   toInt(req.body.bases_por_bolas),
      victorias:         toInt(req.body.victorias),
      derrotas:          toInt(req.body.derrotas),
      entradas_lanzadas: toDec(req.body.entradas_lanzadas),
      carreras_limpias:  toInt(req.body.carreras_limpias),
      ponches:           toInt(req.body.ponches)
    };

    // upsert SET absoluto
    const sql = `
      INSERT INTO EstadisticasPitcheoTemporada
        (id_temporada,id_jugador,id_equipo_temporada,bases_por_bolas,victorias,derrotas,entradas_lanzadas,carreras_limpias,ponches)
      VALUES (?,?,?,?,?,?,?,?,?)
      ON DUPLICATE KEY UPDATE
        id_equipo_temporada=VALUES(id_equipo_temporada),
        bases_por_bolas=VALUES(bases_por_bolas),
        victorias=VALUES(victorias),
        derrotas=VALUES(derrotas),
        entradas_lanzadas=VALUES(entradas_lanzadas),
        carreras_limpias=VALUES(carreras_limpias),
        ponches=VALUES(ponches)
    `;
    await db.query(sql, [
      id_temporada, jid, etid,
      data.bases_por_bolas, data.victorias, data.derrotas,
      data.entradas_lanzadas, data.carreras_limpias, data.ponches
    ]);

    return res.flash({alertTitle:'Actualizado',alertMessage:'Pitcheo actualizado.',
                      alertIcon:'success',showConfirmButton:false,timer:1200,ruta:back}, back);
  }catch(e){
    console.error(e);
    return res.flash({alertTitle:'Error',alertMessage:'No se pudo actualizar.',
                      alertIcon:'error',showConfirmButton:true,timer:null,ruta:back}, back);
  }
};
/* ===== CARGAR SUMANDO (individual) ===== */
exports.sumar = async (req,res)=>{
  const back = '/adminEstadisticas/StatsCargarPitcheoJugador';
  try{
    const { id_temporada } = await getScope(req);
    const jid = Number(req.body.id_jugador)||0;
    const et  = Number(req.body.id_equipo_temporada)||0;
    if(!jid || !et){
      return res.flash({alertTitle:'Datos inválidos',alertMessage:'Equipo y jugador requeridos.',
                        alertIcon:'warning',showConfirmButton:true,timer:null,ruta:back}, back);
    }
    const I = v => Math.max(0, Number(v)||0);
    const D = v => Math.max(0, Number(v)||0);
    const p = {
      bb: I(req.body.bases_por_bolas),
      w:  I(req.body.victorias),
      l:  I(req.body.derrotas),
      ip: D(req.body.entradas_lanzadas),
      er: I(req.body.carreras_limpias),
      so: I(req.body.ponches)
    };
    const sql = `
      INSERT INTO EstadisticasPitcheoTemporada
        (id_temporada,id_jugador,id_equipo_temporada,bases_por_bolas,victorias,derrotas,entradas_lanzadas,carreras_limpias,ponches)
      VALUES (?,?,?,?,?,?,?,?,?)
      ON DUPLICATE KEY UPDATE
        id_equipo_temporada = VALUES(id_equipo_temporada),
        bases_por_bolas     = bases_por_bolas  + VALUES(bases_por_bolas),
        victorias           = victorias        + VALUES(victorias),
        derrotas            = derrotas         + VALUES(derrotas),
        entradas_lanzadas   = entradas_lanzadas+ VALUES(entradas_lanzadas),
        carreras_limpias    = carreras_limpias + VALUES(carreras_limpias),
        ponches             = ponches          + VALUES(ponches)
    `;
    await db.query(sql, [id_temporada, jid, et, p.bb,p.w,p.l,p.ip,p.er,p.so]);
    return res.flash({alertTitle:'Listo',alertMessage:'Pitcheo agregado.',
                      alertIcon:'success',showConfirmButton:false,timer:1200,ruta:back}, back);
  }catch(e){
    console.error(e);
    return res.flash({alertTitle:'Error',alertMessage:'No se pudo guardar.',
                      alertIcon:'error',showConfirmButton:true,timer:null,ruta:back}, back);
  }
};
