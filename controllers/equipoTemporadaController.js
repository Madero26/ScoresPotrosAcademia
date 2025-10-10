const db = require('../utils/db');

exports.listar = async (req,res)=> {
  const {id_temporada,id_categoria} = req.query;
  let sql = `SELECT et.*, e.nombre_corto, c.nombre_categoria
             FROM EquipoTemporada et
             LEFT JOIN Equipos e ON e.id_equipo=et.id_equipo
             JOIN Categorias c ON c.id_categoria=et.id_categoria
             WHERE 1=1`, params=[];
  if (id_temporada){ sql+=` AND et.id_temporada=?`; params.push(id_temporada); }
  if (id_categoria){ sql+=` AND et.id_categoria=?`; params.push(id_categoria); }
  sql+=` ORDER BY c.edad_min, et.nombre`;
  res.json(await db.query(sql, params));
};

exports.crear = async (req,res)=> {
  const {id_equipo=null,id_temporada,id_categoria,nombre,colores,url_foto=null,id_entrenador=null} = req.body;
  if (!id_temporada||!id_categoria||!nombre||!colores) return res.status(400).json({error:'faltan campos'});
  const dup = await db.query(
    `SELECT 1 FROM EquipoTemporada WHERE id_temporada=? AND id_categoria=? AND nombre=?`,
    [id_temporada,id_categoria,nombre]
  );
  if (dup.length) return res.status(409).json({error:'duplicado'});
  const r = await db.query(
    `INSERT INTO EquipoTemporada (id_equipo,id_temporada,id_categoria,nombre,colores,url_foto,id_entrenador)
     VALUES (?,?,?,?,?,?,?)`,
    [id_equipo,id_temporada,id_categoria,nombre,colores,url_foto,id_entrenador]
  );
  res.json({ok:true,id:r.insertId});
};

exports.actualizar = async (req,res)=> {
  const {id_equipo=null,id_temporada,id_categoria,nombre,colores,url_foto=null,id_entrenador=null} = req.body;
  const dup = await db.query(
    `SELECT 1 FROM EquipoTemporada WHERE id_temporada=? AND id_categoria=? AND nombre=? AND id_equipo_temporada<>?`,
    [id_temporada,id_categoria,nombre, req.params.id]
  );
  if (dup.length) return res.status(409).json({error:'duplicado'});
  const r = await db.query(
    `UPDATE EquipoTemporada SET id_equipo=?, id_temporada=?, id_categoria=?, nombre=?, colores=?, url_foto=?, id_entrenador=? WHERE id_equipo_temporada=?`,
    [id_equipo,id_temporada,id_categoria,nombre,colores,url_foto,id_entrenador, req.params.id]
  );
  if (!r.affectedRows) return res.status(404).json({error:'no encontrado'}); res.json({ok:true});
};

exports.eliminar = async (req,res)=> {
  const r = await db.query(`DELETE FROM EquipoTemporada WHERE id_equipo_temporada=?`, [req.params.id]);
  if (!r.affectedRows) return res.status(404).json({error:'no encontrado'}); res.json({ok:true});
};
