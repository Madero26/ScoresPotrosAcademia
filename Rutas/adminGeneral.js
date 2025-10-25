// Rutas/adminGeneral.js
const express = require('express');
const router = express.Router();
const db = require('../utils/db'); // ← añade esta línea
const { playerUpload } = require('../utils/upload');
const { coordUpload } = require('../utils/upload');
const { teamUpload } = require('../utils/upload');

/* ====== IMPORTA TUS CONTROLADORES EXISTENTES ====== */
const temporadaCtrl = require('../controllers/temporadaController');
const categoriasCtrl = require('../controllers/categoriasController');
const jugadoresCtrl = require('../controllers/jugadoresController');
const entrenadoresCtrl = require('../controllers/entrenadoresController');
const coordinadoresCtrl = require('../controllers/coordinadoresController');
const equiposCtrl = require('../controllers/equiposController');

const categoriaTempRangoCtrl = require('../controllers/categoriaTemporadaRangoController');
const coordTempCatCtrl = require('../controllers/coordinadorTemporadaCategoriaController');
const usuarioRolTempCatCtrl = require('../controllers/usuarioRolTemporadaCategoriaController');
const equipoTemporadaCtrl = require('../controllers/equipoTemporadaController');
const jugadorTempCatCtrl = require('../controllers/jugadorTemporadaCategoriaController');
const jugadorEquipoTempCtrl = require('../controllers/jugadorEquipoTemporadaController');

const estBateoCtrl = require('../controllers/estadisticasBateoController');
const estPitcheoCtrl = require('../controllers/estadisticasPitcheoController');
const estEquipoCtrl = require('../controllers/estadisticasEquipoController');
const estRendCtrl = require('../controllers/estadisticasRendimientoMensualController');

const minimoAparCtrl = require('../controllers/minimoAparicionesController');
const usuariosCtrl = require('../controllers/usuariosController');

const statsGenBateo = require('../controllers/bateoGeneralController');
const statsGenPitcheo = require('../controllers/pitcheoGeneralController');
const statsGenEquipo = require('../controllers/equipoGeneralController');

/* ====== CONTEXTO EN VISTAS + FLASH GLOBAL ====== */
router.use((req, res, next) => {
  res.locals.usuario = req.user;

  // Inyecta y limpia alertas de sesión para cualquier GET renderizado
  if (req.session && req.session.__alert) {
    res.locals.alert = true;
    res.locals.alertTitle = req.session.__alert.alertTitle;
    res.locals.alertMessage = req.session.__alert.alertMessage;
    res.locals.alertIcon = req.session.__alert.alertIcon;
    res.locals.showConfirmButton = req.session.__alert.showConfirmButton;
    res.locals.timer = req.session.__alert.timer;
    res.locals.ruta = req.session.__alert.ruta;
    delete req.session.__alert;
  }

  // Helper disponible en controladores: res.flash(payload, redirectPath)
  // payload = { alertTitle, alertMessage, alertIcon, showConfirmButton, timer, ruta }
  res.flash = (payload, redirectPath) => {
    if (!req.session) return res.redirect(redirectPath);
    req.session.__alert = { alert: true, ...payload };
    return res.redirect(redirectPath);
  };

  next();
});

/* ====== HOME ====== */
router.get(['/', '/inicio'], (req, res) =>
  res.render('Coordinacion/General/inicio')
);

/* ====== HELPERS ====== */
function mapViews(map) {
  Object.entries(map).forEach(([path, view]) => {
    router.get(path, (req, res) => {
      // pasa cualquier flash ya inyectado en res.locals
      res.render(view, res.locals);
    });
  });
}
function bind(method, path, handler, label) {
  if (typeof handler !== 'function') {
    console.error(`[adminGeneral] Falta handler ${label} -> ${method.toUpperCase()} ${path}`);
    return router[method](path, (_req, res) => res.status(501).send(`No implementado: ${label}`));
  }
  router[method](path, handler);
}

