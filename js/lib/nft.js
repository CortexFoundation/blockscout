/**
 * Created by shaobinli on 11/1/22.
 */
const utils = require('./utils');
const async = require('async');

let num_limit = 500;
let num_start = 0;

let updateNft = function () {
    console.log(new Date(),'start update nft');
    let pool = utils.getDBConnection();
    async.waterfall([
        //get nft transfers
        (callback)=> {
            let tem = {};
            let num_limit = 500;
            let num_start = 0;
            pool.query('SELECT * from token_transfers where token_id is not NULL order by block_number desc limit $1 offset $2', [num_limit, num_start], function (err, res) {
                if (err) {
                    callback.log(err);
                } else {
                    res.rows.reverse()
                    for (let i in res.rows) {
                        let token_contract_address_hash = res.rows[i].token_contract_address_hash.toString('hex')
                        if (!tem[token_contract_address_hash]) {
                            tem[token_contract_address_hash] = {};
                            tem[token_contract_address_hash][res.rows[i].token_id] = res.rows[i].to_address_hash.toString('hex');
                        } else {
                            tem[token_contract_address_hash][res.rows[i].token_id] = res.rows[i].to_address_hash.toString('hex');
                        }
                    }
                    callback(null, tem);
                }
            })
        },
        //get nft metadata
        (nfts, callback)=> {
            let tem = [];
            for (let i in nfts) {
                for (let j in nfts[i]) {
                    tem.push([j, i, nfts[i][j]])
                }
            }
            let nft_info = [];
            async.eachLimit(tem, 5, function (item, callback) {
                pool.query('select * from token_instances where token_id = $1 and token_contract_address_hash = $2::bytea', [item[0], '\\x' + item[1]], function (err, res) {
                    if (err) {
                        callback(err)
                    } else {
                        let nft_tem = {
                            token_id: item[0],
                            token_contract_address_hash: item[1],
                            token_owner: item[2],
                        }
                        if (res.rows[0]) {
                            let metadata = res.rows[0].metadata;
                            nft_tem.metadata = metadata;
                            for (let i in metadata) {
                                nft_tem[i] = metadata[i];
                            }
                            nft_info.push(nft_tem)
                        }
                        callback(null, 'success');
                    }
                })
            }, function (err, resut) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, nft_info)
                }
            })
        },
        //update nft info
        (nftList, callback) => {
            let sql = 'insert into nft_info (tokenid,url,title,author,description,image,name,detail,tokenhash,owner,filetype) values ($1,$2,$3,$4,$5,$6,$7,$8,(decode($9, \'hex\')),(decode($10, \'hex\')),$11)' +
                ' ON CONFLICT (tokenid,tokenhash) DO UPDATE SET owner=(decode($12, \'hex\'))';
            async.eachLimit(nftList, 5, function (item, callback) {
                let img = '';
                if (item.animation_url && item.animation_url != '') {
                    img = retrieveUrl(item.animation_url);
                } else if (item.image_url && item.image_url != '') {
                    img = retrieveUrl(item.image_url);
                } else if (item.image && item.image != '') {
                    img = retrieveUrl(item.image);
                } else if (item.properties && item.properties.image && item.properties.image.description && item.properties.image.description != '') {
                    img = retrieveUrl(item.properties.image.description);
                } else if (item.fileSource && item.fileSource.value && item.fileSource.value != '') {
                    img = retrieveUrl(item.fileSource.value);
                }
                let title = '';
                if (item.name && item.name != '') {
                    title = item.name
                }
                let description = '';
                if (item.description && item.description.value && item.description.value != '') {
                    description = item.description.value;
                } else if (item.description && item.description != '') {
                    description = item.description;
                }
                let author = '';
                if (item.author && item.author.value && item.author.value != '') {
                    author = item.author.value;
                } else if (item.author && item.author != '') {
                    author = item.author;
                }
                let filetype = '0';
                if (item.fileExtension && item.fileExtension.value && item.fileExtension.value == 'mp4') {
                    filetype = '1';
                }
                let data = [
                    item.token_id,
                    img,
                    title,
                    author,
                    description,
                    img,
                    title,
                    JSON.stringify(item.metadata),
                    item.token_contract_address_hash,
                    item.token_owner,
                    filetype,
                    item.token_owner
                ];
                // console.log(data);
                pool.query(sql, data, function (err, res) {
                    if (err) {
                        callback({
                            toekn: item.token_contract_address_hash,
                            tokenId: item.token_id,
                            message: err
                        })
                    } else {
                        callback(null, 'success');
                    }
                })
            }, function (err, resut) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, 'success')
                }
            })
        },
    ], (err, result)=> {
        if (err) {
            console.log(err);
        } else {
            console.log(result);
        }
        console.log(new Date(),'update nft success');

        setTimeout(()=> {
            updateNft();
        }, 5 * 1000)
    })
};

let getTransfers = (numLimit, numOffset) => {
    let pool = utils.getDBConnection();
    let sql = 'SELECT * from token_transfers WHERE token_id is not NULL limit $1 OFFSET $2';
    return new Promise((resolve, reject) => {
        pool.query(sql, [numLimit, numOffset], function (err, res) {
            if (err) {
                reject(err);
            } else {
                for (let i in res.rows) {
                }
                resolve(res.rows);
            }
        })
    });
};

let getNftMetadata = (token_id, token_contract_address_hash) => {
    let pool = utils.getDBConnection();
    let sql = 'SELECT * from token_instances WHERE token_id =  $1 and token_contract_address_hash = $2';
    return new Promise((resolve, reject) => {
        pool.query(sql, [token_id, token_contract_address_hash], function (err, res) {
            if (err) {
                reject(err);
            } else {
                for (let i in res.rows) {
                }
                resolve(res.rows);
            }
        })
    });
}

let updateNftInfo = (tokenInfo) => {
    let pool = utils.getDBConnection();
    // let sql = 'INSERT INTO nft_info (hash, blockNumber,txinfo,txreceipt) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE blockNumber=?,txinfo=?,txreceipt=?';
    let sql = 'insert into nft_info (tokenid,url,title,author,description,image,name,detail,tokenhash,owner,filetype) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)' +
        ' ON DUPLICATE KEY UPDATE owner=$12';

    return new Promise((resolve, reject) => {
        pool.query(sql, [numLimit, numOffset], function (err, res) {
            if (err) {
                reject(err);
            } else {
                for (let i in res.rows) {
                }
                resolve(res.rows);
            }
        })
    });
};
let retrieveUrl = (url) => {
    if (typeof url === 'string') {
        let url_ = url;
        if (url_.substring(0, 12) == 'ipfs://ipfs/') {
            url_ = 'https://ipfs.io/ipfs/' + url_.slice(12);
        } else if (url_.substring(0, 7) == 'ipfs://') {
            url_ = 'https://ipfs.io/ipfs/' + url_.slice(7);
        } else if (url_.substring(0, 4) != 'http') {
            url_ = 'https://icarusart.mypinata.cloud/' + url_;
        }
        return url_;
    } else {
        return url;
    }
};


module.exports = {
    updateNft
}