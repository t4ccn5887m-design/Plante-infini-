import { normalizeAlbums } from "./themes";

export const DISCOVERIES_KEY = "wilder-discoveries";
export const ALBUMS_KEY = "wilder-albums";

export function loadDiscoveries() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DISCOVERIES_KEY);
    const items = JSON.parse(raw || "[]");
    console.log("[Wilder] loadDiscoveries:", items.length, "découverte(s)");
    return Array.isArray(items) ? items : [];
  } catch (e) {
    console.error("[Wilder] loadDiscoveries échoué:", e);
    return [];
  }
}

export function saveDiscoveries(items) {
  if (typeof window === "undefined") return { ok: false, error: "ssr" };
  try {
    const json = JSON.stringify(items);
    localStorage.setItem(DISCOVERIES_KEY, json);
    const verify = localStorage.getItem(DISCOVERIES_KEY);
    const parsed = verify ? JSON.parse(verify) : [];
    console.log("[Wilder] saveDiscoveries:", {
      count: items.length,
      bytes: json.length,
      verified: parsed.length,
    });
    if (parsed.length !== items.length) {
      console.warn("[Wilder] saveDiscoveries: vérification incohérente");
      return { ok: false, error: "verify_mismatch" };
    }
    return { ok: true };
  } catch (e) {
    console.error("[Wilder] saveDiscoveries échoué:", e.name, e.message, {
      count: items.length,
    });
    return { ok: false, error: e.name || "unknown" };
  }
}

export function loadAlbums() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ALBUMS_KEY);
    const items = JSON.parse(raw || "[]");
    const normalized = normalizeAlbums(Array.isArray(items) ? items : []);
    console.log("[Wilder] loadAlbums:", normalized.length, "album(s)");
    return normalized;
  } catch (e) {
    console.error("[Wilder] loadAlbums échoué:", e);
    return [];
  }
}

export function saveAlbums(items) {
  if (typeof window === "undefined") return { ok: false, error: "ssr" };
  try {
    const json = JSON.stringify(items);
    localStorage.setItem(ALBUMS_KEY, json);
    console.log("[Wilder] saveAlbums:", { count: items.length, bytes: json.length });
    return { ok: true };
  } catch (e) {
    console.error("[Wilder] saveAlbums échoué:", e.name, e.message);
    return { ok: false, error: e.name || "unknown" };
  }
}
