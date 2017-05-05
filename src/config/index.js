export let key = {
    md5: 'yuan',
    token: 'suifengxixihah',
};

export let mysqlConfig = {
    host: '127.0.0.1',
    user: 'root',
    password: 'yuan3267',
    database:'xy28',
    port: 3306
}

export let openResultHost = {
    //hina: "http://123.168kai.com/Open/CurrentOpenOne?code=10014&_=0.06803648965035364",
    china: "http://www.bwlc.net/bulletin/keno.html",

    //cnd: "http://www.28shence.com/xxw.php?in=2",
    //cnd: "http://www.pc2800.com/?m=Home&c=Index&a=yuce&type=2"
    cnd: "http://www.dandan28.com/index/forecast/type/2"
}

//开奖类型
export let lotteryType ={
    max: 1, //大
    min: 2, //小
    single: 3, //单
    double: 4, //双
    maxS: 5, //大单
    maxD: 6, //大双
    minS: 7, //小单
    minD: 8, //小双
    maximum: 9, //极大
    minimum: 10, //极小
}

//积分变动类型
export let changeType = {
    xz: 1,//下注
    win: 2,//中奖
    input: 3,//充值
    out: 4,//提现
    hs: 5,//回水
    adminInput: 6,//管理员手动充值
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
    "/users/pcLogin",
    "/users/register",
    "/result"
]

