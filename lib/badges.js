import { HERITAGE_TYPES, MONUMENT_TYPES } from "./categories";

export const BADGE_DEFS = [
  { id: "first_step", icon: "🌱", kind: "count", target: 1 },
  { id: "explorer", icon: "🥾", kind: "count", target: 10 },
  { id: "naturalist", icon: "🔬", kind: "count", target: 50 },
  { id: "legend", icon: "👑", kind: "count", target: 100 },
  {
    id: "botanist",
    icon: "🌿",
    kind: "category",
    target: 10,
    types: ["plante", "fleur", "arbre", "fruit", "legume"],
  },
  { id: "ornithologist", icon: "🦅", kind: "category", target: 10, types: ["oiseau"] },
  { id: "entomologist", icon: "🐛", kind: "category", target: 10, types: ["insecte", "papillon"] },
  { id: "patrimoine", icon: "🏛️", kind: "category", target: 10, types: HERITAGE_TYPES },
  { id: "aventurier", icon: "🏰", kind: "category", target: 10, types: MONUMENT_TYPES },
];

const SEEN_KEY = "wilder-badges-seen";

export function getBadgeProgress(discoveries, badge) {
  if (badge.kind === "count") {
    return { current: discoveries.length, target: badge.target };
  }
  const current = discoveries.filter((d) => badge.types.includes(d.type || "plante")).length;
  return { current, target: badge.target };
}

export function isBadgeUnlocked(discoveries, badge) {
  const { current, target } = getBadgeProgress(discoveries, badge);
  return current >= target;
}

export function computeUnlockedBadgeIds(discoveries) {
  return BADGE_DEFS.filter((b) => isBadgeUnlocked(discoveries, b)).map((b) => b.id);
}

export function loadSeenBadges() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveSeenBadges(ids) {
  localStorage.setItem(SEEN_KEY, JSON.stringify(ids));
}

export function getNewBadgeIds(discoveries, previouslySeen) {
  const unlocked = computeUnlockedBadgeIds(discoveries);
  return unlocked.filter((id) => !previouslySeen.includes(id));
}

/** Prochain trophée non débloqué avec la meilleure progression relative. */
export function getNextBadge(discoveries) {
  let best = null;
  let bestRatio = -1;

  for (const badge of BADGE_DEFS) {
    if (isBadgeUnlocked(discoveries, badge)) continue;
    const { current, target } = getBadgeProgress(discoveries, badge);
    const ratio = target > 0 ? current / target : 0;
    if (ratio > bestRatio) {
      bestRatio = ratio;
      best = { badge, current, target, ratio };
    }
  }
  return best;
}
