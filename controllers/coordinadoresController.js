const path = require('path');
const db = require('../utils/db');

const wantsJSON = req =>
  !!(req.xhr || req.get('x-requested-with')==='XMLHttpRequest' || req.is('application/json'));

const backCrear = '/adminGeneral/formCrearCoordinador';
const fotoPath = file => file ? `/imgs/Coordinadores/${path.basename(file.path)}` : null;

/* Listar/Obtener */
exports.listar = async (_req,res)=>{
  const r = await db.query(`SELECT * FROM Coordinadores ORDER BY apellido_paterno, apellido_materno, nombres`);
  return res.json(r);
};
exports.obtener = async (req,res)=>{
  const r = await db.query(`SELECT * FROM Coordinadores WHERE id_coordinador=?`, [req.params.id]);
  if (!r.length) return res.status(404).json({error:'no encontrado'});
  return res.json(r[0]);
};

/* Crear */
exports.crear = async (req,res)=>{
  try{
    const {nombres,apellido_paterno,apellido_materno} = req.body;
    const url_foto = fotoPath(req.file); // usa archivo subido
    if(!nombres || !apellido_paterno || !apellido_materno){
      if(wantsJSON(req)) return res.status(400).json({error:'faltan campos'});
      return res.flash({
        alertTitle:'Datos incompletos',
        alertMessage:'Llena nombres y ambos apellidos.',
        alertIcon:'warning', showConfirmButton:true, timer:null, ruta: backCrear
      }, backCrear);
    }
    await db.query(
      `INSERT INTO Coordinadores (url_foto,nombres,apellido_paterno,apellido_materno) VALUES (?,?,?,?)`,
      [url_foto,nombres,apellido_paterno,apellido_materno]
    );
    if(wantsJSON(req)) return res.json({ok:true});
    return res.flash({
      alertTitle:'Listo',
      alertMessage:'Coordinador creado correctamente.',
      alertIcon:'success', showConfirmButton:false, timer:1500, ruta: backCrear
    }, backCrear);
  }catch(e){
    console.error(e);
    if(wantsJSON(req)) return res.status(500).json({error:'error'});
    return res.flash({
      alertTitle:'Error',
      alertMessage:'Ocurrió un error al crear.',
      alertIcon:'error', showConfirmButton:true, timer:null, ruta: backCrear
    }, backCrear);
  }
};

/* Actualizar */
exports.actualizar = async (req,res)=>{
  const { id } = req.params;
  const back = `/adminGeneral/formActualizarCoordinador?id=${id}`;
  try{
    const {nombres,apellido_paterno,apellido_materno} = req.body;
    const url_foto = req.file ? fotoPath(req.file) : (req.body.url_foto || null);
    if(!nombres || !apellido_paterno || !apellido_materno){
      if(wantsJSON(req)) return res.status(400).json({error:'faltan campos'});
      return res.flash({
        alertTitle:'Datos incompletos',
        alertMessage:'Llena nombres y ambos apellidos.',
        alertIcon:'warning', showConfirmButton:true, timer:null, ruta: back
      }, back);
    }
    const r = await db.query(
      `UPDATE Coordinadores SET url_foto=?, nombres=?, apellido_paterno=?, apellido_materno=? WHERE id_coordinador=?`,
      [url_foto,nombres,apellido_paterno,apellido_materno,id]
    );
    if(!r.affectedRows){
      if(wantsJSON(req)) return res.status(404).json({error:'no encontrado'});
      return res.flash({
        alertTitle:'No encontrado',
        alertMessage:'El coordinador no existe.',
        alertIcon:'error', showConfirmButton:true, timer:null, ruta: back
      }, back);
    }
    if(wantsJSON(req)) return res.json({ok:true});
    return res.flash({
      alertTitle:'Actualizado',
      alertMessage:'Coordinador actualizado correctamente.',
      alertIcon:'success', showConfirmButton:false, timer:1200, ruta: back
    }, back);
  }catch(e){
    console.error(e);
    if(wantsJSON(req)) return res.status(500).json({error:'error'});
    return res.flash({
      alertTitle:'Error',
      alertMessage:'Ocurrió un error al actualizar.',
      alertIcon:'error', showConfirmButton:true, timer:null, ruta: back
    }, back);
  }
};

/* Eliminar */
exports.eliminar = async (req,res)=>{
  const back = '/adminGeneral/formActualizarCoordinador';
  try{
    const r = await db.query(`DELETE FROM Coordinadores WHERE id_coordinador=?`, [req.params.id]);
    if(!r.affectedRows){
      if(wantsJSON(req)) return res.status(404).json({error:'no encontrado'});
      return res.flash({
        alertTitle:'No encontrado',
        alertMessage:'El coordinador no existe.',
        alertIcon:'error', showConfirmButton:true, timer:null, ruta: back
      }, back);
    }
    if(wantsJSON(req)) return res.json({ok:true});
    return res.flash({
      alertTitle:'Eliminado',
      alertMessage:'Coordinador eliminado.',
      alertIcon:'success', showConfirmButton:false, timer:1200, ruta: back
    }, back);
  }catch(e){
    console.error(e);
    if(wantsJSON(req)) return res.status(500).json({error:'error'});
    return res.flash({
      alertTitle:'Error',
      alertMessage:'No se pudo eliminar.',
      alertIcon:'error', showConfirmButton:true, timer:null, ruta: back
    }, back);
  }
};

