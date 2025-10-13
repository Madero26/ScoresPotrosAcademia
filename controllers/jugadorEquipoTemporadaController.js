const db = require('../utils/db');
const wantsJSON = req => !!(req.xhr || req.get('x-requested-with')==='XMLHttpRequest' || req.is('application/json'));

const backCrear = '/adminGeneral/formInscribirJugadorEquipo';
const backUpd   = '/adminGeneral/formActualizarInscripcionJugadorEquipo';

/* ========= Formularios ========= */
exports.formCrear = async (_req, res) => {
  const temporadas = await db.query(`SELECT id_temporada,nombre FROM Temporadas ORDER BY fecha_inicio DESC`);
  res.render('Coordinacion/General/Crear/formInscribirJugadorEquipo', { ...res.locals, temporadas });
};
exports.formActualizar = async (_req, res) => {
  const temporadas = await db.query(`SELECT id_temporada,nombre FROM Temporadas ORDER BY fecha_inicio DESC`);
  res.render('Coordinacion/General/Actualizar/formActualizarInscripcionJugadorEquipo', { ...res.locals, temporadas });
};

/* ========= Filtros / listas ========= */
// Categorías en la temporada
exports.categoriasPorTemporada = async (req, res) => {
  const { id_temporada } = req.query;
  if (!Number(id_temporada)) return res.json([]);
  const r = await db.query(`
    SELECT c.id_categoria, c.nombre_categoria AS nombre
    FROM CategoriaTemporadaRango ctr
    JOIN Categorias c ON c.id_categoria=ctr.id_categoria
    WHERE ctr.id_temporada=?
    ORDER BY c.edad_min, c.nombre_categoria
  `,[Number(id_temporada)]);
  res.json(r);
};

// Equipos de la temporada y categoría
exports.equiposPorTempCat = async (req, res) => {
  const { id_temporada, id_categoria } = req.query;
  if (!(Number(id_temporada) && Number(id_categoria))) return res.json([]);
  const r = await db.query(`
    SELECT id_equipo_temporada, nombre
    FROM EquipoTemporada
    WHERE id_temporada=? AND id_categoria=?
    ORDER BY nombre
  `,[Number(id_temporada), Number(id_categoria)]);
  res.json(r);
};

// Jugadores asignables para crear: están en la categoría-temporada y NO pertenecen aún a un equipo en esa temporada
exports.jugadoresAsignables = async (req, res) => {
  const { id_temporada, id_categoria, q='' } = req.query;
  if (!(Number(id_temporada) && Number(id_categoria))) return res.json([]);
  const r = await db.query(`
    SELECT j.id_jugador,
           CONCAT(j.apellido_paterno,' ',j.apellido_materno,', ',j.nombres) AS nombre
    FROM JugadorTemporadaCategoria jtc
    JOIN Jugadores j ON j.id_jugador=jtc.id_jugador
    LEFT JOIN (
      SELECT DISTINCT jet.id_jugador
      FROM JugadorEquipoTemporada jet
      JOIN EquipoTemporada et ON et.id_equipo_temporada=jet.id_equipo_temporada
      WHERE et.id_temporada=?
    ) ya ON ya.id_jugador=jtc.id_jugador
    WHERE jtc.id_temporada=? AND jtc.id_categoria=? AND ya.id_jugador IS NULL
      AND (
        ?='' OR j.nombres LIKE CONCAT('%',?,'%') OR j.apellido_paterno LIKE CONCAT('%',?,'%')
        OR j.apellido_materno LIKE CONCAT('%',?,'%')
        OR CONCAT(j.apellido_paterno,' ',j.apellido_materno,' ',j.nombres) LIKE CONCAT('%',?,'%')
      )
    ORDER BY j.apellido_paterno, j.apellido_materno, j.nombres
    LIMIT 200
  `,[Number(id_temporada), Number(id_temporada), Number(id_categoria),
     q,q,q,q,q]);
  res.json(r);
};

