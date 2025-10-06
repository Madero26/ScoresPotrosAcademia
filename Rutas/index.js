// Rutas/index.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');

router.get('/', (req, res) => res.render('index'));

router.use('/Estadisticas', require('./estadisticas'));
router.use('/JugadoresD', require('./jugadoresDestacados'));
router.use('/Standing', require('./standing'));
router.use('/Coord', require('./coordinador'));


// Login (el modal del navbar apunta a /Login)
router.use('/', require('./auth'));

// ADMIN
router.get('/AdminGeneral/inicio',
  auth.isAuthenticated,
  auth.requireRole('ADMIN'),
  (req, res) => res.render('Coordinacion/General/inicio', { usuario: req.user })
);

// COORDINADOR
router.get('/Coordinacion/inicio',
  auth.isAuthenticated,
  auth.requireRole('COORDINADOR'),
  (req, res) => res.render('Coordinacion/Coordinador/inicio', { usuario: req.user })
);

// ESTADÍSTICAS
router.get('/AdminEstadisticas/inicio',
  auth.isAuthenticated,
  auth.requireRole('ESTADISTICAS'),
  (req, res) => res.render('Coordinacion/Estadisticas/inicio', { usuario: req.user })
);

module.exports = router;



