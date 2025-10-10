const db = require('../utils/db');

const wantsJSON = req =>
  !!(req.xhr || req.get('x-requested-with')==='XMLHttpRequest' || req.is('application/json'));

const backCrear = '/adminGeneral/formCrearEquipoBase';

/* Listar/Obtener */
exports.listar = async (_req,res)=>{
  const r = await db.query(`SELECT * FROM Equipos ORDER BY nombre_corto`);
  return res.json(r);
};
exports.obtener = async (req,res)=>{
  const r = await db.query(`SELECT * FROM Equipos WHERE id_equipo=?`, [req.params.id]);
  if (!r.length) return res.status(404).json({error:'no encontrado'});
  return res.json(r[0]);
};

/* Crear */
exports.crear = async (req,res)=>{
  try{
    const { nombre_corto } = req.body;
    if (!nombre_corto) {
      if (wantsJSON(req)) return res.status(400).json({error:'faltan campos'});
      return res.flash({
        alertTitle:'Datos incompletos',
        alertMessage:'Captura el nombre corto del equipo.',
        alertIcon:'warning', showConfirmButton:true, timer:null, ruta: backCrear
      }, backCrear);
    }
    const dup = await db.query(`SELECT 1 FROM Equipos WHERE nombre_corto=? LIMIT 1`, [nombre_corto]);
    if (dup.length){
      if (wantsJSON(req)) return res.status(409).json({error:'duplicado'});
      return res.flash({
        alertTitle:'Duplicado',
        alertMessage:'Ya existe un equipo con ese nombre.',
        alertIcon:'error', showConfirmButton:true, timer:null, ruta: backCrear
      }, backCrear);
    }

    await db.query(`INSERT INTO Equipos (nombre_corto) VALUES (?)`, [nombre_corto]);

    if (wantsJSON(req)) return res.json({ok:true});
    return res.flash({
      alertTitle:'Listo',
      alertMessage:'Equipo creado correctamente.',
      alertIcon:'success', showConfirmButton:false, timer:1500, ruta: backCrear
    }, backCrear);
  }catch(e){
    console.error(e);
    if (wantsJSON(req)) return res.status(500).json({error:'error'});
    return res.flash({
      alertTitle:'Error',
      alertMessage:'No se pudo crear el equipo.',
      alertIcon:'error', showConfirmButton:true, timer:null, ruta: backCrear
    }, backCrear);
  }
};

/* Actualizar */
exports.actualizar = async (req,res)=>{
  const { id } = req.params;
  const back = `/adminGeneral/formActualizarEquipoBase?id=${id}`;
  try{
    const { nombre_corto } = req.body;
    if (!nombre_corto){
      if (wantsJSON(req)) return res.status(400).json({error:'faltan campos'});
      return res.flash({
        alertTitle:'Datos incompletos',
        alertMessage:'Captura el nombre corto.',
        alertIcon:'warning', showConfirmButton:true, timer:null, ruta: back
      }, back);
    }
    const dup = await db.query(
      `SELECT 1 FROM Equipos WHERE nombre_corto=? AND id_equipo<>? LIMIT 1`, [nombre_corto, id]
    );
    if (dup.length){
      if (wantsJSON(req)) return res.status(409).json({error:'duplicado'});
      return res.flash({
        alertTitle:'Duplicado',
        alertMessage:'Ya existe un equipo con ese nombre.',
        alertIcon:'error', showConfirmButton:true, timer:null, ruta: back
      }, back);
    }

    const r = await db.query(`UPDATE Equipos SET nombre_corto=? WHERE id_equipo=?`, [nombre_corto, id]);
    if (!r.affectedRows){
      if (wantsJSON(req)) return res.status(404).json({error:'no encontrado'});
      return res.flash({
        alertTitle:'No encontrado',
        alertMessage:'El equipo no existe.',
        alertIcon:'error', showConfirmButton:true, timer:null, ruta: back
      }, back);
    }

    if (wantsJSON(req)) return res.json({ok:true});
    return res.flash({
      alertTitle:'Actualizado',
      alertMessage:'Equipo actualizado correctamente.',
      alertIcon:'success', showConfirmButton:false, timer:1200, ruta: back
    }, back);
  }catch(e){
    console.error(e);
    if (wantsJSON(req)) return res.status(500).json({error:'error'});
    return res.flash({
      alertTitle:'Error',
      alertMessage:'Ocurrió un error al actualizar.',
      alertIcon:'error', showConfirmButton:true, timer:null, ruta: back
    }, back);
  }
};

/* Eliminar */
exports.eliminar = async (req,res)=>{
  const back = '/adminGeneral/formActualizarEquipoBase';
  try{
    const r = await db.query(`DELETE FROM Equipos WHERE id_equipo=?`, [req.params.id]);
    if (!r.affectedRows){
      if (wantsJSON(req)) return res.status(404).json({error:'no encontrado'});
      return res.flash({
        alertTitle:'No encontrado',
        alertMessage:'El equipo no existe.',
        alertIcon:'error', showConfirmButton:true, timer:null, ruta: back
      }, back);
    }
    if (wantsJSON(req)) return res.json({ok:true});
    return res.flash({
      alertTitle:'Eliminado',
      alertMessage:'Equipo eliminado.',
      alertIcon:'success', showConfirmButton:false, timer:1200, ruta: back
    }, back);
  }catch(e){
    console.error(e);
    if (wantsJSON(req)) return res.status(500).json({error:'error'});
    return res.flash({
      alertTitle:'Error',
      alertMessage:'No se pudo eliminar.',
      alertIcon:'error', showConfirmButton:true, timer:null, ruta: back
    }, back);
  }
};

