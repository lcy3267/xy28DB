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
    china: "http://123.168kai.com/Open/CurrentOpenOne?code=10014&_=0.06803648965035364",
    cnd: "http://kj.1680api.com/Open/CurrentOpenOne?code=10041&_=0.06803648965035364",
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
}

export  let er_codes = {
    1001: '已经开过将',
}
