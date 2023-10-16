/**
 * Created by shaobinli on 6/28/23.
 */

const utils = require('./utils');
let getDailyActive = function () {
    console.log(new Date(), 'start');
    let pool = utils.getDBConnection();
// console.log(web3);
    let address_tem = '0x8376d08637d264e6b296083177c38ea724a4d863';
    let addressList = [];
    let contractList = [];
    pool.query('select from_address_hash,to_address_hash,created_contract_address_hash from transactions where updated_at >=  CURRENT_DATE - INTERVAL \'3 months\' and status=1;', [], function (err, res) {
        if (err) {
            console.log(err);
        } else {
            for (let i in res.rows) {
                let contract = res.rows[i].created_contract_address_hash ? res.rows[i].created_contract_address_hash.toString('hex') : '';
                let to = res.rows[i].to_address_hash ? res.rows[i].to_address_hash.toString('hex') : '';
                let from = res.rows[i].from_address_hash ? res.rows[i].from_address_hash.toString('hex') : '';
                if (from != '' && addressList.indexOf(from) == -1) {
                    addressList.push(from);
                }
                if (to != '' && addressList.indexOf(to) == -1) {
                    addressList.push(to);
                }
                if (contract != '' && contractList.indexOf(contract) == -1) {
                    contractList.push(contract);
                }
            }
            let tem = [];
            for (let i in addressList) {
                if (contractList.indexOf(addressList[i]) == -1) {
                    tem.push(addressList[i]);
                }
            }
            console.log(addressList.length);
            console.log(contractList.length);
            console.log(tem.length);
        }
    })
};

getDailyActive();
