const express = require('express')
const router = express.Router()

const authControlador = require('../Controlador/authControlador') // Asegúrate que el nombre sea correcto

router.get('/', (req, res)=> {
    res.render('index')
})

router.get('/login', (req, res)=>{
    res.render('Login')
})
router.get('/Estadisticas', (req, res)=>{
    res.render('Estadisticas')
})
router.get('/JugadoresD', (req, res)=>{
    res.render('JugadoresD')
})
router.get('/Pagos', (req, res)=>{
    res.render('Pagos')
})
router.get('/Coord', (req, res)=>{
    res.render('Coordinadores')
})
router.get('/Standing', (req, res)=>{
    res.render('Standing')
})
router.get('/CoordAgregar', authControlador.isAuthenticated,(req, res)=>{
    res.render('FormularioAgregarJugador', { usuario: req.user})
})
router.get('/CoordEliminar',  authControlador.isAuthenticated,(req, res)=>{
    res.render('FormularioEliminarJugador', { usuario: req.user})
})
router.get('/CoordActualizar', authControlador.isAuthenticated,(req, res)=>{
    res.render('FormularioActualizarJugador', { usuario: req.user})
})
router.get('/CoordPagos', authControlador.isAuthenticated,(req, res)=>{
    res.render('FormsPagos', { usuario: req.user})
})
router.get('/CoordContraNueva', authControlador.isAuthenticated, (req, res)=>{
    res.render('contraNuevaCoordinadores', { usuario: req.user})
})
router.get('/CoordFotoCate', authControlador.isAuthenticated,(req, res)=>{
    res.render('FormFotosCategoriaIndividual', { usuario: req.user})
})
router.get('/CoordFotoCate', authControlador.isAuthenticated,(req, res)=>{
    res.render('FormFotosCategoriaIndividual', { usuario: req.user})
})


router.get('/formEstadisticas', authControlador.isAuthenticated, (req, res)=>{
    res.render('FormularioDatos_AdminEstadisticas', { usuario: req.user })
})
router.get('/formAdmin', authControlador.isAuthenticated,  (req, res)=>{
    res.render('FormFotosCategoria', { usuario: req.user })
})

router.get('/formCoordinadores', authControlador.isAuthenticated, (req, res) => {
    res.render('FormFotosEquipos', { usuario: req.user})
})
router.get('/AdminContra', authControlador.isAuthenticated, (req, res) => {
    res.render('contraNuevaAdmin', { usuario: req.user})
})

router.post('/formAdmin', authControlador.formAdmin) // Referencia correcta
router.post('/login', authControlador.inicio) // Referencia correcta
router.get('/logout', authControlador.logout)



module.exports = router