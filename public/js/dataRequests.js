//ALL FILES HAVE LINES DELIMITED BY '\n' and DATA POINTS DELIMITED BY '_'
var lineSplit = /\n/;
var _Split = '_';

var URL = 'http://spock.csee.ogi.edu:8080/';
var urlObj = {
  rgdData: URL + 'resources/rgd',
  networkData: URL + 'data/basakData.sif',
  expressionData: URL + 'data/test_levels.txt',
  colorData: URL + 'resources/color'
}

//GLOBAL VARIABLES
var expData = {};
var expStats = {};
var cytoInfo = {};
var rgdMap = {};
var timePointsList = [];

//resText of expressions => eData,eStats
//ACCOUNTS FOR VARIABLE NUMBER OF TIMEPOINTS
var readExpressionData = function readExpressionData(resText) {
  var data = resText.replace(/\r/g,'').split(lineSplit);
  var numElems = data.length;
  var eData = {};
  var eStats = {};
  timePointsList = [];

  var valList = {};
  var mean = {};

  //FINDS MAX,MIN,AVG
  _.each(data, function(line) {
    var pts = line.split(_Split);

    if(pts[2] === 'info') {
      var symbol = pts[0];

      //DOES NOT CHECK TO SEE IF THE TEXT FILE CONTAINS DUPLICATE SYMBOLS
      timePointsList.push({
        symbol: symbol,
        name: pts[1]
      });

      //defaults
      valList[symbol] = [];
      mean[symbol] = 0;

      numElems--; //subtract one line from num of data lines (for mean calculation)
    }
    else {
      var currentRgdKey = pts[0].toLowerCase();
      //fill eData w/ objects
      eData[currentRgdKey] = {};

      //if there are more values than timePoints, then ignore the extra value
      var numTimesToRun = (pts.length -1 <= timePointsList.length)? pts.length : timePointsList.length +1;
      for(var i = 1; i < numTimesToRun; i++) {
        var currentTimePoint = timePointsList[i-1].symbol;

        pts[i] = parseFloat(pts[i]);

        //fill all values from timePointsList with 
        valList[currentTimePoint].push(pts[i]);
        //fill objects in expData object with values
        eData[currentRgdKey][currentTimePoint] = pts[i];
        //fill mean object
        mean[currentTimePoint] += pts[i];
      }
    }
  });

  //calculate the averages
  _.each(mean, function(val, key) {
    //account extra data by subtracting from length when they are added
    mean[key] /= numElems;
  });

  eStats = {
    max: {},
    min: {},
    mean: mean
  };

  _.each(timePointsList, function(timePointInfo) {
    var currentSymbol = timePointInfo.symbol;
    eStats.max[currentSymbol] = _.max(valList[currentSymbol]);
    eStats.min[currentSymbol] = _.min(valList[currentSymbol]);
  });

  return {
    eData : eData,
    eStats : eStats
  };
};
  /****** Network creation ******/
// networkInfo [{},{},{}] => cytoInfo
var readNetworkData = function readNetworkData(networkInfo, rMap, eData) {

  var cytoNodes = [];
  var cytoLinks = [];
  var nodesObj = {};

  _.each(networkInfo, function(lineInfo) {

    var startNodeId = lineInfo.startNodeId;
    var endNodeId = lineInfo.endNodeId;

    var startNodeInfo = rMap[startNodeId];
    var endNodeInfo = rMap[endNodeId];

    if(eData[startNodeId]) {
      var startNode = new CytoNode(startNodeId, startNodeInfo, eData[startNodeId] , 'gene');
      nodesObj[startNodeId] = startNode;
    }
    if(eData[endNodeId]) {
      var endNode = new CytoNode(endNodeId, endNodeInfo, eData[endNodeId], 'gene');
      nodesObj[endNodeId] = endNode;
    }
    if(eData[startNodeId] && eData[endNodeId])
    cytoLinks.push(new CytoLink(startNodeId, endNodeId, lineInfo.linkType));
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


async.waterfall([
  //makes Network request => network array & rgdKeys
  function getNetworkData(callback) {
    var rgdKeys = [];
    var networkInfo = [];

    $.get(urlObj.networkData, function parseNetworkData(resText) {
      var lines = resText.replace(/\r/g,"").split(lineSplit); //removes carriage returns and splits

      _.each(lines, function(line) {
        var data = lowerCase(line.split(_Split));

        var lineInfo = {
          startNodeId: data[0],
          linkType: data[1].toLowerCase(),
          endNodeId: data[2]
        };

        networkInfo.push(lineInfo);
        rgdKeys.push(data[0], data[2]);
      })

    }, 'text')

    .done(function() {
      callback(null, networkInfo, rgdKeys);
    });
  },
  //takes rgdKeys => rgdMap, passes on network array
  function getRgdMap(networkInfo, rgdKeys, callback) {
    rgdKeys = _.uniq(rgdKeys); //no duplicates

    var rMap = {};

    $.post(urlObj.rgdData, {rgdReq: rgdKeys}, function queryForRgdInfo(resText) {
      rMap = JSON.parse(resText);
    }, 'text')

    .done(function() {
      console.log('rgdMap ready');
      rgdMap = rMap;    //set rgdMap to the map

      callback(null, networkInfo, rMap);
    });
  },
  //gets and processes expression data
  function getExpressionData(networkInfo, rMap, callback) {
    var eData = {};
    var eStats = {};

    $.get(urlObj.expressionData, function(resText) {
      var expReturnVals = readExpressionData(resText);
      eData = expReturnVals.eData;
      eStats = expReturnVals.eStats;

      expData = eData; //GLOBALS
      expStats = eStats;

    }, 'text')

    .done(function() {
      console.log('read expressions successfully');
      callback(null, networkInfo, rMap, eData, eStats);
    });
  },
  //process networkInfo
  function readNetworkInfo(networkInfo, rMap, eData, eStats, callback) {
    var cInfo = {};
    
    cInfo = readNetworkData(networkInfo, rMap, eData);
    cytoInfo = cInfo; //GLOBAL

    callback(null, rMap, eData, eStats, cInfo)
  }], 

  //waterfall callback
  function completeReqs(err, rMap, eData, eStats, cInfo) {
    if(err) {
      console.error('ERR: '+err.message);
    }
    console.log('all data loaded.')

    renderCyto(cInfo);
  }
);

var timePointExists = function timePointExists(symbol) {
  _.each(timePointsList, function(timePointInfo) {
    if(timePointInfo.symbol === symbol)
      return true;
  });
  return false;
};
