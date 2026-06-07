import { useState } from "react";
import WilderLogo from "@/components/WilderLogo";
import {
  continueAnonymously,
  isCloudAvailable,
  signInWithEmail,
  signInWithOAuth,
  signUpWithEmail,
} from "@/lib/cloudSync";
import { loadRememberMe, saveRememberMe } from "@/lib/authWelcome";

function IconGoogle() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function IconApple() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white" aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

export default function AuthWelcomeScreen({ t, slogan, onComplete }) {
  const [mode, setMode] = useState("main");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(() => loadRememberMe());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const cloudOk = isCloudAvailable();

  const finish = async (result) => {
    saveRememberMe(rememberMe);
    if (!result?.ok) {
      setError(result?.error || t("auth.error"));
      setLoading(false);
      return;
    }
    if (result.redirecting) return;
    onComplete(result);
  };

  const handleOAuth = async (provider) => {
    if (!cloudOk) {
      setError(t("auth.unavailable"));
      return;
    }
    setLoading(true);
    setError("");
    saveRememberMe(rememberMe);
    const result = await signInWithOAuth(provider);
    if (!result.ok) {
      setError(result.error || t("auth.error"));
      setLoading(false);
      return;
    }
    if (!result.redirecting) {
      await finish(result);
    }
  };

  const handleEmailAuth = async () => {
    if (!cloudOk) {
      setError(t("auth.unavailable"));
      return;
    }
    if (!email.trim() || !password) {
      setError(t("auth.fill_fields"));
      return;
    }
    setLoading(true);
    setError("");
    const fn = mode === "signup" ? signUpWithEmail : signInWithEmail;
    await finish(await fn(email.trim(), password));
  };

  const handleAnonymous = async () => {
    setLoading(true);
    setError("");
    if (cloudOk) {
      await finish(await continueAnonymously());
    } else {
      saveRememberMe(rememberMe);
      onComplete({ ok: true, offline: true });
    }
  };

  return (
    <div className="auth-welcome screen-enter">
      <div className="auth-welcome-bg" aria-hidden="true" />
      <div className="auth-welcome-aurora" aria-hidden="true" />
      <div className="auth-welcome-overlay" aria-hidden="true" />

      <div className="auth-welcome-content">
        <WilderLogo size={64} />
        <h1 className="auth-welcome-title">{t("auth.title")}</h1>
        <p className="auth-welcome-slogan">{slogan}</p>

        {!cloudOk && (
          <p className="auth-welcome-offline" role="status">
            {t("auth.offline_hint")}
          </p>
        )}

        {mode === "main" ? (
          <div className="auth-welcome-stack">
            <button
              type="button"
              className="auth-oauth-btn auth-oauth-btn--google"
              onClick={() => handleOAuth("google")}
              disabled={loading || !cloudOk}
            >
              <IconGoogle />
              {t("auth.google")}
            </button>

            <button
              type="button"
              className="auth-oauth-btn auth-oauth-btn--apple"
              onClick={() => handleOAuth("apple")}
              disabled={loading || !cloudOk}
            >
              <IconApple />
              {t("auth.apple")}
            </button>

            <button
              type="button"
              className="auth-secondary-btn"
              onClick={() => {
                setMode("signup");
                setError("");
              }}
              disabled={loading}
            >
              {t("auth.create_account")}
            </button>

            <button
              type="button"
              className="auth-secondary-btn auth-secondary-btn--outline"
              onClick={() => {
                setMode("signin");
                setError("");
              }}
              disabled={loading}
            >
              {t("auth.sign_in")}
            </button>

            <label className="auth-remember">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>{t("auth.remember_me")}</span>
            </label>
          </div>
        ) : (
          <div className="auth-welcome-form">
            <button
              type="button"
              className="auth-back-link"
              onClick={() => {
                setMode("main");
                setError("");
              }}
            >
              ← {t("auth.back")}
            </button>

            <h2 className="auth-form-title">
              {mode === "signup" ? t("auth.create_account") : t("auth.sign_in")}
            </h2>

            <input
              className="auth-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("cloud.email")}
              autoComplete="email"
              disabled={loading}
            />
            <input
              className="auth-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("cloud.password")}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              disabled={loading}
            />

            <label className="auth-remember">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>{t("auth.remember_me")}</span>
            </label>

            <button
              type="button"
              className="btn-primary auth-submit-btn"
              onClick={handleEmailAuth}
              disabled={loading || !cloudOk}
            >
              {loading
                ? t("auth.loading")
                : mode === "signup"
                  ? t("auth.create_account")
                  : t("auth.sign_in")}
            </button>
          </div>
        )}

        {error && (
          <p className="auth-welcome-error" role="alert">
            {error}
          </p>
        )}

        {mode === "main" && (
          <button
            type="button"
            className="auth-skip-link"
            onClick={handleAnonymous}
            disabled={loading}
          >
            {t("auth.continue_anonymous")}
          </button>
        )}
      </div>
    </div>
  );
}
