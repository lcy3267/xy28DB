var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
import {dbQuery,myTransaction} from '../db/index';
let request = require('request');
import {loadLotteryRecord} from '../common/lotteryUtil';
import bottomPourSql from '../db/sql/bottomPourSql';
import {integralChangeSql} from '../db/sql';
import {changeType} from '../config/index';

app.get('/', function(req, res){
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

        io.to(roomId).emit('login', {joinUser:user, lotteryRs: betResult});
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
                params: [user.user_id,money,type,number,serial_number,1]
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

        console.log('>>>');
        console.log(rs);

        if(rs){
            //向所有客户端广播发布的消息
            io.to(socket.roomId).emit('bet', bet);
            console.log(bet.user.name+'下注：'+bet.money,'下注类型:'+bet.type);
        }
    });

});

http.listen(3001, function(){
    console.log('listening on *:3001');
});