const VALID_TYPES = new Set([
  "plante",
  "animal",
  "champignon",
  "fleur",
  "insecte",
  "oiseau",
  "arbre",
  "fruit",
  "legume",
  "reptile",
  "papillon",
  "mauvaise_herbe",
  "monument",
  "architecture",
  "site_naturel",
  "curiosite",
]);

const VALID_RARETE = new Set(["commun", "peu_commun", "rare", "tres_rare"]);

function stripCodeFences(text) {
  return text
    .replace(/^```(?:json)?\s*/gim, "")
    .replace(/```\s*$/gm, "")
    .trim();
}

function extractJsonObject(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  return text.slice(start, end + 1);
}

function fixCommonJsonIssues(text) {
  return text
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/,\s*([}\]])/g, "$1")
    .replace(/([{,]\s*)'([^']+)'\s*:/g, '$1"$2":')
    .replace(/:\s*'([^']*)'/g, ':"$1"');
}

function tryParse(text) {
  return JSON.parse(text);
}

/**
 * Parse Claude's text response into a normalized analysis object.
 * Returns null if parsing fails completely.
 */
export function parseClaudeJson(raw) {
  if (!raw || typeof raw !== "string") return null;

  const candidates = [
    stripCodeFences(raw),
    extractJsonObject(stripCodeFences(raw)),
    fixCommonJsonIssues(stripCodeFences(raw)),
    extractJsonObject(fixCommonJsonIssues(raw)),
  ].filter(Boolean);

  const unique = [...new Set(candidates)];

  for (const candidate of unique) {
    try {
      const parsed = tryParse(candidate);
      if (parsed && typeof parsed === "object") {
        return normalizeAnalysis(parsed);
      }
    } catch {
      /* try next candidate */
    }
  }

  console.error("[Wilder] Impossible de parser la réponse Claude:", raw.slice(0, 500));
  return null;
}

/** Parse JSON from Claude without requiring analysis fields (e.g. recipes). */
export function parseClaudeJsonLoose(raw) {
  if (!raw || typeof raw !== "string") return null;

  const candidates = [
    stripCodeFences(raw),
    extractJsonObject(stripCodeFences(raw)),
    fixCommonJsonIssues(stripCodeFences(raw)),
    extractJsonObject(fixCommonJsonIssues(raw)),
  ].filter(Boolean);

  const unique = [...new Set(candidates)];

  for (const candidate of unique) {
    try {
      const parsed = tryParse(candidate);
      if (parsed && typeof parsed === "object") {
        if (parsed.erreur || parsed.error) {
          return { erreur: String(parsed.erreur || parsed.error) };
        }
        return parsed;
      }
    } catch {
      /* try next */
    }
  }

  return null;
}

function normalizeAnalysis(data) {
  if (data.erreur || data.error) {
    return { erreur: String(data.erreur || data.error) };
  }

  const nom = data.nom || data.name || data.title;
  if (!nom) return null;

  let type = String(data.type || data.categorie || data.category || "plante")
    .toLowerCase()
    .replace(/\s+/g, "_");
  if (!VALID_TYPES.has(type)) type = "plante";

  let rarete = String(data.rarete || data.rarity || "commun")
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
  if (rarete === "peu commun") rarete = "peu_commun";
  if (rarete === "tres rare") rarete = "tres_rare";
  if (!VALID_RARETE.has(rarete)) rarete = "commun";

  return {
    type,
    nom: String(nom),
    nom_latin: data.nom_latin || data.nomLatin || data.scientific_name || null,
    famille: data.famille || data.family || null,
    description: data.description || data.desc || "",
    identification_note: data.identification_note || data.identificationNote || null,
    age_approximatif: data.age_approximatif || data.ageApproximatif || null,
    habitat: data.habitat || data.contexte || data.context || "",
    rarete,
    etat_sante: data.etat_sante || data.etatSante || data.health || null,
    soins_traitement: data.soins_traitement || data.soinsTraitement || null,
    guide_entretien: data.guide_entretien || data.guideEntretien || null,
    conseils_expert: data.conseils_expert || data.conseilsExpert || null,
    comportement: data.comportement || data.behavior || null,
    dangerosite: data.dangerosite || data.dangerosity || null,
    infos_utiles: data.infos_utiles || data.infosUtiles || null,
    histoire: data.histoire || data.history || null,
    date_construction: data.date_construction || data.dateConstruction || null,
    style_architectural: data.style_architectural || data.styleArchitectural || null,
    anecdotes: data.anecdotes || null,
    fun_fact: data.fun_fact || data.funFact || null,
    alimentation: data.alimentation || data.diet || data.feeding || null,
    espece_protegee: (() => {
      const v = data.espece_protegee ?? data.especeProtegee ?? data.protected;
      if (v === true || v === "true") return true;
      if (v === false || v === "false") return false;
      return null;
    })(),
    region_saison: data.region_saison || data.regionSaison || data.region || null,
    mauvaise_herbe: (() => {
      const v = data.mauvaise_herbe ?? data.mauvaiseHerbe ?? data.weed;
      if (v === true || v === "true") return true;
      if (v === false || v === "false") return false;
      return type === "mauvaise_herbe" ? true : null;
    })(),
    mauvaise_herbe_nuisible:
      data.mauvaise_herbe_nuisible || data.mauvaiseHerbeNuisible || data.weed_harmful || null,
    mauvaise_herbe_solution:
      data.mauvaise_herbe_solution || data.mauvaiseHerbeSolution || data.weed_solution || null,
    mauvaise_herbe_astuces:
      data.mauvaise_herbe_astuces || data.mauvaiseHerbeAstuces || data.weed_tips || null,
    mauvaise_herbe_prevention:
      data.mauvaise_herbe_prevention || data.mauvaiseHerbePrevention || data.weed_prevention || null,
  };
}
