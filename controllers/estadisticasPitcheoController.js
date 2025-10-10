const db = require('../utils/db');

exports.listar = async (req,res)=> {
  const {id_temporada} = req.query;
  const r = await db.query(
    `SELECT ept.*, j.nombres, j.apellido_paterno
     FROM EstadisticasPitcheoTemporada ept
     JOIN Jugadores j ON j.id_jugador=ept.id_jugador
     WHERE ept.id_temporada=? ORDER BY ept.efectividad ASC`,
    [id_temporada]
  );
  res.json(r);
};

exports.upsert = async (req,res)=> {
  const {id_temporada,id_jugador,id_equipo_temporada=null,bases_por_bolas=0,victorias=0,derrotas=0,entradas_lanzadas=0.0,carreras_limpias=0,ponches=0} = req.body;
  if (!id_temporada||!id_jugador) return res.status(400).json({error:'faltan claves'});
  const exist = await db.query(`SELECT id_estadistica FROM EstadisticasPitcheoTemporada WHERE id_temporada=? AND id_jugador=?`, [id_temporada,id_jugador]);
  if (exist.length){
    await db.query(
      `UPDATE EstadisticasPitcheoTemporada SET id_equipo_temporada=?, bases_por_bolas=?, victorias=?, derrotas=?, entradas_lanzadas=?, carreras_limpias=?, ponches=? WHERE id_estadistica=?`,
      [id_equipo_temporada,bases_por_bolas,victorias,derrotas,entradas_lanzadas,carreras_limpias,ponches, exist[0].id_estadistica]
    );
    return res.json({ok:true, id: exist[0].id_estadistica});
  }
  const r = await db.query(
    `INSERT INTO EstadisticasPitcheoTemporada (id_temporada,id_jugador,id_equipo_temporada,bases_por_bolas,victorias,derrotas,entradas_lanzadas,carreras_limpias,ponches)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [id_temporada,id_jugador,id_equipo_temporada,bases_por_bolas,victorias,derrotas,entradas_lanzadas,carreras_limpias,ponches]
  );
  res.json({ok:true,id:r.insertId});
};
