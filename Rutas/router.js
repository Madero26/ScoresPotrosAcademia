const express = require('express')
const router = express.Router()

const authControlador = require('../Controlador/authControlador') // Asegúrate que el nombre sea correcto

router.get('/', (req, res)=> {
    res.render('index')
})

//RUTAS DE PAGINA PRINCIPAL
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



//RUTAS DE NAVEGADOR DE ESTADISTICAS ADMINISTRADOR
router.get('/formEstadisticas', authControlador.isAuthenticated, (req, res)=>{
    res.render('AdminEstadisticas/FormularioDatos_AdminEstadisticas', { usuario: req.user })
})
router.get('/formEstadisticaPitcheo', authControlador.isAuthenticated, (req, res)=>{
    res.render('AdminEstadisticas/FormularioEstadisticasDePitcheo', { usuario: req.user })
})
router.get('/formEstadisticasBateo', authControlador.isAuthenticated, (req, res)=>{
    res.render('AdminEstadisticas/FormularioEstadisticasDeBateo', { usuario: req.user })
})
router.get('/formContraNuevaEstadisticas', authControlador.isAuthenticated, (req, res)=>{
    res.render('AdminEstadisticas/contraAdminEstadisticas', { usuario: req.user })
})

//RUTAS DE NAVEGADOR ADMINISTRADOR GENERAL
                //FOTOS
router.get('/formAdmin', authControlador.isAuthenticated,  (req, res)=>{
    res.render('AdminGeneral/FormFotosCategoria', { usuario: req.user })
})
router.get('/formFotoCoordinador', authControlador.isAuthenticated,  (req, res)=>{
    res.render('AdminGeneral/FormFotoCoordinador', { usuario: req.user })
})
router.get('/formAFotoEntrenadores', authControlador.isAuthenticated,  (req, res)=>{
    res.render('AdminGeneral/FormFotosEntrenadores', { usuario: req.user })
})
router.get('/formFotoEquipo', authControlador.isAuthenticated,  (req, res)=>{
    res.render('AdminGeneral/FormsFotosEquipo', { usuario: req.user })
})
router.get('/formFotoJugador', authControlador.isAuthenticated,  (req, res)=>{
    res.render('AdminGeneral/FormsFotosJugador', { usuario: req.user })
})

                //Actualizar
router.get('/formActualizarCategoria', authControlador.isAuthenticated,  (req, res)=>{
    res.render('AdminGeneral/FormularioActualizarCategoria', { usuario: req.user })
})
router.get('/formActualizarCoordinador', authControlador.isAuthenticated,  (req, res)=>{
    res.render('AdminGeneral/FormularioActualizarCoordinador', { usuario: req.user })
})
router.get('/formActualizarEntrenador', authControlador.isAuthenticated,  (req, res)=>{
    res.render('AdminGeneral/FormularioActualizarEntrenador', { usuario: req.user })
})
router.get('/formActualizarEquipo', authControlador.isAuthenticated,  (req, res)=>{
    res.render('AdminGeneral/FormularioActualizarEquipo', { usuario: req.user })
})
router.get('/formActualizarJugador', authControlador.isAuthenticated,  (req, res)=>{
    res.render('AdminGeneral/FormularioActualizarJugador', { usuario: req.user })
})
router.get('/formActualizarPago', authControlador.isAuthenticated,  (req, res)=>{
    res.render('AdminGeneral/FormularioActualizarPagoSemanal', { usuario: req.user })
})
router.get('/formActualizarUsuarioCoordinador', authControlador.isAuthenticated,  (req, res)=>{
    res.render('AdminGeneral/FormularioActualizarUsuarioCoordinador', { usuario: req.user })
})
router.get('/formActualizarUsuarioJugador', authControlador.isAuthenticated,  (req, res)=>{
    res.render('AdminGeneral/FormularioActualizarUsuarioJugador', { usuario: req.user })
})
                //Eliminar
