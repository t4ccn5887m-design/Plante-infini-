import { getCatalogueDecoById } from "@/lib/catalogueDeco";
import { getCatalogueMineralById } from "@/lib/catalogueMinerals";
import { getCataloguePlantById } from "@/lib/cataloguePlants";
import { getGardenStyleById } from "@/lib/catalogueStyles";
import { gardenCoupsAnalysisId } from "@/lib/gardenCoupsAnalysisId";

export function capitalizeCategoryLabel(label) {
  const s = (label || "").trim();
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** @typedef {'vegetal' | 'mineral' | 'bordures' | 'amenagement' | 'style'} GardenCoupsPdfKind */

/**
 * @param {import('@/lib/gardenCoupsItems').normalizeCoupsItem} item
 */
export function enrichGardenCoupsItemForPdf(item) {
  const d = item?.discovery || {};
  let pdfKind = "vegetal";
  let photo = item?.photo || null;
  let categoryLabel = "";

  if (d.catalogue_style_id) {
    pdfKind = "style";
    const style = getGardenStyleById(d.catalogue_style_id);
    photo = photo || style?.photo_url || null;
    categoryLabel = "Style de jardin";
  } else if (d.catalogue_mineral_id) {
    pdfKind = "mineral";
    const mineral = getCatalogueMineralById(d.catalogue_mineral_id);
    photo = photo || mineral?.photo_url || null;
    categoryLabel = mineral?.categorie || mineral?.famille || "Minéral";
  } else if (d.catalogue_deco_id) {
    const deco = getCatalogueDecoById(d.catalogue_deco_id);
    photo = photo || deco?.photo_url || null;
    const univers = String(deco?.univers || "").trim();
    if (univers === "Bordures") {
      pdfKind = "bordures";
      categoryLabel = deco?.categorie || "Bordures";
    } else {
      pdfKind = "amenagement";
      categoryLabel = deco?.categorie || deco?.famille || "Aménagement";
    }
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
  { id: "bordures", title: "Bordures" },
  { id: "amenagement", title: "Aménagements" },
  { id: "style", title: "Jardins qui lui plaisent" },
];

export function groupCoupsForPdf(preparedItems) {
  const groups = COUPS_GROUP_ORDER.map((g) => ({
    ...g,
    items: preparedItems.filter((it) => it.pdfKind === g.id),
  })).filter((g) => g.items.length > 0);
  return groups;
}
