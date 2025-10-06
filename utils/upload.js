const multer = require('multer');
const path = require('path');

const storage = (folder) => multer.diskStorage({
  destination: (_, __, cb) => cb(null, `./public/imgs/${folder}`),
  filename: (_, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

module.exports = {
  catUpload: multer({ storage: storage('Categorias') }),
  teamUpload: multer({ storage: storage('Equipos') }),
  coordUpload: multer({ storage: storage('Coordinadores') }),
  playerUpload: multer({ storage: storage('Jugadores') }),
};