// Lista de inscripciones para actualizar
exports.listar = async (req, res) => {
  const { id_temporada, id_categoria, q='' } = req.query;
  if (!Number(id_temporada)) return res.json([]);
  const params = [Number(id_temporada)];
  let addCat = '';
  if (Number(id_categoria)) { addCat = 'AND et.id_categoria=?'; params.push(Number(id_categoria)); }
  params.push(q,q,q,q,q);
  const r = await db.query(`
    SELECT jet.id, jet.id_jugador, jet.id_equipo_temporada,
           DATE_FORMAT(jet.fecha_alta,'%Y-%m-%d') AS fecha_alta,
           DATE_FORMAT(jet.fecha_baja,'%Y-%m-%d') AS fecha_baja,
           et.id_temporada, et.id_categoria, et.nombre AS nombre_equipo,
           CONCAT(j.apellido_paterno,' ',j.apellido_materno,', ',j.nombres) AS nombre_jugador,
           c.nombre_categoria
    FROM JugadorEquipoTemporada jet
    JOIN EquipoTemporada et ON et.id_equipo_temporada=jet.id_equipo_temporada
    JOIN Categorias c ON c.id_categoria=et.id_categoria
    JOIN Jugadores j ON j.id_jugador=jet.id_jugador
    WHERE et.id_temporada=? ${addCat}
      AND (
        ?='' OR j.nombres LIKE CONCAT('%',?,'%') OR j.apellido_paterno LIKE CONCAT('%',?,'%')
        OR j.apellido_materno LIKE CONCAT('%',?,'%')
        OR CONCAT(j.apellido_paterno,' ',j.apellido_materno,' ',j.nombres) LIKE CONCAT('%',?,'%')
      )
    ORDER BY c.edad_min, c.nombre_categoria, et.nombre, j.apellido_paterno, j.apellido_materno, j.nombres
  `, params);
  res.json(r);
};

exports.obtener = async (req, res) => {
  const r = await db.query(`
    SELECT jet.*,
           DATE_FORMAT(jet.fecha_alta,'%Y-%m-%d') AS f_alta,
           DATE_FORMAT(jet.fecha_baja,'%Y-%m-%d') AS f_baja,
           et.id_temporada, et.id_categoria
    FROM JugadorEquipoTemporada jet
    JOIN EquipoTemporada et ON et.id_equipo_temporada=jet.id_equipo_temporada
    WHERE jet.id=? LIMIT 1
  `,[req.params.id]);
  if (!r.length) return res.status(404).json({error:'no encontrado'});
  res.json(r[0]);
};

/* ========= Helpers estadísticas ========= */
async function upsertStats(id_temporada, id_jugador, id_equipo_temporada){
  // Bateo
  await db.query(`
    INSERT INTO EstadisticasBateoTemporada (id_temporada,id_jugador,id_equipo_temporada)
    VALUES (?,?,?)
    ON DUPLICATE KEY UPDATE id_equipo_temporada=VALUES(id_equipo_temporada)
  `,[id_temporada,id_jugador,id_equipo_temporada]);
  // Pitcheo
  await db.query(`
    INSERT INTO EstadisticasPitcheoTemporada (id_temporada,id_jugador,id_equipo_temporada)
    VALUES (?,?,?)
    ON DUPLICATE KEY UPDATE id_equipo_temporada=VALUES(id_equipo_temporada)
  `,[id_temporada,id_jugador,id_equipo_temporada]);
}

