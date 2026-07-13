/**
 * Catalogue déco — mobilier, poterie, luminaire, objets.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DECO_FAMILLES,
  DECO_STYLE_TAGS,
  countDecoByFamille,
  filterCatalogueDeco,
} from "@/lib/catalogueDeco";
import {
  demoteCatalogueDecoFromGarden,
  loadCatalogueDecoGardenState,
  promoteCatalogueDecoToGarden,
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

function IconDeco({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
      <path d="M12 3c2 3 2 5 0 7s-2 4 0 6" />
      <path d="M8 21h8" />
      <path d="M10 21c0-3 4-3 4 0" />
    </svg>
  );
}

function DecoFamilleIcon({ famille }) {
  if (famille === "mobilier") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
        <path d="M4 12h16" />
        <path d="M6 12V8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4" />
        <path d="M8 12v5M16 12v5" />
      </svg>
    );
  }
  if (famille === "poterie") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
        <path d="M8 21h8" />
        <path d="M9 21c0-6 1-9 3-12s4-6 3-9" />
        <path d="M15 21c0-6-1-9-3-12s-4-6-3-9" />
      </svg>
    );
  }
  if (famille === "luminaire") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
        <path d="M9 18h6" />
        <path d="M10 22h4" />
        <path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
      </svg>
    );
  }
  if (famille === "objets") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
      </svg>
    );
  }
  return <IconDeco size={20} />;
}

export default function CatalogueDecoScreen({
  t,
  onBack,
  canAddToGarden = true,
  onGardenChange,
  onRequireAccount,
}) {
  const [styleTag, setStyleTag] = useState(null);
  const [decoFamille, setDecoFamille] = useState(null);
  const [inGardenDeco, setInGardenDeco] = useState(() => new Set());
  const [itemIdsByDeco, setItemIdsByDeco] = useState(() => new Map());
  const [gardenLoading, setGardenLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const [error, setError] = useState(null);

  const decoFamilleCounts = useMemo(() => countDecoByFamille(), []);

  const popularDeco = useMemo(
    () =>
      filterCatalogueDeco({
        styleTag,
        famille: decoFamille,
        populaireOnly: true,
      }),
    [styleTag, decoFamille]
  );

  const refreshGarden = useCallback(async () => {
    setGardenLoading(true);
    try {
      const decoState = await loadCatalogueDecoGardenState();
      setInGardenDeco(decoState.inGarden);
      setItemIdsByDeco(decoState.itemIdsByDeco);
    } catch {
      setInGardenDeco(new Set());
      setItemIdsByDeco(new Map());
    }
    setGardenLoading(false);
  }, []);

  useEffect(() => {
    refreshGarden();
  }, [refreshGarden]);

  const handleToggleDeco = async (article) => {
    if (!article?.id || togglingId) return;
    setError(null);

    const alreadyIn = inGardenDeco.has(article.id);

    if (!alreadyIn && !canAddToGarden) {
      onRequireAccount?.(() => promoteCatalogueDecoToGarden(article, t));
      return;
    }

    setTogglingId(article.id);
    try {
      if (alreadyIn) {
        const result = await demoteCatalogueDecoFromGarden(article.id, itemIdsByDeco);
        if (!result.ok) setError(result.error || "unknown");
        else {
          await refreshGarden();
          onGardenChange?.();
        }
      } else {
        const result = await promoteCatalogueDecoToGarden(article, t);
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
        title={t("catalogue.deco_title")}
        subtitle={t("catalogue.deco_subtitle")}
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
        {DECO_STYLE_TAGS.map((tag) => {
          const active = styleTag === tag;
          return (
            <button
              key={tag}
              type="button"
              onClick={() => setStyleTag((current) => (current === tag ? null : tag))}
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
              {t(`catalogue.deco_style_${tag}`)}
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
        {DECO_FAMILLES.map((key) => {
          const active = decoFamille === key;
          const count = decoFamilleCounts[key] || 0;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setDecoFamille((current) => (current === key ? null : key))}
              style={{
                border: `0.5px solid ${active ? COLORS.decoInk : COLORS.border}`,
                borderRadius: 13,
                padding: "13px 12px",
                display: "flex",
                alignItems: "center",
                gap: 11,
                background: active ? COLORS.decoTint : "#fff",
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
                  background: COLORS.decoTint,
                  flex: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: COLORS.decoInk,
                }}
              >
                <DecoFamilleIcon famille={key} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink, lineHeight: 1.2 }}>
                  {t(`catalogue.deco_famille_${key}`)}
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
        {popularDeco.length === 0 ? (
          <p style={{ fontSize: 12.5, color: COLORS.muted, padding: "8px 0 12px" }}>
            {t("catalogue.no_results")}
          </p>
        ) : (
          popularDeco.map((article) => (
            <CatalogueArticleRow
              key={article.id}
              article={article}
              inGarden={inGardenDeco.has(article.id)}
              toggling={togglingId === article.id || gardenLoading}
              onToggle={handleToggleDeco}
              t={t}
              tint={COLORS.decoTint}
              ink={COLORS.decoInk}
              fallbackIcon={<IconDeco />}
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
