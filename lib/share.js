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
  const s = size / 512;
  ctx.scale(s, s);

  roundRect(ctx, 0, 0, 512, 512, 112);
  ctx.fillStyle = "#FAFAF7";
  ctx.fill();

  const grad = ctx.createLinearGradient(88, 88, 424, 424);
  grad.addColorStop(0, "#3D7A3D");
  grad.addColorStop(1, "#5BA85C");

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(204, 96);
  ctx.bezierCurveTo(128, 98, 84, 176, 88, 272);
  ctx.bezierCurveTo(92, 356, 160, 408, 232, 380);
  ctx.bezierCurveTo(276, 364, 298, 316, 286, 260);
  ctx.bezierCurveTo(270, 184, 246, 120, 204, 96);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = grad;
  ctx.lineWidth = 30;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(204, 128);
  ctx.bezierCurveTo(220, 200, 248, 272, 296, 324);
  ctx.bezierCurveTo(318, 348, 338, 356, 322, 382);
  ctx.stroke();

  ctx.fillStyle = "#FAFAF7";
  ctx.beginPath();
  ctx.arc(368, 348, 52, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(368, 348, 72, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

export const SHARE_FORMATS = {
  feed: { width: 1080, height: 1350, labelKey: "discovery.share_format_feed" },
  story: { width: 1080, height: 1920, labelKey: "discovery.share_format_story" },
  tiktok: { width: 1080, height: 1920, labelKey: "discovery.share_format_tiktok" },
};

export async function generateShareImage(
  discovery,
  t,
  getTypeLabel,
  getRarityLabel,
  format = "feed"
) {
  const spec = SHARE_FORMATS[format] || SHARE_FORMATS.feed;
  const W = spec.width;
  const H = spec.height;
  const isVertical = H > W;
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

  const photoTop = isVertical ? 120 : 48;
  const photoH = isVertical ? Math.round(H * 0.55) : 720;
  const photoPad = 48;

  try {
    const photo = await loadImage(discovery.photo);
    ctx.save();
    roundRect(ctx, photoPad, photoTop, W - photoPad * 2, photoH, 32);
    ctx.clip();
    const scale = Math.max((W - photoPad * 2) / photo.width, photoH / photo.height);
    const sw = photo.width * scale;
    const sh = photo.height * scale;
    ctx.drawImage(
      photo,
      photoPad + (W - photoPad * 2 - sw) / 2,
      photoTop + (photoH - sh) / 2,
      sw,
      sh
    );
    ctx.restore();
  } catch {
    ctx.fillStyle = "rgba(61,122,92,0.3)";
    roundRect(ctx, photoPad, photoTop, W - photoPad * 2, photoH, 32);
    ctx.fill();
  }

  const infoY = photoTop + photoH + (isVertical ? 80 : 52);
  drawWilderLogo(ctx, 120, infoY, isVertical ? 80 : 72);

  ctx.fillStyle = "#F5F2EB";
  ctx.font = `bold ${isVertical ? 72 : 64}px Georgia, serif`;
  ctx.fillText(discovery.nom, 180, infoY + 10);

  if (discovery.nom_latin) {
    ctx.fillStyle = "rgba(245,242,235,0.65)";
    ctx.font = `italic ${isVertical ? 40 : 36}px Georgia, serif`;
    ctx.fillText(discovery.nom_latin, 180, infoY + 58);
  }

  const typeLabel = getTypeLabel(discovery.type || "plante");
  const rarityLabel = getRarityLabel(discovery.rarete || "commun");
  const pillY = infoY + (discovery.nom_latin ? 100 : 72);

  ctx.fillStyle = "#3D7A5C";
  roundRect(ctx, 48, pillY, 220, 56, 28);
  ctx.fill();
  ctx.fillStyle = "#F5F2EB";
  ctx.font = "600 28px system-ui, sans-serif";
  ctx.fillText(typeLabel, 68, pillY + 38);

  ctx.fillStyle = "#E07A3A";
  roundRect(ctx, 290, pillY, 280, 56, 28);
  ctx.fill();
  ctx.fillStyle = "#F5F2EB";
  ctx.fillText(`◆ ${rarityLabel}`, 310, pillY + 38);

  ctx.fillStyle = "rgba(245,242,235,0.5)";
  ctx.font = "500 32px system-ui, sans-serif";
  ctx.fillText(t("discovery.share_footer"), 48, pillY + 110);

  if (isVertical) {
    ctx.fillStyle = "rgba(245,242,235,0.25)";
    ctx.font = "600 36px system-ui, sans-serif";
    const formatLabel =
      format === "tiktok"
        ? t("discovery.share_format_tiktok_tag")
        : t("discovery.share_format_story_tag");
    ctx.fillText(formatLabel, 48, H - 200);
  }

  ctx.fillStyle = "#F5F2EB";
  ctx.font = `bold ${isVertical ? 56 : 48}px Georgia, serif`;
  ctx.fillText("Wilder", 48, H - 90);

  ctx.fillStyle = "rgba(245,242,235,0.45)";
  ctx.font = "28px system-ui, sans-serif";
  ctx.fillText("🌿", W - 80, H - 90);

  return canvas.toDataURL("image/png");
}

export function buildShareText(discovery, t) {
  const name = discovery?.nom || "";
  const description = discovery?.description?.trim();
  if (description) {
    return t("discovery.share_text_with_desc", { name, description });
  }
  return t("discovery.share_text", { name });
}

export async function shareDiscovery(
  discovery,
  t,
  getTypeLabel,
  getRarityLabel,
  format = "feed",
  { shareText: shareTextOverride } = {}
) {
  const dataUrl = await generateShareImage(discovery, t, getTypeLabel, getRarityLabel, format);
  const blob = await (await fetch(dataUrl)).blob();
  const file = new File([blob], `wilder-${discovery.nom.replace(/\s+/g, "-").toLowerCase()}.png`, {
    type: "image/png",
  });
  const shareText = shareTextOverride ?? buildShareText(discovery, t);

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
