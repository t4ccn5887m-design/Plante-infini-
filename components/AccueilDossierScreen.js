import { useMemo } from "react";
import AtelierProgressRing from "@/components/atelier/AtelierProgressRing";
import AtelierStepRow from "@/components/atelier/AtelierStepRow";
import { getAllGardenStyles } from "@/lib/catalogueStyles";
import { computeGardenDossierProgress } from "@/lib/gardenDossierProgress";
import { readGardenDossierLocalFlags } from "@/lib/gardenDossierLocal";
import { DOSSIER_STEP_CARD } from "@/lib/gardenDossierStepCards";
import { loadPremiumProfile } from "@/lib/premiumProfile";
import { WILDER_COLORS as COLORS } from "@/lib/themes";

const PLACEHOLDER_COLORS = ["#B9667F", "#6F8A5C", "#8C7AB0", "#C0652E", "#6A5896"];

function hashColor(name) {
  let h = 0;
  const s = String(name || "");
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
  return PLACEHOLDER_COLORS[Math.abs(h) % PLACEHOLDER_COLORS.length];
}

function isCatalogueItem(discovery) {
  if (!discovery) return false;
  return Boolean(
    discovery.catalogue_plant_id ||
      discovery.catalogue_mineral_id ||
      discovery.catalogue_deco_id
  );
}