/* ====== VISTAS DEL NAV -> EJS ====== */
mapViews({
  // CREAR
  '/formCrearTemporada': 'Coordinacion/General/Crear/formCrearTemporada',
  '/formCrearCategoria': 'Coordinacion/General/Crear/formCrearCategoria',
  '/formCrearJugador': 'Coordinacion/General/Crear/formCrearJugador',
  '/formCrearEntrenador': 'Coordinacion/General/Crear/formCrearEntrenador',
  '/formCrearCoordinador': 'Coordinacion/General/Crear/formCrearCoordinador',

  // USUARIOS
  '/formCrearUsuarioAdmin': 'Coordinacion/General/Crear/formCrearUsuarioAdmin',
  '/formCrearUsuarioCoordinador': 'Coordinacion/General/Crear/formCrearUsuarioCoordinador',
  '/formCrearUsuarioEstadisticas': 'Coordinacion/General/Crear/formCrearUsuarioEstadisticas',

  // Mediciones

  // GESTIÓN POR TEMPORADA

  // CONTROLES DE TEMPORADA

  // ACTUALIZAR

  '/formActualizarUsuarioAdmin': 'Coordinacion/General/Actualizar/formActualizarUsuarioAdmin',
  '/formActualizarUsuarioCoordinador': 'Coordinacion/General/Actualizar/formActualizarUsuarioCoordinador',
  '/formActualizarUsuarioEstadisticas': 'Coordinacion/General/Actualizar/formActualizarUsuarioEstadisticas',
  
});

/* ====== ENDPOINTS CRUD ====== */
/* Temporadas */
bind('get', '/temporadas/:id', temporadaCtrl.obtener, 'temporadas.obtener');
bind('post', '/temporadas', temporadaCtrl.crear, 'temporadas.crear');
bind('post', '/temporadas/:id', temporadaCtrl.actualizar, 'temporadas.actualizar');
bind('post', '/temporadas/:id/eliminar', temporadaCtrl.eliminar, 'temporadas.eliminar');
bind('post', '/temporadas/:id/activar', temporadaCtrl.marcarActiva, 'temporadas.marcarActiva');


// Nueva ruta con datos
router.get('/formActualizarTemporada', async (req, res) => {
  const temporadas = await db.query(
    'SELECT id_temporada, nombre, fecha_inicio, fecha_fin, fecha_corte_edad, is_activa FROM Temporadas ORDER BY fecha_inicio DESC'
  );

  const selId = req.query.id || temporadas[0]?.id_temporada || null;
  let temporada = null;
  if (selId) {
    const r = await db.query('SELECT * FROM Temporadas WHERE id_temporada=? LIMIT 1', [selId]);
    temporada = r[0] || null;
  }

  res.render('Coordinacion/General/Actualizar/formActualizarTemporada', {
    ...res.locals,
    temporadas,
    temporada
  });
});


// FORM ELIMINAR con :id (opcional si aún no lo tienes)
router.get('/formEliminarTemporada/:id', async (req, res) => {
  const r = await db.query('SELECT * FROM Temporadas WHERE id_temporada=? LIMIT 1', [req.params.id]);
  if (!r.length) return res.flash({
    alertTitle: 'No encontrada',
    alertMessage: 'La temporada no existe.',
    alertIcon: 'error', showConfirmButton: true, timer: null, ruta: '/adminGeneral/inicio'
  }, '/adminGeneral/inicio');

  res.render('Coordinacion/General/Eliminar/formEliminarTemporada', {
    ...res.locals,
    temporada: r[0]
  });
});


/* Categorías */
bind('get', '/categorias/:id', categoriasCtrl.obtener, 'categorias.obtener');
bind('post', '/categorias', categoriasCtrl.crear, 'categorias.crear');
bind('post', '/categorias/:id', categoriasCtrl.actualizar, 'categorias.actualizar');
bind('post', '/categorias/:id/eliminar', categoriasCtrl.eliminar, 'categorias.eliminar');

