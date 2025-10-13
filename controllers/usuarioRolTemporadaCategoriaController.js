const db = require('../utils/db');
const wantsJSON = req => !!(req.xhr || req.get('x-requested-with')==='XMLHttpRequest' || req.is('application/json'));

const backCrear = '/adminGeneral/formAsignarUsuarioRolAlias';
const backUpd   = '/adminGeneral/formActualizarUsuarioRolAlias';

/* ===== Formularios ===== */
exports.formCrear = async (_req,res)=>{
  const temporadas = await db.query(`SELECT id_temporada,nombre FROM Temporadas ORDER BY fecha_inicio DESC`);
  res.render('Coordinacion/General/Crear/formAsignarUsuarioRolAlias', { ...res.locals, temporadas });
};
exports.formActualizar = async (_req,res)=>{
  const temporadas = await db.query(`SELECT id_temporada,nombre FROM Temporadas ORDER BY fecha_inicio DESC`);
  res.render('Coordinacion/General/Actualizar/formActualizarUsuarioRolAlias', { ...res.locals, temporadas });
};

/* ===== Filtros ===== */
// Categorías de la temporada con al menos un rol disponible
exports.categoriasDisponibles = async (req,res)=>{
  const { id_temporada } = req.query;
  if (!Number(id_temporada)) return res.json([]);
  const r = await db.query(`
    SELECT c.id_categoria, c.nombre_categoria AS nombre
    FROM CategoriaTemporadaRango ctr
    JOIN Categorias c ON c.id_categoria=ctr.id_categoria
    LEFT JOIN (
      SELECT id_categoria,
             SUM(rol='COORDINADOR') AS tiene_coord,
             SUM(rol='ESTADISTICAS') AS tiene_stats
      FROM UsuarioRolTemporadaCategoria
      WHERE id_temporada=?
      GROUP BY id_categoria
    ) u ON u.id_categoria=c.id_categoria
    WHERE ctr.id_temporada=? AND (u.id_categoria IS NULL OR (u.tiene_coord=0 OR u.tiene_stats=0))
    ORDER BY c.edad_min, c.nombre_categoria
  `,[Number(id_temporada), Number(id_temporada)]);
  res.json(r);
};

// Usuarios elegibles: base rol COORDINADOR/ESTADISTICAS y sin vínculo en esa temporada
exports.usuariosElegibles = async (req,res)=>{
  const { id_temporada, q='' } = req.query;
  if (!Number(id_temporada)) return res.json([]);
  const r = await db.query(`
    SELECT ua.id_usuario,
           ua.rol,
           ua.usuario AS nombre
    FROM UsuarioAdministradores ua
    LEFT JOIN (
      SELECT DISTINCT id_usuario
      FROM UsuarioRolTemporadaCategoria
      WHERE id_temporada=?
    ) x ON x.id_usuario=ua.id_usuario
    WHERE x.id_usuario IS NULL
      AND ua.rol IN ('COORDINADOR','ESTADISTICAS')
      AND (?='' OR ua.usuario LIKE CONCAT('%',?,'%'))
    ORDER BY ua.usuario
    LIMIT 200
  `,[Number(id_temporada), q, q]);
  res.json(r);
};

// Lista por temporada+categoría para actualizar
exports.listar = async (req,res)=>{
  const { id_temporada, id_categoria } = req.query;
  if (!(Number(id_temporada)&&Number(id_categoria))) return res.json([]);
  const r = await db.query(`
    SELECT urtc.id, urtc.id_usuario, urtc.rol, urtc.alias,
           ua.usuario
    FROM UsuarioRolTemporadaCategoria urtc
    JOIN UsuarioAdministradores ua ON ua.id_usuario=urtc.id_usuario
    WHERE urtc.id_temporada=? AND urtc.id_categoria=?
    ORDER BY FIELD(urtc.rol,'COORDINADOR','ESTADISTICAS'), ua.usuario
  `,[Number(id_temporada),Number(id_categoria)]);
  res.json(r);
};

exports.obtener = async (req,res)=>{
  const r = await db.query(`SELECT * FROM UsuarioRolTemporadaCategoria WHERE id=? LIMIT 1`,[req.params.id]);
  if(!r.length) return res.status(404).json({error:'no encontrado'});
  res.json(r[0]);
};

