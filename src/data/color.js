const colorSwatches = {
  black: "#282725",
  blue: "#4b78a8",
  brown: "#725443",
  charcoal: "#555452",
  cocoa: "#725443",
  cream: "#e8dfce",
  forest: "#365748",
  "forest green": "#365748",
  green: "#4f7658",
  grey: "#858582",
  gray: "#858582",
  indigo: "#455879",
  natural: "#ded3bd",
  navy: "#293851",
  olive: "#777956",
  pink: "#c9869b",
  red: "#ad3d3d",
  sage: "#a9b39a",
  sand: "#c5ad8a",
  "sky blue": "#9bbbd0",
  "dusty rose": "#c89892",
  terracotta: "#b76f58",
  "washed black": "#595958",
  white: "#f7f5ef",
};

export const getColorSwatch = (color) =>
  colorSwatches[String(color || "").trim().toLowerCase()] || "#c9c1b4";
