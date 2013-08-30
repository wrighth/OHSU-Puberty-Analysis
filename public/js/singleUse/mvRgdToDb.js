var fs = require('fs');
var _ = require('underscore');
var redis = require('redis');

var cli = redis.createClient();

cli.on('connect', function() {
  console.log('connected to redis!');
});

var lowerCase = function toLower(arr) {
  var newArr = _.map(arr, function(str) {
    return (str)? str.toLowerCase() : str;
  });
  return newArr;
};
var RGD = function RGD(dataArr) {
  this.symbol = dataArr[0] || dataArr[3] || dataArr[7]; //defaults to human or mouse if rat does not exist
  //should be the same for all species, could be missing from rat or human

  var ratArr = dataArr.splice(0,3); //splice 3 elements starting at 0
  var mouseArr = dataArr.splice(4,5); //splice 5 elements starting with 4
  var humanArr = dataArr;

  this.rat = new Rat(ratArr);
  this.mouse = new Mouse(mouseArr);
  this.human = new Human(humanArr);
};
var Rat = function Rat(ratArr) {
  this.rgdId = ratArr[1];
  this.entrezGeneId = ratArr[2];
};
var Mouse = function Mouse(mouseArr) {
  if(mouseArr[0] === "") {  //I could use falsy value, but this is more readable
    return undefined;
  }

  this.rgdId = mouseArr[1];
  this.entrezGeneId = mouseArr[2];
  this.mgiId = mouseArr[3];
  this.source = mouseArr[4];
};
var Human = function Human(humanArr) {
  if(humanArr[0] === "") {  //I could use falsy value, but this is more readable
    return undefined;
  }

  this.rgdId = humanArr[1];
  this.entrezGeneId = humanArr[2];
  this.source = humanArr[3];
  this.hgncId = humanArr[4];
};

fs.readFile('/home/hamzah/ohsu/devData/RGD_ORTHOLOGS.txt', {encoding:'utf-8'}, function(err, file) {
  var rgdMap = {};
  var lines = file.split(/\n/);
  var i = 0;

  _.each(lines, function(line) {
    var lineInfo = lowerCase(line.split("_"));

    if(lineInfo.length !== 13) {
      throw new Error('Error w/ data length. Is really ' + lineInfo.length + ".");
    }

    var key = lineInfo[0];

    var rgdInfo = rgdMap[key] = JSON.stringify(new RGD(lineInfo));
    cli.set(key, rgdInfo);
    
    console.log(key, cli.get(key));
  });
});
