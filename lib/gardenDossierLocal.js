import { loadGardenAmbianceChoice } from "@/lib/gardenAmbianceChoice";
import { loadGardenBudgetChoice } from "@/lib/gardenBudgetChoice";
import { getGardenTerrainPhotoCountSync } from "@/lib/gardenTerrainPhotos";

/** Flags dossier particulier (localStorage / compteur photos) — sans I/O async. */
export function readGardenDossierLocalFlags() {
  return {
    ambianceComplete: Boolean(loadGardenAmbianceChoice()),
    budgetComplete: Boolean(loadGardenBudgetChoice()),
    terrainPhotosComplete: getGardenTerrainPhotoCountSync() >= 1,
  };
}
