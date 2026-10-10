/**
 * Idées — accueil sevya/5-idees-accueil.html
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import CatalogueIdeaCard from "@/components/catalogue/CatalogueIdeaCard";
import {
  buildCatalogueSubtitle,
  discoveryFromCatalogueItem,
  getPlantsInSeason,
  getVisibleEnviePills,
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
    subtitle: "Arbres, arbustes, vivaces…",
    bg: "#E6F0E3",
    labelColor: "#2F5E3F",
    chevron: "#4E7B52",
  },
  {
    id: "mineral",
    title: "Minéral",
    subtitle: "Paillage, pierres, bordures…",
    bg: "#F2EEE7",
    labelColor: "#4D554B",
    chevron: "#6B7268",
  },
  {
    id: "deco",
    title: "Aménagements",
    subtitle: "Mobilier, poterie, lumière…",
    bg: "#F6E7D8",
    labelColor: "#8A4A22",
    chevron: "#C0652E",
  },
  {
    id: "ambiances",
    title: "Ambiances",
    subtitle: "Jardins toutes faits",
    bg: "#ECE6F5",
    labelColor: "#5E4C8C",
    chevron: "#6A5896",
  },
];

function SectionLabel({ children }) {
  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: "1.2px",
        color: "#5B6359",
      }}
    >
      {children}
    </span>
  );
}

function UniverseCard({ card, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        borderRadius: 18,
        padding: "14px 14px 12px",
        background: card.bg,
        border: "none",
        display: "flex",
        alignItems: "center",
        gap: 10,
        minHeight: 72,
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "left",
        color: "#1F2A22",
        width: "100%",
      }}
    >
      <span style={{ display: "flex", flexDirection: "column", flexGrow: 1, gap: 2, minWidth: 0 }}>
        <span style={{ fontSize: 15, fontWeight: 700 }}>{card.title}</span>
        <span style={{ fontSize: 12, color: card.labelColor, lineHeight: 1.35 }}>{card.subtitle}</span>
      </span>
      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="m9 18 6-6-6-6"
          stroke={card.chevron}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

function EnviePill({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        minHeight: 36,
        padding: "0 14px",
        borderRadius: 999,
        border: "1.5px solid #E4DED3",
        background: "#FFFFFF",
        color: "#4D554B",
        fontFamily: "inherit",
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      {children}
    </button>
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

  const searchQuery = normalizeCatalogueSearch(search);
  const searchActive = searchQuery.length > 0;

  const searchResults = useMemo(
    () => (searchActive ? searchAllCatalogue(search) : []),
    [search, searchActive]
  );

  const enviePills = useMemo(() => getVisibleEnviePills(), []);
  const seasonPlants = useMemo(() => getPlantsInSeason(), []);
  const showSeasonSection = !searchActive && seasonPlants.length > 0;

  const seasonItems = useMemo(
    () =>
      seasonPlants.map((p) => ({
        key: `season-v-${p.id}`,
        universe: "vegetal",
        id: p.id,
        nom: p.nom,
        photo_url: p.photo_url,
        subtitle: buildCatalogueSubtitle({ kind: "vegetal", raw: p }, t),
        raw: p,
      })),
    [seasonPlants, t]
  );

  const handleUniverse = (id) => {
    if (id === "ambiances") {
      onOpenAmbiances?.();
      return;
    }
    onOpenCatalogueTab?.(id, {});
  };

  const handleEnviePill = (pill) => {
    const filters =
      pill.kind === "envie" ? { envieTag: pill.value } : { exposition: pill.value };
    onOpenCatalogueTab?.("vegetal", filters);
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

  const renderGrid = (items) => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: 10,
      }}
    >
      {items.map((item) => (
        <CatalogueIdeaCard
          key={item.key}
          nom={item.nom}
          subtitle={item.subtitle}
          photo_url={item.photo_url}
          inGarden={inGarden(item)}
          toggling={togglingKey === item.key}
          onOpen={() => onOpenItemDetail?.(discoveryFromCatalogueItem(item))}
          onToggleHeart={() => handleToggle(item)}
        />
      ))}
    </div>
  );

  return (
    <div
      style={{
        flex: 1,
        overflow: "auto",
        padding: "18px 18px 8px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "#1F2A22" }}>Idées</h1>
        <span style={{ fontSize: 14, color: "#5B6359" }}>
          Explorez le catalogue ou cherchez une plante, une pierre, un aménagement.
        </span>
      </div>

      <label
        htmlFor="idees-accueil-search"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          minHeight: 48,
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
          placeholder="Olivier, haie, pergola…"
          aria-label="Rechercher dans le catalogue"
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
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <SectionLabel>RÉSULTATS</SectionLabel>
          {searchResults.length === 0 ? (
            <p style={{ margin: 0, fontSize: 14, color: "#5B6359" }}>Aucun résultat pour cette recherche.</p>
          ) : (
            renderGrid(searchResults)
          )}
        </div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 8,
            }}
          >
            {UNIVERSE_CARDS.map((card) => (
              <UniverseCard key={card.id} card={card} onClick={() => handleUniverse(card.id)} />
            ))}
          </div>

          <button
            type="button"
            onClick={() => setQuizNotice("Bientôt disponible")}
            style={{
              borderRadius: 18,
              padding: "14px 16px",
              border: "1.5px dashed #C8C2B6",
              background: "#FAF8F4",
              display: "flex",
              flexDirection: "column",
              gap: 4,
              cursor: "pointer",
              fontFamily: "inherit",
              textAlign: "left",
              width: "100%",
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 700, color: "#1F2A22" }}>
              Vous ne savez pas par où commencer ?
            </span>
            <span style={{ fontSize: 13, color: "#5B6359", lineHeight: 1.4 }}>
              Un court questionnaire pour orienter vos recherches.
            </span>
          </button>
          {quizNotice ? (
            <p style={{ margin: 0, fontSize: 13, color: "#5B6359", textAlign: "center" }}>{quizNotice}</p>
          ) : null}

          {enviePills.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <SectionLabel>SELON VOS ENVIES</SectionLabel>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {enviePills.map((pill) => (
                  <EnviePill key={pill.id} onClick={() => handleEnviePill(pill)}>
                    {pill.label}
                  </EnviePill>
                ))}
              </div>
            </div>
          ) : null}

          {showSeasonSection ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <SectionLabel>BELLES EN CE MOMENT</SectionLabel>
              {renderGrid(seasonItems)}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
