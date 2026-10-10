/**
 * Catalogue aménagements — source : sevya/catalogue-amenagements.json
 */

import amenagementsCatalogueJson from "../sevya/catalogue-amenagements.json";
import { LEGACY_CATALOGUE_AMENAGEMENTS } from "@/lib/legacyCatalogueAmenagements";

function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function mapJsonAmenagement(row, id) {
  return {
    id,
    jsonId: row.id,
    nom: row.nom,
    univers: row.univers || "Aménagements",
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
    kind: "deco",
    type: "deco",
    materiau: row.aspect || "",
    finition: row.budget || "",
    tags_style: [],
    resume: [row.categorie, row.aspect].filter(Boolean).join(" · "),
    populaire: false,
    ordre: 0,
    actif: true,
    source: "catalogue_deco",
  };
}

function buildCatalogue() {
  const legacyByNom = new Map();
  const legacyById = new Map();
  for (const a of LEGACY_CATALOGUE_AMENAGEMENTS) {
    legacyById.set(a.id, a);
    legacyByNom.set(normalizeKey(a.nom), a);
  }

  const matches = [];
  const usedLegacyIds = new Set();
  const items = [];

  for (const row of amenagementsCatalogueJson) {
    const legacy = legacyByNom.get(normalizeKey(row.nom));
    const id = legacy ? legacy.id : row.id;

    if (legacy) {
      usedLegacyIds.add(legacy.id);
      matches.push({
        legacyId: legacy.id,
        jsonId: row.id,
        nom: row.nom,
        matchedBy: "nom",
      });
    }

    items.push(mapJsonAmenagement(row, id));
  }

  const unmatchedLegacy = LEGACY_CATALOGUE_AMENAGEMENTS.filter((a) => !usedLegacyIds.has(a.id)).map(
    (a) => ({ id: a.id, nom: a.nom })
  );

  return { items, matches, unmatchedLegacy };
}

const BUILT = buildCatalogue();

export const CATALOGUE_AMENAGEMENT_ID_MATCHES = BUILT.matches;
export const CATALOGUE_AMENAGEMENT_UNMATCHED_LEGACY = BUILT.unmatchedLegacy;

function legacyAmenagementToDisplay(a) {
  return {
    ...mapJsonAmenagement(
      {
        id: a.id,
        nom: a.nom,
        univers: "Aménagements",
        categorie: a.famille || "Aménagements",
        aspect: a.materiau || a.finition || "",
        entretien: "",
        budget: "",
        usages: [],
        ambiances: a.tags_style || [],
        pourquoi_on_laime: "",
        a_savoir: "",
        photo_url: a.photo_url,
      },
      a.id
    ),
    populaire: a.populaire,
    ordre: a.ordre,
    tags_style: a.tags_style || [],
    materiau: a.materiau,
    finition: a.finition,
    resume: a.resume,
  };
}

const ORPHAN_BY_ID = new Map(
  LEGACY_CATALOGUE_AMENAGEMENTS.filter((a) =>
    BUILT.unmatchedLegacy.some((u) => u.id === a.id)
  ).map((a) => [a.id, legacyAmenagementToDisplay(a)])
);

const DISPLAY_BY_ID = new Map(BUILT.items.map((a) => [a.id, a]));

export const AMENAGEMENT_CATEGORIES = [...new Set(BUILT.items.map((a) => a.categorie))].sort((a, b) =>
  a.localeCompare(b, "fr")
);

export function getCatalogueMigrationReportAmenagements() {
  return {
    matches: CATALOGUE_AMENAGEMENT_ID_MATCHES,
    unmatchedLegacy: CATALOGUE_AMENAGEMENT_UNMATCHED_LEGACY,
  };
}

export function catalogueAmenagementClientId(articleId) {
  return `catalogue-deco:${articleId}`;
}

export function amenagementToAnalysisResult(article) {
  if (!article) return null;
  return {
    id: catalogueAmenagementClientId(article.id),
    catalogue_deco_id: article.id,
    source: "catalogue_deco",
    kind: "deco",
    type: "deco",
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
    tags_style: article.tags_style || [],
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

export function getActiveCatalogueAmenagements() {
  return BUILT.items.filter((a) => a.actif !== false);
}

export function getCatalogueAmenagementById(id) {
  if (!id) return null;
  return DISPLAY_BY_ID.get(id) || ORPHAN_BY_ID.get(id) || null;
}

export function filterCatalogueAmenagements({
  articles = getActiveCatalogueAmenagements(),
  styleTag = null,
  famille = null,
  categorie = null,
  populaireOnly = false,
} = {}) {
  let list = articles;
  const catFilter = categorie || famille;

  if (populaireOnly) list = list.filter((a) => a.populaire);
  if (styleTag) {
    list = list.filter((a) =>
      a.ambiances?.some((tag) => normalizeKey(tag) === normalizeKey(styleTag))
    );
  }
  if (catFilter) {
    list = list.filter((a) => (a.categorie || a.famille) === catFilter);
  }

  return list;
}

export function countAmenagementsByCategorie(articles = getActiveCatalogueAmenagements()) {
  const counts = Object.fromEntries(AMENAGEMENT_CATEGORIES.map((f) => [f, 0]));
  for (const article of articles) {
    const key = article.categorie || article.famille;
    if (counts[key] != null) counts[key] += 1;
  }
  return counts;
}
