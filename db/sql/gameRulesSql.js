/**
 * Created by chengyuan on 2017/3/12.
 */
/**
 * Created by chengyuan on 2017/2/27.
 */
var GameRulesSql = {
    insert:'INSERT INTO game_rules(account,password) VALUES(?,?)',
    queryAll:'SELECT * FROM game_rules WHERE state != -1',
};
module.exports = GameRulesSql;