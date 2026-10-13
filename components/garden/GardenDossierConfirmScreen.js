import { useEffect, useState } from "react";
import { stepShortLabel } from "@/lib/gardenDossierGuidance";
import {
  CLIENT_CONTACT_PROFILE_HINT,
  isClientContactComplete,
  loadClientContact,
} from "@/lib/clientContact";
import { GARDEN_PDF_USER_ERROR } from "@/lib/gardenBriefPdfDelivery";
import { useGardenDossierPdfPrepare } from "@/hooks/useGardenDossierPdfPrepare";

const GREEN = "var(--sage)";

export default function GardenDossierConfirmScreen({
  progress,
  nextStepId,
  onNextStep,
  onViewDossier,
  refreshTick = 0,
  onOpenProfile,
}) {
  const complete = progress.percent >= 100;
  const nextLabel = nextStepId ? stepShortLabel(nextStepId) : null;
  const [shareFeedback, setShareFeedback] = useState(null);
  const [shareError, setShareError] = useState(null);
  const [contactComplete, setContactComplete] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const contact = await loadClientContact();
      if (!cancelled) setContactComplete(isClientContactComplete(contact));
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  const dossierComplete = complete && contactComplete;
  const pdfPrepareEnabled = complete && contactComplete;

  const { analyzing, analysisError, pdfPreparing, pdfReady, pdfError, shareFromPrepared } =
    useGardenDossierPdfPrepare(
    pdfPrepareEnabled,
    refreshTick,
    dossierComplete
  );

  const pdfBlocked = contactComplete && (!pdfReady || pdfPreparing || analyzing);

  const shareButtonLabel =
    contactComplete && analyzing
      ? "Analyse de votre dossier…"
      : contactComplete && pdfPreparing
        ? "Préparation du PDF…"
        : "Envoyer à mon paysagiste";

  const handleShare = () => {
    if (!complete) return;
    if (!contactComplete) {
      onOpenProfile?.(CLIENT_CONTACT_PROFILE_HINT);
      return;
    }
    if (pdfBlocked) return;
    setShareError(null);
    setShareFeedback(null);
    const result = shareFromPrepared();
    if (!result.ok) {
      if (result.cancelled) return;
      setShareError(result.error || GARDEN_PDF_USER_ERROR);
      return;
    }
    setShareFeedback("Dossier prêt à partager.");
  };

  const shareDisabled = !complete || pdfBlocked;

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 24px 24px",
        textAlign: "center",
        gap: 16,
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 999,
          background: "rgba(201, 214, 184, 0.18)",
          color: GREEN,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width={36} height={36} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M20 6 9 17l-5-5"
            stroke="currentColor"
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "var(--ink)" }}>
        {complete ? "Votre dossier est complet !" : "C'est noté !"}
      </h1>

      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.45, color: "var(--mute)", maxWidth: 320 }}>
        {complete
          ? "Vous pouvez envoyer votre dossier à votre paysagiste."
          : `${progress.completedCount} étape${progress.completedCount > 1 ? "s" : ""} sur ${progress.totalSteps} · ${progress.percent} %`}
      </p>

      {analysisError ? (
        <p style={{ margin: 0, fontSize: 13, color: "#C0652E", maxWidth: 320 }}>{analysisError}</p>
      ) : null}
      {pdfError ? (
        <p style={{ margin: 0, fontSize: 13, color: "#b42318", maxWidth: 320 }}>{GARDEN_PDF_USER_ERROR}</p>
      ) : null}
      {shareError ? (
        <p style={{ margin: 0, fontSize: 13, color: "#b42318", maxWidth: 320 }}>{shareError}</p>
      ) : null}
      {shareFeedback ? (
        <p style={{ margin: 0, fontSize: 13, color: GREEN, maxWidth: 320 }}>{shareFeedback}</p>
      ) : null}

      <div style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
        {complete ? (
          <button
            type="button"
            disabled={shareDisabled}
            onClick={handleShare}
            style={{
              ...primaryBtnStyle,
              opacity: shareDisabled ? 0.55 : 1,
              cursor: shareDisabled ? "default" : "pointer",
            }}
          >
            {shareButtonLabel}
          </button>
        ) : nextStepId ? (
          <button type="button" onClick={() => onNextStep(nextStepId)} style={primaryBtnStyle}>
            Étape suivante : {nextLabel}
          </button>
        ) : null}

        <button
          type="button"
          onClick={onViewDossier}
          style={{
            width: "100%",
            minHeight: 54,
            borderRadius: 18,
            border: `1.5px solid ${GREEN}`,
            background: "var(--card)",
            color: GREEN,
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {complete ? "Voir mon dossier" : "Retour à mon dossier"}
        </button>
      </div>
    </div>
  );
}

const primaryBtnStyle = {
  width: "100%",
  minHeight: 54,
  borderRadius: 18,
  border: "none",
  background: GREEN,
  color: "var(--bg)",
  fontSize: 16,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
};
