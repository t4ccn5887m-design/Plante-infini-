/**
 * Progression du dossier jardin particulier (5 étapes).
 * Fonction pure — aucune I/O.
 *
 * Règle coups de cœur : au moins un élément dans la palette (jardin).
 * Ambiance / terrain / budget : flags explicites (local appareil — voir lib/gardenDossierLocal.js).
 */

export const GARDEN_DOSSIER_STEP_IDS = [
  "coups-de-coeur",
  "mot-paysagiste",
  "ambiance",
  "terrain",
  "budget",
];

const STEP_LABELS = {
  "coups-de-coeur": "Coups de cœur ajoutés",
  "mot-paysagiste": "Mot pour le paysagiste",
  ambiance: "Ambiance choisie",
  terrain: "Photos du terrain",
  budget: "Budget",
};

/**
 * @param {object} input
 * @param {number} [input.gardenItemCount] — éléments dans la palette (source de vérité coups de cœur)
 * @param {string} [input.paysagisteMessage] — texte « mot pour le paysagiste »
 * @param {boolean} [input.ambianceComplete]
 * @param {boolean} [input.terrainPhotosComplete]
 * @param {boolean} [input.budgetComplete]
 */
export function computeGardenDossierProgress(input = {}) {
  const {
    gardenItemCount = 0,
    paysagisteMessage = "",
    ambianceComplete = false,
    terrainPhotosComplete = false,
    budgetComplete = false,
  } = input;

  const steps = [
    {
      id: "coups-de-coeur",
      label: STEP_LABELS["coups-de-coeur"],
      complete: gardenItemCount >= 1,
    },
    {
      id: "mot-paysagiste",
      label: STEP_LABELS["mot-paysagiste"],
      complete: String(paysagisteMessage).trim().length > 0,
    },
    {
      id: "ambiance",
      label: STEP_LABELS.ambiance,
      complete: Boolean(ambianceComplete),
    },
    {
      id: "terrain",
      label: STEP_LABELS.terrain,
      complete: Boolean(terrainPhotosComplete),
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
