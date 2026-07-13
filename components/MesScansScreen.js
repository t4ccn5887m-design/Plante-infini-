/**
 * Mes scans — dictionnaire de tout ce qui est scanné.
 * Maquette : wilder/wilder_ecran_mes_scans.html
 * Promotion vers Mon jardin via Ma Palette (palette_items), sans affichage par zone.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  demoteScanFromGarden,
  loadScanGardenState,
  promoteScanToGarden,
} from "@/lib/promoteScanToGarden";
import { getDiscoveryPhotoUrl } from "@/lib/discoveryPhoto";
import { loadDiscoveries } from "@/lib/discoveriesStorage";
import { WILDER_COLORS as COLORS } from "@/lib/themes";

const icStroke = {
  stroke: "currentColor",
  strokeWidth: 2,
  fill: "none",
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

function IconGrid() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
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

function IconCamera() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

/** Sous-titre ligne : déduit exposition / trait depuis les champs existants du scan. */
export function formatScanCharacteristics(discovery) {
  const corpus = [discovery?.habitat, discovery?.guide_entretien, discovery?.description]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const parts = [];

  if (/plein soleil|ensoleill/.test(corpus)) parts.push("Plein soleil");
  else if (/mi-ombre/.test(corpus)) parts.push("Mi-ombre");
  else if (/\bombre\b/.test(corpus)) parts.push("Ombre");
  else if (/soleil/.test(corpus)) parts.push("Soleil");

  if (/floraison violette|fleur violette|violette/.test(corpus)) parts.push("floraison violette");
  else if (/floraison|fleurit|fleurs/.test(corpus)) parts.push("floraison");
  else if (/persistant|feuillage persistant/.test(corpus)) parts.push("persistant");
  else if (/grimpant/.test(corpus)) parts.push("grimpant");
  else if (discovery?.famille) parts.push(discovery.famille);

  if (parts.length > 0) return parts.slice(0, 2).join(" · ");
  if (discovery?.nom_latin) return discovery.nom_latin;
  return "Plante scannée";
}