// FORM: Actualizar categoría
router.get('/formActualizarCategoria', async (req, res) => {
  try {
    const categorias = await db.query(
      `SELECT id_categoria, nombre_categoria, edad_min, edad_max, url_foto
       FROM Categorias
       ORDER BY edad_min`
    );

    const selId = req.query.id || (categorias[0] && categorias[0].id_categoria) || null;
    let categoria = null;
    if (selId) {
      const r = await db.query(`SELECT * FROM Categorias WHERE id_categoria=? LIMIT 1`, [selId]);
      categoria = r[0] || null;
    }

    res.render('Coordinacion/General/Actualizar/formActualizarCategoria', {
      ...res.locals,
      categorias,   // <-- clave
      categoria     // <-- clave
    });
  } catch (e) {
    console.error(e);
    // Render con defaults para que la vista no truene
    res.render('Coordinacion/General/Actualizar/formActualizarCategoria', {
      ...res.locals,
      categorias: [],
      categoria: null,
      alert: true,
      alertTitle: 'Error',
      alertMessage: 'No se pudieron cargar las categorías.',
      alertIcon: 'error',
      showConfirmButton: true,
      timer: null,
      ruta: '/adminGeneral/inicio'
    });
  }
});

// Endpoints JSON/HTML
bind('get', '/jugadores/:id', jugadoresCtrl.obtener, 'jugadores.obtener');
// ⬇️ aplica multer en crear/actualizar (campo file: "foto")
router.post('/jugadores', playerUpload.single('foto'), jugadoresCtrl.crear);
router.post('/jugadores/:id', playerUpload.single('foto'), jugadoresCtrl.actualizar);
bind('post', '/jugadores/:id/eliminar', jugadoresCtrl.eliminar, 'jugadores.eliminar');

// Acciones toggle activo
bind('post', '/jugadores/:id/activar', jugadoresCtrl.marcarActivo, 'jugadores.activar');
bind('post', '/jugadores/:id/inactivar', jugadoresCtrl.marcarInactivo, 'jugadores.inactivar');

// FORM crear jugador
router.get('/formCrearJugador', async (req, res) => {
  res.render('Coordinacion/General/Crear/formCrearJugador', {
    ...res.locals
  });
});

// FORM actualizar jugador
router.get('/formActualizarJugador', async (req, res) => {
  try {
    const jugadores = await db.query(
      `SELECT id_jugador, url_foto, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, activo
       FROM Jugadores
       ORDER BY apellido_paterno, apellido_materno, nombres`
    );

    const selId = req.query.id || jugadores[0]?.id_jugador || null;
    let jugador = null;
    if (selId) {
      const r = await db.query(`SELECT * FROM Jugadores WHERE id_jugador=? LIMIT 1`, [selId]);
      jugador = r[0] || null;
    }

    res.render('Coordinacion/General/Actualizar/formActualizarJugador', {
      ...res.locals,
      jugadores,
      jugador
    });
  } catch (e) {
    console.error(e);
    res.render('Coordinacion/General/Actualizar/formActualizarJugador', {
      ...res.locals,
      jugadores: [],
      jugador: null,
      alert: true,
      alertTitle: 'Error',
      alertMessage: 'No se pudieron cargar los jugadores.',
      alertIcon: 'error',
      showConfirmButton: true,
      timer: null,
      ruta: '/adminGeneral/inicio'
    });
  }
});


/* Entrenadores */
bind('get', '/entrenadores/:id', entrenadoresCtrl.obtener, 'entrenadores.obtener');
bind('post', '/entrenadores', entrenadoresCtrl.crear, 'entrenadores.crear');
bind('post', '/entrenadores/:id', entrenadoresCtrl.actualizar, 'entrenadores.actualizar');
bind('post', '/entrenadores/:id/eliminar', entrenadoresCtrl.eliminar, 'entrenadores.eliminar');


