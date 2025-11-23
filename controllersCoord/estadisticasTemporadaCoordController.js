// controllersCoord/estadisticasTemporadaCoordController.js
const db = require('../utils/db');
const wantsJSON = req =>
  !!(req.xhr || req.get('x-requested-with') === 'XMLHttpRequest' || req.is('application/json'));

const backBateo   = '/adminCoordinador/CoordEditarBateoJugador';
const backPitcheo = '/adminCoordinador/CoordEditarPitcheoJugador';
const backEquipo  = '/adminCoordinador/CoordEditarEstadisticaEquipo';

/* ================== FORMULARIOS ================== */

exports.formEditarBateo = async (req, res) => {
  const temporadas = await db.query(
    `SELECT id_temporada, nombre FROM Temporadas ORDER BY fecha_inicio DESC`
  );
  res.render('Coordinacion/Coordinador/Gestionar/CoordEditarBateoJugador', {
    ...res.locals,
    temporadas,
    idCategoria: req.auth.categoriaId
  });
};

exports.formEditarPitcheo = async (req, res) => {
  const temporadas = await db.query(
    `SELECT id_temporada, nombre FROM Temporadas ORDER BY fecha_inicio DESC`
  );
  res.render('Coordinacion/Coordinador/Gestionar/CoordEditarPitcheoJugador', {
    ...res.locals,
    temporadas,
    idCategoria: req.auth.categoriaId
  });
};

exports.formEditarEquipo = async (req, res) => {
  const temporadas = await db.query(
    `SELECT id_temporada, nombre FROM Temporadas ORDER BY fecha_inicio DESC`
  );
  res.render('Coordinacion/Coordinador/Gestionar/CoordEditarEstadisticaEquipo', {
    ...res.locals,
    temporadas,
    idCategoria: req.auth.categoriaId
  });
};

/* ================== FILTROS PARA LOS EJS ================== */

// Categorías de la temporada, restringidas a la categoría del coordinador
exports.categoriasPorTemporada = async (req, res) => {
  const { id_temporada } = req.query;
  const idCatCoord = req.auth.categoriaId;   // viene del token del coordinador
  if (!Number(id_temporada) || !Number(idCatCoord)) return res.json([]);

  const r = await db.query(
    `SELECT c.id_categoria, c.nombre_categoria AS nombre
     FROM CategoriaTemporadaRango ctr
     JOIN Categorias c ON c.id_categoria=ctr.id_categoria
     WHERE ctr.id_temporada=? AND c.id_categoria=?
     ORDER BY c.edad_min, c.nombre_categoria`,
    [Number(id_temporada), Number(idCatCoord)]
  );
  res.json(r);
};

// Equipos por temporada y categoría (ya está limitada por el select de categoría)
exports.equiposPorTempCat = async (req, res) => {
  const { id_temporada, id_categoria } = req.query;
  const idCatCoord = req.auth.categoriaId;
  if (!Number(id_temporada)) return res.json([]);

  // Forzamos categoría a la del coordinador
  const idCat = Number(id_categoria) || Number(idCatCoord);
  if (!idCat) return res.json([]);

  const r = await db.query(
    `SELECT id_equipo_temporada, nombre
     FROM EquipoTemporada
     WHERE id_temporada=? AND id_categoria=?
     ORDER BY nombre`,
    [Number(id_temporada), idCat]
  );
  res.json(r);
};

// Plantel de un equipo, sólo jugadores activos y con inscripción vigente
exports.plantelEquipo = async (req, res) => {
  const { id_equipo_temporada } = req.query;
  if (!Number(id_equipo_temporada)) return res.json([]);

  const r = await db.query(`
    SELECT DISTINCT 
        j.id_jugador,
        j.apellido_paterno,
        j.apellido_materno,
        j.nombres,
        CONCAT(j.apellido_paterno,' ',j.apellido_materno,', ',j.nombres) AS nombre
    FROM JugadorEquipoTemporada jet
    JOIN Jugadores j ON j.id_jugador = jet.id_jugador
    WHERE jet.id_equipo_temporada = ?
      AND j.activo = 1
      AND (jet.fecha_baja IS NULL OR jet.fecha_baja > CURDATE())
    ORDER BY j.apellido_paterno, j.apellido_materno, j.nombres
  `, [Number(id_equipo_temporada)]);

  res.json(r);
};


