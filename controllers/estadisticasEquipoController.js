const db = require('../utils/db');

exports.upsert = async (req,res)=> {
  const {id_temporada,id_equipo_temporada,carreras_en_contra=0,carreras_a_favor=0,ganados=0,perdidos=0,empatados=0,errores=0} = req.body;
  if (!id_temporada||!id_equipo_temporada) return res.status(400).json({error:'faltan claves'});
  const e = await db.query(`SELECT id_estadistica FROM EstadisticasEquipoTemporada WHERE id_temporada=? AND id_equipo_temporada=?`, [id_temporada,id_equipo_temporada]);
  if (e.length){
    await db.query(
      `UPDATE EstadisticasEquipoTemporada SET carreras_en_contra=?, carreras_a_favor=?, ganados=?, perdidos=?, empatados=?, errores=? WHERE id_estadistica=?`,
      [carreras_en_contra,carreras_a_favor,ganados,perdidos,empatados,errores, e[0].id_estadistica]
    );
    return res.json({ok:true,id:e[0].id_estadistica});
  }
  const r = await db.query(
    `INSERT INTO EstadisticasEquipoTemporada (id_temporada,id_equipo_temporada,carreras_en_contra,carreras_a_favor,ganados,perdidos,empatados,errores)
     VALUES (?,?,?,?,?,?,?,?)`,
    [id_temporada,id_equipo_temporada,carreras_en_contra,carreras_a_favor,ganados,perdidos,empatados,errores]
  );
  res.json({ok:true,id:r.insertId});
};

