/** Outils admin photos catalogue — actifs uniquement en `next dev` local. */

export function isLocalPhotoAdminEnabled() {
  return process.env.NODE_ENV === "development";
}
