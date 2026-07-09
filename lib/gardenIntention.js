export const GARDEN_INTENTION_KEY = "wilder-garden-intention";

export function loadGardenIntention() {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(GARDEN_INTENTION_KEY) || "";
  } catch {
    return "";
  }
}

export function saveGardenIntention(text) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GARDEN_INTENTION_KEY, text ?? "");
  } catch {
    /* quota / private mode */
  }
}
