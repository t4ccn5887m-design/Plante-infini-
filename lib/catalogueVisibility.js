/** Élément visible dans Idées / familles / recherche : photo + non masqué. */

export function hasCataloguePhoto(item) {
  return Boolean(String(item?.photo_url || "").trim());
}

export function isCatalogueEntryBrowsable(item) {
  if (!item) return false;
  if (item.actif === false) return false;
  if (item.masque === true) return false;
  return hasCataloguePhoto(item);
}
