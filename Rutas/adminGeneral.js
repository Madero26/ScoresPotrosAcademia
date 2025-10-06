// Rutas/adminGeneral.js
const express = require('express');
const router = express.Router();
const { isAuthenticated, requireRole } = require('../middlewares/auth');

router.use(isAuthenticated, requireRole('AdministradorGeneral'));

router.get('/', (req, res) => {
  res.render('AdminGeneral/Dashboard', {
    usuario: req.user,           // para el navbar
    rol: req.auth.rol
  });
});

// ... rutas del admin general
module.exports = router;

