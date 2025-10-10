// Rutas/index.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const nocache = require('../middlewares/nocache');
const adminGeneralRouter = require('./adminGeneral');
router.get('/', (req, res) => res.render('index'));
const authCtrl = require('../controllers/authController');

router.use('/Estadisticas', require('./estadisticas'));
router.use('/JugadoresD', require('./jugadoresDestacados'));
router.use('/Standing', require('./standing'));
router.use('/Coord', require('./coordinador'));


// Login (el modal del navbar apunta a /Login)
router.use('/', require('./auth'));

// Rutas/index.js o router.js
const adminGeneral = require('./adminGeneral');
router.use('/adminGeneral', auth.isAuthenticated, auth.requireRole('ADMIN'), nocache, adminGeneral);


router.get('/Coordinacion/inicio',
  auth.isAuthenticated, auth.requireRole('COORDINADOR'), nocache,
  (req, res) => res.render('Coordinacion/Coordinador/inicio', { usuario: req.user })
);

router.get('/AdminEstadisticas/inicio',
  auth.isAuthenticated, auth.requireRole('ESTADISTICAS'), nocache,
  (req, res) => res.render('Coordinacion/Estadisticas/inicio', { usuario: req.user })
);


// Form cambiar contraseña
router.get('/AdminContra', auth.isAuthenticated, authCtrl.renderCambiarContra);
// Post cambiar contraseña
router.post('/AdminContra', auth.isAuthenticated, authCtrl.cambiarContra);

module.exports = router;



