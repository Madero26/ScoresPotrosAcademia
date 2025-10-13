const db = require('../utils/db');
const bcrypt = require('bcryptjs');

const wantsJSON = req =>
    !!(req.xhr || req.get('x-requested-with') === 'XMLHttpRequest' || req.is('application/json'));

const backCrear = '/adminGeneral/formCrearUsuario';

const roles = new Set(['ADMIN', 'COORDINADOR', 'ESTADISTICAS']);
const rolValido = r => roles.has(String(r || '').toUpperCase());

/* ===== Listar / Obtener ===== */
exports.listar = async (_req, res) => {
    const r = await db.query(`SELECT id_usuario, usuario, rol FROM UsuarioAdministradores ORDER BY usuario`);
    return res.json(r);
};

exports.obtener = async (req, res) => {
    const r = await db.query(
        `SELECT id_usuario, usuario, rol FROM UsuarioAdministradores WHERE id_usuario=?`,
        [req.params.id]
    );
    if (!r.length) return res.status(404).json({ error: 'no encontrado' });
    return res.json(r[0]);
};

/* ===== Crear ===== */
exports.crear = async (req, res) => {
    try {
        const { usuario, contra, rol } = req.body;
        const rolUp = String(rol || '').toUpperCase();
        if (!usuario || !contra || !rolValido(rolUp)) {
            if (wantsJSON(req)) return res.status(400).json({ error: 'faltan o inválidos' });
            return res.flash({
                alertTitle: 'Datos inválidos',
                alertMessage: 'Usuario, contraseña y rol son obligatorios. Rol: ADMIN/COORDINADOR/ESTADISTICAS.',
                alertIcon: 'warning', showConfirmButton: true, timer: null, ruta: backCrear
            }, backCrear);
        }

        const dup = await db.query(`SELECT 1 FROM UsuarioAdministradores WHERE usuario=? LIMIT 1`, [usuario]);
        if (dup.length) {
            if (wantsJSON(req)) return res.status(409).json({ error: 'usuario duplicado' });
            return res.flash({
                alertTitle: 'Duplicado',
                alertMessage: 'Ya existe un usuario con ese nombre.',
                alertIcon: 'error', showConfirmButton: true, timer: null, ruta: backCrear
            }, backCrear);
        }

        const hash = await bcrypt.hash(contra, 10);
        await db.query(
            `INSERT INTO UsuarioAdministradores (usuario,contra,rol) VALUES (?,?,?)`,
            [usuario, hash, rolUp]
        );

        if (wantsJSON(req)) return res.json({ ok: true });
        return res.flash({
            alertTitle: 'Listo',
            alertMessage: 'Usuario creado correctamente.',
            alertIcon: 'success', showConfirmButton: false, timer: 1500, ruta: backCrear
        }, backCrear);

    } catch (e) {
        console.error(e);
        if (wantsJSON(req)) return res.status(500).json({ error: 'error' });
        return res.flash({
            alertTitle: 'Error',
            alertMessage: 'No se pudo crear el usuario.',
            alertIcon: 'error', showConfirmButton: true, timer: null, ruta: backCrear
        }, backCrear);
    }
};

