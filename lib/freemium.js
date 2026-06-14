export const FREE_SCAN_LIMIT = 15;
export const SCAN_QUOTA_WARN_FROM = 13;

let serverQuota = {
  count: 0,
  limit: FREE_SCAN_LIMIT,
  isPremium: false,
  canScan: true,
  loaded: false,
  premiumPlan: null,
  premiumRenewalAt: null,
};

/** Met à jour l'état quota depuis Supabase (via /api/scan-quota ou réponse analyze). */
export function syncScanQuotaFromServer(quota) {
  if (!quota) return serverQuota;
  const isPremium = Boolean(quota.isPremium ?? quota.is_premium);
  const count = Number(quota.count ?? 0);
  const limit = Number(quota.limit ?? FREE_SCAN_LIMIT);
  const premiumPlan = quota.premiumPlan ?? quota.premium_plan ?? null;
  const renewalRaw = quota.premiumRenewalAt ?? quota.premium_current_period_end ?? null;
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
    premiumPlan,
    premiumRenewalAt: renewalRaw,
  };
  return serverQuota;
}

export function getServerQuota() {
  return serverQuota;
}

export function loadScanCount() {
  return serverQuota.count;
}

/** Premium = source de vérité Supabase (scan_counts), jamais localStorage. */
export function isPremium() {
  if (typeof window === "undefined") return false;
  return serverQuota.isPremium;
}

export function getPremiumPlan() {
  return serverQuota.premiumPlan || "monthly";
}

export function getPremiumRenewalDate() {
  const raw = serverQuota.premiumRenewalAt;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Réinitialise le cache local après résiliation (statut serveur mis à jour via webhook). */
export function clearLocalPremiumCache() {
  syncScanQuotaFromServer({
    ...serverQuota,
    isPremium: false,
    canScan: serverQuota.count < FREE_SCAN_LIMIT,
    premiumPlan: null,
    premiumRenewalAt: null,
  });
}

export function getRemainingFreeScans() {
  if (isPremium()) return Infinity;
  return Math.max(0, FREE_SCAN_LIMIT - loadScanCount());
}

export function canScan() {
  if (isPremium()) return true;
  if (serverQuota.loaded) return serverQuota.canScan;
  return loadScanCount() < FREE_SCAN_LIMIT;
}

export function shouldShowPaywall() {
  return !isPremium() && loadScanCount() >= FREE_SCAN_LIMIT;
}

export function shouldShowAdBanner() {
  return shouldShowPaywall();
}

export function shouldShowScanQuotaNotice(scanCount = loadScanCount()) {
  if (isPremium()) return false;
  return scanCount >= SCAN_QUOTA_WARN_FROM && scanCount < FREE_SCAN_LIMIT;
}
