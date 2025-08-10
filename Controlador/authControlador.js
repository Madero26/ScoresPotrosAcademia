const jwt = require('jsonwebtoken')
const bcryptjs = require('bcryptjs')
const coneccion = require('../database/conexion')
const { promisify } = require('util')
const multer = require('multer');
const path = require('path');

// Configuración de multer para subir fotos de categorías
const storageCategorias = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/imgs/Categorias'); // Carpeta donde se guardarán las fotos de las categorías
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Nombre del archivo con marca de tiempo
    }
});

const uploadCategorias = multer({ storage: storageCategorias });

// Controlador para manejar la subida de fotos de coordinadores
exports.formAdmin = [
    uploadCategorias.single('fotoCategoria'),
    async (req, res) => {
        try {
            const usuario = req.usuario
            const categoria = req.body.categoriaID;

            // Verificar que la foto de la categoría fue subida correctamente
            if (!req.file) {
                return res.status(400).send("No se subió correctamente la foto de la categoría");
            }

            const urlFotoCategoria = `resources/imgs/Categorias/${req.file.filename}`; // Ruta relativa de la foto



            // Actualizar la URL de la foto de la categoría en la base de datos
            const queryUpdateCategoria = 'UPDATE Categorias SET url_foto = ? WHERE id_categoria = ?';
            await new Promise((resolve, reject) => {
                coneccion.query(queryUpdateCategoria, [urlFotoCategoria, categoria], (err, result) => {
                    if (err) return reject(err);
                    resolve(result);
                });
            });
            coneccion.query("SELECT * FROM Categorias", (error, row) => {
                if (error) {
                    console.error("Error al obtener categorías:", error);
                    return res.status(500).send("Error al recargar categorías.");
                }


                res.render('AdminGeneral/FormFotosCategoria', {
                    usuario: usuario,
                    categorias: row,
                    alert: true,
                    alertTitle: "SUBIDA DE FOTOS",
                    alertMessage: "!Se subieron los datos con éxito!",
                    alertIcon: 'success',
                    showConfirmButton: false,
                    timer: 1500,
                    ruta: 'formAdmin'
                });

            });

        } catch (error) {
            console.error(error);
            res.status(500).send(error);
        }
    }
];

exports.inicio = async (req, res) => {
    try {
        const usuario = req.body.user
        const contra = req.body.pass
        if (!usuario || !contra) {
            res.render('login', {
                alert: true,
                alertTitle: "ADVERTENCIA",
                alertMessage: "Ingrese un usuario y password",
                alertIcon: 'info',
                showConfirmButton: true,
                timer: false,
                ruta: 'Login'
            });
            //(await bcryptjs.compare(contra, result[0].contra))
        } else {
            coneccion.query('SELECT * FROM UsuarioAdministradores WHERE usuario = ?', [usuario], async (error, result) => {
                if (result.length == 0 || !contra == result[0].contra) {
                    res.render('login', {
                        alert: true,
                        alertTitle: "ADVERTENCIA",
                        alertMessage: "Usuario y/o password incorrectas",
                        alertIcon: 'info',
                        showConfirmButton: true,
                        timer: false,
                        ruta: 'Login'
                    });
                } else {
                    const id = result[0].id_usuario
                    const token = jwt.sign({ id: id }, process.env.JWT_SECRETO, {
                        expiresIn: process.env.JWT_TIEMPO_EXPIRA

                    })

                    const cookieOptions = {
                        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
                        httpOnly: true
                    }

                    if (result[0].rol == 'AdministradorEstadisticas') {
                        res.cookie('jwt', token, cookieOptions)
                        res.render('login', {
                            alert: true,
                            alertTitle: "Conexion exitosa",
                            alertMessage: "!APROBADOOO!",
                            alertIcon: 'success',
                            showConfirmButton: false,
                            timer: 800,
                            ruta: 'formEstadisticas'
                        })
                    } else if (result[0].rol == 'AdministradorGeneral') {
                        res.cookie('jwt', token, cookieOptions)
                        res.render('login', {
                            alert: true,
                            alertTitle: "Conexion exitosa",
                            alertMessage: "!APROBADOOO!",
                            alertIcon: 'success',
                            showConfirmButton: false,
                            timer: 800,
                            ruta: 'formAdmin'
                        })
                    } else if (result[0].rol == 'Coordinador') {
                        res.cookie('jwt', token, cookieOptions)
                        res.render('login', {
                            alert: true,
                            alertTitle: "Conexion exitosa",
                            alertMessage: "!APROBADOOO!",
                            alertIcon: 'success',
                            showConfirmButton: false,
                            timer: 800,
                            ruta: 'formCoordinadores'
                        })
                    }

                }

            })
        }

    } catch (error) {
        console.log(error)
    }
}

exports.isAuthenticated = async (req, res, next) => {
    if (req.cookies.jwt) {
        try {
            const decodificada = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRETO)
            coneccion.query('SELECT * FROM UsuarioAdministradores WHERE id_usuario = ?', [decodificada.id], (error, results) => {
                if (!results) { return next() }
                if (results[0].rol == 'Coordinador') {
                    coneccion.query('SELECT * FROM Coordinadores WHERE id_usuario = ?', [decodificada.id], (error, coordinadorResult) => {
                        if (error) {
                            console.error(error);
                            return res.status(500).send("Error al consultar coordinador");
                        }
                        // Verifica que se haya encontrado el coordinador
                        if (coordinadorResult.length > 0) {
                            req.user = coordinadorResult[0]; // Almacena el objeto coordinador en req.user
                            return next()
                        } else {
                            console.warn("Coordinador no encontrado");
                        }
                    })
                } else {
                    req.user = results[0]
                    return next()
                }

            })
        } catch (error) {
            console.log(error)
        }
    } else {
        res.redirect('/login')
    }
}

exports.logout = (req, res) => {
    res.clearCookie('jwt')
    return res.redirect('/login')
}



// Controlador para manejar el formulario de categorías
exports.crearCategoria = [
    uploadCategorias.single('fotoCategoria'), // Middleware para manejar la subida del archivo
    async (req, res) => {
        const usuario = req.usuario
        try {
            const { nombre, rango, inferior, superior } = req.body;

            // Validación de la foto
            if (!req.file) {
                return res.status(400).send("Error: No se subió la foto de la categoría.");
            }

            const urlFoto = `resources/imgs/Categorias/${req.file.filename}`; // Ruta relativa de la foto

            // Insertar los datos en la base de datos
            const queryInsertCategoria = `
                INSERT INTO Categorias (url_foto, rango_edad, rango_inferior, rango_superior, nombre_categoria) 
                VALUES (?, ?, ?, ?, ?)
            `;
            await new Promise((resolve, reject) => {
                coneccion.query(
                    queryInsertCategoria,
                    [urlFoto, rango, inferior, superior, nombre],
                    (err, result) => {
                        if (err) return reject(err);
                        resolve(result);
                    }
                );
            });

            // Respuesta exitosa
            res.render('AdminGeneral/FormularioCrearCategoria', {
                alert: true,
                usuario: usuario,
                alertTitle: "¡Éxito!",
                alertMessage: "Categoría creada exitosamente.",
                alertIcon: 'success',
                showConfirmButton: false,
                timer: 1500,
                ruta: 'formCrearCategoria'
            });
        } catch (error) {
            console.error(error);
            res.status(500).send("Error al crear la categoría.");
        }
    }
];

