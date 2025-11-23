// controllersGeneralStats/pitcheoGeneralController.js
const db = require('../utils/db');

const wantsJSON = req =>
  !!(req.xhr || req.get('x-requested-with') === 'XMLHttpRequest' || req.is('application/json'));
const i0 = v => Math.max(0, Number(v) || 0);
const f0 = v => Math.max(0, Number(v) || 0);

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

/* ===== Util ===== */
async function validarEquipoEnFiltro(id_equipo_temporada, id_temporada, id_categoria){
  const r = await db.query(
    `SELECT id_temporada,id_categoria FROM EquipoTemporada WHERE id_equipo_temporada=? LIMIT 1`,
    [id_equipo_temporada]
  );
  if(!r.length) return { ok:false, reason:'no-existe' };
  if(r[0].id_temporada!==id_temporada || r[0].id_categoria!==id_categoria) return { ok:false, reason:'mismatch' };
  return { ok:true };
}

exports.obtenerPitcheoJugador = async (req, res) => {
  const id_temporada = Number(req.query.id_temporada) || 0;
  const id_jugador   = Number(req.query.id_jugador)   || 0;

  if (!id_temporada || !id_jugador) {
    return res.json({
      bases_por_bolas: 0,
      victorias: 0,
      derrotas: 0,
      entradas_lanzadas: 0.0,
      carreras_limpias: 0,
      ponches: 0,
      efectividad: 0.000
    });
  }

  const rows = await db.query(
    `SELECT id_temporada,id_jugador,id_equipo_temporada,
            bases_por_bolas,victorias,derrotas,
            entradas_lanzadas,carreras_limpias,ponches
     FROM EstadisticasPitcheoTemporada
     WHERE id_temporada=? AND id_jugador=? LIMIT 1`,
    [id_temporada, id_jugador]
  );

  // Si no hay registro, regresar ceros
  if (!rows.length) {
    return res.json({
      bases_por_bolas: 0,
      victorias: 0,
      derrotas: 0,
      entradas_lanzadas: 0.0,
      carreras_limpias: 0,
      ponches: 0,
      efectividad: 0.000
    });
  }

  const x = rows[0];

  // Calcular ERA correctamente
  const frac = (ip) => {
    const b = Math.floor(ip + 1e-9);
    const f = Math.round((ip - b) * 10);
    return b + (f === 1 ? 1/3 : f === 2 ? 2/3 : 0);
  };

  const ip9 = frac(Number(x.entradas_lanzadas || 0));
  const era = ip9 > 0 ? (9 * Number(x.carreras_limpias || 0) / ip9) : 0;

  return res.json({
    ...x,
    efectividad: era
  });
};


/* ===== POST: carga masiva por equipo (SUMA) ===== */
exports.batchUpsertPitcheoEquipo = async (req,res)=>{
  const back = '/adminGeneral/formStatsCargarPitcheoEquipo';
  try{
    const id_temporada = Number(req.body.id_temporada)||0;
    const id_categoria = Number(req.body.id_categoria)||0;
    const eqId         = Number(req.body.id_equipo_temporada)||0;
    if(!id_temporada||!id_categoria||!eqId){
      return wantsJSON(req)?res.status(400).json({error:'faltan filtros'})
        : flash(res,{title:'Datos inválidos',text:'Selecciona temporada, categoría y equipo.',icon:'warning',showConfirmButton:true,timer:null},back);
    }

    const ok = await validarEquipoEnFiltro(eqId, id_temporada, id_categoria);
    if(!ok.ok){
      const msg = ok.reason==='no-existe'?'El equipo no existe.':'El equipo no pertenece a los filtros.';
      return wantsJSON(req)?res.status(400).json({error:'equipo invalido'})
        : flash(res,{title:'Sin coincidencia',text:msg,icon:'error',showConfirmButton:true,timer:null},back);
    }

    const ids = Array.isArray(req.body.id_jugador) ? req.body.id_jugador : [];
    if(!ids.length){
      return wantsJSON(req)?res.status(400).json({error:'sin jugadores'})
        : flash(res,{title:'Datos inválidos',text:'No hay jugadores para cargar.',icon:'warning',showConfirmButton:true,timer:null},back);
    }

    const BB = req.body.bases_por_bolas || [];
    const W  = req.body.victorias       || [];
    const L  = req.body.derrotas        || [];
    const IP = req.body.entradas_lanzadas || [];
    const ER = req.body.carreras_limpias  || [];
    const SO = req.body.ponches           || [];

    const rows=[];
    for(let i=0;i<ids.length;i++){
      const idj = Number(ids[i])||0; if(!idj) continue;
      rows.push([
        id_temporada,idj,eqId,
        i0(BB[i]), i0(W[i]), i0(L[i]),
        f0(IP[i]), i0(ER[i]), i0(SO[i])
      ]);
    }
    if(!rows.length){
      return wantsJSON(req)?res.status(400).json({error:'datos vacíos'})
        : flash(res,{title:'Datos inválidos',text:'No hay datos válidos para cargar.',icon:'warning',showConfirmButton:true,timer:null},back);
    }

    const sql = `
      INSERT INTO EstadisticasPitcheoTemporada
        (id_temporada,id_jugador,id_equipo_temporada,bases_por_bolas,victorias,derrotas,entradas_lanzadas,carreras_limpias,ponches)
      VALUES ?
      ON DUPLICATE KEY UPDATE
        id_equipo_temporada = VALUES(id_equipo_temporada),
        bases_por_bolas     = bases_por_bolas   + VALUES(bases_por_bolas),
        victorias           = victorias         + VALUES(victorias),
        derrotas            = derrotas          + VALUES(derrotas),
        entradas_lanzadas   = entradas_lanzadas + VALUES(entradas_lanzadas),
        carreras_limpias    = carreras_limpias  + VALUES(carreras_limpias),
        ponches             = ponches           + VALUES(ponches)
    `;
    await db.query(sql,[rows]);

    return wantsJSON(req)?res.json({ok:true})
      : flash(res,{title:'Listo',text:'Pitcheo cargado correctamente.',icon:'success'},back);

  }catch(e){
    console.error(e);
    return wantsJSON(req)?res.status(500).json({error:'error'})
      : flash(res,{title:'Error',text:'No se pudo cargar.',icon:'error',showConfirmButton:true,timer:null},back);
  }
};

