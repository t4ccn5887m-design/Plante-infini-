/**
 * Résultat de scan — écran post-scan (Option 3).
 * Maquette cible : wilder_ecran_resultat_scan.html (style MonJardin / MesScans).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { getPaysagisteSpecs, PAYSAGISTE_SPEC_KEYS } from "@/lib/paysagisteSpecs";
import {
  demoteScanFromGarden,
  loadScanGardenState,
  promoteScanToGarden,
} from "@/lib/promoteScanToGarden";
import { WILDER_COLORS as COLORS } from "@/lib/themes";

const icStroke = {
  stroke: "currentColor",
  strokeWidth: 2,
  fill: "none",
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const screenWrap = {
  minHeight: "100vh",
  background: COLORS.shellBg,
  display: "flex",
  justifyContent: "center",
  padding: "16px",
  color: COLORS.ink,
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
    <svg width="18" height="18" viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function IconHeart({ filled }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      style={filled ? { fill: "currentColor", stroke: "none" } : icStroke}
      aria-hidden="true"
    >
      {filled ? (
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
      ) : (
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
      )}
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function SpecCard({ label, value, accent }) {
  const isPlaceholder = value === "—";
  return (
    <div
      style={{
        border: `0.5px solid ${COLORS.border}`,
        borderRadius: 12,
        padding: "10px 11px",
        background: accent ? COLORS.purpleTint : "#fff",
        minHeight: 62,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: accent ? COLORS.purpleInk : COLORS.muted,
          marginBottom: 5,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 13,
          fontWeight: isPlaceholder ? 400 : 600,
          color: isPlaceholder ? COLORS.muted : COLORS.ink,
          lineHeight: 1.35,
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default function ResultatScanScreen({
  t,
  discovery,
  photoSrc,
  canAddToGarden = true,
  onBack,
  onScanAgain,
  onShare,
  onDiscoveryUpdate,
  onGardenChange,
  onRequireAccount,
}) {
  const [inGarden, setInGarden] = useState(false);
  const [itemIdsByDiscovery, setItemIdsByDiscovery] = useState(() => new Map());
  const [gardenLoading, setGardenLoading] = useState(true);
  const [gardenToggling, setGardenToggling] = useState(false);
  const [favoriToggling, setFavoriToggling] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState(null);

  const specs = useMemo(() => getPaysagisteSpecs(discovery), [discovery]);
  const favori = Boolean(discovery?.favori);

  const refreshGarden = useCallback(async () => {
    setGardenLoading(true);
    const state = await loadScanGardenState();
    setInGarden(state.inGarden.has(discovery?.id));
    setItemIdsByDiscovery(state.itemIdsByDiscovery);
    setGardenLoading(false);
  }, [discovery?.id]);

  useEffect(() => {
    refreshGarden();
  }, [refreshGarden]);

  const handleToggleFavori = async () => {
    if (!discovery?.id || favoriToggling || !onDiscoveryUpdate) return;
    setFavoriToggling(true);
    setError(null);
    try {
      const next = { ...discovery, favori: !favori };
      const result = await onDiscoveryUpdate(next);
      if (!result?.ok) setError(result?.error || "unknown");
    } finally {
      setFavoriToggling(false);
    }
  };

  const handleToggleGarden = async () => {
    if (!discovery?.id || gardenToggling) return;
    setError(null);

    if (!inGarden && !canAddToGarden) {
      onRequireAccount?.(() => promoteScanToGarden(discovery, t));
      return;
    }

    setGardenToggling(true);
    try {
      if (inGarden) {
        const result = await demoteScanFromGarden(discovery.id, itemIdsByDiscovery);
        if (!result.ok) {
          setError(result.error || "unknown");
        } else {
          await refreshGarden();
          onGardenChange?.();
        }
      } else {
        const result = await promoteScanToGarden(discovery, t);
        if (!result.ok) {
          setError(result.error || "unknown");
        } else {
          await refreshGarden();
          onGardenChange?.();
        }
      }
    } finally {
      setGardenToggling(false);
    }
  };

  const handleShare = async () => {
    if (!onShare || sharing) return;
    setSharing(true);
    try {
      await onShare();
    } catch {
      /* annulé */
    } finally {
      setSharing(false);
    }
  };

  if (!discovery) return null;

  return (
    <div style={screenWrap} className="wilder-v2-shell screen-enter-fast">
      <div className="wilder-v2-card" style={cardWrap}>
        <div style={{ position: "relative", background: COLORS.greenTint }}>
          {photoSrc ? (
            <img
              src={photoSrc}
              alt={discovery.nom}
              style={{ width: "100%", height: 220, objectFit: "cover", display: "block" }}
            />
          ) : (
            <div style={{ width: "100%", height: 220, background: COLORS.greenTint }} />
          )}

          <button
            type="button"
            onClick={onBack}
            aria-label={t("discovery.back")}
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              width: 36,
              height: 36,
              border: "none",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.92)",
              color: COLORS.ink,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            <IconBack />
          </button>

          <span
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              padding: "5px 10px",
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 600,
              background: COLORS.greenTint,
              color: COLORS.greenInk,
              border: `0.5px solid ${COLORS.border}`,
            }}
          >
            {t("resultat_scan.identified_badge")}
          </span>
        </div>

        <div style={{ padding: "16px 16px 20px" }}>
          <h1
            className="wilder-v2-title-page"
            style={{
              margin: 0,
              fontSize: 22,
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
              color: COLORS.ink,
            }}
          >
            {discovery.nom}
          </h1>
          {discovery.nom_latin && (
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 13,
                fontStyle: "italic",
                color: COLORS.muted,
              }}
            >
              {discovery.nom_latin}
            </p>
          )}

          <div
            style={{
              marginTop: 14,
              padding: "10px 12px",
              borderRadius: 12,
              background: COLORS.saved,
              border: `0.5px solid ${COLORS.border}`,
              fontSize: 12.5,
              lineHeight: 1.45,
              color: COLORS.greenInk,
            }}
          >
            {t("resultat_scan.saved_line")}
          </div>

          <div style={{ marginTop: 20 }}>
            <h2
              className="wilder-v2-title-section"
              style={{
                margin: "0 0 10px",
                fontSize: 14,
                color: COLORS.ink,
              }}
            >
              {t("resultat_scan.paysagiste_section")}
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
              }}
            >
              {PAYSAGISTE_SPEC_KEYS.map((key) => (
                <SpecCard
                  key={key}
                  label={t(`resultat_scan.spec_${key}`)}
                  value={specs[key]}
                  accent={key === "floraison"}
                />
              ))}
            </div>
          </div>

          {error && (
            error === t("mes_scans.garden_gate") ? (
              <button
                type="button"
                className="wilder-garden-gate-btn"
                style={{ margin: "14px 0 0", fontSize: 12, color: COLORS.heart, lineHeight: 1.4 }}
                onClick={() => onRequireAccount?.(() => promoteScanToGarden(discovery, t))}
              >
                {error}
              </button>
            ) : (
              <p style={{ margin: "14px 0 0", fontSize: 12, color: COLORS.heart, lineHeight: 1.4 }}>
                {error}
              </p>
            )
          )}

          <div
            style={{
              marginTop: 20,
              display: "flex",
              gap: 10,
              alignItems: "stretch",
            }}
          >
            <button
              type="button"
              onClick={handleToggleFavori}
              disabled={favoriToggling}
              aria-label={t("resultat_scan.heart_aria")}
              aria-pressed={favori}
              style={{
                flex: "none",
                width: 52,
                height: 48,
                borderRadius: 14,
                border: `0.5px solid ${favori ? COLORS.heart : COLORS.borderStrong}`,
                background: favori ? "#fdf0ef" : "#fff",
                color: favori ? COLORS.heart : COLORS.heartOff,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: favoriToggling ? "wait" : "pointer",
                opacity: favoriToggling ? 0.65 : 1,
              }}
            >
              <IconHeart filled={favori} />
            </button>

            <button
              type="button"
              onClick={handleToggleGarden}
              disabled={gardenToggling || gardenLoading}
              style={{
                flex: 1,
                height: 48,
                borderRadius: 14,
                border: inGarden ? "none" : "none",
                background: inGarden ? COLORS.greenTint : COLORS.primary,
                color: inGarden ? COLORS.greenInk : "#fff",
                fontSize: 14,
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                cursor: gardenToggling || gardenLoading ? "wait" : "pointer",
                opacity: gardenToggling || gardenLoading ? 0.7 : 1,
                fontFamily: "inherit",
              }}
            >
              {inGarden ? (
                <>
                  <IconCheck /> {t("resultat_scan.in_garden")}
                </>
              ) : (
                <>
                  <IconPlus /> {t("resultat_scan.add_to_garden")}
                </>
              )}
            </button>
          </div>

          <div
            style={{
              marginTop: 16,
              display: "flex",
              justifyContent: "center",
              gap: 20,
            }}
          >
            <button
              type="button"
              onClick={onScanAgain}
              style={{
                border: "none",
                background: "transparent",
                color: COLORS.muted,
                fontSize: 12.5,
                fontWeight: 500,
                cursor: "pointer",
                padding: "4px 0",
                fontFamily: "inherit",
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              {t("discovery.scan_again")}
            </button>
            {onShare && (
              <button
                type="button"
                onClick={handleShare}
                disabled={sharing}
                style={{
                  border: "none",
                  background: "transparent",
                  color: COLORS.muted,
                  fontSize: 12.5,
                  fontWeight: 500,
                  cursor: sharing ? "wait" : "pointer",
                  padding: "4px 0",
                  fontFamily: "inherit",
                  textDecoration: "underline",
                  textUnderlineOffset: 3,
                  opacity: sharing ? 0.6 : 1,
                }}
              >
                {sharing ? t("discovery.share_generating") : t("discovery.share")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