/* ===== CRUD ===== */
exports.crear = async (req,res)=>{
  try{
    const { id_temporada, id_categoria, id_usuario, alias } = req.body;
    const ok = Number(id_temporada)&&Number(id_categoria)&&Number(id_usuario)&&String(alias||'').trim();
    if(!ok) return wantsJSON(req)?res.status(400).json({error:'faltan o inválidos'})
      : res.flash({alertTitle:'Datos inválidos',alertMessage:'Temporada, categoría, usuario y alias son obligatorios.',
                   alertIcon:'warning',showConfirmButton:true,timer:null,ruta:backCrear}, backCrear);

    // rol del usuario
    const u = await db.query(`SELECT rol FROM UsuarioAdministradores WHERE id_usuario=? AND rol IN ('COORDINADOR','ESTADISTICAS') LIMIT 1`,[id_usuario]);
    if(!u.length) return wantsJSON(req)?res.status(400).json({error:'usuario no elegible'})
      : res.flash({alertTitle:'Inválido',alertMessage:'El usuario no es coordinador ni estadísticas.',
                   alertIcon:'warning',showConfirmButton:true,timer:null,ruta:backCrear}, backCrear);
    const rol = u[0].rol;

    // no duplicar mismo rol en la categoría-temporada
    const filled = await db.query(
      `SELECT 1 FROM UsuarioRolTemporadaCategoria WHERE id_temporada=? AND id_categoria=? AND rol=? LIMIT 1`,
      [id_temporada,id_categoria,rol]
    );
    if (filled.length)
      return wantsJSON(req)?res.status(409).json({error:`Ya existe ${rol.toLowerCase()} en esa categoría`})
        : res.flash({alertTitle:'No permitido',alertMessage:`Ya existe ${rol.toLowerCase()} en esa categoría.`,
                     alertIcon:'warning',showConfirmButton:true,timer:null,ruta:backCrear}, backCrear);

    // usuario no debe tener vínculo en la misma temporada
    const clash = await db.query(
      `SELECT 1 FROM UsuarioRolTemporadaCategoria WHERE id_temporada=? AND id_usuario=? LIMIT 1`,
      [id_temporada,id_usuario]
    );
    if (clash.length)
      return wantsJSON(req)?res.status(409).json({error:'El usuario ya tiene asignación en esta temporada'})
        : res.flash({alertTitle:'No permitido',alertMessage:'El usuario ya tiene asignación en esta temporada.',
                     alertIcon:'warning',showConfirmButton:true,timer:null,ruta:backCrear}, backCrear);

    await db.query(
      `INSERT INTO UsuarioRolTemporadaCategoria (id_usuario,rol,id_temporada,id_categoria,alias)
       VALUES (?,?,?,?,?)`,
      [id_usuario,rol,id_temporada,id_categoria,String(alias).trim()]
    );

    return wantsJSON(req)?res.json({ok:true})
      : res.flash({alertTitle:'Listo',alertMessage:'Vinculación creada.',
                   alertIcon:'success',showConfirmButton:false,timer:1200,ruta:backCrear}, backCrear);
  }catch(e){
    console.error(e);
    return wantsJSON(req)?res.status(500).json({error:'error'})
      : res.flash({alertTitle:'Error',alertMessage:'No se pudo crear la vinculación.',
                   alertIcon:'error',showConfirmButton:true,timer:null,ruta:backCrear}, backCrear);
  }
};

exports.actualizar = async (req,res)=>{
  const { id } = req.params;
  try{
    const { alias } = req.body;
    if (!String(alias||'').trim())
      return wantsJSON(req)?res.status(400).json({error:'alias requerido'})
        : res.flash({alertTitle:'Datos inválidos',alertMessage:'Alias requerido.',
                     alertIcon:'warning',showConfirmButton:true,timer:null,ruta:backUpd}, backUpd);

    const r = await db.query(`UPDATE UsuarioRolTemporadaCategoria SET alias=? WHERE id=?`, [String(alias).trim(), id]);
    if (!r.affectedRows)
      return wantsJSON(req)?res.status(404).json({error:'no encontrado'})
        : res.flash({alertTitle:'No encontrado',alertMessage:'La vinculación no existe.',
                     alertIcon:'error',showConfirmButton:true,timer:null,ruta:backUpd}, backUpd);

    return wantsJSON(req)?res.json({ok:true})
      : res.flash({alertTitle:'Actualizado',alertMessage:'Alias actualizado.',
                   alertIcon:'success',showConfirmButton:false,timer:1200,ruta:backUpd}, backUpd);
  }catch(e){
    console.error(e);
    return wantsJSON(req)?res.status(500).json({error:'error'})
      : res.flash({alertTitle:'Error',alertMessage:'No se pudo actualizar.',
                   alertIcon:'error',showConfirmButton:true,timer:null,ruta:backUpd}, backUpd);
  }
};

exports.eliminar = async (req,res)=>{
  const back = '/adminGeneral/formActualizarUsuarioRolAlias';
  try{
    const r = await db.query(`DELETE FROM UsuarioRolTemporadaCategoria WHERE id=?`,[req.params.id]);
    if(!r.affectedRows)
      return wantsJSON(req)?res.status(404).json({error:'no encontrado'})
        : res.flash({alertTitle:'No encontrado',alertMessage:'La vinculación no existe.',
                     alertIcon:'error',showConfirmButton:true,timer:null,ruta:back}, back);

    return wantsJSON(req)?res.json({ok:true})
      : res.flash({alertTitle:'Eliminado',alertMessage:'Vinculación eliminada.',
                   alertIcon:'success',showConfirmButton:false,timer:1200,ruta:back}, back);
  }catch(e){
    console.error(e);
    return wantsJSON(req)?res.status(500).json({error:'error'})
      : res.flash({alertTitle:'Error',alertMessage:'No se pudo eliminar.',
                   alertIcon:'error',showConfirmButton:true,timer:null,ruta:back}, back);
  }
};

