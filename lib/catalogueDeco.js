/**
 * @deprecated — préférer lib/catalogueAmenagements.js
 * Alias conservés pour jardins / promote existants.
 */

import {
  AMENAGEMENT_CATEGORIES,
  CATALOGUE_AMENAGEMENT_ID_MATCHES,
  CATALOGUE_AMENAGEMENT_UNMATCHED_LEGACY,
  amenagementToAnalysisResult,
  catalogueAmenagementClientId,
  countAmenagementsByCategorie,
  filterCatalogueAmenagements,
  getActiveCatalogueAmenagements,
  getCatalogueAmenagementById,
} from "@/lib/catalogueAmenagements";

export const DECO_FAMILLES = AMENAGEMENT_CATEGORIES;
export { AMENAGEMENT_CATEGORIES };
export const DECO_STYLE_TAGS = ["zen", "contemporain", "naturel", "mediterraneen", "Méditerranéen"];

export const CATALOGUE_DECO = getActiveCatalogueAmenagements();

export function catalogueDecoClientId(articleId) {
  return catalogueAmenagementClientId(articleId);
}

export function decoToAnalysisResult(article) {
  return amenagementToAnalysisResult(article);
}

export function getActiveCatalogueDeco() {
  return getActiveCatalogueAmenagements();
}

export function getCatalogueDecoById(id) {
  return getCatalogueAmenagementById(id);
}

export function countDecoByFamille(articles) {
  return countAmenagementsByCategorie(articles);
}

export function filterCatalogueDeco(opts) {
  return filterCatalogueAmenagements(opts);
}

export {
  CATALOGUE_AMENAGEMENT_ID_MATCHES,
  CATALOGUE_AMENAGEMENT_UNMATCHED_LEGACY,
};
