export const SCAN_COUNT_KEY = "wilder_scan_count";
const LEGACY_SCAN_COUNT_KEY = "wilder-scan-count";
export const PREMIUM_KEY = "wilder-premium";
export const PREMIUM_PLAN_KEY = "wilder-premium-plan";
export const PENDING_AUTH_KEY = "wilder-premium-pending-auth";

export const FREE_SCAN_LIMIT = 15;
export const SCAN_QUOTA_WARN_FROM = 13;

function migrateScanCountKey() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(SCAN_COUNT_KEY) != null) return;
  const legacy = localStorage.getItem(LEGACY_SCAN_COUNT_KEY);
  if (legacy != null) {
    localStorage.setItem(SCAN_COUNT_KEY, legacy);
    localStorage.removeItem(LEGACY_SCAN_COUNT_KEY);
  }
}

export function loadScanCount() {
  if (typeof window === "undefined") return 0;
  migrateScanCountKey();
  try {
    const n = parseInt(localStorage.getItem(SCAN_COUNT_KEY) || "0", 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

/**
 * +1 à chaque identification réussie (/api/analyze ou /api/analyze-animal).
 * Aucune déduplication : même espèce, rescan ou découverte déjà connue = toujours +1.
 */
export function incrementScanCount() {
  if (typeof window === "undefined") return 0;
  migrateScanCountKey();
  const next = loadScanCount() + 1;
  localStorage.setItem(SCAN_COUNT_KEY, String(next));
  return next;
}

/** Alias explicite — même comportement qu'incrementScanCount, sans filtre ni cache. */
export function recordCompletedScan() {
  return incrementScanCount();
}

export function isPendingAccountSetup() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(PENDING_AUTH_KEY) === "1";
}

/** Paiement Stripe réussi — abonnement en attente de création de compte. */
export function recordPaymentSuccess(plan = "monthly") {
  if (typeof window === "undefined") return;
  localStorage.setItem(PENDING_AUTH_KEY, "1");
  localStorage.setItem(PREMIUM_PLAN_KEY, plan);
}

/** Compte créé — active l'abonnement Premium. */
export function completePremiumActivation() {
  if (typeof window === "undefined") return;
  const plan = localStorage.getItem(PREMIUM_PLAN_KEY) || "monthly";
  localStorage.setItem(PREMIUM_KEY, "1");
  localStorage.setItem(PREMIUM_PLAN_KEY, plan);
  localStorage.removeItem(PENDING_AUTH_KEY);
}

export function isPremium() {
  if (typeof window === "undefined") return false;
  if (isPendingAccountSetup()) return false;
  return localStorage.getItem(PREMIUM_KEY) === "1";
}

/** @deprecated Préférer recordPaymentSuccess + completePremiumActivation */
export function activatePremium(plan = "monthly") {
  recordPaymentSuccess(plan);
  completePremiumActivation();
}

export function getRemainingFreeScans() {
  if (isPremium()) return Infinity;
  return Math.max(0, FREE_SCAN_LIMIT - loadScanCount());
}

export function canScan() {
  if (isPendingAccountSetup()) return false;
  return isPremium() || loadScanCount() < FREE_SCAN_LIMIT;
}

export function shouldShowPaywall() {
  if (isPendingAccountSetup()) return false;
  return !isPremium() && loadScanCount() >= FREE_SCAN_LIMIT;
}

export function shouldShowAdBanner() {
  if (isPendingAccountSetup()) return false;
  return shouldShowPaywall();
}

export function shouldShowScanQuotaNotice(scanCount = loadScanCount()) {
  if (isPremium() || isPendingAccountSetup()) return false;
  return scanCount >= SCAN_QUOTA_WARN_FROM && scanCount < FREE_SCAN_LIMIT;
}
