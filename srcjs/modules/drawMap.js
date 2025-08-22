import * as d3 from "d3";
import * as geojson from "./gadm41_DEU_1.json";
import styles from "./drawMap.css";

const defaultLegendHeight = 300;

const drawMap = (containerId, width = 800, height = 900) => {
  // Container
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

  // Projection
  const projection = d3
    .geoMercator()
    .center([10.5, 51.7])
    .scale(4000)
    .translate([width / 2, height / 2]);
  const path = d3.geoPath().projection(projection);

  // Draw states
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

  // --- LEGEND FUNCTION ---
  const addLegend = (
    colorScale,
    legendWidth = 20,
    legendHeight = defaultLegendHeight,
    spacing = 30
  ) => {
    const svgHeight = +svg.attr("height");

    // Legend group
    const legendGroup = svg
      .append("g")
      .attr("class", "legend")
      .attr(
        "transform",
        `translate(${spacing}, ${(svgHeight - legendHeight) / 2})`
      );

    // Gradient
    const defs = svg.append("defs");
    const linearGradient = defs
      .append("linearGradient")
      .attr("id", "legend-gradient")
      .attr("x1", "0%")
      .attr("y1", "100%")
      .attr("x2", "0%")
      .attr("y2", "0%");

    const colorRange = d3.range(0, 1.01, 0.1);
    const [colorMin, colorMax] = colorScale.domain();

    colorRange.forEach((t) => {
      linearGradient
        .append("stop")
        .attr("offset", `${t * 100}%`)
        .attr("stop-color", colorScale(colorMin + t * (colorMax - colorMin)));
    });

    legendGroup
      .append("rect")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#legend-gradient)");

    const legendScale = d3
      .scaleLinear()
      .domain([colorMin, colorMax])
      .range([legendHeight, 0]);

    const legendAxis = d3
      .axisRight(legendScale)
      .ticks(5)
      .tickFormat(d3.format(".0f"));

    legendGroup
      .append("g")
      .attr("transform", `translate(${legendWidth},0)`)
      .call(legendAxis)
      .selectAll("text")
      .style("font-size", "12px");

    return {
      legendGroup,
      legendScale,
    };
  };

  let legendHelpers;
  let totalTriangle; // Keep reference to total triangle

  // --- TOOLTIP (created once, always on top) ---
  const tooltipGroup = svg
    .append("g")
    .attr("id", "tooltip")
    .style("visibility", "hidden");

  const tooltip = tooltipGroup
    .append("foreignObject")
    .attr("width", 600)
    .attr("height", 500)
    .append("xhtml:div")
    .style("font-size", "20px")
    .style("font-family", "Arial")
    .style("border-radius", "8px")
    .style("background-color", "rgba(0, 0, 0, 0.8)")
    .style("color", "white")
    .style("padding", "8px")
    .style("position", "absolute")
    .style("pointer-events", "none");

  svg.on("mousemove", (e) => {
    const [x, y] = d3.pointer(e);
    tooltipGroup.attr("transform", `translate(${x + 30}, ${y + 30})`);
  });

  // --- UPDATE MAP FUNCTION ---
  const updateMap = (data, config) => {
    const currentParameter = data[0].parameter;
    const { min, max } = config.parameter[currentParameter].range;
    const { na_label = "Keine Daten" } = config;
    const { total_label = "Deutschland" } = config;

    const reverse = config.parameter[currentParameter].reverse;
    const limits = reverse ? [max, min] : [min, max];

    const colorScale = d3
      .scaleSequential()
      .domain(limits)
      .interpolator(d3.interpolateViridis);

    states
      .select("path")
      .attr("fill", (d) => {
        const stateName = d.properties.NAME_1;
        const stateData = data.find((el) => el.Bundesland === stateName);
        return stateData
          ? colorScale(Math.max(min, Math.min(max, stateData.est)))
          : "#ccc";
      })
      .on("mouseover", function (event, d) {
        const stateName = d.properties.NAME_1;
        const stateData = data.find((el) => el.Bundesland === stateName);
        tooltip.html(
          `<b>${stateName}</b></br>${stateData?.est_print || na_label}`
        );
        tooltipGroup.style("visibility", "visible");
      })
      .on("mouseout", function () {
        tooltipGroup.style("visibility", "hidden");
      });

    // Remove old legend
    svg.select(".legend").remove();

    // Add new legend (behind tooltip)
    legendHelpers = addLegend(colorScale);

    // Remove old total triangle if exists
    if (totalTriangle) totalTriangle.remove();

    // Add total indicator
    const totalData = data.find((d) => d.Bundesland === "total");
    if (totalData) {
      const triangleSize = 15;
      const trianglePoints = `0,0 ${triangleSize},${
        triangleSize / 2
      } 0,${triangleSize}`;
      const legendY =
        (height - defaultLegendHeight) / 2 +
        legendHelpers.legendScale(totalData.est);

      totalTriangle = svg
        .append("polygon")
        .attr("class", "total-indicator")
        .attr("points", trianglePoints)
        .attr("fill", "transparent")
        .attr("stroke", "black")
        .attr(
          "transform",
          `translate(${30 - triangleSize}, ${legendY - triangleSize / 2})`
        )
        .style("cursor", "pointer");

      totalTriangle
        .on("mouseover", () => {
          tooltip.html(
            `<b>${total_label}</b></br>${totalData.est_print || na_label}`
          );
          tooltipGroup.style("visibility", "visible");
        })
        .on("mouseout", () => {
          tooltipGroup.style("visibility", "hidden");
        });
    }

    // Ensure tooltip is drawn LAST → always on top
    svg.node().appendChild(tooltipGroup.node());
  };

  return updateMap;
};

export { drawMap };
