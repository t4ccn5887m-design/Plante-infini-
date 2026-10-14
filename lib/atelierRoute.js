/** Routes app Atelier (particulier + pro) — hors /b/* et admin. */

export function isAtelierAppRoute(pathname, query) {
  if (typeof pathname !== "string") return false;
  if (pathname.startsWith("/b/")) return false;
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return false;
  if (pathname === "/connexion" && query?.profil === "pro") return true;
  if (pathname.startsWith("/pro")) return true;
  return true;
}
