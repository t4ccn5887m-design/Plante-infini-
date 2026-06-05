/** Collection Pokédex — espèces découvertes vs silhouettes à compléter. */

export const POKEDEX_TYPES = [
  { id: "plante", emoji: "🌿" },
  { id: "fleur", emoji: "🌸" },
  { id: "arbre", emoji: "🌳" },
  { id: "fruit", emoji: "🍎" },
  { id: "legume", emoji: "🥕" },
  { id: "champignon", emoji: "🍄" },
  { id: "oiseau", emoji: "🐦" },
  { id: "animal", emoji: "🦊" },
  { id: "insecte", emoji: "🐛" },
  { id: "papillon", emoji: "🦋" },
  { id: "reptile", emoji: "🦎" },
];

function speciesKey(d) {
  return `${(d.nom || "").toLowerCase()}|${d.type || "plante"}`;
}

export function buildPokedexCollection(discoveries) {
  const bySpecies = new Map();

  for (const d of discoveries) {
    const key = speciesKey(d);
    const existing = bySpecies.get(key);
    if (!existing) {
      bySpecies.set(key, { ...d, count: 1 });
    } else {
      bySpecies.set(key, {
        ...existing,
        count: (existing.count || 1) + 1,
        discoveredAt:
          d.discoveredAt && (!existing.discoveredAt || d.discoveredAt < existing.discoveredAt)
            ? d.discoveredAt
            : existing.discoveredAt,
        photo: existing.photo || d.photo,
        rarete:
          existing.rarete === "tres_rare" || d.rarete === "tres_rare"
            ? "tres_rare"
            : existing.rarete === "rare" || d.rarete === "rare"
              ? "rare"
              : existing.rarete || d.rarete,
      });
    }
  }

  const entries = [...bySpecies.values()].map((d) => ({
    id: speciesKey(d),
    nom: d.nom,
    type: d.type || "plante",
    rarete: d.rarete || "commun",
    photo: d.photo,
    discoveredAt: d.discoveredAt,
    count: d.count || 1,
    caught: true,
  }));

  const caughtTypes = new Set(entries.map((e) => e.type));
  const silhouettes = POKEDEX_TYPES.filter((t) => !caughtTypes.has(t.id)).map((t) => ({
    id: `silhouette-${t.id}`,
    type: t.id,
    emoji: t.emoji,
    caught: false,
  }));

  entries.sort((a, b) => new Date(b.discoveredAt || 0) - new Date(a.discoveredAt || 0));

  return {
    entries,
    silhouettes,
    caughtCount: entries.length,
    totalTypes: POKEDEX_TYPES.length,
    completionPct: Math.round((caughtTypes.size / POKEDEX_TYPES.length) * 100),
  };
}
