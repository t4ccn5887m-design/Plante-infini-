/**
 * Progression du dossier jardin particulier (9 étapes).
 * Fonction pure — aucune I/O.
 */

import {
  isAEviterValid,
  isEntretienValid,
  isExistantValid,
  isQuotidienValid,
  normalizeBriefDetails,
} from "@/lib/brief/briefDetails";

export const GARDEN_DOSSIER_STEP_IDS = [
  "coups-de-coeur",
  "ambiance",
  "mot-paysagiste",
  "quotidien",
  "a-eviter",
  "terrain",
  "existant",
  "entretien",
  "budget",
];

const STEP_LABELS = {
  "coups-de-coeur": "Coups de cœur",
  ambiance: "Ambiance",
  "mot-paysagiste": "Mot pour le paysagiste",
  quotidien: "Votre quotidien",
  "a-eviter": "Ce que vous ne voulez pas",
  terrain: "Mon terrain",
  existant: "Ce qui existe déjà",
  entretien: "Entretien et calendrier",
  budget: "Budget",
};

/**
 * @param {object} input
 * @param {number} [input.gardenItemCount]
 * @param {string} [input.paysagisteMessage]
 * @param {boolean} [input.ambianceComplete]
 * @param {boolean} [input.terrainComplete] — champs + au moins une photo (voir appelant)
 * @param {boolean} [input.budgetComplete]
 * @param {object} [input.details] — brief details normalisés
 */
export function computeGardenDossierProgress(input = {}) {
  const {
    gardenItemCount = 0,
    paysagisteMessage = "",
    ambianceComplete = false,
    terrainComplete = false,
    budgetComplete = false,
    details: rawDetails,
  } = input;

  const details = normalizeBriefDetails(rawDetails);

  const steps = [
    {
      id: "coups-de-coeur",
      label: STEP_LABELS["coups-de-coeur"],
      complete: gardenItemCount >= 1,
    },
    {
      id: "ambiance",
      label: STEP_LABELS.ambiance,
      complete: Boolean(ambianceComplete),
    },
    {
      id: "mot-paysagiste",
      label: STEP_LABELS["mot-paysagiste"],
      complete: String(paysagisteMessage).trim().length > 0,
    },
    {
      id: "quotidien",
      label: STEP_LABELS.quotidien,
      complete: isQuotidienValid(details),
    },
    {
      id: "a-eviter",
      label: STEP_LABELS["a-eviter"],
      complete: isAEviterValid(details),
    },
    {
      id: "terrain",
      label: STEP_LABELS.terrain,
      complete: Boolean(terrainComplete),
    },
    {
      id: "existant",
      label: STEP_LABELS.existant,
      complete: isExistantValid(details),
    },
    {
      id: "entretien",
      label: STEP_LABELS.entretien,
      complete: isEntretienValid(details),
    },
    {
      id: "budget",
      label: STEP_LABELS.budget,
      complete: Boolean(budgetComplete),
    },
  ];

  const totalSteps = steps.length;
  const completedCount = steps.filter((s) => s.complete).length;
  const remainingSteps = steps.filter((s) => !s.complete);
  const percent = Math.round((completedCount / totalSteps) * 100);

  return {
    steps,
    totalSteps,
    completedCount,
    remainingCount: remainingSteps.length,
    remainingSteps,
    percent,
  };
}

export function dossierStepLabel(stepId) {
  return STEP_LABELS[stepId] || stepId;
}
