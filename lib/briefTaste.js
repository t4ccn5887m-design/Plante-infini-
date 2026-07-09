/**
 * Goût déduit simple pour l'aperçu du brief (heuristiques — Option 1 API plus tard).
 */

const ENVIE_CHIP_KEYS = {
  ombre: "brief.taste_shade",
  floraison_violette: "brief.taste_purple_bloom",
  persistant: "brief.taste_evergreen",
  sans_entretien: "brief.taste_low_maintenance",
  brise_vue: "brief.taste_screening",
};

const EXPO_CHIP_KEYS = {
  soleil: "brief.taste_full_sun",
  "mi-ombre": "brief.taste_partial_shade",
  ombre: "brief.taste_shade",
};

function isVegetal(item) {
  return item?.kind === "vegetal";
}

function normalizeExpo(value) {
  if (!value) return null;
  const v = String(value).toLowerCase().trim();
  if (v.includes("mi") && v.includes("ombre")) return "mi-ombre";
  if (v.includes("ombre")) return "ombre";
  if (v.includes("soleil")) return "soleil";
  return null;
}

function countExpositions(vegetalItems) {
  const counts = { soleil: 0, "mi-ombre": 0, ombre: 0 };

  for (const item of vegetalItems) {
    const d = item.discovery || {};
    const expo =
      normalizeExpo(d.exposition) ||
      normalizeExpo(item.zoneExposition) ||
      normalizeExpo(d.resume);
    if (expo) counts[expo] += 1;
  }

  return counts;
}

function dominantExpo(counts, total) {
  if (total === 0) return null;
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const [key, count] = entries[0];
  if (!count || count / total < 0.4) return null;
  return key;
}

function aggregateEnvieTags(vegetalItems) {
  const counts = new Map();

  for (const item of vegetalItems) {
    const tags = item.discovery?.tags_envie || [];
    for (const tag of tags) {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }

  return counts;
}

function hasPurpleFloraison(vegetalItems) {
  return vegetalItems.some((item) => {
    const text = [item.discovery?.floraison, item.discovery?.resume, item.subtitle]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return /violet|mauve|pourpre|bleu-violet|bleue?s?-violet/.test(text);
  });
}

function hasFreshSoil(vegetalItems) {
  let hits = 0;
  for (const item of vegetalItems) {
    const sol = String(item.discovery?.sol || "").toLowerCase();
    if (/fra[iî]che|humif[eè]re|humide/.test(sol)) hits += 1;
  }
  return hits >= 2 || (vegetalItems.length > 0 && hits / vegetalItems.length >= 0.3);
}

/**
 * Retourne des clés i18n pour les chips « Ce que je recherche ».
 */
export function deriveTasteChipKeys(items = []) {
  const vegetal = items.filter(isVegetal);
  const minerals = items.filter((i) => i.kind === "mineral");
  const chips = [];
  const used = new Set();

  const addKey = (key) => {
    if (!key || used.has(key)) return;
    used.add(key);
    chips.push(key);
  };

  if (vegetal.length === 0 && minerals.length === 0) {
    return ["brief.taste_empty"];
  }

  const expoCounts = countExpositions(vegetal);
  const dominant = dominantExpo(expoCounts, vegetal.length);
  if (dominant && EXPO_CHIP_KEYS[dominant]) {
    addKey(EXPO_CHIP_KEYS[dominant]);
  }

  const envieCounts = aggregateEnvieTags(vegetal);
  const threshold = Math.max(2, Math.ceil(vegetal.length * 0.3));
  for (const [tag, count] of [...envieCounts.entries()].sort((a, b) => b[1] - a[1])) {
    if (count >= threshold && ENVIE_CHIP_KEYS[tag]) {
      addKey(ENVIE_CHIP_KEYS[tag]);
    }
  }

  if (hasPurpleFloraison(vegetal)) {
    addKey("brief.taste_purple_bloom");
  }

  if (hasFreshSoil(vegetal)) {
    addKey("brief.taste_fresh_soil");
  }

  if (minerals.length > 0) {
    addKey("brief.taste_mineral");
  }

  if (chips.length === 0) {
    addKey("brief.taste_composing");
  }

  return chips.slice(0, 6);
}

export function tasteChipsToLabels(chipKeys, t) {
  return chipKeys.map((key) => t(key));
}
