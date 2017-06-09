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
import { updateUserIntegral } from '../socket/util';
import {integralChangeSql, usersSql} from '../db/sql';
import {changeType} from '../config/index';

// 使用DBConfig.js的配置信息创建一个MySQL连接池
var {dbQuery, myTransaction} = require('../db/index');


const bet = (io)=> {

    //下注记录
    router.get('/admin/records',async function (req, res, next) {

        const {pageIndex, pageSize} = req.query;

        const sql = formatPage("select b.*,u.account user_account from bottom_pour_record b" +
            " left join users u on b.user_id = u.user_id where b.status = 1 order by b.created_at desc",
            pageIndex, pageSize);

        let rs = await dbQuery("select count(bottom_pour_id) as count from bottom_pour_record where status != -1");

        let rows = await dbQuery(sql);

        responseJSON(res, {records: rows, count: rs[0].count});
    });

    router.get('/roomBetRecords', async function (req, res) {
        const { roomId } = req.query;

        const rows = await dbQuery('select u.name name,u.avatar_picture_url avatar_picture_url,b.*' +
            ' from bottom_pour_record b left join users u on u.user_id = b.user_id ' +
            ' where room_id = ? order by created_at desc limit 0,10',[ roomId ]);

        rows?responseJSON(res, {records: rows}):responseJSON(res,{});
    })

    router.put('/cancelBet', async function (req, res) {
        const {user_id} = req.loginUser;

        const {id} = req.body;

        const bet = await dbQuery('select user_id,bottom_pour_money from bottom_pour_record where bottom_pour_id = ? and status = 1',[id]);

        if(bet && bet.length > 0){

            const {user_id, bottom_pour_money} = bet[0];

            let rs = await myTransaction([
                {
                    sql: 'update bottom_pour_record b,users u set b.status = ?,' +
                    'u.integral = (u.integral + b.bottom_pour_money) where bottom_pour_id = ? and' +
                    ' b.user_id = u.user_id',
                    params: [2, id],
                },
                {
                    sql: integralChangeSql.insert,
                    params: [user_id, bottom_pour_money, changeType.cancelBet],
                },
            ]);

            if(rs){
                responseJSON(res, {});
                updateUserIntegral(io, user_id);
            }
        }else{
            responseJSON(res);
        }
    });


    router.get('/integralChangeRecords', async function (req, res) {
        const {user_id} = req.loginUser;
        const {pageIndex, pageSize} = req.query;

        const sql = formatPage('select * from user_integral_change where user_id = ? and status != -1 order by' +
            ' created_at desc',
            pageIndex, pageSize);

        let rs = await dbQuery(sql,[user_id]);

        if(rs){
            responseJSON(res, {records: rs});
        }else{
            responseJSON(res)
        }
    });

    router.get('/userBetRecords', async function (req, res) {
        const {user_id} = req.loginUser;
        const {pageIndex, pageSize} = req.query;

        const sql = formatPage('select * from bottom_pour_record where user_id = ? and status = 1 order by' +
            ' created_at desc',
            pageIndex, pageSize);

        let rs = await dbQuery(sql,[user_id]);

        if(rs){
            responseJSON(res, {records: rs});
        }else{
            responseJSON(res)
        }
    });

    return router;
}



module.exports = bet;
