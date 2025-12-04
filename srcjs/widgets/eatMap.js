import "widgets";
import { drawMap } from "../modules/drawMap.js";

let currentData = [];
let currentConfig = {};
let currentLang = "de";

HTMLWidgets.widget({
  name: "eatMap",
  type: "output",

  factory: function (el, width, height) {
    el.style.width = width;
    el.style.height = height;

    const updateMap = drawMap(el.id);

    return {
      renderValue: function ({ data, config, lang }) {
        currentData = data;
        currentConfig = config;
        currentLang = lang;

        // Verhindere Shiny-Initialfehler
        if (data.length !== 0) {
          updateMap(data, config, lang);
        }
      },

      resize: function (width, height) {
        el.style.width = width;
        el.style.height = height;
      },
    };
  },
});
