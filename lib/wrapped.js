import { computeStats } from "./stats";
import { BADGE_DEFS, isBadgeUnlocked } from "./badges";
import { computeTrackDistanceKm } from "./randos";

export function getWrappedYear(date = new Date()) {
  return date.getFullYear();
}

function inYear(iso, year) {
  if (!iso) return false;
  try {
    return new Date(iso).getFullYear() === year;
  } catch {
    return false;
  }
}

export function computeWrapped(discoveries, albums, year = getWrappedYear()) {
  const yearDiscoveries = discoveries.filter((d) => inYear(d.discoveredAt, year));
  const stats = computeStats(yearDiscoveries);
  const badgesUnlocked = BADGE_DEFS.filter((b) => isBadgeUnlocked(yearDiscoveries, b));

  const randoKm = albums
    .filter((a) => a.theme === "randos" && inYear(a.createdAt, year))
    .reduce((sum, album) => {
      const track = album.gpsTrack || [];
      return sum + (track.length ? computeTrackDistanceKm(track) : 0);
    }, 0);

  const topSpecies = Object.entries(
    yearDiscoveries.reduce((acc, d) => {
      const key = (d.nom || "—").toLowerCase();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => yearDiscoveries.find((d) => (d.nom || "—").toLowerCase() === name)?.nom || name);

  const monthsActive = new Set(
    yearDiscoveries.map((d) => {
      const dt = new Date(d.discoveredAt);
      return `${dt.getFullYear()}-${dt.getMonth()}`;
    })
  ).size;

  return {
    year,
    total: stats.total,
    uniqueSpecies: stats.uniqueSpecies,
    rareCount: stats.rareCount,
    favoriteType: stats.favoriteType,
    countriesCount: stats.countriesCount,
    randoKm: Math.round(randoKm * 10) / 10,
    badgesUnlocked: badgesUnlocked.length,
    topSpecies,
    monthsActive,
    hasData: yearDiscoveries.length > 0,
  };
}
