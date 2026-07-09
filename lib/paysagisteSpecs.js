/** Valeur affichée quand aucune donnée fiable n'est disponible (Option 3). */
export const PAYSAGISTE_PLACEHOLDER = "—";

export const PAYSAGISTE_SPEC_KEYS = [
  "exposition",
  "taille_adulte",
  "floraison",
  "rusticite",
  "sol",
];

function explicit(value) {
  if (value == null) return null;
  const s = String(value).trim();
  return s || null;
}

function joinCorpus(discovery) {
  return [
    discovery?.guide_entretien,
    discovery?.habitat,
    discovery?.description,
    discovery?.conseils_expert,
    discovery?.soins_traitement,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function capitalizePhrase(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Exposition — uniquement si le texte est explicite. */
function inferExposition(text) {
  if (!text) return null;
  if (/plein\s+soleil|pleinement\s+ensoleill/.test(text)) return "Plein soleil";
  if (/mi[-\s]ombre/.test(text)) return "Mi-ombre";
  if (/\bombre\b/.test(text)) return "Ombre";
  return null;
}

/** Taille adulte — hauteur/port chiffrés uniquement. */
function inferTailleAdulte(discovery, text) {
  const direct = explicit(discovery?.taille_adulte);
  if (direct) return direct;

  if (!text) return null;

  const heightMatch = text.match(
    /(?:hauteur|port|atteint|jusqu['']?à)\s*(?:de\s*)?(\d+[\s,.]?\d*)\s*(?:à\s*\d+[\s,.]?\d*\s*)?(m|mètres|cm)\b/i
  );
  if (heightMatch) {
    const unit = heightMatch[2].toLowerCase().startsWith("c") ? "cm" : "m";
    return `~${heightMatch[1].replace(",", ".")} ${unit}`;
  }

  return null;
}

/** Floraison — période ou couleur explicite. */
function inferFloraison(text) {
  if (!text) return null;

  const monthMatch = text.match(
    /floraison\s+(?:de\s+)?(?:janvier|février|fevrier|mars|avril|mai|juin|juillet|ao[uû]t|septembre|octobre|novembre|décembre|decembre)(?:\s+(?:à|au)\s+(?:janvier|février|fevrier|mars|avril|mai|juin|juillet|ao[uû]t|septembre|octobre|novembre|décembre|decembre))?/i
  );
  if (monthMatch) return capitalizePhrase(monthMatch[0]);

  const colorFlower = text.match(
    /fleurs?\s+(?:blanches?|rouges?|violettes?|jaunes?|roses?|bleues?|orange)/i
  );
  if (colorFlower) return capitalizePhrase(colorFlower[0]);

  const floraisonColor = text.match(
    /floraison\s+(?:blanche|rouge|violette|jaune|rose|bleue|orange)/i
  );
  if (floraisonColor) return capitalizePhrase(floraisonColor[0]);

  return null;
}

/** Rusticité — zone USDA ou seuil de température explicite. */
function inferRusticite(text) {
  if (!text) return null;

  const zone = text.match(/\bzone[s]?\s*(?:usd[a]?)?\s*(\d{1,2}(?:\s*[-–àa]\s*\d{1,2})?)\b/i);
  if (zone) return `Zone ${zone[1].replace(/\s+/g, "")}`;

  const deg = text.match(/rustique\s+jusqu['']?à\s*(-?\d+)\s*°/i);
  if (deg) return `Jusqu'à ${deg[1]} °C`;

  return null;
}

/** Sol — type de sol nommé explicitement. */
function inferSol(text) {
  if (!text) return null;

  const solMatch = text.match(/sol\s+(drainant|acide|calcaire|humif[eè]re|humide|sec|l[eé]ger|riche)/i);
  if (solMatch) return `Sol ${solMatch[1]}`;

  const terreMatch = text.match(/terre\s+(l[eé]g[eè]re|fra[iî]che|acide|calcaire|humif[eè]re)/i);
  if (terreMatch) return `Terre ${terreMatch[1]}`;

  if (/substrat\s+drainant/i.test(text)) return "Substrat drainant";

  return null;
}

/**
 * Caractéristiques « paysagiste » pour l'écran Résultat de scan.
 * Priorité : champs dédiés (Option 1) → heuristiques prudentes → « — ».
 */
export function getPaysagisteSpecs(discovery) {
  const text = joinCorpus(discovery);

  return {
    exposition: explicit(discovery?.exposition) ?? inferExposition(text) ?? PAYSAGISTE_PLACEHOLDER,
    taille_adulte: inferTailleAdulte(discovery, text) ?? PAYSAGISTE_PLACEHOLDER,
    floraison: explicit(discovery?.floraison) ?? inferFloraison(text) ?? PAYSAGISTE_PLACEHOLDER,
    rusticite: explicit(discovery?.rusticite) ?? inferRusticite(text) ?? PAYSAGISTE_PLACEHOLDER,
    sol: explicit(discovery?.sol) ?? inferSol(text) ?? PAYSAGISTE_PLACEHOLDER,
  };
}
