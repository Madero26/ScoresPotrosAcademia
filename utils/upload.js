const multer = require('multer');
const path = require('path');
const fs = require('fs');

const BASE = path.join(__dirname, '..', 'public', 'imgs');

const ensureDir = p => { fs.mkdirSync(p, { recursive: true }); };

const storage = folder => multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(BASE, folder);
    ensureDir(dir);             // ← crea si no existe
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const name = `${Date.now()}-${Math.round(Math.random()*1e9)}${ext}`;
    cb(null, name);
  }
});

const imageFilter = (_req, file, cb) => {
  if (/^image\/(png|jpe?g|webp|gif)$/i.test(file.mimetype)) return cb(null, true);
  cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'foto'));
};

const limits = { fileSize: 5 * 1024 * 1024 }; // 5MB

module.exports = {
  catUpload:   multer({ storage: storage('Categorias'),  fileFilter: imageFilter, limits }),
  teamUpload:  multer({ storage: storage('Equipos'),     fileFilter: imageFilter, limits }),
  coordUpload: multer({ storage: storage('Coordinadores'),fileFilter: imageFilter, limits }),
  playerUpload:multer({ storage: storage('Jugadores'),   fileFilter: imageFilter, limits }),
};

