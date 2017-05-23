import express from 'express';
import userSQL from '../db/sql/userSql';
import md5 from 'blueimp-md5';
const router = express.Router();
// 使用DBConfig.js的配置信息创建一个MySQL连接池
import {dbQuery, myTransaction} from '../db/index';
import {responseJSON} from '../common/index';
import {key} from '../config/';
import { getCnaOpenTime } from '../socket/util';
import jwt from 'jsonwebtoken';
import { integralChangeSql } from '../db/sql';
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
    let rows = await dbQuery('insert into finance_accounts(user_id,user_name,bank_name,bank_account,bank_address) values(?,?,?,?,?)',
    [user_id, userName, bankName, bankAccount, bankAddress]);
    if(rows){
        responseJSON(res, {rs: rows[0]});
    }else{
        responseJSON(res);
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

router.get('/queryWithdrawPwd', async (req, res, next) => {
    const user = req.loginUser;
    let rows = await dbQuery('select withdraw_password from users where user_id = ?',[user.user_id]);
    if(rows[0].withdraw_password){
        responseJSON(res, {err_code: 0});
    }else{
        responseJSON(res,{err_code: -1});
    }
});

router.post('/withdraw', async (req, res, next) => {
    const user = req.loginUser;
    const {withdrawPwd, money, finance_account_id, bank_account, bank_name} = req.body;
    const pwd = md5(withdrawPwd+key.md5);

    let rs = await dbQuery('select integral from users where user_id = ? and withdraw_password = ?',[user.user_id, pwd]);
    if(rs.length == 0){
        responseJSON(res, {err_code: 303,msg: 'password error'});
        return;
    }
    if(rs[0].integral < money){
        responseJSON(res,{err_code: 304,msg: 'integral deficiency'});
        return;
    }

    let rows = await myTransaction([
        {
            sql: 'insert into withdraw_record(user_id,withdraw_money,finance_account_id,bank_account,' +
            'bank_name) values(?,?,?,?,?)',
            params: [user.user_id, money, finance_account_id, bank_account, bank_name],
        },
        {
            sql: "update users integral set integral = (integral - ?) where user_id = ?",
            params: [money, user.user_id],
        },
        {
            sql: integralChangeSql.insert,
            params: [user.user_id, money, changeType.out],
        },
    ]);

    if(rows){
        responseJSON(res, rows);
    }else{
        responseJSON(res);
    }
});


router.put('/setWithdrawPwd', async (req, res, next) => {
    const user = req.loginUser;
    const {withdrawPwd, oldPwd} = req.body;
    const pwd = md5(withdrawPwd+key.md5);
    let rows = false;

    if(oldPwd){
        const old = md5(oldPwd+key.md5);
        let rs = await dbQuery('select user_id from users where withdraw_password = ? and user_id = ?',[old, user.user_id]);
        if(rs && rs.length > 0){//修改密码
            rows = await dbQuery('update users set withdraw_password = ? where user_id = ?',[pwd, user.user_id]);
        }else{
            responseJSON(res, {err_code: 201, msg: 'password error'});
            return;
        }
    }else{//设置密码
        rows = await dbQuery('update users set withdraw_password = ? where user_id = ?',[pwd, user.user_id]);
    }

    if(rows){
        responseJSON(res, {err_code: 0});
    }else{
        responseJSON(res);
    }
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
