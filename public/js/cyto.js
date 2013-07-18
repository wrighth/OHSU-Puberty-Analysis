var $$ = function(sel, el) {return (el || document).querySelector(sel)};
var msgBox = $$('#msg');
var geneInfoLink = 'http://www.ncbi.nlm.nih.gov/gene/';

var arborOptions = {
  name: 'arbor',
  liveUpdate: true, // whether to show the layout as it's running
  ready: undefined, // callback on layoutready 
  stop: undefined, // callback on layoutstop
  maxSimulationTime: 6000, // max length in ms to run the layout
  fit: true, // fit to viewport
  padding: [ 10, 10, 10, 10 ], // top, right, bottom, left
  ungrabifyWhileSimulating: false, // so you can't drag nodes during layout

  // forces used by arbor (use arbor default on undefined)
  repulsion: 1000,
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
          'background-color': 'data(color)'
        })
      .selector('edge')
        .css({
          'target-arrow-shape': 'none',
          'line-style': 'solid'
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
        })
      .selector('.shared-protein-domains')
        .css({
          'line-style': 'dashed',
          'line-color': 'red'
        })
      .selector('.genetic-interactions')
        .css({
          'line-style': 'dotted',
          'line-color': 'black'
        })
      .selector('.gene')
        .css({
          //'shape': 'triangle'
        }),
    
    elements: {
      nodes: cNodes,
      edges: cLinks
    },
    
    ready: function(){
      window.cy = this;
      cy.elements().unselectify();

      //click and touch events
      cy.on('tap', 'node', function(e){
        var node = e.cyTarget; 
        var neighborhood = node.neighborhood().add(node);
        var nodeInfo = rgdMap[node.id()]; //change this to use built in data
        
        msgBox.innerHTML = node.data('id') + ' : ' + node.data('name') + '\n';
        
        if(nodeInfo.human) {
          msgBox.innerHTML += "<a target='_blank' href='" + geneInfoLink + nodeInfo.human.entrezGeneId + "'>Additional Human Information</a><br>";
        }
        if(nodeInfo.rat) {
          msgBox.innerHTML += "<a target='_blank' href='" + geneInfoLink + nodeInfo.rat.entrezGeneId + "'>Additional Rat Information</a><br>";
        }
        if(nodeInfo.mouse) {
          msgBox.innerHTML += "<a target='_blank' href='" + geneInfoLink + nodeInfo.mouse.entrezGeneId + "'>Additional Mouse Information</a><br>";
        }

        cy.elements().addClass('faded');
        neighborhood.removeClass('faded');
      });
      
      cy.on('tap', function(e){
        if( e.cyTarget === cy ){
          cy.elements().removeClass('faded');
        }
      });

      cy.on('tap', 'edge', function(e) {
        var link = e.cyTarget;

        msgBox.innerText = link.data('source')+' =['+link.data('type')+']=>'+link.data('target');
      });
    },

    layout: arborOptions
  });
};

//RERENDERING
var renderBtn = $$('#redo');
renderBtn.addEventListener('click', function() {
  var allEles = cy.$('*');
  cy.remove(allEles);
  setTimeout(function() {cy.add(allEles);}, 3000);
});

//SEARCH FUNCTIONALITY
var search = $$('#search');
search.addEventListener('input', function() {
  var val = search.value;
  console.log(val);
  var el = cy.elements('node#'+val);
  if(el) {
    cy.center(el);
  }
});
