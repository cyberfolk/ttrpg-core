export function scoreColor(score) {
  // 1 = rosso (0deg), 100 = verde (120deg)
  const hue = Math.round(((score - 1) / 99) * 120);
  const color = `hsl(${hue}, 70%, 75%)`;
  return color;
}