// === ACTUALIZAR CATEGORIA ===
exports.actualizarCategoria = [
  uploadCategorias.single('fotoCategoria'), // foto opcional
  async (req, res) => {
    try {
      const usuario = req.user || req.usuario;            // por si vienes con isAuthenticated
      const id = req.params.id;                            // /actualizarCategoria/:id
      const { nombre, rango, inferior, superior } = req.body;
      const file = req.file;

      // Armamos SET dinámico si hay foto nueva
      let setParts = [
        'nombre_categoria = ?',
        'rango_edad = ?',
        'rango_inferior = ?',
        'rango_superior = ?'
      ];
      const params = [nombre, rango, inferior, superior];

      if (file) {
        const urlFoto = `resources/imgs/Categorias/${file.filename}`;
        setParts.push('url_foto = ?');
        params.push(urlFoto);
      }

      const sql = `UPDATE Categorias SET ${setParts.join(', ')} WHERE id_categoria = ?`;
      params.push(id);

      await new Promise((resolve, reject) => {
        coneccion.query(sql, params, (err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      });

      // Volvemos a cargar categorías para que el admin siga trabajando
      coneccion.query("SELECT * FROM Categorias", (error, categorias) => {
        if (error) return res.status(500).send("Error al recargar categorías.");

        res.render('AdminGeneral/FormularioActualizarCategoria', {
          usuario,
          categorias,
          alert: true,
          alertTitle: "¡Actualizado!",
          alertMessage: "La categoría se actualizó correctamente.",
          alertIcon: 'success',
          showConfirmButton: false,
          timer: 1500,
          ruta: 'formActualizarCategoria'
        });
      });

    } catch (e) {
      console.error("Error al actualizar la categoría:", e);
      res.status(500).send("Error al actualizar la categoría.");
    }
  }
];


const storageEquipos = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/imgs/Equipos'); // Carpeta donde se guardarán las fotos de los equipos
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Nombre del archivo con marca de tiempo
    }
});

const uploadEquipos = multer({ storage: storageEquipos });

// Controlador para manejar el formulario de equipos
exports.crearEquipo = [
    uploadEquipos.single('fotoEquipo'), // Middleware para manejar la subida del archivo
    async (req, res) => {
        try {
            const { nombre, color, couch, categoria } = req.body;

            // Validación de la foto
            if (!req.file) {
                return res.status(400).send("Error: No se subió la foto del equipo.");
            }

            const urlFoto = `resources/imgs/Equipos/${req.file.filename}`; // Ruta relativa de la foto

            // Insertar los datos en la base de datos
            const queryInsertEquipo = `
                INSERT INTO Equipos (nombre, colores, url_foto, id_couch, id_categoria) 
                VALUES (?, ?, ?, ?, ?)
            `;
            await new Promise((resolve, reject) => {
                coneccion.query(
                    queryInsertEquipo,
                    [nombre, color, urlFoto, couch, categoria],
                    (err, result) => {
                        if (err) return reject(err);
                        resolve(result);
                    }
                );
            });

            // Recargar categorías y entrenadores para el renderizado
            coneccion.query("SELECT * FROM Categorias", (error, categorias) => {
                if (error) {
                    console.error("Error al obtener categorías:", error);
                    return res.status(500).send("Error al recargar categorías.");
                }
                coneccion.query("SELECT * FROM entrenadores", (errores, entrenadores) => {
                    if (errores) {
                        console.error("Error al obtener entrenadores:", errores);
                        return res.status(500).send("Error al recargar entrenadores.");
                    }
                    res.render('AdminGeneral/FormularioCrearEquipos', {
                        alert: true,
                        usuario: req.user,
                        alertTitle: "¡Éxito!",
                        alertMessage: "Equipo creado exitosamente.",
                        alertIcon: 'success',
                        showConfirmButton: false,
                        timer: 1500,
                        ruta: 'formCrearEquipos',
                        categorias: categorias,
                        entrenadores: entrenadores
                    });
                });
            });

        } catch (error) {
            console.error("Error al crear el equipo:", error);
            res.status(500).send("Error al crear el equipo.");
        }
    }
];


exports.crearUsuario = async (req, res) => {
    try {
        const usuario = req.usuario
        const { user, Contraseña } = req.body;


        // Insertar los datos en la base de datos
        const queryInsertUsuario = `
            INSERT INTO UsuarioAdministradores (usuario, contra, rol) 
            VALUES (?, ?, 'Coordinador')
        `;
        await new Promise((resolve, reject) => {
            coneccion.query(queryInsertUsuario, [user, Contraseña], (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });
        // Renderizar vista con mensaje de éxito
        res.render('AdminGeneral/FormularioCrearUsuarioCoordinador', {
            usuario: usuario,
            alert: true,
            alertTitle: "¡Éxito!",
            alertMessage: "Usuario creado exitosamente.",
            alertIcon: 'success',
            showConfirmButton: false,
            timer: 1500,
            ruta: 'formCrearUsuarioCoordinador',
        });

    } catch (error) {
        console.error("Error al crear el usuario:", error);

        // Renderizar vista con mensaje de error
        res.render('AdminGeneral/FormularioCrearUsuarioCoordinador', {
            usuario: usuario,
            alert: true,
            alertTitle: "¡Error!",
            alertMessage: "Ocurrió un error al crear el usuario.",
            alertIcon: 'error',
            showConfirmButton: true,
            timer: false,
            ruta: 'formCrearUsuarioCoordinador',
        });
    }
};

// Configuración de Multer para la foto del coordinador
const storageCoordinadores = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/imgs/Coordinadores'); // Carpeta donde se guardarán las fotos de los coordinadores
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Nombre del archivo con marca de tiempo
    }
});

const uploadCoordinadores = multer({ storage: storageCoordinadores });

