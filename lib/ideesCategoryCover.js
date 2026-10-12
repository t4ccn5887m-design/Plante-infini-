import { getActiveCatalogueBordures } from "@/lib/catalogueAmenagements";
import { getActiveCatalogueMinerals } from "@/lib/catalogueMinerals";
import { getActiveCataloguePlants } from "@/lib/cataloguePlants";
import { getAllGardenStyles } from "@/lib/catalogueStyles";

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
