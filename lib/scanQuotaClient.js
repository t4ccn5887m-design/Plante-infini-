import { getCloudSession } from "@/lib/cloudSync";
import { isPermanentAuthUser } from "@/lib/authUser";
import { syncScanQuotaFromServer, getServerQuota } from "@/lib/freemium";
import { getVisitorId } from "@/lib/visitorId";
import { STRIPE_CHECKOUT_SESSION_PATH, STRIPE_PORTAL_SESSION_PATH } from "@/lib/stripeCheckoutPaths";

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
    if (session?.access_token) {
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

/**
 * Crée une session Stripe Checkout (API serveur) et redirige vers Stripe.
 * Premium activé uniquement par le webhook — jamais ici.
 */
export async function startStripeCheckout(plan = "monthly") {
  const session = await getCloudSession();
  if (!isPermanentAuthUser(session?.user)) {
    return { ok: false, needsAuth: true, error: "auth_required", message: "Compte permanent requis" };
  }

  const planKey = plan === "yearly" ? "yearly" : "monthly";
  const headers = await buildScanQuotaHeaders();
  const apiPath = STRIPE_CHECKOUT_SESSION_PATH;

  const res = await fetch(apiPath, {
    method: "POST",
    headers,
    body: JSON.stringify({ plan: planKey }),
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    console.error("[Wilder] startStripeCheckout failed:", {
      status: res.status,
      path: apiPath,
      plan: planKey,
      body: data,
    });
    return {
      ok: false,
      needsAuth: Boolean(data.needsAuth),
      error: data.erreur || "checkout_failed",
      message: data.message || data.erreur || `Erreur HTTP ${res.status}`,
      status: res.status,
      stripeCode: data.stripeCode,
      priceId: data.priceId,
    };
  }

  const checkoutUrl = data.url;
  if (!checkoutUrl || typeof checkoutUrl !== "string") {
    console.error("[Wilder] startStripeCheckout: no url in response", { path: apiPath, data });
    return { ok: false, error: "checkout_no_url", message: "Réponse serveur sans URL Stripe" };
  }

  window.location.assign(checkoutUrl);
  return { ok: true, redirecting: true };
}

/** Portail client Stripe (résiliation / facturation). */
export async function openStripeCustomerPortal() {
  const headers = await buildScanQuotaHeaders();
  const res = await fetch(STRIPE_PORTAL_SESSION_PATH, {
    method: "POST",
    headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      error: data.erreur || "portal_failed",
      message: data.message || data.erreur,
    };
  }
  if (data.url) {
    window.location.assign(data.url);
    return { ok: true, redirecting: true };
  }
  return { ok: false, error: "portal_no_url", message: "Réponse serveur sans URL portail" };
}
