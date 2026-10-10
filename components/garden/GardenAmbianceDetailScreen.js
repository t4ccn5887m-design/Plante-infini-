import { useMemo, useState } from "react";
import { getGardenAmbianceMeta } from "@/lib/gardenAmbianceContent";
import {
  getCatalogueMaterialsForAmbiance,
  getCataloguePlantsForAmbiance,
} from "@/lib/gardenAmbianceCatalog";
import {
  loadGardenAmbianceChoice,
  saveGardenAmbianceChoice,
} from "@/lib/gardenAmbianceChoice";
import GardenFlowScreen, { GardenBackButton } from "@/components/garden/GardenFlowScreen";

const GREEN = "#2F5E3F";
const MUTED = "#5B6359";

function TraitPill({ children, warm }) {
  return (
    <span
      style={{
        padding: "6px 12px",
        borderRadius: 999,
        background: warm ? "#F6E7D8" : "#E6F0E3",
        color: warm ? "#8A4A22" : GREEN,
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      {children}
    </span>
  );
}

function SectionLabel({ children }) {
  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: "1.2px",
        color: MUTED,
      }}
    >
      {children}
    </span>
  );
}

export default function GardenAmbianceDetailScreen({
  ambianceName,
  onBack,
  onSaved,
}) {
  const meta = getGardenAmbianceMeta(ambianceName);
  const plants = useMemo(() => getCataloguePlantsForAmbiance(ambianceName), [ambianceName]);
  const materials = useMemo(
    () => getCatalogueMaterialsForAmbiance(ambianceName),
    [ambianceName]
  );

  const [chosen, setChosen] = useState(() => loadGardenAmbianceChoice() === ambianceName);

  const toggleChoice = () => {
    if (chosen) {
      saveGardenAmbianceChoice("");
      setChosen(false);
    } else {
      saveGardenAmbianceChoice(ambianceName);
      setChosen(true);
    }
    onSaved?.();
  };

  if (!meta) {
    return (
      <div style={{ padding: 18 }}>
        <GardenBackButton onBack={onBack} />
        <p style={{ color: MUTED }}>Ambiance introuvable.</p>
      </div>
    );
  }

  return (
    <GardenFlowScreen
      footer={
        <button
          type="button"
          onClick={toggleChoice}
          style={{
            width: "100%",
            minHeight: 54,
            border: chosen ? `1.5px solid ${GREEN}` : "none",
            borderRadius: 18,
            background: chosen ? "#E6F0E3" : GREEN,
            color: chosen ? GREEN : "#FFFFFF",
            fontFamily: "inherit",
            fontSize: 17,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {chosen ? (
            <>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M20 6 9 17l-5-5"
                  stroke="currentColor"
                  strokeWidth={2.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Ajoutée à mon dossier
            </>
          ) : (
            "C'est mon ambiance"
          )}
        </button>
      }
    >
      <div
        style={{
          height: 250,
          background: meta.heroColor,
          padding: 16,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <GardenBackButton onBack={onBack} />
        <div style={{ color: "#FFFFFF", display: "flex", flexDirection: "column", gap: 4 }}>
          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 700 }}>{ambianceName}</h1>
          <span style={{ fontSize: 15, color: "#F5E9DA" }}>{meta.subtitle}</span>
        </div>
      </div>

      <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {meta.traits.map((t, i) => (
            <TraitPill key={t} warm={i === 2}>
              {t}
            </TraitPill>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <SectionLabel>CE QUI LA DÉFINIT</SectionLabel>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, color: "#3B4339" }}>{meta.defines}</p>
        </div>

        {plants.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <SectionLabel>LES PLANTES PHARES</SectionLabel>
            <div
              style={{
                display: "flex",
                gap: 10,
                overflowX: "auto",
                paddingBottom: 4,
                marginRight: -18,
                paddingRight: 18,
              }}
            >
              {plants.map((p) => (
                <div
                  key={p.id}
                  style={{
                    flex: "0 0 128px",
                    borderRadius: 18,
                    overflow: "hidden",
                    border: "1.5px solid #EEE9E0",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <span
                    style={{
                      height: 90,
                      background: p.photo_url ? `url(${p.photo_url}) center/cover` : "#8C7AB0",
                      display: "block",
                    }}
                  />
                  <span
                    style={{
                      padding: "8px 10px 10px",
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#1F2A22",
                    }}
                  >
                    {p.nom}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {materials.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <SectionLabel>MATÉRIAUX ET AMÉNAGEMENTS</SectionLabel>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 8,
              }}
            >
              {materials.map((m) => (
                <div
                  key={m.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: 8,
                    borderRadius: 16,
                    border: "1.5px solid #EEE9E0",
                  }}
                >
                  <span
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      flexShrink: 0,
                      background: m.photo_url
                        ? `url(${m.photo_url}) center/cover`
                        : "#D8C9AE",
                    }}
                  />
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#1F2A22", lineHeight: 1.2 }}>
                    {m.nom}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div
          style={{
            borderRadius: 18,
            padding: "14px 16px",
            background: "#FDF2E6",
            border: "1.5px solid #F1D9C0",
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
          }}
        >
          <svg
            width={18}
            height={18}
            viewBox="0 0 24 24"
            fill="none"
            stroke="#A4501F"
            strokeWidth={2.2}
            aria-hidden="true"
            style={{ flexShrink: 0, marginTop: 2 }}
          >
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: "#4A2A14" }}>
            <strong>À savoir :</strong> {meta.aSavoir}
          </p>
        </div>
      </div>
    </GardenFlowScreen>
  );
}
