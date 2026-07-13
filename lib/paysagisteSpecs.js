/** Valeur affichée quand aucune donnée fiable n'est disponible (Option 3). */
export const PAYSAGISTE_PLACEHOLDER = "—";

/** Valeur honnête quand l'IA est incertaine (distinct de « — » = absent). */
export const PAYSAGISTE_UNCERTAIN = "à vérifier";

export const PAYSAGISTE_BLOCK_START = "<<<WILDER_PAYSAGISTE>>>";
export const PAYSAGISTE_BLOCK_END = "<<<END_WILDER_PAYSAGISTE>>>";

export const PAYSAGISTE_SPEC_KEYS = [
  "exposition",
  "taille_adulte",
  "floraison",
  "rusticite",
  "sol",
];

/** Assainit une valeur paysagiste brute (null si vide / invalide). */
export function sanitizePaysagisteField(value) {
  if (value == null) return null;
  if (typeof value !== "string" && typeof value !== "number") return null;
  const s = String(value).trim();
  if (!s || s === "null" || s === "—" || s === "-") return null;
  return s;
}

/** Normalise les 5 champs paysagiste depuis un objet brut. */
export function normalizePaysagisteFields(data) {
  if (!data || typeof data !== "object") return null;

  const out = {};
  let hasAny = false;

  for (const key of PAYSAGISTE_SPEC_KEYS) {
    const value = sanitizePaysagisteField(data[key]);
    if (value) {
      out[key] = value;
      hasAny = true;
    }
  }

  return hasAny ? out : null;
}

/** Parse le JSON interne du bloc paysagiste — jamais de throw. */
export function parsePaysagisteBlock(inner) {
  if (!inner || typeof inner !== "string") return null;

  const candidates = [
    inner.trim(),
    inner.replace(/[\u201c\u201d]/g, '"').replace(/,\s*([}\]])/g, "$1"),
  ].filter(Boolean);

  for (const candidate of [...new Set(candidates)]) {
    try {
      const parsed = JSON.parse(candidate);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) continue;
      return normalizePaysagisteFields(parsed);
    } catch {
      /* essai suivant */
    }
  }

  return null;
}

/** Extrait le bloc paysagiste balisé en fin de réponse Claude (compatible post-stream). */
export function extractPaysagisteBlock(raw) {
  if (!raw || typeof raw !== "string") {
    return { mainText: raw || "", paysagiste: null };
  }

  const start = raw.lastIndexOf(PAYSAGISTE_BLOCK_START);
  const end = raw.lastIndexOf(PAYSAGISTE_BLOCK_END);
  if (start === -1 || end === -1 || end <= start) {
    return { mainText: raw, paysagiste: null };
  }

  const inner = raw.slice(start + PAYSAGISTE_BLOCK_START.length, end).trim();
  const mainText = `${raw.slice(0, start)}${raw.slice(end + PAYSAGISTE_BLOCK_END.length)}`.trim();

  return { mainText, paysagiste: parsePaysagisteBlock(inner) };
}

/** Champs paysagiste prêts pour une discovery (chaînes vides si absent). */
export function pickPaysagisteFields(source, fallback = {}) {
  const normalized = normalizePaysagisteFields(source) || {};
  const out = {};

  for (const key of PAYSAGISTE_SPEC_KEYS) {
    out[key] = normalized[key] || sanitizePaysagisteField(fallback[key]) || "";
  }

  return out;
}

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
