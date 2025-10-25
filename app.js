const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const path = require('path');

dotenv.config({ path: './env/.env' });

const app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use('/resources', express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// sesión para flash
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev',
  resave: false,
  saveUninitialized: false,
  cookie: { sameSite: 'lax' } // pon secure:true si usas HTTPS
}));

app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  res.locals.title = 'Academia ITSON';
  next();
});

const setUserLocals = (req, res, next) => {
  if (req.user) res.locals.usuario = req.user; // ← disponible en partials y vistas
  next();
};

// auth opcional
const { isAuthenticated } = require('./middlewares/auth');

// monta routers
app.use('/', require('./Rutas/index'));
app.use('/adminGeneral', isAuthenticated, require('./Rutas/adminGeneral'));
app.use('/Coordinadores', require('./Rutas/coordinador'));
app.use('/adminEstadisticas',isAuthenticated, require('./Rutas/adminEstadisticas'));


// manejador de errores útil en Render
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Internal Server Error');
});

// health checks opcionales
app.get('/health', (_, res) => res.send('ok'));

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';
app.listen(PORT, HOST, () => console.log(`http://${HOST}:${PORT}`));


