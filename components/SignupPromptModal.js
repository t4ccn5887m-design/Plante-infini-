import { useState, useEffect } from "react";
import PremiumAuthStep from "@/components/PremiumAuthStep";

const VARIANT_KEYS = {
  save: {
    title: "signup_prompt.modal_save_title",
    body: "signup_prompt.modal_save_body",
  },
  limit: {
    title: "signup_prompt.modal_limit_title",
    body: "signup_prompt.modal_limit_body",
  },
};

export default function SignupPromptModal({ open, variant = "save", t, onClose, onAccountCreated }) {
  const [step, setStep] = useState("prompt");

  useEffect(() => {
    if (!open) setStep("prompt");
  }, [open]);

  if (!open) return null;

  const keys = VARIANT_KEYS[variant] || VARIANT_KEYS.save;

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

  return (
    <div className="modal-overlay signup-prompt-modal-overlay" onClick={handleClose}>
      <div
        className="modal-sheet signup-prompt-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="signup-prompt-modal-title"
      >
        {step === "prompt" ? (
          <>
            <h2 id="signup-prompt-modal-title" className="signup-prompt-modal-title">
              {t(keys.title)}
            </h2>
            <p className="signup-prompt-modal-body">{t(keys.body)}</p>
            <button
              type="button"
              className="btn-primary signup-prompt-modal-cta"
              onClick={handleCreateClick}
            >
              {t("signup_prompt.modal_create_cta")}
            </button>
            <button type="button" className="signup-prompt-modal-later" onClick={handleClose}>
              {t("signup_prompt.modal_later")}
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
    </div>
  );
}
