import express from 'express';
const router = express.Router();
// 使用DBConfig.js的配置信息创建一个MySQL连接池
import {dbQuery, myTransaction} from '../db/index';
import {responseJSON} from '../common/index';
import { rechargeType, changeType } from '../config/index';

//获取收款账号
router.get('/list', async (req, res, next) => {
    let records = await dbQuery('select * from recharge_integral_record where status != -1 order by created_at desc');
    responseJSON(res, {records});
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

//管理员手动充值积分
router.put('/adminRecharge', async (req, res, next) => {
    let user = req.loginUser;

    if(user.user_type != 1){
        return res.status(403).send({
            err_code: 403,
            message: ''
        });
    }

    let {user_id, integral} = req.body;

    let rs = await myTransaction([
        {//用户积分变动记录
            sql: "insert into user_integral_change(user_id,integral,type) values(?,?,?)",
            params: [user_id, integral, changeType.adminInput]
        },
        {//增加用户充值记录
            sql: "insert into recharge_integral_record(user_id,money,recharge_type,status) values(?,?,?,?)",
            params: [user_id, integral, rechargeType.adminInput, 2]
        },
        {//用户改变积分
            sql: "update users set integral = (integral + ?) where user_id = ?",
            params: [integral, user_id]
        },

    ]);

    if(rs){
        responseJSON(res, rs);
    }else{
        responseJSON(undefined);
    }

});



/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});

module.exports = router;
