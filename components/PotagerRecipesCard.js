import { useState, useEffect, useCallback } from "react";
import { fetchPotagerRecipes } from "@/lib/potagerRecipes";
import WilderEmptyState from "@/components/WilderEmptyState";
import { WilderSkeletonList } from "@/components/WilderSkeleton";
import { IconCooking } from "@/components/ThemeIcons";

function RecipeItem({ recipe, t }) {
  const [open, setOpen] = useState(false);
  const diffLabel =
    recipe.difficulte === "moyen" || recipe.difficulte === "medium"
      ? t("themes.potager.recipes_diff_medium")
      : t("themes.potager.recipes_diff_easy");

  return (
    <article className="potager-recipe">
      <button
        type="button"
        className="potager-recipe-header"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="potager-recipe-emoji" aria-hidden="true">
          {recipe.emoji}
        </span>
        <span className="potager-recipe-title-wrap">
          <span className="potager-recipe-title">{recipe.titre}</span>
          <span className="potager-recipe-meta">
            {recipe.duree && <span>{recipe.duree}</span>}
            {recipe.duree && <span aria-hidden="true"> · </span>}
            <span>{diffLabel}</span>
          </span>
        </span>
        <span className="potager-recipe-chevron" aria-hidden="true">
          {open ? "▾" : "▸"}
        </span>
      </button>
      {open && (
        <div className="potager-recipe-body">
          {recipe.ingredients?.length > 0 && (
            <>
              <p className="potager-recipe-label">{t("themes.potager.recipes_ingredients")}</p>
              <ul className="potager-recipe-list">
                {recipe.ingredients.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </>
          )}
          {recipe.etapes?.length > 0 && (
            <>
              <p className="potager-recipe-label">{t("themes.potager.recipes_steps")}</p>
              <ol className="potager-recipe-steps">
                {recipe.etapes.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </>
          )}
        </div>
      )}
    </article>
  );
}

export default function PotagerRecipesCard({ harvestPlants, t, lang }) {
  const [recipes, setRecipes] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!harvestPlants.length) {
      setRecipes([]);
      setStatus("empty");
      return;
    }
    setStatus("loading");
    setError(null);
    try {
      const { recipes: list } = await fetchPotagerRecipes(harvestPlants, lang);
      setRecipes(list);
      setStatus("ready");
    } catch (e) {
      setRecipes([]);
      setError(e?.message || "error");
      setStatus("error");
    }
  }, [harvestPlants, lang]);

  useEffect(() => {
    load();
  }, [load]);

  const harvestNames = harvestPlants.map((p) => p.name).join(", ");

  return (
    <section className="potager-recipes" aria-labelledby="potager-recipes-heading">
      <div className="potager-recipes-head">
        <h2 id="potager-recipes-heading" className="potager-recipes-title">
          {t("themes.potager.recipes_title")}
        </h2>
        <p className="potager-recipes-subtitle">{t("themes.potager.recipes_subtitle")}</p>
      </div>

      {status === "empty" && (
        <WilderEmptyState
          icon={<IconCooking size={32} color="currentColor" />}
          message={t("themes.potager.recipes_empty")}
        />
      )}

      {status === "loading" && <WilderSkeletonList count={3} variant="card" className="potager-recipes-skeleton" />}

      {status === "error" && (
        <div className="potager-recipes-error-wrap">
          <p className="potager-recipes-error">{t("themes.potager.recipes_error")}</p>
          <button type="button" className="potager-recipes-retry" onClick={load}>
            {t("themes.potager.recipes_retry")}
          </button>
        </div>
      )}

      {status === "ready" && harvestPlants.length > 0 && (
        <>
          <p className="potager-recipes-from">
            {t("themes.potager.recipes_from", { plants: harvestNames })}
          </p>
          <div className="potager-recipes-list">
            {recipes.map((recipe, i) => (
              <RecipeItem key={`${recipe.titre}-${i}`} recipe={recipe} t={t} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
