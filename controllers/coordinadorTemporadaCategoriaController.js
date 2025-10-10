const db = require('../utils/db');

exports.listar = async (req,res)=> {
  const {id_temporada} = req.query;
  const r = await db.query(
    `SELECT a.*, c.nombre_categoria, co.nombres, co.apellido_paterno
     FROM CoordinadorTemporadaCategoria a
     JOIN Categorias c ON c.id_categoria=a.id_categoria
     JOIN Coordinadores co ON co.id_coordinador=a.id_coordinador
     ${id_temporada?'WHERE a.id_temporada=?':''}
     ORDER BY c.edad_min`, id_temporada?[id_temporada]:[]
  );
  res.json(r);
};

exports.crear = async (req,res)=> {
  const {id_coordinador,id_temporada,id_categoria} = req.body;
  if (!id_coordinador||!id_temporada||!id_categoria) return res.status(400).json({error:'faltan campos'});
  const dup = await db.query(`SELECT 1 FROM CoordinadorTemporadaCategoria WHERE id_temporada=? AND id_categoria=?`, [id_temporada,id_categoria]);
  if (dup.length) return res.status(409).json({error:'ya asignado'});
  const r = await db.query(
    `INSERT INTO CoordinadorTemporadaCategoria (id_coordinador,id_temporada,id_categoria) VALUES (?,?,?)`,
    [id_coordinador,id_temporada,id_categoria]
  );
  res.json({ok:true,id:r.insertId});
};

exports.eliminar = async (req,res)=> {
  const r = await db.query(`DELETE FROM CoordinadorTemporadaCategoria WHERE id=?`, [req.params.id]);
  if (!r.affectedRows) return res.status(404).json({error:'no encontrado'}); res.json({ok:true});
};
