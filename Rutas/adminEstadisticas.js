const express = require('express');
const router = express.Router();

router.get('/', (req,res)=> res.send('Admin Estadísticas OK'));

module.exports = router;
