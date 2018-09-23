  //create ifi to shield variables from global scope.
(function(){

  // Define margins
  const margin = {top: 50, right: 80, bottom: 30, left: 50},
  width = parseInt(d3.select("#chart").style("width")) - margin.left - margin.right,
  height = parseInt(d3.select("#chart").style("height")) - margin.top - margin.bottom;


  // Define scales
  const xScale = d3.scaleTime().range([0, width]);
  const yScale = d3.scaleLinear().range([height, 0]);

  // Define axes
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale);

//const colours = ['#eca85f','#6b738b','#c58151','#cbccc3','#ddd459','#ee6869','pink','#4a8951'] 

  const colours = d3.scaleOrdinal(d3.schemeCategory10);
  const lines = [];

  // Define lines
  lines[0] = d3.line()
    .x(d => xScale(d.Year))
    .y(d => yScale(d.commodities[0].kpppd))
    .curve(d3.curveLinear);

    lines[1] = d3.line()
    .x(d => xScale(d.Year))
    .y(d => yScale(d.commodities[1].kpppd))
    .curve(d3.curveLinear);

    lines[2] = d3.line()
    .x(d => xScale(d.Year))
    .y(d => yScale(d.commodities[2].kpppd))
    .curve(d3.curveLinear);

    lines[3] = d3.line()
      .x(d => xScale(d.Year))
      .y(d => yScale(d.commodities[3].kpppd))
      .curve(d3.curveLinear);

    lines[4] = d3.line()
      .x(d => xScale(d.Year))
      .y(d => yScale(d.commodities[4].kpppd))
      .curve(d3.curveLinear);

    lines[5] = d3.line()
    .x(d => xScale(d.Year))
    .y(d => yScale(d.commodities[5].kpppd))
    .curve(d3.curveLinear);

    lines[6] = d3.line()
    .x(d => xScale(d.Year))
    .y(d => yScale(d.commodities[6].kpppd))
    .curve(d3.curveLinear);

    lines[7] = d3.line()
    .x(d => xScale(d.Year))
    .y(d => yScale(d.commodities[7].kpppd))
    .curve(d3.curveLinear);
  
  function tweenDash() {
      const l = this.getTotalLength(),
          i = d3.interpolateString("0," + l, l + "," + l);
      return function (t) {
          return i(t);
      };
  }
  
  function transition(path) {
      path.transition()
          .duration(2000)
          .attrTween("stroke-dasharray", tweenDash);
  }

   // Define svg canvas
   const svg = d3.select("#chart")
               .attr("width", width + margin.left + margin.right)
               .attr("height", height + margin.top + margin.bottom)
               .append("g")
               .attr("transform", "translate(" + margin.left + "," + margin.top + ")");



d3.dsv(",", "diet-compositions-by-commodity-categories-fao-2017.csv", function(d) {
    //+ converts all strings into integers more efficient than parseInt
    return {
        Country : d.Entity,
        Year : new Date(+d.Year, 0, 1),
        commodities : [
          {description: 'Cereals_and_Grains', kpppd: +d["Cereals and Grains (FAO (2017)) (kilocalories per person per day)"]},
          {description: 'Pulses', kpppd: +d["Pulses (FAO (2017)) (kilocalories per person per day)"]},
          {description: 'Starchy_Roots', kpppd: +d["Starchy Roots (FAO (2017)) (kilocalories per person per day)"]},
          {description: 'Sugar', kpppd: +d["Sugar (FAO (2017)) (kilocalories per person per day)"]},
          {description: 'Oils_Fats', kpppd: +d["Oils & Fats (FAO (2017)) (kilocalories per person per day)"]},
          {description: 'Meat', kpppd: +d["Meat (FAO (2017)) (kilocalories per person per day)"]},
          {description: 'Dairy_Eggs', kpppd: +d["Dairy & Eggs (FAO (2017)) (kilocalories per person per day)"]},
          {description: 'Fruit_vegitables', kpppd: +d["Fruit and Vegetables (FAO (2017)) (kilocalories per person per day)"]}
        ]
    };
    


        
  }).then((data) => {

     const result = data.filter(obj => {
         return obj.Country === "United Kingdom"
       });

    var commodities = data.columns.slice(2).map(function(id) {
      return { id: id, values: data.map(function(d) {
        return { Country: d.Country, Year: d.Year, KPPPD: d[id] };
        }) };
    });
    console.log(commodities.map(function (c) { return c.values; })); 

      // Reformat data to make it more copasetic for d3
      // data = An array of objects
      // nest data
      const nested_data = d3.nest()
                        .key(d => d.Country)
                        .entries(result);
   
        // Set the domain of the axes
        xScale.domain(d3.extent(result, d => d.Year ));

         yScale.domain([0, d3.max(result, (d) => {
             return  Math.max(...d.commodities.map(o => o.kpppd));
         })]);


   

        // Place the axes on the chart
        svg.append("g")
          .attr("class", "x-axis")
          .attr("transform", "translate(0," + height + ")")
          .call(xAxis);

       svg.append("g")
          .attr("class", "y-axis")
          .call(yAxis)
      
let descriptions = [];
let coloursArray = [];
    for (var i in result[0].commodities) {
      //now place the data on the chart 
      coloursArray[i] = colours(i);
      descriptions[i] = result[0].commodities[i].description;
      const line = svg.selectAll(result[0].commodities[i].description)
        .data(nested_data)
        .enter()
          .append("g")
          .attr("class", result[0].commodities[i].description);

      line.append("path")
        .attr("class", "line")
        .attr("d", d => {
                    return lines[i](d.values); 
                  })
        .attr("data-legend", result[0].commodities[i].description)
        .attr("title", result[0].commodities[i].description)
        .style("stroke", colours(i))
        .call(transition);

      // var points = svg
      //   .selectAll(".point")
      //   .data(nested_data)
      //     .enter()
      //     .append("svg:circle")
      //     .attr("stroke", "black")
      //     .attr("fill", function(d) {
      //       return "black";
      //     })
      //   .attr("cx", function(d) {
      //     return xScale(d.values.Year);
      //   })
      //   .attr("cy", function(d) {
      //     return yScale(d.values.commodities[i].kpppd);
      //   })
      //   .attr("r", function(d) {
      //     return 4;
      //   });
    }



   
      // get list of countries
    const uniqueCountry = [...new Set(data.map(item => item.Country))].sort();

    const select = d3.select("body")
    .append("label")
    .attr('class','country-select-container')
    .text('select a country: ')
    .append("select")

     select.selectAll("option")
     .data(uniqueCountry)
     .enter()
       .append("option")
       .text(d => d)

       const ordinal = d3.scaleOrdinal()
         .domain(descriptions)
         .range(coloursArray);


       svg.append("g")
       .attr("class", "legendOrdinal")
       .attr("transform", "translate(20,20)");
   
       const legendOrdinal = d3.legendColor()
   
       .shape("path", d3.symbol().type(d3.symbolCircle).size(70)())
       .shapePadding(10)
       //use cellFilter to hide the "e" cell
       .cellFilter(function(d){ return d.label !== "e" })
       .scale(ordinal);
   
       svg.select(".legendOrdinal")
       .call(legendOrdinal);           


       select
       .on("change", function(d) {
         const value = d3.select(this).property("value");
              
       });
  });



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