// controllersGeneralStats/equipoGeneralController.js
const db = require('../utils/db');

const wantsJSON = req =>
  !!(req.xhr || req.get('x-requested-with') === 'XMLHttpRequest' || req.is('application/json'));
const i0 = v => Math.max(0, Number(v) || 0);

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

async function validarEquipoEnFiltro(id_equipo_temporada, id_temporada, id_categoria){
  const r = await db.query(
    `SELECT id_temporada,id_categoria FROM EquipoTemporada WHERE id_equipo_temporada=? LIMIT 1`,
    [id_equipo_temporada]
  );
  if(!r.length) return { ok:false, reason:'no-existe' };
  if(r[0].id_temporada!==id_temporada || r[0].id_categoria!==id_categoria) return { ok:false, reason:'mismatch' };
  return { ok:true };
}

/* === GET: fila del equipo para temporada === */
exports.obtenerEquipo = async (req,res)=>{
  const id_temporada = Number(req.query.id_temporada)||0;
  const etId = Number(req.query.id_equipo_temporada)||0;
  if(!id_temporada || !etId) return res.json(null);
  const r = await db.query(
    `SELECT id_temporada,id_equipo_temporada,carreras_en_contra,carreras_a_favor,ganados,perdidos,empatados,errores
       FROM EstadisticasEquipoTemporada
      WHERE id_temporada=? AND id_equipo_temporada=? LIMIT 1`,
    [id_temporada, etId]
  );
  res.json(r[0]||null);
};

/* === POST: SUMAR (carga masiva) === */
exports.sumar = async (req,res)=>{
  const back = '/adminGeneral/formStatsCargarEstadisticaEquipo';
  try{
    const id_temporada = Number(req.body.id_temporada)||0;
    const id_categoria = Number(req.body.id_categoria)||0;
    const etId         = Number(req.body.id_equipo_temporada)||0;

    if(!id_temporada||!id_categoria||!etId){
      return wantsJSON(req)?res.status(400).json({error:'faltan filtros'})
        : flash(res,{title:'Datos inválidos',text:'Selecciona temporada, categoría y equipo.',icon:'warning',showConfirmButton:true,timer:null},back);
    }

    const ok = await validarEquipoEnFiltro(etId, id_temporada, id_categoria);
    if(!ok.ok){
      const msg = ok.reason==='no-existe'?'El equipo no existe.':'El equipo no pertenece a los filtros.';
      return wantsJSON(req)?res.status(400).json({error:'equipo invalido'})
        : flash(res,{title:'Sin coincidencia',text:msg,icon:'error',showConfirmButton:true,timer:null},back);
    }

    const vals = {
      carreras_en_contra: i0(req.body.carreras_en_contra),
      carreras_a_favor:   i0(req.body.carreras_a_favor),
      ganados:            i0(req.body.ganados),
      perdidos:           i0(req.body.perdidos),
      empatados:          i0(req.body.empatados),
      errores:            i0(req.body.errores)
    };

    const sql = `
      INSERT INTO EstadisticasEquipoTemporada
        (id_temporada,id_equipo_temporada,carreras_en_contra,carreras_a_favor,ganados,perdidos,empatados,errores)
      VALUES (?,?,?,?,?,?,?,?)
      ON DUPLICATE KEY UPDATE
        carreras_en_contra = carreras_en_contra + VALUES(carreras_en_contra),
        carreras_a_favor   = carreras_a_favor   + VALUES(carreras_a_favor),
        ganados            = ganados            + VALUES(ganados),
        perdidos           = perdidos           + VALUES(perdidos),
        empatados          = empatados          + VALUES(empatados),
        errores            = errores            + VALUES(errores)
    `;
    await db.query(sql, [
      id_temporada, etId,
      vals.carreras_en_contra, vals.carreras_a_favor, vals.ganados,
      vals.perdidos, vals.empatados, vals.errores
    ]);

    return wantsJSON(req)?res.json({ok:true})
      : flash(res,{title:'Listo',text:'Estadísticas del equipo cargadas.',icon:'success'},back);

  }catch(e){
    console.error(e);
    return wantsJSON(req)?res.status(500).json({error:'error'})
      : flash(res,{title:'Error',text:'No se pudo cargar.',icon:'error',showConfirmButton:true,timer:null},back);
  }
};

/* === POST: REEMPLAZO (editar) === */
exports.actualizar = async (req,res)=>{
  const back = '/adminGeneral/formStatsEditarEstadisticaEquipo';
  try{
    const id_temporada = Number(req.body.id_temporada)||0;
    const etId         = Number(req.body.id_equipo_temporada)||0;
    if(!id_temporada||!etId){
      return wantsJSON(req)?res.status(400).json({error:'faltan campos'})
        : flash(res,{title:'Datos inválidos',text:'Selecciona temporada y equipo.',icon:'warning',showConfirmButton:true,timer:null},back);
    }

    const vals = {
      carreras_en_contra: i0(req.body.carreras_en_contra),
      carreras_a_favor:   i0(req.body.carreras_a_favor),
      ganados:            i0(req.body.ganados),
      perdidos:           i0(req.body.perdidos),
      empatados:          i0(req.body.empatados),
      errores:            i0(req.body.errores)
    };

    const sql = `
      INSERT INTO EstadisticasEquipoTemporada
        (id_temporada,id_equipo_temporada,carreras_en_contra,carreras_a_favor,ganados,perdidos,empatados,errores)
      VALUES (?,?,?,?,?,?,?,?)
      ON DUPLICATE KEY UPDATE
        carreras_en_contra = VALUES(carreras_en_contra),
        carreras_a_favor   = VALUES(carreras_a_favor),
        ganados            = VALUES(ganados),
        perdidos           = VALUES(perdidos),
        empatados          = VALUES(empatados),
        errores            = VALUES(errores)
    `;
    await db.query(sql, [
      id_temporada, etId,
      vals.carreras_en_contra, vals.carreras_a_favor, vals.ganados,
      vals.perdidos, vals.empatados, vals.errores
    ]);

    return wantsJSON(req)?res.json({ok:true})
      : flash(res,{title:'Actualizado',text:'Estadísticas del equipo actualizadas.',icon:'success'},back);

  }catch(e){
    console.error(e);
    return wantsJSON(req)?res.status(500).json({error:'error'})
      : flash(res,{title:'Error',text:'No se pudo actualizar.',icon:'error',showConfirmButton:true,timer:null},back);
  }
};
