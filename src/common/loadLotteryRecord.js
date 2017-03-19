import request from 'request';
const lottery = 2;

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

export default (callback) => {
  if(lottery == 1){
    const bjHost = 'http://123.168kai.com/Open/CurrentOpenOne?code=10014&_=0.06803648965035364';
    request(bjHost, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        let rs = JSON.parse(body);
        let result = rs.c_r.split(',');
        result.pop();
        result = result.sort((a,b)=>a-b);
        let one = +result.slice(0,6).getSum().toString().getLast(),
            two = +result.slice(6,12).getSum().toString().getLast(),
            third = +result.slice(12,18).getSum().toString().getLast(),
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
        callback(obj);
      }
    });
  }else{
    const cndHost = 'http://kj.1680api.com/Open/CurrentOpenOne?code=10041&_=0.06803648965035364';
    const numbers = [[2,5,8,11,14,17],[3,6,9,12,15,18],[4,7,10,13,16,19]];
    request(cndHost, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        let rs = JSON.parse(body);
        let result = rs.c_r.split(',');
        result = result.sort((a,b)=>a-b);
        let one=0,two=0,third = 0;
        numbers.map((number,i)=>{
          number.map((num)=>{
            switch (i){
              case 0:
                one += +result[num-1];
              break;
              case 1:
                two += +result[num-1];
                break;
              case 2:
                third += +result[num-1];
                break;
            }
          });
        });
        one = +one.toString().getLast(),
        two = +two.toString().getLast(),
        third = +third.toString().getLast();
        let sum = one + two + third;
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
        callback(obj);
      }
    });
  }
}

