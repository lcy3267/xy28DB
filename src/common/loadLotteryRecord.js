import request from'request';

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

