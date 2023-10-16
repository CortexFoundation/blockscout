/**
 * Created by shaobinli on 11/1/22.
 */
const utils = require('./utils');
const async = require('async');
let BigNumber = require('bignumber.js');

let num_limit = 500;
let num_start = 0;
let abi = require("./CortexArtAbiV2.json");
let badList = require("./bad_token.json");
let updateCRC4 = function () {
    console.log(new Date(), 'start update token');
    let pool = utils.getDBConnection();
    let web3 = utils.getWeb3Instance();
// console.log(web3);
    let address_tem = '0x8376d08637d264e6b296083177c38ea724a4d863';
    async.waterfall([
        //get nft transfers
        (callback)=> {
            // let tem = {};
            let num_limit = 500;
            let num_start = 0;
            pool.query('SELECT * from tokens where name is NULL and name is NULL limit $1 offset $2', [num_limit, num_start], function (err, res) {
                if (err) {
                    callback.log(err);
                } else {
                    let tem = [];
                    for (let i in res.rows) {
                        // console.log(res.rows[i]);
                        let contract_address_hash = res.rows[i].contract_address_hash.toString('hex');
                        res.rows[i].contract_address_hash_stttring = '0x' + contract_address_hash;
                        console.log(res.rows[i]);
                        if(badList.indexOf(res.rows[i].contract_address_hash_stttring) == -1){
                            tem.push(res.rows[i])
                        }
                    }
                    callback(null, tem);
                }
            })
        },
        //get name and symbol
        (crc4s, callback)=> {
            async.eachLimit(crc4s, 1, function (item, callback) {
                let myContract = new web3.eth.Contract(abi, item.contract_address_hash_stttring, {
                    from: address_tem, // default from address
                });
                myContract.methods
                    .name()
                    .call({from: address_tem, gas: 1000000}, function (err, res) {
                        if (err) {
                            console.log(err);
                            callback(null);
                        } else {
                            console.log('name:', res);
                            item.name = res;
                            myContract.methods
                                .symbol()
                                .call({from: address_tem, gas: 1000000}, function (err, res) {
                                    if (err) {
                                        console.log(err);
                                        callback(null);
                                    } else {
                                        console.log('name:', res);
                                        item.name = res;
                                        setTimeout(()=> {
                                            callback(null);
                                        }, 0.5 * 1000)
                                    }
                                })
                        }
                    })
            }, function (err, resut) {
                if (err) {
                    callback(null);
                } else {
                    callback(null, crc4s)
                }
            })
        },
        //update crc4 info
        (crc4s, callback) => {
            let sql = '';
            let data = [];
            async.eachLimit(crc4s, 3, function (item, callback) {
                if (item.name && item.symbol) {
                    sql = 'update tokens set name=$1 and  symbol=$2 where contract_address_hash = $3::bytea';
                    data = [item.name, item.symbol,  '\\x' + item.contract_address_hash.toString('hex')]
                } else if (item.name) {
                    sql = 'update tokens set name=$1 where contract_address_hash = $2::bytea';
                    data = [item.name,  '\\x' + item.contract_address_hash.toString('hex')]
                }else if (item.symbol) {
                    sql = 'update tokens set symbol=$1 where contract_address_hash = $2::bytea';
                    data = [item.symbol,  '\\x' + item.contract_address_hash.toString('hex')]
                }
                if(sql!=''){
                    pool.query(sql, data, function (err, res) {
                        if (err) {
                            callback(err)
                        } else {
                            callback(null);
                        }
                    })
                }else{
                    callback(null);
                }
            }, function (err, resut) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, 'update token success')
                }
            })
        }
    ], (err, result)=> {
        if (err) {
            console.log(err);
        } else {
            console.log(result);
        }
        setTimeout(()=> {
            updateCRC4();
        }, 5 * 1000);
    })
};


// updateCRC4();
module.exports = {
    updateCRC4
}
