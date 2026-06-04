export const POTAGER_RECIPES_CACHE_KEY = "wilder-potager-recipes-cache";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function plantsCacheKey(plants) {
  return plants
    .map((p) => (p.name || "").trim().toLowerCase())
    .filter(Boolean)
    .sort()
    .join("|");
}

export function loadRecipesCache() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(POTAGER_RECIPES_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveRecipesCache(entry) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(POTAGER_RECIPES_CACHE_KEY, JSON.stringify(entry));
  } catch {
    /* ignore quota */
  }
}

export function getCachedRecipes(harvestPlants, lang) {
  const cache = loadRecipesCache();
  if (!cache?.recipes?.length) return null;
  const key = plantsCacheKey(harvestPlants);
  if (
    cache.dateKey === todayKey() &&
    cache.plantsKey === key &&
    cache.lang === lang
  ) {
    return cache.recipes;
  }
  return null;
}

export async function fetchPotagerRecipes(harvestPlants, lang) {
  const cached = getCachedRecipes(harvestPlants, lang);
  if (cached) return { recipes: cached, fromCache: true };

  const res = await fetch("/api/potager-recipes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      plants: harvestPlants.map((p) => ({ name: p.name, emoji: p.emoji })),
      lang,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.erreur || "recipes_fetch_failed");
  }

  const recipes = Array.isArray(data.recettes) ? data.recettes : [];
  saveRecipesCache({
    dateKey: todayKey(),
    plantsKey: plantsCacheKey(harvestPlants),
    lang,
    recipes,
  });

  return { recipes, fromCache: false };
}
