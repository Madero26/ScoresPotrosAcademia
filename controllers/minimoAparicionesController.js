const db = require('../utils/db');

const wantsJSON = req => !!(req.xhr || req.get('x-requested-with')==='XMLHttpRequest' || req.is('application/json'));
const backCrear = '/adminGeneral/formCrearMinimoApariciones';
const backUpd   = '/adminGeneral/formActualizarMinimoApariciones';

/* ===== Formularios ===== */
exports.formCrear = async (_req,res)=>{
  const temporadas = await db.query(`SELECT id_temporada,nombre FROM Temporadas ORDER BY fecha_inicio DESC`);
  res.render('Coordinacion/General/Crear/formCrearMinimoApariciones',{...res.locals, temporadas});
};
exports.formActualizar = async (_req,res)=>{
  const temporadas = await db.query(`SELECT id_temporada,nombre FROM Temporadas ORDER BY fecha_inicio DESC`);
  res.render('Coordinacion/General/Actualizar/formActualizarMinimoApariciones',{...res.locals, temporadas});
};

/* ===== API ===== */
exports.obtenerPorTemporada = async (req,res)=>{
  const { id_temporada } = req.query;
  if(!Number(id_temporada)) return res.json(null);
  const r = await db.query(
    `SELECT id,id_temporada,habilitado,min_apariciones
     FROM MinimoAparicionesBateoTemporada WHERE id_temporada=? LIMIT 1`,
    [Number(id_temporada)]
  );
  res.json(r[0] || null);
};

/* ===== CRUD ===== */
exports.crear = async (req,res)=>{
  try{
    const { id_temporada, min_apariciones=0, habilitado=1 } = req.body;
    if(!Number(id_temporada)) {
      return wantsJSON(req)?res.status(400).json({error:'temporada requerida'})
        : res.flash({alertTitle:'Datos inválidos',alertMessage:'Selecciona temporada.',alertIcon:'warning',showConfirmButton:true,timer:null,ruta:backCrear}, backCrear);
    }
    const dup = await db.query(`SELECT 1 FROM MinimoAparicionesBateoTemporada WHERE id_temporada=? LIMIT 1`,[id_temporada]);
    if(dup.length){
      const msg='Ya existe un registro para esa temporada.';
      return wantsJSON(req)?res.status(409).json({error:msg})
        : res.flash({alertTitle:'Duplicado',alertMessage:msg,alertIcon:'error',showConfirmButton:true,timer:null,ruta:backCrear}, backCrear);
    }
    await db.query(
      `INSERT INTO MinimoAparicionesBateoTemporada (id_temporada,habilitado,min_apariciones) VALUES (?,?,?)`,
      [id_temporada, Number(habilitado)?1:0, Math.max(0,Number(min_apariciones)||0)]
    );
    return wantsJSON(req)?res.json({ok:true})
      : res.flash({alertTitle:'Listo',alertMessage:'Regla creada.',alertIcon:'success',showConfirmButton:false,timer:1200,ruta:backCrear}, backCrear);
  }catch(e){
    console.error(e);
    return wantsJSON(req)?res.status(500).json({error:'error'})
      : res.flash({alertTitle:'Error',alertMessage:'No se pudo crear.',alertIcon:'error',showConfirmButton:true,timer:null,ruta:backCrear}, backCrear);
  }
};

exports.actualizar = async (req,res)=>{
  try{
    const { id, min_apariciones=0, habilitado=1 } = req.body;
    if(!Number(id)){
      return wantsJSON(req)?res.status(400).json({error:'id requerido'})
        : res.flash({alertTitle:'Datos inválidos',alertMessage:'Selecciona temporada con regla.',alertIcon:'warning',showConfirmButton:true,timer:null,ruta:backUpd}, backUpd);
    }
    const r = await db.query(
      `UPDATE MinimoAparicionesBateoTemporada SET habilitado=?, min_apariciones=? WHERE id=?`,
      [Number(habilitado)?1:0, Math.max(0,Number(min_apariciones)||0), Number(id)]
    );
    if(!r.affectedRows){
      return wantsJSON(req)?res.status(404).json({error:'no encontrado'})
        : res.flash({alertTitle:'No encontrado',alertMessage:'No existe el registro.',alertIcon:'error',showConfirmButton:true,timer:null,ruta:backUpd}, backUpd);
    }
    return wantsJSON(req)?res.json({ok:true})
      : res.flash({alertTitle:'Actualizado',alertMessage:'Regla actualizada.',alertIcon:'success',showConfirmButton:false,timer:1200,ruta:backUpd}, backUpd);
  }catch(e){
    console.error(e);
    return wantsJSON(req)?res.status(500).json({error:'error'})
      : res.flash({alertTitle:'Error',alertMessage:'No se pudo actualizar.',alertIcon:'error',showConfirmButton:true,timer:null,ruta:backUpd}, backUpd);
  }
};

exports.eliminar = async (req,res)=>{
  try{
    const { id } = req.params;
    const r = await db.query(`DELETE FROM MinimoAparicionesBateoTemporada WHERE id=?`,[Number(id)]);
    if(!r.affectedRows){
      return wantsJSON(req)?res.status(404).json({error:'no encontrado'})
        : res.flash({alertTitle:'No encontrado',alertMessage:'No existe el registro.',alertIcon:'error',showConfirmButton:true,timer:null,ruta:backUpd}, backUpd);
    }
    return wantsJSON(req)?res.json({ok:true})
      : res.flash({alertTitle:'Eliminado',alertMessage:'Regla eliminada.',alertIcon:'success',showConfirmButton:false,timer:1200,ruta:backUpd}, backUpd);
  }catch(e){
    console.error(e);
    return wantsJSON(req)?res.status(500).json({error:'error'})
      : res.flash({alertTitle:'Error',alertMessage:'No se pudo eliminar.',alertIcon:'error',showConfirmButton:true,timer:null,ruta:backUpd}, backUpd);
  }
};

