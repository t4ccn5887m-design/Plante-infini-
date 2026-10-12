let leafLogoCache = null;

/** Logo PDF : feuille blanche sur carré vert arrondi (22×22). */
export function getGardenPdfLeafLogoDataUrl() {
  if (typeof document === "undefined") return null;
  if (leafLogoCache) return leafLogoCache;

  const size = 44;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const r = 10;
  ctx.fillStyle = "#2F5E3F";
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(size - r, 0);
  ctx.quadraticCurveTo(size, 0, size, r);
  ctx.lineTo(size, size - r);
  ctx.quadraticCurveTo(size, size, size - r, size);
  ctx.lineTo(r, size);
  ctx.quadraticCurveTo(0, size, 0, size - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#FFFFFF";
  ctx.fillStyle = "#FFFFFF";
  ctx.lineWidth = 2.4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const s = size / 24;
  ctx.save();
  ctx.translate(size / 2 - 12 * s, size / 2 - 12 * s);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(11, 20);
  ctx.bezierCurveTo(7, 14, 5, 10, 9.8, 6.1);
  ctx.bezierCurveTo(15.5, 5, 17, 4.48, 19, 2);
  ctx.bezierCurveTo(21, 4, 22, 6.18, 22, 10);
  ctx.bezierCurveTo(22, 15.5, 17.22, 20, 11, 20);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(2, 21);
  ctx.bezierCurveTo(2, 18, 3.85, 15.64, 5.08, 14);
  ctx.stroke();
  ctx.restore();

  leafLogoCache = canvas.toDataURL("image/png");
  return leafLogoCache;
}
