import { computeRandoDistanceKm } from "@/lib/randos";

export function getAlbumDisplayName(album) {
  return album?.nom || album?.name || "Rando";
}

/** Discoveries for a rando album, oldest first (hike narrative). */
export function getRandoJournalDiscoveries(album, allDiscoveries) {
  const byId = new Map(allDiscoveries.map((d) => [d.id, d]));
  return (album?.discoveryIds || [])
    .map((id) => byId.get(id))
    .filter(Boolean)
    .sort((a, b) => new Date(a.discoveredAt) - new Date(b.discoveredAt));
}

export function getRandoPlaceName(album, discoveries) {
  if (album?.placeName) return album.placeName;
  const items = getRandoJournalDiscoveries(album, discoveries);
  for (const d of items) {
    if (d.placeName) return d.placeName;
  }
  return null;
}

function projectPoints(points, width, height, padding) {
  const lats = points.map((p) => p[0]);
  const lons = points.map((p) => p[1]);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const latSpan = maxLat - minLat || 0.001;
  const lonSpan = maxLon - minLon || 0.001;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const toXY = ([lat, lon]) => {
    const x = padding + ((lon - minLon) / lonSpan) * innerW;
    const y = padding + innerH - ((lat - minLat) / latSpan) * innerH;
    return [x, y];
  };

  return { toXY, minLat, maxLat, minLon, maxLon };
}

