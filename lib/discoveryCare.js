export const CARE_SCAN = "scan";

const CARE_WATER = "water";
const CARE_MAINTAIN = "maintain";

export function applyCareToDiscovery(discovery, careType, now = new Date().toISOString()) {
  if (!discovery) return discovery;
  if (careType === CARE_SCAN) {
    return { ...discovery, lastScannedAt: now };
  }
  if (careType === CARE_WATER) {
    return { ...discovery, lastWateredAt: now };
  }
  if (careType === CARE_MAINTAIN) {
    return { ...discovery, lastMaintainedAt: now };
  }
  return discovery;
}
