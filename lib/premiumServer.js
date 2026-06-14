import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { SCAN_QUOTA_RPC } from "@/lib/quotaTables";
import { FREE_SCAN_LIMIT } from "@/lib/scanQuotaServer";

function visitorKeyForUser(userId) {
  return userId ? `user:${userId}` : null;
}

/**
 * Active Premium après paiement Stripe vérifié (webhook uniquement).
 */
export async function activatePremiumFromStripe({
  userId,
  visitorKey,
  stripeCustomerId,
  stripeSubscriptionId,
  plan,
  currentPeriodEnd,
}) {
  if (!supabaseAdmin) return { ok: false, error: "server_unavailable" };

  const key = visitorKey || visitorKeyForUser(userId);
  if (!key) return { ok: false, error: "missing_identity" };

  const { error: upsertError } = await supabaseAdmin.from("scan_counts").upsert(
    {
      visitor_key: key,
      user_id: userId || null,
      is_premium: true,
      stripe_customer_id: stripeCustomerId || null,
      stripe_subscription_id: stripeSubscriptionId || null,
      premium_plan: plan || null,
      premium_current_period_end: currentPeriodEnd || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "visitor_key" }
  );

  if (upsertError) {
    console.error("[Wilder] activatePremiumFromStripe upsert:", upsertError.message);
    return { ok: false, error: upsertError.message };
  }

  return { ok: true, visitorKey: key };
}

/**
 * Désactive Premium quand l'abonnement Stripe se termine.
 */
export async function deactivatePremiumFromStripe({ stripeSubscriptionId, stripeCustomerId }) {
  if (!supabaseAdmin) return { ok: false, error: "server_unavailable" };

  let query = supabaseAdmin.from("scan_counts").update({
    is_premium: false,
    stripe_subscription_id: null,
    premium_plan: null,
    premium_current_period_end: null,
    updated_at: new Date().toISOString(),
  });

  if (stripeSubscriptionId) {
    query = query.eq("stripe_subscription_id", stripeSubscriptionId);
  } else if (stripeCustomerId) {
    query = query.eq("stripe_customer_id", stripeCustomerId);
  } else {
    return { ok: false, error: "missing_stripe_ref" };
  }

  const { error } = await query;
  if (error) {
    console.error("[Wilder] deactivatePremiumFromStripe:", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/** Lit le quota premium via RPC (service role). */
export async function getScanQuotaForIdentity(identity) {
  if (!supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin.rpc(SCAN_QUOTA_RPC.getQuota, {
    p_visitor_key: identity.visitorKey,
    p_user_id: identity.userId,
    p_limit: FREE_SCAN_LIMIT,
  });
  if (error) throw error;
  return data;
}
