/**
 * Catalogue minéral — source : sevya/catalogue-mineral.json
 */

import mineralCatalogueJson from "../sevya/catalogue-mineral.json";
import { LEGACY_CATALOGUE_MINERALS } from "@/lib/legacyCatalogueMinerals";

function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

/** Ancien id catalogue app → id entrée JSON. */
const LEGACY_JSON_ID_LINKS = {
  "dalles-travertin": "travertin",
  "bordure-acier-corten": "bordure-en-acier-corten",
  "gravier-blanc": "gravier-de-marbre-blanc",
  "galet-riviere": "galets-roules",
  "pas-japonais-gres": "pas-japonais-en-pierre-naturelle",
  "ardoise-concassee": "paillage-d-ardoise",
  "rocher-ardoise": "rochers-decoratifs",
};

function mapJsonMineral(row, id) {
  return {
    id,
    jsonId: row.id,
    nom: row.nom,
    univers: row.univers || "Minéral",
    categorie: row.categorie,
    famille: row.categorie,
    aspect: row.aspect || "",
    entretien: row.entretien || "",
    budget: row.budget || "",
    usages: Array.isArray(row.usages) ? row.usages : [],
    ambiances: Array.isArray(row.ambiances) ? row.ambiances : [],
    pourquoi_on_laime: row.pourquoi_on_laime || "",
    a_savoir: row.a_savoir || "",
    photo_url: row.photo_url || null,
    photo_source: row.photo_source || "",
    photo_auteur: row.photo_auteur || "",
    photo_licence: row.photo_licence || "",
    photo_licence_url: row.photo_licence_url || "",
    photo_lien: row.photo_lien || "",
    photo_detouree: row.photo_detouree || "non",
    kind: "mineral",
    type: "mineral",
    materiau: row.aspect || "",
    finition: row.budget || "",
    tags_ambiance: [],
    resume: [row.categorie, row.aspect].filter(Boolean).join(" · "),
    populaire: false,
    ordre: 0,
    actif: true,
    source: "catalogue_mineral",
  };
}

function buildCatalogue() {
  const legacyByNom = new Map();
  const legacyById = new Map();
  for (const m of LEGACY_CATALOGUE_MINERALS) {
    legacyById.set(m.id, m);
    legacyByNom.set(normalizeKey(m.nom), m);
  }

  const jsonIdToLegacyId = new Map(
    Object.entries(LEGACY_JSON_ID_LINKS).map(([legacyId, jsonId]) => [jsonId, legacyId])
  );

  const matches = [];
  const usedLegacyIds = new Set();
  const minerals = [];

  for (const row of mineralCatalogueJson) {
    const linkedLegacyId = jsonIdToLegacyId.get(row.id);
    const linkedLegacy = linkedLegacyId ? legacyById.get(linkedLegacyId) : null;
    const byNom = legacyByNom.get(normalizeKey(row.nom));
    const legacy = linkedLegacy || byNom;
    const id = linkedLegacyId || (legacy ? legacy.id : row.id);

    if (legacy) {
      usedLegacyIds.add(legacy.id);
      matches.push({
        legacyId: legacy.id,
        jsonId: row.id,
        nom: row.nom,
        matchedBy: linkedLegacyId ? "manual" : "nom",
      });
    }

    minerals.push(mapJsonMineral(row, id));
  }

  const unmatchedLegacy = LEGACY_CATALOGUE_MINERALS.filter((m) => !usedLegacyIds.has(m.id)).map(
    (m) => ({ id: m.id, nom: m.nom })
  );

  return { minerals, matches, unmatchedLegacy };
}

const BUILT = buildCatalogue();

export const CATALOGUE_MINERAL_ID_MATCHES = BUILT.matches;
export const CATALOGUE_MINERAL_UNMATCHED_LEGACY = BUILT.unmatchedLegacy;

