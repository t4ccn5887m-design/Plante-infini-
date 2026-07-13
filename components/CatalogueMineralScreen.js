/**
 * Catalogue minéral — paillage, pierres, bordures, pas & allées.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MINERAL_AMBIANCE_TAGS,
  MINERAL_FAMILLES,
  countMineralsByFamille,
  filterCatalogueMinerals,
} from "@/lib/catalogueMinerals";
import {
  demoteCatalogueMineralFromGarden,
  loadCatalogueMineralGardenState,
  promoteCatalogueMineralToGarden,
} from "@/lib/promoteCatalogueToGarden";
import { WILDER_COLORS as COLORS } from "@/lib/themes";
import CatalogueArticleRow from "@/components/catalogue/CatalogueArticleRow";
import CatalogueScreenHeader from "@/components/catalogue/CatalogueScreenHeader";

const icStroke = {
  stroke: "currentColor",
  strokeWidth: 2,
  fill: "none",
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

function IconStone({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
      <polygon points="6 3 18 3 21 9 12 21 3 9" />
      <line x1="3" y1="9" x2="21" y2="9" />
    </svg>
  );
}

function MineralFamilleIcon({ famille }) {
  if (famille === "paillage_sols") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
        <path d="M3 15c2-1 4-1 6 0s4 1 6 0 4-1 6 0" />
        <path d="M3 19c2-1 4-1 6 0s4 1 6 0 4-1 6 0" />
        <circle cx="7" cy="8" r="1" />
        <circle cx="13" cy="7" r="1" />
        <circle cx="17" cy="9" r="1" />
      </svg>
    );
  }
  if (famille === "pierres_rochers") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
        <path d="M5 15l3-7 5 2 3-4 3 6-2 6H4z" />
      </svg>
    );
  }
  if (famille === "bordures") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
        <rect x="3" y="10" width="18" height="4" rx="1" />
        <line x1="8" y1="10" x2="8" y2="14" />
        <line x1="13" y1="10" x2="13" y2="14" />
      </svg>
    );
  }
  if (famille === "pas_allees") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
        <rect x="4" y="4" width="6" height="6" rx="1" />
        <rect x="14" y="8" width="6" height="6" rx="1" />
        <rect x="7" y="15" width="6" height="6" rx="1" />
      </svg>
    );
  }
  return <IconStone size={20} />;
}

export default function CatalogueMineralScreen({
  t,
  onBack,
  canAddToGarden = true,
  onGardenChange,
  onRequireAccount,
}) {
  const [ambianceTag, setAmbianceTag] = useState(null);
  const [mineralFamille, setMineralFamille] = useState(null);
  const [inGardenMinerals, setInGardenMinerals] = useState(() => new Set());
  const [itemIdsByMineral, setItemIdsByMineral] = useState(() => new Map());
  const [gardenLoading, setGardenLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const [error, setError] = useState(null);

  const mineralFamilleCounts = useMemo(() => countMineralsByFamille(), []);

  const popularMinerals = useMemo(
    () =>
      filterCatalogueMinerals({
        ambianceTag,
        famille: mineralFamille,
        populaireOnly: true,
      }),
    [ambianceTag, mineralFamille]
  );

  const refreshGarden = useCallback(async () => {
    setGardenLoading(true);
    try {
      const mineralState = await loadCatalogueMineralGardenState();
      setInGardenMinerals(mineralState.inGarden);
      setItemIdsByMineral(mineralState.itemIdsByMineral);
    } catch {
      setInGardenMinerals(new Set());
      setItemIdsByMineral(new Map());
    }
    setGardenLoading(false);
  }, []);

  useEffect(() => {
    refreshGarden();
  }, [refreshGarden]);

  const handleToggleMineral = async (article) => {
    if (!article?.id || togglingId) return;
    setError(null);

    const alreadyIn = inGardenMinerals.has(article.id);

    if (!alreadyIn && !canAddToGarden) {
      onRequireAccount?.(() => promoteCatalogueMineralToGarden(article, t));
      return;
    }

    setTogglingId(article.id);
    try {
      if (alreadyIn) {
        const result = await demoteCatalogueMineralFromGarden(article.id, itemIdsByMineral);
        if (!result.ok) setError(result.error || "unknown");
        else {
          await refreshGarden();
          onGardenChange?.();
        }
      } else {
        const result = await promoteCatalogueMineralToGarden(article, t);
        if (!result.ok) setError(result.error || "unknown");
        else {
          await refreshGarden();
          onGardenChange?.();
        }
      }
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <>
      <CatalogueScreenHeader
        crumb={t("catalogue.crumb_catalogue")}
        title={t("catalogue.mineral_title")}
        subtitle={t("catalogue.mineral_subtitle")}
        onBack={onBack}
      />

      <div
        style={{
          display: "flex",
          gap: 7,
          overflowX: "auto",
          padding: "0 16px 16px",
          scrollbarWidth: "none",
        }}
      >
        {MINERAL_AMBIANCE_TAGS.map((tag) => {
          const active = ambianceTag === tag;
          return (
            <button
              key={tag}
              type="button"
              onClick={() => setAmbianceTag((current) => (current === tag ? null : tag))}
              style={{
                flex: "none",
                height: 32,
                padding: "0 13px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: active ? 600 : 500,
                fontFamily: "inherit",
                cursor: "pointer",
                border: active ? "none" : `0.5px solid ${COLORS.borderStrong}`,
                background: active ? COLORS.purpleTint : "#fff",
                color: active ? COLORS.purpleInk : COLORS.secondary,
              }}
            >
              {t(`catalogue.ambiance_${tag}`)}
            </button>
          );
        })}
      </div>

      <div
        style={{
          padding: "0 16px",
          marginBottom: 9,
          fontSize: 12,
          fontWeight: 600,
          color: COLORS.secondary,
          letterSpacing: "0.02em",
          textTransform: "uppercase",
        }}
      >
        {t("catalogue.section_familles")}
      </div>

      <div
        style={{
          padding: "0 16px",
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 10,
          marginBottom: 20,
        }}
      >
        {MINERAL_FAMILLES.map((key) => {
          const active = mineralFamille === key;
          const count = mineralFamilleCounts[key] || 0;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setMineralFamille((current) => (current === key ? null : key))}
              style={{
                border: `0.5px solid ${active ? COLORS.stoneInk : COLORS.border}`,
                borderRadius: 13,
                padding: "13px 12px",
                display: "flex",
                alignItems: "center",
                gap: 11,
                background: active ? COLORS.stoneTint : "#fff",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "inherit",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 11,
                  background: COLORS.stoneTint,
                  flex: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: COLORS.stoneInk,
                }}
              >
                <MineralFamilleIcon famille={key} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink, lineHeight: 1.2 }}>
                  {t(`catalogue.mineral_famille_${key}`)}
                </div>
                <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>
                  {t("catalogue.references_count", { count })}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div
        style={{
          padding: "0 16px",
          marginBottom: 9,
          fontSize: 12,
          fontWeight: 600,
          color: COLORS.secondary,
          letterSpacing: "0.02em",
          textTransform: "uppercase",
        }}
      >
        {t("catalogue.section_popular")}
      </div>

      <div style={{ padding: "0 16px 6px", display: "flex", flexDirection: "column", gap: 9 }}>
        {popularMinerals.length === 0 ? (
          <p style={{ fontSize: 12.5, color: COLORS.muted, padding: "8px 0 12px" }}>
            {t("catalogue.no_results")}
          </p>
        ) : (
          popularMinerals.map((article) => (
            <CatalogueArticleRow
              key={article.id}
              article={article}
              inGarden={inGardenMinerals.has(article.id)}
              toggling={togglingId === article.id || gardenLoading}
              onToggle={handleToggleMineral}
              t={t}
              tint={COLORS.stoneTint}
              ink={COLORS.stoneInk}
              fallbackIcon={<IconStone />}
            />
          ))
        )}
      </div>

      {error && (
        <p style={{ margin: "12px 16px 0", fontSize: 12, color: COLORS.heart, lineHeight: 1.4 }}>
          {error === t("mes_scans.garden_gate") ? (
            <button
              type="button"
              className="wilder-garden-gate-btn"
              style={{ color: COLORS.heart }}
              onClick={() => onRequireAccount?.()}
            >
              {error}
            </button>
          ) : (
            error
          )}
        </p>
      )}

      <div style={{ padding: "14px 16px 20px" }} />
    </>
  );
}
