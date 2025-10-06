// MySQL (no mysql2)
const mysql = require('mysql');
const util  = require('util');

const DB_NAME = process.env.DB_NAME || process.env.DB_DATABASE || 'academia_bd';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || process.env.DB_PASSWORD || '',
  database: DB_NAME,
  connectionLimit: 10,
  multipleStatements: true,
  timezone: 'Z'
});

// Promisify para usar await
pool.query = util.promisify(pool.query);

// Prueba conexión al iniciar
pool.getConnection((err, conn) => {
  if (err) return console.error('DB connect error:', err.message);
  conn.ping(e => {
    if (e) console.error('DB ping error:', e.message);
    else console.log('DB ok ->', DB_NAME);
    conn.release();
  });
});

module.exports = pool;
