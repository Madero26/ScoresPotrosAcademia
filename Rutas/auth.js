// Rutas/auth.js
const express = require('express');
const router = express.Router();
const auth = require('../controllers/authController');

router.get('/Login', auth.viewLogin);
router.post('/login', auth.login);
router.get('/logout', auth.logout);

module.exports = router;

