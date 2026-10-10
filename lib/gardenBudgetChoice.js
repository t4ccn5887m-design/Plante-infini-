export const GARDEN_BUDGET_CHOICE_KEY = "wilder-garden-budget";

export function loadGardenBudgetChoice() {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(GARDEN_BUDGET_CHOICE_KEY) || "";
  } catch {
    return "";
  }
}

export function saveGardenBudgetChoice(budgetId) {
  if (typeof window === "undefined") return;
  try {
    if (!budgetId) localStorage.removeItem(GARDEN_BUDGET_CHOICE_KEY);
    else localStorage.setItem(GARDEN_BUDGET_CHOICE_KEY, budgetId);
  } catch {
    /* quota / private mode */
  }
}
