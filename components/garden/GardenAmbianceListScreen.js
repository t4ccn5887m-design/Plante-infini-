import {
  GARDEN_AMBIANCE_IDS,
  GARDEN_AMBIANCE_META,
} from "@/lib/gardenAmbianceContent";
import { loadGardenAmbianceChoice } from "@/lib/gardenAmbianceChoice";
import { GardenBackButton } from "@/components/garden/GardenFlowScreen";

const GREEN = "var(--sage)";

export default function GardenAmbianceListScreen({ onBack, onOpenAmbiance }) {
  const chosen = loadGardenAmbianceChoice();

  return (
    <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <GardenBackButton onBack={onBack} />
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "var(--ink)" }}>Ambiances</h1>
      </div>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: "var(--mute)" }}>
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
                border: isChosen ? `2px solid ${GREEN}` : "1.5px solid var(--line)",
                borderRadius: 18,
                padding: 0,
                overflow: "hidden",
                background: "var(--card)",
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
                  color: "var(--ink)",
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
                    background: "rgba(201, 214, 184, 0.18)",
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
