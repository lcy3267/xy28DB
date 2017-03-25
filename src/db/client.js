"use strict";

let mysql = require("mysql");
let Transaction = require("./libs/transaction");
import {mysqlConfig} from '../config/index';


class Client {
    constructor() {
        this._options = mysqlConfig;
        this._transaction = null;
    }

    query(sql, params) {
        let _this = this;
        return new Promise(function (resolve, reject) {
            let connection = mysql.createConnection(_this._options);
            connection.connect();
            connection.query(sql, params, function (error, rows, fields) {
                if (error) {
                    console.log("dbError:"+error);
                    return reject(error);
                }
                return resolve(rows);
            });
            connection.end();
        });
    }

    startTransaction() {
        this._transaction = new Transaction(this._options);
        return this._transaction.start();
    }

    executeTransaction(sql, params) {
        return this._transaction.execute(sql, params);
    }

    stopTransaction() {
        return this._transaction.stop();
    }
}

module.exports = Client;