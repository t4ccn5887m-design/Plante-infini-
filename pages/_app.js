import "@/styles/globals.css";
import "@/styles/theme-atelier.css";
import "@/styles/pro/wilder-pro.css";
import Head from "next/head";
import { Fraunces, Inter } from "next/font/google";
import { useEffect } from "react";
import { useRouter } from "next/router";
import AppErrorBoundary from "@/components/AppErrorBoundary";
import InstallGuideModalHost from "@/components/InstallGuideModalHost";
import { flushPendingSync } from "@/lib/cloudSync";
import { migratePersistedAuthSession } from "@/lib/authSessionBoot";
import { isAtelierAppRoute } from "@/lib/atelierRoute";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-title",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});


function isClientBriefPath(pathname) {
  return typeof pathname === "string" && pathname.startsWith("/b/");
}

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const isClientBrief = isClientBriefPath(router.pathname);
  const atelier = isAtelierAppRoute(
    router.pathname,
    router.isReady ? router.query : undefined
  );

  useEffect(() => {
    migratePersistedAuthSession();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("atelier-theme", atelier);
  }, [atelier]);

  useEffect(() => {
    if (isClientBrief) return;
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
  }, [isClientBrief]);

  useEffect(() => {
    if (isClientBrief) return;
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        flushPendingSync();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [isClientBrief]);

  const fontVars = `${fraunces.variable} ${inter.variable}`;
  const fontClass = inter.className;

  return (
    <AppErrorBoundary>
      <div className={fontVars + " " + fontClass}>
        <Head>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1"
            key="viewport"
          />
        </Head>
        <Component {...pageProps} />
        {!isClientBrief && <InstallGuideModalHost />}
      </div>
    </AppErrorBoundary>
  );
}
