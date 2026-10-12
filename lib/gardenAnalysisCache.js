const CACHE_KEY = "wilder-garden-analysis-v1";

export function loadGardenAnalysisCache() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.hash || !data?.analysis) return null;
    return data;
  } catch {
    return null;
  }
}

export function saveGardenAnalysisCache(hash, analysis) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        hash,
        analysis,
        savedAt: new Date().toISOString(),
      })
    );
  } catch {
    /* quota */
  }
}

export function clearGardenAnalysisCache() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    /* ignore */
  }
}
