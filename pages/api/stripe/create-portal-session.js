import { resolveAuthUser } from "@/lib/apiAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSiteUrl, getStripeClient } from "@/lib/stripeServer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const stripe = await getStripeClient();
  if (!stripe || !supabaseAdmin) {
    return res.status(503).json({ erreur: "stripe_unavailable" });
  }

  const user = await resolveAuthUser(req);
  if (!user) {
    return res.status(401).json({ erreur: "auth_required" });
  }

  const visitorKey = `user:${user.id}`;
  const { data: row } = await supabaseAdmin
    .from("scan_counts")
    .select("stripe_customer_id")
    .eq("visitor_key", visitorKey)
    .maybeSingle();

  const customerId = row?.stripe_customer_id;
  if (!customerId) {
    return res.status(400).json({ erreur: "no_stripe_customer" });
  }

  const siteUrl = getSiteUrl(req);

  try {
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${siteUrl}/`,
    });
    return res.status(200).json({ url: portal.url });
  } catch (e) {
    console.error("[Wilder] create-portal-session:", e.message);
    return res.status(500).json({ erreur: "portal_failed" });
  }
}
