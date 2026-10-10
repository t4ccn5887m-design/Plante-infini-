import { getActiveCataloguePlants } from "@/lib/cataloguePlants";

export function getCataloguePhotoCreditsList() {
  return getActiveCataloguePlants()
    .filter((p) => p.photo_url)
    .map((p) => ({
      id: p.id,
      nom: p.nom,
      nom_latin: p.nom_latin,
      photo_source: p.photo_source,
      photo_auteur: p.photo_auteur,
      photo_licence: p.photo_licence,
      photo_licence_url: p.photo_licence_url,
      photo_lien: p.photo_lien,
      photo_detouree: p.photo_detouree,
      photo_url: p.photo_url,
    }))
    .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
}
