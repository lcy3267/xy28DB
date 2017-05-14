import Client from './client';
/**
 * 单sql执行
 * @param sql
 * @param params
 * @returns {*}
 */
export let dbQuery = (sql, params = []) => {
    let client = new Client();
    return client.query(sql, params).catch(function (error) {
        console.warn("请求出错啦");
        return false;
    });;
    /*let result = await client.query(sql, params);
    console.log(result,' --------dbQuery--------')
    return result;*/
    /*console.log(sql);
    console.log(params);
    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection) => {
            if (err) {
                console.error("getConnection:"+err);
                return reject(err);
            }
            connection.query(sql, params, (err, result) => {
                connection.release();
                if (err) {
                    console.error("query:"+err);
                    return reject(err);
                }
                resolve(result);
            });
        });
    });*/
}

/**
 * sql事务执行
 * @param sqlArr [obj,obj]
 */
export let myTransaction = async (sqlArr) => {
    let client = new Client();
    let rs = false;
    await client.startTransaction();
    for (var sql of sqlArr){
        let params = sql.params?sql.params:[];
        rs = await client.executeTransaction(sql.sql,params);
        if(!rs) break;
    }
    await client.stopTransaction();
    return rs;
}