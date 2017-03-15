import express from 'express';
import userSQL from '../db/sql/userSql';
const router = express.Router();
// 使用DBConfig.js的配置信息创建一个MySQL连接池
import db from '../db/pool';

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
    let rows = await db.query(userSQL.insert,[req.body.account,req.body.password])
    responseJSON(res, {
        err_code: 0,
        user_id: rows.insertId
    });
});

// 查询所有用户
router.get('/getUsers',async (req, res, next) => {
    let rows = await db.query(userSQL.queryAll,null);
    responseJSON(res, rows);
});

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});

module.exports = router;
