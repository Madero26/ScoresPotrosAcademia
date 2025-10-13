const db = require('../utils/db');
const wantsJSON = req => !!(req.xhr || req.get('x-requested-with') === 'XMLHttpRequest' || req.is('application/json'));
const backCrear = '/adminGeneral/CoordRegistrarRendimiento';
const backAct = id => '/adminGeneral/formActualizarEstadisticasRendimiento' + (id?`?id=${id}`:'');

/* ===== Formularios ===== */
exports.formCrear = async (_req, res) => {
  const temporadas = await db.query(`SELECT id_temporada, nombre FROM Temporadas ORDER BY fecha_inicio DESC`);
  res.render('Coordinacion/General/Crear/formCrearRendimiento', { ...res.locals, temporadas });
};

exports.formActualizar = async (_req, res) => {
  const temporadas = await db.query(`SELECT id_temporada, nombre FROM Temporadas ORDER BY fecha_inicio DESC`);
  res.render('Coordinacion/General/Actualizar/formActualizarRendimiento', { ...res.locals, temporadas });
};

/* ===== CRUD ===== */
exports.obtener = async (req, res) => {
  const r = await db.query(
    `SELECT id_estadistica, id_temporada, id_jugador,
            DATE_FORMAT(fecha_medicion,'%Y-%m-%d') AS fecha_medicion,
            tiempo_carrera_seg, vel_lanzamiento_mph, potencia_brazo_mph,
            pop_time_seg, vel_bate_mph
     FROM EstadisticasRendimientoMensual WHERE id_estadistica=? LIMIT 1`, [req.params.id]);
  if (!r.length) return res.status(404).json({ error:'no encontrado' });
  res.json(r[0]);
};

exports.crear = async (req, res) => {
  try {
    const { id_temporada, id_jugador, fecha_medicion,
      tiempo_carrera_seg=0, vel_lanzamiento_mph=0, potencia_brazo_mph=0, pop_time_seg=0, vel_bate_mph=0 } = req.body;

    const ok = Number(id_temporada)>0 && Number(id_jugador)>0 && /^\d{4}-\d{2}-\d{2}$/.test(String(fecha_medicion||''));
    if (!ok) return wantsJSON(req) ? res.status(400).json({error:'faltan o inválidos'})
      : res.flash({alertTitle:'Datos inválidos',alertMessage:'Temporada, jugador y fecha son obligatorios.',
                   alertIcon:'warning',showConfirmButton:true,timer:null,ruta:backCrear}, backCrear);

    await db.query(
      `INSERT INTO EstadisticasRendimientoMensual
       (id_temporada,id_jugador,fecha_medicion,tiempo_carrera_seg,vel_lanzamiento_mph,potencia_brazo_mph,pop_time_seg,vel_bate_mph)
       VALUES (?,?,?,?,?,?,?,?)`,
      [id_temporada,id_jugador,fecha_medicion,tiempo_carrera_seg,vel_lanzamiento_mph,potencia_brazo_mph,pop_time_seg,vel_bate_mph]);

    return wantsJSON(req) ? res.json({ok:true})
      : res.flash({alertTitle:'Listo',alertMessage:'Registro creado.',alertIcon:'success',showConfirmButton:false,timer:1200,ruta:backCrear}, backCrear);
  } catch(e){ console.error(e); return wantsJSON(req)?res.status(500).json({error:'error'})
      : res.flash({alertTitle:'Error',alertMessage:'No se pudo crear.',alertIcon:'error',showConfirmButton:true,timer:null,ruta:backCrear}, backCrear); }
};

exports.actualizar = async (req, res) => {
  const { id } = req.params; const back = backAct(id);
  try {
    const { id_temporada, id_jugador, fecha_medicion,
      tiempo_carrera_seg=0, vel_lanzamiento_mph=0, potencia_brazo_mph=0, pop_time_seg=0, vel_bate_mph=0 } = req.body;

    const ok = Number(id_temporada)>0 && Number(id_jugador)>0 && /^\d{4}-\d{2}-\d{2}$/.test(String(fecha_medicion||''));
    if (!ok) return wantsJSON(req)?res.status(400).json({error:'faltan o inválidos'})
      : res.flash({alertTitle:'Datos inválidos',alertMessage:'Temporada, jugador y fecha son obligatorios.',
                   alertIcon:'warning',showConfirmButton:true,timer:null,ruta:back}, back);

    const r = await db.query(
      `UPDATE EstadisticasRendimientoMensual
       SET id_temporada=?, id_jugador=?, fecha_medicion=?,
           tiempo_carrera_seg=?, vel_lanzamiento_mph=?, potencia_brazo_mph=?, pop_time_seg=?, vel_bate_mph=?
       WHERE id_estadistica=?`,
      [id_temporada,id_jugador,fecha_medicion,tiempo_carrera_seg,vel_lanzamiento_mph,potencia_brazo_mph,pop_time_seg,vel_bate_mph,id]);

    if (!r.affectedRows) return wantsJSON(req)?res.status(404).json({error:'no encontrado'})
      : res.flash({alertTitle:'No encontrado',alertMessage:'El registro no existe.',alertIcon:'error',showConfirmButton:true,timer:null,ruta:back}, back);

    return wantsJSON(req)?res.json({ok:true})
      : res.flash({alertTitle:'Actualizado',alertMessage:'Registro actualizado.',alertIcon:'success',showConfirmButton:false,timer:1200,ruta:back}, back);
  } catch(e){ console.error(e); return wantsJSON(req)?res.status(500).json({error:'error'})
      : res.flash({alertTitle:'Error',alertMessage:'Ocurrió un error.',alertIcon:'error',showConfirmButton:true,timer:null,ruta:back}, back); }
};

