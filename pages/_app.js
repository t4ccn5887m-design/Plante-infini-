import "leaflet/dist/leaflet.css";
import "@/styles/globals.css";
import { useEffect } from "react";
import InstallBanner from "@/components/InstallBanner";
import { detectLang } from "@/lib/i18n";
import { checkPotagerReminders } from "@/lib/potagerNotifications";

export default function App({ Component, pageProps }) {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        checkPotagerReminders(detectLang());
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    checkPotagerReminders(detectLang());
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  return (
    <>
      <Component {...pageProps} />
      <InstallBanner />
    </>
  );
}
