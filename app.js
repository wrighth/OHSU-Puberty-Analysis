//core dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var fs = require('fs');

//Rendering and styling
var stylus = require('stylus');
var nib = require('nib');

//database interaction
var neo4j = require('neo4j'); //replace with db module
var redis = require('redis');

//sockets will come later
//var io = require('socket.io');
//USE XHR's FOR NOW

//helpers
var _ = require('underscore');
var async = require('async');

//child processes - calling R from node
var sys = require('util');
var exec = require('child_process').exec;

//mixin
_.each(async, function(fn, name) {
  _.mixin({name: fn});  //mixes in nicely functions well
});

var app = express();
var cli = redis.createClient();

app.configure(function(){
  app.set('port', process.env.PORT || 8000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(require('stylus').middleware(__dirname + '/public'));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

app.get('/resources/color', function(req, res) {
  var expInfo = req.query.expInfo;
  if(!expInfo) {
    res.send('ERR: no expInfo!');
  }

  if(_.isObject(expInfo)) {
    //write file using fs
  }
  //pass file to colors
  //res.send colors obj

  res.send(expInfo);
});

var colorsFromR = function colorsFromR(readFrom, breaks) {
  var readFrom = readFrom || "exps.txt";
  var breaks = breaks || 32;
  var command = "R --slave --args "+readFrom+" "+breaks+" < parse_colors.R";

  var child = exec(command, function (err, stdout, stderr) {
    var data = stderr.split(/\n/);

    sys.print('stdout: ' + stdout);
  });
};

//returns the rgd Info for the rgdKeys provided in the req
app.post('/resources/rgd', function(req, res) {
  var rgdReq = req.body.rgdReq || req.body.rgdRequest;
  rgdReq = _.uniq(rgdReq);
  var rgdInfo = {};

  if(!(rgdReq && _.isArray(rgdReq))) {
    res.send('Error! That is not a valid request. Please give me an array of rgdKeys.');
  }

  //get each key from redis
  async.series([
    function getKeys(nextFunc) {

      _.each(rgdReq, function(rgdKey) {
        async.waterfall([
          function checkAndGetRgd(callback) {
            cli.exists(rgdKey, function(err, exists) {
              if(!err && exists) {
                cli.get(rgdKey, function(err, rgdObj) {
                  if(!err) {
                    callback(null, JSON.parse(rgdObj));
                  }
                  else {
                    console.error('ERR: '+err.message);
                  }
                }); //parsed JSON of the rgdInfo
              }
              else if(!err) {
                callback(null, {
                  symbol: rgdKey,
                  rat: null,
                  human: null,
                  mouse: null
                });
              }
              else {
                console.error('ERR: '+err.message);
                callback(err, null);
              }
            });
          },
          function (rgdObj, callback) {
            rgdInfo[rgdKey] = rgdObj;
            if(Object.keys(rgdInfo).length === rgdReq.length) {
              nextFunc(null); //move to the next part
            }
          }
        ]);
      });
    },
    function rgdStringify(callback) {
      rgdInfo = JSON.stringify(rgdInfo);
      callback(null);
    }
  ], function sendRes(err) {
    if(!err) {
      res.json(rgdInfo);
    }
    else {
      console.error('ERR: '+err.message);
    }
  });
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
