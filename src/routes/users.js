import express from 'express';
import userSQL from '../db/sql/userSql';
import md5 from 'blueimp-md5';
const router = express.Router();
// 使用DBConfig.js的配置信息创建一个MySQL连接池
import {dbQuery} from '../db/index';
import {responseJSON} from '../common/index';
import {key} from '../config/';
import { getCnaOpenTime } from '../socket/util';
import jwt from 'jsonwebtoken';
import { changeType } from '../config/index';


// 添加用户
router.get('/list', async (req, res, next) => {
    let users = await dbQuery(userSQL.queryAll);
    responseJSON(res, {users});
});


// 添加用户
router.post('/register', async (req, res, next) => {
    let password = md5(req.body.password+key.md5);
    let rows = await dbQuery(userSQL.insert,[req.body.account,password,req.body.account]);
    let users = await dbQuery(userSQL.queryUserById,[rows.insertId]);

    var token = jwt.sign({user: users[0]}, key.token, {expiresIn: '24h'});

    responseJSON(res, {
        token,
        err_code: 0,
        user: users[0]
    });
});

// 登录
router.post('/login', async (req, res, next) => {
    let password = md5(req.body.password+key.md5);
    let rows = await dbQuery(userSQL.userLogin,[req.body.account, password]);
    let rs = null;
    if(rows.length == 0){
        rs = {
            err_code: -1,
            msg: 'account not found'
        }
    }else if(password == rows[0].password && rows[0].user_type == 2){
        let user = rows[0];
        var token = jwt.sign({user}, key.token, {expiresIn: '24h'});
        rs = {
            token,
            err_code: 0,
            user: rows[0]
        }
    }else{
        rs = {
            err_code: -2,
            msg: 'password error'
        }
    }
    responseJSON(res, rs);
});

// 登录
router.post('/pcLogin', async (req, res, next) => {
    let password = md5(req.body.password+key.md5);
    let rows = await dbQuery(userSQL.userLogin,[req.body.account]);
    let rs = null;
    if(rows.length == 0){
        rs = {
            err_code: -1,
            msg: 'account not found'
        }
    }else if(password == rows[0].password && rows[0].user_type == 1){
        let user = rows[0];
        var token = jwt.sign({user}, key.token, {expiresIn: '24h'});
        rs = {
            err_code: 0,
            user: rows[0],
            token
        }
    }else{
        rs = {
            err_code: -2,
            msg: 'password error'
        }
    }
    responseJSON(res, rs);
});


/* GET users listing. */
router.get('/', function (req, res, next) {
    res.json({rs: getCnaOpenTime()});
});

module.exports = router;
