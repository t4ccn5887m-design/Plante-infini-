import { HEALTH, inferHealthFromEtatSante } from "@/lib/potagerHealth";

export const CARE_SCAN = "scan";
export const CARE_WATER = "water";
export const CARE_MAINTAIN = "maintain";

export function getPlantPlantedAt(discovery) {
  return discovery?.plantedAt || discovery?.discoveredAt || null;
}

export function getPlantLastScannedAt(discovery) {
  return discovery?.lastScannedAt || discovery?.discoveredAt || null;
}

export function getPlantLastWateredAt(discovery) {
  return discovery?.lastWateredAt || null;
}

export function getPlantLastMaintainedAt(discovery) {
  return discovery?.lastMaintainedAt || null;
}

export function daysSince(iso) {
  if (!iso) return null;
  try {
    return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  } catch {
    return null;
  }
}

export function getPlantHealth(discovery) {
  if (
    discovery?.health === HEALTH.good ||
    discovery?.health === HEALTH.warning ||
    discovery?.health === HEALTH.critical
  ) {
    return discovery.health;
  }
  return inferHealthFromEtatSante(discovery?.etat_sante);
}

export function formatPlantDate(iso, locale) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

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
