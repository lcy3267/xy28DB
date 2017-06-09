import express from 'express';
const router = express.Router();
// 使用DBConfig.js的配置信息创建一个MySQL连接池
import {dbQuery, myTransaction} from '../db/index';
import {responseJSON, formatPage} from '../common/index';
import { rechargeType, changeType } from '../config/index';
import { getUserSocket } from '../socket/util';
import {usersSql, integralChangeSql} from '../db/sql';

const recharge = (io)=>{
    //回水计算
    router.get('/admin/countRollback', async (req, res, next) => {
        const {date} = req.query;

        const users = await rollbackUsers(date);

        if(users){
            responseJSON(res, {users});
        }else{
            responseJSON(res)
        }
    });

    router.get('/admin/rollbackRecord', async (req, res)=>{

        const {pageIndex, pageSize, date} = req.query;

        let dateSql = date?` and r.created_at like '${date}%'`:'';

        const sql = formatPage('select r.*,u.account account,u.name name from rollback_records r' +
            ' left join users u on u.user_id = r.user_id' +
            ' where r.status = 1' + dateSql, pageIndex, pageSize);

        const rs = await dbQuery(sql);

        let count = await dbQuery('select count(id) as count from rollback_records where status != -1');

        rs?responseJSON(res, {records: rs,count: count[0].count}) : responseJSON({});

    })

    router.put('/admin/doRollback', async (req, res,)=>{
        const {date} = req.body;

        const users = await rollbackUsers(date);

        let doRollback = async (user_id, rules, roomLevel, integral)=>{
            const rule = rules.filter((data)=>data.rule_level == roomLevel);

            const {level_1, level_2, level_3, level_4 ,rate_1,rate_2,rate_3,rate_4} = rule[0];

            let levelArr = [level_1, level_2,level_3,level_4];
            let rateArr = [rate_1,rate_2,rate_3,rate_4];
            levelArr.push(integral);
            levelArr = levelArr.sort((a,b)=>a-b);
            let integralIndex = integral == level_1?1:levelArr.indexOf(integral);
            let rate = rateArr[integralIndex-1];

            if(rate){
                let rollbackIntegral = parseInt(integral * (rate/100));//应回积分


                let rs = await myTransaction([
                    {//修改用户积分
                        sql:'update users set integral = (integral + ?) where user_id = ?',
                        params: [rollbackIntegral, user_id],
                    },
                    {//添加回水记录
                        sql: 'insert into rollback_records(user_id,integral,room_level) values(?,?,?)',
                        params: [user_id, rollbackIntegral, roomLevel]
                    },
                    {//增加用户积分变化记录
                        sql: integralChangeSql.insert,
                        params: [user_id, rollbackIntegral, changeType.hs],
                    },
                    {//
                        sql:`update bottom_pour_record set is_rollback = 2 where user_id = ?
                         and created_at like '${date}%'`,
                        params: [user_id],
                    },
                    {//添加用户消息
                        sql: usersSql.addUserMessage,
                        params: [user_id, '回水成功', `${date}日回水已成功充值到您的账户,回水金额为${rollbackIntegral},请注意查收`],
                    },
                ]);

                if(rs){
                    return rs;
                }

            }
        }
        let result = true;

        const rollbackSql = 'select * from rollback_rules';
        let rules = await dbQuery(rollbackSql);

        users.map(async (user)=>{
            const {user_id, win_integral, num, combines, first_num, middle_num, higher_num}  = user;

            if(win_integral < 0){
                if(first_num < 0) {//初级
                    let rs = await doRollback(user_id, rules, 1, -first_num);
                    if(!rs) result = false;
                }
            }
        });

        result?responseJSON(res,{}):responseJSON(res);

    });

    router.get('/userRollbackRecords', async (req, res)=>{
        const {pageIndex, pageSize, level} = req.query;
        const {user_id} = req.loginUser;

        const sql = formatPage('select * from rollback_records where user_id = ?',
        pageIndex, pageSize);

        const rows = await dbQuery(sql,[user_id]);

        rows ? responseJSON(res, {records: rows}) : responseJSON(res,{});
    });

    return router;
}



async function rollbackUsers(date,user_id) {

    const filter = `and user_id = u.user_id and status = 1 and is_rollback = 1 and created_at like '${date}%'`;

    const roomSql = (level,key)=>`(select sum(win_integral) from bottom_pour_record where
         room_level = ${level} ${filter}) as ${key},`;

    const combineSql = `(select count(user_id) from bottom_pour_record where
         bottom_pour_type like '%/_%' escape '/' ${filter}) combines,`;

    const pointSql = `(select count(user_id) from bottom_pour_record where
         bottom_pour_type = 'point' ${filter}) point,`;

    const placeSql = (type,key)=>`(select sum(bottom_pour_money) from bottom_pour_record 
        where lottery_place_type = ${type} ${filter}) ${key},`;

    let users = await dbQuery('select u.user_id user_id,u.account account,u.name name,' +
        'sum(b.bottom_pour_money) sum_integral,' +
        combineSql+pointSql+placeSql(1,'bj')+placeSql(2,'cnd') +
        'sum(b.win_integral) win_integral,' + roomSql(1,'first_num')+
        roomSql(2,'middle_num')+roomSql(3,'higher_num') +
        'count(b.serial_number) num' +
        ' from bottom_pour_record b left join users u on u.user_id = b.user_id' +
        ' where b.status = 1 and b.is_rollback = 1 and b.created_at like "'+date+'%" group by user_id ');

    return users;
}

module.exports = recharge;