/** SVG trail map for print / HTML export (no Leaflet). */
export function buildTrackSvg(track = [], discoveries = [], opts = {}) {
  const width = opts.width ?? 800;
  const height = opts.height ?? 320;
  const padding = opts.padding ?? 28;

  const coords = [];
  for (const p of track) {
    if (p?.latitude != null && p?.longitude != null) {
      coords.push([p.latitude, p.longitude]);
    }
  }
  const discoveryPoints = discoveries.filter(
    (d) => d?.latitude != null && d?.longitude != null
  );
  for (const d of discoveryPoints) {
    coords.push([d.latitude, d.longitude]);
  }

  if (coords.length === 0) return null;

  const { toXY } = projectPoints(coords, width, height, padding);
  const trackCoords = track
    .filter((p) => p?.latitude != null && p?.longitude != null)
    .map((p) => toXY([p.latitude, p.longitude]));

  const lines = [];
  if (trackCoords.length > 1) {
    const pathD = trackCoords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
    lines.push(
      `<path d="${pathD}" fill="none" stroke="#3D7A5C" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" opacity="0.25"/>`,
      `<path d="${pathD}" fill="none" stroke="#6BCF8E" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`
    );
  } else if (trackCoords.length === 1) {
    const [x, y] = trackCoords[0];
    lines.push(`<circle cx="${x}" cy="${y}" r="6" fill="#6BCF8E"/>`);
  }

  const markers = discoveryPoints
    .map((d) => {
      const [x, y] = toXY([d.latitude, d.longitude]);
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" fill="#E07A3A" stroke="#F5F2EB" stroke-width="2"/>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="auto" role="img" aria-label="track">
    <rect width="100%" height="100%" fill="#1B3D2F" rx="12"/>
    ${lines.join("")}
    ${markers}
  </svg>`;
}

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatJournalDate(iso, locale) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function formatDistance(km, t) {
  if (km == null) return t("themes.randos.distance_unknown");
  if (km < 1) {
    return t("themes.randos.distance_m", { m: Math.max(1, Math.round(km * 1000)) });
  }
  return t("themes.randos.distance_km", { km });
}

function discoveryAnalysisHtml(d, getTypeLabel, getRarityLabel) {
  const parts = [];
  if (d.type) {
    parts.push(`<span class="chip">${escapeHtml(getTypeLabel(d.type))}</span>`);
  }
  if (d.rarete && (d.rarete === "rare" || d.rarete === "tres_rare")) {
    parts.push(`<span class="chip chip-rare">${escapeHtml(getRarityLabel(d.rarete))}</span>`);
  }
  const blocks = [];
  if (parts.length) blocks.push(`<div class="chips">${parts.join("")}</div>`);
  if (d.description) {
    blocks.push(`<p class="desc">${escapeHtml(d.description)}</p>`);
  }
  if (d.habitat) {
    blocks.push(`<p class="meta">${escapeHtml(d.habitat)}</p>`);
  }
  if (d.fun_fact) {
    blocks.push(`<p class="meta fun-fact">💡 ${escapeHtml(d.fun_fact)}</p>`);
  }
  if (d.anecdotes) {
    blocks.push(`<p class="meta">${escapeHtml(d.anecdotes)}</p>`);
  }
  return blocks.join("");
}

export function buildJournalHtml({
  album,
  items,
  discoveries,
  t,
  locale,
  getTypeLabel,
  getRarityLabel,
}) {
  const name = getAlbumDisplayName(album);
  const dateIso = album.endedAt || album.createdAt;
  const place = getRandoPlaceName(album, discoveries);
  const distanceKm = computeRandoDistanceKm(album, discoveries);
  const track = album.gpsTrack || [];
  const mapSvg = buildTrackSvg(track, items);
  const count = items.length;

  const discoveryBlocks = items
    .map((d, i) => {
      const time = d.discoveredAt
        ? new Date(d.discoveredAt).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })
        : "";
      return `<article class="discovery">
        <div class="discovery-num">${i + 1}</div>
        <div class="discovery-body">
          ${d.photo ? `<img src="${escapeHtml(d.photo)}" alt="" class="discovery-photo"/>` : ""}
          <h3>${escapeHtml(d.nom)}</h3>
          ${d.nom_latin ? `<p class="latin">${escapeHtml(d.nom_latin)}</p>` : ""}
          ${time ? `<p class="time">${escapeHtml(time)}</p>` : ""}
          ${discoveryAnalysisHtml(d, getTypeLabel, getRarityLabel)}
        </div>
      </article>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="${locale?.slice(0, 2) || "fr"}">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${escapeHtml(name)} — ${escapeHtml(t("themes.randos.journal_title"))}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Georgia, "Times New Roman", serif; background: #F5F2EB; color: #1B3D2F; }
    .wrap { max-width: 720px; margin: 0 auto; padding: 2rem 1.5rem 3rem; }
    header { text-align: center; margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 2px solid #3D7A5C; }
    .emoji { font-size: 2.5rem; }
    h1 { margin: 0.5rem 0 0.25rem; font-size: 1.75rem; }
    .date { color: #5a7a68; font-size: 0.95rem; margin: 0; }
    .place { margin: 0.35rem 0 0; font-size: 1rem; }
    .stats { display: flex; flex-wrap: wrap; gap: 1rem; justify-content: center; margin-top: 1rem; font-size: 0.9rem; }
    .stat { background: #e8e4dc; padding: 0.4rem 0.85rem; border-radius: 999px; }
    .map { margin: 1.5rem 0; border-radius: 12px; overflow: hidden; }
    h2 { font-size: 1.15rem; margin: 2rem 0 1rem; color: #2D5A45; }
    .discovery { display: flex; gap: 1rem; margin-bottom: 2rem; page-break-inside: avoid; }
    .discovery-num { flex-shrink: 0; width: 2rem; height: 2rem; border-radius: 50%; background: #3D7A5C; color: #F5F2EB; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.9rem; }
    .discovery-photo { width: 100%; max-width: 280px; border-radius: 10px; margin-bottom: 0.75rem; display: block; }
    .discovery h3 { margin: 0 0 0.2rem; font-size: 1.2rem; }
    .latin { font-style: italic; color: #5a7a68; margin: 0 0 0.5rem; font-size: 0.9rem; }
    .time { font-size: 0.8rem; color: #8a9e92; margin: 0 0 0.5rem; }
    .chips { margin-bottom: 0.5rem; }
    .chip { display: inline-block; background: #3D7A5C; color: #F5F2EB; font-size: 0.75rem; padding: 0.2rem 0.55rem; border-radius: 999px; margin-right: 0.35rem; font-family: system-ui, sans-serif; }
    .chip-rare { background: #E07A3A; }
    .desc { line-height: 1.55; margin: 0.5rem 0 0; font-size: 0.95rem; }
    .meta { font-size: 0.88rem; color: #4a6a58; margin: 0.4rem 0 0; }
    footer { text-align: center; margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid #c5d4cb; font-size: 0.85rem; color: #8a9e92; }
    @media print { body { background: white; } .wrap { padding: 0.5in; } }
  </style>
</head>
<body>
  <div class="wrap">
    <header>
      <div class="emoji">🥾</div>
      <h1>${escapeHtml(name)}</h1>
      <p class="date">${escapeHtml(formatJournalDate(dateIso, locale))}</p>
      ${place ? `<p class="place">📍 ${escapeHtml(place)}</p>` : ""}
      <div class="stats">
        <span class="stat">${escapeHtml(formatDistance(distanceKm, t))}</span>
        <span class="stat">${count} ${escapeHtml(count !== 1 ? t("albums.discoveries_plural") : t("albums.discoveries"))}</span>
      </div>
    </header>
    ${mapSvg ? `<section class="map"><h2>${escapeHtml(t("themes.randos.journal_map_title"))}</h2>${mapSvg}</section>` : ""}
    <section>
      <h2>${escapeHtml(t("themes.randos.journal_discoveries_title"))}</h2>
      ${discoveryBlocks || `<p>${escapeHtml(t("themes.randos.journal_empty_discoveries"))}</p>`}
    </section>
    <footer>${escapeHtml(t("themes.randos.journal_footer"))}</footer>
  </div>
</body>
</html>`;
}

export async function shareRandoJournal(params) {
  const html = buildJournalHtml(params);
  const safeName = getAlbumDisplayName(params.album)
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase() || "rando";
  const file = new File([html], `${safeName}-carnet-wilder.html`, { type: "text/html;charset=utf-8" });
  const shareText = params.t("themes.randos.journal_share_text", {
    name: getAlbumDisplayName(params.album),
    count: params.items.length,
  });

  if (typeof navigator !== "undefined" && navigator.share) {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        title: getAlbumDisplayName(params.album),
        text: shareText,
        files: [file],
      });
      return;
    }
    try {
      await navigator.share({ title: getAlbumDisplayName(params.album), text: shareText });
      return;
    } catch (err) {
      if (err?.name === "AbortError") return;
    }
  }

  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.click();
  URL.revokeObjectURL(url);
}

export function printRandoJournal() {
  if (typeof window !== "undefined") window.print();
}