/* ========= CRUD ========= */
exports.crear = async (req, res) => {
  try{
    const { id_temporada, id_categoria, id_jugador, id_equipo_temporada, fecha_alta=null } = req.body;
    const ok = Number(id_temporada)&&Number(id_categoria)&&Number(id_jugador)&&Number(id_equipo_temporada);
    if (!ok) return wantsJSON(req)?res.status(400).json({error:'faltan o inválidos'})
      : res.flash({alertTitle:'Datos inválidos',alertMessage:'Temporada, categoría, jugador y equipo son obligatorios.',
                   alertIcon:'warning',showConfirmButton:true,timer:null,ruta:backCrear}, backCrear);

    // validar jugador pertenece a la categoría-temporada
    const vcat = await db.query(
      `SELECT 1 FROM JugadorTemporadaCategoria WHERE id_jugador=? AND id_temporada=? AND id_categoria=? LIMIT 1`,
      [id_jugador,id_temporada,id_categoria]
    );
    if (!vcat.length)
      return wantsJSON(req)?res.status(400).json({error:'Jugador no pertenece a esa categoría en la temporada'})
        : res.flash({alertTitle:'Inválido',alertMessage:'El jugador no pertenece a esa categoría en la temporada.',
                     alertIcon:'warning',showConfirmButton:true,timer:null,ruta:backCrear}, backCrear);

    // validar equipo pertenece a esa temporada y categoría
    const vet = await db.query(
      `SELECT 1 FROM EquipoTemporada WHERE id_equipo_temporada=? AND id_temporada=? AND id_categoria=? LIMIT 1`,
      [id_equipo_temporada,id_temporada,id_categoria]
    );
    if (!vet.length)
      return wantsJSON(req)?res.status(400).json({error:'Equipo no pertenece a esa temporada/categoría'})
        : res.flash({alertTitle:'Inválido',alertMessage:'Equipo no pertenece a esa temporada/categoría.',
                     alertIcon:'warning',showConfirmButton:true,timer:null,ruta:backCrear}, backCrear);

    // regla: un jugador no puede estar en >1 equipo en la misma temporada
    const dup = await db.query(`
      SELECT 1
      FROM JugadorEquipoTemporada jet
      JOIN EquipoTemporada et ON et.id_equipo_temporada=jet.id_equipo_temporada
      WHERE jet.id_jugador=? AND et.id_temporada=? LIMIT 1
    `,[id_jugador,id_temporada]);
    if (dup.length)
      return wantsJSON(req)?res.status(409).json({error:'El jugador ya tiene equipo en esta temporada'})
        : res.flash({alertTitle:'No permitido',alertMessage:'El jugador ya tiene equipo en esta temporada.',
                     alertIcon:'warning',showConfirmButton:true,timer:null,ruta:backCrear}, backCrear);

    await db.query(`
      INSERT INTO JugadorEquipoTemporada (id_jugador,id_equipo_temporada,fecha_alta)
      VALUES (?,?,?)
    `,[id_jugador,id_equipo_temporada, fecha_alta || null]);

    // stats
    await upsertStats(Number(id_temporada), Number(id_jugador), Number(id_equipo_temporada));

    return wantsJSON(req)?res.json({ok:true})
      : res.flash({alertTitle:'Listo',alertMessage:'Inscripción creada y estadísticas listas.',
                   alertIcon:'success',showConfirmButton:false,timer:1200,ruta:backCrear}, backCrear);
  }catch(e){
    console.error(e);
    return wantsJSON(req)?res.status(500).json({error:'error'})
      : res.flash({alertTitle:'Error',alertMessage:'No se pudo inscribir.',
                   alertIcon:'error',showConfirmButton:true,timer:null,ruta:backCrear}, backCrear);
  }
};

