/**
 * Catalogue végétal — source : sevya/catalogue-vegetal.json (172 plantes).
 * Anciens ids conservés quand nom / nom latin correspond à l'ancien mock.
 */

import vegetalCatalogueJson from "../sevya/catalogue-vegetal.json";
import { LEGACY_CATALOGUE_PLANTS } from "@/lib/legacyCataloguePlants";

export const CATALOGUE_CATEGORIES = [
  "Arbres",
  "Arbustes",
  "Haies",
  "Grimpantes",
  "Fleurs et vivaces",
  "Graminées",
  "Couvre-sols",
  "Aromatiques",
];

/** @deprecated — préférer CATALOGUE_CATEGORIES */
export const CATALOGUE_FAMILLES = CATALOGUE_CATEGORIES;

export const CATALOGUE_ENVIES = [
  "Se cacher des voisins",
  "Peu d'entretien",
  "Un coin d'ombre",
  "Attirer les abeilles",
  "Couleur toute l'année",
];

/** @deprecated */
export const CATALOGUE_ENVIE_TAGS = CATALOGUE_ENVIES;

export const CATEGORIE_PLACEHOLDER_COLORS = {
  Arbres: "#7E8F6A",
  Arbustes: "#B9667F",
  Haies: "#A0483F",
  Grimpantes: "#6F8A73",
  "Fleurs et vivaces": "#8C7AB0",
  Graminées: "#B8A372",
  "Couvre-sols": "#5E7A62",
  Aromatiques: "#A8925F",
};

function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function formatRusticite(c) {
  if (c == null || c === "") return "";
  const n = Number(c);
  if (Number.isFinite(n)) return `Jusqu'à ${n} °C`;
  return String(c);
}

function mapJsonPlant(row, id) {
  const hauteur = row.hauteur_adulte || "";
  return {
    id,
    nom: row.nom,
    nom_latin: row.nom_latin || "",
    categorie: row.categorie,
    famille: row.categorie,
    exposition: row.exposition || "",
    entretien: row.entretien || "",
    arrosage: row.arrosage || "",
    rusticite_c: row.rusticite_c,
    hauteur_adulte: hauteur,
    taille_adulte: hauteur,
    feuillage_persistant: row.feuillage_persistant || "",
    floraison: row.floraison || "",
    couleurs: row.couleurs || "",
    mois_interet: Array.isArray(row.mois_interet) ? row.mois_interet : [],
    ambiances: Array.isArray(row.ambiances) ? row.ambiances : [],
    envies: Array.isArray(row.envies) ? row.envies : [],
    pourquoi_on_laime: row.pourquoi_on_laime || "",
    a_savoir: row.a_savoir || "",
    photo_url: row.photo_url || null,
    photo_source: row.photo_source || "",
    photo_auteur: row.photo_auteur || "",
    photo_licence: row.photo_licence || "",
    photo_licence_url: row.photo_licence_url || "",
    photo_lien: row.photo_lien || "",
    photo_detouree: row.photo_detouree || "non",
    type: "plante",
    palette_type: null,
    resume: [row.exposition, row.entretien].filter(Boolean).join(" · "),
    rusticite: formatRusticite(row.rusticite_c),
    sol: "",
    tags_envie: [],
    populaire: false,
    ordre: 0,
    actif: true,
    source: "catalogue",
  };
}

/** Ancien id → id entrée JSON (correspondances explicites). */
const LEGACY_JSON_ID_LINKS = {
  "photinia-red-robin": "photinia",
  "geranium-rozanne": "geranium-vivace",
};

function buildCatalogue() {
  const legacyByNom = new Map();
  const legacyByLatin = new Map();
  const legacyById = new Map();
  for (const p of LEGACY_CATALOGUE_PLANTS) {
    legacyById.set(p.id, p);
    legacyByNom.set(normalizeKey(p.nom), p);
    if (p.nom_latin) legacyByLatin.set(normalizeKey(p.nom_latin), p);
  }

  const jsonIdToLegacyId = new Map(
    Object.entries(LEGACY_JSON_ID_LINKS).map(([legacyId, jsonId]) => [jsonId, legacyId])
  );

  const matches = [];
  const usedLegacyIds = new Set();
  const plants = [];

  for (const row of vegetalCatalogueJson) {
    const linkedLegacyId = jsonIdToLegacyId.get(row.id);
    const linkedLegacy = linkedLegacyId ? legacyById.get(linkedLegacyId) : null;
    const byNom = legacyByNom.get(normalizeKey(row.nom));
    const byLatin = row.nom_latin ? legacyByLatin.get(normalizeKey(row.nom_latin)) : null;
    const legacy = linkedLegacy || byNom || byLatin;
    const id = linkedLegacyId || (legacy ? legacy.id : row.id);

    if (legacy) {
      usedLegacyIds.add(legacy.id);
      matches.push({
        legacyId: legacy.id,
        jsonId: row.id,
        nom: row.nom,
        matchedBy: linkedLegacyId ? "manual" : byNom ? "nom" : "nom_latin",
      });
    }

    plants.push(mapJsonPlant(row, id));
  }

  const unmatchedLegacy = LEGACY_CATALOGUE_PLANTS.filter((p) => !usedLegacyIds.has(p.id)).map(
    (p) => ({ id: p.id, nom: p.nom, nom_latin: p.nom_latin || "" })
  );

  return { plants, matches, unmatchedLegacy };
}

