// controllersCoord/equiposTemporadaCoordController.js
const path = require('path');
const db   = require('../utils/db');

const wantsJSON = req =>
  !!(req.xhr ||
     req.get('x-requested-with') === 'XMLHttpRequest' ||
     req.is('application/json'));

const backCrear = '/adminCoordinador/CoordRegistrarEquipoTemporada';
const backGestionar = id =>
  '/adminCoordinador/CoordGestionarEquipoTemporada' + (id ? `?id=${id}` : '');

const fotoPath = file =>
  file ? `/imgs/Equipos/${path.basename(file.path)}` : null;

// obtiene temporada/categoría desde el JWT/session
function getScope(req) {
  const temporadaId = Number(req.auth && req.auth.temporadaId) || 0;
  const categoriaId = Number(req.auth && req.auth.categoriaId) || 0;
  return { temporadaId, categoriaId };
}

async function entrenadoresDisponibles(id_temporada, id_equipo_temporada) {
  if (!id_temporada) return [];
  const r = await db.query(`
    SELECT en.id_entrenador,
           CONCAT(en.apellido_paterno,' ',en.apellido_materno,', ',en.nombres) AS nombre
    FROM Entrenadores en
    LEFT JOIN (
      SELECT id_entrenador, id_equipo_temporada
      FROM EquipoTemporada
      WHERE id_temporada=? AND id_entrenador IS NOT NULL
    ) asg ON asg.id_entrenador = en.id_entrenador
    WHERE asg.id_entrenador IS NULL OR asg.id_equipo_temporada = ?
    ORDER BY en.apellido_paterno, en.apellido_materno, en.nombres
  `, [id_temporada, Number(id_equipo_temporada) || 0]);
  return r;
}

/* ========== FORM CREAR ========== */
exports.formCrear = async (req, res) => {
  const { temporadaId, categoriaId } = getScope(req);

  if (!temporadaId || !categoriaId) {
    return res.render('Coordinacion/Coordinador/Crear/CoordRegistrarEquipoTemporada', {
      ...res.locals,
      sinAsignacion: true,
      temporada: null,
      categoria: null,
      equiposBase: [],
      entrenadores: [],
      temporadaId,
      categoriaId
    });
  }

  const [temporada] = await db.query(
    `SELECT id_temporada, nombre FROM Temporadas WHERE id_temporada=?`,
    [temporadaId]
  );
  const [categoria] = await db.query(
    `SELECT id_categoria, nombre_categoria AS nombre
     FROM Categorias WHERE id_categoria=?`,
    [categoriaId]
  );

  const equiposBase = await db.query(
    `SELECT id_equipo, nombre_corto FROM Equipos ORDER BY nombre_corto`
  );

  const entrenadores = await entrenadoresDisponibles(temporadaId, 0);

  return res.render('Coordinacion/Coordinador/Crear/CoordRegistrarEquipoTemporada', {
    ...res.locals,
    sinAsignacion: false,
    temporada,
    categoria,
    equiposBase,
    entrenadores,
    temporadaId,
    categoriaId
  });
};

/* ========== FORM GESTIONAR ========== */
exports.formGestionar = async (req, res) => {
  const { temporadaId, categoriaId } = getScope(req);

  if (!temporadaId || !categoriaId) {
    return res.render('Coordinacion/Coordinador/Gestionar/CoordGestionarEquipoTemporada', {
      ...res.locals,
      sinAsignacion: true,
      temporada: null,
      categoria: null,
      equipos: [],
      equipo: null,
      equiposBase: [],
      entrenadores: []
    });
  }

  const [temporada] = await db.query(
    `SELECT id_temporada, nombre FROM Temporadas WHERE id_temporada=?`,
    [temporadaId]
  );
  const [categoria] = await db.query(
    `SELECT id_categoria, nombre_categoria AS nombre
     FROM Categorias WHERE id_categoria=?`,
    [categoriaId]
  );

  const equipos = await db.query(`
    SELECT et.*, e.nombre_corto,
           CONCAT(co.apellido_paterno,' ',co.apellido_materno,', ',co.nombres) AS entrenador_nombre
    FROM EquipoTemporada et
    LEFT JOIN Equipos e      ON e.id_equipo      = et.id_equipo
    LEFT JOIN Entrenadores co ON co.id_entrenador = et.id_entrenador
    WHERE et.id_temporada=? AND et.id_categoria=?
    ORDER BY et.nombre
  `, [temporadaId, categoriaId]);

  const selId = req.query.id || (equipos[0] && equipos[0].id_equipo_temporada);
  const equipo = selId
    ? equipos.find(x => Number(x.id_equipo_temporada) === Number(selId)) || null
    : null;

  const equiposBase = await db.query(
    `SELECT id_equipo, nombre_corto FROM Equipos ORDER BY nombre_corto`
  );

  const entrenadores = equipo
    ? await entrenadoresDisponibles(temporadaId, equipo.id_equipo_temporada)
    : [];

  return res.render('Coordinacion/Coordinador/Gestionar/CoordGestionarEquipoTemporada', {
    ...res.locals,
    sinAsignacion: false,
    temporada,
    categoria,
    equipos,
    equipo,
    equiposBase,
    entrenadores
  });
};

