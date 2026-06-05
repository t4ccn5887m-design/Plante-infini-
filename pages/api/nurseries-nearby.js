const DEFAULT_RADIUS_KM = 15;
const MAX_NURSERIES = 12;

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

function formatAddress(tags = {}) {
  const parts = [
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:postcode"],
    tags["addr:city"] || tags["addr:town"] || tags["addr:village"],
  ].filter(Boolean);
  if (parts.length) return parts.join(" ");
  return tags["addr:full"] || null;
}

function nurseryName(tags = {}) {
  return (
    tags.name ||
    tags["name:fr"] ||
    tags.brand ||
    tags.operator ||
    null
  );
}

function normalizeNursery(element, userLat, userLon) {
  const tags = element.tags || {};
  const name = nurseryName(tags);
  if (!name) return null;

  const center = element.center || {};
  const lat = center.lat ?? element.lat;
  const lon = center.lon ?? element.lon;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  const distKm = distanceKm(userLat, userLon, lat, lon);
  const address = formatAddress(tags);

  return {
    id: `${element.type}/${element.id}`,
    name: String(name).trim(),
    distanceKm: Math.round(distKm * 10) / 10,
    address: address ? String(address).trim() : null,
    latitude: lat,
    longitude: lon,
    shop: tags.shop || tags.landuse || null,
  };
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);
  const radiusKm = Math.min(
    25,
    Math.max(3, parseFloat(req.query.radiusKm) || DEFAULT_RADIUS_KM)
  );

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return res.status(400).json({ erreur: "Coordonnées invalides" });
  }

  const radiusM = Math.round(radiusKm * 1000);
  const query = `
[out:json][timeout:25];
(
  node["shop"="garden_centre"](around:${radiusM},${lat},${lon});
  way["shop"="garden_centre"](around:${radiusM},${lat},${lon});
  node["landuse"="nursery"](around:${radiusM},${lat},${lon});
  way["landuse"="nursery"](around:${radiusM},${lat},${lon});
  node["shop"="agrarian"](around:${radiusM},${lat},${lon});
  way["shop"="agrarian"](around:${radiusM},${lat},${lon});
  node["shop"="florist"]["garden:plants"="yes"](around:${radiusM},${lat},${lon});
  way["shop"="florist"]["garden:plants"="yes"](around:${radiusM},${lat},${lon});
);
out center tags;
`;

  try {
    const overpassRes = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Wilder/1.0 (nature-discovery-app)",
      },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!overpassRes.ok) {
      return res.status(502).json({ erreur: "OpenStreetMap indisponible" });
    }

    const data = await overpassRes.json();
    const seen = new Set();
    const nurseries = (data.elements || [])
      .map((el) => normalizeNursery(el, lat, lon))
      .filter(Boolean)
      .filter((n) => {
        const key = n.name.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, MAX_NURSERIES);

    res.status(200).json({ nurseries });
  } catch (error) {
    console.error("[Wilder] nurseries-nearby error:", error);
    res.status(500).json({ erreur: error.message });
  }
}
