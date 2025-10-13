const db = require('../utils/db');
const wantsJSON = req => !!(req.xhr || req.get('x-requested-with')==='XMLHttpRequest' || req.is('application/json'));
const backCrear = '/adminGeneral/formAsignarCoordinadorCategoria';
const backUpd   = '/adminGeneral/formActualizarAsignacionCoordinadorCategoria';

/* ===== Formularios ===== */
exports.formCrear = async (_req, res) => {
  const temporadas = await db.query(`SELECT id_temporada,nombre FROM Temporadas ORDER BY fecha_inicio DESC`);
  res.render('Coordinacion/General/Crear/formAsignarCoordinadorCategoria', { ...res.locals, temporadas });
};
exports.formActualizar = async (_req, res) => {
  const temporadas = await db.query(`SELECT id_temporada,nombre FROM Temporadas ORDER BY fecha_inicio DESC`);
  res.render('Coordinacion/General/Actualizar/formActualizarAsignacionCoordinadorCategoria', { ...res.locals, temporadas });
};

/* ===== Filtros ===== */
// Categorías existentes en esa temporada
exports.categoriasPorTemporada = async (req, res) => {
  const { id_temporada } = req.query; if(!Number(id_temporada)) return res.json([]);
  const r = await db.query(`
    SELECT c.id_categoria, c.nombre_categoria AS nombre
    FROM CategoriaTemporadaRango ctr
    JOIN Categorias c ON c.id_categoria=ctr.id_categoria
    WHERE ctr.id_temporada=?
    ORDER BY c.edad_min, c.nombre_categoria
  `,[id_temporada]);
  res.json(r);
};
// Coordinadores disponibles en la temporada (sin asignación) y opcionalmente incluir el actual
exports.coordinadoresDisponibles = async (req, res) => {
  const { id_temporada, id_categoria } = req.query;
  if(!Number(id_temporada)) return res.json([]);
  const cur = Number(id_categoria)? await db.query(
    `SELECT id,id_coordinador FROM CoordinadorTemporadaCategoria WHERE id_temporada=? AND id_categoria=? LIMIT 1`,
    [id_temporada, id_categoria]) : [];
  const curCoord = cur[0]?.id_coordinador || 0;

  const r = await db.query(`
    SELECT co.id_coordinador,
           CONCAT(co.apellido_paterno,' ',co.apellido_materno,', ',co.nombres) AS nombre
    FROM Coordinadores co
    LEFT JOIN (
      SELECT id_coordinador FROM CoordinadorTemporadaCategoria WHERE id_temporada=?
    ) x ON x.id_coordinador=co.id_coordinador
    WHERE x.id_coordinador IS NULL OR co.id_coordinador=?
    ORDER BY co.apellido_paterno, co.apellido_materno, co.nombres
  `,[id_temporada, curCoord]);
  res.json(r);
};
// Asignación actual (si existe)
exports.asignacionActual = async (req, res) => {
  const { id_temporada, id_categoria } = req.query;
  if(!Number(id_temporada)||!Number(id_categoria)) return res.json(null);
  const r = await db.query(`
    SELECT ctc.id, ctc.id_coordinador,
           CONCAT(co.apellido_paterno,' ',co.apellido_materno,', ',co.nombres) AS nombre
    FROM CoordinadorTemporadaCategoria ctc
    JOIN Coordinadores co ON co.id_coordinador=ctc.id_coordinador
    WHERE ctc.id_temporada=? AND ctc.id_categoria=?
    LIMIT 1
  `,[id_temporada,id_categoria]);
  res.json(r[0]||null);
};

