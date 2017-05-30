/**
 * Created by chengyuan on 2017/3/12.
 */
/**
 * Created by chengyuan on 2017/2/27.
 */
var bottomPourSql = {
    insert:'INSERT INTO bottom_pour_record(user_id,play_type,bottom_pour_money,bottom_pour_type,bottom_pour_number,serial_number,room_id,room_level,lottery_place_type) VALUES(?,?,?,?,?,?,?,?,?)',
    queryAll:'SELECT * FROM bottom_pour_record WHERE status != -1 order by created_at desc',
    querySerialRecord:'select * from bottom_pour_record WHERE status = 1 and is_winning = 0 and serial_number = ?',
};
module.exports = bottomPourSql;