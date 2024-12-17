const express = require('express')
const router = express.Router()
const coneccion = require('../database/conexion')


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
    coneccion.query("SELECT * FROM Categorias", function(error, rows){
        if(error){
            throw error;
        }else{
                    res.render('AdminGeneral/FormularioActualizarCategoria', { usuario: req.user, categorias: rows }) 
        }
    }
    );
})
router.get('/formActualizarCoordinador', authControlador.isAuthenticated,  (req, res)=>{
    coneccion.query("SELECT * FROM Coordinadores", function(error, rows){
        if(error){
            throw error;
        }else{
                    res.render('AdminGeneral/FormularioActualizarCoordinador', { usuario: req.user, coordinadores: rows }) 
        }
    }
    );
})
router.get('/formActualizarEntrenador', authControlador.isAuthenticated,  (req, res)=>{
    coneccion.query("SELECT * FROM Categorias", function(error, rows){
        if(error){
            throw error;
        }else{
                    res.render('AdminGeneral/FormularioActualizarEntrenador', { usuario: req.user, categorias: rows }) 
        }
    }
    );
})
router.get('/formActualizarEquipo', authControlador.isAuthenticated,  (req, res)=>{
    coneccion.query("SELECT * FROM Categorias", function(error, rows){
        if(error){
            throw error;
        }else{
                    res.render('AdminGeneral/FormularioActualizarEquipo', { usuario: req.user, categorias: rows }) 
        }
    }
    );
})
router.get('/formActualizarJugador', authControlador.isAuthenticated,  (req, res)=>{
    coneccion.query("SELECT * FROM Categorias", function(error, rows){
        if(error){
            throw error;
        }else{
                    res.render('AdminGeneral/FormularioActualizarJugador', { usuario: req.user, categorias: rows }) 
        }
    }
    );
})
router.get('/formActualizarPago', authControlador.isAuthenticated,  (req, res)=>{
    coneccion.query("SELECT * FROM Jugadores", function(error, rows){
        if(error){
            throw error;
        }else{
                    res.render('AdminGeneral/FormularioActualizarPagoSemanal', { usuario: req.user, jugadores: rows }) 
        }
    }
    );
})
router.get('/formActualizarUsuarioCoordinador', authControlador.isAuthenticated,  (req, res)=>{
    coneccion.query("SELECT * FROM UsuarioAdministradores WHERE rol = 'Coordinador' ", function(errores, row){
        if(errores){
            throw errores;
        }else{
            res.render('AdminGeneral/FormularioActualizarUsuarioCoordinador', { usuario: req.user, userCoordinador: row });
        }   
    });
})
router.get('/formActualizarUsuarioJugador', authControlador.isAuthenticated,  (req, res)=>{
    coneccion.query("SELECT * FROM Categorias", function(error, rows){
        if(error){
            throw error;
        }else{
                    res.render('AdminGeneral/FormularioActualizarUsuarioJugador', { usuario: req.user, categorias: rows }) 
        }
    }
    );
})
                //Eliminar
