import express from 'express';
const router = express.Router();
import {dbQuery} from '../db/';
import {loadLotteryRecord,clearingIntegral} from '../common/lotteryUtil';
import {responseJSON} from '../common/index';
import {notToken, key} from '../config/index';
import jwt from 'jsonwebtoken';

/* GET home page. */
router.all('/*', function(req, res, next) {
  if(notToken.includes(req.path)) return next();
  let token = req.query.token || req.body.token;
  if (token) {
    // 确认token
    jwt.verify(token, key.token, function(err, decoded) {
      if (err) {
        return res.status(401).send({ err_code: 401, message: err });
      } else {
        req.loginUser = decoded.user;
        next();
      }
    });
  } else {
    // 如果没有token，则返回错误
    return res.status(403).send({
      err_code: 403,
      message: '没有提供token！'
    });
  }
});

router.get('/test',async (req, res, next) => {
  responseJSON(res,req.data);
});

// result
router.get('/result',async (req, res, next) => {
  let rs = await loadLotteryRecord(1);

  res.send(rs);
  //responseJSON(res,rs);
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
