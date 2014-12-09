// Set up SVG plot dimensions, margins
var margin = {top: 20, right: 20, bottom: 30, left: 40},
     width = 1000 - margin.left - margin.right
     height = 835 - margin.top - margin.bottom

// add the graph canvas to the body of the webpage
var brain = d3.select("#centerPanelBottom").append("svg")
    .attr("class","brain")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// add the tooltip area to the webpage!
var tooltip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

// Draw buttons and sliders just once
d3.csv("data/mds_nodes.csv", function(error, nodes) {

    // Network names
    var network_names = [];

    var color = d3.scale.category20();

    nodes.forEach(function(d) {
      network_names[d.network_id-1] = d.network
    })

    // For each network_names, append a button!
    d3.select("#centerPanelTop").append("div")
     .attr("class","btn-group arrActiviteit arrUpdate")
     .attr("data-toggle","buttons")
     .selectAll("button")
     .data(network_names).enter()
     .append("button")
       .style("position","relative")
       .style("white-space","normal")
       .style("width","71px")
       .style("height","90px")
       .style("color","black")
       .style("background-image",function(d){ 
          return "linear-gradient(to bottom, #FFF 0px, " + color(d) + " 100%)"})
       .style("font-size","10px")
       .attr("type","button")
       // When any button is clicked, we update visualizations
       .attr("onclick","update_connections()")
       .attr("class",function(d) { return "btn btn-default btn-xs " + d + " active" })
       .text(function(d){ return d })

});

// Call initial function to read data from csv
update_data()

