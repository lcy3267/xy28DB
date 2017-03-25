/**
 * Created by chengyuan on 2017/2/27.
 */
var UserSQL = {
    insert:'INSERT INTO users(account,password,name) VALUES(?,?,?)',
    queryAll:'SELECT * FROM users',
    userLogin:'SELECT * FROM users WHERE account = ?',
    queryUserById:'SELECT * FROM users WHERE user_id = ?',
    updateUserIntegral: 'UPDATE users u INNER JOIN bottom_pour_record b ON b.bottom_pour_id = ? SET b.is_winning = ?,' +
    'u.integral = (? + u.integral),u.prev_integral_change = ? WHERE u.user_id = ?',//
};
module.exports = UserSQL;