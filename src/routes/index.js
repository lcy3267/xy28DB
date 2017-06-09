import express from 'express';
const router = express.Router();
import {dbQuery} from '../db/';
import {loadLotteryRecord,clearingIntegral} from '../common/lotteryUtil';
import {notToken, key} from '../config/index';
import jwt from 'jsonwebtoken';

/* GET home page. */
router.all('/*', function(req, res, next) {
  const path = req.path;

  const auth = path.split('/')[2];

  if(notToken.includes(req.path)) return next();
  let token = req.header('Token');
  if (token) {
    // 确认token
    jwt.verify(token, key.token, function(err, decoded) {
      if (err) {
        return res.status(401).send({ err_code: 401, message: err });
      } else {
        req.loginUser = decoded.user;
        if(auth == 'admin' && decoded.user.user_type != 1){
          // 如果没有token，则返回错误
          return res.status(403).send({
            err_code: 403,
            message: 'Forbidden'
          });
        }else{
          next();
        }
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


module.exports = router;
