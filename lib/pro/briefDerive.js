/**
 * Goût déduit + points de vigilance + points RDV — dérivés client-side.
 */
import {
  BUDGETS,
  MATERIALS,
  MAINTENANCE,
  PLANTS,
  PRIORITIES,
  TASTES,
  USERS,
  budgetLabel,
  labelsOf,
  maintenanceLabel,
  materialLabel,
  plantLabel,
  priorityLabel,
  tasteLabel,
  userLabel,
} from "@/lib/pro/briefLabels";

function arr(v) {
  return Array.isArray(v) ? v.filter(Boolean) : [];
}

/**
 * @param {object} brief — ligne pro_briefs (snake ou camel)
 */
export function normalizeBriefAnswers(brief) {
  if (!brief || typeof brief !== "object") return null;
  return {
    tastes: arr(brief.tastes),
    plants: arr(brief.plants),
    materials: arr(brief.materials),
    priorities: arr(brief.priorities),
    users: arr(brief.garden_users || brief.gardenUsers || brief.users),
    maintenance: brief.maintenance || null,
    photoUrls: arr(brief.photo_urls || brief.photoUrls),
    budget: brief.budget || null,
    message: typeof brief.message === "string" ? brief.message : "",
  };
}

/** Résumé court pour les cartes liste */
export function tasteSummary(brief) {
  const a = normalizeBriefAnswers(brief);
  if (!a) return "Lien envoyé — en attente de retour.";
  const style = a.tastes[0] ? tasteLabel(a.tastes[0]) : null;
  const maint = a.maintenance ? maintenanceLabel(a.maintenance) : null;
  const prio = a.priorities[0] ? priorityLabel(a.priorities[0]) : null;
  const parts = [];
  if (style) parts.push(style);
  if (maint) parts.push(`entretien ${String(maint).toLowerCase()}`);
  if (prio) parts.push(prio.toLowerCase());
  if (!parts.length) return "Brief reçu — à consulter.";
  return parts.join(", ") + ".";
}

export function plantTags(brief) {
  const a = normalizeBriefAnswers(brief);
  if (!a) return [];
  return labelsOf(PLANTS, a.plants).slice(0, 4);
}

/**
 * Profil jardin pour la fiche détail
 * @returns {{ lede: string, spec: [string, string][], prios: string[], vegetaux: string[], materiaux: string[], users: string[], budget: string, message: string, photoPaths: string[] }}
 */
export function deriveTasteProfile(brief) {
  const a = normalizeBriefAnswers(brief);
  if (!a) return null;

  const styleId = a.tastes[0] || null;
  const style = styleId ? tasteLabel(styleId) : "Non précisé";
  const ambiance =
    a.tastes.length > 1 ? tasteLabel(a.tastes[1]) : styleId ? tasteLabel(styleId) : "—";
  const entretien = a.maintenance ? maintenanceLabel(a.maintenance) : "Non précisé";
  const topPrio = a.priorities[0] ? priorityLabel(a.priorities[0]) : null;

  let lede = `Un jardin ${style.toLowerCase()}`;
  if (topPrio) lede += `, avec pour priorité « ${topPrio.toLowerCase()} »`;
  if (a.maintenance === "min") lede += " — entretien réduit au minimum";
  else if (a.maintenance === "love") lede += " — le client aime jardiner";
  lede += ".";

  return {
    lede,
    spec: [
      ["Style", style],
      ["Ambiance", ambiance],
      ["Entretien", entretien],
    ],
    prios: labelsOf(PRIORITIES, a.priorities),
    vegetaux: labelsOf(PLANTS, a.plants),
    materiaux: labelsOf(MATERIALS, a.materials),
    users: labelsOf(USERS, a.users),
    maintenanceTitle: byTitle(MAINTENANCE, a.maintenance),
    budget: a.budget ? budgetLabel(a.budget) : "—",
    message: a.message,
    photoPaths: a.photoUrls,
    tastes: labelsOf(TASTES, a.tastes),
  };
}

function byTitle(list, id) {
  const item = list.find((x) => x.id === id);
  return item?.title || item?.label || null;
}

/** @returns {string[]} */
export function deriveVigilance(brief) {
  const a = normalizeBriefAnswers(brief);
  if (!a) return [];
  const notes = [];

  if (a.tastes.includes("luxuriant") && a.maintenance === "min") {
    notes.push(
      "Veut du luxuriant mais un entretien très faible — à arbitrer au RDV."
    );
  }
  if (a.tastes.includes("sec") && a.plants.includes("fleuri")) {
    notes.push(
      "Jardin sec + envie de fleuri : cadrer les espèces peu gourmandes en eau."
    );
  }
  if (a.priorities.includes("isoler") && !a.plants.includes("haie")) {
    notes.push(
      "Priorité intimité sans haie cochée — proposer une solution de clôture végétale ?"
    );
  }
  if (a.users.includes("enfants") && a.tastes.includes("contemporain")) {
    notes.push(
      "Enfants + style contemporain : prévoir des zones de jeu sans casser les lignes."
    );
  }
  if (a.users.includes("animaux") && a.plants.includes("fleuri")) {
    notes.push(
      "Animaux + massifs fleuris : vérifier toxicité / piétinement au RDV."
    );
  }
  if (a.tastes.includes("japonais") && a.maintenance === "min") {
    notes.push(
      "Style japonais zen avec entretien minimal — le rendu soigné demande du suivi."
    );
  }
  if (a.budget === "lt3" && a.tastes.includes("luxuriant")) {
    notes.push("Budget serré (< 3 k€) vs ambition luxuriante — phaser le projet.");
  }
  if (!notes.length && a.maintenance === "min" && a.plants.length > 3) {
    notes.push(
      "Beaucoup de végétaux souhaités pour un entretien faible — prioriser au RDV."
    );
  }
  return notes;
}

/** @returns {string[]} */
export function deriveRdvTodos(brief) {
  const a = normalizeBriefAnswers(brief);
  if (!a) return [];
  const todos = [];

  if (!a.photoUrls.length) {
    todos.push("Demander des photos du jardin actuel");
  }
  if (!a.budget || a.budget === "unknown") {
    todos.push("Cadrer le budget avec les priorités");
  } else {
    todos.push(`Confirmer le budget (${budgetLabel(a.budget)})`);
  }
  if (a.maintenance === "min") {
    todos.push("Confirmer l'arrosage (auto ?)");
  }
  if (a.priorities.includes("recevoir") || a.users.includes("invites")) {
    todos.push("Dimensionner l'espace repas / réception");
  }
  if (a.message.trim()) {
    todos.push("Relire le mot du client avant le RDV");
  }
  todos.push("Vérifier l'accès chantier");
  return todos.slice(0, 5);
}

/** Export helpers for UI that needs raw dicts */
export { TASTES, PLANTS, MATERIALS, PRIORITIES, USERS, MAINTENANCE, BUDGETS };