function ScanRow({ discovery, inGarden, toggling, onToggle }) {
  const photo = getDiscoveryPhotoUrl(discovery);
  const subtitle = formatScanCharacteristics(discovery);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 11,
        border: `0.5px solid ${COLORS.border}`,
        borderRadius: 13,
        padding: "8px 10px 8px 8px",
        background: "#fff",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: COLORS.greenTint,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "none",
          color: COLORS.greenInk,
          overflow: "hidden",
        }}
      >
        {photo ? (
          <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <IconLeaf />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 600,
            color: COLORS.ink,
            lineHeight: 1.25,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {discovery.nom}
        </div>
        <div
          style={{
            fontSize: 11,
            color: COLORS.muted,
            marginTop: 2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {subtitle}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onToggle(discovery)}
        disabled={toggling}
        style={{
          flex: "none",
          height: 33,
          padding: "0 12px",
          borderRadius: 20,
          fontSize: 11,
          fontWeight: 600,
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          cursor: toggling ? "wait" : "pointer",
          fontFamily: "inherit",
          border: inGarden ? "none" : `0.5px solid ${COLORS.borderStrong}`,
          background: inGarden ? COLORS.greenTint : "#fff",
          color: inGarden ? COLORS.greenInk : COLORS.ink,
          opacity: toggling ? 0.65 : 1,
        }}
      >
        {inGarden ? (
          <>
            <IconCheck /> Mon jardin
          </>
        ) : (
          <>
            <IconPlus /> Mon jardin
          </>
        )}
      </button>
    </div>
  );
}

export default function MesScansScreen({
  t,
  discoveries: discoveriesProp = [],
  canAddToGarden = true,
  onScan,
}) {
  const [scans, setScans] = useState(discoveriesProp);
  const [inGarden, setInGarden] = useState(() => new Set());
  const [itemIdsByDiscovery, setItemIdsByDiscovery] = useState(() => new Map());
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    const local = loadDiscoveries();
    const merged =
      local.length >= discoveriesProp.length ? local : discoveriesProp.length ? discoveriesProp : local;
    setScans(merged);

    try {
      const garden = await loadScanGardenState();
      setInGarden(garden.inGarden);
      setItemIdsByDiscovery(garden.itemIdsByDiscovery);
    } catch (e) {
      setError(e?.message || "unknown");
    }

    setLoading(false);
  }, [discoveriesProp]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const gardenCount = useMemo(() => {
    const scanIds = new Set(scans.map((d) => d.id));
    let count = 0;
    for (const id of inGarden) {
      if (scanIds.has(id)) count += 1;
    }
    return count;
  }, [scans, inGarden]);

  const subtitle =
    scans.length <= 1
      ? `${scans.length} plante scannée · ${gardenCount} dans mon jardin`
      : `${scans.length} plantes scannées · ${gardenCount} dans mon jardin`;

  const handleToggle = async (discovery) => {
    if (!discovery?.id || togglingId) return;

    setTogglingId(discovery.id);
    setError(null);

    const alreadyIn = inGarden.has(discovery.id);

    try {
      if (alreadyIn) {
        const result = await demoteScanFromGarden(discovery.id, itemIdsByDiscovery);
        if (!result.ok) {
          setError(result.error || "unknown");
        } else {
          await refresh();
        }
      } else {
        if (!canAddToGarden) {
          setError(t("mes_scans.garden_gate"));
          return;
        }
        const result = await promoteScanToGarden(discovery, t);
        if (!result.ok) {
          setError(result.error || "unknown");
        } else {
          await refresh();
        }
      }
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <>
        <div style={{ padding: "15px 16px 14px" }}>
          <div className="wilder-v2-title-page" style={{ fontSize: 21, letterSpacing: "-0.01em", lineHeight: 1.15 }}>
            Mes scans
          </div>
          <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 4 }}>
            {loading ? "…" : subtitle}
          </div>
        </div>

        <div
          style={{
            margin: "0 16px 18px",
            background: COLORS.hint,
            border: `0.5px solid ${COLORS.border}`,
            borderRadius: 12,
            padding: "11px 13px",
            fontSize: 12,
            color: COLORS.secondary,
            lineHeight: 1.5,
            display: "flex",
            gap: 9,
            alignItems: "flex-start",
          }}
        >
          <span style={{ flex: "none", marginTop: 1, color: COLORS.greenInk }}>
            <IconGrid />
          </span>
          <span>
            Chaque plante scannée arrive ici, automatiquement. Ajoute à ton jardin celles que tu veux
            retrouver dans ton brief.
          </span>
        </div>

        {error && (
          <p style={{ margin: "0 16px 12px", fontSize: 12, color: COLORS.error }}>{error}</p>
        )}

        {loading && (
          <p style={{ padding: "0 16px 24px", fontSize: 13, color: COLORS.muted, textAlign: "center" }}>
            Chargement…
          </p>
        )}

        {!loading && scans.length === 0 && (
          <p style={{ padding: "0 16px 24px", fontSize: 13, color: COLORS.muted, textAlign: "center" }}>
            Aucun scan pour l&apos;instant. Lance ta première identification !
          </p>
        )}

        {!loading && scans.length > 0 && (
          <div style={{ padding: "0 16px 4px", display: "flex", flexDirection: "column", gap: 9 }}>
            {scans.map((discovery) => (
              <ScanRow
                key={discovery.id}
                discovery={discovery}
                inGarden={inGarden.has(discovery.id)}
                toggling={togglingId === discovery.id}
                onToggle={handleToggle}
              />
            ))}
          </div>
        )}

        <div style={{ padding: "12px 16px 20px", marginTop: 6 }}>
          <button
            type="button"
            onClick={onScan}
            style={{
              width: "100%",
              height: 48,
              background: COLORS.primary,
              color: "#fff",
              border: "none",
              borderRadius: 13,
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontFamily: "inherit",
            }}
          >
            <IconCamera /> Scanner une plante
          </button>
        </div>
    </>
  );
}
