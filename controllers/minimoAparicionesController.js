const db = require('../utils/db');

exports.obtener = async (req,res)=> {
  const r = await db.query(`SELECT * FROM MinimoAparicionesBateoTemporada WHERE id_temporada=?`, [req.params.id_temporada]);
  res.json(r[0] || null);
};

exports.upsert = async (req,res)=> {
  const {id_temporada, habilitado=1, min_apariciones=0} = req.body;
  if (!id_temporada) return res.status(400).json({error:'faltan campos'});
  const e = await db.query(`SELECT id FROM MinimoAparicionesBateoTemporada WHERE id_temporada=?`, [id_temporada]);
  if (e.length){
    await db.query(`UPDATE MinimoAparicionesBateoTemporada SET habilitado=?, min_apariciones=? WHERE id_temporada=?`,
      [habilitado?1:0, min_apariciones, id_temporada]);
    return res.json({ok:true,id:e[0].id});
  }
  const r = await db.query(
    `INSERT INTO MinimoAparicionesBateoTemporada (id_temporada,habilitado,min_apariciones) VALUES (?,?,?)`,
    [id_temporada, habilitado?1:0, min_apariciones]
  );
  res.json({ok:true,id:r.insertId});
};
