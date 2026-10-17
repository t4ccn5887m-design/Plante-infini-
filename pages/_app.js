import "@/styles/globals.css";
import "@/styles/theme-atelier.css";
import "@/styles/pro/wilder-pro.css";
import Head from "next/head";
import { Fraunces, Inter, Quicksand, Nunito_Sans } from "next/font/google";
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

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-title",
  display: "swap",
});

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const ATELIER_THEME_COLOR = "#0F1A14";

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

  const fontVars = atelier
    ? `${fraunces.variable} ${inter.variable}`
    : `${quicksand.variable} ${nunitoSans.variable}`;
  const fontClass = atelier ? inter.className : nunitoSans.className;

  return (
    <AppErrorBoundary>
      <div className={fontVars + " " + fontClass}>
        <Head>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1"
            key="viewport"
          />
          {atelier ? (
            <meta name="theme-color" content={ATELIER_THEME_COLOR} key="theme-color-atelier" />
          ) : null}
        </Head>
        <Component {...pageProps} />
        {!isClientBrief && <InstallGuideModalHost />}
      </div>
    </AppErrorBoundary>
  );
}
