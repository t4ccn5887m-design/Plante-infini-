import { useState } from "react";
import {
  completePremiumActivation,
  recordPaymentSuccess,
} from "@/lib/freemium";
import { activatePremiumOnServer } from "@/lib/scanQuotaClient";
import { recordCgvConsent } from "@/lib/userProfile";
import PremiumAuthStep from "@/components/PremiumAuthStep";
import { CgvConsentCheckbox } from "@/components/LegalConsentCheckbox";

export default function SubscriptionScreen({
  t,
  scanCount,
  onSubscribed,
  onClose,
  forced = false,
  initialStep = "plans",
}) {
  const [step, setStep] = useState(initialStep);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [cgvAccepted, setCgvAccepted] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const authRequired = step === "auth";

  const handleSelectPlan = async (plan) => {
    if (!cgvAccepted) return;
    setPaymentError("");
    const consent = await recordCgvConsent();
    if (!consent.ok) {
      setPaymentError(t("legal.consent_save_error"));
      return;
    }
    recordPaymentSuccess(plan);
    setSelectedPlan(plan);
    setStep("auth");
  };

  const handleAuthComplete = async () => {
    completePremiumActivation();
    await activatePremiumOnServer();
    onSubscribed?.(selectedPlan);
  };

  return (
    <div className="paywall-screen screen-enter">
      <div className="wilder-home-bg" aria-hidden="true" />
      <div className="wilder-home-aurora" aria-hidden="true" />
      <div className="wilder-home-overlay paywall-screen-overlay" aria-hidden="true" />

      <div className="paywall-content">
        {step === "plans" ? (
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
                disabled={!cgvAccepted}
              >
                <span className="paywall-plan-label">{t("freemium.yearly_cta")}</span>
              </button>

              <button
                type="button"
                className="paywall-plan paywall-plan--secondary"
                onClick={() => handleSelectPlan("monthly")}
                disabled={!cgvAccepted}
              >
                <span className="paywall-plan-label">{t("freemium.monthly_cta")}</span>
              </button>
            </div>

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
          <PremiumAuthStep t={t} onComplete={handleAuthComplete} />
        )}

        {authRequired && (
          <p className="paywall-auth-required">{t("freemium.auth_required")}</p>
        )}

        {forced && step === "plans" && (
          <p className="paywall-forced-hint">{t("freemium.forced_hint", { count: scanCount })}</p>
        )}
      </div>
    </div>
  );
}
