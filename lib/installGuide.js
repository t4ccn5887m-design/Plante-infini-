export function isAppStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

export function shouldOfferInstallGuide() {
  return !isAppStandalone();
}

export function detectInstallPlatform() {
  if (typeof navigator === "undefined") return "android";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua) && !window.MSStream) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "android";
}

const PENDING_AUTO_SHOW_KEY = "wilder-install-guide-pending";
const AUTO_SHOWN_KEY = "wilder-install-guide-auto-shown";

export function scheduleInstallGuideAfterFirstScan() {
  if (typeof window === "undefined") return;
  if (!shouldOfferInstallGuide()) return;
  if (localStorage.getItem(AUTO_SHOWN_KEY) === "1") return;
  sessionStorage.setItem(PENDING_AUTO_SHOW_KEY, "1");
}

export function tryConsumeInstallGuideAutoShow() {
  if (typeof window === "undefined") return false;
  if (sessionStorage.getItem(PENDING_AUTO_SHOW_KEY) !== "1") return false;
  if (localStorage.getItem(AUTO_SHOWN_KEY) === "1") return false;
  sessionStorage.removeItem(PENDING_AUTO_SHOW_KEY);
  localStorage.setItem(AUTO_SHOWN_KEY, "1");
  return true;
}
