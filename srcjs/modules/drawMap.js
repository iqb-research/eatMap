import * as d3 from "d3";
import * as geojson from "./gadm41_DEU_1.json";

import styles from "./drawMap.css";

// The drawMap function initializes the SVG and static map elements
const drawMap = (containerId, width = 800, height = 900) => {
  // Create SVG element
  const container = d3
    .select(`#${containerId}`)
    .style("max-width", "fit-content")
    .style("margin-left", "auto")
    .style("margin-right", "auto");

  const svg = container
    .append("svg")
    .attr("viewBox", `0 0 800 1000`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .attr("width", width)
    .attr("height", height)
    .style("position", "relative")
    .style("height", "95vh");

  // Projection and path generator
  const projection = d3
    .geoMercator()
    .center([10.5, 51.7]) // Centered on Germany
    .scale(4000) // Adjusted to fit within the SVG
    .translate([width / 2, height / 2]);

  const path = d3.geoPath().projection(projection);

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

  // Tooltip element

  // create a tooltip
  const tooltipGroup = svg
    .append("g")
    .attr("transform", "translate(0, 500)")
    .attr("id", "tooltip")
    .style("visibility", "hidden");

  // TODO: Potentially remove this hotfix
  svg.on("mousemove", (e) => {
    const [x, y] = d3.pointer(e);

    tooltipGroup.attr("transform", `translate(${x + 30}, ${y + 30})`);
  });

  const tooltip = tooltipGroup
    .append("foreignObject")
    .attr("width", 600)
    .attr("height", 500)
    .append("xhtml:div") // Use xhtml namespace for embedded HTML
    .style("margin-top", "auto")
    // .style("width", "100%")
    // .style("height", "100%")
    .style("font-size", "20px")
    .style("font-family", "Arial")
    .style("border-radius", "8px")
    .style("background-color", "rgba(0, 0, 0, 0.8)")
    .style("color", "white")
    .style("padding", "8px")
    .style("position", "absolute")
    .style("pointer-events", "none")
    .html(`<b>Mecklenburg-Vorpommern</b></br>Keine Angabe`);

  // Add a legend to the map
  const addLegend = (
    colorScale,
    legendTitle,
    reverse,
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
    const colorMin = reverse ? colorScale.domain()[1] : colorScale.domain()[0];
    const colorMax = reverse ? colorScale.domain()[0] : colorScale.domain()[1];

    colorRange.forEach((t) => {
      linearGradient
        .append("stop")
        .attr("offset", `${t * 100}%`)
        .attr("stop-color", colorScale(colorMin + t * (colorMax - colorMin)));
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
      .domain([colorMin, colorMax])
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

    const reverse = config.parameter[currentParameter].reverse;
    const limits = reverse ? [max, min] : [min, max];

    // Create a color scale
    const colorScale = d3
      .scaleSequential()
      .domain(limits)
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

        tooltip.html(
          `<b>${stateName}</b></br>${stateData?.est_print || "keine Angabe"}`
        );

        tooltipGroup.style("visibility", "visible");
      })
      // .on("mousemove", function (event) {
      //   // const [x, y] = d3.pointer(event, d3.select(document).node());
      //   // window.doc = d3.select(document);
      //   // window.body = d3.select(document.body);
      //   // const [xT, yT] = d3.pointer(event, svg.node());
      //   // // console.log(x, y);
      //   // // console.log(xT, yT);
      //   // tooltip.style("left", `${x + 10}px`).style("top", `${y - 28}px`);
      // })
      .on("mouseout", function () {
        tooltipGroup.style("visibility", "hidden");
      });

    // Add or update the legend whenever data is updated
    svg.select(".legend").remove(); // Remove the previous legend
    addLegend(colorScale, config.parameter[currentParameter].label, reverse);
  };

  // Return the update function so it can be called externally
  return updateMap;
};

export { drawMap };