// Controlador para manejar el formulario de coordinadores
exports.crearCoordinador = [
    uploadCoordinadores.single('fotoCoordinador'), // Middleware para manejar la subida del archivo
    async (req, res) => {
        try {
            // Desestructurar los datos del formulario
            const { nombre, apellidoPaterno, apellidoMaterno, categoria, usuario } = req.body;

            // Validación de la foto
            if (!req.file) {
                return res.status(400).send("Error: No se subió la foto del coordinador.");
            }

            const urlFoto = `resources/imgs/Coordinadores/${req.file.filename}`; // Ruta relativa de la foto

            // Insertar los datos del coordinador en la base de datos
            const queryInsertCoordinador = `
                INSERT INTO Coordinadores (url_foto, nombres, apellido_paterno, apellido_materno, id_categoria, id_usuario)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            await new Promise((resolve, reject) => {
                coneccion.query(
                    queryInsertCoordinador,
                    [urlFoto, nombre, apellidoPaterno, apellidoMaterno, categoria, usuario],
                    (err, result) => {
                        if (err) return reject(err);
                        resolve(result);
                    }
                );
            });

            // Recargar categorías y usuarios (coordinadores) para el renderizado
            coneccion.query("SELECT * FROM Categorias", (error, categorias) => {
                if (error) {
                    console.error("Error al obtener categorías:", error);
                    return res.status(500).send("Error al recargar categorías.");
                }

                coneccion.query("SELECT * FROM UsuarioAdministradores WHERE rol = 'Coordinador'", (errores, userCoordinador) => {
                    if (errores) {
                        console.error("Error al obtener usuarios coordinadores:", errores);
                        return res.status(500).send("Error al recargar usuarios coordinadores.");
                    }

                    // Renderizar la vista con mensaje de éxito
                    res.render('AdminGeneral/FormularioCrearCoordinadores', {
                        alert: true,
                        usuario: req.user,
                        alertTitle: "¡Éxito!",
                        alertMessage: "Coordinador creado exitosamente.",
                        alertIcon: 'success',
                        showConfirmButton: false,
                        timer: 1500,
                        ruta: 'formCrearCoordinadores',
                        categorias: categorias,
                        userCoordinador: userCoordinador
                    });
                });
            });

        } catch (error) {
            console.error("Error al crear el coordinador:", error);
            res.status(500).send("Error al crear el coordinador.");
        }
    }
];

// Controlador: ACTUALIZAR COORDINADOR
exports.actualizarCoordinador = [
  uploadCoordinadores.single('fotoCoordinador'), // foto opcional
  (req, res) => {
    const id = req.params.id;
    const { nombre, apellidoPaterno, apellidoMaterno, categoria, usuario } = req.body;

    // Armamos UPDATE dinámico si hay foto nueva
    let setParts = [
      'nombres = ?',
      'apellido_paterno = ?',
      'apellido_materno = ?',
      'id_categoria = ?',
      'id_usuario = ?'
    ];
    const params = [nombre, apellidoPaterno, apellidoMaterno, categoria || null, usuario || null];

    if (req.file) {
      setParts.push('url_foto = ?');
      params.push(`resources/imgs/Coordinadores/${req.file.filename}`);
    }

    const sql = `UPDATE Coordinadores SET ${setParts.join(', ')} WHERE id_coordinador = ?`;
    params.push(id);

    coneccion.query(sql, params, (err) => {
      if (err) {
        console.error('Error al actualizar coordinador:', err);
        return res.status(500).send('Error al actualizar coordinador.');
      }

      // Tras actualizar, recargamos la lista para la pantalla de selección
      coneccion.query('SELECT * FROM Coordinadores', (error, coordinadores) => {
        if (error) {
          console.error(error);
          return res.status(500).send('Error al recargar coordinadores.');
        }

        // Mandamos variables del Swal AL EJS
        return res.render('AdminGeneral/FormularioActualizarCoordinador', {
          usuario: req.user,               // para tu header
          coordinadores,                   // lista para seleccionar de nuevo
          alert: true,
          alertTitle: '¡Actualizado!',
          alertMessage: `El coordinador «${nombre}» se actualizó correctamente.`,
          alertIcon: 'success',
          showConfirmButton: false,
          timer: 1500,
          ruta: 'formActualizarCoordinador' // a dónde regresar después del popup
        });
      });
    });
  }
];



// Controlador para manejar el formulario de entrenadores
exports.crearEntrenador = async (req, res) => {
    try {
        // Desestructurar los datos del formulario
        const { nombre, apellidoPaterno, apellidoMaterno, categoria } = req.body;

        // Insertar los datos del entrenador en la base de datos
        const queryInsertEntrenador = `
            INSERT INTO Entrenadores (nombres, apellido_paterno, apellido_materno, id_categoria)
            VALUES (?, ?, ?, ?)
        `;
        await new Promise((resolve, reject) => {
            coneccion.query(
                queryInsertEntrenador,
                [nombre, apellidoPaterno, apellidoMaterno, categoria],
                (err, result) => {
                    if (err) return reject(err);
                    resolve(result);
                }
            );
        });

        // Recargar categorías para el renderizado
        coneccion.query("SELECT * FROM Categorias", (error, categorias) => {
            if (error) {
                console.error("Error al obtener categorías:", error);
                return res.status(500).send("Error al recargar categorías.");
            }

            // Renderizar la vista con mensaje de éxito
            res.render('AdminGeneral/FormularioCrearEntrenadores', {
                alert: true,
                usuario: req.user,
                alertTitle: "¡Éxito!",
                alertMessage: "Entrenador creado exitosamente.",
                alertIcon: 'success',
                showConfirmButton: false,
                timer: 1500,
                ruta: 'formCrearEntrenadores',
                categorias: categorias
            });
        });

    } catch (error) {
        console.error("Error al crear el entrenador:", error);
        res.status(500).send("Error al crear el entrenador.");
    }
};

exports.listarEntrenadoresPorCategoria = (req, res) => {
  const { categoriaID } = req.query;
  if (!categoriaID) return res.status(400).json({ ok:false, message:'categoriaID requerido' });

  const sql = `
    SELECT id_entrenador,
           CONCAT(nombres,' ',apellido_paterno,' ',apellido_materno) AS nombre
    FROM Entrenadores
    WHERE id_categoria = ?
    ORDER BY nombres, apellido_paterno, apellido_materno
  `;
  coneccion.query(sql, [categoriaID], (err, rows) => {
    if (err) return res.status(500).json({ ok:false, message:'Error al obtener entrenadores' });
    res.json({ ok:true, data: rows });
  });
};
exports.mostrarActualizarEntrenador = (req, res) => {
  const id = req.query.entrenadorID || req.query.entrenador;
  if (!id) return res.status(400).send('Falta entrenadorID');

  coneccion.query('SELECT * FROM Entrenadores WHERE id_entrenador=?', [id], (err, entRows) => {
    if (err) return res.status(500).send('Error al obtener entrenador');
    if (!entRows.length) return res.status(404).send('Entrenador no encontrado');

    const entrenador = entRows[0];
    coneccion.query('SELECT id_categoria, nombre_categoria FROM Categorias ORDER BY nombre_categoria', (e2, categorias) => {
      if (e2) return res.status(500).send('Error al obtener categorías');

      res.render('AdminGeneral/ActualizarConfirmacionEntrenador', {
        usuario: req.user,
        entrenador,
        categorias
      });
    });
  });
};
exports.actualizarEntrenador = (req, res) => {
  const id = req.params.id;
  const { nombres, apellidoPaterno, apellidoMaterno, categoria } = req.body;

  const sql = `
    UPDATE Entrenadores
    SET nombres=?, apellido_paterno=?, apellido_materno=?, id_categoria=?
    WHERE id_entrenador=?`;
  const params = [nombres, apellidoPaterno, apellidoMaterno, categoria || null, id];

  coneccion.query(sql, params, (err) => {
    if (err) {
      console.error('Error al actualizar entrenador:', err);
      return res.status(500).send('Error al actualizar entrenador');
    }

    // recarga categorías para el EJS de selección y manda el Swal
    coneccion.query('SELECT * FROM Categorias', (e, categorias) => {
      if (e) return res.status(500).send('Error al recargar categorías');
      res.render('AdminGeneral/FormularioActualizarEntrenador', {
        usuario: req.user,
        categorias,
        alert: true,
        alertTitle: '¡Actualizado!',
        alertMessage: `El entrenador «${nombres}» se actualizó correctamente.`,
        alertIcon: 'success',
        showConfirmButton: false,
        timer: 1500,
        ruta: 'formActualizarEntrenador'
      });
    });
  });
};


// Configuración de multer para subir fotos de jugadores
const storageJugadores = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/imgs/Jugadores'); // Carpeta donde se guardarán las fotos de los jugadores
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Nombre del archivo con marca de tiempo
    }
});

const uploadJugadores = multer({ storage: storageJugadores });

// Controlador para manejar el formulario de jugadores
exports.crearJugador = [

    uploadJugadores.single('fotoJugador'), // Middleware para manejar la subida del archivo
    async (req, res) => {
        try {
            const usuario = req.usuario
            // Desestructurar los datos del formulario
            const { nombres, apellidoPaterno, apellidoMaterno, fechaNacimiento, categoria } = req.body;
            const { file } = req;



            // Validación de la foto
            if (!file) {
                return res.status(400).send("Error: No se subió la foto del jugador.");
            }

            // Ruta de la foto
            const urlFoto = `resources/imgs/Jugadores/${file.filename}`;

            // Insertar los datos en la base de datos
            const queryInsertJugador = `
                INSERT INTO Jugadores (url_foto, nombres, apellido_paterno, apellido_materno, fecha_nacimiento,id_equipo,  id_categoria) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            await new Promise((resolve, reject) => {
                coneccion.query(
                    queryInsertJugador,
                    [urlFoto, nombres, apellidoPaterno, apellidoMaterno, fechaNacimiento, , categoria],
                    (err, result) => {
                        if (err) return reject(err);
                        resolve(result);
                    }
                );
            });

            // Recargar categorías para el renderizado
            coneccion.query("SELECT * FROM Categorias", (error, categorias) => {
                if (error) {
                    console.error("Error al obtener categorías:", error);
                    return res.status(500).send("Error al recargar categorías.");
                }

                // Redirigir al formulario con un mensaje de éxito
                res.render('AdminGeneral/FormularioCrearJugador', {
                    alert: true,
                    usuario: usuario,
                    alertTitle: "¡Éxito!",
                    alertMessage: "Jugador creado exitosamente.",
                    alertIcon: 'success',
                    showConfirmButton: false,
                    timer: 1500,
                    ruta: 'formCrearJugador',
                    categorias: categorias
                });
            });
        } catch (error) {
            console.error("Error al crear el jugador:", error);
            res.status(500).send("Error al crear el jugador.");
        }
    }
];

