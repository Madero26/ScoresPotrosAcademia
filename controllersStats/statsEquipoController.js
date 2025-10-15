// controllersStats/statsEquipoController.js
const db = require('../utils/db');

const wantsJSON = r => !!(r.xhr || r.get('x-requested-with') === 'XMLHttpRequest' || r.is('application/json'));
const backAdd = '/adminEstadisticas/StatsCargarEstadisticaEquipo';
const backUpd = '/adminEstadisticas/StatsEditarEstadisticaEquipo';

async function getScope(req){
  return {
    id_temporada: Number(req.auth?.temporadaId || 0),
    id_categoria: Number(req.auth?.categoriaId  || 0)
  };
}
async function equiposDeMiScope(req){
  const { id_temporada, id_categoria } = await getScope(req);
  if(!id_temporada || !id_categoria) return [];
  return db.query(
    `SELECT id_equipo_temporada, nombre
       FROM EquipoTemporada
      WHERE id_temporada=? AND id_categoria=?
      ORDER BY nombre`, [id_temporada, id_categoria]
  );
}
async function readEquipo(req, etId){
  const { id_temporada } = await getScope(req);
  const r = await db.query(
    `SELECT * FROM EstadisticasEquipoTemporada
      WHERE id_temporada=? AND id_equipo_temporada=? LIMIT 1`,
    [id_temporada, etId]
  );
  return r[0] || null;
}

/* ====== FORMULARIOS ====== */
exports.formCrear = async (req,res)=>{
  const equipos = await equiposDeMiScope(req);
  res.render('Coordinacion/Estadisticas/Crear/CargarEstadisticaEquipo', { ...res.locals, equipos });
};
exports.formActualizar = async (req,res)=>{
  const equipos = await equiposDeMiScope(req);
  res.render('Coordinacion/Estadisticas/Actualizar/EditarEstadisticaEquipo', { ...res.locals, equipos });
};

/* ====== AJAX ====== */
exports.obtener = async (req,res)=>{
  const etId = Number(req.query.id_equipo_temporada)||0;
  if(!etId) return res.json(null);
  const row = await readEquipo(req, etId);
  res.json(row);
};

/* ====== SUMAR (carga) ====== */
exports.sumar = async (req,res)=>{
  try{
    const scope = await getScope(req);
    const etId = Number(req.body.id_equipo_temporada)||0;
    if(!etId){
      return wantsJSON(req)?res.status(400).json({error:'equipo requerido'})
        : res.flash({alertTitle:'Datos inválidos',alertMessage:'Selecciona un equipo.',
                     alertIcon:'warning',showConfirmButton:true,timer:null,ruta:backAdd}, backAdd);
    }
    const to = v => Math.max(0, Number(v)||0);
    const vals = {
      carreras_en_contra: to(req.body.carreras_en_contra),
      carreras_a_favor:   to(req.body.carreras_a_favor),
      ganados:            to(req.body.ganados),
      perdidos:           to(req.body.perdidos),
      empatados:          to(req.body.empatados),
      errores:            to(req.body.errores)
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
      scope.id_temporada, etId,
      vals.carreras_en_contra, vals.carreras_a_favor, vals.ganados,
      vals.perdidos, vals.empatados, vals.errores
    ]);

    return wantsJSON(req)?res.json({ok:true})
      : res.flash({alertTitle:'Listo',alertMessage:'Estadísticas del equipo cargadas.',
                   alertIcon:'success',showConfirmButton:false,timer:1200,ruta:backAdd}, backAdd);
  }catch(e){
    console.error(e);
    return wantsJSON(req)?res.status(500).json({error:'error'})
      : res.flash({alertTitle:'Error',alertMessage:'No se pudo cargar.',
                   alertIcon:'error',showConfirmButton:true,timer:null,ruta:backAdd}, backAdd);
  }
};

/* ====== ACTUALIZAR (reemplaza) ====== */
exports.actualizar = async (req,res)=>{
  try{
    const scope = await getScope(req);
    const etId = Number(req.body.id_equipo_temporada)||0;
    if(!etId){
      return res.flash({alertTitle:'Datos inválidos',alertMessage:'Selecciona un equipo.',
                        alertIcon:'warning',showConfirmButton:true,timer:null,ruta:backUpd}, backUpd);
    }
    const to = v => Math.max(0, Number(v)||0);
    const vals = {
      carreras_en_contra: to(req.body.carreras_en_contra),
      carreras_a_favor:   to(req.body.carreras_a_favor),
      ganados:            to(req.body.ganados),
      perdidos:           to(req.body.perdidos),
      empatados:          to(req.body.empatados),
      errores:            to(req.body.errores)
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
      scope.id_temporada, etId,
      vals.carreras_en_contra, vals.carreras_a_favor, vals.ganados,
      vals.perdidos, vals.empatados, vals.errores
    ]);

    return res.flash({alertTitle:'Actualizado',alertMessage:'Estadísticas del equipo actualizadas.',
                      alertIcon:'success',showConfirmButton:false,timer:1200,ruta:backUpd}, backUpd);
  }catch(e){
    console.error(e);
    return res.flash({alertTitle:'Error',alertMessage:'No se pudo actualizar.',
                      alertIcon:'error',showConfirmButton:true,timer:null,ruta:backUpd}, backUpd);
  }
};
