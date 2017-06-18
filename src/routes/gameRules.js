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
        let filed = 0;
        switch (playType){
            case 1: filed = 'rule_combine_id'; break;
            case 2: filed = 'rule_single_id'; break;
            case 3: filed = 'special_game_rule_id'; break;
            case 4: filed = 'combine_special_rule_id'; break;
        }
        let rows = await dbQuery(`update rooms set ${filed} = ? where id = ?`,[ruleId, roomId]);
        if(rows){
            responseJSON(res, {});
        }else{
            responseJSON(res);
        }
    });

    router.get('/admin/specialGameRules',async function (req, res, next) {
        let rows = await dbQuery("select * from special_game_rules where status != -1");
        responseJSON(res, {rules: rows});
    });

    //修改游戏配戏
    router.post('/admin/addSpecialGameRule',async function (req, res, next) {
        const {name, levels, rates, rule_type} = req.body;

        let rows = await dbQuery("insert into special_game_rules(name,level_1,level_2,level_3,rate_1,rate_2,rate_3,rule_type) values(?,?,?,?,?,?,?,?)",
            [name, levels[0], levels[1], levels[2], rates[0], rates[1], rates[2], +rule_type]);

        if(rows){
            responseJSON(res, {rs: rows});
        }else{
            responseJSON(res);
        }
    });

    router.put('/admin/updateSpecialGameRule',async function (req, res, next) {
        const {id, name, levels, rates, rule_type} = req.body;

        let rows = await dbQuery("update special_game_rules set name = ?,level_1 = ?,level_2 = ?," +
            "level_3 = ?,rate_1 = ?,rate_2 = ?,rate_3 = ?,rule_type = ? where id = ?",
            [name, levels[0], levels[1], levels[2], rates[0], rates[1], rates[2], rule_type, id]);

        if(rows){
            responseJSON(res, {rs: rows});
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

    router.get('/specialGameRuleInfo',async function (req, res, next) {
        let { commonId, combineId } = req.query;
        let rows = await dbQuery(`select * from special_game_rules where id in (${commonId},${combineId})`)
        if(rows){
            responseJSON(res, {rules: rows});
        }else{
            responseJSON(res);
        }
    });

    return router;
}



module.exports = gameRules;
