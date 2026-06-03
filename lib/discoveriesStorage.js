import { normalizeAlbums } from "./themes";

export const ALBUMS_KEY = "wilder-albums";

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
