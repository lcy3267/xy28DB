export let key = {
    md5: 'yuan',
    token: 'suifengxixihah',
};

export let mysqlConfig = {
    host: '127.0.0.1',
    user: 'root',
    password: '1234',
    database:'xy28',
    port: 3306
}

export let openResultHost = {
    //hina: "http://123.168kai.com/Open/CurrentOpenOne?code=10014&_=0.06803648965035364",
    //china: "http://www.bwlc.net/bulletin/keno.html",
    china: "http://www.dandan28.com/index/forecast/type/1",

    //cnd: "http://www.28shence.com/xxw.php?in=2",
    //cnd: "http://www.pc2800.com/?m=Home&c=Index&a=yuce&type=2"
    cnd: "http://www.dandan28.com/index/forecast/type/2"
}

//开奖类型
export let lotteryType ={
    max: 'big', //大
    min: 'small', //小
    single: 'single', //单
    double: 'double', //双
    maxS: 'big_single', //大单
    maxD: 'big_double', //大双
    minS: 'small_single', //小单
    minD: 'small_double', //小双
    maximum: 'max', //极大
    minimum: 'min', //极小
}

//积分变动类型
export let changeType = {
    xz: 1,//下注
    win: 2,//中奖
    input: 3,//充值
    out: 4,//提现
    hs: 5,//回水
    adminInput: 6,//管理员手动充值
    refuseOut: 7,//拒绝提现
    cancelBet: 8,//取消下注
}

//充值类型
export let rechargeType = {
    alipay: 1,//支付宝
    bank: 2,//银行转账
    wx: 3,//微信
    adminInput: 6,//管理员手动充值
}

export  let er_codes = {
    1001: '已经开过奖',
}

export const notToken = [
    "/users/login",
    "/users/admin/pcLogin",
    "/users/register",
    "/system/rooms",
    "/system/rooms",
]

