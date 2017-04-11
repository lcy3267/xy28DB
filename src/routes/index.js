var express = require('express');
var router = express.Router();
import {dbQuery} from '../db/';
import {loadLotteryRecord,clearingIntegral} from '../common/lotteryUtil';
import {responseJSON} from '../common/index';

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// result
router.get('/result',async (req, res, next) => {
  let rs = await loadLotteryRecord(1);
  responseJSON(res,rs);
});

// 清算积分
router.get('/clear',async (req, res, next) => {
  let rs = await clearingIntegral();
  responseJSON(res,rs);
});

// 清算积分
router.get('/integral',async (req, res, next) => {
  let integralRs = await dbQuery("select integral,user_id from users where user_id = ?",[1]);
  responseJSON(res,integralRs);
});

module.exports = router;
