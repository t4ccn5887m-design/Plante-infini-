/** Routes app particulier (thème Atelier) — hors /pro, /b/*, admin. */

export function isAtelierAppRoute(pathname) {
  if (typeof pathname !== "string") return false;
  if (pathname.startsWith("/pro")) return false;
  if (pathname.startsWith("/b/")) return false;
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return false;
  return true;
}
