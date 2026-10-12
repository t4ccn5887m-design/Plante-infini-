/** Navigation principale Wilder (3 onglets) */

/**
 * Palette UI Wilder v2 — source unique pour les écrans du parcours jardin.
 * Végétal (vert) · minéral (pierre) · goût/floraison (violet) · hall d'accueil (3 cartes).
 */
export const WILDER_COLORS = {
  ink: "#F1ECE2",
  secondary: "#A9B3A6",
  muted: "#A9B3A6",
  border: "#2A3A30",
  borderStrong: "#2A3A30",
  screen: "#0F1A14",
  shellBg: "#0F1A14",
  error: "#E07A6A",

  /** Végétal */
  greenTint: "#17241C",
  greenInk: "#C9D6B8",

  /** Minéral */
  stoneTint: "#17241C",
  stoneInk: "#C9D6B8",

  /** Déco (terracotta — aligné carte Scan accueil) */
  decoTint: "#17241C",
  decoInk: "#D9A47A",

  /** Goût déduit / floraison */
  purpleTint: "#17241C",
  purpleInk: "#C9D6B8",

  heart: "#E07A6A",
  heartOff: "#A9B3A6",
  note: "#17241C",
  hint: "#17241C",
  saved: "#17241C",
  primary: "#F1ECE2",
  active: "#C9D6B8",

  heroGradient: "linear-gradient(160deg,#7fa07f,#3d6b47 55%,#2c5236)",
  heroGradientShort: "linear-gradient(160deg,#7fa07f,#3d6b47)",

  /** Cartes « Par où commencer ? » (accueil jardin vide) */
  hall: {
    scanner: { tint: "#fbf4ea", ink: "#e07a4d" },
    catalogue: { tint: "#eef5ea", ink: "#5a9a5f" },
    ambiance: { tint: "#f3eefb", ink: "#8b6fc4" },
  },
};

/** Photos hall catalogue — remplacer par vos URLs locales quand prêtes. */
export const CATALOGUE_HALL_IMAGES = {
  /** Feuillage luxuriant / jardin verdoyant */
  vegetal:
    "https://images.unsplash.com/photo-1694717192079-1d7deb9b51a1?w=800&q=80",
  /** Jardin zen : gravier, pierres, paillage minéral */
  mineral:
    "https://images.unsplash.com/photo-1718244200930-3ce5b5b40607?w=800&q=80",
  /** Terrasse avec mobilier, pots et poterie */
  deco:
    "https://images.unsplash.com/photo-1652545790678-a42918e03fdc?w=800&q=80",
  /** Villa toscane et jardin paysager méditerranéen */
  idees:
    "https://images.unsplash.com/photo-1760681555936-9ed26729ff92?w=800&q=80",
};

/** Barre de navigation flottante (WilderTabBar) */
export const WILDER_TAB_BAR = {
  marginX: 10,
  marginBottom: 10,
  borderRadius: 22,
  shadow: "none",
  bgGlass: "rgba(23, 36, 28, 0.92)",
  bgFallback: "rgba(23, 36, 28, 0.92)",
  blur: "16px",
  /** Hauteur barre (FAB 56px + label) + marge flottante (10) + buffer */
  contentPaddingBottom: 88,
  maxWidth: 380,
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
  if (returnScreen === "coups-de-coeur") return "coups-de-coeur";
  if (returnScreen === "catalogue") return "catalogue";
  if (returnScreen === "brief") return "brief";
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
