import express from 'express';
const router = express.Router();
// 使用DBConfig.js的配置信息创建一个MySQL连接池
import {dbQuery, myTransaction} from '../db/index';
import {responseJSON, formatPage} from '../common/index';
import { rechargeType, changeType } from '../config/index';
import { getUserSocket, getSingleSocket } from '../socket/util';
import {usersSql, integralChangeSql} from '../db/sql';


const recharge = (io)=>{
    //充值申请记录
    router.get('/admin/list', async (req, res, next) => {

        const {pageIndex, pageSize} = req.query;

        const sql = formatPage('select r.*,u.account user_account,u.name user_name from recharge_integral_record r ' +
            'left join users u on u.user_id = r.user_id where r.status != -1 order by r.created_at desc',
            pageIndex, pageSize);

        let records = await dbQuery(sql);

        let rs = await dbQuery('select count(id) as count from recharge_integral_record where status != -1');

        if(records){
            responseJSON(res, {records, count: rs[0].count});
        }else{
            responseJSON(res)
        }
    });

    //app 用户充值记录
    router.get('/rechargeRecord', async (req, res, next) => {

        const {user_id} = req.loginUser;

        const {pageIndex, pageSize} = req.query;

        const sql = formatPage('select * from recharge_integral_record where status != -1 and user_id = ?',
            pageIndex, pageSize);

        let records = await dbQuery(sql, [user_id]);

        let rs = await dbQuery('select count(id) as count from recharge_integral_record' +
            ' where status != -1 and user_id = ?',[user_id]);

        if(records){
            responseJSON(res, {records, count: rs[0].count});
        }else{
            responseJSON(res)
        }
    });

    //获取收款账号
    router.get('/getCollectionAccounts', async (req, res, next) => {
        let accounts = await dbQuery('select * from collection_accounts where status = 1');
        responseJSON(res, {accounts: accounts});
    });

    // 用户提交支付宝充值记录
    router.post('/alipayRecharge', async (req, res, next) => {
        let params = req.body;

        let rs = await dbQuery('insert into recharge_integral_record(user_id,alipay_account,alipay_name,money,recharge_type) values(?,?,?,?,?)',
            [params.user_id, params.account, params.account_name, params.money, 1]);

        if(rs){
            responseJSON(res, {accounts: rs});
        }
    });

    // 通过用户充值申请
    router.put('/admin/approveRecharge', async (req, res, next) => {

        let id = +req.body.id;

        const record = await dbQuery('select money,user_id from recharge_integral_record where id = ?',[id]);

        const {money: integral, user_id} = record[0];

        let rs = await myTransaction([
            {//用户改变积分
                sql: usersSql.updateUserIntegral,
                params: [integral, user_id]
            },
            {//增加积分变动记录
                sql: integralChangeSql.insert,
                params: [integral, user_id, changeType.input]
            },
            {//改变该条记录状态
                sql: "update recharge_integral_record set status = 2,updated_at = now() where id = ?",
                params: [id]
            },
            {//添加用户通知
                sql: usersSql.addUserMessage,
                params: [user_id, `充值成功`,`管理员已成功给您充值${integral}元宝,请查收!`]
            },
        ]);

        if(rs){
            responseJSON(res, {rs});
            let integralRs = await dbQuery("select integral from users where user_id = ?",[user_id]);
            let socket = getUserSocket(io,user_id);
            if(socket){
                socket.emit('updateIntegral', {integral: integralRs[0].integral});
            }
        }
    });

    //管理员手动充值积分
    router.put('/admin/adminRecharge', async (req, res, next) => {
        let user = req.loginUser;

        if(user.user_type != 1){
            return res.status(403).send({
                err_code: 403,
                message: ''
            });
        }

        let {user_id, integral} = req.body;

        let rs = await myTransaction([
            {//用户改变积分
                sql: usersSql.updateUserIntegral,
                params: [integral, user_id]
            },
            {//用户积分变动记录
                sql: integralChangeSql.insert,
                params: [user_id, integral, changeType.adminInput]
            },
            {//增加用户充值记录
                sql: "insert into recharge_integral_record(user_id,money,recharge_type,status) values(?,?,?,?)",
                params: [user_id, integral, rechargeType.adminInput, 2]
            },
            {//添加用户消息
                sql: usersSql.addUserMessage,
                params: [user_id, '元宝充值成功', `管理员已给您充值${integral}元宝,请注意查收!`],
            },
        ]);

        if(rs){
            responseJSON(res, rs);
            let integralRs = await dbQuery("select integral from users where user_id = ?",[user_id]);
            let socket = getUserSocket(io,user_id);
            if(socket){
                socket.emit('updateIntegral', {integral: integralRs[0].integral});
            }
            let clients = io.of('/app').clients().sockets;
            let socket2 = getSingleSocket(clients,user_id);
            if(socket2){
                socket2.emit('newMsg');
            }
        }else{
            responseJSON(undefined);
        }

    });

    return router;
}

module.exports = recharge;


