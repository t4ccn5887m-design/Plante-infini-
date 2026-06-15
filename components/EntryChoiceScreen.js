import { useState } from "react";
import Link from "next/link";
import {
  ensureCloudAuth,
  signInWithEmail,
  signUpWithEmail,
  syncDiscoveriesToCloud,
} from "@/lib/cloudSync";
import { recordCguConsent } from "@/lib/userProfile";
import { LEGAL_ROUTES } from "@/lib/legal";
import { CguConsentCheckbox } from "@/components/LegalConsentCheckbox";

const SLIDE_DOT_COUNT = 4;

export default function EntryChoiceScreen({ t, onComplete, onDiscoverGuest }) {
  const [mode, setMode] = useState("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [legalAccepted, setLegalAccepted] = useState(false);

  const isSignup = mode === "signup";
  const canSubmitSignup = !isSignup || legalAccepted;

  const finishAuth = async () => {
    await syncDiscoveriesToCloud().catch(() => {});
    onComplete?.();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmitSignup) return;
    setLoading(true);
    setError("");

    const fn = isSignup ? signUpWithEmail : signInWithEmail;
    const result = await fn(email.trim(), password);
    if (!result.ok) {
      setLoading(false);
      setError(result.error || t("cloud.error"));
      return;
    }

    if (isSignup) {
      const consent = await recordCguConsent();
      if (!consent.ok) {
        setLoading(false);
        setError(t("legal.consent_save_error"));
        return;
      }
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

            {isSignup && (
              <CguConsentCheckbox
                checked={legalAccepted}
                onChange={setLegalAccepted}
                disabled={loading}
                className="entry-choice-consent"
              />
            )}

            {error && (
              <p className="entry-choice-error" role="alert">{error}</p>
            )}

            <button
              type="submit"
              className="entry-choice-btn-primary"
              disabled={loading || !canSubmitSignup}
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

        <nav className="entry-choice-legal" aria-label={t("entry_choice.legal_nav")}>
          <Link href={LEGAL_ROUTES.mentions}>{t("entry_choice.legal_mentions")}</Link>
          <span aria-hidden="true"> · </span>
          <Link href={LEGAL_ROUTES.cgu}>{t("entry_choice.legal_cgu")}</Link>
          <span aria-hidden="true"> · </span>
          <Link href={LEGAL_ROUTES.privacy}>{t("entry_choice.legal_privacy")}</Link>
        </nav>
      </div>
    </div>
  );
}