function legacyMineralToDisplay(m) {
  return {
    ...mapJsonMineral(
      {
        id: m.id,
        nom: m.nom,
        univers: "Minéral",
        categorie: m.famille || "Minéral",
        aspect: m.materiau || m.finition || "",
        entretien: "",
        budget: "",
        usages: [],
        ambiances: m.tags_ambiance || [],
        pourquoi_on_laime: "",
        a_savoir: "",
        photo_url: m.photo_url,
      },
      m.id
    ),
    populaire: m.populaire,
    ordre: m.ordre,
    tags_ambiance: m.tags_ambiance || [],
    materiau: m.materiau,
    finition: m.finition,
    resume: m.resume,
  };
}

const ORPHAN_BY_ID = new Map(
  LEGACY_CATALOGUE_MINERALS.filter((m) =>
    BUILT.unmatchedLegacy.some((u) => u.id === m.id)
  ).map((m) => [m.id, legacyMineralToDisplay(m)])
);

const DISPLAY_BY_ID = new Map(BUILT.minerals.map((m) => [m.id, m]));

/** @deprecated */
export const CATALOGUE_MINERALS = BUILT.minerals;

/** @deprecated — préférer catégories JSON */
export const MINERAL_FAMILLES = [...new Set(BUILT.minerals.map((m) => m.categorie))].sort((a, b) =>
  a.localeCompare(b, "fr")
);

export const MINERAL_CATEGORIES = MINERAL_FAMILLES;

export const MINERAL_AMBIANCE_TAGS = [
  "zen",
  "contemporain",
  "naturel",
  "sans_entretien",
  "Méditerranéen",
  "Contemporain",
  "Naturel",
  "Champêtre",
];

export function getCatalogueMigrationReportMineral() {
  return {
    matches: CATALOGUE_MINERAL_ID_MATCHES,
    unmatchedLegacy: CATALOGUE_MINERAL_UNMATCHED_LEGACY,
  };
}

export function catalogueMineralClientId(articleId) {
  return `catalogue-mineral:${articleId}`;
}

export function mineralToAnalysisResult(article) {
  if (!article) return null;
  return {
    id: catalogueMineralClientId(article.id),
    catalogue_mineral_id: article.id,
    source: "catalogue_mineral",
    kind: "mineral",
    type: "mineral",
    nom: article.nom,
    famille: article.categorie || article.famille,
    categorie: article.categorie,
    aspect: article.aspect,
    entretien: article.entretien,
    budget: article.budget,
    usages: article.usages || [],
    ambiances: article.ambiances || [],
    materiau: article.materiau || article.aspect,
    finition: article.finition || article.budget,
    tags_ambiance: article.tags_ambiance || [],
    resume: article.resume,
    photo: article.photo_url || null,
    photo_source: article.photo_source || "",
    photo_auteur: article.photo_auteur || "",
    photo_licence: article.photo_licence || "",
    photo_licence_url: article.photo_licence_url || "",
    photo_lien: article.photo_lien || "",
    photo_detouree: article.photo_detouree || "non",
  };
}

export function getActiveCatalogueMinerals() {
  return BUILT.minerals.filter((a) => a.actif !== false);
}

export function getCatalogueMineralById(id) {
  if (!id) return null;
  return DISPLAY_BY_ID.get(id) || ORPHAN_BY_ID.get(id) || null;
}

export function countMineralsByFamille(articles = getActiveCatalogueMinerals()) {
  const counts = Object.fromEntries(MINERAL_CATEGORIES.map((f) => [f, 0]));
  for (const article of articles) {
    const key = article.categorie || article.famille;
    if (counts[key] != null) counts[key] += 1;
  }
  return counts;
}

export function filterCatalogueMinerals({
  articles = getActiveCatalogueMinerals(),
  ambianceTag = null,
  famille = null,
  categorie = null,
  populaireOnly = false,
} = {}) {
  let list = articles;
  const catFilter = categorie || famille;

  if (populaireOnly) list = list.filter((a) => a.populaire);
  if (ambianceTag) {
    list = list.filter((a) =>
      a.ambiances?.some((tag) => normalizeKey(tag) === normalizeKey(ambianceTag))
    );
  }
  if (catFilter) {
    list = list.filter((a) => (a.categorie || a.famille) === catFilter);
  }

  return list;
}