/* ===== CRUD ===== */
exports.crear = async (req, res) => {
  try{
    const { id_temporada, id_categoria, id_coordinador } = req.body;
    const ok = +id_temporada>0 && +id_categoria>0 && +id_coordinador>0;
    if(!ok) return wantsJSON(req)?res.status(400).json({error:'faltan o inválidos'})
      : res.flash({alertTitle:'Datos inválidos',alertMessage:'Temporada, categoría y coordinador son obligatorios.',
                   alertIcon:'warning',showConfirmButton:true,timer:null,ruta:backCrear}, backCrear);

    // regla A: una categoría por temporada solo un coordinador
    const dupCat = await db.query(
      `SELECT 1 FROM CoordinadorTemporadaCategoria WHERE id_temporada=? AND id_categoria=? LIMIT 1`,
      [id_temporada,id_categoria]
    );
    if (dupCat.length)
      return wantsJSON(req)?res.status(409).json({error:'La categoría ya tiene coordinador'})
        : res.flash({alertTitle:'No permitido',alertMessage:'La categoría ya tiene coordinador.',
                     alertIcon:'warning',showConfirmButton:true,timer:null,ruta:backCrear}, backCrear);

    // regla B: el coordinador no puede tener otra categoría en la misma temporada
    const dupCoord = await db.query(
      `SELECT 1 FROM CoordinadorTemporadaCategoria WHERE id_temporada=? AND id_coordinador=? LIMIT 1`,
      [id_temporada,id_coordinador]
    );
    if (dupCoord.length)
      return wantsJSON(req)?res.status(409).json({error:'Coordinador ya asignado en esa temporada'})
        : res.flash({alertTitle:'No permitido',alertMessage:'Ese coordinador ya está asignado en esa temporada.',
                     alertIcon:'warning',showConfirmButton:true,timer:null,ruta:backCrear}, backCrear);

    await db.query(
      `INSERT INTO CoordinadorTemporadaCategoria (id_coordinador,id_temporada,id_categoria) VALUES (?,?,?)`,
      [id_coordinador,id_temporada,id_categoria]
    );
    return wantsJSON(req)?res.json({ok:true})
      : res.flash({alertTitle:'Listo',alertMessage:'Asignación creada.',
                   alertIcon:'success',showConfirmButton:false,timer:1200,ruta:backCrear}, backCrear);
  }catch(e){
    console.error(e);
    return wantsJSON(req)?res.status(500).json({error:'error'})
      : res.flash({alertTitle:'Error',alertMessage:'No se pudo crear.',
                   alertIcon:'error',showConfirmButton:true,timer:null,ruta:backCrear}, backCrear);
  }
};

exports.actualizar = async (req, res) => {
  const { id } = req.params;
  try{
    const { id_coordinador } = req.body;
    if(!Number(id_coordinador))
      return wantsJSON(req)?res.status(400).json({error:'faltan o inválidos'})
        : res.flash({alertTitle:'Datos inválidos',alertMessage:'Coordinador requerido.',
                     alertIcon:'warning',showConfirmButton:true,timer:null,ruta:backUpd}, backUpd);

    const cur = await db.query(`SELECT id_temporada FROM CoordinadorTemporadaCategoria WHERE id=? LIMIT 1`,[id]);
    if(!cur.length) return wantsJSON(req)?res.status(404).json({error:'no encontrado'})
      : res.flash({alertTitle:'No encontrado',alertMessage:'Asignación no existe.',
                   alertIcon:'error',showConfirmButton:true,timer:null,ruta:backUpd}, backUpd);

    // regla: nuevo coordinador no debe estar asignado en esa temporada
    const clash = await db.query(
      `SELECT 1 FROM CoordinadorTemporadaCategoria WHERE id_temporada=? AND id_coordinador=? AND id<>? LIMIT 1`,
      [cur[0].id_temporada, id_coordinador, id]
    );
    if (clash.length)
      return wantsJSON(req)?res.status(409).json({error:'Coordinador ya asignado en esa temporada'})
        : res.flash({alertTitle:'No permitido',alertMessage:'Ese coordinador ya está asignado en esta temporada.',
                     alertIcon:'warning',showConfirmButton:true,timer:null,ruta:backUpd}, backUpd);

    const r = await db.query(`UPDATE CoordinadorTemporadaCategoria SET id_coordinador=? WHERE id=?`,[id_coordinador,id]);
    if(!r.affectedRows) return wantsJSON(req)?res.status(404).json({error:'no encontrado'})
      : res.flash({alertTitle:'No encontrado',alertMessage:'Asignación no existe.',
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
  try{
    const r = await db.query(`DELETE FROM CoordinadorTemporadaCategoria WHERE id=?`,[req.params.id]);
    if(!r.affectedRows) return wantsJSON(req)?res.status(404).json({error:'no encontrado'})
      : res.flash({alertTitle:'No encontrado',alertMessage:'Asignación no existe.',
                   alertIcon:'error',showConfirmButton:true,timer:null,ruta:backUpd}, backUpd);
    return wantsJSON(req)?res.json({ok:true})
      : res.flash({alertTitle:'Eliminado',alertMessage:'Asignación eliminada.',
                   alertIcon:'success',showConfirmButton:false,timer:1200,ruta:backUpd}, backUpd);
  }catch(e){
    console.error(e);
    return wantsJSON(req)?res.status(500).json({error:'error'})
      : res.flash({alertTitle:'Error',alertMessage:'No se pudo eliminar.',
                   alertIcon:'error',showConfirmButton:true,timer:null,ruta:backUpd}, backUpd);
  }
};

