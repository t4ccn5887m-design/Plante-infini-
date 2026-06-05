const DEFAULT_RADIUS_KM = 15;
const MAX_TRAILS = 8;
const WALKING_SPEED_KMH = 4;

function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function parseLengthKm(tags = {}) {
  const raw = tags.distance || tags["distance:backward"] || tags.length || "";
  const str = String(raw).trim();
  if (!str) return null;

  const kmMatch = str.match(/([\d.]+)\s*km/i);
  if (kmMatch) return Math.round(parseFloat(kmMatch[1]) * 10) / 10;

  const num = parseFloat(str.replace(/[^\d.]/g, ""));
  if (!Number.isFinite(num) || num <= 0) return null;
  if (num > 50) return Math.round((num / 1000) * 10) / 10;
  return Math.round(num * 10) / 10;
}

function estimateDurationMin(lengthKm) {
  if (!lengthKm) return 90;
  return Math.max(20, Math.round((lengthKm / WALKING_SPEED_KMH) * 60));
}

function trailName(tags = {}) {
  return (
    tags.name ||
    tags["name:fr"] ||
    tags.ref ||
    tags["name:en"] ||
    null
  );
}

function normalizeTrail(element, userLat, userLon) {
  const tags = element.tags || {};
  const name = trailName(tags);
  if (!name) return null;

  const center = element.center || {};
  const trailLat = center.lat ?? element.lat;
  const trailLon = center.lon ?? element.lon;
  if (!Number.isFinite(trailLat) || !Number.isFinite(trailLon)) return null;

  const lengthKm = parseLengthKm(tags);
  const distKm = distanceKm(userLat, userLon, trailLat, trailLon);

  return {
    id: `${element.type}/${element.id}`,
    name: String(name).trim(),
    distanceKm: Math.round(distKm * 10) / 10,
    lengthKm,
    durationMin: estimateDurationMin(lengthKm),
    latitude: trailLat,
    longitude: trailLon,
    network: tags.network || null,
    difficulty: tags.difficulty || tags.sac_scale || null,
  };
}

async function reversePlaceName(lat, lon) {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lon));
    url.searchParams.set("format", "json");
    url.searchParams.set("accept-language", "fr");
    url.searchParams.set("zoom", "12");

    const response = await fetch(url.toString(), {
      headers: { "User-Agent": "Wilder/1.0 (nature-discovery-app)" },
    });
    if (!response.ok) return null;

    const data = await response.json();
    const addr = data.address || {};
    const parts = [
      addr.village || addr.town || addr.city || addr.hamlet,
      addr.municipality || addr.county || addr.state,
    ].filter(Boolean);
    return parts.slice(0, 2).join(", ") || null;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);
  const radiusKm = Math.min(
    30,
    Math.max(5, parseFloat(req.query.radiusKm) || DEFAULT_RADIUS_KM)
  );

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return res.status(400).json({ erreur: "Coordonnées invalides" });
  }

  const radiusM = Math.round(radiusKm * 1000);
  const query = `
[out:json][timeout:25];
(
  relation["route"="hiking"](around:${radiusM},${lat},${lon});
  relation["route"="foot"]["name"](around:${radiusM},${lat},${lon});
  way["highway"~"path|footway|track"]["name"]["foot"!="no"](around:${radiusM},${lat},${lon});
);
out center tags;
`;

  try {
    const [overpassRes, placeName] = await Promise.all([
      fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Wilder/1.0 (nature-discovery-app)",
        },
        body: `data=${encodeURIComponent(query)}`,
      }),
      reversePlaceName(lat, lon),
    ]);

    if (!overpassRes.ok) {
      return res.status(502).json({ erreur: "OpenStreetMap indisponible" });
    }

    const data = await overpassRes.json();
    const seen = new Set();
    const trails = (data.elements || [])
      .map((el) => normalizeTrail(el, lat, lon))
      .filter(Boolean)
      .filter((trail) => {
        const key = trail.name.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, MAX_TRAILS);

    res.status(200).json({ trails, placeName });
  } catch (error) {
    console.error("[Wilder] randos-trails error:", error);
    res.status(500).json({ erreur: error.message });
  }
}
