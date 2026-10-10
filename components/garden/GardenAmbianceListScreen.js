import {
  GARDEN_AMBIANCE_IDS,
  GARDEN_AMBIANCE_META,
} from "@/lib/gardenAmbianceContent";
import { loadGardenAmbianceChoice } from "@/lib/gardenAmbianceChoice";
import { GardenBackButton } from "@/components/garden/GardenFlowScreen";

const GREEN = "#2F5E3F";

export default function GardenAmbianceListScreen({ onBack, onOpenAmbiance }) {
  const chosen = loadGardenAmbianceChoice();

  return (
    <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <GardenBackButton onBack={onBack} />
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#1F2A22" }}>Ambiances</h1>
      </div>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: "#5B6359" }}>
        Choisissez l&apos;ambiance qui vous ressemble — une seule à la fois, modifiable à tout moment.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {GARDEN_AMBIANCE_IDS.map((name) => {
          const meta = GARDEN_AMBIANCE_META[name];
          const isChosen = chosen === name;
          return (
            <button
              key={name}
              type="button"
              onClick={() => onOpenAmbiance(name)}
              style={{
                border: isChosen ? `2px solid ${GREEN}` : "1.5px solid #EEE9E0",
                borderRadius: 18,
                padding: 0,
                overflow: "hidden",
                background: "#FFFFFF",
                cursor: "pointer",
                fontFamily: "inherit",
                textAlign: "left",
                width: "100%",
              }}
            >
              <div
                style={{
                  height: 72,
                  background: meta?.heroColor || "#6B7268",
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  color: "#FFFFFF",
                }}
              >
                <span style={{ fontSize: 18, fontWeight: 700 }}>{name}</span>
                {meta?.subtitle ? (
                  <span style={{ fontSize: 13, opacity: 0.92 }}>{meta.subtitle}</span>
                ) : null}
              </div>
              {isChosen ? (
                <div
                  style={{
                    padding: "8px 16px",
                    fontSize: 12,
                    fontWeight: 700,
                    color: GREEN,
                    background: "#E6F0E3",
                  }}
                >
                  Mon ambiance actuelle
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
