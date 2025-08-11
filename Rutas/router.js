const express = require('express')
const router = express.Router()
const coneccion = require('../database/conexion')


const authControlador = require('../Controlador/authControlador') // Asegúrate que el nombre sea correcto
const estadisticasControlador = require('../Controlador/estadisticasControlador')


router.get('/', (req, res)=> {
    res.render('index')
})

//RUTAS DE PAGINA PRINCIPAL
router.get('/login', (req, res)=>{
    res.render('Login')
})
router.get('/Estadisticas', authControlador.verCategorias);
router.get('/categorias/:id/equipos', authControlador.verEquiposPorCategoria);

router.get('/api/equipos/:id_categoria', (req, res) => {
    const idCategoria = req.params.id_categoria;

    const query = 'SELECT * FROM Equipos WHERE id_categoria = ?';
    coneccion.query(query, [idCategoria], (error, equipos) => {
        if (error) {
            console.error('Error al obtener equipos:', error);
            return res.status(500).json({ error: 'Error del servidor' });
        }

        res.json({ equipos });
    });
});

router.get('/estadisticas/:id_equipo', (req, res) => {
    const idEquipo = req.params.id_equipo;

    const query = 'SELECT * FROM Jugadores WHERE id_equipo = ?';
    coneccion.query(query, [idEquipo], (error, jugadores) => {
        if (error) {
            console.error('Error al obtener jugadores del equipo:', error);
            return res.status(500).send('Error del servidor');
        }

        res.render('categorias/EstadisticasEquipo', { jugadores });
    });
});

// Estadísticas generales del equipo
router.get('/equipos/:id_equipo/estadisticas', authControlador.verEstadisticasEquipo);

// Estadísticas individuales de los jugadores del equipo
router.get('/equipos/:id_equipo/jugadores', authControlador.verJugadoresDelEquipo);

router.get('/perfilJugador/:id', (req, res) => {
  const jugadorId = req.params.id;

  const queryJugador = `
    SELECT j.*, e.nombre AS equipo_nombre, e.url_foto AS equipo_foto
    FROM Jugadores j
    JOIN Equipos e ON j.id_equipo = e.id_equipo
    WHERE j.id_jugador = ?
  `;

  coneccion.query(queryJugador, [jugadorId], (err, result) => {
    if (err || result.length === 0) return res.send("Jugador no encontrado.");
    
    const jugador = result[0];

    coneccion.query(`SELECT * FROM EstadisticasBateo WHERE id_jugador = ?`, [jugadorId], (errB, bateo) => {
      if (errB) return res.send("Error en bateo");

      coneccion.query(`SELECT * FROM EstadisticasPitcheo WHERE id_jugador = ?`, [jugadorId], (errP, pitcheo) => {
        if (errP) return res.send("Error en pitcheo");

        res.render('categorias/perfilJugador', {
          jugador: {
            ...jugador,
            ...bateo[0],
            ...pitcheo[0]
          }
        });
      });
    });
  });
});

router.get('/api/sugerencias-jugadores', (req, res) => {
  const term = req.query.term || ''; // ✅ ESTA LÍNEA DEFINE "term"

  coneccion.query(`
    SELECT CONCAT(nombres, ' ', apellido_paterno, ' ', apellido_materno) AS nombre_completo
    FROM Jugadores
    WHERE CONCAT(nombres, ' ', apellido_paterno, ' ', apellido_materno) LIKE ?
    LIMIT 10
  `, [`%${term}%`], (err, result) => {
    if (err) {
      console.error("Error en sugerencias:", err);
      return res.status(500).json([]);
    }
    res.json(result);
  });
});

router.get('/categoria/:id/buscar', authControlador.buscarJugadorPorNombre);






router.get('/JugadoresD', authControlador.verCategoriasDestacados);
router.get('/categorias/:id/secciones', authControlador.verSecciones);
router.get('/categoria/:id/estadisticas/:tipo', authControlador.estadisticasPorTipo);

router.get('/Pagos', (req, res)=>{
    res.render('Pagos')
})
router.get('/Coord', authControlador.verCoordinadores);

router.get('/Standing', authControlador.verCategoriasStanding);



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
    coneccion.query("SELECT * FROM Categorias", function(error, rows){
        if(error){
            throw error;
        }else{
                    res.render('AdminGeneral/FormularioCrearCategoria', { usuario: req.user, categorias: rows }) 
        }
    }
    );
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
// router.js
router.get('/api/entrenadores',
  authControlador.isAuthenticated,
  authControlador.listarEntrenadoresPorCategoria
);
router.get('/actualizaEntrenador',
  authControlador.isAuthenticated,
  authControlador.mostrarActualizarEntrenador
);
router.post('/actualizarEntrenador/:id',
  authControlador.isAuthenticated,
  authControlador.actualizarEntrenador
);


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

