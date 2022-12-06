const express = require('express');
const async = require('async');

const router = express.Router();
const topMiner = require('./topMiner');
const nft = require('./nft');
router.get('/api_v2/topminer', function (req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", '*');
    topMiner.getTopMiner()
        .then(data => {
            res.send(data);
        })
        .catch(err=> {
            res.send(err);
        })

});
module.exports = router;

