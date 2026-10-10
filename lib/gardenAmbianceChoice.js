export const GARDEN_AMBIANCE_CHOICE_KEY = "wilder-garden-ambiance";

export function loadGardenAmbianceChoice() {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(GARDEN_AMBIANCE_CHOICE_KEY) || "";
  } catch {
    return "";
  }
}

export function saveGardenAmbianceChoice(name) {
  if (typeof window === "undefined") return;
  try {
    if (!name) localStorage.removeItem(GARDEN_AMBIANCE_CHOICE_KEY);
    else localStorage.setItem(GARDEN_AMBIANCE_CHOICE_KEY, name);
  } catch {
    /* quota / private mode */
  }
}