/* ========== CREAR ========== */
exports.crear = async (req, res) => {
  const { temporadaId, categoriaId } = getScope(req);

  if (!temporadaId || !categoriaId) {
    if (wantsJSON(req)) return res.status(400).json({ error: 'sin_asignacion' });
    return res.flash({
      alertTitle: 'Sin categoría',
      alertMessage: 'Tu usuario no tiene temporada/categoría asignadas.',
      alertIcon: 'warning',
      showConfirmButton: true,
      timer: null,
      ruta: backCrear
    }, backCrear);
  }

  try {
    const { id_equipo = null, nombre, colores = '', id_entrenador = null } = req.body;
    const url_foto = fotoPath(req.file);

    if (!String(nombre || '').trim()) {
      if (wantsJSON(req)) return res.status(400).json({ error: 'faltan o inválidos' });
      return res.flash({
        alertTitle: 'Datos inválidos',
        alertMessage: 'El nombre del equipo es obligatorio.',
        alertIcon: 'warning',
        showConfirmButton: true,
        timer: null,
        ruta: backCrear
      }, backCrear);
    }

    // entrenador único en la temporada
    if (Number(id_entrenador)) {
      const dup = await db.query(
        `SELECT 1 FROM EquipoTemporada
         WHERE id_temporada=? AND id_entrenador=? LIMIT 1`,
        [temporadaId, id_entrenador]
      );
      if (dup.length) {
        const msg = 'Ese entrenador ya está asignado a otro equipo en esta temporada.';
        if (wantsJSON(req)) return res.status(409).json({ error: msg });
        return res.flash({
          alertTitle: 'No permitido',
          alertMessage: msg,
          alertIcon: 'warning',
          showConfirmButton: true,
          timer: null,
          ruta: backCrear
        }, backCrear);
      }
    }

    await db.query('START TRANSACTION');

    const ins = await db.query(`
      INSERT INTO EquipoTemporada
        (id_equipo, id_temporada, id_categoria, nombre, colores, url_foto, id_entrenador)
      VALUES (?,?,?,?,?,?,?)
    `, [
      id_equipo || null,
      temporadaId,
      categoriaId,
      nombre.trim(),
      colores.trim(),
      url_foto,
      Number(id_entrenador) || null
    ]);

    const nuevoId = ins.insertId;

    await db.query(`
      INSERT INTO EstadisticasEquipoTemporada (id_temporada, id_equipo_temporada)
      VALUES (?,?)
    `, [temporadaId, nuevoId]);

    await db.query('COMMIT');

    if (wantsJSON(req)) return res.json({ ok: true, id_equipo_temporada: nuevoId });
    return res.flash({
      alertTitle: 'Listo',
      alertMessage: 'Equipo registrado en tu categoría.',
      alertIcon: 'success',
      showConfirmButton: false,
      timer: 1200,
      ruta: backCrear
    }, backCrear);
  } catch (e) {
    try { await db.query('ROLLBACK'); } catch {}
    console.error(e);
    const msg = (e.code === 'ER_DUP_ENTRY')
      ? 'Ya existe un equipo con ese nombre en tu categoría para esta temporada.'
      : 'Error al registrar el equipo.';
    if (wantsJSON(req)) return res.status(500).json({ error: msg });
    return res.flash({
      alertTitle: 'Error',
      alertMessage: msg,
      alertIcon: 'error',
      showConfirmButton: true,
      timer: null,
      ruta: backCrear
    }, backCrear);
  }
};