// Controlador para manejar el formulario de creación de usuario familiar
exports.crearUsuarioJugador = async (req, res) => {
    try {
        const usuario = req.usuario;
        // Desestructurar los datos del formulario
        const { user, Contraseña, jugador } = req.body;




        // Insertar los datos en la base de datos
        const queryInsertUsuario = `
            INSERT INTO UsuarioFamiliarPago (usuario, contra, id_jugador) 
            VALUES (?, ?, ?)
        `;

        await new Promise((resolve, reject) => {
            coneccion.query(
                queryInsertUsuario,
                [user, Contraseña, jugador],
                (err, result) => {
                    if (err) return reject(err);
                    resolve(result);
                }
            );
        });

        // Recargar jugadores para el renderizado
        coneccion.query("SELECT * FROM Jugadores", (error, jugadores) => {
            if (error) {
                console.error("Error al obtener jugadores:", error);
                return res.status(500).send("Error al recargar jugadores.");
            }

            // Redirigir con un mensaje de éxito
            res.render('AdminGeneral/FormularioCrearUsuarioJugador', {
                alert: true,
                usuario: usuario,
                alertTitle: "¡Éxito!",
                alertMessage: "Usuario creado exitosamente.",
                alertIcon: 'success',
                showConfirmButton: false,
                timer: 1500,
                ruta: 'formCrearUsuarioJugador',
                jugadores: jugadores
            });
        });
    } catch (error) {
        console.error("Error al crear el usuario:", error);
        res.status(500).send("Error al crear el usuario.");
    }
};
exports.registrarPago = async (req, res) => {
    try {
        // Desestructurar los datos del formulario
        const { semana, jugador, pago, total } = req.body;

        // Validar los campos del formulario
        if (!semana || !jugador || !pago || total === undefined) {
            return res.status(400).send("Todos los campos son obligatorios.");
        }

        // Determinar el estatus del pago y el adeudo
        let estatus_pago = pago === 'si' ? 'Pagado' : 'Pendiente';
        let total_adeudo = pago === 'si' ? 0 : parseInt(total, 10);

        if (pago === 'no' && total_adeudo <= 0) {
            return res.status(400).send("El adeudo debe ser mayor a 0 si no se realizó el pago.");
        }

        // Obtener la fecha actual
        const fechaActual = new Date().toISOString().split('T')[0]; // Formato: YYYY-MM-DD

        // Insertar los datos en la tabla `pagos`
        const queryInsertPago = `
            INSERT INTO pagos (numero_semana, estatus_pago, total_adeudo, fecha, id_jugador)
            VALUES (?, ?, ?, ?, ?)
        `;
        await new Promise((resolve, reject) => {
            coneccion.query(
                queryInsertPago,
                [semana, estatus_pago, total_adeudo, fechaActual, jugador],
                (err, result) => {
                    if (err) return reject(err);
                    resolve(result);
                }
            );
        });

        // Recargar jugadores para el renderizado
        coneccion.query("SELECT * FROM Jugadores", (error, jugadores) => {
            if (error) {
                console.error("Error al obtener jugadores:", error);
                return res.status(500).send("Error al recargar jugadores.");
            }

            // Renderizar la vista con mensaje de éxito
            res.render('AdminGeneral/FormularioAgregarCuotaJugador', {
                alert: true,
                usuario: req.user,
                alertTitle: "¡Éxito!",
                alertMessage: "Pago registrado exitosamente.",
                alertIcon: 'success',
                showConfirmButton: false,
                timer: 1500,
                ruta: 'formAgregarPago',
                jugadores: jugadores
            });
        });

    } catch (error) {
        console.error("Error al registrar el pago:", error);
        res.status(500).send("Error al registrar el pago.");
    }
};


