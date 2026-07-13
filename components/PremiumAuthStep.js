import { useEffect, useState } from "react";
import {
  completeAuthSession,
  resetPasswordForEmail,
  signInWithEmail,
  signUpWithEmail,
} from "@/lib/cloudSync";

export default function PremiumAuthStep({
  t,
  onComplete,
  titleKey = "signup_prompt.auth_title",
  subtitleKey = "signup_prompt.auth_subtitle",
  initialMode = "signup",
  variant = "default",
}) {
  const isWilder = variant === "wilder";
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (mode !== "signin") {
      setResetSuccess(false);
    }
  }, [mode]);

  const finish = async () => {
    await completeAuthSession().catch(() => {});
    onComplete?.();
  };

  const handleEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
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
  const submitLabel = mode === "signup" ? t("cloud.sign_up") : t("cloud.sign_in");

  return (
    <div className={`premium-auth-step${isWilder ? " wilder-auth-step" : ""}`}>
      <h2 className="premium-auth-title">{t(displayTitleKey)}</h2>
      <p className="premium-auth-subtitle">{t(displaySubtitleKey)}</p>

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
        <button
          type="submit"
          className={isWilder ? "wilder-account-btn-primary" : "premium-auth-submit"}
          disabled={loading}
        >
          {loading ? t("auth.loading") : submitLabel}
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
