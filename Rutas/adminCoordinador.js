// Rutas/adminCoordinador.js
const express = require('express');
const router = express.Router();

const db = require('../utils/db');
const { isAuthenticated, requireRole } = require('../middlewares/auth');
const { playerUpload, teamUpload } = require('../utils/upload');

const jugadoresCoordCtrl = require('../controllersCoord/jugadoresCoordController');
const entrenadoresCoordCtrl = require('../controllersCoord/entrenadoresCoordController');
const equiposTempCoordCtrl = require('../controllersCoord/equiposTemporadaCoordController');
const jugadorCatCoordCtrl = require('../controllersCoord/jugadorCatCoordController');
const inscCoordCtrl = require('../controllersCoord/inscripcionJugadorEquipoCoordController');
const rendCoordCtrl = require('../controllersCoord/estadisticasRendimientoMensualCoordController');
const statsCoordCtrl = require('../controllersCoord/estadisticasTemporadaCoordController');



// =============================
//   MIDDLEWARES DE ACCESO
// =============================
router.use(isAuthenticated, requireRole('Coordinador'));

// =============================
//   MIDDLEWARE FLASH LOCAL
// =============================
router.use((req, res, next) => {
  res.locals.usuario = req.user;

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

  res.flash = (payload, redirectPath) => {
    if (!req.session) return res.redirect(redirectPath);
    req.session.__alert = { alert: true, ...payload };
    return res.redirect(redirectPath);
  };

  next();
});

// =============================
//   DASHBOARD
// =============================
router.get('/', (req, res) => {
  // usa la vista que sí existe: Coordinacion/Coordinador/inicio.ejs
  res.render('Coordinacion/Coordinador/inicio', {
    usuario: req.user,
    rol: req.auth.rol,
    idCategoria: req.auth.categoriaId
  });
});


//
// ===== JUGADORES =====
//

// Crear jugador
router.get('/CoordCrearJugador', (req, res) => {
  res.render('Coordinacion/Coordinador/Crear/formCrearJugadorCoord', {
    ...res.locals
  });
});

// Gestionar jugador
router.get('/CoordGestionarJugador', async (req, res) => {
  try {
    const jugadores = await db.query(`
      SELECT id_jugador, url_foto, nombres, apellido_paterno, apellido_materno,
             fecha_nacimiento, activo
      FROM Jugadores
      ORDER BY apellido_paterno, apellido_materno, nombres
    `);

    const selId = req.query.id || jugadores[0]?.id_jugador || null;
    let jugador = null;

    if (selId) {
      const r = await db.query(
        `SELECT * FROM Jugadores WHERE id_jugador=? LIMIT 1`,
        [selId]
      );
      jugador = r[0] || null;
    }

    return res.render(
      'Coordinacion/Coordinador/Gestionar/CoordGestionarJugador',
      { ...res.locals, jugadores, jugador }
    );
  } catch (e) {
    console.error(e);
    return res.render(
      'Coordinacion/Coordinador/Gestionar/CoordGestionarJugador',
      {
        ...res.locals,
        jugadores: [],
        jugador: null,
        alert: true,
        alertTitle: 'Error',
        alertMessage: 'No se pudieron cargar los jugadores.',
        alertIcon: 'error',
        showConfirmButton: true,
        timer: null,
        ruta: '/adminCoordinador'
      }
    );
  }
});

// CRUD jugadores
router.post('/jugadores', playerUpload.single('foto'), jugadoresCoordCtrl.crear);
router.post('/jugadores/:id', playerUpload.single('foto'), jugadoresCoordCtrl.actualizar);
router.post('/jugadores/:id/eliminar', jugadoresCoordCtrl.eliminar);
router.post('/jugadores/:id/activar', jugadoresCoordCtrl.marcarActivo);
router.post('/jugadores/:id/inactivar', jugadoresCoordCtrl.marcarInactivo);

//
// ===== ENTRENADORES =====
//

// Crear entrenador
router.get('/CoordCrearEntrenador', (req, res) => {
  res.render('Coordinacion/Coordinador/Crear/formCrearEntrenadorCoord', {
    ...res.locals
  });
});

// Gestionar entrenador
router.get('/CoordGestionarEntrenador', async (req, res) => {
  try {
    const entrenadores = await db.query(`
      SELECT *
      FROM Entrenadores
      ORDER BY apellido_paterno, apellido_materno, nombres
    `);

    const selId = req.query.id || entrenadores[0]?.id_entrenador || null;
    let entrenador = null;

    if (selId) {
      const r = await db.query(
        `SELECT * FROM Entrenadores WHERE id_entrenador=? LIMIT 1`,
        [selId]
      );
      entrenador = r[0] || null;
    }

    return res.render(
      'Coordinacion/Coordinador/Gestionar/CoordGestionarEntrenador',
      { ...res.locals, entrenadores, entrenador }
    );
  } catch (e) {
    console.error(e);
    return res.render(
      'Coordinacion/Coordinador/Gestionar/CoordGestionarEntrenador',
      {
        ...res.locals,
        entrenadores: [],
        entrenador: null,
        alert: true,
        alertTitle: 'Error',
        alertMessage: 'No se pudieron cargar los entrenadores.',
        alertIcon: 'error',
        showConfirmButton: true,
        timer: null,
        ruta: '/adminCoordinador'
      }
    );
  }
});

// CRUD entrenadores
router.post('/entrenadores', entrenadoresCoordCtrl.crear);
router.post('/entrenadores/:id', entrenadoresCoordCtrl.actualizar);
router.post('/entrenadores/:id/eliminar', entrenadoresCoordCtrl.eliminar);