function CoupThumb({ item }) {
  const isScan = !isCatalogueItem(item.discovery);
  const badgeLabel = isScan ? "Scan" : "Idée";
  const badgeColor = isScan ? "#4E7B52" : "#6A5896";
  const photo = item.photo;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        borderRadius: 16,
        overflow: "hidden",
        border: "1.5px solid #EEE9E0",
        color: "#1F2A22",
        minWidth: 0,
      }}
    >
      <div
        style={{
          height: 70,
          position: "relative",
          background: photo ? "#DDD7CC" : hashColor(item.nom),
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          padding: 6,
          overflow: "hidden",
        }}
      >
        {photo ? (
          <img
            src={photo}
            alt=""
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : null}
        <span
          style={{
            position: "relative",
            zIndex: 1,
            fontSize: 10,
            fontWeight: 700,
            padding: "2px 6px",
            borderRadius: 999,
            background: "#FFFFFF",
            color: badgeColor,
          }}
        >
          {badgeLabel}
        </span>
      </div>
      <span
        style={{
          padding: 8,
          fontSize: 13,
          fontWeight: 700,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {item.nom}
      </span>
    </div>
  );
}

export default function AccueilDossierScreen({
  loading,
  gardenItems = [],
  paysagisteMessage = "",
  accountMenu = null,
  onOpenDossier,
  onOpenCoupsDeCoeur,
  onOpenIdees,
  onOpenAmbiances,
  onOpenTerrain,
  onOpenBudget,
  onContinueDossier,
  onOpenMot,
  gardenRefreshTick = 0,
}) {
  const displayName = loadPremiumProfile().displayName?.trim();
  const greeting = displayName ? `Bonjour ${displayName}` : "Bonjour";

  const localFlags = useMemo(() => readGardenDossierLocalFlags(), [gardenRefreshTick]);

  const progress = useMemo(
    () =>
      computeGardenDossierProgress({
        gardenItemCount: gardenItems.length,
        paysagisteMessage,
        ambianceComplete: localFlags.ambianceComplete,
        terrainPhotosComplete: localFlags.terrainPhotosComplete,
        budgetComplete: localFlags.budgetComplete,
      }),
    [gardenItems.length, paysagisteMessage, localFlags]
  );

  const recentItems = useMemo(() => gardenItems.slice(0, 3), [gardenItems]);

  const heroPhotoUrl = useMemo(() => {
    const styles = getAllGardenStyles();
    const pick = styles.find((s) => s.origin === "realisation") || styles[0];
    return pick?.photo_url || null;
  }, []);

  const progressPhrase =
    progress.percent >= 100
      ? "Votre dossier est complet, vous pouvez l'envoyer à votre paysagiste."
      : `Encore ${progress.remainingCount} étape${progress.remainingCount > 1 ? "s" : ""} pour que votre paysagiste comprenne vraiment votre projet.`;

  const handleStep = (stepId) => {
    if (stepId === "terrain") onOpenTerrain?.();
    else if (stepId === "ambiance") onOpenAmbiances?.();
    else if (stepId === "coups-de-coeur") onOpenIdees?.();
    else if (stepId === "budget") onOpenBudget?.();
    else if (stepId === "mot-paysagiste") onOpenMot?.();
  };

  if (loading) {
    return (
      <div style={{ padding: 24, fontSize: 13, color: COLORS.muted, textAlign: "center" }}>
        Chargement…
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        overflow: "auto",
        padding: "18px 18px 8px",
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
          <span className="atelier-label">{greeting}</span>
          <span
            style={{
              fontFamily: "var(--font-title, Fraunces, serif)",
              fontSize: 24,
              fontWeight: 400,
              color: COLORS.ink,
              lineHeight: 1.15,
            }}
          >
            Mon dossier jardin
          </span>
        </div>
        {accountMenu ? <div style={{ flexShrink: 0 }}>{accountMenu}</div> : null}
      </div>

      <div className="atelier-accueil-hero">
        {heroPhotoUrl ? (
          <img className="atelier-accueil-hero__photo" src={heroPhotoUrl} alt="" />
        ) : (
          <div className="atelier-accueil-hero__photo" style={{ background: "var(--card)" }} />
        )}
        <div className="atelier-accueil-hero__shade" aria-hidden="true" />
        <div className="atelier-accueil-hero__body">
          <h2 className="atelier-accueil-hero__title">Votre jardin, étape par étape</h2>
          <button
            type="button"
            className="atelier-btn-primary"
            onClick={progress.percent >= 100 ? onOpenDossier : onContinueDossier || onOpenDossier}
          >
            {progress.percent >= 100 ? "Voir mon dossier →" : "Continuer mon dossier →"}
          </button>
        </div>
      </div>

      <div className="atelier-accueil-progress">
        <AtelierProgressRing percent={progress.percent} />
        <p>{progressPhrase}</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span className="atelier-label atelier-label--sage">Étapes du dossier</span>
        <div className="atelier-step-list">
          {progress.steps.map((step, index) => {
            const meta = DOSSIER_STEP_CARD[step.id];
            return (
              <AtelierStepRow
                key={step.id}
                index={index + 1}
                title={meta?.title || step.label}
                statusLabel={step.complete ? "Fait" : "À faire"}
                done={step.complete}
                onClick={() => handleStep(step.id)}
              />
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "1.2px",
              color: "#5B6359",
            }}
          >
            MES COUPS DE CŒUR · {gardenItems.length}
          </span>
          {gardenItems.length > 0 ? (
            <button
              type="button"
              onClick={onOpenCoupsDeCoeur}
              style={{
                fontSize: 14,
                fontWeight: 700,
                minHeight: 32,
                display: "flex",
                alignItems: "center",
                border: "none",
                background: "transparent",
                color: COLORS.active,
                cursor: "pointer",
                fontFamily: "inherit",
                padding: 0,
              }}
            >
              Tout voir
            </button>
          ) : null}
        </div>

        {gardenItems.length === 0 ? (
          <div
            style={{
              borderRadius: 18,
              border: "1.5px solid #EEE9E0",
              padding: "18px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 14,
              alignItems: "stretch",
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 700, color: "#1F2A22", textAlign: "center" }}>
              Votre jardin commence ici
            </span>
            <button
              type="button"
              onClick={onOpenIdees}
              style={{
                minHeight: 44,
                borderRadius: 14,
                background: "#FFFFFF",
                color: "#2F5E3F",
                border: "1.5px solid #EEE9E0",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Piocher une idée
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 8,
            }}
          >
            {recentItems.map((item) => (
              <CoupThumb key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
