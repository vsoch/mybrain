// Get variables from the URL
function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value.replace("/","");
    });
    return vars;
}

//Get json name from the browser url
var url_data = getUrlVars()

var xmin = -1;

// If the user wants to see absolute value of data
if (url_data["abs"] == 1){ var xmin= 0; };

// Read in data from csv
data = d3.csv("data/corr_meandatamds.csv", function(data) {
  
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
  })
  
  // HISTOGRAM ------------------------------------------------------
  var formatCount = d3.format(",.0f");

  var margin = {top: 10, right: 30, bottom: 30, left: 30},
      width = 1100 - margin.left - margin.right,
      height = 150 - margin.top - margin.bottom;

  var x = d3.scale.linear()
      .domain([xmin, 1])
      .range([0, width]);

  // Fill in stats to reflect initial selection
  update_connections([.6,.65]);

  // Generate a histogram using twenty uniformly-spaced bins.
  var histogram = d3.layout.histogram()
      .bins(x.ticks(20))
      .value(function(d) {
        if (xmin == 0) { return Math.abs(d.corr);}
        else { return d.corr;}
      })
      (data)

  var y = d3.scale.linear()
      .domain([0, d3.max(histogram, function(d) { return d.y; })])
      .range([height, 0]);

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

  var svg = d3.select("container").append("svg")
      .attr("class","histogram")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

   function getTitle() {
     if (xmin==-1) { return "Functional Correlations" }
     else { return "Absolute Value of Functional Correlations"}
   }

     svg.append("svg:text")
           .attr("class", "title")
           .attr("dy","10em")
           .attr("x", 700)
	   .attr("y", -80)
	   .text(getTitle());


  var bar = svg.selectAll(".bar")
      .data(histogram)
    .enter().append("g")
      .attr("class", "bar")
      .attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; });

  bar.append("rect")
      .attr("x", 2)
      .attr("width", x(histogram[0].x + histogram[0].dx) - 1)
      .attr("height", function(d) { return height - y(d.y); });

  bar.append("text")
      .attr("dy", ".75em")
      .attr("y", -10)
      .attr("x", x(histogram[0].x + histogram[0].dx) / 2)
      .attr("text-anchor", "middle")
      .style("fill","black")
      .text(function(d) { return formatCount(d.y); });

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height  + ")")
      .call(xAxis);


  // BRUSHING -------------------------------------------------------------------
  var color = d3.scale.category20();
  console.log(color);
  var brush = d3.svg.brush()
    .x(x)
    // This is how we do a custom "extent"
    .extent([.6, .65])
    .on("brushstart", brushstart)
    .on("brush", brushmove)
    .on("brushend", brushend);

  var arc = d3.svg.arc()
    .outerRadius(5)
    .startAngle(0)
    .endAngle(function(d, i) { return i ? -Math.PI : Math.PI; });

  var brushg = svg.append("g")
      .attr("class", "brush")
      .call(brush);

  brushg.selectAll(".resize").append("path")
    .attr("transform", "translate(0," +  height / 2 + ")")
    .attr("d", arc);

  brushg.selectAll("rect")
      .attr("height", height);

  brushstart();
  brushmove();

  function brushstart() {
    svg.classed("selecting", true);
  }

  function brushmove() {
    var s = brush.extent();

    // Here we need to run a function to change visual for "stats"
    update_connections(s);    

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


    bar.classed("selected", function(d) { 
       return s[0] <= d.corr && d.corr <= s[1]; });
  }

  function brushend() {
    svg.classed("selecting", !d3.event.target.empty());
  }

  // COLORING / LINE FUNCTIONS -------------------------------------------------------

  // Will return an line thickness value that reflects the strength of the connection
  var strength = d3.scale.linear()
    .range([0, 3]) // or use hex values
    .domain([0.0, 0.8]);

  // SUMMARY STATS -------------------------------------------------------------------

  function update_connections(s){

    // Select data that is in range of s
    var lower = +s[0];
    var upper = +s[1];

    // Remove old connections
    d3.selectAll("line.connection").remove()

    // Select new connections
    filtered = data.filter(function(d) { if(d.corr >= lower && d.corr <= upper) {return true;}});    

    d3.selectAll("svg.brain").append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
      .selectAll("line")
    .data(filtered)
    .enter().append("line")
      .attr("class",function(d) {
         if (d.corr > 0) { return "connection positive " + d.network1 + " " + d.network2 }
         else { return "connection negative "  + d.network1 + " " + d.network2 }} )
      .attr("x1",function(d){ return xScale(d.mdsx1); })
      .attr("x2",function(d){ return xScale(d.mdsx2); })
      .attr("y1",function(d){ return yScale(d.mdsy1); })
      .attr("y2",function(d){ return yScale(d.mdsy2); })
      .attr("active",1)
      .attr("stroke-width",function(d) { return strength(Math.abs(d.corr)) })
      .attr("stroke-opacity", 0.3) 
      .style("stroke", function(d){ return color(d.network1); })
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

    meany = d3.mean(filtered,function(d) { 
        if (xmin == 0) { return Math.abs(d.corr);}
        else { return d.corr;}
    });
    maxy = d3.max(filtered,function(d) { 
        if (xmin == 0) { return Math.abs(d.corr);}
        else { return d.corr;}
    });
    minny = d3.min(filtered,function(d) { 
        if (xmin == 0) { return Math.abs(d.corr);}
        else { return d.corr;}
     });
    d3.select("#meany").text(meany.toFixed(3));
    d3.select("#maxy").text(maxy.toFixed(3));
    d3.select("#minny").text(minny.toFixed(3));
  }

  // Brain scatter plot

  var margin = {top: 20, right: 20, bottom: 30, left: 40},
     width = 1000 - margin.left - margin.right,
     height = 800 - margin.top - margin.bottom;

  // setup x 
  var xValue = function(d) { return d.mdsx;}, // data -> value
    xScale = d3.scale.linear().range([0, width]), // value -> display
    xMap = function(d) { return xScale(xValue(d));}, // data -> display
    xAxis = d3.svg.axis().scale(xScale).orient("bottom");

  // setup y
  var yValue = function(d) { return d.mdsy;}, // data -> value
    yScale = d3.scale.linear().range([height, 0]), // value -> display
    yMap = function(d) { return yScale(yValue(d));}, // data -> display
    yAxis = d3.svg.axis().scale(yScale).orient("left");

  // We will color by the network
  var cValue = function(d) { return d.network;},
     color = d3.scale.category20();

  // add the graph canvas to the body of the webpage
  var brain = d3.select("container").append("svg")
    .attr("class","brain")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // add the tooltip area to the webpage!
  var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

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

    console.log(network_names);

    // don't want dots overlapping axis, so add in buffer to data domain
    xScale.domain([d3.min(nodes, xValue)-1, d3.max(nodes, xValue)+1]);
    yScale.domain([d3.min(nodes, yValue)-1, d3.max(nodes, yValue)+1]);

    // x-axis
    brain.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
    .append("text")
      .attr("class", "label")
      .attr("x", width)
      .attr("y", -6)
      .style("text-anchor", "end")
      .text("Projection 1");

  // y-axis
  brain.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("class", "label")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Projection 2");

  // Draw initial connections between points
  selected = data.filter(function(d){
    if ( d.corr >= .6 && d.corr <= .65) {return true;}   
  });
  
  // Add initial brain connections
  d3.selectAll("svg.brain").append("g")
     .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
     .selectAll("line")
    .data(selected)
    .enter().append("line")
      .attr("class",function(d) {
         if (d.corr > 0) { return "connection positive " + d.network1 + " " + d.network2 }
         else { return "connection negative "  + d.network1 + " " + d.network2  }} )
      .attr("x1",function(d){ return xScale(d.mdsx1); })
      .attr("x2",function(d){ return xScale(d.mdsx2); })
      .attr("y1",function(d){ return yScale(d.mdsy1); })
      .attr("y2",function(d){ return yScale(d.mdsy2); })
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

            // Add the xyz coordinates
            //d3.select("#x").text(d.x.toFixed(2))
            //d3.select("#y").text(d.y.toFixed(2))
            //d3.select("#z").text(d.z.toFixed(2))
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
      .attr("transform", function(d, i) { return "translate(100," + i * 16 + ")"; });

  // draw legend colored rectangles
  legend.append("rect")
      .attr("x", width - 18)
      .attr("width", 18)
      .attr("height", 18)
      // on click, show or hide the network connections
      .on("click", function(d){
        network_nodes = d3.selectAll("." + d)
        active_test = d3.selectAll("." + d).attr("active")
        if (active_test == 1){
          network_nodes.attr("stroke-opacity",0)
          network_nodes.attr("active",0)
          d3.select(this).style("fill","white")
        } else {
          network_nodes.attr("stroke-opacity",0.4)
          network_nodes.attr("active",1)
          d3.select(this).style("fill",color(d))
        }
       })
      .style("fill", function(d){ return color(d) })
     

  // draw legend text
  legend.append("text")
      .attr("x", width - 24)
      .attr("y", 9)
      .attr("dy", ".35em")
      .style("text-anchor", "end")
      .text(function(d) { return d })

     });
});

// Functions outside of d3
  function absValue(){
    if (xmin==0) { window.location.replace('http://www.vbmis.com/bmi/project/mybrain') }
    else { window.location.replace('http://www.vbmis.com/bmi/project/mybrain?abs=1') }
  }


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


