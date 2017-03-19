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

function loadMassage() {
    setInterval(function () {
        var obj = {
            userid: "110",
            username: "假远",
            content: "say hello"
        };
        io.emit('message', obj);
        console.log(obj.username+'说：'+obj.content);
    },3000);
}

io.on('connection', function(socket){
    console.log('a user connected');

    //监听新用户加入
    socket.on('login', async (data)=>{
        //将新加入用户的唯一标识当作socket的名称，后面退出的时候会用到
        let {user} = data;
        socket.user_id = user.user_id;

        //检查在线列表，如果不在里面就加入
        if(!onlineUsers.hasOwnProperty(user.user_id)) {
            onlineUsers[user.user_id] = user;
            //在线人数+1
            onlineCount++;
        }
        if(!lotteryRs){
            loadLotteryRecord((betResult)=>{
                //向所有客户端广播用户加入
                io.emit('login', {onlineUsers: onlineUsers, onlineCount:onlineCount, joinUser:user, lotteryRs: betResult});
                console.log(user.name+'加入了聊天室');
            })
        }else{
            //向所有客户端广播用户加入
            io.emit('login', {onlineUsers: onlineUsers, onlineCount:onlineCount, joinUser:user, lotteryRs: lotteryRs});
            console.log(user.name+'加入了聊天室');
        }
    });

    //监听用户退出
    socket.on('disconnect', function(){
        //将退出的用户从在线列表中删除
        if(onlineUsers.hasOwnProperty(socket.user_id)) {
            //退出用户的信息
            let loginOutUser = onlineUsers[socket.user_id];
            //删除
            delete onlineUsers[socket.user_id];
            //在线人数-1
            onlineCount--;
            //向所有客户端广播用户退出
            io.emit('logout', {onlineUsers:onlineUsers, onlineCount:onlineCount, user:loginOutUser});
            console.log(loginOutUser.name+'退出了聊天室');
        }
    });

    //监听用户下注
    socket.on('bet', async (bet)=>{
        let {user,money,type,number,serial_number} = bet;
        let params = [user.user_id,money,type,number,serial_number,1];
        let dbRs = await db.query(bottomPourSql.insert,params);
        if(dbRs){
            //向所有客户端广播发布的消息
            io.emit('bet', bet);
            console.log(bet.user.name+'下注：'+bet.money,'下注类型:'+bet.type);
        }
    });

});

http.listen(3001, function(){
    console.log('listening on *:3001');
});