import { activatePremium } from "@/lib/freemium";
import Logo from "@/components/Logo";

export default function SubscriptionScreen({ t, scanCount, onSubscribed, onClose }) {
  const handleSubscribe = (plan) => {
    activatePremium(plan);
    onSubscribed?.(plan);
  };

  return (
    <div className="subscription-screen screen-enter">
      <div className="subscription-content">
        <Logo size={52} />
        <h1 className="subscription-title">{t("freemium.title")}</h1>
        <p className="subscription-subtitle">
          {t("freemium.subtitle", { count: scanCount })}
        </p>

        <ul className="subscription-benefits">
          <li>{t("freemium.benefit_scans")}</li>
          <li>{t("freemium.benefit_cloud")}</li>
          <li>{t("freemium.benefit_no_ads")}</li>
        </ul>

        <div className="subscription-plans">
          <button
            type="button"
            className="subscription-plan subscription-plan--yearly"
            onClick={() => handleSubscribe("yearly")}
          >
            <span className="subscription-plan-badge">{t("freemium.yearly_badge")}</span>
            <span className="subscription-plan-price">{t("freemium.yearly_price")}</span>
            <span className="subscription-plan-period">{t("freemium.yearly_period")}</span>
          </button>

          <button
            type="button"
            className="subscription-plan subscription-plan--monthly"
            onClick={() => handleSubscribe("monthly")}
          >
            <span className="subscription-plan-price">{t("freemium.monthly_price")}</span>
            <span className="subscription-plan-period">{t("freemium.monthly_period")}</span>
          </button>
        </div>

        <p className="subscription-note">{t("freemium.payment_note")}</p>

        {onClose && (
          <button type="button" className="subscription-close" onClick={onClose}>
            {t("freemium.later")}
          </button>
        )}
      </div>
    </div>
  );
}
