var rgdMap = {};
var URL = 'http://cs.catlin.edu/~khanh/cytoscape/';
var cytoInfo = {};
var dataURL = URL + 'RGD_ORTHOLOGS.txt';
var expURL = URL + 'test_levels.txt';
var lineSplit = /\n/;
var _Split = '_';
var pipeSplit = /\|/;
var expData = {};
var expStats = {};

$.get(expURL, {}, function(resText) {
  var data = resText.split(pipeSplit);
  var mean = {ej:0,lj:0,lp:0};
  var numElems = data.length;

  var valList = {ej:[],lj:[],lp:[]};

  _.each(data, function(line) {
    var pts = line.split(_Split);

    for(var i = 1; i < pts.length; i++) {
      pts[i] = parseFloat(pts[i]);
    }

    valList.ej.push(pts[1]);
    valList.lj.push(pts[2]);
    valList.lp.push(pts[3]);

    expData[pts[0].toLowerCase()] = {
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

  expStats = {
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
})

.done(function() {
  console.log('Expression values read.');
});

/****** RGDMap data retrieval and parsing ******/
$.get(dataURL, {}, function(responseText) { 
  var data = responseText.split(lineSplit);    //split by new line
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
},'text')

.done(function() {
  console.log('rgdMap ready');
})

.done( function() {
  var networkURL = URL + 'basakData.sif';
  var cytoNodes = [];
  var cytoLinks = [];
  var nodesObj = {};

  /****** Network data retrieval and creation ******/
  $.get(networkURL, {}, function(responseText) {
    var lines = responseText.replace(/\r/g,"") //removes carriage returns
      .split(lineSplit);

    _.each(lines, function(line) {
      //lowercases array data from splitting
      var data = lowerCase(line.split(_Split));

      var startNodeId = data[0];
      var endNodeId = data[2];
      var startNodeInfo = rgdMap[startNodeId];
      var endNodeInfo = rgdMap[endNodeId];

      if(expData[startNodeId]) {
        var startNode = new CytoNode(startNodeId, startNodeInfo, expData[startNodeId] , 'gene');
        nodesObj[startNodeId] = startNode;
      }
      if(expData[endNodeId]) {
        var endNode = new CytoNode(endNodeId, endNodeInfo, (expData[endNodeId] || null), 'gene');
        nodesObj[endNodeId] = endNode;
      }
      if(expData[startNodeId] && expData[endNodeId])
      cytoLinks.push(new CytoLink(startNodeId, endNodeId, data[1].toLowerCase()));
    });

  },'text')

  .done(function() {
      console.log('created cytoLinks');
      _.each(nodesObj, function(cytoNode) {
        cytoNodes.push(cytoNode);
      });
      cytoInfo = {
        nodes : cytoNodes,
        links : cytoLinks
      };
  }, 

  function() {
    console.log('registered ' +cytoNodes.length+ ' cytoNodes');
  }, 

  //render the cytoscape network when finished with reqs
  function() {
    renderCyto(cytoInfo);
  });
});
