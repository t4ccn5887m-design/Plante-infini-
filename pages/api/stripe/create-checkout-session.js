import { resolveAuthUser } from "@/lib/apiAuth";
import { getAuthUserEmail } from "@/lib/authUser";
import { resolveScanIdentity } from "@/lib/scanQuotaServer";
import { getSiteUrl, getStripeClient, getStripePriceIds } from "@/lib/stripeServer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const stripe = await getStripeClient();
  if (!stripe) {
    return res.status(503).json({ erreur: "stripe_unavailable" });
  }

  const user = await resolveAuthUser(req);
  if (!user) {
    return res.status(401).json({ erreur: "auth_required", needsAuth: true });
  }

  const identity = await resolveScanIdentity(req);
  if (!identity.ok) {
    return res.status(400).json({ erreur: "Identifiant visiteur manquant" });
  }

  const { plan } = req.body || {};
  const prices = getStripePriceIds();
  const priceId = plan === "yearly" ? prices.yearly : prices.monthly;
  if (!priceId) {
    return res.status(503).json({ erreur: "stripe_price_missing" });
  }

  const siteUrl = getSiteUrl(req);
  const customerEmail = getAuthUserEmail(user);
  const planKey = plan === "yearly" ? "yearly" : "monthly";

  const sessionParams = {
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${siteUrl}/?stripe=success`,
    cancel_url: `${siteUrl}/?stripe=cancel`,
    client_reference_id: user.id,
    metadata: {
      user_id: user.id,
      visitor_key: identity.visitorKey,
      plan: planKey,
    },
    subscription_data: {
      metadata: {
        user_id: user.id,
        visitor_key: identity.visitorKey,
        plan: planKey,
      },
    },
  };

  if (customerEmail) {
    sessionParams.customer_email = customerEmail;
  }

  try {
    const session = await stripe.checkout.sessions.create(sessionParams);
    if (!session?.url) {
      return res.status(500).json({ erreur: "checkout_no_url" });
    }
    return res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (e) {
    console.error("[Wilder] create-checkout-session:", e.message);
    return res.status(500).json({ erreur: "checkout_failed" });
  }
}
