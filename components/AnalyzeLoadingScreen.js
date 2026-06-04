import { useEffect, useMemo, useState } from "react";

const STEP_MS = 2000;

export default function AnalyzeLoadingScreen({ captured, t }) {
  const steps = useMemo(
    () => [
      t("analyze.status_0"),
      t("analyze.status_1"),
      t("analyze.status_2"),
      t("analyze.status_3"),
    ],
    [t]
  );
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setStep((prev) => (prev + 1) % steps.length);
    }, STEP_MS);
    return () => clearInterval(id);
  }, [steps.length]);

  return (
    <div className="analyze-screen screen-enter-fast">
      {captured && (
        <img src={captured} alt="" className="analyze-preview-photo" aria-hidden="true" />
      )}
      <div className="analyze-content">
        <div className="analyze-ring" aria-hidden="true">
          <div className="analyze-ring-inner">
            {captured && (
              <img src={captured} alt="" className="analyze-ring-photo" />
            )}
          </div>
        </div>
        <div className="analyze-pulse-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <p className="analyze-status-text" key={step}>
          {steps[step]}
        </p>
      </div>
    </div>
  );
}