exports.eliminar = async (req, res) => {
  const back = '/adminGeneral/formActualizarEstadisticasRendimiento';
  try{
    const r = await db.query(`DELETE FROM EstadisticasRendimientoMensual WHERE id_estadistica=?`, [req.params.id]);
    if (!r.affectedRows) return wantsJSON(req)?res.status(404).json({error:'no encontrado'})
      : res.flash({alertTitle:'No encontrado',alertMessage:'El registro no existe.',alertIcon:'error',showConfirmButton:true,timer:null,ruta:back}, back);
    return wantsJSON(req)?res.json({ok:true})
      : res.flash({alertTitle:'Eliminado',alertMessage:'Registro eliminado.',alertIcon:'success',showConfirmButton:false,timer:1200,ruta:back}, back);
  }catch(e){ console.error(e); return wantsJSON(req)?res.status(500).json({error:'error'})
      : res.flash({alertTitle:'Error',alertMessage:'No se pudo eliminar.',alertIcon:'error',showConfirmButton:true,timer:null,ruta:back}, back); }
};

/* ===== Filtros (cascada, usa SOLO tablas de vínculo) ===== */
exports.categoriasPorTemporada = async (req, res) => {
  const { id_temporada } = req.query;
  if (!Number(id_temporada)) return res.json([]);
  const r = await db.query(`
    SELECT c.id_categoria, c.nombre_categoria AS nombre
    FROM CategoriaTemporadaRango ctr
    JOIN Categorias c ON c.id_categoria = ctr.id_categoria
    WHERE ctr.id_temporada = ?
    ORDER BY c.edad_min, c.nombre_categoria
  `, [Number(id_temporada)]);
  res.json(r);
};


exports.equiposPorTempCat = async (req, res) => {
  const { id_temporada, id_categoria } = req.query;
  if (!Number(id_temporada)) return res.json([]);
  const params = [Number(id_temporada)];
  let where = `et.id_temporada = ?`;
  if (Number(id_categoria)) { where += ` AND et.id_categoria = ?`; params.push(Number(id_categoria)); }

  const r = await db.query(`
    SELECT et.id_equipo_temporada, et.nombre
    FROM EquipoTemporada et
    WHERE ${where}
    ORDER BY et.nombre
  `, params);
  res.json(r);
};


// controllers/estadisticasRendimientoMensualController.js
exports.jugadoresFiltro = async (req, res) => {
  const { id_temporada, id_categoria, id_equipo_temporada } = req.query;

  // Si hay equipo, alcanza con validar el plantel de ese equipo (vigente)
  if (Number(id_equipo_temporada)) {
    const r = await db.query(`
      SELECT DISTINCT j.id_jugador,
             CONCAT(j.nombres,' ',j.apellido_paterno,' ',j.apellido_materno) AS nombre
      FROM Jugadores j
      JOIN JugadorEquipoTemporada jet ON jet.id_jugador = j.id_jugador
      WHERE jet.id_equipo_temporada = ?
        AND j.activo = 1
        AND (jet.fecha_baja IS NULL OR jet.fecha_baja > CURDATE())
      ORDER BY nombre
    `, [id_equipo_temporada]);
    return res.json(r);
  }

  // Si no hay equipo, exigir temporada y luego refinar por categoría si viene
  if (!Number(id_temporada)) return res.json([]);
  const params = [id_temporada];
  let where = `jtc.id_temporada = ?`;
  if (Number(id_categoria)) { where += ` AND jtc.id_categoria = ?`; params.push(id_categoria); }

  const r = await db.query(`
    SELECT DISTINCT j.id_jugador,
           CONCAT(j.nombres,' ',j.apellido_paterno,' ',j.apellido_materno) AS nombre
    FROM Jugadores j
    JOIN JugadorTemporadaCategoria jtc ON jtc.id_jugador = j.id_jugador
    WHERE ${where}
      AND j.activo = 1
    ORDER BY nombre
  `, params);
  res.json(r);
};


exports.fechasPorJugador = async (req, res) => {
  const { id_temporada, id_jugador } = req.query;
  if (!Number(id_temporada) || !Number(id_jugador)) return res.json([]);
  const r = await db.query(`
    SELECT id_estadistica, DATE_FORMAT(fecha_medicion,'%Y-%m-%d') AS fecha_medicion
    FROM EstadisticasRendimientoMensual
    WHERE id_temporada = ? AND id_jugador = ?
    ORDER BY fecha_medicion DESC
  `, [Number(id_temporada), Number(id_jugador)]);
  res.json(r);
};






