export function computeStats(items) {
  const uniqueSpecies = new Set(
    items.map((d) => (d.nom_latin || d.nom || "").toLowerCase()).filter(Boolean)
  );
  const rareCount = items.filter(
    (d) => d.rarete === "rare" || d.rarete === "tres_rare"
  ).length;
  const byType = {};
  items.forEach((d) => {
    const t = d.type || "plante";
    byType[t] = (byType[t] || 0) + 1;
  });
  const byRarity = { commun: 0, peu_commun: 0, rare: 0, tres_rare: 0 };
  items.forEach((d) => {
    const r = d.rarete in byRarity ? d.rarete : "commun";
    byRarity[r]++;
  });
  const now = new Date();
  const thisMonth = items.filter((d) => {
    const date = new Date(d.discoveredAt);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  const countries = new Set();
  const cities = new Set();
  items.forEach((d) => {
    if (!d.placeName) return;
    const parts = d.placeName.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 1) cities.add(parts[0]);
    if (parts.length >= 2) countries.add(parts[parts.length - 1]);
    else if (parts.length === 1) countries.add(parts[0]);
  });

  const typeEntries = Object.entries(byType).sort((a, b) => b[1] - a[1]);
  const favoriteType = typeEntries[0]?.[0] || null;

  const monthly = {};
  const monthKeys = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthKeys.push(key);
    monthly[key] = 0;
  }
  items.forEach((d) => {
    const date = new Date(d.discoveredAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (key in monthly) monthly[key]++;
  });

  const maxMonthly = Math.max(...Object.values(monthly), 1);

  return {
    total: items.length,
    uniqueSpecies: uniqueSpecies.size,
    rareCount,
    byType,
    byRarity,
    thisMonth,
    countriesCount: countries.size,
    citiesCount: cities.size,
    countries: [...countries],
    cities: [...cities],
    favoriteType,
    monthly,
    monthKeys,
    maxMonthly,
  };
}