// The entire thing is wrapped in a function to re-read the data
function update_data() {  
  data = d3.csv("data/mds_data.csv", function(data) {

  var networks = [];

  data.forEach(function(d) {
    d.x1 = +d.x1
    d.x2 = +d.x2
    d.y1 = +d.y1
    d.y2 = +d.y2
    d.z1 = +d.z1
    d.z2 = +d.z2
    d.network_id1 = +d.network_id1
    d.network_id2 = +d.network_id2
    d.corr = +d.corr
    d.mdsx1 = +d.mdsx1
    d.mdsy1 = +d.mdsy1
    d.mdsx2 = +d.mdsx2
    d.mdsy2 = +d.mdsy2
    networks.push(d.network1)
    // The network_pair id will correspond to network_pair
    // list, the groups in histogram down left side. "1,2"
    d.network_pair_id = [d.network_id1,d.network_id2].sort().join()
  })

  var minval = d3.min(data,function(d){ return d.corr })
  var maxval = d3.max(data,function(d){ return d.corr })

  networks = d3.set(networks)
  //network_pairs = []
  // Network pairs, based on numbers
  // TODO: read 14 from data, number of networks
  //for (i = 1; i <= 14; i++) {
  //  for (j = 1; j <= 14; j++) {
  //     network_pairs.push([i + "," + j])
  //  } 
  //}

 //d3.selectAll(".tooltip").remove()
  d3.selectAll("line.connection").remove()
  
  // Get the active buttons - the CHOSEN ONES
  chosen = []
  activebuttons = d3.selectAll("button.active")
    .each(function(button){ chosen.push(button); })
  
  // Filter data to THE CHOSEN ONES
  data = data.filter(function(d){ 
    if ($.inArray(d.network1, chosen) > -1 || $.inArray(d.network2, chosen) > -1) { return true }})

  // Make sure to only show what is selected
  if ( document.getElementById('show_negative').checked === true ) {
     d3.selectAll(".negative")        
    .attr("stroke-opacity",0.4);
  }
  else {
    d3.selectAll(".negative")        
    .attr("stroke-opacity",0);
  }

  if ( document.getElementById('show_positive').checked === true ) {
     d3.selectAll(".positive")        
    .attr("stroke-opacity",0.4);
  }
  else {
    d3.selectAll(".positive")        
    .attr("stroke-opacity",0);
  }

    
   // COLORING / LINE FUNCTIONS  
   var formatCount = d3.format(",.0f");
   var color = d3.scale.category20();

  // Will return an line thickness value that reflects the strength of the connection
  var strength = d3.scale.linear()
    .range([0, 3]) // or use hex values
    .domain([0.0, 0.8]);

  // X: We switch x and y so axial slide is hotdog orientation
  var xValue = function(d) { return d.mdsy;}, // data -> value
    xScale = d3.scale.linear().range([0, width-150]), // value -> display
    xMap = function(d) { return xScale(xValue(d));}, // data -> display
    xAxis = d3.svg.axis().scale(xScale).orient("bottom");

  // Y
  var yValue = function(d) { return d.mdsx;}, 
    yScale = d3.scale.linear().range([height, 0]), 
    yMap = function(d) { return yScale(yValue(d));}, 
    yAxis = d3.svg.axis().scale(yScale).orient("left");

  // We will color by the network
  var cValue = function(d) { return d.network;},
     color = d3.scale.category20();

  var brain = d3.selectAll("svg.brain")

  // load network nodes data
  d3.csv("data/mds_nodes.csv", function(error, nodes) {

    var network_names = [];

    nodes.forEach(function(d) {
      d.mdsx = +d.mdsx
      d.mdsy = +d.mdsy
      d.x = +d.x
      d.y = +d.y
      d.z = +d.z
      d.network_id = +d.network_id
      network_names[d.network_id-1] = d.network
    })

    // don't want dots overlapping axis, so add in buffer to data domain
    xScale.domain([d3.min(nodes, xValue)-1, d3.max(nodes, xValue)+1]);
    yScale.domain([d3.min(nodes, yValue)-1, d3.max(nodes, yValue)+1]);

    // x-axis
    brain.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      // The MDS coordinates don't add anything - remove them
      //.call(xAxis)
    .append("text")
      .attr("class", "label")
      .attr("y", -10)
      .attr("x",900)
      .style("text-anchor", "end")
      .text("Projection 1");

  // y-axis
  brain.append("g")
      .attr("class", "y axis")
      // The MDS coordinates don't add anything - remove them
      //.call(yAxis)
    .append("text")
      .attr("class", "label")
      .attr("transform", "rotate(-90)")
      .attr("y", -6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Projection 2");

   // Figure out threshold from slider
   var thresh =  +d3.selectAll(".thresh").text()
   
   // Figure out the direction
   var direction =  d3.selectAll(".dir").text()
   
   // Filter data
   selected = data.filter(function(d){
      if (direction == ">"){if (d.corr >= +thresh) { return true }}
      else {if (d.corr <= +thresh){ return true}}
   });

  // Update counts and stats
  d3.selectAll(".totalconn").text(selected.length)
  maxy = d3.max(selected,function(d){ return d.corr})
  minny = d3.min(selected,function(d){ return d.corr})
  meany = d3.mean(selected,function(d){ return d.corr})
  d3.selectAll("#maxy").text(maxy.toFixed(2))
  d3.selectAll("#minny").text(minny.toFixed(2))
  d3.selectAll("#meany").text(meany.toFixed(2))
  
  // Add initial brain connections
  d3.selectAll("svg.brain").append("g")
     .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
     .selectAll("line")
    .data(selected)
    .enter().append("line")
      .attr("class",function(d) {
         if (d.corr > 0) { return "connection positive " + d.network1 + " " + d.network2 }
         else { return "connection negative "  + d.network1 + " " + d.network2  }} )
      // We switch x and y so axial slide is hotdog orientation
      .attr("x1",function(d){ return xScale(d.mdsy1); })
      .attr("x2",function(d){ return xScale(d.mdsy2); })
      .attr("y1",function(d){ return yScale(d.mdsx1); })
      .attr("y2",function(d){ return yScale(d.mdsx2); })
      .attr("active",1)
      .attr("stroke-width",function(d) { return strength(Math.abs(d.corr)) })
      .attr("stroke-opacity", 0.3) 
      .style("stroke", function(d){ return color(d.network1) })
      .on("mouseover", function(d) {
          tooltip.transition()
               .duration(200)
               .style("opacity", .9);
          tooltip.html(d.corr)
               .style("left", (d3.event.pageX + 5) + "px")
               .style("top", (d3.event.pageY - 28) + "px");
      })     
      .on("mouseout", function(d) {
          tooltip.transition()
               .duration(500)
               .style("opacity", 0);
      });

  // draw dots
  brain.selectAll(".dot")
      .data(nodes)
    .enter().append("circle")
      .attr("class", "dot")
      .attr("r", 8)
      .attr("cx", xMap)
      .attr("cy", yMap)
     .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
      .style("fill", function(d) { return color(cValue(d));}) 
      .on("mouseover", function(d) {
          tooltip.transition()
               .duration(200)
               .style("opacity", .9);
          tooltip.html("<span style='background:white;'>" + d.network + "<br/> (" + d.x + "," + d.y + ", " + d.z + ") </span>")
               .style("left", (d3.event.pageX + 5) + "px")
               .style("top", (d3.event.pageY - 28) + "px");
      })
      .on("mouseover.image",function(d){
       // Add the image
         d3.select("#rightPanel")
           .selectAll("img")
           .attr("src", "img/" + d.image)

      })
     
      .on("mouseout", function(d) {
          tooltip.transition()
               .duration(500)
               .style("opacity", 0);
      });

    // draw legend
    var legend = brain.selectAll(".legend")
      .data(network_names)
    .enter().append("g")
      .attr("class", "legend")
      .attr("transform", function(d, i) { return "translate(100," + i * 20 + ")"; });

  // draw legend colored rectangles
  legend.append("rect")
      .attr("x", width - 140)
      .attr("width", 20)
      .attr("height", 20)
      .style("fill", function(d){ return color(d) })     

  // draw legend text
  legend.append("text")
      .attr("x", width-150)
      .attr("y", 9)
      .attr("dy", ".35em")
      .style("text-anchor", "end")
      .text(function(d) { return d })

     });
  });
} // close update_data


// FUNCTIONS OUTSIDE OF D3 --------------------------------------------

// Show positive connections
document.getElementById('show_positive').onchange = function() {
    if ( document.getElementById('show_positive').checked === true ) {
       d3.selectAll(".positive")        
      .attr("stroke-opacity",0.4);
    }
    else {
      d3.selectAll(".positive")        
      .attr("stroke-opacity",0);
    }
}

// Show negative connections
document.getElementById('show_negative').onchange = function() {
    
    if ( document.getElementById('show_negative').checked === true ) {
       d3.selectAll(".negative")        
      .attr("stroke-opacity",0.4);
    }
    else {
      d3.selectAll(".negative")        
      .attr("stroke-opacity",0);
    }
}

document.getElementById('up').onchange = function() {
  d3.selectAll(".dir").text(">")
  update_data()    
}

document.getElementById('down').onchange = function() {
  d3.selectAll(".dir").text("<")
  update_data()    
}


// Update data - basically reload
function update_connections(){
  update_data()
}

// Slider
d3.select('#slider')
    .call(d3.slider().axis(true).min(-1).max(1).value(0.65)
    .on("slide", function(evt, value) {
      d3.selectAll(".thresh").text(value.toFixed(2))
      update_data()
}));

d3.selectAll("svg.d3-slider-axis.d3-slider-axis-bottom").style("background","none")
