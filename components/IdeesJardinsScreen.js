/**
 * Idées de jardins — galerie d'ambiances (Option C mock).
 * Maquette : wilder_ecran_idees_jardins.html
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  HERO_GRADIENTS,
  countAmbianceItems,
  getActiveGardenIdeas,
  isAmbianceComplete,
  resolveAmbianceItems,
} from "@/lib/gardenIdeas";
import {
  loadCatalogueGardenState,
  loadCatalogueMineralGardenState,
  promoteAmbianceToGarden,
} from "@/lib/promoteCatalogueToGarden";

const COLORS = {
  ink: "#1e2b23",
  secondary: "#4c554a",
  muted: "#8b9084",
  border: "#e6e2d8",
  greenTint: "#e7efe6",
  greenInk: "#3c6b47",
  screen: "#ffffff",
};

const icStroke = {
  stroke: "currentColor",
  strokeWidth: 2,
  fill: "none",
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const screenWrap = {
  minHeight: "100vh",
  background: "radial-gradient(120% 120% at 50% 0%, #e2ddcf 0%, #cfc9ba 100%)",
  display: "flex",
  justifyContent: "center",
  padding: "16px",
  color: COLORS.ink,
  fontFamily: 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif',
};

const cardWrap = {
  width: "100%",
  maxWidth: 380,
  background: COLORS.screen,
  borderRadius: 24,
  overflow: "hidden",
  alignSelf: "flex-start",
};

function IconBack() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function IconLeaf({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function formatAmbianceCount(ambiance, t) {
  const { plants, minerals } = countAmbianceItems(ambiance);
  if (plants > 0 && minerals > 0) {
    return t("idees_jardins.count_both", { plants, minerals });
  }
  if (plants > 0) return t("idees_jardins.plants_count", { count: plants });
  return t("idees_jardins.minerals_count", { count: minerals });
}

function IdeaCard({
  idea,
  complete,
  adding,
  onAdd,
  t,
}) {
  const heroBg = idea.image_url ? undefined : HERO_GRADIENTS[idea.hero_key] || HERO_GRADIENTS.med;

  return (
    <article
      style={{
        border: `0.5px solid ${COLORS.border}`,
        borderRadius: 16,
        overflow: "hidden",
        background: "#fff",
      }}
    >
      <div
        style={{
          height: 120,
          position: "relative",
          display: "flex",
          alignItems: "flex-end",
          padding: "10px 12px",
          background: heroBg,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {idea.image_url && (
          <img
            src={idea.image_url}
            alt=""
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg,transparent 40%,rgba(0,0,0,.35) 100%)",
          }}
          aria-hidden="true"
        />
        <span
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            zIndex: 1,
            background: "#ffffffe0",
            fontSize: 10,
            fontWeight: 600,
            color: COLORS.secondary,
            padding: "3px 9px",
            borderRadius: 20,
          }}
        >
          {idea.badge_conditions}
        </span>
        <span
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "#fff",
            textShadow: "0 1px 4px rgba(0,0,0,.35)",
            position: "relative",
            zIndex: 1,
          }}
        >
          {idea.nom}
        </span>
      </div>

      <div style={{ padding: "11px 13px 13px" }}>
        <p style={{ margin: 0, fontSize: 12, color: COLORS.secondary, lineHeight: 1.5 }}>
          {idea.description}
        </p>
        <div
          style={{
            marginTop: 11,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <span
            style={{
              fontSize: 11,
              color: COLORS.muted,
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <IconLeaf /> {formatAmbianceCount(idea, t)}
          </span>
          <button
            type="button"
            onClick={() => onAdd(idea)}
            disabled={complete || adding}
            style={{
              flex: "none",
              height: 34,
              padding: "0 13px",
              borderRadius: 20,
              fontSize: 11.5,
              fontWeight: 600,
              cursor: complete || adding ? "default" : "pointer",
              fontFamily: "inherit",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              border: "none",
              background: COLORS.greenTint,
              color: COLORS.greenInk,
              opacity: complete ? 0.72 : adding ? 0.65 : 1,
            }}
          >
            {complete ? (
              <>
                <IconCheck /> {t("idees_jardins.palette_complete")}
              </>
            ) : (
              <>
                <IconPlus /> {t("idees_jardins.add_palette")}
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function IdeesJardinsScreen({
  t,
  canAddToGarden = true,
  onBack,
  onGardenChange,
}) {
  const ideas = useMemo(() => getActiveGardenIdeas(), []);
  const [inGardenPlants, setInGardenPlants] = useState(() => new Set());
  const [inGardenMinerals, setInGardenMinerals] = useState(() => new Set());
  const [gardenLoading, setGardenLoading] = useState(true);
  const [addingId, setAddingId] = useState(null);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const refreshGarden = useCallback(async () => {
    setGardenLoading(true);
    try {
      const [plantState, mineralState] = await Promise.all([
        loadCatalogueGardenState(),
        loadCatalogueMineralGardenState(),
      ]);
      setInGardenPlants(plantState.inGarden);
      setInGardenMinerals(mineralState.inGarden);
    } catch {
      setInGardenPlants(new Set());
      setInGardenMinerals(new Set());
    }
    setGardenLoading(false);
  }, []);

  useEffect(() => {
    refreshGarden();
  }, [refreshGarden]);

  const handleAddPalette = async (idea) => {
    if (!idea?.id || addingId) return;
    setError(null);
    setFeedback(null);

    if (isAmbianceComplete(idea, inGardenPlants, inGardenMinerals)) return;

    if (!canAddToGarden) {
      setError(t("mes_scans.garden_gate"));
      return;
    }

    setAddingId(idea.id);
    try {
      const result = await promoteAmbianceToGarden(idea, resolveAmbianceItems, t);
      if (!result.ok) {
        setError(result.error || "unknown");
        return;
      }

      await refreshGarden();
      onGardenChange?.();

      if (result.added === 0) {
        setFeedback(t("idees_jardins.feedback_all_present"));
      } else if (result.skipped > 0) {
        setFeedback(
          t("idees_jardins.feedback_partial", {
            added: result.added,
            skipped: result.skipped,
          })
        );
      } else {
        setFeedback(t("idees_jardins.feedback_added", { added: result.added }));
      }
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div style={screenWrap} className="screen-enter-fast">
      <div style={cardWrap}>
        <div
          style={{
            padding: "15px 16px 10px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <button
            type="button"
            onClick={onBack}
            aria-label={t("discovery.back")}
            style={{
              width: 32,
              height: 32,
              border: "none",
              background: "transparent",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: COLORS.ink,
            }}
          >
            <IconBack />
          </button>
          <span style={{ fontSize: 14, color: COLORS.muted }}>{t("idees_jardins.menu_crumb")}</span>
        </div>

        <div style={{ padding: "2px 16px 14px" }}>
          <h1 style={{ margin: 0, fontSize: 21, fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.15 }}>
            {t("idees_jardins.title")}
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: COLORS.muted, lineHeight: 1.5 }}>
            {t("idees_jardins.subtitle")}
          </p>
        </div>

        {(error || feedback) && (
          <div style={{ padding: "0 16px 12px" }}>
            {error && (
              <p style={{ margin: 0, fontSize: 12, color: "#9b3b3b", lineHeight: 1.45 }}>{error}</p>
            )}
            {!error && feedback && (
              <p style={{ margin: 0, fontSize: 12, color: COLORS.greenInk, lineHeight: 1.45 }}>{feedback}</p>
            )}
          </div>
        )}

        <div
          style={{
            padding: "0 16px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {ideas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              complete={isAmbianceComplete(idea, inGardenPlants, inGardenMinerals)}
              adding={addingId === idea.id || gardenLoading}
              onAdd={handleAddPalette}
              t={t}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
