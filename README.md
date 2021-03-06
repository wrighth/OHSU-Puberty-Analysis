OHSU-Puberty-Analysis
=====================

Genetic network visualization analysis for the Puberty Project at the the Oregon Health Sciences University's West Campus (ONPRC - Oregon National Primate Research Center).
www.puberty.csee.ogi.edu/wordpress/

This sub-project will provide a web interface with which users can interact with experimentally confirmed and predicted data relevant to the study.


INPUT FORMAT For Value Files
============================
top row
the symbols of the times to display
[timePoint 1]_[timepoint 2]_[timePoint 3]...
ex. ej_lj_lp 

next few lines
[timePoint symbol]_[timePoint name]_info
ex. ej_Early Juvenile_info

rest of the document (majority)
[rgdSymbol]_[node type]_[value1]_[value2]_[value3]...
ex. A2M_GENE_123_456_789...


Features to Add
===============
Priorities
  1. color coding and styling for edges<br>
    a. hide/show edges based on type<br>
    b. heat map
  2. hierarchical/organic layouts
  3. hover windows?
  4. NEW USER INTERFACE
    a. timePoint Buttons (programmable number)<br>
    b. search bar<br>
    c. zoom control<br>
    d. expression controls<br>
      1. MIDPOINT CHANGER - slider<br>
      2. MIN/MAX - two buttons<br>
    e. gradient strip of colors - div<br>
    f. Layout saving Functionality
      1. saving<br>
      2. uploading<br>
      3. default layouts<br>
  5. New file format?

  search within network
  BETTER OBJECT CREATION - CREATE SCHEMA
  be able to save drafts
    Predefined/saved layouts
    local files for layouts
    uploadable
    Layout repo?

  database query
  Movie of optimization? (screen grab, talk to Hollis)

Need
  colors for each interaction type
  colors/chapes for central node
  standard layout for uploadables (x,y coords)
