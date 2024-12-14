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
            const categoria = req.body.categoria;

            // Verificar que la foto de la categoría fue subida correctamente
            if (!req.file) {
                return res.status(400).send("No se subió correctamente la foto de la categoría");
            }

            const urlFotoCategoria = req.file.path;

            // Obtener el ID de la categoría en base al nombre
            const queryCategoria = 'SELECT id_categoria FROM Categorias WHERE nombre_categoria = ?';
            const categoriaId = await new Promise((resolve, reject) => {
                coneccion.query(queryCategoria, [categoria], (err, result) => {
                    if (err) return reject(err);
                    if (result.length > 0) {
                        resolve(result[0].id_categoria);
                    } else {
                        res.render('FormFotosCategoria', {
                            usuario: usuario,
                            alert: true,
                            alertTitle: "ADVERTENCIA",
                            alertMessage: "Categoria no encontrada",
                            alertIcon: 'info',
                            showConfirmButton: true,
                            timer: false,
                            ruta: ''
                        });
                    }
                });
            });

            // Actualizar la URL de la foto de la categoría en la base de datos
            const queryUpdateCategoria = 'UPDATE Categorias SET url_foto = ? WHERE id_categoria = ?';
            await new Promise((resolve, reject) => {
                coneccion.query(queryUpdateCategoria, [urlFotoCategoria, categoriaId], (err, result) => {
                    if (err) return reject(err);
                    resolve(result);
                });
            });

            res.render('FormFotosCategoria', {
                usuario: usuario,
                alert: true,
                alertTitle: "SUBIDA DE FOTOS",
                alertMessage: "!Se subieron los datos con éxito!",
                alertIcon: 'success',
                showConfirmButton: false,
                timer: 1500,
                ruta: 'formAdmin'
            });

        } catch (error) {
            console.error(error);
            res.status(500).send(error);
        }
    }
];

exports.inicio = async(req, res)=>{
    try {
        const usuario = req.body.user
        const contra = req.body.pass
        if(!usuario || !contra ){
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
        }else{
            coneccion.query('SELECT * FROM UsuarioAdministradores WHERE usuario = ?', [usuario], async (error, result)=>{
                if(result.length == 0 || ! contra == result[0].contra ){
                    res.render('login', {
                        alert: true,
                        alertTitle: "ADVERTENCIA",
                        alertMessage: "Usuario y/o password incorrectas",
                        alertIcon: 'info',
                        showConfirmButton: true,
                        timer: false,
                        ruta: 'Login'
                    }); 
                }else{
                    const id = result[0].id_usuario
                    const token = jwt.sign({id:id}, process.env.JWT_SECRETO, {
                        expiresIn: process.env.JWT_TIEMPO_EXPIRA

                    })

                    const cookieOptions = {
                        expires: new Date(Date.now()+process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
                        httpOnly: true
                    }
                   
                    if(result[0].rol == 'AdministradorEstadisticas'){
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
                    }else if(result[0].rol == 'AdministradorGeneral'){
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
                    }else if(result[0].rol == 'Coordinador'){
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

exports.isAuthenticated = async (req, res, next) =>{
    if(req.cookies.jwt){
        try {
            const decodificada = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRETO)
            coneccion.query('SELECT * FROM UsuarioAdministradores WHERE id_usuario = ?', [decodificada.id], (error, results) =>{
                if(!results){return next()}
                if(results[0].rol == 'Coordinador'){
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
            }})
        }else{
                req.user = results[0]
                return next()
        }
                
            })
        } catch (error) {
            console.log(error)
        }
    }else{
        res.redirect('/login')
    }
}

exports.logout = (req, res)=> {
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

            const urlFoto = `/public/imgs/Categorias/${req.file.filename}`; // Ruta relativa de la foto

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

            const urlFoto = `/public/imgs/Equipos/${req.file.filename}`; // Ruta relativa de la foto

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

            const urlFoto = `/public/imgs/Coordinadores/${req.file.filename}`; // Ruta relativa de la foto

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
            const urlFoto = `/public/imgs/Jugadores/${file.filename}`;

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