exports.actualizar = async (req, res) => {
  const { id } = req.params;
  const back = `/adminGeneral/formActualizarUsuario?id=${id}`;
  try {
    const editor = req.user || res.locals?.usuario || null;
    if (!editor) {
      if (wantsJSON(req)) return res.status(401).json({ error: 'no auth' });
      return res.flash({
        alertTitle: 'Sesión requerida',
        alertMessage: 'Inicia sesión para continuar.',
        alertIcon: 'warning', showConfirmButton: true, timer: null, ruta: '/Login'
      }, '/Login');
    }

    const { usuario, rol, contra = null } = req.body;
    const incomingRol = String(rol || '').toUpperCase();
    const editorRol   = String(editor.rol || '').toUpperCase();

    if (!usuario || !rolValido(incomingRol)) {
      return wantsJSON(req)
        ? res.status(400).json({ error: 'faltan o inválidos' })
        : res.flash({
            alertTitle: 'Datos inválidos',
            alertMessage: 'Usuario y rol son obligatorios.',
            alertIcon: 'warning', showConfirmButton: true, timer: null, ruta: back
          }, back);
    }

    const curQ = await db.query(
      `SELECT id_usuario, usuario, rol FROM UsuarioAdministradores WHERE id_usuario=? LIMIT 1`,
      [id]
    );
    if (!curQ.length) {
      return wantsJSON(req)
        ? res.status(404).json({ error: 'no encontrado' })
        : res.flash({
            alertTitle: 'No encontrado',
            alertMessage: 'El usuario no existe.',
            alertIcon: 'error', showConfirmButton: true, timer: null, ruta: back
          }, back);
    }

    const current     = curQ[0];
    const selfChange  = Number(editor.id_usuario) === Number(id);
    const roleChanged = String(current.rol).toUpperCase() !== incomingRol;

    // ADMIN logueado NO puede cambiar su propio rol
    if (selfChange && editorRol === 'ADMIN' && roleChanged) {
      return wantsJSON(req)
        ? res.status(403).json({ error: 'no puedes cambiar tu propio rol' })
        : res.flash({
            alertTitle: 'Operación no permitida',
            alertMessage: 'No puedes cambiar tu propio rol mientras estás logueado.',
            alertIcon: 'warning', showConfirmButton: true, timer: null, ruta: back
          }, back);
    }

    // Cambiar rol de otros requiere ser ADMIN
    if (!selfChange && roleChanged && editorRol !== 'ADMIN') {
      return wantsJSON(req)
        ? res.status(403).json({ error: 'sin permisos para cambiar rol' })
        : res.flash({
            alertTitle: 'Sin permisos',
            alertMessage: 'Solo ADMIN puede cambiar roles de otros usuarios.',
            alertIcon: 'error', showConfirmButton: true, timer: null, ruta: back
          }, back);
    }

    // Unicidad usuario
    const dup = await db.query(
      `SELECT 1 FROM UsuarioAdministradores WHERE usuario=? AND id_usuario<>? LIMIT 1`,
      [usuario, id]
    );
    if (dup.length) {
      return wantsJSON(req)
        ? res.status(409).json({ error: 'usuario duplicado' })
        : res.flash({
            alertTitle: 'Duplicado',
            alertMessage: 'Ya existe un usuario con ese nombre.',
            alertIcon: 'error', showConfirmButton: true, timer: null, ruta: back
          }, back);
    }

    // ***** Sincronía con UsuarioRolTemporadaCategoria *****
    if (roleChanged) {
      if (editorRol === 'ADMIN') {
        // ADMIN: libera cualquier vínculo que tuviera este usuario
        await db.query(`DELETE FROM UsuarioRolTemporadaCategoria WHERE id_usuario=?`, [id]);
      } else {
        // No-ADMIN (en la práctica no entrará aquí por regla anterior),
        // pero dejamos la lógica por si habilitas autoedición en el futuro:
        if (incomingRol === 'ADMIN') {
          // Si lo suben a ADMIN, libera sus vínculos
          await db.query(`DELETE FROM UsuarioRolTemporadaCategoria WHERE id_usuario=?`, [id]);
        } else {
          // Cambios entre COORDINADOR <-> ESTADISTICAS
          const link = await db.query(
            `SELECT id, id_temporada, id_categoria FROM UsuarioRolTemporadaCategoria WHERE id_usuario=? LIMIT 1`,
            [id]
          );
          if (link.length) {
            const { id: linkId, id_temporada, id_categoria } = link[0];

            // ¿ya hay alguien con el rol de destino en esa (temp,categ)?
            const clash = await db.query(
              `SELECT 1 FROM UsuarioRolTemporadaCategoria 
                 WHERE id_temporada=? AND id_categoria=? AND rol=? AND id<>? LIMIT 1`,
              [id_temporada, id_categoria, incomingRol, linkId]
            );
            if (clash.length) {
              const msg = `El rol ${incomingRol.toLowerCase()} ya está ocupado en esa categoría.`;
              return wantsJSON(req)
                ? res.status(409).json({ error: msg })
                : res.flash({
                    alertTitle: 'No permitido',
                    alertMessage: msg,
                    alertIcon: 'warning', showConfirmButton: true, timer: null, ruta: back
                  }, back);
            }
            // Actualiza el rol en la misma fila
            await db.query(
              `UPDATE UsuarioRolTemporadaCategoria SET rol=? WHERE id=?`,
              [incomingRol, linkId]
            );
          }
        }
      }
    }

    // ***** Actualiza usuario *****
    // Si es selfChange+ADMIN, conserva rol actual
    const finalRol = (selfChange && editorRol === 'ADMIN') ? current.rol : incomingRol;

    let sql = `UPDATE UsuarioAdministradores SET usuario=?, rol=?`;
    const params = [usuario, finalRol];
    if (contra && String(contra).length) {
      const hash = await bcrypt.hash(contra, 10);
      sql += `, contra=?`;
      params.push(hash);
    }
    sql += ` WHERE id_usuario=?`;
    params.push(id);

    const r = await db.query(sql, params);
    if (!r.affectedRows) {
      return wantsJSON(req)
        ? res.status(404).json({ error: 'no encontrado' })
        : res.flash({
            alertTitle: 'No encontrado',
            alertMessage: 'El usuario no existe.',
            alertIcon: 'error', showConfirmButton: true, timer: null, ruta: back
          }, back);
    }

    return wantsJSON(req)
      ? res.json({ ok: true })
      : res.flash({
          alertTitle: 'Actualizado',
          alertMessage: 'Usuario actualizado correctamente.',
          alertIcon: 'success', showConfirmButton: false, timer: 1200, ruta: back
        }, back);

  } catch (e) {
    console.error(e);
    return wantsJSON(req)
      ? res.status(500).json({ error: 'error' })
      : res.flash({
          alertTitle: 'Error',
          alertMessage: 'Ocurrió un error al actualizar.',
          alertIcon: 'error', showConfirmButton: true, timer: null, ruta: back
        }, back);
  }
};


