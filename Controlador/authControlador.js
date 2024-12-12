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



