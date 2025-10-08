// Rutas/auth.js
const express = require('express');
const router = express.Router();
const auth = require('../controllers/authController');
const middle = require('../middlewares/auth')

router.get('/Login', auth.viewLogin);
router.post('/login', auth.login);
router.get('/logout', auth.logout);
router.get('/auth/ping', middle.isAuthenticated, (req, res) => res.sendStatus(204));


module.exports = router;

