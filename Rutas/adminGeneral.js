const express = require('express');
const router = express.Router();

router.get('/', (req,res)=> res.send('Admin General OK'));

module.exports = router;
