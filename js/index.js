/**
 * Created by shaobinli on 10/31/22.
 */

const nft = require('./lib/nft');
const crc4 = require('./lib/crc4');
const httpServer = require('./lib/http');

nft.updateNft();
crc4.updateCRC4();