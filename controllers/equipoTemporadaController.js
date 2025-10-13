const path = require('path');
const db   = require('../utils/db');
const wantsJSON = req => !!(req.xhr || req.get('x-requested-with')==='XMLHttpRequest' || req.is('application/json'));
const backCrear = '/adminGeneral/formCrearEquipoTemporada';
const backUpd   = id => `/adminGeneral/formActualizarEquipoTemporada?id=${id||''}`;
const fotoPath  = file => file ? `/imgs/Equipos/${path.basename(file.path)}` : null;

/* ================= FORMULARIOS ================= */
exports.formCrear = async (_req, res) => {
  const temporadas = await db.query(
    `SELECT id_temporada, nombre FROM Temporadas ORDER BY fecha_inicio DESC`
  );
  res.render('Coordinacion/General/Crear/formCrearEquipoTemporada', { ...res.locals, temporadas });
};

exports.formActualizar = async (req, res) => {
  const temporadas = await db.query(
    `SELECT id_temporada, nombre FROM Temporadas ORDER BY fecha_inicio DESC`
  );
  res.render('Coordinacion/General/Actualizar/formActualizarEquipoTemporada', { ...res.locals, temporadas });
};
/* ====== NUEVO: entrenadores disponibles por temporada (incluye el del propio equipo en edición) ====== */
exports.entrenadoresDisponibles = async (req, res) => {
  const { id_temporada, id_equipo_temporada } = req.query;
  if (!Number(id_temporada)) return res.json([]);
  const currentId = Number(id_equipo_temporada) || 0;

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
  `,[Number(id_temporada), currentId]);
  res.json(r);
};
/* ================= CRUD ================= */
exports.obtener = async (req, res) => {
  const r = await db.query(`
    SELECT et.*, e.nombre_corto
    FROM EquipoTemporada et
    LEFT JOIN Equipos e ON e.id_equipo = et.id_equipo
    WHERE et.id_equipo_temporada=? LIMIT 1
  `,[req.params.id]);
  if (!r.length) return res.status(404).json({error:'no encontrado'});
  res.json(r[0]);
};

/* ================= CRUD ================= */
exports.crear = async (req, res) => {
  try{
    const { id_temporada, id_categoria, id_equipo=null, nombre, colores='', id_entrenador=null } = req.body;
    const url_foto = fotoPath(req.file);

    const ok = Number(id_temporada)>0 && Number(id_categoria)>0 && String(nombre||'').trim().length>0;
    if (!ok) return wantsJSON(req)?res.status(400).json({error:'faltan o inválidos'})
      : res.flash({alertTitle:'Datos inválidos',alertMessage:'Temporada, categoría y nombre son obligatorios.',
                   alertIcon:'warning',showConfirmButton:true,timer:null,ruta:backCrear}, backCrear);

    // entrenador único por temporada
    if (Number(id_entrenador)) {
      const dup = await db.query(
        `SELECT 1 FROM EquipoTemporada WHERE id_temporada=? AND id_entrenador=? LIMIT 1`,
        [id_temporada, id_entrenador]
      );
      if (dup.length) {
        const msg='Ese entrenador ya está asignado en esta temporada.';
        return wantsJSON(req)?res.status(409).json({error:msg})
          : res.flash({alertTitle:'No permitido',alertMessage:msg,alertIcon:'warning',showConfirmButton:true,timer:null,ruta:backCrear}, backCrear);
      }
    }

    // ===== Transacción: crear equipo + crear estadísticas del equipo =====
    await db.query('START TRANSACTION');

    const ins = await db.query(`
      INSERT INTO EquipoTemporada
        (id_equipo,id_temporada,id_categoria,nombre,colores,url_foto,id_entrenador)
      VALUES (?,?,?,?,?,?,?)
    `,[id_equipo||null, id_temporada, id_categoria, nombre.trim(), colores.trim(), url_foto, Number(id_entrenador)||null]);

    const newId = ins.insertId;

    // Crea la fila de estadísticas del equipo con ceros por defecto
    await db.query(`
      INSERT INTO EstadisticasEquipoTemporada (id_temporada, id_equipo_temporada)
      VALUES (?,?)
    `,[id_temporada, newId]);

    await db.query('COMMIT');

    return wantsJSON(req)?res.json({ok:true, id_equipo_temporada:newId})
      : res.flash({alertTitle:'Listo',alertMessage:'Equipo registrado.',alertIcon:'success',showConfirmButton:false,timer:1200,ruta:backCrear}, backCrear);

  }catch(e){
    try { await db.query('ROLLBACK'); } catch {}
    console.error(e);
    const msg = (e.code==='ER_DUP_ENTRY') ? 'Nombre duplicado en esa categoría-temporada.' : 'Error al crear.';
    return wantsJSON(req)?res.status(500).json({error:msg})
      : res.flash({alertTitle:'Error',alertMessage:msg,alertIcon:'error',showConfirmButton:true,timer:null,ruta:backCrear}, backCrear);
  }
};

exports.actualizar = async (req, res) => {
  const { id } = req.params; const back = backUpd(id);
  try{
    const { id_equipo=null, nombre, colores='', url_foto:prevUrl=null, id_entrenador=null } = req.body;
    const url_foto = req.file ? fotoPath(req.file) : (prevUrl || null);
    if (!String(nombre||'').trim())
      return wantsJSON(req)?res.status(400).json({error:'faltan o inválidos'})
        : res.flash({alertTitle:'Datos inválidos',alertMessage:'Nombre requerido.',
                     alertIcon:'warning',showConfirmButton:true,timer:null,ruta:back}, back);

    // trae temporada del registro
    const cur = await db.query(`SELECT id_temporada FROM EquipoTemporada WHERE id_equipo_temporada=? LIMIT 1`, [id]);
    if (!cur.length) return wantsJSON(req)?res.status(404).json({error:'no encontrado'})
      : res.flash({alertTitle:'No encontrado',alertMessage:'El registro no existe.',
                   alertIcon:'error',showConfirmButton:true,timer:null,ruta:back}, back);
    const id_temporada = cur[0].id_temporada;

    // regla en actualización: permitir sólo si el entrenador no está en otro equipo de la misma temporada
    if (Number(id_entrenador)) {
      const clash = await db.query(
        `SELECT 1 FROM EquipoTemporada
         WHERE id_temporada=? AND id_entrenador=? AND id_equipo_temporada<>? LIMIT 1`,
        [id_temporada, id_entrenador, id]
      );
      if (clash.length) {
        const msg='Ese entrenador ya dirige otro equipo en esta temporada.';
        return wantsJSON(req)?res.status(409).json({error:msg})
          : res.flash({alertTitle:'No permitido',alertMessage:msg,alertIcon:'warning',showConfirmButton:true,timer:null,ruta:back}, back);
      }
    }

    const r = await db.query(`
      UPDATE EquipoTemporada
      SET id_equipo=?, nombre=?, colores=?, url_foto=?, id_entrenador=?
      WHERE id_equipo_temporada=?
    `,[id_equipo||null, nombre.trim(), colores.trim(), url_foto, Number(id_entrenador)||null, id]);

    if (!r.affectedRows)
      return wantsJSON(req)?res.status(404).json({error:'no encontrado'})
        : res.flash({alertTitle:'No encontrado',alertMessage:'El registro no existe.',
                     alertIcon:'error',showConfirmButton:true,timer:null,ruta:back}, back);

    return wantsJSON(req)?res.json({ok:true})
      : res.flash({alertTitle:'Actualizado',alertMessage:'Equipo actualizado.',
                   alertIcon:'success',showConfirmButton:false,timer:1200,ruta:back}, back);

  }catch(e){
    console.error(e);
    const msg = (e.code==='ER_DUP_ENTRY') ? 'Nombre duplicado en esa categoría-temporada.' : 'Error al actualizar.';
    return wantsJSON(req)?res.status(500).json({error:msg})
      : res.flash({alertTitle:'Error',alertMessage:msg,alertIcon:'error',showConfirmButton:true,timer:null,ruta:back}, back);
  }
};

exports.eliminar = async (req, res) => {
  const back = '/adminGeneral/formActualizarEquipoTemporada';
  try{
    // Nota: EstadisticasEquipoTemporada tiene FK ON DELETE CASCADE -> se borra automáticamente
    const r = await db.query(`DELETE FROM EquipoTemporada WHERE id_equipo_temporada=?`, [req.params.id]);
    if(!r.affectedRows){
      return wantsJSON(req)?res.status(404).json({error:'no encontrado'})
        : res.flash({alertTitle:'No encontrado',alertMessage:'El registro no existe.',
                     alertIcon:'error',showConfirmButton:true,timer:null,ruta:back}, back);
    }
    return wantsJSON(req)?res.json({ok:true})
      : res.flash({alertTitle:'Eliminado',alertMessage:'Equipo eliminado.',
                   alertIcon:'success',showConfirmButton:false,timer:1200,ruta:back}, back);
  }catch(e){
    console.error(e);
    return wantsJSON(req)?res.status(500).json({error:'error'})
      : res.flash({alertTitle:'Error',alertMessage:'No se pudo eliminar.',
                   alertIcon:'error',showConfirmButton:true,timer:null,ruta:back}, back);
  }
};

/* ================= FILTROS / LISTAS ================= */
// Categorías de una temporada
exports.categoriasPorTemporada = async (req, res) => {
  const { id_temporada } = req.query;
  if(!Number(id_temporada)) return res.json([]);
  const r = await db.query(`
    SELECT c.id_categoria, c.nombre_categoria AS nombre
    FROM CategoriaTemporadaRango ctr
    JOIN Categorias c ON c.id_categoria=ctr.id_categoria
    WHERE ctr.id_temporada=?
    ORDER BY c.edad_min, c.nombre_categoria
  `,[Number(id_temporada)]);
  res.json(r);
};

// Equipos base (catálogo)
exports.equiposBase = async (_req, res) => {
  const r = await db.query(`SELECT id_equipo, nombre_corto FROM Equipos ORDER BY nombre_corto`);
  res.json(r);
};

// Listado de equipos en temporada por filtros
exports.listar = async (req, res) => {
  const { id_temporada, id_categoria } = req.query;
  if(!Number(id_temporada)) return res.json([]);
  const params = [Number(id_temporada)];
  let where = `et.id_temporada=?`;
  if(Number(id_categoria)){ where += ` AND et.id_categoria=?`; params.push(Number(id_categoria)); }

  const r = await db.query(`
    SELECT et.id_equipo_temporada, et.id_equipo, et.id_temporada, et.id_categoria,
           et.nombre, et.colores, et.url_foto, et.id_entrenador,   -- ← aquí
           e.nombre_corto
    FROM EquipoTemporada et
    LEFT JOIN Equipos e ON e.id_equipo=et.id_equipo
    WHERE ${where}
    ORDER BY et.nombre
  `, params);
  res.json(r);
};


