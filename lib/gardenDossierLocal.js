import { loadGardenAmbianceChoice } from "@/lib/gardenAmbianceChoice";
import { loadGardenBudgetChoice } from "@/lib/gardenBudgetChoice";
import { getGardenTerrainPhotoCountSync } from "@/lib/gardenTerrainPhotos";
import { isGardenTerrainStepValidated } from "@/lib/gardenTerrainFields";

/** Flags dossier particulier (localStorage / compteur photos) — sans I/O async. */
export function readGardenDossierLocalFlags() {
  return {
    ambianceComplete: Boolean(loadGardenAmbianceChoice()),
    budgetComplete: Boolean(loadGardenBudgetChoice()),
    terrainPhotosComplete:
      isGardenTerrainStepValidated() && getGardenTerrainPhotoCountSync() >= 1,
  };
}
