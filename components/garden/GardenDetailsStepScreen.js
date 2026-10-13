import { useCallback, useState } from "react";
import { loadGardenBriefDetails, saveGardenBriefDetails } from "@/lib/gardenBriefDetails";
import { touchGardenDossierAfterLocalSave } from "@/lib/gardenDossierStore";
import GardenFlowScreen, { GardenBackButton, GardenPrimaryButton } from "@/components/garden/GardenFlowScreen";

const MUTED = "#5B6359";

export default function GardenDetailsStepScreen({
  title,
  subtitle,
  onBack,
  onValidated,
  valid,
  children,
}) {
  const [details, setDetails] = useState(() => loadGardenBriefDetails());

  const handleDetailsChange = useCallback((updater) => {
    setDetails((prev) => (typeof updater === "function" ? updater(prev) : updater));
  }, []);

  const handleValidate = () => {
    if (!valid(details)) return;
    saveGardenBriefDetails(details);
    touchGardenDossierAfterLocalSave();
    onValidated?.();
  };

  return (
    <GardenFlowScreen
      footer={
        <GardenPrimaryButton disabled={!valid(details)} onClick={handleValidate}>
          Valider cette étape
        </GardenPrimaryButton>
      }
    >
      <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <GardenBackButton onBack={onBack} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, lineHeight: 1.2 }}>{title}</h1>
            {subtitle ? (
              <p style={{ margin: "6px 0 0", fontSize: 14, lineHeight: 1.45, color: MUTED }}>{subtitle}</p>
            ) : null}
          </div>
        </div>
        <div className="garden-brief-steps" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {children(details, handleDetailsChange)}
        </div>
      </div>
    </GardenFlowScreen>
  );
}
