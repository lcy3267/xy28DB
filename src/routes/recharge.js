import express from 'express';
const router = express.Router();
// 使用DBConfig.js的配置信息创建一个MySQL连接池
import {dbQuery} from '../db/index';
import {responseJSON} from '../common/index';

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



/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});

module.exports = router;
