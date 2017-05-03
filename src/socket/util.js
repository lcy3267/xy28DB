/**
 * Created by chengyuan on 2017/4/20.
 */
//与app 相差35秒
export function  getCnaOpenTime(){
    let today = new Date();
    let hour  = today.getHours();
    let startTime = null;
    if(hour >= 21){
        startTime = `${formatDate(today,'yyyy-MM-dd')} 20:57:00`;
    }else{
        startTime = `${GetDateStr(-1)} 20:57:00`;
    }

    let startTimestamp = Date.parse(startTime);

    let date = new Date().getTime();

    let distance = date - startTimestamp;

    let result = 210-Math.floor(distance%210000/1000);

    return result;
}

//获取北京开奖时间
export function getBjOpenTime(){
    var myDate = new Date();

    let currentMinute = myDate.getMinutes(); //当前分钟数
    let currentSecond = myDate.getSeconds(); // 当前秒数

    let single = currentMinute%10; //个位分分钟数
    let next = single >= 5?10:5;

    let minute = next - single -1;
    let second = 60 - currentSecond -1;

    return minute*60 + second;
}

function GetDateStr(AddDayCount) {
    var dd = new Date();
    dd.setDate(dd.getDate()+AddDayCount);//获取AddDayCount天后的日期
    var y = dd.getFullYear();
    var m = dd.getMonth()+1;//获取当前月份的日期
    var d = dd.getDate();
    return y+"-"+m+"-"+d;
}

export const formatDate =  (date,fmt) => {
    var o = {
        "M+" : date.getMonth()+1,                 //月份
        "d+" : date.getDate(),                    //日
        "h+" : date.getHours(),                   //小时
        "m+" : date.getMinutes(),                 //分
        "s+" : date.getSeconds(),                 //秒
        "q+" : Math.floor((date.getMonth()+3)/3), //季度
        "S"  : date.getMilliseconds()             //毫秒
    };
    if(/(y+)/.test(fmt))
        fmt=fmt.replace(RegExp.$1, (date.getFullYear()+"").substr(4 - RegExp.$1.length));
    for(var k in o)
        if(new RegExp("("+ k +")").test(fmt))
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
    return fmt;
};

export const getUserSocket =  (io,user_id) => {

    let key = null;

    for(let k of Object.keys(io.clients().sockets)){
        if(io.clients().sockets[k].user_id && io.clients().sockets[k].user_id == user_id){
            key = k;
            break;
        }
    }
    
    return io.clients().sockets[key] || null;
};