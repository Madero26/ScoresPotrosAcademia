// controllersCoord/estadisticasRendimientoMensualCoordController.js
const db = require('../utils/db');

const wantsJSON = req =>
  !!(req.xhr ||
     req.get('x-requested-with') === 'XMLHttpRequest' ||
     req.is('application/json'));

const backCrear = '/adminCoordinador/CoordRegistrarRendimiento';
const backGest  = '/adminCoordinador/CoordGestionarRendimiento';

// temporada / categoría desde JWT / sesión
function getScope(req) {
  const temporadaId = Number(req.auth && req.auth.temporadaId) || 0;
  const categoriaId = Number(req.auth && req.auth.categoriaId) || 0;
  return { temporadaId, categoriaId };
}

/* ===== Formularios ===== */

exports.formCrear = async (req, res) => {
  const { temporadaId, categoriaId } = getScope(req);

  if (!temporadaId || !categoriaId) {
    return res.render('Coordinacion/Coordinador/Crear/CoordRegistrarRendimiento', {
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

  res.render('Coordinacion/Coordinador/Crear/CoordRegistrarRendimiento', {
    ...res.locals,
    sinAsignacion: false,
    temporada,
    categoria
  });
};

exports.formActualizar = async (req, res) => {
  const { temporadaId, categoriaId } = getScope(req);

  if (!temporadaId || !categoriaId) {
    return res.render('Coordinacion/Coordinador/Gestionar/CoordActualizarRendimiento', {
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

  res.render('Coordinacion/Coordinador/Gestionar/CoordActualizarRendimiento', {
    ...res.locals,
    sinAsignacion: false,
    temporada,
    categoria
  });
};

/* ===== Filtros ===== */

// Equipos solo de la temporada / categoría del coordinador
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

// Jugadores filtrados por equipo (opcional) pero siempre de su temp/cat
exports.jugadoresFiltro = async (req, res) => {
  const { temporadaId, categoriaId } = getScope(req);
  const { id_equipo_temporada } = req.query;

  if (!temporadaId || !categoriaId) return res.json([]);

  // Si se especifica equipo, usamos el plantel de ese equipo (vigente)
  if (Number(id_equipo_temporada)) {
    const r = await db.query(`
      SELECT DISTINCT j.id_jugador,
             CONCAT(j.apellido_paterno,' ',j.apellido_materno,', ',j.nombres) AS nombre
      FROM Jugadores j
      JOIN JugadorEquipoTemporada jet ON jet.id_jugador = j.id_jugador
      JOIN EquipoTemporada et        ON et.id_equipo_temporada = jet.id_equipo_temporada
      WHERE jet.id_equipo_temporada = ?
        AND et.id_temporada = ?
        AND et.id_categoria = ?
        AND j.activo = 1
        AND (jet.fecha_baja IS NULL OR jet.fecha_baja > CURDATE())
      ORDER BY nombre
    `, [Number(id_equipo_temporada), temporadaId, categoriaId]);
    return res.json(r);
  }

  // Sin equipo: todos los jugadores de esa temporada/categoría
  const r = await db.query(`
    SELECT DISTINCT j.id_jugador,
           CONCAT(j.apellido_paterno,' ',j.apellido_materno,', ',j.nombres) AS nombre
    FROM Jugadores j
    JOIN JugadorTemporadaCategoria jtc ON jtc.id_jugador = j.id_jugador
    WHERE jtc.id_temporada = ?
      AND jtc.id_categoria = ?
      AND j.activo = 1
    ORDER BY nombre
  `, [temporadaId, categoriaId]);

  res.json(r);
};

// Fechas de rendimiento de un jugador de su temporada
exports.fechasPorJugador = async (req, res) => {
  const { temporadaId } = getScope(req);
  const { id_jugador } = req.query;
  if (!temporadaId || !Number(id_jugador)) return res.json([]);

  const r = await db.query(`
    SELECT id_estadistica,
           DATE_FORMAT(fecha_medicion,'%Y-%m-%d') AS fecha_medicion
    FROM EstadisticasRendimientoMensual
    WHERE id_temporada = ? AND id_jugador = ?
    ORDER BY fecha_medicion DESC
  `, [temporadaId, Number(id_jugador)]);

  res.json(r);
};

// Obtener un registro concreto (validando que sea de su temporada)
exports.obtener = async (req, res) => {
  const { temporadaId } = getScope(req);
  const { id } = req.params;

  const r = await db.query(`
    SELECT id_estadistica, id_temporada, id_jugador,
           DATE_FORMAT(fecha_medicion,'%Y-%m-%d') AS fecha_medicion,
           tiempo_carrera_seg, vel_lanzamiento_mph, potencia_brazo_mph,
           pop_time_seg, vel_bate_mph
    FROM EstadisticasRendimientoMensual
    WHERE id_estadistica=? LIMIT 1
  `,[id]);

  if (!r.length || r[0].id_temporada !== temporadaId)
    return res.status(404).json({ error:'no encontrado' });

  res.json(r[0]);
};

/* ===== CRUD ===== */

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
    const {
      id_jugador,
      fecha_medicion,
      tiempo_carrera_seg = 0,
      vel_lanzamiento_mph = 0,
      potencia_brazo_mph = 0,
      pop_time_seg = 0,
      vel_bate_mph = 0
    } = req.body;

    const ok = Number(id_jugador) > 0 &&
               /^\d{4}-\d{2}-\d{2}$/.test(String(fecha_medicion || ''));
    if (!ok) {
      if (wantsJSON(req)) return res.status(400).json({ error:'faltan o inválidos' });
      return res.flash({
        alertTitle:'Datos inválidos',
        alertMessage:'Jugador y fecha de medición son obligatorios.',
        alertIcon:'warning',
        showConfirmButton:true,
        timer:null,
        ruta:backCrear
      }, backCrear);
    }

    // validar que el jugador pertenece a la temp/cat del coordinador
    const vcat = await db.query(`
      SELECT 1
      FROM JugadorTemporadaCategoria
      WHERE id_jugador=? AND id_temporada=? AND id_categoria=? LIMIT 1
    `,[id_jugador, temporadaId, categoriaId]);
    if (!vcat.length) {
      const msg = 'El jugador no pertenece a tu categoría en esta temporada.';
      if (wantsJSON(req)) return res.status(400).json({ error: msg });
      return res.flash({
        alertTitle:'Inválido',
        alertMessage:msg,
        alertIcon:'warning',
        showConfirmButton:true,
        timer:null,
        ruta:backCrear
      }, backCrear);
    }

    await db.query(`
      INSERT INTO EstadisticasRendimientoMensual
      (id_temporada,id_jugador,fecha_medicion,
       tiempo_carrera_seg,vel_lanzamiento_mph,potencia_brazo_mph,
       pop_time_seg,vel_bate_mph)
      VALUES (?,?,?,?,?,?,?,?)
    `,[
      temporadaId, id_jugador, fecha_medicion,
      tiempo_carrera_seg, vel_lanzamiento_mph, potencia_brazo_mph,
      pop_time_seg, vel_bate_mph
    ]);

    if (wantsJSON(req)) return res.json({ ok:true });
    return res.flash({
      alertTitle:'Listo',
      alertMessage:'Rendimiento registrado.',
      alertIcon:'success',
      showConfirmButton:false,
      timer:1200,
      ruta:backCrear
    }, backCrear);

  } catch (e) {
    console.error(e);
    if (wantsJSON(req)) return res.status(500).json({ error:'error' });
    return res.flash({
      alertTitle:'Error',
      alertMessage:'No se pudo registrar el rendimiento.',
      alertIcon:'error',
      showConfirmButton:true,
      timer:null,
      ruta:backCrear
    }, backCrear);
  }
};

exports.actualizar = async (req, res) => {
  const { temporadaId, categoriaId } = getScope(req);
  const { id } = req.params;
  const back = backGest;

  if (!temporadaId || !categoriaId) {
    if (wantsJSON(req)) return res.status(400).json({ error:'sin_asignacion' });
    return res.flash({
      alertTitle:'Sin categoría',
      alertMessage:'Tu usuario no tiene temporada/categoría asignadas.',
      alertIcon:'warning',
      showConfirmButton:true,
      timer:null,
      ruta:back
    }, back);
  }

  try {
    const {
      id_jugador,
      fecha_medicion,
      tiempo_carrera_seg = 0,
      vel_lanzamiento_mph = 0,
      potencia_brazo_mph = 0,
      pop_time_seg = 0,
      vel_bate_mph = 0
    } = req.body;

    const ok = Number(id_jugador) > 0 &&
               /^\d{4}-\d{2}-\d{2}$/.test(String(fecha_medicion || ''));
    if (!ok) {
      if (wantsJSON(req)) return res.status(400).json({ error:'faltan o inválidos' });
      return res.flash({
        alertTitle:'Datos inválidos',
        alertMessage:'Jugador y fecha de medición son obligatorios.',
        alertIcon:'warning',
        showConfirmButton:true,
        timer:null,
        ruta:back
      }, back);
    }

    // verificar que el registro sea de la temporada del coordinador
    const cur = await db.query(`
      SELECT id_temporada, id_jugador
      FROM EstadisticasRendimientoMensual
      WHERE id_estadistica=? LIMIT 1
    `,[id]);
    if (!cur.length || cur[0].id_temporada !== temporadaId) {
      if (wantsJSON(req)) return res.status(404).json({ error:'no encontrado' });
      return res.flash({
        alertTitle:'No encontrado',
        alertMessage:'El registro no existe o no pertenece a tu temporada.',
        alertIcon:'error',
        showConfirmButton:true,
        timer:null,
        ruta:back
      }, back);
    }

    // validar que el jugador (nuevo) pertenece a temp/cat
    const vcat = await db.query(`
      SELECT 1
      FROM JugadorTemporadaCategoria
      WHERE id_jugador=? AND id_temporada=? AND id_categoria=? LIMIT 1
    `,[id_jugador, temporadaId, categoriaId]);
    if (!vcat.length) {
      const msg = 'El jugador no pertenece a tu categoría en esta temporada.';
      if (wantsJSON(req)) return res.status(400).json({ error: msg });
      return res.flash({
        alertTitle:'Inválido',
        alertMessage:msg,
        alertIcon:'warning',
        showConfirmButton:true,
        timer:null,
        ruta:back
      }, back);
    }

    const r = await db.query(`
      UPDATE EstadisticasRendimientoMensual
      SET id_temporada=?, id_jugador=?, fecha_medicion=?,
          tiempo_carrera_seg=?, vel_lanzamiento_mph=?,
          potencia_brazo_mph=?, pop_time_seg=?, vel_bate_mph=?
      WHERE id_estadistica=?
    `,[
      temporadaId, id_jugador, fecha_medicion,
      tiempo_carrera_seg, vel_lanzamiento_mph,
      potencia_brazo_mph, pop_time_seg, vel_bate_mph,
      id
    ]);

    if (!r.affectedRows) {
      if (wantsJSON(req)) return res.status(404).json({ error:'no encontrado' });
      return res.flash({
        alertTitle:'No encontrado',
        alertMessage:'El registro no existe.',
        alertIcon:'error',
        showConfirmButton:true,
        timer:null,
        ruta:back
      }, back);
    }

    if (wantsJSON(req)) return res.json({ ok:true });
    return res.flash({
      alertTitle:'Actualizado',
      alertMessage:'Rendimiento actualizado.',
      alertIcon:'success',
      showConfirmButton:false,
      timer:1200,
      ruta:back
    }, back);

  } catch (e) {
    console.error(e);
    if (wantsJSON(req)) return res.status(500).json({ error:'error' });
    return res.flash({
      alertTitle:'Error',
      alertMessage:'No se pudo actualizar el registro.',
      alertIcon:'error',
      showConfirmButton:true,
      timer:null,
      ruta:back
    }, back);
  }
};

exports.eliminar = async (req, res) => {
  const { temporadaId } = getScope(req);
  const { id } = req.params;
  const back = backGest;

  if (!temporadaId) {
    if (wantsJSON(req)) return res.status(400).json({ error:'sin_asignacion' });
    return res.flash({
      alertTitle:'Sin categoría',
      alertMessage:'Tu usuario no tiene temporada/categoría asignadas.',
      alertIcon:'warning',
      showConfirmButton:true,
      timer:null,
      ruta:back
    }, back);
  }

  try {
    const cur = await db.query(`
      SELECT id_temporada
      FROM EstadisticasRendimientoMensual
      WHERE id_estadistica=? LIMIT 1
    `,[id]);

    if (!cur.length || cur[0].id_temporada !== temporadaId) {
      if (wantsJSON(req)) return res.status(404).json({ error:'no encontrado' });
      return res.flash({
        alertTitle:'No encontrado',
        alertMessage:'El registro no existe o no pertenece a tu temporada.',
        alertIcon:'error',
        showConfirmButton:true,
        timer:null,
        ruta:back
      }, back);
    }

    const r = await db.query(
      `DELETE FROM EstadisticasRendimientoMensual WHERE id_estadistica=?`,
      [id]
    );

    if (!r.affectedRows) {
      if (wantsJSON(req)) return res.status(404).json({ error:'no encontrado' });
      return res.flash({
        alertTitle:'No encontrado',
        alertMessage:'El registro no existe.',
        alertIcon:'error',
        showConfirmButton:true,
        timer:null,
        ruta:back
      }, back);
    }

    if (wantsJSON(req)) return res.json({ ok:true });
    return res.flash({
      alertTitle:'Eliminado',
      alertMessage:'Registro eliminado.',
      alertIcon:'success',
      showConfirmButton:false,
      timer:1200,
      ruta:back
    }, back);

  } catch (e) {
    console.error(e);
    if (wantsJSON(req)) return res.status(500).json({ error:'error' });
    return res.flash({
      alertTitle:'Error',
      alertMessage:'No se pudo eliminar el registro.',
      alertIcon:'error',
      showConfirmButton:true,
      timer:null,
      ruta:back
    }, back);
  }
};
