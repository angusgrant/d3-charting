
  // Define margins
  const margin = {top: 20, right: 80, bottom: 30, left: 50},
  width = parseInt(d3.select("#chart").style("width")) - margin.left - margin.right,
  height = parseInt(d3.select("#chart").style("height")) - margin.top - margin.bottom;


// Define scales
const xScale = d3.scaleTime().range([0, width]);
const yScale = d3.scaleLinear().range([height, 0])
const zScale = d3.scaleOrdinal(d3.schemeCategory10);

// Define axes
const xAxis = d3.axisBottom(xScale);
const yAxis = d3.axisLeft(yScale);

 // Define lines
 const line = d3.line()
              .x(d => xScale(d.Year))
              .y(d => yScale(d.KPPPD))
              .curve(d3.curveLinear);



   // Define svg canvas
   const svg = d3.select("#chart")
               .attr("width", width + margin.left + margin.right)
               .attr("height", height + margin.top + margin.bottom)
               .append("g")
               .attr("transform", "translate(" + margin.left + "," + margin.top + ")");



d3.dsv(",", "diet-compositions-by-commodity-categories-fao-2017.csv", type, function(d) {
    //+ converts all strings into integers more efficient than parseInt
    return {
        Country : d.Entity,
        Year : new Date(+d.Year, 0, 1),
        Cereals_and_Grains_kpppd: +d["Cereals and Grains (FAO (2017)) (kilocalories per person per day)"],
        Pulses_kpppd: +d["Pulses (FAO (2017)) (kilocalories per person per day)"],
        Starchy_Roots_kpppd: +d["Starchy Roots (FAO (2017)) (kilocalories per person per day)"],
        Sugar_kpppd: +d["Sugar (FAO (2017)) (kilocalories per person per day)"],
        Oils_Fats_kpppd: +d["Oils & Fats (FAO (2017)) (kilocalories per person per day)"],
        Meat_kpppd: +d["Meat (FAO (2017)) (kilocalories per person per day)"],
        Dairy_Eggs_kpppd: +d["Dairy & Eggs (FAO (2017)) (kilocalories per person per day)"],
        Fruit_vegitables_kpppd: +d["Fruit and Vegetables (FAO (2017)) (kilocalories per person per day)"]
    };

        
  }).then((data) => {

    //  const result = data.filter(obj => {
    //      return obj.Country === "Afghanistan"
    //    });

    // nest data
         // Reformat data to make it more copasetic for d3
      // data = An array of objects
    // const nested_data = d3.nest()
    //   .key(d => d.Country)
    //   .entries(result);


    var commodities = data.columns.map(function(id) {
        return { 
              id: id, 
              values: data.map(function(d) {
                return { Country: d.Country, Year: d.Year, KPPPD: d[id]};
              }) 
        };
    });

    console.log(commodities);
  


        // Set the domain of the axes
    xScale.domain(d3.extent(data, d => d.Year ));
    yScale.domain(d3.extent(commodities, d => d.KPPPD));
    zScale.domain(commodities.map(function(c) {return c.id;}));

        // Place the axes on the chart
        svg.append("g")
          .attr("class", "x-axis")
          .attr("transform", "translate(0," + height + ")")
          .call(xAxis);

       svg.append("g")
          .attr("class", "y-axis")
          .call(yAxis)
      

    //now place the data on the chart 
    const kpppd = svg
      .selectAll(".kpppd")
      .data(commodities).enter()
      .append("g")
      .attr("class", "kpppd");

    kpppd.append("path")
      .attr("class", "line")
      .attr("d", d => line(d.values))
      .style("stroke", d => zScale(d.id));

    kpppd.append("text")
      .datum(function (d) { return { id: d.id, value: d.values[d.values.length - 1] }; })
      //.attr("transform", function (d) { return "translate(" + x(d.value.) + "," + y(d.value.temperature) + ")"; })
      .attr("x", 3)
      .attr("dy", "0.35em")
      .style("font", "10px sans-serif")
      .text(function (d) { return d.id; });


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

function type(d, _, columns) {
  d.date = parseTime(d.date);
  for (var i = 1, n = columns.length, c; i < n; ++i) d[c = columns[i]] = +d[c];
  return d;
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