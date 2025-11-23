// controllersCoord/inscripcionJugadorEquipoCoordController.js
const db = require('../utils/db');

const wantsJSON = req =>
  !!(req.xhr ||
     req.get('x-requested-with') === 'XMLHttpRequest' ||
     req.is('application/json'));

const backCrear     = '/adminCoordinador/CoordInscribirJugadorEquipo';
const backGestionar = '/adminCoordinador/CoordGestionarInscripcionJugadorEquipo';

// temporada/categoría desde JWT / sesión
function getScope(req) {
  const temporadaId = Number(req.auth && req.auth.temporadaId) || 0;
  const categoriaId = Number(req.auth && req.auth.categoriaId) || 0;
  return { temporadaId, categoriaId };
}

/* ========= Formularios ========= */

exports.formCrear = async (req, res) => {
  const { temporadaId, categoriaId } = getScope(req);

  if (!temporadaId || !categoriaId) {
    return res.render('Coordinacion/Coordinador/Crear/CoordInscribirJugadorEquipo', {
      ...res.locals,
      sinAsignacion: true,
      temporada: null,
      categoria: null
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

  return res.render('Coordinacion/Coordinador/Crear/CoordInscribirJugadorEquipo', {
    ...res.locals,
    sinAsignacion: false,
    temporada,
    categoria
  });
};

exports.formGestionar = async (req, res) => {
  const { temporadaId, categoriaId } = getScope(req);

  if (!temporadaId || !categoriaId) {
    return res.render('Coordinacion/Coordinador/Gestionar/CoordGestionarInscripcionJugadorEquipo', {
      ...res.locals,
      sinAsignacion: true,
      temporada: null,
      categoria: null
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

  return res.render('Coordinacion/Coordinador/Gestionar/CoordGestionarInscripcionJugadorEquipo', {
    ...res.locals,
    sinAsignacion: false,
    temporada,
    categoria
  });
};

/* ========= Filtros / listas ========= */

// Equipos de la temporada y categoría del coordinador
exports.equiposPorCategoria = async (req, res) => {
  const { temporadaId, categoriaId } = getScope(req);
  if (!temporadaId || !categoriaId) return res.json([]);

  const r = await db.query(`
    SELECT id_equipo_temporada, nombre
    FROM   EquipoTemporada
    WHERE  id_temporada=? AND id_categoria=?
    ORDER BY nombre
  `, [temporadaId, categoriaId]);

  res.json(r);
};

// Jugadores asignables: en esa temp/cat y sin equipo en esa temporada
exports.jugadoresAsignables = async (req, res) => {
  const { temporadaId, categoriaId } = getScope(req);
  const q = String(req.query.q || '').trim();
  if (!temporadaId || !categoriaId) return res.json([]);

  const r = await db.query(`
    SELECT j.id_jugador,
           CONCAT(j.apellido_paterno,' ',j.apellido_materno,', ',j.nombres) AS nombre
    FROM JugadorTemporadaCategoria jtc
    JOIN Jugadores j ON j.id_jugador = jtc.id_jugador
    LEFT JOIN (
      SELECT DISTINCT jet.id_jugador
      FROM JugadorEquipoTemporada jet
      JOIN EquipoTemporada et ON et.id_equipo_temporada = jet.id_equipo_temporada
      WHERE et.id_temporada = ?
    ) ya ON ya.id_jugador = jtc.id_jugador
    WHERE jtc.id_temporada = ? AND jtc.id_categoria = ? AND ya.id_jugador IS NULL
      AND (
        ? = '' OR
        j.nombres LIKE CONCAT('%',?,'%') OR
        j.apellido_paterno LIKE CONCAT('%',?,'%') OR
        j.apellido_materno LIKE CONCAT('%',?,'%') OR
        CONCAT(j.apellido_paterno,' ',j.apellido_materno,' ',j.nombres) LIKE CONCAT('%',?,'%')
      )
    ORDER BY j.apellido_paterno, j.apellido_materno, j.nombres
    LIMIT 200
  `, [temporadaId, temporadaId, categoriaId, q, q, q, q, q]);

  res.json(r);
};

// Lista de inscripciones del coordinador (para gestionar)
exports.listar = async (req, res) => {
  const { temporadaId, categoriaId } = getScope(req);
  const q = String(req.query.q || '').trim();
  if (!temporadaId || !categoriaId) return res.json([]);

  const params = [temporadaId, categoriaId, q, q, q, q, q];

  const r = await db.query(`
    SELECT jet.id,
           jet.id_jugador,
           jet.id_equipo_temporada,
           DATE_FORMAT(jet.fecha_alta,'%Y-%m-%d') AS fecha_alta,
           DATE_FORMAT(jet.fecha_baja,'%Y-%m-%d') AS fecha_baja,
           et.nombre AS nombre_equipo,
           CONCAT(j.apellido_paterno,' ',j.apellido_materno,', ',j.nombres) AS nombre_jugador
    FROM JugadorEquipoTemporada jet
    JOIN EquipoTemporada et ON et.id_equipo_temporada = jet.id_equipo_temporada
    JOIN Jugadores j        ON j.id_jugador        = jet.id_jugador
    WHERE et.id_temporada = ? AND et.id_categoria = ?
      AND (
        ? = '' OR
        j.nombres LIKE CONCAT('%',?,'%') OR
        j.apellido_paterno LIKE CONCAT('%',?,'%') OR
        j.apellido_materno LIKE CONCAT('%',?,'%') OR
        CONCAT(j.apellido_paterno,' ',j.apellido_materno,' ',j.nombres) LIKE CONCAT('%',?,'%')
      )
    ORDER BY et.nombre, j.apellido_paterno, j.apellido_materno, j.nombres
  `, params);

  res.json(r);
};

// (opcional) obtener una inscripción concreta, por si luego la quieres usar
exports.obtener = async (req, res) => {
  const { temporadaId, categoriaId } = getScope(req);
  const { id } = req.params;

  const r = await db.query(`
    SELECT jet.*,
           DATE_FORMAT(jet.fecha_alta,'%Y-%m-%d') AS f_alta,
           DATE_FORMAT(jet.fecha_baja,'%Y-%m-%d') AS f_baja,
           et.id_temporada, et.id_categoria
    FROM JugadorEquipoTemporada jet
    JOIN EquipoTemporada et ON et.id_equipo_temporada = jet.id_equipo_temporada
    WHERE jet.id=? LIMIT 1
  `,[id]);

  if (!r.length ||
      r[0].id_temporada !== temporadaId ||
      r[0].id_categoria !== categoriaId) {
    return res.status(404).json({ error: 'no encontrado' });
  }

  res.json(r[0]);
};

/* ========= Helpers estadísticas ========= */

async function upsertStats(id_temporada, id_jugador, id_equipo_temporada) {
  await db.query(`
    INSERT INTO EstadisticasBateoTemporada (id_temporada,id_jugador,id_equipo_temporada)
    VALUES (?,?,?)
    ON DUPLICATE KEY UPDATE id_equipo_temporada = VALUES(id_equipo_temporada)
  `,[id_temporada,id_jugador,id_equipo_temporada]);

  await db.query(`
    INSERT INTO EstadisticasPitcheoTemporada (id_temporada,id_jugador,id_equipo_temporada)
    VALUES (?,?,?)
    ON DUPLICATE KEY UPDATE id_equipo_temporada = VALUES(id_equipo_temporada)
  `,[id_temporada,id_jugador,id_equipo_temporada]);
}

/* ========= CREAR ========= */

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
    const { id_jugador, id_equipo_temporada, fecha_alta = null } = req.body;
    const ok = Number(id_jugador) && Number(id_equipo_temporada);

    if (!ok) {
      if (wantsJSON(req)) return res.status(400).json({ error: 'faltan o inválidos' });
      return res.flash({
        alertTitle: 'Datos inválidos',
        alertMessage: 'Jugador y equipo son obligatorios.',
        alertIcon: 'warning',
        showConfirmButton: true,
        timer: null,
        ruta: backCrear
      }, backCrear);
    }

    // jugador pertenece a esa categoría en esa temporada
    const vcat = await db.query(
      `SELECT 1 FROM JugadorTemporadaCategoria
       WHERE id_jugador=? AND id_temporada=? AND id_categoria=? LIMIT 1`,
      [id_jugador, temporadaId, categoriaId]
    );
    if (!vcat.length) {
      const msg = 'El jugador no pertenece a tu categoría en esta temporada.';
      if (wantsJSON(req)) return res.status(400).json({ error: msg });
      return res.flash({
        alertTitle: 'Inválido',
        alertMessage: msg,
        alertIcon: 'warning',
        showConfirmButton: true,
        timer: null,
        ruta: backCrear
      }, backCrear);
    }

    // equipo pertenece a esa temporada/categoría
    const vet = await db.query(
      `SELECT 1 FROM EquipoTemporada
       WHERE id_equipo_temporada=? AND id_temporada=? AND id_categoria=? LIMIT 1`,
      [id_equipo_temporada, temporadaId, categoriaId]
    );
    if (!vet.length) {
      const msg = 'El equipo no pertenece a tu temporada/categoría.';
      if (wantsJSON(req)) return res.status(400).json({ error: msg });
      return res.flash({
        alertTitle: 'Inválido',
        alertMessage: msg,
        alertIcon: 'warning',
        showConfirmButton: true,
        timer: null,
        ruta: backCrear
      }, backCrear);
    }

    // un jugador solo puede estar en 1 equipo en la temporada
    const dup = await db.query(`
      SELECT 1
      FROM JugadorEquipoTemporada jet
      JOIN EquipoTemporada et ON et.id_equipo_temporada = jet.id_equipo_temporada
      WHERE jet.id_jugador=? AND et.id_temporada=? LIMIT 1
    `,[id_jugador, temporadaId]);
    if (dup.length) {
      const msg = 'El jugador ya tiene equipo en esta temporada.';
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

    await db.query(`
      INSERT INTO JugadorEquipoTemporada (id_jugador, id_equipo_temporada, fecha_alta)
      VALUES (?,?,?)
    `,[id_jugador, id_equipo_temporada, fecha_alta || null]);

    await upsertStats(temporadaId, Number(id_jugador), Number(id_equipo_temporada));

    if (wantsJSON(req)) return res.json({ ok: true });
    return res.flash({
      alertTitle: 'Listo',
      alertMessage: 'Jugador inscrito y estadísticas listas.',
      alertIcon: 'success',
      showConfirmButton: false,
      timer: 1200,
      ruta: backCrear
    }, backCrear);

  } catch (e) {
    console.error(e);
    if (wantsJSON(req)) return res.status(500).json({ error: 'error' });
    return res.flash({
      alertTitle: 'Error',
      alertMessage: 'No se pudo inscribir al jugador.',
      alertIcon: 'error',
      showConfirmButton: true,
      timer: null,
      ruta: backCrear
    }, backCrear);
  }
};

/* ========= ACTUALIZAR ========= */

exports.actualizar = async (req, res) => {
  const { temporadaId, categoriaId } = getScope(req);
  const { id } = req.params;
  const back = backGestionar;

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
    const { id_equipo_temporada, fecha_alta = null, fecha_baja = null } = req.body;
    if (!Number(id_equipo_temporada)) {
      if (wantsJSON(req)) return res.status(400).json({ error: 'faltan o inválidos' });
      return res.flash({
        alertTitle: 'Datos inválidos',
        alertMessage: 'Debes seleccionar un equipo.',
        alertIcon: 'warning',
        showConfirmButton: true,
        timer: null,
        ruta: back
      }, back);
    }

    // registro actual + asegurar que sea de su temp/cat
    const cur = await db.query(`
      SELECT jet.id_jugador, et.id_temporada, et.id_categoria
      FROM JugadorEquipoTemporada jet
      JOIN EquipoTemporada et ON et.id_equipo_temporada = jet.id_equipo_temporada
      WHERE jet.id=? LIMIT 1
    `,[id]);

    if (!cur.length ||
        cur[0].id_temporada !== temporadaId ||
        cur[0].id_categoria !== categoriaId) {
      if (wantsJSON(req)) return res.status(404).json({ error: 'no encontrado' });
      return res.flash({
        alertTitle: 'No encontrado',
        alertMessage: 'La inscripción no existe o no es de tu categoría.',
        alertIcon: 'error',
        showConfirmButton: true,
        timer: null,
        ruta: back
      }, back);
    }

    const { id_jugador } = cur[0];

    // equipo destino pertenece a misma temporada/categoría
    const vet = await db.query(
      `SELECT 1 FROM EquipoTemporada
       WHERE id_equipo_temporada=? AND id_temporada=? AND id_categoria=? LIMIT 1`,
      [id_equipo_temporada, temporadaId, categoriaId]
    );
    if (!vet.length) {
      const msg = 'El equipo destino no es de tu temporada/categoría.';
      if (wantsJSON(req)) return res.status(400).json({ error: msg });
      return res.flash({
        alertTitle: 'Inválido',
        alertMessage: msg,
        alertIcon: 'warning',
        showConfirmButton: true,
        timer: null,
        ruta: back
      }, back);
    }

    // regla un equipo por temporada (excluyendo esta inscripción)
    const clash = await db.query(`
      SELECT 1
      FROM JugadorEquipoTemporada jet
      JOIN EquipoTemporada et ON et.id_equipo_temporada = jet.id_equipo_temporada
      WHERE jet.id_jugador=? AND et.id_temporada=? AND jet.id<>? LIMIT 1
    `,[id_jugador, temporadaId, id]);

    if (clash.length) {
      const msg = 'El jugador ya tiene otro equipo en esta temporada.';
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

    const r = await db.query(`
      UPDATE JugadorEquipoTemporada
      SET id_equipo_temporada=?, fecha_alta=?, fecha_baja=?
      WHERE id=?`,
      [id_equipo_temporada, fecha_alta || null, fecha_baja || null, id]
    );

    if (!r.affectedRows) {
      if (wantsJSON(req)) return res.status(404).json({ error: 'no encontrado' });
      return res.flash({
        alertTitle: 'No encontrado',
        alertMessage: 'La inscripción no existe.',
        alertIcon: 'error',
        showConfirmButton: true,
        timer: null,
        ruta: back
      }, back);
    }

    await upsertStats(temporadaId, Number(id_jugador), Number(id_equipo_temporada));

    if (wantsJSON(req)) return res.json({ ok: true });
    return res.flash({
      alertTitle: 'Actualizado',
      alertMessage: 'Inscripción actualizada.',
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
      alertMessage: 'No se pudo actualizar la inscripción.',
      alertIcon: 'error',
      showConfirmButton: true,
      timer: null,
      ruta: back
    }, back);
  }
};

/* ========= ELIMINAR ========= */

exports.eliminar = async (req, res) => {
  const { temporadaId, categoriaId } = getScope(req);
  const { id } = req.params;
  const back = backGestionar;

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
    const cur = await db.query(`
      SELECT jet.id_jugador, et.id_temporada, et.id_categoria
      FROM JugadorEquipoTemporada jet
      JOIN EquipoTemporada et ON et.id_equipo_temporada = jet.id_equipo_temporada
      WHERE jet.id=? LIMIT 1
    `,[id]);

    if (!cur.length ||
        cur[0].id_temporada !== temporadaId ||
        cur[0].id_categoria !== categoriaId) {
      if (wantsJSON(req)) return res.status(404).json({ error: 'no encontrado' });
      return res.flash({
        alertTitle: 'No encontrado',
        alertMessage: 'La inscripción no existe o no es de tu categoría.',
        alertIcon: 'error',
        showConfirmButton: true,
        timer: null,
        ruta: back
      }, back);
    }

    const { id_jugador } = cur[0];

    const r = await db.query(`DELETE FROM JugadorEquipoTemporada WHERE id=?`, [id]);
    if (!r.affectedRows) {
      if (wantsJSON(req)) return res.status(404).json({ error: 'no encontrado' });
      return res.flash({
        alertTitle: 'No encontrado',
        alertMessage: 'La inscripción no existe.',
        alertIcon: 'error',
        showConfirmButton: true,
        timer: null,
        ruta: back
      }, back);
    }

    // borrar stats de esa temporada para el jugador
    await db.query(
      `DELETE FROM EstadisticasBateoTemporada   WHERE id_temporada=? AND id_jugador=?`,
      [temporadaId, id_jugador]
    );
    await db.query(
      `DELETE FROM EstadisticasPitcheoTemporada WHERE id_temporada=? AND id_jugador=?`,
      [temporadaId, id_jugador]
    );

    if (wantsJSON(req)) return res.json({ ok: true });
    return res.flash({
      alertTitle: 'Eliminado',
      alertMessage: 'Inscripción y estadísticas eliminadas.',
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
      alertMessage: 'No se pudo eliminar la inscripción.',
      alertIcon: 'error',
      showConfirmButton: true,
      timer: null,
      ruta: back
    }, back);
  }
};
