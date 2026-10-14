import { getActiveCatalogueBordures } from "@/lib/catalogueAmenagements";
import { getActiveCatalogueMinerals } from "@/lib/catalogueMinerals";
import { getActiveCataloguePlants } from "@/lib/cataloguePlants";
import { getAllGardenStyles } from "@/lib/catalogueStyles";

/** Photo représentative d'une famille (tuiles végétal / paillages / bordures). */
export function getFamilleTileCoverUrl(universe, categorie) {
  if (!categorie) return null;
  if (universe === "vegetal") {
    return (
      getActiveCataloguePlants().find((p) => p.categorie === categorie && p.photo_url)?.photo_url ||
      null
    );
  }
  if (universe === "mineral") {
    return (
      getActiveCatalogueMinerals().find((m) => m.categorie === categorie && m.photo_url)?.photo_url ||
      getActiveCatalogueMinerals().find((m) => m.photo_url)?.photo_url ||
      null
    );
  }
  if (universe === "bordures") {
    return (
      getActiveCatalogueBordures().find((b) => b.categorie === categorie && b.photo_url)?.photo_url ||
      getActiveCatalogueBordures().find((b) => b.photo_url)?.photo_url ||
      null
    );
  }
  return null;
}

/** Première photo disponible pour la carte catégorie Idées (réalisation prioritaire si dispo). */
export function getIdeesCategoryCoverUrl(cardId) {
  if (cardId === "vegetal") {
    return getActiveCataloguePlants().find((p) => p.photo_url)?.photo_url || null;
  }
  if (cardId === "mineral") {
    const minerals = getActiveCatalogueMinerals();
    const withPhoto = minerals.find((m) => m.photo_url);
    return withPhoto?.photo_url || null;
  }
  if (cardId === "bordures") {
    return getActiveCatalogueBordures().find((b) => b.photo_url)?.photo_url || null;
  }
  if (cardId === "styles") {
    const styles = getAllGardenStyles();
    const realisation = styles.find(
      (s) => s.origin === "realisation" || s.origin === "projet3d" || s.pastille
    );
    return (realisation || styles[0])?.photo_url || null;
  }
  return null;
}
