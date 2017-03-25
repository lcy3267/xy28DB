import express from 'express';
import userSQL from '../db/sql/userSql';
const router = express.Router();
// 使用DBConfig.js的配置信息创建一个MySQL连接池
import {dbQuery} from '../db/index';
import {loadLotteryRecord,clearingIntegral} from '../common/lotteryUtil';

// 响应一个JSON数据
var responseJSON = function (res, ret) {
    if (typeof ret === 'undefined') {
        res.json({
            code: '-200', msg: '操作失败'
        });
    } else {
        res.json(ret);
    }
};

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

// 查询所有用户
router.get('/getUsers',async (req, res, next) => {
    let rs = await loadLotteryRecord();
    responseJSON(res,rs);
});

// 清算积分
router.get('/clear',async (req, res, next) => {
    let rs = await clearingIntegral();
    responseJSON(res,rs);
});

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});

module.exports = router;
