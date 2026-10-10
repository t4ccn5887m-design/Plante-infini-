import { getActiveCatalogueAmenagements } from "@/lib/catalogueAmenagements";
import { getActiveCatalogueMinerals } from "@/lib/catalogueMinerals";
import { getActiveCataloguePlants } from "@/lib/cataloguePlants";

function mapCreditRow(item, univers) {
  return {
    id: item.id,
    univers,
    nom: item.nom,
    nom_latin: item.nom_latin || "",
    photo_source: item.photo_source,
    photo_auteur: item.photo_auteur,
    photo_licence: item.photo_licence,
    photo_licence_url: item.photo_licence_url,
    photo_lien: item.photo_lien,
    photo_detouree: item.photo_detouree,
    photo_url: item.photo_url,
  };
}

export function getCataloguePhotoCreditsList() {
  const rows = [
    ...getActiveCataloguePlants()
      .filter((p) => p.photo_url)
      .map((p) => mapCreditRow(p, "Végétal")),
    ...getActiveCatalogueMinerals()
      .filter((p) => p.photo_url)
      .map((p) => mapCreditRow(p, "Minéral")),
    ...getActiveCatalogueAmenagements()
      .filter((p) => p.photo_url)
      .map((p) => mapCreditRow(p, "Aménagements")),
  ];
  return rows.sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
}