router.get('/formEliminarCategoria', authControlador.isAuthenticated,  (req, res)=>{
    coneccion.query("SELECT * FROM Categorias", function(error, rows){
        if(error){
            throw error;
        }else{
                    res.render('AdminGeneral/FormularioEliminarCategoria', { usuario: req.user, categorias: rows }) 
        }
    }
    );
})
router.get('/formEliminarCoordinador', authControlador.isAuthenticated,  (req, res)=>{
    coneccion.query("SELECT * FROM Coordinadores", function(error, rows){
        if(error){
            throw error;
        }else{
                    res.render('AdminGeneral/FormularioEliminarCoordinador', { usuario: req.user, coordinadores: rows }) 
        }
    }
    );
})
router.get('/formEliminarEntrenador', authControlador.isAuthenticated,  (req, res)=>{
    coneccion.query("SELECT * FROM Categorias", function(error, rows){
        if(error){
            throw error;
        }else{
                    res.render('AdminGeneral/FormularioEliminarEntrenador', { usuario: req.user, categorias: rows }) 
        }
    }
    );
})
router.get('/formEliminarEquipo', authControlador.isAuthenticated,  (req, res)=>{
    coneccion.query("SELECT * FROM Categorias", function(error, rows){
        if(error){
            throw error;
        }else{
                    res.render('AdminGeneral/FormularioEliminarEquipo', { usuario: req.user, categorias: rows }) 
        }
    }
    );
})
router.get('/formEliminarJugador', authControlador.isAuthenticated,  (req, res)=>{
    coneccion.query("SELECT * FROM Categorias", function(error, rows){
        if(error){
            throw error;
        }else{
                    res.render('AdminGeneral/FormularioEliminarJugador', { usuario: req.user, categorias: rows }) 
        }
    }
    );
})
router.get('/formEliminarPagoSemanal', authControlador.isAuthenticated,  (req, res)=>{
    coneccion.query("SELECT * FROM jugadores", function(error, rows){
        if(error){
            throw error;
        }else{
            res.render('AdminGeneral/FormularioEliminarPagoSemanal', { usuario: req.user, jugadores: rows})        
        }
    }
    );
})
router.get('/formEliminarUsuarioCoordinador', authControlador.isAuthenticated,  (req, res)=>{
    coneccion.query("SELECT * FROM UsuarioAdministradores WHERE rol = 'Coordinador' ", function(errores, row){
        if(errores){
            throw errores;
        }else{
            res.render('AdminGeneral/FormularioEliminarUsuarioCoordinador', { usuario: req.user, userCoordinador: row });
        }   
    });
})
router.get('/formEliminarUsuarioJugador', authControlador.isAuthenticated,  (req, res)=>{
    coneccion.query("SELECT * FROM Categorias", function(error, rows){
        if(error){
            throw error;
        }else{
                    res.render('AdminGeneral/FormularioEliminarUsuarioJugador', { usuario: req.user, categorias: rows }) 
        }
    }
    );
})
                //Crear o Agregar
router.get('/formAgregarPago', authControlador.isAuthenticated,  (req, res)=>{
    coneccion.query("SELECT * FROM jugadores", function(error, rows){
        if(error){
            throw error;
        }else{
            res.render('AdminGeneral/FormularioAgregarCuotaJugador', { usuario: req.user, jugadores: rows})        
        }
    }
    );
})
router.get('/formCrearCategoria', authControlador.isAuthenticated,  (req, res)=>{
    res.render('AdminGeneral/FormularioCrearCategoria', { usuario: req.user })
})
router.get('/formCrearCoordinadores', authControlador.isAuthenticated,  (req, res)=>{
    coneccion.query("SELECT * FROM Categorias", function(error, rows){
        if(error){
            throw error;
        }else{
            coneccion.query("SELECT * FROM UsuarioAdministradores WHERE rol = 'Coordinador' ", function(errores, row){
                if(error){
                    throw error;
                }else{
                    res.render('AdminGeneral/FormularioCrearCoordinadores', { usuario: req.user, categorias: rows, userCoordinador: row });
                }   
            });
             
        }
    }


    );
    
})
router.get('/formCrearEntrenadores', authControlador.isAuthenticated,  (req, res)=>{
    coneccion.query("SELECT * FROM Categorias", function(error, rows){
        if(error){
            throw error;
        }else{
                    res.render('AdminGeneral/FormularioCrearEntrenadores', { usuario: req.user, categorias: rows }) 
        }
    }
    );
    
})
router.get('/formCrearEquipos', authControlador.isAuthenticated,  (req, res)=>{
    coneccion.query("SELECT * FROM Categorias", function(error, rows){
        if(error){
            throw error;
        }else{
            coneccion.query("SELECT * FROM entrenadores", function(errores, row){
                if(error){
                    throw error;
                }else{
                    res.render('AdminGeneral/FormularioCrearEquipos', { usuario: req.user , categorias: rows, entrenadores: row});
                }   
            });
             
        }
    });
    
})
router.get('/formCrearJugador', authControlador.isAuthenticated,  (req, res)=>{
    coneccion.query("SELECT * FROM Categorias", function(error, rows){
        if(error){
            throw error;
        }else{
                    res.render('AdminGeneral/FormularioCrearJugador', { usuario: req.user, categorias: rows }) 
        }
    }
    );
})
router.get('/formCrearUsuarioJugador', authControlador.isAuthenticated,  (req, res)=>{
    coneccion.query("SELECT * FROM jugadores", function(error, rows){
        if(error){
            throw error;
        }else{
            res.render('AdminGeneral/FormularioCrearUsuarioJugador', { usuario: req.user, jugadores: rows})        
        }
    }
    );
    
})
router.get('/formCrearUsuarioCoordinador', authControlador.isAuthenticated,  (req, res)=>{
    res.render('AdminGeneral/FormularioCrearUsuarioCoordinador', { usuario: req.user })
})




