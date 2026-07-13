/**
 * Catalogue végétal — filtres envie + familles + populaires.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CATALOGUE_ENVIE_TAGS,
  CATALOGUE_FAMILLES,
  countByFamille,
  filterCataloguePlants,
} from "@/lib/cataloguePlants";
import {
  demoteCataloguePlantFromGarden,
  loadCatalogueGardenState,
  promoteCataloguePlantToGarden,
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

function IconLeaf({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6" />
    </svg>
  );
}

function FamilleIcon({ famille }) {
  if (famille === "coniferes") {
    return (
      <svg width="21" height="21" viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
        <polygon points="12 3 7 11 17 11" />
        <polygon points="12 8 6 18 18 18" />
        <line x1="12" y1="18" x2="12" y2="21" />
      </svg>
    );
  }
  if (famille === "arbres") {
    return (
      <svg width="21" height="21" viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
        <circle cx="12" cy="9" r="6" />
        <line x1="12" y1="15" x2="12" y2="21" />
      </svg>
    );
  }
  if (famille === "rosiers") {
    return (
      <svg width="21" height="21" viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 9c0-3 2-4 2-4s0 3-2 4z" />
        <path d="M12 15c0 3-2 4-2 4s0-3 2-4z" />
        <path d="M9 12c-3 0-4-2-4-2s3 0 4 2z" />
        <path d="M15 12c3 0 4 2 4 2s-3 0-4-2z" />
      </svg>
    );
  }
  if (famille === "fleurs" || famille === "vivaces") {
    return (
      <svg width="21" height="21" viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
        <circle cx="12" cy="6" r="2.1" />
        <circle cx="12" cy="18" r="2.1" />
        <circle cx="6" cy="12" r="2.1" />
        <circle cx="18" cy="12" r="2.1" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
    );
  }
  return <IconLeaf size={21} />;
}

export default function CatalogueVegetalScreen({
  t,
  onBack,
  canAddToGarden = true,
  onGardenChange,
  onRequireAccount,
}) {
  const [envieTag, setEnvieTag] = useState(null);
  const [famille, setFamille] = useState(null);
  const [inGarden, setInGarden] = useState(() => new Set());
  const [itemIdsByPlant, setItemIdsByPlant] = useState(() => new Map());
  const [gardenLoading, setGardenLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const [error, setError] = useState(null);

  const familleCounts = useMemo(() => countByFamille(), []);

  const popularPlants = useMemo(
    () =>
      filterCataloguePlants({
        envieTag,
        famille,
        populaireOnly: true,
      }),
    [envieTag, famille]
  );

  const refreshGarden = useCallback(async () => {
    setGardenLoading(true);
    try {
      const plantState = await loadCatalogueGardenState();
      setInGarden(plantState.inGarden);
      setItemIdsByPlant(plantState.itemIdsByPlant);
    } catch {
      setInGarden(new Set());
      setItemIdsByPlant(new Map());
    }
    setGardenLoading(false);
  }, []);

  useEffect(() => {
    refreshGarden();
  }, [refreshGarden]);

  const handleTogglePlant = async (plant) => {
    if (!plant?.id || togglingId) return;
    setError(null);

    const alreadyIn = inGarden.has(plant.id);

    if (!alreadyIn && !canAddToGarden) {
      onRequireAccount?.(() => promoteCataloguePlantToGarden(plant, t));
      return;
    }

    setTogglingId(plant.id);
    try {
      if (alreadyIn) {
        const result = await demoteCataloguePlantFromGarden(plant.id, itemIdsByPlant);
        if (!result.ok) setError(result.error || "unknown");
        else {
          await refreshGarden();
          onGardenChange?.();
        }
      } else {
        const result = await promoteCataloguePlantToGarden(plant, t);
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
        title={t("catalogue.vegetal_title")}
        subtitle={t("catalogue.vegetal_subtitle")}
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
        {CATALOGUE_ENVIE_TAGS.map((tag) => {
          const active = envieTag === tag;
          return (
            <button
              key={tag}
              type="button"
              onClick={() => setEnvieTag((current) => (current === tag ? null : tag))}
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
              {t(`catalogue.envie_${tag}`)}
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
        {CATALOGUE_FAMILLES.map((key) => {
          const active = famille === key;
          const count = familleCounts[key] || 0;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setFamille((current) => (current === key ? null : key))}
              style={{
                border: `0.5px solid ${active ? COLORS.greenInk : COLORS.border}`,
                borderRadius: 13,
                padding: "13px 12px",
                display: "flex",
                alignItems: "center",
                gap: 11,
                background: active ? COLORS.greenTint : "#fff",
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
                  background: COLORS.greenTint,
                  flex: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: COLORS.greenInk,
                }}
              >
                <FamilleIcon famille={key} />
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: COLORS.ink, lineHeight: 1.2 }}>
                  {t(`catalogue.famille_${key}`)}
                </div>
                <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>
                  {t("catalogue.varieties_count", { count })}
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
        {popularPlants.length === 0 ? (
          <p style={{ fontSize: 12.5, color: COLORS.muted, padding: "8px 0 12px" }}>
            {t("catalogue.no_results")}
          </p>
        ) : (
          popularPlants.map((plant) => (
            <CatalogueArticleRow
              key={plant.id}
              article={plant}
              inGarden={inGarden.has(plant.id)}
              toggling={togglingId === plant.id || gardenLoading}
              onToggle={handleTogglePlant}
              t={t}
              tint={COLORS.greenTint}
              ink={COLORS.greenInk}
              fallbackIcon={<IconLeaf />}
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
