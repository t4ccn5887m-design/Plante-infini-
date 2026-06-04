const LOCAL_POSTS_KEY = "wilder-potager-community-posts";
const DEFAULT_RADIUS_KM = 25;
const MAX_POST_AGE_DAYS = 14;

export function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function loadLocalPosts() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_POSTS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function saveLocalPosts(posts) {
  if (typeof window === "undefined") return { ok: false };
  try {
    localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify(posts.slice(0, 40)));
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

function mergeNearbyPosts(remote, local, lat, lon, radiusKm) {
  const cutoff = Date.now() - MAX_POST_AGE_DAYS * 86_400_000;
  const seen = new Set();
  const merged = [];

  for (const post of [...remote, ...local]) {
    const id = post.id;
    if (!id || seen.has(id)) continue;
    seen.add(id);
    if (new Date(post.createdAt).getTime() < cutoff) continue;
    if (post.latitude == null || post.longitude == null) continue;
    const dist = distanceKm(lat, lon, post.latitude, post.longitude);
    if (dist > radiusKm) continue;
    merged.push({ ...post, distanceKm: Math.round(dist * 10) / 10 });
  }

  merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return merged;
}

export async function fetchNearbyPotagerPosts(location, radiusKm = DEFAULT_RADIUS_KM) {
  if (!location?.latitude || !location?.longitude) {
    return { posts: [], needsLocation: true };
  }

  const { latitude, longitude } = location;
  let remote = [];
  let serverOk = true;

  try {
    const params = new URLSearchParams({
      lat: String(latitude),
      lon: String(longitude),
      radiusKm: String(radiusKm),
    });
    const res = await fetch(`/api/potager-community?${params}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      serverOk = false;
    } else {
      remote = Array.isArray(data.posts) ? data.posts : [];
    }
  } catch {
    serverOk = false;
  }

  const local = loadLocalPosts();
  const posts = mergeNearbyPosts(remote, local, latitude, longitude, radiusKm);

  return {
    posts,
    needsLocation: false,
    offline: !serverOk,
  };
}

export async function createPotagerCommunityPost(payload) {
  const {
    kind,
    comment = "",
    photo = null,
    plants = [],
    latitude,
    longitude,
    placeName = null,
  } = payload;

  const record = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    kind,
    comment: String(comment || "").trim(),
    photo: photo || null,
    plants: Array.isArray(plants) ? plants : [],
    latitude,
    longitude,
    placeName,
    createdAt: new Date().toISOString(),
    isLocal: true,
  };

  try {
    const res = await fetch("/api/potager-community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind,
        comment: record.comment,
        photo: record.photo,
        plants: record.plants,
        latitude,
        longitude,
        placeName,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.post) {
      const posts = loadLocalPosts();
      saveLocalPosts([data.post, ...posts.filter((p) => p.id !== data.post.id)]);
      return { ok: true, post: data.post, shared: true };
    }
  } catch {
    /* fall through to local */
  }

  const posts = loadLocalPosts();
  saveLocalPosts([record, ...posts]);
  return { ok: true, post: record, shared: false };
}
