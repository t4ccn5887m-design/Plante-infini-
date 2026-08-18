/**
 * Dictionnaire ids → labels du questionnaire client.
 * Source unique partagée : ClientBriefFlow + fiche brief pro.
 */

export const TASTES = [
  { id: "medit", label: "Méditerranéen" },
  { id: "contemporain", label: "Contemporain" },
  { id: "naturel", label: "Naturel / champêtre" },
  { id: "japonais", label: "Japonais zen" },
  { id: "luxuriant", label: "Luxuriant" },
  { id: "sec", label: "Jardin sec" },
];

export const PLANTS = [
  { id: "fleuri", label: "Fleuri" },
  { id: "arbres", label: "Arbres" },
  { id: "graminees", label: "Graminées" },
  { id: "mediterraneen", label: "Méditerranéen" },
  { id: "sec", label: "Sec / peu d'eau" },
  { id: "haie", label: "Haie / intimité" },
];

export const MATERIALS = [
  { id: "pierre", label: "Pierre" },
  { id: "bois", label: "Bois" },
  { id: "gravier", label: "Gravier clair" },
  { id: "terre-cuite", label: "Terre cuite" },
];

export const PRIORITIES = [
  { id: "detente", emoji: "😌", label: "Se détendre" },
  { id: "recevoir", emoji: "🥂", label: "Recevoir" },
  { id: "isoler", emoji: "🌿", label: "S'isoler" },
  { id: "nature", emoji: "🦋", label: "La nature" },
  { id: "beaute", emoji: "✨", label: "Le beau au quotidien" },
  { id: "enfants", emoji: "🧒", label: "Jouer / enfants" },
];

export const USERS = [
  { id: "nous", emoji: "🏠", label: "Juste nous" },
  { id: "enfants", emoji: "👶", label: "Enfants" },
  { id: "animaux", emoji: "🐕", label: "Animaux" },
  { id: "ages", emoji: "🤍", label: "Personnes âgées" },
  { id: "invites", emoji: "🎉", label: "On reçoit souvent" },
];

export const MAINTENANCE = [
  {
    id: "min",
    label: "Faible",
    title: "Le moins possible",
    sub: "Je veux profiter, pas jardiner",
  },
  {
    id: "weekend",
    label: "Modéré",
    title: "Un peu le week-end",
    sub: "Quelques gestes, sans contrainte",
  },
  {
    id: "love",
    label: "Élevé",
    title: "J'adore ça",
    sub: "Je suis prêt·e à m'en occuper",
  },
];

export const BUDGETS = [
  { id: "lt3", label: "< 3 k€" },
  { id: "3-5", label: "3–5 k€" },
  { id: "5-10", label: "5–10 k€" },
  { id: "10-20", label: "10–20 k€" },
  { id: "20+", label: "20 k€ +" },
  { id: "unknown", label: "Je ne sais pas" },
];

export const AREA_RANGES = [
  { id: "lt50", label: "Moins de 50 m²" },
  { id: "50-150", label: "50 à 150 m²" },
  { id: "150-400", label: "150 à 400 m²" },
  { id: "400+", label: "Plus de 400 m²" },
  { id: "unknown", label: "Je ne sais pas" },
];

export const TIMELINES = [
  { id: "asap", label: "Dès que possible" },
  { id: "3m", label: "Dans les 3 mois" },
  { id: "year", label: "Cette année" },
  { id: "exploring", label: "Je me renseigne" },
];

export const UTILITIES = [
  { id: "both", label: "Les deux" },
  { id: "water", label: "Eau seulement" },
  { id: "electricity", label: "Électricité seulement" },
  { id: "none", label: "Ni l'un ni l'autre" },
  { id: "unknown", label: "Je ne sais pas" },
];

function byId(list, id) {
  if (!id) return null;
  return list.find((item) => item.id === id) || null;
}

export function labelOf(list, id) {
  return byId(list, id)?.label || String(id || "");
}

export function labelsOf(list, ids) {
  const safe = Array.isArray(ids) ? ids : [];
  return safe.map((id) => labelOf(list, id)).filter(Boolean);
}

export function tasteLabel(id) {
  return labelOf(TASTES, id);
}

export function plantLabel(id) {
  return labelOf(PLANTS, id);
}

export function materialLabel(id) {
  return labelOf(MATERIALS, id);
}

export function priorityLabel(id) {
  return labelOf(PRIORITIES, id);
}

export function userLabel(id) {
  return labelOf(USERS, id);
}

export function maintenanceLabel(id) {
  return labelOf(MAINTENANCE, id);
}

export function budgetLabel(id) {
  return labelOf(BUDGETS, id);
}

export function areaRangeLabel(id) {
  return labelOf(AREA_RANGES, id);
}

export function timelineLabel(id) {
  return labelOf(TIMELINES, id);
}

export function utilitiesLabel(id) {
  return labelOf(UTILITIES, id);
}
