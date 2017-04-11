/**
 * Created by chengyuan on 2017/3/26.
 */
export let responseJSON = (res, ret) => {
    if (typeof ret === 'undefined') {
        res.json({
            code: '-200', msg: '操作失败'
        });
    } else {
        ret.err_code = 0;
        res.json(ret);
    }
};