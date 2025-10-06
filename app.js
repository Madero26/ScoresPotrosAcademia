const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const path = require('path');

dotenv.config({ path: './env/.env' });

const app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use('/resources', express.static(path.join(__dirname, 'public'))); // corrige "pubic"

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  res.locals.title = 'Academia ITSON';
  next();
});

// monta routers
app.use('/', require('./Rutas/index'));

app.listen(3000, () => console.log('http://localhost:3000'));

