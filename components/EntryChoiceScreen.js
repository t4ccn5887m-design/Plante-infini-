import { useState } from "react";
import {
  completeAuthSession,
  ensureCloudAuth,
  signInWithEmail,
  signUpWithEmail,
} from "@/lib/cloudSync";

const SLIDE_DOT_COUNT = 4;

export default function EntryChoiceScreen({ t, onComplete, onDiscoverGuest }) {
  const [mode, setMode] = useState("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  const isSignup = mode === "signup";

  const finishAuth = async () => {
    await completeAuthSession().catch(() => {});
    onComplete?.();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const fn = isSignup ? signUpWithEmail : signInWithEmail;
    const result = isSignup
      ? await fn(email.trim(), password)
      : await fn(email.trim(), password, { rememberMe });
    if (!result.ok) {
      setLoading(false);
      setError(result.error || t("cloud.error"));
      return;
    }

    setLoading(false);
    await finishAuth();
  };

  const handleDiscoverGuest = async () => {
    if (loading) return;
    setLoading(true);
    setError("");
    const auth = await ensureCloudAuth();
    setLoading(false);
    if (!auth.ok) {
      setError(auth.error || t("cloud.error"));
      return;
    }
    onDiscoverGuest?.();
  };

  return (
    <div className="entry-choice-screen screen-enter">
      <div className="entry-choice-scroll">
        <div
          className="entry-choice-dots"
          role="tablist"
          aria-label={t("entry_choice.progress")}
        >
          {Array.from({ length: SLIDE_DOT_COUNT }, (_, i) => (
            <span
              key={i}
              className={`entry-choice-dot${i === SLIDE_DOT_COUNT - 1 ? " entry-choice-dot--active" : ""}`}
              role="presentation"
            />
          ))}
        </div>

        <div className="entry-choice-hero">
          <div className="entry-choice-icon" aria-hidden="true">🌿</div>
          <h1 className="entry-choice-title">{t("entry_choice.title")}</h1>
          <span className="entry-choice-badge">{t("entry_choice.badge")}</span>
          <p className="entry-choice-subtitle">{t("entry_choice.subtitle")}</p>
        </div>

        <div className="entry-choice-panel">
          <div className="entry-choice-seg" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={isSignup}
              className={`entry-choice-seg-btn${isSignup ? " entry-choice-seg-btn--active" : ""}`}
              onClick={() => setMode("signup")}
              disabled={loading}
            >
              {t("entry_choice.tab_signup")}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={!isSignup}
              className={`entry-choice-seg-btn${!isSignup ? " entry-choice-seg-btn--active" : ""}`}
              onClick={() => setMode("signin")}
              disabled={loading}
            >
              {t("entry_choice.tab_signin")}
            </button>
          </div>

          <form className="entry-choice-form" onSubmit={handleSubmit}>
            <input
              type="email"
              className="entry-choice-field"
              placeholder={t("cloud.email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              disabled={loading}
            />
            <input
              type="password"
              className="entry-choice-field"
              placeholder={t("cloud.password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isSignup ? "new-password" : "current-password"}
              required
              minLength={6}
              disabled={loading}
            />

            {!isSignup && (
              <label className="auth-remember entry-choice-remember">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                />
                {t("auth.remember_me")}
              </label>
            )}

            {error && (
              <p className="entry-choice-error" role="alert">{error}</p>
            )}

            <button
              type="submit"
              className="entry-choice-btn-primary"
              disabled={loading}
            >
              {loading
                ? t("entry_choice.loading")
                : isSignup
                  ? t("entry_choice.cta_signup")
                  : t("entry_choice.cta_signin")}
            </button>
          </form>

          <div className="entry-choice-or">
            <span>{t("entry_choice.or")}</span>
          </div>

          <button
            type="button"
            className="entry-choice-btn-guest"
            onClick={handleDiscoverGuest}
            disabled={loading}
          >
            {t("entry_choice.discover_guest")}
          </button>
          <p className="entry-choice-guest-note">{t("entry_choice.guest_note")}</p>
        </div>
      </div>
    </div>
  );
}
