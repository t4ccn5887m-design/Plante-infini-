/** Catégories d'identification sur l'accueil — envoyées à /api/analyze. */
export const HOME_SCAN_CATEGORIES = [
  { id: "arbres", labelKey: "home.category_arbres" },
  { id: "fleurs", labelKey: "home.category_fleurs" },
  { id: "plantes", labelKey: "home.category_plantes" },
  { id: "mauvaises_herbes", labelKey: "home.category_weeds" },
  { id: "animaux", labelKey: "home.category_animaux" },
];

const CATEGORY_API_HINTS = {
  arbres:
    "L'utilisateur cherche à identifier un arbre ou un arbuste. Priorise cette catégorie dans ton analyse.",
  fleurs:
    "L'utilisateur cherche à identifier une fleur. Priorise cette catégorie dans ton analyse.",
  plantes:
    "L'utilisateur cherche à identifier une plante. Priorise cette catégorie dans ton analyse.",
  mauvaises_herbes:
    "L'utilisateur cherche à identifier une mauvaise herbe. Si c'en est une, renseigne type mauvaise_herbe et les champs associés.",
  animaux:
    "L'utilisateur cherche à identifier un animal (mammifère, oiseau, insecte, reptile, etc.). Priorise cette catégorie dans ton analyse.",
};

export function getScanCategoryHint(categoryId) {
  if (!categoryId || typeof categoryId !== "string") return null;
  return CATEGORY_API_HINTS[categoryId] || null;
}

export function isValidScanCategory(categoryId) {
  return HOME_SCAN_CATEGORIES.some((c) => c.id === categoryId);
}
