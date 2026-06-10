export const SCAN_COUNT_KEY = "wilder-scan-count";
export const PREMIUM_KEY = "wilder-premium";
export const PREMIUM_PLAN_KEY = "wilder-premium-plan";

export const FREE_SCAN_LIMIT = 20;
export const AD_BANNER_FROM_SCAN = 15;

export function loadScanCount() {
  if (typeof window === "undefined") return 0;
  try {
    const n = parseInt(localStorage.getItem(SCAN_COUNT_KEY) || "0", 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function incrementScanCount() {
  if (typeof window === "undefined") return 0;
  const next = loadScanCount() + 1;
  localStorage.setItem(SCAN_COUNT_KEY, String(next));
  return next;
}

export function isPremium() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(PREMIUM_KEY) === "1";
}

export function activatePremium(plan = "yearly") {
  if (typeof window === "undefined") return;
  localStorage.setItem(PREMIUM_KEY, "1");
  localStorage.setItem(PREMIUM_PLAN_KEY, plan);
}

export function getRemainingFreeScans() {
  if (isPremium()) return Infinity;
  return Math.max(0, FREE_SCAN_LIMIT - loadScanCount());
}

export function canScan() {
  return isPremium() || loadScanCount() < FREE_SCAN_LIMIT;
}

export function shouldShowPaywall() {
  return !isPremium() && loadScanCount() >= FREE_SCAN_LIMIT;
}

export function shouldShowAdBanner() {
  return !isPremium() && loadScanCount() >= AD_BANNER_FROM_SCAN;
}
