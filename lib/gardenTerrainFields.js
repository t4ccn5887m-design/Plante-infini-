export const GARDEN_TERRAIN_FIELDS_KEY = "wilder-garden-terrain-fields";

const EMPTY = {
  areaRange: null,
  timeline: null,
  utilities: null,
};

export function loadGardenTerrainFields() {
  if (typeof window === "undefined") return { ...EMPTY };
  try {
    const raw = localStorage.getItem(GARDEN_TERRAIN_FIELDS_KEY);
    if (!raw) return { ...EMPTY };
    const data = JSON.parse(raw);
    return {
      areaRange: data.areaRange || null,
      timeline: data.timeline || null,
      utilities: data.utilities || null,
    };
  } catch {
    return { ...EMPTY };
  }
}

export function saveGardenTerrainFields(fields) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      GARDEN_TERRAIN_FIELDS_KEY,
      JSON.stringify({
        areaRange: fields.areaRange || null,
        timeline: fields.timeline || null,
        utilities: fields.utilities || null,
      })
    );
  } catch {
    /* quota */
  }
}