router.get('/AdminContra', authControlador.isAuthenticated, (req, res) => {
    res.render('AdminGeneral/contraNuevaAdmin', { usuario: req.user})
})

//ELIMINAR PERO SOLO CONFIRMAR

router.get('/eliminarCategoria', authControlador.isAuthenticated, (req, res) => {
    const categoriaID = req.query.categoriaID; 
    // Consulta la base de datos para obtener los datos de la categoría
    coneccion.query("SELECT * FROM Categorias WHERE id_categoria = ?", [categoriaID], (error, rows) => {
        if (error) {
            console.error('Error al consultar la categoría:', error);
            res.status(500).send('Hubo un problema al obtener los datos de la categoría.');
        
        } else {
            // Renderiza la vista con los datos de la categoría
            res.render('AdminGeneral/EliminarConfirmacionCategoria', { usuario: req.user, categoria: rows[0] });
        }
    });
});
router.get('/eliminarEntrenador', authControlador.isAuthenticated, (req, res) => {
    const categoriaID = req.query.categoriaID; 
    // Consulta la base de datos para obtener los datos de la categoría
    coneccion.query("SELECT * FROM entrenadores WHERE id_categoria = ?", [categoriaID], (error, rows) => {
        if (error) {
            console.error('Error al consultar la categoría:', error);
            res.status(500).send('Hubo un problema al obtener los datos de la categoría.');
        
        } else {
            // Renderiza la vista con los datos de la categoría
            res.render('AdminGeneral/EliminarConfirmacionEntrenador', { usuario: req.user, entrenadores: rows });
        }
    });
});
router.get('/eliminarEntrenadorNuevo', authControlador.isAuthenticated, (req, res) => {
    const entrenador = req.query.entrenador; 
    // Consulta la base de datos para obtener los datos de la categoría
    coneccion.query("SELECT * FROM entrenadores WHERE id_entrenador = ?", [entrenador], (error, rows) => {
        if (error) {
            console.error('Error al consultar la categoría:', error);
            res.status(500).send('Hubo un problema al obtener los datos de la categoría.');
        
        } else {
            // Renderiza la vista con los datos de la categoría
            res.render('AdminGeneral/EliminarEntrenador', { usuario: req.user, entrenadores: rows[0] });
        }
    });
});
router.get('/eliminarEquipo', authControlador.isAuthenticated, (req, res) => {
    const categoriaID = req.query.categoriaID; 
    // Consulta la base de datos para obtener los datos de la categoría
    coneccion.query("SELECT * FROM equipos WHERE id_categoria = ?", [categoriaID], (error, rows) => {
        if (error) {
            console.error('Error al consultar la categoría:', error);
            res.status(500).send('Hubo un problema al obtener los datos de la categoría.');
        
        } else {
            // Renderiza la vista con los datos de la categoría
            res.render('AdminGeneral/EliminarConfirmacionEquipo', { usuario: req.user, equipos: rows });
        }
    });
});
router.get('/eliminarEquipoNuevo', authControlador.isAuthenticated, (req, res) => {
    const equipo = req.query.equipo; 
    // Consulta la base de datos para obtener los datos de la categoría
    coneccion.query("SELECT * FROM equipos WHERE id_equipo = ?", [equipo], (error, rows) => {
        if (error) {
            console.error('Error al consultar la categoría:', error);
            res.status(500).send('Hubo un problema al obtener los datos de la categoría.');
        
        } else {
            // Renderiza la vista con los datos de la categoría
            res.render('AdminGeneral/AEliminarEquipo', { usuario: req.user, equipos: rows[0] });
        }
    });
});
router.get('/eliminarJugador', authControlador.isAuthenticated, (req, res) => {
    const categoriaID = req.query.categoriaID; 
    // Consulta la base de datos para obtener los datos de la categoría
    coneccion.query("SELECT * FROM jugadores WHERE id_categoria = ?", [categoriaID], (error, rows) => {
        if (error) {
            console.error('Error al consultar la categoría:', error);
            res.status(500).send('Hubo un problema al obtener los datos de la categoría.');
        
        } else {
            // Renderiza la vista con los datos de la categoría
            res.render('AdminGeneral/EliminarConfirmacionJugador', { usuario: req.user, jugadores: rows });
        }
    });
});
router.get('/eliminarJugadorNuevo', authControlador.isAuthenticated, (req, res) => {
    const jugador = req.query.jugador; 
    // Consulta la base de datos para obtener los datos de la categoría
    coneccion.query("SELECT * FROM jugadores WHERE id_jugador = ?", [jugador], (error, rows) => {
        if (error) {
            console.error('Error al consultar la categoría:', error);
            res.status(500).send('Hubo un problema al obtener los datos de la categoría.');
        
        } else {
            // Renderiza la vista con los datos de la categoría
            res.render('AdminGeneral/EliminarJugador', { usuario: req.user, jugadores: rows[0] });
        }
    });
});
router.get('/eliminarUsuarioJugador', authControlador.isAuthenticated, (req, res) => {
    const categoriaID = req.query.categoriaID; 
    // Consulta la base de datos para obtener los datos de la categoría
    coneccion.query("SELECT * FROM jugadores WHERE id_categoria = ?", [categoriaID], (error, rows) => {
        if (error) {
            console.error('Error al consultar la categoría:', error);
            res.status(500).send('Hubo un problema al obtener los datos de la categoría.');
        
        } else {
            // Renderiza la vista con los datos de la categoría
            res.render('AdminGeneral/EliminarConfirmacionUsuarioJugador', { usuario: req.user, jugadores: rows });
        }
    });
});
router.get('/eliminarUsuarioJugadorNuevo', authControlador.isAuthenticated, (req, res) => {
    const jugador = req.query.jugador; 
    // Consulta la base de datos para obtener los datos de la categoría
    coneccion.query("SELECT * FROM usuariofamiliarpago WHERE id_jugador = ?", [jugador], (error, rows) => {
        if (error) {
            console.error('Error al consultar la categoría:', error);
            res.status(500).send('Hubo un problema al obtener los datos de la categoría.');
        
        } else {
            // Renderiza la vista con los datos de la categoría
            res.render('AdminGeneral/EliminarUsuarioJugador', { usuario: req.user, usuarios: rows[0]  });
        }
    });
});
router.get('/eliminarCoordinador', authControlador.isAuthenticated, (req, res) => {
    const coordinador = req.query.coordinador; 
    // Consulta la base de datos para obtener los datos de la categoría
    coneccion.query("SELECT * FROM Coordinadores WHERE id_coordinador = ?", [coordinador], (error, rows) => {
        if (error) {
            console.error('Error al consultar la categoría:', error);
            res.status(500).send('Hubo un problema al obtener los datos de la categoría.');
        
        } else {
            // Renderiza la vista con los datos de la categoría
            res.render('AdminGeneral/EliminarConfirmacionCoordinador', { usuario: req.user, coordinador: rows[0] });
        }
    });
});
router.get('/eliminarCategoria', authControlador.isAuthenticated, (req, res) => {
    const usuario = req.query.usuario; 
    // Consulta la base de datos para obtener los datos de la categoría
    coneccion.query("SELECT * FROM UsuarioAdministradores WHERE id_usuario = ?", [usuario], (error, rows) => {
        if (error) {
            console.error('Error al consultar la categoría:', error);
            res.status(500).send('Hubo un problema al obtener los datos de la categoría.');
        
        } else {
            // Renderiza la vista con los datos de la categoría
            res.render('AdminGeneral/EliminarConfirmacionUsuarioCoordinador', { usuario: req.user, usuario: rows[0] });
        }
    });
});
router.get('/eliminarPagoSemanal', authControlador.isAuthenticated, (req, res) => {
    const jugador = req.query.jugador; 
    // Consulta la base de datos para obtener los datos de la categoría
    coneccion.query("SELECT * FROM pagos WHERE id_jugador = ?", [jugador], (error, rows) => {
        if (error) {
            console.error('Error al consultar la categoría:', error);
            res.status(500).send('Hubo un problema al obtener los datos de la categoría.');
        
        } else {
            // Renderiza la vista con los datos de la categoría
            res.render('AdminGeneral/EliminarConfirmacionPagoSemanal', { usuario: req.user, pagos: rows });
        }
    });
});
router.get('/eliminarPagoSemanalNuevo', authControlador.isAuthenticated, (req, res) => {
    const semana = req.query.semana; 
    // Consulta la base de datos para obtener los datos de la categoría
    coneccion.query("SELECT * FROM pagos WHERE id = ?", [semana], (error, rows) => {
        if (error) {
            console.error('Error al consultar la categoría:', error);
            res.status(500).send('Hubo un problema al obtener los datos de la categoría.');
        
        } else {
            // Renderiza la vista con los datos de la categoría
            res.render('AdminGeneral/EliminarPagoSemanal', { usuario: req.user, semana: rows[0] });
        }
    });
});
router.get('/eliminarUsuarioCoordinador', authControlador.isAuthenticated, (req, res) => {
    const usuario = req.query.usuario; 
    // Consulta la base de datos para obtener los datos de la categoría
    coneccion.query("SELECT * FROM UsuarioAdministradores WHERE id_usuario = ?", [usuario], (error, rows) => {
        if (error) {
            console.error('Error al consultar la categoría:', error);
            res.status(500).send('Hubo un problema al obtener los datos de la categoría.');
        
        } else {
            // Renderiza la vista con los datos de la categoría
            res.render('AdminGeneral/EliminarConfirmacionUsuarioCoordinador', { usuario: req.user, user: rows[0] });
        }
    });
});


