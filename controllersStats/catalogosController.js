// controllersStats/catalogosController.js
const db = require('../utils/db');

// Obtiene (id_temporada, id_categoria) del alcance del usuario estadísticas
async function getScope(req){
  const u = req.user?.id_usuario;
  if(!u) return null;
  const r = await db.query(`
    SELECT id_temporada, id_categoria, alias
    FROM UsuarioRolTemporadaCategoria
    WHERE id_usuario=? AND rol='ESTADISTICAS'
    ORDER BY id DESC LIMIT 1
  `,[u]);
  return r[0] || null;
}
exports.getScope = getScope;

// Equipos de mi categoría/temporada
exports.equiposDeMiCategoria = async (req,res)=>{
  const s = await getScope(req);
  if(!s) return res.json([]);
  const r = await db.query(`
    SELECT et.id_equipo_temporada, et.nombre, e.nombre_corto
    FROM EquipoTemporada et
    LEFT JOIN Equipos e ON e.id_equipo=et.id_equipo
    WHERE et.id_temporada=? AND et.id_categoria=?
    ORDER BY et.nombre
  `,[s.id_temporada, s.id_categoria]);
  res.json(r);
};

// Plantel del equipo
exports.plantelDelEquipo = async (req,res)=>{
  const s = await getScope(req);
  if(!s) return res.json([]);
  const { id_equipo_temporada } = req.query;
  if(!Number(id_equipo_temporada)) return res.json([]);
  // valida que el equipo pertenezca a mi scope
  const ok = await db.query(`
    SELECT 1 FROM EquipoTemporada
    WHERE id_equipo_temporada=? AND id_temporada=? AND id_categoria=? LIMIT 1
  `,[id_equipo_temporada, s.id_temporada, s.id_categoria]);
  if(!ok.length) return res.json([]);
  const r = await db.query(`
    SELECT j.id_jugador,
           CONCAT(j.apellido_paterno,' ',j.apellido_materno,' ',j.nombres) AS nombre
    FROM JugadorEquipoTemporada jet
    JOIN Jugadores j ON j.id_jugador=jet.id_jugador
    WHERE jet.id_equipo_temporada=?
    ORDER BY nombre
  `,[id_equipo_temporada]);
  res.json(r);
};

// Jugadores de mi categoría/temporada (sin filtrar por equipo)
exports.jugadoresDeMiCategoria = async (req,res)=>{
  const s = await getScope(req);
  if(!s) return res.json([]);
  const r = await db.query(`
    SELECT j.id_jugador,
           CONCAT(j.apellido_paterno,' ',j.apellido_materno,' ',j.nombres) AS nombre
    FROM JugadorTemporadaCategoria jtc
    JOIN Jugadores j ON j.id_jugador=jtc.id_jugador
    WHERE jtc.id_temporada=? AND jtc.id_categoria=?
    ORDER BY nombre
  `,[s.id_temporada, s.id_categoria]);
  res.json(r);
};

