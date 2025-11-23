// controllersCoord/jugadoresCoordController.js
const path = require('path');
const db = require('../utils/db');

const wantsJSON = req =>
  !!(req.xhr ||
     req.get('x-requested-with') === 'XMLHttpRequest' ||
     req.is('application/json'));

const b = v => (v === '1' || v === 1 || v === true || v === 'on') ? 1 : 0;

const backCrear = '/adminCoordinador/CoordCrearJugador';
const backGestionar = id =>
  id ? `/adminCoordinador/CoordGestionarJugador?id=${id}` :
       '/adminCoordinador/CoordGestionarJugador';

const fotoPath = file =>
  file ? `/imgs/Jugadores/${path.basename(file.path)}` : null;

const noFuturo = iso => {
  const d = new Date(iso);
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  return d <= hoy;
};

// ============ CONSULTAS OPCIONALES (JSON) ============
async function listar(_req, res) {
  const r = await db.query(`
    SELECT id_jugador, url_foto, nombres, apellido_paterno, apellido_materno,
           fecha_nacimiento, activo
    FROM Jugadores
    ORDER BY apellido_paterno, apellido_materno, nombres
  `);
  return res.json(r);
}

async function obtener(req, res) {
  const r = await db.query(`SELECT * FROM Jugadores WHERE id_jugador=?`, [req.params.id]);
  if (!r.length) return res.status(404).json({ error: 'no encontrado' });
  return res.json(r[0]);
}

// ==================== CREAR ====================
async function crear(req, res) {
  try {
    const { nombres, apellido_paterno, apellido_materno, fecha_nacimiento } = req.body;
    const activo = b(req.body.activo ?? 1);
    const url_foto = fotoPath(req.file);

    if (!nombres || !apellido_paterno || !apellido_materno || !fecha_nacimiento) {
      if (wantsJSON(req)) return res.status(400).json({ error: 'faltan campos' });
      return res.flash({
        alertTitle: 'Datos incompletos',
        alertMessage: 'Llena nombres, apellidos y fecha de nacimiento.',
        alertIcon: 'warning',
        showConfirmButton: true,
        timer: null,
        ruta: backCrear
      }, backCrear);
    }

    if (!noFuturo(fecha_nacimiento)) {
      if (wantsJSON(req)) return res.status(400).json({ error: 'fecha futura' });
      return res.flash({
        alertTitle: 'Fecha inválida',
        alertMessage: 'La fecha de nacimiento no puede ser futura.',
        alertIcon: 'warning',
        showConfirmButton: true,
        timer: null,
        ruta: backCrear
      }, backCrear);
    }

    await db.query(
      `INSERT INTO Jugadores
       (url_foto, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, activo)
       VALUES (?,?,?,?,?,?)`,
      [url_foto, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, activo]
    );

    if (wantsJSON(req)) return res.json({ ok: true });
    return res.flash({
      alertTitle: 'Listo',
      alertMessage: 'Jugador creado correctamente.',
      alertIcon: 'success',
      showConfirmButton: false,
      timer: 1500,
      ruta: backCrear
    }, backCrear);

  } catch (e) {
    console.error(e);
    if (wantsJSON(req)) return res.status(500).json({ error: 'error' });
    return res.flash({
      alertTitle: 'Error',
      alertMessage: 'Ocurrió un error al crear el jugador.',
      alertIcon: 'error',
      showConfirmButton: true,
      timer: null,
      ruta: backCrear
    }, backCrear);
  }
}

// ==================== ACTUALIZAR ====================
async function actualizar(req, res) {
  const { id } = req.params;
  const back = backGestionar(id);

  try {
    const { nombres, apellido_paterno, apellido_materno, fecha_nacimiento } = req.body;
    const activo = b(req.body.activo ?? 0);
    const url_foto = req.file ? fotoPath(req.file) : (req.body.url_foto || null);

    if (!nombres || !apellido_paterno || !apellido_materno || !fecha_nacimiento) {
      if (wantsJSON(req)) return res.status(400).json({ error: 'faltan campos' });
      return res.flash({
        alertTitle: 'Datos incompletos',
        alertMessage: 'Llena nombres, apellidos y fecha de nacimiento.',
        alertIcon: 'warning',
        showConfirmButton: true,
        timer: null,
        ruta: back
      }, back);
    }

    if (!noFuturo(fecha_nacimiento)) {
      if (wantsJSON(req)) return res.status(400).json({ error: 'fecha futura' });
      return res.flash({
        alertTitle: 'Fecha inválida',
        alertMessage: 'La fecha de nacimiento no puede ser futura.',
        alertIcon: 'warning',
        showConfirmButton: true,
        timer: null,
        ruta: back
      }, back);
    }

    const r = await db.query(
      `UPDATE Jugadores
         SET url_foto=?, nombres=?, apellido_paterno=?, apellido_materno=?,
             fecha_nacimiento=?, activo=?
       WHERE id_jugador=?`,
      [url_foto, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, activo, id]
    );

    if (!r.affectedRows) {
      if (wantsJSON(req)) return res.status(404).json({ error: 'no encontrado' });
      return res.flash({
        alertTitle: 'No encontrado',
        alertMessage: 'El jugador no existe.',
        alertIcon: 'error',
        showConfirmButton: true,
        timer: null,
        ruta: back
      }, back);
    }

    if (wantsJSON(req)) return res.json({ ok: true });
    return res.flash({
      alertTitle: 'Actualizado',
      alertMessage: 'Jugador actualizado correctamente.',
      alertIcon: 'success',
      showConfirmButton: false,
      timer: 1200,
      ruta: back
    }, back);

  } catch (e) {
    console.error(e);
    if (wantsJSON(req)) return res.status(500).json({ error: 'error' });
    return res.flash({
      alertTitle: 'Error',
      alertMessage: 'Ocurrió un error al actualizar.',
      alertIcon: 'error',
      showConfirmButton: true,
      timer: null,
      ruta: back
    }, back);
  }
}

