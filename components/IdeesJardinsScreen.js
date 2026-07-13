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
  loadCatalogueDecoGardenState,
  promoteAmbianceToGarden,
} from "@/lib/promoteCatalogueToGarden";
import { WILDER_COLORS as COLORS } from "@/lib/themes";
import CatalogueScreenHeader from "@/components/catalogue/CatalogueScreenHeader";

const icStroke = {
  stroke: "currentColor",
  strokeWidth: 2,
  fill: "none",
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

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
          className="wilder-v2-title-feature"
          style={{
            fontSize: 16,
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
  onBack,
  canAddToGarden = true,
  onGardenChange,
  onRequireAccount,
}) {
  const ideas = useMemo(() => getActiveGardenIdeas(), []);
  const [inGardenPlants, setInGardenPlants] = useState(() => new Set());
  const [inGardenMinerals, setInGardenMinerals] = useState(() => new Set());
  const [inGardenDeco, setInGardenDeco] = useState(() => new Set());
  const [gardenLoading, setGardenLoading] = useState(true);
  const [addingId, setAddingId] = useState(null);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const refreshGarden = useCallback(async () => {
    setGardenLoading(true);
    try {
      const [plantState, mineralState, decoState] = await Promise.all([
        loadCatalogueGardenState(),
        loadCatalogueMineralGardenState(),
        loadCatalogueDecoGardenState(),
      ]);
      setInGardenPlants(plantState.inGarden);
      setInGardenMinerals(mineralState.inGarden);
      setInGardenDeco(decoState.inGarden);
    } catch {
      setInGardenPlants(new Set());
      setInGardenMinerals(new Set());
      setInGardenDeco(new Set());
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

    if (isAmbianceComplete(idea, inGardenPlants, inGardenMinerals, inGardenDeco)) return;

    if (!canAddToGarden) {
      onRequireAccount?.(() => promoteAmbianceToGarden(idea, resolveAmbianceItems, t));
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
    <>
        {onBack ? (
          <CatalogueScreenHeader
            crumb={t("catalogue.crumb_catalogue")}
            title={t("idees_jardins.title")}
            subtitle={t("idees_jardins.subtitle")}
            onBack={onBack}
          />
        ) : (
          <>
            <div style={{ padding: "15px 16px 10px" }}>
              <span style={{ fontSize: 14, color: COLORS.muted }}>{t("idees_jardins.menu_crumb")}</span>
            </div>

            <div style={{ padding: "2px 16px 14px" }}>
              <h1
                className="wilder-v2-title-page"
                style={{ margin: 0, fontSize: 21, letterSpacing: "-0.01em", lineHeight: 1.15 }}
              >
                {t("idees_jardins.title")}
              </h1>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: COLORS.muted, lineHeight: 1.5 }}>
                {t("idees_jardins.subtitle")}
              </p>
            </div>
          </>
        )}

        {(error || feedback) && (
          <div style={{ padding: "0 16px 12px" }}>
            {error && (
              <p style={{ margin: 0, fontSize: 12, color: COLORS.error, lineHeight: 1.45 }}>
                {error === t("mes_scans.garden_gate") ? (
                  <button
                    type="button"
                    className="wilder-garden-gate-btn"
                    style={{ color: COLORS.error }}
                    onClick={() => onRequireAccount?.()}
                  >
                    {error}
                  </button>
                ) : (
                  error
                )}
              </p>
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
              complete={isAmbianceComplete(idea, inGardenPlants, inGardenMinerals, inGardenDeco)}
              adding={addingId === idea.id || gardenLoading}
              onAdd={handleAddPalette}
              t={t}
            />
          ))}
        </div>
    </>
  );
}
