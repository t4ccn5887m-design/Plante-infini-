import { createHash } from "crypto";
import { isPermanentAuthUser } from "@/lib/authUser";
import { supabaseAdmin, isScanQuotaServerAvailable } from "@/lib/supabaseAdmin";
import { logScanEvent } from "@/lib/scanLogServer";
import { SCAN_QUOTA_RPC } from "@/lib/quotaTables";

export const FREE_SCAN_LIMIT = 15;

export function getDefaultScanQuota() {
  return {
    ok: true,
    count: 0,
    limit: FREE_SCAN_LIMIT,
    isPremium: false,
    canScan: true,
    skipped: true,
  };
}

export function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  if (Array.isArray(forwarded)) return forwarded[0];
  return req.headers["x-real-ip"] || req.socket?.remoteAddress || null;
}

export async function resolveScanIdentity(req) {
  const rawVisitorId = req.headers["x-wilder-visitor-id"];
  const visitorId =
    rawVisitorId && /^[0-9a-f-]{36}$/i.test(String(rawVisitorId).trim())
      ? String(rawVisitorId).trim()
      : null;

  let userId = null;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ") && supabaseAdmin) {
    const token = authHeader.slice(7);
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (!error && isPermanentAuthUser(data?.user)) {
      userId = data.user.id;
    }
  }

  let visitorKey = null;
  if (userId) {
    visitorKey = `user:${userId}`;
  } else if (visitorId) {
    visitorKey = `visitor:${visitorId}`;
  } else {
    const ip = getClientIp(req);
    if (ip) {
      const hash = createHash("sha256").update(ip).digest("hex").slice(0, 32);
      visitorKey = `ip:${hash}`;
    }
  }

  if (!visitorKey) {
    return { ok: false, error: "missing_identity" };
  }

  return { ok: true, visitorKey, userId, visitorId };
}

async function callRpc(fn, params) {
  const { data, error } = await supabaseAdmin.rpc(fn, params);
  if (error) throw error;
  return data;
}

export async function getScanQuota(identity) {
  if (!isScanQuotaServerAvailable()) {
    return getDefaultScanQuota();
  }

  try {
    const data = await callRpc(SCAN_QUOTA_RPC.getQuota, {
      p_visitor_key: identity.visitorKey,
      p_user_id: identity.userId,
      p_limit: FREE_SCAN_LIMIT,
    });
    return { ok: true, ...normalizeQuotaPayload(data) };
  } catch (e) {
    console.error("[Wilder] getScanQuota:", e.message);
    return { ok: false, error: e.message };
  }
}

export async function checkScanAllowed(identity) {
  if (!isScanQuotaServerAvailable()) {
    return { ok: false, error: "scan_quota_unavailable", allowed: false };
  }

  try {
    const data = await callRpc(SCAN_QUOTA_RPC.checkAllowed, {
      p_visitor_key: identity.visitorKey,
      p_user_id: identity.userId,
      p_limit: FREE_SCAN_LIMIT,
    });
    return { ok: true, ...normalizeQuotaPayload(data), allowed: Boolean(data.allowed) };
  } catch (e) {
    console.error("[Wilder] checkScanAllowed:", e.message);
    return { ok: false, error: e.message, allowed: false };
  }
}

export async function incrementScanCountServer(identity) {
  if (!isScanQuotaServerAvailable()) {
    return { ok: false, error: "scan_quota_unavailable" };
  }

  try {
    const data = await callRpc(SCAN_QUOTA_RPC.increment, {
      p_visitor_key: identity.visitorKey,
      p_user_id: identity.userId,
      p_limit: FREE_SCAN_LIMIT,
    });
    return { ok: true, ...normalizeQuotaPayload(data) };
  } catch (e) {
    console.error("[Wilder] incrementScanCountServer:", e.message);
    return { ok: false, error: e.message };
  }
}

function normalizeQuotaPayload(data) {
  const count = Number(data?.count ?? 0);
  const limit = Number(data?.limit ?? FREE_SCAN_LIMIT);
  const isPremium = Boolean(data?.is_premium);
  const canScan =
    data?.can_scan != null ? Boolean(data.can_scan) : isPremium || count < limit;
  const premiumPlan = data?.premium_plan ?? null;
  const premiumRenewalAt = data?.premium_current_period_end ?? null;

  return { count, limit, isPremium, canScan, premiumPlan, premiumRenewalAt };
}

/** Scans illimités — identité optionnelle pour les logs analytics uniquement. */
export async function enforceScanQuotaForAnalyze(req) {
  const identity = await resolveScanIdentity(req);
  return {
    identity: identity.ok ? identity : null,
    quota: null,
    skipped: true,
  };
}

export async function recordSuccessfulScanServer(identity, speciesName = null) {
  logScanEvent(identity, speciesName);
  if (!isScanQuotaServerAvailable()) return null;
  return incrementScanCountServer(identity);
}
