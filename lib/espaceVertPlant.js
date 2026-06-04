import { HEALTH, inferHealthFromEtatSante } from "@/lib/potagerHealth";

export function getPlantPlantedAt(discovery) {
  return discovery?.plantedAt || discovery?.discoveredAt || null;
}

export function getPlantLastWateredAt(discovery) {
  return discovery?.lastWateredAt || null;
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