// FORM crear
router.get('/formCrearEntrenador', (req, res) => {
  res.render('Coordinacion/General/Crear/formCrearEntrenador', { ...res.locals });
});

// FORM actualizar
router.get('/formActualizarEntrenador', async (req, res) => {
  try {
    const entrenadores = await db.query(
      `SELECT id_entrenador,nombres,apellido_paterno,apellido_materno
       FROM Entrenadores
       ORDER BY apellido_paterno, apellido_materno, nombres`
    );

    const selId = req.query.id || entrenadores[0]?.id_entrenador || null;

    let entrenador = null;
    if (selId) {
      const r = await db.query(
        `SELECT * FROM Entrenadores WHERE id_entrenador=? LIMIT 1`, [selId]
      );
      entrenador = r[0] || null;
    }

    return res.render('Coordinacion/General/Actualizar/formActualizarEntrenador', {
      ...res.locals,
      entrenadores,   // <-- requerido por la EJS
      entrenador      // <-- requerido por la EJS
    });
  } catch (e) {
    console.error(e);
    return res.render('Coordinacion/General/Actualizar/formActualizarEntrenador', {
      ...res.locals,
      entrenadores: [],  // <-- evita ReferenceError
      entrenador: null,
      alert: true,
      alertTitle: 'Error',
      alertMessage: 'No se pudieron cargar entrenadores.',
      alertIcon: 'error',
      showConfirmButton: true,
      timer: null,
      ruta: '/adminGeneral/inicio'
    });
  }
});

module.exports = router;

// CRUD
bind('get', '/coordinadores', coordinadoresCtrl.listar, 'coordinadores.listar');
bind('get', '/coordinadores/:id', coordinadoresCtrl.obtener, 'coordinadores.obtener');
router.post('/coordinadores', coordUpload.single('foto'), coordinadoresCtrl.crear);
router.post('/coordinadores/:id', coordUpload.single('foto'), coordinadoresCtrl.actualizar);
bind('post', '/coordinadores/:id/eliminar', coordinadoresCtrl.eliminar, 'coordinadores.eliminar');

// Forms
router.get('/formCrearCoordinador', (req, res) => {
  res.render('Coordinacion/General/Crear/formCrearCoordinador', { ...res.locals });
});

router.get('/formActualizarCoordinador', async (req, res) => {
  try {
    const coordinadores = await db.query(
      `SELECT id_coordinador,url_foto,nombres,apellido_paterno,apellido_materno
       FROM Coordinadores ORDER BY apellido_paterno, apellido_materno, nombres`
    );
    const selId = req.query.id || coordinadores[0]?.id_coordinador || null;
    let coordinador = null;
    if (selId) {
      const r = await db.query(`SELECT * FROM Coordinadores WHERE id_coordinador=? LIMIT 1`, [selId]);
      coordinador = r[0] || null;
    }
    res.render('Coordinacion/General/Actualizar/formActualizarCoordinador', {
      ...res.locals, coordinadores, coordinador
    });
  } catch (e) {
    console.error(e);
    res.render('Coordinacion/General/Actualizar/formActualizarCoordinador', {
      ...res.locals, coordinadores: [], coordinador: null,
      alert: true, alertTitle: 'Error', alertMessage: 'No se pudieron cargar coordinadores.',
      alertIcon: 'error', showConfirmButton: true, timer: null, ruta: '/adminGeneral/inicio'
    });
  }
});
/* Equipos catálogo */
bind('get', '/equipos/:id', equiposCtrl.obtener, 'equipos.obtener');
bind('post', '/equipos', equiposCtrl.crear, 'equipos.crear');
bind('post', '/equipos/:id', equiposCtrl.actualizar, 'equipos.actualizar');
bind('post', '/equipos/:id/eliminar', equiposCtrl.eliminar, 'equipos.eliminar');

// Forms
router.get('/formCrearEquipoBase', (req, res) => {
  res.render('Coordinacion/General/Crear/formCrearEquipo', { ...res.locals });
});

