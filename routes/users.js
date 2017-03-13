var express = require('express');
var router = express.Router();
var URL = require('url');
var userSQL = require('../db/sql/userSql');
var lotteryRecordSql = require('../db/sql/lotteryRecordSql');

var http = require('http');
// 使用DBConfig.js的配置信息创建一个MySQL连接池
var db = require('../db/pool');

let request = require('request');

Array.prototype.getSum = function(){
    let sum = 0;
    this.map((number)=>{
        sum += +number;
    });
    return sum;
}

String.prototype.getLast = function(){
    let len = this.length;
    return this.substr(len-1,1);
}


// 响应一个JSON数据
var responseJSON = function (res, ret) {
    if (typeof ret === 'undefined') {
        res.json({
            code: '-200', msg: '操作失败'
        });
    } else {
        res.json(ret);
    }
};
// 添加用户
router.post('/register', function (req, res, next) {
    db.query(userSQL.insert,[req.body.account,req.body.password])
    .then(rows => {
        responseJSON(res, {
            err_code: 0,
            user_id: rows.insertId
        });
    })
    .catch(err => {
    });
});

// 查询所有用户
router.get('/getUsers',function (req, res, next) {
    db.query(userSQL.insert,null)
    .then(rows => {
        responseJSON(res, rows);
    })
    .catch(err => {
    });
});

// 查询单个用户
router.get('/getUser',async (req, res, next) => {
    getLottery((arr)=>{
        db.query(lotteryRecordSql.insert,arr)
            .then(rows => {
                console.log(rows);
                //responseJSON(res, rows);
                res.json({rs: 'success'});
            })
            .catch(err => {
            });
    });
});

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});

router.get('/getUserInfo', function (req, res, next) {

    var user = new User();
    var params = URL.parse(req.url, true).query;

    if (params.id == '1') {

        user.name = "ligh";
        user.age = "1";
        user.city = "北京市";

    } else {
        user.name = "SPTING";
        user.age = "1";
        user.city = "杭州市";
    }

    var response = {status: 1, data: user};
    res.send(JSON.stringify(response));

});

function getLottery(callback) {
    //http://123.168kai.com/Open/CurrentOpenOne?code=10014&_=0.06803648965035364
    request('http://kj.1680api.com/Open/CurrentOpenOne?code=10041&_=0.06803648965035364', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            let rs = JSON.parse(body);
            let result = rs.c_r.split(',').sort((a,b)=>a-b);
            let one = +result.slice(1,7).getSum().toString().getLast(),
                two = +result.slice(7,13).getSum().toString().getLast(),
                third = +result.slice(13,19).getSum().toString().getLast(),
                sum = one + two + third;
            callback([rs.c_t,one,two,third,sum,1]);
        }
    });
}



function User() {
    this.name;
    this.city;
    this.age;
}

module.exports = User;

module.exports = router;
