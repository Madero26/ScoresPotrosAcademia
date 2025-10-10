const db = require('../utils/db');

exports.listar = async (req,res)=> {
  const {id_temporada,id_categoria} = req.query;
  const r = await db.query(
    `SELECT jtc.*, j.nombres, j.apellido_paterno, c.nombre_categoria
     FROM JugadorTemporadaCategoria jtc
     JOIN Jugadores j ON j.id_jugador=jtc.id_jugador
     JOIN Categorias c ON c.id_categoria=jtc.id_categoria
     WHERE jtc.id_temporada=? ${id_categoria?'AND jtc.id_categoria=?':''}
     ORDER BY j.apellido_paterno, j.apellido_materno, j.nombres`,
     id_categoria?[id_temporada,id_categoria]:[id_temporada]
  );
  res.json(r);
};

exports.crear = async (req,res)=> {
  const {id_jugador,id_temporada,id_categoria,asignado_automatico=1} = req.body;
  if (!id_jugador||!id_temporada||!id_categoria) return res.status(400).json({error:'faltan campos'});
  const dup = await db.query(`SELECT 1 FROM JugadorTemporadaCategoria WHERE id_jugador=? AND id_temporada=?`, [id_jugador,id_temporada]);
  if (dup.length) return res.status(409).json({error:'ya tiene categoría en la temporada'});
  const r = await db.query(
    `INSERT INTO JugadorTemporadaCategoria (id_jugador,id_temporada,id_categoria,asignado_automatico) VALUES (?,?,?,?)`,
    [id_jugador,id_temporada,id_categoria, asignado_automatico?1:0]
  );
  res.json({ok:true,id:r.insertId});
};

exports.actualizar = async (req,res)=> {
  const {id_categoria,asignado_automatico=1} = req.body;
  const r = await db.query(
    `UPDATE JugadorTemporadaCategoria SET id_categoria=?, asignado_automatico=? WHERE id=?`,
    [id_categoria, asignado_automatico?1:0, req.params.id]
  );
  if (!r.affectedRows) return res.status(404).json({error:'no encontrado'}); res.json({ok:true});
};

exports.eliminar = async (req,res)=> {
  const r = await db.query(`DELETE FROM JugadorTemporadaCategoria WHERE id=?`, [req.params.id]);
  if (!r.affectedRows) return res.status(404).json({error:'no encontrado'}); res.json({ok:true});
};
