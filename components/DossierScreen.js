/**
 * Mon dossier jardin — maquette sevya/4-dossier.html
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { GARDEN_PDF_USER_ERROR } from "@/lib/gardenBriefPdfDelivery";
import { useGardenDossierPdfPrepare } from "@/hooks/useGardenDossierPdfPrepare";
import { computeGardenDossierProgress } from "@/lib/gardenDossierProgress";
import { loadGardenIntention } from "@/lib/gardenIntention";
import { loadGardenCoupsItems } from "@/lib/gardenCoupsItems";
import { readGardenDossierLocalFlags } from "@/lib/gardenDossierLocal";
import { loadGardenAmbianceChoice } from "@/lib/gardenAmbianceChoice";
import { loadGardenBudgetChoice } from "@/lib/gardenBudgetChoice";
import { loadGardenTerrainFields } from "@/lib/gardenTerrainFields";
import { loadGardenBriefDetails } from "@/lib/gardenBriefDetails";
import { dossierStepLabel } from "@/lib/gardenDossierProgress";
import { loadGardenTerrainPhotoDataUrls } from "@/lib/gardenTerrainPhotos";
import {
  areaRangeLabel,
  budgetLabel,
  timelineLabel,
  utilitiesLabel,
} from "@/lib/pro/briefLabels";
import {
  CLIENT_CONTACT_PROFILE_HINT,
  isClientContactComplete,
  loadClientContact,
} from "@/lib/clientContact";
import { WILDER_COLORS as COLORS } from "@/lib/themes";

const GREEN = "var(--sage)";
const MUTED = "var(--mute)";

function CheckIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 6 9 17l-5-5"
        stroke="currentColor"
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StepStatus({ complete, completeLabel, incompleteLabel = "à compléter" }) {
  if (complete) {
    return (
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          fontSize: 12,
          fontWeight: 700,
          color: GREEN,
        }}
      >
        <CheckIcon />
        {completeLabel}
      </span>
    );
  }
  return (
    <span style={{ fontSize: 12, fontWeight: 700, color: MUTED, textTransform: "lowercase" }}>
      {incompleteLabel}
    </span>
  );
}

function ChevronRight({ color }) {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m9 18 6-6-6-6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="m7 10 5 5 5-5" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 15V3" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconSend() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m22 2-7 20-4-9-9-4Z" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 2 11 13" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RowLink({ labelColor, title, subtitle, bg, chevron, onClick, status }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        borderRadius: 18,
        padding: "12px 16px",
        background: bg,
        display: "flex",
        alignItems: "center",
        gap: 12,
        color: "var(--ink)",
        minHeight: 44,
        border: "none",
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "left",
        width: "100%",
      }}
    >
      <span style={{ display: "flex", flexDirection: "column", flexGrow: 1, minWidth: 0, gap: 4 }}>
        <span style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "1.1px",
              color: labelColor,
            }}
          >
            {title}
          </span>
          {status}
        </span>
        <span style={{ fontSize: 15, fontWeight: 700 }}>{subtitle}</span>
      </span>
      <ChevronRight color={chevron} />
    </button>
  );
}

const MAX_PILLS = 8;

function budgetDisplayLabel(budgetId) {
  if (!budgetId) return "";
  if (budgetId === "unknown") return "Je ne sais pas encore";
  return budgetLabel(budgetId);
}

function terrainSummaryLines(fields) {
  const lines = [];
  if (fields.areaRange) {
    lines.push(`Surface à aménager : ${areaRangeLabel(fields.areaRange)}`);
  }
  if (fields.timeline) {
    lines.push(`Calendrier : ${timelineLabel(fields.timeline)}`);
  }
  if (fields.utilities) {
    lines.push(`Eau / électricité : ${utilitiesLabel(fields.utilities)}`);
  }
  return lines;
}

export default function DossierScreen({
  t,
  refreshTick = 0,
  onOpenCoupsDeCoeur,
  onOpenMot,
  onOpenAmbiance,
  onOpenTerrain,
  onOpenBudget,
  onOpenQuotidien,
  onOpenAEviter,
  onOpenExistant,
  onOpenEntretien,
  onOpenProfile,
}) {
  const [loading, setLoading] = useState(true);
  const [contactComplete, setContactComplete] = useState(false);
  const [coupsItems, setCoupsItems] = useState([]);
  const [intention, setIntention] = useState("");
  const [ambianceName, setAmbianceName] = useState("");
  const [budgetId, setBudgetId] = useState("");
  const [terrainPhotoCount, setTerrainPhotoCount] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const coups = await loadGardenCoupsItems();
      setCoupsItems(coups.items || []);
      setIntention(loadGardenIntention());
      setAmbianceName(loadGardenAmbianceChoice());
      setBudgetId(loadGardenBudgetChoice());
      const photos = await loadGardenTerrainPhotoDataUrls();
      setTerrainPhotoCount(photos.length);
      const contact = await loadClientContact();
      setContactComplete(isClientContactComplete(contact));
    } catch {
      setCoupsItems([]);
      setError("load_failed");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, refreshTick]);

  const localFlags = readGardenDossierLocalFlags();

  const progress = useMemo(
    () =>
      computeGardenDossierProgress({
        gardenItemCount: coupsItems.length,
        paysagisteMessage: intention,
        ambianceComplete: localFlags.ambianceComplete,
        terrainComplete: localFlags.terrainPhotosComplete && localFlags.terrainFieldsComplete,
        budgetComplete: localFlags.budgetComplete,
        details: loadGardenBriefDetails(),
      }),
    [
      coupsItems.length,
      intention,
      localFlags.ambianceComplete,
      localFlags.budgetComplete,
      localFlags.terrainPhotosComplete,
      localFlags.terrainFieldsComplete,
      refreshTick,
    ]
  );

  const stepComplete = useCallback(
    (id) => progress.steps.find((s) => s.id === id)?.complete ?? false,
    [progress.steps]
  );

  const pillNames = useMemo(() => coupsItems.map((item) => item.nom), [coupsItems]);
  const visiblePills = pillNames.slice(0, MAX_PILLS);
  const extraCount = Math.max(0, pillNames.length - MAX_PILLS);

  const canExport = !loading && progress.completedCount >= 1;
  const dossierComplete = !loading && progress.percent >= 100 && contactComplete;
  const pdfPrepareEnabled = canExport && contactComplete;

  const {
    analyzing,
    gardenAnalysis,
    analysisError,
    pdfPreparing,
    pdfReady,
    pdfError,
    shareFromPrepared,
    exportFromPrepared,
  } = useGardenDossierPdfPrepare(pdfPrepareEnabled, refreshTick, dossierComplete);

  const pdfBlocked = contactComplete && (!pdfReady || pdfPreparing || analyzing);

  const pdfBusyLabel = analyzing
    ? "Analyse de votre dossier…"
    : pdfPreparing
      ? "Préparation du PDF…"
      : null;

  const requireContactOr = (action) => {
    if (!canExport) return;
    if (!contactComplete) {
      onOpenProfile?.(CLIENT_CONTACT_PROFILE_HINT);
      return;
    }
    if (pdfBlocked) return;
    action();
  };

  const handleExportPdf = () => {
    requireContactOr(() => {
      setError(null);
      setFeedback(null);
      const result = exportFromPrepared();
      if (!result.ok) {
        if (result.cancelled) return;
        setError(result.error || GARDEN_PDF_USER_ERROR);
        return;
      }
      setFeedback(
        result.method === "open_tab"
          ? "PDF ouvert — vous pouvez l'enregistrer depuis le menu de partage."
          : t("brief.download_success")
      );
    });
  };

  const handleSharePdf = () => {
    requireContactOr(() => {
      setError(null);
      setFeedback(null);
      const result = shareFromPrepared();
      if (!result.ok) {
        if (result.cancelled) return;
        setError(result.error || GARDEN_PDF_USER_ERROR);
        return;
      }
      setFeedback(t("brief.send_success"));
    });
  };

  const motText = (intention || "").trim();
  const coupsComplete = stepComplete("coups-de-coeur");
  const ambianceComplete = stepComplete("ambiance");
  const motComplete = stepComplete("mot-paysagiste");
  const quotidienComplete = stepComplete("quotidien");
  const eviterComplete = stepComplete("a-eviter");
  const terrainComplete = stepComplete("terrain");
  const existantComplete = stepComplete("existant");
  const entretienComplete = stepComplete("entretien");
  const budgetComplete = stepComplete("budget");

  const nextStep = progress.remainingSteps[0];
  const progressTitle =
    progress.percent >= 100 ? "Dossier prêt." : progress.percent >= 60 ? "Presque prêt." : "C'est parti.";
  const progressSub = nextStep
    ? `Il reste ${dossierStepLabel(nextStep.id).toLowerCase()}.`
    : "Vous pouvez l'envoyer.";

  const dossierLines = [
    {
      id: "coups-de-coeur",
      label: "Coups de cœur",
      onOpen: onOpenCoupsDeCoeur,
      hint: coupsComplete ? `${coupsItems.length} ajouté${coupsItems.length > 1 ? "s" : ""}` : null,
    },
    { id: "ambiance", label: "Ambiance", onOpen: onOpenAmbiance, hint: ambianceComplete ? ambianceName : null },
    { id: "mot-paysagiste", label: "Mot au paysagiste", onOpen: onOpenMot, hint: motComplete ? "Renseigné" : null },
    { id: "quotidien", label: "Votre quotidien", onOpen: onOpenQuotidien, hint: quotidienComplete ? "Fait" : null },
    { id: "a-eviter", label: "Ce que vous ne voulez pas", onOpen: onOpenAEviter, hint: eviterComplete ? "Fait" : null },
    {
      id: "terrain",
      label: "Mon terrain",
      onOpen: onOpenTerrain,
      hint: terrainComplete ? `${terrainPhotoCount} photo${terrainPhotoCount > 1 ? "s" : ""}` : null,
    },
    { id: "existant", label: "Ce qui existe déjà", onOpen: onOpenExistant, hint: existantComplete ? "Fait" : null },
    { id: "entretien", label: "Entretien et calendrier", onOpen: onOpenEntretien, hint: entretienComplete ? "Fait" : null },
    { id: "budget", label: "Budget", onOpen: onOpenBudget, hint: budgetComplete ? budgetDisplayLabel(budgetId) : null },
  ];

  const terrainFields = loadGardenTerrainFields();
  const terrainSubtitle = terrainComplete
    ? `${terrainPhotoCount} photo${terrainPhotoCount > 1 ? "s" : ""} · ${areaRangeLabel(terrainFields.areaRange) || "Surface renseignée"}`
    : "Photos et infos pratiques";

  return (
    <div className="atelier-dossier">
      <div className="atelier-dossier__head">
        <span className="atelier-label">Mon dossier</span>
      </div>

      <div className="atelier-dossier__progress">
        <div className="atelier-dossier__ring" aria-hidden="true">
          <span>{loading ? "…" : `${progress.percent}%`}</span>
        </div>
        <div className="atelier-dossier__progress-text">
          <div className="atelier-dossier__progress-title">{loading ? "…" : progressTitle}</div>
          <div className="atelier-dossier__progress-sub">{loading ? "…" : progressSub}</div>
        </div>
      </div>

      {dossierComplete && analysisError ? (
        <div
          role="alert"
          style={{
            borderRadius: 14,
            padding: "12px 14px",
            border: "1px solid var(--clay, #D9A47A)",
            background: "var(--card, #17241C)",
            color: "var(--clay, #D9A47A)",
            fontSize: 14,
            lineHeight: 1.45,
          }}
        >
          {analysisError}
        </div>
      ) : null}

      {dossierComplete && gardenAnalysis?.profil ? (
        <div
          style={{
            borderRadius: 18,
            padding: "14px 16px",
            background: "var(--card)",
            border: "1px solid var(--line)",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "1.1px",
                color: "#7A67A6",
              }}
            >
              VOTRE PROFIL JARDIN
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: MUTED }}>Déduit par Sevya de vos choix</span>
          </div>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: "var(--ink)", fontWeight: 600 }}>
            {gardenAnalysis.profil.style}
          </p>
          {gardenAnalysis.profil.priorites?.length ? (
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.5, color: "var(--ink)" }}>
              {gardenAnalysis.profil.priorites.map((p) => (
                <li key={p} style={{ fontWeight: 700 }}>
                  {p}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="atelier-dossier__lines">
        {dossierLines.map((line, index) => {
          const done = stepComplete(line.id);
          return (
            <button key={line.id} type="button" className="atelier-dossier__line" onClick={line.onOpen}>
              <em>{String(index + 1).padStart(2, "0")}</em>
              <span>{line.label}</span>
              <i className={done ? "done" : "todo"}>{done ? line.hint || "Fait" : "À faire →"}</i>
            </button>
          );
        })}
        <button
          type="button"
          className="atelier-dossier__line"
          onClick={() => onOpenProfile?.("")}
        >
          <em>—</em>
          <span>Mes coordonnées</span>
          <i className={contactComplete ? "done" : "todo"}>
            {contactComplete ? "Fait" : "À faire →"}
          </i>
        </button>
      </div>

      {nextStep ? (
        <button
          type="button"
          className="atelier-btn-fill atelier-dossier__cta"
          onClick={() => dossierLines.find((l) => l.id === nextStep.id)?.onOpen?.()}
        >
          Compléter {dossierStepLabel(nextStep.id).toLowerCase()}
        </button>
      ) : null}

      {!canExport && !loading ? (
        <p style={{ margin: 0, fontSize: 13, color: MUTED, lineHeight: 1.45, textAlign: "center" }}>
          Complétez au moins une étape du dossier pour exporter ou envoyer le PDF.
        </p>
      ) : null}

      {pdfError ? (
        <p style={{ margin: 0, fontSize: 13, color: COLORS.error, lineHeight: 1.45 }}>
          {GARDEN_PDF_USER_ERROR}
        </p>
      ) : null}

      {error ? (
        <p style={{ margin: 0, fontSize: 13, color: COLORS.error, lineHeight: 1.45 }}>
          {error === "load_failed" ? t("brief.load_error") : error}
        </p>
      ) : null}
      {feedback ? (
        <p style={{ margin: 0, fontSize: 13, color: COLORS.greenInk, lineHeight: 1.45 }}>{feedback}</p>
      ) : null}

      <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
        <button
          type="button"
          onClick={handleExportPdf}
          disabled={!canExport || pdfBlocked}
          style={{
            flex: "1 1 0",
            minHeight: 50,
            borderRadius: 16,
            background: "var(--ink)",
            color: "var(--bg)",
            border: "none",
            fontSize: 15,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            cursor: !canExport || pdfBlocked ? "default" : "pointer",
            fontFamily: "inherit",
            opacity: !canExport || pdfBlocked ? 0.55 : 1,
          }}
        >
          <IconDownload />
          {contactComplete && pdfBusyLabel ? pdfBusyLabel : "Exporter en PDF"}
        </button>
        <button
          type="button"
          onClick={handleSharePdf}
          disabled={!canExport || pdfBlocked}
          style={{
            flex: "1 1 0",
            minHeight: 50,
            borderRadius: 16,
            border: `1.5px solid ${GREEN}`,
            color: GREEN,
            background: "var(--card)",
            fontSize: 15,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            cursor: !canExport || pdfBlocked ? "default" : "pointer",
            fontFamily: "inherit",
            opacity: !canExport || pdfBlocked ? 0.55 : 1,
          }}
        >
          <IconSend />
          {contactComplete && pdfBusyLabel ? pdfBusyLabel : "Envoyer"}
        </button>
      </div>
    </div>
  );
}
