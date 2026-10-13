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

  const terrainFields = loadGardenTerrainFields();
  const terrainSubtitle = terrainComplete
    ? `${terrainPhotoCount} photo${terrainPhotoCount > 1 ? "s" : ""} · ${areaRangeLabel(terrainFields.areaRange) || "Surface renseignée"}`
    : "Photos et infos pratiques";

  return (
    <div
      style={{
        flex: 1,
        overflow: "auto",
        padding: "18px 18px 8px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "var(--ink)" }}>Mon dossier jardin</h1>
        <p style={{ margin: 0, fontSize: 14, color: MUTED }}>
          {loading
            ? "…"
            : `${progress.completedCount} étape${progress.completedCount > 1 ? "s" : ""} sur ${progress.totalSteps}`}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              flexGrow: 1,
              height: 8,
              borderRadius: 999,
              background: "rgba(201, 214, 184, 0.18)",
            }}
            role="progressbar"
            aria-valuenow={progress.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progression du dossier"
          >
            <div
              style={{
                width: loading ? "0%" : `${progress.percent}%`,
                height: 8,
                borderRadius: 999,
                background: GREEN,
                transition: "width 0.25s ease",
              }}
            />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: GREEN, flexShrink: 0 }}>
            {loading ? "…" : `${progress.percent} %`}
          </span>
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
            background: "#ECE6F5",
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

      <button
        type="button"
        onClick={onOpenCoupsDeCoeur}
        style={{
          borderRadius: 18,
          padding: "14px 16px",
          border: "1.5px solid var(--line)",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          background: "var(--card)",
          cursor: "pointer",
          fontFamily: "inherit",
          textAlign: "left",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "1.1px",
              color: MUTED,
            }}
          >
            MES COUPS DE CŒUR
          </span>
          <StepStatus
            complete={coupsComplete}
            completeLabel={`${coupsItems.length} ajouté${coupsItems.length > 1 ? "s" : ""}`}
          />
        </div>
        {visiblePills.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {visiblePills.map((name, index) => (
              <span
                key={`${name}-${index}`}
                style={{
                  padding: "5px 11px",
                  borderRadius: 999,
                  background: "rgba(201, 214, 184, 0.18)",
                  color: GREEN,
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {name}
              </span>
            ))}
            {extraCount > 0 ? (
              <span
                style={{
                  padding: "5px 11px",
                  borderRadius: 999,
                  background: "rgba(201, 214, 184, 0.18)",
                  color: GREEN,
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                +{extraCount}
              </span>
            ) : null}
          </div>
        ) : null}
      </button>

      <RowLink
        title="MON AMBIANCE"
        labelColor="#5E4C8C"
        subtitle={ambianceName || "À choisir"}
        bg="#ECE6F5"
        chevron="#6A5896"
        onClick={onOpenAmbiance}
        status={
          <StepStatus complete={ambianceComplete} completeLabel="Fait" incompleteLabel="à choisir" />
        }
      />

      <button
        type="button"
        onClick={onOpenMot}
        style={{
          borderRadius: 18,
          padding: "14px 16px",
          border: "1.5px solid var(--line)",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          background: "var(--card)",
          cursor: "pointer",
          fontFamily: "inherit",
          textAlign: "left",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "1.1px",
              color: MUTED,
            }}
          >
            MOT AU PAYSAGISTE
          </span>
          <StepStatus complete={motComplete} completeLabel="Fait" />
        </div>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.4, color: "#3B4339" }}>
          {motText ? `« ${motText} »` : "À écrire"}
        </p>
      </button>

      <RowLink
        title="VOTRE QUOTIDIEN"
        labelColor="var(--mute)"
        subtitle={quotidienComplete ? "Renseigné" : dossierStepLabel("quotidien")}
        bg="var(--card)"
        chevron="#6B7268"
        onClick={onOpenQuotidien}
        status={<StepStatus complete={quotidienComplete} completeLabel="Fait" />}
      />

      <RowLink
        title="CE QUE VOUS NE VOULEZ PAS"
        labelColor="var(--mute)"
        subtitle={eviterComplete ? "Renseigné" : "Plusieurs choix possibles"}
        bg="var(--card)"
        chevron="#6B7268"
        onClick={onOpenAEviter}
        status={<StepStatus complete={eviterComplete} completeLabel="Fait" />}
      />

      <RowLink
        title="MON TERRAIN"
        labelColor="#8A4A22"
        subtitle={terrainSubtitle}
        bg="#F6E7D8"
        chevron="#C0652E"
        onClick={onOpenTerrain}
        status={<StepStatus complete={terrainComplete} completeLabel="Fait" />}
      />

      <RowLink
        title="CE QUI EXISTE DÉJÀ"
        labelColor="var(--mute)"
        subtitle={existantComplete ? "Renseigné" : "Orientation, sol…"}
        bg="var(--card)"
        chevron="#6B7268"
        onClick={onOpenExistant}
        status={<StepStatus complete={existantComplete} completeLabel="Fait" />}
      />

      <RowLink
        title="ENTRETIEN ET CALENDRIER"
        labelColor="var(--mute)"
        subtitle={entretienComplete ? "Renseigné" : "Temps, calendrier, RDV"}
        bg="var(--card)"
        chevron="#6B7268"
        onClick={onOpenEntretien}
        status={<StepStatus complete={entretienComplete} completeLabel="Fait" />}
      />

      <RowLink
        title="MON BUDGET"
        labelColor="var(--mute)"
        subtitle={budgetDisplayLabel(budgetId) || "À indiquer"}
        bg="var(--card)"
        chevron="#6B7268"
        onClick={onOpenBudget}
        status={<StepStatus complete={budgetComplete} completeLabel="Fait" />}
      />

      <RowLink
        title="MES COORDONNÉES"
        labelColor={MUTED}
        subtitle={contactComplete ? "Profil à jour" : "À compléter"}
        bg="var(--card)"
        chevron="#6B7268"
        onClick={() => onOpenProfile?.("")}
        status={
          <StepStatus
            complete={contactComplete}
            completeLabel="Fait"
            incompleteLabel="À compléter"
          />
        }
      />

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
