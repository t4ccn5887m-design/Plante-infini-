import { useCallback, useState } from "react";
import { loadGardenBriefDetails, saveGardenBriefDetails } from "@/lib/gardenBriefDetails";
import { touchGardenDossierAfterLocalSave } from "@/lib/gardenDossierStore";
import GardenFlowScreen, { GardenPrimaryButton, GardenStepHeader } from "@/components/garden/GardenFlowScreen";

export default function GardenDetailsStepScreen({
  kicker,
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
      <div style={{ padding: "0 18px 18px", display: "flex", flexDirection: "column", gap: 16 }}>
        <GardenStepHeader kicker={kicker} title={title} subtitle={subtitle} onBack={onBack} />
        <div className="garden-brief-steps" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {children(details, handleDetailsChange)}
        </div>
      </div>
    </GardenFlowScreen>
  );
}
