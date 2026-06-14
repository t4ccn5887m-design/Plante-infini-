import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import PremiumAuthStep from "@/components/PremiumAuthStep";

export default function FeatureGateModal({ open, t, onClose, onAccountCreated }) {
  const [step, setStep] = useState("prompt");

  useEffect(() => {
    if (!open) setStep("prompt");
  }, [open]);

  if (!open) return null;

  const handleClose = () => {
    setStep("prompt");
    onClose?.();
  };

  const handleCreateClick = () => {
    setStep("auth");
  };

  const handleAuthComplete = () => {
    setStep("prompt");
    onAccountCreated?.();
  };

  return createPortal(
    <div className="modal-overlay signup-prompt-modal-overlay" onClick={handleClose}>
      <div
        className="modal-sheet signup-prompt-modal feature-gate-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feature-gate-modal-message"
      >
        {step === "prompt" ? (
          <>
            <p id="feature-gate-modal-message" className="feature-gate-modal-message">
              {t("feature_gate.message")}
            </p>
            <button
              type="button"
              className="btn-primary signup-prompt-modal-cta"
              onClick={handleCreateClick}
            >
              {t("feature_gate.cta")}
            </button>
            <button type="button" className="signup-prompt-modal-later" onClick={handleClose}>
              {t("feature_gate.later")}
            </button>
          </>
        ) : (
          <PremiumAuthStep
            t={t}
            titleKey="signup_prompt.auth_title"
            subtitleKey="signup_prompt.auth_subtitle"
            onComplete={handleAuthComplete}
          />
        )}
      </div>
    </div>,
    document.body
  );
}
