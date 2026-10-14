import { useState } from "react";
import { loadGardenIntention, saveGardenIntention } from "@/lib/gardenIntention";
import { touchGardenDossierAfterLocalSave } from "@/lib/gardenDossierStore";
import GardenFlowScreen, { GardenPrimaryButton, GardenStepHeader } from "@/components/garden/GardenFlowScreen";

const MUTED = "var(--mute)";

export default function GardenMotScreen({ onBack, onValidated }) {
  const saved = loadGardenIntention();
  const [text, setText] = useState(saved);
  const trimmed = text.trim();
  const canValidate = trimmed.length > 0;
  const label = saved.trim() && trimmed !== saved.trim() ? "Enregistrer les modifications" : "Valider";

  const handleValidate = () => {
    if (!canValidate) return;
    saveGardenIntention(trimmed);
    touchGardenDossierAfterLocalSave();
    onValidated?.();
  };

  return (
    <GardenFlowScreen
      footer={
        <GardenPrimaryButton disabled={!canValidate} onClick={handleValidate}>
          {label}
        </GardenPrimaryButton>
      }
    >
      <div style={{ padding: "0 18px 18px", display: "flex", flexDirection: "column", gap: 16 }}>
        <GardenStepHeader
          onBack={onBack}
          kicker="Étape 3 · Mot au paysagiste"
          title={
            <>
              En quelques mots,
              <br />
              votre jardin idéal ?
            </>
          }
          subtitle="Ce que vous voulez y faire, ce qui compte pour vous."
        />
        <textarea
          className="bf-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder="Ce que vous voulez qu'il retienne…"
        />
      </div>
    </GardenFlowScreen>
  );
}
