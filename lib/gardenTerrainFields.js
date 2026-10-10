export const GARDEN_TERRAIN_FIELDS_KEY = "wilder-garden-terrain-fields";
export const GARDEN_TERRAIN_STEP_KEY = "wilder-garden-terrain-step-validated";

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

export function isGardenTerrainStepValidated() {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(GARDEN_TERRAIN_STEP_KEY) === "1";
  } catch {
    return false;
  }
}

export function setGardenTerrainStepValidated(valid) {
  if (typeof window === "undefined") return;
  try {
    if (valid) localStorage.setItem(GARDEN_TERRAIN_STEP_KEY, "1");
    else localStorage.removeItem(GARDEN_TERRAIN_STEP_KEY);
  } catch {
    /* ignore */
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
