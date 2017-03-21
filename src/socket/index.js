var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var db = require('../db/pool');
let request = require('request');
import loadLotteryRecord from '../common/loadLotteryRecord';
import bottomPourSql from '../db/sql/bottomPourSql'

app.get('/', function(req, res){
    res.send('<h1>Welcome Realtime Server</h1>');
});

//在线用户
var onlineUsers = {};
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

        console.log(roomInfo);

        socket.join(roomId);    // 加入房间

        loadLotteryRecord(1,(betResult)=>{
            //向所有客户端广播用户加入
            io.to(roomId).emit('login', {joinUser:user, lotteryRs: betResult});
            console.log(user.name+'加入了聊天室:'+roomId);
        })

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
        let params = [user.user_id,money,type,number,serial_number,1];
        let dbRs = await db.query(bottomPourSql.insert,params);
        if(dbRs){
            //向所有客户端广播发布的消息
            io.to(socket.roomId).emit('bet', bet);
            console.log(bet.user.name+'下注：'+bet.money,'下注类型:'+bet.type);
        }
    });

});

http.listen(3001, function(){
    console.log('listening on *:3001');
});