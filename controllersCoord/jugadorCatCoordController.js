// controllersCoord/jugadorCatCoordController.js
const db = require('../utils/db');

const wantsJSON = req =>
  !!(req.xhr ||
     req.get('x-requested-with') === 'XMLHttpRequest' ||
     req.is('application/json'));

const backCrear = '/adminCoordinador/CoordAsignarJugadorCategoria';

// obtiene temporada/categoría desde el JWT/session
function getScope(req) {
  const temporadaId = Number(req.auth && req.auth.temporadaId) || 0;
  const categoriaId = Number(req.auth && req.auth.categoriaId) || 0;
  return { temporadaId, categoriaId };
}

/* ========= FORMULARIO ========= */
exports.formCrear = async (req, res) => {
  const { temporadaId, categoriaId } = getScope(req);

  // Sin asignación -> solo mensaje
  if (!temporadaId || !categoriaId) {
    return res.render('Coordinacion/Coordinador/Crear/CoordAsignarJugadorCategoria', {
      ...res.locals,
      sinAsignacion: true,
      temporada: null,
      categoria: null
    });
  }

  // Traer nombre de temporada y categoría para mostrarlos
  const [temporada] = await db.query(
    'SELECT id_temporada, nombre FROM Temporadas WHERE id_temporada=?',
    [temporadaId]
  );
  const [categoria] = await db.query(
    'SELECT id_categoria, nombre_categoria AS nombre FROM Categorias WHERE id_categoria=?',
    [categoriaId]
  );

  return res.render('Coordinacion/Coordinador/Crear/CoordAsignarJugadorCategoria', {
    ...res.locals,
    sinAsignacion: false,
    temporada,
    categoria
  });
};

/* ========= API AUXILIAR ========= */

// Buscar jugadores (global, como en adminGeneral.jugadorCatController.buscarJugadores)
exports.buscarJugadores = async (req, res) => {
  const q = String(req.query.q || '').trim();
  const params = [];
  let where = '1=1';

  if (q) {
    where = `
      (j.nombres LIKE ? OR j.apellido_paterno LIKE ? OR j.apellido_materno LIKE ?
       OR CONCAT(j.apellido_paterno,' ',j.apellido_materno,' ',j.nombres) LIKE ?)
    `;
    params.push(`%${q}%`,`%${q}%`,`%${q}%`,`%${q}%`);
  }

  const r = await db.query(`
    SELECT j.id_jugador,
           CONCAT(j.apellido_paterno,' ',j.apellido_materno,', ',j.nombres) AS nombre
    FROM Jugadores j
    WHERE ${where}
    ORDER BY j.apellido_paterno, j.apellido_materno, j.nombres
    LIMIT 100
  `, params);

  res.json(r);
};

// Lista de jugadores ya asignados a la temporada/categoría del coordinador
exports.listarAsignados = async (req, res) => {
  const { temporadaId, categoriaId } = getScope(req);
  if (!temporadaId || !categoriaId) return res.json([]);

  const r = await db.query(`
    SELECT jtc.id,
           jtc.id_jugador,
           CONCAT(j.apellido_paterno,' ',j.apellido_materno,', ',j.nombres) AS nombre_jugador,
           DATE_FORMAT(jtc.fecha_asignacion,'%Y-%m-%d %H:%i:%s') AS fecha_asignacion
    FROM JugadorTemporadaCategoria jtc
    JOIN Jugadores j ON j.id_jugador = jtc.id_jugador
    WHERE jtc.id_temporada=? AND jtc.id_categoria=?
    ORDER BY j.apellido_paterno, j.apellido_materno, j.nombres
  `, [temporadaId, categoriaId]);

  res.json(r);
};

