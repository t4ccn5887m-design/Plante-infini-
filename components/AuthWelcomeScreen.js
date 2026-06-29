import { useState } from "react";
import Logo from "@/components/Logo";
import {
  continueAnonymously,
  isCloudAvailable,
  signInWithEmail,
  signUpWithEmail,
} from "@/lib/cloudSync";
import { loadRememberMe, saveRememberMe } from "@/lib/authWelcome";

export default function AuthWelcomeScreen({ t, slogan, onComplete }) {
  const [mode, setMode] = useState("signup");
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
    onComplete(result);
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
    <div className="auth-welcome auth-welcome--cream screen-enter">
      <div className="auth-welcome-content">
        <Logo size={64} />
        <h1 className="auth-welcome-title">{t("auth.title")}</h1>
        <p className="auth-welcome-slogan">{slogan}</p>

        {!cloudOk && (
          <p className="auth-welcome-offline" role="status">
            {t("auth.offline_hint")}
          </p>
        )}

        <div className="auth-welcome-form">
          <div className="auth-welcome-tabs">
            <button
              type="button"
              className={`auth-tab${mode === "signup" ? " auth-tab--active" : ""}`}
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
              className={`auth-tab${mode === "signin" ? " auth-tab--active" : ""}`}
              onClick={() => {
                setMode("signin");
                setError("");
              }}
              disabled={loading}
            >
              {t("auth.sign_in")}
            </button>
          </div>

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

        {error && (
          <p className="auth-welcome-error" role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          className="auth-discovery-link"
          onClick={handleAnonymous}
          disabled={loading}
        >
          <span className="auth-discovery-title">{t("auth.discovery_mode")}</span>
          <span className="auth-discovery-hint">{t("auth.discovery_hint")}</span>
        </button>
      </div>
    </div>
  );
}
