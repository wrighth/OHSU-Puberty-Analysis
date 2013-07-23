//ALL FILES HAVE LINES DELIMITED BY '\n' and DATA POINTS DELIMITED BY '_'
var lineSplit = /\n/;
var _Split = '_';

var URL = 'http://129.95.40.226:8000/';
var urlObj = {
  rgdData: URL + 'data/RGD_ORTHOLOGS.txt',
  networkData: URL + 'data/basakData.sif',
  expressionData: URL + 'data/test_levels.txt'
}

var expData = {};
var expStats = {};
var cytoInfo = {};
var rgdMap = {};

//resText of expressions => eData,eStats
var readExpressionData = function readExpressionData(resText) {
  var data = resText.split(lineSplit);
  var eData = {};
  var eStats = {};

  var valList = {ej:[],lj:[],lp:[]};
  var mean = {ej:0,lj:0,lp:0};
  var numElems = data.length;

  //FINDS MAX,MIN,AVG
  _.each(data, function(line) {
    var pts = line.split(_Split);

    for(var i = 1; i < pts.length; i++) {
      pts[i] = parseFloat(pts[i]);
    }

    valList.ej.push(pts[1]);
    valList.lj.push(pts[2]);
    valList.lp.push(pts[3]);

    eData[pts[0].toLowerCase()] = {
      ej: pts[1],
      lj: pts[2],
      lp: pts[3]
    };

    mean.ej += pts[1];
    mean.lj += pts[2];
    mean.lp += pts[3];
  });

  //calculate the averages
  _.each(mean, function(val, key) {

    mean[key] /= numElems;
  });

  eStats = {
    max:{
      ej:_.max(valList.ej),
      lj:_.max(valList.lj),
      lp:_.max(valList.lp)
    },
    min:{
      ej:_.min(valList.ej),
      lj:_.min(valList.lj),
      lp:_.min(valList.lp)
    },
    mean:mean
  };

  return {
    eData : eData,
    eStats : eStats
  };
};
//resText => rgdMap
var readRGDData = function readRGDData(resText) {
  var rgdMap = {};
  var data = resText.split(lineSplit);    //split by new line
  data.pop(); //empty string removal

  _.each(data, function(line) {
    //lowercases array data from splitting
    var dataArr = line.split(_Split);
    if(dataArr.length !== 13) {
      throw new Error('Error w/ data length. Is really ' + dataArr.length + ".");
    }
    dataArr = lowerCase(dataArr);

    var key = dataArr[0] || dataArr[3] || dataArr[7]; //defaults to human or mouse if rat does not exist

    rgdMap[dataArr[0]] = new RGD(dataArr);  //new rgd's with rat as key
  });

  return rgdMap;
};

  /****** Network creation ******/
// => cytoInfo
var readNetworkData = function readNetworkData(resText, rgdMap, eData) {
  var lines = resText.replace(/\r/g,"") //removes carriage returns
    .split(lineSplit);

  var cytoNodes = [];
  var cytoLinks = [];
  var nodesObj = {};

  _.each(lines, function(line) {
    //lowercases array data from splitting
    var data = lowerCase(line.split(_Split));

    var startNodeId = data[0];
    var endNodeId = data[2];
    var startNodeInfo = rgdMap[startNodeId];
    var endNodeInfo = rgdMap[endNodeId];

    if(eData[startNodeId]) {
      var startNode = new CytoNode(startNodeId, startNodeInfo, eData[startNodeId] , 'gene');
      nodesObj[startNodeId] = startNode;
    }
    if(eData[endNodeId]) {
      var endNode = new CytoNode(endNodeId, endNodeInfo, eData[endNodeId], 'gene');
      nodesObj[endNodeId] = endNode;
    }
    if(eData[startNodeId] && eData[endNodeId])
    cytoLinks.push(new CytoLink(startNodeId, endNodeId, data[1].toLowerCase()));
  });

  console.log('created cytoLinks');
    _.each(nodesObj, function(cytoNode) {
      cytoNodes.push(cytoNode);
    });

  console.log('registered ' +cytoNodes.length+ ' cytoNodes');

  return {
    nodes : cytoNodes,
    links : cytoLinks
  };
};

//all requests for data
async.waterfall([
  function reqRGDData(callback) {

    $.get(urlObj.rgdData, function passRgdData(resText) {
      rgdMap = readRGDData(resText);      //returns rgdMap
    }, 'text')

    .done(function() {
      console.log('rgdMap ready');
      callback(null, rgdMap);
    })
  },
  function reqExpressions(rgdMap, callback) {
    var eData = {};
    var eStats = {};

    $.get(urlObj.expressionData, function(resText) {
      var expReturnVals = readExpressionData(resText, rgdMap);
      eData = expReturnVals.eData;
      eStats = expReturnVals.eStats;

      expData = eData; //GLOBALS
      expStats = eStats;

    }, 'text')

    .done(function() {
      console.log('read expressions successfully');
      callback(null, rgdMap, eData, eStats);
    });
  },
  function reqNetworkData(rgdMap, eData, eStats, callback) {

    var cInfo = {};

    $.get(urlObj.networkData, function setUpCytoInfo(resText) {
      cInfo = readNetworkData(resText, rgdMap, eData, eStats);
      cytoInfo = cInfo; //GLOBAL
    }, 'text')

    .done(function() {
      console.log('network stuff done successfully');

      callback(null, rgdMap, eData, eStats, cInfo);
    });
  }
], function(err, rgdMap, eData, eStats, cInfo) {
  console.log(err, rgdMap, eData, eStats, cInfo);

  if(err) {
    console.error('ERR: '+err.message);
  }
  console.log('all data loaded.')

  renderCyto(cytoInfo);
});
