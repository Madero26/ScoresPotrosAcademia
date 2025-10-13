const db = require('../utils/db');
const wantsJSON = req => !!(req.xhr || req.get('x-requested-with')==='XMLHttpRequest' || req.is('application/json'));

const backCrear = '/adminGeneral/formCrearCategoriaTemporada';
const backUpd   = id => `/adminGeneral/formActualizarCategoriaTemporada${id?`?id=${id}`:''}`;

/* ===== Formularios ===== */
exports.formCrear = async (_req, res) => {
  const temporadas = await db.query(`SELECT id_temporada,nombre FROM Temporadas ORDER BY fecha_inicio DESC`);
  res.render('Coordinacion/General/Crear/formCrearCategoriaTemporada', { ...res.locals, temporadas });
};

exports.formActualizar = async (_req, res) => {
  const temporadas = await db.query(`SELECT id_temporada,nombre FROM Temporadas ORDER BY fecha_inicio DESC`);
  res.render('Coordinacion/General/Actualizar/formActualizarCategoriaTemporada', { ...res.locals, temporadas });
};

/* ===== Aux/Filters ===== */
// Categorías disponibles para una temporada (excluye ya vinculadas). Si viene id (registro actual), incluye su categoría.
exports.categoriasDisponibles = async (req, res) => {
  const { id_temporada, id } = req.query;
  if (!Number(id_temporada)) return res.json([]);
  let currentCat = 0;
  if (Number(id)) {
    const r = await db.query(`SELECT id_categoria FROM CategoriaTemporadaRango WHERE id=? LIMIT 1`, [id]);
    currentCat = r[0]?.id_categoria || 0;
  }
  const q = `
    SELECT c.id_categoria, c.nombre_categoria AS nombre
    FROM Categorias c
    LEFT JOIN (
      SELECT id_categoria FROM CategoriaTemporadaRango WHERE id_temporada=?
    ) used ON used.id_categoria=c.id_categoria
    WHERE used.id_categoria IS NULL OR c.id_categoria=?
    ORDER BY c.edad_min, c.nombre_categoria
  `;
  const cats = await db.query(q, [Number(id_temporada), currentCat]);
  res.json(cats);
};

// Lista de vínculos existentes en una temporada
exports.listaPorTemporada = async (req, res) => {
  const { id_temporada } = req.query;
  if (!Number(id_temporada)) return res.json([]);
  const r = await db.query(`
    SELECT ctr.id, ctr.id_temporada, ctr.id_categoria,
           DATE_FORMAT(ctr.nacimiento_desde,'%Y-%m-%d') AS nacimiento_desde,
           DATE_FORMAT(ctr.nacimiento_hasta,'%Y-%m-%d') AS nacimiento_hasta,
           c.nombre_categoria
    FROM CategoriaTemporadaRango ctr
    JOIN Categorias c ON c.id_categoria=ctr.id_categoria
    WHERE ctr.id_temporada=?
    ORDER BY c.edad_min, c.nombre_categoria
  `,[Number(id_temporada)]);
  res.json(r);
};

// Obtener uno
exports.obtener = async (req, res) => {
  const r = await db.query(`
    SELECT ctr.*, DATE_FORMAT(ctr.nacimiento_desde,'%Y-%m-%d') AS f_desde,
           DATE_FORMAT(ctr.nacimiento_hasta,'%Y-%m-%d') AS f_hasta
    FROM CategoriaTemporadaRango ctr WHERE id=? LIMIT 1
  `,[req.params.id]);
  if (!r.length) return res.status(404).json({error:'no encontrado'});
  res.json(r[0]);
};

