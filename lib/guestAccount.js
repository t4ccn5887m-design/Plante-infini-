import { getCloudSession } from "./cloudSync";
import { isPermanentAuthUser } from "./authUser";

export const GUEST_SCAN_LIMIT = 5;
export const GUEST_SCAN_COUNT_KEY = "wilder-guest-scan-count";

export function getGuestScanCount() {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(GUEST_SCAN_COUNT_KEY);
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function incrementGuestScanCount() {
  if (typeof window === "undefined") return getGuestScanCount();
  const next = getGuestScanCount() + 1;
  try {
    localStorage.setItem(GUEST_SCAN_COUNT_KEY, String(next));
  } catch {
    /* ignore */
  }
  return next;
}

export function canGuestScan() {
  return getGuestScanCount() < GUEST_SCAN_LIMIT;
}

export function hasReachedGuestScanLimit() {
  return getGuestScanCount() >= GUEST_SCAN_LIMIT;
}

export async function hasRealAccount() {
  try {
    const session = await getCloudSession();
    return isPermanentAuthUser(session?.user);
  } catch {
    return false;
  }
}
