//ALL FILES HAVE LINES DELIMITED BY '\n' and DATA POINTS DELIMITED BY '_'
var lineSplit = /\n/;
var _Split = '_';

var URL = 'http://spock.csee.ogi.edu:8080/';
var urlObj = {
  rgdData: URL + 'resources/rgd',
  networkData: URL + 'data/link_type_test.txt',
  expressionData: URL + 'data/gene_type_test.txt',
  colorData: URL + 'resources/color'
}

//GLOBAL VARIABLES
var cytoInfo = {};
var rgdMap = {};
//WILL HOLD ACCESS TO ALL DATA OF eData, eStats, name, symbol, etc
var timePointMap = {};
/*
  data: ,
  name: ,
  symbol: ,
  stats: 
};*/

//resText of expressions => eData
//ACCOUNTS FOR VARIABLE NUMBER OF TIMEPOINTS
var readExpressionData = function readExpressionData(resText) {
  var data = resText.replace(/\r/g,'').split(lineSplit);
  var timesToGet = data.shift().split(_Split);
  var numElems = data.length;
  var eData = {};
  var timePointsList = [];

  //if there is an empty string after an extra new line at the end, pop it
  if(data[data.length-1] == "")
    data.pop();

  //put all of the wanted times as keys in the map
  _.each(timesToGet, function(timePoint) {
    timePointMap[timePoint] = {};
  });

  var valList = {};
  var mean = {};

  //FINDS MAX,MIN,AVG
  _.each(data, function(line) {
    var pts = line.split(_Split);

    //this checks if it helps create timePointsList
    if(pts[2] === 'info') {
      if(timePointMap[pts[0]]) {
        var symbol = pts[0];

        //DOES NOT CHECK TO SEE IF THE TEXT FILE CONTAINS DUPLICATE SYMBOLS
        timePointsList.push({
          symbol: symbol,
          name: pts[1]
        });

        timePointMap[symbol].symbol = symbol;
        timePointMap[symbol].name = pts[1];

        //defaults
        valList[symbol] = [];
        mean[symbol] = 0;
      }

      numElems--; //subtract one line from num of data lines (for mean calculation)
    }
    //for all values
    else {
      console.log(pts);
      var currentRgdKey = pts[0].toLowerCase();
      var nodeType = pts[1].toLowerCase();
      //fill eData w/ objects
      eData[currentRgdKey] = {};

      //the 2's are to account for the format in which the key comes first, then the node type
      //if there are more values than timePoints, then ignore the extra value
      var numTimesToRun = (pts.length -2 <= timePointsList.length)? pts.length : timePointsList.length +2;
      for(var i = 2; i < numTimesToRun; i++) {
        var currentTimePoint = timePointsList[i-2].symbol;

        //check if the key is wanted
        if(timePointMap[currentTimePoint]) {
          pts[i] = parseFloat(pts[i]);

          //fill all values from timePointsList with 
          valList[currentTimePoint].push(pts[i]);
          //fill objects in eData object with values
          eData[currentRgdKey][currentTimePoint] = pts[i];
          eData[currentRgdKey]['nodeType'] = nodeType;
          //fill mean object
          mean[currentTimePoint] += pts[i];
        }
      }
    }
  });

  //set values of timePointMap
  _.each(timePointsList, function(timePointInfo) {
    var symbol = symbol;
    if(timePointMap[symbol]) {
      timePointMap[symbol].symbol = symbol;
      timePointMap[symbol].name = timePointInfo.name;
    }
  });

  //calculate the averages
  _.each(mean, function(val, symbol) {
    //account extra data by subtracting from length when they are added
    mean[symbol] /= numElems;
  });

  //    timePointMap Initizalization
  _.each(timePointMap, function(timePointInfo) {
    timePointInfo.stats = {};
    timePointInfo.data = {};
  });

  _.each(timePointMap, function(timePointInfo, symbol) {

    _.each(eData, function(expValue, rgdKey) {
      timePointInfo.data[rgdKey] = expValue[symbol];
    });
    
    //does all statistics work except for mean
    timePointInfo.stats.max = _.max(valList[symbol]);
    timePointInfo.stats.min = _.min(valList[symbol]);
    timePointInfo.stats.mean = mean[symbol];
  });

  return eData;
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
      var startNode = new CytoNode(startNodeId, startNodeInfo, eData[startNodeId] , eData[startNodeId].nodeType);
      nodesObj[startNodeId] = startNode;
    }
    if(eData[endNodeId]) {
      var endNode = new CytoNode(endNodeId, endNodeInfo, eData[endNodeId], eData[endNodeId].nodeType);
      nodesObj[endNodeId] = endNode;
    }
    if(eData[startNodeId] && eData[endNodeId])
    cytoLinks.push(new CytoLink(startNodeId, endNodeId, lineInfo.linkType));
  });

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
  //this is the edge data
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
      rgdMap = rMap;    //set rgdMap to the map

      callback(null, networkInfo, rMap);
    });
  },
  //gets and processes expression data
  function getExpressionData(networkInfo, rMap, callback) {
    var eData = {};

    $.get(urlObj.expressionData, function(resText) {
      eData = readExpressionData(resText);

    }, 'text')

    .done(function() {
      callback(null, networkInfo, rMap, eData);
    });
  },
  //process networkInfo
  function readNetworkInfo(networkInfo, rMap, eData, callback) {
    var cInfo = {};
    
    cInfo = readNetworkData(networkInfo, rMap, eData);
    cytoInfo = cInfo; //GLOBAL

    callback(null, rMap, eData, cInfo)
  }], 

  //waterfall callback
  function completeReqs(err, rMap, eData, cInfo) {
    if(err) {
      console.error('ERR: '+err.message);
    }
    console.log('all data loaded.')

    renderCyto(cInfo);
  }
);
