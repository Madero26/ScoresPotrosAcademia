const db = require('../utils/db');

exports.listar = async (req,res)=> {
  const {id_temporada} = req.query;
  const r = await db.query(
    `SELECT ctr.*, c.nombre_categoria FROM CategoriaTemporadaRango ctr
     JOIN Categorias c ON c.id_categoria=ctr.id_categoria
     ${id_temporada?'WHERE ctr.id_temporada=?':''}
     ORDER BY c.edad_min`, id_temporada?[id_temporada]:[]
  );
  res.json(r);
};

exports.crear = async (req,res)=> {
  const {id_temporada,id_categoria,nacimiento_desde,nacimiento_hasta} = req.body;
  if (!id_temporada||!id_categoria||!nacimiento_desde||!nacimiento_hasta) return res.status(400).json({error:'faltan campos'});
  const dup = await db.query(`SELECT 1 FROM CategoriaTemporadaRango WHERE id_temporada=? AND id_categoria=?`, [id_temporada,id_categoria]);
  if (dup.length) return res.status(409).json({error:'ya existe'});
  const r = await db.query(
    `INSERT INTO CategoriaTemporadaRango (id_temporada,id_categoria,nacimiento_desde,nacimiento_hasta) VALUES (?,?,?,?)`,
    [id_temporada,id_categoria,nacimiento_desde,nacimiento_hasta]
  );
  res.json({ok:true,id:r.insertId});
};

exports.actualizar = async (req,res)=> {
  const {nacimiento_desde,nacimiento_hasta} = req.body;
  const r = await db.query(
    `UPDATE CategoriaTemporadaRango SET nacimiento_desde=?, nacimiento_hasta=? WHERE id=?`,
    [nacimiento_desde,nacimiento_hasta, req.params.id]
  );
  if (!r.affectedRows) return res.status(404).json({error:'no encontrado'}); res.json({ok:true});
};

exports.eliminar = async (req,res)=> {
  const r = await db.query(`DELETE FROM CategoriaTemporadaRango WHERE id=?`, [req.params.id]);
  if (!r.affectedRows) return res.status(404).json({error:'no encontrado'}); res.json({ok:true});
};
