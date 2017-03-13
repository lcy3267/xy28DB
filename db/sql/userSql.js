/**
 * Created by chengyuan on 2017/2/27.
 */
var UserSQL = {
    insert:'INSERT INTO users(account,password) VALUES(?,?)',
    queryAll:'SELECT * FROM users',
    getUserById:'SELECT * FROM users WHERE uid = ? ',
};
module.exports = UserSQL;