/* ===== CRUD ===== */
exports.crear = async (req, res) => {
  try{
    const { id_temporada, id_categoria, nacimiento_desde, nacimiento_hasta } = req.body;
    const ok = Number(id_temporada)>0 && Number(id_categoria)>0 &&
               /^\d{4}-\d{2}-\d{2}$/.test(String(nacimiento_desde||'')) &&
               /^\d{4}-\d{2}-\d{2}$/.test(String(nacimiento_hasta||''));
    if (!ok) return wantsJSON(req)?res.status(400).json({error:'faltan o inválidos'})
      : res.flash({alertTitle:'Datos inválidos',alertMessage:'Temporada, categoría y fechas son obligatorios.',
                   alertIcon:'warning',showConfirmButton:true,timer:null,ruta:backCrear}, backCrear);

    // Unicidad temporada-categoría
    const dup = await db.query(
      `SELECT 1 FROM CategoriaTemporadaRango WHERE id_temporada=? AND id_categoria=? LIMIT 1`,
      [id_temporada, id_categoria]
    );
    if (dup.length)
      return wantsJSON(req)?res.status(409).json({error:'La categoría ya está vinculada a esa temporada'})
        : res.flash({alertTitle:'No permitido',alertMessage:'La categoría ya está vinculada a esa temporada.',
                     alertIcon:'warning',showConfirmButton:true,timer:null,ruta:backCrear}, backCrear);

    await db.query(`
      INSERT INTO CategoriaTemporadaRango (id_temporada,id_categoria,nacimiento_desde,nacimiento_hasta)
      VALUES (?,?,?,?)
    `,[id_temporada,id_categoria,nacimiento_desde,nacimiento_hasta]);

    return wantsJSON(req)?res.json({ok:true})
      : res.flash({alertTitle:'Listo',alertMessage:'Vínculo creado.',
                   alertIcon:'success',showConfirmButton:false,timer:1200,ruta:backCrear}, backCrear);
  }catch(e){
    console.error(e);
    return wantsJSON(req)?res.status(500).json({error:'error'})
      : res.flash({alertTitle:'Error',alertMessage:'No se pudo crear.',
                   alertIcon:'error',showConfirmButton:true,timer:null,ruta:backCrear}, backCrear);
  }
};

exports.actualizar = async (req, res) => {
  const { id } = req.params; const back = backUpd(id);
  try{
    const { id_categoria, nacimiento_desde, nacimiento_hasta } = req.body;
    if (!(Number(id_categoria)>0 && /^\d{4}-\d{2}-\d{2}$/.test(nacimiento_desde||'') && /^\d{4}-\d{2}-\d{2}$/.test(nacimiento_hasta||'')))
      return wantsJSON(req)?res.status(400).json({error:'faltan o inválidos'})
        : res.flash({alertTitle:'Datos inválidos',alertMessage:'Categoría y fechas requeridas.',
                     alertIcon:'warning',showConfirmButton:true,timer:null,ruta:back}, back);

    const cur = await db.query(`SELECT id_temporada FROM CategoriaTemporadaRango WHERE id=? LIMIT 1`, [id]);
    if (!cur.length)
      return wantsJSON(req)?res.status(404).json({error:'no encontrado'})
        : res.flash({alertTitle:'No encontrado',alertMessage:'El registro no existe.',
                     alertIcon:'error',showConfirmButton:true,timer:null,ruta:back}, back);

    // Al cambiar categoría, respeta unicidad dentro de la temporada
    const clash = await db.query(
      `SELECT 1 FROM CategoriaTemporadaRango WHERE id_temporada=? AND id_categoria=? AND id<>? LIMIT 1`,
      [cur[0].id_temporada, id_categoria, id]
    );
    if (clash.length)
      return wantsJSON(req)?res.status(409).json({error:'Esa categoría ya está usada en esta temporada'})
        : res.flash({alertTitle:'No permitido',alertMessage:'Esa categoría ya está usada en esta temporada.',
                     alertIcon:'warning',showConfirmButton:true,timer:null,ruta:back}, back);

    const r = await db.query(`
      UPDATE CategoriaTemporadaRango
      SET id_categoria=?, nacimiento_desde=?, nacimiento_hasta=?
      WHERE id=?`, [id_categoria, nacimiento_desde, nacimiento_hasta, id]);

    if (!r.affectedRows)
      return wantsJSON(req)?res.status(404).json({error:'no encontrado'})
        : res.flash({alertTitle:'No encontrado',alertMessage:'El registro no existe.',
                     alertIcon:'error',showConfirmButton:true,timer:null,ruta:back}, back);

    return wantsJSON(req)?res.json({ok:true})
      : res.flash({alertTitle:'Actualizado',alertMessage:'Vínculo actualizado.',
                   alertIcon:'success',showConfirmButton:false,timer:1200,ruta:back}, back);
  }catch(e){
    console.error(e);
    return wantsJSON(req)?res.status(500).json({error:'error'})
      : res.flash({alertTitle:'Error',alertMessage:'No se pudo actualizar.',
                   alertIcon:'error',showConfirmButton:true,timer:null,ruta:back}, back);
  }
};

exports.eliminar = async (req, res) => {
  const back = '/adminGeneral/formActualizarCategoriaTemporada';
  try{
    const r = await db.query(`DELETE FROM CategoriaTemporadaRango WHERE id=?`, [req.params.id]);
    if (!r.affectedRows)
      return wantsJSON(req)?res.status(404).json({error:'no encontrado'})
        : res.flash({alertTitle:'No encontrado',alertMessage:'El registro no existe.',
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

