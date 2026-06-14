export default function SignupPromptBanner({ t, onCreateAccount }) {
  return (
    <aside className="signup-prompt-banner" aria-label={t("signup_prompt.banner_cta")}>
      <p className="signup-prompt-banner-text">{t("signup_prompt.banner_text")}</p>
      <button type="button" className="signup-prompt-banner-btn" onClick={onCreateAccount}>
        {t("signup_prompt.banner_cta")}
      </button>
    </aside>
  );
}
