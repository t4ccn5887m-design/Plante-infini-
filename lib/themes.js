/** Navigation principale Wilder (3 onglets) */

export const NAV_THEMES = ["potager", "herbier", "juniors"];

/** Thèmes d'albums en base (legacy randos/jardin conservés pour les données existantes) */
export const ALBUM_THEMES = ["potager", "randos", "jardin", "juniors"];

export const DEFAULT_ALBUM_THEME = "jardin";

export const LEGACY_ALBUM_THEME = "jardin";

export const PLANT_TYPES = new Set([
  "plante",
  "fleur",
  "arbre",
  "champignon",
  "fruit",
  "legume",
]);

export const BOTTOM_NAV_EMOJI = {
  potager: "🥕",
  herbier: "🌿",
  juniors: "🦊",
};

export const THEME_META = {
  potager: { emoji: "🥕", navKey: "nav.potager", defaultView: "list" },
  herbier: { emoji: "🌿", navKey: "nav.herbier" },
  juniors: { emoji: "🦊", navKey: "nav.juniors", defaultView: "list", isJuniors: true },
  /** Legacy — données existantes uniquement */
  home: { emoji: "🏠", navKey: "nav.herbier" },
  randos: { emoji: "🥾", navKey: "nav.randos", defaultView: "list" },
  jardin: { emoji: "🌿", navKey: "nav.jardin", defaultView: "list", hasHerbarium: true },
};

export function isNavScreen(id) {
  return NAV_THEMES.includes(id);
}

export function isAlbumTheme(id) {
  return ALBUM_THEMES.includes(id);
}

export function isThemeScreen(screen) {
  return isNavScreen(screen);
}

/** Écran cible du bouton retour après un scan. */
export function resolveScanBackScreen(returnScreen) {
  if (returnScreen === "album-detail") return "album-detail";
  if (returnScreen === "home") return "home";
  if (isNavScreen(returnScreen)) return returnScreen;
  if (isAlbumTheme(returnScreen)) return "home";
  return "home";
}

export function normalizeAlbumTheme(album) {
  if (album?.theme && ALBUM_THEMES.includes(album.theme)) return album.theme;
  return LEGACY_ALBUM_THEME;
}

export function normalizeAlbum(album) {
  if (!album) return album;
  return {
    ...album,
    theme: normalizeAlbumTheme(album),
  };
}

export function normalizeAlbums(albums) {
  if (!Array.isArray(albums)) return [];
  return albums.map(normalizeAlbum);
}

export function filterAlbumsByTheme(albums, themeId) {
  return albums.filter((a) => normalizeAlbumTheme(a) === themeId);
}

export function getRootAlbums(albums, themeId) {
  return filterAlbumsByTheme(albums, themeId).filter((a) => !a.parentId);
}

export function getSubAlbums(albums, parentId) {
  return albums.filter((a) => a.parentId === parentId);
}

export function isPlantDiscovery(discovery) {
  return PLANT_TYPES.has(discovery?.type);
}

export function getHerbariumDiscoveries(albums, discoveries, themeId = "jardin") {
  const themedAlbums = filterAlbumsByTheme(albums, themeId);
  const ids = new Set();
  for (const album of themedAlbums) {
    for (const id of album.discoveryIds || []) ids.add(id);
  }
  return discoveries
    .filter((d) => ids.has(d.id) && isPlantDiscovery(d))
    .sort((a, b) => new Date(b.discoveredAt) - new Date(a.discoveredAt));
}

/** Toutes les découvertes, tri chronologique (Mon Herbier). */
export function getAllDiscoveriesChronological(discoveries) {
  return [...(discoveries || [])].sort(
    (a, b) => new Date(b.discoveredAt || 0) - new Date(a.discoveredAt || 0)
  );
}

/** Photos liées au potager (albums + plants enregistrés). */
export function getPotagerDiscoveries(albums, discoveries, potagerPlants = []) {
  const ids = new Set();
  filterAlbumsByTheme(albums, "potager").forEach((a) => {
    (a.discoveryIds || []).forEach((id) => ids.add(id));
  });
  (potagerPlants || []).forEach((p) => {
    if (p.discoveryId) ids.add(p.discoveryId);
  });
  return discoveries
    .filter((d) => ids.has(d.id))
    .sort((a, b) => new Date(b.discoveredAt || 0) - new Date(a.discoveredAt || 0));
}
