import { activatePremiumFromStripe, deactivatePremiumFromStripe } from "@/lib/premiumServer";
import { getStripeClient, getStripeWebhookSecret } from "@/lib/stripeServer";

export const config = {
  api: {
    bodyParser: false,
  },
};

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

function planFromMetadata(meta = {}) {
  return meta.plan === "yearly" ? "yearly" : "monthly";
}

async function handleCheckoutCompleted(session) {
  const userId = session.metadata?.user_id || session.client_reference_id || null;
  const visitorKey = session.metadata?.visitor_key || (userId ? `user:${userId}` : null);
  const plan = planFromMetadata(session.metadata);

  let subscriptionId = session.subscription;
  let currentPeriodEnd = null;

  if (subscriptionId) {
    const stripe = await getStripeClient();
    if (stripe) {
      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      subscriptionId = sub.id;
      currentPeriodEnd = sub.current_period_end
        ? new Date(sub.current_period_end * 1000).toISOString()
        : null;
      if (sub.metadata?.plan) {
        return activatePremiumFromStripe({
          userId,
          visitorKey,
          stripeCustomerId: session.customer,
          stripeSubscriptionId: subscriptionId,
          plan: planFromMetadata(sub.metadata),
          currentPeriodEnd,
        });
      }
    }
  }

  return activatePremiumFromStripe({
    userId,
    visitorKey,
    stripeCustomerId: session.customer,
    stripeSubscriptionId: subscriptionId,
    plan,
    currentPeriodEnd,
  });
}

async function handleSubscriptionActive(subscription) {
  const userId = subscription.metadata?.user_id || null;
  const visitorKey =
    subscription.metadata?.visitor_key || (userId ? `user:${userId}` : null);
  const status = subscription.status;

  if (status === "active" || status === "trialing") {
    return activatePremiumFromStripe({
      userId,
      visitorKey,
      stripeCustomerId: subscription.customer,
      stripeSubscriptionId: subscription.id,
      plan: planFromMetadata(subscription.metadata),
      currentPeriodEnd: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null,
    });
  }

  return deactivatePremiumFromStripe({
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: subscription.customer,
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const stripe = await getStripeClient();
  const webhookSecret = getStripeWebhookSecret();
  if (!stripe || !webhookSecret) {
    return res.status(503).json({ erreur: "stripe_webhook_unconfigured" });
  }

  const signature = req.headers["stripe-signature"];
  if (!signature) {
    return res.status(400).send("Missing stripe-signature");
  }

  let event;
  try {
    const rawBody = await readRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("[Wilder] Stripe webhook signature:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionActive(event.data.object);
        break;
      case "customer.subscription.deleted":
        await deactivatePremiumFromStripe({
          stripeSubscriptionId: event.data.object.id,
          stripeCustomerId: event.data.object.customer,
        });
        break;
      default:
        break;
    }
  } catch (e) {
    console.error("[Wilder] Stripe webhook handler:", e);
    return res.status(500).json({ erreur: "webhook_handler_failed" });
  }

  return res.status(200).json({ received: true });
}
