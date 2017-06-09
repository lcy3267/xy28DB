/**
 * Created by chengyuan on 2017/5/4.
 */
var express = require('express');
var router = express.Router();
import {responseJSON, formatPage} from '../common/index';

// 使用DBConfig.js的配置信息创建一个MySQL连接池
var {dbQuery} = require('../db/index');

//发送系统消息
router.post('/admin/addMessage',async function (req, res, next) {

    const {title, content} = req.body;

    let rows = await dbQuery("insert into messages(notice_type,title,content) values(?,?,?)",
    [1, title, content]);

    if(rows){
        responseJSON(res, {rows});
    }else{
        responseJSON(res);
    }
});

//删除系统消息
router.put('/admin/deleteMessage',async function (req, res, next) {

    const {id} = req.body;

    let rows = await dbQuery("update messages set status = -1 where id = ?", [id]);

    if(rows){
        responseJSON(res, {rows});
    }else{
        responseJSON(res);
    }
});

//系统消息列表
router.get('/systemList', async function (req, res, next) {
    const user = req.loginUser;

    const {pageIndex, pageSize} = req.query;

    let column = 'id,title,created_at';

    if(user.user_type == 1) column += ',content';

    let sql = formatPage(`select ${column} from messages where status !=-1 and notice_type = 1 order by created_at desc`, pageIndex, pageSize);

    let systemList = await dbQuery(sql);

    let rs = await dbQuery("select count(id) as count from messages where status != -1 and notice_type = 1");

    if(systemList){
        responseJSON(res, {systemList, count: rs[0].count});
    }else{
        responseJSON(res);
    }
});

router.get('/userMessages', async function (req, res, next) {
    const {user_id} = req.loginUser;

    const {pageIndex, pageSize} = req.query;

    let column = 'id,title,created_at';

    let sql = formatPage(`select ${column} from messages where status !=-1 and notice_type = 2
     and user_id = ? order by created_at desc`, pageIndex, pageSize);

    let userMessages = await dbQuery(sql,[user_id]);

    let rs = await dbQuery("select count(id) as count from messages where status != -1" +
        " and user_id = ? and notice_type = 2",[user_id]);

    if(userMessages){
        responseJSON(res, {userMessages, count: rs[0].count});
    }else{
        responseJSON(res);
    }
});

//系统消息详情
router.get('/detail', async function (req, res, next) {

    const {id} = req.query;

    let sql = 'select * from messages where id = ?';

    let rs = await dbQuery(sql, [id]);

    if(rs){
        responseJSON(res, {info: rs[0]});
    }else{
        responseJSON(res);
    }
});



module.exports = router;