router.get('/api/equipos',
  authControlador.isAuthenticated,
  authControlador.listarEquiposPorCategoria
);

router.get('/actualizaEquipo',
  authControlador.isAuthenticated,
  authControlador.mostrarActualizarEquipo
);

router.post('/actualizarEquipo/:id',
  authControlador.isAuthenticated,
  authControlador.actualizarEquipo
);
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

router.get('/api/equipos',    authControlador.isAuthenticated, authControlador.listarEquiposPorCategoria);
router.get('/api/jugadores',  authControlador.isAuthenticated, authControlador.listarJugadoresPorEquipo);
router.get('/api/jugadoresByCategoria',  authControlador.isAuthenticated, authControlador.listarJugadoresPorCategoria);


router.get('/actualizaJugador',
  authControlador.isAuthenticated,
  authControlador.mostrarActualizarJugador
);
router.post('/actualizarJugador/:id',
  authControlador.isAuthenticated,
  authControlador.actualizarJugador
);


router.get('/equiposPorCategoria/:idCategoria', (req, res) => {
    const idCategoria = req.params.idCategoria;
    coneccion.query('SELECT * FROM Equipos WHERE id_categoria = ?', [idCategoria], (err, equipos) => {
        if (err) return res.status(500).json({ error: err });
        res.json(equipos);
    });
});


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

// router.js
router.get('/actualizaUsuarioCoordinador',
  authControlador.isAuthenticated,
  authControlador.mostrarActualizarUsuarioCoordinador
);

// router.js
router.post('/actualizarUsuarioCoordinador/:id',
  authControlador.isAuthenticated,
  authControlador.actualizarUsuarioCoordinador
);


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


// Confirmación ELIMINAR CATEGORÍA (reutiliza la vista de actualizar)
router.get('/eliminarCategoria', authControlador.isAuthenticated, (req, res) => {
  const id = req.query.categoriaID;
  coneccion.query('SELECT * FROM Categorias WHERE id_categoria=?', [id], (err, rows) => {
    if (err) return res.status(500).send('Error al obtener la categoría');
    if (!rows || !rows.length) return res.status(404).send('Categoría no encontrada');

    res.render('AdminGeneral/ActualizarConfirmacionCategoria', {
      usuario: req.user,            // o req.usuario, según uses
      categoria: rows[0],
      isDelete: true                // ← clave
    });
  });
});


// Ejecutar ELIMINACIÓN
router.post('/eliminarCategoria/:id',
  authControlador.isAuthenticated,
  authControlador.eliminarCategoria
);

// API: entrenadores por categoría (si aún no existe)
router.get('/api/entrenadores', authControlador.isAuthenticated, (req, res) => {
  const cat = req.query.categoriaID || null;
  const sql = `
    SELECT id_entrenador,
           CONCAT(nombres,' ',apellido_paterno,' ',apellido_materno) AS nombre
    FROM Entrenadores
    WHERE (? IS NULL OR id_categoria = ?)
    ORDER BY nombre
  `;
  coneccion.query(sql, [cat, cat], (err, rows) => {
    if (err) return res.json({ ok:false, message:'Error al cargar entrenadores' });
    res.json({ ok:true, data: rows });
  });
});

// GET: Form de selección (ya lo tienes)
router.get('/formEliminarEntrenador',
  authControlador.isAuthenticated,
  (req, res) => {
    coneccion.query('SELECT id_categoria,nombre_categoria FROM Categorias ORDER BY nombre_categoria',
    (e, categorias) => {
      if (e) return res.status(500).send('Error al cargar categorías');
      res.render('AdminGeneral/FormularioEliminarEntrenador', {
        usuario: req.user,
        categorias
      });
    });
  }
);

// GET: Confirmación (reutiliza la vista de actualizar en modo delete)
router.get('/eliminarEntrenador', authControlador.isAuthenticated, (req, res) => {
  const id = req.query.entrenadorID;
  if (!id) return res.redirect('/formEliminarEntrenador');

  coneccion.query('SELECT * FROM Entrenadores WHERE id_entrenador=?', [id], (err, rows) => {
    if (err) return res.status(500).send('Error al obtener el entrenador');
    if (!rows || !rows.length) return res.status(404).send('Entrenador no encontrado');

    coneccion.query('SELECT id_categoria,nombre_categoria FROM Categorias ORDER BY nombre_categoria',
    (e2, categorias) => {
      if (e2) return res.status(500).send('Error al cargar categorías');
      res.render('AdminGeneral/ActualizarConfirmacionEntrenador', {
        usuario: req.user,
        entrenador: rows[0],
        categorias,
        isDelete: true
      });
    });
  });
});

// POST: Ejecutar eliminación
router.post('/eliminarEntrenador/:id',
  authControlador.isAuthenticated,
  authControlador.eliminarEntrenador
);

