import { useState } from "react";
import { BUDGETS } from "@/lib/pro/briefLabels";
import { loadGardenBudgetChoice, saveGardenBudgetChoice } from "@/lib/gardenBudgetChoice";
import { touchGardenDossierAfterLocalSave } from "@/lib/gardenDossierStore";
import GardenFlowScreen, { GardenPrimaryButton, GardenStepHeader } from "@/components/garden/GardenFlowScreen";

const BUDGET_OPTIONS = BUDGETS.map((b) =>
  b.id === "unknown" ? { ...b, label: "Je ne sais pas encore" } : b
);

export default function GardenBudgetScreen({ onBack, onValidated }) {
  const savedOnMount = loadGardenBudgetChoice();
  const [selected, setSelected] = useState(savedOnMount);

  const canValidate = Boolean(selected);
  const validateLabel =
    savedOnMount && selected !== savedOnMount ? "Enregistrer les modifications" : "Valider";

  const handleValidate = () => {
    if (!canValidate) return;
    saveGardenBudgetChoice(selected);
    touchGardenDossierAfterLocalSave();
    onValidated?.();
  };

  return (
    <GardenFlowScreen
      footer={
        <GardenPrimaryButton disabled={!canValidate} onClick={handleValidate}>
          {validateLabel}
        </GardenPrimaryButton>
      }
    >
      <div style={{ padding: "0 18px 18px", display: "flex", flexDirection: "column", gap: 16 }}>
        <GardenStepHeader
          onBack={onBack}
          kicker="Étape 8 · Budget"
          title={
            <>
              Quel budget
              <br />
              imaginez-vous ?
            </>
          }
          subtitle="Une fourchette, juste pour orienter votre paysagiste."
        />

        <div className="atelier-budget-lines">
          {BUDGET_OPTIONS.map((b) => {
            const active = selected === b.id;
            return (
              <button
                key={b.id}
                type="button"
                className={`atelier-budget-opt${active ? " on" : ""}`}
                onClick={() => setSelected(b.id)}
              >
                <span>{b.label}</span>
                <span className="atelier-budget-opt__dot" aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </div>
    </GardenFlowScreen>
  );
}