exports.actualizar = async (req, res) => {
  const { id } = req.params;
  try{
    const { id_equipo_temporada, fecha_alta=null, fecha_baja=null } = req.body;
    if (!Number(id_equipo_temporada))
      return wantsJSON(req)?res.status(400).json({error:'faltan o inválidos'})
        : res.flash({alertTitle:'Datos inválidos',alertMessage:'Equipo requerido.',
                     alertIcon:'warning',showConfirmButton:true,timer:null,ruta:backUpd}, backUpd);

    // obtener jugador y temporada actual
    const cur = await db.query(`
      SELECT jet.id_jugador, et.id_temporada, et.id_categoria
      FROM JugadorEquipoTemporada jet
      JOIN EquipoTemporada et ON et.id_equipo_temporada=jet.id_equipo_temporada
      WHERE jet.id=? LIMIT 1
    `,[id]);
    if (!cur.length)
      return wantsJSON(req)?res.status(404).json({error:'no encontrado'})
        : res.flash({alertTitle:'No encontrado',alertMessage:'La inscripción no existe.',
                     alertIcon:'error',showConfirmButton:true,timer:null,ruta:backUpd}, backUpd);

    const { id_jugador, id_temporada } = cur[0];

    // validar equipo nuevo es de la misma temporada
    const vet = await db.query(
      `SELECT 1 FROM EquipoTemporada WHERE id_equipo_temporada=? AND id_temporada=? LIMIT 1`,
      [id_equipo_temporada, id_temporada]
    );
    if (!vet.length)
      return wantsJSON(req)?res.status(400).json({error:'Equipo destino no es de la misma temporada'})
        : res.flash({alertTitle:'Inválido',alertMessage:'Equipo destino no es de la misma temporada.',
                     alertIcon:'warning',showConfirmButton:true,timer:null,ruta:backUpd}, backUpd);

    // respetar la regla de un equipo por temporada (excluyendo este registro)
    const clash = await db.query(`
      SELECT 1
      FROM JugadorEquipoTemporada jet
      JOIN EquipoTemporada et ON et.id_equipo_temporada=jet.id_equipo_temporada
      WHERE jet.id_jugador=? AND et.id_temporada=? AND jet.id<>? LIMIT 1
    `,[id_jugador, id_temporada, id]);
    if (clash.length)
      return wantsJSON(req)?res.status(409).json({error:'El jugador ya tiene otro equipo en esta temporada'})
        : res.flash({alertTitle:'No permitido',alertMessage:'El jugador ya tiene otro equipo en esta temporada.',
                     alertIcon:'warning',showConfirmButton:true,timer:null,ruta:backUpd}, backUpd);

    const r = await db.query(`
      UPDATE JugadorEquipoTemporada
      SET id_equipo_temporada=?, fecha_alta=?, fecha_baja=?
      WHERE id=?`, [id_equipo_temporada, fecha_alta || null, fecha_baja || null, id]);

    if (!r.affectedRows)
      return wantsJSON(req)?res.status(404).json({error:'no encontrado'})
        : res.flash({alertTitle:'No encontrado',alertMessage:'La inscripción no existe.',
                     alertIcon:'error',showConfirmButton:true,timer:null,ruta:backUpd}, backUpd);

    // stats
    await upsertStats(Number(id_temporada), Number(id_jugador), Number(id_equipo_temporada));

    return wantsJSON(req)?res.json({ok:true})
      : res.flash({alertTitle:'Actualizado',alertMessage:'Inscripción actualizada.',
                   alertIcon:'success',showConfirmButton:false,timer:1200,ruta:backUpd}, backUpd);
  }catch(e){
    console.error(e);
    return wantsJSON(req)?res.status(500).json({error:'error'})
      : res.flash({alertTitle:'Error',alertMessage:'No se pudo actualizar.',
                   alertIcon:'error',showConfirmButton:true,timer:null,ruta:backUpd}, backUpd);
  }
};

exports.eliminar = async (req, res) => {
  const back = '/adminGeneral/formActualizarInscripcionJugadorEquipo';
  try{
    // obtener jugador y temporada para borrar stats
    const cur = await db.query(`
      SELECT jet.id_jugador, et.id_temporada
      FROM JugadorEquipoTemporada jet
      JOIN EquipoTemporada et ON et.id_equipo_temporada=jet.id_equipo_temporada
      WHERE jet.id=? LIMIT 1
    `,[req.params.id]);

    const r = await db.query(`DELETE FROM JugadorEquipoTemporada WHERE id=?`, [req.params.id]);
    if (!r.affectedRows)
      return wantsJSON(req)?res.status(404).json({error:'no encontrado'})
        : res.flash({alertTitle:'No encontrado',alertMessage:'La inscripción no existe.',
                     alertIcon:'error',showConfirmButton:true,timer:null,ruta:back}, back);

    if (cur.length){
      const { id_jugador, id_temporada } = cur[0];
      await db.query(`DELETE FROM EstadisticasBateoTemporada   WHERE id_temporada=? AND id_jugador=?`, [id_temporada,id_jugador]);
      await db.query(`DELETE FROM EstadisticasPitcheoTemporada WHERE id_temporada=? AND id_jugador=?`, [id_temporada,id_jugador]);
    }

    return wantsJSON(req)?res.json({ok:true})
      : res.flash({alertTitle:'Eliminado',alertMessage:'Inscripción y estadísticas eliminadas.',
                   alertIcon:'success',showConfirmButton:false,timer:1200,ruta:back}, back);
  }catch(e){
    console.error(e);
    return wantsJSON(req)?res.status(500).json({error:'error'})
      : res.flash({alertTitle:'Error',alertMessage:'No se pudo eliminar.',
                   alertIcon:'error',showConfirmButton:true,timer:null,ruta:back}, back);
  }
};

