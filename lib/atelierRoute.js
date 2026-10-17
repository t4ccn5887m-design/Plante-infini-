/** Routes app Atelier (particulier + pro + lien client /b/*) — hors admin. */

export function isAtelierAppRoute(pathname, query) {
  if (typeof pathname !== "string") return false;
  if (pathname.startsWith("/b/")) return true;
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return false;
  if (pathname === "/connexion" && query?.profil === "pro") return true;
  if (pathname.startsWith("/pro")) return true;
  return true;
}
