const db = require('../utils/db');

exports.listar = async (req,res)=> {
  const {id_temporada} = req.query;
  const r = await db.query(
    `SELECT urtc.*, ua.usuario, c.nombre_categoria
     FROM UsuarioRolTemporadaCategoria urtc
     JOIN UsuarioAdministradores ua ON ua.id_usuario=urtc.id_usuario
     JOIN Categorias c ON c.id_categoria=urtc.id_categoria
     ${id_temporada?'WHERE urtc.id_temporada=?':''}
     ORDER BY c.edad_min`, id_temporada?[id_temporada]:[]
  );
  res.json(r);
};

exports.crear = async (req,res)=> {
  const {id_usuario,rol,id_temporada,id_categoria,alias} = req.body;
  if (!id_usuario||!rol||!id_temporada||!id_categoria||!alias) return res.status(400).json({error:'faltan campos'});
  const dup = await db.query(
    `SELECT 1 FROM UsuarioRolTemporadaCategoria WHERE rol=? AND id_temporada=? AND id_categoria=?`,
    [rol,id_temporada,id_categoria]
  );
  if (dup.length) return res.status(409).json({error:'rol ocupado'});
  const r = await db.query(
    `INSERT INTO UsuarioRolTemporadaCategoria (id_usuario,rol,id_temporada,id_categoria,alias) VALUES (?,?,?,?,?)`,
    [id_usuario,rol,id_temporada,id_categoria,alias]
  );
  res.json({ok:true,id:r.insertId});
};

exports.eliminar = async (req,res)=> {
  const r = await db.query(`DELETE FROM UsuarioRolTemporadaCategoria WHERE id=?`, [req.params.id]);
  if (!r.affectedRows) return res.status(404).json({error:'no encontrado'}); res.json({ok:true});
};
