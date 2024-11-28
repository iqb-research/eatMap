import "widgets";
import { drawMap } from "../modules/drawMap.js";

HTMLWidgets.widget({
  name: "eatMap",

  type: "output",

  factory: function (el, width, height) {
    const divMap = document.createElement("div");
    divMap.id = "map-container";
    el.appendChild(divMap);

    const divTooltip = document.createElement("div");
    divTooltip.id = "tooltip-container";
    divTooltip.classList.add("tooltip");
    el.appendChild(divTooltip);

    const updateMap = drawMap("map-container", "tooltip-container");

    return {
      renderValue: function (x) {
        // TODO: code to render the widget, e.g.
        // el.innerText = x.message;
        // console.log(x.data);
        updateMap(x.data, x.config);
      },

      resize: function (width, height) {
        // TODO: code to re-render the widget with a new size
      },
    };
  },
});
