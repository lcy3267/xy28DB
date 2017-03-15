/**
 * Created by chengyuan on 2017/3/12.
 */
var express = require('express');
var router = express.Router();
var GameRulesSql = require('../db/sql/GameRulesSql');

// 使用DBConfig.js的配置信息创建一个MySQL连接池
var db = require('../db/pool');

// 响应一个JSON数据
var responseJSON = function (res, ret) {
    if (typeof ret === 'undefined') {
        res.json({
            code: '-200', msg: '操作失败'
        });
    } else {
        ret.err_code = 0;
        res.json(ret);
    }
};

// 查询所有用户
router.get('/list',async function (req, res, next) {
   let rows = await db.query(GameRulesSql.queryAll,null)
    responseJSON(res, {rules: rows});
});

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a gameRules');
});

module.exports = router;