// Bateo del jugador en la temporada
exports.bateoJugador = async (req, res) => {
  const { id_temporada, id_jugador } = req.query;
  if (!(Number(id_temporada) && Number(id_jugador))) return res.json(null);

  const r = await db.query(
    `SELECT *
     FROM EstadisticasBateoTemporada
     WHERE id_temporada=? AND id_jugador=?
     LIMIT 1`,
    [Number(id_temporada), Number(id_jugador)]
  );
  res.json(r[0] || null);
};

// Pitcheo del jugador en la temporada
exports.pitcheoJugador = async (req, res) => {
  const { id_temporada, id_jugador } = req.query;
  if (!(Number(id_temporada) && Number(id_jugador))) return res.json(null);

  const r = await db.query(
    `SELECT *
     FROM EstadisticasPitcheoTemporada
     WHERE id_temporada=? AND id_jugador=?
     LIMIT 1`,
    [Number(id_temporada), Number(id_jugador)]
  );
  res.json(r[0] || null);
};

// Estadísticas del equipo
exports.estadisticasEquipo = async (req, res) => {
  const { id_temporada, id_equipo_temporada } = req.query;
  if (!(Number(id_temporada) && Number(id_equipo_temporada))) return res.json(null);

  const r = await db.query(
    `SELECT *
     FROM EstadisticasEquipoTemporada
     WHERE id_temporada=? AND id_equipo_temporada=?
     LIMIT 1`,
    [Number(id_temporada), Number(id_equipo_temporada)]
  );
  res.json(r[0] || null);
};

/* ============ HELPERS DE VALIDACIÓN ============ */

async function validarEquipoEnTemporadaYCategoria(id_equipo_temporada, id_temporada, idCatCoord){
  const r = await db.query(
    `SELECT id_categoria
     FROM EquipoTemporada
     WHERE id_equipo_temporada=? AND id_temporada=? AND id_categoria=?
     LIMIT 1`,
    [id_equipo_temporada, id_temporada, idCatCoord]
  );
  return r[0] || null;
}

async function validarJugadorEnEquipoTemporada(id_jugador, id_equipo_temporada, id_temporada){
  const r = await db.query(
    `SELECT 1
     FROM JugadorEquipoTemporada jet
     JOIN EquipoTemporada et ON et.id_equipo_temporada=jet.id_equipo_temporada
     WHERE jet.id_jugador=?
       AND jet.id_equipo_temporada=?
       AND et.id_temporada=?
       AND (jet.fecha_baja IS NULL OR jet.fecha_baja>CURDATE())
     LIMIT 1`,
    [id_jugador, id_equipo_temporada, id_temporada]
  );
  return r.length>0;
}

/* ================== CRUD BATEO ================== */

