import { ensureCloudAuth, getCloudSession } from "@/lib/cloudSync";
import { isPermanentAuthUser } from "@/lib/authUser";
import { startStripeCheckout } from "@/lib/scanQuotaClient";

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
 * Lance le checkout Stripe (CGV enregistrées côté serveur dans create-checkout-session).
 * Ne modifie JAMAIS le statut premium côté client.
 */
export async function checkoutWithCgv(plan = "yearly") {
  await ensureCloudAuth();
  const planKey = plan === "yearly" ? "yearly" : "monthly";
  return startStripeCheckout(planKey);
}
