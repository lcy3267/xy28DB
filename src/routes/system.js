/**
 * Created by chengyuan on 2017/5/4.
 */
var express = require('express');
var router = express.Router();
import {responseJSON} from '../common/index';
import { emitAll } from '../socket/util';


// 使用DBConfig.js的配置信息创建一个MySQL连接池
var {dbQuery} = require('../db/index');

const system = (io)=>{
    //房间列表
    router.get('/rooms',async function (req, res, next) {
        let rows = await dbQuery("select * from rooms where status != -2");
        rows?responseJSON(res, {rooms: rows}):responseJSON(res);
    });

    //房间详情
    router.get('/roomInfo',async function (req, res, next) {
        const {roomId} = req.query;
        console.log('roomId',roomId)
        let rows = await dbQuery("select * from rooms where id = ?",[roomId]);
        rows?responseJSON(res, {room: rows[0]}):responseJSON(res);
    });

    //回水规则列表
    router.get('/admin/rollbackRules',async function (req, res, next) {
        let rows = await dbQuery("select * from rollback_rules where status != -1");
        responseJSON(res, {rules: rows});
    });

    //新增回水规则
    router.post('/admin/addRollback',async function (req, res, next) {
        const {name, levels, rates, ruleLevel} = req.body;

        let rows = await dbQuery("insert into rollback_rules(name,rule_level,level_1,level_2,level_3,level_4,rate_1,rate_2,rate_3,rate_4) values(?,?,?,?,?,?,?,?,?,?)",
            [name, +ruleLevel, levels[0], levels[1], levels[2], levels[3], rates[0], rates[1], rates[2], rates[3]]);

        if(rows){
            responseJSON(res, {rs: rows});
        }else{
            responseJSON(res);
        }
    });

    //修改房间状态
    router.put('/admin/updateRoomStatus',async function (req, res, next) {
        const {roomId, status} = req.body;

        let rows = await dbQuery("update rooms set status = ? where id = ?",[status, roomId]);

        if(rows){
            responseJSON(res, {rs: rows});
            emitAll(io, 'updateRoomInfo', {roomId});
        }else{
            responseJSON(res)
        }
    });

    //修改房间禁言状态
    router.put('/admin/updateRoomSpeak',async function (req, res, next) {
        const {roomId, is_speak} = req.body;

        let rows = await dbQuery("update rooms set is_speak = ? where id = ?",[is_speak, roomId]);

        if(rows){
            responseJSON(res, {rs: rows});
            emitAll(io, 'updateRoomInfo', {roomId});
        }else{
            responseJSON(res)
        }
    });

    //修改房间回水规则
    router.put('/admin/updateRollbackRules',async function (req, res, next) {
        const {roomId, rollbackTypeId} = req.body;

        let rows = await dbQuery("update rooms set rollback_rule_id = ? where id = ?",[rollbackTypeId, roomId]);

        rows?responseJSON(res, {rs: rows}):responseJSON(res);
    });

    return router;
}


//

module.exports = system;