/* ========== ACTUALIZAR ========== */
exports.actualizar = async (req, res) => {
  const { temporadaId, categoriaId } = getScope(req);
  const { id } = req.params;
  const back = backGestionar(id);

  if (!temporadaId || !categoriaId) {
    if (wantsJSON(req)) return res.status(400).json({ error: 'sin_asignacion' });
    return res.flash({
      alertTitle: 'Sin categoría',
      alertMessage: 'Tu usuario no tiene temporada/categoría asignadas.',
      alertIcon: 'warning',
      showConfirmButton: true,
      timer: null,
      ruta: back
    }, back);
  }

  try {
    const { id_equipo = null, nombre, colores = '', url_foto: prevUrl = null, id_entrenador = null } = req.body;
    const url_foto = req.file ? fotoPath(req.file) : (prevUrl || null);

    if (!String(nombre || '').trim()) {
      if (wantsJSON(req)) return res.status(400).json({ error: 'faltan o inválidos' });
      return res.flash({
        alertTitle: 'Datos inválidos',
        alertMessage: 'El nombre del equipo es obligatorio.',
        alertIcon: 'warning',
        showConfirmButton: true,
        timer: null,
        ruta: back
      }, back);
    }

    const cur = await db.query(
      `SELECT id_temporada, id_categoria
       FROM EquipoTemporada
       WHERE id_equipo_temporada=? LIMIT 1`,
      [id]
    );
    if (!cur.length ||
        cur[0].id_temporada !== temporadaId ||
        cur[0].id_categoria !== categoriaId) {
      if (wantsJSON(req)) return res.status(404).json({ error: 'no encontrado' });
      return res.flash({
        alertTitle: 'No encontrado',
        alertMessage: 'El equipo no pertenece a tu categoría.',
        alertIcon: 'error',
        showConfirmButton: true,
        timer: null,
        ruta: back
      }, back);
    }

    if (Number(id_entrenador)) {
      const clash = await db.query(
        `SELECT 1 FROM EquipoTemporada
         WHERE id_temporada=? AND id_entrenador=? AND id_equipo_temporada<>? LIMIT 1`,
        [temporadaId, id_entrenador, id]
      );
      if (clash.length) {
        const msg = 'Ese entrenador ya dirige otro equipo en esta temporada.';
        if (wantsJSON(req)) return res.status(409).json({ error: msg });
        return res.flash({
          alertTitle: 'No permitido',
          alertMessage: msg,
          alertIcon: 'warning',
          showConfirmButton: true,
          timer: null,
          ruta: back
        }, back);
      }
    }

    const r = await db.query(`
      UPDATE EquipoTemporada
      SET id_equipo=?, nombre=?, colores=?, url_foto=?, id_entrenador=?
      WHERE id_equipo_temporada=? AND id_temporada=? AND id_categoria=?
    `, [
      id_equipo || null,
      nombre.trim(),
      colores.trim(),
      url_foto,
      Number(id_entrenador) || null,
      id,
      temporadaId,
      categoriaId
    ]);

    if (!r.affectedRows) {
      if (wantsJSON(req)) return res.status(404).json({ error: 'no encontrado' });
      return res.flash({
        alertTitle: 'No encontrado',
        alertMessage: 'El equipo no existe o no es de tu categoría.',
        alertIcon: 'error',
        showConfirmButton: true,
        timer: null,
        ruta: back
      }, back);
    }

    if (wantsJSON(req)) return res.json({ ok: true });
    return res.flash({
      alertTitle: 'Actualizado',
      alertMessage: 'Equipo actualizado correctamente.',
      alertIcon: 'success',
      showConfirmButton: false,
      timer: 1200,
      ruta: back
    }, back);
  } catch (e) {
    console.error(e);
    const msg = (e.code === 'ER_DUP_ENTRY')
      ? 'Ya existe un equipo con ese nombre en tu categoría.'
      : 'Error al actualizar el equipo.';
    if (wantsJSON(req)) return res.status(500).json({ error: msg });
    return res.flash({
      alertTitle: 'Error',
      alertMessage: msg,
      alertIcon: 'error',
      showConfirmButton: true,
      timer: null,
      ruta: back
    }, back);
  }
};

/* ========== ELIMINAR ========== */
exports.eliminar = async (req, res) => {
  const { temporadaId, categoriaId } = getScope(req);
  const { id } = req.params;
  const back = backGestionar();

  if (!temporadaId || !categoriaId) {
    if (wantsJSON(req)) return res.status(400).json({ error: 'sin_asignacion' });
    return res.flash({
      alertTitle: 'Sin categoría',
      alertMessage: 'Tu usuario no tiene temporada/categoría asignadas.',
      alertIcon: 'warning',
      showConfirmButton: true,
      timer: null,
      ruta: back
    }, back);
  }

  try {
    const r = await db.query(
      `DELETE FROM EquipoTemporada
       WHERE id_equipo_temporada=? AND id_temporada=? AND id_categoria=?`,
      [id, temporadaId, categoriaId]
    );

    if (!r.affectedRows) {
      if (wantsJSON(req)) return res.status(404).json({ error: 'no encontrado' });
      return res.flash({
        alertTitle: 'No encontrado',
        alertMessage: 'El equipo no existe o no es de tu categoría.',
        alertIcon: 'error',
        showConfirmButton: true,
        timer: null,
        ruta: back
      }, back);
    }

    if (wantsJSON(req)) return res.json({ ok: true });
    return res.flash({
      alertTitle: 'Eliminado',
      alertMessage: 'Equipo eliminado.',
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
      alertMessage: 'No se pudo eliminar el equipo.',
      alertIcon: 'error',
      showConfirmButton: true,
      timer: null,
      ruta: back
    }, back);
  }
};
