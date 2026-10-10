import { getActiveCatalogueAmenagements } from "@/lib/catalogueAmenagements";
import { getActiveCatalogueMinerals } from "@/lib/catalogueMinerals";
import { getActiveCataloguePlants } from "@/lib/cataloguePlants";

function hasAmbiance(item, ambianceName) {
  const tags = item?.ambiances;
  if (!Array.isArray(tags) || !ambianceName) return false;
  return tags.includes(ambianceName);
}

function sortWithPhotoFirst(items) {
  return [...items].sort((a, b) => {
    const pa = a.photo_url ? 1 : 0;
    const pb = b.photo_url ? 1 : 0;
    if (pa !== pb) return pb - pa;
    return (a.nom || "").localeCompare(b.nom || "", "fr");
  });
}

export function getCataloguePlantsForAmbiance(ambianceName, limit = 8) {
  const plants = getActiveCataloguePlants().filter((p) => hasAmbiance(p, ambianceName));
  return sortWithPhotoFirst(plants).slice(0, limit);
}

export function getCatalogueMineralsForAmbiance(ambianceName, limit = 4) {
  const minerals = getActiveCatalogueMinerals().filter((m) => hasAmbiance(m, ambianceName));
  return sortWithPhotoFirst(minerals).slice(0, limit);
}

export function getCatalogueAmenagementsForAmbiance(ambianceName, limit = 4) {
  const items = getActiveCatalogueAmenagements().filter((m) => hasAmbiance(m, ambianceName));
  return sortWithPhotoFirst(items).slice(0, limit);
}

export function getCatalogueMaterialsForAmbiance(ambianceName, limit = 6) {
  const minerals = getCatalogueMineralsForAmbiance(ambianceName, limit);
  if (minerals.length >= limit) return minerals.map((m) => ({ ...m, kind: "mineral" }));
  const room = limit - minerals.length;
  const amenagements = getCatalogueAmenagementsForAmbiance(ambianceName, room);
  return [
    ...minerals.map((m) => ({ ...m, kind: "mineral" })),
    ...amenagements.map((a) => ({ ...a, kind: "amenagement" })),
  ];
}