exports.editarBateoJugador = async (req, res) => {
  const {
    id_temporada,
    id_equipo_temporada,
    id_jugador,
    apariciones_al_bat=0,
    hits=0,
    bases_por_bolas=0,
    carreras=0,
    carreras_producidas=0,
    sencillos=0,
    dobles=0,
    triples=0,
    home_runs=0,
    bases_robadas=0
  } = req.body;

  const temp = Number(id_temporada) || 0;
  const eq   = Number(id_equipo_temporada) || 0;
  const jug  = Number(id_jugador) || 0;
  const idCatCoord = req.auth.categoriaId;

  const ok = temp>0 && eq>0 && jug>0;
  if (!ok){
    if (wantsJSON(req)) return res.status(400).json({error:'faltan o inválidos'});
    return res.flash({
      alertTitle:'Datos inválidos',
      alertMessage:'Temporada, equipo y jugador son obligatorios.',
      alertIcon:'warning', showConfirmButton:true, timer:null, ruta:backBateo
    }, backBateo);
  }

  try{
    const equipo = await validarEquipoEnTemporadaYCategoria(eq, temp, idCatCoord);
    if (!equipo){
      const msg='El equipo no pertenece a tu categoría en esta temporada.';
      if (wantsJSON(req)) return res.status(400).json({error:msg});
      return res.flash({
        alertTitle:'Inválido', alertMessage:msg,
        alertIcon:'warning', showConfirmButton:true, timer:null, ruta:backBateo
      }, backBateo);
    }

    const pertenece = await validarJugadorEnEquipoTemporada(jug, eq, temp);
    if (!pertenece){
      const msg='El jugador no está inscrito en ese equipo para esta temporada.';
      if (wantsJSON(req)) return res.status(400).json({error:msg});
      return res.flash({
        alertTitle:'Inválido', alertMessage:msg,
        alertIcon:'warning', showConfirmButton:true, timer:null, ruta:backBateo
      }, backBateo);
    }

    const exist = await db.query(
      `SELECT id_estadistica
       FROM EstadisticasBateoTemporada
       WHERE id_temporada=? AND id_jugador=?`,
      [temp, jug]
    );

    if (exist.length){
      await db.query(
        `UPDATE EstadisticasBateoTemporada
         SET id_equipo_temporada=?, apariciones_al_bat=?, hits=?, bases_por_bolas=?,
             carreras=?, carreras_producidas=?, sencillos=?, dobles=?, triples=?, home_runs=?, bases_robadas=?
         WHERE id_estadistica=?`,
        [eq,apariciones_al_bat,hits,bases_por_bolas,carreras,carreras_producidas,
         sencillos,dobles,triples,home_runs,bases_robadas, exist[0].id_estadistica]
      );
      if (wantsJSON(req)) return res.json({ok:true, id:exist[0].id_estadistica});
    } else {
      const r = await db.query(
        `INSERT INTO EstadisticasBateoTemporada
          (id_temporada,id_jugador,id_equipo_temporada,
           apariciones_al_bat,hits,bases_por_bolas,carreras,carreras_producidas,
           sencillos,dobles,triples,home_runs,bases_robadas)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [temp,jug,eq,apariciones_al_bat,hits,bases_por_bolas,carreras,
         carreras_producidas,sencillos,dobles,triples,home_runs,bases_robadas]
      );
      if (wantsJSON(req)) return res.json({ok:true, id:r.insertId});
    }

    return res.flash({
      alertTitle:'Actualizado',
      alertMessage:'Estadísticas de bateo actualizadas.',
      alertIcon:'success', showConfirmButton:false, timer:1200, ruta:backBateo
    }, backBateo);
  }catch(e){
    console.error(e);
    if (wantsJSON(req)) return res.status(500).json({error:'error'});
    return res.flash({
      alertTitle:'Error',
      alertMessage:'No se pudieron actualizar las estadísticas.',
      alertIcon:'error', showConfirmButton:true, timer:null, ruta:backBateo
    }, backBateo);
  }
};

/* ================== CRUD PITCHEO ================== */

exports.editarPitcheoJugador = async (req, res) => {
  const {
    id_temporada,
    id_equipo_temporada,
    id_jugador,
    bases_por_bolas=0,
    victorias=0,
    derrotas=0,
    entradas_lanzadas=0.0,
    carreras_limpias=0,
    ponches=0
  } = req.body;

  const temp = Number(id_temporada) || 0;
  const eq   = Number(id_equipo_temporada) || 0;
  const jug  = Number(id_jugador) || 0;
  const idCatCoord = req.auth.categoriaId;

  const ok = temp>0 && eq>0 && jug>0;
  if (!ok){
    if (wantsJSON(req)) return res.status(400).json({error:'faltan o inválidos'});
    return res.flash({
      alertTitle:'Datos inválidos',
      alertMessage:'Temporada, equipo y jugador son obligatorios.',
      alertIcon:'warning', showConfirmButton:true, timer:null, ruta:backPitcheo
    }, backPitcheo);
  }

  try{
    const equipo = await validarEquipoEnTemporadaYCategoria(eq, temp, idCatCoord);
    if (!equipo){
      const msg='El equipo no pertenece a tu categoría en esta temporada.';
      if (wantsJSON(req)) return res.status(400).json({error:msg});
      return res.flash({
        alertTitle:'Inválido',
        alertMessage:msg,
        alertIcon:'warning', showConfirmButton:true, timer:null, ruta:backPitcheo
      }, backPitcheo);
    }

    const pertenece = await validarJugadorEnEquipoTemporada(jug, eq, temp);
    if (!pertenece){
      const msg='El jugador no está inscrito en ese equipo para esta temporada.';
      if (wantsJSON(req)) return res.status(400).json({error:msg});
      return res.flash({
        alertTitle:'Inválido',
        alertMessage:msg,
        alertIcon:'warning', showConfirmButton:true, timer:null, ruta:backPitcheo
      }, backPitcheo);
    }

    const exist = await db.query(
      `SELECT id_estadistica
       FROM EstadisticasPitcheoTemporada
       WHERE id_temporada=? AND id_jugador=?`,
      [temp, jug]
    );

    if (exist.length){
      await db.query(
        `UPDATE EstadisticasPitcheoTemporada
         SET id_equipo_temporada=?, bases_por_bolas=?, victorias=?, derrotas=?,
             entradas_lanzadas=?, carreras_limpias=?, ponches=?
         WHERE id_estadistica=?`,
        [eq,bases_por_bolas,victorias,derrotas,entradas_lanzadas,carreras_limpias,ponches,
         exist[0].id_estadistica]
      );
      if (wantsJSON(req)) return res.json({ok:true, id:exist[0].id_estadistica});
    }else{
      const r = await db.query(
        `INSERT INTO EstadisticasPitcheoTemporada
          (id_temporada,id_jugador,id_equipo_temporada,
           bases_por_bolas,victorias,derrotas,entradas_lanzadas,carreras_limpias,ponches)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [temp,jug,eq,bases_por_bolas,victorias,derrotas,entradas_lanzadas,carreras_limpias,ponches]
      );
      if (wantsJSON(req)) return res.json({ok:true, id:r.insertId});
    }

    return res.flash({
      alertTitle:'Actualizado',
      alertMessage:'Estadísticas de pitcheo actualizadas.',
      alertIcon:'success', showConfirmButton:false, timer:1200, ruta:backPitcheo
    }, backPitcheo);
  }catch(e){
    console.error(e);
    if (wantsJSON(req)) return res.status(500).json({error:'error'});
    return res.flash({
      alertTitle:'Error',
      alertMessage:'No se pudieron actualizar las estadísticas.',
      alertIcon:'error', showConfirmButton:true, timer:null, ruta:backPitcheo
    }, backPitcheo);
  }
};

