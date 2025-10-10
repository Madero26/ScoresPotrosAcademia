const db = require('../utils/db');
const { flashCookie } = require('../utils/flash');
const b = v => (v==='1'||v===1||v===true||v==='on')?1:0;
const wantsJSON = req =>
  req.get('x-requested-with') === 'XMLHttpRequest' ||
  req.is('application/json') === 'application/json';
const backCrear = '/adminGeneral/formCrearTemporada';

/* ===== Consultas (se quedan en JSON) ===== */
exports.listar = async (req, res) => {
  const r = await db.query(`SELECT * FROM Temporadas ORDER BY fecha_inicio DESC`);
  return res.json(r);
};

exports.obtener = async (req, res) => {
  const r = await db.query(`SELECT * FROM Temporadas WHERE id_temporada=?`, [req.params.id]);
  if (!r.length) return res.status(404).json({ error: 'no encontrada' });
  return res.json(r[0]);
};

/* ===== Crear ===== */
exports.crear = async (req, res) => {
  try {
    const { nombre, fecha_inicio, fecha_fin, fecha_corte_edad } = req.body;
    const is_activa = b(req.body.is_activa);

    if (!nombre || !fecha_inicio || !fecha_fin || !fecha_corte_edad) {
      if (wantsJSON(req)) return res.status(400).json({ error:'faltan campos' });
      return res.flash({
        alertTitle:'Datos incompletos',
        alertMessage:'Llena todos los campos obligatorios.',
        alertIcon:'warning', showConfirmButton:true, timer:null, ruta: backCrear
      }, backCrear);
    }

    const dup = await db.query(`SELECT 1 FROM Temporadas WHERE nombre=? LIMIT 1`, [nombre]);
    if (dup.length) {
      if (wantsJSON(req)) return res.status(409).json({ error:'nombre duplicado' });
      return res.flash({
        alertTitle:'Nombre duplicado',
        alertMessage:'Ya existe una temporada con ese nombre.',
        alertIcon:'error', showConfirmButton:true, timer:null, ruta: backCrear
      }, backCrear);
    }

    if (is_activa) await db.query(`UPDATE Temporadas SET is_activa=0 WHERE is_activa=1`);
    await db.query(
      `INSERT INTO Temporadas (nombre,fecha_inicio,fecha_fin,fecha_corte_edad,is_activa)
       VALUES (?,?,?,?,?)`,
      [nombre, fecha_inicio, fecha_fin, fecha_corte_edad, is_activa]
    );

    if (wantsJSON(req)) return res.json({ ok:true });
    return res.flash({
      alertTitle:'Listo',
      alertMessage:'Temporada creada correctamente.',
      alertIcon:'success', showConfirmButton:false, timer:1500, ruta: backCrear
    }, backCrear);

  } catch (e) {
    console.error(e);
    if (wantsJSON(req)) return res.status(500).json({ error:'error' });
    return res.flash({
      alertTitle:'Error',
      alertMessage:'Ocurrió un error al crear la temporada.',
      alertIcon:'error', showConfirmButton:true, timer:null, ruta: backCrear
    }, backCrear);
  }
};

