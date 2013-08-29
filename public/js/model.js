var x2js = new X2JS();

//Core Styling Functionality
var Core = function Core() {
  this.nodeShapeMap = {
    gene: 'circle',
    mirna: 'hexagon',
    stimulatory: 'triangle',
    inhibitory: 'rectangle'      //inhibitor or inhibit? 
  };
  this.linkColorMap = {
    pathway: 'red',
    'shared-protein-domains': 'blue',
    coexpression: 'purple',           //co-expression?
    'genetic-interactions': 'green',
    'protein-protein-interactions': 'orange',
    'predicted-protein-interactions': 'orange',
    colocalization: 'black',
    'protein-dna': 'indigo',
    'mirna-rna': 'indigo',
    'regulatory': 'yellow'
  };
  this.linkStyleMap = {
    'predicted-protein-interactions': '1px',
    'mirna-rna': '1px'
  };
  this.currentTimePoint;
};

Core.prototype.getNodeShape = function getNodeShape(node) {
  return this.nodeShapeMap[node.data.type] || 'octagon';
};

Core.prototype.getLinkColor = function getLinkColor(link) {
  return this.linkColorMap[link.data.type] || 'black';
};

Core.prototype.getLinkWidth = function getLinkWidth(link) {
  return this.linkStyleMap[link.data.type];    //default weight
};

Core.prototype.getInitialNodeColor = function getNodeColor(node) {
  this.currentTimePoint = 'ej';
  return processExpression(node.data.expression.ej, 'ej');
};

//for use after initial color call
//gets all new colors
Core.prototype.getNewColors = function(timePoint) {
  if(timePoint && this.currentTimePoint != timePoint) {
    var colorReqMap = {};

    //get each things color via XHR
    _.each(cy.nodes(), function(node) {
      var pointValue = timePointMap[timePoint].data[node.id()];
      var nodeId = node.id();

      colorReqMap[nodeId] = pointValue;
    });

    $.post(urlObj.colorData, {expInfo: colorReqMap}, function(newColorData) {
      //set new node colors
      if(_.isEmpty(newColorData))
        alert('no colors to change to');
      _.each(cy.nodes(), function(node) {
        node.css('background-color', newColorData[node.id()]);
      });
    });  

    this.currentTimePoint = timePoint;
    msgBox.innerText = 'Changed to ' + timePoint + '.';
  }
};

var core = new Core();

/*********************************\
         Color Management
\*********************************/
//THIS IS NOW TAKEN CARE OF BY R - may delete

var processExpression = function processExpression(val, timePoint) {
  var decimal = (val - expStats.min[timePoint])/(expStats.max[timePoint] - expStats.min[timePoint]);

  return randColor(decimal);
};

var randColor = function randColor(decimal) {
  var buffer = decimal - 0.5;

  var green = (buffer >= 0)? 255*Math.abs(buffer) : 0;
  var red = (buffer >= 0)? 0 : 255*Math.abs(buffer);

  return rgbToHex(red,green,0); //returns something between red and green
};

//converts RGB to hexadecimal
var rgbToHex = function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/*********************************\
         Helper Functions
\*********************************/

//String#startsWith for search
if (!String.prototype.startsWith) {
  Object.defineProperty(String.prototype, 'startsWith', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: function (searchString, position) {
      position = position || 0;
      return this.indexOf(searchString, position) === position;
    }
  });
}

//lower cases everything
var lowerCase = function toLower(arr) {
  var newArr = _.map(arr, function(str) {
    return (str)? str.toLowerCase() : str;
  });
  return newArr;
};

/*********************************\
         Cytoscape Objects
\*********************************/

var CytoNode = function CytoNode(id, nodeInfo, expression, type) {
  var classList = [type];

  this.classes = classList.join(' ');
  this.data = {
    id : id,
    name : id,
    nodeInfo : nodeInfo,
    type : type,
    expression: expression
  };
  //STYLES
  this.data.style_node_color = 'grey'; //default grey
  this.data.style_node_shape = core.getNodeShape(this);
};

var CytoLink = function CytoLink(startNodeId, endNodeId, linkType) {

  var linkWidth = 1;

  var classList = [linkType];

  this.classes = classList.join(' ');
  this.data = {
    source : startNodeId,
    type : linkType,
    target : endNodeId
  };
  this.data.style_line_color = core.getLinkColor(this);
  this.data.style_line_width = core.getLinkWidth(this) || '3px';
};

/*********************************\
        Data Holding Objects
\*********************************/
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
