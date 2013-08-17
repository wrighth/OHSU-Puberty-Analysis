var $$ = function(sel, el) {return (el || document).querySelector(sel)};
var $$$ = function(sel, el) {return (el || document).querySelectorAll(sel)};
var msgBox = $$('#msg');
var geneInfoLink = 'http://www.ncbi.nlm.nih.gov/gene/';

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
        var nodeInfo = rgdMap[node.id()]; //change this to use built in data
        
        msgBox.innerHTML = node.data('id') + "<span class='buffer'></span>";
        
        if(nodeInfo.human) {
          msgBox.innerHTML += "<a target='_blank' href='" + geneInfoLink + nodeInfo.human.entrezGeneId + "'>Additional Human Information</a><span class='buffer'>";
        }
        if(nodeInfo.rat) {
          msgBox.innerHTML += "<a target='_blank' href='" + geneInfoLink + nodeInfo.rat.entrezGeneId + "'>Additional Rat Information</a><span class='buffer'>";
        }
        if(nodeInfo.mouse) {
          msgBox.innerHTML += "<a target='_blank' href='" + geneInfoLink + nodeInfo.mouse.entrezGeneId + "'>Additional Mouse Information</a><span class='buffer'>";
        }

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

      var timePointsBox = $$('#timePoints');
      _.each(timePointMap, function(timePointInfo, symbol) {
        var newTimePointBtn = document.createElement('div');
        newTimePointBtn.classList.add('timePoint');
        newTimePointBtn.setAttribute('data-time', symbol);
        newTimePointBtn.innerText = timePointInfo.name;
        timePoints.appendChild(newTimePointBtn);
      });

      //make sure not to have a comment as the first child
      timePointsBox.firstChild.classList.add('timeSelect');

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
            console.log(timePoint);
            core.getNewColors(timePoint);
            console.log('got new colors');
          }
        });
      });
    },

    layout: arborOptions
  });
};

//SEARCH FUNCTIONALITY
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

  //clear results
  searchResults.removeClass('faded');
  cy.edges().addClass('faded');
  resultsToFade.addClass('faded');
});
