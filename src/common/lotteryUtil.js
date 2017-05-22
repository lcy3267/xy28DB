import rp from 'request-promise';
import Promise from 'promise-polyfill';
import cheerio from 'cheerio';
import {myTransaction, dbQuery} from '../db/index';
import bottomPourSql from '../db/sql/bottomPourSql';
import gameRulesSql from '../db/sql/gameRulesSql';
import {integralChangeSql} from '../db/sql';
import {lotteryType, changeType, openResultHost} from '../config/index';
import http from 'http';

Array.prototype.getSum = function () {
    let sum = 0;
    this.map((number)=> {
        sum += +number;
    });
    return sum;
}

function myPromise(promise) {
    return new Promise((resolve, reject) => {
        //成功
        promise.then(
            (res) => {
                resolve(res);
            },
            //失败
            (err) => {
                reject(err);
            }
        );
    })
}

let myRequest = (path, html = false) => {
    return myPromise(rp(path))
        .then((res)=> {
            if (!html) {
                return JSON.parse(res)
            } else {
                return res;
            }
        })
        .catch(function (error) {
            console.log("请求出错啦");
            return false;
        });
}

//获取开奖结果
export let loadLotteryRecord = async(type) => {
    console.log('-----进来拿取开奖结果-------',type);

    let path = type == 2 ? openResultHost.cnd : openResultHost.china;
    let openRs = await myRequest(path, true);
    let obj = {};

    if(!openRs) return false;

    if (type == 1) {//北京开奖

        const reg = /<tr class="">([\d\D]*)<tr class="odd">/;
        const tdReg = /<td>(.*)<\/td>/g;

        let string = openRs.match(reg)[1];
        string = string.match(tdReg);

        const rs = string.map((str)=> {
            return str.replace(/<td>|<\/td>/g, "");
        });

        let result = rs[1].split(',');
        result = result.sort((a, b)=>a - b);
        //bj开奖规则
        let one = (+result.slice(0, 6).getSum()) % 10,
            two = (+result.slice(6, 12).getSum()) % 10,
            third = (+result.slice(12, 18).getSum()) % 10,
            sum = one + two + third;
        // 开奖期数 1 ,2 ,3 ,合, 开奖地点:1北京 2加拿大
        obj = {
            serial_number: rs[0],
            one,
            two,
            third,
            sum,
            type: 1,
        }

        //开奖结果
        obj.result = formatResult(sum);

    } else {
        //cnd 开奖规则===========
        /*const numbers = [[2, 5, 8, 11, 14, 17], [3, 6, 9, 12, 15, 18], [4, 7, 10, 13, 16, 19]];
        let result = openRs.c_r.split(',');
        result = result.sort((a, b)=>a - b);
        let one = 0, two = 0, third = 0;
        numbers.map((number, i)=> {
            number.map((num)=> {
                switch (i) {
                    case 0:
                        one += +result[num - 1];
                        break;
                    case 1:
                        two += +result[num - 1];
                        break;
                    case 2:
                        third += +result[num - 1];
                        break;
                }
            });
        });
        one = (+one) % 10,
            two = (+two) % 10,
            third = (+third) % 10;*/
        //===========



        var $ = cheerio.load(openRs);

        /*let one = +$('.s1b').eq(0).text(),
            two= +$('.s1b').eq(1).text(),
            third = +$('.s1b').eq(2).text(),
            sum = one + two + third;*/


        let serial_number = $('.caculate').prev().text(),
            number = $('.caculate').eq(0).text().split('+'),
            one = +number[0],
            two= +number[1],
            third = +number[2],
            sum = one + two + third;


        // 开奖期数 1 ,2 ,3 ,合, 开奖地点:1北京 2加拿大
        obj = {
            serial_number: serial_number,
            one,
            two,
            third,
            sum,
            place: 2,
        }
        //开奖结果
        obj.result = formatResult(sum);
    }

    let lottery_record = await dbQuery("select * from lottery_record where lottery_place_type = ? && serial_number = ? order by created_at desc limit 1", [type, obj.serial_number]);
    obj.err_code = 0;
    //插入开奖数据
    if (lottery_record.length == 0) {//数据库无该条开奖信息(未开奖)
        let params = [obj.one, obj.two, obj.third, obj.sum, obj.serial_number, type];
        await dbQuery("insert into lottery_record(first_number,second_number,third_number,sum_number,serial_number,lottery_place_type) values(?,?,?,?,?,?)", params);
    } else if (lottery_record[0].is_open == 1) {  //已经开过奖
        obj.err_code = 1001;
    } else if (lottery_record[0].is_open == -1) {
        obj.err_code = 1002; //未结算
    }

    return obj;
};

