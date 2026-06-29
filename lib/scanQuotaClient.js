import { getCloudSession } from "@/lib/cloudSync";
import { getVisitorId } from "@/lib/visitorId";
import { getServerQuota } from "@/lib/freemium";

export function getCachedScanQuota() {
  return getServerQuota();
}

export function applyScanQuota() {
  return getServerQuota();
}

export async function buildScanQuotaHeaders() {
  const headers = {
    "Content-Type": "application/json",
  };
  const visitorId = getVisitorId();
  if (visitorId) headers["X-Wilder-Visitor-Id"] = visitorId;

  try {
    const session = await getCloudSession();
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch {
    /* ignore */
  }

  return headers;
}

export async function refreshScanQuota() {
  return getServerQuota();
}
