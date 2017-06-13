import {dbQuery, myTransaction} from '../db/index';
let request = require('request');
import {loadLotteryRecord, clearingIntegral} from '../common/lotteryUtil';
import bottomPourSql from '../db/sql/bottomPourSql';
import {integralChangeSql, usersSql} from '../db/sql';
import {changeType, _lotteryType} from '../config/index';
import moment from 'moment';
import schedule from 'node-schedule';
import { getUserSocket, getBjOpenTime, getCnaOpenTime } from './util';
import { validLogin } from '../common/index';

const automationUsers = ['百发百中','老李','清水','小磊哥','王无敌','小寂寞','流浪','烦烦烦','力王','dasdsad',
    '天泪子','无崖','风','夜叉','玩一手','大胸妹','心情','呦哟','冯志华','萨拉黑哟',
    '雅蠛蝶','校长','就是单点王!','霸主','小弟弟','兵封','雷子','PDD','110克星','小雪'];

const automationMoney = [
    1,2,5,5,5,8,12,
    10,10,10,10,20,20,20,20,
    25,25,25,30,30,30,
    50,50,100,100,120,200,
    300,500,150,22,28,
];

//@todo 定时器 加拿大 7点到8点 停盘,,北京 0点 到 12点停盘
let socketFunc =  (io)=>{
    //当前在线人数
    var onlineCount = 0;
    // 房间用户名单
    let roomInfo = {};

    const bjType = 1,
        bjPath = '/bj';
    const cndType = 2,
        cndPath = '/cnd';
    let hours = new Date().getHours(),
        minutes = new Date().getMinutes();

    let bjResult = null,
        cndResult = null,
        cndT = getCnaOpenTime(),
        bjT = getBjOpenTime(),
        cndOpening = cndT < 30 || cndT > 180,
        bjOpening =  bjT < 30 || bjT > 270,
        bjClose = (hours < 9 && hours >= 0) || (hours == 23 && minutes >= 55),
        cndClose = hours == 19;

    let bjTimeout = null;
    let cndTimeout = null;

    /**
     * ------------
     *    定时器
     * ------------
     */
    //北京维护
    let bj1 = new schedule.RecurrenceRule();
    bj1.hour = 23;
    bj1.minute = 55;
    schedule.scheduleJob(bj1, function(){
        bjClose = true;
    });
    //北京开启
    let bj2 = new schedule.RecurrenceRule();
    bj2.hour = 9;
    bj2.minute = 0;
    schedule.scheduleJob(bj2, function(){
        bjClose = false;
    });

    //加拿大关闭
    let cnd1 = new schedule.RecurrenceRule();
    cnd1.hour = 19;
    cnd1.minute = 0;
    schedule.scheduleJob(cnd1, function(){
        cndClose = true;
    });
    //开启
    let cnd2 = new schedule.RecurrenceRule();
    cnd2.hour = 20;
    cnd2.minute = 0;
    schedule.scheduleJob(cnd2, function(){
        cndClose = false;
    });
    //============================//


    /**
     * ------------
     *    自动拖
     * ------------
     */

    const AutomationBet = (timeNum)=>{
        setTimeout(()=>{
            const userNumber = rnd(0, 30);
            const betTypeNum = rnd(0, 10);
            const moneyNum = rnd(0, 32);
            const number = rnd(1, 3);

            const bet = {
                user: {
                    user_id: -1,
                    name: automationUsers[userNumber],
                },
                playType: 1,
                type: _lotteryType[betTypeNum],
                money: automationMoney[moneyNum]*10,
                created_at: moment().format('YYYY-MM-DD HH:mm')
            };

            if(number == 1){
                if(bjResult && !bjClose && !bjOpening){
                    bet.serial_number = +bjResult.serial_number+1;
                    io.of(bjPath).emit('bet', {bet});
                }
            }else if(cndResult && !cndClose && !cndOpening){
                bet.serial_number = +cndResult.serial_number+1;
                io.of(cndPath).emit('bet', {bet});
            }

            AutomationBet(rnd(0,10));
        }, timeNum * 1000);
    }

    AutomationBet(rnd(0,10));

    const sendOpenResult = async (type)=>{

        let rs = await clearingIntegral(type);

        const path = type == bjType ? bjPath : cndPath;

        if (rs && rs.err_code == 0) {
            let {result, clearUsers} = rs;
            console.log('------已开奖');
            console.log(result);
            console.log(clearUsers);
            if(type == bjType){
                bjOpening = false;
                bjResult = result;
            }else{
                cndOpening = false;
                cndResult = result;
            }

            for (let k of Object.keys(clearUsers)){
                let user = clearUsers[k];
                let socket = getUserSocket(io, user.user_id);
                if(socket){
                    let integralRs = await dbQuery("select integral from users where user_id = ?",[user.user_id]);
                    socket.emit('updateIntegral', {
                        integral: integralRs[0].integral,
                        winIntegral: user.integral
                    });
                }
            }

            io.of(path).emit('openResult', {
                lotteryRs: result,
            });
        }
    }

    let cndTime = null;
    let cndTimer = setInterval(()=>{
        let time = 0;
        if(!cndClose){
            time = getCnaOpenTime();

            if(time < 30){
                cndOpening = true;
            }else{
                if(time == 30){
                    io.of(cndPath).emit('systemMsg', {content: '已封盘,下注结果以系统开机为准'});
                }
                if(time <= 210 && cndOpening){
                    sendOpenResult(cndType);
                }
            }
        }
        io.of(cndPath).emit('updateStatus', {opening: cndOpening, time: time -30, isClose: cndClose});
    },1000);

    let chinaTimer = setInterval(()=>{
        let time = 0;

        if(!bjClose){
            time = getBjOpenTime();
            if(time < 30){
                bjOpening = true;
            }else{
                if(time == 30){
                    io.of(bjPath).emit('systemMsg', {content: '已封盘,下注结果以系统开奖为准'});
                }
                if(time <= 280 && bjOpening){
                    sendOpenResult(bjType);
                }
            }
        }

        io.of(bjPath).emit('updateStatus', {opening: bjOpening, time: time -30, isClose: bjClose});
    },1000);


    //北京房间
    var bjNsp = io.of(bjPath);
    bjNsp.on('connection', (socket)=>connection(socket, bjPath));

    //加拿大房间
    var cndNsp = io.of(cndPath);
    cndNsp.on('connection', (socket)=>connection(socket, cndPath));

    //admin
    io.of('admin').on('connection', (socket)=>{

        console.log('admin user connected');

        socket.on('adminLogin', async(data)=>{
            socket.emit('adminLogin',{test: 'logined'});
        });

        //心跳包
        socket.on('palpitation', function (){
            if(socket.id){
                socket.emit('palpitation',{result: 'success'})
            }else{
                socket.emit('palpitation',{result: 'error'})
            }
        });
        
    });
    
    const connection = (socket, path) => {
        console.log('a user connected:'+path);

        //监听新用户加入
        socket.on('login',(data)=> {

            let {token, user, roomId, roomType, roomLevel} = data;

            validLogin(token, async (err, decode)=>{
                if(err){
                    socket.emit('login',{rs: 'login err'});
                    return;
                }
                //将新加入用户的唯一标识当作socket的名称，后面退出的时候会用到
                let roomNumber = `${roomType}-${roomId}`;

                if(socket.user_id) return;

                socket.user_id = user.user_id;
                socket.roomId = roomId;
                socket.roomType = roomType;
                socket.roomLevel = roomLevel;
                socket.roomNumber = roomNumber;

                if (!roomInfo[roomNumber]) {
                    roomInfo[roomNumber] = {};
                }

                roomInfo[roomNumber][user.user_id] = user;

                socket.join(roomNumber);    // 加入房间

                let integralRs = await dbQuery(usersSql.queryUserIntegral, [user.user_id]);

                const sendLogin = (result)=>{
                    io.of(path).to(roomNumber).emit('login', {
                        opening: roomType == bjType ? bjOpening : cndOpening,
                        joinUser: user,
                        integral: integralRs[0].integral,
                        lotteryRs: result,
                    });
                }

                if(roomType == bjType && bjResult){
                    sendLogin(bjResult)
                }else if(roomType == cndType && cndResult){
                    sendLogin(cndResult)
                }else{
                    loadRecord(socket.roomType, (result)=>{
                        sendLogin(result);
                    });
                }

                console.log(`--------${user.name}加入房间---${path}------`);
            })
        });

        //监听用户下注
        socket.on('bet', async(bet)=> {
            let {user, money, type, number, serial_number, playType} = bet;

            let rs = await dbQuery('select * from users where user_id = ?', [user.user_id]);

            if(rs[0].integral < money){
                return;
            }

            //禁止下注
            if(rs[0].can_bottom == -1){
                io.of(path).to(socket.roomNumber).emit('bet', {err_code: -1});
                return;
            }

            if(playType == 2 && !type) type = 'point';

            let results = await myTransaction([
                {//下注
                    sql: bottomPourSql.insert,
                    params: [user.user_id, playType, money, type, number, serial_number,
                        socket.roomId, socket.roomLevel, socket.roomType]
                },
                {//用户减分
                    sql: "update users set integral = (integral - ?) where user_id = ?",
                    params: [money, user.user_id]
                },
                {//增加用户积分变化记录
                    sql: integralChangeSql.insert,
                    params: [user.user_id, -money, changeType.xz],
                }
            ]);

            if (results) {

                bet.id = results[0].insertId;
                bet.created_at = moment().format('YYYY-MM-DD HH:mm');

                let integralRs = await dbQuery(usersSql.queryUserIntegral, [user.user_id]);
                //向所有客户端广播发布的消息
                io.of(path).to(socket.roomNumber).emit('bet', {bet});
                socket.emit('updateIntegral', {bet, integral: integralRs[0].integral});
                console.log(bet.user.name + '下注：' + bet.money, '下注类型:' + bet.type);
            }
        });

        //监听用户发送信息
        socket.on('msg',  async ({msg})=>{
            const users = await dbQuery("select * from users where user_id = ?",[msg.user.user_id]);
            if(users[0].has_speak == 1){
                msg.err_code = 0;
                io.of(path).to(socket.roomNumber).emit('msg', {msg});
            }else{
                socket.emit('msg', {msg: {err_code: -1}});
            }
        })

        //心跳包
        socket.on('palpitation', function (){
            if(socket.user_id){
                socket.emit('palpitation',{result: 'success'})
            }else{
                socket.emit('palpitation',{result: 'error'})
            }
        });

        //监听用户退出
        socket.on('disconnect', function () {
            // 从房间名单中移除
            let room = roomInfo[socket.roomNumber];
            var loginOutUser = room && room[socket.user_id];

            if (loginOutUser && socket.roomNumber) {
                delete roomInfo[socket.roomNumber][socket.user_id];

                socket.leave(socket.roomNumber);    // 退出房间

                io.of(path).to(socket.roomNumber).emit('logout', {user: loginOutUser});
            }
        });
    }
}

module.exports = socketFunc;

async function loadRecord(type, callback){
    let lotteryRs = await loadLotteryRecord(type);
    if(lotteryRs && lotteryRs.serial_number){
        callback && callback(lotteryRs);
    }else{
        setTimeout(async ()=>{
            loadRecord(type, callback);
        },500);
    }
}

function rnd(start, end){
    return Math.floor(Math.random() * (end - start) + start);
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