// API: equipos por categoría (si no lo tienes)
router.get('/api/equipos', authControlador.isAuthenticated, (req, res) => {
  const cat = req.query.categoriaID || null;
  const sql = `
    SELECT id_equipo, nombre
    FROM Equipos
    WHERE (? IS NULL OR id_categoria = ?)
    ORDER BY nombre
  `;
  coneccion.query(sql, [cat, cat], (err, rows) => {
    if (err) return res.json({ ok:false, message:'Error al cargar equipos' });
    res.json({ ok:true, data: rows });
  });
});

// FORM selección eliminar
router.get('/formEliminarEquipo', authControlador.isAuthenticated, (req, res) => {
  coneccion.query('SELECT id_categoria,nombre_categoria FROM Categorias ORDER BY nombre_categoria',
  (e, categorias) => {
    if (e) return res.status(500).send('Error al cargar categorías');
    res.render('AdminGeneral/FormularioEliminarEquipo', {
      usuario: req.user,
      categorias
    });
  });
});

// GET confirmación eliminar (reutiliza vista con isDelete=true)
router.get('/eliminarEquipo', authControlador.isAuthenticated, (req, res) => {
  const id = req.query.equipoID;
  if (!id) return res.redirect('/formEliminarEquipo');

  coneccion.query('SELECT * FROM Equipos WHERE id_equipo=?', [id], (err, rows) => {
    if (err) return res.status(500).send('Error al obtener equipo');
    if (!rows || !rows.length) return res.status(404).send('Equipo no encontrado');

    const equipo = rows[0];
    coneccion.query('SELECT id_categoria,nombre_categoria FROM Categorias ORDER BY nombre_categoria',
    (e2, categorias) => {
      if (e2) return res.status(500).send('Error al cargar categorías');

      // entrenadores de la categoría del equipo (para mostrar en el select; se verá disabled)
      const qEnt = `
        SELECT id_entrenador, CONCAT(nombres,' ',apellido_paterno,' ',apellido_materno) AS nombre
        FROM Entrenadores
        WHERE id_categoria = ?
        ORDER BY nombre`;
      coneccion.query(qEnt, [equipo.id_categoria], (e3, entrenadores) => {
        if (e3) return res.status(500).send('Error al cargar entrenadores');
        res.render('AdminGeneral/ActualizarConfirmacionEquipo', {
          usuario: req.user,
          equipo,
          categorias,
          entrenadores,
          isDelete: true
        });
      });
    });
  });
});

// POST eliminar
router.post('/eliminarEquipo/:id',
  authControlador.isAuthenticated,
  authControlador.eliminarEquipo
);


// FORM selección eliminar jugador
router.get('/formEliminarJugador', authControlador.isAuthenticated, (req, res) => {
  coneccion.query('SELECT id_categoria,nombre_categoria FROM Categorias ORDER BY nombre_categoria',
  (e, categorias) => {
    if (e) return res.status(500).send('Error al cargar categorías');
    res.render('AdminGeneral/FormularioEliminarJugador', { usuario: req.user, categorias });
  });
});

// GET confirmación eliminar (reutiliza vista de actualizar con isDelete)
router.get('/eliminarJugador', authControlador.isAuthenticated, (req, res) => {
  const id = req.query.jugadorID;
  if (!id) return res.redirect('/formEliminarJugador');

  const qJugador = 'SELECT * FROM Jugadores WHERE id_jugador=?';
  coneccion.query(qJugador, [id], (err, rj) => {
    if (err) return res.status(500).send('Error al obtener jugador');
    if (!rj || !rj.length) return res.status(404).send('Jugador no encontrado');
    const jugador = rj[0];

    coneccion.query('SELECT id_categoria,nombre_categoria FROM Categorias ORDER BY nombre_categoria',
    (e1, categorias) => {
      if (e1) return res.status(500).send('Error categorías');
      coneccion.query('SELECT id_equipo,nombre FROM Equipos WHERE id_categoria=? ORDER BY nombre',
      [jugador.id_categoria], (e2, equipos) => {
        if (e2) return res.status(500).send('Error equipos');
        res.render('AdminGeneral/ActualizarConfirmacionJugador', {
          usuario: req.user,
          jugador, categorias, equipos,
          isDelete: true
        });
      });
    });
  });
});

// POST eliminar jugador
router.post('/eliminarJugador/:id',
  authControlador.isAuthenticated,
  authControlador.eliminarJugador
);

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

