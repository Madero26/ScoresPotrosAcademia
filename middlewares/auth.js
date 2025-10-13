const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const db = require('../utils/db');

const wantsJSON = req =>
  !!(req.xhr || req.get('x-requested-with') === 'XMLHttpRequest' || req.is('application/json'));

exports.isAuthenticated = async (req, res, next) => {
  try {
    const token = req.cookies?.jwt;
    if (!token) {
      return wantsJSON(req) ? res.status(401).json({ error: 'no auth' }) : res.redirect('/Login');
    }

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRETO);

    const rows = await db.query(
      'SELECT id_usuario, usuario, rol FROM UsuarioAdministradores WHERE id_usuario=? LIMIT 1',
      [decoded.id]
    );
    if (!rows.length) {
      return wantsJSON(req) ? res.status(401).json({ error: 'no auth' }) : res.redirect('/Login');
    }

    const user = rows[0];
    const temporadaId = decoded.temp ?? null;
    const categoriaId = decoded.cat ?? null;

    let alias = null;
    if (['COORDINADOR','ESTADISTICAS'].includes(user.rol) && temporadaId && categoriaId) {
      const a = await db.query(
        `SELECT alias
           FROM UsuarioRolTemporadaCategoria
          WHERE id_usuario=? AND rol=? AND id_temporada=? AND id_categoria=?
          LIMIT 1`,
        [user.id_usuario, user.rol, temporadaId, categoriaId]
      );
      alias = a[0]?.alias ?? null;
    }

    req.user = { ...user, alias };
    req.auth = { id: user.id_usuario, rol: user.rol, categoriaId, temporadaId };
    return next();

  } catch (e) {
    console.error('auth error', e);
    return wantsJSON(req) ? res.status(401).json({ error: 'no auth' }) : res.redirect('/Login');
  }
};

exports.requireRole = (...rolesPermitidos) => {
  const permitidos = rolesPermitidos.map(r => String(r).toUpperCase().trim());
  return (req, res, next) => {
    const rol = String(req.auth?.rol || req.user?.rol || '').toUpperCase().trim();
    if (!permitidos.includes(rol)) {
      return wantsJSON(req) ? res.status(403).json({ error: 'forbidden' }) : res.status(403).send('No autorizado');
    }
    next();
  };
};

exports.logout = (req, res) => {
  res.clearCookie('jwt');
  res.redirect('/Login');
};

exports.flashCookie = (res, payload) => {
  res.cookie('__alert', JSON.stringify(payload), {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 30
  });
};
