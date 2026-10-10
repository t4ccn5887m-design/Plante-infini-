import { useState } from "react";
import { BUDGETS } from "@/lib/pro/briefLabels";
import { loadGardenBudgetChoice, saveGardenBudgetChoice } from "@/lib/gardenBudgetChoice";
import GardenFlowScreen, { GardenBackButton } from "@/components/garden/GardenFlowScreen";

const GREEN = "#2F5E3F";
const MUTED = "#5B6359";

const BUDGET_OPTIONS = BUDGETS.map((b) =>
  b.id === "unknown" ? { ...b, label: "Je ne sais pas encore" } : b
);

export default function GardenBudgetScreen({ onBack, onSaved }) {
  const [selected, setSelected] = useState(() => loadGardenBudgetChoice());

  const choose = (id) => {
    const next = selected === id ? "" : id;
    setSelected(next);
    saveGardenBudgetChoice(next);
    onSaved?.();
  };

  return (
    <GardenFlowScreen>
      <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <GardenBackButton onBack={onBack} />
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Mon budget</h1>
        </div>

        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: MUTED }}>
          Fourchette budgétaire — une indication pour votre paysagiste, pas un engagement.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {BUDGET_OPTIONS.map((b) => {
            const active = selected === b.id;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => choose(b.id)}
                style={{
                  minHeight: 56,
                  borderRadius: 18,
                  border: active ? `2px solid ${GREEN}` : "1.5px solid #EEE9E0",
                  background: active ? "#E6F0E3" : "#FFFFFF",
                  color: active ? GREEN : "#1F2A22",
                  fontSize: 18,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textAlign: "center",
                  padding: "12px 16px",
                }}
              >
                {b.label}
              </button>
            );
          })}
        </div>

        <p style={{ margin: 0, fontSize: 13, color: MUTED, textAlign: "center", lineHeight: 1.45 }}>
          C&apos;est une indication pour votre paysagiste, pas un engagement.
        </p>
      </div>
    </GardenFlowScreen>
  );
}
