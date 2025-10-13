const db = require('../utils/db');
const wantsJSON = req => !!(req.xhr || req.get('x-requested-with')==='XMLHttpRequest' || req.is('application/json'));

const backCrear = '/adminGeneral/formAsignarJugadorCategoria';
const backUpd   = '/adminGeneral/formActualizarAsignacionJugadorCategoria';

/* ===== Formularios ===== */
exports.formCrear = async (_req, res) => {
  const temporadas = await db.query(`SELECT id_temporada,nombre FROM Temporadas ORDER BY fecha_inicio DESC`);
  res.render('Coordinacion/General/Crear/formAsignarJugadorCategoria', { ...res.locals, temporadas });
};
exports.formActualizar = async (_req, res) => {
  const temporadas = await db.query(`SELECT id_temporada,nombre FROM Temporadas ORDER BY fecha_inicio DESC`);
  res.render('Coordinacion/General/Actualizar/formActualizarAsignacionJugadorCategoria', { ...res.locals, temporadas });
};

/* ===== Filtros/API ===== */
// Categorías vinculadas a una temporada
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

// Buscador de jugadores (global). q opcional.
exports.buscarJugadores = async (req, res) => {
  const q = String(req.query.q || '').trim();
  const params = [];
  let where = '1=1';
  if (q) {
    where = `(j.nombres LIKE ? OR j.apellido_paterno LIKE ? OR j.apellido_materno LIKE ? OR CONCAT(j.apellido_paterno,' ',j.apellido_materno,' ',j.nombres) LIKE ?)`;
    params.push(`%${q}%`,`%${q}%`,`%${q}%`,`%${q}%`);
  }
  const r = await db.query(`
    SELECT j.id_jugador,
           CONCAT(j.apellido_paterno,' ',j.apellido_materno,', ',j.nombres) AS nombre
    FROM Jugadores j
    WHERE ${where}
    ORDER BY j.apellido_paterno, j.apellido_materno, j.nombres
    LIMIT 100
  `, params);
  res.json(r);
};

// Lista de jugadores asignados en una temporada (opcional por categoría)
exports.listarAsignados = async (req, res) => {
  const { id_temporada, id_categoria } = req.query;
  if (!Number(id_temporada)) return res.json([]);
  const params = [Number(id_temporada)];
  let where = `jtc.id_temporada=?`;
  if (Number(id_categoria)) { where += ` AND jtc.id_categoria=?`; params.push(Number(id_categoria)); }
  const r = await db.query(`
    SELECT jtc.id,
           jtc.id_jugador, jtc.id_temporada, jtc.id_categoria,
           DATE_FORMAT(jtc.fecha_asignacion,'%Y-%m-%d %H:%i:%s') AS fecha_asignacion,
           CONCAT(j.apellido_paterno,' ',j.apellido_materno,', ',j.nombres) AS nombre_jugador,
           c.nombre_categoria
    FROM JugadorTemporadaCategoria jtc
    JOIN Jugadores j  ON j.id_jugador=jtc.id_jugador
    JOIN Categorias c ON c.id_categoria=jtc.id_categoria
    WHERE ${where}
    ORDER BY c.edad_min, c.nombre_categoria, j.apellido_paterno, j.apellido_materno, j.nombres
  `, params);
  res.json(r);
};

// Obtener una asignación
exports.obtener = async (req, res) => {
  const r = await db.query(`
    SELECT jtc.*, DATE_FORMAT(jtc.fecha_asignacion,'%Y-%m-%d %H:%i:%s') AS f_asignacion
    FROM JugadorTemporadaCategoria jtc WHERE id=? LIMIT 1
  `,[req.params.id]);
  if (!r.length) return res.status(404).json({error:'no encontrado'});
  res.json(r[0]);
};

/* ===== CRUD ===== */
exports.crear = async (req, res) => {
  try{
    const { id_temporada, id_categoria, id_jugador } = req.body;
    const ok = Number(id_temporada)>0 && Number(id_categoria)>0 && Number(id_jugador)>0;
    if (!ok) return wantsJSON(req)?res.status(400).json({error:'faltan o inválidos'})
      : res.flash({alertTitle:'Datos inválidos',alertMessage:'Temporada, categoría y jugador son obligatorios.',
                   alertIcon:'warning',showConfirmButton:true,timer:null,ruta:backCrear}, backCrear);

    // validar que la categoría pertenece a la temporada
    const vcat = await db.query(
      `SELECT 1 FROM CategoriaTemporadaRango WHERE id_temporada=? AND id_categoria=? LIMIT 1`,
      [id_temporada,id_categoria]
    );
    if (!vcat.length)
      return wantsJSON(req)?res.status(400).json({error:'Categoría no pertenece a esa temporada'})
        : res.flash({alertTitle:'Inválido',alertMessage:'La categoría no pertenece a esa temporada.',
                     alertIcon:'warning',showConfirmButton:true,timer:null,ruta:backCrear}, backCrear);

    // única categoría por temporada para cada jugador
    const dup = await db.query(
      `SELECT 1 FROM JugadorTemporadaCategoria WHERE id_jugador=? AND id_temporada=? LIMIT 1`,
      [id_jugador,id_temporada]
    );
    if (dup.length)
      return wantsJSON(req)?res.status(409).json({error:'Ese jugador ya está asignado en esa temporada'})
        : res.flash({alertTitle:'No permitido',alertMessage:'Ese jugador ya está asignado en esa temporada.',
                     alertIcon:'warning',showConfirmButton:true,timer:null,ruta:backCrear}, backCrear);

    await db.query(`
      INSERT INTO JugadorTemporadaCategoria (id_jugador,id_temporada,id_categoria,asignado_automatico)
      VALUES (?,?,?,0)
    `,[id_jugador,id_temporada,id_categoria]);

    return wantsJSON(req)?res.json({ok:true})
      : res.flash({alertTitle:'Listo',alertMessage:'Jugador asignado.',
                   alertIcon:'success',showConfirmButton:false,timer:1200,ruta:backCrear}, backCrear);
  }catch(e){
    console.error(e);
    return wantsJSON(req)?res.status(500).json({error:'error'})
      : res.flash({alertTitle:'Error',alertMessage:'No se pudo asignar.',
                   alertIcon:'error',showConfirmButton:true,timer:null,ruta:backCrear}, backCrear);
  }
};

