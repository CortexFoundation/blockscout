/**
 * Created by shaobinli on 11/1/22.
 */

const Pool = require('pg-pool');
const url = require('url');

const params = url.parse(process.env.DATABASE_URL_BLOCKSCOUT);
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
module.exports = {
    getDBConnection
}

