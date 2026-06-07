/** Incrémenter à chaque changement d’icône / splash PWA pour forcer la mise à jour. */
export const PWA_ICON_VERSION = "20250605";
export const PWA_CACHE_VERSION = "wilder-v4";

export function pwaAsset(path) {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}v=${PWA_ICON_VERSION}`;
}
