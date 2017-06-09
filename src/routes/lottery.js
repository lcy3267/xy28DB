/**
 * Created by chengyuan on 2017/5/4.
 */
var express = require('express');
var router = express.Router();
import {responseJSON, formatPage} from '../common/index';

// 使用DBConfig.js的配置信息创建一个MySQL连接池
var {dbQuery} = require('../db/index');

//查询游戏玩法
router.get('/records',async function (req, res, next) {

    const {pageIndex, pageSize, type } = req.query;

    const sql = formatPage('select * from lottery_record where lottery_place_type = ? order by created_at desc',
        pageIndex, pageSize);

    let rows = await dbQuery(sql, [type]);

    let rs = await dbQuery('select count(lottery_record_id) as count from lottery_record where lottery_place_type = ? ' +
        'and is_open = 1',[type]);

    if(rows){
        responseJSON(res, {records: rows, count: rs[0].count});
    }else{
        responseJSON(res);
    }
});



module.exports = router;
