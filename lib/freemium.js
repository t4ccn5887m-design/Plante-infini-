/** Scans illimités pour tous — plus de paywall ni de quota client. */

export function syncScanQuotaFromServer() {
  return { count: 0, limit: Infinity, isPremium: false, canScan: true, loaded: true };
}

export function getServerQuota() {
  return syncScanQuotaFromServer();
}

export function loadScanCount() {
  return 0;
}

export function isPremium() {
  return false;
}

export function getPremiumPlan() {
  return null;
}

export function getPremiumRenewalDate() {
  return null;
}

export function clearLocalPremiumCache() {}

export function getRemainingFreeScans() {
  return Infinity;
}

export function canScan() {
  return true;
}

export function shouldShowPaywall() {
  return false;
}

export function shouldShowAdBanner() {
  return false;
}

export function shouldShowScanQuotaNotice() {
  return false;
}
