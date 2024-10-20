const express = require('express')
const dotenv = require('dotenv')
const cookieParser = require('cookie-parser')


const app = express()

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
//llamar al router

app.use('/', (require('./Rutas/router')))

/* app.get('/', (req, res)=> {
    res.render('index')
}) */
app.listen(3000, ()=>{
    console.log('SERVER RUNNING IN http://localhost:3000')
})