/* ===== Actualizar ===== */
exports.actualizar = async (req, res) => {
  const { id } = req.params;
  const back = `/adminGeneral/formActualizarTemporada?id=${id}`;
  try {
    const { nombre, fecha_inicio, fecha_fin, fecha_corte_edad } = req.body;
    const is_activa = b(req.body.is_activa);

    if (!nombre || !fecha_inicio || !fecha_fin || !fecha_corte_edad) {
      if (wantsJSON(req)) return res.status(400).json({ error: 'faltan campos' });
      return res.flash({
        alertTitle: 'Datos incompletos',
        alertMessage: 'Llena todos los campos obligatorios.',
        alertIcon: 'warning', showConfirmButton: true, timer: null, ruta: back
      }, back);
    }

    const dup = await db.query(
      `SELECT 1 FROM Temporadas WHERE nombre=? AND id_temporada<>?`, [nombre, id]
    );
    if (dup.length) {
      if (wantsJSON(req)) return res.status(409).json({ error: 'nombre duplicado' });
      return res.flash({
        alertTitle: 'Nombre duplicado',
        alertMessage: 'Ya existe una temporada con ese nombre.',
        alertIcon: 'error', showConfirmButton: true, timer: null, ruta: back
      }, back);
    }

    if (is_activa) await db.query(`UPDATE Temporadas SET is_activa=0 WHERE id_temporada<>?`, [id]);

    const r = await db.query(
      `UPDATE Temporadas
         SET nombre=?, fecha_inicio=?, fecha_fin=?, fecha_corte_edad=?, is_activa=?
       WHERE id_temporada=?`,
      [nombre, fecha_inicio, fecha_fin, fecha_corte_edad, is_activa, id]
    );
    if (!r.affectedRows) {
      if (wantsJSON(req)) return res.status(404).json({ error: 'no encontrada' });
      return res.flash({
        alertTitle: 'No encontrada',
        alertMessage: 'La temporada no existe.',
        alertIcon: 'error', showConfirmButton: true, timer: null, ruta: back
      }, back);
    }

    if (wantsJSON(req)) return res.json({ ok: true });
    return res.flash({
      alertTitle: 'Actualizado',
      alertMessage: 'Temporada actualizada correctamente.',
      alertIcon: 'success', showConfirmButton: false, timer: 1200, ruta: back
    }, back);
  } catch (e) {
    console.error(e);
    if (wantsJSON(req)) return res.status(500).json({ error: 'error' });
    return res.flash({
      alertTitle: 'Error',
      alertMessage: 'Ocurrió un error al actualizar.',
      alertIcon: 'error', showConfirmButton: true, timer: null, ruta: back
    }, back);
  }
};

/* ===== Eliminar ===== */
exports.eliminar = async (req, res) => {
  const back = '/adminGeneral/formActualizarTemporada'; // tras borrar, sin id
  try {
    const r = await db.query(`DELETE FROM Temporadas WHERE id_temporada=?`, [req.params.id]);
    if (!r.affectedRows) {
      if (wantsJSON(req)) return res.status(404).json({ error: 'no encontrada' });
      return res.flash({
        alertTitle: 'No encontrada',
        alertMessage: 'La temporada no existe.',
        alertIcon: 'error', showConfirmButton: true, timer: null, ruta: back
      }, back);
    }
    if (wantsJSON(req)) return res.json({ ok: true });
    return res.flash({
      alertTitle: 'Eliminada',
      alertMessage: 'Temporada eliminada.',
      alertIcon: 'success', showConfirmButton: false, timer: 1200, ruta: back
    }, back);
  } catch (e) {
    console.error(e);
    if (wantsJSON(req)) return res.status(500).json({ error: 'error' });
    return res.flash({
      alertTitle: 'Error',
      alertMessage: 'No se pudo eliminar la temporada.',
      alertIcon: 'error', showConfirmButton: true, timer: null, ruta: back
    }, back);
  }
};

/* ===== Marcar activa ===== */
exports.marcarActiva = async (req, res) => {
  const id = req.params.id;
  const back = `/adminGeneral/formActualizarTemporada?id=${id}`;
  try {
    await db.query(`UPDATE Temporadas SET is_activa=0 WHERE is_activa=1`);
    const r = await db.query(`UPDATE Temporadas SET is_activa=1 WHERE id_temporada=?`, [id]);
    if (!r.affectedRows) {
      if (wantsJSON(req)) return res.status(404).json({ error: 'no encontrada' });
      return res.flash({
        alertTitle: 'No encontrada',
        alertMessage: 'La temporada no existe.',
        alertIcon: 'error', showConfirmButton: true, timer: null, ruta: back
      }, back);
    }
    if (wantsJSON(req)) return res.json({ ok: true });
    return res.flash({
      alertTitle: 'Activada',
      alertMessage: 'Temporada marcada como activa.',
      alertIcon: 'success', showConfirmButton: false, timer: 1200, ruta: back
    }, back);
  } catch (e) {
    console.error(e);
    if (wantsJSON(req)) return res.status(500).json({ error: 'error' });
    return res.flash({
      alertTitle: 'Error',
      alertMessage: 'No se pudo activar la temporada.',
      alertIcon: 'error', showConfirmButton: true, timer: null, ruta: back
    }, back);
  }
};