// ==================== ELIMINAR ====================
async function eliminar(req, res) {
  const { id } = req.params;
  const back = backGestionar(null);

  try {
    const r = await db.query(
      `DELETE FROM Jugadores WHERE id_jugador=?`,
      [id]
    );

    if (!r.affectedRows) {
      if (wantsJSON(req)) return res.status(404).json({ error: 'no encontrado' });
      return res.flash({
        alertTitle: 'No encontrado',
        alertMessage: 'El jugador no existe.',
        alertIcon: 'error',
        showConfirmButton: true,
        timer: null,
        ruta: back
      }, back);
    }

    if (wantsJSON(req)) return res.json({ ok: true });
    return res.flash({
      alertTitle: 'Eliminado',
      alertMessage: 'Jugador eliminado.',
      alertIcon: 'success',
      showConfirmButton: false,
      timer: 1200,
      ruta: back
    }, back);

  } catch (e) {
    console.error(e);
    if (wantsJSON(req)) return res.status(500).json({ error: 'error' });
    return res.flash({
      alertTitle: 'Error',
      alertMessage: 'No se pudo eliminar el jugador.',
      alertIcon: 'error',
      showConfirmButton: true,
      timer: null,
      ruta: back
    }, back);
  }
}

// ==================== MARCAR ACTIVO ====================
async function marcarActivo(req, res) {
  const { id } = req.params;
  const back = backGestionar(id);

  try {
    const r = await db.query(
      `UPDATE Jugadores SET activo=1 WHERE id_jugador=?`,
      [id]
    );

    if (!r.affectedRows) {
      if (wantsJSON(req)) return res.status(404).json({ error: 'no encontrado' });
      return res.flash({
        alertTitle: 'No encontrado',
        alertMessage: 'El jugador no existe.',
        alertIcon: 'error',
        showConfirmButton: true,
        timer: null,
        ruta: back
      }, back);
    }

    if (wantsJSON(req)) return res.json({ ok: true });
    return res.flash({
      alertTitle: 'Activado',
      alertMessage: 'Jugador marcado como activo.',
      alertIcon: 'success',
      showConfirmButton: false,
      timer: 1200,
      ruta: back
    }, back);

  } catch (e) {
    console.error(e);
    if (wantsJSON(req)) return res.status(500).json({ error: 'error' });
    return res.flash({
      alertTitle: 'Error',
      alertMessage: 'No se pudo activar el jugador.',
      alertIcon: 'error',
      showConfirmButton: true,
      timer: null,
      ruta: back
    }, back);
  }
}

// ==================== MARCAR INACTIVO ====================
async function marcarInactivo(req, res) {
  const { id } = req.params;
  const back = backGestionar(id);

  try {
    const r = await db.query(
      `UPDATE Jugadores SET activo=0 WHERE id_jugador=?`,
      [id]
    );

    if (!r.affectedRows) {
      if (wantsJSON(req)) return res.status(404).json({ error: 'no encontrado' });
      return res.flash({
        alertTitle: 'No encontrado',
        alertMessage: 'El jugador no existe.',
        alertIcon: 'error',
        showConfirmButton: true,
        timer: null,
        ruta: back
      }, back);
    }

    if (wantsJSON(req)) return res.json({ ok: true });
    return res.flash({
      alertTitle: 'Inactivado',
      alertMessage: 'Jugador marcado como inactivo.',
      alertIcon: 'success',
      showConfirmButton: false,
      timer: 1200,
      ruta: back
    }, back);

  } catch (e) {
    console.error(e);
    if (wantsJSON(req)) return res.status(500).json({ error: 'error' });
    return res.flash({
      alertTitle: 'Error',
      alertMessage: 'No se pudo inactivar el jugador.',
      alertIcon: 'error',
      showConfirmButton: true,
      timer: null,
      ruta: back
    }, back);
  }
}

module.exports = {
  listar,
  obtener,
  crear,
  actualizar,
  eliminar,
  marcarActivo,
  marcarInactivo
};

