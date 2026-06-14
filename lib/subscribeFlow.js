export const PENDING_CHECKOUT_PLAN_KEY = "wilder-pending-checkout-plan";

export function savePendingCheckoutPlan(plan) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(PENDING_CHECKOUT_PLAN_KEY, plan === "yearly" ? "yearly" : "monthly");
  } catch {
    /* ignore */
  }
}

export function consumePendingCheckoutPlan() {
  if (typeof window === "undefined") return null;
  try {
    const plan = sessionStorage.getItem(PENDING_CHECKOUT_PLAN_KEY);
    sessionStorage.removeItem(PENDING_CHECKOUT_PLAN_KEY);
    return plan === "yearly" || plan === "monthly" ? plan : null;
  } catch {
    return null;
  }
}

export function getPendingCheckoutPlan() {
  if (typeof window === "undefined") return null;
  try {
    const plan = sessionStorage.getItem(PENDING_CHECKOUT_PLAN_KEY);
    return plan === "yearly" || plan === "monthly" ? plan : null;
  } catch {
    return null;
  }
}
