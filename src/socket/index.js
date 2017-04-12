var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
import {dbQuery,myTransaction} from '../db/index';
let request = require('request');
import {loadLotteryRecord, clearingIntegral} from '../common/lotteryUtil';
import bottomPourSql from '../db/sql/bottomPourSql';
import {integralChangeSql, usersSql} from '../db/sql';
import {changeType} from '../config/index';
import schedule from 'node-schedule';

app.get('/', function(req, res){
    console.log('12312321321')
    res.send('<h1>Welcome Realtime Server</h1>');
});

//当前在线人数
var onlineCount = 0;

var lotteryRs = null;

// 房间用户名单
let roomInfo = {};

io.on('connection', function(socket){
    console.log('a user connected');

    //监听新用户加入
    socket.on('login', async (data)=>{
        //将新加入用户的唯一标识当作socket的名称，后面退出的时候会用到
        let {user,roomId} = data;
        socket.user_id = user.user_id;
        socket.roomId = roomId;

        if (!roomInfo[roomId]) {
            roomInfo[roomId] = {};
        }

        roomInfo[roomId][user.user_id] = user;

        socket.join(roomId);    // 加入房间

        let betResult = await loadLotteryRecord(2);

        let integralRs = await dbQuery(usersSql.queryUserIntegral,[user.user_id]);

        io.to(roomId).emit('login', {joinUser:user, lotteryRs: betResult, integral: integralRs[0].integral});
        console.log(user.name+'加入了聊天室:'+roomId);
    });

    //监听用户退出
    socket.on('disconnect', function(){
        // 从房间名单中移除
        let room = roomInfo[socket.roomId];
        var loginOutUser = room && room[socket.user_id];
        if (loginOutUser) {
            delete roomInfo[socket.roomId][socket.user_id];

            socket.leave(socket.roomId);    // 退出房间

            io.to(socket.roomId).emit('logout', {user: loginOutUser});

            console.log(loginOutUser.name+'退出了聊天室:'+socket.roomId);
        }
    });

    //监听用户下注
    socket.on('bet', async (bet)=>{
        let {user,money,type,number,serial_number} = bet;
        //let dbRs = await dbQuery(bottomPourSql.insert,params);
        let rs = await myTransaction([
            {//下注
                sql: bottomPourSql.insert,
                params: [user.user_id,money,type,number,serial_number,socket.roomId,2]
            },
            {//用户减分
                sql: "update users set integral = (integral - ?) where user_id = ?",
                params: [money,user.user_id]
            },
            {//增加用户积分变化记录
                sql: integralChangeSql.insert,
                params: [user.user_id,money,changeType.xz],
            }
        ]);

        if(rs){
            let integralRs = await dbQuery(usersSql.queryUserIntegral,[user.user_id]);
            //向所有客户端广播发布的消息
            io.to(socket.roomId).emit('bet', {bet, integral: integralRs[0].integral});
            console.log(bet.user.name+'下注：'+bet.money,'下注类型:'+bet.type);
        }
    });

    // 北京定时器 北京 每天9点05分第一期,12点停盘,每300秒一期
    /*let bjTimer = null;
    (function () {
        //开盘
        schedule.scheduleJob('10 * * * * *', function(){
            bjTimer = setInterval(async ()=>{
                let rs = await clearingIntegral(1);
                console.log('北京开奖结果');
                console.log(rs);
                if(rs){
                    //io.to(socket.roomId).emit('bet', {bet, integral: integralRs[0].integral});
                    let integralRs = await dbQuery("select integral from users where user_id = 1");
                    //向所有客户端广播发布的消息
                    io.to(socket.roomId).emit('openResult', {integral: integralRs[0].integral,serial_number: rs.serial_number});
                }
                
            },3000);
        });
        //停盘
        schedule.scheduleJob('20 * * * * *', function(){
            bjTimer && clearTimeout(bjTimer);
            console.log('北京停盘');
        });
    })();*/

    // 加纳大定时器 每天19~20点停盘,每210秒一期
    let cndTimer = null;
    (function () {
        //开盘
        schedule.scheduleJob('30 * * * * *', function(){
            cndTimer = setInterval(async ()=>{
                let rs = await clearingIntegral(2);
                console.log('加拿大开奖结果');
                console.log(rs);

                if(rs){
                    //io.to(socket.roomId).emit('bet', {bet, integral: integralRs[0].integral});
                    let integralRs = await dbQuery("select integral from users where user_id = 1");
                    //向所有客户端广播发布的消息
                    io.to(socket.roomId).emit('openResult', {integral: integralRs[0].integral, serial_number: rs.serial_number});
                }
            },3000);
        });
        //停盘
        schedule.scheduleJob('40 * * * * *', function(){
            cndTimer && clearTimeout(cndTimer);
            console.log('加拿大停盘');
        });
    })();

});






http.listen(3001, function(){
    console.log('listening on *:3001');
});