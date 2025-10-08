// Rutas/index.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const nocache = require('../middlewares/nocache');
router.get('/', (req, res) => res.render('index'));

router.use('/Estadisticas', require('./estadisticas'));
router.use('/JugadoresD', require('./jugadoresDestacados'));
router.use('/Standing', require('./standing'));
router.use('/Coord', require('./coordinador'));


// Login (el modal del navbar apunta a /Login)
router.use('/', require('./auth'));

router.get('/AdminGeneral/inicio',
  auth.isAuthenticated, auth.requireRole('ADMIN'), nocache,
  (req, res) => res.render('Coordinacion/General/inicio', { usuario: req.user })
);

router.get('/Coordinacion/inicio',
  auth.isAuthenticated, auth.requireRole('COORDINADOR'), nocache,
  (req, res) => res.render('Coordinacion/Coordinador/inicio', { usuario: req.user })
);

router.get('/AdminEstadisticas/inicio',
  auth.isAuthenticated, auth.requireRole('ESTADISTICAS'), nocache,
  (req, res) => res.render('Coordinacion/Estadisticas/inicio', { usuario: req.user })
);

module.exports = router;



