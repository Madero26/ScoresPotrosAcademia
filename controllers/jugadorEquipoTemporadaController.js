const db = require('../utils/db');

exports.listar = async (req,res)=> {
  const {id_equipo_temporada} = req.query;
  const r = await db.query(
    `SELECT jet.*, j.nombres, j.apellido_paterno
     FROM JugadorEquipoTemporada jet
     JOIN Jugadores j ON j.id_jugador=jet.id_jugador
     WHERE jet.id_equipo_temporada=?
     ORDER BY j.apellido_paterno, j.apellido_materno, j.nombres`,
    [id_equipo_temporada]
  );
  res.json(r);
};

exports.crear = async (req,res)=> {
  const {id_jugador,id_equipo_temporada,fecha_alta=null} = req.body;
  if (!id_jugador||!id_equipo_temporada) return res.status(400).json({error:'faltan campos'});
  const dup = await db.query(`SELECT 1 FROM JugadorEquipoTemporada WHERE id_jugador=? AND id_equipo_temporada=?`, [id_jugador,id_equipo_temporada]);
  if (dup.length) return res.status(409).json({error:'duplicado'});
  const r = await db.query(
    `INSERT INTO JugadorEquipoTemporada (id_jugador,id_equipo_temporada,fecha_alta) VALUES (?,?,?)`,
    [id_jugador,id_equipo_temporada,fecha_alta]
  );
  res.json({ok:true,id:r.insertId});
};

exports.actualizar = async (req,res)=> {
  const {fecha_alta=null,fecha_baja=null} = req.body;
  const r = await db.query(
    `UPDATE JugadorEquipoTemporada SET fecha_alta=?, fecha_baja=? WHERE id=?`,
    [fecha_alta,fecha_baja, req.params.id]
  );
  if (!r.affectedRows) return res.status(404).json({error:'no encontrado'}); res.json({ok:true});
};

exports.eliminar = async (req,res)=> {
  const r = await db.query(`DELETE FROM JugadorEquipoTemporada WHERE id=?`, [req.params.id]);
  if (!r.affectedRows) return res.status(404).json({error:'no encontrado'}); res.json({ok:true});
};
