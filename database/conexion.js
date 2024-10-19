const mysql = require("mysql");

const conexion = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});
conexion.connect((error) => {
    if (error) {
        console.log('error: ' + error);
        return;
    } else {
        console.log('conectado')
    }
})
module.exports = conexion;