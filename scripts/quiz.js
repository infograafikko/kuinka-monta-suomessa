function callEverything(qID, right, yAnswer1, yAnswer2, yAnswer3, rAnswer1, rAnswer2, rAnswer3, source, pikscale, bufferwidth, bufferheight, xpad, pik) {

	//Database setup

	var childData = [];

    var query = firebase.database().ref(qID).orderByKey();
	query.once("value")
	  .then(function(snapshot) {
	    snapshot.forEach(function(childSnapshot) {
	      // childData will be the actual contents of the child
	      var childValue = childSnapshot.val();
	      childData.push(childValue);
 	 });
	});

	//SVG Setup
	var svg = d3.select("svg#" + qID),
	    margin = {right: 50, left: 50, top: 10, bottom: 150},
	    width = +svg.attr("width") - margin.left - margin.right,
	    height = +svg.attr("height") - margin.top - margin.bottom;

	var guessPos;
	var rightPos;
	var bins;

	var x = d3.scaleLinear()
	    .domain([0, 100])
	    .range([0, width])
	    .clamp(true);

	var slider = svg.append("g")
	    .attr("class", "slider")
	    .attr("transform", "translate(" + margin.left + "," + height / 4 + ")");

	var guessData = [50];

	slider.append("line")
	    .attr("class", "track")
	    .attr("x1", x.range()[0])
	    .attr("x2", x.range()[1])
	  .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
	    .attr("class", "track-inset")
	  .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
	    .attr("class", "track-overlay")
	    .call(d3.drag()
	        .on("start.interrupt", function() { slider.interrupt(); })
	        .on("drag", function() { hue(x.invert(d3.event.x)); }));

	slider.insert("g", ".track-overlay")
	    .attr("class", "ticks")
	    .attr("transform", "translate(0," + 18 + ")")
	  .selectAll("text")
	  .data(x.ticks(1))
	  .enter().append("text")
	    .attr("x", x)
	    .attr("text-anchor", "middle")
	    .text(function(d) { return d; })
	    .attr("font-family", "Merriweather Sans");

	var numberTextGuess = svg.append("text");    
	var numberTextRight = svg.append("text");    


	var handle = slider.insert("circle", ".track-overlay")
	    .attr("class", "handle")
	    .attr("r", 9);

slider.transition() // Gratuitous intro!
   .duration(0)
   .tween("hue", function() {
    var i = d3.interpolate(0, 50);
     return function(t) { hue(i(t)); };
   });

	// Pictogram setup

	function piktogram() {
    	//define an icon store it in svg <defs> elements as a reusable component - this geometry can be generated from Inkscape, Illustrator or similar
	    svg.append("defs")
	    	.append("g")
	    	.attr("transform", "scale("+pikscale+")")
	   		.attr("id","iconCustom#"+qID)
	        .append("path")
	        .attr("d",pik)

		//specify the number of columns and rows for pictogram layout
	    var numCols = 20;
	    var numRows = 5;

	    //padding for the grid
	    var xPadding = xpad;
	    var yPadding = 160;
	            
	    //horizontal and vertical spacing between the icons
	    var hBuffer = bufferheight;
	    var wBuffer = bufferwidth;

		//generate a d3 range for the total number of required elements
		var myIndex=d3.range(numCols*numRows);

	 	svg.append("g")
	        .attr("class","pictoLayer")
	        .selectAll("use")
	        .data(myIndex)
	        .enter()
	        .append("use")
	            .attr("xlink:href","#iconCustom#" + qID)
	            .attr("id",function(d)    {
	                return "icon"+d;
	            })
	            .attr("x",function(d) {
	                var remainder=d % numCols;//calculates the x position (column number) using modulus
	                return xPadding+(remainder*wBuffer);//apply the buffer and return value
	                })
	            .attr("y",function(d) {
	                var whole=Math.floor(d/numCols)//calculates the y position (row number)
	                return yPadding+(whole*hBuffer);//apply the buffer and return the value
	                })
	                .classed("iconPlain",true);

	    svg.append("g")
	        .attr("class","pictoLayer")
	        .selectAll("use")
	        .data(myIndex)
	        .enter()
	        .append("use")
	            .attr("xlink:href","#iconCustom#" + qID)
	            .attr("class",function(d)    {
	                return "icon"+d;
	            })
	            .attr("x",function(d) {
	                var remainder=d % numCols;//calculates the x position (column number) using modulus
	                return xPadding+(remainder*wBuffer);//apply the buffer and return value
	            })
	            .attr("y",function(d) {
	                var whole=Math.floor(d/numCols)//calculates the y position (row number)
	                return yPadding+(whole*hBuffer);//apply the buffer and return the value
	                })
	                .classed("iconPlain",true);

	    };

	piktogram();

	//button for saving results 

	var buttonGroup = svg.append("g")
		.attr("class", "buttonGroup")
		.on("click", function() { return getResults();} );

	var button = buttonGroup.append("rect")
		.attr("class", "button")
		.attr("x", margin.left)
		.attr("y", height*0.4)
		.attr("width", width)
		.attr("height", 30)
		.attr("fill", "#1F93FF")

	var buttonText = buttonGroup.append("text")
		.attr("class", "buttonText")
		.attr("pointer-events", "none")
		.attr("x", width/2 - 15)
		.attr("y", height*0.47)
		.text("Katso oikea vastaus")
		.attr("font-family", "Merriweather Sans")
		.attr("fill", "#fff")



	var compareLineGuess = svg.append("line")
		.attr("class", "compareLineGuess")

	var compareLineRight = svg.append("line")
		.attr("class", "compareLineRight")

	var circleRight = svg.append("circle")

		rightPos = x(right) + 50;


	function hue(h) {
	  handle.attr("cx", x(h));
	  guessData = Math.round(h);
	  guessPos = x(h);


	svg.selectAll("use").attr("class",function(d, i){
        if (d<guessData)  {
            return "iconSelected";
        } else {
            return "iconPlain";
        }
        });

	 update(guessPos);

	}

	function update(j) {
		numberTextGuess
			.attr("x", j + 50)
			.attr("y",height*0.12)
			.attr("text-anchor", "middle")
			.attr("font-family", "Merriweather Sans")
			.attr("font-size", "25px")
			.text(guessData);  
	}

	function getResults() {

		callHist();
		dissapear();
		addRightAnswer();
		legendKey();

		//Push data to database
		date = Date.now()
		firebaseRef.child(qID + "/" + date).set(guessData);


	}

	//make a histogram setup

	function callHist() {

		var formatPercent = d3.format(".0%");

		var g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")")
			.attr("class", "histogram");

		var xHist = d3.scaleLinear()
			.domain([0,100])
			.rangeRound([0, width])

		bins = d3.histogram()
			.domain(xHist.domain())
			.thresholds(xHist.ticks(20))
			(childData);

		var yHist = d3.scaleLinear()
			.domain([0, d3.max(bins, function(d) { return d.length; })])
			.range([height, height*0.3]);

		var pctHist = d3.scaleLinear()
			.domain([0, d3.max(bins, function(d) { return d.length / childData.length; })])
			.range([height, height*0.3]);

		var bar = g.selectAll(".bar")
		  .data(bins)
		  .enter().append("g")
		    .attr("class", "bar")
		    .attr("transform", function(d) { return "translate(" + xHist(d.x0) + "," + yHist(d.length) + ")"; });

		bar.append("rect")
		    .attr("x", 1)
		    .attr("width", xHist(bins[0].x1) - xHist(bins[0].x0) - 1)
		    .attr("height", function(d) { return height - yHist(d.length); })
		    .style("opacity", 0.67);

		//bar.append("text")
		//    .attr("dy", ".75em")
		//    .attr("y", 6)
		//    .attr("x", (xHist(bins[0].x1) - xHist(bins[0].x0)) / 2)
		//    .attr("text-anchor", "middle")
		//    .text(function(d) { return d.length; });


		g.append("g")
			.attr("class", "axisy")
			.call(d3.axisLeft(pctHist)
				.tickFormat(formatPercent)
				.ticks(3)
				.tickSizeInner([-width])
				.tickSizeOuter(0)
				)

		g.selectAll(".tick")
	    .each(function (d, i) {
	        if ( d == 0 ) {
	            this.remove();
	        }
	    });

	    g.append("g")
		    .attr("class", "axisx")
		    .attr("transform", "translate(0," + height + ")")
		    .call(d3.axisBottom(xHist))


		//Transition
		svg.selectAll(".histogram")
			.style("opacity", 0.0)
			.transition()
			.duration(300)
			.style("opacity", 1);

	}

	function addRightAnswer() {

		//Add right answer with the text and the line
		circleRight
			.attr("class", "circleRight")
			.attr("cx", rightPos)
			.attr("cy", height/4)
			.transition()
			.duration(300)
			.attr("r", 9)

		numberTextRight
			.attr("x", rightPos)
			.attr("y",height*0.12)
			.attr("text-anchor", "middle")
			.attr("font-family", "Merriweather Sans")
			.attr("font-size", "25px")
			.text(right);  

		compareLineRight
			.attr("x1", rightPos)
			.attr("y1", height/4)
			.attr("x2", rightPos)
			.attr("y2", height/4)
			.attr("stroke-width", 2)
			.style("stroke-dasharray", ("3,3"))
			.attr("stroke", "#FF4338")
			.transition()
			.duration(300)
			.attr("x2", rightPos)
			.attr("y2", height + margin.top);

		//Make comparison line visible
		compareLineGuess
			.attr("x1", guessPos + 50)
			.attr("y1", height/4)
			.attr("x2", guessPos + 50)
			.attr("y2", height/4)
			.attr("stroke-width", 2)
			.style("stroke-dasharray", ("3,3"))
			.attr("stroke", "#1F93FF")
			.transition()
			.duration(300)
			.attr("x2", guessPos + 50)
			.attr("y2", height+margin.top);

		};

	function dissapear() {

		//Make a things invisible
		svg.selectAll(".buttonGroup")
				.transition()
				.style("opacity", 0)
				.duration(300);

		svg.select(".track-inset")
			.transition()
			.style("opacity", 0)
			.duration(300);

		svg.select(".track-overlay")
			.transition()
			.style("visibility", "hidden")
			.duration(300);

		svg.select(".track")
			.transition()
			.style("visibility", "hidden")
			.duration(300);

		svg.select(".ticks")
			.transition()
			.style("opacity", 0)
			.duration(300);

		svg.select(".track-overlay")
			.on(".drag", null);

		svg.selectAll(".pictoLayer")
			.transition()
			.style("opacity", 0)
			.duration(450);

		
		};

	function legendKey() {

		//Vastauksesi

		svg.append("text")
			.attr("class", "iAmLegend")
			.attr("x", width* 0.13)
			.attr("y", height * 1.25)
			.text("Vastauksesi")
			.attr("font-family", "Merriweather Sans")

		svg.append("text")
			.attr("class", "explain-text")
			.attr("x", width* 0.13)
			.attr("y", height * 1.35)
			.text(yAnswer1 + guessData + yAnswer2)
			.attr("font-family", "Merriweather Sans")
			.attr("font-weight", "lighter")
			.attr("font-size", "15px")



		svg.append("text")
			.attr("class", "explain-text")
			.attr("x", width* 0.13)
			.attr("y", height * 1.42)
			.text(yAnswer3)
			.attr("font-family", "Merriweather Sans")
			.attr("font-weight", "lighter")
			.attr("font-size", "15px")


		svg.append("circle")
			.attr("class", "explain-text")
			.attr("cx", width * 0.1)
			.attr("cy", height * 1.23)
			.attr("r", 9)
			.style("fill", "#1F93FF");


		//Oikea vastaus

		svg.append("text")
			.attr("class", "iAmLegend")
			.attr("x", width*0.6)
			.attr("y", height * 1.25)
			.text("Oikea vastaus")
			.attr("font-family", "Merriweather Sans")

		svg.append("text")
			.attr("class", "explain-text")
			.attr("x",width*0.6)
			.attr("y", height * 1.35)
			.text(rAnswer1)
			.attr("font-family", "Merriweather Sans")
			.attr("font-weight", "lighter")
			.attr("font-size", "15px")

		svg.append("text")
			.attr("class", "explain-text")
			.attr("x",width*0.6)
			.attr("y", height * 1.42)
			.text(rAnswer2 + right + rAnswer3)
			.attr("font-family", "Merriweather Sans")
			.attr("font-weight", "lighter")
			.attr("font-size", "15px")

		svg.append("circle")
			.attr("class", "explain-text")
			.attr("cx", width*0.57)
			.attr("cy", height * 1.23)
			.attr("r", 9)
			.style("fill", "#FF4338");

		// Histogram text

		svg.append("text")
			.attr("class","explain-text")
			.attr("x", width*0.89)
			.attr("y", height*0.45)
			.text("Infograafikko.fi-lukijat")
			.attr("font-family", "Merriweather Sans")
			.attr("font-size", "10px")
			.attr("fill", "gray")

		//Source text

		svg.append("a")
			.attr("xlink:href", source)
			.attr("target", "_blank")
			.append("text")
			.attr("class", "source")
			.attr("x", width*0.13)
			.attr("y", height* 1.53)
			.text("Lähde")
			.attr("font-family", "Merriweather Sans")
			.attr("font-size", "15px")
			.attr("fill", "#1F93FF")

		//Text transition

		svg.selectAll(".explain-text")
			.style("opacity", 0)
			.transition()
			.duration(300)
			.style("opacity", 1);

		svg.selectAll(".iAmLegend")
			.style("opacity", 0)
			.transition()
			.duration(300)
			.style("opacity", 1);
	}
}