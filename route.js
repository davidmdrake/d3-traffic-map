var express = require('express'),
    fs = require('fs'),
    _ = require('lodash');

var app = module.exports = express.Router();

app.get('/api/locations/:time1/:time2', function(req,res){
    var json = JSON.parse(fs.readFileSync('./Data/traffic.json', 'utf8'))
    var json_region = json;
    var json_filt = _.filter(json_region, function(x){
        return x._time >= req.params.time1 & x._time < req.params.time2
    });
    console.log(json_filt.length);
    res.json(json_filt);

});