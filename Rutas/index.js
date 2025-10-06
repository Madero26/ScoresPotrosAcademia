const express = require('express');
const router = express.Router();

router.get('/', (req, res) => res.render('index'));

// FRONT módulos
router.use('/Estadisticas', require('./estadisticas'));
router.use('/Standing', require('./standing'));              // TODO
// privados (cuando migres)
router.use('/Admin', require('./adminGeneral'));             // TODO
router.use('/AdminEstadisticas', require('./adminEstadisticas')); // TODO
router.use('/Coord', require('./coordinador'));              // TODO

module.exports = router;
