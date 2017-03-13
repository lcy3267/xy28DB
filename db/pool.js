const mysql = require('mysql');

const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'yuan3267',
    database:'xy28',
    port: 3306
});

exports.query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection) => {
            if (err) {
                console.error("getConnection:"+err);
                return reject(err);
            }
            connection.query(sql, params, (err, result) => {
                connection.release();
                if (err) {
                    console.error("query:"+err);
                    return reject(err);
                }
                resolve(result);
            });
        });
    });
};