const db = require('../utils/db');

const wantsJSON = req =>
  req.get('x-requested-with') === 'XMLHttpRequest' ||
  req.is('application/json') === 'application/json';

const backCrear = '/adminGeneral/formCrearCategoria';

exports.listar = async (_req, res) => {
  const r = await db.query(`SELECT * FROM Categorias ORDER BY edad_min`);
  return res.json(r);
};

exports.obtener = async (req, res) => {
  const r = await db.query(`SELECT * FROM Categorias WHERE id_categoria=?`, [req.params.id]);
  if (!r.length) return res.status(404).json({ error: 'no encontrada' });
  return res.json(r[0]);
};

exports.crear = async (req, res) => {
  try {
    const { nombre_categoria, edad_min, edad_max, url_foto = null } = req.body;

    if (!nombre_categoria || edad_min == null || edad_max == null) {
      if (wantsJSON(req)) return res.status(400).json({ error: 'faltan campos' });
      return res.flash({
        alertTitle:'Datos incompletos',
        alertMessage:'Llena nombre, edad mínima y máxima.',
        alertIcon:'warning', showConfirmButton:true, timer:null, ruta: backCrear
      }, backCrear);
    }

    if (Number(edad_min) > Number(edad_max)) {
      if (wantsJSON(req)) return res.status(400).json({ error: 'rango inválido' });
      return res.flash({
        alertTitle:'Rango inválido',
        alertMessage:'edad_min no puede ser mayor que edad_max.',
        alertIcon:'warning', showConfirmButton:true, timer:null, ruta: backCrear
      }, backCrear);
    }

    // Duplicado por nombre
    const dup = await db.query(
      `SELECT 1 FROM Categorias WHERE nombre_categoria=? LIMIT 1`, [nombre_categoria]
    );
    if (dup.length) {
      if (wantsJSON(req)) return res.status(409).json({ error:'nombre duplicado' });
      return res.flash({
        alertTitle:'Nombre duplicado',
        alertMessage:'Ya existe una categoría con ese nombre.',
        alertIcon:'error', showConfirmButton:true, timer:null, ruta: backCrear
      }, backCrear);
    }

    await db.query(
      `INSERT INTO Categorias (nombre_categoria, edad_min, edad_max, url_foto)
       VALUES (?,?,?,?)`,
      [nombre_categoria, edad_min, edad_max, url_foto]
    );

    if (wantsJSON(req)) return res.json({ ok:true });
    return res.flash({
      alertTitle:'Listo',
      alertMessage:'Categoría creada correctamente.',
      alertIcon:'success', showConfirmButton:false, timer:1500, ruta: backCrear
    }, backCrear);

  } catch (e) {
    console.error(e);
    if (wantsJSON(req)) return res.status(500).json({ error:'error' });
    return res.flash({
      alertTitle:'Error',
      alertMessage:'Ocurrió un error al crear la categoría.',
      alertIcon:'error', showConfirmButton:true, timer:null, ruta: backCrear
    }, backCrear);
  }
};

exports.actualizar = async (req, res) => {
  const { id } = req.params;
  const back = `/adminGeneral/formActualizarCategoria?id=${id}`;
  try {
    const { nombre_categoria, edad_min, edad_max, url_foto = null } = req.body;

    if (!nombre_categoria || edad_min == null || edad_max == null) {
      if (wantsJSON(req)) return res.status(400).json({ error: 'faltan campos' });
      return res.flash({
        alertTitle:'Datos incompletos',
        alertMessage:'Llena nombre, edad mínima y máxima.',
        alertIcon:'warning', showConfirmButton:true, timer:null, ruta: back
      }, back);
    }

    if (Number(edad_min) > Number(edad_max)) {
      if (wantsJSON(req)) return res.status(400).json({ error: 'rango inválido' });
      return res.flash({
        alertTitle:'Rango inválido',
        alertMessage:'edad_min no puede ser mayor que edad_max.',
        alertIcon:'warning', showConfirmButton:true, timer:null, ruta: back
      }, back);
    }

    // Duplicado por nombre en otro id
    const dup = await db.query(
      `SELECT 1 FROM Categorias WHERE nombre_categoria=? AND id_categoria<>? LIMIT 1`,
      [nombre_categoria, id]
    );
    if (dup.length) {
      if (wantsJSON(req)) return res.status(409).json({ error:'nombre duplicado' });
      return res.flash({
        alertTitle:'Nombre duplicado',
        alertMessage:'Ya existe una categoría con ese nombre.',
        alertIcon:'error', showConfirmButton:true, timer:null, ruta: back
      }, back);
    }

    const r = await db.query(
      `UPDATE Categorias
         SET nombre_categoria=?, edad_min=?, edad_max=?, url_foto=?
       WHERE id_categoria=?`,
      [nombre_categoria, edad_min, edad_max, url_foto, id]
    );

    if (!r.affectedRows) {
      if (wantsJSON(req)) return res.status(404).json({ error:'no encontrada' });
      return res.flash({
        alertTitle:'No encontrada',
        alertMessage:'La categoría no existe.',
        alertIcon:'error', showConfirmButton:true, timer:null, ruta: back
      }, back);
    }

    if (wantsJSON(req)) return res.json({ ok:true });
    return res.flash({
      alertTitle:'Actualizado',
      alertMessage:'Categoría actualizada correctamente.',
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

exports.eliminar = async (req, res) => {
  const back = '/adminGeneral/formActualizarCategoria';
  try {
    const r = await db.query(`DELETE FROM Categorias WHERE id_categoria=?`, [req.params.id]);
    if (!r.affectedRows) {
      if (wantsJSON(req)) return res.status(404).json({ error:'no encontrada' });
      return res.flash({
        alertTitle:'No encontrada',
        alertMessage:'La categoría no existe.',
        alertIcon:'error', showConfirmButton:true, timer:null, ruta: back
      }, back);
    }
    if (wantsJSON(req)) return res.json({ ok:true });
    return res.flash({
      alertTitle:'Eliminada',
      alertMessage:'Categoría eliminada.',
      alertIcon:'success', showConfirmButton:false, timer:1200, ruta: back
    }, back);
  } catch (e) {
    console.error(e);
    if (wantsJSON(req)) return res.status(500).json({ error:'error' });
    return res.flash({
      alertTitle:'Error',
      alertMessage:'No se pudo eliminar la categoría.',
      alertIcon:'error', showConfirmButton:true, timer:null, ruta: back
    }, back);
  }
};

