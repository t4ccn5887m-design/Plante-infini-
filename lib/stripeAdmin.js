const STRIPE_API_VERSION = "2024-06-20";

function emptyStripeMetrics() {
  return {
    available: false,
    activeTotal: 0,
    monthly: 0,
    yearly: 0,
    mrr: 0,
    totalRevenue: 0,
    currency: "eur",
  };
}

async function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  const Stripe = (await import("stripe")).default;
  return new Stripe(key, { apiVersion: STRIPE_API_VERSION });
}

async function paginate(listFn, onPage) {
  let startingAfter;
  let hasMore = true;

  while (hasMore) {
    const page = await listFn(startingAfter);
    onPage(page.data || []);
    hasMore = Boolean(page.has_more);
    startingAfter = page.data?.[page.data.length - 1]?.id;
    if (!startingAfter) break;
  }
}

export async function fetchStripeMetrics() {
  const stripe = await getStripeClient();
  if (!stripe) return emptyStripeMetrics();

  try {
    let monthly = 0;
    let yearly = 0;
    let mrr = 0;
    let currency = "eur";

    await paginate(
      (startingAfter) =>
        stripe.subscriptions.list({
          status: "active",
          limit: 100,
          starting_after: startingAfter,
          expand: ["data.items.data.price"],
        }),
      (subs) => {
        for (const sub of subs) {
          const item = sub.items?.data?.[0];
          const price = item?.price;
          if (!price?.recurring) continue;

          const amount = (price.unit_amount || 0) / 100;
          if (price.currency) currency = price.currency;

          if (price.recurring.interval === "month") {
            monthly += 1;
            mrr += amount;
          } else if (price.recurring.interval === "year") {
            yearly += 1;
            mrr += amount / 12;
          }
        }
      }
    );

    let totalRevenue = 0;

    await paginate(
      (startingAfter) =>
        stripe.balanceTransactions.list({
          limit: 100,
          starting_after: startingAfter,
        }),
      (txs) => {
        for (const tx of txs) {
          if (tx.type === "charge" || tx.type === "payment") {
            totalRevenue += tx.amount / 100;
          }
        }
      }
    );

    return {
      available: true,
      activeTotal: monthly + yearly,
      monthly,
      yearly,
      mrr: Math.round(mrr * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      currency,
    };
  } catch (e) {
    console.error("[Wilder] Stripe admin metrics:", e.message);
    return { ...emptyStripeMetrics(), available: false, error: e.message };
  }
}
