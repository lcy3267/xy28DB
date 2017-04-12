/**
 * Created by chengyuan on 2017/3/25.
 */
export let integralChangeSql = {
    insert: "insert into user_integral_change(user_id,integral,type) values(?,?,?)"
}
export let usersSql = {
    queryUserIntegral: "select integral from users where user_id = ?"
}