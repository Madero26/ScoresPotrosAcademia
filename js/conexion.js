let mysql = require("mysql");

let conexion = mysql.createConnection({
    host: "localhost",
    database: "base_de_datos_beisbol",
    user: "root",
    password: ""
});

conexion.end();