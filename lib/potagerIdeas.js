export const POTAGER_IDEAS_CACHE_KEY = "wilder-potager-ideas-cache";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function regionKey(region) {
  return String(region || "").trim().toLowerCase() || "unknown";
}

export function loadIdeasCache() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(POTAGER_IDEAS_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveIdeasCache(entry) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(POTAGER_IDEAS_CACHE_KEY, JSON.stringify(entry));
  } catch {
    /* ignore quota */
  }
}

export function getCachedIdeas(region, lang) {
  const cache = loadIdeasCache();
  if (!cache?.idees?.length) return null;
  if (cache.dateKey === todayKey() && cache.regionKey === regionKey(region) && cache.lang === lang) {
    return cache.idees;
  }
  return null;
}

export async function fetchPotagerIdeas({ region, lang, nurseries }) {
  const cached = getCachedIdeas(region, lang);
  if (cached) return { idees: cached, fromCache: true };

  const res = await fetch("/api/potager-ideas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ region, lang, nurseries }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.erreur || "ideas_fetch_failed");
  }

  const idees = Array.isArray(data.idees) ? data.idees : [];
  saveIdeasCache({
    dateKey: todayKey(),
    regionKey: regionKey(region),
    lang,
    idees,
  });

  return { idees, fromCache: false };
}
