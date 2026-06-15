import { useEffect, useState } from "react";
import {
  completeAuthSession,
  resetPasswordForEmail,
  signInWithEmail,
  signInWithOAuth,
  signUpWithEmail,
} from "@/lib/cloudSync";
import { recordCguConsent } from "@/lib/userProfile";
import { CguConsentCheckbox } from "@/components/LegalConsentCheckbox";

export default function PremiumAuthStep({
  t,
  onComplete,
  titleKey = "freemium.auth_title",
  subtitleKey = "freemium.auth_subtitle",
  initialMode = "signup",
  convertAnonymousOnly = false,
  pendingCheckoutPlan = null,
}) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const needsLegalConsent = mode === "signup";
  const canProceedSignup = !needsLegalConsent || legalAccepted;

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (mode !== "signin") {
      setResetSuccess(false);
    }
  }, [mode]);

  useEffect(() => {
    if (mode !== "signup") {
      setLegalAccepted(false);
    }
  }, [mode]);

  const finish = async () => {
    await completeAuthSession().catch(() => {});
    onComplete?.();
  };

  const handleGoogle = async () => {
    if (!canProceedSignup) return;
    setLoading(true);
    setError("");
    if (needsLegalConsent) {
      const consent = await recordCguConsent();
      if (!consent.ok) {
        setLoading(false);
        setError(t("legal.consent_save_error"));
        return;
      }
    }
    const result = await signInWithOAuth("google", {
      pendingCheckoutPlan: pendingCheckoutPlan || undefined,
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.error || t("cloud.error"));
      return;
    }
    if (result.redirecting) return;
    await finish();
  };

  const handleEmail = async (e) => {
    e.preventDefault();
    if (!canProceedSignup) return;
    setLoading(true);
    setError("");
    if (convertAnonymousOnly && mode === "signin") {
      setLoading(false);
      setError(t("freemium.auth_convert_only"));
      return;
    }
    const fn = mode === "signup" ? signUpWithEmail : signInWithEmail;
    const result =
      mode === "signup"
        ? await fn(email.trim(), password)
        : await fn(email.trim(), password, { rememberMe });
    setLoading(false);
    if (!result.ok) {
      setError(result.error || t("cloud.error"));
      return;
    }
    if (needsLegalConsent) {
      const consent = await recordCguConsent();
      if (!consent.ok) {
        setError(t("legal.consent_save_error"));
        return;
      }
    }
    await finish();
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetSuccess(false);
    const trimmed = email.trim();
    if (!trimmed) {
      setError(t("cloud.reset_password_email_required"));
      return;
    }
    setLoading(true);
    setError("");
    const result = await resetPasswordForEmail(trimmed);
    setLoading(false);
    if (!result.ok) {
      setError(result.error || t("cloud.error"));
      return;
    }
    setResetSuccess(true);
  };

  const displayTitleKey =
    mode === "signin"
      ? "account_menu.sign_in_title"
      : titleKey === "account_menu.sign_in_title"
        ? "signup_prompt.auth_title"
        : titleKey;
  const displaySubtitleKey =
    mode === "signin"
      ? "account_menu.sign_in_subtitle"
      : subtitleKey === "account_menu.sign_in_subtitle"
        ? "signup_prompt.auth_subtitle"
        : subtitleKey;
  const submitLabel =
    mode === "signup" ? t("freemium.auth_continue") : t("cloud.sign_in");

  return (
    <div className="premium-auth-step">
      <h2 className="premium-auth-title">{t(displayTitleKey)}</h2>
      <p className="premium-auth-subtitle">{t(displaySubtitleKey)}</p>

      <button
        type="button"
        className="premium-auth-google"
        onClick={handleGoogle}
        disabled={loading || !canProceedSignup}
      >
        {t("auth.google")}
      </button>

      <div className="premium-auth-divider">
        <span>{t("freemium.auth_or")}</span>
      </div>

      {!convertAnonymousOnly && (
        <div className="premium-auth-tabs">
          <button
            type="button"
            className={`premium-auth-tab${mode === "signup" ? " active" : ""}`}
            onClick={() => setMode("signup")}
            disabled={loading}
          >
            {t("cloud.sign_up")}
          </button>
          <button
            type="button"
            className={`premium-auth-tab${mode === "signin" ? " active" : ""}`}
            onClick={() => setMode("signin")}
            disabled={loading}
          >
            {t("cloud.sign_in")}
          </button>
        </div>
      )}

      <form className="premium-auth-form" onSubmit={handleEmail}>
        <input
          type="email"
          className="premium-auth-input"
          placeholder={t("cloud.email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
          disabled={loading}
        />
        <input
          type="password"
          className="premium-auth-input"
          placeholder={t("cloud.password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          required
          minLength={6}
          disabled={loading}
        />
        {mode === "signin" && (
          <button
            type="button"
            className="premium-auth-forgot-link"
            onClick={handleForgotPassword}
            disabled={loading}
          >
            {t("cloud.forgot_password")}
          </button>
        )}
        {mode === "signin" && (
          <label className="auth-remember premium-auth-remember">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={loading}
            />
            {t("auth.remember_me")}
          </label>
        )}
        {needsLegalConsent && (
          <CguConsentCheckbox
            checked={legalAccepted}
            onChange={setLegalAccepted}
            disabled={loading}
            className="premium-auth-consent"
          />
        )}
        <button
          type="submit"
          className="premium-auth-submit"
          disabled={loading || !canProceedSignup}
        >
          {loading ? t("freemium.auth_loading") : submitLabel}
        </button>
      </form>

      {resetSuccess && (
        <p className="premium-auth-success" role="status">
          {t("cloud.reset_password_sent")}
        </p>
      )}

      {error && (
        <p className="premium-auth-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
