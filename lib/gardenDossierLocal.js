import { loadGardenAmbianceChoice } from "@/lib/gardenAmbianceChoice";
import { loadGardenTerrainFields } from "@/lib/gardenTerrainFields";
import { loadGardenBudgetChoice } from "@/lib/gardenBudgetChoice";
import { getGardenTerrainPhotoCountSync } from "@/lib/gardenTerrainPhotos";
import { isGardenTerrainStepValidated } from "@/lib/gardenTerrainFields";

/** Flags dossier particulier (localStorage / compteur photos) — sans I/O async. */
export function readGardenDossierLocalFlags() {
  const fields = loadGardenTerrainFields();
  const terrainFieldsComplete = Boolean(
    fields.areaRange && fields.timeline && fields.utilities
  );
  return {
    ambianceComplete: Boolean(loadGardenAmbianceChoice()),
    budgetComplete: Boolean(loadGardenBudgetChoice()),
    terrainPhotosComplete:
      isGardenTerrainStepValidated() && getGardenTerrainPhotoCountSync() >= 1,
    terrainFieldsComplete,
  };
}
