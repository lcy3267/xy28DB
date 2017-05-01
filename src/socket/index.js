var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
import {dbQuery, myTransaction} from '../db/index';
let request = require('request');
import {loadLotteryRecord, clearingIntegral} from '../common/lotteryUtil';
import bottomPourSql from '../db/sql/bottomPourSql';
import {integralChangeSql, usersSql} from '../db/sql';
import {changeType} from '../config/index';
import schedule from 'node-schedule';
import { getCnaOpenTime } from './util';

app.get('/', function (req, res) {
    res.send('<h1>Welcome Realtime Server</h1>');
});

//当前在线人数
var onlineCount = 0;

var lotteryRs = null;

// 房间用户名单
let roomInfo = {};

let opening = false;//开奖中
let cycle = null;//遍历开奖结果

let openResult = (type,callback)=> {
    cycle = setTimeout(async()=> {
        let rs = await clearingIntegral(type);
        if (!rs || rs && rs.err_code == 1001) {
            openResult(type,callback);
        } else if (rs.err_code == 0) {
            callback(rs);
        }
    }, 3000);
}

//北京开盘 每天9点05分第一期,12点停盘,每300秒一期
/*var rule = new schedule.RecurrenceRule();
rule.hour = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
rule.minute = [4, 9, 14, 19, 24, 29, 34, 39, 44, 49, 54, 59];
rule.second = 30;
schedule.scheduleJob(rule, ()=> {
    console.log('现在时间：', new Date());
    opening = true;
    io.emit('openResult', {opening: true});
    openResult();
});*/
let cndTime = null;
let cndTimer = setInterval(()=>{
    cndTime = getCnaOpenTime();
    console.log(cndTime);
    if(cndTime <= 60 && cndTime >= 30){
        opening = true;
        io.emit('openResult', {opening});
    }else{
        opening = false;
    }

    if(cndTime == 20){
        io.emit('openResult', {opening: true});
        openResult(2,async (rs)=>{
            if (rs && rs.err_code == 0) {

                console.log('已开奖-------');
                console.log(rs);

                let integralRs = await dbQuery("select integral from users where user_id = 1");
                //向所有客户端广播发布的消息
                io.emit('openResult', {
                    integral: integralRs[0].integral,
                    serial_number: rs.result.serial_number
                });

                cycle && clearTimeout(cycle);
            }
        });
    }

    /*if(opening && cndTime == 180){
        console.log('进来清楚了------')
        io.emit('openResult', {
            opening: false,
        });
    }*/
},1000);

io.on('connection', async(socket)=> {
    console.log('a user connected');

    const loadRecord = (callback)=>{
        console.log('========00');

        let aa = setTimeout(async ()=>{
            console.log('========11');

            let lotteryRs = await loadLotteryRecord(1);
            console.log('========22',lotteryRs);

            if(lotteryRs){
                callback && callback(lotteryRs);
            }else{
                loadRecord(callback);
            }
        },500);
    }

    //监听新用户加入
    socket.on('login', async(data)=> {
        //将新加入用户的唯一标识当作socket的名称，后面退出的时候会用到
        let {user, roomId} = data;
        socket.user_id = user.user_id;
        socket.roomId = roomId;

        if (!roomInfo[roomId]) {
            roomInfo[roomId] = {};
        }

        roomInfo[roomId][user.user_id] = user;

        socket.join(roomId);    // 加入房间

        let integralRs = await dbQuery(usersSql.queryUserIntegral, [user.user_id]);

        io.to(roomId).emit('login', {
            opening,
            joinUser: user,
            integral: integralRs[0].integral,
        });

        loadRecord((lotteryRs)=>{
            io.to(roomId).emit('login', {
                lotteryRs,
                joinUser: user,
            });
        });

        console.log(user.name + '加入了聊天室:' + roomId);
    });


    //监听用户退出
    socket.on('disconnect', function () {
        // 从房间名单中移除
        let room = roomInfo[socket.roomId];
        var loginOutUser = room && room[socket.user_id];
        if (loginOutUser) {
            delete roomInfo[socket.roomId][socket.user_id];

            socket.leave(socket.roomId);    // 退出房间

            io.to(socket.roomId).emit('logout', {user: loginOutUser});

            console.log(loginOutUser.name + '退出了聊天室:' + socket.roomId);
        }
    });

    //监听用户下注
    socket.on('bet', async(bet)=> {
        let {user, money, type, number, serial_number} = bet;
        //let dbRs = await dbQuery(bottomPourSql.insert,params);
        let rs = await myTransaction([
            {//下注
                sql: bottomPourSql.insert,
                params: [user.user_id, money, type, number, serial_number, socket.roomId, 2]
            },
            {//用户减分
                sql: "update users set integral = (integral - ?) where user_id = ?",
                params: [money, user.user_id]
            },
            {//增加用户积分变化记录
                sql: integralChangeSql.insert,
                params: [user.user_id, money, changeType.xz],
            }
        ]);

        if (rs) {
            let integralRs = await dbQuery(usersSql.queryUserIntegral, [user.user_id]);
            //向所有客户端广播发布的消息
            io.to(socket.roomId).emit('bet', {bet, integral: integralRs[0].integral});
            console.log(bet.user.name + '下注：' + bet.money, '下注类型:' + bet.type);
        }
    });
    
});



http.listen(3001, function () {
    console.log('listening on *:3001');
});