/**
 * Created by chengyuan on 2017/5/4.
 */
var express = require('express');
var router = express.Router();
import {responseJSON} from '../common/index';

// 使用DBConfig.js的配置信息创建一个MySQL连接池
var {dbQuery} = require('../db/index');

//查询游戏玩法
router.get('/record',async function (req, res, next) {
    let rows = await dbQuery("select * from lottery_record order by created_at desc");
    responseJSON(res, {records: rows});
});

module.exports = router;
