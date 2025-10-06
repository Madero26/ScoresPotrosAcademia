// utils/db.js
const pool = require('../database/conexion'); // tu pool existente

exports.query = (sql, params = []) =>
  new Promise((resolve, reject) => {
    pool.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });

