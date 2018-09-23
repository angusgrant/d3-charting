  //create ifi to shield variables from global scope.
(function(){

  // Define margins
  const margin = {top: 50, right: 100, bottom: 30, left: 50},
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
  

  // Define lines
  const lines = d3.line()
    .x(d => xScale(d.Year))
    .y(d => { return yScale(d.KPPPD)})
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
          {description: 'Cereals and Grains', kpppd: +d["Cereals and Grains (FAO (2017)) (kilocalories per person per day)"]},
          {description: 'Pulses', kpppd: +d["Pulses (FAO (2017)) (kilocalories per person per day)"]},
          {description: 'Starchy Roots', kpppd: +d["Starchy Roots (FAO (2017)) (kilocalories per person per day)"]},
          {description: 'Sugar', kpppd: +d["Sugar (FAO (2017)) (kilocalories per person per day)"]},
          {description: 'Oils Fats', kpppd: +d["Oils & Fats (FAO (2017)) (kilocalories per person per day)"]},
          {description: 'Meat', kpppd: +d["Meat (FAO (2017)) (kilocalories per person per day)"]},
          {description: 'Dairy Eggs', kpppd: +d["Dairy & Eggs (FAO (2017)) (kilocalories per person per day)"]},
          {description: 'Fruit vegitables', kpppd: +d["Fruit and Vegetables (FAO (2017)) (kilocalories per person per day)"]},
          {description: 'Other', kpppd: +d["Other(FAO (2017)) (kilocalories per person per day)"]},
          {description: 'Alcoholic Beverages', kpppd: +d["Alcoholic Beverages (FAO (2017)) (kilocalories per person per day)"]}
        ]
    };
    


        
  }).then( data => {
                  
                      // get list of countries
                      const uniqueCountry = [...new Set(data.map(a => a.Country))].sort();

                      

                      const select = d3.select("body")
                        .append("label")
                        .attr("class", "country-select-container")
                        .text("select a country: ")
                        .append("select");

                      select.selectAll("option")
                        .data(uniqueCountry)
                        .enter()
                          .append("option")
                          .text(d => d);

                      select.on("change", function(d) {
                         const country = d3.select(this)
                                           .property("value");
                      

                            drawLineGraph(data,country,true);
                      });

                      const country = uniqueCountry[0]; 

                      drawLineGraph(data,country,false);

                    });

function drawLineGraph(data,country,update){
      //filter the columns based on country.
      let result = data.filter(obj => {
        return obj.Country === country;
      });

      //add back in the columns property Obj that was filtered out we still want this.
      result = Object.assign(result, {
        columns: data.columns
      });

      // taking all the columns minus the first two (Country and Year) reorganise
      // the results to be key value pairs in this case
      let commodities = result.columns
        .slice(2).map((id, i) => {
          return {
            id: id,
            values: result.map(d => {
              return {
                Name: d.commodities[i].description,
                Year: d.Year,
                KPPPD:
                  +d.commodities[i].kpppd || 0 //convert NaN to 0.
              };
            })
          };
        });

   //now filter out empty data series we wont plot them. 
        commodities = commodities.filter(d => { return (d.values.reduce((a,b) => +a +b.KPPPD, 0) > 0 ? d : '')});


      // Set the domain of the axes
      xScale.domain(d3.extent(result, d => d.Year));

      yScale.domain([
      0,
        d3.max(commodities, c => d3.max(c.values, d => d.KPPPD)) //first get the max KPPPD value per row and then calculate per column.
      ]);

      
      svg.select(".x-axis").remove(); //this will vary so we should remove each time
      // Place the axes on the chart
      svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

      svg.append("text")
        .attr("transform", "rotate(-90)")
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