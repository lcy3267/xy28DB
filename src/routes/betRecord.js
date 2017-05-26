/**
 * Created by chengyuan on 2017/3/26.
 */
/**
 * Created by chengyuan on 2017/3/12.
 */
var express = require('express');
var router = express.Router();
var bottomPourSql = require('../db/sql/bottomPourSql');
import {responseJSON, formatPage} from '../common/index';

// 使用DBConfig.js的配置信息创建一个MySQL连接池
var {dbQuery} = require('../db/index');

//查询游戏玩法
router.get('/list',async function (req, res, next) {

    const {pageIndex, pageSize} = req.query;

    const sql = formatPage("select b.*,u.account user_account from bottom_pour_record b" +
        " left join users u on b.user_id = u.user_id where b.status != -1 order by b.created_at desc",
        pageIndex, pageSize);

    let rs = await dbQuery("select count(bottom_pour_id) as count from bottom_pour_record where status != -1");

    let rows = await dbQuery(sql);

    responseJSON(res, {records: rows, count: rs[0].count});
});

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a gameRules');
});

module.exports = router;
