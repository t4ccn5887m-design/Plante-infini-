/**
 * Aperçu du brief — livrable paysagiste (auto-généré depuis Mon projet jardin).
 * Maquette : wilder_ecran_brief.html
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { deriveTasteChipKeys, tasteChipsToLabels } from "@/lib/briefTaste";
import {
  buildBriefMailtoUrl,
  buildBriefSummaryText,
  canSharePalettePdf,
  createBriefPdfBlob,
  downloadBriefPdfBlob,
  shareBriefPdf,
} from "@/lib/briefPdf";
import { loadGardenIntention } from "@/lib/gardenIntention";
import { loadGardenBriefData } from "@/lib/loadGardenBriefData";

const COLORS = {
  ink: "#1e2b23",
  secondary: "#4c554a",
  muted: "#8b9084",
  border: "#e6e2d8",
  borderStrong: "#d2cdc1",
  greenTint: "#e7efe6",
  greenInk: "#3c6b47",
  purpleTint: "#efedfb",
  purpleInk: "#6a58a2",
  heart: "#c6504c",
  note: "#f4f2ea",
  primary: "#2f5a3c",
  screen: "#ffffff",
  stoneTint: "#eae6de",
  stoneInk: "#6b6455",
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

function IconBulb() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
      <path d="M9 18h6" />
      <path d="M10 21h4" />
      <path d="M12 3a6 6 0 0 0-4 10.5c.6.6 1 1.4 1 2.5h6c0-1.1.4-1.9 1-2.5A6 6 0 0 0 12 3z" />
    </svg>
  );
}

function IconLeaf({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6" />
    </svg>
  );
}

function IconStone({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
      <polygon points="6 3 18 3 21 9 12 21 3 9" />
      <line x1="3" y1="9" x2="21" y2="9" />
    </svg>
  );
}

function IconHeart() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" style={{ fill: "currentColor", stroke: "none" }} aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function IconSend() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function IconCopy() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function BriefVignette({ item }) {
  const isMineral = item.kind === "mineral";
  const tint = isMineral ? COLORS.stoneTint : COLORS.greenTint;
  const ink = isMineral ? COLORS.stoneInk : COLORS.greenInk;

  return (
    <div
      style={{
        border: `0.5px solid ${COLORS.border}`,
        borderRadius: 13,
        overflow: "hidden",
        background: "#fff",
      }}
    >
      <div
        style={{
          height: 72,
          background: tint,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: ink,
          position: "relative",
        }}
      >
        {item.photo ? (
          <img
            src={item.photo}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : isMineral ? (
          <IconStone size={24} />
        ) : (
          <IconLeaf size={24} />
        )}
        {item.favori && (
          <span
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: COLORS.heart,
            }}
            aria-label="Prioritaire"
          >
            <IconHeart />
          </span>
        )}
      </div>
      <div style={{ padding: "8px 9px 10px" }}>
        <div
          style={{
            fontSize: 12.5,
            fontWeight: 600,
            color: COLORS.ink,
            lineHeight: 1.25,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.nom}
        </div>
        {item.subtitle && (
          <div
            style={{
              fontSize: 10.5,
              color: COLORS.muted,
              marginTop: 2,
              lineHeight: 1.35,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {item.subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ApercuBriefScreen({ t, onBack }) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [heartCount, setHeartCount] = useState(0);
  const [intention, setIntention] = useState("");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);

  const shareAvailable = useMemo(() => canSharePalettePdf(), []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await loadGardenBriefData();
      setItems(result.items || []);
      setTotalCount(result.totalCount || 0);
      setHeartCount(result.heartCount || 0);
      setIntention(loadGardenIntention());
    } catch {
      setItems([]);
      setTotalCount(0);
      setHeartCount(0);
      setError("load_failed");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const tasteChipKeys = useMemo(() => deriveTasteChipKeys(items), [items]);
  const tasteLabels = useMemo(() => tasteChipsToLabels(tasteChipKeys, t), [tasteChipKeys, t]);

  const pdfParams = useMemo(
    () => ({
      tasteLabels,
      intention,
      items,
      totalCount,
      heartCount,
      t,
    }),
    [tasteLabels, intention, items, totalCount, heartCount, t]
  );

  const summaryText = useMemo(
    () => buildBriefSummaryText(pdfParams),
    [pdfParams]
  );

  const handleSendBrief = async () => {
    if (sending || totalCount === 0) return;
    setSending(true);
    setError(null);
    setFeedback(null);

    try {
      if (shareAvailable) {
        const result = await shareBriefPdf(pdfParams);
        if (!result.ok) {
          if (result.cancelled) return;
          setError(t("brief.send_error"));
          return;
        }
        setFeedback(t("brief.send_success"));
        return;
      }

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
      setSending(false);
    }
  };

  const handleMail = () => {
    window.location.href = buildBriefMailtoUrl(summaryText);
  };

  const handleCopySummary = async () => {
    setError(null);
    try {
      await navigator.clipboard.writeText(summaryText);
      setFeedback(t("brief.copy_success"));
    } catch {
      setError(t("brief.copy_error"));
    }
  };

  const isEmpty = !loading && totalCount === 0;

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
          <span style={{ fontSize: 14, color: COLORS.muted }}>{t("brief.crumb")}</span>
        </div>

        <div style={{ padding: "2px 16px 14px" }}>
          <h1 style={{ margin: 0, fontSize: 21, fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.15 }}>
            {t("brief.title")}
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: COLORS.muted, lineHeight: 1.5 }}>
            {loading
              ? "…"
              : t("brief.summary", { count: totalCount, hearts: heartCount })}
          </p>
        </div>

        {isEmpty ? (
          <div style={{ padding: "8px 16px 24px" }}>
            <p style={{ margin: 0, fontSize: 13, color: COLORS.muted, lineHeight: 1.5 }}>
              {t("brief.empty_garden")}
            </p>
          </div>
        ) : (
          <>
            <div
              style={{
                margin: "0 16px 16px",
                background: COLORS.purpleTint,
                borderRadius: 13,
                padding: "14px 15px",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: COLORS.purpleInk,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <IconBulb /> {t("brief.taste_title")}
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  marginTop: 11,
                }}
              >
                {tasteLabels.map((label) => (
                  <span
                    key={label}
                    style={{
                      background: "#fff",
                      color: COLORS.purpleInk,
                      fontSize: 11,
                      fontWeight: 500,
                      padding: "5px 10px",
                      borderRadius: 20,
                    }}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div
              style={{
                margin: "0 16px 16px",
                borderRadius: 13,
                background: COLORS.note,
                padding: "13px 14px",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.ink, marginBottom: 6 }}>
                {t("brief.intention_title")}
              </div>
              <p style={{ margin: 0, fontSize: 12, color: COLORS.secondary, lineHeight: 1.55 }}>
                {(intention || "").trim() ? intention : t("brief.intention_empty")}
              </p>
            </div>

            <div
              style={{
                padding: "0 16px 8px",
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 10,
              }}
            >
              {items.map((item) => (
                <BriefVignette key={item.id} item={item} />
              ))}
            </div>
          </>
        )}

        {(error || feedback) && (
          <div style={{ padding: "8px 16px 0" }}>
            {error && (
              <p style={{ margin: 0, fontSize: 12, color: "#9b3b3b", lineHeight: 1.45 }}>
                {error === "load_failed" ? t("brief.load_error") : error}
              </p>
            )}
            {!error && feedback && (
              <p style={{ margin: 0, fontSize: 12, color: COLORS.greenInk, lineHeight: 1.45 }}>{feedback}</p>
            )}
          </div>
        )}

        <div style={{ borderTop: `0.5px solid ${COLORS.border}`, padding: "15px 16px 20px" }}>
          <button
            type="button"
            onClick={handleSendBrief}
            disabled={sending || loading || isEmpty}
            style={{
              width: "100%",
              height: 48,
              background: COLORS.primary,
              color: "#fff",
              border: "none",
              borderRadius: 13,
              fontSize: 15,
              fontWeight: 600,
              cursor: sending || loading || isEmpty ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontFamily: "inherit",
              opacity: sending || loading || isEmpty ? 0.65 : 1,
            }}
          >
            <IconSend /> {t("brief.send_button")}
          </button>

          {!shareAvailable && !isEmpty && (
            <>
              <button
                type="button"
                onClick={handleMail}
                disabled={loading}
                style={{
                  width: "100%",
                  height: 44,
                  marginTop: 9,
                  background: "transparent",
                  border: `0.5px solid ${COLORS.borderStrong}`,
                  borderRadius: 13,
                  fontSize: 14,
                  fontWeight: 500,
                  color: COLORS.ink,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  fontFamily: "inherit",
                }}
              >
                <IconMail /> {t("brief.mail_button")}
              </button>
              <button
                type="button"
                onClick={handleCopySummary}
                disabled={loading}
                style={{
                  width: "100%",
                  height: 44,
                  marginTop: 9,
                  background: "transparent",
                  border: `0.5px solid ${COLORS.borderStrong}`,
                  borderRadius: 13,
                  fontSize: 14,
                  fontWeight: 500,
                  color: COLORS.ink,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  fontFamily: "inherit",
                }}
              >
                <IconCopy /> {t("brief.copy_button")}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
