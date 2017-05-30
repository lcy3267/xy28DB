import express from 'express';
import userSQL from '../db/sql/userSql';
import md5 from 'blueimp-md5';
const router = express.Router();
// 使用DBConfig.js的配置信息创建一个MySQL连接池
import {dbQuery} from '../db/index';
import {responseJSON, formatPage} from '../common/index';
import {key} from '../config/';
import { getCnaOpenTime } from '../socket/util';
import jwt from 'jsonwebtoken';

// 添加用户
router.get('/list', async (req, res, next) => {

    const {pageIndex, pageSize, searchKey} = req.query;

    const likeSql = searchKey? ` and account like '%${searchKey}%'`:'';

    const sql = formatPage('select * from users where user_type = 2 and status = 1'+likeSql, pageIndex, pageSize);

    let users = await dbQuery(sql);

    let rs = await dbQuery('select count(user_id) as count from users where user_type = 2 and status = 1');

    if(users){
        responseJSON(res, {users, count: rs[0].count});
    }else{
        responseJSON(res);
    }

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
    let rows = await dbQuery('select account,name,avatar_picture_url,integral,mobile,sex,user_id,password,user_type from users where account =?',[req.body.account]);
    let rs = null;
    if(rows.length == 0){
        rs = {
            err_code: -1,
            msg: 'account not found'
        }
    }else if(password == rows[0].password && rows[0].user_type == 2){
        let user = rows[0];
        delete user.password;
        var token = jwt.sign({user}, key.token, {expiresIn: '24h'});
        rs = {
            token,
            err_code: 0,
            user,
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

router.get('/getUserInfo', async (req, res, next) => {
    const {user_id} = req.loginUser;

    let rows = await dbQuery('select account,name,avatar_picture_url,integral,mobile,sex,user_id,' +
        'password,user_type from users where user_id =?',[user_id]);

    if(rows){
        responseJSON(res, {user: rows[0]});
    }else{
        responseJSON(res);
    }
});

// 绑定银行卡
router.post('/bindBank', async (req, res, next) => {
    const {user_id} = req.loginUser;
    const {userName, bankName, bankAccount, bankAddress, password} = req.body;

    const pwd = md5(password+key.md5);

    let user = await dbQuery('select * from users where user_id = ? and withdraw_password = ?',[user_id, pwd]);

    if(user.length == 1){
        let rows = await dbQuery('insert into finance_accounts(user_id,user_name,bank_name,bank_account,bank_address) values(?,?,?,?,?)',
            [user_id, userName, bankName, bankAccount, bankAddress]);
        if(rows){
            responseJSON(res, {rs: rows[0]});
        }else{
            responseJSON(res);
        }
    }else{
        responseJSON(res, {err_code: 5003, msg: 'pwd error'});
    }
});

router.get('/bankCards', async (req, res, next) => {
    const {user_id} = req.loginUser;

    let rows = await dbQuery('select * from finance_accounts where user_id = ?',[user_id]);

    responseJSON(res, {cards: rows});
});

router.put('/updateUserSpeak', async (req, res, next) => {
    const {user_id, has_speak} = req.body;

    let rows = await dbQuery('update users set has_speak = ? where user_id = ?',[has_speak,user_id]);

    responseJSON(res, {rs: rows});
});


/* GET users listing. */
router.get('/', function (req, res, next) {
    res.json({rs: getCnaOpenTime()});
});

module.exports = router;
