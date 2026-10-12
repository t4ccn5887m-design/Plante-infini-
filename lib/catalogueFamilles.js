import { countByCategorie, getActiveCataloguePlants } from "@/lib/cataloguePlants";
import { countMineralsByFamille, getActiveCatalogueMinerals } from "@/lib/catalogueMinerals";
import { countAmenagementsByCategorie, getActiveCatalogueAmenagements } from "@/lib/catalogueAmenagements";

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

const MINERAL_FAMILLES = [
  { categorie: "Dallages et pavés", title: "Dallages et pavés", phrase: "Terrasse, allée", icon: "tiles" },
  {
    categorie: "Graviers et paillages minéraux",
    title: "Graviers et paillages",
    phrase: "Allées, massifs sans désherbage",
    icon: "gravel",
  },
  { categorie: "Murets et bordures", title: "Murets et bordures", phrase: "Délimiter, retenir la terre", icon: "wall" },
  { categorie: "Pas japonais", title: "Pas japonais", phrase: "Un chemin dans la pelouse", icon: "steps" },
  { categorie: "Pierres et rochers", title: "Pierres et rochers", phrase: "Un point fort dans un massif", icon: "rock" },
  {
    categorie: "Sols coulés et stabilisés",
    title: "Sols stabilisés",
    phrase: "Allée carrossable, sans joints",
    icon: "poured",
  },
];

const AMENAGEMENT_FAMILLES = [
  { categorie: "Pergolas et ombrages", title: "Pergolas et ombrages", phrase: "Un coin à l'ombre", icon: "pergola" },
  { categorie: "Bassins et eau", title: "Bassins et eau", phrase: "Le bruit de l'eau", icon: "water" },
  { categorie: "Éclairage", title: "Éclairage", phrase: "Profiter le soir", icon: "light" },
  { categorie: "Mobilier", title: "Mobilier", phrase: "Manger, se poser", icon: "furniture" },
  { categorie: "Bacs et jardinières", title: "Bacs et jardinières", phrase: "Planter hors-sol", icon: "planter" },
  { categorie: "Clôtures et brise-vue", title: "Clôtures et brise-vue", phrase: "Fermer, se protéger", icon: "fence" },
  { categorie: "Terrasses en bois", title: "Terrasses en bois", phrase: "Un sol chaleureux", icon: "deck" },
  { categorie: "Structures", title: "Structures", phrase: "Abri, cuisine d'été", icon: "structure" },
];

/** Pastilles « Ou selon vos envies » (végétal). */
export const VEGETAL_ENVIE_CHIPS = [
  { label: "Jardin sec, plein soleil", filters: { arrosage: "Faible" } },
  { label: "Un coin d'ombre", filters: { envie: "Un coin d'ombre" } },
  { label: "Peu d'entretien", filters: { envie: "Peu d'entretien" } },
  { label: "Couleur toute l'année", filters: { envie: "Couleur toute l'année" } },
  { label: "Attirer les abeilles", filters: { envie: "Attirer les abeilles" } },
];

const UNIVERSE_META = {
  vegetal: {
    title: "Végétal",
    searchLabel: "végétal",
    totalUnit: "plantes",
    familles: VEGETAL_FAMILLES,
    totalCount: () => getActiveCataloguePlants().length,
    counts: () => countByCategorie(),
  },
  mineral: {
    title: "Minéral",
    searchLabel: "minéral",
    totalUnit: "matériaux",
    familles: MINERAL_FAMILLES,
    totalCount: () => getActiveCatalogueMinerals().length,
    counts: () => countMineralsByFamille(),
  },
  deco: {
    title: "Aménagements",
    searchLabel: "aménagements",
    totalUnit: "idées",
    familles: AMENAGEMENT_FAMILLES,
    totalCount: () => getActiveCatalogueAmenagements().length,
    counts: () => countAmenagementsByCategorie(),
  },
};

export function getCatalogueFamillesScreenData(universe) {
  const meta = UNIVERSE_META[universe];
  if (!meta) return null;

  const counts = meta.counts();
  const total = meta.totalCount();
  const tiles = meta.familles.map((famille, index) => {
    const palette = FAMILLE_TILE_PALETTE[index % FAMILLE_TILE_PALETTE.length];
    return {
      ...famille,
      count: counts[famille.categorie] ?? 0,
      bg: palette.bg,
      ink: palette.ink,
    };
  });

  return {
    universe,
    title: meta.title,
    searchLabel: meta.searchLabel,
    total,
    totalUnit: meta.totalUnit,
    subtitle: `${total} ${meta.totalUnit} · que cherchez-vous ?`,
    tiles,
    showEnvies: universe === "vegetal",
  };
}
