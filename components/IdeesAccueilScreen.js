/**
 * Idées — accueil sevya/5-idees-accueil.html
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import CatalogueIdeaCard from "@/components/catalogue/CatalogueIdeaCard";
import CataloguePlantVisual from "@/components/catalogue/CataloguePlantVisual";
import { IDEES_ENVIE_CHIPS } from "@/lib/catalogueFamilles";
import IdeesCategoryCard from "@/components/atelier/IdeesCategoryCard";
import { buildIdeesComposerCards } from "@/lib/catalogueIdeesCompose";
import { getIdeesCategoryCoverUrl } from "@/lib/ideesCategoryCover";
import {
  currentMonthLabel,
  discoveryFromCatalogueItem,
  getPlantsBeautifulNow,
  normalizeCatalogueSearch,
  searchAllCatalogue,
} from "@/lib/catalogueIdeesHelpers";
import {
  isCatalogueItemInGarden,
  loadAllCatalogueGardenState,
  toggleCatalogueItemInGarden,
} from "@/lib/catalogueGardenToggle";
import { AT } from "@/lib/atelierCssVars";
import { WILDER_COLORS as COLORS } from "@/lib/themes";


export default function IdeesAccueilScreen({
  t,
  canAddToGarden = true,
  onGardenChange,
  onRequireAccount,
  onOpenCatalogueTab,
  onOpenCatalogueFamilles,
  onOpenAmbiances,
  onOpenGardenStyles,
  onOpenItemDetail,
  onOpenCataloguePlant,
  onOpenCatalogueItem,
  dossierCoupsGuidance = false,
  onContinueDossierGuidance,
}) {
  const [search, setSearch] = useState("");
  const [quizNotice, setQuizNotice] = useState(null);
  const [gardenState, setGardenState] = useState(null);
  const [togglingKey, setTogglingKey] = useState(null);
  const [error, setError] = useState(null);

  const refreshGarden = useCallback(async () => {
    try {
      setGardenState(await loadAllCatalogueGardenState());
    } catch {
      setGardenState(null);
    }
  }, []);

  useEffect(() => {
    refreshGarden();
  }, [refreshGarden]);

  const searchActive = normalizeCatalogueSearch(search).length > 0;
  const searchResults = useMemo(
    () => (searchActive ? searchAllCatalogue(search) : []),
    [search, searchActive]
  );

  const seasonPlants = useMemo(() => getPlantsBeautifulNow(), []);
  const monthLabel = currentMonthLabel();
  const composerCards = useMemo(() => buildIdeesComposerCards(), []);

  const handleUniverse = (id) => {
    if (id === "styles") {
      onOpenGardenStyles?.();
      return;
    }
    if (onOpenCatalogueFamilles) {
      onOpenCatalogueFamilles(id);
      return;
    }
    onOpenCatalogueTab?.(id === "bordures" ? "deco" : id, id === "bordures" ? { univers: "Bordures" } : {});
  };

  const handleEnvieChip = (chip) => {
    onOpenCatalogueTab?.("vegetal", chip.filters || {});
  };

  const openPlant = (item) => {
    if (item.universe === "vegetal" && onOpenCataloguePlant) {
      onOpenCataloguePlant(item.id, "catalogue");
      return;
    }
    if ((item.universe === "mineral" || item.universe === "deco") && onOpenCatalogueItem) {
      onOpenCatalogueItem(item.universe, item.id, "catalogue");
      return;
    }
    onOpenItemDetail?.(discoveryFromCatalogueItem(item));
  };

  const handleToggle = async (item) => {
    if (!item?.id || !gardenState || togglingKey) return;
    setError(null);
    setTogglingKey(item.key);
    try {
      const result = await toggleCatalogueItemInGarden({
        universe: item.universe,
        raw: item.raw,
        id: item.id,
        t,
        state: gardenState,
        canAddToGarden,
        onRequireAccount,
      });
      if (result.gated) return;
      if (!result.ok) setError(result.error);
      else {
        await refreshGarden();
        onGardenChange?.();
      }
    } finally {
      setTogglingKey(null);
    }
  };

  const inGarden = (item) =>
    gardenState ? isCatalogueItemInGarden(item.universe, item.id, gardenState) : false;

  return (
    <div
      style={{
        flex: 1,
        overflow: "auto",
        padding: "20px 18px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 22,
      }}
    >
      {dossierCoupsGuidance ? (
        <div
          style={{
            borderRadius: 18,
            padding: "14px 16px",
            background: "var(--card)",
            border: "1px solid var(--sage)",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: COLORS.ink, fontWeight: 600 }}>
            Ajoutez au moins un coup de cœur, puis revenez à votre dossier.
          </p>
          <button
            type="button"
            onClick={() => onContinueDossierGuidance?.()}
            style={{
              alignSelf: "flex-start",
              minHeight: 44,
              padding: "0 16px",
              borderRadius: 14,
              border: "none",
              background: COLORS.ink,
              color: COLORS.screen,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Continuer mon dossier
          </button>
        </div>
      ) : null}

      <div className="atelier-page-head">
        <h1>
          Composer
          <br />
          votre jardin
        </h1>
        <p className="sub">200 végétaux, paillages, bordures et réalisations.</p>
      </div>

      <label
        htmlFor="idees-accueil-search"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          minHeight: 50,
          padding: "0 16px",
          borderRadius: 16,
          background: "var(--card)",
          border: "1px solid var(--line)",
        }}
      >
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="8" stroke="var(--mute)" strokeWidth={2} />
          <path d="m21 21-4.3-4.3" stroke="var(--mute)" strokeWidth={2} strokeLinecap="round" />
        </svg>
        <input
          id="idees-accueil-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher : olivier, galets, corten…"
          aria-label="Rechercher une idée"
          style={{
            flexGrow: 1,
            border: "none",
            background: "transparent",
            fontFamily: "inherit",
            fontSize: 15,
            color: COLORS.ink,
            outline: "none",
            minWidth: 0,
          }}
        />
      </label>

      {error ? <p style={{ margin: 0, fontSize: 13, color: COLORS.error }}>{String(error)}</p> : null}

      {searchActive ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          {searchResults.length === 0 ? (
            <p style={{ margin: 0, fontSize: 14, color: AT.mute, gridColumn: "1 / -1" }}>
              Aucun résultat pour cette recherche.
            </p>
          ) : (
            searchResults.map((item) => (
              <CatalogueIdeaCard
                key={item.key}
                nom={item.nom}
                subtitle={item.subtitle}
                photo_url={item.photo_url}
                categorie={item.categorie}
                catalogUniverse={item.universe}
                inGarden={inGarden(item)}
                toggling={togglingKey === item.key}
                onOpen={() => openPlant(item)}
                onToggleHeart={() => handleToggle(item)}
              />
            ))
          )}
        </div>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span className="wilder-v2-title-section" style={{ fontSize: 17, fontWeight: 700, color: AT.ink }}>
              Composer mon jardin
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
              {composerCards.map((card) => (
                <IdeesCategoryCard
                  key={card.id}
                  title={card.title}
                  count={card.count}
                  photoUrl={getIdeesCategoryCoverUrl(card.id)}
                  onClick={() => handleUniverse(card.id)}
                />
              ))}
            </div>
          </div>

          <button type="button" className="atelier-idees-quiz-cta" onClick={() => setQuizNotice("Bientôt disponible")}>
            <span className="atelier-idees-quiz-cta__text">
              <span style={{ fontSize: 16, fontWeight: 700 }}>Vous ne savez pas par où commencer ?</span>
              <span style={{ fontSize: 14, opacity: 0.85 }}>Trouvez votre style en une minute</span>
            </span>
            <span className="atelier-idees-quiz-cta__chev" aria-hidden="true">
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <path d="m9 18 6-6-6-6" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </button>
          {quizNotice ? (
            <p style={{ margin: "-12px 0 0", fontSize: 13, color: AT.mute, textAlign: "center" }}>
              {quizNotice}
            </p>
          ) : null}

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={{ fontSize: 17, fontWeight: 700, color: AT.ink }}>Selon vos envies</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {IDEES_ENVIE_CHIPS.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => handleEnvieChip(chip)}
                  style={{
                    minHeight: 40,
                    padding: "0 14px",
                    borderRadius: 999,
                    border: `1.5px solid ${AT.line}`,
                    background: AT.card,
                    color: COLORS.ink,
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: "inherit",
                    cursor: "pointer",
                  }}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {seasonPlants.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: 17, fontWeight: 700, color: AT.ink }}>Belles en ce moment</span>
                <span style={{ fontSize: 13, color: AT.mute }}>{monthLabel}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  overflowX: "auto",
                  paddingBottom: 4,
                  marginRight: -18,
                  paddingRight: 18,
                }}
              >
                {seasonPlants.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onOpenCataloguePlant?.(p.id, "catalogue")}
                    style={{
                      flex: "0 0 136px",
                      borderRadius: 18,
                      overflow: "hidden",
                      border: `1.5px solid ${AT.line}`,
                      background: AT.card,
                      padding: 0,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      textAlign: "left",
                      color: COLORS.ink,
                    }}
                  >
                    <CataloguePlantVisual photo_url={p.photo_url} categorie={p.categorie} height={104} />
                    <span
                      style={{
                        display: "block",
                        padding: "9px 11px 11px",
                        fontSize: 14,
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {p.nom}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
