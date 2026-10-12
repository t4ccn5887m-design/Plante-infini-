import {
  countAmenagementsByCategorie,
  getActiveCatalogueBordures,
} from "@/lib/catalogueAmenagements";
import { countByCategorie, getActiveCataloguePlants } from "@/lib/cataloguePlants";
import { countMineralsByFamille, getActiveCatalogueMinerals } from "@/lib/catalogueMinerals";

export const FAMILLE_TILE_PALETTE = [
  { bg: "#E6F0E3", ink: "#4E7B52" },
  { bg: "#F6E7D8", ink: "#C0652E" },
  { bg: "#ECE6F5", ink: "#6A5896" },
  { bg: "#E3EEF3", ink: "#3F6F86" },
  { bg: "#F3ECD9", ink: "#9A7B2F" },
  { bg: "#F5E4E4", ink: "#A6545A" },
  { bg: "#EEEAE3", ink: "#5F665D" },
  { bg: "#E4F0EC", ink: "#3E7A68" },
];

const VEGETAL_FAMILLES = [
  { categorie: "Arbres", title: "Arbres", phrase: "De l'ombre, un arbre phare", icon: "tree" },
  { categorie: "Arbustes", title: "Arbustes", phrase: "Du volume et des fleurs, 1 à 3 m", icon: "shrub" },
  { categorie: "Haies", title: "Haies", phrase: "Se cacher des voisins", icon: "hedge" },
  { categorie: "Grimpantes", title: "Grimpantes", phrase: "Habiller un mur, une pergola", icon: "vine" },
  {
    categorie: "Fleurs et vivaces",
    title: "Fleurs et vivaces",
    phrase: "Des massifs qui reviennent chaque année",
    icon: "flower",
  },
  { categorie: "Graminées", title: "Graminées", phrase: "Légèreté et mouvement", icon: "grass" },
  { categorie: "Couvre-sols", title: "Couvre-sols", phrase: "Remplacer le gazon, moins désherber", icon: "ground" },
  { categorie: "Aromatiques", title: "Aromatiques", phrase: "À sentir et à cuisiner", icon: "herb" },
];

const PAILLAGES_FAMILLES = [
  {
    categorie: "Blancs et clairs",
    title: "Blancs et clairs",
    phrase: "Marbre, galets blancs, calcaire",
    swatches: ["#FFFFFF", "#EDE9E2", "#DCD6CB"],
  },
  {
    categorie: "Gris et noirs",
    title: "Gris et noirs",
    phrase: "Basalte, ardoise, galets",
    swatches: ["#9A9EA1", "#5C6266", "#2C2F31"],
  },
  {
    categorie: "Tons chauds",
    title: "Tons chauds",
    phrase: "Rose, ocre, rouille, violet",
    swatches: ["#D9A48A", "#B5532F", "#C9A15B", "#7A4A5E"],
  },
  {
    categorie: "Paillages naturels",
    title: "Paillages naturels",
    phrase: "Écorce, copeaux, lin",
    swatches: ["#7A4E2D", "#B48555", "#D9C08A"],
  },
];

const BORDURES_FAMILLE_META = {
  Métal: { phrase: "Corten, acier, aluminium", icon: "metal" },
  "Bois et osier": { phrase: "Rondins, planches, osier", icon: "wood" },
  Pierre: { phrase: "Pierre naturelle, pavés", icon: "stone" },
  Brique: { phrase: "Brique, terre cuite", icon: "brick" },
};

/** Pastilles « Selon vos envies » (écran Idées). */
export const IDEES_ENVIE_CHIPS = [
  { label: "Se cacher des voisins", filters: { envie: "Se cacher des voisins" } },
  { label: "Peu d'entretien", filters: { envie: "Peu d'entretien" } },
  { label: "Jardin sec", filters: { arrosage: "Faible" } },
  { label: "Un coin d'ombre", filters: { envie: "Un coin d'ombre" } },
  { label: "Attirer les abeilles", filters: { envie: "Attirer les abeilles" } },
];

/** @deprecated — familles végétal (écran familles). */
export const VEGETAL_ENVIE_CHIPS = IDEES_ENVIE_CHIPS;

function buildBorduresFamilles() {
  const counts = countAmenagementsByCategorie(getActiveCatalogueBordures());
  return Object.keys(counts)
    .filter((cat) => counts[cat] > 0)
    .sort((a, b) => a.localeCompare(b, "fr"))
    .map((categorie) => {
      const meta = BORDURES_FAMILLE_META[categorie] || { phrase: categorie, icon: "wall" };
      return {
        categorie,
        title: categorie,
        phrase: meta.phrase,
        icon: meta.icon,
        count: counts[categorie],
      };
    });
}

const UNIVERSE_META = {
  vegetal: {
    title: "Végétal",
    searchLabel: "végétal",
    totalUnit: "plantes",
    familles: VEGETAL_FAMILLES,
    totalCount: () => getActiveCataloguePlants().length,
    counts: () => countByCategorie(),
    showEnvies: false,
  },
  mineral: {
    title: "Paillages",
    searchLabel: "paillages",
    totalUnit: "paillages",
    familles: PAILLAGES_FAMILLES,
    totalCount: () => getActiveCatalogueMinerals().length,
    counts: () => countMineralsByFamille(),
    showEnvies: false,
    showGrainLegend: true,
  },
  bordures: {
    title: "Bordures",
    searchLabel: "bordures",
    totalUnit: "bordures",
    familles: () => buildBorduresFamilles(),
    totalCount: () => getActiveCatalogueBordures().length,
    counts: () => countAmenagementsByCategorie(getActiveCatalogueBordures()),
    showEnvies: false,
    hubTab: "deco",
    hubFilters: { univers: "Bordures" },
  },
};

export function getCatalogueFamillesScreenData(universe) {
  const meta = UNIVERSE_META[universe];
  if (!meta) return null;

  const counts = meta.counts();
  const total = meta.totalCount();
  const familleDefs = typeof meta.familles === "function" ? meta.familles() : meta.familles;

  const tiles = familleDefs
    .map((famille, index) => {
      const palette = FAMILLE_TILE_PALETTE[index % FAMILLE_TILE_PALETTE.length];
      const count = famille.count ?? counts[famille.categorie] ?? 0;
      if (count <= 0) return null;
      return {
        ...famille,
        count,
        bg: famille.bg || palette.bg,
        ink: famille.ink || palette.ink,
      };
    })
    .filter(Boolean);

  return {
    universe,
    title: meta.title,
    searchLabel: meta.searchLabel,
    total,
    totalUnit: meta.totalUnit,
    subtitle:
      universe === "mineral"
        ? `${total} paillage${total > 1 ? "s" : ""} · quelle couleur au pied de vos plantes ?`
        : `${total} ${meta.totalUnit} · que cherchez-vous ?`,
    tiles,
    showEnvies: meta.showEnvies === true,
    showGrainLegend: meta.showGrainLegend === true,
    hubTab: meta.hubTab || universe,
    hubFilters: meta.hubFilters || {},
  };
}