// ======================================
//   EQUIPOS EN TEMPORADA (COORDINADOR)
// ======================================

// Form crear equipo en su categoría
router.get(
  '/CoordRegistrarEquipoTemporada',
  equiposTempCoordCtrl.formCrear
);

// Crear equipo (con foto)
router.post(
  '/equiposTemporada',
  teamUpload.single('foto'),             // ← aquí se guarda en public/imgs/Equipos
  equiposTempCoordCtrl.crear
);

// Form gestionar equipos de su categoría
router.get(
  '/CoordGestionarEquipoTemporada',
  equiposTempCoordCtrl.formGestionar
);

// Actualizar equipo (con foto)
router.post(
  '/equiposTemporada/:id',
  teamUpload.single('foto'),             // ← aquí también
  equiposTempCoordCtrl.actualizar
);

// Eliminar equipo
router.post(
  '/equiposTemporada/:id/eliminar',
  equiposTempCoordCtrl.eliminar
);


// Form para asignar jugador a la categoría del coordinador
router.get(
  '/CoordAsignarJugadorCategoria',
  jugadorCatCoordCtrl.formCrear
);

// Crear asignación jugador-temporada-categoría (usa scope del coordinador)
router.post(
  '/jugadorTemporadaCategoria',
  jugadorCatCoordCtrl.crear
);

// APIs JSON
router.get(
  '/jugadorCat/buscar',
  jugadorCatCoordCtrl.buscarJugadores
);

router.get(
  '/jugadorCat/lista',
  jugadorCatCoordCtrl.listarAsignados
);

// Eliminar vínculo (solo si pertenece a su temporada/categoría)
router.post(
  '/jugadorTemporadaCategoria/:id/eliminar',
  jugadorCatCoordCtrl.eliminar
);

// Formularios
router.get('/CoordInscribirJugadorEquipo',
  inscCoordCtrl.formCrear);

router.get('/CoordGestionarInscripcionJugadorEquipo',
  inscCoordCtrl.formGestionar);

// APIs JSON
router.get('/inscripcion/equipos',
  inscCoordCtrl.equiposPorCategoria);

router.get('/inscripcion/jugadores',
  inscCoordCtrl.jugadoresAsignables);

router.get('/inscripcion/lista',
  inscCoordCtrl.listar);

// (opcional) obtener una inscripción concreta
router.get('/inscripcion/:id',
  inscCoordCtrl.obtener);

// CRUD
router.post('/jugadorEquipoTemporada',
  inscCoordCtrl.crear);

router.post('/jugadorEquipoTemporada/:id',
  inscCoordCtrl.actualizar);

router.post('/jugadorEquipoTemporada/:id/eliminar',
  inscCoordCtrl.eliminar);

  // Formularios
router.get('/CoordRegistrarRendimiento',
  rendCoordCtrl.formCrear);

router.get('/CoordGestionarRendimiento',
  rendCoordCtrl.formActualizar);

// APIs JSON
router.get('/rendimiento/equipos',
  rendCoordCtrl.equiposPorCategoria);

router.get('/rendimiento/jugadores',
  rendCoordCtrl.jugadoresFiltro);

router.get('/rendimiento/fechas',
  rendCoordCtrl.fechasPorJugador);

router.get('/rendimiento/:id',
  rendCoordCtrl.obtener);

// CRUD
router.post('/rendimiento',
  rendCoordCtrl.crear);

router.post('/rendimiento/:id',
  rendCoordCtrl.actualizar);

router.post('/rendimiento/:id/eliminar',
  rendCoordCtrl.eliminar);

  // =============================
//   ESTADÍSTICAS (BATEO / PITCHEO / EQUIPO)
// =============================

// Formularios (ruta "editar" usada en los back y ruta "gestionar" usada en el combo)
router.get('/CoordEditarBateoJugador',
  statsCoordCtrl.formEditarBateo);

router.get('/CoordGestionarEstadisticasBateo',
  statsCoordCtrl.formEditarBateo);

router.get('/CoordEditarPitcheoJugador',
  statsCoordCtrl.formEditarPitcheo);

router.get('/CoordGestionarEstadisticasPitcheo',
  statsCoordCtrl.formEditarPitcheo);

router.get('/CoordEditarEstadisticaEquipo',
  statsCoordCtrl.formEditarEquipo);

router.get('/CoordGestionarEstadisticasEquipo',
  statsCoordCtrl.formEditarEquipo);

// APIs JSON para filtros en EJS
router.get('/stats/categorias',
  statsCoordCtrl.categoriasPorTemporada);

router.get('/stats/equipos',
  statsCoordCtrl.equiposPorTempCat);

router.get('/stats/plantel',
  statsCoordCtrl.plantelEquipo);

router.get('/stats/bateoJugador',
  statsCoordCtrl.bateoJugador);

router.get('/stats/pitcheoJugador',
  statsCoordCtrl.pitcheoJugador);

router.get('/stats/equipo',
  statsCoordCtrl.estadisticasEquipo);

// CRUD (posteos de los formularios)
router.post('/stats/editarBateoJugador',
  statsCoordCtrl.editarBateoJugador);

router.post('/stats/editarPitcheoJugador',
  statsCoordCtrl.editarPitcheoJugador);

router.post('/stats/editarEstadisticaEquipo',
  statsCoordCtrl.editarEstadisticaEquipo);


module.exports = router;




