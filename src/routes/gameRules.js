/**
 * Created by chengyuan on 2017/3/12.
 */
var express = require('express');
var router = express.Router();
var GameRulesSql = require('../db/sql/GameRulesSql');
import {responseJSON} from '../common/index';
import { emitAll } from '../socket/util';


// 使用DBConfig.js的配置信息创建一个MySQL连接池
var {dbQuery} = require('../db/index');

const gameRules = (io)=>{

    //查询游戏玩法
    router.get('/list',async function (req, res, next) {
        let rows = await dbQuery(GameRulesSql.queryAll);
        responseJSON(res, {rules: rows});
    });

    //修改赔率
    router.put('/updateRate',async function (req, res, next) {
        let {id, rate} = req.body;
        let rows = await dbQuery('update game_rules set rate = ? where id = ?',[rate, id]);
        if(rows){
            responseJSON(res, {});
            emitAll(io, 'updateRules',{});
        }else{
            responseJSON(res);
        }
    });

    return router;
}

module.exports = gameRules;
