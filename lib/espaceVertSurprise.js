import { getRootAlbums } from "@/lib/themes";
import { localDayKey } from "@/lib/potagerEngagement";
import {
  daysSince,
  getPlantHealth,
  getPlantLastMaintainedAt,
  getPlantLastScannedAt,
  getPlantLastWateredAt,
} from "@/lib/espaceVertPlant";
import { HEALTH } from "@/lib/potagerHealth";

export function getSeason(monthIndex) {
  if (monthIndex >= 2 && monthIndex <= 4) return "spring";
  if (monthIndex >= 5 && monthIndex <= 7) return "summer";
  if (monthIndex >= 8 && monthIndex <= 10) return "autumn";
  return "winter";
}

export function getAllJardinPlants(albums, discoveries) {
  const ids = new Set();
  for (const album of getRootAlbums(albums, "jardin")) {
    for (const id of album.discoveryIds || []) ids.add(id);
  }
  return discoveries.filter((d) => ids.has(d.id));
}

function stableIndex(key, length) {
  if (length <= 0) return 0;
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return Math.abs(h) % length;
}

function pickFeaturedPlant(plants, date = new Date()) {
  if (!plants.length) return null;
  const key = localDayKey(date);
  return plants[stableIndex(key, plants.length)];
}

/**
 * Conseil matinal personnalisé (saison + plantes de l'utilisateur).
 * @returns {{ title: string, body: string, plantName?: string }}
 */
export function buildDailySurprise(plants, t, date = new Date()) {
  const title = t("themes.jardin.surprise_title");
  const season = getSeason(date.getMonth());
  const featured = pickFeaturedPlant(plants, date);

  if (!plants.length) {
    return {
      title,
      body: t(`themes.jardin.surprise_empty_${season}`),
    };
  }

  const plantName = featured?.nom || t("themes.jardin.surprise_plant_fallback");

  const needsWater = plants.some((d) => {
    const w = daysSince(getPlantLastWateredAt(d));
    return w == null || w >= 5;
  });

  const needsMaintain = plants.some((d) => {
    const m = daysSince(getPlantLastMaintainedAt(d));
    const s = daysSince(getPlantLastScannedAt(d));
    return (m == null || m >= 10) && s != null && s <= 21;
  });

  const stressed = plants.some((d) => {
    const h = getPlantHealth(d);
    return h === HEALTH.warning || h === HEALTH.critical;
  });

  if (stressed && featured) {
    return {
      title,
      body: t("themes.jardin.surprise_stressed", { plant: plantName }),
      plantName,
    };
  }

  if (needsWater && featured) {
    return {
      title,
      body: t("themes.jardin.surprise_water_needed", { plant: plantName }),
      plantName,
    };
  }

  if (needsMaintain && featured) {
    return {
      title,
      body: t("themes.jardin.surprise_maintain", { plant: plantName }),
      plantName,
    };
  }

  return {
    title,
    body: t(`themes.jardin.surprise_${season}`, { plant: plantName }),
    plantName,
  };
}
