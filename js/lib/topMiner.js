/**
 * Created by shaobinli on 11/25/22.
 */
const utils = require('./utils');
const async = require('async');
let topMiner = {};
let updateTopMiner = function () {
    console.log(new Date(), 'start update top miner');
    let pool = utils.getDBConnection();
    async.waterfall([
        //get top miners
        (callback)=> {
            let sql = 'select miner_hash, max(timestamp), count(*) as num,consensus from blocks where (current_timestamp - interval \'24 hour\') <= timestamp group by miner_hash,consensus order by consensus,num DESC'
            pool.query(sql, [], function (err, res) {
                if (err) {
                    callback.log(err);
                } else {
                    let tem = {};
                    let list = [];
                    for (let i in res.rows) {
                        console.log(res.rows[i]);
                        let address = '0x' + res.rows[i].miner_hash.toString('hex');
                        if(list.indexOf(address)==-1){
                            list.push(address);
                        }
                        if (!tem[address]) {
                            tem[address] = {};

                            if (res.rows[i].consensus) {
                                tem[address]['num'] = parseInt(res.rows[i].num);
                                tem[address]['max(timestamp)'] = res.rows[i].max;
                            } else {
                                tem[address]['uncle'] = parseInt(res.rows[i].num);
                            }
                        } else {
                            if (res.rows[i].consensus) {
                                tem[address]['num'] = parseInt(res.rows[i].num);
                                tem[address]['max(timestamp)'] = res.rows[i].max;
                            } else {
                                tem[address]['uncle'] = parseInt(res.rows[i].num);
                            }
                        }
                    }
                    for (let i in tem) {
                        if (!tem[i].uncle) {
                            tem[i].uncle = 0;
                        }
                        if (!tem[i].num) {
                            tem[i].num = 0;
                        }
                        if (tem[i].num + tem[i].uncle == 0) {
                            tem[i].unclesRate = 0
                        } else {
                            tem[i].unclesRate = tem[i].uncle / (tem[i].num + tem[i].uncle) * 100;
                        }
                    }
                    console.log(list);
                    let topData = [];
                    for (let i in list) {
                        let addressData = tem[i];
                        addressData.miner = i;
                        topData.push(addressData)
                    }
                    callback(null, topData);
                }
            })
        },
        // get totalunclesRate
        (topData, callback)=> {
            let sql = 'select count(*) as num,consensus from blocks group by consensus order by consensus';
            pool.query(sql, [], function (err, res) {
                if (err) {
                    callback.log(err);
                } else {
                    let tem = parseInt(res.rows[0].num) * 100 / parseInt(res.rows[1].num);
                    callback(null, {
                        result: topData,
                        totalunclesRate: tem
                    });
                }
            })
        }

    ], (err, result)=> {
        if (err) {
            console.log(err);
        } else {
            console.log(result);
            topMiner = result;
            console.log(new Date(), 'update top miner success');
        }
        setTimeout(()-> {
            updateTopMiner();
        }, 10 * 60 * 1000);
    })
};
updateTopMiner();
let getTopMiner = ()=> {
    return new Promise((resolve, reject) => {
        if (topMiner) {
            resolve(topMiner);
        } else {
            reject({
                message: 'null'
            })
        }
    });
}
module.exports = {
    getTopMiner
}

