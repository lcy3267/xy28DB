import rp from 'request-promise';
import {myTransaction,dbQuery} from '../db/index';
import bottomPourSql from '../db/sql/bottomPourSql';
import gameRulesSql from '../db/sql/gameRulesSql';
import {integralChangeSql} from '../db/sql';
import {lotteryType,changeType,openResultHost} from '../config/index';

Array.prototype.getSum = function(){
  let sum = 0;
  this.map((number)=>{
    sum += +number;
  });
  return sum;
}

let myRequest = async (path) => {
  return rp(path)
      .then(function (data) {
        return JSON.parse(data);
      })
      .catch(function (err) {
        console.log('抓取数据出错:'+err);
        return {err_code: -200};
      });
}

//获取开奖结果
export let loadLotteryRecord = async (type) => {
  if (type == 1) {
    let rs = await myRequest(openResultHost.china);
    if(!rs){
      return loadLotteryRecord(type);
    }

    let result = rs.c_r.split(',');
    result.pop();
    result = result.sort((a, b)=>a - b);
    //bj开奖规则
    let one = (+result.slice(0, 6).getSum()) % 10,
        two = (+result.slice(6, 12).getSum()) % 10,
        third = (+result.slice(12, 18).getSum()) % 10,
        sum = one + two + third;
    // 开奖期数 1 ,2 ,3 ,合, 开奖地点:1北京 2加拿大
    let obj = {
      serial_number: rs.c_t,
      one,
      two,
      third,
      sum,
      type: 1,
      list: result
    }

    //开奖结果
    obj.result = formatResult(sum);

    return obj;
  } else {
    //cnd 开奖规则
    const numbers = [[2, 5, 8, 11, 14, 17], [3, 6, 9, 12, 15, 18], [4, 7, 10, 13, 16, 19]];
    let rs = await myRequest(openResultHost.cnd);
    if(!rs){
      return loadLotteryRecord(type);
    }
    let result = rs.c_r.split(',');
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
        third = (+third) % 10;
    let sum = one + two + third;
    // 开奖期数 1 ,2 ,3 ,合, 开奖地点:1北京 2加拿大
    let obj = {
      serial_number: rs.c_t,
      one,
      two,
      third,
      sum,
      place: 2,
    }
    //开奖结果
    obj.result = formatResult(sum);

    return obj;
  }
}

//积分结算
export let clearingIntegral = async (placeType = 1) => {
  //开奖结果
  let result = await loadLotteryRecord(placeType);
  //获取当前期数下注记录
  let records = await dbQuery(bottomPourSql.querySerialRecord,result.serial_number);
  //游戏规则 赔率
  let game_rules = await dbQuery(gameRulesSql.queryAll);

  //遍历下注记录
  for(var record of records){
    let hasWinning = false;
    let money = record.bottom_pour_money;
    let bottom_pour_type = record.bottom_pour_type;
    let rate = game_rules.filter((rules)=>rules.type == bottom_pour_type)[0].rate;

    //遍历是否中奖
    for(var rs of result.result){
      if(bottom_pour_type == rs){
        hasWinning = true;
        let integral = money * rate;
        //中奖 修改相应数据
        await myTransaction([
          {
            sql: "update users set integral = (? + integral) where user_id = ?",
            params: [integral,record.user_id],
          },
          {
            sql: "update bottom_pour_record set is_winning = ?,win_integral = ? where bottom_pour_id = ?",
            params: [1,integral,record.bottom_pour_id],
          },
          {
            sql: integralChangeSql.insert,
            params: [record.user_id,integral,changeType.win],
          },
        ]);
        break;
      }
    }

    if(!hasWinning){
      //将用户下注记录 变为已 未中奖
      await dbQuery("update bottom_pour_record set is_winning = ? where bottom_pour_id = ?",[-1,record.bottom_pour_id]);
    }
  }

  //@todo 添加开奖记录;
  //await dbQuery();


  return {err_code: 0,record_number: records.length, serial_number: result.serial_number}
}


function formatResult(sum) {
  let typeArr = [];
  let hasMax = lotteryType.max;//大小
  let hasDouble = lotteryType.single; //单双
  let combination = lotteryType.maxS; //组合

  if(sum <= 13){
    hasMax = lotteryType.min;
    if(sum % 2 == 0){
      combination = lotteryType.minD;//小双
    }else{
      combination = lotteryType.minS;//小双
    }
  }else{
    if(sum % 2 == 0){
      combination = lotteryType.maxD;//大双
    }else{
      combination = lotteryType.maxS;//大双
    }
  }

  if(sum % 2 == 0){
    hasDouble = lotteryType.double;
  }

  return [hasMax,hasDouble,combination];
}