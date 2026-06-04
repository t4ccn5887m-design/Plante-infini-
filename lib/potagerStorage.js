export const POTAGER_PLANTS_KEY = "wilder-potager-plants";
export const POTAGER_BED_COUNT = 6;

export function loadPotagerPlants() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(POTAGER_PLANTS_KEY);
    const items = JSON.parse(raw || "[]");
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

export function savePotagerPlants(items) {
  if (typeof window === "undefined") return { ok: false };
  try {
    localStorage.setItem(POTAGER_PLANTS_KEY, JSON.stringify(items));
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