/* ========= CREAR ASIGNACIÓN ========= */
exports.crear = async (req, res) => {
  const { temporadaId, categoriaId } = getScope(req);

  if (!temporadaId || !categoriaId) {
    if (wantsJSON(req)) return res.status(400).json({ error: 'sin_asignacion' });
    return res.flash({
      alertTitle: 'Sin categoría',
      alertMessage: 'Tu usuario no tiene temporada/categoría asignadas.',
      alertIcon: 'warning',
      showConfirmButton: true,
      timer: null,
      ruta: backCrear
    }, backCrear);
  }

  try {
    const { id_jugador } = req.body;
    if (!Number(id_jugador)) {
      if (wantsJSON(req)) return res.status(400).json({ error: 'jugador_requerido' });
      return res.flash({
        alertTitle: 'Datos inválidos',
        alertMessage: 'Debes seleccionar un jugador.',
        alertIcon: 'warning',
        showConfirmButton: true,
        timer: null,
        ruta: backCrear
      }, backCrear);
    }

    // Validar que la categoría realmente pertenece a la temporada
    const vcat = await db.query(
      `SELECT 1 FROM CategoriaTemporadaRango
       WHERE id_temporada=? AND id_categoria=? LIMIT 1`,
      [temporadaId, categoriaId]
    );
    if (!vcat.length) {
      if (wantsJSON(req)) return res.status(400).json({ error: 'cat_no_pertenece' });
      return res.flash({
        alertTitle: 'Inválido',
        alertMessage: 'Tu categoría no pertenece a esa temporada (configuración incorrecta).',
        alertIcon: 'warning',
        showConfirmButton: true,
        timer: null,
        ruta: backCrear
      }, backCrear);
    }

    // Regla: un jugador solo puede tener UNA categoría por temporada
    const dup = await db.query(
      `SELECT 1
         FROM JugadorTemporadaCategoria
        WHERE id_jugador=? AND id_temporada=? LIMIT 1`,
      [id_jugador, temporadaId]
    );
    if (dup.length) {
      const msg = 'Ese jugador ya está asignado en esta temporada.';
      if (wantsJSON(req)) return res.status(409).json({ error: msg });
      return res.flash({
        alertTitle: 'No permitido',
        alertMessage: msg,
        alertIcon: 'warning',
        showConfirmButton: true,
        timer: null,
        ruta: backCrear
      }, backCrear);
    }

    await db.query(`
      INSERT INTO JugadorTemporadaCategoria
        (id_jugador, id_temporada, id_categoria, asignado_automatico)
      VALUES (?,?,?,0)
    `, [id_jugador, temporadaId, categoriaId]);

    if (wantsJSON(req)) return res.json({ ok: true });
    return res.flash({
      alertTitle: 'Listo',
      alertMessage: 'Jugador asignado a tu categoría.',
      alertIcon: 'success',
      showConfirmButton: false,
      timer: 1200,
      ruta: backCrear
    }, backCrear);

  } catch (e) {
    console.error(e);
    if (wantsJSON(req)) return res.status(500).json({ error: 'error' });
    return res.flash({
      alertTitle: 'Error',
      alertMessage: 'No se pudo asignar el jugador.',
      alertIcon: 'error',
      showConfirmButton: true,
      timer: null,
      ruta: backCrear
    }, backCrear);
  }
};

/* ========= ELIMINAR ASIGNACIÓN ========= */
exports.eliminar = async (req, res) => {
  const { temporadaId, categoriaId } = getScope(req);
  const { id } = req.params;
  const back = backCrear;

  if (!temporadaId || !categoriaId) {
    if (wantsJSON(req)) return res.status(400).json({ error: 'sin_asignacion' });
    return res.flash({
      alertTitle: 'Sin categoría',
      alertMessage: 'Tu usuario no tiene temporada/categoría asignadas.',
      alertIcon: 'warning',
      showConfirmButton: true,
      timer: null,
      ruta: back
    }, back);
  }

  try {
    // Asegura que el registro sea de la temporada/categoría del coordinador
    const r = await db.query(`
      DELETE FROM JugadorTemporadaCategoria
      WHERE id=? AND id_temporada=? AND id_categoria=?`,
      [id, temporadaId, categoriaId]
    );

    if (!r.affectedRows) {
      if (wantsJSON(req)) return res.status(404).json({ error: 'no_encontrado' });
      return res.flash({
        alertTitle: 'No encontrado',
        alertMessage: 'La asignación no existe o no es de tu categoría.',
        alertIcon: 'error',
        showConfirmButton: true,
        timer: null,
        ruta: back
      }, back);
    }

    if (wantsJSON(req)) return res.json({ ok: true });
    return res.flash({
      alertTitle: 'Eliminado',
      alertMessage: 'Vínculo eliminado.',
      alertIcon: 'success',
      showConfirmButton: false,
      timer: 1200,
      ruta: back
    }, back);

  } catch (e) {
    console.error(e);
    if (wantsJSON(req)) return res.status(500).json({ error: 'error' });
    return res.flash({
      alertTitle: 'Error',
      alertMessage: 'No se pudo eliminar la asignación.',
      alertIcon: 'error',
      showConfirmButton: true,
      timer: null,
      ruta: back
    }, back);
  }
};