//ACTUALIZAR PERO SOLO CONFIRMAR

router.get('/actualizaCategoria', authControlador.isAuthenticated, (req, res) => {
    const categoriaID = req.query.categoriaID; 
    // Consulta la base de datos para obtener los datos de la categoría
    coneccion.query("SELECT * FROM Categorias WHERE id_categoria = ?", [categoriaID], (error, rows) => {
        if (error) {
            console.error('Error al consultar la categoría:', error);
            res.status(500).send('Hubo un problema al obtener los datos de la categoría.');
        
        } else {
            // Renderiza la vista con los datos de la categoría
            res.render('AdminGeneral/ActualizarConfirmacionCategoria', { usuario: req.user, categoria: rows[0] });
        }
    });
});
router.get('/actualizaEntrenador', authControlador.isAuthenticated, (req, res) => {
    const categoriaID = req.query.categoriaID; 
    // Consulta la base de datos para obtener los datos de la categoría
    coneccion.query("SELECT * FROM entrenadores WHERE id_categoria = ?", [categoriaID], (error, rows) => {
        if (error) {
            console.error('Error al consultar la categoría:', error);
            res.status(500).send('Hubo un problema al obtener los datos de la categoría.');
        
        } else {
            // Renderiza la vista con los datos de la categoría
            res.render('AdminGeneral/ActualizarConfirmacionEntrenador', { usuario: req.user, entrenadores: rows });
        }
    });
});
router.get('/actualizaEntrenadorNuevo', authControlador.isAuthenticated, (req, res) => {
    const entrenador = req.query.entrenador; 
    // Consulta la base de datos para obtener los datos de la categoría
    coneccion.query("SELECT * FROM entrenadores WHERE id_entrenador = ?", [entrenador], (error, rows) => {
        if (error) {
            console.error('Error al consultar la categoría:', error);
            res.status(500).send('Hubo un problema al obtener los datos de la categoría.');
        
        } else {
            // Renderiza la vista con los datos de la 
            coneccion.query("SELECT * FROM Categorias", function(error, rows2){
                if(error){
                    throw error;
                }else{            
                    res.render('AdminGeneral/ActualizarEntrenador', { usuario: req.user, entrenadores: rows[0], categorias: rows2 });

                }
            });
        }
    });
});
router.get('/actualizaEquipo', authControlador.isAuthenticated, (req, res) => {
    const categoriaID = req.query.categoriaID; 
    // Consulta la base de datos para obtener los datos de la categoría
    coneccion.query("SELECT * FROM equipos WHERE id_categoria = ?", [categoriaID], (error, rows) => {
        if (error) {
            console.error('Error al consultar la categoría:', error);
            res.status(500).send('Hubo un problema al obtener los datos de la categoría.');
        
        } else {
            // Renderiza la vista con los datos de la categoría
            res.render('AdminGeneral/ActualizarConfirmacionEquipo', { usuario: req.user, equipos: rows });
        }
    });
});
router.get('/actualizaEquipoNuevo', authControlador.isAuthenticated, (req, res) => {
    const equipo = req.query.equipo; 
    // Consulta la base de datos para obtener los datos de la categoría
    coneccion.query("SELECT * FROM equipos WHERE id_equipo = ?", [equipo], (error, rows) => {
        if (error) {
            console.error('Error al consultar la categoría:', error);
            res.status(500).send('Hubo un problema al obtener los datos de la categoría.');
        
        } else {
            coneccion.query("SELECT * FROM Categorias", function(error, rows2){
                if(error){
                    throw error;
                }else{
                    coneccion.query("SELECT * FROM entrenadores", function(errores, row){
                        if(error){
                            throw error;
                        }else{
                       // Renderiza la vista con los datos de la categoría
                            res.render('AdminGeneral/ActualizarEquipo', { usuario: req.user, equipos: rows[0], categorias: rows2, entrenadores: row });
                        }   
                    });
                     
                }
            });
        }
    });
});
router.get('/actualizaJugador', authControlador.isAuthenticated, (req, res) => {
    const categoriaID = req.query.categoriaID; 
    // Consulta la base de datos para obtener los datos de la categoría
    coneccion.query("SELECT * FROM jugadores WHERE id_categoria = ?", [categoriaID], (error, rows) => {
        if (error) {
            console.error('Error al consultar la categoría:', error);
            res.status(500).send('Hubo un problema al obtener los datos de la categoría.');
        
        } else {
            // Renderiza la vista con los datos de la categoría
            res.render('AdminGeneral/ActualizarConfirmacionJugador', { usuario: req.user, jugadores: rows });
        }
    });
});
router.get('/actualizaJugadorNuevo', authControlador.isAuthenticated, (req, res) => {
    const jugador = req.query.jugador; 
    // Consulta la base de datos para obtener los datos de la categoría
    coneccion.query("SELECT * FROM jugadores WHERE id_jugador = ?", [jugador], (error, rows) => {
        if (error) {
            console.error('Error al consultar la categoría:', error);
            res.status(500).send('Hubo un problema al obtener los datos de la categoría.');
        
        } else {
            const categoriaId = rows[0].id_categoria;

            coneccion.query("SELECT * FROM equipos WHERE id_categoria = ?", [categoriaId], (error, rows2) => {
                if (error) {
                    console.error('Error al consultar la categoría:', error);
                    res.status(500).send('Hubo un problema al obtener los datos de la categoría.');
                
                } else {
                    coneccion.query("SELECT * FROM Categorias", function(error, rows3){
                        if(error){
                            throw error;
                        }else{
                           // Renderiza la vista con los datos de la categoría
                    res.render('AdminGeneral/ActualizarJugador', { usuario: req.user, jugadores: rows[0], categorias: rows3, equipos: rows2 });
                        }
                    });
                }
            });
           }
    });
});
router.get('/actualizaUsuarioJugador', authControlador.isAuthenticated, (req, res) => {
    const categoriaID = req.query.categoriaID; 
    // Consulta la base de datos para obtener los datos de la categoría
    coneccion.query("SELECT * FROM jugadores WHERE id_categoria = ?", [categoriaID], (error, rows) => {
        if (error) {
            console.error('Error al consultar la categoría:', error);
            res.status(500).send('Hubo un problema al obtener los datos de la categoría.');
        
        } else {
            // Renderiza la vista con los datos de la categoría
            res.render('AdminGeneral/ActualizarConfirmacionUsuarioJugador', { usuario: req.user, jugadores: rows });
        }
    });
});
router.get('/actualizaUsuarioJugadorNuevo', authControlador.isAuthenticated, (req, res) => {
    const jugador = req.query.jugador; 
    // Consulta la base de datos para obtener los datos de la categoría
    coneccion.query("SELECT * FROM usuariofamiliarpago WHERE id_jugador = ?", [jugador], (error, rows) => {
        if (error) {
            console.error('Error al consultar la categoría:', error);
            res.status(500).send('Hubo un problema al obtener los datos de la categoría.');
        
        } else {
            // Renderiza la vista con los datos de la categoría
            res.render('AdminGeneral/ActualizarUsuarioJugador', { usuario: req.user, usuarios: rows[0] });
        }
    });
});
router.get('/actualizaCoordinador', authControlador.isAuthenticated, (req, res) => {
    const coordinador = req.query.coordinador; 
    // Consulta la base de datos para obtener los datos de la categoría
    coneccion.query("SELECT * FROM Coordinadores WHERE id_coordinador = ?", [coordinador], (error, rows) => {
        if (error) {
            console.error('Error al consultar la categoría:', error);
            res.status(500).send('Hubo un problema al obtener los datos de la categoría.');
        
        } else {
            // Renderiza la vista con los datos de la categoría
            res.render('AdminGeneral/ActualizarConfirmacionCoordinador', { usuario: req.user, coordinador: rows[0] });
        }
    });
});
router.get('/actualizaCategoria', authControlador.isAuthenticated, (req, res) => {
    const usuario = req.query.usuario; 
    // Consulta la base de datos para obtener los datos de la categoría
    coneccion.query("SELECT * FROM UsuarioAdministradores WHERE id_usuario = ?", [usuario], (error, rows) => {
        if (error) {
            console.error('Error al consultar la categoría:', error);
            res.status(500).send('Hubo un problema al obtener los datos de la categoría.');
        
        } else {
            // Renderiza la vista con los datos de la categoría
            res.render('AdminGeneral/ActualizarConfirmacionUsuarioCoordinador', { usuario: req.user, usuario: rows[0] });
        }
    });
});
router.get('/actualizaPagoSemanal', authControlador.isAuthenticated, (req, res) => {
    const jugador = req.query.jugador; 
    // Consulta la base de datos para obtener los datos de la categoría
    coneccion.query("SELECT * FROM pagos WHERE id_jugador = ?", [jugador], (error, rows) => {
        if (error) {
            console.error('Error al consultar la categoría:', error);
            res.status(500).send('Hubo un problema al obtener los datos de la categoría.');
        
        } else {
            // Renderiza la vista con los datos de la categoría
            res.render('AdminGeneral/ActualizarConfirmacionPagoSemanal', { usuario: req.user, pagos: rows });
        }
    });
});
router.get('/actualizaPagoSemanalNuevo', authControlador.isAuthenticated, (req, res) => {
    const semana = req.query.semana; 
    // Consulta la base de datos para obtener los datos de la categoría
    coneccion.query("SELECT * FROM pagos WHERE id = ?", [semana], (error, rows) => {
        if (error) {
            console.error('Error al consultar la categoría:', error);
            res.status(500).send('Hubo un problema al obtener los datos de la categoría.');
        
        } else {
            // Renderiza la vista con los datos de la categoría
            res.render('AdminGeneral/ActualizarPagoSemanal', { usuario: req.user, semana: rows[0] });
        }
    });
});
router.get('/actualizaUsuarioCoordinador', authControlador.isAuthenticated, (req, res) => {
    const usuario = req.query.usuario; 
    // Consulta la base de datos para obtener los datos de la categoría
    coneccion.query("SELECT * FROM UsuarioAdministradores WHERE id_usuario = ?", [usuario], (error, rows) => {
        if (error) {
            console.error('Error al consultar la categoría:', error);
            res.status(500).send('Hubo un problema al obtener los datos de la categoría.');
        
        } else {
            // Renderiza la vista con los datos de la categoría
            res.render('AdminGeneral/ActualizarConfirmacionUsuarioCoordinador', { usuario: req.user, user: rows[0] });
        }
    });
});


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
router.post('/crearCategoria', authControlador.crearCategoria);
router.post('/crearEquipo', authControlador.crearEquipo)
router.post('/crearUsuario', authControlador.crearUsuario);
router.post('/crearCoordinador', authControlador.crearCoordinador);
router.post('/crearEntrenador', authControlador.crearEntrenador);
router.post('/crearJugador', authControlador.crearJugador);
router.post('/crearUsuarioJugador', authControlador.crearUsuarioJugador);
router.post('/agregarPago', authControlador.registrarPago);
//Formularios Coordinadores


router.post('/login', authControlador.inicio) // Referencia correcta
router.get('/logout', authControlador.logout)
router.post('/eliminarCategoria')





module.exports = router