// GET: Confirmación de eliminar (reutiliza la vista de actualizar en modo delete)
router.get('/eliminarCoordinador', authControlador.isAuthenticated, (req, res) => {
  const id = req.query.coordinador; // ← del select name="coordinador"
  if (!id) return res.redirect('/formEliminarCoordinador');

  coneccion.query('SELECT * FROM Coordinadores WHERE id_coordinador=?', [id], (err, rows) => {
    if (err) return res.status(500).send('Error al obtener el coordinador');
    if (!rows || !rows.length) return res.status(404).send('No encontrado');

    // listas para mostrar los selects (aunque van disabled)
    coneccion.query('SELECT id_categoria,nombre_categoria FROM Categorias ORDER BY nombre_categoria', (e1, categorias) => {
      if (e1) return res.status(500).send('Error cargando categorías');
      coneccion.query("SELECT id_usuario,usuario FROM UsuarioAdministradores WHERE rol='Coordinador' ORDER BY usuario", (e2, userCoordinador) => {
        if (e2) return res.status(500).send('Error cargando usuarios');
        res.render('AdminGeneral/ActualizarConfirmacionCoordinador', {
          usuario: req.user,
          coordinador: rows[0],
          categorias,
          userCoordinador,
          isDelete: true
        });
      });
    });
  });
});

// POST: Eliminar coordinador
router.post('/eliminarCoordinador/:id',
  authControlador.isAuthenticated,
  authControlador.eliminarCoordinador
);

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
// Mostrar form de selección
router.get('/formEliminarUsuarioCoordinador', authControlador.isAuthenticated, (req, res) => {
  coneccion.query("SELECT id_usuario, usuario FROM UsuarioAdministradores WHERE rol='Coordinador' ORDER BY usuario",
  (e, userCoordinador) => {
    if (e) return res.status(500).send('Error al cargar usuarios');
    res.render('AdminGeneral/FormularioEliminarUsuarioCoordinador', { usuario: req.user, userCoordinador });
  });
});

// Ir a confirmación (reutilizando la vista de actualizar con isDelete)
router.get('/eliminarUsuarioCoordinador', authControlador.isAuthenticated, (req, res) => {
  const id = req.query.usuario;
  if (!id) return res.redirect('/formEliminarUsuarioCoordinador');

  coneccion.query('SELECT * FROM UsuarioAdministradores WHERE id_usuario=?', [id], (err, rows) => {
    if (err) return res.status(500).send('Error al obtener usuario');
    if (!rows || !rows.length) return res.status(404).send('Usuario no encontrado');

    res.render('AdminGeneral/ActualizarConfirmacionUsuarioCoordinador', {
      usuario: req.user,
      user: rows[0],
      isDelete: true
    });
  });
});

// Ejecutar eliminación
router.post('/eliminarUsuarioCoordinador/:id',
  authControlador.isAuthenticated,
  authControlador.eliminarUsuarioCoordinador
);



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
// /actualizaCoordinador?coordinador=ID
router.get('/actualizaCoordinador', authControlador.isAuthenticated, (req, res) => {
  const id = req.query.coordinador;

  // 1) Traer el coordinador seleccionado
  coneccion.query(
    "SELECT * FROM Coordinadores WHERE id_coordinador = ?",
    [id],
    (err, coordRows) => {
      if (err) {
        console.error('Error al consultar coordinador:', err);
        return res.status(500).send('Error al obtener el coordinador.');
      }
      const coordinador = coordRows[0];

      // 2) Traer categorías
      coneccion.query(
        "SELECT id_categoria, nombre_categoria FROM Categorias ORDER BY nombre_categoria",
        (err2, categorias) => {
          if (err2) {
            console.error('Error al consultar categorías:', err2);
            return res.status(500).send('Error al obtener categorías.');
          }

          // 3) Traer usuarios con rol Coordinador (ajusta el nombre de tabla si difiere)
          coneccion.query(
            "SELECT id_usuario, usuario FROM UsuarioAdministradores WHERE rol = 'Coordinador' ORDER BY usuario",
            (err3, userCoordinador) => {
              if (err3) {
                console.error('Error al consultar usuarios:', err3);
                return res.status(500).send('Error al obtener usuarios.');
              }

              // Render con todo lo necesario
              res.render('AdminGeneral/ActualizarConfirmacionCoordinador', {
                usuario: req.user,
                coordinador,
                categorias,
                userCoordinador
              });
            }
          );
        }
      );
    }
  );
});

router.post(
  '/actualizarCoordinador/:id',
  authControlador.isAuthenticated,
  authControlador.actualizarCoordinador
);

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
router.post('/actualizarCategoria/:id',authControlador.isAuthenticated, authControlador.actualizarCategoria);

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

// router.js
router.get('/AdminContra', authControlador.isAuthenticated, authControlador.verCambiarContrasena);
router.post('/cambiarContrasena', authControlador.isAuthenticated, authControlador.cambiarContrasena);

//Formularios Estadisticas

//Formularios Admin General
router.post('/nuevaFotoCategoria', authControlador.formAdmin) // Referencia correcta
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