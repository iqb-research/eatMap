import * as d3 from "d3";
import * as geojson from "./gadm41_DEU_1.json";

import styles from "./drawMap.css";

// The drawMap function initializes the SVG and static map elements
const drawMap = (containerId, tooltipId, width = 800, height = 900) => {
  // Create SVG element
  const svg = d3
    .select(`#${containerId}`)
    .append("svg")
    .attr("viewBox", `0 0 900 1000`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .attr("width", width)
    .attr("height", height);

  // Projection and path generator
  const projection = d3
    .geoMercator()
    .center([10.5, 51.7]) // Centered on Germany
    .scale(4000) // Adjusted to fit within the SVG
    .translate([width / 2, height / 2]);

  const path = d3.geoPath().projection(projection);

  // Tooltip element
  const tooltip = d3.select(`#${tooltipId}`);

  // Create state groups and paths
  const states = svg
    .selectAll(".state-group")
    .data(geojson.features)
    .enter()
    .append("g")
    .attr("class", "state-group");

  states
    .append("path")
    .attr("class", "state")
    .attr("d", path)
    .style("stroke", "#ffffff")
    .style("stroke-width", 0.5)
    .style("cursor", "default");

  states
    .on("mouseover", function () {
      d3.select(this).style("fill-opacity", 0.8);
    })
    .on("mouseout", function () {
      d3.select(this).style("fill-opacity", 1);
    });

  // Add a legend to the map
  const addLegend = (
    colorScale,
    legendTitle,
    legendWidth = 300,
    legendHeight = 20
  ) => {
    const legendGroup = svg
      .append("g")
      .attr("class", "legend")
      .attr("transform", `translate(0, 30)`);

    // Create a gradient for the legend
    const defs = svg.append("defs");
    const linearGradient = defs
      .append("linearGradient")
      .attr("id", "legend-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");

    // Add gradient stops
    const colorRange = d3.range(0, 1.01, 0.1);
    colorRange.forEach((t) => {
      linearGradient
        .append("stop")
        .attr("offset", `${t * 100}%`)
        .attr(
          "stop-color",
          colorScale(
            colorScale.domain()[0] +
              t * (colorScale.domain()[1] - colorScale.domain()[0])
          )
        );
    });

    // Append the gradient rect
    legendGroup
      .append("rect")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#legend-gradient)");

    // Add axis for the legend
    const legendScale = d3
      .scaleLinear()
      .domain(colorScale.domain())
      .range([0, legendWidth]);

    const legendAxis = d3
      .axisBottom(legendScale)
      .ticks(5)
      .tickFormat(d3.format(".0f")); // Format ticks as integers

    legendGroup
      .append("g")
      .attr("transform", `translate(0, ${legendHeight})`)
      .call(legendAxis)
      .selectAll("text")
      .style("font-size", "12px");

    legendGroup
      .append("text")
      .text(legendTitle)
      .attr("id", "legend-title")
      .attr("transform", "translate(0, -10)")
      .style("font-family", "Arial")
      .style("font-weight", "bold");
  };

  // Update function to modify the map with new data
  const updateMap = (data, config) => {
    // Get current parameter
    const currentParameter = data[0].parameter;
    const { min, max } = config.parameter[currentParameter].range;

    // Create a color scale
    const colorScale = d3
      .scaleSequential()
      .domain([min, max]) // Adjust domain as needed
      .interpolator(d3.interpolateViridis);

    states
      .select("path")
      .attr("fill", function (d) {
        const {
          properties: { NAME_1: stateName },
        } = d;

        const stateData = data.find((el) => el.Bundesland === stateName);
        if (stateData) {
          const est =
            stateData.est < min
              ? min
              : stateData.est > max
              ? max
              : stateData.est;
          return colorScale(est);
        } else {
          return "#ccc";
        }
      })
      .on("mouseover", function (event, d) {
        const stateName = d.properties.NAME_1;
        const stateData = data.find((el) => el.Bundesland === stateName);

        tooltip
          .html(
            `<b>${stateName}</b>: ${stateData?.est_print || "keine Angabe"}`
          )
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px")
          .style("opacity", 1)
          .style("position", "absolute")
          .style("padding", "8px")
          .style("background", "rgba(0, 0, 0, 0.7)")
          .style("color", "#fff")
          .style("border-radius", "4px")
          .style("pointer-events", "none")
          .style("font-size", "14px")
          // .style("font-weight", "bold")
          .style("font-family", "Arial");
      })
      .on("mousemove", function (event) {
        tooltip
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", function () {
        tooltip.style("opacity", 0);
      });

    // Add or update the legend whenever data is updated
    svg.select(".legend").remove(); // Remove the previous legend
    addLegend(colorScale, config.parameter[currentParameter].label);
  };

  // Return the update function so it can be called externally
  return updateMap;
};

export { drawMap };
