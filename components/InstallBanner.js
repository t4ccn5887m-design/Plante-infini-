import { useState, useEffect, useMemo } from "react";
import { createT, detectLang } from "@/lib/i18n";

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function isIOSDevice() {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream;
}

export default function InstallBanner() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const lang = useMemo(() => detectLang(), []);
  const t = useMemo(() => createT(lang), [lang]);

  useEffect(() => {
    if (isStandalone() || dismissed) return;

    const ios = isIOSDevice();
    setIsIOS(ios);

    const timer = setTimeout(() => setVisible(true), 30000);

    const onBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    };
  }, [dismissed]);

  const dismiss = () => {
    setDismissed(true);
    setVisible(false);
  };

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setDismissed(true);
    setVisible(false);
  };

  if (!visible) return null;

  const canInstall = isIOS || deferredPrompt;

  return (
    <div className="install-banner" role="dialog" aria-live="polite" aria-label={t("install.message")}>
      <div className="install-banner-inner">
        <p className="install-banner-text">{t("install.message")}</p>
        {showIOSInstructions && (
          <p className="install-banner-ios">{t("install.ios_instructions")}</p>
        )}
        <div className="install-banner-actions">
          {canInstall && !showIOSInstructions && (
            <button type="button" className="install-banner-btn" onClick={handleInstall}>
              {t("install.button")}
            </button>
          )}
          <button type="button" className="install-banner-dismiss" onClick={dismiss}>
            {t("install.dismiss")}
          </button>
        </div>
      </div>
    </div>
  );
}
