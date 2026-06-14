import { compressDataUrl } from "@/lib/compressImage";
import { isPermanentAuthUser } from "@/lib/authUser";
import { getCloudSession } from "@/lib/cloudSync";
import { buildScanQuotaHeaders } from "@/lib/scanQuotaClient";
import {
  computeRandoDistanceKm,
  distanceKm as haversineKm,
} from "@/lib/randos";
import {
  getAlbumDisplayName,
  getRandoJournalDiscoveries,
  getRandoPlaceName,
} from "@/lib/randoJournal";

const LOCAL_JOURNALS_KEY = "wilder-rando-community-journals";
const VOTER_ID_KEY = "wilder-rando-community-voter-id";
const AUTHOR_NAME_KEY = "wilder-rando-community-author";
const DEFAULT_RADIUS_KM = 80;
const MAX_JOURNAL_AGE_DAYS = 60;
const MAX_TRACK_POINTS = 120;

export { haversineKm as distanceKm };

function loadLocalJournals() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_JOURNALS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function saveLocalJournals(list) {
  if (typeof window === "undefined") return { ok: false };
  try {
    localStorage.setItem(LOCAL_JOURNALS_KEY, JSON.stringify(list.slice(0, 30)));
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export function getCommunityVoterId() {
  if (typeof window === "undefined") return "server";
  try {
    let id = localStorage.getItem(VOTER_ID_KEY);
    if (!id) {
      id = `v-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      localStorage.setItem(VOTER_ID_KEY, id);
    }
    return id;
  } catch {
    return `v-${Date.now()}`;
  }
}

export function getCommunityAuthorName() {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(AUTHOR_NAME_KEY) || "";
  } catch {
    return "";
  }
}

export function setCommunityAuthorName(name) {
  if (typeof window === "undefined") return;
  try {
    const trimmed = String(name || "").trim().slice(0, 40);
    if (trimmed) localStorage.setItem(AUTHOR_NAME_KEY, trimmed);
    else localStorage.removeItem(AUTHOR_NAME_KEY);
  } catch {
    /* ignore */
  }
}

function downsampleTrack(track) {
  if (!Array.isArray(track) || track.length <= MAX_TRACK_POINTS) return track || [];
  const out = [];
  const step = (track.length - 1) / (MAX_TRACK_POINTS - 1);
  for (let i = 0; i < MAX_TRACK_POINTS; i++) {
    out.push(track[Math.min(track.length - 1, Math.round(i * step))]);
  }
  return out;
}

function centerFromAlbum(album, discoveries) {
  const track = album?.gpsTrack || [];
  for (const p of track) {
    if (p?.latitude != null && p?.longitude != null) {
      return { latitude: p.latitude, longitude: p.longitude };
    }
  }
  for (const d of discoveries) {
    if (d?.latitude != null && d?.longitude != null) {
      return { latitude: d.latitude, longitude: d.longitude };
    }
  }
  return null;
}

async function serializeDiscovery(d, index) {
  let photo = d.photo || null;
  if (photo?.startsWith("data:image")) {
    photo = await compressDataUrl(photo, 480, 0.5);
  }
  return {
    key: d.id || `d-${index}`,
    nom: d.nom || "Découverte",
    nom_latin: d.nom_latin || null,
    photo,
    type: d.type || null,
    rarete: d.rarete || null,
    description: d.description ? String(d.description).slice(0, 800) : null,
    habitat: d.habitat ? String(d.habitat).slice(0, 300) : null,
    fun_fact: d.fun_fact ? String(d.fun_fact).slice(0, 400) : null,
    anecdotes: d.anecdotes ? String(d.anecdotes).slice(0, 400) : null,
    latitude: d.latitude ?? null,
    longitude: d.longitude ?? null,
    discoveredAt: d.discoveredAt || null,
  };
}

export async function buildSharePayload(album, allDiscoveries) {
  const items = getRandoJournalDiscoveries(album, allDiscoveries);
  const discoveries = await Promise.all(items.map((d, i) => serializeDiscovery(d, i)));
  let coverPhoto = album.coverPhoto || discoveries.find((d) => d.photo)?.photo || null;
  if (coverPhoto?.startsWith("data:image")) {
    coverPhoto = await compressDataUrl(coverPhoto, 560, 0.52);
  }

  const center = centerFromAlbum(album, items);
  if (!center) return { error: "no_location" };

  return {
    localAlbumId: album.id,
    name: getAlbumDisplayName(album),
    placeName: getRandoPlaceName(album, allDiscoveries),
    distanceKm: computeRandoDistanceKm(album, allDiscoveries),
    discoveryCount: discoveries.length,
    coverPhoto,
    latitude: center.latitude,
    longitude: center.longitude,
    endedAt: album.endedAt || album.createdAt || new Date().toISOString(),
    payload: {
      gpsTrack: downsampleTrack(album.gpsTrack || []),
      discoveries,
    },
  };
}

function mergeJournals(remote, local, lat, lon, radiusKm) {
  const cutoff = Date.now() - MAX_JOURNAL_AGE_DAYS * 86_400_000;
  const seen = new Set();
  const merged = [];

  for (const j of [...remote, ...local]) {
    if (!j?.id || seen.has(j.id)) continue;
    seen.add(j.id);
    if (new Date(j.createdAt || j.endedAt).getTime() < cutoff) continue;
    if (j.latitude == null || j.longitude == null) continue;
    const dist = haversineKm(lat, lon, j.latitude, j.longitude);
    if (dist > radiusKm) continue;
    merged.push({ ...j, distanceKm: Math.round(dist * 10) / 10 });
  }

  merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return merged;
}

export async function fetchCommunityJournals(location, radiusKm = DEFAULT_RADIUS_KM) {
  if (!location?.latitude || !location?.longitude) {
    return { journals: [], needsLocation: true };
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
    const res = await fetch(`/api/rando-community?${params}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) serverOk = false;
    else remote = Array.isArray(data.journals) ? data.journals : [];
  } catch {
    serverOk = false;
  }

  const local = loadLocalJournals();
  const journals = mergeJournals(remote, local, latitude, longitude, radiusKm);

  return { journals, needsLocation: false, offline: !serverOk };
}

export async function fetchCommunityJournalDetail(journalId) {
  let voterId = getCommunityVoterId();
  try {
    const session = await getCloudSession();
    if (isPermanentAuthUser(session?.user)) {
      voterId = session.user.id;
    }
  } catch {
    /* ignore */
  }

  try {
    const headers = await buildScanQuotaHeaders();
    delete headers["Content-Type"];
    const params = new URLSearchParams({ journalId, voterId });
    const res = await fetch(`/api/rando-community?${params}`, { headers });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.journal) return { journal: data.journal, offline: false };
  } catch {
    /* local fallback */
  }

  const local = loadLocalJournals().find((j) => j.id === journalId);
  if (local) {
    return {
      journal: {
        ...local,
        comments: local.comments || [],
        likeCounts: local.likeCounts || {},
        likedByMe: local.likedByMe || {},
      },
      offline: true,
    };
  }
  return { journal: null, offline: true };
}

export async function shareJournalToCommunity(payload, authorName) {
  const author = String(authorName || getCommunityAuthorName() || "").trim().slice(0, 40);

  try {
    const headers = await buildScanQuotaHeaders();
    const res = await fetch("/api/rando-community", {
      method: "POST",
      headers,
      body: JSON.stringify({ action: "share", authorName: author, journal: payload }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.journal) {
      const list = loadLocalJournals();
      saveLocalJournals([data.journal, ...list.filter((j) => j.id !== data.journal.id)]);
      if (author) setCommunityAuthorName(author);
      return { ok: true, journal: data.journal, shared: true };
    }
  } catch {
    /* local */
  }

  const record = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    ...payload,
    authorName: author || "Randonneur·euse",
    createdAt: new Date().toISOString(),
    isLocal: true,
    comments: [],
    likeCounts: {},
    likedByMe: {},
  };
  const list = loadLocalJournals();
  saveLocalJournals([record, ...list]);
  if (author) setCommunityAuthorName(author);
  return { ok: true, journal: record, shared: false };
}

function patchLocalJournal(journalId, patcher) {
  const list = loadLocalJournals();
  const idx = list.findIndex((j) => j.id === journalId);
  if (idx === -1) return null;
  list[idx] = patcher(list[idx]);
  saveLocalJournals(list);
  return list[idx];
}

export async function postCommunityComment(journalId, authorName, body) {
  const text = String(body || "").trim().slice(0, 500);
  if (!text) return { ok: false };

  const author = String(authorName || getCommunityAuthorName() || "").trim().slice(0, 40);

  try {
    const headers = await buildScanQuotaHeaders();
    const res = await fetch("/api/rando-community", {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "comment",
        journalId,
        authorName: author,
        body: text,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.comment) {
      if (author) setCommunityAuthorName(author);
      return { ok: true, comment: data.comment };
    }
  } catch {
    /* local */
  }

  const comment = {
    id: `lc-${Date.now()}`,
    authorName: author || "Randonneur·euse",
    body: text,
    createdAt: new Date().toISOString(),
  };
  const updated = patchLocalJournal(journalId, (j) => ({
    ...j,
    comments: [...(j.comments || []), comment],
  }));
  if (!updated) return { ok: false };
  if (author) setCommunityAuthorName(author);
  return { ok: true, comment, local: true };
}

export async function toggleDiscoveryLike(journalId, discoveryKey) {
  try {
    const headers = await buildScanQuotaHeaders();
    const res = await fetch("/api/rando-community", {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "like",
        journalId,
        discoveryKey,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.likeCounts) {
      return {
        ok: true,
        likeCounts: data.likeCounts,
        likedByMe: data.likedByMe,
      };
    }
  } catch {
    /* local */
  }

  const updated = patchLocalJournal(journalId, (j) => {
    const likedByMe = { ...(j.likedByMe || {}) };
    const likeCounts = { ...(j.likeCounts || {}) };
    const key = discoveryKey;
    if (likedByMe[key]) {
      delete likedByMe[key];
      likeCounts[key] = Math.max(0, (likeCounts[key] || 1) - 1);
    } else {
      likedByMe[key] = true;
      likeCounts[key] = (likeCounts[key] || 0) + 1;
    }
    return { ...j, likedByMe, likeCounts };
  });

  if (!updated) return { ok: false };
  return {
    ok: true,
    likeCounts: updated.likeCounts,
    likedByMe: updated.likedByMe,
    local: true,
  };
}

export function canShareAlbum(album) {
  if (!album) return false;
  const hasTrack = (album.gpsTrack || []).some(
    (p) => p?.latitude != null && p?.longitude != null
  );
  const hasDiscoveries = (album.discoveryIds || []).length > 0;
  return hasTrack || hasDiscoveries;
}