router.get('/formActualizarEquipoBase', async (req, res) => {
  try {
    const equipos = await db.query(`SELECT * FROM Equipos ORDER BY nombre_corto`);
    const selId = req.query.id || equipos[0]?.id_equipo || null;
    let equipo = null;
    if (selId) {
      const r = await db.query(`SELECT * FROM Equipos WHERE id_equipo=? LIMIT 1`, [selId]);
      equipo = r[0] || null;
    }
    res.render('Coordinacion/General/Actualizar/formActualizarEquipo', {
      ...res.locals, equipos, equipo
    });
  } catch (e) {
    console.error(e);
    res.render('Coordinacion/General/Actualizar/formActualizarEquipo', {
      ...res.locals, equipos: [], equipo: null,
      alert: true, alertTitle: 'Error', alertMessage: 'No se pudieron cargar equipos.',
      alertIcon: 'error', showConfirmButton: true, timer: null, ruta: '/adminGeneral/inicio'
    });
  }
});

/* Formularios */
router.get('/formCrearEquipoTemporada',       equipoTemporadaCtrl.formCrear);
router.get('/formActualizarEquipoTemporada',  equipoTemporadaCtrl.formActualizar);
bind('get','/equipoTemporada/categorias',   equipoTemporadaCtrl.categoriasPorTemporada);
bind('get','/equipoTemporada/equiposBase',  equipoTemporadaCtrl.equiposBase);
bind('get','/equipoTemporada/lista',        equipoTemporadaCtrl.listar);
bind('get','/equipoTemporada/entrenadores', equipoTemporadaCtrl.entrenadoresDisponibles);

router.post('/equipoTemporada',     teamUpload.single('foto'), equipoTemporadaCtrl.crear);
router.post('/equipoTemporada/:id', teamUpload.single('foto'), equipoTemporadaCtrl.actualizar);
bind('post','/equipoTemporada/:id/eliminar', equipoTemporadaCtrl.eliminar);
bind('get','/equipoTemporada/:id(\\d+)',     equipoTemporadaCtrl.obtener);

// CRUD ya existentes siguen igual; recuerda usar teamUpload.single('foto')


// Formularios
router.get('/formCrearCategoriaTemporada',      categoriaTempRangoCtrl.formCrear);
router.get('/formActualizarCategoriaTemporada', categoriaTempRangoCtrl.formActualizar);

// API filtros
bind('get','/categoriaTemporada/disponibles', categoriaTempRangoCtrl.categoriasDisponibles);
bind('get','/categoriaTemporada/lista',       categoriaTempRangoCtrl.listaPorTemporada);
bind('get','/categoriaTemporada/:id(\\d+)',   categoriaTempRangoCtrl.obtener);

// CRUD
bind('post','/categoriaTemporadaRango',            categoriaTempRangoCtrl.crear);
bind('post','/categoriaTemporadaRango/:id',        categoriaTempRangoCtrl.actualizar);
bind('post','/categoriaTemporadaRango/:id/eliminar', categoriaTempRangoCtrl.eliminar);;

// Formularios
router.get('/formAsignarCoordinadorCategoria',        coordTempCatCtrl.formCrear);
router.get('/formActualizarAsignacionCoordinadorCategoria', coordTempCatCtrl.formActualizar);

// Filtros API
bind('get','/coordCat/categorias',     coordTempCatCtrl.categoriasPorTemporada);
bind('get','/coordCat/coordinadores',  coordTempCatCtrl.coordinadoresDisponibles);
bind('get','/coordCat/actual',         coordTempCatCtrl.asignacionActual);

// CRUD
bind('post','/coordinadorTemporadaCategoria',            coordTempCatCtrl.crear);
bind('post','/coordinadorTemporadaCategoria/:id',        coordTempCatCtrl.actualizar);
bind('post','/coordinadorTemporadaCategoria/:id/eliminar', coordTempCatCtrl.eliminar);


