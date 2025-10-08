// script rápido en Node
const bcrypt = require('bcryptjs');
(async () => {
  console.log('admin =>', await bcrypt.hash('hash_admin', 10));
  console.log('coord =>', await bcrypt.hash('hash_coord', 10));
  console.log('stats =>', await bcrypt.hash('hash_stats', 10));
})();

/*

const express = require('express');
const app = express();

app.use(express.urlencoded({extended:false}));
app.use(express.json());

const  dotenv = require('dotenv');
dotenv.config({path:'./env/.env'});

app.use('/resources', express.static('public'));
app.use('/resources', express.static(__dirname + '/pubic'));

app.set('view engine', 'ejs');

const bcrypts = require('bcryptjs');

const session = require('express-session');

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}))

const coneccion = require('./database/conexion');

app.get('/', (req, res)=>{
    res.render('index')
})
app.get('/Login', (req, res)=>{
    res.render('Login')
})
app.get('/register', (req, res)=>{
    res.render('FormFotosEquipos')
})
app.get('/registerFotosCategoria', (req, res)=>{
    res.render('FormFotosCategoria')
})

const multer = require('multer');
const path = require('path');

// Configuración de multer para guardar fotos de equipos
const storageEquipos = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/imgs/Equipos'); // Carpeta donde se guardarán las fotos de los equipos
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Nombre del archivo con marca de tiempo
    }
});

// Configuración de multer para guardar fotos de categorías
const storageCategorias = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/imgs/Categorias'); // Carpeta donde se guardarán las fotos de las categorías
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Nombre del archivo con marca de tiempo
    }
});

// Instancias de Multer para subir archivos
const uploadEquipos = multer({ storage: storageEquipos });
const uploadCategorias = multer({ storage: storageCategorias });

// Ruta para subir fotos de equipo
app.post('/register', uploadEquipos.single('fotoEquipo'), async (req, res) => {
    try {
        const categoria = req.body.categoria;
        const equipo = req.body.equipo;

        // Verificar que la foto del equipo fue subida correctamente
        if (!req.file) {
            return res.status(400).send("No se subió correctamente la foto del equipo");
        }

        const urlFotoEquipo = req.file.path;

        // Paso 1: Obtener el ID de la categoría en base al nombre
        const queryCategoria = 'SELECT id_categoria FROM Categorias WHERE nombre_categoria = ?';
        const categoriaId = await new Promise((resolve, reject) => {
            coneccion.query(queryCategoria, [categoria], (err, result) => {
                if (err) return reject(err);
                if (result.length > 0) {
                    resolve(result[0].id_categoria);
                } else {
                    reject("Categoría no encontrada");
                }
            });
        });

        // Paso 2: Obtener el ID del equipo en base al nombre y la categoría
        const queryEquipo = 'SELECT id_equipo FROM Equipos WHERE nombre = ? AND id_categoria = ?';
        const equipoId = await new Promise((resolve, reject) => {
            coneccion.query(queryEquipo, [equipo, categoriaId], (err, result) => {
                if (err) return reject(err);
                if (result.length > 0) {
                    resolve(result[0].id_equipo);
                } else {
                    reject("Equipo no encontrado");
                }
            });
        });

        // Paso 3: Actualizar la URL de la foto del equipo en la base de datos
        const queryUpdateEquipo = 'UPDATE Equipos SET url_foto = ? WHERE id_equipo = ?';
        await new Promise((resolve, reject) => {
            coneccion.query(queryUpdateEquipo, [urlFotoEquipo, equipoId], (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });

        res.send("Foto del equipo subida y registrada con éxito");
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
});

// Ruta para subir fotos de categoría
app.post('/registerFotosCategoria', uploadCategorias.single('fotoCategoria'), async (req, res) => {
    try {
        const categoria = req.body.categoria;

        // Verificar que la foto de la categoría fue subida correctamente
        if (!req.file) {
            return res.status(400).send("No se subió correctamente la foto de la categoría");
        }

        const urlFotoCategoria = req.file.path;

        // Paso 1: Obtener el ID de la categoría en base al nombre
        const queryCategoria = 'SELECT id_categoria FROM Categorias WHERE nombre_categoria = ?';
        const categoriaId = await new Promise((resolve, reject) => {
            coneccion.query(queryCategoria, [categoria], (err, result) => {
                if (err) return reject(err);
                if (result.length > 0) {
                    resolve(result[0].id_categoria);
                } else {
                    reject("Categoría no encontrada");
                }
            });
        });

        // Paso 2: Actualizar la URL de la foto de la categoría en la base de datos
        const queryUpdateCategoria = 'UPDATE Categorias SET url_foto = ? WHERE id_categoria = ?';
        await new Promise((resolve, reject) => {
            coneccion.query(queryUpdateCategoria, [urlFotoCategoria, categoriaId], (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });

        res.render('FormFotosCategoria', {
            alert: true,
            alertTitle: "SUBIDA DE FOTOS",
            alertMessage: "!Se subireron los datos con éxito!",
            alertIcon: 'success',
            showConfirmButton: false,
            timer: 1500,
            ruta: ''
        })
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
});



app.listen(3000, (req, res)=>{
    console.log('SERVER RUNNING IN http://localhost:3000');
})

*/