/* ===== Eliminar ===== */
exports.eliminar = async (req, res) => {
  const { id } = req.params;
  const back = '/adminGeneral/formActualizarUsuario';
  try {
    const editor = req.user || res.locals?.usuario || null;
    if (!editor) {
      if (wantsJSON(req)) return res.status(401).json({ error: 'no auth' });
      return res.flash({
        alertTitle:'Sesión requerida',
        alertMessage:'Inicia sesión para continuar.',
        alertIcon:'warning', showConfirmButton:true, timer:null, ruta:'/Login'
      }, '/Login');
    }

    const editorRol = String(editor.rol || '').toUpperCase();
    if (editorRol !== 'ADMIN') {
      return wantsJSON(req)
        ? res.status(403).json({ error:'solo ADMIN puede eliminar usuarios' })
        : res.flash({
            alertTitle:'Sin permisos',
            alertMessage:'Solo ADMIN puede eliminar usuarios.',
            alertIcon:'error', showConfirmButton:true, timer:null, ruta:back
          }, back);
    }

    if (Number(editor.id_usuario) === Number(id)) {
      return wantsJSON(req)
        ? res.status(400).json({ error:'no puedes eliminar tu propia cuenta' })
        : res.flash({
            alertTitle:'Operación no permitida',
            alertMessage:'No puedes eliminar tu propia cuenta.',
            alertIcon:'warning', showConfirmButton:true, timer:null, ruta:back
          }, back);
    }

    // Verifica que exista y su rol
    const tgt = await db.query(
      `SELECT id_usuario, rol FROM UsuarioAdministradores WHERE id_usuario=? LIMIT 1`,
      [id]
    );
    if (!tgt.length) {
      return wantsJSON(req)
        ? res.status(404).json({ error:'no encontrado' })
        : res.flash({
            alertTitle:'No encontrado',
            alertMessage:'El usuario no existe.',
            alertIcon:'error', showConfirmButton:true, timer:null, ruta:back
          }, back);
    }

    // Evita borrar al último ADMIN
    if (String(tgt[0].rol).toUpperCase() === 'ADMIN') {
      const cnt = await db.query(
        `SELECT COUNT(*) AS n FROM UsuarioAdministradores WHERE rol='ADMIN' AND id_usuario<>?`,
        [id]
      );
      if ((cnt[0]?.n || 0) === 0) {
        return wantsJSON(req)
          ? res.status(409).json({ error:'no puedes eliminar al último ADMIN' })
          : res.flash({
              alertTitle:'Bloqueado',
              alertMessage:'No puedes eliminar al último usuario con rol ADMIN.',
              alertIcon:'warning', showConfirmButton:true, timer:null, ruta:back
            }, back);
      }
    }

    const r = await db.query(`DELETE FROM UsuarioAdministradores WHERE id_usuario=?`, [id]);
    if (!r.affectedRows) {
      return wantsJSON(req)
        ? res.status(404).json({ error:'no encontrado' })
        : res.flash({
            alertTitle:'No encontrado',
            alertMessage:'El usuario no existe.',
            alertIcon:'error', showConfirmButton:true, timer:null, ruta:back
          }, back);
    }

    return wantsJSON(req)
      ? res.json({ ok:true })
      : res.flash({
          alertTitle:'Eliminado',
          alertMessage:'Usuario eliminado.',
          alertIcon:'success', showConfirmButton:false, timer:1200, ruta:back
        }, back);

  } catch (e) {
    console.error(e);
    return wantsJSON(req)
      ? res.status(500).json({ error:'error' })
      : res.flash({
          alertTitle:'Error',
          alertMessage:'No se pudo eliminar.',
          alertIcon:'error', showConfirmButton:true, timer:null, ruta:back
        }, back);
  }
};



