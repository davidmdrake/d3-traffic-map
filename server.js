var http = require('http'),
    express = require('express'),
    bodyParser = require('body-parser');

var app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(function( req, res, next){
    // Website you wish to all to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost')

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow_headers','X-Requested-With, Content-Length, Authorization, content-type')

    // Set to true if you need the website to include cookies in the request section
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials',true)

    next();
});

app.use(express.static(__dirname + '/Scripts'));
app.use(express.static(__dirname + '/node_modules'));
app.use(require('./route'));
app.get('/', function(req,res,next){
    res.sendFile('ThreatMap.html',{ root: __dirname }); // load the single view file 
})

var port = process.env.PORT || 3002;

http.createServer(app).listen(port, function (err) {
    console.log('listening in http://localhost:' + port);
})