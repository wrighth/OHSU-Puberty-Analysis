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

var CytoNode = function CytoNode(id, nodeInfo, expression, type) {
  var classList = [type];

  this.classes = classList.join(' ');
  this.data = {
    id : id,
    name : id,
    nodeInfo : nodeInfo,
    type : type,
    expression: expression,
    color: processExpression(expression.ej)
  };
};

var CytoLink = function CytoLink(startNodeId, endNodeId, linkType) {
  var lineStyle, lineColor;
  switch(linkType) {
    case "genetic-interactions":
      lineStyle = 'dotted';
      lineColor = 'black';
    break;
    case "shared-protein-domains":
        lineStyle = 'dashed';
        lineColor = 'red';
    break;
    default:
        lineStyle = 'solid';
        lineColor = 'black';
    break;
  }

  var classList = [linkType];

  this.classes = classList.join(' ');
  this.data = {
    source : startNodeId,
    type : linkType,
    target : endNodeId,
    style_line_style: lineStyle,
    style_line_color: lineColor
  };
};

var randColor = function randColor(decimal) {
  var buffer = decimal - 0.5;

  var green = (buffer >= 0)? 255*Math.abs(buffer) : 0;
  var red = (buffer >= 0)? 0 : 255*Math.abs(buffer);

  return rgbToHex(red,green,0); //returns something between red and green
};

var processExpression = function processExpression(val, time, options) {
  time = (expData[time])? time : 'ej';

  var decimal = (val - expStats.min[time])/(expStats.max[time] - expStats.min[time]);
  console.log('\t'+val+' --> '+decimal);

  return randColor(decimal);
};
