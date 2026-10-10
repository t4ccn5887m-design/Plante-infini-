/**
 * Idées — accueil sevya/5-idees-accueil.html
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import CatalogueIdeaCard from "@/components/catalogue/CatalogueIdeaCard";
import CataloguePlantVisual from "@/components/catalogue/CataloguePlantVisual";
import {
  CATALOGUE_ENVIES,
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
import { WILDER_COLORS as COLORS } from "@/lib/themes";

const UNIVERSE_CARDS = [
  {
    id: "vegetal",
    title: "Végétal",
    subtitle: "Arbres, fleurs, haies, graminées",
    bg: "#E6F0E3",
    iconStroke: "#4E7B52",
    subtitleColor: "#3F6443",
    icon: "leaf",
  },
  {
    id: "mineral",
    title: "Minéral",
    subtitle: "Dallages, graviers, pierres",
    bg: "#EEEAE3",
    iconStroke: "#5F665D",
    subtitleColor: "#4D554B",
    icon: "mineral",
  },
  {
    id: "deco",
    title: "Aménagements",
    subtitle: "Pergola, bassin, éclairage",
    bg: "#F6E7D8",
    iconStroke: "#C0652E",
    subtitleColor: "#8A4A22",
    icon: "deco",
  },
  {
    id: "ambiances",
    title: "Ambiances",
    subtitle: "Méditerranéen, zen, champêtre",
    bg: "#ECE6F5",
    iconStroke: "#6A5896",
    subtitleColor: "#5E4C8C",
    icon: "sparkle",
  },
];

function UniverseIcon({ type, stroke }) {
  const ic = { stroke, strokeWidth: 2, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" };
  if (type === "mineral") {
    return (
      <svg width={26} height={26} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 17h18" style={ic} />
        <path d="M5 17l2-6 4-2 5 1 3 7" style={ic} />
        <path d="M9 21h6" style={ic} />
      </svg>
    );
  }
  if (type === "deco") {
    return (
      <svg width={26} height={26} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 9h18" style={ic} />
        <path d="M5 9v12M19 9v12" style={ic} />
        <path d="M3 5h18" style={ic} />
        <path d="M9 9v4M15 9v4" style={ic} />
      </svg>
    );
  }
  if (type === "sparkle") {
    return (
      <svg width={26} height={26} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" style={ic} />
      </svg>
    );
  }
  return (
    <svg width={26} height={26} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"
        style={ic}
      />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" style={ic} />
    </svg>
  );
}

export default function IdeesAccueilScreen({
  t,
  canAddToGarden = true,
  onGardenChange,
  onRequireAccount,
  onOpenCatalogueTab,
  onOpenAmbiances,
  onOpenItemDetail,
  onOpenCataloguePlant,
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

  const handleUniverse = (id) => {
    if (id === "ambiances") {
      onOpenAmbiances?.();
      return;
    }
    onOpenCatalogueTab?.(id, {});
  };

  const handleEnvie = (envie) => {
    onOpenCatalogueTab?.("vegetal", { envie });
  };

  const openPlant = (item) => {
    if (item.universe === "vegetal" && onOpenCataloguePlant) {
      onOpenCataloguePlant(item.id, "catalogue");
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
      if (!result.ok) setError(result.error || "unknown");
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
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#1F2A22" }}>Idées</h1>
        <span style={{ fontSize: 15, color: "#5B6359" }}>Que voulez-vous découvrir ?</span>
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
          background: "#F2EEE7",
        }}
      >
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="8" stroke="#5B6359" strokeWidth={2} />
          <path d="m21 21-4.3-4.3" stroke="#5B6359" strokeWidth={2} strokeLinecap="round" />
        </svg>
        <input
          id="idees-accueil-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher : olivier, gravier, pergola…"
          aria-label="Rechercher une idée"
          style={{
            flexGrow: 1,
            border: "none",
            background: "transparent",
            fontFamily: "inherit",
            fontSize: 15,
            color: "#1F2A22",
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
            <p style={{ margin: 0, fontSize: 14, color: "#5B6359", gridColumn: "1 / -1" }}>
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
            {UNIVERSE_CARDS.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => handleUniverse(card.id)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 18,
                  minHeight: 168,
                  boxSizing: "border-box",
                  padding: 16,
                  borderRadius: 24,
                  background: card.bg,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textAlign: "left",
                  color: "#1F2A22",
                }}
              >
                <span
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 16,
                    background: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <UniverseIcon type={card.icon} stroke={card.iconStroke} />
                </span>
                <span style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <span style={{ fontSize: 19, fontWeight: 700 }}>{card.title}</span>
                  <span style={{ fontSize: 13, lineHeight: 1.35, color: card.subtitleColor }}>
                    {card.subtitle}
                  </span>
                </span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setQuizNotice("Bientôt disponible")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "16px 18px",
              borderRadius: 22,
              background: "#2F5E3F",
              border: "none",
              color: "#FFFFFF",
              minHeight: 44,
              cursor: "pointer",
              fontFamily: "inherit",
              textAlign: "left",
              width: "100%",
            }}
          >
            <span style={{ display: "flex", flexDirection: "column", gap: 3, flexGrow: 1 }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>Vous ne savez pas par où commencer ?</span>
              <span style={{ fontSize: 14, color: "#D7E7D9" }}>Trouvez votre style en une minute</span>
            </span>
            <span
              style={{
                width: 40,
                height: 40,
                borderRadius: 999,
                background: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="m9 18 6-6-6-6" stroke="#2F5E3F" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </button>
          {quizNotice ? (
            <p style={{ margin: "-12px 0 0", fontSize: 13, color: "#5B6359", textAlign: "center" }}>
              {quizNotice}
            </p>
          ) : null}

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={{ fontSize: 17, fontWeight: 700, color: "#1F2A22" }}>Selon vos envies</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {CATALOGUE_ENVIES.map((envie) => (
                <button
                  key={envie}
                  type="button"
                  onClick={() => handleEnvie(envie)}
                  style={{
                    minHeight: 40,
                    padding: "0 14px",
                    borderRadius: 999,
                    border: "1.5px solid #E4DED3",
                    background: "#FFFFFF",
                    color: "#1F2A22",
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: "inherit",
                    cursor: "pointer",
                  }}
                >
                  {envie}
                </button>
              ))}
            </div>
          </div>

          {seasonPlants.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: 17, fontWeight: 700, color: "#1F2A22" }}>Belles en ce moment</span>
                <span style={{ fontSize: 13, color: "#5B6359" }}>{monthLabel}</span>
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
                      border: "1.5px solid #EEE9E0",
                      background: "#FFFFFF",
                      padding: 0,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      textAlign: "left",
                      color: "#1F2A22",
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
