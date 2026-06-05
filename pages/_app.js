import "leaflet/dist/leaflet.css";
import "@/styles/globals.css";
import { useEffect } from "react";
import InstallBanner from "@/components/InstallBanner";
import { detectLang } from "@/lib/i18n";
import { checkPotagerReminders } from "@/lib/potagerNotifications";
import { checkJardinMorningSurprise } from "@/lib/espaceVertNotifications";
import { loadAlbums, loadDiscoveries } from "@/lib/discoveriesStorage";

export default function App({ Component, pageProps }) {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        const lang = detectLang();
        checkPotagerReminders(lang);
        checkJardinMorningSurprise(loadAlbums(), loadDiscoveries(), lang);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    const lang = detectLang();
    checkPotagerReminders(lang);
    checkJardinMorningSurprise(loadAlbums(), loadDiscoveries(), lang);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  return (
    <>
      <Component {...pageProps} />
      <InstallBanner />
    </>
  );
}
