import { getCloudSession } from "@/lib/cloudSync";
import { syncScanQuotaFromServer, getServerQuota } from "@/lib/freemium";
import { getVisitorId } from "@/lib/visitorId";

export function getCachedScanQuota() {
  return getServerQuota();
}

export function applyScanQuota(quota) {
  return syncScanQuotaFromServer(quota);
}

export async function buildScanQuotaHeaders() {
  const headers = {
    "Content-Type": "application/json",
  };
  const visitorId = getVisitorId();
  if (visitorId) headers["X-Wilder-Visitor-Id"] = visitorId;

  try {
    const session = await getCloudSession();
    if (session?.access_token && !session.user?.is_anonymous) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch {
    /* ignore */
  }

  return headers;
}

export async function refreshScanQuota() {
  try {
    const headers = await buildScanQuotaHeaders();
    delete headers["Content-Type"];
    const res = await fetch("/api/scan-quota", { headers });
    if (!res.ok) return getServerQuota();
    const data = await res.json();
    return applyScanQuota(data);
  } catch {
    return getServerQuota();
  }
}

export async function activatePremiumOnServer() {
  try {
    const headers = await buildScanQuotaHeaders();
    const res = await fetch("/api/scan-quota", {
      method: "POST",
      headers,
      body: JSON.stringify({ action: "activate_premium" }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return applyScanQuota(data);
  } catch {
    return null;
  }
}
