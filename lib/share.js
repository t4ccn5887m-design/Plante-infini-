function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawWilderLogo(ctx, cx, cy, size) {
  ctx.save();
  ctx.translate(cx - size / 2, cy - size / 2);
  const s = size / 80;
  ctx.scale(s, s);

  ctx.beginPath();
  ctx.arc(40, 40, 38, 0, Math.PI * 2);
  ctx.fillStyle = "#1B3D2F";
  ctx.fill();
  ctx.strokeStyle = "rgba(245,242,235,0.25)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = "#3D7A5C";
  ctx.beginPath();
  ctx.moveTo(28, 52);
  ctx.bezierCurveTo(26, 44, 30, 34, 40, 30);
  ctx.bezierCurveTo(44, 28, 48, 29, 50, 32);
  ctx.bezierCurveTo(52, 26, 58, 22, 66, 24);
  ctx.bezierCurveTo(72, 26, 76, 32, 76, 40);
  ctx.bezierCurveTo(76, 52, 66, 60, 54, 62);
  ctx.bezierCurveTo(46, 63, 40, 60, 38, 52);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#2D5A45";
  ctx.beginPath();
  ctx.moveTo(52, 28);
  ctx.bezierCurveTo(48, 34, 46, 42, 48, 50);
  ctx.bezierCurveTo(50, 40, 56, 34, 64, 32);
  ctx.fill();

  ctx.restore();
}

export async function generateShareImage(discovery, t, getTypeLabel, getRarityLabel) {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#0F2419");
  grad.addColorStop(0.5, "#1B3D2F");
  grad.addColorStop(1, "#2D5A45");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  try {
    const photo = await loadImage(discovery.photo);
    const photoH = 720;
    ctx.save();
    roundRect(ctx, 48, 48, W - 96, photoH, 32);
    ctx.clip();
    const scale = Math.max((W - 96) / photo.width, photoH / photo.height);
    const sw = photo.width * scale;
    const sh = photo.height * scale;
    ctx.drawImage(photo, 48 + (W - 96 - sw) / 2, 48 + (photoH - sh) / 2, sw, sh);
    ctx.restore();
  } catch {
    ctx.fillStyle = "rgba(61,122,92,0.3)";
    roundRect(ctx, 48, 48, W - 96, 720, 32);
    ctx.fill();
  }

  drawWilderLogo(ctx, 120, 820, 72);

  ctx.fillStyle = "#F5F2EB";
  ctx.font = "bold 64px Georgia, serif";
  ctx.fillText(discovery.nom, 180, 840);

  if (discovery.nom_latin) {
    ctx.fillStyle = "rgba(245,242,235,0.65)";
    ctx.font = "italic 36px Georgia, serif";
    ctx.fillText(discovery.nom_latin, 180, 890);
  }

  const typeLabel = getTypeLabel(discovery.type || "plante");
  const rarityLabel = getRarityLabel(discovery.rarete || "commun");

  ctx.fillStyle = "#3D7A5C";
  roundRect(ctx, 48, 940, 220, 56, 28);
  ctx.fill();
  ctx.fillStyle = "#F5F2EB";
  ctx.font = "600 28px system-ui, sans-serif";
  ctx.fillText(typeLabel, 68, 978);

  ctx.fillStyle = "#E07A3A";
  roundRect(ctx, 290, 940, 280, 56, 28);
  ctx.fill();
  ctx.fillStyle = "#F5F2EB";
  ctx.fillText(`◆ ${rarityLabel}`, 310, 978);

  ctx.fillStyle = "rgba(245,242,235,0.5)";
  ctx.font = "500 32px system-ui, sans-serif";
  ctx.fillText(t("discovery.share_footer"), 48, 1050);

  ctx.fillStyle = "#F5F2EB";
  ctx.font = "bold 48px Georgia, serif";
  ctx.fillText("Wilder", 48, 1280);

  ctx.fillStyle = "rgba(245,242,235,0.45)";
  ctx.font = "28px system-ui, sans-serif";
  ctx.fillText("🌿", W - 80, 1280);

  return canvas.toDataURL("image/png");
}

export async function shareDiscovery(discovery, t, getTypeLabel, getRarityLabel) {
  const dataUrl = await generateShareImage(discovery, t, getTypeLabel, getRarityLabel);
  const blob = await (await fetch(dataUrl)).blob();
  const file = new File([blob], `wilder-${discovery.nom.replace(/\s+/g, "-").toLowerCase()}.png`, {
    type: "image/png",
  });
  const shareText = t("discovery.share_text", { name: discovery.nom });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ title: "Wilder", text: shareText, files: [file] });
    return;
  }

  if (navigator.share) {
    await navigator.share({ title: "Wilder", text: shareText, url: window.location.href });
    return;
  }

  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = file.name;
  link.click();
}
