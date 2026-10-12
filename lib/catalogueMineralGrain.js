const STORAGE_KEY = "wilder-mineral-grain-v1";

export const MINERAL_GRAIN_OPTIONS = [
  { id: "fin", label: "Fin", range: "4–8 mm", pdfSuffix: "fin 4–8 mm" },
  { id: "moyen", label: "Moyen", range: "8–16 mm", pdfSuffix: "moyen 8–16 mm" },
  { id: "gros", label: "Gros", range: "16–32 mm", pdfSuffix: "gros 16–32 mm" },
];

function readStore() {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStore(store) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

export function loadMineralGrainChoice(mineralId) {
  if (!mineralId) return null;
  const choice = readStore()[mineralId];
  return MINERAL_GRAIN_OPTIONS.some((o) => o.id === choice) ? choice : null;
}

export function saveMineralGrainChoice(mineralId, grainId) {
  if (!mineralId) return;
  const store = readStore();
  if (!grainId) {
    delete store[mineralId];
  } else {
    store[mineralId] = grainId;
  }
  writeStore(store);
}

export function mineralGrainPdfSuffix(grainId) {
  const opt = MINERAL_GRAIN_OPTIONS.find((o) => o.id === grainId);
  return opt?.pdfSuffix || null;
}

/** Nom affiché / PDF pour un paillage avec taille de grains optionnelle. */
export function formatMineralCoupsDisplayName(nom, grainId) {
  const base = (nom || "").trim();
  if (!base) return "—";
  const suffix = mineralGrainPdfSuffix(grainId);
  return suffix ? `${base} · ${suffix}` : base;
}
