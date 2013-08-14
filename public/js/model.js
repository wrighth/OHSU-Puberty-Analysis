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
    'predicted-protein-interactions': 'dashed'
  };
};

Core.prototype.getNodeShape = function getNodeShape(node) {
  return this.nodeShapeMap[node.data.type] || 'octagon';
};

Core.prototype.getLinkColor = function getLinkColor(link) {
  return this.linkColorMap[link.data.type] || 'black';
};

Core.prototype.getLinkWeightRatio = function getLinkWeight(link) {
  return this.linkWeightMap[link.data.type];    //default weight
};

Core.prototype.getNodeColor = function getNodeColor(node) {
  console.log(node);
  return processExpression(node.data.expression.ej, 'ej');
};

var core = new Core();

//lower cases everything
var lowerCase = function toLower(arr) {
  var newArr = _.map(arr, function(str) {
    return (str)? str.toLowerCase() : str;
  });
  return newArr;
};

//converts RGB to hexadecimal
var rgbToHex = function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

var CytoNode = function CytoNode(id, nodeInfo, expression, type) {
  var classList = [type];

  console.log(id, expression);
  this.classes = classList.join(' ');
  this.data = {
    id : id,
    name : id,
    nodeInfo : nodeInfo,
    type : type,
    expression: expression
  };
  //STYLES
  this.data.style_node_color = core.getNodeColor(this);
  this.data.style_node_shape = core.getNodeShape(this);
};

var CytoLink = function CytoLink(startNodeId, endNodeId, linkType) {

  var linkWeight = 1;

  var classList = [linkType];

  this.classes = classList.join(' ');
  this.data = {
    source : startNodeId,
    type : linkType,
    target : endNodeId
  };
  this.data.style_line_color = core.getLinkColor(this);
  this.data.style_line_weight = (core.getLinkWeightRatio(this))? core.getLinkWeightRatio*linkWeight : linkWeight;
};

var randColor = function randColor(decimal) {
  var buffer = decimal - 0.5;

  var green = (buffer >= 0)? 255*Math.abs(buffer) : 0;
  var red = (buffer >= 0)? 0 : 255*Math.abs(buffer);

  return rgbToHex(red,green,0); //returns something between red and green
};

var processExpression = function processExpression(val, time, options) {
  //time = (expData[time])? time : 'ej';

  var decimal = (val - expStats.min[time])/(expStats.max[time] - expStats.min[time]);

  return randColor(decimal);
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
