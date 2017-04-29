import express from 'express';
const router = express.Router();
import {dbQuery} from '../db/';
import {loadLotteryRecord,clearingIntegral} from '../common/lotteryUtil';
import {responseJSON} from '../common/index';
import jwt from 'jsonwebtoken';

/* GET home page. */
router.get('/*', function(req, res, next) {
  next();
  return;
  if(req.path == '/token') return next();
  let token = req.query.token;
  if (token) {
    // 确认token
    jwt.verify(token, 'yuan123', function(err, decoded) {
      if (err) {
        return res.json({ success: false, message: err });
      } else {
        req.data = decoded;
        next();
      }
    });
  } else {
    // 如果没有token，则返回错误
    return res.status(403).send({
      success: false,
      message: '没有提供token！'
    });
  }
});

router.get('/token',async (req, res, next) => {
  var token = jwt.sign({name:'xxxxxx'}, 'yuan123', {expiresIn: '1h'});
  res.json({token});
});

router.get('/test',async (req, res, next) => {
  responseJSON(res,req.data);
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
