
  // Define margins
  const margin = {top: 20, right: 80, bottom: 30, left: 50},
  width = parseInt(d3.select("#chart").style("width")) - margin.left - margin.right,
  height = parseInt(d3.select("#chart").style("height")) - margin.top - margin.bottom;


// Define scales
const xScale = d3.scaleTime().range([0, width]);
const yScale = d3.scaleLinear().range([height, 0]);

// Define axes
const xAxis = d3.axisBottom(xScale);
const yAxis = d3.axisLeft(yScale);

 // Define lines
 const line1 = d3.line()
       .x(d => xScale(d.Year))
       .y(d => yScale(d.commodities[0].kpppd))
        .curve(d3.curveLinear);

const line2 = d3.line()
  .x(d => xScale(d.Year))
  .y(d => yScale(d.commodities[1].kpppd))
  .curve(d3.curveLinear);

const line3 = d3.line()
  .x(d => xScale(d.Year))
  .y(d => yScale(d.commodities[2].kpppd))
  .curve(d3.curveLinear);

const line4 = d3.line()
  .x(d => xScale(d.Year))
  .y(d => yScale(d.commodities[3].kpppd))
  .curve(d3.curveLinear);

const line5 = d3.line()
  .x(d => xScale(d.Year))
  .y(d => yScale(d.commodities[4].kpppd))
  .curve(d3.curveLinear);

const line6 = d3.line()
  .x(d => xScale(d.Year))
  .y(d => yScale(d.commodities[5].kpppd))
  .curve(d3.curveLinear);

const line7 = d3.line()
  .x(d => xScale(d.Year))
  .y(d => yScale(d.commodities[6].kpppd))
  .curve(d3.curveLinear);

const line8 = d3.line()
  .x(d => xScale(d.Year))
  .y(d => yScale(d.commodities[7].kpppd))
  .curve(d3.curveLinear);

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
         return obj.Country === "Afghanistan"
       });



      // Reformat data to make it more copasetic for d3
      // data = An array of objects

      // nest data
      const nested_data = d3.nest()
                        .key(d => d.Country)
                        .entries(result);

 
   
        // Set the domain of the axes
        xScale.domain(d3.extent(data, d => d.Year ));

    yScale.domain(d3.extent(data, d => { return d3.merge(d.commodities[0].kpppd, d.commodities[1].kpppd)}));

        // Place the axes on the chart
        svg.append("g")
          .attr("class", "x-axis")
          .attr("transform", "translate(0," + height + ")")
          .call(xAxis);

       svg.append("g")
          .attr("class", "y-axis")
          .call(yAxis)
      
    console.log(result[0].commodities.length);


    //now place the data on the chart 
    const cereals = svg.selectAll(".cereals")
      .data(nested_data)
      .enter()
      .append("g")
      .attr("class", "cereals");

    cereals.append("path")
      .attr("class", "line")
      .attr("d", d => line1(d.values))
      .style("stroke", '#e0b27f');


      //now place the data on the chart 
      const  pulses = svg.selectAll(".pulses")
      .data(nested_data)
      .enter()
        .append("g")
        .attr("class", "pulses");

        pulses.append("path")
          .attr("class", "line")
          .attr("d", d => line2(d.values))
          .style("stroke", 'blue');

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
       .text(d => d);

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