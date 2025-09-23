import "widgets";
import { drawMap } from "../modules/drawMap.js";

HTMLWidgets.widget({
  name: "eatMap",

  type: "output",

  factory: function (el, width, height) {
    el.style.width = width;
    el.style.height = height;

    const updateMap = drawMap(el.id);

    return {
      renderValue: function ({ data, config, lang }) {
        console.log("x from R:", x);
        // TODO: remove this hotfix when the Shiny environment only provides valid data!
        if (data.length !== 0) {
          updateMap(data, config, lang);
        }
      },

      resize: function (width, height) {
        el.style.width = width;
        el.style.height = height;
        // TODO: code to re-render the widget with a new size
      },
    };
  },
});
