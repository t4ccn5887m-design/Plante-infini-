/**
 * Styles de jardin — sevya/catalogue-styles.json (+ futur sevya/realisations via script apply-vues).
 */

import stylesCatalogueJson from "../sevya/catalogue-styles.json";
import stylesRealisationsJson from "../sevya/catalogue-styles-realisations.json";

function mapStyle(row) {
  return {
    id: row.id,
    nom: row.nom || "Jardin",
    photo_url: row.photo_url || null,
    photo_source: row.photo_source || "",
    photo_auteur: row.photo_auteur || "",
    photo_licence: row.photo_licence || "",
    photo_licence_url: row.photo_licence_url || "",
    photo_lien: row.photo_lien || "",
    photo_detouree: row.photo_detouree || "non",
    origin: row.origin || "vues",
    pastille: row.pastille || "",
  };
}

const REALISATIONS = (Array.isArray(stylesRealisationsJson) ? stylesRealisationsJson : []).map(mapStyle);
const VUES = (Array.isArray(stylesCatalogueJson) ? stylesCatalogueJson : []).map(mapStyle);
const ALL = [...REALISATIONS, ...VUES];
const BY_ID = new Map(ALL.map((s) => [s.id, s]));

export function getAllGardenStyles() {
  return ALL.filter((s) => String(s.photo_url || "").trim());
}

export function getGardenStyleById(id) {
  if (!id) return null;
  return BY_ID.get(id) || null;
}

export function countVisibleGardenStyles() {
  return getAllGardenStyles().length;
}

export function hasVisibleGardenStyles() {
  return countVisibleGardenStyles() > 0;
}

export function catalogueStyleClientId(styleId) {
  return `catalogue-style:${styleId}`;
}

export function styleToAnalysisResult(style) {
  if (!style) return null;
  return {
    id: catalogueStyleClientId(style.id),
    catalogue_style_id: style.id,
    source: "catalogue_style",
    kind: "style",
    type: "style",
    nom: style.nom || "Jardin",
    photo: style.photo_url || null,
    photo_source: style.photo_source || "",
    photo_auteur: style.photo_auteur || "",
    photo_licence: style.photo_licence || "",
    photo_licence_url: style.photo_licence_url || "",
    photo_lien: style.photo_lien || "",
    photo_detouree: style.photo_detouree || "non",
  };
}
