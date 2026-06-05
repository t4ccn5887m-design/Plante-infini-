/** Score entretien 0–100 pour un espace vert (scan, arrosage, entretien). */

import {
  daysSince,
  getPlantLastMaintainedAt,
  getPlantLastScannedAt,
  getPlantLastWateredAt,
} from "@/lib/espaceVertPlant";

export function getSpaceDiscoveries(album, discoveries) {
  const ids = new Set(album.discoveryIds || []);
  return discoveries.filter((d) => ids.has(d.id));
}

function plantCareScore(discovery) {
  let score = 0;

  const scanDays = daysSince(getPlantLastScannedAt(discovery));
  if (scanDays != null) {
    if (scanDays <= 7) score += 35;
    else if (scanDays <= 14) score += 25;
    else if (scanDays <= 30) score += 15;
  }

  const waterDays = daysSince(getPlantLastWateredAt(discovery));
  if (waterDays != null) {
    if (waterDays <= 3) score += 35;
    else if (waterDays <= 7) score += 25;
    else if (waterDays <= 14) score += 15;
  }

  const maintainDays = daysSince(getPlantLastMaintainedAt(discovery));
  if (maintainDays != null) {
    if (maintainDays <= 7) score += 30;
    else if (maintainDays <= 14) score += 20;
    else if (maintainDays <= 30) score += 10;
  }

  return Math.min(100, score);
}

export function computeEspaceVertScore(album, discoveries) {
  const items = getSpaceDiscoveries(album, discoveries);
  if (items.length === 0) return 0;

  const total = items.reduce((sum, d) => sum + plantCareScore(d), 0);
  return Math.round(total / items.length);
}

export function getScoreTier(score) {
  if (score >= 75) return "high";
  if (score >= 40) return "mid";
  return "low";
}

export const SPACE_KINDS = ["jardin", "balcon", "terrasse", "cour", "parc"];

export const SPACE_KIND_EMOJI = {
  jardin: "🌳",
  balcon: "🪴",
  terrasse: "☀️",
  cour: "🏡",
  parc: "🌲",
};

export function getSpaceKindEmoji(album) {
  const kind = album?.spaceKind;
  if (kind && SPACE_KIND_EMOJI[kind]) return SPACE_KIND_EMOJI[kind];
  return "🌿";
}
