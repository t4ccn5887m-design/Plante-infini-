import { CATALOGUE_PHOTO_SURFACE } from "@/lib/cataloguePhotoConstants";

export function isCatalogueVegetalPhotoUrl(url) {
  return Boolean(url && String(url).includes("/catalogue/vegetal/"));
}

/** Styles img pour photos catalogue (contain, fond neutre). */
export function cataloguePhotoFillStyle(photoUrl, photoDetouree) {
  if (!isCatalogueVegetalPhotoUrl(photoUrl)) return null;
  const bg =
    photoDetouree === "oui" || photoDetouree === true ? "#FFFFFF" : CATALOGUE_PHOTO_SURFACE;
  return {
    objectFit: "contain",
    background: bg,
  };
}
