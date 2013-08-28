var $$ = function(sel, el) {return (el || document).querySelector(sel)};
var $$$ = function(sel, el) {return (el || document).querySelectorAll(sel)};
var msgBox = $$('#msg');
var geneInfoLink = 'http://www.ncbi.nlm.nih.gov/gene/';
var sameNodeHover = {}; //saves state of indiv nodes when hover'd

var arborOptions = {
  name: 'arbor',
  liveUpdate: true, // whether to show the layout as it's running
  ready: undefined, // callback on layoutready 
  stop: undefined, // callback on layoutstop
  maxSimulationTime: 3000, // max length in ms to run the layout
  fit: true, // fit to viewport
  padding: [ 50, 50, 50, 50 ], // top, right, bottom, left
  ungrabifyWhileSimulating: false, // so you can't drag nodes during layout

  // forces used by arbor (use arbor default on undefined)
  repulsion: 400,
  stiffness: 200,
  friction: undefined,
  gravity: true,
  fps: undefined, 
  precision: undefined,

  // static numbers or functions that dynamically return what these
  // values should be for each element
  nodeMass: undefined, 
  edgeLength: 100,

  stepSize: 1, // size of timestep in simulation

  // function that returns true if the system is stable to indicate
  // that the layout can be stopped
  stableEnergy: function( energy ){
    var e = energy; 
    return (e.max <= 0.5) || (e.mean <= 0.3);
  }
};

var renderCyto = function renderCyto(cytoVar) {
  var cNodes = [],
  cLinks = [];

  _.each(cytoInfo.nodes, function(node) {
      cNodes.push({classes: node.classes,data: node.data});
  });

  _.each(cytoInfo.links, function(link) {
      cLinks.push({data: link.data});
  });

  //cytoscape options
  $('#cy').cytoscape({
    showOverlay: true,
    zoom: 3,
    minzoom: 1,
    maxzoom: 5,

    style: cytoscape.stylesheet()
      .selector('core')
        .css({
    'panning-cursor': 'crosshair' //what does this do?
        })
      .selector('node')
        .css({
          'content': 'data(name)',
          'text-valign': 'center',
          'color': 'white',
          'text-outline-width': 2,
          'text-outline-color': '#888',
          'background-color': 'data(style_node_color)',
          'shape': 'data(style_node_shape)'

        })
      .selector('edge')
        .css({
          'target-arrow-shape': 'none',
          'line-style': 'solid',
          'line-color': 'data(style_line_color)',
          'line-style': 'data(style_line_style)'
        })
      .selector(':selected')
        .css({
          'background-color': 'black',
          'line-color': 'black',
          'target-arrow-color': 'black',
          'source-arrow-color': 'black'
        })
      .selector('.faded')
        .css({
          'opacity': 0.25,
          'text-opacity': 0
        }),
    
    elements: {
      nodes: cNodes,
      edges: cLinks
    },
    
    ready: function(){
      window.cy = this;
      cy.elements().unselectify();
      core.getNewColors('ej'); //gets initial colors

      //click and touch events
      cy.on('tap', 'node', function(e){
        search.value = ''; //clear search box

        var node = e.cyTarget; 
        var neighborhood = node.neighborhood().add(node);

        cy.elements().addClass('faded');
        neighborhood.removeClass('faded');
      });
      
      cy.on('tap', function(e){
        if( e.cyTarget === cy ){
          cy.elements().removeClass('faded');
          search.value = '';
        }
      });

      cy.on('tap', 'edge', function(e) {
        var link = e.cyTarget;

        msgBox.innerText = link.data('source')+' =['+link.data('type')+']=>'+link.data('target');
      });

      renderTimeButtons();
      setUpSearchBar();
      setUpHoverLogic();

    },

    layout: arborOptions
  });
};

//SEARCH FUNCTIONALITY
var setUpSearchBar = function setUpSearchBar() {
  var search = $$('#search');
  search.addEventListener('input', function() {
    var searchVal = search.value;

    var resultsToFade = cy.filter(function(counter, ele) {
      //startsWith supported by mixin to Object.prototype
      if(!ele.id().startsWith(searchVal)) {
        return ele;
      }
    });
    var searchResults = cy.filter(function(counter, ele) {
      //startsWith supported by mixin to Object.prototype
      if(ele.id().startsWith(searchVal)) {
        return ele;
      }
    });

    searchResults.removeClass('faded');
    cy.edges().addClass('faded');
    resultsToFade.addClass('faded');
    if(searchVal == '') {
      cy.edges().removeClass('faded');
    }
  });
};

