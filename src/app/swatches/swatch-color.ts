const swatchColors: Record<string, string> = {
  Apricot: "#e5ac84", Beige: "#cec1a7", Black: "#242426", Blue: "#446897",
  Brown: "#785c4c", Burgundy: "#703241", "Dark Gray": "#4c4b4b", "Dark Navy": "#232738",
  "Deep Blue": "#2d4969", "Deep Sky Blue": "#648fba", "Emerald Light Green": "#6bbd9c",
  "Emerald Sky Blue": "#63a4b3", Green: "#496953", "Green/Mint": "#7d9c86",
  "Indian Pink": "#b87985", Indigo: "#363e63", Jade: "#729385", Khaki: "#888365",
  "Light Green": "#b4c597", "Light Navy": "#56617d", "Light Sky Blue": "#b4c8d9",
  Mint: "#aec8bd", Navy: "#313b54", "Optical White": "#fff", Orange: "#d97e45",
  Pink: "#d9a5b2", Purple: "#776184", Red: "#a64046", "Sky Blue": "#8caeca",
  White: "#f2f0e9", "White/Navy": "linear-gradient(135deg,#f2f0e9 50%,#313b54 50%)", Yellow: "#dfcb72",
};

export function chip(color: string) {
  return swatchColors[color] || "#dedad4";
}