exports.verCategorias = (req, res) => {
    coneccion.query(
        "SELECT * FROM Categorias ORDER BY CAST(SUBSTRING_INDEX(nombre_categoria, '-', 1) AS UNSIGNED)",
        (error, categorias) => {
            if (error) return res.status(500).send("Error al obtener categorías.");
            res.render('Estadisticas', { categorias });
        }
    );
};

exports.verCategoriasStanding = (req, res) => {
    coneccion.query(
        "SELECT * FROM Categorias ORDER BY CAST(SUBSTRING_INDEX(nombre_categoria, '-', 1) AS UNSIGNED)",
        (error, categorias) => {
            if (error) return res.status(500).send("Error al obtener categorías.");
            res.render('Standing', { categorias });
        }
    );
};

exports.verCategoriasDestacados = (req, res) => {
    coneccion.query(
        "SELECT * FROM Categorias ORDER BY CAST(SUBSTRING_INDEX(nombre_categoria, '-', 1) AS UNSIGNED)",
        (error, categorias) => {
            if (error) return res.status(500).send("Error al obtener categorías.");
            res.render('JugadoresD', { categorias });
        }
    );
};


exports.verEquiposPorCategoria = (req, res) => {
    const idCategoria = req.params.id;

    const queryEquipos = `
        SELECT 
            e.*, 
            c.nombre_categoria 
        FROM Equipos e
        JOIN Categorias c ON e.id_categoria = c.id_categoria
        WHERE e.id_categoria = ?
    `;

    coneccion.query(queryEquipos, [idCategoria], (error, equipos) => {
        if (error) {
            console.error("Error al obtener equipos:", error);
            return res.status(500).send("Error al obtener equipos.");
        }

        res.render('categorias/equiposPorCategoria', {
            equipos,
            categoriaNombre: equipos[0]?.nombre_categoria || 'Categoría',
            categoriaId: idCategoria
        });
    });
};


// Estadísticas generales del equipo
exports.verEstadisticasEquipo = (req, res) => {
    const idEquipo = req.params.id_equipo;

    const queryEquipo = 'SELECT nombre FROM Equipos WHERE id_equipo = ?';
    const queryEstadisticas = 'SELECT * FROM EstadisticasEquipo WHERE id_equipo = ?';

    coneccion.query(queryEquipo, [idEquipo], (error1, equipo) => {
        if (error1) return res.status(500).send('Error al obtener el equipo.');

        coneccion.query(queryEstadisticas, [idEquipo], (error2, estadisticas) => {
            if (!estadisticas || estadisticas.length === 0) {
                return res.render('categorias/EstadisticasEquipo', {
                    equipoNombre: equipo[0]?.nombre || 'Equipo',
                    estadisticas: null
                });
            }

            res.render('categorias/EstadisticasEquipo', {
                equipoNombre: equipo[0]?.nombre || 'Equipo',
                estadisticas: estadisticas[0]
            });

        });
    });
};

// Jugadores del equipo (con estadísticas si las necesitas)
exports.verJugadoresDelEquipo = (req, res) => {
    const idEquipo = req.params.id_equipo;

    const query = `
    SELECT j.*, 
           eb.turnos, eb.hits, eb.carreras, eb.promedio_bateo,
           ep.victorias, ep.derrotas, ep.efectividad, ep.ponches
    FROM Jugadores j
    LEFT JOIN EstadisticasBateo eb ON j.id_jugador = eb.id_jugador
    LEFT JOIN EstadisticasPitcheo ep ON j.id_jugador = ep.id_jugador
    WHERE j.id_equipo = ?
  `;

    coneccion.query(query, [idEquipo], (error, jugadores) => {
        if (error) return res.status(500).send('Error al obtener jugadores.');

        res.render('categorias/jugadoresEquipo', { jugadores });
    });
};

