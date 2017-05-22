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
        var token = jwt.sign({user}, key.token, {expiresIn: '30d'});
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

// 添加用户
router.post('/bindBank', async (req, res, next) => {
    const {user_id} = req.loginUser;
    const {userName, bankName, bankAccount, bankAddress, password} = req.body;
    let rows = await dbQuery('insert into finance_accounts(user_id,user_name,bank_name,bank_account,bank_address) values(?,?,?,?,?)',
    [user_id, userName, bankName, bankAccount, bankAddress]);

    responseJSON(res, {rs: rows[0]});
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

router.get('/test', async (req, res, next) => {
    const {user_id, has_speak} = req.body;

    let game_rules = await dbQuery('select g.combine_rates from game_rules g left join rooms r on r.id = ? where g.id = r.rule_combine_id',[1]);

    responseJSON(res, {rs: game_rules});
});


/* GET users listing. */
router.get('/', function (req, res, next) {
    res.json({rs: getCnaOpenTime()});
});

module.exports = router;