router.get('/formEliminarCategoria', authControlador.isAuthenticated,  (req, res)=>{
    res.render('AdminGeneral/FormularioEliminarCategoria', { usuario: req.user })
})
router.get('/formEliminarCoordinador', authControlador.isAuthenticated,  (req, res)=>{
    res.render('AdminGeneral/FormularioEliminarCoordinador', { usuario: req.user })
})
router.get('/formEliminarEntrenador', authControlador.isAuthenticated,  (req, res)=>{
    res.render('AdminGeneral/FormularioEliminarEntrenador', { usuario: req.user })
})
router.get('/formEliminarEquipo', authControlador.isAuthenticated,  (req, res)=>{
    res.render('AdminGeneral/FormularioEliminarEquipo', { usuario: req.user })
})
router.get('/formEliminarJugador', authControlador.isAuthenticated,  (req, res)=>{
    res.render('AdminGeneral/FormularioEliminarJugador', { usuario: req.user })
})
router.get('/formEliminarPago', authControlador.isAuthenticated,  (req, res)=>{
    res.render('AdminGeneral/FormularioEliminarPagoSemanal', { usuario: req.user })
})
router.get('/formEliminarUsuarioCoordinador', authControlador.isAuthenticated,  (req, res)=>{
    res.render('AdminGeneral/FormularioEliminarUsuarioCoordinador', { usuario: req.user })
})
router.get('/formEliminarUsuarioJugador', authControlador.isAuthenticated,  (req, res)=>{
    res.render('AdminGeneral/FormularioEliminarUsuarioJugador', { usuario: req.user })
})
                //Crear o Agregar
router.get('/formAgregarPago', authControlador.isAuthenticated,  (req, res)=>{
    res.render('AdminGeneral/FormularioAgregarCuotaJugador', { usuario: req.user })
})
router.get('/formCrearCategoria', authControlador.isAuthenticated,  (req, res)=>{
    res.render('AdminGeneral/FormularioCrearCategoria', { usuario: req.user })
})
router.get('/formCrearCoordinadores', authControlador.isAuthenticated,  (req, res)=>{
    res.render('AdminGeneral/FormularioCrearCoordinadores', { usuario: req.user })
})
router.get('/formCrearEntrenadores', authControlador.isAuthenticated,  (req, res)=>{
    res.render('AdminGeneral/FormularioCrearEntrenadores', { usuario: req.user })
})
router.get('/formCrearEquipos', authControlador.isAuthenticated,  (req, res)=>{
    res.render('AdminGeneral/FormularioCrearEquipos', { usuario: req.user })
})
router.get('/formCrearJugador', authControlador.isAuthenticated,  (req, res)=>{
    res.render('AdminGeneral/FormularioCrearJugador', { usuario: req.user })
})
router.get('/formCrearUsuarioJugador', authControlador.isAuthenticated,  (req, res)=>{
    res.render('AdminGeneral/FormularioCrearUsuarioJugador', { usuario: req.user })
})
router.get('/formCrearUsuarioCoordinador', authControlador.isAuthenticated,  (req, res)=>{
    res.render('AdminGeneral/FormularioCrearUsuarioCoordinador', { usuario: req.user })
})




router.get('/AdminContra', authControlador.isAuthenticated, (req, res) => {
    res.render('AdminGeneral/contraNuevaAdmin', { usuario: req.user})
})

//RUTAS DE NAVEGADOR COORDINADORES
router.get('/formCoordinadores', authControlador.isAuthenticated, (req, res) => {
    res.render('Coordinador/FormFotosEquipos', { usuario: req.user})
})
router.get('/CoordAgregar', authControlador.isAuthenticated,(req, res)=>{
    res.render('Coordinador/FormularioAgregarJugador', { usuario: req.user})
})
router.get('/CoordEliminar',  authControlador.isAuthenticated,(req, res)=>{
    res.render('Coordinador/FormularioEliminarJugador', { usuario: req.user})
})
router.get('/CoordActualizar', authControlador.isAuthenticated,(req, res)=>{
    res.render('Coordinador/FormularioActualizarJugador', { usuario: req.user})
})
router.get('/CoordPagos', authControlador.isAuthenticated,(req, res)=>{
    res.render('Coordinador/FormsPagos', { usuario: req.user})
})
router.get('/CoordContraNueva', authControlador.isAuthenticated, (req, res)=>{
    res.render('Coordinador/contraNuevaCoordinadores', { usuario: req.user})
})
router.get('/CoordFotoCate', authControlador.isAuthenticated,(req, res)=>{
    res.render('Coordinador/FormFotosCategoriaIndividual', { usuario: req.user})
})

//---------------------Formularios------------------------------


//Formularios Estadisticas

//Formularios Admin General
router.post('/formAdmin', authControlador.formAdmin) // Referencia correcta
//Formularios Coordinadores


router.post('/login', authControlador.inicio) // Referencia correcta
router.get('/logout', authControlador.logout)



module.exports = router