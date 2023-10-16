/**
 * Created by shaobinli on 11/1/22.
 */

const Pool = require('pg-pool');
const url = require('url');
const Web3 = require('web3');

const params = url.parse('postgresql://postgres:postgres@localhost:5432/blockscout');
const auth = params.auth.split(':');

const config = {
    user: auth[0],
    password: auth[1],
    host: params.hostname,
    port: params.port,
    database: params.pathname.split('/')[1],
    // ssl: true
};

let con;	// 数据库连接

const getDBConnection = function () {
    if (con === undefined) {
        console.log('Try Connect Database.');
        con = new Pool(config)
    }

    return con;
};


// web3 utils
let web3;	// web3 链接实例

const createWeb3Connection = function() {
    const address = `http://127.0.0.1:8545`;
    web3 = new Web3(address);
};

function getWeb3Instance() {
    if (web3 === undefined) {
        console.log('Try connect geth via web3.');
        createWeb3Connection();
    }

    return web3;
}


module.exports = {
    getDBConnection,
    getWeb3Instance
}



let tem = {
    "info_hash": "f192a623417e490d398fe8a404a7fbc9c8364e80",
    "author": "0xbb76e3210fdbb3bacc56bd0a5a30664baed56a06",
    "description": "",
    "type": "input",
    "image": "https://cortex.infura-ipfs.io/ipfs/QmX9uf3UU3XT2BjVHxUCmTnqS6Dd4XoJdB1QoqyRUXLxum",
    "external_url": {
        "hfs": "https://model.cortexlabs.ai/f192a623417e490d398fe8a404a7fbc9c8364e80.tar",
        "ipfs": "https://cortex.infura-ipfs.io/ipfs/QmSrDXXLz17YsjuVcWwr35mhazzmVA3cFf5gcSzw7Nhe6y"
    }
}