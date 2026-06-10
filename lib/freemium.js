export const PREMIUM_KEY = "wilder-premium";
export const PREMIUM_PLAN_KEY = "wilder-premium-plan";
export const PENDING_AUTH_KEY = "wilder-premium-pending-auth";

export const FREE_SCAN_LIMIT = 15;
export const SCAN_QUOTA_WARN_FROM = 13;

let serverQuota = {
  count: 0,
  limit: FREE_SCAN_LIMIT,
  isPremium: false,
  canScan: true,
  loaded: false,
};

/** Met à jour l'état quota depuis Supabase (via /api/scan-quota ou réponse analyze). */
export function syncScanQuotaFromServer(quota) {
  if (!quota) return serverQuota;
  const isPremium = Boolean(quota.isPremium ?? quota.is_premium);
  const count = Number(quota.count ?? 0);
  const limit = Number(quota.limit ?? FREE_SCAN_LIMIT);
  serverQuota = {
    count,
    limit,
    isPremium,
    canScan:
      quota.canScan != null
        ? Boolean(quota.canScan)
        : quota.can_scan != null
          ? Boolean(quota.can_scan)
          : isPremium || count < limit,
    loaded: true,
  };
  return serverQuota;
}

export function getServerQuota() {
  return serverQuota;
}

export function loadScanCount() {
  return serverQuota.count;
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

/** Compte créé — active l'abonnement Premium (local + serveur via activatePremiumOnServer). */
export function completePremiumActivation() {
  if (typeof window === "undefined") return;
  const plan = localStorage.getItem(PREMIUM_PLAN_KEY) || "monthly";
  localStorage.setItem(PREMIUM_KEY, "1");
  localStorage.setItem(PREMIUM_PLAN_KEY, plan);
  localStorage.removeItem(PENDING_AUTH_KEY);
  syncScanQuotaFromServer({ ...serverQuota, isPremium: true, canScan: true });
}

export function isPremium() {
  if (typeof window === "undefined") return false;
  if (isPendingAccountSetup()) return false;
  return serverQuota.isPremium || localStorage.getItem(PREMIUM_KEY) === "1";
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
  if (isPremium()) return true;
  if (serverQuota.loaded) return serverQuota.canScan;
  return loadScanCount() < FREE_SCAN_LIMIT;
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
