// middlewares/auth.js
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const db = require('../utils/db');

exports.isAuthenticated = async (req, res, next) => {
  try {
    const token = req.cookies?.jwt;
    if (!token) return res.redirect('/Login');

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRETO);

    // Toma el rol “oficial” desde la BD
    const rows = await db.query(
      'SELECT id_usuario, usuario, rol FROM UsuarioAdministradores WHERE id_usuario=? LIMIT 1',
      [decoded.id]
    );
    if (!rows.length) return res.redirect('/Login');

    const user = rows[0];

    req.user = user; // { id_usuario, usuario, rol }
    req.auth = {
      id: user.id_usuario,
      rol: user.rol,                  // ← SIEMPRE desde BD
      categoriaId: decoded.cat ?? null,
      temporadaId: decoded.temp ?? null
    };

    next();
  } catch (e) {
    return res.redirect('/Login');
  }
};

// Guard por rol (normaliza a mayúsculas)
exports.requireRole = (...rolesPermitidos) => {
  const permitidos = rolesPermitidos.map(r => String(r).toUpperCase().trim());
  return (req, res, next) => {
    const rol = String(req.auth?.rol || req.user?.rol || '').toUpperCase().trim();
    if (!permitidos.includes(rol)) {
      return res.status(403).send('No autorizado');
    }
    next();
  };
};

exports.logout = (req, res) => {
  res.clearCookie('jwt');
  res.redirect('/Login');
};
