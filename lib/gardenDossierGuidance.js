import { DOSSIER_STEP_CARD, DOSSIER_STEP_ORDER } from "@/lib/gardenDossierStepCards";
import { computeGardenDossierProgress } from "@/lib/gardenDossierProgress";
import { readGardenDossierLocalFlags } from "@/lib/gardenDossierLocal";
import { loadGardenIntention } from "@/lib/gardenIntention";
import { loadGardenCoupsItems } from "@/lib/gardenCoupsItems";
import { loadGardenBriefDetails } from "@/lib/gardenBriefDetails";

export function buildDossierProgressSnapshot(gardenItemCount, paysagisteMessage = loadGardenIntention()) {
  const local = readGardenDossierLocalFlags();
  const terrainComplete = local.terrainPhotosComplete && local.terrainFieldsComplete;
  return computeGardenDossierProgress({
    gardenItemCount,
    paysagisteMessage,
    ambianceComplete: local.ambianceComplete,
    terrainComplete,
    budgetComplete: local.budgetComplete,
    details: loadGardenBriefDetails(),
  });
}

export async function fetchGardenCoupsCount() {
  const { items } = await loadGardenCoupsItems();
  return items.length;
}

export async function loadDossierProgressSnapshot() {
  const count = await fetchGardenCoupsCount();
  return buildDossierProgressSnapshot(count);
}

/** Première étape non faite (ordre accueil dossier). */
export function firstIncompleteStepId(progress) {
  for (const id of DOSSIER_STEP_ORDER) {
    const step = progress.steps.find((s) => s.id === id);
    if (step && !step.complete) return id;
  }
  return null;
}

export function nextIncompleteStepId(progress, afterStepId) {
  const order = DOSSIER_STEP_ORDER;
  const start = afterStepId ? order.indexOf(afterStepId) + 1 : 0;
  for (let i = Math.max(0, start); i < order.length; i += 1) {
    const id = order[i];
    const step = progress.steps.find((s) => s.id === id);
    if (step && !step.complete) return id;
  }
  return firstIncompleteStepId(progress);
}

export function stepShortLabel(stepId) {
  const card = DOSSIER_STEP_CARD[stepId];
  return card?.title || stepId;
}