const BUILT = buildCatalogue();

/** Correspondances id ancien ← nouvelle entrée JSON. */
export const CATALOGUE_VEGETAL_ID_MATCHES = BUILT.matches;

/** Anciennes plantes absentes du JSON — toujours résolvables par id pour les jardins. */
export const CATALOGUE_VEGETAL_UNMATCHED_LEGACY = BUILT.unmatchedLegacy;

const ORPHAN_BY_ID = new Map(
  LEGACY_CATALOGUE_PLANTS.filter((p) =>
    BUILT.unmatchedLegacy.some((u) => u.id === p.id)
  ).map((p) => [p.id, p])
);

const DISPLAY_BY_ID = new Map(BUILT.plants.map((p) => [p.id, p]));

/** @deprecated — catalogue affiché uniquement */
export const CATALOGUE_PLANTS = BUILT.plants;

export function getCatalogueMigrationReport() {
  return {
    matches: CATALOGUE_VEGETAL_ID_MATCHES,
    unmatchedLegacy: CATALOGUE_VEGETAL_UNMATCHED_LEGACY,
  };
}

export function catalogueClientId(plantId) {
  return `catalogue:${plantId}`;
}

export function plantToAnalysisResult(plant) {
  if (!plant) return null;
  return {
    id: catalogueClientId(plant.id),
    catalogue_plant_id: plant.id,
    source: "catalogue",
    kind: "vegetal",
    nom: plant.nom,
    nom_latin: plant.nom_latin || "",
    type: plant.type || "plante",
    categorie: plant.categorie,
    famille: plant.categorie || plant.famille,
    exposition: plant.exposition,
    entretien: plant.entretien,
    arrosage: plant.arrosage,
    taille_adulte: plant.taille_adulte || plant.hauteur_adulte,
    hauteur_adulte: plant.hauteur_adulte,
    floraison: plant.floraison,
    rusticite: plant.rusticite,
    rusticite_c: plant.rusticite_c,
    feuillage_persistant: plant.feuillage_persistant,
    couleurs: plant.couleurs,
    mois_interet: plant.mois_interet,
    ambiances: plant.ambiances,
    envies: plant.envies,
    pourquoi_on_laime: plant.pourquoi_on_laime,
    a_savoir: plant.a_savoir,
    sol: plant.sol,
    tags_envie: plant.tags_envie || [],
    resume: plant.resume,
    photo: plant.photo_url || null,
    photo_source: plant.photo_source || "",
    photo_auteur: plant.photo_auteur || "",
    photo_licence: plant.photo_licence || "",
    photo_licence_url: plant.photo_licence_url || "",
    photo_lien: plant.photo_lien || "",
    photo_detouree: plant.photo_detouree || "non",
  };
}

export function getCataloguePlantById(plantId) {
  if (!plantId) return null;
  return DISPLAY_BY_ID.get(plantId) || ORPHAN_BY_ID.get(plantId) || null;
}

export function getCataloguePlantsByIdMap() {
  const map = new Map(DISPLAY_BY_ID);
  for (const [id, p] of ORPHAN_BY_ID) map.set(id, p);
  return map;
}

export function getActiveCataloguePlants() {
  return BUILT.plants.filter((p) => p.actif !== false);
}

export function countByCategorie(plants = getActiveCataloguePlants()) {
  const counts = Object.fromEntries(CATALOGUE_CATEGORIES.map((c) => [c, 0]));
  for (const plant of plants) {
    if (counts[plant.categorie] != null) counts[plant.categorie] += 1;
  }
  return counts;
}

/** @deprecated */
export function countByFamille(plants = getActiveCataloguePlants()) {
  return countByCategorie(plants);
}

export function filterCataloguePlants({
  plants = getActiveCataloguePlants(),
  envie = null,
  envieTag = null,
  categorie = null,
  famille = null,
  exposition = null,
  search = null,
  populaireOnly = false,
} = {}) {
  let list = plants;
  const cat = categorie || famille;
  const envieFilter = envie || envieTag;

  if (populaireOnly) list = list.filter((p) => p.populaire);
  if (envieFilter) {
    list = list.filter((p) => p.envies?.includes(envieFilter));
  }
  if (cat) list = list.filter((p) => p.categorie === cat);
  if (exposition) {
    list = list.filter((p) =>
      String(p.exposition || "")
        .toLowerCase()
        .includes(String(exposition).toLowerCase())
    );
  }
  if (search) {
    const q = normalizeKey(search);
    list = list.filter(
      (p) => normalizeKey(p.nom).includes(q) || normalizeKey(p.nom_latin).includes(q)
    );
  }

  return list;
}

export function getPlantsBeautifulNow(plants = getActiveCataloguePlants(), date = new Date()) {
  const month = date.getMonth() + 1;
  return plants
    .filter((p) => p.mois_interet?.includes(month))
    .sort((a, b) => {
      const aYear = a.mois_interet?.length === 12 ? 1 : 0;
      const bYear = b.mois_interet?.length === 12 ? 1 : 0;
      return aYear - bYear;
    })
    .slice(0, 8);
}

export function getCategoriePlaceholderColor(categorie) {
  return CATEGORIE_PLACEHOLDER_COLORS[categorie] || "#8C7AB0";
}
