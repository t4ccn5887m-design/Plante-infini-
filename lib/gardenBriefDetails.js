import { EMPTY_BRIEF_DETAILS, normalizeBriefDetails } from "@/lib/brief/briefDetails";

export const GARDEN_BRIEF_DETAILS_KEY = "wilder-garden-brief-details";

export function loadGardenBriefDetails() {
  if (typeof window === "undefined") return { ...EMPTY_BRIEF_DETAILS };
  try {
    const raw = localStorage.getItem(GARDEN_BRIEF_DETAILS_KEY);
    if (!raw) return { ...EMPTY_BRIEF_DETAILS };
    return normalizeBriefDetails(JSON.parse(raw));
  } catch {
    return { ...EMPTY_BRIEF_DETAILS };
  }
}

export function saveGardenBriefDetails(details) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      GARDEN_BRIEF_DETAILS_KEY,
      JSON.stringify(normalizeBriefDetails(details))
    );
  } catch {
    /* quota */
  }
}

/** True si au moins une sous-section details est renseignée. */
export function hasGardenBriefDetailsContent(details) {
  const d = normalizeBriefDetails(details);
  const h = d.household;
  if (h.children || h.pets.length || h.uses.length) return true;
  if (d.avoid.items.length || d.avoid.other?.trim()) return true;
  const e = d.existing;
  if (e.orientation || e.slope || e.soil || e.keep?.trim() || e.remove?.trim()) return true;
  const u = d.upkeep;
  if (u.who || u.time || u.contract || u.when || u.date_note?.trim() || u.availability.length) {
    return true;
  }
  return false;
}
