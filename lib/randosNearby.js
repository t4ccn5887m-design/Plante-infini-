export const RANDOS_NEARBY_CACHE_KEY = "wilder-randos-nearby-cache";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function locationCacheKey(location) {
  if (!location) return "";
  const lat = Math.round(location.latitude * 100) / 100;
  const lon = Math.round(location.longitude * 100) / 100;
  return `${lat},${lon}`;
}

export function loadNearbyCache() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(RANDOS_NEARBY_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveNearbyCache(entry) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(RANDOS_NEARBY_CACHE_KEY, JSON.stringify(entry));
  } catch {
    /* ignore quota */
  }
}

export function getCachedNearbyTrails(location, lang) {
  const cache = loadNearbyCache();
  if (!cache?.trails?.length) return null;
  const key = locationCacheKey(location);
  if (cache.dateKey === todayKey() && cache.locationKey === key && cache.lang === lang) {
    return cache;
  }
  return null;
}

export async function fetchNearbyTrails(location, { radiusKm = 15 } = {}) {
  const params = new URLSearchParams({
    lat: String(location.latitude),
    lon: String(location.longitude),
    radiusKm: String(radiusKm),
  });
  const res = await fetch(`/api/randos-trails?${params}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.erreur || "trails_fetch_failed");
  }
  return {
    trails: Array.isArray(data.trails) ? data.trails : [],
    placeName: data.placeName || null,
  };
}

export async function fetchTrailDescriptions(trails, { lang, placeName, month }) {
  const res = await fetch("/api/randos-trail-descriptions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      trails: trails.map((t) => ({
        id: t.id,
        name: t.name,
        lengthKm: t.lengthKm,
        durationMin: t.durationMin,
      })),
      lang,
      placeName,
      month,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.erreur || "descriptions_fetch_failed");
  }
  const sentiers = Array.isArray(data.sentiers) ? data.sentiers : [];
  const byId = new Map(sentiers.map((s) => [s.id, s]));
  return trails.map((trail) => {
    const extra = byId.get(trail.id) || {};
    return {
      ...trail,
      emoji: extra.emoji || "🥾",
      description: extra.description || null,
      conseil: extra.conseil || null,
    };
  });
}

export async function loadNearbyTrailsWithDescriptions(location, lang) {
  const cached = getCachedNearbyTrails(location, lang);
  if (cached) {
    return { trails: cached.trails, placeName: cached.placeName, fromCache: true };
  }

  const { trails, placeName } = await fetchNearbyTrails(location);
  if (!trails.length) {
    return { trails: [], placeName, fromCache: false };
  }

  const enriched = await fetchTrailDescriptions(trails, {
    lang,
    placeName,
    month: new Date().getMonth(),
  });

  saveNearbyCache({
    dateKey: todayKey(),
    locationKey: locationCacheKey(location),
    lang,
    placeName,
    trails: enriched,
  });

  return { trails: enriched, placeName, fromCache: false };
}
