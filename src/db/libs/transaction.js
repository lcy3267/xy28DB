/**
 * Created by chengyuan on 2017/3/25.
 */
"use strict";

let mysql = require("mysql");

class Transaction {
    constructor(config) {
        this._connection = mysql.createConnection(config);
    }

    start() {
        let _this = this;
        return new Promise(function (resolve, reject) {
            _this._connection.beginTransaction(function (error) {
                if (error) {
                    return reject(error);
                }

                return resolve();
            });
        });
    }

    execute(sql, params) {
        let _this = this;
        return new Promise(function (resolve, reject) {
            _this._connection.query(sql, params, function (error, rows, fields) {
                if (error) {
                    console.log("executeQueryErr:"+error);
                    console.log("executeQueryErr:"+(new Dete()));
                    _this._connection.rollback(function () {
                        reject(error);
                    });
                    return _this.stop();
                }
                return resolve(rows);
            });
        });
    }

    stop() {
        let _this = this;
        return new Promise(function (resolve, reject) {
            _this._connection.commit(function (error) {
                if (error) {
                    console.log("commitErr");
                    return _this._connection.rollback(function () {
                        reject(error);
                    });
                }
                return resolve({err_code: 0});
            });
            _this._connection.end();
        });
    }
}

module.exports = Transaction;