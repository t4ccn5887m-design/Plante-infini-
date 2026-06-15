import { useEffect, useState } from "react";
import { ensureCloudAuth, getCloudSession } from "@/lib/cloudSync";
import { isPermanentAuthUser } from "@/lib/authUser";
import { checkoutWithCgv } from "@/lib/subscribeCheckout";
import PremiumAuthStep from "@/components/PremiumAuthStep";
import { CgvConsentCheckbox } from "@/components/LegalConsentCheckbox";

function checkoutErrorMessage(t, result) {
  if (result?.message) return result.message;
  if (result?.detail) return String(result.detail);

  const error = result?.error;
  if (error === "auth_required") return t("freemium.auth_required");
  if (error === "cgv_consent_failed") return t("legal.consent_save_error");
  if (error === "stripe_unavailable" || error === "stripe_price_missing") {
    return t("freemium.stripe_unavailable");
  }
  return t("freemium.checkout_error");
}

export default function SubscriptionScreen({
  t,
  scanCount,
  onClose,
  forced = false,
  initialStep = "checkout",
  defaultPlan = "yearly",
  resumeCheckoutPlan = null,
}) {
  const [step, setStep] = useState(initialStep);
  const [selectedPlan, setSelectedPlan] = useState(defaultPlan);
  const [cgvAccepted, setCgvAccepted] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const authRequired = step === "auth";

  useEffect(() => {
    setStep(initialStep);
    setSelectedPlan(defaultPlan);
    setPaymentError("");
  }, [initialStep, defaultPlan]);

  const redirectToStripe = async (plan) => {
    setCheckoutLoading(true);
    setPaymentError("");
    const result = await checkoutWithCgv(plan);
    if (result.ok && result.redirecting) return;
    setCheckoutLoading(false);
    console.error("[Wilder] redirectToStripe failed:", result);
    if (result.needsAuth) {
      setSelectedPlan(plan);
      setStep("auth");
      return;
    }
    setPaymentError(checkoutErrorMessage(t, result));
  };

  const handleSelectPlan = async (plan) => {
    if (!cgvAccepted || checkoutLoading) return;
    setSelectedPlan(plan);
    await redirectToStripe(plan);
  };

  const handleAuthComplete = async () => {
    const plan = selectedPlan || defaultPlan || "yearly";
    await redirectToStripe(plan);
  };

  useEffect(() => {
    if (!resumeCheckoutPlan || checkoutLoading) return;
    let cancelled = false;

    (async () => {
      await ensureCloudAuth();
      const session = await getCloudSession();
      if (cancelled) return;
      if (!isPermanentAuthUser(session?.user)) {
        setStep("auth");
        return;
      }
      setSelectedPlan(resumeCheckoutPlan);
      setStep("checkout");
      await redirectToStripe(resumeCheckoutPlan);
    })();

    return () => {
      cancelled = true;
    };
  }, [resumeCheckoutPlan]);

  const showCheckout = step === "checkout";

  return (
    <div className="paywall-screen screen-enter">
      <div className="wilder-home-bg" aria-hidden="true" />
      <div className="wilder-home-aurora" aria-hidden="true" />
      <div className="wilder-home-overlay paywall-screen-overlay" aria-hidden="true" />

      <div className="paywall-content">
        {showCheckout ? (
          <>
            <h1 className="paywall-title">{t("freemium.title")}</h1>
            <p className="paywall-subtitle">{t("freemium.subtitle")}</p>

            <ul className="paywall-benefits">
              <li>{t("freemium.benefit_scans")}</li>
              <li>{t("freemium.benefit_cloud")}</li>
              <li>{t("freemium.benefit_no_ads")}</li>
            </ul>

            <CgvConsentCheckbox
              checked={cgvAccepted}
              onChange={setCgvAccepted}
              className="paywall-consent"
            />

            <div className="paywall-plans">
              <button
                type="button"
                className="paywall-plan paywall-plan--primary"
                onClick={() => handleSelectPlan("yearly")}
                disabled={!cgvAccepted || checkoutLoading}
              >
                <span className="paywall-plan-label">{t("freemium.yearly_cta")}</span>
              </button>

              <button
                type="button"
                className="paywall-plan paywall-plan--secondary"
                onClick={() => handleSelectPlan("monthly")}
                disabled={!cgvAccepted || checkoutLoading}
              >
                <span className="paywall-plan-label">{t("freemium.monthly_cta")}</span>
              </button>
            </div>

            {checkoutLoading && (
              <p className="paywall-note">{t("freemium.checkout_loading")}</p>
            )}

            {paymentError && (
              <p className="paywall-consent-error" role="alert">{paymentError}</p>
            )}

            <p className="paywall-note">{t("freemium.payment_note")}</p>

            {onClose && (
              <button type="button" className="paywall-later" onClick={onClose}>
                {t("freemium.later")}
              </button>
            )}
          </>
        ) : (
          <PremiumAuthStep
            t={t}
            onComplete={handleAuthComplete}
            convertAnonymousOnly
            pendingCheckoutPlan={selectedPlan || defaultPlan}
          />
        )}

        {authRequired && (
          <p className="paywall-auth-required">{t("freemium.auth_required")}</p>
        )}

        {forced && showCheckout && (
          <p className="paywall-forced-hint">{t("freemium.forced_hint", { count: scanCount })}</p>
        )}
      </div>
    </div>
  );
}