//dynamically renders buttons
var renderTimeButtons = function renderTimeButtons() {
  var timePointsBox = $$('#timePoints');
  _.each(timePointMap, function(timePointInfo, symbol) {
    var newTimePointBtn = document.createElement('div');
    newTimePointBtn.classList.add('timePoint');
    newTimePointBtn.setAttribute('data-time', symbol);
    newTimePointBtn.innerText = timePointInfo.name;
    timePoints.appendChild(newTimePointBtn);
  });    

  //adds timeSelect to the first one
  $$('.timePoint', timePointsBox).classList.add('timeSelect');

  //interactive styling for timepoint buttons
  //has to be here if timePoint will be abstracted
  var btns = $$$('.timePoint');
  _.each(btns, function(btn) {
    btn.addEventListener('click', function(event) {
      var target = event.target;
      //var expInfo = target.dataset.time;

      if(!target.classList.contains('timeSelect')) {

        //changing the color should be the last thing to do*/
        $$('.timeSelect').classList.remove('timeSelect');
        target.classList.add('timeSelect');

        var timePoint = target.dataset.time;
        core.getNewColors(timePoint);
      }
    });
  });    
};

var setUpHoverLogic = function setUpHoverLogic() {
  var hoverDiv = $$('#hoverDiv');

  hoverDiv.addEventListener('mouseover', function() {
    cy.off('mouseover', 'node', nodeHoverHandler);
  });

  hoverDiv.addEventListener('mouseout', function() {
    cy.on('mouseover', 'node', nodeHoverHandler);
  });

  cy.on('mouseover', 'node', nodeHoverHandler);

  cy.on('drag', 'node', function(e) {
    cy.off('mouseover', 'node', nodeHoverHandler);
    hoverDiv.classList.add('hide');
  });  

  cy.on('free', 'node', function(e) {
    cy.on('mouseover', 'node', nodeHoverHandler);
  });

  cy.on('mouseout', 'node', function(e) {
    var node = e.cyTarget;
    sameNodeHover[node.id()] = false;

    hoverController(2000);
  });

  $$('#close-hoverDiv').addEventListener('click', function(e) {
    hoverDiv.classList.add('hide');
  });
};

var nodeHoverHandler = function nodeHoverHandler(e) {
  var event = e.originalEvent;
  var node = e.cyTarget;
  sameNodeHover[node.id()] = true;
  //only gets the current node
  var fadedNode = cy.$("node.faded[id='"+node.id()+"']");

  setTimeout(function() {
    if(fadedNode.size() == 0 && sameNodeHover[node.id()]) {
      hoverDiv.style.top = (node.position('y'))+'px';
      var xOffset = 0.05*window.innerWidth; //cy is 90% min-width
      if(event.x < window.innerWidth/2)
        hoverDiv.style.left = node.position('x')+xOffset+20+'px';
      else {
        hoverDiv.style.left = node.position('x')-265+xOffset+'px';
      }

      updateHoverDivInfo(node);

      hoverDiv.classList.remove('hide');
    }
  }, 1500);
};

