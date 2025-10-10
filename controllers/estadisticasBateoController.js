const db = require('../utils/db');

exports.obtener = async (req,res)=> {
  const r = await db.query(`SELECT * FROM EstadisticasBateoTemporada WHERE id_estadistica=?`, [req.params.id]);
  if (!r.length) return res.status(404).json({error:'no encontrada'}); res.json(r[0]);
};

exports.listar = async (req,res)=> {
  const {id_temporada} = req.query;
  const r = await db.query(
    `SELECT ebt.*, j.nombres, j.apellido_paterno
     FROM EstadisticasBateoTemporada ebt
     JOIN Jugadores j ON j.id_jugador=ebt.id_jugador
     WHERE ebt.id_temporada=? ORDER BY ebt.promedio_bateo DESC`,
    [id_temporada]
  );
  res.json(r);
};

exports.upsert = async (req,res)=> {
  const {id_temporada,id_jugador,id_equipo_temporada=null,apariciones_al_bat=0,hits=0,bases_por_bolas=0,carreras=0,carreras_producidas=0,sencillos=0,dobles=0,triples=0,home_runs=0,bases_robadas=0} = req.body;
  if (!id_temporada||!id_jugador) return res.status(400).json({error:'faltan claves'});
  const exist = await db.query(`SELECT id_estadistica FROM EstadisticasBateoTemporada WHERE id_temporada=? AND id_jugador=?`, [id_temporada,id_jugador]);
  if (exist.length){
    await db.query(
      `UPDATE EstadisticasBateoTemporada SET id_equipo_temporada=?, apariciones_al_bat=?, hits=?, bases_por_bolas=?, carreras=?, carreras_producidas=?, sencillos=?, dobles=?, triples=?, home_runs=?, bases_robadas=? WHERE id_estadistica=?`,
      [id_equipo_temporada,apariciones_al_bat,hits,bases_por_bolas,carreras,carreras_producidas,sencillos,dobles,triples,home_runs,bases_robadas, exist[0].id_estadistica]
    );
    return res.json({ok:true, id: exist[0].id_estadistica});
  }
  const r = await db.query(
    `INSERT INTO EstadisticasBateoTemporada (id_temporada,id_jugador,id_equipo_temporada,apariciones_al_bat,hits,bases_por_bolas,carreras,carreras_producidas,sencillos,dobles,triples,home_runs,bases_robadas)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [id_temporada,id_jugador,id_equipo_temporada,apariciones_al_bat,hits,bases_por_bolas,carreras,carreras_producidas,sencillos,dobles,triples,home_runs,bases_robadas]
  );
  res.json({ok:true,id:r.insertId});
};
