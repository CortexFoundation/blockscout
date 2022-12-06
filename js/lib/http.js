let express = require('express');
let compression = require('compression');
let path = require('path');
let favicon = require('serve-favicon');
let logger = require('morgan');
let session = require('express-session');
let cookieParser = require('cookie-parser');
let bodyParser = require('body-parser');
let http = require('http');

let routes = require('./routes');
let app = express();

app.use(compression());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

let options = {
    dotfiles: 'ignore',
    etag: false,
    extensions: ['ejs', 'htm', 'html', 'css', 'png', 'gif', 'jpg', 'js', 'tpl'],
    index: 'true',
    maxAge: '604800',
    redirect: true,
    setHeaders: function(res, path, stat) {
        res.set('x-timestamp', Date.now());
        res.setHeader("Access-Control-Allow-Origin", "*");
    }
};
app.use(session({
    secret: 'ahfqoprbkl qwelhoiqy2hoehkbq qkejhioehrgienrlknlzhoohriohglko387kjg14iga8q7egi3gkguiaw', // 建议使用 128 个字符的随机字符串
    cookie: { maxAge: 60 * 1000 * 60 },
    rolling: true
}));
app.use(express.static(path.join(__dirname, 'public'), options));
app.use(express.static(__dirname + '/../silencer/dist/'));
app.use('/', routes);
console.log(__dirname)
app.get('/upload', function (request, response) {
    response.sendFile('/home/ubuntu/blockscout/js/silencer/dist/index.html');
});

let httpServer = http.createServer(app);
httpServer.listen(5000);
httpServer.on('listening', function() {
    console.log('httpserver listening @port 5000');
});
httpServer.on('request', function(req,res) {
    // res.setHeader("Access-Control-Allow-Origin", "*");
});
httpServer.on('connection', function(socket) {
    socket.setTimeout(10000);
});
httpServer.on('error', function(error, req, res) {
    console.log('Error' + error);
});
module.exports = app;
