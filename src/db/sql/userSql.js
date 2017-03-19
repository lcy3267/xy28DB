/**
 * Created by chengyuan on 2017/2/27.
 */
var UserSQL = {
    insert:'INSERT INTO users(account,password,name) VALUES(?,?,?)',
    queryAll:'SELECT * FROM users',
    userLogin:'SELECT * FROM users WHERE account = ?',
    queryUserById:'SELECT * FROM users WHERE user_id = ?',
};
module.exports = UserSQL;