// Formularios
router.get('/formAsignarUsuarioRolAlias', usuarioRolTempCatCtrl.formCrear);
router.get('/formActualizarUsuarioRolAlias', usuarioRolTempCatCtrl.formActualizar);

// API filtros/listas
bind('get','/rolAlias/categorias', usuarioRolTempCatCtrl.categoriasDisponibles);
bind('get','/rolAlias/usuarios',   usuarioRolTempCatCtrl.usuariosElegibles);
bind('get','/rolAlias/lista',      usuarioRolTempCatCtrl.listar);
bind('get','/rolAlias/:id(\\d+)',  usuarioRolTempCatCtrl.obtener);

// CRUD
bind('post','/rolAlias',             usuarioRolTempCatCtrl.crear);
bind('post','/rolAlias/:id',         usuarioRolTempCatCtrl.actualizar);
bind('post','/rolAlias/:id/eliminar',usuarioRolTempCatCtrl.eliminar);

// Formularios
router.get('/formAsignarJugadorCategoria',              jugadorTempCatCtrl.formCrear);
router.get('/formActualizarAsignacionJugadorCategoria', jugadorTempCatCtrl.formActualizar);

// API filtros/busqueda
bind('get','/jugadorCat/categorias', jugadorTempCatCtrl.categoriasPorTemporada);
bind('get','/jugadorCat/buscar',     jugadorTempCatCtrl.buscarJugadores);
bind('get','/jugadorCat/lista',      jugadorTempCatCtrl.listarAsignados);
bind('get','/jugadorCat/:id(\\d+)',  jugadorTempCatCtrl.obtener);

// CRUD
bind('post','/jugadorTemporadaCategoria',             jugadorTempCatCtrl.crear);
bind('post','/jugadorTemporadaCategoria/:id',         jugadorTempCatCtrl.actualizar);
bind('post','/jugadorTemporadaCategoria/:id/eliminar',jugadorTempCatCtrl.eliminar);

// Formularios
router.get('/formInscribirJugadorEquipo',                jugadorEquipoTempCtrl.formCrear);
router.get('/formActualizarInscripcionJugadorEquipo',    jugadorEquipoTempCtrl.formActualizar);

// API filtros/listas
bind('get','/inscripcion/categorias', jugadorEquipoTempCtrl.categoriasPorTemporada);
bind('get','/inscripcion/equipos',    jugadorEquipoTempCtrl.equiposPorTempCat);
bind('get','/inscripcion/jugadores',  jugadorEquipoTempCtrl.jugadoresAsignables);
bind('get','/inscripcion/lista',      jugadorEquipoTempCtrl.listar);
bind('get','/inscripcion/:id(\\d+)',  jugadorEquipoTempCtrl.obtener);

// CRUD
bind('post','/jugadorEquipoTemporada',             jugadorEquipoTempCtrl.crear);
bind('post','/jugadorEquipoTemporada/:id',         jugadorEquipoTempCtrl.actualizar);
bind('post','/jugadorEquipoTemporada/:id/eliminar',jugadorEquipoTempCtrl.eliminar);

/* Usuarios del panel */
bind('get', '/usuarios', usuariosCtrl.listar, 'usuarios.listar');
bind('get', '/usuarios/:id', usuariosCtrl.obtener, 'usuarios.obtener');
bind('post', '/usuarios', usuariosCtrl.crear, 'usuarios.crear');
bind('post', '/usuarios/:id', usuariosCtrl.actualizar, 'usuarios.actualizar');
bind('post', '/usuarios/:id/eliminar', usuariosCtrl.eliminar, 'usuarios.eliminar');

router.get('/formCrearUsuario', (req,res)=>{
  res.render('Coordinacion/General/Crear/formCrearUsuario', { ...res.locals });
});

