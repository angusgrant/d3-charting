  //create ifi to shield variables from global scope.
  (function () {

    'use strict';
  
  const viz = { 
    clearAll: () => {
      svg.selectAll("*").remove()
    }

};
  const t = d3.transition().duration(2500);
  
  //maintain point count bewtween chart draw.
  
  const dataPoints = (function () {
      let state; // Private Variable
      const pub = {};// public object - returned at end of module
      pub.changeCount = (newstate) => {
          state = newstate;
      };
      pub.getCount = () => {
          return state;
      }
      return pub; 
  }());
  
    // Define margins
    const margin = {top: 20, right: 100, bottom: 50, left: 50},
      width = parseInt(d3.select("#chart").style("width")) - margin.left - margin.right,
      height = parseInt(d3.select("#chart").style("height")) - margin.top - margin.bottom;
  
    // Define scales
    const xScale = d3.scaleTime().range([0, width]),
      yScale = d3.scaleLinear().range([height, 0]);
  
    // Define axes
    const xAxis = d3.axisBottom(xScale).ticks(d3.timeYear.every(1)),
      yAxis = d3.axisLeft(yScale).ticks(6),
      colours = d3.scaleOrdinal(d3.schemeSet2);

  //Define Stack
    const stack = d3.stack().order(d3.stackOrderReverse);

    //define graph area
    const area = d3.area()
      .x((d) => xScale(d.data.Year) )
      .y0((d) => yScale(d[0]) )
      .y1((d) => yScale(d[1]) );


  
    // Define lines
    const lines = d3.line()
      .x(d => xScale(d.Year))
      .y(d => { return yScale(d.KPPPD)})
      .curve(d3.curveLinear);

   // Define the div for the tooltip
  const div = d3.select("body").append("div")	
          .attr("class", "tooltip")				
          .style("opacity", 0);
    
     // Define svg canvas
   const svg = d3.select("#chart")
                 .attr("width", width + margin.left + margin.right)
                 .attr("height", height + margin.top + margin.bottom)
                 .append("g")
                 .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      // add the Y gridlines
      svg.append("g")			
        .attr("class", "grid")
        .call(d3.axisLeft(yScale).ticks(5)
          .tickSize(-width)
          .tickFormat("")
  )
  
  d3.dsv(",", "diet-compositions-by-commodity-categories-fao-2017.csv", (d) => {
      //+ converts all strings into integers more efficient than parseInt
      return {
          Country : d.Entity,
          Year : new Date(+d.Year, 0, 1),
          'Cereals and Grains': +d["Cereals and Grains (FAO (2017)) (kilocalories per person per day)"],
          'Pulses': +d["Pulses (FAO (2017)) (kilocalories per person per day)"],
          'Starchy Roots': +d["Starchy Roots (FAO (2017)) (kilocalories per person per day)"],
          'Sugar': +d["Sugar (FAO (2017)) (kilocalories per person per day)"],
          'Oils Fats': +d["Oils & Fats (FAO (2017)) (kilocalories per person per day)"],
          'Meat': +d["Meat (FAO (2017)) (kilocalories per person per day)"],
          'Dairy Eggs': +d["Dairy & Eggs (FAO (2017)) (kilocalories per person per day)"],
          'Fruit vegitables': +d["Fruit and Vegetables (FAO (2017)) (kilocalories per person per day)"],
          'Other': +d["Other (FAO (2017)) (kilocalories per person per day)"],
          'Alcoholic Beverages': +d["Alcoholic Beverages (FAO (2017)) (kilocalories per person per day)"]
      };   
    }).then( data => {
                    
                        // get list of countries
                        const uniqueCountry = [...new Set(data.map(a => a.Country))].sort();
                        //get country from local storage if it exists otherwise select the 1st entry.
                        let country = localStorage.getItem("country") ? localStorage.getItem("country") : uniqueCountry[7],
                            chart; 
  
                        const select = d3.select("body")
                          .append("label")
                          .attr("class", "country-select-container")
                          .text("select a country: ")
                          .append("select");
  
                        select.selectAll("option")
                          .data(uniqueCountry)
                          .enter()
                            .append("option")
                            .text(d => d)
                          .property("selected", d => d == country);

                        d3.select("#chart-type").on("change",function(d){ 
                            chart = d3.select(this)
                                    .property("value");

                            chart === 'line' ? svg.selectAll(".series").remove() : svg.selectAll(".commodities").remove();
                            chart === 'line' ? viz.drawLineGraph(data,country,true) : viz.drawAreaGraph(data,country,true);
                        });
  
                        select.on("change",function(d){
                            country = d3.select(this)
                                     .property("value");
                        
                            localStorage.setItem("country", country);
                            chart === 'line' ? viz.drawLineGraph(data,country,true) : viz.drawAreaGraph(data,country,true);
                        });
                       
                        //this is the default
                        viz.drawAreaGraph(data,country,false);
  
                      });
  
    viz.drawLineGraph = function(data, country, update) {

          //filter the columns based on country.
          let result = data.filter(obj => {
            return obj.Country === country;
          });
        
        //now use the columns we have renamed ourselves 
        const comm_keys = d3.keys(result[0]).slice(2);
  
        colours.domain(comm_keys);
        
          // taking all the columns minus the first two (Country and Year) reorganise
          // the results to be key value pairs in this case Year and KPPPD value
          let commodities = comm_keys.map((id) => {
            return {
              id: id,
              values: result.map(d => {
                return {Name: id, Year: d.Year,KPPPD: d[id]};
              })
            };
          });
          
        
          //now filter out empty data series we wont plot them.
          //   commodities = commodities.filter(d => { return (d.values.reduce((a,b) => +a +b.KPPPD, 0) > 0 ? d : '')});
        
          let dataPointVaryBool = false; //check to see if the number of data points per line has increased or decreased from previous chart rendered
          if (!dataPoints.getCount()) {
            dataPoints.changeCount(commodities[0].values.length); //store data point count on first load.
          } else {
            dataPointVaryBool = dataPoints.getCount() !== commodities[0].values.length;
            dataPointVaryBool
              ? dataPoints.changeCount(commodities[0].values.length)
              : "";
          }
          // Set the domain of the axes
          xScale.domain(d3.extent(result, d => d.Year));
        
          yScale.domain([
            0,
            d3.max(commodities, c => { return d3.max( c.values, d => d.KPPPD)}) //first get the max KPPPD value per row and then calculate per column.
          ]);
        
          if (!update) {
            svg.append("g")
              .attr("class", "x-axis")
              .attr("transform", "translate(0," + height + ")")
              .call(xAxis)
              .selectAll("text")	
              .style("text-anchor", "end")
              .attr("dx", "-.8em")
              .attr("dy", ".15em")
              .attr("transform", "rotate(-65)");
        
            svg.append("text")
              .attr("transform", "rotate(-90)")
              .attr("y", 10)
              .attr("x", -200)
              .attr("dy", "0.71em")
              .attr("fill", "#000")
              .style("font", "13px sans-serif")
              .text("kilocalories per person per day");
        
            svg.append("g")
              .attr("class", "y-axis")
              .call(yAxis)
              .selectAll("text")	
              .style("text-anchor", "end")
              .attr("dx", "-.8em")
              .attr("dy", ".15em")
              .attr("transform", "rotate(-65)");
          } else {
        
            svg.select(".x-axis")
              .transition(t)
              .call(xAxis)
              .selectAll("text")	
              .style("text-anchor", "end")
              .attr("dx", "-.8em")
              .attr("dy", ".15em")
              .attr("transform", "rotate(-65)");
        
            svg.select(".y-axis")
              .transition(t)
              .call(yAxis);
          }

      

          let line = svg.selectAll(".commodities");
          if (line.empty() || dataPointVaryBool) {
            if (dataPointVaryBool) {
              //remove all previous points / lines and re-render otherwise you might get a nasty mess.
              svg.selectAll(".commodities").remove();
            }
            line = svg.selectAll(".commodities")
               .data(commodities)
                  .enter()
                   .append("g")
                    .attr("class", "commodities");
        
            line.append("path")
              .attr("class", "line")
              .attr("d", d => lines(d.values))
              .style("stroke", d => colours(d.id));
        
            line.selectAll("circle")
              .data(d => d.values)
              .enter()
              .append("circle")
              .attr("class", "circle")
              .attr("r", 3)
              .attr("cx", d => xScale(d.Year))
              .attr("cy", d => yScale(d.KPPPD))
              .style("fill", d =>
                colours(
                  Object.assign(
                    ...commodities.map(obj => (obj.values[0].Name == d.Name ? obj : {}))
                  ).id
                )
              ).on("mouseover", function(d) {		

                d3.select(this).attr("r", 6)

                div.transition() 	
                    .duration(200)		
                    .style("opacity", .9)

                div.html(`Name: ${d.Name} <br /> Year: ${d.Year.getFullYear()} <br /> KPPPD: ${d.KPPPD}`)	
                    .style("left", (d3.event.pageX + 10) + "px")		
                    .style("top", (d3.event.pageY - 70) + "px");	
                })					
            .on("mouseout", function(d) {	
              
              d3.select(this).transition()		
              .duration(500)
              .attr("r", 3)

                div.transition()		
                    .duration(500)		
                    .style("opacity", 0)

             
            });
        
          } else {
           
              line = line.data(commodities);
        
            line.select(".line")
              .transition(t)
              .attr("d", d => lines(d.values));
        
            line.selectAll("circle")
              .data(d => d.values)
              .transition(t)
              .attr("cx", d => xScale(d.Year))
              .attr("cy", d => yScale(d.KPPPD))
            

                 //remove all existing text keys and reappend.
                 line.select(".textkey").remove();

          }
 
      
            line.append("text")
              .datum(d => {
                return {
                  id: d.values[d.values.length - 1].Name,
                  value: d.values[d.values.length - 1]
                };
              })
              .attr("transform", d => {
                return (
                  "translate(" +
                  xScale(d.value.Year) +
                  "," +
                  yScale(d.value.KPPPD) +
                  ")"
                );
              })
              .attr("x", 7)
              .attr("dy", "0.45em")
              .attr("class", "textkey")
              .style("font", "10px sans-serif")
              .text(d => d.id);
         
}; 
  
  viz.drawAreaGraph = (data, country, update) => {
//reset the point count so the chart always rerenders
    dataPoints.changeCount();
  
    //filter the columns based on country.
    let result = data.filter(obj => {
      return obj.Country === country;
    });


  //now use the columns we have renamed ourselves 
    const comm_keys = d3.keys(result[0]).slice(2);
  
    colours.domain(comm_keys);

    let commodities = comm_keys.map((id) => {
      return { name: id, values: result.map(d => {
          return { label: d.Year, value: d[id] };
        }) };
    });
  
    // Set the domain of the axes
    xScale.domain(d3.extent(result, d => d.Year));
  
    yScale.domain([
      0,
      d3.sum(commodities, c =>  d3.max(c.values, d => d.value)) 
    ]);
  
    stack.keys(comm_keys);

    if (!update) {
      svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .selectAll("text")	
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-65)");
    
      svg.append("g")
        .attr("class", "y-axis")
        .call(yAxis);
    } else {

      svg.select(".x-axis")
        .transition(t)
        .call(xAxis)
        .selectAll("text")	
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-65)");
  
      svg.select(".y-axis")
        .transition(t)
        .call(yAxis);
    }

   let selection = svg.selectAll(".series");
if (selection.empty()) {
  selection = selection.data(stack(result))
      .enter()
          .append("g")
          .attr("class", "series");
    
  
    selection.append("path")
      .attr("class", "streamPath")
      .style("fill", (d,i) => {return `url(#img${i+1})`;})
      .attr("d", area);

} else {
    selection = selection.data(stack(result));
  
  selection.select(".streamPath")
    .transition(t)
    .attr("d", area);

    selection.selectAll(".textkey").remove();
    svg.selectAll("x-axis-label").remove();

}
    
    selection.filter(d => d[d.length - 1][1] - d[d.length - 1][0] > 0.01)
      .append("text")
        .attr("class", "textkey") 
        .attr("x", width - 6)
        .attr("y",d => yScale((d[d.length - 1][0] + d[d.length - 1][1]) / 2))
        .attr("dy", "0.35em")
        .attr("dx", "1em")
        .style("font", "10px sans-serif")
        .text(d => d.key );


      svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("class", "x-axis-label")
      .attr("y", 10)
      .attr("x", -200)
      .attr("dy", "0.71em")
      .attr("fill", "#000")
      
      .style("font", "13px sans-serif")
      .text("kilocalories per person per day");
    
  
  }
  
  //Object { Entity: "Zimbabwe", Year: "2004", 
  //"Cereals and Grains (FAO (2017)) (kilocalories per person per day)": "1158", 
  //"Pulses (FAO (2017)) (kilocalories per person per day)": "46", 
  //"Starchy Roots (FAO (2017)) (kilocalories per person per day)": "49",
  //"Sugar (FAO (2017)) (kilocalories per person per day)": "250", 
  //"Oils & Fats (FAO (2017)) (kilocalories per person per day)": "317", 
  //"Meat (FAO (2017)) (kilocalories per person per day)": "82", 
  //"Dairy & Eggs (FAO (2017)) (kilocalories per person per day)": "51", 
  //"Fruit and Vegetables (FAO (2017)) (kilocalories per person per day)": "28", … }
  })();