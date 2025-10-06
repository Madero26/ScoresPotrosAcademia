const express = require('express');
const router = express.Router();

router.get('/', (req,res)=> res.render('Publico/Standing/Index')); // o 'index'

module.exports = router;
