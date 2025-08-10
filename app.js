const express = require('express')
const dotenv = require('dotenv')
const cookieParser = require('cookie-parser')

const path = require('path'); // NUEVO
const app = express()

// NUEVO - configurar carpeta views y layout por defecto
app.set('views', path.join(__dirname, 'views'));

app.set('view engine', 'ejs')

app.use('/resources', express.static('public'));
app.use('/resources', express.static(__dirname + '/pubic'));

app.use(express.urlencoded({extended:true}))
app.use(express.json())

dotenv.config({path: './env/.env'})

app.use(cookieParser())

app.use(function(req, res , next){
    if(!req.user)
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    next()
})

// NUEVO - variables globales para que todos los EJS las reciban
app.use((req, res, next) => {
    res.locals.currentPath = req.path;
    res.locals.title = 'Academia ITSON';
    next();
})

//llamar al router
app.use('/', (require('./Rutas/router')))

/* app.get('/', (req, res)=> {
    res.render('index')
}) */

app.listen(3000, ()=>{
    console.log('SERVER RUNNING IN http://localhost:3000')
})