exports.buscarJugadorPorNombre = (req, res) => {
  const categoriaId = req.params.id;
  const nombreBuscado = req.query.nombre;

  const queryJugador = `
    SELECT j.*, e.nombre AS equipo_nombre, e.url_foto AS equipo_foto
    FROM Jugadores j
    JOIN Equipos e ON j.id_equipo = e.id_equipo
    WHERE j.id_categoria = ? AND 
          CONCAT(j.nombres, ' ', j.apellido_paterno, ' ', j.apellido_materno) LIKE ?
    LIMIT 1
  `;

  coneccion.query(queryJugador, [categoriaId, `%${nombreBuscado}%`], (err, jugadores) => {
    if (err || jugadores.length === 0) {
      return res.send("Jugador no encontrado en esta categoría.");
    }

    const jugador = jugadores[0];

    // Obtener estadísticas (ambas) de forma anidada
    coneccion.query(`SELECT * FROM EstadisticasBateo WHERE id_jugador = ?`, [jugador.id_jugador], (errBateo, bateo) => {
      if (errBateo) return res.send("Error en estadísticas de bateo");

      coneccion.query(`SELECT * FROM EstadisticasPitcheo WHERE id_jugador = ?`, [jugador.id_jugador], (errPitcheo, pitcheo) => {
        if (errPitcheo) return res.send("Error en estadísticas de pitcheo");

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
};






// Al inicio asegúrate que ya tienes:


// ACTUALIZAR JUGADOR (pulido)
exports.actualizarJugador = [
  // si tienes multer para jugadores, déjalo; si no, cambia a (req,res,next)=>next()
  uploadJugadores?.single ? uploadJugadores.single('fotoJugador') : (req,res,next)=>next(),
  async (req, res) => {
    try {
      const id = req.params.id;
      const usuario = req.user || req.usuario;

      // normaliza/trim
      const nombres         = (req.body.nombres || '').trim();
      const apellidoPaterno = (req.body.apellidoPaterno || '').trim();
      const apellidoMaterno = (req.body.apellidoMaterno || '').trim();
      const categoria       = req.body.categoria || null;
      const equipo          = req.body.equipo || null;

      // si el input date viene vacío -> null
      const fechaNacimiento = req.body.fechaNacimiento ? req.body.fechaNacimiento : null;

      let sql = `
        UPDATE Jugadores
        SET nombres = ?, apellido_paterno = ?, apellido_materno = ?, fecha_nacimiento = ?, id_categoria = ?, id_equipo = ?
      `;
      const params = [nombres, apellidoPaterno, apellidoMaterno, fechaNacimiento, categoria, equipo];

      if (req.file) {
        sql += `, url_foto = ?`;
        params.push(`resources/imgs/Jugadores/${req.file.filename}`);
      }

      sql += ` WHERE id_jugador = ?`;
      params.push(id);

      await new Promise((resolve, reject) => {
        coneccion.query(sql, params, (err, result) => err ? reject(err) : resolve(result));
      });

      // recargar categorías y mostrar mensajito (igual que en los otros)
      coneccion.query("SELECT * FROM Categorias", (error, categorias) => {
        if (error) return res.status(500).send("Error al cargar categorías.");
        res.render('AdminGeneral/FormularioActualizarJugador', {
          usuario,
          categorias,
          alert: true,
          alertTitle: "¡Actualizado!",
          alertMessage: `El jugador «${nombres}» se actualizó correctamente.`,
          alertIcon: 'success',
          showConfirmButton: false,
          timer: 1500,
          ruta: 'formActualizarJugador'
        });
      });

    } catch (error) {
      console.error("Error al actualizar jugador:", error);
      res.status(500).send("Error al actualizar jugador.");
    }
  }
];



exports.verCoordinadores = (req, res) => {
    const sql = `
        SELECT c.id_coordinador, c.nombres, c.apellido_paterno, c.apellido_materno, 
               c.url_foto, cat.nombre_categoria 
        FROM Coordinadores c
        INNER JOIN Categorias cat ON c.id_categoria = cat.id_categoria
    `;

    coneccion.query(sql, (error, coordinadores) => {
        if (error) return res.status(500).send("Error al obtener coordinadores.");
        res.render('Coordinadores', { coordinadores }); // Asegúrate que exista esta vista
    });
};

exports.verSecciones = (req, res) => {
    const categoriaID = req.params.id;
    coneccion.query(
        'SELECT nombre_categoria FROM Categorias WHERE id_categoria = ?',
        [categoriaID],
        (err, result) => {
            if (err || result.length === 0) {
                return res.status(500).send('Error al obtener la categoría.');
            }

            const categoriaNombre = result[0].nombre_categoria;
            res.render('Destacados/seccionesEstadisticas', { categoriaID, categoriaNombre });
        }
    );
};

// Controlador

const obtenerConfiguracionEstadistica = (tipo) => {
    const configuraciones = {
        promedio: { campo: 'promedio_bateo', tabla: 'EstadisticasBateo', titulo: 'Promedio de bateo' },
        sencillos: { campo: 'sencillos', tabla: 'EstadisticasBateo', titulo: 'Sencillos' },
        dobles: { campo: 'dobles', tabla: 'EstadisticasBateo', titulo: 'Dobles' },
        triples: { campo: 'triples', tabla: 'EstadisticasBateo', titulo: 'Triples' },
        home_runs: { campo: 'home_runs', tabla: 'EstadisticasBateo', titulo: 'Home Runs' },
        bases_robadas: { campo: 'bases_robadas', tabla: 'EstadisticasBateo', titulo: 'Bases Robadas' },
        efectividad: { campo: 'efectividad', tabla: 'EstadisticasPitcheo', titulo: 'Efectividad' },
        victorias: { campo: 'victorias', tabla: 'EstadisticasPitcheo', titulo: 'Victorias' },
        ponches: { campo: 'ponches', tabla: 'EstadisticasPitcheo', titulo: 'Ponches' }
    };
    return configuraciones[tipo];
};

exports.estadisticasPorTipo = (req, res) => {
    const { id, tipo } = req.params;
    const paginaActual = parseInt(req.query.pagina) || 1;
    const porPagina = 20;

    const estadisticasMap = {
        promedio: { campo: 'eb.promedio_bateo', titulo: 'Promedio de bateo' },
        sencillos: { campo: 'eb.sencillos', titulo: 'Sencillos conectados' },
        dobles: { campo: 'eb.dobles', titulo: 'Dobles conectados' },
        triples: { campo: 'eb.triples', titulo: 'Triples conectados' },
        homeruns: { campo: 'eb.home_runs', titulo: 'Home runs' },
        robadas: { campo: 'eb.bases_robadas', titulo: 'Bases robadas' },
    };

    const config = estadisticasMap[tipo];
    if (!config) return res.status(400).send("Tipo de estadística inválido.");

    const sqlCategoria = `SELECT nombre_categoria FROM Categorias WHERE id_categoria = ?`;
    coneccion.query(sqlCategoria, [id], (err, resultCat) => {
        if (err) return res.status(500).send("Error al obtener nombre de la categoría");
        const nombreCategoria = resultCat[0]?.nombre_categoria || `Categoría ${id}`;

        const sqlJugadores = `
            SELECT j.id_jugador, 
                   CONCAT(j.nombres, ' ', j.apellido_paterno, ' ', j.apellido_materno) AS nombre, 
                   COALESCE(${config.campo}, 0) AS valor
            FROM Jugadores j
            LEFT JOIN EstadisticasBateo eb ON j.id_jugador = eb.id_jugador
            WHERE j.id_categoria = ?
            ORDER BY valor DESC
            LIMIT ? OFFSET ?
        `;

        const offset = (paginaActual - 1) * porPagina;
        coneccion.query(sqlJugadores, [id, porPagina, offset], (err, jugadores) => {
            if (err) return res.status(500).send("Error al obtener estadísticas: " + err);

            const countSql = `SELECT COUNT(*) AS total FROM Jugadores WHERE id_categoria = ?`;
            coneccion.query(countSql, [id], (err, result) => {
                if (err) return res.status(500).send("Error al contar jugadores.");

                const total = result[0].total;
                const totalPaginas = Math.ceil(total / porPagina);

                res.render("Destacados/Destacados", {
                    jugadoresPaginados: jugadores,
                    totalPaginas,
                    paginaActual,
                    categoriaID: id,
                    nombreCategoria,
                    tipo,
                    tituloEstadistica: config.titulo,
                });
            });
        });
    });
};

exports.listarEquiposPorCategoria = (req, res) => {
  const { categoriaID } = req.query;
  if(!categoriaID) return res.status(400).json({ok:false, message:'categoriaID requerido'});
  const sql = `SELECT id_equipo, nombre FROM Equipos WHERE id_categoria=? ORDER BY nombre`;
  coneccion.query(sql, [categoriaID], (err, rows)=>{
    if(err) return res.status(500).json({ok:false, message:'Error al obtener equipos'});
    res.json({ok:true, data: rows});
  });
};

exports.listarJugadoresPorEquipo = (req, res) => {
  const { equipoID } = req.query;
  if(!equipoID) return res.status(400).json({ok:false, message:'equipoID requerido'});
  const sql = `
    SELECT id_jugador,
           CONCAT(nombres,' ',apellido_paterno,' ',apellido_materno) AS nombre
    FROM Jugadores
    WHERE id_equipo=?
    ORDER BY nombres, apellido_paterno, apellido_materno`;
  coneccion.query(sql, [equipoID], (err, rows)=>{
    if(err) return res.status(500).json({ok:false, message:'Error al obtener jugadores'});
    res.json({ok:true, data: rows});
  });
};
exports.mostrarActualizarJugador = (req, res) => {
  const id = req.query.jugadorID || req.query.jugador;
  if(!id) return res.status(400).send('Falta jugadorID');

  coneccion.query('SELECT * FROM Jugadores WHERE id_jugador=?', [id], (err, rows)=>{
    if(err) return res.status(500).send('Error al obtener jugador');
    if(!rows.length) return res.status(404).send('Jugador no encontrado');

    const jugador = rows[0];

    // categorías para select
    coneccion.query('SELECT id_categoria, nombre_categoria FROM Categorias ORDER BY nombre_categoria', (e2, categorias)=>{
      if(e2) return res.status(500).send('Error al obtener categorías');

      // equipos de la categoría actual del jugador
      coneccion.query('SELECT id_equipo, nombre FROM Equipos WHERE id_categoria=? ORDER BY nombre',
        [jugador.id_categoria],
        (e3, equipos)=>{
          if(e3) return res.status(500).send('Error al obtener equipos');

          res.render('AdminGeneral/ActualizarConfirmacionJugador', {
            usuario: req.user,
            jugador,
            categorias,
            equipos // de la categoría actual, para prellenar
          });
        }
      );
    });
  });
};
exports.listarEquiposPorCategoria = (req, res) => {
  const { categoriaID } = req.query;
  if (!categoriaID) return res.status(400).json({ ok:false, message:'categoriaID requerido' });

  const sql = `SELECT id_equipo, nombre FROM Equipos WHERE id_categoria = ? ORDER BY nombre`;
  coneccion.query(sql, [categoriaID], (err, rows) => {
    if (err) return res.status(500).json({ ok:false, message:'Error al obtener equipos' });
    res.json({ ok:true, data: rows });
  });
};

exports.listarJugadoresPorCategoria = (req, res) => {
  const { categoriaID } = req.query;
  if (!categoriaID) return res.status(400).json({ ok:false, message:'categoriaID requerido' });

  const sql = `
    SELECT id_jugador,
           CONCAT(nombres,' ',apellido_paterno,' ',apellido_materno) AS nombre,
           id_equipo
    FROM Jugadores
    WHERE id_categoria = ?
    ORDER BY nombres, apellido_paterno, apellido_materno
  `;
  coneccion.query(sql, [categoriaID], (err, rows) => {
    if (err) return res.status(500).json({ ok:false, message:'Error al obtener jugadores' });
    res.json({ ok:true, data: rows });
  });
};

exports.listarEquiposPorCategoria = (req, res) => {
  const { categoriaID } = req.query;
  if (!categoriaID) return res.status(400).json({ ok:false, message:'categoriaID requerido' });
  coneccion.query('SELECT id_equipo, nombre FROM Equipos WHERE id_categoria=? ORDER BY nombre',
    [categoriaID],
    (err, rows) => err
      ? res.status(500).json({ ok:false, message:'Error al obtener equipos' })
      : res.json({ ok:true, data: rows })
  );
};

exports.mostrarActualizarEquipo = (req, res) => {
  const id = req.query.equipoID || req.query.equipo;
  if(!id) return res.status(400).send('Falta equipoID');

  coneccion.query('SELECT * FROM Equipos WHERE id_equipo=?', [id], (err, eqRows)=>{
    if(err) return res.status(500).send('Error al obtener equipo');
    if(!eqRows.length) return res.status(404).send('Equipo no encontrado');

    const equipo = eqRows[0];

    // categorías para mover equipo si se requiere
    coneccion.query('SELECT id_categoria, nombre_categoria FROM Categorias ORDER BY nombre_categoria', (e2, categorias)=>{
      if(e2) return res.status(500).send('Error al obtener categorías');

      // entrenadores de esa categoría para id_couch
      coneccion.query(
        `SELECT id_entrenador,
                CONCAT(nombres,' ',apellido_paterno,' ',apellido_materno) AS nombre
         FROM Entrenadores
         WHERE id_categoria = ?
         ORDER BY nombres, apellido_paterno, apellido_materno`,
        [equipo.id_categoria],
        (e3, entrenadores)=>{
          if(e3) return res.status(500).send('Error al obtener entrenadores');

          res.render('AdminGeneral/ActualizarConfirmacionEquipo', {
            usuario: req.user,
            equipo,
            categorias,
            entrenadores
          });
        }
      );
    });
  });
};

exports.actualizarEquipo = [
  (typeof uploadEquipos?.single === 'function' ? uploadEquipos.single('fotoEquipo') : (req,res,next)=>next()),
  (req, res) => {
    const id = req.params.id;
    const usuario = req.user || req.usuario;
    const nombre  = (req.body.nombre  || '').trim();
    const colores = (req.body.colores || '').trim();
    const categoria = req.body.categoria || null;
    const couch    = req.body.couch || null;

    let sql = `UPDATE Equipos SET nombre=?, colores=?, id_categoria=?, id_couch=?`;
    const params = [nombre, colores, categoria, couch];

    if (req.file) {
      sql += `, url_foto=?`;
      params.push(`resources/imgs/Equipos/${req.file.filename}`);
    }
    sql += ` WHERE id_equipo=?`;
    params.push(id);

    coneccion.query(sql, params, (err)=>{
      if (err) {
        console.error('Error al actualizar equipo:', err);
        return res.status(500).send('Error al actualizar equipo');
      }
      // volver a selección con mensajito
      coneccion.query('SELECT * FROM Categorias', (e, categorias)=>{
        if(e) return res.status(500).send('Error al recargar categorías');
        res.render('AdminGeneral/FormularioActualizarEquipo', {
          usuario,
          categorias,
          alert: true,
          alertTitle: '¡Actualizado!',
          alertMessage: `El equipo «${nombre}» se actualizó correctamente.`,
          alertIcon: 'success',
          showConfirmButton: false,
          timer: 1500,
          ruta: 'formActualizarEquipo'
        });
      });
    });
  }
];

// authControlador.js
exports.mostrarActualizarUsuarioCoordinador = (req, res) => {
  const id = req.query.usuario; // viene del <select name="usuario">
  if (!id) return res.status(400).send('Falta usuario');

  coneccion.query(
    'SELECT id_usuario, usuario, rol FROM UsuarioAdministradores WHERE id_usuario = ?',
    [id],
    (err, rows) => {
      if (err) return res.status(500).send('Error al obtener usuario');
      if (!rows.length) return res.status(404).send('Usuario no encontrado');

      const user = rows[0];
      res.render('AdminGeneral/ActualizarConfirmacionUsuarioCoordinador', {
        usuario: req.user, // para el header
        user // {id_usuario, usuario, rol}
      });
    }
  );
};
// authControlador.js
const bcrypt = require('bcryptjs'); // si ya usas bcrypt

exports.actualizarUsuarioCoordinador = async (req, res) => {
  try {
    const id = req.params.id;
    const usuarioSesion = req.user || req.usuario;

    const usuarioNuevo = (req.body.usuarioNuevo || '').trim();
    const rol          = (req.body.rol || 'Coordinador').trim();
    const nuevaContra  = (req.body.nuevaContra || '').trim();

    if (!usuarioNuevo) return res.status(400).send('Usuario requerido');

    let setParts = ['usuario = ?', 'rol = ?'];
    const params = [usuarioNuevo, rol];

    if (nuevaContra) {
      const hash = await bcrypt.hash(nuevaContra, 10); // si NO usas bcrypt, cambia por texto plano (no recomendado)
      setParts.push('contra = ?');
      params.push(hash);
    }

    const sql = `UPDATE UsuarioAdministradores SET ${setParts.join(', ')} WHERE id_usuario = ?`;
    params.push(id);

    await new Promise((resolve, reject) => {
      coneccion.query(sql, params, (err, result) => err ? reject(err) : resolve(result));
    });

    // recargar lista y mostrar SweetAlert en la pantalla de selección
    coneccion.query(
      "SELECT id_usuario, usuario FROM UsuarioAdministradores WHERE rol = 'Coordinador' ORDER BY usuario",
      (e, userCoordinador) => {
        if (e) return res.status(500).send('Error al recargar usuarios');
        res.render('AdminGeneral/FormularioActualizarUsuarioCoordinador', {
          usuario: usuarioSesion,
          userCoordinador,
          alert: true,
          alertTitle: '¡Actualizado!',
          alertMessage: `El usuario «${usuarioNuevo}» se actualizó correctamente.`,
          alertIcon: 'success',
          showConfirmButton: false,
          timer: 1500,
          ruta: 'formActualizarUsuarioCoordinador'
        });
      }
    );
  } catch (err) {
    console.error('Error al actualizar usuario coordinador:', err);
    res.status(500).send('Error al actualizar usuario coordinador.');
  }
};
// authControlador.js

// GET
exports.verCambiarContrasena = (req, res) => {
  res.render('AdminGeneral/contraNuevaAdmin', {
    usuario: req.user, // para mostrar el user en header si quieres
  });
};

// POST
exports.cambiarContrasena = async (req, res) => {
  try {
    const user = req.user; // { id_usuario, ... } desde tu middleware
    const { actual, nueva, confirmar } = req.body;

    if (!actual || !nueva || !confirmar) {
      return res.render('AdminGeneral/contraNuevaAdmin', {
        usuario: user,
        alert: true,
        alertTitle: 'Campos incompletos',
        alertMessage: 'Llena los tres campos.',
        alertIcon: 'warning',
        showConfirmButton: true,
        timer: 0,
        ruta: 'AdminContra'
      });
    }

    if (nueva !== confirmar) {
      return res.render('AdminGeneral/contraNuevaAdmin', {
        usuario: user,
        alert: true,
        alertTitle: 'No coinciden',
        alertMessage: 'La nueva contraseña y su confirmación no coinciden.',
        alertIcon: 'error',
        showConfirmButton: true,
        timer: 0,
        ruta: 'AdminContra'
      });
    }

    // Reglas mínimas (también se validan en el front)
    const ok =
      nueva.length >= 8 &&
      /[a-z]/.test(nueva) &&
      /[A-Z]/.test(nueva) &&
      /[0-9]/.test(nueva) &&
      /[^A-Za-z0-9]/.test(nueva);

    if (!ok) {
      return res.render('AdminGeneral/contraNuevaAdmin', {
        usuario: user,
        alert: true,
        alertTitle: 'Contraseña débil',
        alertMessage: 'Debe tener 8+ caracteres, mayúscula, minúscula, número y símbolo.',
        alertIcon: 'warning',
        showConfirmButton: true,
        timer: 0,
        ruta: '/AdminContra'
      });
    }

    // Traer hash actual
    const sqlGet = 'SELECT contra FROM UsuarioAdministradores WHERE id_usuario = ?';
    const hash = await new Promise((resolve, reject) => {
      coneccion.query(sqlGet, [user.id_usuario], (err, rows) => {
        if (err) return reject(err);
        resolve(rows?.[0]?.contra || '');
      });
    });

    // Validar actual
    const coincide = await bcrypt.compare(actual, hash);
    if (!coincide) {
      return res.render('AdminGeneral/contraNuevaAdmin', {
        usuario: user,
        alert: true,
        alertTitle: 'Contraseña actual incorrecta',
        alertMessage: 'Verifícala e intenta de nuevo.',
        alertIcon: 'error',
        showConfirmButton: true,
        timer: 0,
        ruta: 'AdminContra'
      });
    }

    // Guardar nueva
    const nuevoHash = await bcrypt.hash(nueva, 10);
    const sqlUpd = 'UPDATE UsuarioAdministradores SET contra=? WHERE id_usuario=?';
    await new Promise((resolve, reject) => {
      coneccion.query(sqlUpd, [nuevoHash, user.id_usuario], (err) =>
        err ? reject(err) : resolve()
      );
    });

    // Éxito → re-login opcional: envía a logout o a algún panel
    res.render('Login', {
      usuario: user,
      alert: true,
      alertTitle: '¡Contraseña actualizada!',
      alertMessage: 'Por seguridad, inicia sesión de nuevo.',
      alertIcon: 'success',
      showConfirmButton: false,
      timer: 1600,
      ruta: 'logout' // si prefieres volver al panel: 'formAdmin'
    });

  } catch (err) {
    console.error('Error al cambiar contraseña:', err);
    res.render('AdminGeneral/contraNuevaAdmin', {
      usuario: req.user,
      alert: true,
      alertTitle: 'Error',
      alertMessage: 'No se pudo cambiar la contraseña.',
      alertIcon: 'error',
      showConfirmButton: true,
      timer: 0,
      ruta: 'AdminContra'
    });
  }
};