router.get('/formActualizarUsuario', async (req,res)=>{
  try{
    const usuarios = await db.query(
      `SELECT id_usuario, usuario, rol FROM UsuarioAdministradores ORDER BY usuario`
    );

    const selId = req.query.id || usuarios[0]?.id_usuario || null;

    let usr = null;
    if (selId){
      const r = await db.query(
        `SELECT id_usuario, usuario, rol FROM UsuarioAdministradores WHERE id_usuario=? LIMIT 1`,
        [selId]
      );
      usr = r[0] || null;
    }

    const sessionUserId  = Number(req.session?.user?.id_usuario);
    const sessionUserRol = String(req.session?.user?.rol || '').toUpperCase(); // <-- normaliza
    const isSelf = usr ? Number(usr.id_usuario) === sessionUserId : false;

    // Deshabilita select si es su propio usuario y su rol actual es ADMIN
    const canEditRole = !(isSelf && sessionUserRol === 'ADMIN');

    return res.render('Coordinacion/General/Actualizar/formActualizarUsuario', {
      ...res.locals,
      usuarios,
      usuarioSel: usr,
      isSelf,
      canEditRole
    });
  }catch(e){
    console.error(e);
    return res.render('Coordinacion/General/Actualizar/formActualizarUsuario', {
      ...res.locals,
      usuarios: [],
      usuarioSel: null,
      isSelf: false,
      canEditRole: false,
      alert: true,
      alertTitle: 'Error',
      alertMessage: 'No se pudieron cargar usuarios.',
      alertIcon: 'error',
      showConfirmButton: true,
      timer: null,
      ruta: '/adminGeneral/inicio'
    });
  }
});



// API de filtros (cascada)  ← MUEVE ESTO ARRIBA
bind('get','/rendimiento/categorias', estRendCtrl.categoriasPorTemporada);
bind('get','/rendimiento/equipos',    estRendCtrl.equiposPorTempCat);
bind('get','/rendimiento/jugadores',  estRendCtrl.jugadoresFiltro);
bind('get','/rendimiento/fechas',     estRendCtrl.fechasPorJugador);

// API CRUD
bind('post','/rendimiento',           estRendCtrl.crear);
bind('post','/rendimiento/:id',       estRendCtrl.actualizar);
bind('post','/rendimiento/:id/eliminar', estRendCtrl.eliminar);
bind('get','/rendimiento/:id',        estRendCtrl.obtener);

// Formularios
router.get('/CoordRegistrarRendimiento', estRendCtrl.formCrear);
router.get('/formActualizarEstadisticasRendimiento', estRendCtrl.formActualizar);




// Formularios
router.get('/formCrearMinimoApariciones', minimoAparCtrl.formCrear);
router.get('/formActualizarMinimoApariciones', minimoAparCtrl.formActualizar);

// API
bind('get','/minimoApariciones/porTemporada', minimoAparCtrl.obtenerPorTemporada);

// CRUD
bind('post','/minimoApariciones', minimoAparCtrl.crear);
bind('post','/minimoApariciones/actualizar', minimoAparCtrl.actualizar);
bind('post','/minimoApariciones/:id/eliminar', minimoAparCtrl.eliminar);

/* Estadísticas (edición) */
bind('post', '/estadisticas/bateo', estBateoCtrl.upsert, 'estadisticasBateo.upsert');
bind('post', '/estadisticas/pitcheo', estPitcheoCtrl.upsert, 'estadisticasPitcheo.upsert');
bind('post', '/estadisticas/equipo', estEquipoCtrl.upsert, 'estadisticasEquipo.upsert');
bind('post', '/estadisticas/rendimiento', estRendCtrl.crear, 'estadisticasRendimiento.crear');

