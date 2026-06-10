import { useState } from "react";
import {
  completePremiumActivation,
  recordPaymentSuccess,
} from "@/lib/freemium";
import PremiumAuthStep from "@/components/PremiumAuthStep";

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
  const authRequired = step === "auth";

  const handleSelectPlan = (plan) => {
    recordPaymentSuccess(plan);
    setSelectedPlan(plan);
    setStep("auth");
  };

  const handleAuthComplete = () => {
    completePremiumActivation();
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

            <div className="paywall-plans">
              <button
                type="button"
                className="paywall-plan paywall-plan--primary"
                onClick={() => handleSelectPlan("monthly")}
              >
                <span className="paywall-plan-label">{t("freemium.monthly_cta")}</span>
              </button>

              <button
                type="button"
                className="paywall-plan paywall-plan--secondary"
                onClick={() => handleSelectPlan("yearly")}
              >
                <span className="paywall-plan-label">{t("freemium.yearly_cta")}</span>
              </button>
            </div>

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
