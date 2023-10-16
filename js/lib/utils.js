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

const getDBConnection = function() {
    if (con === undefined) {
        console.log('Try Connect Database.');
        con = new Pool(config)
    }

    return con;
};

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

