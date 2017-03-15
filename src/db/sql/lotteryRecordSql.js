/**
 * Created by chengyuan on 2017/2/27.
 */
var UserSQL = {
    insert:'INSERT INTO lottery_record(serial_number,first_number,second_number,third_number,sum_number,lottery_place_type) VALUES(?,?,?,?,?,?)',
    queryAll:'SELECT * FROM game_rules',
    getUserById:'SELECT * FROM game_roles WHERE uid = ? ',
};
module.exports = UserSQL;