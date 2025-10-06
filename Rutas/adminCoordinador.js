// Rutas/coordinador.js
const express = require('express');
const router = express.Router();
const { isAuthenticated, requireRole } = require('../middlewares/auth');

router.use(isAuthenticated, requireRole('Coordinador'));

router.get('/', (req, res) => {
  res.render('Coordinador/Dashboard', {
    usuario: req.user,
    rol: req.auth.rol,
    idCategoria: req.auth.categoriaId  // <- ÚSALA para filtrar vistas/datos
  });
});

module.exports = router;
