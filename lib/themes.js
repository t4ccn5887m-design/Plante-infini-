/** Thématiques de navigation et d'organisation des albums Wilder */

export const NAV_THEMES = ["home", "potager", "randos", "jardin", "juniors"];

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

/** Emojis affichés uniquement dans la barre de navigation du bas */
export const BOTTOM_NAV_EMOJI = {
  home: "🏠",
  potager: "🥕",
  randos: "🥾",
  jardin: "🌿",
  juniors: "🦊",
};

export const THEME_META = {
  home: { emoji: "🏠", navKey: "nav.home" },
  potager: { emoji: "🥕", navKey: "nav.potager", defaultView: "list" },
  randos: { emoji: "🥾", navKey: "nav.randos", defaultView: "list" },
  jardin: { emoji: "🌿", navKey: "nav.jardin", defaultView: "list", hasHerbarium: true },
  juniors: { emoji: "🦊", navKey: "nav.juniors", defaultView: "list", isJuniors: true },
};

export function isAlbumTheme(id) {
  return ALBUM_THEMES.includes(id);
}

export function isThemeScreen(screen) {
  return ALBUM_THEMES.includes(screen);
}

/** Écran cible du bouton retour après un scan (origine transmise via returnScreen). */
export function resolveScanBackScreen(returnScreen) {
  if (returnScreen === "album-detail") return "album-detail";
  if (returnScreen === "home") return "home";
  if (isThemeScreen(returnScreen)) return returnScreen;
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
