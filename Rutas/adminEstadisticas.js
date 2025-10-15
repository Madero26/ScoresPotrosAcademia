// Rutas/adminEstadisticas.js
const express = require('express');
const router = express.Router();
const { isAuthenticated, requireRole } = require('../middlewares/auth');

const bateoEq    = require('../controllersStats/bateoEquipoController');
const bateoJug   = require('../controllersStats/bateoJugadorController');
const pitcheoEq  = require('../controllersStats/pitcheoEquipoController');
const pitcheoJug = require('../controllersStats/pitcheoJugadorController');
const teamStats = require('../controllersStats/statsEquipoController');

router.use(isAuthenticated, requireRole('ESTADISTICAS'));

router.use((req,res,next)=>{
  res.locals.usuario = req.user;
  res.locals.rol = req.auth?.rol;
  res.locals.idCategoria = req.auth?.categoriaId;
  res.locals.idTemporada = req.auth?.temporadaId;
  res.flash = (payload, redirectPath) => {
    if(!req.session) return res.redirect(redirectPath);
    req.session.__alert = { alert:true, ...payload };
    return res.redirect(redirectPath);
  };
  if(req.session?.__alert){ Object.assign(res.locals, req.session.__alert); delete req.session.__alert; }
  next();
});

router.get('/', (_req,res)=> res.render('Coordinacion/Estadisticas/inicio', res.locals));

/* ===== BATEO ===== */
router.get('/StatsCargarBateoEquipo',  bateoEq.formCrear);
router.post('/StatsCargarBateoEquipo', bateoEq.batchUpsertBateo);

router.get('/StatsEditarBateoJugador',  bateoJug.formActualizar);
router.get('/ajax/plantel',             bateoJug.plantel);
router.get('/ajax/bateoJugador',        bateoJug.obtenerStats);
router.post('/StatsEditarBateoJugador', bateoJug.actualizar);

/* ===== PITCHEO ===== */
router.get('/StatsCargarPitcheoEquipo',    pitcheoEq.formCrear);
router.get('/ajax/plantelPitcheo',         pitcheoEq.plantel);           // ?id_equipo_temporada=...
router.post('/StatsCargarPitcheoEquipo',   pitcheoEq.batchUpsertPitcheo);

router.get('/StatsEditarPitcheoJugador',   pitcheoJug.formActualizar);
router.get('/ajax/pitcheoPlantel',         pitcheoJug.plantel);          // alias si lo prefieres
router.get('/ajax/pitcheoJugador',         pitcheoJug.obtenerStats);     // ?id_jugador=...
router.post('/StatsEditarPitcheoJugador',  pitcheoJug.actualizar);

// Equipo
router.get('/StatsCargarEstadisticaEquipo',  teamStats.formCrear);
router.post('/StatsCargarEstadisticaEquipo', teamStats.sumar);
router.get('/StatsEditarEstadisticaEquipo',  teamStats.formActualizar);
router.get('/ajax/equipoStats',               teamStats.obtener);      // ?id_equipo_temporada=...
router.post('/StatsEditarEstadisticaEquipo', teamStats.actualizar);

// Individual (sumar)
router.get('/StatsCargarBateoJugador',   bateoJug.formCrear);
router.post('/StatsCargarBateoJugador',  bateoJug.sumar);
router.get('/StatsCargarPitcheoJugador', pitcheoJug.formCrear);
router.post('/StatsCargarPitcheoJugador',pitcheoJug.sumar);

module.exports = router;





