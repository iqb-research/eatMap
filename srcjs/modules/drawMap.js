import * as d3 from "d3";
import * as geojson from "./gadm41_DEU_1.json";
import styles from "./drawMap.css";

const defaultLegendHeight = 300;

// infos for translations if lang = en
const stateTranslations = {
      "Baden-Württemberg": "Baden-Wuerttemberg",
      "Bayern": "Bavaria",
      "Berlin": "Berlin",
      "Brandenburg": "Brandenburg",
      "Bremen": "Bremen",
      "Hamburg": "Hamburg",
      "Hessen": "Hesse",
      "Mecklenburg-Vorpommern": "Mecklenburg-Western Pomerania",
      "Niedersachsen": "Lower Saxony",
      "Nordrhein-Westfalen": "North Rhine-Westphalia",
      "Rheinland-Pfalz": "Rhineland-Palatinate",
      "Saarland": "Saarland",
      "Sachsen": "Saxony",
      "Sachsen-Anhalt": "Saxony-Anhalt",
      "Schleswig-Holstein": "Schleswig-Holstein",
      "Thüringen": "Thuringia"
};

const getTooltipName = (deName, lang) => {
      if (lang === "en" && stateTranslations[deName]) {
        return stateTranslations[deName];
      }
      return deName;
};

// Tooltip: "fixed" states
// ... if a state is in this list, its tooltip stays fixed until klicked again
let fixedTooltips = new Set(); // speichert Bundeslandnamen, die fixiert sind


const drawMap = (containerId, width = 800, height = 900) => {
  let tooltipPosition = "state";

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
    .translate([width / 2.5, height / 2]);
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
    .on("mouseover", function (event, d) {
    const stateName = d.properties.NAME_1;
    if (!fixedTooltips.has(stateName)) {
      d3.select(this).style("fill-opacity", 0.8);

      const stateData = data.find(el => el.Bundesland === stateName);
      const tooltipName = getTooltipName(stateName, lang);
      tooltip.html(`<b>${tooltipName}</b></br>${stateData?.est_print || na_label}`);
      tooltipGroup.style("visibility", "visible");
    }
  })
  .on("mouseout", function (event, d) {
    const stateName = d.properties.NAME_1;
    if (!fixedTooltips.has(stateName)) {
      d3.select(this).style("fill-opacity", 1);
      tooltipGroup.style("visibility", "hidden");
    }
  });

  // --- TOOLTIP (always on top) ---
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
    const tooltipX = tooltipPosition === "state" ? x + 30 : x - 160;
    tooltipGroup.attr("transform", `translate(${tooltipX}, ${y + 30})`);
  });

  // --- LEGEND FUNCTION ---
  const addLegend = (
    colorScale,
    legendWidth = 20,
    legendHeight = defaultLegendHeight,
    spacing = 30
  ) => {
    const svgHeight = +svg.attr("height");

    const legendGroup = svg
      .append("g")
      .attr("class", "legend")
      .attr(
        "transform",
        `translate(${width - spacing - legendWidth}, ${
          (svgHeight - legendHeight) / 2
        })`
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

    // Legend rectangle
    legendGroup
      .append("rect")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#legend-gradient)");

    // Axis on right side
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

    return { legendGroup, legendScale, legendWidth };
  };

  let legendHelpers;
  let totalTriangle;

  // --- UPDATE MAP FUNCTION ---
  const updateMap = (data, config, lang) => {

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

    // Update states
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
        tooltipPosition = "state";
        const stateNameDe = d.properties.NAME_1; // German, for lookup
        const stateData = data.find((el) => el.Bundesland === stateNameDe);

        // Translate only for display
        const tooltipName = getTooltipName(stateNameDe, lang); // Use the passed lang

        tooltip.html(
          `<b>${tooltipName}</b></br>${stateData?.est_print || na_label}`
        );
        tooltipGroup.style("visibility", "visible");
      })

      .on("click", function (event, d) {
        const stateName = d.properties.NAME_1;
        const stateData = data.find(el => el.Bundesland === stateName);
        const tooltipName = getTooltipName(stateName, lang);

        if (fixedTooltips.has(stateName)) {
          // Bundesland war fixiert → wieder loslösen
          fixedTooltips.delete(stateName);
          d3.select(this).style("fill-opacity", 1);
          svg.select(`#fixed-tooltip-${stateName.replace(/\s/g, '-')}`).remove();
        } else {
          // Bundesland fixieren
          fixedTooltips.add(stateName);
          d3.select(this).style("fill-opacity", 0.8);

          // Tooltip mittig über dem Bundesland positionieren
          const [cx, cy] = path.centroid(d);

          // Kleine manuelle Offsets, um Überlappung zu vermeiden
          let offsetX = 0;
          let offsetY = 0;

          if (stateName === "Berlin") {
            offsetX = 5; // leicht nach rechts
            offsetY = -25; // nach oben
          }
          if (stateName === "Brandenburg") {
            offsetX = -40; // leicht nach links
            offsetY = 20;  // nach unten
          }
          if (stateName === "Sachsen") {
            offsetX = 0;
            offsetY = -30;  // nach oben
          }
          if (stateName === "Sachsen-Anhalt") {
            offsetX = 0;
            offsetY = 20;  // nach unten
          }
          if (stateName === "Hessen") {
            offsetX = 0;
            offsetY = 20;  // nach unten
          }
          if (stateName === "Hamburg") {
            offsetX = -25;
            offsetY = -10;  // nach oben
          }



          // Tooltip-Container erstellen
          const fixedGroup = svg.append("g")
            .attr("id", `fixed-tooltip-${stateName.replace(/\s/g, '-')}`);

          fixedGroup.append("foreignObject")
            .attr("width", 200)
            .attr("height", 100)
            .attr("x", cx + offsetX)
            .attr("y", cy + offsetY)
            .append("xhtml:div")
            .style("font-size", "14px")
            .style("font-family", "Arial")
            .style("border-radius", "8px")
            .style("background-color", "rgba(0, 0, 0, 0.8)")
            .style("color", "white")
            .style("padding", "5px")
            .style("box-shadow", "2px 2px 6px rgba(0,0,0,0.3)")
            .html(`<b>${tooltipName}</b></br>${stateData?.est_print || na_label}`);
        }
      });

    // Remove old legend
    svg.select(".legend").remove();

    // Add new legend
    legendHelpers = addLegend(colorScale);

    // Remove old total triangle
    if (totalTriangle) totalTriangle.remove();

    // Add total indicator to left of legend
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
          `translate(${
            width - 30 - legendHelpers.legendWidth - triangleSize
          }, ${legendY - triangleSize / 2})`
        )
        .style("cursor", "pointer");

      // Tooltip on LEFT of triangle
      totalTriangle
        .on("mouseover", () => {
          tooltipPosition = "total";

          tooltip.html(
            `<b>${total_label}</b></br>${totalData.est_print || na_label}`
          );
          tooltipGroup.style("visibility", "visible");

          // Position tooltip to the LEFT of triangle
          tooltipGroup.attr(
            "transform",
            `translate(${
              width - 30 - legendHelpers.legendWidth - triangleSize - 610
            }, ${legendY - triangleSize / 2})`
          );
        })
        .on("mouseout", () => tooltipGroup.style("visibility", "hidden"));
    }

    // Keep tooltip on top
    svg.node().appendChild(tooltipGroup.node());
  };

  return updateMap;
};

export { drawMap };
