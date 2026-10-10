import { useState } from "react";
import { loadGardenIntention, saveGardenIntention } from "@/lib/gardenIntention";
import GardenFlowScreen, { GardenBackButton, GardenPrimaryButton } from "@/components/garden/GardenFlowScreen";

const MUTED = "#5B6359";

export default function GardenMotScreen({ onBack, onValidated }) {
  const saved = loadGardenIntention();
  const [text, setText] = useState(saved);
  const trimmed = text.trim();
  const canValidate = trimmed.length > 0 && trimmed !== saved.trim();
  const label = saved.trim() && canValidate ? "Enregistrer les modifications" : "Valider";

  const handleValidate = () => {
    if (!canValidate) return;
    saveGardenIntention(trimmed);
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
      <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <GardenBackButton onBack={onBack} />
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Mot pour le paysagiste</h1>
        </div>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: MUTED }}>
          Quelques mots pour aider votre paysagiste à comprendre votre projet.
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder="Ce que vous voulez qu'il retienne…"
          style={{
            width: "100%",
            boxSizing: "border-box",
            borderRadius: 16,
            border: "1.5px solid #EEE9E0",
            padding: "14px 16px",
            fontSize: 15,
            lineHeight: 1.45,
            fontFamily: "inherit",
            resize: "vertical",
          }}
        />
      </div>
    </GardenFlowScreen>
  );
}