//updates text and links inside the hoverDiv
var updateHoverDivInfo = function updateHoverDivInfo(node) {
  var nodeInfo = node.data().nodeInfo;
  var hoverDiv = $$('#hoverDiv');

  $$('h3', hoverDiv).innerText = 'Node Information: '+node.id();
        
  var ncbiInfo = $$('#ncbi', hoverDiv);

  if(nodeInfo.human) {
    ncbiInfo.innerHTML = "<a target='blank' href='" + geneInfoLink + nodeInfo.human.entrezGeneId + "'>Additional Human Information</a><br>";
  }
  if(nodeInfo.rat) {
    ncbiInfo.innerHTML += "<a target='blank' href='" + geneInfoLink + nodeInfo.rat.entrezGeneId + "'>Additional Rat Information</a><br>";
  }
  if(nodeInfo.mouse) {
    ncbiInfo.innerHTML += "<a target='blank' href='" + geneInfoLink + nodeInfo.mouse.entrezGeneId + "'>Additional Mouse Information</a>";
  }

  //update node type
  $$('#nodeType', hoverDiv).innerText = node.data('type');

  //update our notes link

  //update blurb - maybe scrape form wordpress site

  var neighbors = document.createElement('ul');
  neighbors.id = 'neighbors';
  hoverDiv.replaceChild(neighbors, $$('#neighbors', hoverDiv));

  var neighborsHeader = document.createElement('h3');
  neighborsHeader.innerText = 'First Neighbors';

  neighbors.appendChild(neighborsHeader);

  //limit displayed neighbors to 5 and show high connections
  var neighborList = _.sortBy(node.neighborhood('node'), function(node) {
    return node.neighborhood('node').length; //sort by num of attached nodes
  });

  neighborList = neighborList.slice(0,5);

  _.each(neighborList, function(neighborNode) {
    var neighbor = document.createElement('li');
    neighbor.innerText = neighborNode.id();
    neighbors.appendChild(neighbor);
  });

  //graph
  var graphVals = {};
  var max = -Infinity;
  var min = Infinity;

  _.each(timePointMap, function(tp) {
    graphVals[tp.symbol] = tp.data[node.id()];
    min = (tp.data[node.id()] < min)? tp.data[node.id()]: min;
    max = (tp.data[node.id()] > max)? tp.data[node.id()]: max;
  });

  var range = max - min;

  $$('#bars').innerHTML = '';
  $$('#values').innerText = '';

  var containerWidth = 200 - 10;
  var barWidth = (containerWidth/Object.keys(graphVals).length)-15;
  //5px padding on each one

  _.each(graphVals, function(val, symbol) {
    var decimalSplit = (val.toString()).split('.');

    val -= min; //min becomes 0, max becomes range

    var height = 180;
    var bar = document.createElement('div');
    bar.classList.add('graph-bar');

    bar.style['min-height'] = height*(val/range) + 'px';
    bar.style['max-height'] = height*(val/range) + 'px';
    bar.style.width = barWidth + 'px';
    var p = document.createElement('p');

    if(decimalSplit[1])
      var printVal = decimalSplit[0]+"."+(decimalSplit[1]).slice(0,2)
    else
      var printVal = decimalSplit[0];

    p.innerText = symbol+': \n'+printVal.slice(0,5)+'\n'+printVal.slice(5);

    $$('#bars').appendChild(bar);
    $$('#values').appendChild(p);
  });
};

var hoverController = function hoverController(delay) {
  delay = delay || 1500;
  setTimeout(function() {
    if($$('#hoverDiv:hover')) {
      hoverController(delay);
    }
    else {
      hoverDiv.classList.add('hide');
    }
  }, 1000);
};

//LAYOUT CONTROLS
$$('#upload-layout').addEventListener('click', function uploadAndShowLayout() {
  cy.off('mouseover','node', nodeHoverHandler);
  $$('#cover-box').classList.remove('hide');
});

//called by the html on file change
var changeLayout = function changeLayout() {
  var upload = $$('input[type=file]')
  var reader = new FileReader();

  reader.addEventListener('load', function() {
    var xmlString = reader.result;
    var nodeArray = x2js.xml_str2json(xmlString).graph.node;

    var newPositions = {};
    var hiX = 0; 
    var loX = 0;
    var hiY = 0; 
    var loY = 0;

    _.each(nodeArray, function(node) {
      var x = parseInt(node.graphics._x);
      var y = parseInt(node.graphics._y);

      hiX = (x > hiX)? x : hiX;
      loX = (x < loX)? x : loX;
      hiY = (y > hiY)? y : hiY;
      loY = (y < loY)? y : loY;

      newPositions[node._label.toLowerCase()] = {x:x, y:y}
    });

    var rangeX = Math.abs(loX)+Math.abs(hiX);
    var rangeY = Math.abs(loY)+Math.abs(hiY);

    _.each(newPositions, function(pos) {
      pos.x -= loX; //lo's => 0
      pos.y -= loY;

      //hi's are now the range
      pos.x /= rangeX; //creates a decimal that i can use
      pos.y /= rangeY;
    });

    layout(newPositions); //re-render nodes
    $$('#cover-box').classList.add('hide');
    cy.on('mouseover','node', nodeHoverHandler);
  });

  reader.readAsText(upload.files[0]);
};

//close cover
$$('#close-coverBox').addEventListener('click', function(e) {
  $$('#cover-box').classList.add('hide');
  cy.on('mouseover','node', nodeHoverHandler);
});

var layout = function layout(data) {
  var screenW = 0.9*innerWidth; 
  var screenH = 0.65*innerHeight;
  _.each(data, function(pos, id) {
    cy.filter("node[id='"+id+"']")
      .position('x',pos.x*screenW)
      .position('y', pos.y*screenH)
  });
};
