import { CATALOGUE_PHOTO_SURFACE } from "@/lib/cataloguePhotoConstants";

export function isCatalogueVegetalPhotoUrl(url) {
  return Boolean(url && String(url).includes("/catalogue/vegetal/"));
}

export function isCatalogueCatalogPhotoUrl(url) {
  return Boolean(
    url &&
      (String(url).includes("/catalogue/vegetal/") ||
        String(url).includes("/catalogue/mineral/") ||
        String(url).includes("/catalogue/amenagements/"))
  );
}

/** Styles img pour photos catalogue (contain, fond neutre). */
export function cataloguePhotoFillStyle(photoUrl, photoDetouree) {
  if (!isCatalogueCatalogPhotoUrl(photoUrl)) return null;
  const bg =
    photoDetouree === "oui" || photoDetouree === true ? "#FFFFFF" : CATALOGUE_PHOTO_SURFACE;
  return {
    objectFit: "contain",
    background: bg,
  };
}
