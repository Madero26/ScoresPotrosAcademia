// controllers/authController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { promisify } = require('util');
const db = require('../utils/db'); // debe exportar db.query(sql, params) -> Promise<Array>

// --- Helpers ---------------------------------------------------------------

/** Obtiene la temporada activa; si no hay, la más reciente. */
const getActiveTemporadaId = async () => {
  const a = await db.query(
    'SELECT id_temporada FROM Temporadas WHERE is_activa=1 ORDER BY fecha_inicio DESC LIMIT 1'
  );
  if (a.length) return a[0].id_temporada;

  const r = await db.query(
    'SELECT id_temporada FROM Temporadas ORDER BY fecha_inicio DESC LIMIT 1'
  );
  return r[0]?.id_temporada ?? null;
};

/** Crea JWT y lo setea en cookie. */
const setLoginCookie = (res, payload) => {
  const token = jwt.sign(payload, process.env.JWT_SECRETO, {
    expiresIn: process.env.JWT_TIEMPO_EXPIRA,
  });

  res.cookie('jwt', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(
      Date.now() +
        (Number(process.env.JWT_COOKIE_EXPIRES || 1) * 24 * 60 * 60 * 1000)
    ),
  });

  return token;
};

// --- Controlador -----------------------------------------------------------

/** GET /Login */
exports.viewLogin = (req, res) => {
  res.render('login'); // views/login.ejs
};

/** POST /login */
exports.login = async (req, res) => {
  try {
    const usuario = (req.body.user || '').trim();
    const pass = (req.body.pass || '').trim();

    if (!usuario || !pass) {
      return res.render('login', {
        alert: true,
        alertTitle: 'ADVERTENCIA',
        alertMessage: 'Ingrese un usuario y contraseña',
        alertIcon: 'info',
        showConfirmButton: true,
        timer: false,
        ruta: 'Login',
      });
    }

    // 1) Usuario
    const rows = await db.query(
      'SELECT * FROM UsuarioAdministradores WHERE usuario=? LIMIT 1',
      [usuario]
    );
    if (!rows.length) {
      return res.render('login', {
        alert: true,
        alertTitle: 'ADVERTENCIA',
        alertMessage: 'Usuario y/o password incorrectos',
        alertIcon: 'info',
        showConfirmButton: true,
        timer: false,
        ruta: 'Login',
      });
    }

    const u = rows[0];

    // 2) Password (hash o texto plano en desarrollo)
    let ok = false;
    try {
      ok = await bcrypt.compare(pass, u.contra);
    } catch {
      // si la contraseña almacenada no está hasheada
      ok = pass === u.contra;
    }

    if (!ok) {
      return res.render('login', {
        alert: true,
        alertTitle: 'ADVERTENCIA',
        alertMessage: 'Usuario y/o password incorrectos',
        alertIcon: 'info',
        showConfirmButton: true,
        timer: false,
        ruta: 'Login',
      });
    }

    // 3) Temporada activa
    const temporadaId = await getActiveTemporadaId();

    // 4) Categoría asignada si es COORDINADOR o ESTADISTICAS
    let categoriaId = null;
    if (['COORDINADOR', 'ESTADISTICAS'].includes(u.rol) && temporadaId) {
      const map = await db.query(
        `SELECT id_categoria
           FROM UsuarioRolTemporadaCategoria
          WHERE id_usuario=? AND rol=? AND id_temporada=?
          LIMIT 1`,
        [u.id_usuario, u.rol, temporadaId]
      );
      categoriaId = map[0]?.id_categoria ?? null;
    }

    // 5) Token con info útil
    const payload = {
      id: u.id_usuario,
      rol: u.rol,
      temp: temporadaId,
      cat: categoriaId,
    };
    setLoginCookie(res, payload);

    // 6) Redirección por rol a su página de inicio
    let ruta = '/';
    if (u.rol === 'ADMIN') ruta = '/AdminGeneral/inicio';
    else if (u.rol === 'COORDINADOR') ruta = '/Coordinacion/inicio';
    else if (u.rol === 'ESTADISTICAS') ruta = '/AdminEstadisticas/inicio';

    return res.render('login', {
      alert: true,
      alertTitle: 'Conexión exitosa',
      alertMessage: '¡Bienvenido!',
      alertIcon: 'success',
      showConfirmButton: false,
      timer: 800,
      ruta,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.render('login', {
      alert: true,
      alertTitle: 'Error',
      alertMessage: 'Ocurrió un problema. Intenta de nuevo.',
      alertIcon: 'error',
      showConfirmButton: true,
      timer: false,
      ruta: 'Login',
    });
  }
};

/** Middleware para proteger rutas y filtrar por rol */
exports.ensureRole = (...roles) => {
  return async (req, res, next) => {
    try {
      const token = req.cookies?.jwt;
      if (!token) return res.redirect('/Login');

      const decoded = await promisify(jwt.verify)(
        token,
        process.env.JWT_SECRETO
      );

      // Carga ligera del usuario para vistas, si lo necesitas
      const users = await db.query(
        'SELECT id_usuario, usuario, rol FROM UsuarioAdministradores WHERE id_usuario=?',
        [decoded.id]
      );
      req.user = users[0] || null;
      req.auth = {
        id: decoded.id,
        rol: decoded.rol,
        temporadaId: decoded.temp ?? null,
        categoriaId: decoded.cat ?? null,
      };

      if (roles.length && !roles.includes(decoded.rol)) {
        return res.status(403).send('Acceso denegado');
      }
      return next();
    } catch {
      return res.redirect('/Login');
    }
  };
};

/** GET /logout */
exports.logout = (req, res) => {
  res.clearCookie('jwt');
  res.redirect('/Login');
};


