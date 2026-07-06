import "@/styles/globals.css";
import { useEffect } from "react";
import AppErrorBoundary from "@/components/AppErrorBoundary";
import InstallGuideModalHost from "@/components/InstallGuideModalHost";
import Footer from "@/components/Footer";
import { detectLang } from "@/lib/i18n";
import { checkNatureReminders } from "@/lib/natureNotifications";
import { flushPendingSync } from "@/lib/cloudSync";

export default function App({ Component, pageProps }) {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let reloaded = false;
    const onControllerChange = () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        reg.update();
        if (reg.waiting) {
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
        }
        reg.addEventListener("updatefound", () => {
          const worker = reg.installing;
          if (!worker) return;
          worker.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              worker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });
      })
      .catch(() => {});

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        checkNatureReminders(detectLang());
        flushPendingSync();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    checkNatureReminders(detectLang());
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  return (
    <AppErrorBoundary>
      <Component {...pageProps} />
      <Footer />
      <InstallGuideModalHost />
    </AppErrorBoundary>
  );
}
