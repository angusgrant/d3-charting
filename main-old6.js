  //create ifi to shield variables from global scope.
  (function(){

    'use strict';
  
  const viz = {};
  
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
    const margin = {top: 50, right: 100, bottom: 30, left: 50},
      width = parseInt(d3.select("#chart").style("width")) - margin.left - margin.right,
      height = parseInt(d3.select("#chart").style("height")) - margin.top - margin.bottom;
  
    // Define scales
    const xScale = d3.scaleTime().range([0, width]),
      yScale = d3.scaleLinear().range([height, 0]);
  
    // Define axes
    const xAxis = d3.axisBottom(xScale),
      yAxis = d3.axisLeft(yScale),
      colours = d3.scaleOrdinal(d3.schemeCategory10);
  
    const stack = d3.stack();
  
    const area = d3.area()
      .x(function (d) { return xScale(d.label); })
      .y0(function (d) { return yScale(d.y0); })
      .y1(function (d) { return yScale(d.y0 + d.y); });
  
    // Define lines
    const lines = d3.line()
      .x(d => xScale(d.Year))
      .y(d => { return yScale(d.KPPPD)})
      .curve(d3.curveLinear);
    
     // Define svg canvas
   const svg = d3.select("#chart")
                 .attr("width", width + margin.left + margin.right)
                 .attr("height", height + margin.top + margin.bottom)
                 .append("g")
                 .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  
  d3.dsv(",", "diet-compositions-by-commodity-categories-fao-2017.csv", (d) => {
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
            {description: 'Other', kpppd: +d["Other (FAO (2017)) (kilocalories per person per day)"]},
            {description: 'Alcoholic Beverages', kpppd: +d["Alcoholic Beverages (FAO (2017)) (kilocalories per person per day)"]}
          ]
      };
          
    }).then( data => {
                    
                        // get list of countries
                        const uniqueCountry = [...new Set(data.map(a => a.Country))].sort();
                        //get country from local storage if it exists otherwise select the 1st entry.
                        let country = localStorage.getItem("country") ? localStorage.getItem("country") : uniqueCountry[0]; 
  
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
  
                        select.on("change", function(d) {
                            country = d3.select(this)
                                             .property("value");
                        
                            localStorage.setItem("country", country);
                          viz.drawLineGraph(data,country,true);
                        });
  
                        viz.drawLineGraph(data,country,false);
  
                      });
  
  viz.drawLineGraph = function(data, country, update) {
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
    let commodities = result.columns.slice(2).map((id, i) => {
      return {
        id: id,
        values: result.map(d => {
          return {
            Name: d.commodities[i].description,
            Year: d.Year,
            KPPPD: d.commodities[i].kpppd
          };
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
      d3.max(commodities, c => {d3.max( c.values, d => d.KPPPD)}) //first get the max KPPPD value per row and then calculate per column.
    ]);
  
    if (!update) {
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
  
      svg.append("g")
        .attr("class", "y-axis")
        .call(yAxis);
    } else {
      const t = d3.transition().duration(500);
  
      svg.select(".x-axis")
        .transition(t)
        .call(xAxis);
  
      svg.select(".y-axis")
        .transition(t)
        .call(yAxis);
    }
    //svg.selectAll(".commodities").remove(); //remove in the case where alreday added
  
    if (!update || dataPointVaryBool) {
      if (dataPointVaryBool) {
        //remove all previous points / lines and re-render otherwise you might get a nasty mess.
        svg.selectAll(".commodities").remove();
      }
      const line = svg.selectAll(".commodities")
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
        );
  
      lineLabels(line);
    } else {
      const t = d3.transition().duration(500),
        line = svg.selectAll(".commodities").data(commodities);
  
      line.select(".line")
        .transition(t)
        .attr("d", d => lines(d.values));
  
      line.selectAll("circle")
        .data(d => d.values)
        .transition(t)
        .attr("cx", d => xScale(d.Year))
        .attr("cy", d => yScale(d.KPPPD));
  
      //remove all existing text keys and reappend.
      line.select(".textkey").remove();
  
      lineLabels(line);
    }
  
    lineLabels = (line) => {
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
    }
  }; 
  
  viz.drawAreaGraph = function (data, country, update) {
  
    //filter the columns based on country.
    let result = data.filter(obj => {
      return obj.Country === country;
    });
  
    //add back in the columns property Obj that was filtered out we still want this.
    result = Object.assign(result, {
      columns: data.columns
    });
  
    const comm_keys = data[0].commodities.map(d => {
      return d.description;
    });
  
    colours.domain(comm_keys);
  
  
    let commodities = comm_keys.map((id, i) => {
      return { year: id, values: result.map(d => {
          return { label: d.Year, value: d.commodities[i].kpppd };
        }) };
    });
  
  
    // Set the domain of the axes
    xScale.domain(d3.extent(result, d => d.Year));
  
  
    yScale.domain([
      0,
      d3.sum(commodities, c =>  d3.max(c.values, d => d.value)) 
    ]);
  
    stack.keys(comm_keys).value()
  
    console.log(commodities);
  
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
  
    svg.append("g")
      .attr("class", "y-axis")
      .call(yAxis);
  
    var selection = svg.selectAll(".series")
      .data(stack(commodities))
      .enter()
          .append("g")
          .attr("class", "series");
  
    selection.append("path")
      .attr("class", "streamPath")
      .attr("d", function (d) { return area(d.values); })
      .style("fill", function (d) { return colours(d.name); })
      .style("stroke", "grey");
  
    
  
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