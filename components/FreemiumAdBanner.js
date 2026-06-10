export default function FreemiumAdBanner({ t, onUpgrade, blocked = false }) {
  return (
    <aside
      className={`freemium-ad-banner${blocked ? " freemium-ad-banner--blocked" : ""}`}
      role="complementary"
      aria-label={t("freemium.ad_label")}
    >
      <p className="freemium-ad-text">{t("freemium.ad_text")}</p>
      <button type="button" className="freemium-ad-btn" onClick={onUpgrade}>
        {t("freemium.ad_cta")}
      </button>
    </aside>
  );
}
