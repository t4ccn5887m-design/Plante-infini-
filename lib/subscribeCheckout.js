import { ensureCloudAuth, getCloudSession } from "@/lib/cloudSync";
import { isPermanentAuthUser } from "@/lib/authUser";
import { startStripeCheckout } from "@/lib/scanQuotaClient";
import { recordCgvConsent } from "@/lib/userProfile";

/** Branche l'écran d'abonnement : checkout Stripe (permanent) ou conversion anonyme. */
export async function resolveSubscribeEntry() {
  await ensureCloudAuth();
  const session = await getCloudSession();
  const user = session?.user;

  if (isPermanentAuthUser(user)) {
    return {
      initialStep: "checkout",
      defaultPlan: "yearly",
      resumeCheckoutPlan: null,
    };
  }

  return {
    initialStep: "auth",
    defaultPlan: "yearly",
    resumeCheckoutPlan: null,
  };
}

/**
 * Enregistre les CGV puis crée la session Checkout Stripe (serveur) et redirige.
 * Ne modifie JAMAIS le statut premium côté client.
 */
export async function checkoutWithCgv(plan = "yearly") {
  await ensureCloudAuth();
  const consent = await recordCgvConsent();
  if (!consent.ok) {
    console.error("[Wilder] checkoutWithCgv: CGV consent failed", consent);
    return { ok: false, error: "cgv_consent_failed", detail: consent.error };
  }
  return startStripeCheckout(plan);
}
