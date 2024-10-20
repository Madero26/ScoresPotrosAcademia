const express = require('express')
const router = express.Router()

const authControlador = require('../Controlador/authControlador') // Asegúrate que el nombre sea correcto

router.get('/', (req, res)=> {
    res.render('index')
})

router.get('/login', (req, res)=>{
    res.render('Login')
})

router.get('/formEstadisticas', authControlador.isAuthenticated, (req, res)=>{
    res.render('FormularioDatos_AdminEstadisticas', { usuario: req.user })
})
router.get('/formAdmin', authControlador.isAuthenticated,  (req, res)=>{
    res.render('FormularioAdminGeneral',{ usuario: req.user })
})

router.get('/formCoordinadores', authControlador.isAuthenticated, (req, res) => {
    res.render('FormFotosCategoria', { usuario: req.user })
})

router.post('/formCoordinadores', authControlador.formCoordinadores) // Referencia correcta
router.post('/login', authControlador.inicio) // Referencia correcta
router.get('/logout', authControlador.logout)


module.exports = router