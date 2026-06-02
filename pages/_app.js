import "leaflet/dist/leaflet.css";
import "@/styles/globals.css";
import { useEffect } from "react";
import InstallBanner from "@/components/InstallBanner";

export default function App({ Component, pageProps }) {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return (
    <>
      <Component {...pageProps} />
      <InstallBanner />
    </>
  );
}
