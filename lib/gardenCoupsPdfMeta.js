import { getCatalogueDecoById } from "@/lib/catalogueDeco";
import { getCatalogueMineralById } from "@/lib/catalogueMinerals";
import { getCataloguePlantById } from "@/lib/cataloguePlants";
import { gardenCoupsAnalysisId } from "@/lib/gardenCoupsAnalysisId";

export function capitalizeCategoryLabel(label) {
  const s = (label || "").trim();
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** @typedef {'vegetal' | 'mineral' | 'amenagement'} GardenCoupsPdfKind */

/**
 * @param {import('@/lib/gardenCoupsItems').normalizeCoupsItem} item
 */
export function enrichGardenCoupsItemForPdf(item) {
  const d = item?.discovery || {};
  let pdfKind = "vegetal";
  let photo = item?.photo || null;
  let categoryLabel = "";

  if (d.catalogue_mineral_id) {
    pdfKind = "mineral";
    const mineral = getCatalogueMineralById(d.catalogue_mineral_id);
    photo = photo || mineral?.photo_url || null;
    categoryLabel = mineral?.categorie || mineral?.famille || "Minéral";
  } else if (d.catalogue_deco_id) {
    pdfKind = "amenagement";
    const deco = getCatalogueDecoById(d.catalogue_deco_id);
    photo = photo || deco?.photo_url || null;
    categoryLabel = deco?.categorie || deco?.famille || "Aménagement";
  } else if (d.catalogue_plant_id) {
    pdfKind = "vegetal";
    const plant = getCataloguePlantById(d.catalogue_plant_id);
    photo = photo || plant?.photo_url || null;
    categoryLabel = plant?.categorie || plant?.famille || "Plante";
  } else {
    pdfKind = "vegetal";
    categoryLabel = (d.nom_latin || "").trim() || "Plante";
  }

  return {
    ...item,
    photo,
    pdfKind,
    categoryLabel: capitalizeCategoryLabel(categoryLabel),
    analysisId: gardenCoupsAnalysisId(item),
  };
}

export const COUPS_GROUP_ORDER = [
  { id: "vegetal", title: "Végétal" },
  { id: "mineral", title: "Paillages" },
  { id: "amenagement", title: "Aménagements" },
];

export function groupCoupsForPdf(preparedItems) {
  const groups = COUPS_GROUP_ORDER.map((g) => ({
    ...g,
    items: preparedItems.filter((it) => it.pdfKind === g.id),
  })).filter((g) => g.items.length > 0);
  return groups;
}