/* ===== POST: actualizar línea del jugador (REEMPLAZO) ===== */
exports.actualizarPitcheoJugador = async (req,res)=>{
  const back = '/adminGeneral/formStatsEditarPitcheoJugador';
  try{
    const id_temporada = Number(req.body.id_temporada)||0;
    const id_jugador   = Number(req.body.id_jugador)||0;
    const eqId         = Number(req.body.id_equipo_temporada)||0;
    if(!id_temporada||!id_jugador||!eqId){
      return wantsJSON(req)?res.status(400).json({error:'faltan campos'})
        : flash(res,{title:'Datos inválidos',text:'Selecciona filtros y jugador.',icon:'warning',showConfirmButton:true,timer:null},back);
    }

    const ok = await validarEquipoEnFiltro(eqId, id_temporada, Number(req.body.id_categoria)||0);
    // Nota: si no envías id_categoria aquí, puedes omitir la validación de categoría.
    // Para mantener simetría, no errores si falta id_categoria:
    if(!ok.ok && ok.reason==='no-existe'){
      return wantsJSON(req)?res.status(400).json({error:'equipo invalido'})
        : flash(res,{title:'Sin coincidencia',text:'El equipo no existe.',icon:'error',showConfirmButton:true,timer:null},back);
    }

    const vals = {
      bb:  i0(req.body.bases_por_bolas),
      w:   i0(req.body.victorias),
      l:   i0(req.body.derrotas),
      ip:  f0(req.body.entradas_lanzadas),
      er:  i0(req.body.carreras_limpias),
      so:  i0(req.body.ponches)
    };

    await db.query(
      `INSERT INTO EstadisticasPitcheoTemporada
        (id_temporada,id_jugador,id_equipo_temporada,bases_por_bolas,victorias,derrotas,entradas_lanzadas,carreras_limpias,ponches)
       VALUES (?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         id_equipo_temporada=VALUES(id_equipo_temporada),
         bases_por_bolas   =VALUES(bases_por_bolas),
         victorias         =VALUES(victorias),
         derrotas          =VALUES(derrotas),
         entradas_lanzadas =VALUES(entradas_lanzadas),
         carreras_limpias  =VALUES(carreras_limpias),
         ponches           =VALUES(ponches)`,
      [id_temporada,id_jugador,eqId, vals.bb,vals.w,vals.l, vals.ip,vals.er,vals.so]
    );

    return wantsJSON(req)?res.json({ok:true})
      : flash(res,{title:'Actualizado',text:'Pitcheo del jugador actualizado.',icon:'success'},back);

  }catch(e){
    console.error(e);
    return wantsJSON(req)?res.status(500).json({error:'error'})
      : flash(res,{title:'Error',text:'No se pudo actualizar.',icon:'error',showConfirmButton:true,timer:null},back);
  }
};
