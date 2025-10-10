const db = require('../utils/db');

const wantsJSON = req =>
  !!(req.xhr || req.get('x-requested-with')==='XMLHttpRequest' || req.is('application/json'));

const backCrear = '/adminGeneral/formCrearEntrenador';

/* Listar/Obtener */
exports.listar = async (_req, res) => {
  const r = await db.query(`SELECT * FROM Entrenadores ORDER BY apellido_paterno, apellido_materno, nombres`);
  return res.json(r);
};

exports.obtener = async (req, res) => {
  const r = await db.query(`SELECT * FROM Entrenadores WHERE id_entrenador=?`, [req.params.id]);
  if (!r.length) return res.status(404).json({ error:'no encontrado' });
  return res.json(r[0]);
};

/* Crear */
exports.crear = async (req, res) => {
  try {
    const { nombres, apellido_paterno, apellido_materno } = req.body;
    if (!nombres || !apellido_paterno || !apellido_materno) {
      if (wantsJSON(req)) return res.status(400).json({ error:'faltan campos' });
      return res.flash({
        alertTitle:'Datos incompletos',
        alertMessage:'Llena nombres y ambos apellidos.',
        alertIcon:'warning', showConfirmButton:true, timer:null, ruta: backCrear
      }, backCrear);
    }

    await db.query(
      `INSERT INTO Entrenadores (nombres, apellido_paterno, apellido_materno) VALUES (?,?,?)`,
      [nombres, apellido_paterno, apellido_materno]
    );

    if (wantsJSON(req)) return res.json({ ok:true });
    return res.flash({
      alertTitle:'Listo',
      alertMessage:'Entrenador creado correctamente.',
      alertIcon:'success', showConfirmButton:false, timer:1500, ruta: backCrear
    }, backCrear);

  } catch (e) {
    console.error(e);
    if (wantsJSON(req)) return res.status(500).json({ error:'error' });
    return res.flash({
      alertTitle:'Error',
      alertMessage:'Ocurrió un error al crear.',
      alertIcon:'error', showConfirmButton:true, timer:null, ruta: backCrear
    }, backCrear);
  }
};

/* Actualizar */
exports.actualizar = async (req, res) => {
  const { id } = req.params;
  const back = `/adminGeneral/formActualizarEntrenador?id=${id}`;
  try {
    const { nombres, apellido_paterno, apellido_materno } = req.body;
    if (!nombres || !apellido_paterno || !apellido_materno) {
      if (wantsJSON(req)) return res.status(400).json({ error:'faltan campos' });
      return res.flash({
        alertTitle:'Datos incompletos',
        alertMessage:'Llena nombres y ambos apellidos.',
        alertIcon:'warning', showConfirmButton:true, timer:null, ruta: back
      }, back);
    }

    const r = await db.query(
      `UPDATE Entrenadores SET nombres=?, apellido_paterno=?, apellido_materno=? WHERE id_entrenador=?`,
      [nombres, apellido_paterno, apellido_materno, id]
    );

    if (!r.affectedRows) {
      if (wantsJSON(req)) return res.status(404).json({ error:'no encontrado' });
      return res.flash({
        alertTitle:'No encontrado',
        alertMessage:'El entrenador no existe.',
        alertIcon:'error', showConfirmButton:true, timer:null, ruta: back
      }, back);
    }

    if (wantsJSON(req)) return res.json({ ok:true });
    return res.flash({
      alertTitle:'Actualizado',
      alertMessage:'Entrenador actualizado correctamente.',
      alertIcon:'success', showConfirmButton:false, timer:1200, ruta: back
    }, back);

  } catch (e) {
    console.error(e);
    if (wantsJSON(req)) return res.status(500).json({ error:'error' });
    return res.flash({
      alertTitle:'Error',
      alertMessage:'Ocurrió un error al actualizar.',
      alertIcon:'error', showConfirmButton:true, timer:null, ruta: back
    }, back);
  }
};

/* Eliminar */
exports.eliminar = async (req, res) => {
  const back = '/adminGeneral/formActualizarEntrenador';
  try {
    const r = await db.query(`DELETE FROM Entrenadores WHERE id_entrenador=?`, [req.params.id]);
    if (!r.affectedRows) {
      if (wantsJSON(req)) return res.status(404).json({ error:'no encontrado' });
      return res.flash({
        alertTitle:'No encontrado',
        alertMessage:'El entrenador no existe.',
        alertIcon:'error', showConfirmButton:true, timer:null, ruta: back
      }, back);
    }
    if (wantsJSON(req)) return res.json({ ok:true });
    return res.flash({
      alertTitle:'Eliminado',
      alertMessage:'Entrenador eliminado.',
      alertIcon:'success', showConfirmButton:false, timer:1200, ruta: back
    }, back);
  } catch (e) {
    console.error(e);
    if (wantsJSON(req)) return res.status(500).json({ error:'error' });
    return res.flash({
      alertTitle:'Error',
      alertMessage:'No se pudo eliminar.',
      alertIcon:'error', showConfirmButton:true, timer:null, ruta: back
    }, back);
  }
};