exports.actualizar = async (req, res) => {
  const { id } = req.params;
  try{
    const { id_jugador, id_temporada, id_categoria } = req.body;
    if (!(Number(id_jugador)>0 && Number(id_temporada)>0 && Number(id_categoria)>0))
      return wantsJSON(req)?res.status(400).json({error:'faltan o inválidos'})
        : res.flash({alertTitle:'Datos inválidos',alertMessage:'Jugador, temporada y categoría requeridos.',
                     alertIcon:'warning',showConfirmButton:true,timer:null,ruta:backUpd}, backUpd);

    // validar existe registro actual
    const cur = await db.query(`SELECT id FROM JugadorTemporadaCategoria WHERE id=? LIMIT 1`,[id]);
    if (!cur.length)
      return wantsJSON(req)?res.status(404).json({error:'no encontrado'})
        : res.flash({alertTitle:'No encontrado',alertMessage:'La asignación no existe.',
                     alertIcon:'error',showConfirmButton:true,timer:null,ruta:backUpd}, backUpd);

    // validar categoría pertenece a temporada
    const vcat = await db.query(
      `SELECT 1 FROM CategoriaTemporadaRango WHERE id_temporada=? AND id_categoria=? LIMIT 1`,
      [id_temporada,id_categoria]
    );
    if (!vcat.length)
      return wantsJSON(req)?res.status(400).json({error:'Categoría no pertenece a esa temporada'})
        : res.flash({alertTitle:'Inválido',alertMessage:'La categoría no pertenece a esa temporada.',
                     alertIcon:'warning',showConfirmButton:true,timer:null,ruta:backUpd}, backUpd);

    // respetar unicidad jugador+temporada
    const clash = await db.query(
      `SELECT 1 FROM JugadorTemporadaCategoria WHERE id_jugador=? AND id_temporada=? AND id<>? LIMIT 1`,
      [id_jugador,id_temporada,id]
    );
    if (clash.length)
      return wantsJSON(req)?res.status(409).json({error:'El jugador ya tiene categoría en esa temporada'})
        : res.flash({alertTitle:'No permitido',alertMessage:'El jugador ya tiene categoría en esa temporada.',
                     alertIcon:'warning',showConfirmButton:true,timer:null,ruta:backUpd}, backUpd);

    const r = await db.query(`
      UPDATE JugadorTemporadaCategoria
      SET id_jugador=?, id_temporada=?, id_categoria=?, asignado_automatico=0
      WHERE id=?`, [id_jugador,id_temporada,id_categoria,id]);

    if (!r.affectedRows)
      return wantsJSON(req)?res.status(404).json({error:'no encontrado'})
        : res.flash({alertTitle:'No encontrado',alertMessage:'La asignación no existe.',
                     alertIcon:'error',showConfirmButton:true,timer:null,ruta:backUpd}, backUpd);

    return wantsJSON(req)?res.json({ok:true})
      : res.flash({alertTitle:'Actualizado',alertMessage:'Asignación actualizada.',
                   alertIcon:'success',showConfirmButton:false,timer:1200,ruta:backUpd}, backUpd);
  }catch(e){
    console.error(e);
    return wantsJSON(req)?res.status(500).json({error:'error'})
      : res.flash({alertTitle:'Error',alertMessage:'No se pudo actualizar.',
                   alertIcon:'error',showConfirmButton:true,timer:null,ruta:backUpd}, backUpd);
  }
};

exports.eliminar = async (req, res) => {
  const back = '/adminGeneral/formActualizarAsignacionJugadorCategoria';
  try{
    const r = await db.query(`DELETE FROM JugadorTemporadaCategoria WHERE id=?`,[req.params.id]);
    if (!r.affectedRows)
      return wantsJSON(req)?res.status(404).json({error:'no encontrado'})
        : res.flash({alertTitle:'No encontrado',alertMessage:'La asignación no existe.',
                     alertIcon:'error',showConfirmButton:true,timer:null,ruta:back}, back);
    return wantsJSON(req)?res.json({ok:true})
      : res.flash({alertTitle:'Eliminado',alertMessage:'Vínculo eliminado.',
                   alertIcon:'success',showConfirmButton:false,timer:1200,ruta:back}, back);
  }catch(e){
    console.error(e);
    return wantsJSON(req)?res.status(500).json({error:'error'})
      : res.flash({alertTitle:'Error',alertMessage:'No se pudo eliminar.',
                   alertIcon:'error',showConfirmButton:true,timer:null,ruta:back}, back);
  }
};

