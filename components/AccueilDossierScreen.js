import { useMemo } from "react";
import { computeGardenDossierProgress } from "@/lib/gardenDossierProgress";
import { DOSSIER_STEP_CARD, DOSSIER_STEP_ORDER } from "@/lib/gardenDossierStepCards";
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

function StepIcon({ type, stroke }) {
  const ic = { stroke, strokeWidth: 2, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" };
  if (type === "camera") {
    return (
      <svg width={20} height={20} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" style={ic} />
        <circle cx="12" cy="13" r="3" style={ic} />
      </svg>
    );
  }
  if (type === "sparkle") {
    return (
      <svg width={20} height={20} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" style={ic} />
      </svg>
    );
  }
  if (type === "budget") {
    return (
      <svg width={20} height={20} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 10h12" style={ic} />
        <path d="M4 14h9" style={ic} />
        <path d="M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2" style={ic} />
      </svg>
    );
  }
  if (type === "heart") {
    return (
      <svg width={20} height={20} viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
          style={ic}
        />
      </svg>
    );
  }
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" style={ic} />
    </svg>
  );
}

function Chevron({ color }) {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m9 18 6-6-6-6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function NextStepCard({ stepId, onClick }) {
  const meta = DOSSIER_STEP_CARD[stepId];
  if (!meta) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        borderRadius: 18,
        background: meta.bg,
        border: meta.border || "none",
        color: "#1F2A22",
        minHeight: 44,
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "left",
        width: "100%",
      }}
    >
      <span
        style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          background: meta.iconBg || "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <StepIcon type={meta.icon} stroke={meta.iconStroke} />
      </span>
      <span style={{ display: "flex", flexDirection: "column", flexGrow: 1, minWidth: 0 }}>
        <span style={{ fontSize: 15, fontWeight: 700 }}>{meta.title}</span>
        <span style={{ fontSize: 13, color: meta.subtitleColor, lineHeight: 1.35 }}>{meta.subtitle}</span>
      </span>
      <Chevron color={meta.chevron} />
    </button>
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
  onOpenAddSheet,
  onOpenIdees,
  onOpenMot,
  onScan,
}) {
  const displayName = loadPremiumProfile().displayName?.trim();
  const greeting = displayName ? `Bonjour ${displayName}` : "Bonjour";

  const progress = useMemo(
    () =>
      computeGardenDossierProgress({
        gardenItemCount: gardenItems.length,
        paysagisteMessage,
      }),
    [gardenItems.length, paysagisteMessage]
  );

  const nextSteps = useMemo(() => {
    const remainingIds = new Set(progress.remainingSteps.map((s) => s.id));
    return DOSSIER_STEP_ORDER.filter((id) => remainingIds.has(id)).slice(0, 3);
  }, [progress.remainingSteps]);

  const recentItems = useMemo(() => gardenItems.slice(0, 3), [gardenItems]);

  const progressPhrase =
    progress.percent >= 100
      ? "Votre dossier est complet, vous pouvez l'envoyer à votre paysagiste."
      : `Encore ${progress.remainingCount} étape${progress.remainingCount > 1 ? "s" : ""} pour que votre paysagiste comprenne vraiment votre projet.`;

  const handleStep = (stepId) => {
    if (stepId === "terrain") onOpenAddSheet?.();
    else if (stepId === "ambiance" || stepId === "coups-de-coeur") onOpenIdees?.();
    else if (stepId === "budget") onOpenDossier?.();
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
          <span style={{ fontSize: 14, fontWeight: 600, color: "#5B6359" }}>{greeting}</span>
          <span style={{ fontSize: 24, fontWeight: 700, color: "#1F2A22", lineHeight: 1.15 }}>
            Mon dossier jardin
          </span>
        </div>
        {accountMenu ? <div style={{ flexShrink: 0 }}>{accountMenu}</div> : null}
      </div>

      <div
        style={{
          borderRadius: 24,
          padding: 20,
          background: "linear-gradient(160deg, #5E8A64 0%, #2F5E3F 60%, #1E3A28 100%)",
          color: "#FFFFFF",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>Dossier complet à {progress.percent} %</span>
          <span style={{ fontSize: 13, color: "#D7E7D9", flexShrink: 0 }}>
            {progress.completedCount} étape{progress.completedCount > 1 ? "s" : ""} sur {progress.totalSteps}
          </span>
        </div>
        <div style={{ height: 10, borderRadius: 999, background: "rgba(255,255,255,0.22)" }}>
          <div
            style={{
              width: `${progress.percent}%`,
              height: 10,
              borderRadius: 999,
              background: "#FFFFFF",
              transition: "width 0.25s ease",
            }}
          />
        </div>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: "#E3EEE4" }}>{progressPhrase}</p>
        <button
          type="button"
          onClick={onOpenDossier}
          style={{
            alignSelf: "flex-start",
            minHeight: 44,
            padding: "0 18px",
            borderRadius: 14,
            background: "#FFFFFF",
            color: "#1F3F2A",
            border: "none",
            fontSize: 14,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"
              stroke="currentColor"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M14 2v4a2 2 0 0 0 2 2h4" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Voir mon dossier
        </button>
      </div>

      {nextSteps.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "1.2px",
              color: "#5B6359",
            }}
          >
            PROCHAINES ÉTAPES
          </span>
          {nextSteps.map((stepId) => (
            <NextStepCard key={stepId} stepId={stepId} onClick={() => handleStep(stepId)} />
          ))}
        </div>
      ) : null}

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
              onClick={onScan}
              style={{
                minHeight: 44,
                borderRadius: 14,
                background: "#2F5E3F",
                color: "#fff",
                border: "none",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Scanner une plante
            </button>
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
