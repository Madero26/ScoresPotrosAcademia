const db = require('../utils/db');

exports.listar = async (req,res)=> {
  const {id_temporada,id_jugador} = req.query;
  const r = await db.query(
    `SELECT * FROM EstadisticasRendimientoMensual WHERE id_temporada=? AND id_jugador=? ORDER BY fecha_medicion DESC`,
    [id_temporada,id_jugador]
  );
  res.json(r);
};

exports.crear = async (req,res)=> {
  const {id_temporada,id_jugador,fecha_medicion,tiempo_carrera_seg=0,vel_lanzamiento_mph=0,potencia_brazo_mph=0,pop_time_seg=0,vel_bate_mph=0} = req.body;
  if (!id_temporada||!id_jugador||!fecha_medicion) return res.status(400).json({error:'faltan campos'});
  const r = await db.query(
    `INSERT INTO EstadisticasRendimientoMensual (id_temporada,id_jugador,fecha_medicion,tiempo_carrera_seg,vel_lanzamiento_mph,potencia_brazo_mph,pop_time_seg,vel_bate_mph)
     VALUES (?,?,?,?,?,?,?,?)`,
    [id_temporada,id_jugador,fecha_medicion,tiempo_carrera_seg,vel_lanzamiento_mph,potencia_brazo_mph,pop_time_seg,vel_bate_mph]
  );
  res.json({ok:true,id:r.insertId});
};

exports.eliminar = async (req,res)=> {
  const r = await db.query(`DELETE FROM EstadisticasRendimientoMensual WHERE id_estadistica=?`, [req.params.id]);
  if (!r.affectedRows) return res.status(404).json({error:'no encontrada'}); res.json({ok:true});
};
