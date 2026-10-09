/**
 * Mon dossier jardin — maquette sevya/4-dossier.html
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { deriveTasteChipKeys, tasteChipsToLabels } from "@/lib/briefTaste";
import {
  createBriefPdfBlob,
  downloadBriefPdfBlob,
  shareBriefPdf,
} from "@/lib/briefPdf";
import { computeGardenDossierProgress } from "@/lib/gardenDossierProgress";
import { loadGardenIntention } from "@/lib/gardenIntention";
import { loadGardenCoupsItems } from "@/lib/gardenCoupsItems";
import { loadGardenBriefData } from "@/lib/loadGardenBriefData";
import { WILDER_COLORS as COLORS } from "@/lib/themes";

const GREEN = "#2F5E3F";
const MUTED = "#5B6359";

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

function RowLink({ labelColor, title, subtitle, bg, chevron, onClick }) {
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
        color: "#1F2A22",
        minHeight: 44,
        border: "none",
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "left",
        width: "100%",
      }}
    >
      <span style={{ display: "flex", flexDirection: "column", flexGrow: 1, minWidth: 0 }}>
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
        <span style={{ fontSize: 15, fontWeight: 700 }}>{subtitle}</span>
      </span>
      <ChevronRight color={chevron} />
    </button>
  );
}

const MAX_PILLS = 8;

export default function DossierScreen({
  t,
  refreshTick = 0,
  onOpenCoupsDeCoeur,
  onOpenMot,
  onOpenIdees,
  onOpenAddSheet,
}) {
  const [loading, setLoading] = useState(true);
  const [budgetNotice, setBudgetNotice] = useState(null);
  const [coupsItems, setCoupsItems] = useState([]);
  const [briefItems, setBriefItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [heartCount, setHeartCount] = useState(0);
  const [intention, setIntention] = useState("");
  const [pdfBusy, setPdfBusy] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [coups, brief] = await Promise.all([loadGardenCoupsItems(), loadGardenBriefData()]);
      setCoupsItems(coups.items || []);
      setBriefItems(brief.items || []);
      setTotalCount(brief.totalCount || 0);
      setHeartCount(brief.heartCount || 0);
      setIntention(loadGardenIntention());
    } catch {
      setCoupsItems([]);
      setBriefItems([]);
      setTotalCount(0);
      setHeartCount(0);
      setError("load_failed");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, refreshTick]);

  const progress = useMemo(
    () =>
      computeGardenDossierProgress({
        gardenItemCount: coupsItems.length,
        paysagisteMessage: intention,
      }),
    [coupsItems.length, intention]
  );

  const stepComplete = useCallback(
    (id) => progress.steps.find((s) => s.id === id)?.complete ?? false,
    [progress.steps]
  );

  const pillNames = useMemo(() => coupsItems.map((item) => item.nom), [coupsItems]);
  const visiblePills = pillNames.slice(0, MAX_PILLS);
  const extraCount = Math.max(0, pillNames.length - MAX_PILLS);

  const tasteChipKeys = useMemo(() => deriveTasteChipKeys(briefItems), [briefItems]);
  const tasteLabels = useMemo(() => tasteChipsToLabels(tasteChipKeys, t), [tasteChipKeys, t]);

  const pdfParams = useMemo(
    () => ({
      tasteLabels,
      intention,
      items: briefItems,
      totalCount,
      heartCount,
      t,
    }),
    [tasteLabels, intention, briefItems, totalCount, heartCount, t]
  );

  const hasCoups = coupsItems.length > 0;
  const canExport = hasCoups && !loading;

  const handleExportPdf = async () => {
    if (!canExport || pdfBusy) return;
    setPdfBusy(true);
    setError(null);
    setFeedback(null);
    try {
      const created = await createBriefPdfBlob(pdfParams);
      if (!created.ok) {
        setError(t("brief.send_error"));
        return;
      }
      await downloadBriefPdfBlob(created.blob, created.filename);
      setFeedback(t("brief.download_success"));
    } catch {
      setError(t("brief.send_error"));
    } finally {
      setPdfBusy(false);
    }
  };

  const handleSharePdf = async () => {
    if (!canExport || shareBusy) return;
    setShareBusy(true);
    setError(null);
    setFeedback(null);
    try {
      const result = await shareBriefPdf(pdfParams);
      if (!result.ok) {
        if (result.cancelled) return;
        setError(t("brief.send_error"));
        return;
      }
      setFeedback(t("brief.send_success"));
    } catch {
      setError(t("brief.send_error"));
    } finally {
      setShareBusy(false);
    }
  };

  const motText = (intention || "").trim();
  const coupsComplete = stepComplete("coups-de-coeur");
  const motComplete = stepComplete("mot-paysagiste");

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
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "#1F2A22" }}>Mon dossier jardin</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              flexGrow: 1,
              height: 8,
              borderRadius: 999,
              background: "#E6F0E3",
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

      <button
        type="button"
        onClick={onOpenCoupsDeCoeur}
        style={{
          borderRadius: 18,
          padding: "14px 16px",
          border: "1.5px solid #EEE9E0",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          background: "#FFFFFF",
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
                  background: "#E6F0E3",
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
                  background: "#E6F0E3",
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

      <button
        type="button"
        onClick={onOpenMot}
        style={{
          borderRadius: 18,
          padding: "14px 16px",
          border: "1.5px solid #EEE9E0",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          background: "#FFFFFF",
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
            MON MOT POUR LE PAYSAGISTE
          </span>
          <StepStatus complete={motComplete} completeLabel="Fait" />
        </div>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.4, color: "#3B4339" }}>
          {motText ? `« ${motText} »` : "À écrire"}
        </p>
      </button>

      <RowLink
        title="MON AMBIANCE"
        labelColor="#5E4C8C"
        subtitle="À choisir"
        bg="#ECE6F5"
        chevron="#6A5896"
        onClick={onOpenIdees}
      />

      <RowLink
        title="MON TERRAIN"
        labelColor="#8A4A22"
        subtitle="Ajouter 3 photos"
        bg="#F6E7D8"
        chevron="#C0652E"
        onClick={onOpenAddSheet}
      />

      <RowLink
        title="MON BUDGET"
        labelColor="#4D554B"
        subtitle="À indiquer"
        bg="#F2EEE7"
        chevron="#6B7268"
        onClick={() => setBudgetNotice("Bientôt disponible")}
      />

      {budgetNotice ? (
        <p style={{ margin: 0, fontSize: 13, color: MUTED, lineHeight: 1.45, textAlign: "center" }}>
          {budgetNotice}
        </p>
      ) : null}

      {!hasCoups && !loading ? (
        <p style={{ margin: 0, fontSize: 13, color: MUTED, lineHeight: 1.45, textAlign: "center" }}>
          Ajoutez au moins un coup de cœur pour créer votre dossier.
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
          disabled={!canExport || pdfBusy || shareBusy}
          style={{
            flex: "1 1 0",
            minHeight: 50,
            borderRadius: 16,
            background: GREEN,
            color: "#FFFFFF",
            border: "none",
            fontSize: 15,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            cursor: !canExport || pdfBusy ? "default" : "pointer",
            fontFamily: "inherit",
            opacity: !canExport || pdfBusy ? 0.55 : 1,
          }}
        >
          <IconDownload />
          Exporter en PDF
        </button>
        <button
          type="button"
          onClick={handleSharePdf}
          disabled={!canExport || pdfBusy || shareBusy}
          style={{
            flex: "1 1 0",
            minHeight: 50,
            borderRadius: 16,
            border: `1.5px solid ${GREEN}`,
            color: GREEN,
            background: "#FFFFFF",
            fontSize: 15,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            cursor: !canExport || shareBusy ? "default" : "pointer",
            fontFamily: "inherit",
            opacity: !canExport || shareBusy ? 0.55 : 1,
          }}
        >
          <IconSend />
          Envoyer
        </button>
      </div>
    </div>
  );
}
