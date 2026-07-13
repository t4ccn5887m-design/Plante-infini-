/** Navigation principale Wilder (3 onglets) */

/**
 * Palette UI Wilder v2 — source unique pour les écrans du parcours jardin.
 * Végétal (vert) · minéral (pierre) · goût/floraison (violet) · hall d'accueil (3 cartes).
 */
export const WILDER_COLORS = {
  ink: "#1e2b23",
  secondary: "#4c554a",
  muted: "#8b9084",
  border: "#e6e2d8",
  borderStrong: "#cbc6b8",
  screen: "#ffffff",
  shellBg: "radial-gradient(120% 120% at 50% 0%, #e2ddcf 0%, #cfc9ba 100%)",
  error: "#9b3b3b",

  /** Végétal */
  greenTint: "#e7efe6",
  greenInk: "#3c6b47",

  /** Minéral */
  stoneTint: "#eae6de",
  stoneInk: "#6b6455",

  /** Goût déduit / floraison */
  purpleTint: "#efedfb",
  purpleInk: "#6a58a2",

  heart: "#c6504c",
  heartOff: "#b8bdb0",
  note: "#f4f2ea",
  hint: "#f2f5ef",
  saved: "#f2f5ef",
  primary: "#2f5a3c",
  active: "#2f5a3c",

  heroGradient: "linear-gradient(160deg,#7fa07f,#3d6b47 55%,#2c5236)",
  heroGradientShort: "linear-gradient(160deg,#7fa07f,#3d6b47)",

  /** Cartes « Par où commencer ? » (accueil jardin vide) */
  hall: {
    scanner: { tint: "#fbf4ea", ink: "#e07a4d" },
    catalogue: { tint: "#eef5ea", ink: "#5a9a5f" },
    ambiance: { tint: "#f3eefb", ink: "#8b6fc4" },
  },
};

export const NAV_THEMES = ["potager", "juniors"];

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
  juniors: "🦊",
};

export const THEME_META = {
  potager: { emoji: "🥕", navKey: "nav.potager", defaultView: "list" },
  juniors: { emoji: "🦊", navKey: "nav.juniors", defaultView: "list", isJuniors: true },
  /** Legacy — données existantes uniquement */
  home: { emoji: "🏠", navKey: "nav.trouvailles" },
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
  if (returnScreen === "ma-palette-detail") return "ma-palette-detail";
  if (returnScreen === "ma-palette") return "ma-palette";
  if (returnScreen === "mes-scans") return "mes-scans";
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
