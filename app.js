//core dependencies
var express = require('express');
var http = require('http');
var path = require('path');

//Rendering and styling
var stylus = require('stylus');
var nib = require('nib');

//database interaction
var neo4j = require('neo4j'); //replace with db module

//sockets will come later
//var io = require('socket.io');
//USE XHR's FOR NOW

//helpers
var _ = require('underscore');
var async = require('async');

//mixin
_.each(async, function(fn, name) {
  _.mixin({name: fn});  //mixes in nicely functions well
});

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
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

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
