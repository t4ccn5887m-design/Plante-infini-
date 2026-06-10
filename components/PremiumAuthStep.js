import { useState } from "react";
import {
  signInWithEmail,
  signInWithOAuth,
  signUpWithEmail,
  syncDiscoveriesToCloud,
} from "@/lib/cloudSync";

export default function PremiumAuthStep({ t, onComplete }) {
  const [mode, setMode] = useState("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const finish = async () => {
    await syncDiscoveriesToCloud().catch(() => {});
    onComplete?.();
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError("");
    const result = await signInWithOAuth("google");
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
    setLoading(true);
    setError("");
    const fn = mode === "signup" ? signUpWithEmail : signInWithEmail;
    const result = await fn(email.trim(), password);
    setLoading(false);
    if (!result.ok) {
      setError(result.error || t("cloud.error"));
      return;
    }
    await finish();
  };

  return (
    <div className="premium-auth-step">
      <h2 className="premium-auth-title">{t("freemium.auth_title")}</h2>
      <p className="premium-auth-subtitle">{t("freemium.auth_subtitle")}</p>

      <button
        type="button"
        className="premium-auth-google"
        onClick={handleGoogle}
        disabled={loading}
      >
        {t("auth.google")}
      </button>

      <div className="premium-auth-divider">
        <span>{t("freemium.auth_or")}</span>
      </div>

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
        <button type="submit" className="premium-auth-submit" disabled={loading}>
          {loading ? t("freemium.auth_loading") : t("freemium.auth_continue")}
        </button>
      </form>

      {error && (
        <p className="premium-auth-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
