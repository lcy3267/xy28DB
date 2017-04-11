import express from 'express';
import userSQL from '../db/sql/userSql';
const router = express.Router();
// 使用DBConfig.js的配置信息创建一个MySQL连接池
import {dbQuery} from '../db/index';
import {responseJSON} from '../common/index';

// 添加用户
router.post('/register', async (req, res, next) => {
    let rows = await dbQuery(userSQL.insert,[req.body.account,req.body.password,req.body.account]);
    let users = await dbQuery(userSQL.queryUserById,[rows.insertId]);
    responseJSON(res, {
        err_code: 0,
        user: users[0]
    });
});

// 添加用户
router.post('/login', async (req, res, next) => {
    let rows = await dbQuery(userSQL.userLogin,[req.body.account]);
    let rs = null;
    if(rows.length == 0){
        rs = {
            err_code: -1,
            msg: 'account not found'
        }
    }else if(req.body.password == rows[0].password){
        rs = {
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



/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});

module.exports = router;
