import { computeStats } from "./stats";
import { BADGE_DEFS, isBadgeUnlocked } from "./badges";
import { computeTrackDistanceKm } from "./randos";

export function getWrappedYear(date = new Date()) {
  return date.getFullYear();
}

function inYear(iso, year) {
  if (!iso) return false;
  try {
    return new Date(iso).getFullYear() === year;
  } catch {
    return false;
  }
}

export function computeWrapped(discoveries, albums, year = getWrappedYear()) {
  const yearDiscoveries = discoveries.filter((d) => inYear(d.discoveredAt, year));
  const stats = computeStats(yearDiscoveries);
  const badgesUnlocked = BADGE_DEFS.filter((b) => isBadgeUnlocked(yearDiscoveries, b));

  const randoKm = albums
    .filter((a) => a.theme === "randos" && inYear(a.createdAt, year))
    .reduce((sum, album) => {
      const track = album.gpsTrack || [];
      return sum + (track.length ? computeTrackDistanceKm(track) : 0);
    }, 0);

  const topSpecies = Object.entries(
    yearDiscoveries.reduce((acc, d) => {
      const key = (d.nom || "—").toLowerCase();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => yearDiscoveries.find((d) => (d.nom || "—").toLowerCase() === name)?.nom || name);

  const monthsActive = new Set(
    yearDiscoveries.map((d) => {
      const dt = new Date(d.discoveredAt);
      return `${dt.getFullYear()}-${dt.getMonth()}`;
    })
  ).size;

  return {
    year,
    total: stats.total,
    stats,
    uniqueSpecies: stats.uniqueSpecies,
    rareCount: stats.rareCount,
    favoriteType: stats.favoriteType,
    countriesCount: stats.countriesCount,
    randoKm: Math.round(randoKm * 10) / 10,
    badgesUnlocked: badgesUnlocked.length,
    topSpecies,
    monthsActive,
    hasData: yearDiscoveries.length > 0,
  };
}

export async function shareWrapped(wrapped, t, typeLabel) {
  const W = 1080;
  const H = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#0F2419");
  grad.addColorStop(0.45, "#1B3D2F");
  grad.addColorStop(1, "#E07A3A");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#F5F2EB";
  ctx.font = "bold 88px Georgia, serif";
  ctx.fillText("Wilder", 72, 200);
  ctx.font = "600 42px system-ui, sans-serif";
  ctx.fillStyle = "rgba(245,242,235,0.75)";
  ctx.fillText(t("wrapped.title", { year: wrapped.year }), 72, 270);

  ctx.fillStyle = "#F5F2EB";
  ctx.font = "bold 160px Georgia, serif";
  ctx.fillText(String(wrapped.total), 72, 480);
  ctx.font = "500 40px system-ui, sans-serif";
  ctx.fillStyle = "rgba(245,242,235,0.7)";
  ctx.fillText(t("wrapped.discoveries"), 72, 540);

  const lines = [
    [t("wrapped.unique"), String(wrapped.uniqueSpecies)],
    [t("wrapped.rare"), String(wrapped.rareCount)],
    [t("wrapped.badges"), String(wrapped.badgesUnlocked)],
  ];
  if (wrapped.randoKm > 0) lines.push([t("wrapped.rando_km"), `${wrapped.randoKm} km`]);
  if (wrapped.favoriteType) {
    lines.push([t("wrapped.favorite"), typeLabel(wrapped.favoriteType)]);
  }

  let y = 700;
  for (const [label, value] of lines) {
    ctx.fillStyle = "rgba(245,242,235,0.55)";
    ctx.font = "500 32px system-ui, sans-serif";
    ctx.fillText(label, 72, y);
    ctx.fillStyle = "#F5F2EB";
    ctx.font = "bold 48px Georgia, serif";
    ctx.fillText(value, 72, y + 52);
    y += 120;
  }

  ctx.fillStyle = "rgba(245,242,235,0.45)";
  ctx.font = "500 36px system-ui, sans-serif";
  ctx.fillText("🌿 wilder.app", 72, H - 120);

  const dataUrl = canvas.toDataURL("image/png");
  const blob = await (await fetch(dataUrl)).blob();
  const file = new File([blob], `wilder-wrapped-${wrapped.year}.png`, { type: "image/png" });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      title: t("wrapped.title", { year: wrapped.year }),
      text: t("wrapped.discoveries"),
      files: [file],
    });
    return;
  }

  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = file.name;
  link.click();
}