// ===== VISTAS DE FORMULARIOS (ESTADÍSTICAS GENERAL) =====
router.get('/formStatsCargarBateoEquipo', async (req,res)=>{
  const temporadas = await db.query('SELECT id_temporada,nombre FROM Temporadas ORDER BY fecha_inicio DESC');
  res.render('Coordinacion/General/Estadisticas/formStatsCargarBateoEquipo', { ...res.locals, temporadas });
});
router.get('/formStatsEditarBateoJugador', async (req,res)=>{
  const temporadas = await db.query('SELECT id_temporada,nombre FROM Temporadas ORDER BY fecha_inicio DESC');
  res.render('Coordinacion/General/Estadisticas/formStatsEditarBateoJugador', { ...res.locals, temporadas });
});


// ===== AJAX CASCADA (TEMPORADA -> CATEGORÍA -> EQUIPO -> JUGADORES) =====
bind('get','/stats/categorias', statsGenBateo.categoriasPorTemporada, 'stats.categoriasPorTemporada'); // ?id_temporada
bind('get','/stats/equipos',    statsGenBateo.equiposPorTempCat,     'stats.equiposPorTempCat');       // ?id_temporada&id_categoria
bind('get','/stats/plantel',    statsGenBateo.plantelPorEquipo,      'stats.plantelPorEquipo');        // ?id_equipo_temporada
bind('get','/stats/bateoJugador', statsGenBateo.obtenerBateoJugador, 'stats.obtenerBateoJugador');     // ?id_temporada&id_jugador

// ===== ACCIONES =====
bind('post','/stats/cargarBateoEquipo', statsGenBateo.batchUpsertBateoEquipo, 'stats.batchUpsertBateoEquipo');
bind('post','/stats/editarBateoJugador', statsGenBateo.actualizarBateoJugador, 'stats.actualizarBateoJugador');

// Forms
router.get('/formStatsCargarPitcheoEquipo', async (req,res)=>{
  const temporadas = await db.query('SELECT id_temporada,nombre FROM Temporadas ORDER BY fecha_inicio DESC');
  res.render('Coordinacion/General/Estadisticas/formStatsCargarPitcheoEquipo', { ...res.locals, temporadas });
});
router.get('/formStatsEditarPitcheoJugador', async (req,res)=>{
  const temporadas = await db.query('SELECT id_temporada,nombre FROM Temporadas ORDER BY fecha_inicio DESC');
  res.render('Coordinacion/General/Estadisticas/formStatsEditarPitcheoJugador', { ...res.locals, temporadas });
});

// AJAX (reutiliza cascada)
bind('get','/stats/pitcheoJugador', statsGenPitcheo.obtenerPitcheoJugador, 'stats.obtenerPitcheoJugador'); // ?id_temporada&id_jugador

// Actions
bind('post','/stats/cargarPitcheoEquipo',  statsGenPitcheo.batchUpsertPitcheoEquipo,  'stats.batchUpsertPitcheoEquipo');
bind('post','/stats/editarPitcheoJugador', statsGenPitcheo.actualizarPitcheoJugador,  'stats.actualizarPitcheoJugador');

// Forms
router.get('/formStatsCargarEstadisticaEquipo', async (req,res)=>{
  const temporadas = await db.query('SELECT id_temporada,nombre FROM Temporadas ORDER BY fecha_inicio DESC');
  res.render('Coordinacion/General/Estadisticas/formStatsCargarEstadisticaEquipo', { ...res.locals, temporadas });
});
router.get('/formStatsEditarEstadisticaEquipo', async (req,res)=>{
  const temporadas = await db.query('SELECT id_temporada,nombre FROM Temporadas ORDER BY fecha_inicio DESC');
  res.render('Coordinacion/General/Estadisticas/formStatsEditarEstadisticaEquipo', { ...res.locals, temporadas });
});

// AJAX
bind('get','/stats/equipo', statsGenEquipo.obtenerEquipo, 'statsEquipo.obtener'); // ?id_temporada&id_equipo_temporada

// Actions
bind('post','/stats/cargarEstadisticaEquipo', statsGenEquipo.sumar,       'statsEquipo.sumar');
bind('post','/stats/editarEstadisticaEquipo',  statsGenEquipo.actualizar, 'statsEquipo.actualizar');

module.exports = router;


