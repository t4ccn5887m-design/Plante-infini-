/**
 * Fiche lecture seule d’un ancien scan (plus de nouveau scan ni d’édition).
 */

import { useMemo } from "react";
import { getDiscoveryPhotoUrl } from "@/lib/discoveryPhoto";
import { getPaysagisteSpecs, PAYSAGISTE_SPEC_KEYS } from "@/lib/paysagisteSpecs";
import { WILDER_COLORS as COLORS } from "@/lib/themes";

const icStroke = {
  stroke: "currentColor",
  strokeWidth: 2,
  fill: "none",
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

function IconBack() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" style={icStroke} aria-hidden="true">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

const SPEC_LABELS = {
  exposition: "Exposition",
  floraison: "Floraison",
  taille_adulte: "Taille adulte",
  entretien: "Entretien",
  rusticité: "Rusticité",
};

export default function AncienneTrouvailleDetailScreen({ discovery, onBack }) {
  const photo = useMemo(
    () => getDiscoveryPhotoUrl(discovery) || discovery?.photo || null,
    [discovery]
  );
  const specs = useMemo(() => getPaysagisteSpecs(discovery), [discovery]);
  const description = (discovery?.description || "").trim();

  return (
    <div
      style={{
        flex: 1,
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {photo ? (
        <div style={{ width: "100%", aspectRatio: "4/3", background: "#2A3A30", position: "relative" }}>
          <img
            src={photo}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </div>
      ) : null}

      <div style={{ padding: "16px 18px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            alignSelf: "flex-start",
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: 0,
            border: "none",
            background: "transparent",
            color: COLORS.active,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          <IconBack />
          Retour
        </button>

        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: COLORS.ink }}>{discovery?.nom}</h1>
          {discovery?.nom_latin ? (
            <p style={{ margin: "4px 0 0", fontSize: 13, fontStyle: "italic", color: COLORS.muted }}>
              {discovery.nom_latin}
            </p>
          ) : null}
        </div>

        <p style={{ margin: 0, fontSize: 12, color: COLORS.muted, lineHeight: 1.45 }}>
          Archive de votre ancienne identification — consultation seule.
        </p>

        {description ? (
          <p style={{ margin: 0, fontSize: 14, color: COLORS.secondary, lineHeight: 1.55 }}>{description}</p>
        ) : null}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 8,
          }}
        >
          {PAYSAGISTE_SPEC_KEYS.map((key) => {
            const value = specs[key];
            if (!value || value === "—") return null;
            return (
              <div
                key={key}
                style={{
                  border: `0.5px solid ${COLORS.border}`,
                  borderRadius: 12,
                  padding: "10px 11px",
                  background: "#fff",
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 600, color: COLORS.muted, marginBottom: 4 }}>
                  {SPEC_LABELS[key] || key}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink, lineHeight: 1.35 }}>
                  {value}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