/* ================== CRUD ESTADÍSTICAS DE EQUIPO ================== */

exports.editarEstadisticaEquipo = async (req, res) => {
  const {
    id_temporada,
    id_equipo_temporada,
    carreras_en_contra=0,
    carreras_a_favor=0,
    ganados=0,
    perdidos=0,
    empatados=0,
    errores=0
  } = req.body;

  const temp = Number(id_temporada) || 0;
  const eq   = Number(id_equipo_temporada) || 0;
  const idCatCoord = req.auth.categoriaId;

  if (!(temp && eq)){
    if (wantsJSON(req)) return res.status(400).json({error:'faltan claves'});
    return res.flash({
      alertTitle:'Datos inválidos',
      alertMessage:'Temporada y equipo son obligatorios.',
      alertIcon:'warning', showConfirmButton:true, timer:null, ruta:backEquipo
    }, backEquipo);
  }

  try{
    const equipo = await validarEquipoEnTemporadaYCategoria(eq, temp, idCatCoord);
    if (!equipo){
      const msg='El equipo no pertenece a tu categoría en esta temporada.';
      if (wantsJSON(req)) return res.status(400).json({error:msg});
      return res.flash({
        alertTitle:'Inválido',
        alertMessage:msg,
        alertIcon:'warning', showConfirmButton:true, timer:null, ruta:backEquipo
      }, backEquipo);
    }

    const e = await db.query(
      `SELECT id_estadistica
       FROM EstadisticasEquipoTemporada
       WHERE id_temporada=? AND id_equipo_temporada=?`,
      [temp, eq]
    );

    if (e.length){
      await db.query(
        `UPDATE EstadisticasEquipoTemporada
         SET carreras_en_contra=?, carreras_a_favor=?, ganados=?, perdidos=?, empatados=?, errores=?
         WHERE id_estadistica=?`,
        [carreras_en_contra,carreras_a_favor,ganados,perdidos,empatados,errores, e[0].id_estadistica]
      );
      if (wantsJSON(req)) return res.json({ok:true,id:e[0].id_estadistica});
    }else{
      const r = await db.query(
        `INSERT INTO EstadisticasEquipoTemporada
          (id_temporada,id_equipo_temporada,carreras_en_contra,carreras_a_favor,ganados,perdidos,empatados,errores)
         VALUES (?,?,?,?,?,?,?,?)`,
        [temp,eq,carreras_en_contra,carreras_a_favor,ganados,perdidos,empatados,errores]
      );
      if (wantsJSON(req)) return res.json({ok:true,id:r.insertId});
    }

    return res.flash({
      alertTitle:'Actualizado',
      alertMessage:'Estadísticas del equipo actualizadas.',
      alertIcon:'success', showConfirmButton:false, timer:1200, ruta:backEquipo
    }, backEquipo);
  }catch(e){
    console.error(e);
    if (wantsJSON(req)) return res.status(500).json({error:'error'});
    return res.flash({
      alertTitle:'Error',
      alertMessage:'No se pudieron actualizar las estadísticas del equipo.',
      alertIcon:'error', showConfirmButton:true, timer:null, ruta:backEquipo
    }, backEquipo);
  }
};
