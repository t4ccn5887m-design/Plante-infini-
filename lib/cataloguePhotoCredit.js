/** Crédit photo fiche catalogue — Pixabay ou Wikimedia. */

export function cataloguePhotoWasModified(plant) {
  if (!plant?.photo_url) return false;
  if (plant.photo_detouree === "oui" || plant.photo_detouree === true) return true;
  if (plant.photo_source === "Wikimedia") return true;
  return false;
}

export function buildCataloguePhotoCreditParts(plant) {
  if (!plant?.photo_url || !plant.photo_auteur) return null;

  const modified = cataloguePhotoWasModified(plant);
  const modifiedSuffix = modified ? " (modifiée)" : "";

  if (plant.photo_source === "Wikimedia") {
    return {
      kind: "wikimedia",
      author: plant.photo_auteur,
      license: plant.photo_licence || "Licence",
      licenseUrl: plant.photo_licence_url || "",
      fileUrl: plant.photo_lien || "",
      modifiedSuffix,
    };
  }

  return {
    kind: "pixabay",
    author: plant.photo_auteur,
    pageUrl: plant.photo_lien || "",
  };
}
