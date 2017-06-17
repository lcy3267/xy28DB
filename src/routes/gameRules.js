/**
 * Created by chengyuan on 2017/3/12.
 */
var express = require('express');
var router = express.Router();
import {responseJSON} from '../common/index';
import { emitAll } from '../socket/util';


// 使用DBConfig.js的配置信息创建一个MySQL连接池
var {dbQuery} = require('../db/index');

const gameRules = (io)=>{

    //查询游戏玩法
    router.get('/admin/list',async function (req, res, next) {
        let rows = await dbQuery('SELECT * FROM game_rules WHERE status != -1');
        responseJSON(res, {rules: rows});
    });

    //添加游戏赔率规则
    router.post('/admin/addGameRules',async function (req, res, next) {//
        let {type, name, rates} = req.body;
        const field = type == 1 ? 'combine_rates' : 'single_point_rates';
        rates = type == 1 ? JSON.stringify(rates) : rates;
        let rows = await dbQuery(`insert into game_rules(play_type,name,${field}) values(?,?,?)`,[type, name, rates]);

        rows?responseJSON(res, {rs: rows}):responseJSON(res);
    });

    //修改游戏配戏
    router.put('/admin/updateGameRules',async function (req, res, next) {
        let {type, name, rates, id} = req.body;
        const field = type == 1 ? 'combine_rates' : 'single_point_rates';
        rates = type == 1 ? JSON.stringify(rates) : rates;
        let rows = await dbQuery(`update game_rules set name = ?,${field} = ? where id = ?`,[name, rates, id]);

        rows?responseJSON(res, {rs: rows}):responseJSON(res);
    });
    
    router.put('/admin/updateRoomGameRule',async function (req, res, next) {
        let {ruleId, roomId, playType} = req.body;
        let filed = playType == 1 ? 'rule_combine_id' : 'rule_single_id';
        let rows = await dbQuery(`update rooms set ${filed} = ? where id = ?`,[ruleId, roomId]);
        if(rows){
            responseJSON(res, {});
        }else{
            responseJSON(res);
        }
    });

    router.get('/roomGameRule',async function (req, res, next) {
        let { roomId } = req.query;
        let rooms = await dbQuery('select rule_combine_id,rule_single_id from rooms where id = ?',[roomId]);
        let rows = await dbQuery('select * from game_rules where id in (?,?)',[rooms[0].rule_combine_id, rooms[0].rule_single_id])
        if(rows){
            responseJSON(res, {rules: rows});
        }else{
            responseJSON(res);
        }
    });

    return router;
}



module.exports = gameRules;
