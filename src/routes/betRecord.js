/**
 * Created by chengyuan on 2017/3/26.
 */
/**
 * Created by chengyuan on 2017/3/12.
 */
var express = require('express');
var router = express.Router();
var bottomPourSql = require('../db/sql/bottomPourSql');
import {responseJSON} from '../common/index';

// 使用DBConfig.js的配置信息创建一个MySQL连接池
var {dbQuery} = require('../db/index');

//查询游戏玩法
router.get('/list',async function (req, res, next) {
    let rows = await dbQuery("select b.*,u.account user_account from bottom_pour_record b left join users u on b.user_id = u.user_id" +
        " WHERE b.status != -1 order by b.created_at desc");
    responseJSON(res, {records: rows});
});

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a gameRules');
});

module.exports = router;