//循环结算 用户下注记录 保证全部结算完成
export let clearingIntegral = async(placeType = 1) => {
    //开奖结果
    let result = await loadLotteryRecord(placeType);

    if(result && result.err_code == 0 || result.err_code == 1002){
        clearing.users = {};
        let rs = await clearing(result);
        return rs;
    }

    return false;
}

//积分结算
async function clearing(result) {
    //获取当前期数下注记录
    let records = await dbQuery(bottomPourSql.querySerialRecord, result.serial_number);

    //遍历下注记录
    for (var record of records) {
        const {user_id, bottom_pour_money, bottom_pour_type, play_type, bottom_pour_number, room_id} = record;

        //添加结算用户
        if (!clearing.users[user_id]) {
            let user = {
                user_id: user_id,
                integral: 0,
            }
            clearing.users[user_id] = user;
        }

        let hasWinning = false;
        let money = +bottom_pour_money; // 下注金额
        let integral = 0; // 赢取金额

        if(play_type == 1 && result.result.indexOf(bottom_pour_type) > -1){
            hasWinning = true;

            //游戏规则 赔率
            let game_rules = await dbQuery('select g.combine_rates from game_rules g left join rooms r on r.id = ? where g.id = r.rule_combine_id',[room_id]);

            let rule = JSON.parse(game_rules[0].combine_rates);
            let rate = rule[bottom_pour_type].value;

            integral = money * (rate -1); // 赢取金额

        }else if(play_type == 2 && bottom_pour_number == result.sum){
            hasWinning = true;

            let game_rules = await dbQuery('select g.single_point_rate from game_rules g left join rooms r on r.id = ? where g.id = r.rule_combine_id',[room_id]);

            let rules = game_rules[0].single_point_rate.split('|');

            rules.map((rate, index)=>{
                rules[14+index] = rules[13-index];
            });

            integral = money * (+rules[bottom_pour_number] - 1);
        }

        if(hasWinning){
            clearing.users[user_id].integral += integral;

            //中奖 修改相应数据
            await myTransaction([
                {
                    sql: "update users set integral = (? + integral) where user_id = ?",
                    params: [integral, user_id],
                },
                {
                    sql: "update bottom_pour_record set is_winning = ?,win_integral = ? where bottom_pour_id = ?",
                    params: [1, integral, record.bottom_pour_id],
                },
                {
                    sql: integralChangeSql.insert,
                    params: [user_id, integral, changeType.win],
                },
            ]);
        }else{
            //将用户下注记录 变为已 未中奖
            await dbQuery("update bottom_pour_record set is_winning = ?,win_integral = ? where bottom_pour_id = ?",
                [-1, -money, record.bottom_pour_id]);
        }

    }

    if (records.length != 0) {
        return await clearing(result);
    } else {
        await dbQuery("update lottery_record set is_open = 1,updated_at = now() where serial_number = ?", [result.serial_number]);
        return {err_code: 0, result, clearUsers: clearing.users}
    }
}

function formatResult(sum) {
    let hasMax = lotteryType.max;//大小
    let hasDouble = lotteryType.single; //单双
    let combination = lotteryType.maxS; //组合

    if (sum <= 13) {
        hasMax = lotteryType.min;
        if (sum % 2 == 0) {
            combination = lotteryType.minD;//小双
        } else {
            combination = lotteryType.minS;//小双
        }
    } else {
        if (sum % 2 == 0) {
            combination = lotteryType.maxD;//大双
        } else {
            combination = lotteryType.maxS;//大双
        }
    }

    if (sum % 2 == 0) {
        hasDouble = lotteryType.double;
    }

    return [hasMax, hasDouble, combination];
}

function isJSON(str) {
    if (typeof str == 'string') {
        try {
            JSON.parse(str);
            return true;
        } catch (e) {
            return false;
        }
    }
}