const { pool } = require('../utils/db');

module.exports = async function temporadaActiva(req, res, next) {
  try {
    const [r] = await pool.query(
      'SELECT id_temporada FROM Temporadas WHERE is_activa=1 LIMIT 1'
    );
    req.idTempActiva = r.length ? r[0].id_temporada : null;
    next();
  } catch (e) { next(e); }
};
