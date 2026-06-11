const WILD_SPECIES_GOAL = 50;
const BIODEX_TYPE_COUNT = 11;

export function getTimePeriod(hour = new Date().getHours()) {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 22) return "evening";
  return "night";
}

export function getSeason(month = new Date().getMonth()) {
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "autumn";
  return "winter";
}

export const SEASON_EMOJI = {
  spring: "🌸",
  summer: "☀️",
  autumn: "🍂",
  winter: "❄️",
};

export function getTipIndex() {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const day = Math.floor((Date.now() - start) / 86400000);
  return day % 6;
}

export function computeWildScore(stats) {
  const typesFound = Object.keys(stats.byType || {}).length;
  const typePart = Math.min(55, (typesFound / BIODEX_TYPE_COUNT) * 55);
  const speciesPart = Math.min(45, (stats.uniqueSpecies / WILD_SPECIES_GOAL) * 45);
  return Math.round(typePart + speciesPart);
}

