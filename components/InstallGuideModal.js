import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { detectInstallPlatform } from "@/lib/installGuide";

export default function InstallGuideModal({ open, onClose, t }) {
  const [mounted, setMounted] = useState(false);
  const platform = useMemo(() => detectInstallPlatform(), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !mounted) return null;

  const steps =
    platform === "ios"
      ? [t("install.ios_step1"), t("install.ios_step2"), t("install.ios_step3")]
      : [t("install.android_step1"), t("install.android_step2"), t("install.android_step3")];

  return createPortal(
    <div
      className="modal-overlay install-guide-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="modal-sheet install-guide-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-guide-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="install-guide-title">{t("install.guide_title")}</h2>
        <p className="install-guide-platform">
          {platform === "ios" ? t("install.platform_ios") : t("install.platform_android")}
        </p>
        <ol className="install-guide-steps">
          {steps.map((step, index) => (
            <li key={step} className="install-guide-step">
              <span className="install-guide-step-num" aria-hidden="true">
                {index + 1}
              </span>
              <span className="install-guide-step-text">{step}</span>
            </li>
          ))}
        </ol>
        <button type="button" className="btn-primary install-guide-close" onClick={onClose}>
          {t("install.guide_close")}
        </button>
      </div>
    </div>,
    document.body
  );
}
